use crate::constants::{is_reparse_point, normalize_rel};
use crate::models::{ArchFinding, Severity};
use serde_json::Value;
use std::fs;
use std::path::Path;

/// Rule ARCH-011: Tools Domain Purity
pub fn check_tools_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
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
        let tests_dir = tool_path.join("tests");

        let has_cargo = cargo_toml.is_file();
        let has_pkg = pkg_json.is_file();

        // 1. Single-domain manifest requirement: must have Cargo.toml XOR package.json
        if !has_cargo && !has_pkg {
            findings.push(ArchFinding {
                rule_id: "ARCH-011".into(),
                category: "tools-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &tool_path),
                line: None,
                message: format!("Tool `{tool_name}` lacks a manifest (must declare Cargo.toml or package.json)"),
                remediation: format!("Create `Cargo.toml` (for pure Rust tools) or `package.json` (for Bun tools) in `{}`.", normalize_rel(root, &tool_path)),
            });
        } else if has_cargo && has_pkg {
            findings.push(ArchFinding {
                rule_id: "ARCH-011".into(),
                category: "tools-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &tool_path),
                line: None,
                message: format!("Tool `{tool_name}` is hybrid-polluted (declares both Cargo.toml and package.json at root)"),
                remediation: format!("Choose a single primary domain for `{tool_name}`: either pure Rust 2024 CLI or pure Bun CLI."),
            });
        }

        // 2. Pure Rust tool checks
        if has_cargo {
            if let Ok(content) = fs::read_to_string(&cargo_toml) {
                let has_edition_2024 = content.lines().any(|l| {
                    let trimmed = l.trim().replace(' ', "");
                    trimmed == "edition=\"2024\"" || trimmed == "edition='2024'"
                });
                if !has_edition_2024 {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-011".into(),
                        category: "tools-domain-purity".into(),
                        severity: Severity::Error,
                        path: normalize_rel(root, &cargo_toml),
                        line: None,
                        message: format!("Rust tool `{tool_name}` does not declare `edition = \"2024\"` in Cargo.toml"),
                        remediation: "Upgrade tool manifest to Rust 2024 edition.".into(),
                    });
                }
            }

            // No stray TypeScript or JavaScript in pure Rust tool
            let mut stray_files = Vec::new();
            collect_tool_files(&tool_path, &mut stray_files);
            for f in stray_files {
                let ext = f.extension().and_then(|e| e.to_str()).unwrap_or("");
                if matches!(ext, "ts" | "tsx" | "js" | "jsx" | "mjs") {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-011".into(),
                        category: "tools-domain-purity".into(),
                        severity: Severity::Error,
                        path: normalize_rel(root, &f),
                        line: None,
                        message: format!("Forbidden TypeScript/JavaScript file `{}` inside pure Rust tool `{tool_name}`", f.file_name().and_then(|n| n.to_str()).unwrap_or("")),
                        remediation: "Remove web/JS scripts from pure Rust tool or isolate inside native test harness.".into(),
                    });
                }
            }
        }

        // 3. Bun tool checks
        if has_pkg && let Ok(content) = fs::read_to_string(&pkg_json) {
            if let Ok(val) = serde_json::from_str::<Value>(&content) {
                if let Some(name) = val.get("name").and_then(|n| n.as_str()) {
                    if !name.starts_with("@aphrody/") && !name.starts_with("tool-") {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-011".into(),
                            category: "tools-domain-purity".into(),
                            severity: Severity::Error,
                            path: normalize_rel(root, &pkg_json),
                            line: None,
                            message: format!("Tool package `{name}` lacks required `@aphrody/` or `tool-` prefix"),
                            remediation: format!("Rename `{name}` to `@aphrody/{tool_name}` in package.json."),
                        });
                    }
                }
            }
        }

        // 4. Required Documentation: README.md
        if !readme.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-011".into(),
                category: "tools-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &tool_path),
                line: None,
                message: format!("Missing required `README.md` documentation in tool `{tool_name}`"),
                remediation: format!("Add a comprehensive `README.md` describing purpose, flags, and usage in `{}`.", normalize_rel(root, &tool_path)),
            });
        }

        // 5. Required Tests: tests/ directory
        if !tests_dir.is_dir() {
            findings.push(ArchFinding {
                rule_id: "ARCH-011".into(),
                category: "tools-domain-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &tool_path),
                line: None,
                message: format!("Missing required `tests/` directory in tool `{tool_name}`"),
                remediation: format!("Add deterministic integration tests under `{}/tests/`.", normalize_rel(root, &tool_path)),
            });
        }
    }
}

fn collect_tool_files(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for e in entries.flatten() {
        let p = e.path();
        if is_reparse_point(&p) {
            continue;
        }
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if name == "target" || name == "node_modules" || name == ".git" || name == ".jj" {
            continue;
        }
        if p.is_dir() {
            collect_tool_files(&p, out);
        } else if p.is_file() {
            out.push(p);
        }
    }
}
