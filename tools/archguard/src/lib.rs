//! Sovereign Monorepo Architecture, Domain-Purity, Boundary, Upstream & Hygiene Auditor (`archguard`)
//!
//! Deterministically enforces the `C:\src` Sovereign Monorepo operating contract (`AGENTS.md`, `SOUL.md`, `CLAUDE.md`, `GEMINI.md`):
//! - `ARCH-001` Crate Domain Purity (zero TS/JS/Py/Go in `crates/*`)
//! - `ARCH-002` Crate Manifest & Edition 2024 Integrity (`Cargo.toml` required, `edition = "2024"`)
//! - `ARCH-003` Package Domain & Zero-NPM Purity (valid `@aphrody/*` name, zero external npm dependencies, zero lockfiles, isolated native subdirs)
//! - `ARCH-004` Application Contract Purity (`aphrody-app` pure Rust; `aphrody` zero npm dependencies / zero `bun.lock`)
//! - `ARCH-005` Root Topology & Junction Integrity (canonical physical directories only, valid junctions)
//! - `ARCH-006` Infra Domain Purity (`infra/go.mod` required, TypeScript restricted to `ffi-bridge` & `mesh-vn`)
//! - `ARCH-007` Sacred Host Userspace Boundary (System32/SysWOW64 mutations strictly forbidden - Torvalds principle)
//! - `ARCH-008` Secret Vault & Token Hygiene (zero `.env` outside local root vault, zero live tokens)
//! - `ARCH-009` Anti-AI-Slop & Zero-Emoji Gate (zero pictographic emojis across first-party code and docs)
//! - `ARCH-010` Single AI Product Ownership (`@aphrody/ai-os` sole AI owner)
//! - `ARCH-011` Tools Domain Purity (single manifest, Rust 2024 or `@aphrody/*`, `README.md` + `tests/`)
//! - `ARCH-012` Atlas & Governance Link Integrity (all `file:///C:/src/...` links exist on disk)
//! - `ARCH-013` Manifest Versioning Integrity (root CalVer, all components have valid SemVer/CalVer)
//! - `ARCH-014` Chromium Upstream DEPS Manifest & Presubmit Binary Hygiene
//! - `ARCH-015` Linux Upstream MAINTAINERS File & Patch Series Hygiene
//! - `ARCH-016` Bun Upstream Speed Contracts & Zero-Glue Vertical Purity
//! - `ARCH-017` Architecture Graph Acyclic Layer Boundaries & Cycle Detection

pub mod constants;
pub mod graph;
pub mod models;
pub mod report;
pub mod rules;

pub use constants::{is_reparse_point, normalize_rel};
pub use graph::{GodNodeMetric, GraphNode, MonorepoGraph, MonorepoLayer, build_monorepo_graph};
pub use models::{ArchFinding, AuditConfig, AuditReport, RuleSpec, Severity, VERSION};
pub use report::format_human_report;
pub use rules::RULES;

use std::collections::BTreeMap;
use std::time::Instant;

pub fn run_audit(config: &AuditConfig) -> AuditReport {
    let t0 = Instant::now();
    let mut findings = Vec::new();

    let scanned_files = rules::run_all_rules(&config.root, config.check_docs_emojis, &mut findings);

    if let Some(ref filter) = config.only_rule {
        let f_upper = filter.to_ascii_uppercase();
        findings.retain(|item| {
            item.rule_id.eq_ignore_ascii_case(&f_upper)
                || item.category.eq_ignore_ascii_case(filter)
        });
    }

    if config.strict {
        for f in &mut findings {
            f.severity = Severity::Error;
        }
    }

    findings.sort_by(|a, b| {
        a.severity
            .cmp(&b.severity)
            .then_with(|| a.rule_id.cmp(&b.rule_id))
            .then_with(|| a.path.cmp(&b.path))
            .then_with(|| a.line.cmp(&b.line))
    });

    let mut error_count = 0usize;
    let mut warning_count = 0usize;
    let mut by_rule: BTreeMap<String, usize> = BTreeMap::new();

    for r in RULES {
        by_rule.insert(r.id.to_string(), 0);
    }
    for f in &findings {
        *by_rule.entry(f.rule_id.clone()).or_insert(0) += 1;
        match f.severity {
            Severity::Error => error_count += 1,
            Severity::Warning => warning_count += 1,
        }
    }

    let serialized_findings = serde_json::to_vec(&findings).unwrap_or_default();
    let report_blake3 = blake3::hash(&serialized_findings).to_hex().to_string();

    AuditReport {
        tool: "archguard".into(),
        version: VERSION.into(),
        root: config.root.to_string_lossy().to_string(),
        clean: error_count == 0 && (!config.strict || warning_count == 0),
        strict: config.strict,
        scanned_files,
        error_count,
        warning_count,
        duration_ms: t0.elapsed().as_secs_f64() * 1000.0,
        report_blake3,
        by_rule,
        findings,
    }
}
