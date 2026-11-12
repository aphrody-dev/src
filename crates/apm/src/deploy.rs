//! Primitive discovery and per-target deployment, ported from
//! `apm_cli/integration/{instruction,prompt,command,agent,skill}_integrator.py`.
//!
//! Sources inside a package:
//! - instructions: `*.instructions.md` at the root and in `.apm/instructions/`
//! - prompts:      `*.prompt.md` at the root and in `.apm/prompts/` (workflow-shape prompts skipped)
//! - agents:       `*.agent.md` at the root, plus `.apm/agents/**` Markdown classified as agents
//! - skills:       root `SKILL.md` (whole package), `.apm/skills/<name>/`, `skills/<name>/`
//!
//! Not ported: markdown link rewriting, hooks, MCP, canvas, security scanning.

use std::fs;
use std::path::Path;
use std::path::PathBuf;

use anyhow::Context;
use anyhow::Result;
use indexmap::IndexMap;

use crate::frontmatter;
use crate::hash;
use crate::targets::Target;
use crate::yaml::Value;

/// One deployed path, relative to the project root (posix).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Deployed {
    pub path: String,
    pub target: &'static str,
    /// `sha256:` hash for files, `None` for skill directories.
    pub hash: Option<String>,
}

fn glob_flat(dir: &Path, suffix: &str) -> Vec<PathBuf> {
    let Ok(rd) = fs::read_dir(dir) else {
        return vec![];
    };
    let mut out: Vec<PathBuf> = rd
        .flatten()
        .filter(|e| e.file_type().is_ok_and(|t| t.is_file()))
        .map(|e| e.path())
        .filter(|p| {
            p.file_name()
                .and_then(|n| n.to_str())
                .is_some_and(|n| n.ends_with(suffix))
        })
        .collect();
    out.sort();
    out
}

fn find(package: &Path, suffix: &str, subdir: &str, include_root: bool) -> Vec<PathBuf> {
    let mut out = if include_root {
        glob_flat(package, suffix)
    } else {
        vec![]
    };
    for p in glob_flat(&package.join(subdir), suffix) {
        if !out.contains(&p) {
            out.push(p);
        }
    }
    out
}

const AGENT_FIELDS: &[&str] = &[
    "allowed-tools",
    "argument-hint",
    "color",
    "description",
    "input",
    "mcp_servers",
    "model",
    "name",
    "tools",
];

/// `classify_agent_source_file` (declaration first, then legacy `.md` fallback).
fn is_agent_file(path: &Path) -> bool {
    let name = path.file_name().and_then(|n| n.to_str()).unwrap_or("");
    if !(name.ends_with(".agent.md") || name.ends_with(".md")) {
        return false;
    }
    let Ok(text) = fs::read_to_string(path) else {
        return false;
    };
    match frontmatter::loads(&text) {
        Err(_) => true,
        Ok(p) if p.metadata.is_empty() => true,
        Ok(p) => {
            if p.metadata
                .get("$schema")
                .is_some_and(|s| !matches!(s, Value::Str(_)))
            {
                return false;
            }
            p.metadata
                .keys()
                .any(|k| AGENT_FIELDS.contains(&k.as_str()))
        }
    }
}

pub fn find_agents(package: &Path, include_root: bool) -> Vec<PathBuf> {
    let mut out: Vec<PathBuf> = if include_root {
        glob_flat(package, ".agent.md")
            .into_iter()
            .filter(|p| is_agent_file(p))
            .collect()
    } else {
        vec![]
    };
    let apm_agents = package.join(".apm").join("agents");
    for f in hash::files_under(&apm_agents) {
        if is_agent_file(&f) && !out.contains(&f) {
            out.push(f);
        }
    }
    out
}

pub fn find_instructions(package: &Path, include_root: bool) -> Vec<PathBuf> {
    find(
        package,
        ".instructions.md",
        ".apm/instructions",
        include_root,
    )
}

pub fn find_prompts(package: &Path, include_root: bool) -> Vec<PathBuf> {
    find(package, ".prompt.md", ".apm/prompts", include_root)
}

/// `_is_workflow_shape`: Copilot App workflow metadata keys.
fn is_workflow_shape(meta: &IndexMap<String, Value>) -> bool {
    ["interval", "schedule_hour", "schedule_day"]
        .iter()
        .any(|k| meta.contains_key(*k))
}

/// `to_hyphen_case`.
pub fn to_hyphen_case(name: &str) -> String {
    let name = name.rsplit('/').next().unwrap_or(name);
    let r = name.replace(['_', ' '], "-");
    let mut s = String::new();
    let chars: Vec<char> = r.chars().collect();
    for (i, &c) in chars.iter().enumerate() {
        if i > 0 && c.is_ascii_uppercase() && chars[i - 1].is_ascii_lowercase() {
            s.push('-');
        }
        s.push(c);
    }
    let s: String = s
        .to_lowercase()
        .chars()
        .filter(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == '-')
        .collect();
    let mut collapsed = String::new();
    for c in s.chars() {
        if !(c == '-' && collapsed.ends_with('-')) {
            collapsed.push(c);
        }
    }
    collapsed.trim_matches('-').chars().take(64).collect()
}

pub fn valid_skill_name(name: &str) -> bool {
    let b = name.as_bytes();
    !b.is_empty()
        && b.len() <= 64
        && !name.contains("--")
        && b.iter()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || *c == b'-')
        && b[0] != b'-'
        && b[b.len() - 1] != b'-'
}

/// A skill source directory and its deployed name.
#[derive(Debug, Clone)]
pub struct SkillSource {
    pub name: String,
    pub dir: PathBuf,
    /// Root-level skill package: `.apm/` is not copied.
    pub is_package_root: bool,
}

pub fn find_skills(
    package: &Path,
    package_name: &str,
    include_root_skill: bool,
) -> Vec<SkillSource> {
    let mut out = Vec::new();
    if include_root_skill && package.join("SKILL.md").is_file() {
        let name = if valid_skill_name(package_name) {
            package_name.to_owned()
        } else {
            to_hyphen_case(package_name)
        };
        out.push(SkillSource {
            name,
            dir: package.to_path_buf(),
            is_package_root: true,
        });
    }
    for sub in [".apm/skills", "skills"] {
        let Ok(rd) = fs::read_dir(package.join(sub)) else {
            continue;
        };
        let mut dirs: Vec<PathBuf> = rd
            .flatten()
            .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
            .map(|e| e.path())
            .collect();
        dirs.sort();
        for d in dirs {
            if !d.join("SKILL.md").is_file()
                || out
                    .iter()
                    .any(|s: &SkillSource| s.is_package_root && sub == "skills")
            {
                continue;
            }
            let raw = d
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_owned();
            let name = if valid_skill_name(&raw) {
                raw
            } else {
                to_hyphen_case(&raw)
            };
            if !out.iter().any(|s: &SkillSource| s.name == name) {
                out.push(SkillSource {
                    name,
                    dir: d,
                    is_package_root: false,
                });
            }
        }
    }
    out
}

fn is_ignored_for_skill_copy(rel: &str, is_package_root: bool) -> bool {
    let first = rel.split('/').next().unwrap_or("");
    let file = rel.rsplit('/').next().unwrap_or("");
    (is_package_root && (first == ".apm" || first == "apm_modules"))
        || file.ends_with(".pyc")
        || file.ends_with(".pyo")
        || rel == hash::PIN_MARKER
}

fn rel_posix(root: &Path, p: &Path) -> String {
    p.strip_prefix(root)
        .unwrap_or(p)
        .to_string_lossy()
        .replace('\\', "/")
}

fn write_lf(path: &Path, content: &str) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, content.replace("\r\n", "\n"))
        .with_context(|| format!("writing {}", path.display()))
}

fn record(
    project_root: &Path,
    path: &Path,
    target: &'static str,
    out: &mut Vec<Deployed>,
) -> Result<()> {
    out.push(Deployed {
        path: rel_posix(project_root, path),
        target,
        hash: Some(hash::file_hash(path)?),
    });
    Ok(())
}

/// Split a top-level comma `applyTo` list, respecting `{a,b}` and `[...]` (`parse_apply_to`).
pub fn parse_apply_to(value: &str) -> Vec<String> {
    let mut segs = Vec::new();
    let mut cur = String::new();
    let (mut depth, mut class) = (0usize, false);
    let mut chars = value.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\\'
            && chars
                .peek()
                .is_some_and(|n| matches!(n, ',' | '\\' | '{' | '}' | '[' | ']'))
        {
            cur.push(chars.next().unwrap_or(','));
            continue;
        }
        if class {
            cur.push(c);
            if c == ']' {
                class = false;
            }
            continue;
        }
        match c {
            '[' => {
                class = true;
                cur.push(c);
            }
            '{' => {
                depth += 1;
                cur.push(c);
            }
            '}' => {
                depth = depth.saturating_sub(1);
                cur.push(c);
            }
            ',' if depth == 0 => segs.push(std::mem::take(&mut cur)),
            _ => cur.push(c),
        }
    }
    segs.push(cur);
    segs.into_iter()
        .map(|s| s.trim().to_owned())
        .filter(|s| !s.is_empty())
        .collect()
}

/// `normalize_apply_to`: scalar or list -> comma expression.
pub fn apply_to_of(meta: &IndexMap<String, Value>) -> String {
    match meta.get("applyTo") {
        Some(Value::Seq(items)) => items
            .iter()
            .filter_map(Value::to_plain_string)
            .map(|s| s.trim().to_owned())
            .filter(|s| !s.is_empty())
            .map(|s| s.replace('\\', "\\\\").replace(',', "\\,"))
            .collect::<Vec<_>>()
            .join(","),
        Some(v) => v.to_plain_string().unwrap_or_default(),
        None => String::new(),
    }
}

/// `_convert_to_claude_rules`.
pub fn convert_to_claude_rules(content: &str) -> Result<String> {
    let post = frontmatter::loads(content)?;
    let globs = parse_apply_to(&apply_to_of(&post.metadata));
    let body = post.raw_body.trim_start_matches('\n');
    if globs.is_empty() {
        return Ok(body.to_owned());
    }
    let mut parts = vec!["---".to_owned(), "paths:".to_owned()];
    for g in globs {
        parts.push(format!("  - {}", json_quote(&g)));
    }
    parts.push("---".into());
    Ok(format!("{}\n\n{body}", parts.join("\n")))
}

/// `json.dumps(value, ensure_ascii=True)`.
fn json_quote(s: &str) -> String {
    let mut o = String::from("\"");
    for c in s.chars() {
        match c {
            '"' => o.push_str("\\\""),
            '\\' => o.push_str("\\\\"),
            '\n' => o.push_str("\\n"),
            '\r' => o.push_str("\\r"),
            '\t' => o.push_str("\\t"),
            '\x08' => o.push_str("\\b"),
            '\x0c' => o.push_str("\\f"),
            c if (c as u32) < 0x20 || (c as u32) > 0x7e => {
                let mut buf = [0u16; 2];
                for u in c.encode_utf16(&mut buf) {
                    o.push_str(&format!("\\u{u:04x}"));
                }
            }
            c => o.push(c),
        }
    }
    o.push('"');
    o
}

fn valid_input_name(n: &str) -> bool {
    let b = n.as_bytes();
    !b.is_empty()
        && b.len() <= 64
        && b[0].is_ascii_alphabetic()
        && b.iter()
            .all(|c| c.is_ascii_alphanumeric() || *c == b'_' || *c == b'-')
}

/// `_extract_input_names`: list of names / single-key maps / mapping keys.
fn input_names(v: Option<&Value>) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    let mut accept = |n: String| {
        if valid_input_name(&n) && !out.contains(&n) {
            out.push(n);
        }
    };
    match v {
        Some(Value::Seq(items)) => {
            for i in items {
                match i {
                    Value::Map(m) => m.keys().cloned().for_each(&mut accept),
                    other => {
                        if let Some(s) = other.to_plain_string() {
                            accept(s);
                        }
                    }
                }
            }
        }
        Some(Value::Map(m)) => m.keys().cloned().for_each(&mut accept),
        Some(Value::Str(s)) => accept(s.clone()),
        _ => {}
    }
    out
}

/// `_transform_prompt_to_command`: returns (command name, file content).
pub fn prompt_to_claude_command(source: &Path) -> Result<(String, String)> {
    let text = fs::read_to_string(source)?;
    let post = frontmatter::loads(&text)?;
    let fname = source.file_name().and_then(|n| n.to_str()).unwrap_or("");
    let name = fname.strip_suffix(".prompt.md").map_or_else(
        || {
            source
                .file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_owned()
        },
        str::to_owned,
    );
    let md = &post.metadata;
    let mut meta = IndexMap::new();
    if let Some(v) = md.get("description") {
        meta.insert("description".to_owned(), v.clone());
    }
    if let Some(v) = md.get("allowed-tools").or_else(|| md.get("allowedTools")) {
        meta.insert("allowed-tools".to_owned(), v.clone());
    }
    if let Some(v) = md.get("model") {
        meta.insert("model".to_owned(), v.clone());
    }
    if let Some(v) = md.get("argument-hint").or_else(|| md.get("argumentHint")) {
        meta.insert("argument-hint".to_owned(), v.clone());
    }
    let inputs = input_names(md.get("input"));
    let mut content = post.content.clone();
    if !inputs.is_empty() {
        meta.insert(
            "arguments".to_owned(),
            Value::Seq(inputs.iter().map(Value::str).collect()),
        );
        if !meta.contains_key("argument-hint") {
            meta.insert(
                "argument-hint".to_owned(),
                Value::Str(
                    inputs
                        .iter()
                        .map(|n| format!("<{n}>"))
                        .collect::<Vec<_>>()
                        .join(" "),
                ),
            );
        }
        content = replace_input_refs(&content);
    }
    Ok((name, frontmatter::dumps(&meta, &content)))
}

/// `${input:name}` / `${{ input:name }}` -> `$name`.
fn replace_input_refs(s: &str) -> String {
    let mut out = String::new();
    let mut rest = s;
    while let Some(i) = rest.find("${") {
        out.push_str(&rest[..i]);
        let after = &rest[i + 2..];
        let (inner, double) = match after.strip_prefix('{') {
            Some(a) => (a, true),
            None => (after, false),
        };
        let t = inner.trim_start();
        let parsed = t
            .strip_prefix("input")
            .map(str::trim_start)
            .and_then(|t| t.strip_prefix(':'))
            .map(str::trim_start)
            .and_then(|t| {
                let end = t
                    .find(|c: char| !(c.is_alphanumeric() || c == '_' || c == '-'))
                    .unwrap_or(t.len());
                if end == 0 {
                    return None;
                }
                let name = &t[..end];
                let tail = t[end..].trim_start().strip_prefix('}')?;
                let tail = if double {
                    tail.strip_prefix('}').unwrap_or(tail)
                } else {
                    tail
                };
                Some((name.to_owned(), tail))
            });
        if let Some((name, tail)) = parsed {
            out.push('$');
            out.push_str(&name);
            rest = tail;
        } else {
            out.push_str("${");
            rest = after;
        }
    }
    out.push_str(rest);
    out
}

/// Lexical absolute normalization.
fn norm_abs(p: &Path) -> PathBuf {
    let abs = std::path::absolute(p).unwrap_or_else(|_| p.to_path_buf());
    let mut out = PathBuf::new();
    for c in abs.components() {
        match c {
            std::path::Component::ParentDir => {
                out.pop();
            }
            std::path::Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// `os.path.relpath(target, start)` with posix separators.
fn relpath(target: &Path, start: &Path) -> String {
    let t: Vec<_> = target.components().collect();
    let s: Vec<_> = start.components().collect();
    let common = t.iter().zip(&s).take_while(|(a, b)| a == b).count();
    let mut parts: Vec<String> = std::iter::repeat_n("..".to_owned(), s.len() - common).collect();
    parts.extend(
        t[common..]
            .iter()
            .map(|c| c.as_os_str().to_string_lossy().into_owned()),
    );
    if parts.is_empty() {
        ".".into()
    } else {
        parts.join("/")
    }
}

fn is_rewritable_link(link: &str) -> bool {
    let s = link.trim();
    if s.is_empty() || s.starts_with('#') || s.starts_with('/') {
        return false;
    }
    // Any URL scheme (`http:`, `mailto:`, ...) is left alone.
    if let Some(i) = s.find(':') {
        let scheme = &s[..i];
        if !scheme.is_empty()
            && scheme.as_bytes()[0].is_ascii_alphabetic()
            && scheme
                .bytes()
                .all(|c| c.is_ascii_alphanumeric() || matches!(c, b'+' | b'-' | b'.'))
        {
            return false;
        }
    }
    let lower = s.to_ascii_lowercase();
    !(lower.ends_with(".context.md") || lower.ends_with(".memory.md"))
}

/// In-package asset link rewriting (`LinkResolver._resolve_in_package_asset_link`):
/// a relative `[text](path)` that resolves (from `source`) to an existing file inside
/// `package_root` but outside `preserved_root` is rewritten relative to `target`'s directory.
pub fn rewrite_links(
    content: &str,
    source: &Path,
    target: &Path,
    package_root: &Path,
    preserved_root: Option<&Path>,
) -> String {
    let pkg = norm_abs(package_root);
    let preserved = preserved_root.map(norm_abs);
    let src_dir = norm_abs(source.parent().unwrap_or(Path::new(".")));
    let tgt_dir = norm_abs(target.parent().unwrap_or(Path::new(".")));
    let mut out = String::with_capacity(content.len());
    let mut rest = content;
    // LINK_PATTERN = \[([^\]]+)\]\(([^)]+)\)
    while let Some(open) = rest.find('[') {
        out.push_str(&rest[..open]);
        let after = &rest[open + 1..];
        let parsed = after.find(']').filter(|&i| i > 0).and_then(|close| {
            let tail = &after[close + 1..];
            let inner = tail.strip_prefix('(')?;
            let end = inner.find(')').filter(|&e| e > 0)?;
            Some((&after[..close], &inner[..end], close + end + 4))
        });
        let Some((text, link, consumed)) = parsed else {
            out.push('[');
            rest = after;
            continue;
        };
        let mut replacement = None;
        if is_rewritable_link(link) {
            let split = link.find(['#', '?']).unwrap_or(link.len());
            let (path_part, suffix) = link.split_at(split);
            if !path_part.is_empty() {
                let cand = norm_abs(&src_dir.join(path_part));
                let inside_preserved = preserved.as_ref().is_some_and(|p| cand.starts_with(p));
                if cand.is_file() && cand.starts_with(&pkg) && !inside_preserved {
                    replacement = Some(format!("[{text}]({}{suffix})", relpath(&cand, &tgt_dir)));
                }
            }
        }
        match replacement {
            Some(r) => out.push_str(&r),
            None => out.push_str(&rest[open..open + consumed]),
        }
        rest = &rest[open + consumed..];
    }
    out.push_str(rest);
    out
}

/// Options for one package deployment.
#[derive(Debug, Clone, Copy)]
pub struct PackageScope<'a> {
    pub package_dir: &'a Path,
    pub package_name: &'a str,
    /// Root-level primitives (`*.agent.md`, `SKILL.md`) are only scanned for dependencies.
    pub is_dependency: bool,
}

/// Deploy all primitives of one package into `targets`; returns deployed paths.
pub fn deploy_package(
    project_root: &Path,
    scope: PackageScope<'_>,
    targets: &[Target],
) -> Result<Vec<Deployed>> {
    let pkg = scope.package_dir;
    let dep = scope.is_dependency;
    let mut out = Vec::new();
    let instructions = find_instructions(pkg, dep);
    let prompts: Vec<PathBuf> = find_prompts(pkg, dep)
        .into_iter()
        .filter(|p| {
            fs::read_to_string(p)
                .ok()
                .and_then(|t| frontmatter::loads(&t).ok())
                .is_none_or(|post| !is_workflow_shape(&post.metadata))
        })
        .collect();
    let agents = find_agents(pkg, dep);
    let skills = find_skills(pkg, scope.package_name, dep);

    for t in targets {
        let gate = t.auto_create || project_root.join(t.root_dir).is_dir();
        if !gate {
            continue;
        }
        if let Some(mp) = t.instructions {
            let dir = project_root
                .join(mp.deploy_root.unwrap_or(t.root_dir))
                .join(mp.subdir);
            for src in &instructions {
                let fname = src.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let name = if mp.format == "claude_rules" {
                    format!(
                        "{}{}",
                        fname.trim_end_matches(".instructions.md"),
                        mp.extension
                    )
                } else {
                    fname.to_owned()
                };
                let dst = dir.join(name);
                let content = rewrite_links(&fs::read_to_string(src)?, src, &dst, pkg, None);
                let body = if mp.format == "claude_rules" {
                    convert_to_claude_rules(&content)?
                } else {
                    content
                };
                write_lf(&dst, &body)?;
                record(project_root, &dst, t.name, &mut out)?;
            }
        }
        if let Some(mp) = t.prompts {
            let dir = project_root
                .join(mp.deploy_root.unwrap_or(t.root_dir))
                .join(mp.subdir);
            for src in &prompts {
                let dst = dir.join(src.file_name().unwrap_or_default());
                write_lf(
                    &dst,
                    &rewrite_links(&fs::read_to_string(src)?, src, &dst, pkg, None),
                )?;
                record(project_root, &dst, t.name, &mut out)?;
            }
        }
        if let Some(mp) = t.commands {
            let dir = project_root
                .join(mp.deploy_root.unwrap_or(t.root_dir))
                .join(mp.subdir);
            for src in &prompts {
                let (name, body) = prompt_to_claude_command(src)?;
                let dst = dir.join(format!("{name}{}", mp.extension));
                write_lf(&dst, &rewrite_links(&body, src, &dst, pkg, None))?;
                record(project_root, &dst, t.name, &mut out)?;
            }
        }
        if let Some(mp) = t.agents {
            let dir = project_root
                .join(mp.deploy_root.unwrap_or(t.root_dir))
                .join(mp.subdir);
            for src in &agents {
                let fname = src.file_name().and_then(|n| n.to_str()).unwrap_or("");
                let stem = fname
                    .strip_suffix(".agent.md")
                    .or_else(|| fname.strip_suffix(".md"))
                    .unwrap_or(fname);
                let dst = dir.join(format!("{stem}{}", mp.extension));
                write_lf(
                    &dst,
                    &rewrite_links(&fs::read_to_string(src)?, src, &dst, pkg, None),
                )?;
                record(project_root, &dst, t.name, &mut out)?;
            }
        }
        if let Some(mp) = t.skills {
            let root = project_root
                .join(mp.deploy_root.unwrap_or(t.root_dir))
                .join(mp.subdir);
            for s in &skills {
                let dst_dir = root.join(&s.name);
                if out
                    .iter()
                    .any(|d: &Deployed| d.path == rel_posix(project_root, &dst_dir))
                {
                    continue; // shared deploy root already materialized by another target
                }
                out.push(Deployed {
                    path: rel_posix(project_root, &dst_dir),
                    target: t.name,
                    hash: None,
                });
                for rel in hash::package_files(&s.dir) {
                    if is_ignored_for_skill_copy(&rel, s.is_package_root) {
                        continue;
                    }
                    let dst = dst_dir.join(&rel);
                    if let Some(p) = dst.parent() {
                        fs::create_dir_all(p)?;
                    }
                    let from = s.dir.join(&rel);
                    fs::copy(&from, &dst).with_context(|| format!("copying skill file {rel}"))?;
                    if rel.ends_with(".md")
                        && let Ok(text) = fs::read_to_string(&from)
                    {
                        let rewritten = rewrite_links(&text, &from, &dst, pkg, Some(&s.dir));
                        if rewritten != text {
                            write_lf(&dst, &rewritten)?;
                        }
                    }
                    record(project_root, &dst, t.name, &mut out)?;
                }
            }
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    // Ported from tests/unit/integration/test_instruction_integrator.py (claude rules)
    #[test]
    fn claude_rules_conversion() {
        assert_eq!(
            convert_to_claude_rules(
                "---\napplyTo: \"**/*.{css,scss},**/*.py\"\ndescription: x\n---\n\n# Style\n"
            )
            .unwrap(),
            "---\npaths:\n  - \"**/*.{css,scss}\"\n  - \"**/*.py\"\n---\n\n# Style\n"
        );
        assert_eq!(
            convert_to_claude_rules("---\ndescription: x\n---\n\n# Global\n").unwrap(),
            "# Global\n"
        );
        assert_eq!(convert_to_claude_rules("# No fm\n").unwrap(), "# No fm\n");
        assert_eq!(
            convert_to_claude_rules("---\napplyTo:\n  - 'src/**'\n  - 'a,b'\n---\nBody\n").unwrap(),
            "---\npaths:\n  - \"src/**\"\n  - \"a,b\"\n---\n\nBody\n"
        );
    }

    #[test]
    fn apply_to_split() {
        assert_eq!(
            parse_apply_to("**/*.{css,scss},**/*.py"),
            vec!["**/*.{css,scss}", "**/*.py"]
        );
        assert_eq!(parse_apply_to(" , a ,, b ,"), vec!["a", "b"]);
        assert_eq!(parse_apply_to("[a,b]/x"), vec!["[a,b]/x"]);
        assert!(parse_apply_to("").is_empty());
    }

    // Ported from tests/unit/integration/test_command_integrator.py
    #[test]
    fn prompt_to_command_maps_frontmatter_and_inputs() {
        let t = tempfile::tempdir().unwrap();
        let p = t.path().join("review.prompt.md");
        fs::write(&p, "---\ndescription: Review code\nmode: agent\nallowedTools: [Read]\ninput:\n  - file\n  - focus: what\n---\n\nReview ${input:file} for ${{ input:focus }}.\n").unwrap();
        let (name, body) = prompt_to_claude_command(&p).unwrap();
        assert_eq!(name, "review");
        assert_eq!(
            body,
            "---\nallowed-tools:\n- Read\nargument-hint: <file> <focus>\narguments:\n- file\n- focus\ndescription: Review code\n---\n\nReview $file for $focus."
        );
    }

    #[test]
    fn skill_names() {
        assert!(valid_skill_name("my-skill"));
        assert!(!valid_skill_name("My_Skill"));
        assert_eq!(to_hyphen_case("owner/MyCool_Skill"), "my-cool-skill");
    }
}
