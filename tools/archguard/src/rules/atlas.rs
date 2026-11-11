use crate::constants::{normalize_rel, FILE_URI_SRC_RE};
use crate::models::{ArchFinding, Severity};
use std::fs;
use std::path::Path;

/// Rule ARCH-012: Verify `file:///C:/src/...` links in `AGENTS.md` and `docs/MONOREPO_ATLAS.md`
pub fn check_atlas_link_integrity(root: &Path, findings: &mut Vec<ArchFinding>) {
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
                        remediation: "Update the link or regenerate `docs/MONOREPO_ATLAS.md` via `@aphrody/knowledge-engine` (`ske gen-docs`).".into(),
                    });
                }
            }
        }
    }
}
