use crate::constants::normalize_rel;
use crate::models::{ArchFinding, Severity};
use std::fs;
use std::path::Path;

/// Rule ARCH-015: Linux Upstream MAINTAINERS File & Patch Series Hygiene
pub fn check_linux_hygiene(root: &Path, findings: &mut Vec<ArchFinding>) {
    // 1. MAINTAINERS File Validation (Linux kernel get_maintainer.pl standard)
    let maintainers_file = root.join("MAINTAINERS");
    if maintainers_file.is_file() {
        if let Ok(content) = fs::read_to_string(&maintainers_file) {
            let rel_path = normalize_rel(root, &maintainers_file);
            let mut current_section = String::new();
            let has_header = content.contains("Maintainers List");
            let mut in_maintainers_list = !has_header;

            for (idx, line) in content.lines().enumerate() {
                let trimmed = line.trim();
                if trimmed.is_empty()
                    || trimmed.starts_with('#')
                    || trimmed.starts_with('=')
                    || trimmed.starts_with('-')
                {
                    continue;
                }

                if trimmed == "Maintainers List" {
                    in_maintainers_list = true;
                    continue;
                }

                if !in_maintainers_list {
                    continue;
                }

                // If line does not start with a tag like M:, L:, S:, W:, T:, F:, X: it might be a section header
                if !trimmed.contains(':')
                    || (!trimmed.starts_with("M:")
                        && !trimmed.starts_with("L:")
                        && !trimmed.starts_with("S:")
                        && !trimmed.starts_with("W:")
                        && !trimmed.starts_with("T:")
                        && !trimmed.starts_with("F:")
                        && !trimmed.starts_with("X:"))
                {
                    current_section = trimmed.to_string();
                    continue;
                }

                if let Some((tag, val)) = trimmed.split_once(':') {
                    let tag = tag.trim();
                    let val = val.trim();

                    if tag == "F" {
                        // Check that the file / directory pattern exists
                        if val == "*" || val == "*/" {
                            continue;
                        }
                        let clean_val = val.trim_end_matches('/');
                        let target =
                            root.join(clean_val.replace('/', std::path::MAIN_SEPARATOR_STR));
                        if !target.exists() {
                            findings.push(ArchFinding {
                                rule_id: "ARCH-015".into(),
                                category: "linux-upstream-maintainers-hygiene".into(),
                                severity: Severity::Error,
                                path: rel_path.clone(),
                                line: Some(idx + 1),
                                message: format!(
                                    "MAINTAINERS section `{current_section}` lists non-existent path pattern `F: {val}`"
                                ),
                                remediation: "Update or remove stale path in `MAINTAINERS` via `ay manifests`.".into(),
                            });
                        }
                    } else if tag == "S" {
                        let allowed_status =
                            ["Supported", "Maintained", "Odd Fixes", "Orphan", "Obsolete"];
                        if !allowed_status.contains(&val) {
                            findings.push(ArchFinding {
                                rule_id: "ARCH-015".into(),
                                category: "linux-upstream-maintainers-hygiene".into(),
                                severity: Severity::Warning,
                                path: rel_path.clone(),
                                line: Some(idx + 1),
                                message: format!("Non-standard kernel status `S: {val}` in section `{current_section}`"),
                                remediation: format!("Use canonical Linux status (one of: {allowed_status:?})."),
                            });
                        }
                    }
                }
            }
        }
    }

    // 2. Patch Series Hygiene (Quilt / b4 / git-am standard)
    let series_file = root.join("docs").join("patches").join("series");
    if series_file.is_file() {
        if let Ok(content) = fs::read_to_string(&series_file) {
            let rel_series = normalize_rel(root, &series_file);
            let series_parent = series_file.parent().unwrap();

            for (idx, line) in content.lines().enumerate() {
                let trimmed = line.trim();
                if trimmed.is_empty() || trimmed.starts_with('#') {
                    continue;
                }

                // Format: <relative-patch-path> -p1
                let patch_rel = trimmed.split_whitespace().next().unwrap_or("");
                if patch_rel.is_empty() {
                    continue;
                }

                let patch_path = series_parent.join(patch_rel);
                if !patch_path.is_file() {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-015".into(),
                        category: "linux-upstream-maintainers-hygiene".into(),
                        severity: Severity::Error,
                        path: rel_series.clone(),
                        line: Some(idx + 1),
                        message: format!("Patch series references non-existent patch file `{patch_rel}`"),
                        remediation: "Verify patch file path or remove stale entry from `docs/patches/series`.".into(),
                    });
                } else if let Ok(patch_content) = fs::read_to_string(&patch_path) {
                    // Checkpatch format validation: must have valid patch headers
                    let has_patch_header = patch_content.lines().take(30).any(|l| {
                        l.starts_with("diff --git")
                            || l.starts_with("--- ")
                            || l.starts_with("From ")
                            || l.starts_with("Index: ")
                    });
                    if !has_patch_header {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-015".into(),
                            category: "linux-upstream-maintainers-hygiene".into(),
                            severity: Severity::Error,
                            path: normalize_rel(root, &patch_path),
                            line: None,
                            message: format!("Patch file `{patch_rel}` lacks standard unified diff headers (`diff --git` or `--- `)"),
                            remediation: "Regenerate patch using `git format-patch` or `diff -u`.".into(),
                        });
                    }
                }
            }
        }
    }
}
