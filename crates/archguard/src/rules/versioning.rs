use crate::constants::{
    SEMVER_OR_CALVER_RE, is_reparse_point, manifest_inherits, normalize_rel,
    workspace_package_value,
};
use crate::models::{ArchFinding, Severity};
use serde_json::Value;
use std::fs;
use std::path::Path;

/// Rule ARCH-013: Verify SemVer and CalVer versioning integrity monorepo-wide
pub fn check_versioning_integrity(root: &Path, findings: &mut Vec<ArchFinding>) {
    // 1. Root package.json
    let root_pkg = root.join("package.json");
    if root_pkg.is_file() {
        if let Ok(raw) = fs::read_to_string(&root_pkg) {
            if let Ok(val) = serde_json::from_str::<Value>(&raw) {
                let ver = val.get("version").and_then(|v| v.as_str());
                if ver.map(|v| SEMVER_OR_CALVER_RE.is_match(v)) != Some(true) {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-013".into(),
                        category: "manifest-versioning-integrity".into(),
                        severity: Severity::Error,
                        path: "package.json".into(),
                        line: None,
                        message: format!(
                            "Root package.json has missing or invalid version `{}` (expected the SemVer of VERSION, docs/VERSIONING.md)",
                            ver.unwrap_or("(none)")
                        ),
                        remediation: "Run `ay release freeze` (copies VERSION into package.json and Cargo.toml).".into(),
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
                            message:
                                "infra/go.mod is missing `go 1.xx` toolchain version directive"
                                    .into(),
                            remediation: "Add `go 1.27` toolchain directive to `infra/go.mod`."
                                .into(),
                        });
                    }
                }
            }
            continue;
        }

        let Ok(entries) = fs::read_dir(&dom_dir) else {
            continue;
        };

        for entry in entries.flatten() {
            let p = entry.path();
            if !p.is_dir() || is_reparse_point(&p) {
                continue;
            }
            let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if name.starts_with('.') {
                continue;
            }

            // Check Cargo.toml in crate/tool
            let cargo_toml = p.join("Cargo.toml");
            if cargo_toml.is_file() {
                if let Ok(content) = fs::read_to_string(&cargo_toml) {
                    // Check if workspace root manifest (contains [workspace])
                    if !content.contains("[workspace]") {
                        let mut has_version = false;
                        for line in content.lines() {
                            let trimmed = line.trim();
                            if trimmed.starts_with("version") {
                                if let Some((_, val)) = trimmed.split_once('=') {
                                    let v = val.trim().trim_matches('"').trim_matches('\'');
                                    if SEMVER_OR_CALVER_RE.is_match(v) {
                                        has_version = true;
                                    }
                                }
                                break;
                            }
                        }
                        if !has_version && manifest_inherits(&content, "version") {
                            has_version = workspace_package_value(root, "version")
                                .is_some_and(|v| SEMVER_OR_CALVER_RE.is_match(&v));
                        }
                        if !has_version {
                            findings.push(ArchFinding {
                                rule_id: "ARCH-013".into(),
                                category: "manifest-versioning-integrity".into(),
                                severity: Severity::Error,
                                path: normalize_rel(root, &cargo_toml),
                                line: None,
                                message: format!("Crate/tool `{name}` has missing or invalid version in `Cargo.toml`"),
                                remediation: "Add valid SemVer `version = \"0.1.0\"` to `Cargo.toml`.".into(),
                            });
                        }
                    }
                }
            }

            // Check package.json in package/app/tool
            let pkg_json = p.join("package.json");
            if pkg_json.is_file() {
                if let Ok(raw) = fs::read_to_string(&pkg_json) {
                    if let Ok(val) = serde_json::from_str::<Value>(&raw) {
                        let ver = val.get("version").and_then(|v| v.as_str());
                        if ver.map(|v| SEMVER_OR_CALVER_RE.is_match(v)) != Some(true) {
                            findings.push(ArchFinding {
                                rule_id: "ARCH-013".into(),
                                category: "manifest-versioning-integrity".into(),
                                severity: Severity::Error,
                                path: normalize_rel(root, &pkg_json),
                                line: None,
                                message: format!(
                                    "Package/app `{name}` has missing or invalid `version` field in `package.json`"
                                ),
                                remediation: "Set valid SemVer or CalVer (e.g. `\"version\": \"1.0.0\"`) in `package.json`.".into(),
                            });
                        }
                    }
                }
            }
        }
    }
}
