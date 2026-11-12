use crate::constants::{SKIP_DIRS, is_reparse_point, normalize_rel};
use crate::models::{ArchFinding, Severity};
use std::fs;
use std::path::Path;

/// Rule ARCH-014: Chromium DEPS Manifest Integrity & Presubmit Binary Hygiene
pub fn check_chromium_hygiene(root: &Path, findings: &mut Vec<ArchFinding>) {
    // 1. Chromium DEPS Manifest Integrity
    let deps_file = root.join("DEPS");
    if deps_file.is_file() {
        if let Ok(content) = fs::read_to_string(&deps_file) {
            let rel_deps = normalize_rel(root, &deps_file);
            let mut in_deps_block = false;

            for (idx, line) in content.lines().enumerate() {
                let trimmed = line.trim();
                if trimmed.starts_with("deps = {") {
                    in_deps_block = true;
                    continue;
                }
                if in_deps_block {
                    if trimmed.starts_with('}') {
                        in_deps_block = false;
                        continue;
                    }
                    if trimmed.is_empty() || trimmed.starts_with('#') {
                        continue;
                    }

                    // Parse 'path/to/dep': 'https://github.com/org/repo.git@commit'
                    if let Some((target_part, repo_part)) = trimmed.split_once(':') {
                        let target = target_part.trim().trim_matches(['\'', '"', ',']);
                        let repo_str = repo_part.trim().trim_matches(['\'', '"', ',']);

                        // Validate target path hygiene
                        if target.contains('\\')
                            || target.starts_with("./")
                            || target.ends_with('/')
                        {
                            findings.push(ArchFinding {
                                rule_id: "ARCH-014".into(),
                                category: "chromium-deps-binary-hygiene".into(),
                                severity: Severity::Error,
                                path: rel_deps.clone(),
                                line: Some(idx + 1),
                                message: format!("DEPS entry target path `{target}` is not a normalized POSIX relative path"),
                                remediation: "Normalize DEPS path with forward slashes without leading `./` or trailing `/`.".into(),
                            });
                        }

                        // Validate git revision (must be 40-character SHA1 commit hash)
                        if let Some((_, rev)) = repo_str.rsplit_once('@') {
                            let rev_clean = rev.trim();
                            let is_40_hex = rev_clean.len() == 40
                                && rev_clean.chars().all(|c| c.is_ascii_hexdigit());
                            if !is_40_hex && !rev_clean.is_empty() {
                                findings.push(ArchFinding {
                                    rule_id: "ARCH-014".into(),
                                    category: "chromium-deps-binary-hygiene".into(),
                                    severity: Severity::Error,
                                    path: rel_deps.clone(),
                                    line: Some(idx + 1),
                                    message: format!(
                                        "DEPS entry `{target}` uses non-SHA1 revision `{rev_clean}` (expected strict 40-character git commit hash)"
                                    ),
                                    remediation: "Pin dependency to an exact 40-character git commit SHA in `DEPS` via `ay lock`.".into(),
                                });
                            }
                        } else if !repo_str.is_empty() && !repo_str.starts_with('{') {
                            findings.push(ArchFinding {
                                rule_id: "ARCH-014".into(),
                                category: "chromium-deps-binary-hygiene".into(),
                                severity: Severity::Error,
                                path: rel_deps.clone(),
                                line: Some(idx + 1),
                                message: format!(
                                    "DEPS entry `{target}` lacks `@<commit_hash>` pin"
                                ),
                                remediation:
                                    "Append `@<commit_hash>` to the repository URL in `DEPS`."
                                        .into(),
                            });
                        }
                    }
                }
            }
        }
    }

    // 2. Presubmit Binary Hygiene (50MB check in first-party source directories)
    let scan_dirs = [
        root.join("apps"),
        root.join("packages"),
        root.join("crates"),
        root.join("tools"),
        root.join("infra"),
    ];

    let mut first_party_files = Vec::new();
    for d in &scan_dirs {
        if d.is_dir() {
            collect_non_cache_files(d, &mut first_party_files);
        }
    }

    for file in first_party_files {
        let rel = normalize_rel(root, &file);
        let ext = file
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        // Flag executable or archive blobs > 50 MB
        if matches!(
            ext.as_str(),
            "exe" | "dll" | "so" | "dylib" | "pak" | "zip" | "tgz" | "tar"
        ) {
            if let Ok(meta) = file.metadata() {
                let size_mb = meta.len() as f64 / (1024.0 * 1024.0);
                if size_mb > 50.0 {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-014".into(),
                        category: "chromium-deps-binary-hygiene".into(),
                        severity: Severity::Error,
                        path: rel.clone(),
                        line: None,
                        message: format!(
                            "Oversized binary artifact `{}` ({:.1} MB) in first-party source tree (exceeds 50MB presubmit threshold)",
                            file.file_name().and_then(|n| n.to_str()).unwrap_or(""),
                            size_mb
                        ),
                        remediation: "Move large binary assets to `C:\\Users\\aphro\\.local\\bin`, use Git LFS, or download on demand.".into(),
                    });
                }
            }
        }
    }
}

fn collect_non_cache_files(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for e in entries.flatten() {
        let p = e.path();
        if is_reparse_point(&p) {
            continue;
        }
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if SKIP_DIRS.contains(&name)
            || name == "extracted"
            || name == "save-editor"
            || name.starts_with("build-")
            || name.starts_with('.')
        {
            continue;
        }
        if p.is_dir() {
            collect_non_cache_files(&p, out);
        } else if p.is_file() {
            out.push(p);
        }
    }
}
