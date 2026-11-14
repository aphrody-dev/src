//! Safe evaluation of DEPS and `.gclient` files, a port of `gclient_eval.py`
//! (`_gclient_eval`, `Exec`, `ParseLocalConfig`).
//!
//! The files are parsed with Ruff's Python parser and only a whitelist of nodes is evaluated:
//! literals, lists, tuples, dicts, `Str()`, `Var()`, `+` and `%`. Strings are expanded with
//! `str.format`-style `{var}` placeholders once the `vars` dict is known.

use crate::value::{Dict, Value};
use crate::{Error, Result};
use ruff_python_ast::{self as ast, Expr, Number, Operator, Stmt};
use ruff_text_size::Ranged;

/// Source text plus its name, for error messages with line numbers.
pub struct Source<'a> {
    pub text: &'a str,
    pub filename: &'a str,
}

impl Source<'_> {
    pub fn line_of(&self, node: &impl Ranged) -> usize {
        let offset = usize::from(node.start()).min(self.text.len());
        self.text[..offset].bytes().filter(|b| *b == b'\n').count() + 1
    }

    fn err(&self, node: &impl Ranged, msg: impl std::fmt::Display) -> Error {
        Error::new(format!(
            "{msg} (file '{}', line {})",
            self.filename,
            self.line_of(node)
        ))
    }
}

/// Expand `{name}` placeholders like `str.format(**vars)`, rejecting attribute and item access
/// (`_ExpandVars` with `_SafeFormatter`).
pub fn expand_vars(value: &str, vars: &Dict) -> Result<String> {
    let mut out = String::with_capacity(value.len());
    let mut chars = value.chars().peekable();
    while let Some(c) = chars.next() {
        match c {
            '{' if chars.peek() == Some(&'{') => {
                chars.next();
                out.push('{');
            }
            '}' if chars.peek() == Some(&'}') => {
                chars.next();
                out.push('}');
            }
            '}' => return Err(Error::new("Single '}' encountered in format string")),
            '{' => {
                let mut field = String::new();
                let mut closed = false;
                for c in chars.by_ref() {
                    if c == '}' {
                        closed = true;
                        break;
                    }
                    field.push(c);
                }
                if !closed {
                    return Err(Error::new("Single '{' encountered in format string"));
                }
                // `{name!r:spec}`: keep the name, the conversion and spec are not used by DEPS.
                let name = field.split(['!', ':']).next().unwrap_or_default();
                if name.contains('.') || name.contains('[') {
                    return Err(Error::new(format!(
                        "Attribute and item access are not allowed: {name}"
                    )));
                }
                if name.is_empty() || name.bytes().all(|b| b.is_ascii_digit()) {
                    return Err(Error::new(format!(
                        "positional placeholder '{{{field}}}' is not allowed"
                    )));
                }
                let val = vars.get(name).ok_or_else(|| Error::key(name))?;
                out.push_str(&val.to_py_str());
            }
            c => out.push(c),
        }
    }
    Ok(out)
}

/// Evaluate one expression. With `vars == None` string constants are kept verbatim and
/// `Var('x')` yields `"{x}"`, as when gclient evaluates the `vars` dict itself.
pub fn eval_expr(src: &Source<'_>, node: &Expr, vars: Option<&Dict>) -> Result<Value> {
    match node {
        Expr::StringLiteral(s) => {
            let raw = s.value.to_str();
            match vars {
                None => Ok(Value::Str(raw.to_string())),
                Some(vars) => {
                    expand_vars(raw, vars)
                        .map(Value::Str)
                        .map_err(|e| {
                            match e.missing_key() {
                        Some(k) => src.err(
                            node,
                            format!(
                                "{k} was used as a variable, but was not declared in the vars dict"
                            ),
                        ),
                        None => src.err(node, e),
                    }
                        })
                }
            }
        }
        Expr::BooleanLiteral(b) => Ok(Value::Bool(b.value)),
        Expr::NoneLiteral(_) => Ok(Value::None),
        Expr::NumberLiteral(n) => match &n.value {
            Number::Int(i) => i
                .as_i64()
                .map(Value::Int)
                .ok_or_else(|| src.err(node, "integer out of range")),
            _ => Err(src.err(node, "only integer numbers are supported")),
        },
        Expr::Tuple(t) => t
            .elts
            .iter()
            .map(|e| eval_expr(src, e, vars))
            .collect::<Result<_>>()
            .map(Value::Tuple),
        Expr::List(l) => l
            .elts
            .iter()
            .map(|e| eval_expr(src, e, vars))
            .collect::<Result<_>>()
            .map(Value::List),
        Expr::Dict(d) => {
            let mut out = Dict::new();
            for item in &d.items {
                let Some(key_node) = &item.key else {
                    return Err(src.err(node, "dict unpacking (**) is not allowed"));
                };
                let key = match eval_expr(src, key_node, vars)? {
                    Value::Str(s) | Value::ConstStr(s) => s,
                    other => {
                        return Err(
                            src.err(key_node, format!("dict keys must be strings, got {other}"))
                        );
                    }
                };
                if out.contains_key(&key) {
                    return Err(src.err(key_node, format!("duplicate key in dictionary: {key}")));
                }
                out.insert(key, eval_expr(src, &item.value, vars)?);
            }
            Ok(Value::Dict(out))
        }
        Expr::Name(n) => match n.id.as_str() {
            "None" => Ok(Value::None),
            "True" => Ok(Value::Bool(true)),
            "False" => Ok(Value::Bool(false)),
            other => Err(src.err(node, format!("invalid name '{other}'"))),
        },
        Expr::Call(call) => eval_call(src, node, call, vars),
        Expr::BinOp(b) if b.op == Operator::Add => {
            let (l, r) = (
                eval_expr(src, &b.left, vars)?,
                eval_expr(src, &b.right, vars)?,
            );
            add(l, r).map_err(|e| src.err(node, e))
        }
        Expr::BinOp(b) if b.op == Operator::Mod => {
            let (l, r) = (
                eval_expr(src, &b.left, vars)?,
                eval_expr(src, &b.right, vars)?,
            );
            percent_format(&l, &r).map_err(|e| src.err(node, e))
        }
        other => Err(src.err(other, "unexpected AST node")),
    }
}

fn eval_call(
    src: &Source<'_>,
    node: &Expr,
    call: &ast::ExprCall,
    vars: Option<&Dict>,
) -> Result<Value> {
    let name = match call.func.as_ref() {
        Expr::Name(n) if n.id.as_str() == "Str" || n.id.as_str() == "Var" => n.id.as_str(),
        _ => return Err(src.err(node, "Str and Var are the only allowed functions")),
    };
    if !call.arguments.keywords.is_empty() || call.arguments.args.len() != 1 {
        return Err(src.err(node, format!("{name} takes exactly one argument")));
    }
    let arg = &call.arguments.args[0];
    if name == "Str" {
        return match arg {
            Expr::StringLiteral(s) => Ok(Value::ConstStr(s.value.to_str().to_string())),
            _ => Err(src.err(node, "Passed a non-string to Str()")),
        };
    }
    let var_name = match eval_expr(src, arg, vars)? {
        Value::Str(s) => s,
        _ => return Err(src.err(node, "Var's argument must be a variable name")),
    };
    let Some(vars) = vars else {
        return Ok(Value::Str(format!("{{{var_name}}}")));
    };
    match vars.get(&var_name) {
        Some(Value::ConstStr(s)) => Ok(Value::Str(s.clone())),
        Some(v) => Ok(v.clone()),
        None => Err(src.err(
            node,
            format!("{var_name} was used as a variable, but was not declared in the vars dict"),
        )),
    }
}

fn add(l: Value, r: Value) -> std::result::Result<Value, String> {
    match (l, r) {
        (l, r) if l.as_str().is_some() && r.as_str().is_some() => Ok(Value::Str(format!(
            "{}{}",
            l.as_str().unwrap_or_default(),
            r.as_str().unwrap_or_default()
        ))),
        (Value::Int(a), Value::Int(b)) => a
            .checked_add(b)
            .map(Value::Int)
            .ok_or_else(|| "integer overflow".into()),
        (Value::List(mut a), Value::List(b)) => {
            a.extend(b);
            Ok(Value::List(a))
        }
        (Value::Tuple(mut a), Value::Tuple(b)) => {
            a.extend(b);
            Ok(Value::Tuple(a))
        }
        (l, r) => Err(format!("unsupported operand types for +: {l} and {r}")),
    }
}

/// `str % args` with `%s`, `%d`, `%r` and `%%`.
fn percent_format(l: &Value, r: &Value) -> std::result::Result<Value, String> {
    let fmt = l
        .as_str()
        .ok_or_else(|| format!("unsupported operand for %: {l}"))?;
    let args: Vec<&Value> = match r {
        Value::Tuple(items) => items.iter().collect(),
        other => vec![other],
    };
    let mut args = args.into_iter();
    let mut out = String::new();
    let mut chars = fmt.chars();
    while let Some(c) = chars.next() {
        if c != '%' {
            out.push(c);
            continue;
        }
        match chars.next() {
            Some('%') => out.push('%'),
            Some(spec @ ('s' | 'd' | 'r')) => {
                let arg = args
                    .next()
                    .ok_or("not enough arguments for format string")?;
                match spec {
                    'r' => out.push_str(&arg.to_string()),
                    _ => out.push_str(&arg.to_py_str()),
                }
            }
            other => return Err(format!("unsupported format character {other:?}")),
        }
    }
    if args.next().is_some() {
        return Err("not all arguments converted during string formatting".into());
    }
    Ok(Value::Str(out))
}

/// The top-level `name = value` assignments of a file, in order.
pub(crate) fn assignments<'m>(
    src: &Source<'_>,
    module: &'m ast::ModModule,
    allow_docstrings: bool,
) -> Result<Vec<(String, &'m Expr)>> {
    let mut out: Vec<(String, &Expr)> = Vec::new();
    for stmt in &module.body {
        match stmt {
            Stmt::Expr(e)
                if allow_docstrings && matches!(e.value.as_ref(), Expr::StringLiteral(_)) =>
            {
                continue;
            }
            Stmt::Assign(a) => {
                if a.targets.len() != 1 {
                    return Err(src.err(stmt, "invalid assignment: use exactly one target"));
                }
                let Expr::Name(target) = &a.targets[0] else {
                    return Err(src.err(stmt, "invalid assignment: target should be a name"));
                };
                let name = target.id.to_string();
                if out.iter().any(|(n, _)| *n == name) {
                    return Err(
                        src.err(stmt, format!("invalid assignment: overrides var '{name}'"))
                    );
                }
                out.push((name, a.value.as_ref()));
            }
            other => return Err(src.err(other, "unexpected AST node")),
        }
    }
    Ok(out)
}

pub(crate) fn parse_module(src: &Source<'_>) -> Result<ast::ModModule> {
    ruff_python_parser::parse_module(src.text)
        .map(|p| p.into_syntax())
        .map_err(|e| Error::new(format!("{}: syntax error: {e}", src.filename)))
}

/// `gclient_eval.Exec`: evaluate every assignment of a DEPS file. `vars` is evaluated first
/// (without expansion) and becomes the expansion dict together with `builtin_vars`;
/// `vars_override` only replaces variables that the file (or the builtins) already declares.
pub fn exec(
    content: &str,
    filename: &str,
    vars_override: Option<&Dict>,
    builtin_vars: Option<&Dict>,
) -> Result<Dict> {
    let src = Source {
        text: content,
        filename,
    };
    let module = parse_module(&src)?;
    let statements = assignments(&src, &module, false)?;

    let mut vars_dict = Dict::new();
    if let Some((_, node)) = statements.iter().find(|(n, _)| n == "vars") {
        match eval_expr(&src, node, None)? {
            Value::Dict(d) => vars_dict.update(&d),
            other => return Err(src.err(*node, format!("vars must be a dict, got {other}"))),
        }
    }
    if let Some(b) = builtin_vars {
        vars_dict.update(b);
    }
    if let Some(o) = vars_override {
        for (k, v) in o.iter() {
            if vars_dict.contains_key(k) {
                vars_dict.insert(k.clone(), v.clone());
            }
        }
    }

    let mut scope = Dict::new();
    for (name, node) in &statements {
        scope.insert(name.clone(), eval_expr(&src, node, Some(&vars_dict))?);
    }
    validate(&scope).map_err(|e| Error::new(format!("{filename}: {e}")))?;
    Ok(scope)
}

/// `gclient_eval.ParseLocalConfig`: `.gclient` and `.gclient_entries`, no variable expansion.
pub fn parse_local_config(content: &str, filename: &str) -> Result<Dict> {
    let src = Source {
        text: content,
        filename,
    };
    let module = parse_module(&src)?;
    let mut out = Dict::new();
    for (name, node) in assignments(&src, &module, true)? {
        let v = eval_expr(&src, node, None)
            .map_err(|e| Error::new(format!("Error evaluating local config {name}: {e}")))?;
        out.insert(name, v);
    }
    Ok(out)
}

/// The subset of `_GCLIENT_SCHEMA` that later stages rely on.
fn validate(scope: &Dict) -> std::result::Result<(), String> {
    if let Some(vars) = scope.get("vars") {
        let vars = vars.as_dict().ok_or("vars must be a dict")?;
        for (k, v) in vars.iter() {
            if !matches!(v, Value::Str(_) | Value::ConstStr(_) | Value::Bool(_)) {
                return Err(format!("var {k} must be a string, Str() or bool, got {v}"));
            }
        }
    }
    if let Some(gd) = scope.get("git_dependencies") {
        match gd.as_str() {
            Some("DEPS" | "SYNC" | "SUBMODULES") => {}
            _ => {
                return Err(format!(
                    "git_dependencies must be DEPS, SYNC or SUBMODULES, got {gd}"
                ));
            }
        }
    }
    for key in ["hooks", "pre_deps_hooks"] {
        if let Some(hooks) = scope.get(key) {
            let hooks = hooks
                .as_seq()
                .ok_or_else(|| format!("{key} must be a list"))?;
            for h in hooks {
                let h = h
                    .as_dict()
                    .ok_or_else(|| format!("{key} entries must be dicts"))?;
                if h.get("action").and_then(Value::as_seq).is_none() {
                    return Err(format!(
                        "{key} entry without an action list: {}",
                        Value::Dict(h.clone())
                    ));
                }
            }
        }
    }
    if let Some(deps) = scope.get("deps") {
        deps.as_dict().ok_or("deps must be a dict")?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn vars(pairs: &[(&str, Value)]) -> Dict {
        pairs
            .iter()
            .map(|(k, v)| (k.to_string(), v.clone()))
            .collect()
    }

    #[test]
    fn expands_like_str_format() {
        let v = vars(&[("a", Value::Str("x".into())), ("b", Value::Bool(true))]);
        assert_eq!(expand_vars("{a}/{b}/{{lit}}", &v).unwrap(), "x/True/{lit}");
        assert!(expand_vars("{a.__class__}", &v).is_err());
        assert!(
            expand_vars("{missing}", &v)
                .unwrap_err()
                .missing_key()
                .is_some()
        );
    }

    #[test]
    fn exec_expands_vars_and_overrides_only_declared() {
        let deps = r#"
vars = {
  'git': 'https://chromium.googlesource.com',
  'rev': 'abc',
  'flag': False,
  'const': Str('checkout_x'),
}
deps = {
  'src/a': Var('git') + '/a.git' + '@' + Var('rev'),
  'src/b': { 'url': '{git}/b.git@{rev}', 'condition': 'flag' },
  'src/c': 'https://x/%s.git' % 'c',
}
"#;
        let over = vars(&[
            ("rev", Value::Str("def".into())),
            ("undeclared", Value::Str("z".into())),
        ]);
        let scope = exec(deps, "DEPS", Some(&over), None).unwrap();
        let d = scope.get("deps").unwrap().as_dict().unwrap();
        assert_eq!(
            d.get_str("src/a"),
            Some("https://chromium.googlesource.com/a.git@def")
        );
        assert_eq!(
            d.get("src/b").unwrap().as_dict().unwrap().get_str("url"),
            Some("https://chromium.googlesource.com/b.git@def")
        );
        assert_eq!(d.get_str("src/c"), Some("https://x/c.git"));
        // The vars dict keeps the file's own values, expanded.
        let v = scope.get("vars").unwrap().as_dict().unwrap();
        assert_eq!(v.get_str("rev"), Some("abc"));
        assert_eq!(v.get("const"), Some(&Value::ConstStr("checkout_x".into())));
        assert!(!scope.contains_key("undeclared"));
    }

    #[test]
    fn rejects_code() {
        for bad in [
            "x = open('f')",
            "import os",
            "x = [i for i in y]",
            "x = 1\nx = 2",
            "a, b = 1, 2",
            "x = y",
        ] {
            assert!(exec(bad, "DEPS", None, None).is_err(), "{bad}");
        }
    }

    #[test]
    fn local_config_skips_docstrings() {
        let c = parse_local_config(
            "\"\"\"doc\"\"\"\nsolutions = [{'name': 'src', 'url': 'u'}]\ncache_dir = None\n",
            ".gclient",
        )
        .unwrap();
        assert_eq!(c.get("cache_dir"), Some(&Value::None));
        assert_eq!(c.get("solutions").unwrap().as_seq().unwrap().len(), 1);
    }
}
