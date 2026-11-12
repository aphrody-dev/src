use crate::constants::{is_reparse_point, normalize_rel, should_skip_dir_name};
use crate::models::{ArchFinding, Severity};
use serde_json::Value;
use std::fs;
use std::path::Path;

/// Rule ARCH-004: Pure-Rust & Zero-NPM Application Contract
pub fn check_apps_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
    let apps_dir = root.join("apps");
    if !apps_dir.is_dir() {
        return;
    }

    // 1. apps/aphrody-app: Pure-Rust Desktop/Mobile Shell Contract
    let aphrody_app = apps_dir.join("aphrody-app");
    if aphrody_app.is_dir() && !is_reparse_point(&aphrody_app) {
        let mut app_files = Vec::new();
        collect_app_files_recursive(&aphrody_app, &mut app_files);
        for f in app_files {
            let ext = f
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();
            if matches!(ext.as_str(), "ts" | "tsx" | "js" | "jsx" | "mjs" | "cjs") {
                findings.push(ArchFinding {
                    rule_id: "ARCH-004".into(),
                    category: "app-contract-purity".into(),
                    severity: Severity::Error,
                    path: normalize_rel(root, &f),
                    line: None,
                    message: format!(
                        "Forbidden TypeScript/JavaScript file `{}` inside pure-Rust application `apps/aphrody-app`",
                        f.file_name().and_then(|n| n.to_str()).unwrap_or("")
                    ),
                    remediation: "apps/aphrody-app is strictly a pure-Rust engine (Winit, WGPU, Slint, Native Windowing). Remove web scripts.".into(),
                });
            }
        }
    }

    // 2. apps/aphrody: Zero-NPM aphrody.com Contract
    let aphrody_web = apps_dir.join("aphrody");
    if aphrody_web.is_dir() && !is_reparse_point(&aphrody_web) {
        let pkg_json = aphrody_web.join("package.json");
        if pkg_json.is_file() {
            if let Ok(content) = fs::read_to_string(&pkg_json) {
                if let Ok(val) = serde_json::from_str::<Value>(&content) {
                    let has_deps = val
                        .get("dependencies")
                        .and_then(|d| d.as_object())
                        .map(|m| !m.is_empty())
                        .unwrap_or(false);
                    let has_dev_deps = val
                        .get("devDependencies")
                        .and_then(|d| d.as_object())
                        .map(|m| !m.is_empty())
                        .unwrap_or(false);

                    if has_deps || has_dev_deps {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-004".into(),
                            category: "app-contract-purity".into(),
                            severity: Severity::Error,
                            path: normalize_rel(root, &pkg_json),
                            line: None,
                            message: "apps/aphrody must have strictly empty `dependencies: {}` and `devDependencies: {}` (Zero-NPM Web Shell)".into(),
                            remediation: "Remove all dependencies from `apps/aphrody/package.json`; aphrody.com runs entirely on native Bun APIs, WebGPU, and WASM.".into(),
                        });
                    }
                }
            }
        }

        // Must not have node_modules or bun.lock in apps/aphrody
        let nm = aphrody_web.join("node_modules");
        if nm.exists() {
            findings.push(ArchFinding {
                rule_id: "ARCH-004".into(),
                category: "app-contract-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &nm),
                line: None,
                message: "Forbidden `node_modules` in `apps/aphrody` (Zero-NPM web platform)"
                    .into(),
                remediation:
                    "Delete `apps/aphrody/node_modules`; aphrody.com has zero dependencies.".into(),
            });
        }

        let lock = aphrody_web.join("bun.lock");
        if lock.exists() {
            findings.push(ArchFinding {
                rule_id: "ARCH-004".into(),
                category: "app-contract-purity".into(),
                severity: Severity::Error,
                path: normalize_rel(root, &lock),
                line: None,
                message:
                    "Forbidden isolated `bun.lock` in `apps/aphrody` (zero dependencies required)"
                        .into(),
                remediation: "Delete `apps/aphrody/bun.lock`.".into(),
            });
        }
    }
}

fn collect_app_files_recursive(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let p = entry.path();
        if is_reparse_point(&p) {
            continue;
        }
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if should_skip_dir_name(name) {
            continue;
        }
        if p.is_dir() {
            collect_app_files_recursive(&p, out);
        } else if p.is_file() {
            out.push(p);
        }
    }
}
