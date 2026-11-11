use crate::constants::{ALLOWED_ROOT_PHYSICAL_DIRS, is_reparse_point, normalize_rel};
use crate::models::{ArchFinding, Severity};
use std::collections::BTreeSet;
use std::fs;
use std::path::Path;

/// Rule ARCH-005: Root Topology & Junction Integrity
pub fn check_root_topology(root: &Path, findings: &mut Vec<ArchFinding>) {
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
