use crate::constants::{
    AI_WRAPPER_SLOP_RE, SECRET_TOKEN_RE, SYSTEM32_MUTATION_RE, collect_domain_files,
    find_first_emoji, is_reparse_point, normalize_rel,
};
use crate::models::{ArchFinding, Severity};
use rayon::prelude::*;
use std::fs;
use std::path::Path;

fn is_test_source_path(rel: &str) -> bool {
    rel.contains("/test/")
        || rel.contains("/tests/")
        || rel.ends_with(".test.ts")
        || rel.ends_with(".spec.ts")
        || rel.ends_with("_test.rs")
        || rel.ends_with("_test.go")
}

/// Rules ARCH-007, ARCH-008, ARCH-009, ARCH-010: Parallel content scan across first-party files
pub fn scan_first_party_contents(
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
            let is_self_rule_def = rel.starts_with("crates/archguard/");
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

            // ARCH-010: Anti-AI-Wrapper Slop & Single Ownership Gate
            if !is_self_rule_def && !rel.starts_with("packages/ai-os") && !rel.starts_with("packages/ai-triad") {
                for (idx, line) in content.lines().enumerate() {
                    let upper = line.to_ascii_uppercase();
                    let is_rule_def = upper.contains("STRICTLY ZERO")
                        || upper.contains("ZERO PUFFERY")
                        || upper.contains("ANTI-SLOP")
                        || upper.contains("FORBIDDEN");
                    if !is_rule_def && let Some(mat) = AI_WRAPPER_SLOP_RE.find(line) {
                        local.push(ArchFinding {
                            rule_id: "ARCH-010".into(),
                            category: "single-ai-product-ownership".into(),
                            severity: Severity::Error,
                            path: rel.clone(),
                            line: Some(idx + 1),
                            message: format!("Forbidden AI marketing slop `{}` found in non-AI domain", mat.as_str()),
                            remediation: "@aphrody/ai-os is the sole public AI owner; generalist products must not declare AI wrapper claims.".into(),
                        });
                        break;
                    }
                }
            }

            local
        })
        .collect();

    findings.extend(file_findings);
    total_scanned
}
