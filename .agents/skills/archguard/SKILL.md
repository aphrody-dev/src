---
name: archguard
description: Sovereign Monorepo Architecture Gate, Domain-Purity, Upstream Hygiene, and Dependency Graph Auditor
---

# ArchGuard Reference & Operational Manual

`archguard` (`C:\src\tools\archguard`) is the deterministic, zero-compromise Rust Edition 2024 architectural gate and upstream hygiene auditor for the `C:\src` Sovereign Monorepo.

## 1. When to Use ArchGuard

Activate or invoke ArchGuard:

- Before committing or pushing changes across the monorepo to guarantee zero architectural drift.
- When creating new crates, packages, apps, or tools to ensure compliance with domain purity and versioning.
- When auditing credentials, secret vault isolation (`ARCH-008`), or Windows userspace boundary enforcement (`ARCH-007`).
- When diagnosing dependency graph cycles, layer violations (`ARCH-017`), or upstream Chromium (`ARCH-014`) / Linux (`ARCH-015`) / Bun (`ARCH-016`) contracts.

## 2. Core CLI Commands

```powershell
# 1. Full strict audit across the monorepo (returns 0 on success, 1 on violation)
archguard check --strict --root C:\src

# 2. Emits deterministic Blake3 report in JSON format
archguard check --strict --json

# 3. Filter audit to a specific rule
archguard check --rule ARCH-017

# 4. List all 17 canonical rules and severities
archguard rules

# 5. Generate and display the architecture dependency graph (Mermaid)
archguard graph

# 6. Export graph in Graphviz DOT or JSON
archguard graph --format dot
archguard graph --format json

# 7. Write graph directly to file
archguard graph --format mermaid -o C:\src\docs\ARCH_GRAPH.mermaid
```

## 3. The 17 Canonical ArchGuard Rules

1. `ARCH-001` (`crate-domain-purity`): `crates/*` must be 100% native Rust. Zero `.ts`, `.tsx`, `.js`, `.py`, `.go`, `package.json`, or `bun.lock`.
2. `ARCH-002` (`crate-manifest-edition`): Every crate must have `Cargo.toml` declaring `edition = "2024"`.
3. `ARCH-003` (`package-domain-purity`): Every package in `packages/*` must declare `@aphrody/<slug>` name, zero external npm dependencies (`workspace:*` only), zero legacy lockfiles, and isolated native code.
4. `ARCH-004` (`app-contract-purity`): `apps/aphrody-app` is pure Rust; `apps/aphrody` has strictly empty dependencies and zero `bun.lock`.
5. `ARCH-005` (`root-topology-junctions`): Root may contain only canonical physical directories and non-dangling junctions.
6. `ARCH-006` (`infra-domain-purity`): `infra/` must have `go.mod` (Go 1.27); TypeScript is restricted strictly to `ffi-bridge` and `mesh-vn`.
7. `ARCH-007` (`host-userspace-boundary`): First-party code must NEVER mutate `C:\Windows\System32` or `SysWOW64` (Torvalds principle). Binaries go in `~/.local/bin`.
8. `ARCH-008` (`secret-vault-hygiene`): Zero `.env` files in subdirectories (all in local `C:\src\.env`), zero live API keys in code or documentation.
9. `ARCH-009` (`zero-emoji-anti-slop`): Zero pictographic emojis across first-party code, Markdown, MDX, and configs.
10. `ARCH-010` (`single-ai-product-ownership`): `@aphrody/ai-os` is the sole public AI owner; generalist products must not declare AI wrapper claims.
11. `ARCH-011` (`tools-domain-purity`): Tools in `tools/*` must declare a single manifest (`Cargo.toml` or `package.json`), `README.md`, and deterministic `tests/`.
12. `ARCH-012` (`atlas-link-integrity`): Every `file:///C:/src/...` link in `AGENTS.md` and `docs/MONOREPO_ATLAS.md` must resolve to an existing file/folder on disk.
13. `ARCH-013` (`manifest-versioning-integrity`): Root `package.json` must declare CalVer `YYYY.MM.PATCH`, and all apps, packages, crates, tools, and infra must declare valid SemVer/CalVer versions.
14. `ARCH-014` (`chromium-deps-binary-hygiene`): Chromium `DEPS` manifest must pin exact 40-character commit SHAs, and source trees must contain zero unapproved binaries > 50MB (Presubmit gate).
15. `ARCH-015` (`linux-upstream-maintainers-hygiene`): Linux upstream `MAINTAINERS` file must declare valid canonical status and existing file patterns `F:`, and `docs/patches/series` must contain valid unified diffs.
16. `ARCH-016` (`bun-speed-zero-glue-hygiene`): Bun upstream speed contracts: zero `binding.gyp` glue, no `postinstall` native rebuild hooks, and pure Rust FFI vertical integration.
17. `ARCH-017` (`graph-acyclic-boundaries`): Architecture dependency graph must enforce monotonic layers (`Layer0Kernel` -> `Layer1Systems` -> `Layer2Packages` -> `Layer3AppsAndTools`) and zero cyclic dependencies.

## 4. Remediation Workflow for Violations

- **When `ARCH-014` flags a DEPS entry**: Run `xtk lock` or update the `@<commit_sha>` in `C:\src\DEPS`.
- **When `ARCH-015` flags MAINTAINERS**: Check the path in `F:` against disk. If the crate/package was moved, update `MAINTAINERS`.
- **When `ARCH-017` flags layer boundaries**: Extract shared types or interfaces to a lower layer (`crates/` or `packages/`) rather than creating an upward or cyclic dependency.
- **When `ARCH-009` flags an emoji**: Strip the emoji character from source, comments, or documentation.
- **When `ARCH-012` flags broken links**: Regenerate documentation via `@aphrody/knowledge-engine` (`ske gen-docs`).
