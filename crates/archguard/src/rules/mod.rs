pub mod apps;
pub mod atlas;
pub mod chromium;
pub mod crates;
pub mod hygiene;
pub mod infra;
pub mod linux;
pub mod packages;
pub mod tools;
pub mod topology;
pub mod versioning;

use crate::graph::{build_monorepo_graph, check_layer_boundaries_and_cycles};
use crate::models::{ArchFinding, RuleSpec, Severity};
use std::path::Path;

pub const RULES: &[RuleSpec] = &[
    RuleSpec {
        id: "ARCH-001",
        category: "crate-domain-purity",
        default_severity: Severity::Error,
        summary: "crates/* must contain zero TypeScript/JavaScript/Python/Go source files or npm/Bun package manifests",
    },
    RuleSpec {
        id: "ARCH-002",
        category: "crate-manifest-edition",
        default_severity: Severity::Warning,
        summary: "crates/* must have a valid Cargo.toml using Rust edition = \"2024\" and release LTO profile",
    },
    RuleSpec {
        id: "ARCH-003",
        category: "package-domain-purity",
        default_severity: Severity::Error,
        summary: "packages/* must have a valid @aphrody/* package.json, zero npm/pnpm/yarn lockfiles, zero unapproved external npm deps, and isolated native subdirs",
    },
    RuleSpec {
        id: "ARCH-004",
        category: "app-contract-purity",
        default_severity: Severity::Error,
        summary: "apps/aphrody-app must remain 100% pure Rust (zero TS/JS); apps/aphrody must remain zero-npm (zero deps, zero node_modules, zero bun.lock)",
    },
    RuleSpec {
        id: "ARCH-005",
        category: "root-topology-junctions",
        default_severity: Severity::Error,
        summary: "Monorepo root must contain only canonical physical directories and valid non-dangling junctions",
    },
    RuleSpec {
        id: "ARCH-006",
        category: "infra-domain-purity",
        default_severity: Severity::Error,
        summary: "infra/ must maintain a valid go.mod and restrict Bun/TypeScript code strictly to ffi-bridge and mesh-vn",
    },
    RuleSpec {
        id: "ARCH-007",
        category: "host-userspace-boundary",
        default_severity: Severity::Error,
        summary: "First-party scripts and code must never mutate C:\\Windows\\System32 or C:\\Windows\\SysWOW64 (Torvalds principle)",
    },
    RuleSpec {
        id: "ARCH-008",
        category: "secret-vault-hygiene",
        default_severity: Severity::Error,
        summary: "No committed .env files in submodules/packages/crates/apps and no raw live credential tokens in source or docs",
    },
    RuleSpec {
        id: "ARCH-009",
        category: "zero-emoji-anti-slop",
        default_severity: Severity::Error,
        summary: "Strictly zero pictographic emoji characters across first-party code, configs, and documentation",
    },
    RuleSpec {
        id: "ARCH-010",
        category: "single-ai-product-ownership",
        default_severity: Severity::Error,
        summary: "@aphrody/ai-os is the sole public AI product; generalist apps/crates/packages must not market themselves as AI wrappers",
    },
    RuleSpec {
        id: "ARCH-011",
        category: "tools-domain-purity",
        default_severity: Severity::Error,
        summary: "tools/* must have a pure Rust 2024 Cargo.toml or @aphrody/* package.json, README.md, and deterministic tests/",
    },
    RuleSpec {
        id: "ARCH-012",
        category: "atlas-link-integrity",
        default_severity: Severity::Error,
        summary: "Every file:///C:/src/... link in AGENTS.md and docs/MONOREPO_ATLAS.md must resolve to an existing file or directory",
    },
    RuleSpec {
        id: "ARCH-013",
        category: "manifest-versioning-integrity",
        default_severity: Severity::Error,
        summary: "Monorepo root and all first-party apps, packages, crates, tools, and infra must declare valid SemVer or CalVer versions without omissions",
    },
    RuleSpec {
        id: "ARCH-014",
        category: "chromium-deps-binary-hygiene",
        default_severity: Severity::Error,
        summary: "Chromium DEPS manifest must pin exact 40-char commit SHAs, and source trees must contain zero unapproved binaries > 50MB (Presubmit gate)",
    },
    RuleSpec {
        id: "ARCH-015",
        category: "linux-upstream-maintainers-hygiene",
        default_severity: Severity::Error,
        summary: "Linux upstream MAINTAINERS file must declare existing file patterns F:, and docs/patches/series must contain valid unified diffs",
    },
    RuleSpec {
        id: "ARCH-016",
        category: "bun-speed-zero-glue-hygiene",
        default_severity: Severity::Error,
        summary: "Bun upstream speed contracts: zero node-gyp glue, no postinstall compile hooks, and full native Rust FFI vertical integration",
    },
    RuleSpec {
        id: "ARCH-017",
        category: "graph-acyclic-boundaries",
        default_severity: Severity::Error,
        summary: "Architecture dependency graph must enforce monotonic layers (Kernel -> Systems -> Packages -> Apps) and zero cyclic dependencies",
    },
];

pub fn run_all_rules(
    root: &Path,
    check_docs_emojis: bool,
    findings: &mut Vec<ArchFinding>,
) -> usize {
    topology::check_root_topology(root, findings);
    crates::check_crates_domain(root, findings);
    packages::check_packages_domain(root, findings);
    apps::check_apps_domain(root, findings);
    infra::check_infra_domain(root, findings);
    tools::check_tools_domain(root, findings);
    atlas::check_atlas_link_integrity(root, findings);
    versioning::check_versioning_integrity(root, findings);
    chromium::check_chromium_hygiene(root, findings);
    linux::check_linux_hygiene(root, findings);

    // Layer boundaries and cycle detection
    let graph = build_monorepo_graph(root);
    findings.extend(check_layer_boundaries_and_cycles(&graph));

    // Parallel content scanning
    hygiene::scan_first_party_contents(root, check_docs_emojis, findings)
}
