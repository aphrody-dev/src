//! `gclient getdep` / `gclient setdep`: read and rewrite revisions and variables in a DEPS file
//! without reformatting it (port of `GetVar`, `GetRevision`, `GetCIPD`, `SetVar`, `AddVar`,
//! `SetRevision` and `SetCIPD` from `gclient_eval.py`).
//!
//! Edits replace the byte range of a single string literal, keeping its quote character, so
//! the rest of the file stays byte-identical.

use crate::eval::{self, Source};
use crate::value::{Dict, Value};
use crate::{Error, Result};
use ruff_python_ast::{Expr, Operator, Stmt};
use ruff_text_size::{Ranged, TextRange};
use std::path::Path;

/// `GetVar`.
pub fn get_var(
    content: &str,
    filename: &str,
    name: &str,
    builtin: Option<&Dict>,
) -> Result<String> {
    let scope = eval::exec(content, filename, None, builtin)?;
    let vars = scope
        .get("vars")
        .and_then(Value::as_dict)
        .ok_or_else(|| Error::new("vars dict is not defined."))?;
    let v = vars
        .get(name)
        .ok_or_else(|| Error::new(format!("Could not find any variable called {name}.")))?;
    Ok(v.to_py_str())
}

/// `GetRevision` for `path` or `GetCIPD` for `path:package`. `Ok(None)` is an unpinned dep.
pub fn get_revision(
    content: &str,
    filename: &str,
    dep: &str,
    builtin: Option<&Dict>,
) -> Result<Option<String>> {
    let scope = eval::exec(content, filename, None, builtin)?;
    let deps = scope
        .get("deps")
        .and_then(Value::as_dict)
        .ok_or_else(|| Error::new("no deps dict"))?;
    if let Some((path, package)) = dep.split_once(':') {
        let entry = deps
            .get(path)
            .and_then(Value::as_dict)
            .ok_or_else(|| missing(deps, path))?;
        let pkgs: Vec<&Dict> = entry
            .get("packages")
            .and_then(Value::as_seq)
            .unwrap_or_default()
            .iter()
            .filter_map(Value::as_dict)
            .filter(|p| p.get_str("package") == Some(package))
            .collect();
        if pkgs.len() != 1 {
            return Err(Error::new(format!(
                "There must be exactly one package with the given name ({package}), {} were found.",
                pkgs.len()
            )));
        }
        return Ok(pkgs[0].get_str("version").map(str::to_string));
    }
    let entry = deps.get(dep).ok_or_else(|| missing(deps, dep))?;
    let url = match entry {
        Value::None => return Ok(None),
        Value::Dict(d) if d.contains_key("objects") => {
            return Ok(Some(
                d.get("objects").map(Value::to_string).unwrap_or_default(),
            ));
        }
        Value::Dict(d) => d.get_str("url").unwrap_or_default().to_string(),
        other => other.as_str().unwrap_or_default().to_string(),
    };
    Ok(url
        .split_once('@')
        .map(|(_, r)| r.to_string())
        .filter(|r| !r.is_empty()))
}

fn missing(deps: &Dict, name: &str) -> Error {
    let suggestions: Vec<&str> = deps
        .keys()
        .filter(|k| k.contains(name))
        .map(String::as_str)
        .collect();
    if suggestions.is_empty() {
        Error::new(format!("Could not find any dependency called {name}."))
    } else {
        Error::new(format!(
            "Could not find any dependency called {name}. Did you mean {}",
            suggestions.join(" or ")
        ))
    }
}

/// A DEPS file being edited.
pub struct DepsEditor {
    content: String,
    filename: String,
    builtin: Dict,
}

impl DepsEditor {
    pub fn new(
        content: impl Into<String>,
        filename: impl Into<String>,
        builtin: Option<&Dict>,
    ) -> Self {
        Self {
            content: content.into(),
            filename: filename.into(),
            builtin: builtin.cloned().unwrap_or_default(),
        }
    }

    pub fn content(&self) -> &str {
        &self.content
    }

    pub fn into_content(self) -> String {
        self.content
    }

    /// The vars dict evaluated without expansion, plus built-ins: what keys expand against.
    fn key_vars(&self, module: &ruff_python_ast::ModModule, src: &Source<'_>) -> Result<Dict> {
        let mut vars = Dict::new();
        if let Some(node) = top_level(module, "vars")
            && let Value::Dict(d) = eval::eval_expr(src, node, None)?
        {
            vars.update(&d);
        }
        vars.update(&self.builtin);
        Ok(vars)
    }

    fn replace(&mut self, range: TextRange, text: &str) {
        let (s, e) = (usize::from(range.start()), usize::from(range.end()));
        self.content.replace_range(s..e, text);
    }

    /// `SetVar`, or `AddVar` when the variable is not declared yet.
    pub fn set_var(&mut self, name: &str, value: &str) -> Result<()> {
        let content = self.content.clone();
        let src = Source {
            text: &content,
            filename: &self.filename,
        };
        let module = eval::parse_module(&src)?;
        let Some(Expr::Dict(vars)) = top_level(&module, "vars") else {
            return Err(Error::new("vars dict is not defined."));
        };
        for item in &vars.items {
            if let Some(Expr::StringLiteral(k)) = &item.key
                && k.value.to_str() == name
            {
                let lit = match &item.value {
                    Expr::Call(c) if c.arguments.args.len() == 1 => &c.arguments.args[0],
                    other => other,
                };
                let range = single_literal(&src, lit)?;
                let new = quoted(&content, range, value);
                self.replace(range, &new);
                return Ok(());
            }
        }
        // AddVar: a new first entry on the line after `vars = {`, indented like the first key.
        let first = vars
            .items
            .first()
            .and_then(|i| i.key.as_ref())
            .ok_or_else(|| Error::new("vars dict is empty. This is not yet supported."))?;
        let key_start = usize::from(first.start());
        let key_line = content[..key_start].rfind('\n').map(|i| i + 1).unwrap_or(0);
        let indent = " ".repeat(content[key_line..key_start].chars().count());
        let brace = usize::from(vars.start());
        let insert_at = content[brace..]
            .find('\n')
            .map(|i| brace + i + 1)
            .unwrap_or(content.len());
        let insert = format!("{indent}\"{name}\": \"{}\",\n", escape(value));
        self.content.insert_str(insert_at, &insert);
        Ok(())
    }

    /// `SetRevision` for a git dependency.
    pub fn set_revision(&mut self, dep: &str, revision: &str) -> Result<()> {
        let content = self.content.clone();
        let src = Source {
            text: &content,
            filename: &self.filename,
        };
        let module = eval::parse_module(&src)?;
        let key_vars = self.key_vars(&module, &src)?;
        let deps = self.find_dep(&module, &src, &key_vars, dep)?;
        let mut node = match deps {
            Expr::Dict(d) => dict_item(&src, d, "url", &key_vars)?
                .ok_or_else(|| Error::new(format!("{dep} has no url")))?,
            other => other,
        };
        let full = eval::exec(&content, &self.filename, None, Some(&self.builtin))?;
        let full_url = full
            .get("deps")
            .and_then(Value::as_dict)
            .and_then(|d| d.get(dep))
            .and_then(|v| match v {
                Value::Dict(d) => d.get_str("url").map(str::to_string),
                other => other.as_str().map(str::to_string),
            })
            .unwrap_or_default();
        if let Expr::BinOp(b) = node {
            node = &b.right;
        }
        match var_name(node) {
            Some(var) => self.set_var(&var, revision),
            None => {
                let Expr::StringLiteral(s) = node else {
                    return Err(Error::new("Unsupported dependency revision format."));
                };
                let range = single_literal(&src, node)?;
                let value = s.value.to_str();
                let new_value = if let Some((head, _)) = value.split_once('@') {
                    format!("{head}@{revision}")
                } else if !full_url.contains('@') {
                    format!("{value}@{revision}")
                } else {
                    revision.to_string()
                };
                let new = quoted(&content, range, &new_value);
                self.replace(range, &new);
                Ok(())
            }
        }
    }

    /// `SetCIPD`: the version of `package` in the CIPD entry `dep`.
    pub fn set_cipd(&mut self, dep: &str, package: &str, version: &str) -> Result<()> {
        let content = self.content.clone();
        let src = Source {
            text: &content,
            filename: &self.filename,
        };
        let module = eval::parse_module(&src)?;
        let key_vars = self.key_vars(&module, &src)?;
        let Expr::Dict(entry) = self.find_dep(&module, &src, &key_vars, dep)? else {
            return Err(Error::new(format!("{dep} is not a CIPD dependency")));
        };
        let Some(Expr::List(pkgs)) = dict_item(&src, entry, "packages", &key_vars)? else {
            return Err(Error::new(format!("{dep} has no packages list")));
        };
        let mut found = Vec::new();
        for p in &pkgs.elts {
            if let Expr::Dict(d) = p
                && let Some(pn) = dict_item(&src, d, "package", &key_vars)?
                && eval::eval_expr(&src, pn, Some(&key_vars))?.as_str() == Some(package)
            {
                found.push(d);
            }
        }
        if found.len() != 1 {
            return Err(Error::new(format!(
                "There must be exactly one package with the given name ({package}), {} were found.",
                found.len()
            )));
        }
        let mut node = dict_item(&src, found[0], "version", &key_vars)?
            .ok_or_else(|| Error::new("package has no version"))?;
        let mut version = version.to_string();
        if let Expr::BinOp(b) = node
            && b.op == Operator::Add
        {
            if let Ok(Value::Str(prefix)) = eval::eval_expr(&src, &b.left, Some(&key_vars))
                && let Some(rest) = version.strip_prefix(&prefix)
            {
                version = rest.to_string();
            }
            node = &b.right;
        }
        if let Expr::StringLiteral(s) = node {
            let v = s.value.to_str();
            if v.ends_with('}')
                && let Some(i) = v.rfind('{')
                && let Some(rest) = version.strip_prefix(&v[..i])
            {
                version = rest.to_string();
            }
        }
        match var_name(node) {
            Some(var) => self.set_var(&var, &version),
            None => {
                let range = single_literal(&src, node)?;
                let new = quoted(&content, range, &version);
                self.replace(range, &new);
                Ok(())
            }
        }
    }

    fn find_dep<'m>(
        &self,
        module: &'m ruff_python_ast::ModModule,
        src: &Source<'_>,
        vars: &Dict,
        dep: &str,
    ) -> Result<&'m Expr> {
        let Some(Expr::Dict(deps)) = top_level(module, "deps") else {
            return Err(Error::new("no deps dict"));
        };
        dict_item(src, deps, dep, vars)?
            .ok_or_else(|| Error::new(format!("Could not find any dependency called {dep}.")))
    }
}

fn top_level<'m>(module: &'m ruff_python_ast::ModModule, name: &str) -> Option<&'m Expr> {
    module.body.iter().find_map(|s| match s {
        Stmt::Assign(a) if matches!(a.targets.as_slice(), [Expr::Name(n)] if n.id.as_str() == name) => Some(a.value.as_ref()),
        _ => None,
    })
}

fn dict_item<'m>(
    src: &Source<'_>,
    d: &'m ruff_python_ast::ExprDict,
    key: &str,
    vars: &Dict,
) -> Result<Option<&'m Expr>> {
    for item in &d.items {
        if let Some(k) = &item.key
            && eval::eval_expr(src, k, Some(vars))?.as_str() == Some(key)
        {
            return Ok(Some(&item.value));
        }
    }
    Ok(None)
}

/// `_GetVarName`: `Var('x')`, or a literal ending in a `{x}` placeholder.
fn var_name(node: &Expr) -> Option<String> {
    match node {
        Expr::Call(c) => match c.arguments.args.first() {
            Some(Expr::StringLiteral(s)) => Some(s.value.to_str().to_string()),
            _ => None,
        },
        Expr::StringLiteral(s) => {
            let v = s.value.to_str();
            if v.ends_with('}') {
                v.rfind('{').map(|i| v[i + 1..v.len() - 1].to_string())
            } else {
                None
            }
        }
        _ => None,
    }
}

/// The range of a string literal that is a single token (no implicit concatenation).
fn single_literal(src: &Source<'_>, node: &Expr) -> Result<TextRange> {
    match node {
        Expr::StringLiteral(s) if !s.value.is_implicit_concatenated() => Ok(s.range()),
        Expr::StringLiteral(_) => Err(Error::new(format!(
            "Can't update value on line {}: implicitly concatenated strings are not supported. Consider reformatting the DEPS file.",
            src.line_of(node)
        ))),
        _ => Err(Error::new("Unsupported dependency revision format.")),
    }
}

/// `value` as a literal with the quote of the token at `range`.
fn quoted(content: &str, range: TextRange, value: &str) -> String {
    let token = &content[usize::from(range.start())..usize::from(range.end())];
    let q = token
        .chars()
        .find(|c| *c == '\'' || *c == '"')
        .unwrap_or('\'');
    format!("{q}{}{q}", escape(value))
}

/// `str.encode("unicode_escape")` for the characters a revision or version can hold.
fn escape(v: &str) -> String {
    let mut out = String::with_capacity(v.len());
    for c in v.chars() {
        match c {
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\t' => out.push_str("\\t"),
            '\r' => out.push_str("\\r"),
            c if (c as u32) < 0x20 || (c as u32) >= 0x7f => {
                let n = c as u32;
                if n <= 0xff {
                    out.push_str(&format!("\\x{n:02x}"));
                } else if n <= 0xffff {
                    out.push_str(&format!("\\u{n:04x}"));
                } else {
                    out.push_str(&format!("\\U{n:08x}"));
                }
            }
            c => out.push(c),
        }
    }
    out
}

/// Update the gitlink (mode 160000 index entry) of `path` to `revision`, as `setdep` does for
/// `git_dependencies = 'SYNC'` or `'SUBMODULES'`. The tree-cache extension is dropped so git
/// rebuilds it, since it would no longer match. Returns false when `path` is not a gitlink.
pub fn update_gitlink(repo_dir: &Path, path: &str, revision: &str) -> Result<bool> {
    let repo =
        gix::discover(repo_dir).map_err(|e| Error::new(format!("{}: {e}", repo_dir.display())))?;
    let id = gix::ObjectId::from_hex(revision.as_bytes())
        .map_err(|e| Error::new(format!("{revision}: {e}")))?;
    let index_path = repo.index_path();
    let mut index =
        gix::index::File::at(&index_path, repo.object_hash(), false, Default::default())
            .map_err(|e| Error::new(format!("{}: {e}", index_path.display())))?;
    let Some(entry) =
        index.entry_mut_by_path_and_stage(path.into(), gix::index::entry::Stage::Unconflicted)
    else {
        return Ok(false);
    };
    if entry.mode != gix::index::entry::Mode::COMMIT {
        return Ok(false);
    }
    entry.id = id;
    let options = gix::index::write::Options {
        extensions: gix::index::write::Extensions::Given {
            tree_cache: false,
            end_of_index_entry: true,
        },
        ..Default::default()
    };
    index
        .write(options)
        .map_err(|e| Error::new(format!("{}: {e}", index_path.display())))?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    const DEPS: &str = r#"vars = {
  'chromium_git': 'https://chromium.googlesource.com',
  'foo_revision': 'aaaa',
  'tool_version': Str('version:1'),
}

deps = {
  'src/foo': Var('chromium_git') + '/foo.git' + '@' + Var('foo_revision'),
  'src/bar': {
    'url': Var('chromium_git') + "/bar.git@bbbb",
    'condition': 'checkout_win',
  },
  'src/unpinned': 'https://x/u.git',
  'src/tool': {
    'packages': [ { 'package': 'infra/tool', 'version': 'git_revision:cccc' } ],
    'dep_type': 'cipd',
  },
}
"#;

    #[test]
    fn get_values() {
        assert_eq!(get_var(DEPS, "DEPS", "foo_revision", None).unwrap(), "aaaa");
        assert_eq!(
            get_var(DEPS, "DEPS", "tool_version", None).unwrap(),
            "version:1"
        );
        assert_eq!(
            get_revision(DEPS, "DEPS", "src/foo", None)
                .unwrap()
                .as_deref(),
            Some("aaaa")
        );
        assert_eq!(
            get_revision(DEPS, "DEPS", "src/bar", None)
                .unwrap()
                .as_deref(),
            Some("bbbb")
        );
        assert_eq!(
            get_revision(DEPS, "DEPS", "src/unpinned", None).unwrap(),
            None
        );
        assert_eq!(
            get_revision(DEPS, "DEPS", "src/tool:infra/tool", None)
                .unwrap()
                .as_deref(),
            Some("git_revision:cccc")
        );
        assert!(
            get_revision(DEPS, "DEPS", "foo", None)
                .unwrap_err()
                .to_string()
                .contains("Did you mean src/foo")
        );
    }

    #[test]
    fn set_values_keep_formatting() {
        let mut e = DepsEditor::new(DEPS, "DEPS", None);
        e.set_revision("src/foo", "1111").unwrap();
        e.set_revision("src/bar", "2222").unwrap();
        e.set_revision("src/unpinned", "3333").unwrap();
        e.set_cipd("src/tool", "infra/tool", "git_revision:4444")
            .unwrap();
        e.set_var("tool_version", "version:2").unwrap();
        e.set_var("new_var", "n").unwrap();
        let out = e.into_content();
        let expected = DEPS
            .replace("'foo_revision': 'aaaa'", "'foo_revision': '1111'")
            .replace("\"/bar.git@bbbb\"", "\"/bar.git@2222\"")
            .replace("'https://x/u.git'", "'https://x/u.git@3333'")
            .replace("'git_revision:cccc'", "'git_revision:4444'")
            .replace("Str('version:1')", "Str('version:2')")
            .replace("vars = {\n", "vars = {\n  \"new_var\": \"n\",\n");
        assert_eq!(out, expected);
        // Still a valid DEPS file.
        assert_eq!(
            get_revision(&out, "DEPS", "src/foo", None)
                .unwrap()
                .as_deref(),
            Some("1111")
        );
    }
}
