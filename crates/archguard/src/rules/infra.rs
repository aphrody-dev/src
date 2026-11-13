use crate::constants::{is_reparse_point, normalize_rel};
use crate::models::{ArchFinding, Severity};
use std::fs;
use std::path::Path;

/// Rule ARCH-006: Infra Domain Purity
pub fn check_infra_domain(root: &Path, findings: &mut Vec<ArchFinding>) {
    let infra_dir = root.join("infra");
    if !infra_dir.is_dir() {
        return;
    }

    let go_mod = infra_dir.join("go.mod");
    if !go_mod.is_file() {
        findings.push(ArchFinding {
            rule_id: "ARCH-006".into(),
            category: "infra-domain-purity".into(),
            severity: Severity::Error,
            path: normalize_rel(root, &go_mod),
            line: None,
            message: "Missing `go.mod` in `infra/` root (infra is the sovereign Go 1.27/CGO deployment layer)".into(),
            remediation: "Initialize `infra/go.mod` with `module aphrody/infra` and `go 1.27`.".into(),
        });
    }

    // Check for unapproved TypeScript code outside mesh-vn (bun packages live in packages/)
    let allowed_bun_subs = ["mesh-vn"];
    if let Ok(entries) = fs::read_dir(&infra_dir) {
        for e in entries.flatten() {
            let p = e.path();
            if is_reparse_point(&p) {
                continue;
            }
            let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
            if p.is_dir() {
                if !allowed_bun_subs.contains(&name) {
                    let mut ts_files = Vec::new();
                    collect_ts_files(&p, &mut ts_files);
                    for f in ts_files {
                        findings.push(ArchFinding {
                            rule_id: "ARCH-006".into(),
                            category: "infra-domain-purity".into(),
                            severity: Severity::Error,
                            path: normalize_rel(root, &f),
                            line: None,
                            message: format!(
                                "Unapproved TypeScript file `{}` in infra subfolder `{name}` (Bun TS is restricted strictly to `infra/mesh-vn`)",
                                f.file_name().and_then(|n| n.to_str()).unwrap_or("")
                            ),
                            remediation: "Move TypeScript service into `packages/` (or `infra/mesh-vn`).".into(),
                        });
                    }
                }
            } else if p.is_file() {
                let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
                if matches!(ext, "ts" | "tsx" | "js" | "jsx") {
                    findings.push(ArchFinding {
                        rule_id: "ARCH-006".into(),
                        category: "infra-domain-purity".into(),
                        severity: Severity::Error,
                        path: normalize_rel(root, &p),
                        line: None,
                        message: format!("Loose TypeScript/JavaScript file `{name}` at root of `infra/`"),
                        remediation: "Keep `infra/` root pure Go; move TypeScript tools to `packages/`.".into(),
                    });
                }
            }
        }
    }
}

fn collect_ts_files(dir: &Path, out: &mut Vec<std::path::PathBuf>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for e in entries.flatten() {
        let p = e.path();
        if is_reparse_point(&p) {
            continue;
        }
        let name = p.file_name().and_then(|n| n.to_str()).unwrap_or("");
        if name == "node_modules" || name == ".git" || name == ".jj" || name == "target" {
            continue;
        }
        if p.is_dir() {
            collect_ts_files(&p, out);
        } else if p.is_file() {
            let ext = p.extension().and_then(|ext| ext.to_str()).unwrap_or("");
            if matches!(ext, "ts" | "tsx" | "js" | "jsx") {
                out.push(p);
            }
        }
    }
}
