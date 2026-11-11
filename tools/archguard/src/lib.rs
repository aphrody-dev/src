//! Sovereign Monorepo Architecture, Domain-Purity, Boundary & Hygiene Auditor (`archguard`)
//!
//! Deterministically enforces the `C:\src` Sovereign Monorepo operating contract (`AGENTS.md`, `SOUL.md`, `CLAUDE.md`, `GEMINI.md`):
//! - `ARCH-001` Crate Domain Purity (`crates/*` must be pure Rust/native; zero `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.py`, `.go`, `package.json`, `tsconfig.json`, `bun.lock`, `node_modules`)
//! - `ARCH-002` Crate Manifest & Edition 2024 Integrity (`Cargo.toml` required, `edition = "2024"`)
//! - `ARCH-003` Package Domain & Zero-NPM Purity (`packages/*` require `package.json`, `@aphrody/*` scope, zero external npm dependencies, zero stray root `Cargo.toml`/`go.mod`, zero legacy npm/pnpm/yarn lockfiles)
//! - `ARCH-004` Pure-Rust & Zero-NPM Application Contract (`apps/aphrody-app` zero TypeScript; `apps/aphrody` zero npm dependencies / zero `node_modules` / zero `bun.lock`)
//! - `ARCH-005` Root Topology & Junction Integrity (only canonical physical directories allowed at root; zero broken junctions/symlinks)
//! - `ARCH-006` Infra Domain Purity (`infra/go.mod` required; TypeScript restricted to `infra/ffi-bridge` and `infra/mesh-vn`)
//! - `ARCH-007` Sacred Host Userspace Boundary (zero write/install/copy operations targeting `C:\Windows\System32` or `SysWOW64`)
//! - `ARCH-008` Secret & Vault Hygiene (zero tracked `.env` files outside root local `.env`; zero raw API/OAuth/PAT tokens in source/docs)
//! - `ARCH-009` Anti-AI-Slop & Zero-Emoji Gate (zero astral/pictographic emojis in first-party source, Markdown, MDX, or configs)
//! - `ARCH-010` Single Public AI Product Ownership (`@aphrody/ai-os` sole public AI owner; generalist surfaces never declare public AI binaries/wrappers)
//! - `ARCH-011` Tools Domain Purity (`tools/*` must declare a valid Rust 2024 `Cargo.toml` or `@aphrody/*` `package.json`, never mix raw TS inside a Rust tool, and include `README.md` + `tests/`)
//! - `ARCH-012` Atlas & Governance Link Integrity (every `file:///C:/src/...` path in `AGENTS.md` and `docs/MONOREPO_ATLAS.md` must exist on disk)
//! - `ARCH-013` Manifest Versioning & Integrity (root and all first-party apps, packages, crates, tools, and infra must declare valid SemVer or CalVer versions without omissions)

use rayon::prelude::*;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::collections::{BTreeMap, BTreeSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;
use std::time::Instant;

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Severity {
    Error,
    Warning,
}

impl Severity {
    pub fn as_str(&self) -> &'static str {
        match self {
            Severity::Error => "ERROR",
            Severity::Warning => "WARN",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ArchFinding {
    pub rule_id: String,
    pub category: String,
    pub severity: Severity,
    pub path: String,
    pub line: Option<usize>,
    pub message: String,
    pub remediation: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RuleSpec {
    pub id: &'static str,
    pub category: &'static str,
    pub default_severity: Severity,
    pub summary: &'static str,
}

pub const RULES: &[RuleSpec] = &[
    RuleSpec {
        id: "ARCH-001",
        category: "crate-domain-purity",
        default_severity: Severity::Error,
        summary: "crates/* must contain zero TypeScript/JavaScript/Python/Go source files or npm/Bun package manifests",
    },
    RuleSpec {
        id: "ARCH-002",
        category: "crate-manifest-edition",
        default_severity: Severity::Warning,
        summary: "crates/* must have a valid Cargo.toml using Rust edition = \"2024\" and release LTO profile",
    },
    RuleSpec {
        id: "ARCH-003",
        category: "package-domain-purity",
        default_severity: Severity::Error,
        summary: "packages/* must have a valid @aphrody/* package.json, zero npm/pnpm/yarn lockfiles, zero unapproved external npm deps, and isolated native subdirs",
    },
    RuleSpec {
        id: "ARCH-004",
        category: "app-contract-purity",
        default_severity: Severity::Error,
        summary: "apps/aphrody-app must remain 100% pure Rust (zero TS/JS); apps/aphrody must remain zero-npm (zero deps, zero node_modules, zero bun.lock)",
    },
    RuleSpec {
        id: "ARCH-005",
        category: "root-topology-junctions",
        default_severity: Severity::Error,
        summary: "Monorepo root must contain only canonical physical directories and valid non-dangling junctions",
    },
    RuleSpec {
        id: "ARCH-006",
        category: "infra-domain-purity",
        default_severity: Severity::Error,
        summary: "infra/ must maintain a valid go.mod and restrict Bun/TypeScript code strictly to ffi-bridge and mesh-vn",
    },
    RuleSpec {
        id: "ARCH-007",
        category: "host-userspace-boundary",
        default_severity: Severity::Error,
        summary: "First-party scripts and code must never mutate C:\\Windows\\System32 or C:\\Windows\\SysWOW64",
    },
    RuleSpec {
        id: "ARCH-008",
        category: "secret-vault-hygiene",
        default_severity: Severity::Error,
        summary: "No committed .env files in submodules/packages/crates/apps and no raw live credential tokens in source or docs",
    },
    RuleSpec {
        id: "ARCH-009",
        category: "zero-emoji-anti-slop",
        default_severity: Severity::Error,
        summary: "Strictly zero pictographic emoji characters across first-party code, configs, and documentation",
    },
    RuleSpec {
        id: "ARCH-010",
        category: "single-ai-product-ownership",
        default_severity: Severity::Error,
        summary: "@aphrody/ai-os is the sole public AI product; generalist apps/crates/packages must not market themselves as AI wrappers",
    },
    RuleSpec {
        id: "ARCH-011",
        category: "tools-domain-purity",
        default_severity: Severity::Error,
        summary: "tools/* must have a pure Rust 2024 Cargo.toml or @aphrody/* package.json, README.md, and deterministic tests/",
    },
    RuleSpec {
        id: "ARCH-012",
        category: "atlas-link-integrity",
        default_severity: Severity::Error,
        summary: "Every file:///C:/src/... link in AGENTS.md and docs/MONOREPO_ATLAS.md must resolve to an existing file or directory",
    },
    RuleSpec {
        id: "ARCH-013",
        category: "manifest-versioning-integrity",
        default_severity: Severity::Error,
        summary: "Monorepo root and all first-party apps, packages, crates, tools, and infra must declare valid SemVer or CalVer versions without omissions",
    },
];

#[derive(Debug, Clone)]
pub struct AuditConfig {
    pub root: PathBuf,
    pub strict: bool,
    pub only_rule: Option<String>,
    pub check_docs_emojis: bool,
}

impl Default for AuditConfig {
    fn default() -> Self {
        Self {
            root: PathBuf::from(if cfg!(windows) { r"C:\src" } else { "/src" }),
            strict: false,
            only_rule: None,
            check_docs_emojis: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditReport {
    pub tool: String,
    pub version: String,
    pub root: String,
    pub clean: bool,
    pub strict: bool,
    pub scanned_files: usize,
    pub error_count: usize,
    pub warning_count: usize,
    pub duration_ms: f64,
    pub report_blake3: String,
    pub by_rule: BTreeMap<String, usize>,
    pub findings: Vec<ArchFinding>,
}

static SECRET_TOKEN_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"(?:ya29\.[A-Za-z0-9._-]{24,}|AIza[A-Za-z0-9_-]{30,}|gh[pousr]_[A-Za-z0-9_]{24,}|github_pat_[A-Za-z0-9_]{24,}|glpat-[A-Za-z0-9_-]{20,}|ctx7sk-[A-Za-z0-9_-]{16,}|figd_[A-Za-z0-9_-]{20,}|sk-ant-[A-Za-z0-9_-]{24,}|sk-proj-[A-Za-z0-9_-]{24,})",
    )
    .expect("valid secret regex")
});

static SYSTEM32_MUTATION_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(
        r"(?i)(?:Copy-Item|Move-Item|Remove-Item|New-Item|Out-File|Set-Content|Add-Content|\bcp\b|\bmv\b|\brm\b|--outfile|-o\s+)[^\r\n]{0,120}(?:C:\\\\?Windows\\\\?(?:System32|SysWOW64)|/c/Windows/(?:System32|SysWOW64))",
    )
    .expect("valid system32 regex")
});

static AI_WRAPPER_SLOP_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"(?i)\b(?:AI-powered\s+magic|AI\s+wrapper|revolutionary\s+AI\s+platform)\b")
        .expect("valid ai slop regex")
});

static FILE_URI_SRC_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"file:///C:/src(?:/([^\s\)\]#`]+))?").expect("valid file:///C:/src regex")
});

static SEMVER_OR_CALVER_RE: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^(?:\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?|\d{4}\.\d{1,2}\.\d+)$")
        .expect("valid semver/calver regex")
});

const ALLOWED_ROOT_PHYSICAL_DIRS: &[&str] = &[
    ".agents",
    ".gemini",
    ".git",
    ".jj",
    ".repo",
    ".cache",
    "apps",
    "crates",
    "docs",
    "graphify-out",
    "infra",
    "node_modules",
    "packages",
    "third_party",
    "tools",
    "var",
];

const CRATE_FORBIDDEN_EXTENSIONS: &[&str] = &[
    "ts", "tsx", "js", "jsx", "mjs", "cjs", "cts", "mts", "py", "pyc", "go",
];

const CRATE_FORBIDDEN_FILES: &[&str] = &[
    "package.json",
    "tsconfig.json",
    "bun.lock",
    "bun.lockb",
    "package-lock.json",
    "pnpm-lock.yaml",
    "yarn.lock",
    "go.mod",
    "go.sum",
    "pyproject.toml",
    "requirements.txt",
];

const SKIP_DIRS: &[&str] = &[
    ".git",
    ".jj",
    "target",
    "node_modules",
    "dist",
    ".next",
    ".turbo",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "upstream",
    "submodules",
    "third_party",
    "graphify-out",
    "var",
];

pub fn is_reparse_point(path: &Path) -> bool {
    #[cfg(windows)]
    {
        use std::os::windows::fs::MetadataExt;
        if let Ok(meta) = fs::symlink_metadata(path) {
            return (meta.file_attributes() & 0x0400) != 0;
        }
    }
    #[cfg(not(windows))]
    {
        if let Ok(meta) = fs::symlink_metadata(path) {
            return meta.file_type().is_symlink();
        }
    }
    false
}

fn normalize_rel(root: &Path, p: &Path) -> String {
    p.strip_prefix(root)
        .unwrap_or(p)
        .to_string_lossy()
        .replace('\\', "/")
}

fn contains_pictographic_emoji(ch: char) -> bool {
    let u = ch as u32;
    // Astral pictographs, emoticons, transport, supplemental symbols, dingbats (excluding standard box drawing 2500..257F and arrows 2190..21FF)
    (0x1F300..=0x1F9FF).contains(&u)
        || (0x1FA00..=0x1FAFF).contains(&u)
        || (0x1F600..=0x1F64F).contains(&u)
        || (0x1F680..=0x1F6FF).contains(&u)
        || (0x2702..=0x27B0).contains(&u)
        || matches!(
            u,
            0x2600..=0x2604
                | 0x260E
                | 0x2611
                | 0x2614..=0x2615
                | 0x2618
                | 0x261D
                | 0x2620
                | 0x2622..=0x2623
                | 0x2626
                | 0x262A
                | 0x262E..=0x262F
                | 0x2638..=0x263A
                | 0x2640
                | 0x2642
                | 0x2648..=0x2653
                | 0x265F..=0x2660
                | 0x2663
                | 0x2665..=0x2666
                | 0x2668
                | 0x267B
                | 0x267E..=0x267F
                | 0x2692..=0x2697
                | 0x2699
                | 0x269B..=0x269C
                | 0x26A0..=0x26A1
                | 0x26AA..=0x26AB
                | 0x26B0..=0x26B1
                | 0x26BD..=0x26BE
                | 0x26C4..=0x26C5
                | 0x26CE..=0x26CF
                | 0x26D1
                | 0x26D3..=0x26D4
                | 0x26E9..=0x26EA
                | 0x26F0..=0x26F5
                | 0x26F7..=0x26FA
                | 0x26FD
        )
}

fn find_first_emoji(text: &str) -> Option<(usize, char)> {
    for (idx, line) in text.lines().enumerate() {
        // Ignore regex character class definitions that intentionally match emojis
        if line.contains("\\u{1F") || line.contains("Extended_Pictographic") || line.contains("0x1F300") {
            continue;
        }
        for ch in line.chars() {
            if contains_pictographic_emoji(ch) {
                return Some((idx + 1, ch));
            }
        }
    }
    None
}

fn should_skip_dir_name(name: &str) -> bool {
    SKIP_DIRS.contains(&name)
}

fn collect_domain_files(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let p = entry.path();
        if is_reparse_point(&p) {
            continue;
        }
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if p.is_dir() {
            if should_skip_dir_name(name) {
                continue;
            }
            collect_domain_files(&p, out);
        } else if p.is_file() {
            out.push(p);
        }
    }
}

/// Rule ARCH-005: Check root physical directories and root junctions
fn check_root_topology(root: &Path, findings: &mut Vec<ArchFinding>) {
    let allowed: BTreeSet<&str> = ALLOWED_ROOT_PHYSICAL_DIRS.iter().copied().collect();
    let Ok(entries) = fs::read_dir(root) else {
        return;
    };

    for entry in entries.flatten() {
        let p = entry.path();
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if is_reparse_point(&p) {
            // Verify junction target exists and is not dangling
            if fs::metadata(&p).is_err() {
                findings.push(ArchFinding {
                    rule_id: "ARCH-005".into(),
                    category: "root-topology-junctions".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &p),
                    line: None,
                    message: format!("Broken/dangling root junction or symlink `{name}`"),
                    remediation: format!(
                        "Remove dangling junction `{name}` or repoint it to an existing target under apps/, packages/, crates/, or third_party/."
                    ),
                });
            }
            continue;
        }

        if p.is_dir() && !allowed.contains(name) {
            findings.push(ArchFinding {
                rule_id: "ARCH-005".into(),
                category: "root-topology-junctions".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &p),
                line: None,
                message: format!(
                    "Unapproved physical directory `{name}` at monorepo root (violates canonical hierarchy: apps/, packages/, crates/, infra/, tools/, docs/, third_party/)"
                ),
                remediation: format!(
                    "Move `{name}` into its canonical domain (`apps/`, `packages/`, `crates/`, `infra/`, `tools/`, or `third_party/`) and create a junction if backwards path compatibility is required."
                ),
            });
        }
    }
}

/// Rules ARCH-001 & ARCH-002: Audit `crates/*`
fn check_crates_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
    let crates_dir = root.join("crates");
    let Ok(entries) = fs::read_dir(&crates_dir) else {
        return;
    };

    for entry in entries.flatten() {
        let crate_path = entry.path();
        if !crate_path.is_dir() || is_reparse_point(&crate_path) {
            continue;
        }
        let crate_name = crate_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");
        if crate_name.starts_with('.') {
            continue;
        }

        // Check node_modules inside crate
        let nm = crate_path.join("node_modules");
        if nm.exists() {
            findings.push(ArchFinding {
                rule_id: "ARCH-001".into(),
                category: "crate-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &nm),
                line: None,
                message: format!("Forbidden `node_modules` directory inside Rust crate `crates/{crate_name}`"),
                remediation: "Delete `node_modules` and move any JS/TS package logic to `C:\\src\\packages\\`.".into(),
            });
        }

        let cargo_toml = crate_path.join("Cargo.toml");
        if !cargo_toml.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-002".into(),
                category: "crate-manifest-edition".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &crate_path),
                line: None,
                message: format!("Directory `crates/{crate_name}` is missing a root `Cargo.toml` manifest"),
                remediation: format!(
                    "If `{crate_name}` is not a Rust crate, move it out of `crates/` into `packages/` or `tools/`. Otherwise add a valid Rust 2024 `Cargo.toml`."
                ),
            });
        } else if let Ok(raw) = fs::read_to_string(&cargo_toml) {
            if let Ok(parsed) = raw.parse::<toml::Value>() {
                let edition = parsed
                    .get("package")
                    .and_then(|p| p.get("edition"))
                    .and_then(|e| e.as_str())
                    .or_else(|| {
                        parsed
                            .get("workspace")
                            .and_then(|w| w.get("package"))
                            .and_then(|p| p.get("edition"))
                            .and_then(|e| e.as_str())
                    });

                if let Some(ed) = edition {
                    if ed != "2024" {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-002".into(),
                            category: "crate-manifest-edition".into(),
                            severity: Severity::Warning,
                            path: normalize_rel(root, &cargo_toml),
                            line: None,
                            message: format!(
                                "Rust crate `crates/{crate_name}` uses `edition = \"{ed}\"` instead of canonical `edition = \"2024\"`"
                            ),
                            remediation: "Upgrade `edition = \"2024\"` in `Cargo.toml`.".into(),
                        });
                    }
                } else if parsed.get("package").is_some() {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-002".into(),
                        category: "crate-manifest-edition".into(),
                        severity: Severity::Warning,
                        path: normalize_rel(root, &cargo_toml),
                        line: None,
                        message: format!("Rust crate `crates/{crate_name}` omits explicit `edition = \"2024\"`"),
                        remediation: "Set `edition = \"2024\"` in `[package]`.".into(),
                    });
                }
            } else {
                findings.push(ArchFinding {
                    rule_id: "ARCH-002".into(),
                    category: "crate-manifest-edition".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &cargo_toml),
                    line: None,
                    message: format!("Invalid TOML syntax in `crates/{crate_name}/Cargo.toml`"),
                    remediation: "Fix TOML syntax errors in `Cargo.toml`.".into(),
                });
            }
        }

        // Recursively scan crate files (excluding target/, upstream/, .git/, .jj/)
        let mut crate_files = Vec::new();
        collect_domain_files(&crate_path, &mut crate_files);

        let mut has_rust_source = false;
        for f in crate_files {
            let fname = f.file_name().and_then(|n| n.to_str()).unwrap_or("");
            let ext = f
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();

            if ext == "rs" {
                has_rust_source = true;
            }

            if CRATE_FORBIDDEN_FILES.contains(&fname) {
                findings.push(ArchFinding {
                    rule_id: "ARCH-001".into(),
                    category: "crate-domain-purity".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &f),
                    line: None,
                    message: format!(
                        "Forbidden non-Rust manifest/lockfile `{fname}` inside Rust crate `crates/{crate_name}`"
                    ),
                    remediation: format!(
                        "Move Bun/JS/Go/Python project files out of `crates/{crate_name}` into `C:\\src\\packages\\` or `C:\\src\\infra\\`."
                    ),
                });
                continue;
            }

            if CRATE_FORBIDDEN_EXTENSIONS.contains(&ext.as_str()) {
                findings.push(ArchFinding {
                    rule_id: "ARCH-001".into(),
                    category: "crate-domain-purity".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &f),
                    line: None,
                    message: format!(
                        "Forbidden `.{ext}` source file `{fname}` inside Rust crate `crates/{crate_name}` (`C:\\src\\crates` is strictly reserved for Rust/native systems crates)"
                    ),
                    remediation: format!(
                        "Relocate `{}` to a canonical Bun package in `C:\\src\\packages\\` (e.g. FFI tests, web harnesses, or CLI wrappers) or rewrite it natively in Rust.",
                        normalize_rel(root, &f)
                    ),
                });
            }
        }

        if cargo_toml.is_file() && !has_rust_source {
            findings.push(ArchFinding {
                rule_id: "ARCH-002".into(),
                category: "crate-manifest-edition".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &crate_path),
                line: None,
                message: format!("Crate `crates/{crate_name}` contains zero `.rs` Rust source files"),
                remediation: "Add Rust `src/lib.rs` or `src/main.rs`, or remove the empty/misplaced crate directory.".into(),
            });
        }
    }
}

/// Rules ARCH-003 & ARCH-010: Audit `packages/*`
fn check_packages_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
    let packages_dir = root.join("packages");
    let Ok(entries) = fs::read_dir(&packages_dir) else {
        return;
    };

    let allowed_native_roots: BTreeSet<&str> = [
        "crates",
        "native",
        "rust-core",
        "rust-desktop",
        "loaders",
        "zig",
        "python",
    ]
    .into_iter()
    .collect();

    for entry in entries.flatten() {
        let pkg_path = entry.path();
        if !pkg_path.is_dir() || is_reparse_point(&pkg_path) {
            continue;
        }
        let pkg_dir_name = pkg_path.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if pkg_dir_name.starts_with('.') {
            continue;
        }

        let pkg_json = pkg_path.join("package.json");
        if !pkg_json.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-003".into(),
                category: "package-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &pkg_path),
                line: None,
                message: format!("Workspace directory `packages/{pkg_dir_name}` is missing `package.json`"),
                remediation: "Add a valid `@aphrody/<name>` `package.json` or relocate non-Bun code to `crates/` / `tools/`.".into(),
            });
        } else if let Ok(raw) = fs::read_to_string(&pkg_json) {
            match serde_json::from_str::<serde_json::Value>(&raw) {
                Ok(val) => {
                    let name = val.get("name").and_then(|v| v.as_str()).unwrap_or("");
                    if !name.starts_with("@aphrody/") {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-003".into(),
                            category: "package-domain-purity".into(),
                            severity: Severity::Error,
                            path: normalize_rel(root, &pkg_json),
                            line: None,
                            message: format!(
                                "Package `packages/{pkg_dir_name}` has name `{name}` instead of canonical `@aphrody/<slug>` namespace"
                            ),
                            remediation: format!("Rename package to `@aphrody/{pkg_dir_name}` in `package.json`."),
                        });
                    }

                    // Check zero external npm dependencies (workspace:* allowed, @types/bun allowed in devDependencies)
                    for dep_field in ["dependencies", "devDependencies"] {
                        if let Some(obj) = val.get(dep_field).and_then(|v| v.as_object()) {
                            for (dep_name, dep_ver) in obj {
                                let ver_str = dep_ver.as_str().unwrap_or("");
                                let is_workspace = ver_str.starts_with("workspace:")
                                    || dep_name.starts_with("@aphrody/");
                                let is_allowed_type =
                                    dep_field == "devDependencies" && dep_name == "@types/bun";
                                if !is_workspace && !is_allowed_type {
                                    findings.push(ArchFinding {
                                        rule_id: "ARCH-003".into(),
                                        category: "package-domain-purity".into(),
                                        severity: Severity::Warning,
                                        path: normalize_rel(root, &pkg_json),
                                        line: None,
                                        message: format!(
                                            "First-party Bun package `{name}` declares external npm dependency `{dep_name}: {ver_str}` in `{dep_field}`"
                                        ),
                                        remediation: "Replace external npm packages with native Bun v1.4.4 APIs (`Bun.serve`, `bun:sqlite`, `Bun.SQL`, `bun:ffi`, `Bun.CryptoHasher`).".into(),
                                    });
                                }
                            }
                        }
                    }

                    // ARCH-010: Single public AI product check
                    if pkg_dir_name != "ai-os"
                        && pkg_dir_name != "ai-triad"
                        && pkg_dir_name != "agy"
                        && pkg_dir_name != "brain"
                        && pkg_dir_name != "knowledge-engine"
                        && pkg_dir_name != "pi-opencode"
                    {
                        let desc = val
                            .get("description")
                            .and_then(|v| v.as_str())
                            .unwrap_or("");
                        if AI_WRAPPER_SLOP_RE.is_match(desc) {
                            findings.push(ArchFinding {
                                rule_id: "ARCH-010".into(),
                                category: "single-ai-product-ownership".into(),
                                severity: Severity::Error,
                                path: normalize_rel(root, &pkg_json),
                                line: None,
                                message: format!(
                                    "Generalist package `{name}` contains AI-wrapper marketing phrasing in description (`@aphrody/ai-os` is the sole public AI product)"
                                ),
                                remediation: "Use factual systems/engineering descriptions aligned with Torvalds/Sumner/Page.".into(),
                            });
                        }
                    }
                }
                Err(_) => {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-003".into(),
                        category: "package-domain-purity".into(),
                        severity: Severity::Error,
                        path: normalize_rel(root, &pkg_json),
                        line: None,
                        message: format!("Malformed JSON in `packages/{pkg_dir_name}/package.json`"),
                        remediation: "Fix JSON syntax in `package.json`.".into(),
                    });
                }
            }
        }

        // Forbidden root manifests / legacy lockfiles in packages/<pkg>/
        for forbidden in [
            "Cargo.toml",
            "go.mod",
            "package-lock.json",
            "pnpm-lock.yaml",
            "yarn.lock",
        ] {
            let fp = pkg_path.join(forbidden);
            if fp.is_file() {
                findings.push(ArchFinding {
                    rule_id: "ARCH-003".into(),
                    category: "package-domain-purity".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &fp),
                    line: None,
                    message: format!(
                        "Forbidden root file `{forbidden}` directly inside Bun package `packages/{pkg_dir_name}`"
                    ),
                    remediation: if forbidden == "Cargo.toml" {
                        "Pure Rust crates belong in `C:\\src\\crates\\`; FFI helper crates inside a Bun package must be isolated in `native/` or `rust-core/`.".into()
                    } else if forbidden == "go.mod" {
                        "Go modules belong in `C:\\src\\infra\\` (or an isolated `loaders/go/` subdir).".into()
                    } else {
                        "Delete legacy Node lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`); use Bun v1.4.4 exclusively.".into()
                    },
                });
            }
        }

        // Check stray `.rs` or `.go` files outside approved native subdirectories
        let mut pkg_files = Vec::new();
        collect_domain_files(&pkg_path, &mut pkg_files);
        for f in pkg_files {
            let rel_to_pkg = f.strip_prefix(&pkg_path).unwrap_or(&f);
            let first_comp = rel_to_pkg
                .components()
                .next()
                .and_then(|c| c.as_os_str().to_str())
                .unwrap_or("");
            let ext = f
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();

            if (ext == "rs" || ext == "go") && !allowed_native_roots.contains(first_comp) {
                findings.push(ArchFinding {
                    rule_id: "ARCH-003".into(),
                    category: "package-domain-purity".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &f),
                    line: None,
                    message: format!(
                        "Unisolated `.{ext}` source file `{}` inside Bun package `packages/{pkg_dir_name}` outside approved native FFI subdirs (`native/`, `rust-core/`, `crates/`, `loaders/`)",
                        normalize_rel(root, &f)
                    ),
                    remediation: format!(
                        "Move `.{ext}` code to `C:\\src\\crates\\` / `C:\\src\\infra\\`, or isolate FFI bindings under `packages/{pkg_dir_name}/native/`."
                    ),
                });
            }
        }
    }
}

/// Rule ARCH-004: Audit `apps/*` (`aphrody` zero-npm, `aphrody-app` pure-Rust)
fn check_apps_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
    // 1. apps/aphrody-app: Explicitly documented as "Pure-Rust (Edition 2024, zero TypeScript)"
    let aphrody_app = root.join("apps").join("aphrody-app");
    if aphrody_app.is_dir() {
        let mut files = Vec::new();
        collect_domain_files(&aphrody_app, &mut files);
        for f in files {
            let fname = f.file_name().and_then(|n| n.to_str()).unwrap_or("");
            let ext = f
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            if matches!(ext.as_str(), "ts" | "tsx" | "jsx" | "cjs")
                || matches!(fname, "package.json" | "tsconfig.json" | "bun.lock")
            {
                findings.push(ArchFinding {
                    rule_id: "ARCH-004".into(),
                    category: "app-contract-purity".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &f),
                    line: None,
                    message: format!(
                        "Pure-Rust application `apps/aphrody-app` contains forbidden TypeScript/npm file `{fname}` (contract requires 100% Rust Edition 2024, zero TypeScript)"
                    ),
                    remediation: "Use `aphrody-app serve` (`crates/aphrody-host/src/http.rs`) and remove stray TypeScript files from `apps/aphrody-app`.".into(),
                });
            }
        }
    }

    // 2. apps/aphrody: Explicitly documented as zero external npm dependencies, no node_modules, no bun.lock
    let aphrody_web = root.join("apps").join("aphrody");
    if aphrody_web.is_dir() {
        for forbidden in [
            "node_modules",
            "bun.lock",
            "package-lock.json",
            "pnpm-lock.yaml",
            "yarn.lock",
        ] {
            let fp = aphrody_web.join(forbidden);
            if fp.exists() {
                findings.push(ArchFinding {
                    rule_id: "ARCH-004".into(),
                    category: "app-contract-purity".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &fp),
                    line: None,
                    message: format!(
                        "`apps/aphrody` (`aphrody.com`) contains forbidden `{forbidden}` (contract requires zero npm dependencies, no `node_modules`, no `bun.lock`)"
                    ),
                    remediation: format!("Remove `{forbidden}` from `apps/aphrody`."),
                });
            }
        }

        let pkg_json = aphrody_web.join("package.json");
        if let Ok(raw) = fs::read_to_string(&pkg_json)
            && let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw)
        {
            for field in ["dependencies", "devDependencies"] {
                if let Some(obj) = val.get(field).and_then(|v| v.as_object())
                    && !obj.is_empty()
                {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-004".into(),
                        category: "app-contract-purity".into(),
                        severity: Severity::Error,
                        path: normalize_rel(root, &pkg_json),
                        line: None,
                        message: format!(
                            "`apps/aphrody/package.json` has non-empty `{field}` (must be `{{}}`)"
                        ),
                        remediation: "Keep `dependencies: {}` and `devDependencies: {}` in `apps/aphrody/package.json`.".into(),
                    });
                }
            }
        }
    }
}

/// Rule ARCH-006: Audit `infra/`
fn check_infra_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
    let infra_dir = root.join("infra");
    if !infra_dir.is_dir() {
        return;
    }

    let go_mod = infra_dir.join("go.mod");
    if !go_mod.is_file() {
        findings.push(ArchFinding {
            rule_id: "ARCH-006".into(),
            category: "infra-domain-purity".into(),
            severity: Severity::Error,
            path: "infra/go.mod".into(),
            line: None,
            message: "`C:\\src\\infra` is missing its canonical Go module manifest `go.mod`".into(),
            remediation: "Restore `infra/go.mod` for the Go 1.27 deploy engine.".into(),
        });
    }

    let allowed_ts_subdirs: BTreeSet<&str> = ["ffi-bridge", "mesh-vn"].into_iter().collect();
    let mut infra_files = Vec::new();
    collect_domain_files(&infra_dir, &mut infra_files);

    for f in infra_files {
        let rel = f.strip_prefix(&infra_dir).unwrap_or(&f);
        let first_comp = rel
            .components()
            .next()
            .and_then(|c| c.as_os_str().to_str())
            .unwrap_or("");
        let ext = f
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        if matches!(ext.as_str(), "ts" | "tsx" | "jsx") && !allowed_ts_subdirs.contains(first_comp)
        {
            findings.push(ArchFinding {
                rule_id: "ARCH-006".into(),
                category: "infra-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &f),
                line: None,
                message: format!(
                    "Unapproved TypeScript file `{}` in Go `infra/` domain outside `infra/ffi-bridge` or `infra/mesh-vn`",
                    normalize_rel(root, &f)
                ),
                remediation: "Move TypeScript utilities to `packages/` or keep Go `infra/` strictly Go 1.27 + declarative configs.".into(),
            });
        }
    }
}

/// Rule ARCH-011: Audit `tools/*`
fn check_tools_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
    let tools_dir = root.join("tools");
    let Ok(entries) = fs::read_dir(&tools_dir) else {
        return;
    };

    for entry in entries.flatten() {
        let tool_path = entry.path();
        if !tool_path.is_dir() || is_reparse_point(&tool_path) {
            continue;
        }
        let tool_name = tool_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");
        if tool_name.starts_with('.') {
            continue;
        }

        let cargo_toml = tool_path.join("Cargo.toml");
        let pkg_json = tool_path.join("package.json");
        let readme = tool_path.join("README.md");

        if !cargo_toml.is_file() && !pkg_json.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-011".into(),
                category: "tools-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &tool_path),
                line: None,
                message: format!(
                    "Tool directory `tools/{tool_name}` is missing both `Cargo.toml` and `package.json`"
                ),
                remediation: "Define `tools/<name>` as either a pure Rust 2024 crate (`Cargo.toml`) or a `@aphrody/<name>` Bun tool (`package.json`).".into(),
            });
            continue;
        }

        if cargo_toml.is_file() && pkg_json.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-011".into(),
                category: "tools-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &tool_path),
                line: None,
                message: format!(
                    "Tool directory `tools/{tool_name}` mixes both `Cargo.toml` and `package.json` at its root"
                ),
                remediation: "Keep each tool single-domain (either pure Rust 2024 or pure Bun v1.4.4).".into(),
            });
        }

        if cargo_toml.is_file() {
            if let Ok(raw) = fs::read_to_string(&cargo_toml)
                && let Ok(parsed) = raw.parse::<toml::Value>()
            {
                let edition = parsed
                    .get("package")
                    .and_then(|p| p.get("edition"))
                    .and_then(|e| e.as_str());
                if edition != Some("2024") {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-011".into(),
                        category: "tools-domain-purity".into(),
                        severity: Severity::Warning,
                        path: normalize_rel(root, &cargo_toml),
                        line: None,
                        message: format!(
                            "Rust tool `tools/{tool_name}` must declare `edition = \"2024\"`"
                        ),
                        remediation: "Set `edition = \"2024\"` in `Cargo.toml`.".into(),
                    });
                }
            }

            let mut tool_files = Vec::new();
            collect_domain_files(&tool_path, &mut tool_files);
            for f in &tool_files {
                let ext = f
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_ascii_lowercase();
                if CRATE_FORBIDDEN_EXTENSIONS.contains(&ext.as_str()) {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-011".into(),
                        category: "tools-domain-purity".into(),
                        severity: Severity::Error,
                        path: normalize_rel(root, f),
                        line: None,
                        message: format!(
                            "Rust tool `tools/{tool_name}` contains forbidden `.{ext}` source file `{}`",
                            normalize_rel(root, f)
                        ),
                        remediation: "Keep Rust tools in `tools/*` 100% pure Rust.".into(),
                    });
                }
            }
        }

        if !readme.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-011".into(),
                category: "tools-domain-purity".into(),
                severity: Severity::Warning,
                path: normalize_rel(root, &tool_path),
                line: None,
                message: format!("Tool `tools/{tool_name}` is missing `README.md` documentation"),
                remediation: format!("Add `tools/{tool_name}/README.md` documenting CLI flags, exit codes, and rules."),
            });
        }

        let has_tests_dir = tool_path.join("tests").is_dir() || tool_path.join("test").is_dir();
        if !has_tests_dir {
            findings.push(ArchFinding {
                rule_id: "ARCH-011".into(),
                category: "tools-domain-purity".into(),
                severity: Severity::Warning,
                path: normalize_rel(root, &tool_path),
                line: None,
                message: format!("Tool `tools/{tool_name}` is missing a deterministic `tests/` suite"),
                remediation: format!("Add reproducible integration tests in `tools/{tool_name}/tests/`."),
            });
        }
    }
}

/// Rule ARCH-012: Verify `file:///C:/src/...` links in `AGENTS.md` and `docs/MONOREPO_ATLAS.md`
fn check_atlas_link_integrity(root: &Path, findings: &mut Vec<ArchFinding>) {
    let candidates = [
        root.join("AGENTS.md"),
        root.join("docs").join("MONOREPO_ATLAS.md"),
    ];

    for doc in candidates {
        let Ok(content) = fs::read_to_string(&doc) else {
            continue;
        };
        let rel_doc = normalize_rel(root, &doc);
        for (idx, line) in content.lines().enumerate() {
            for cap in FILE_URI_SRC_RE.captures_iter(line) {
                let Some(sub_match) = cap.get(1) else {
                    continue;
                };
                let raw_sub = sub_match.as_str().trim_end_matches('/');
                if raw_sub.is_empty() || raw_sub.contains('*') || raw_sub.contains('<') {
                    continue;
                }
                let target = root.join(raw_sub.replace('/', std::path::MAIN_SEPARATOR_STR));
                if !target.exists() {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-012".into(),
                        category: "atlas-link-integrity".into(),
                        severity: Severity::Error,
                        path: rel_doc.clone(),
                        line: Some(idx + 1),
                        message: format!(
                            "Broken/stale `file:///C:/src/{raw_sub}` link in `{rel_doc}` (target does not exist on disk)"
                        ),
                        remediation: "Update the link or regenerate `docs/MONOREPO_ATLAS.md` via `ske gen-docs`.".into(),
                    });
                }
            }
        }
    }
}

/// Rule ARCH-013: Verify SemVer and CalVer versioning integrity monorepo-wide
fn check_versioning_integrity(root: &Path, findings: &mut Vec<ArchFinding>) {
    // 1. Root package.json
    let root_pkg = root.join("package.json");
    if root_pkg.is_file() {
        if let Ok(raw) = fs::read_to_string(&root_pkg) {
            if let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) {
                let ver = val.get("version").and_then(|v| v.as_str());
                if ver.map(|v| SEMVER_OR_CALVER_RE.is_match(v)) != Some(true) {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-013".into(),
                        category: "manifest-versioning-integrity".into(),
                        severity: Severity::Error,
                        path: "package.json".into(),
                        line: None,
                        message: format!(
                            "Root package.json has missing or invalid version `{}` (expected CalVer YYYY.MM.PATCH, e.g. 2026.11.0)",
                            ver.unwrap_or("(none)")
                        ),
                        remediation: "Set `\"version\": \"2026.11.0\"` in root `package.json`.".into(),
                    });
                }
            }
        }
    }

    // 2. Apps, Packages, Crates, Tools, Infra
    let domains = ["apps", "packages", "crates", "tools", "infra"];
    for dom in domains {
        let dom_dir = root.join(dom);
        if !dom_dir.is_dir() {
            continue;
        }

        // Check infra/go.mod
        if dom == "infra" {
            let go_mod = dom_dir.join("go.mod");
            if go_mod.is_file() {
                if let Ok(content) = fs::read_to_string(&go_mod) {
                    if !content.lines().any(|l| l.starts_with("go ")) {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-013".into(),
                            category: "manifest-versioning-integrity".into(),
                            severity: Severity::Error,
                            path: "infra/go.mod".into(),
                            line: None,
                            message: "infra/go.mod is missing `go 1.xx` toolchain version directive".into(),
                            remediation: "Add `go 1.27` in `infra/go.mod`.".into(),
                        });
                    }
                }
            }
        }

        let Ok(entries) = fs::read_dir(&dom_dir) else { continue; };
        for entry in entries.flatten() {
            let p = entry.path();
            if !p.is_dir() || is_reparse_point(&p) {
                continue;
            }
            let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if name.starts_with('.') || should_skip_dir_name(name) {
                continue;
            }

            // Check package.json if present
            let pkg_json = p.join("package.json");
            if pkg_json.is_file() {
                if let Ok(raw) = fs::read_to_string(&pkg_json) {
                    if let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) {
                        let ver = val.get("version").and_then(|v| v.as_str());
                        if ver.map(|v| SEMVER_OR_CALVER_RE.is_match(v)) != Some(true) {
                            findings.push(ArchFinding {
                                rule_id: "ARCH-013".into(),
                                category: "manifest-versioning-integrity".into(),
                                severity: Severity::Error,
                                path: normalize_rel(root, &pkg_json),
                                line: None,
                                message: format!(
                                    "Manifest `{}` is missing a valid SemVer/CalVer `version` string (got `{}`)",
                                    normalize_rel(root, &pkg_json),
                                    ver.unwrap_or("(none)")
                                ),
                                remediation: "Add a valid SemVer or CalVer `\"version\": \"x.y.z\"` to `package.json`.".into(),
                            });
                        }
                    }
                }
            }

            // Check Cargo.toml if present
            let cargo_toml = p.join("Cargo.toml");
            if cargo_toml.is_file() {
                if let Ok(raw) = fs::read_to_string(&cargo_toml) {
                    if let Ok(val) = raw.parse::<toml::Value>() {
                        if let Some(pkg) = val.get("package") {
                            let ver = pkg.get("version").and_then(|v| v.as_str());
                            if ver.map(|v| SEMVER_OR_CALVER_RE.is_match(v)) != Some(true) {
                                findings.push(ArchFinding {
                                    rule_id: "ARCH-013".into(),
                                    category: "manifest-versioning-integrity".into(),
                                    severity: Severity::Error,
                                    path: normalize_rel(root, &cargo_toml),
                                    line: None,
                                    message: format!(
                                        "Crate `{}` is missing a valid SemVer `version` string in [package] (got `{}`)",
                                        normalize_rel(root, &cargo_toml),
                                        ver.unwrap_or("(none)")
                                    ),
                                    remediation: "Add `version = \"0.1.0\"` under `[package]` in `Cargo.toml`.".into(),
                                });
                            }
                        }
                    }
                }
            }
        }
    }
}

fn is_test_source_path(rel: &str) -> bool {
    rel.contains("/test/")
        || rel.contains("/tests/")
        || rel.ends_with(".test.ts")
        || rel.ends_with(".spec.ts")
        || rel.ends_with("_test.rs")
        || rel.ends_with("_test.go")
}

/// Rules ARCH-007, ARCH-008, ARCH-009: Parallel content scan across first-party files
fn scan_first_party_contents(
    root: &Path,
    check_docs_emojis: bool,
    findings: &mut Vec<ArchFinding>,
) -> usize {
    let mut scan_roots = vec![
        root.join("crates"),
        root.join("packages"),
        root.join("infra"),
        root.join("tools"),
        root.join("apps").join("aphrody"),
        root.join("apps").join("aphrody-app"),
    ];
    if check_docs_emojis {
        scan_roots.push(root.join("docs"));
    }

    let mut all_files = Vec::new();
    for r in &scan_roots {
        if r.is_dir() {
            collect_domain_files(r, &mut all_files);
        }
    }

    // Also include top-level files at C:\src (excluding C:\src\.env itself, which is the local vault)
    if let Ok(entries) = fs::read_dir(root) {
        for e in entries.flatten() {
            let p = e.path();
            if p.is_file() && !is_reparse_point(&p) {
                let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if name != ".env" && name != "bun.lock" && name != "src.lock.json" {
                    all_files.push(p);
                }
            }
        }
    }

    let total_scanned = all_files.len();

    let file_findings: Vec<ArchFinding> = all_files
        .par_iter()
        .flat_map(|f| {
            let mut local = Vec::new();
            let fname = f.file_name().and_then(|n| n.to_str()).unwrap_or("");
            let rel = normalize_rel(root, f);

            // ARCH-008: Any `.env` file inside subdirectories (only `.env.example` allowed)
            if fname == ".env" || (fname.starts_with(".env.") && fname != ".env.example") {
                local.push(ArchFinding {
                    rule_id: "ARCH-008".into(),
                    category: "secret-vault-hygiene".into(),
                    severity: Severity::Error,
                    path: rel.clone(),
                    line: None,
                    message: format!(
                        "Forbidden `.env` secret file `{rel}` inside workspace tree (all secrets must reside solely in untracked `C:\\src\\.env`)"
                    ),
                    remediation: "Consolidate keys into `C:\\src\\.env`, load via `@aphrody/env-kit`, and keep only `.env.example` in subpackages.".into(),
                });
                return local;
            }

            let ext = f
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();

            let is_text = matches!(
                ext.as_str(),
                "rs" | "ts"
                    | "tsx"
                    | "js"
                    | "mjs"
                    | "go"
                    | "md"
                    | "mdx"
                    | "toml"
                    | "json"
                    | "yaml"
                    | "yml"
                    | "ps1"
                    | "sh"
                    | "cmd"
                    | "bat"
                    | "css"
                    | "html"
                    | "wgsl"
                    | "nix"
            ) || matches!(fname, "justfile" | "Dockerfile" | "PKGBUILD" | "APKBUILD");

            if !is_text {
                return local;
            }

            // Skip oversized generated JSON catalogs (> 2 MB) for line regexes
            if let Ok(meta) = f.metadata()
                && meta.len() > 2 * 1024 * 1024
            {
                return local;
            }

            let Ok(content) = fs::read_to_string(f) else {
                return local;
            };

            // ARCH-007: Host userspace System32 mutation check (skip archguard's own rules/tests)
            let is_self_rule_def = rel.starts_with("tools/archguard/");
            if !is_self_rule_def && !matches!(ext.as_str(), "md" | "mdx") {
                for (idx, line) in content.lines().enumerate() {
                    if SYSTEM32_MUTATION_RE.is_match(line) {
                        local.push(ArchFinding {
                            rule_id: "ARCH-007".into(),
                            category: "host-userspace-boundary".into(),
                            severity: Severity::Error,
                            path: rel.clone(),
                            line: Some(idx + 1),
                            message: "Detected command or path mutating sacred Windows host directory (`System32` / `SysWOW64`)".into(),
                            remediation: "Never write to `C:\\Windows\\System32`; install userland binaries and DLLs exclusively in `C:\\Users\\aphro\\.local\\bin`.".into(),
                        });
                        break;
                    }
                }
            }

            // ARCH-008: Raw token leak check
            if !is_self_rule_def {
                let in_test_file = is_test_source_path(&rel);
                for (idx, line) in content.lines().enumerate() {
                    if SECRET_TOKEN_RE.is_match(line) {
                        let upper = line.to_ascii_uppercase();
                        let is_general_placeholder = upper.contains("REDACTED")
                            || upper.contains("EXAMPLE")
                            || upper.contains("PLACEHOLDER")
                            || line.contains("Regex::new")
                            || line.contains("TOKEN_PREFIX_REDACTION_REGEX");
                        let is_synthetic_test_fixture = in_test_file
                            && (upper.contains("SYNTHETIC")
                                || upper.contains("MOCK")
                                || upper.contains("FAKE")
                                || upper.contains("DUMMY")
                                || upper.contains("FIXTURE"));
                        if !is_general_placeholder && !is_synthetic_test_fixture {
                            local.push(ArchFinding {
                                rule_id: "ARCH-008".into(),
                                category: "secret-vault-hygiene".into(),
                                severity: Severity::Error,
                                path: rel.clone(),
                                line: Some(idx + 1),
                                message: "Potential live credential/API token pattern detected in source or documentation (redacted output)".into(),
                                remediation: "Remove raw credential immediately, rotate if live, and read dynamically from `C:\\src\\.env` via `env-kit`.".into(),
                            });
                            break;
                        }
                    }
                }
            }

            // ARCH-009: Zero-Emoji check
            if !is_self_rule_def && let Some((line_no, ch)) = find_first_emoji(&content) {
                local.push(ArchFinding {
                    rule_id: "ARCH-009".into(),
                    category: "zero-emoji-anti-slop".into(),
                    severity: Severity::Error,
                    path: rel.clone(),
                    line: Some(line_no),
                    message: format!(
                        "Forbidden pictographic emoji character U+{:04X} detected (Zero-Emoji directive)",
                        ch as u32
                    ),
                    remediation: "Strip all emoji characters from code, comments, UI labels, and Markdown.".into(),
                });
            }

            local
        })
        .collect();

    findings.extend(file_findings);
    total_scanned
}

pub fn run_audit(config: &AuditConfig) -> AuditReport {
    let t0 = Instant::now();
    let mut findings = Vec::new();

    check_root_topology(&config.root, &mut findings);
    check_crates_domain(&config.root, &mut findings);
    check_packages_domain(&config.root, &mut findings);
    check_apps_domain(&config.root, &mut findings);
    check_infra_domain(&config.root, &mut findings);
    check_tools_domain(&config.root, &mut findings);
    check_atlas_link_integrity(&config.root, &mut findings);
    check_versioning_integrity(&config.root, &mut findings);
    let scanned_files =
        scan_first_party_contents(&config.root, config.check_docs_emojis, &mut findings);

    if let Some(ref filter) = config.only_rule {
        let f_upper = filter.to_ascii_uppercase();
        findings.retain(|item| {
            item.rule_id.eq_ignore_ascii_case(&f_upper)
                || item.category.eq_ignore_ascii_case(filter)
        });
    }

    if config.strict {
        for f in &mut findings {
            f.severity = Severity::Error;
        }
    }

    findings.sort_by(|a, b| {
        a.severity
            .cmp(&b.severity)
            .then_with(|| a.rule_id.cmp(&b.rule_id))
            .then_with(|| a.path.cmp(&b.path))
            .then_with(|| a.line.cmp(&b.line))
    });

    let mut error_count = 0usize;
    let mut warning_count = 0usize;
    let mut by_rule: BTreeMap<String, usize> = BTreeMap::new();

    for r in RULES {
        by_rule.insert(r.id.to_string(), 0);
    }
    for f in &findings {
        *by_rule.entry(f.rule_id.clone()).or_insert(0) += 1;
        match f.severity {
            Severity::Error => error_count += 1,
            Severity::Warning => warning_count += 1,
        }
    }

    let serialized_findings = serde_json::to_vec(&findings).unwrap_or_default();
    let report_blake3 = blake3::hash(&serialized_findings).to_hex().to_string();

    AuditReport {
        tool: "archguard".into(),
        version: VERSION.into(),
        root: config.root.to_string_lossy().to_string(),
        clean: error_count == 0 && (!config.strict || warning_count == 0),
        strict: config.strict,
        scanned_files,
        error_count,
        warning_count,
        duration_ms: t0.elapsed().as_secs_f64() * 1000.0,
        report_blake3,
        by_rule,
        findings,
    }
}

pub fn format_human_report(report: &AuditReport) -> String {
    let mut out = String::new();
    out.push_str("==============================================================================\n");
    out.push_str(&format!(
        "ARCHGUARD v{} — Sovereign Monorepo Architecture & Domain-Purity Gate\n",
        report.version
    ));
    out.push_str("==============================================================================\n");
    out.push_str(&format!("Root:           {}\n", report.root));
    out.push_str(&format!("Scanned Files:  {}\n", report.scanned_files));
    out.push_str(&format!("Duration:       {:.2} ms\n", report.duration_ms));
    out.push_str(&format!("Report Blake3:  {}\n", &report.report_blake3[..16]));
    out.push_str(&format!(
        "Status:         {} ({} errors, {} warnings)\n",
        if report.clean { "PASS" } else { "FAIL" },
        report.error_count,
        report.warning_count
    ));
    out.push_str("------------------------------------------------------------------------------\n");
    out.push_str("Rule Breakdown:\n");
    for rule in RULES {
        let count = report.by_rule.get(rule.id).copied().unwrap_or(0);
        let status = if count == 0 { "OK" } else { "VIOLATION" };
        out.push_str(&format!(
            "  {:<10} {:<10} {:>4}  {}\n",
            rule.id, status, count, rule.category
        ));
    }

    if !report.findings.is_empty() {
        out.push_str(
            "------------------------------------------------------------------------------\n",
        );
        out.push_str("Findings:\n");
        for (idx, f) in report.findings.iter().enumerate() {
            let loc = match f.line {
                Some(ln) => format!("{}:{}", f.path, ln),
                None => f.path.clone(),
            };
            out.push_str(&format!(
                "  {}. [{}] {} ({})\n     Message:     {}\n     Remediation: {}\n",
                idx + 1,
                f.severity.as_str(),
                f.rule_id,
                loc,
                f.message,
                f.remediation
            ));
        }
    }
    out.push_str("==============================================================================\n");
    out
}
