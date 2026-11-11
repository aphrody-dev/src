# `archguard` (`C:\src\tools\archguard`)

Deterministic, zero-compromise Rust Edition 2024 architectural, domain-purity, boundary, versioning, and hygiene auditor for the `C:\src` Sovereign Monorepo.

Built with Rayon parallel scanning, Blake3 deterministic report hashing (`report_blake3`), Fat-LTO (`lto = "fat"`), `codegen-units = 1`, and `panic = "abort"`.

## Purpose

Prevents cross-domain pollution, manifest version omissions, broken references, or boundary violations across `C:\src` (crates, packages, apps, infra, tools, docs).

## Rule Matrix (`ARCH-001` .. `ARCH-013`)

| Rule ID | Category | Default Severity | Invariant Enforced |
| :--- | :--- | :--- | :--- |
| `ARCH-001` | `crate-domain-purity` | `ERROR` | `C:\src\crates\*` must contain zero `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`, `.py`, `.go` files and zero `package.json`, `tsconfig.json`, `bun.lock`, `node_modules`, `go.mod`, or `pyproject.toml`. |
| `ARCH-002` | `crate-manifest-edition` | `WARN` (`ERROR` in `--strict`) | Every directory in `C:\src\crates\*` must have a valid `Cargo.toml` declaring `edition = "2024"` and at least one `.rs` source file. |
| `ARCH-003` | `package-domain-purity` | `ERROR` | Every directory in `C:\src\packages\*` must declare a `@aphrody/<slug>` `package.json`, zero external npm dependencies (`workspace:*` and `@types/bun` only), zero legacy lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`), zero root `Cargo.toml`/`go.mod`, and isolate any native FFI code inside `native/`, `rust-core/`, `crates/`, or `loaders/`. |
| `ARCH-004` | `app-contract-purity` | `ERROR` | `apps/aphrody-app` must remain 100% pure Rust (zero TypeScript/npm files); `apps/aphrody` (`aphrody.com`) must maintain `dependencies: {}`, `devDependencies: {}`, zero `node_modules`, and zero `bun.lock`. |
| `ARCH-005` | `root-topology-junctions` | `ERROR` | `C:\src` root may contain only canonical physical directories (`apps`, `packages`, `crates`, `infra`, `tools`, `docs`, `third_party`, `var`, `graphify-out`, `node_modules`, `.repo`) and valid non-dangling NTFS junctions. |
| `ARCH-006` | `infra-domain-purity` | `ERROR` | `C:\src\infra` must maintain `go.mod` and restrict TypeScript strictly to `infra/ffi-bridge` and `infra/mesh-vn`. |
| `ARCH-007` | `host-userspace-boundary` | `ERROR` | First-party code and scripts must never copy, move, write, or delete files inside `C:\Windows\System32` or `C:\Windows\SysWOW64`. |
| `ARCH-008` | `secret-vault-hygiene` | `ERROR` | Zero `.env` files inside subdirectories (all secrets stay exclusively in untracked `C:\src\.env`), and zero live API/OAuth/PAT tokens in source or docs. |
| `ARCH-009` | `zero-emoji-anti-slop` | `ERROR` | Zero pictographic emoji characters across first-party source code, configs, and documentation. |
| `ARCH-010` | `single-ai-product-ownership` | `ERROR` | `@aphrody/ai-os` is the sole public AI product; generalist apps/packages/crates never market themselves as AI wrappers. |
| `ARCH-011` | `tools-domain-purity` | `ERROR` | Every tool in `C:\src\tools\*` must remain single-domain (pure Rust 2024 `Cargo.toml` or `@aphrody/*` `package.json`), include `README.md`, and maintain a deterministic `tests/` suite. |
| `ARCH-012` | `atlas-link-integrity` | `ERROR` | Every `file:///C:/src/...` link in `AGENTS.md` and `docs/MONOREPO_ATLAS.md` must resolve to an existing file or directory on disk. |
| `ARCH-013` | `manifest-versioning-integrity` | `ERROR` | Root `package.json` must declare CalVer `YYYY.MM.PATCH` (e.g. `2026.11.0`) and all first-party apps, packages, crates, tools, and infra must declare valid SemVer or CalVer versions without omissions. |

## CLI Usage

```powershell
# Run full monorepo architectural audit (strict CI gate):
archguard check --strict --root C:\src

# Emit deterministic JSON report with Blake3 digest:
archguard check --strict --json

# Audit a single rule or category:
archguard check --rule ARCH-013

# List all enforced rules:
archguard rules
```

## Exit Codes

- `0`: Clean (`0` errors, and `0` warnings when `--strict` is set)
- `1`: One or more architectural violations detected
- `2`: Invalid CLI flag or nonexistent `--root` path
