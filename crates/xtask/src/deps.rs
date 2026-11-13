//! Supply-chain policy (docs/deps/POLICY.md) behind `ay doctor --deps` and `ay lock --deps`.
//!
//! - `check`: conformance of every first-party manifest (Cargo, bun, uv, containers, tools.toml,
//!   src.lock.json) with the policy; errors fail the command, warnings are reported.
//! - `hoist`: moves inline crates.io requirements of workspace members into the root
//!   `[workspace.dependencies]` and turns exact `=` pins into caret requirements (the exact
//!   version lives in `Cargo.lock`).
//! - `lock`: refreshes the language locks (Cargo.lock, bun.lock, uv.lock), optionally upgrading;
//!   `breaking` raises majors from the crates.io sparse index.
//! - `dups`: crates resolved at more than one version in `Cargo.lock`.

use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use toml_edit::{DocumentMut, InlineTable, Item, Value};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub enum Level {
    Warn,
    Error,
}

#[derive(Debug, Clone)]
pub struct Finding {
    pub level: Level,
    pub rule: &'static str,
    pub path: String,
    pub msg: String,
}

fn push(out: &mut Vec<Finding>, level: Level, rule: &'static str, path: &str, msg: String) {
    out.push(Finding {
        level,
        rule,
        path: path.to_string(),
        msg,
    });
}

fn read(path: &Path) -> Option<String> {
    fs::read_to_string(path).ok()
}

fn parse(path: &Path) -> Option<DocumentMut> {
    read(path)?.parse::<DocumentMut>().ok()
}

const DEP_TABLES: &[&str] = &["dependencies", "dev-dependencies", "build-dependencies"];

// ---------------------------------------------------------------------------------------------
// Cargo
// ---------------------------------------------------------------------------------------------

/// `name -> versions` for every crate resolved more than once in `Cargo.lock`.
pub fn cargo_dups(root: &Path) -> BTreeMap<String, Vec<String>> {
    let mut all: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    for (name, version, _) in cargo_lock_packages(root) {
        all.entry(name).or_default().insert(version);
    }
    all.into_iter()
        .filter(|(_, v)| v.len() > 1)
        .map(|(k, v)| (k, v.into_iter().collect()))
        .collect()
}

/// `(name, version, source)` of every `[[package]]` in `Cargo.lock`.
fn cargo_lock_packages(root: &Path) -> Vec<(String, String, String)> {
    let Some(doc) = parse(&root.join("Cargo.lock")) else {
        return Vec::new();
    };
    let Some(pkgs) = doc.get("package").and_then(Item::as_array_of_tables) else {
        return Vec::new();
    };
    pkgs.iter()
        .filter_map(|t| {
            let name = t.get("name")?.as_str()?.to_string();
            let version = t.get("version")?.as_str()?.to_string();
            let source = t.get("source").and_then(Item::as_str).unwrap_or("").to_string();
            Some((name, version, source))
        })
        .collect()
}

/// Workspace member directories, from `[workspace] members` (literal paths and `dir/*` globs).
pub fn cargo_members(root: &Path) -> Vec<PathBuf> {
    let Some(doc) = parse(&root.join("Cargo.toml")) else {
        return Vec::new();
    };
    let list = |key: &str| -> Vec<String> {
        doc.get("workspace")
            .and_then(|w| w.get(key))
            .and_then(Item::as_array)
            .map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
            .unwrap_or_default()
    };
    let exclude: BTreeSet<PathBuf> = list("exclude").iter().map(|e| root.join(e)).collect();
    let mut out = Vec::new();
    for m in list("members") {
        if let Some(base) = m.strip_suffix("/*") {
            if let Ok(rd) = fs::read_dir(root.join(base)) {
                let mut dirs: Vec<PathBuf> = rd
                    .flatten()
                    .map(|e| e.path())
                    .filter(|p| p.join("Cargo.toml").is_file())
                    .collect();
                dirs.sort();
                out.extend(dirs);
            }
        } else if root.join(&m).join("Cargo.toml").is_file() {
            out.push(root.join(&m));
        }
    }
    out.retain(|p| !exclude.contains(p));
    out
}

/// Every dependency table of a manifest: top-level and `[target.<cfg>.*]`, as `(label, table)`.
fn dep_tables_mut(doc: &mut DocumentMut) -> Vec<(String, &mut dyn toml_edit::TableLike)> {
    let mut out: Vec<(String, &mut dyn toml_edit::TableLike)> = Vec::new();
    for (key, item) in doc.as_table_mut().iter_mut() {
        let key = key.get().to_string();
        if DEP_TABLES.contains(&key.as_str()) {
            if let Some(t) = item.as_table_like_mut() {
                out.push((key, t));
            }
        } else if key == "target" {
            if let Some(targets) = item.as_table_like_mut() {
                for (cfg, titem) in targets.iter_mut() {
                    let cfg = cfg.get().to_string();
                    if let Some(tt) = titem.as_table_like_mut() {
                        for (k, d) in tt.iter_mut() {
                            let k = k.get().to_string();
                            if DEP_TABLES.contains(&k.as_str()) {
                                if let Some(t) = d.as_table_like_mut() {
                                    out.push((format!("target.{cfg}.{k}"), t));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    out
}

/// How a member declares one dependency.
#[derive(Debug, Clone, Default)]
struct DepSpec {
    version: Option<String>,
    package: Option<String>,
    features: Vec<String>,
    optional: bool,
    default_features: Option<bool>,
    workspace: bool,
    path: bool,
    git: Option<String>,
    other: Vec<String>,
}

fn dep_spec(item: &Item) -> DepSpec {
    let mut s = DepSpec::default();
    if let Some(v) = item.as_str() {
        s.version = Some(v.to_string());
        return s;
    }
    let Some(t) = item.as_table_like() else {
        return s;
    };
    for (k, v) in t.iter() {
        match k {
            "version" => s.version = v.as_str().map(str::to_string),
            "package" => s.package = v.as_str().map(str::to_string),
            "features" => {
                s.features = v
                    .as_array()
                    .map(|a| a.iter().filter_map(|x| x.as_str().map(str::to_string)).collect())
                    .unwrap_or_default()
            }
            "optional" => s.optional = v.as_bool().unwrap_or(false),
            "default-features" | "default_features" => s.default_features = v.as_bool(),
            "workspace" => s.workspace = v.as_bool().unwrap_or(false),
            "path" => s.path = true,
            "git" => s.git = v.as_str().map(str::to_string),
            other => s.other.push(other.to_string()),
        }
    }
    s
}

/// `(major, minor, patch, prerelease)` of the first comparator of a requirement.
fn parse_ver(req: &str) -> Option<(u64, u64, u64, bool)> {
    let first = req.split(',').next()?.trim();
    let v = first.trim_start_matches(['=', '^', '~', '>', '<', ' ']);
    let v = v.split('+').next()?;
    let (core, pre) = match v.split_once('-') {
        Some((c, _)) => (c, true),
        None => (v, false),
    };
    let mut it = core.split('.');
    let major = it.next()?.parse().ok()?;
    let minor = it.next().map_or(Some(0), |x| x.parse().ok())?;
    let patch = it.next().map_or(Some(0), |x| x.parse().ok())?;
    Some((major, minor, patch, pre))
}

/// Same caret bucket: Cargo resolves both requirements to one version.
fn caret_compatible(a: &str, b: &str) -> bool {
    match (parse_ver(a), parse_ver(b)) {
        (Some(x), Some(y)) => {
            if x.0 != y.0 {
                false
            } else if x.0 > 0 {
                true
            } else if x.1 != y.1 {
                false
            } else if x.1 > 0 {
                true
            } else {
                x.2 == y.2
            }
        }
        _ => false,
    }
}

fn is_prerelease(req: &str) -> bool {
    parse_ver(req).is_some_and(|v| v.3)
}

fn ws_deps(doc: &DocumentMut) -> BTreeMap<String, DepSpec> {
    doc.get("workspace")
        .and_then(|w| w.get("dependencies"))
        .and_then(Item::as_table_like)
        .map(|t| t.iter().map(|(k, v)| (k.to_string(), dep_spec(v))).collect())
        .unwrap_or_default()
}

fn rel(root: &Path, p: &Path) -> String {
    p.strip_prefix(root)
        .unwrap_or(p)
        .to_string_lossy()
        .replace('\\', "/")
}

/// Allowed git sources from `deny.toml` `[sources] allow-git`.
fn deny_allow_git(root: &Path) -> Option<Vec<String>> {
    let doc = parse(&root.join("deny.toml"))?;
    Some(
        doc.get("sources")
            .and_then(|s| s.get("allow-git"))
            .and_then(Item::as_array)
            .map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
            .unwrap_or_default(),
    )
}

fn check_cargo(root: &Path, out: &mut Vec<Finding>) {
    let Some(root_doc) = parse(&root.join("Cargo.toml")) else {
        return;
    };
    let ws = ws_deps(&root_doc);
    for (name, spec) in &ws {
        if let Some(v) = &spec.version {
            if v.trim() == "*" {
                push(out, Level::Error, "CARGO-WILDCARD", "Cargo.toml", format!("{name} = \"*\""));
            } else if is_prerelease(v) && !spec.path {
                push(out, Level::Warn, "CARGO-PRERELEASE", "Cargo.toml", format!("{name} {v}"));
            }
        }
    }
    for dir in cargo_members(root) {
        let manifest = dir.join("Cargo.toml");
        let Some(mut doc) = parse(&manifest) else {
            continue;
        };
        let path = rel(root, &manifest);
        for (label, table) in dep_tables_mut(&mut doc) {
            for (name, item) in table.iter() {
                let s = dep_spec(item);
                if s.workspace {
                    continue;
                }
                let key = name;
                if s.path {
                    if ws.contains_key(key) {
                        push(out, Level::Warn, "CARGO-PATH", &path, format!("[{label}] {key}: path dependency already in [workspace.dependencies]"));
                    }
                    continue;
                }
                if s.git.is_some() {
                    push(out, Level::Error, "CARGO-GIT", &path, format!("[{label}] {key}: git dependency outside [workspace.dependencies] / [patch]"));
                    continue;
                }
                push(out, Level::Error, "CARGO-INLINE", &path, format!("[{label}] {key} = {:?}: not inherited from [workspace.dependencies] (ay lock --deps --hoist)", s.version.unwrap_or_default()));
            }
        }
    }
    // Git and registry sources resolved in Cargo.lock.
    let allow = deny_allow_git(root);
    if allow.is_none() {
        push(out, Level::Error, "CARGO-DENY", "deny.toml", "missing: cargo-deny policy is required".into());
    }
    let allow = allow.unwrap_or_default();
    let mut seen = BTreeSet::new();
    for (name, _, source) in cargo_lock_packages(root) {
        if let Some(git) = source.strip_prefix("git+") {
            let url = git.split(['?', '#']).next().unwrap_or(git).trim_end_matches(".git").to_string();
            if !allow.iter().any(|a| a.trim_end_matches(".git") == url) && seen.insert(url.clone()) {
                push(out, Level::Error, "CARGO-GIT", "Cargo.lock", format!("{name}: {url} not in deny.toml allow-git"));
            }
        } else if source.starts_with("registry+") && !source.contains("github.com/rust-lang/crates.io-index") {
            push(out, Level::Error, "CARGO-REGISTRY", "Cargo.lock", format!("{name}: {source}"));
        } else if source.starts_with("sparse+") && !source.contains("index.crates.io") {
            push(out, Level::Error, "CARGO-REGISTRY", "Cargo.lock", format!("{name}: {source}"));
        }
    }
    let dups = cargo_dups(root);
    if !dups.is_empty() {
        let extra: usize = dups.values().map(|v| v.len() - 1).sum();
        push(out, Level::Warn, "CARGO-DUP", "Cargo.lock", format!("{} crates resolved at several versions ({extra} extra copies; ay doctor --deps --dups)", dups.len()));
    }
    // Toolchain pin.
    if let Some(doc) = parse(&root.join("rust-toolchain.toml")) {
        let channel = doc
            .get("toolchain")
            .and_then(|t| t.get("channel"))
            .and_then(Item::as_str)
            .unwrap_or("");
        let dated = channel
            .strip_prefix("nightly-")
            .is_some_and(|d| d.len() == 10 && d.as_bytes()[4] == b'-' && d.as_bytes()[7] == b'-');
        let stable = parse_ver(channel).is_some();
        if !dated && !stable {
            push(out, Level::Error, "RUST-PIN", "rust-toolchain.toml", format!("channel = {channel:?}: pin a dated nightly (nightly-YYYY-MM-DD) or a release"));
        }
    }
}

// ---------------------------------------------------------------------------------------------
// bun
// ---------------------------------------------------------------------------------------------

const NODE_TOOLS: &[&str] = &[
    "node", "npx", "npm", "pnpm", "pnpx", "yarn", "tsc", "ts-node", "tsx", "prettier", "eslint",
    "biome", "oxlint", "jest", "vitest", "vite", "esbuild", "webpack", "rollup",
];

/// Directories of the bun workspaces declared in the root `package.json`.
pub fn bun_workspaces(root: &Path, pkg: &serde_json::Value) -> Vec<PathBuf> {
    let globs: Vec<String> = match pkg.get("workspaces") {
        Some(serde_json::Value::Array(a)) => a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect(),
        Some(serde_json::Value::Object(o)) => o
            .get("packages")
            .and_then(|p| p.as_array())
            .map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
            .unwrap_or_default(),
        _ => Vec::new(),
    };
    let mut out = Vec::new();
    for g in globs {
        if let Some(base) = g.strip_suffix("/*") {
            if let Ok(rd) = fs::read_dir(root.join(base)) {
                let mut dirs: Vec<PathBuf> = rd
                    .flatten()
                    .map(|e| e.path())
                    .filter(|p| p.join("package.json").is_file())
                    .collect();
                dirs.sort();
                out.extend(dirs);
            }
        } else if root.join(&g).join("package.json").is_file() {
            out.push(root.join(&g));
        }
    }
    out
}

fn bun_catalog(pkg: &serde_json::Value) -> serde_json::Map<String, serde_json::Value> {
    let mut cat = serde_json::Map::new();
    for holder in [Some(pkg), pkg.get("workspaces")].into_iter().flatten() {
        if let Some(c) = holder.get("catalog").and_then(|c| c.as_object()) {
            cat.extend(c.clone());
        }
    }
    cat
}

fn script_uses_node(body: &str) -> Option<&'static str> {
    for segment in body.split(['&', '|', ';']) {
        let mut words = segment.split_whitespace();
        let first = words.next().unwrap_or("");
        let cmd = if first == "bunx" || (first == "bun" && segment.contains(" x ")) {
            words.next().unwrap_or("")
        } else {
            first
        };
        if let Some(t) = NODE_TOOLS.iter().find(|t| **t == cmd) {
            return Some(t);
        }
    }
    None
}

/// A Windows drive path (`C:/`, `D:\`) anywhere in a script.
fn has_drive_path(body: &str) -> bool {
    body.as_bytes()
        .windows(3)
        .any(|w| w[0].is_ascii_alphabetic() && w[1] == b':' && (w[2] == b'/' || w[2] == b'\\'))
}

fn check_bun(root: &Path, out: &mut Vec<Finding>) {
    let Some(text) = read(&root.join("package.json")) else {
        return;
    };
    let Ok(pkg) = serde_json::from_str::<serde_json::Value>(&text) else {
        push(out, Level::Error, "JS-MANIFEST", "package.json", "invalid JSON".into());
        return;
    };
    let catalog = bun_catalog(&pkg);
    for (name, v) in &catalog {
        let v = v.as_str().unwrap_or("");
        if v.is_empty() || v == "*" || v == "latest" || v.starts_with('^') || v.starts_with('~') || v.starts_with('>') {
            push(out, Level::Error, "JS-CATALOG-PIN", "package.json", format!("catalog {name} = {v:?}: exact version required (bun.lock holds the integrity hash)"));
        }
    }
    let mut manifests = vec![root.join("package.json")];
    manifests.extend(bun_workspaces(root, &pkg).into_iter().map(|d| d.join("package.json")));
    for m in manifests {
        let path = rel(root, &m);
        let Some(p) = read(&m).and_then(|t| serde_json::from_str::<serde_json::Value>(&t).ok()) else {
            push(out, Level::Error, "JS-MANIFEST", &path, "unreadable or invalid JSON".into());
            continue;
        };
        for section in ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"] {
            let Some(deps) = p.get(section).and_then(|d| d.as_object()) else {
                continue;
            };
            for (name, spec) in deps {
                let spec = spec.as_str().unwrap_or("");
                let local = spec.starts_with("workspace:") || spec.starts_with("catalog:") || spec.starts_with("link:") || spec.starts_with("file:");
                if local {
                    if spec.starts_with("catalog:") && spec == "catalog:" && !catalog.contains_key(name) {
                        push(out, Level::Error, "JS-CATALOG", &path, format!("{section}.{name}: catalog: without a root catalog entry"));
                    }
                    continue;
                }
                if section == "peerDependencies" {
                    continue;
                }
                if spec.is_empty() || spec == "*" || spec == "latest" || spec == "next" {
                    push(out, Level::Error, "JS-FLOAT", &path, format!("{section}.{name} = {spec:?}: floating version"));
                } else {
                    push(out, Level::Error, "JS-CATALOG", &path, format!("{section}.{name} = {spec:?}: use \"catalog:\" (one version per package, root catalog)"));
                }
            }
        }
        if let Some(scripts) = p.get("scripts").and_then(|s| s.as_object()) {
            for (name, body) in scripts {
                let body = body.as_str().unwrap_or("");
                if ["preinstall", "install", "postinstall", "prepare"].contains(&name.as_str()) {
                    push(out, Level::Error, "JS-INSTALL-SCRIPT", &path, format!("scripts.{name}: lifecycle install scripts are forbidden"));
                }
                if let Some(tool) = script_uses_node(body) {
                    push(out, Level::Error, "JS-NODE", &path, format!("scripts.{name} runs `{tool}`: use the bun built-in"));
                }
                if has_drive_path(body) {
                    push(out, Level::Error, "JS-ABS-PATH", &path, format!("scripts.{name}: absolute path"));
                }
            }
        }
    }
    for lock in ["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"] {
        if root.join(lock).exists() {
            push(out, Level::Error, "JS-LOCK", lock, "foreign lockfile: bun.lock is the only JS lock".into());
        }
    }
    match read(&root.join("bun.lock")) {
        None => push(out, Level::Error, "JS-LOCK", "bun.lock", "missing (ay lock --deps)".into()),
        Some(lock) => {
            let want = p_name(&pkg);
            let root_entry = lock
                .split("\"\": {")
                .nth(1)
                .and_then(|s| s.split("\"name\": \"").nth(1))
                .and_then(|s| s.split('"').next())
                .unwrap_or("");
            if !want.is_empty() && root_entry != want {
                push(out, Level::Error, "JS-LOCK", "bun.lock", format!("stale: root workspace {root_entry:?} != package.json {want:?} (ay lock --deps)"));
            }
        }
    }
}

fn p_name(pkg: &serde_json::Value) -> String {
    pkg.get("name").and_then(|n| n.as_str()).unwrap_or("").to_string()
}

// ---------------------------------------------------------------------------------------------
// Python (uv)
// ---------------------------------------------------------------------------------------------

/// First-party trees scanned for Python manifests. `apps/*` are separate repositories (their
/// own lock), `third_party/*` belongs to upstreams.
const FIRST_PARTY: &[&str] = &["crates", "packages", "infra", "tools", "scripts", "plugins", "docs"];
const SKIP: &[&str] = &["node_modules", "target", ".venv", "dist", ".git", "__pycache__", ".urc", ".lore"];

fn walk_files(dir: &Path, depth: usize, names: &[&str], out: &mut Vec<PathBuf>) {
    if depth == 0 {
        return;
    }
    let Ok(rd) = fs::read_dir(dir) else {
        return;
    };
    for e in rd.flatten() {
        let p = e.path();
        let name = e.file_name().to_string_lossy().to_string();
        let Ok(ft) = e.file_type() else { continue };
        if ft.is_dir() {
            if !SKIP.contains(&name.as_str()) && !ft.is_symlink() {
                walk_files(&p, depth - 1, names, out);
            }
        } else if names.iter().any(|n| {
            if let Some(prefix) = n.strip_suffix('*') {
                name.starts_with(prefix) && name.ends_with(".txt")
            } else {
                name == *n
            }
        }) {
            out.push(p);
        }
    }
}

fn uv_members(root: &Path) -> Vec<PathBuf> {
    let Some(doc) = parse(&root.join("pyproject.toml")) else {
        return Vec::new();
    };
    let globs: Vec<String> = doc
        .get("tool")
        .and_then(|t| t.get("uv"))
        .and_then(|u| u.get("workspace"))
        .and_then(|w| w.get("members"))
        .and_then(Item::as_array)
        .map(|a| a.iter().filter_map(|v| v.as_str().map(str::to_string)).collect())
        .unwrap_or_default();
    let mut out = Vec::new();
    for g in globs {
        if let Some(base) = g.strip_suffix("/*") {
            if let Ok(rd) = fs::read_dir(root.join(base)) {
                out.extend(rd.flatten().map(|e| e.path()).filter(|p| p.join("pyproject.toml").is_file()));
            }
        } else {
            out.push(root.join(g));
        }
    }
    out
}

fn check_python(root: &Path, out: &mut Vec<Finding>) {
    let mut found = Vec::new();
    for d in FIRST_PARTY {
        walk_files(&root.join(d), 6, &["pyproject.toml", "uv.lock", "poetry.lock", "Pipfile", "Pipfile.lock", "requirements*"], &mut found);
    }
    let members: BTreeSet<PathBuf> = uv_members(root).into_iter().collect();
    let mut any_project = false;
    for f in found {
        let path = rel(root, &f);
        let name = f.file_name().unwrap_or_default().to_string_lossy().to_string();
        let dir = f.parent().unwrap_or(root).to_path_buf();
        match name.as_str() {
            "pyproject.toml" => {
                any_project = true;
                if !members.contains(&dir) {
                    push(out, Level::Error, "PY-WORKSPACE", &path, "not a member of the root uv workspace ([tool.uv.workspace] members)".into());
                }
            }
            "uv.lock" => push(out, Level::Error, "PY-LOCK", &path, "nested uv.lock: the root uv.lock is the only Python lock".into()),
            _ => push(out, Level::Error, "PY-MANIFEST", &path, "pip/poetry/pipenv manifest: declare it in pyproject.toml, lock with uv".into()),
        }
    }
    if any_project {
        if !root.join("pyproject.toml").is_file() {
            push(out, Level::Error, "PY-WORKSPACE", "pyproject.toml", "missing root uv workspace".into());
        }
        if !root.join("uv.lock").is_file() {
            push(out, Level::Error, "PY-LOCK", "uv.lock", "missing (ay lock --deps)".into());
        }
    }
}

// ---------------------------------------------------------------------------------------------
// Containers, tools.toml, src.lock.json
// ---------------------------------------------------------------------------------------------

const FORBIDDEN_IMAGES: &[&str] = &[
    "debian", "ubuntu", "bookworm", "bullseye", "buster", "trixie", "jammy", "noble", "focal",
    "node:", "/node", "mcr.microsoft.com/devcontainers",
];

/// Official images whose default tags are Debian-based: only their `-alpine` tags are allowed.
const DEBIAN_DEFAULT_TAGS: &[&str] = &[
    "oven/bun:", "rust:", "golang:", "python:", "buildpack-deps", "gcc:", "openjdk:",
    "eclipse-temurin:", "postgres:", "redis:", "nginx:", "caddy:",
];

fn check_containers(root: &Path, out: &mut Vec<Finding>) {
    let mut files = Vec::new();
    if let Ok(rd) = fs::read_dir(root) {
        files.extend(rd.flatten().map(|e| e.path()).filter(|p| {
            let n = p.file_name().unwrap_or_default().to_string_lossy().to_lowercase();
            n.starts_with("dockerfile") || n.starts_with("compose") || n.ends_with(".containerfile")
        }));
    }
    walk_files(&root.join("infra"), 5, &["Dockerfile", "Containerfile", "compose.yaml", "docker-compose.yml"], &mut files);
    for f in files {
        let Some(text) = read(&f) else { continue };
        let path = rel(root, &f);
        for (i, line) in text.lines().enumerate() {
            let l = line.trim_start().to_lowercase();
            let image = if let Some(r) = l.strip_prefix("from ") {
                r.split_whitespace().find(|w| !w.starts_with("--")).unwrap_or("")
            } else if let Some(r) = l.strip_prefix("image:") {
                r.trim()
            } else {
                continue;
            };
            let bare = image.trim_start_matches("docker.io/").trim_start_matches("library/");
            let debian_default = DEBIAN_DEFAULT_TAGS.iter().any(|p| bare.starts_with(p)) && !bare.contains("alpine");
            if debian_default || FORBIDDEN_IMAGES.iter().any(|b| image.contains(b)) {
                push(out, Level::Error, "OCI-DISTRO", &path, format!("line {}: {image}: Alpine, Arch or Nix only", i + 1));
            }
        }
    }
}

fn check_tools(root: &Path, out: &mut Vec<Finding>) {
    let Some(doc) = parse(&root.join("tools.toml")) else {
        return;
    };
    let Some(tools) = doc.get("tool").and_then(Item::as_array_of_tables) else {
        return;
    };
    let mut unverified = Vec::new();
    for t in tools.iter() {
        let name = t.get("name").and_then(Item::as_str).unwrap_or("?");
        let source = t.get("source").and_then(Item::as_str).unwrap_or("");
        let version = t.get("version").and_then(Item::as_str).unwrap_or("");
        if version.is_empty() || version == "latest" {
            push(out, Level::Error, "TOOLS-PIN", "tools.toml", format!("{name}: version must be pinned"));
        }
        let verified = t.contains_key("checksum") || t.contains_key("sha256");
        match source {
            "github" | "url" | "installer" if !verified => unverified.push(name.to_string()),
            "ubi" => unverified.push(name.to_string()),
            _ => {}
        }
    }
    if !unverified.is_empty() {
        push(out, Level::Warn, "TOOLS-UNVERIFIED", "tools.toml", format!("{} tools without checksum: {}", unverified.len(), unverified.join(" ")));
    }
}

fn is_absolute_str(p: &str) -> bool {
    p.starts_with('/') || p.starts_with('\\') || p.as_bytes().get(1) == Some(&b':')
}

fn check_lock(root: &Path, out: &mut Vec<Finding>) {
    let Some(text) = read(&root.join("src.lock.json")) else {
        push(out, Level::Error, "LOCK", "src.lock.json", "missing (ay lock)".into());
        return;
    };
    let Ok(lock) = serde_json::from_str::<serde_json::Value>(&text) else {
        push(out, Level::Error, "LOCK", "src.lock.json", "invalid JSON".into());
        return;
    };
    let repos = lock.get("repositories").and_then(|r| r.as_object()).cloned().unwrap_or_default();
    let abs = repos
        .values()
        .filter(|r| r.get("path").and_then(|p| p.as_str()).is_some_and(is_absolute_str))
        .count();
    if abs > 0 {
        push(out, Level::Error, "LOCK-ABS", "src.lock.json", format!("{abs} repositories with an absolute path (ay lock)"));
    }
    let zero = repos
        .values()
        .filter(|r| r.get("commit").and_then(|c| c.as_str()).is_some_and(|c| c.chars().all(|x| x == '0')))
        .count();
    if zero > 0 {
        push(out, Level::Warn, "LOCK-UNPINNED", "src.lock.json", format!("{zero} repositories without a commit"));
    }
    let mut missing = Vec::new();
    if let Ok(rd) = fs::read_dir(root.join("third_party")) {
        for e in rd.flatten() {
            let p = e.path();
            if p.join(".git").exists() {
                let key = rel(root, &p);
                if !repos.contains_key(&key) {
                    missing.push(key);
                }
            }
        }
    }
    if !missing.is_empty() {
        missing.sort();
        let shown: Vec<_> = missing.iter().take(8).cloned().collect();
        push(out, Level::Warn, "LOCK-MISSING", "src.lock.json", format!("{} third_party clones not locked (ay lock): {}{}", missing.len(), shown.join(" "), if missing.len() > 8 { " ..." } else { "" }));
    }
}

/// Every policy check, sorted errors first.
pub fn check(root: &Path) -> Vec<Finding> {
    let mut out = Vec::new();
    check_cargo(root, &mut out);
    check_bun(root, &mut out);
    check_python(root, &mut out);
    check_containers(root, &mut out);
    check_tools(root, &mut out);
    check_lock(root, &mut out);
    out.sort_by(|a, b| b.level.cmp(&a.level).then(a.rule.cmp(b.rule)).then(a.path.cmp(&b.path)));
    out
}

/// `ay doctor --deps [--dups] [--json]`. Exit code 1 when an error is found.
pub fn run_check(root: &Path, dups: bool, json: bool) -> i32 {
    let findings = check(root);
    let errors = findings.iter().filter(|f| f.level == Level::Error).count();
    let warns = findings.len() - errors;
    if json {
        let list: Vec<serde_json::Value> = findings
            .iter()
            .map(|f| {
                serde_json::json!({
                    "level": if f.level == Level::Error { "error" } else { "warn" },
                    "rule": f.rule, "path": f.path, "message": f.msg,
                })
            })
            .collect();
        let d = cargo_dups(root);
        let body = serde_json::json!({
            "errors": errors, "warnings": warns, "findings": list,
            "cargo_duplicates": d.len(),
            "cargo_duplicate_copies": d.values().map(|v| v.len() - 1).sum::<usize>(),
        });
        println!("{}", serde_json::to_string_pretty(&body).unwrap_or_default());
    } else {
        for f in &findings {
            let lvl = if f.level == Level::Error { "error" } else { "warn " };
            println!("{lvl} {:<18} {:<40} {}", f.rule, f.path, f.msg);
        }
        if dups {
            for (name, versions) in cargo_dups(root) {
                println!("dup   {name} {}", versions.join(" "));
            }
        }
        println!("deps policy: {errors} errors, {warns} warnings (docs/deps/POLICY.md)");
    }
    i32::from(errors > 0)
}

// ---------------------------------------------------------------------------------------------
// Hoisting into [workspace.dependencies]
// ---------------------------------------------------------------------------------------------

fn lock_versions(root: &Path) -> BTreeMap<String, Vec<String>> {
    let mut m: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for (name, version, source) in cargo_lock_packages(root) {
        if !source.is_empty() {
            m.entry(name).or_default().push(version);
        }
    }
    m
}

/// Caret requirement for a resolved version: build metadata dropped, prereleases kept exact.
fn caret_of(version: &str) -> String {
    let v = version.split('+').next().unwrap_or(version);
    if v.contains('-') { format!("={v}") } else { v.to_string() }
}

fn str_array(items: &[String]) -> Value {
    let mut a = toml_edit::Array::new();
    for i in items {
        a.push(i.as_str());
    }
    Value::Array(a)
}

/// Report of a hoisting pass.
#[derive(Default, Debug)]
pub struct HoistReport {
    pub moved: usize,
    pub added: Vec<String>,
    pub unpinned: Vec<String>,
    /// Members that asked for `default-features = false` on an entry that enables them.
    pub widened: Vec<String>,
    pub conflicts: Vec<String>,
}

/// Move inline requirements of members into `[workspace.dependencies]`.
pub fn hoist(root: &Path, write: bool) -> HoistReport {
    let mut rep = HoistReport::default();
    let root_manifest = root.join("Cargo.toml");
    let Some(mut root_doc) = parse(&root_manifest) else {
        return rep;
    };
    let locked = lock_versions(root);
    let mut ws = ws_deps(&root_doc);
    let mut new_entries: BTreeMap<String, InlineTable> = BTreeMap::new();
    let mut member_docs: Vec<(PathBuf, DocumentMut, bool)> = Vec::new();

    for dir in cargo_members(root) {
        let manifest = dir.join("Cargo.toml");
        let Some(mut doc) = parse(&manifest) else { continue };
        let member = rel(root, &dir);
        let mut changed = false;
        for (label, table) in dep_tables_mut(&mut doc) {
            let keys: Vec<String> = table.iter().map(|(k, _)| k.to_string()).collect();
            for key in keys {
                let Some(item) = table.get(&key) else { continue };
                let s = dep_spec(item);
                if s.workspace || s.path {
                    continue;
                }
                if s.version.is_none() && s.git.is_none() {
                    continue;
                }
                let req = s.version.clone().unwrap_or_default();
                let wants_default = s.default_features.unwrap_or(true);
                let mut extra_features = s.features.clone();
                if let Some(w) = ws.get(&key) {
                    if w.package != s.package {
                        rep.conflicts.push(format!("{member} [{label}] {key}: package rename differs from the workspace entry"));
                        continue;
                    }
                    if s.git.is_some() && w.git != s.git {
                        rep.conflicts.push(format!("{member} [{label}] {key}: git source differs from the workspace entry"));
                        continue;
                    }
                    let wver = w.version.clone().unwrap_or_default();
                    if s.git.is_none() && !w.path && w.git.is_none() && !caret_compatible(&wver, &req) {
                        rep.conflicts.push(format!("{member} [{label}] {key} {req} vs workspace {wver}: incompatible, needs a code port"));
                        continue;
                    }
                    let ws_default = w.default_features.unwrap_or(true);
                    if !ws_default && wants_default {
                        extra_features.push("default".into());
                    } else if ws_default && !wants_default {
                        // Features unify across the workspace build anyway; the member gets the
                        // workspace defaults (only a standalone `-p` build of it changes).
                        rep.widened.push(format!("{member} {key}"));
                    }
                } else {
                    // New workspace entry: the member's source keys (version, git, tag, rev, branch,
                    // package, default-features...), without its own features or optional flag.
                    let mut t = InlineTable::new();
                    let mut version = None;
                    if !req.is_empty() {
                        let v = locked
                            .get(s.package.as_deref().unwrap_or(&key))
                            .and_then(|vs| vs.iter().filter(|v| caret_compatible(v, &req)).max_by_key(|v| parse_ver(v)))
                            .map(|v| caret_of(v))
                            .unwrap_or_else(|| req.trim_start_matches(['^', ' ']).to_string());
                        // A member's exact pin is deliberate (generated output, ABI): keep it exact.
                        let v = if req.trim_start().starts_with('=') {
                            format!("={}", req.trim_start().trim_start_matches('=').trim())
                        } else {
                            v
                        };
                        t.insert("version", Value::from(v.clone()));
                        version = Some(v);
                    }
                    if let Some(src) = item.as_table_like() {
                        for (k, v) in src.iter() {
                            if matches!(k, "version" | "features" | "optional" | "default_features") {
                                continue;
                            }
                            if let Some(v) = v.as_value() {
                                let mut v = v.clone();
                                v.decor_mut().clear();
                                t.insert(k, v);
                            }
                        }
                    }
                    ws.insert(
                        key.clone(),
                        DepSpec {
                            version,
                            package: s.package.clone(),
                            git: s.git.clone(),
                            default_features: Some(wants_default),
                            ..DepSpec::default()
                        },
                    );
                    new_entries.insert(key.clone(), t);
                    rep.added.push(key.clone());
                }
                let mut t = InlineTable::new();
                t.insert("workspace", Value::from(true));
                extra_features.sort();
                extra_features.dedup();
                if !extra_features.is_empty() {
                    t.insert("features", str_array(&extra_features));
                }
                if s.optional {
                    t.insert("optional", Value::from(true));
                }
                table.insert(&key, Item::Value(Value::InlineTable(t)));
                rep.moved += 1;
                changed = true;
            }
        }
        member_docs.push((manifest, doc, changed));
    }

    // Root: append new entries, then turn exact pins into caret requirements.
    if let Some(wsd) = root_doc
        .get_mut("workspace")
        .and_then(|w| w.get_mut("dependencies"))
        .and_then(Item::as_table_like_mut)
    {
        for (k, t) in new_entries {
            let item = if t.len() == 1 {
                Item::Value(t.get("version").cloned().unwrap_or_else(|| Value::from("*")))
            } else {
                Item::Value(Value::InlineTable(t))
            };
            wsd.insert(&k, item);
        }
    }
    let root_text_before = root_doc.to_string();
    let pinned_by_comment = pinned_keys(&root_text_before);
    if let Some(wsd) = root_doc
        .get_mut("workspace")
        .and_then(|w| w.get_mut("dependencies"))
        .and_then(Item::as_table_like_mut)
    {
        let keys: Vec<String> = wsd.iter().map(|(k, _)| k.to_string()).collect();
        for k in keys {
            if pinned_by_comment.contains(&k) || rep.added.contains(&k) {
                continue;
            }
            let Some(item) = wsd.get_mut(&k) else { continue };
            let unpin = |v: &str| -> Option<String> {
                let exact = v.strip_prefix('=')?.trim();
                (!exact.contains('-')).then(|| exact.split('+').next().unwrap_or(exact).to_string())
            };
            if let Some(v) = item.as_str().and_then(unpin) {
                *item = Item::Value(Value::from(v));
                rep.unpinned.push(k);
            } else if let Some(t) = item.as_table_like_mut() {
                if let Some(v) = t.get("version").and_then(Item::as_str).and_then(unpin) {
                    if let Some(vi) = t.get_mut("version") {
                        let decor = vi.as_value().map(|x| x.decor().clone());
                        let mut nv = Value::from(v);
                        if let Some(d) = decor {
                            *nv.decor_mut() = d;
                        }
                        *vi = Item::Value(nv);
                    }
                    rep.unpinned.push(k);
                }
            }
        }
    }
    if write {
        let _ = fs::write(&root_manifest, root_doc.to_string());
        for (path, doc, changed) in member_docs {
            if changed {
                let _ = fs::write(&path, doc.to_string());
            }
        }
    }
    rep
}

/// Keys whose entry follows a comment line starting with `# Pinned` (deliberate exact pins).
fn pinned_keys(text: &str) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    let mut armed = false;
    for line in text.lines() {
        let l = line.trim();
        if l.starts_with('#') {
            if l.trim_start_matches(['#', ' ']).starts_with("Pinned") {
                armed = true;
            }
            continue;
        }
        if armed {
            if let Some((k, _)) = l.split_once('=') {
                out.insert(k.trim().trim_matches('"').to_string());
            }
            armed = false;
        }
    }
    out
}

// ---------------------------------------------------------------------------------------------
// Major upgrades (crates.io sparse index)
// ---------------------------------------------------------------------------------------------

/// Path of a crate in the crates.io sparse index (https://index.crates.io).
fn index_path(name: &str) -> String {
    let n = name.to_lowercase();
    match n.len() {
        1 => format!("1/{n}"),
        2 => format!("2/{n}"),
        3 => format!("3/{}/{n}", &n[..1]),
        _ => format!("{}/{}/{n}", &n[..2], &n[2..4]),
    }
}

/// Highest non-yanked stable version published on crates.io.
fn latest_stable(name: &str) -> Option<String> {
    let url = format!("https://index.crates.io/{}", index_path(name));
    let mut resp = ureq::get(&url).call().ok()?;
    let body = resp.body_mut().read_to_string().ok()?;
    body.lines()
        .filter_map(|l| serde_json::from_str::<serde_json::Value>(l).ok())
        .filter(|v| !v.get("yanked").and_then(|y| y.as_bool()).unwrap_or(false))
        .filter_map(|v| v.get("vers").and_then(|x| x.as_str()).map(str::to_string))
        .filter(|v| !v.contains('-'))
        .max_by_key(|v| parse_ver(v))
}

/// Raise every `[workspace.dependencies]` requirement whose newest stable release is outside
/// its caret range. Skips path and git entries, prereleases and `# Pinned` lines.
/// Returns `(name, from, to)`.
pub fn breaking(root: &Path, write: bool) -> Vec<(String, String, String)> {
    let manifest = root.join("Cargo.toml");
    let Some(mut doc) = parse(&manifest) else {
        return Vec::new();
    };
    let pinned = pinned_keys(&doc.to_string());
    let specs = ws_deps(&doc);
    let mut out = Vec::new();
    let Some(wsd) = doc
        .get_mut("workspace")
        .and_then(|w| w.get_mut("dependencies"))
        .and_then(Item::as_table_like_mut)
    else {
        return out;
    };
    for (key, spec) in &specs {
        let Some(req) = spec.version.clone() else { continue };
        if spec.path || spec.git.is_some() || is_prerelease(&req) || pinned.contains(key) || req.starts_with('=') {
            continue;
        }
        let Some(latest) = latest_stable(spec.package.as_deref().unwrap_or(key)) else { continue };
        if caret_compatible(&latest, &req) || parse_ver(&latest) <= parse_ver(&req) {
            continue;
        }
        let to = caret_of(&latest);
        let Some(item) = wsd.get_mut(key) else { continue };
        if item.is_str() {
            *item = Item::Value(Value::from(to.clone()));
        } else if let Some(t) = item.as_table_like_mut() {
            t.insert("version", Item::Value(Value::from(to.clone())));
        }
        out.push((key.clone(), req, to));
    }
    if write && !out.is_empty() {
        let _ = fs::write(&manifest, doc.to_string());
    }
    out
}

// ---------------------------------------------------------------------------------------------
// Language locks
// ---------------------------------------------------------------------------------------------

fn run_step(root: &Path, program: &str, args: &[&str]) -> bool {
    println!("$ {program} {}", args.join(" "));
    match Command::new(program).args(args).current_dir(root).status() {
        Ok(s) if s.success() => true,
        Ok(s) => {
            eprintln!("{program}: exit {}", s.code().unwrap_or(-1));
            false
        }
        Err(e) => {
            eprintln!("{program}: {e} (skipped)");
            false
        }
    }
}

/// Options of `ay lock --deps`.
#[derive(Debug, Default, Clone, Copy)]
pub struct LockOpts {
    pub bump: bool,
    pub breaking: bool,
    pub hoist: bool,
}

/// `ay lock --deps`: hoist (optional), then Cargo.lock, bun.lock and uv.lock. Exit 1 on failure.
pub fn run_lock(root: &Path, o: LockOpts) -> i32 {
    let before = cargo_dups(root);
    let mut ok = true;
    if o.hoist {
        let rep = hoist(root, true);
        println!(
            "hoist: {} member requirements inherited, {} new workspace entries, {} exact pins relaxed, {} default-features widened, {} conflicts",
            rep.moved,
            rep.added.len(),
            rep.unpinned.len(),
            rep.widened.len(),
            rep.conflicts.len()
        );
        for w in &rep.widened {
            println!("  widened {w}");
        }
        for c in &rep.conflicts {
            println!("  conflict {c}");
        }
    }
    if root.join("Cargo.toml").is_file() {
        ok &= if o.breaking {
{
            // cargo has no `update --breaking` any more (cargo 1.102-nightly, 2026-11-06): the
            // requirements are raised here, then resolved by cargo update.
            let raised = breaking(root, true);
            for (name, from, to) in &raised {
                println!("  major {name} {from} -> {to}");
            }
            println!("breaking: {} requirements raised (validate with cargo check --workspace on prd)", raised.len());
            run_step(root, "cargo", &["update"])
        }
        } else if o.bump {
            run_step(root, "cargo", &["update"])
        } else {
            run_step(root, "cargo", &["update", "--workspace"])
        };
    }
    if root.join("package.json").is_file() {
        ok &= if o.bump {
            run_step(root, "bun", &["update", "--recursive"])
        } else {
            run_step(root, "bun", &["install", "--lockfile-only"])
        };
    }
    if root.join("pyproject.toml").is_file() {
        ok &= if o.bump {
            run_step(root, "uv", &["lock", "--upgrade"])
        } else {
            run_step(root, "uv", &["lock"])
        };
    }
    let after = cargo_dups(root);
    let copies = |d: &BTreeMap<String, Vec<String>>| d.values().map(|v| v.len() - 1).sum::<usize>();
    println!(
        "cargo duplicates: {} crates / {} extra copies -> {} crates / {} extra copies",
        before.len(),
        copies(&before),
        after.len(),
        copies(&after)
    );
    i32::from(!ok)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn caret_buckets() {
        assert!(caret_compatible("1.0.104", "=1.0.3"));
        assert!(!caret_compatible("0.10.9", "0.11"));
        assert!(caret_compatible("0.10", "0.10.9"));
        assert!(!caret_compatible("0.0.1", "0.0.2"));
        assert!(!caret_compatible("2", "1.9"));
        assert!(is_prerelease("=0.13.1-nightly"));
        assert_eq!(caret_of("1.2.1+spec-1.1.0"), "1.2.1");
        assert_eq!(caret_of("2.0.0-beta.4"), "=2.0.0-beta.4");
        assert_eq!(index_path("a"), "1/a");
        assert_eq!(index_path("syn"), "3/s/syn");
        assert_eq!(index_path("Serde"), "se/rd/serde");
    }

    #[test]
    fn node_tools_in_scripts() {
        assert_eq!(script_uses_node("npx tsc -p ."), Some("npx"));
        assert_eq!(script_uses_node("bun test && node x.js"), Some("node"));
        assert_eq!(script_uses_node("bunx prettier ."), Some("prettier"));
        assert_eq!(script_uses_node("bun run src/cli.ts"), None);
    }

    #[test]
    fn pinned_comment() {
        let t = "# Pinned: reason\nbitcode = \"=0.6.6\"\nserde = \"=1.0.0\"\n";
        let k = pinned_keys(t);
        assert!(k.contains("bitcode"));
        assert!(!k.contains("serde"));
    }

    #[test]
    fn hoist_moves_inline_requirements() {
        let dir = std::env::temp_dir().join(format!("xtk-hoist-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(dir.join("crates/a")).unwrap();
        fs::write(
            dir.join("Cargo.toml"),
            "[workspace]\nmembers = [\"crates/*\"]\n\n[workspace.dependencies]\nserde = \"=1.0.200\"\n",
        )
        .unwrap();
        fs::write(
            dir.join("crates/a/Cargo.toml"),
            "[package]\nname = \"a\"\n\n[dependencies]\nserde = { version = \"1\", features = [\"derive\"] }\nhex = { version = \"0.4\", default-features = false }\nfoo = { path = \"../foo\" }\n",
        )
        .unwrap();
        let rep = hoist(&dir, true);
        assert_eq!(rep.moved, 2);
        assert_eq!(rep.added, vec!["hex".to_string()]);
        assert_eq!(rep.unpinned, vec!["serde".to_string()]);
        let member = fs::read_to_string(dir.join("crates/a/Cargo.toml")).unwrap();
        assert!(member.contains("serde = { workspace = true, features = [\"derive\"] }"));
        assert!(member.contains("hex = { workspace = true }"));
        let rootm = fs::read_to_string(dir.join("Cargo.toml")).unwrap();
        assert!(rootm.contains("serde = \"1.0.200\""));
        assert!(rootm.contains("hex = { version = \"0.4\", default-features = false }"));
        let findings = check(&dir);
        assert!(!findings.iter().any(|f| f.rule == "CARGO-INLINE"));
        let _ = fs::remove_dir_all(&dir);
    }
}
