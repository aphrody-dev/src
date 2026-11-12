# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The canonical cross-agent contract is [`AGENTS.md`](./AGENTS.md) plus [`.agents/SOUL.md`](./.agents/SOUL.md). This file adds what Claude Code specifically needs: commands, architecture, and the autonomous operating loop.

## Repository Conventions (checked by `archguard` and CI)

- `packages/ai-os` (`@aphrody/ai-os`) is the sole AI product and owner of AI routing, MCP, skills, memory. Other units are generalist software; do not add AI features or AI-flavored copy outside `ai-os`.
- Domain purity: `crates/*` is Rust 2024 only (no `.ts`/`.js`/npm). `packages/*` is Bun-only `@aphrody/*` (no root `Cargo.toml`/`go.mod`). Infra is Go 1.27. Upstream code lives in `third_party/`.
- Root directories are whitelisted in `tools/archguard/src/constants.rs` (`ALLOWED_ROOT_PHYSICAL_DIRS`, mirrored in `archguard.rules.json`). A new root dir fails `archguard check --strict` until it is added there. The root `.gitignore` is an allowlist: new tracked root files need a `!/name` entry.
- No `postinstall`/`preinstall` scripts, no `binding.gyp`; prefer Bun built-ins (`bun:sqlite`, `Bun.SQL`, `bun:ffi`, `bun build --compile`) over npm dependencies.
- UI work follows the Design-First Gate: PRD (_Cahier des charges_) + `DESIGN.md` before code, then `gds verify` and `wck` 100/100.
- Zero emojis in code, Markdown, UI text, and commits. No `Co-Authored-By`, "Generated with", or other AI attribution in commits, PRs, or tags. Only `.env.example` is committed; the real `.env` is not.

## Commands

Toolchain: Bun 1.4.4, Cargo (Rust 2024), Go 1.27, `just`. First-party CLIs are prebuilt in `~/.local/bin`: `archguard`, `xtk`, `depot`, `frg`, `gds`, `wck`, `graphify`, `src-deploy`, `ai-os`.

```sh
bun fmt                       # format workspace (bun fmt --check in CI)
bun check                     # typecheck
bun test packages/env-kit     # test one package
bun test packages/env-kit/tests/foo.test.ts -t "name"   # single test file / test name
bun test ./.agents/scripts/pre-tool-guard.test.ts       # dot-dirs need an explicit ./ path
cargo test --workspace         # root workspace: archguard, corelib, aphrody-design-* (one Cargo.lock, one target/)
cargo test -p aphrody-design-tokens <test_name>
cargo test --manifest-path crates/<unit>/Cargo.toml    # units not yet in the root workspace (depot, xtask, unix, ...)
go -C infra test ./...        # Go deploy engine
just archguard                # architecture / purity / hygiene gate
just verify-all               # archguard + xtk doctor + bun + cargo + go suites
just graph third_party/bun/src bun   # AST graph into graphify-out/bun
just lock                     # regenerate src.lock.json, DEPS, .repo manifest, MAINTAINERS
just deploy                   # src-deploy up --all --dry-run; `just deploy --all ""` deploys for real
```

Never run bare `bun test` from the root: it walks `third_party/` (5M+ files, over a minute) before finding anything.

Most `apps/*` and `packages/*` are git submodules, and many are uninitialized in a fresh checkout (`git submodule status` shows `-`). A suite that cannot find a package usually means the submodule is not checked out. Commits inside a submodule are made in that submodule, then the superproject pointer is bumped and `just lock` re-run so `DEPS`/`src.lock.json` match.

## Portability and Configuration

- The `justfile` runs under `sh` on Unix and `pwsh` on Windows. Every path is `{{root}}/...` with `root := env("SRC_ROOT", justfile_directory())`; keep new recipes in that form and avoid shell-specific syntax (no `Push-Location`, no `&&` chains that pwsh 5 cannot parse).
- `archguard` root: `--root`, else `$SRC_ROOT`, else nearest ancestor with `src.lock.json`.
- Containers, never Debian/Ubuntu: Alpine for light images, Arch Linux for heavy ones, Nix (`flake.nix`, `just nix-shell`) as the non-container path. `Dockerfile` stages: `builder` (Alpine, static musl CLIs) -> `runtime` (Alpine) and `dev` (Arch, amd64). `compose.yaml` services `dev`, `verify`, `runtime`, repo bind-mounted at `/src`, Linux outputs in named volumes. Versions are build args defaulting to `src.lock.json`; overrides in the environment (`.env.example` section 0). Lint with `hadolint Dockerfile`. Full policy and checklists: `.agents/skills/containers-alpine-arch-k8s/SKILL.md`.
- Offline docs: `third_party/docs-ecosystem/` holds sparse mirrors of Docker docs, Kubernetes website, nix.dev, and the official Arch/Alpine image repos (pinned in `src.lock.json`, refreshed by `just docs-sync`). Grep them before the web.
- Container CLIs in `~/.local/bin`: `kubectl` (Docker Desktop), `helm`, `kind`, `kustomize`, `hadolint`.
- Still Windows-bound: `install.ps1`/`deploy.ps1` (with `install.sh`/`deploy.sh` as the Unix twins), and `crates/depot`'s `install-shims` recipe.

## Architecture

- **Ownership**: Aphrody's own products are `apps/aphrody` (aphrody.com search and package catalog), `apps/aphrody-app` (aphrody.app) and `packages/ai-os`. `apps/shenron` (DBFR, dragonballfr.com) and `apps/rosegriffon` (rosegriffon.fr) are distinct community products that Aphrody is employed to maintain and uses as testbeds for Bun, Rust, design-stack evaluation and benchmarks: never present them as Aphrody products.
- **Workspaces**: root `package.json` workspaces are `packages/*`, `infra/mesh-vn`, `infra/ffi-bridge`. Packages expose `src/cli.ts`, run via `bun run --cwd packages/<pkg> src/cli.ts <cmd>` (what most `just` recipes wrap), and are AOT-compiled into `~/.local/bin`.
- **Three-way FFI**: Rust (`crates/rust-stack` -> `rust_stack_ffi.dll`), Go (`infra/cshared` -> `infra_go.dll`), and Bun (`infra/ffi-bridge`, `bun:ffi`) call each other over a C ABI. Changing an exported signature on one side means updating the other two and running `just verify-all`.
- **Deploy engine**: `infra/cmd/src-deploy` (Go) builds OCI images and drives Cloudflare, Caddy blue/green on `fr1`/`fr2`/`usa`, GCP Cloud Run, Vercel. Config is `deploy.toml`; the generated Caddyfile lives in `infra/generated/`.
- **VCS governance**: `src.lock.json` is the source of truth; `DEPS` (Chromium gclient), `.repo/manifests/default.xml` (AOSP repo), and `MAINTAINERS` (kernel style) are generated from it by `xtk lock` / `xtk manifests`. Do not hand-edit them.
- **One canonical path per unit**: there are no root aliases (the former `C:/src/bun`, `C:/src/chromium`, ... junctions were removed; the list is in `var/reorg/`). Always reference `third_party/<name>`, `packages/<name>`, `crates/<name>`, `apps/<name>`. `third_party/chromium` is a gclient solution (`.gclient`, cache in `%LOCALAPPDATA%/depot_tools/git_cache`); `third_party/bun` is the `aphrody-dev/bun` fork, a Rust Cargo workspace of ~130 crates under `src/` with its own `CLAUDE.md` (build with `bun bd`, never plain `bun test` there).
- **Root Cargo workspace** (`Cargo.toml`): flat `crates/<name>` members sharing `[workspace.package]` (edition 2024), `[workspace.dependencies]`, and one release profile (fat LTO, 1 codegen unit, abort). Members inherit with `edition.workspace = true`; archguard accepts that only when the root value is compliant. Submodule units join one at a time per `docs/CONSOLIDATION_PLAN.md`.
- **Tooling crates**: `crates/xtask` (`xtk`: doctor, lock, audits), `crates/depot` (depot_tools shims, ingest, tree-sitter AST graph in `depot-graph` + `depot-treesitter`), `tools/archguard` (rules `ARCH-001`..`ARCH-017` under `src/rules/`).
- **Code graphs**: `graphify-out/GRAPH_REPORT.md` covers `packages/`; `graphify-out/bun/` covers Bun (`third_party/bun/src`, ~420k nodes). Each report records the commit it was built from; rebuild with `just graph <path> <name>` when stale. Query these before grepping `third_party/`.

## Agent Setup

- **Skills**: `.agents/skills/*/SKILL.md` is the single source; `.claude/skills` is a junction/symlink to it (created by `install.ps1` / `install.sh`, gitignored). Add skills under `.agents/skills/` only.
- **Settings**: `.claude/settings.json` runs Claude Code with `bypassPermissions` and allow-all permissions, and enables the project plugins (LSPs for Rust, Go, TypeScript, C/C++, Lua; `skill-creator`, `feature-dev`, `pr-review-toolkit`, `code-simplifier`, `commit-commands`, `hookify`, `ralph-loop`, `security-guidance`, `playwright`, `plugin-dev`). Personal overrides go in `.claude/settings.local.json` (gitignored).
- **Guard hook**: `.agents/scripts/pre-tool-guard.ts` serves both `agy` and Claude Code. It does nothing unless `AGENT_GUARD` is `warn` (report only) or `enforce` (block System32 writes, printing or staging `.env`). Default is `off`. Tests: `bun test ./.agents/scripts/pre-tool-guard.test.ts`.

## Autonomous Operating Loop (NHITL)

Work end to end without waiting for confirmation.

1. **Orient**: read `AGENTS.md`, the matching skill, and the graph report before touching an unfamiliar area. Fan out with Explore subagents for multi-directory searches; run independent searches and suites in parallel.
2. **Use every tool available**: Context7 for any library/CLI API before writing against it; Microsoft Learn for Windows/PowerShell; the Vercel, Supabase, Neon MCPs for those platforms; `claude-in-chrome` to verify UI visually; `/code-review` and `/simplify` on your own diff; `/security-review` for auth, FFI, and deploy code.
3. **Verify, never assume**: a change is done after `bun fmt`, `bun check`, the affected `bun test` / `cargo test` / `go test`, and `just archguard` pass. Report failures with their output.
4. **Learn from errors**: when a command or assumption fails for a non-obvious reason (wrong flag, submodule not initialized, archguard rule, shell quirk), save a `feedback` memory with cause and fix. Check memory before retrying a known-failing approach.
5. **Keep improving**: after the task passes, refactor what you touched (duplication, dead code, missing tests) in a separate commit. For continuous unattended work use `/loop` or `/schedule`.
