//! Flattening of fork crates into this crate: `ay flat sync` writes the generated modules from a
//! checkout of aphrody-labs/bun, `ay flat check` compares them with the fork, `ay flat list` shows
//! the manifest (`flat.toml`). Hand-written; everything else under `src/` is generated. Every fork
//! has its own manifest (`crates/<fork>-flat/flat.toml`), so the same code serves any fork whose
//! modules have a permissive license on the `deny.toml` allow-list.
//!
//! Each upstream crate becomes one module: a one-file crate is `src/<name>.rs`, a crate with more
//! files is `src/<name>/mod.rs` plus its other files at the same relative paths. The transform is
//! fixed and small so a resync is a pure function of the fork's files:
//! - `#![feature(..)]` lines move to the generated `lib.rs` (crate-level only in Rust);
//! - `bun_<crate>::` paths to another flattened crate become `crate::<module>::`;
//! - a one-line header records the fork commit and the source path.

use serde::Deserialize;
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::process::Command;

/// The manifest file, relative to this crate.
pub const MANIFEST: &str = "flat.toml";

/// `flat.toml`.
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct Manifest {
    /// GitHub repository of the fork (`aphrody-labs/bun`).
    pub fork: String,
    /// Full fork commit the generated files come from (empty before the first sync).
    pub commit: String,
    /// Prefix of the fork's own crate names (`bun_`): a path to a crate of the fork that is not
    /// flattened is refused. Absent: no such check.
    #[serde(default)]
    pub foreign_prefix: Option<String>,
    /// Hand-written modules of the flat crate, declared in the generated `lib.rs`.
    #[serde(default)]
    pub handwritten: Vec<String>,
    #[serde(rename = "module", default)]
    pub modules: Vec<Module>,
}

/// One flattened upstream crate.
#[derive(Debug, Clone, Deserialize, PartialEq)]
pub struct Module {
    /// Module name in this crate.
    pub name: String,
    /// Upstream package name (`bun_wyhash`).
    #[serde(rename = "crate")]
    pub krate: String,
    /// Source files relative to the fork root; the first one is the crate root.
    pub files: Vec<String>,
    /// SPDX license expression of the upstream source (`MIT`, `MIT OR Apache-2.0`), shown by
    /// `ay flat list` and checked against the `deny.toml` allow-list.
    pub license: String,
}

impl Manifest {
    pub fn parse(text: &str) -> Result<Self, String> {
        let m: Manifest = toml::from_str(text).map_err(|e| format!("{MANIFEST}: {e}"))?;
        if m.fork.trim().is_empty() {
            return Err(format!("{MANIFEST}: fork is empty"));
        }
        if !m.commit.is_empty() && !(m.commit.len() == 40 && m.commit.bytes().all(|b| b.is_ascii_hexdigit())) {
            return Err(format!("{MANIFEST}: commit {:?} is not a full 40-digit hash", m.commit));
        }
        for module in &m.modules {
            if module.files.is_empty() {
                return Err(format!("{MANIFEST}: module {} has no files", module.name));
            }
            if module.license.trim().is_empty() {
                return Err(format!("{MANIFEST}: module {} has no license", module.name));
            }
        }
        Ok(m)
    }

    /// Refuse a module whose license is missing, NOASSERTION/NONE, malformed or not allowed by
    /// `allow` (the `[licenses] allow` list of deny.toml). Every violation is reported.
    pub fn check_licenses(&self, allow: &[String]) -> Result<(), String> {
        let bad: Vec<String> = self
            .modules
            .iter()
            .filter_map(|m| match spdx_allowed(&m.license, allow) {
                Ok(true) => None,
                Ok(false) => Some(format!("module {}: license {:?} is not on the deny.toml allow-list", m.name, m.license)),
                Err(e) => Some(format!("module {}: {e}", m.name)),
            })
            .collect();
        if bad.is_empty() { Ok(()) } else { Err(bad.join("\n")) }
    }

    pub fn load_file(path: &Path) -> Result<Self, String> {
        let text = std::fs::read_to_string(path).map_err(|e| format!("{}: {e}", path.display()))?;
        Self::parse(&text)
    }

    pub fn load(crate_dir: &Path) -> Result<Self, String> {
        Self::load_file(&crate_dir.join(MANIFEST))
    }
}

/// `[licenses] allow` of a `deny.toml`.
pub fn allow_list(deny_toml: &str) -> Result<Vec<String>, String> {
    let v: toml::Value = toml::from_str(deny_toml).map_err(|e| format!("deny.toml: {e}"))?;
    let list = v
        .get("licenses")
        .and_then(|l| l.get("allow"))
        .and_then(|a| a.as_array())
        .ok_or("deny.toml: no [licenses] allow list")?;
    Ok(list.iter().filter_map(|x| x.as_str().map(str::to_string)).collect())
}

/// Whether an SPDX expression (`A`, `A OR B`, `A AND B`, `A WITH E`, parentheses) is satisfied by
/// `allow`: OR needs one allowed side, AND needs both. NOASSERTION, NONE and malformed expressions
/// are errors.
pub fn spdx_allowed(expr: &str, allow: &[String]) -> Result<bool, String> {
    let spaced = expr.replace('(', " ( ").replace(')', " ) ");
    let tokens: Vec<&str> = spaced.split_whitespace().collect();
    if tokens.is_empty() {
        return Err("license is empty".into());
    }
    if let Some(t) = tokens.iter().find(|t| matches!(t.to_ascii_uppercase().as_str(), "NOASSERTION" | "NONE")) {
        return Err(format!("license {t} is not a license"));
    }
    let mut pos = 0;
    let ok = spdx_or(&tokens, &mut pos, allow)?;
    if pos != tokens.len() {
        return Err(format!("license {expr:?}: unexpected {:?}", tokens[pos]));
    }
    Ok(ok)
}

fn spdx_or(t: &[&str], pos: &mut usize, allow: &[String]) -> Result<bool, String> {
    let mut ok = spdx_and(t, pos, allow)?;
    while t.get(*pos) == Some(&"OR") {
        *pos += 1;
        let rhs = spdx_and(t, pos, allow)?;
        ok = ok || rhs;
    }
    Ok(ok)
}

fn spdx_and(t: &[&str], pos: &mut usize, allow: &[String]) -> Result<bool, String> {
    let mut ok = spdx_atom(t, pos, allow)?;
    while t.get(*pos) == Some(&"AND") {
        *pos += 1;
        let rhs = spdx_atom(t, pos, allow)?;
        ok = ok && rhs;
    }
    Ok(ok)
}

fn spdx_atom(t: &[&str], pos: &mut usize, allow: &[String]) -> Result<bool, String> {
    let Some(&tok) = t.get(*pos) else { return Err("license ends early".into()) };
    *pos += 1;
    if tok == "(" {
        let ok = spdx_or(t, pos, allow)?;
        if t.get(*pos) != Some(&")") {
            return Err("license: missing )".into());
        }
        *pos += 1;
        return Ok(ok);
    }
    if matches!(tok, ")" | "OR" | "AND" | "WITH") {
        return Err(format!("license: unexpected {tok:?}"));
    }
    let mut id = tok.to_string();
    if t.get(*pos) == Some(&"WITH") {
        let Some(&exc) = t.get(*pos + 1) else { return Err("license: WITH without exception".into()) };
        id = format!("{tok} WITH {exc}");
        *pos += 2;
    }
    Ok(allow.iter().any(|a| *a == id))
}

/// Name of the license file at the root of the fork (`LICENSE`, `LICENSE.md`, `COPYING`, ...).
pub fn fork_license_file(fork_root: &Path) -> Result<String, String> {
    let entries = std::fs::read_dir(fork_root).map_err(|e| format!("{}: {e}", fork_root.display()))?;
    let mut names: Vec<String> = entries
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .map(|e| e.file_name().to_string_lossy().into_owned())
        .filter(|n| {
            let u = n.to_ascii_uppercase();
            ["LICENSE", "LICENCE", "COPYING", "UNLICENSE"].iter().any(|p| u.starts_with(p))
        })
        .collect();
    names.sort();
    names.into_iter().next().ok_or_else(|| format!("{}: no license file at the fork root", fork_root.display()))
}

/// Generated file set: path relative to the crate directory -> contents.
pub type Files = BTreeMap<PathBuf, String>;

fn header(fork: &str, commit: &str, source: &str) -> String {
    format!("// @generated by `ay flat sync` from {fork}@{commit} {source}. Edit the fork, then resync.\n")
}

fn is_ident(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'_'
}

/// Replace `from` with `to` where `from` is not preceded by an identifier character.
fn replace_path(text: &str, from: &str, to: &str) -> String {
    let bytes = text.as_bytes();
    let mut out = String::with_capacity(text.len());
    let mut last = 0;
    let mut search = 0;
    while let Some(pos) = text[search..].find(from) {
        let at = search + pos;
        if at == 0 || !is_ident(bytes[at - 1]) {
            out.push_str(&text[last..at]);
            out.push_str(to);
            last = at + from.len();
        }
        search = at + from.len();
    }
    out.push_str(&text[last..]);
    out
}

/// The transform of one source file: strip and collect `#![feature(..)]`, rewrite paths to the
/// other flattened crates, prepend the header.
pub fn transform(
    source: &str,
    renames: &[(String, String)],
    features: &mut BTreeSet<String>,
    head: &str,
) -> String {
    let mut body = String::with_capacity(source.len() + head.len());
    body.push_str(head);
    for line in source.split_inclusive('\n') {
        let t = line.trim();
        if let Some(inner) = t.strip_prefix("#![feature(").and_then(|r| r.strip_suffix(")]")) {
            for f in inner.split(',') {
                let f = f.trim();
                if !f.is_empty() {
                    features.insert(f.to_string());
                }
            }
            continue;
        }
        body.push_str(line);
    }
    for (from, to) in renames {
        body = replace_path(&body, from, to);
    }
    body
}

/// First `<prefix><name>::` path left after the renames (a dependency on a crate that is not flattened).
fn foreign_path(text: &str, prefix: &str) -> Option<String> {
    text.lines().filter(|l| !l.trim_start().starts_with("//")).find_map(|l| foreign_in_line(l, prefix))
}

fn foreign_in_line(text: &str, prefix: &str) -> Option<String> {
    let bytes = text.as_bytes();
    let n = prefix.len();
    let mut from = 0;
    while let Some(pos) = text[from..].find(prefix) {
        let at = from + pos;
        let mut end = at + n;
        while end < bytes.len() && is_ident(bytes[end]) {
            end += 1;
        }
        let standalone = at == 0 || !is_ident(bytes[at - 1]);
        if standalone && end > at + n && text[end..].starts_with("::") {
            return Some(text[at..end].to_string());
        }
        from = end.max(at + n);
    }
    None
}

fn module_paths(module: &Module) -> Vec<(String, PathBuf)> {
    let root = Path::new(&module.files[0]);
    let base = root.parent().map(Path::to_path_buf).unwrap_or_default();
    if module.files.len() == 1 {
        return vec![(module.files[0].clone(), PathBuf::from("src").join(format!("{}.rs", module.name)))];
    }
    module
        .files
        .iter()
        .enumerate()
        .map(|(i, f)| {
            let rel = if i == 0 {
                PathBuf::from("mod.rs")
            } else {
                Path::new(f).strip_prefix(&base).map(Path::to_path_buf).unwrap_or_else(|_| PathBuf::from(f))
            };
            (f.clone(), PathBuf::from("src").join(&module.name).join(rel))
        })
        .collect()
}

fn lib_rs(manifest: &Manifest, commit: &str, features: &BTreeSet<String>) -> String {
    let mut s = header(&manifest.fork, commit, MANIFEST);
    s.push_str(
        &format!(
            "//! Leaf crates of the {} fork, flattened into one crate (one module per upstream\n\
             //! crate) so `ay` links them without the fork checked out. Manifest: `flat.toml`; plan:\n\
             //! docs/ay/MIGRATION.md. The modules are verbatim upstream code.\n",
            manifest.fork
        ),
    );
    for f in features {
        s.push_str(&format!("#![feature({f})]\n"));
    }
    s.push_str("#![allow(clippy::all, clippy::pedantic)]\n\n");
    for m in &manifest.modules {
        s.push_str(&format!("/// `{}` ({}), {}.\npub mod {};\n", m.krate, m.files[0], m.license, m.name));
    }
    if !manifest.handwritten.is_empty() {
        s.push('\n');
    }
    for h in &manifest.handwritten {
        s.push_str(&format!("/// Hand-written: `ay flat sync|check|list`.\npub mod {h};\n"));
    }
    s
}

/// Generate every file from the fork's working tree, with `commit` in the headers.
pub fn generate(manifest: &Manifest, fork_root: &Path, commit: &str) -> Result<Files, String> {
    generate_with(manifest, commit, &|source| {
        let path = fork_root.join(source);
        std::fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path.display()))
    })
}

/// Generate every file from the fork's object store at `commit` (`git show <commit>:<path>`), so the
/// check does not depend on where the checkout's HEAD is.
pub fn generate_at(manifest: &Manifest, fork_root: &Path, commit: &str) -> Result<Files, String> {
    generate_with(manifest, commit, &|source| git(fork_root, &["show", &format!("{commit}:{source}")]))
}

/// Paths among the manifest's files that changed in the fork between `commit` and HEAD.
pub fn moved_upstream(manifest: &Manifest, fork_root: &Path, commit: &str) -> Result<Vec<String>, String> {
    let mut args: Vec<&str> = vec!["diff", "--name-only", commit, "HEAD", "--"];
    args.extend(manifest.modules.iter().flat_map(|m| m.files.iter().map(String::as_str)));
    Ok(git(fork_root, &args)?.lines().map(str::to_string).filter(|l| !l.is_empty()).collect())
}

fn git(fork_root: &Path, args: &[&str]) -> Result<String, String> {
    let out = Command::new("git")
        .arg("-C")
        .arg(fork_root)
        .args(args)
        .output()
        .map_err(|e| format!("git: {e}"))?;
    if !out.status.success() {
        return Err(format!("git {}: {}", args.join(" "), String::from_utf8_lossy(&out.stderr).trim()));
    }
    Ok(String::from_utf8_lossy(&out.stdout).into_owned())
}

fn generate_with(
    manifest: &Manifest,
    commit: &str,
    read: &dyn Fn(&str) -> Result<String, String>,
) -> Result<Files, String> {
    let renames: Vec<(String, String)> = manifest
        .modules
        .iter()
        .map(|m| (format!("{}::", m.krate), format!("crate::{}::", m.name)))
        .collect();
    let mut features = BTreeSet::new();
    let mut files = Files::new();
    for module in &manifest.modules {
        for (source, dest) in module_paths(module) {
            let text = read(&source)?;
            let head = header(&manifest.fork, commit, &source);
            let out = transform(&text, &renames, &mut features, &head);
            if let Some(dep) = manifest.foreign_prefix.as_deref().and_then(|p| foreign_path(&out, p)) {
                return Err(format!(
                    "{source} uses {dep}::, a fork crate that is not flattened: move module {} to a path dependency (docs/ay/MIGRATION.md section 3)",
                    module.name
                ));
            }
            files.insert(dest, out);
        }
    }
    files.insert(PathBuf::from("src/lib.rs"), lib_rs(manifest, commit, &features));
    Ok(files)
}

/// Full commit of the fork checkout's HEAD; refuses a checkout whose flattened files are modified.
pub fn fork_head(fork_root: &Path, manifest: &Manifest) -> Result<String, String> {
    let mut status: Vec<&str> = vec!["status", "--porcelain", "--"];
    status.extend(manifest.modules.iter().flat_map(|m| m.files.iter().map(String::as_str)));
    let dirty = git(fork_root, &status)?;
    if !dirty.trim().is_empty() {
        return Err(format!("fork has uncommitted changes in flattened files:\n{dirty}"));
    }
    Ok(git(fork_root, &["rev-parse", "HEAD"])?.trim().to_string())
}

/// Files whose contents on disk differ from `files` (missing files included).
pub fn differences(crate_dir: &Path, files: &Files) -> Vec<PathBuf> {
    files
        .iter()
        .filter(|(rel, want)| std::fs::read_to_string(crate_dir.join(rel)).ok().as_deref() != Some(want.as_str()))
        .map(|(rel, _)| rel.clone())
        .collect()
}

/// Write the generated files and record `commit` in `flat.toml`. Returns the files that changed.
pub fn write(crate_dir: &Path, files: &Files, commit: &str) -> Result<Vec<PathBuf>, String> {
    let changed = differences(crate_dir, files);
    for rel in &changed {
        let path = crate_dir.join(rel);
        if let Some(dir) = path.parent() {
            std::fs::create_dir_all(dir).map_err(|e| format!("{}: {e}", dir.display()))?;
        }
        std::fs::write(&path, &files[rel]).map_err(|e| format!("{}: {e}", path.display()))?;
    }
    let mpath = crate_dir.join(MANIFEST);
    let text = std::fs::read_to_string(&mpath).map_err(|e| format!("{}: {e}", mpath.display()))?;
    let updated = set_commit(&text, commit);
    if updated != text {
        std::fs::write(&mpath, updated).map_err(|e| format!("{}: {e}", mpath.display()))?;
    }
    Ok(changed)
}

/// Rewrite the `commit = "..."` line of the manifest.
pub fn set_commit(manifest_text: &str, commit: &str) -> String {
    manifest_text
        .split_inclusive('\n')
        .map(|line| {
            if line.starts_with("commit = ") {
                let nl = if line.ends_with('\n') { "\n" } else { "" };
                format!("commit = \"{commit}\"{nl}")
            } else {
                line.to_string()
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn transform_hoists_features_and_renames_paths() {
        let mut features = BTreeSet::new();
        let renames = vec![("bun_wyhash::".to_string(), "crate::wyhash::".to_string())];
        let out = transform(
            "//! doc\n#![feature(a, b)]\nuse bun_wyhash::Wyhash;\nlet x = my_bun_wyhash::y;\n",
            &renames,
            &mut features,
            "// h\n",
        );
        assert_eq!(out, "// h\n//! doc\nuse crate::wyhash::Wyhash;\nlet x = my_bun_wyhash::y;\n");
        assert_eq!(features.into_iter().collect::<Vec<_>>(), ["a", "b"]);
    }

    #[test]
    fn foreign_paths_outside_comments() {
        assert_eq!(foreign_path("//! uses `bun_collections::index_sort`\nlet x = 1;", "bun_"), None);
        assert_eq!(foreign_path("use bun_core::strings;", "bun_"), Some("bun_core".to_string()));
        assert_eq!(foreign_path("let my_bun_x::y = crate::bun_flat;", "bun_"), None);
    }

    #[test]
    fn module_layout() {
        let one = Module { name: "w".into(), krate: "bun_w".into(), files: vec!["src/w/lib.rs".into()], license: "MIT".into() };
        assert_eq!(module_paths(&one), [("src/w/lib.rs".to_string(), PathBuf::from("src/w.rs"))]);
        let many = Module {
            name: "semver".into(),
            krate: "bun_semver".into(),
            files: vec!["src/semver/lib.rs".into(), "src/semver/Version.rs".into()],
            license: "MIT".into(),
        };
        assert_eq!(
            module_paths(&many),
            [
                ("src/semver/lib.rs".to_string(), PathBuf::from("src/semver/mod.rs")),
                ("src/semver/Version.rs".to_string(), PathBuf::from("src/semver/Version.rs")),
            ]
        );
    }

    #[test]
    fn manifest_and_commit_line() {
        let text = "fork = \"o/b\"\ncommit = \"\"\n\n[[module]]\nname = \"w\"\ncrate = \"bun_w\"\nfiles = [\"x.rs\"]\nlicense = \"MIT\"\n";
        let m = Manifest::parse(text).unwrap();
        assert_eq!(m.modules[0].krate, "bun_w");
        assert!(set_commit(text, "abc").contains("commit = \"abc\"\n"));
        assert!(Manifest::parse("fork = \"o\"\ncommit = \"\"\n[[module]]\nname=\"w\"\ncrate=\"c\"\nfiles=[]\nlicense=\"\"\n").is_err());
    }

    fn allow() -> Vec<String> {
        ["MIT", "Apache-2.0", "Apache-2.0 WITH LLVM-exception", "BSD-2-Clause"].map(String::from).to_vec()
    }

    #[test]
    fn spdx_expressions() {
        let a = allow();
        assert_eq!(spdx_allowed("MIT", &a), Ok(true));
        assert_eq!(spdx_allowed("MIT OR Apache-2.0", &a), Ok(true));
        assert_eq!(spdx_allowed("GPL-3.0-only OR MIT", &a), Ok(true));
        assert_eq!(spdx_allowed("GPL-3.0-only", &a), Ok(false));
        assert_eq!(spdx_allowed("MIT AND GPL-3.0-only", &a), Ok(false));
        assert_eq!(spdx_allowed("MIT AND (GPL-2.0-only OR BSD-2-Clause)", &a), Ok(true));
        assert_eq!(spdx_allowed("Apache-2.0 WITH LLVM-exception", &a), Ok(true));
        assert_eq!(spdx_allowed("MIT WITH Classpath-exception-2.0", &a), Ok(false));
    }

    #[test]
    fn spdx_refuses_missing_noassertion_and_malformed() {
        let a = allow();
        assert!(spdx_allowed("", &a).is_err());
        assert!(spdx_allowed("NOASSERTION", &a).is_err());
        assert!(spdx_allowed("none", &a).is_err());
        assert!(spdx_allowed("MIT OR", &a).is_err());
        assert!(spdx_allowed("(MIT", &a).is_err());
        assert!(spdx_allowed("MIT Apache-2.0", &a).is_err());
    }

    #[test]
    fn manifest_license_gate() {
        let text = |lic: &str| format!("fork = \"o/b\"\ncommit = \"\"\n[[module]]\nname = \"w\"\ncrate = \"c\"\nfiles = [\"x.rs\"]\nlicense = \"{lic}\"\n");
        assert!(Manifest::parse(&text("MIT")).unwrap().check_licenses(&allow()).is_ok());
        assert!(Manifest::parse(&text("LicenseRef-Proprietary")).unwrap().check_licenses(&allow()).is_err());
        assert!(Manifest::parse(&text("NOASSERTION")).unwrap().check_licenses(&allow()).is_err());
        assert!(Manifest::parse(&text("")).is_err());
        assert!(Manifest::parse("fork = \"o/b\"\ncommit = \"abc\"\n").is_err());
    }

    #[test]
    fn allow_list_of_deny_toml() {
        assert_eq!(allow_list("[licenses]\nallow = [\"MIT\", \"ISC\"]\n").unwrap(), ["MIT", "ISC"]);
        assert!(allow_list("[bans]\n").is_err());
    }

    #[test]
    fn license_file_of_a_fork() {
        let dir = std::env::temp_dir().join(format!("flat-lic-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        assert!(fork_license_file(&dir).is_err());
        std::fs::write(dir.join("LICENSE-MIT"), "x").unwrap();
        assert_eq!(fork_license_file(&dir).unwrap(), "LICENSE-MIT");
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn lib_rs_declares_handwritten_modules_only_when_listed() {
        let base = "fork = \"o/b\"\ncommit = \"\"\n[[module]]\nname = \"w\"\ncrate = \"c\"\nfiles = [\"x.rs\"]\nlicense = \"MIT\"\n";
        let none = lib_rs(&Manifest::parse(base).unwrap(), "c", &BTreeSet::new());
        assert!(!none.contains("pub mod sync;") && none.contains("pub mod w;") && none.contains("o/b fork"));
        let some = lib_rs(&Manifest::parse(&format!("handwritten = [\"sync\"]\n{base}")).unwrap(), "c", &BTreeSet::new());
        assert!(some.contains("pub mod sync;"));
    }

    /// The generated files on disk are exactly what the fork produces (when the fork is checked out).
    #[test]
    fn generated_files_match_the_fork() {
        let crate_dir = Path::new(env!("CARGO_MANIFEST_DIR"));
        let fork = crate_dir.join("../../third_party/bun");
        let m = Manifest::load(crate_dir).unwrap();
        if !fork.join(".git").exists() || m.commit.is_empty() {
            return;
        }
        let Ok(files) = generate_at(&m, &fork, &m.commit) else { return };
        assert_eq!(differences(crate_dir, &files), Vec::<PathBuf>::new(), "run `ay flat sync`");
    }
}
