//! `ay code`: parser-backed refactoring and staging tools for coding agents.
//! `refs` and `mv` read import specifiers from tree-sitter nodes (never regex) and `mv` rewrites
//! them through their exact byte ranges; `stage` stages selected diff hunks via `git apply --cached`.

use clap::{Args, Subcommand};
use serde_json::json;
use std::collections::HashSet;
use std::io::Write;
use std::path::{Component, Path, PathBuf};
use std::process::{Command, Stdio};

#[derive(Args, Debug, PartialEq)]
pub struct CodeArgs {
    #[command(subcommand)]
    pub cmd: CodeCmd,
}

#[derive(Subcommand, Debug, PartialEq)]
pub enum CodeCmd {
    /// List every file that imports, re-exports, dynamically imports or requires a TS/JS file or directory
    Refs {
        path: PathBuf,
        /// Package root to scan (default: nearest directory with package.json)
        #[arg(long)]
        root: Option<PathBuf>,
        #[arg(long)]
        json: bool,
    },
    /// Move a file or directory and rewrite the relative specifiers it affects
    Mv {
        from: PathBuf,
        to: PathBuf,
        #[arg(long)]
        root: Option<PathBuf>,
        /// Print the plan only
        #[arg(long)]
        dry_run: bool,
        #[arg(long)]
        json: bool,
    },
    /// Stage only the diff hunks of a file whose added/removed lines contain a substring
    Stage {
        file: PathBuf,
        #[arg(long = "match", value_name = "TEXT")]
        match_text: String,
        #[arg(long)]
        dry_run: bool,
    },
}

pub fn run(a: CodeArgs) -> i32 {
    let res = match a.cmd {
        CodeCmd::Refs { path, root, json } => refs(&path, root.as_deref(), json),
        CodeCmd::Mv { from, to, root, dry_run, json } => mv(&from, &to, root.as_deref(), dry_run, json),
        CodeCmd::Stage { file, match_text, dry_run } => stage(&file, &match_text, dry_run),
    };
    match res {
        Ok(code) => code,
        Err(e) => {
            eprintln!("ay code: {e}");
            1
        }
    }
}

// ---------- parsing ----------

#[derive(Debug, Clone, PartialEq)]
pub struct Spec {
    pub start: usize,
    pub end: usize,
    pub line: usize,
    pub text: String,
    pub kind: &'static str,
}

#[derive(Debug, Default)]
pub struct Parsed {
    pub specs: Vec<Spec>,
    /// Plain string literals that are not import specifiers: (line, text).
    pub strings: Vec<(usize, String)>,
    pub has_error: bool,
}

fn language_for(path: &Path) -> Option<tree_sitter::Language> {
    match path.extension()?.to_str()? {
        "ts" | "mts" | "cts" => Some(tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()),
        "tsx" => Some(tree_sitter_typescript::LANGUAGE_TSX.into()),
        "js" | "mjs" | "cjs" | "jsx" => Some(tree_sitter_javascript::LANGUAGE.into()),
        _ => None,
    }
}

fn spec_of(src: &str, n: tree_sitter::Node, kind: &'static str) -> Option<Spec> {
    if n.kind() != "string" || n.end_byte() < n.start_byte() + 2 {
        return None;
    }
    let (start, end) = (n.start_byte() + 1, n.end_byte() - 1);
    Some(Spec { start, end, line: n.start_position().row + 1, text: src.get(start..end)?.to_string(), kind })
}

pub fn parse_source(src: &str, lang: tree_sitter::Language) -> Option<Parsed> {
    let mut parser = tree_sitter::Parser::new();
    parser.set_language(&lang).ok()?;
    let tree = parser.parse(src, None)?;
    let mut out = Parsed { has_error: tree.root_node().has_error(), ..Parsed::default() };
    let mut seen = HashSet::new();
    let mut stack = vec![tree.root_node()];
    while let Some(n) = stack.pop() {
        let found = match n.kind() {
            "import_statement" => n.child_by_field_name("source").and_then(|s| spec_of(src, s, "import")),
            "export_statement" => n.child_by_field_name("source").and_then(|s| spec_of(src, s, "export")),
            "import_require_clause" => {
                let mut c = n.walk();
                let r = n.named_children(&mut c).find_map(|s| spec_of(src, s, "import-require"));
                r
            }
            "call_expression" => {
                let kind = n.child_by_field_name("function").and_then(|f| match f.kind() {
                    "import" => Some("dynamic-import"),
                    "identifier" if src.get(f.byte_range()) == Some("require") => Some("require"),
                    _ => None,
                });
                match (kind, n.child_by_field_name("arguments")) {
                    (Some(k), Some(args)) if args.named_child_count() == 1 => {
                        args.named_child(0).and_then(|s| spec_of(src, s, k))
                    }
                    _ => None,
                }
            }
            "string" => {
                if !seen.contains(&(n.start_byte() + 1)) {
                    if let Some(s) = spec_of(src, n, "string") {
                        out.strings.push((s.line, s.text));
                    }
                }
                None
            }
            _ => None,
        };
        if let Some(s) = found {
            seen.insert(s.start);
            out.specs.push(s);
        }
        let mut c = n.walk();
        let kids: Vec<_> = n.children(&mut c).collect();
        stack.extend(kids.into_iter().rev());
    }
    out.specs.sort_by_key(|s| s.start);
    Some(out)
}

// ---------- paths ----------

pub fn normalize(p: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for c in p.components() {
        match c {
            Component::CurDir => {}
            Component::ParentDir => {
                if !out.pop() {
                    out.push("..");
                }
            }
            other => out.push(other.as_os_str()),
        }
    }
    out
}

fn absolute(p: &Path) -> PathBuf {
    let abs = if p.is_absolute() { p.to_path_buf() } else { std::env::current_dir().unwrap_or_default().join(p) };
    normalize(&abs)
}

fn rel(from_dir: &Path, to: &Path) -> String {
    let a: Vec<_> = from_dir.components().collect();
    let b: Vec<_> = to.components().collect();
    let mut i = 0;
    while i < a.len() && i < b.len() && a[i] == b[i] {
        i += 1;
    }
    let mut parts: Vec<String> = (i..a.len()).map(|_| "..".to_string()).collect();
    parts.extend(b[i..].iter().map(|c| c.as_os_str().to_string_lossy().into_owned()));
    parts.join("/")
}

fn slash(p: &Path) -> String {
    p.to_string_lossy().replace('\\', "/")
}

pub fn is_relative(spec: &str) -> bool {
    spec == "." || spec == ".." || spec.starts_with("./") || spec.starts_with("../")
}

/// Resolve a normalized extensionless-or-exact path: exact, .ts .tsx .js .mjs, /index.*, then
/// the TS convention of `.js` written for a `.ts` source.
pub fn resolve_with(p: &Path, is_file: &dyn Fn(&Path) -> bool) -> Option<PathBuf> {
    if is_file(p) {
        return Some(p.to_path_buf());
    }
    let with = |ext: &str| {
        let mut s = p.as_os_str().to_owned();
        s.push(ext);
        PathBuf::from(s)
    };
    for e in [".ts", ".tsx", ".js", ".mjs"] {
        if is_file(&with(e)) {
            return Some(with(e));
        }
    }
    for i in ["index.ts", "index.tsx", "index.js"] {
        if is_file(&p.join(i)) {
            return Some(p.join(i));
        }
    }
    let swaps: &[&str] = match p.extension().and_then(|e| e.to_str()) {
        Some("js") | Some("jsx") => &["ts", "tsx"],
        Some("mjs") => &["mts"],
        Some("cjs") => &["cts"],
        _ => &[],
    };
    swaps.iter().map(|e| p.with_extension(e)).find(|c| is_file(c))
}

fn resolve_fs(p: &Path) -> Option<PathBuf> {
    resolve_with(p, &|c| c.is_file())
}

pub struct Mover {
    pub from: PathBuf,
    pub to: PathBuf,
}

impl Mover {
    pub fn map(&self, p: &Path) -> PathBuf {
        match p.strip_prefix(&self.from) {
            Ok(rest) => self.to.join(rest),
            Err(_) => p.to_path_buf(),
        }
    }
}

/// Re-express the new target `r2` in the same style the original specifier used for `p` -> `r`.
fn restyle(p: &Path, r: &Path, r2: &Path) -> PathBuf {
    if p == r {
        return r2.to_path_buf();
    }
    if r.parent() == Some(p) {
        return if r2.file_stem().and_then(|s| s.to_str()) == Some("index") {
            r2.parent().map(Path::to_path_buf).unwrap_or_else(|| r2.to_path_buf())
        } else {
            r2.with_extension("")
        };
    }
    let ps = p.to_string_lossy();
    let rs = r.to_string_lossy();
    if let Some(ext) = rs.strip_prefix(&*ps) {
        let r2s = r2.to_string_lossy();
        return match r2s.strip_suffix(ext) {
            Some(base) => PathBuf::from(base),
            None => r2.with_extension(""),
        };
    }
    match p.extension() {
        Some(e) => r2.with_extension(e),
        None => r2.to_path_buf(),
    }
}

/// New text of a relative specifier found in `f_old` after the move, or None when unchanged.
pub fn new_specifier(
    spec: &str,
    f_old: &Path,
    mv: &Mover,
    resolve: &dyn Fn(&Path) -> Option<PathBuf>,
) -> Option<String> {
    if !is_relative(spec) {
        return None;
    }
    let f_new = mv.map(f_old);
    let trailing = spec.len() > 1 && spec.ends_with('/');
    let p = normalize(&f_old.parent()?.join(spec.trim_end_matches('/')));
    let target = match resolve(&p) {
        Some(r) => restyle(&p, &r, &mv.map(&r)),
        None => mv.map(&p),
    };
    if f_new == f_old && target == p {
        return None;
    }
    let mut s = rel(f_new.parent()?, &target);
    if s.is_empty() {
        s = ".".into();
    } else if s != ".." && !s.starts_with("../") {
        s = format!("./{s}");
    }
    if trailing {
        s.push('/');
    }
    (s != spec).then_some(s)
}

// ---------- scanning ----------

fn is_code(p: &Path) -> bool {
    language_for(p).is_some()
}

fn walk(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(rd) = std::fs::read_dir(dir) else { return };
    let mut entries: Vec<_> = rd.flatten().collect();
    entries.sort_by_key(|e| e.file_name());
    for e in entries {
        let p = e.path();
        let name = e.file_name();
        let name = name.to_string_lossy();
        let Ok(ft) = e.file_type() else { continue };
        if ft.is_dir() {
            if !matches!(&*name, "node_modules" | ".git" | "target" | "dist" | ".next" | ".turbo") {
                walk(&p, out);
            }
        } else if ft.is_file() && is_code(&p) {
            out.push(p);
        }
    }
}

fn find_root(start: &Path, root: Option<&Path>) -> PathBuf {
    if let Some(r) = root {
        return absolute(r);
    }
    let s = absolute(start);
    s.ancestors()
        .skip(usize::from(!s.is_dir()))
        .find(|d| d.join("package.json").is_file())
        .map(Path::to_path_buf)
        .unwrap_or_else(|| s.parent().map(Path::to_path_buf).unwrap_or(s))
}

fn parse_file(p: &Path) -> Option<Parsed> {
    let src = std::fs::read_to_string(p).ok()?;
    parse_source(&src, language_for(p)?)
}

fn display(root: &Path, p: &Path) -> String {
    slash(p.strip_prefix(root).unwrap_or(p))
}

// ---------- refs ----------

fn refs(path: &Path, root: Option<&Path>, as_json: bool) -> Result<i32, String> {
    let target = absolute(path);
    if !target.exists() {
        return Err(format!("{} does not exist", target.display()));
    }
    let root = find_root(&target, root);
    let mut files = Vec::new();
    walk(&root, &mut files);
    let mut hits = Vec::new();
    let mut unparsed = Vec::new();
    for f in &files {
        let Some(parsed) = parse_file(f) else {
            unparsed.push(display(&root, f));
            continue;
        };
        if parsed.has_error {
            unparsed.push(display(&root, f));
        }
        for s in &parsed.specs {
            if !is_relative(&s.text) {
                continue;
            }
            let p = normalize(&f.parent().unwrap_or(&root).join(s.text.trim_end_matches('/')));
            if resolve_fs(&p).is_some_and(|r| r.starts_with(&target)) {
                hits.push((display(&root, f), s.line, s.text.clone(), s.kind));
            }
        }
    }
    if as_json {
        let refs: Vec<_> = hits.iter().map(|(f, l, t, k)| json!({"file": f, "line": l, "specifier": t, "kind": k})).collect();
        println!("{}", json!({"target": slash(&target), "root": slash(&root), "refs": refs, "unparsed": unparsed}));
    } else {
        for (f, l, t, k) in &hits {
            println!("{f}:{l}: {k} \"{t}\"");
        }
        for u in &unparsed {
            eprintln!("ay code: parse errors in {u}");
        }
        eprintln!("{} reference(s) in {}", hits.len(), slash(&root));
    }
    Ok(0)
}

// ---------- mv ----------

#[derive(Debug)]
pub struct Edit {
    pub start: usize,
    pub end: usize,
    pub line: usize,
    pub old: String,
    pub new: String,
}

pub struct Plan {
    pub edits: Vec<(PathBuf, Vec<Edit>)>,
    pub unparsed: Vec<PathBuf>,
}

pub fn plan_mv(root: &Path, mv: &Mover) -> Plan {
    let mut files = Vec::new();
    walk(root, &mut files);
    let mut plan = Plan { edits: Vec::new(), unparsed: Vec::new() };
    for f in files {
        let src = std::fs::read_to_string(&f).ok();
        let parsed = src.as_deref().zip(language_for(&f)).and_then(|(s, l)| parse_source(s, l));
        let Some(parsed) = parsed.filter(|p| !p.has_error) else {
            plan.unparsed.push(f);
            continue;
        };
        let edits: Vec<Edit> = parsed
            .specs
            .iter()
            .filter_map(|s| {
                new_specifier(&s.text, &f, mv, &resolve_fs)
                    .map(|new| Edit { start: s.start, end: s.end, line: s.line, old: s.text.clone(), new })
            })
            .collect();
        if !edits.is_empty() {
            plan.edits.push((f, edits));
        }
    }
    plan
}

fn git(dir: &Path, args: &[&str]) -> Option<String> {
    let o = Command::new("git").arg("-C").arg(dir).args(args).output().ok()?;
    o.status.success().then(|| String::from_utf8_lossy(&o.stdout).trim_end().to_string())
}

/// Plain mentions of the old repo-relative path that `mv` does not rewrite.
fn mentions(top: &Path, old_rel: &str, spec_free: &dyn Fn(&Path) -> bool) -> Vec<(String, usize, &'static str)> {
    let out = Command::new("git")
        .arg("-C")
        .arg(top)
        .args(["ls-files", "-z", "--cached", "--others", "--exclude-standard"])
        .output();
    let Ok(out) = out else { return Vec::new() };
    let mut found = Vec::new();
    for name in String::from_utf8_lossy(&out.stdout).split('\0').filter(|n| !n.is_empty()) {
        let p = top.join(name);
        let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
        let non_code = matches!(ext, "md" | "json" | "toml" | "yml" | "yaml");
        if !(non_code || is_code(&p)) || !spec_free(&p) {
            continue;
        }
        if std::fs::metadata(&p).map(|m| m.len() > 4_000_000).unwrap_or(true) {
            continue;
        }
        let Ok(text) = std::fs::read_to_string(&p) else { continue };
        if !text.contains(old_rel) {
            continue;
        }
        if non_code {
            for (i, l) in text.lines().enumerate().filter(|(_, l)| l.contains(old_rel)) {
                let _ = l;
                found.push((name.to_string(), i + 1, "text"));
            }
        } else if let Some(parsed) = parse_file(&p) {
            for (line, s) in parsed.strings.iter().filter(|(_, s)| s.contains(old_rel)) {
                let _ = s;
                found.push((name.to_string(), *line, "string-literal"));
            }
        }
    }
    found
}

fn mv(from: &Path, to: &Path, root: Option<&Path>, dry_run: bool, as_json: bool) -> Result<i32, String> {
    let (from, to) = (absolute(from), absolute(to));
    if !from.exists() {
        return Err(format!("{} does not exist", from.display()));
    }
    if to.exists() {
        return Err(format!("{} already exists", to.display()));
    }
    let root = find_root(&from, root);
    if !from.starts_with(&root) || !to.starts_with(&root) {
        return Err(format!("both paths must be inside the package root {}", root.display()));
    }
    let mover = Mover { from: from.clone(), to: to.clone() };
    let plan = plan_mv(&root, &mover);
    let top = from.parent().and_then(|d| git(d, &["rev-parse", "--show-toplevel"])).map(PathBuf::from);
    let old_rel = top.as_ref().and_then(|t| from.strip_prefix(absolute(t)).ok().map(slash));
    let edited: HashSet<&PathBuf> = plan.edits.iter().map(|(f, _)| f).collect();
    let mention_list = match (&top, &old_rel) {
        (Some(t), Some(r)) if !r.is_empty() => mentions(t, r, &|_| true),
        _ => Vec::new(),
    };
    let _ = edited;
    let tracked = git(&root, &["ls-files", "--error-unmatch", "--"]).is_none()
        && Command::new("git")
            .arg("-C")
            .arg(&root)
            .args(["ls-files", "--error-unmatch", "--"])
            .arg(&from)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false);

    if !dry_run {
        for (f, edits) in &plan.edits {
            let mut src = std::fs::read_to_string(f).map_err(|e| format!("{}: {e}", f.display()))?;
            for e in edits.iter().rev() {
                if src.get(e.start..e.end) != Some(e.old.as_str()) {
                    return Err(format!("{} changed while planning", f.display()));
                }
                src.replace_range(e.start..e.end, &e.new);
            }
            std::fs::write(f, src).map_err(|e| format!("{}: {e}", f.display()))?;
        }
        if let Some(parent) = to.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let git_ok = tracked
            && Command::new("git").arg("-C").arg(&root).arg("mv").arg(&from).arg(&to).status().map(|s| s.success()).unwrap_or(false);
        if !git_ok {
            std::fs::rename(&from, &to).map_err(|e| format!("rename: {e}"))?;
        }
    }

    if as_json {
        let rewrites: Vec<_> = plan
            .edits
            .iter()
            .flat_map(|(f, es)| {
                let r = &root;
                es.iter().map(move |e| json!({"file": display(r, f), "line": e.line, "from": e.old, "to": e.new}))
            })
            .collect();
        let ms: Vec<_> = mention_list.iter().map(|(f, l, k)| json!({"file": f, "line": l, "kind": k})).collect();
        let un: Vec<_> = plan.unparsed.iter().map(|f| display(&root, f)).collect();
        println!(
            "{}",
            json!({"from": slash(&from), "to": slash(&to), "dry_run": dry_run, "tracked": tracked,
                   "rewrites": rewrites, "unparsed": un, "mentions": ms})
        );
    } else {
        println!("{} {} -> {}{}", if dry_run { "plan" } else { "moved" }, display(&root, &from), display(&root, &to),
            if tracked { " (git mv)" } else { "" });
        for (f, es) in &plan.edits {
            for e in es {
                println!("  {}:{}: \"{}\" -> \"{}\"", display(&root, f), e.line, e.old, e.new);
            }
        }
        for f in &plan.unparsed {
            println!("  unparsed (not rewritten): {}", display(&root, f));
        }
        for (f, l, k) in &mention_list {
            println!("  mention (not rewritten, {k}): {f}:{l}");
        }
    }
    Ok(0)
}

// ---------- stage ----------

fn split_lines(b: &[u8]) -> Vec<&[u8]> {
    b.split_inclusive(|c| *c == b'\n').collect()
}

fn hunk_header(line: &str) -> Option<(i64, i64, i64, i64, String)> {
    let rest = line.strip_prefix("@@ -")?;
    let (ranges, tail) = rest.split_once(" @@")?;
    let (old, new) = ranges.split_once(" +")?;
    let pair = |s: &str| -> Option<(i64, i64)> {
        match s.split_once(',') {
            Some((a, b)) => Some((a.parse().ok()?, b.parse().ok()?)),
            None => Some((s.parse().ok()?, 1)),
        }
    };
    let (a, b) = pair(old)?;
    let (c, d) = pair(new)?;
    Some((a, b, c, d, tail.trim_end_matches(['\r', '\n']).to_string()))
}

/// Reduced patch containing only hunks with a changed line holding `needle`; None when no hunk matches.
pub fn select_hunks(diff: &[u8], needle: &str) -> Option<(Vec<u8>, usize, usize)> {
    let lines = split_lines(diff);
    let first = lines.iter().position(|l| l.starts_with(b"@@ "))?;
    let mut patch: Vec<u8> = lines[..first].concat();
    let mut hunks: Vec<&[&[u8]]> = Vec::new();
    let mut s = first;
    for i in first + 1..=lines.len() {
        if i == lines.len() || lines[i].starts_with(b"@@ ") {
            hunks.push(&lines[s..i]);
            s = i;
        }
    }
    let (mut selected, mut skipped_delta) = (0usize, 0i64);
    for h in &hunks {
        let head = String::from_utf8_lossy(h[0]).into_owned();
        let Some((a, b, c, d, tail)) = hunk_header(&head) else { continue };
        let hit = h[1..].iter().any(|l| {
            matches!(l.first(), Some(b'+') | Some(b'-')) && String::from_utf8_lossy(&l[1..]).contains(needle)
        });
        if hit {
            selected += 1;
            let eol = if h[0].ends_with(b"\r\n") { "\r\n" } else { "\n" };
            let nh = format!(
                "@@ -{a}{} +{}{} @@{tail}{eol}",
                if b == 1 && !head.contains(&format!("-{a},1")) { String::new() } else { format!(",{b}") },
                c - skipped_delta,
                if d == 1 && !head.contains(&format!("+{c},1")) { String::new() } else { format!(",{d}") },
            );
            patch.extend_from_slice(nh.as_bytes());
            patch.extend(h[1..].concat());
        } else {
            skipped_delta += d - b;
        }
    }
    (selected > 0).then_some((patch, selected, hunks.len()))
}

fn stage(file: &Path, needle: &str, dry_run: bool) -> Result<i32, String> {
    let abs = absolute(file);
    let dir = abs.parent().ok_or("no parent directory")?;
    let top = git(dir, &["rev-parse", "--show-toplevel"]).ok_or("not inside a git repository")?;
    let prefix = git(dir, &["rev-parse", "--show-prefix"]).unwrap_or_default();
    let name = abs.file_name().and_then(|n| n.to_str()).ok_or("bad file name")?;
    let relpath = format!("{prefix}{name}");
    let diff = Command::new("git")
        .arg("-C")
        .arg(&top)
        .args(["diff", "-U3", "--no-color", "--no-ext-diff", "--", &relpath])
        .output()
        .map_err(|e| e.to_string())?;
    if !diff.status.success() {
        return Err(String::from_utf8_lossy(&diff.stderr).trim().to_string());
    }
    let Some((patch, n, total)) = select_hunks(&diff.stdout, needle) else {
        eprintln!("ay code stage: no hunk of {relpath} matches {needle:?}");
        return Ok(1);
    };
    if dry_run {
        println!("would stage {n} of {total} hunk(s) of {relpath}");
        return Ok(0);
    }
    let mut child = Command::new("git")
        .arg("-C")
        .arg(&top)
        .args(["apply", "--cached", "-"])
        .stdin(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;
    child.stdin.take().ok_or("no stdin")?.write_all(&patch).map_err(|e| e.to_string())?;
    let st = child.wait().map_err(|e| e.to_string())?;
    if !st.success() {
        return Ok(st.code().unwrap_or(1));
    }
    println!("staged {n} of {total} hunk(s) of {relpath}");
    Ok(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn specs(src: &str) -> Vec<(String, &'static str)> {
        parse_source(src, tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into())
            .unwrap()
            .specs
            .into_iter()
            .map(|s| (s.text, s.kind))
            .collect()
    }

    #[test]
    fn extracts_all_specifier_forms() {
        let src = "import a from './a';\nimport type { B } from \"../b\";\nexport * from './c';\nexport { d } from './d';\n\
                   const e = await import('./e');\nconst f = require('./f');\nimport g = require('./g');\n\
                   const s = './not-a-spec';\nrequire(x);\nrequire('a', 'b');\nimport(`./t`);\n";
        let got = specs(src);
        let want = [
            ("./a", "import"),
            ("../b", "import"),
            ("./c", "export"),
            ("./d", "export"),
            ("./e", "dynamic-import"),
            ("./f", "require"),
            ("./g", "import-require"),
        ];
        assert_eq!(got.len(), want.len(), "{got:?}");
        for (g, w) in got.iter().zip(want) {
            assert_eq!((g.0.as_str(), g.1), w);
        }
    }

    #[test]
    fn byte_range_covers_specifier_only_and_strings_are_separate() {
        let src = "import x from './a';\nconst p = 'src/a.ts';\n";
        let p = parse_source(src, tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into()).unwrap();
        assert_eq!(&src[p.specs[0].start..p.specs[0].end], "./a");
        assert_eq!(p.strings, vec![(2, "src/a.ts".to_string())]);
        assert!(!p.has_error);
    }

    fn fs_of(files: &'static [&'static str]) -> impl Fn(&Path) -> Option<PathBuf> {
        move |p| resolve_with(p, &|c| files.iter().any(|f| Path::new(f) == c))
    }

    const FILES: &[&str] = &["/r/src/a.ts", "/r/src/b.ts", "/r/src/c.ts", "/r/src/d/index.ts", "/r/src/e.ts"];

    #[test]
    fn rewrites_importer_of_moved_file() {
        let mv = Mover { from: "/r/src/a.ts".into(), to: "/r/src/lib/a.ts".into() };
        let r = fs_of(FILES);
        assert_eq!(new_specifier("./a", Path::new("/r/src/b.ts"), &mv, &r).as_deref(), Some("./lib/a"));
        assert_eq!(new_specifier("./a.ts", Path::new("/r/src/b.ts"), &mv, &r).as_deref(), Some("./lib/a.ts"));
        assert_eq!(new_specifier("./c", Path::new("/r/src/b.ts"), &mv, &r), None);
        assert_eq!(new_specifier("react", Path::new("/r/src/b.ts"), &mv, &r), None);
    }

    #[test]
    fn rewrites_specifiers_inside_moved_file() {
        let mv = Mover { from: "/r/src/a.ts".into(), to: "/r/src/lib/a.ts".into() };
        let r = fs_of(FILES);
        assert_eq!(new_specifier("./c", Path::new("/r/src/a.ts"), &mv, &r).as_deref(), Some("../c"));
        assert_eq!(new_specifier("./d", Path::new("/r/src/a.ts"), &mv, &r).as_deref(), Some("../d"));
        // self reference keeps pointing at the moved file
        assert_eq!(new_specifier("./a", Path::new("/r/src/a.ts"), &mv, &r).as_deref(), Some("./a"));
    }

    #[test]
    fn directory_move_with_index_and_parent_styles() {
        let mv = Mover { from: "/r/src/d".into(), to: "/r/src/x/y".into() };
        let r = fs_of(FILES);
        assert_eq!(new_specifier("./d", Path::new("/r/src/b.ts"), &mv, &r).as_deref(), Some("./x/y"));
        assert_eq!(new_specifier("./d/", Path::new("/r/src/b.ts"), &mv, &r).as_deref(), Some("./x/y/"));
        assert_eq!(new_specifier("./d/index", Path::new("/r/src/b.ts"), &mv, &r).as_deref(), Some("./x/y/index"));
        assert_eq!(new_specifier("../e", Path::new("/r/src/d/index.ts"), &mv, &r).as_deref(), Some("../../e"));
    }

    #[test]
    fn js_extension_for_ts_source_is_kept() {
        let mv = Mover { from: "/r/src/a.ts".into(), to: "/r/src/lib/a.ts".into() };
        let r = fs_of(FILES);
        assert_eq!(new_specifier("./a.js", Path::new("/r/src/b.ts"), &mv, &r).as_deref(), Some("./lib/a.js"));
    }

    #[test]
    fn parent_specifier_stays_dot_dot_style() {
        let mv = Mover { from: "/r/src/e.ts".into(), to: "/r/src/d/e.ts".into() };
        let r = fs_of(FILES);
        assert_eq!(new_specifier("../e", Path::new("/r/src/d/index.ts"), &mv, &r).as_deref(), Some("./e"));
    }

    #[test]
    fn plan_and_apply_on_disk() {
        let dir = std::env::temp_dir().join(format!("ay-code-test-{}", std::process::id()));
        let _ = std::fs::remove_dir_all(&dir);
        std::fs::create_dir_all(dir.join("src")).unwrap();
        std::fs::write(dir.join("package.json"), "{}").unwrap();
        std::fs::write(dir.join("src/a.ts"), "export const a = 1;\n").unwrap();
        std::fs::write(dir.join("src/b.ts"), "import { a } from './a';\nexport * from './a.ts';\n").unwrap();
        std::fs::write(dir.join("src/bad.ts"), "import { from './a';\n").unwrap();
        let root = absolute(&dir);
        assert_eq!(find_root(&root.join("src/a.ts"), None), root);
        let mover = Mover { from: root.join("src/a.ts"), to: root.join("src/z/a.ts") };
        let plan = plan_mv(&root, &mover);
        assert_eq!(plan.unparsed.len(), 1);
        assert_eq!(plan.edits.len(), 1);
        let news: Vec<_> = plan.edits[0].1.iter().map(|e| e.new.as_str()).collect();
        assert_eq!(news, ["./z/a", "./z/a.ts"]);
        assert_eq!(mv(&root.join("src/a.ts"), &root.join("src/z/a.ts"), None, false, false), Ok(0));
        assert_eq!(
            std::fs::read_to_string(root.join("src/b.ts")).unwrap(),
            "import { a } from './z/a';\nexport * from './z/a.ts';\n"
        );
        assert!(root.join("src/z/a.ts").is_file() && !root.join("src/a.ts").exists());
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn selects_only_matching_hunks_and_fixes_new_start() {
        let diff = b"diff --git a/f b/f\n--- a/f\n+++ b/f\n@@ -1,3 +1,4 @@\n a\n+skipme\n b\n c\n@@ -20,3 +21,3 @@\n x\n-old\n+target\n y\n";
        let (patch, n, total) = select_hunks(diff, "target").unwrap();
        assert_eq!((n, total), (1, 2));
        let s = String::from_utf8(patch).unwrap();
        assert!(s.contains("@@ -20,3 +20,3 @@"), "{s}");
        assert!(!s.contains("skipme"));
        assert!(select_hunks(diff, "nope").is_none());
    }
}
