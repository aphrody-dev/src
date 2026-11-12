use crate::constants::{
    CRATE_FORBIDDEN_EXTENSIONS, CRATE_FORBIDDEN_FILES, is_reparse_point, manifest_inherits,
    normalize_rel, should_skip_dir_name, workspace_package_value,
};
use crate::models::{ArchFinding, Severity};
use std::fs;
use std::path::Path;

/// Rules ARCH-001 & ARCH-002: Audit `crates/*`
pub fn check_crates_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
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
                message: format!("Forbidden `node_modules` inside pure Rust crate `{crate_name}`"),
                remediation: format!(
                    "Delete `{}` immediately; crates must remain 100% native Rust.",
                    normalize_rel(root, &nm)
                ),
            });
        }

        // ARCH-002: Cargo.toml check
        let cargo_toml = crate_path.join("Cargo.toml");
        if !cargo_toml.is_file() {
            findings.push(ArchFinding {
                rule_id: "ARCH-002".into(),
                category: "crate-manifest-edition".into(),
                severity: Severity::Warning,
                path: normalize_rel(root, &crate_path),
                line: None,
                message: format!("Missing `Cargo.toml` in crate directory `{crate_name}`"),
                remediation: format!(
                    "Create `Cargo.toml` with `edition = \"2024\"` in `{}`.",
                    normalize_rel(root, &crate_path)
                ),
            });
        } else if let Ok(content) = fs::read_to_string(&cargo_toml) {
            let is_virtual_workspace =
                content.contains("[workspace]") && !content.contains("[package]");
            if !is_virtual_workspace {
                // Check edition = "2024"
                let has_edition_2024 = content.lines().any(|l| {
                    let trimmed = l.trim().replace(' ', "");
                    trimmed == "edition=\"2024\"" || trimmed == "edition='2024'"
                }) || (manifest_inherits(&content, "edition")
                    && workspace_package_value(root, "edition").as_deref() == Some("2024"));
                if !has_edition_2024 {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-002".into(),
                        category: "crate-manifest-edition".into(),
                        severity: Severity::Warning,
                        path: normalize_rel(root, &cargo_toml),
                        line: None,
                        message: format!("Crate `{crate_name}` does not declare `edition = \"2024\"`"),
                        remediation: "Upgrade crate manifest to `edition = \"2024\"` in `Cargo.toml`.".into(),
                    });
                }
            }
        }

        // Traverse crate files for forbidden files & forbidden extensions
        let mut crate_files = Vec::new();
        collect_crate_files_recursive(&crate_path, &mut crate_files);

        let mut has_rs_source = false;
        for file in crate_files {
            let rel = normalize_rel(root, &file);
            let fname = file.file_name().and_then(|n| n.to_str()).unwrap_or("");
            let ext = file
                .extension()
                .and_then(|e| e.to_str())
                .unwrap_or("")
                .to_ascii_lowercase();

            if ext == "rs" {
                has_rs_source = true;
            }

            // ARCH-001: Forbidden files in crate
            if CRATE_FORBIDDEN_FILES.contains(&fname) {
                findings.push(ArchFinding {
                    rule_id: "ARCH-001".into(),
                    category: "crate-domain-purity".into(),
                    severity: Severity::Error,
                    path: rel.clone(),
                    line: None,
                    message: format!("Forbidden web/runtime manifest `{fname}` inside pure Rust crate `{crate_name}`"),
                    remediation: format!("Delete `{fname}` or move this component into `packages/` or `apps/`."),
                });
            }

            // ARCH-001: Forbidden extensions in crate
            if CRATE_FORBIDDEN_EXTENSIONS.contains(&ext.as_str()) {
                findings.push(ArchFinding {
                    rule_id: "ARCH-001".into(),
                    category: "crate-domain-purity".into(),
                    severity: Severity::Error,
                    path: rel.clone(),
                    line: None,
                    message: format!("Forbidden source extension `.{ext}` inside pure Rust crate `{crate_name}`"),
                    remediation: format!("Remove `.{ext}` file from pure Rust crate or move component into `packages/`."),
                });
            }
        }

        if !has_rs_source {
            findings.push(ArchFinding {
                rule_id: "ARCH-002".into(),
                category: "crate-manifest-edition".into(),
                severity: Severity::Warning,
                path: normalize_rel(root, &crate_path),
                line: None,
                message: format!("Crate `{crate_name}` contains zero `.rs` Rust source files"),
                remediation: format!(
                    "Add Rust source code under `{}/src/` or remove obsolete crate folder.",
                    normalize_rel(root, &crate_path)
                ),
            });
        }
    }
}

fn collect_crate_files_recursive(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
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
            collect_crate_files_recursive(&p, out);
        } else if p.is_file() {
            out.push(p);
        }
    }
}
