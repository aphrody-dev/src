use crate::constants::{is_reparse_point, normalize_rel};
use crate::models::{ArchFinding, Severity};
use serde_json::Value;
use std::fs;
use std::path::Path;

const ALLOWED_NATIVE_SUBDIRS: &[&str] = &[
    "crates",
    "native",
    "rust-core",
    "rust-desktop",
    "loaders",
    "zig",
    "python",
];

/// Rules ARCH-003 & ARCH-016: Audit `packages/*`
pub fn check_packages_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
    let pkgs_dir = root.join("packages");
    let Ok(entries) = fs::read_dir(&pkgs_dir) else {
        return;
    };

    for entry in entries.flatten() {
        let pkg_path = entry.path();
        if !pkg_path.is_dir() || is_reparse_point(&pkg_path) {
            continue;
        }
        let pkg_dir_name = pkg_path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("");
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
                message: format!("Missing `package.json` in package directory `{pkg_dir_name}`"),
                remediation: format!("Create `@aphrody/{pkg_dir_name}` `package.json` in `{}`.", normalize_rel(root, &pkg_path)),
            });
            continue;
        }

        // Parse package.json
        if let Ok(content) = fs::read_to_string(&pkg_json) {
            if let Ok(val) = serde_json::from_str::<Value>(&content) {
                // Scope verification
                if let Some(name) = val.get("name").and_then(|n| n.as_str()) {
                    if !name.starts_with("@aphrody/") {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-003".into(),
                            category: "package-domain-purity".into(),
                            severity: Severity::Error,
                            path: normalize_rel(root, &pkg_json),
                            line: None,
                            message: format!("Package `{name}` lacks required `@aphrody/` monorepo scope prefix"),
                            remediation: format!("Rename package to `@aphrody/{name}` in `package.json`."),
                        });
                    }
                } else {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-003".into(),
                        category: "package-domain-purity".into(),
                        severity: Severity::Error,
                        path: normalize_rel(root, &pkg_json),
                        line: None,
                        message: format!("Package `{pkg_dir_name}` has missing `name` field in `package.json`"),
                        remediation: format!("Declare `\"name\": \"@aphrody/{pkg_dir_name}\"` in `package.json`."),
                    });
                }

                // Zero-NPM dependency enforcement (Sumner / Page principle)
                for dep_field in ["dependencies", "devDependencies"] {
                    if let Some(deps_map) = val.get(dep_field).and_then(|d| d.as_object()) {
                        for (dep_name, dep_ver) in deps_map {
                            let ver_str = dep_ver.as_str().unwrap_or("");
                            let is_workspace = ver_str.starts_with("workspace:") || dep_name.starts_with("@aphrody/");
                            let is_approved_bun_types = dep_name == "@types/bun";
                            let is_approved_types = dep_name.starts_with("@types/");

                            if !is_workspace && !is_approved_bun_types && !is_approved_types {
                                findings.push(ArchFinding {
                                    rule_id: "ARCH-003".into(),
                                    category: "package-domain-purity".into(),
                                    severity: Severity::Error,
                                    path: normalize_rel(root, &pkg_json),
                                    line: None,
                                    message: format!(
                                        "Forbidden external npm dependency `{dep_name}: {ver_str}` in package `{pkg_dir_name}` (Zero-NPM directive)"
                                    ),
                                    remediation: format!(
                                        "Replace `{dep_name}` with native Bun v1.4.4 APIs (`bun:sqlite`, `Bun.serve`, `Bun.build`) or link to internal `@aphrody/*` workspace packages."
                                    ),
                                });
                            }
                        }
                    }
                }

                // ARCH-016: Bun Upstream Zero-Glue & Speed Hygiene
                if let Some(scripts) = val.get("scripts").and_then(|s| s.as_object()) {
                    for hook in ["postinstall", "preinstall"] {
                        if let Some(script_body) = scripts.get(hook).and_then(|b| b.as_str()) {
                            if script_body.contains("node-gyp") || script_body.contains("npm rebuild") {
                                findings.push(ArchFinding {
                                    rule_id: "ARCH-016".into(),
                                    category: "bun-speed-zero-glue-hygiene".into(),
                                    severity: Severity::Error,
                                    path: normalize_rel(root, &pkg_json),
                                    line: None,
                                    message: format!(
                                        "Forbidden legacy native build hook `{hook}: {script_body}` in package `{pkg_dir_name}`"
                                    ),
                                    remediation: "Compile native extensions via sovereign Rust/Zig toolchains into `native/` or `crates/`, eliminating npm postinstall hooks.".into(),
                                });
                            }
                        }
                    }
                }
            }
        }

        // ARCH-016: Check for forbidden binding.gyp
        let binding_gyp = pkg_path.join("binding.gyp");
        if binding_gyp.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-016".into(),
                category: "bun-speed-zero-glue-hygiene".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &binding_gyp),
                line: None,
                message: format!("Forbidden node-gyp build descriptor `binding.gyp` in package `{pkg_dir_name}`"),
                remediation: "Use pure Rust FFI or Bun native WASM/C bindings instead of node-gyp.".into(),
            });
        }

        // Forbidden lockfiles inside packages
        for lock in ["package-lock.json", "pnpm-lock.yaml", "yarn.lock"] {
            let p = pkg_path.join(lock);
            if p.is_file() {
                findings.push(ArchFinding {
                    rule_id: "ARCH-003".into(),
                    category: "package-domain-purity".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &p),
                    line: None,
                    message: format!("Forbidden legacy lockfile `{lock}` in `{pkg_dir_name}` (Bun v1.4.4 workspace uses root bun.lock)"),
                    remediation: format!("Delete `{}`.", normalize_rel(root, &p)),
                });
            }
        }

        // Forbidden root Cargo.toml or go.mod directly under packages/* (must be inside native/ or subdirs)
        let root_cargo = pkg_path.join("Cargo.toml");
        if root_cargo.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-003".into(),
                category: "package-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &root_cargo),
                line: None,
                message: format!("Root `Cargo.toml` found directly inside package `{pkg_dir_name}`"),
                remediation: format!("Move `{}` into `native/`, `crates/`, or `rust-core/` within the package.", normalize_rel(root, &root_cargo)),
            });
        }

        let root_go = pkg_path.join("go.mod");
        if root_go.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-003".into(),
                category: "package-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &root_go),
                line: None,
                message: format!("Root `go.mod` found directly inside package `{pkg_dir_name}`"),
                remediation: format!("Move `{}` into `infra/` or isolated native subfolder.", normalize_rel(root, &root_go)),
            });
        }

        // Check for stray root-level .rs files in packages (should be in native subdirs)
        if let Ok(entries) = fs::read_dir(&pkg_path) {
            for e in entries.flatten() {
                let p = e.path();
                let fname = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
                if p.is_dir() {
                    let ext_rs = p.join("src").join("main.rs");
                    if ext_rs.is_file() && !ALLOWED_NATIVE_SUBDIRS.contains(&fname) {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-003".into(),
                            category: "package-domain-purity".into(),
                            severity: Severity::Error,
                            path: normalize_rel(root, &p),
                            line: None,
                            message: format!("Unapproved native directory `{fname}` in `{pkg_dir_name}` (expected one of: {ALLOWED_NATIVE_SUBDIRS:?})"),
                            remediation: format!("Rename `{fname}` to `native/` or `crates/`."),
                        });
                    }
                } else if p.is_file() {
                    let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
                    if ext == "rs" && fname != "build.rs" {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-003".into(),
                            category: "package-domain-purity".into(),
                            severity: Severity::Error,
                            path: normalize_rel(root, &p),
                            line: None,
                            message: format!("Loose Rust source file `{fname}` at root of package `{pkg_dir_name}`"),
                            remediation: "Isolate native Rust source inside `native/` or `crates/` subfolder.".into(),
                        });
                    }
                }
            }
        }
    }
}
