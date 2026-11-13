# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The canonical cross-agent contract is [`AGENTS.md`](./AGENTS.md) plus [`.agents/SOUL.md`](./.agents/SOUL.md). This file adds what Claude Code specifically needs: commands, architecture, and the autonomous operating loop.

@AGENTS.md
@.agents/SOUL.md

## Repository Conventions (checked by `archguard` and CI)

- `packages/ai-os` (`@aphrody/ai-os`) is the sole AI product and owner of AI routing, MCP, skills, memory. Other units are generalist software; do not add AI features or AI-flavored copy outside `ai-os`.
- Domain purity: `crates/*` is Rust 2024 only (no `.ts`/`.js`/npm). `packages/*` is Bun-only `@aphrody/*` (no root `Cargo.toml`/`go.mod`). Infra assembles upstream tools (no in-house engine, `docs/infra/UPSTREAM-STACK.md`). Upstream code lives in `third_party/`.
- Root directories are whitelisted in `crates/archguard/src/constants.rs` (`ALLOWED_ROOT_PHYSICAL_DIRS`, mirrored in `archguard.rules.json`). A new root dir fails `ay arch check --strict` until it is added there. The root `.gitignore` is an allowlist: new tracked root files need a `!/name` entry.
- No `postinstall`/`preinstall` scripts, no `binding.gyp`; prefer Bun built-ins (`bun:sqlite`, `Bun.SQL`, `bun:ffi`, `bun build --compile`) over npm dependencies.
- UI work follows the Design-First Gate: PRD (_Cahier des charges_) + `DESIGN.md` before code, then `gds verify` and `wck` 100/100.
- Zero emojis in code, Markdown, UI text, and commits. No `Co-Authored-By`, "Generated with", or other AI attribution in commits, PRs, or tags. Only `.env.example` is committed; the real `.env` is not.

## Commands

Toolchain: Bun 1.4.4, Cargo (Rust 2024), `just`. First-party CLIs are prebuilt in `~/.local/bin`: `ay` (the Rust multicall CLI, `crates/ay`; command table in `docs/NAMING.md`), `frg`, `gds`, `wck`, `graphify`, `ai-os`. Install or refresh `ay` with `just install-ay`.

```sh
bun fmt                       # format workspace (bun fmt --check in CI)
bun check                     # typecheck
bun test packages/env-kit     # test one package
bun test packages/env-kit/tests/foo.test.ts -t "name"   # single test file / test name
bun test ./.agents/scripts/pre-tool-guard.test.ts       # dot-dirs need an explicit ./ path
cargo test --workspace         # root workspace: every crates/* member (one Cargo.lock, one target/)
cargo test -p aphrody-brand <test_name>
cargo test -p aphrody         # the ay CLI (routing tests); -p archguard, -p xtk, -p depot-cli for the libraries behind it
go -C infra test ./...        # Go deploy engine
ay arch check --strict        # architecture / purity / hygiene gate (also: just archguard; ay arch graph, ay arch rules)
ay doctor | ay lock | ay manifests [verify]   # toolchain doctor, src.lock.json + generated manifests
ay git <cmd>                  # fork, slim [--all], clone, gix, forge, audit, maintainer, depot_tools shims
ay ingest <path> / ay graph <path>   # repository digest / tree-sitter code graph (build, query, path, explain, mcp)
ay deploy <sub> / ay bench ... # just docker-<sub> (buildx bake + compose) / Windows benchmark suite
ay build --list               # cross-compilation presets and which Rust targets / native toolchains are missing
ay build -t wasm32 -t linux-musl --release   # or: just build target=wasm32
just verify-all               # ay arch check + ay doctor + bun + cargo + go suites
just graph third_party/bun/src bun   # AST graph into graphify-out/bun
just lock                     # src.lock.json from the checkout, then DEPS + .gitmodules derived from it
just deploy [profile] [host]  # docker compose pull + up --wait (default core on prd); rollback SRC_TAG=<sha>
```

Nothing compiles on the workstation: the `cargo`, `go` and `ay build` commands above run in CI (`ci.yml` Rust on the self-hosted fr1 runner, `judge.yml` fast gates on GitHub-hosted) or on fr1 (`ssh vps aphrody-heavy <cmd>`), the factory for every build, test, training and heavy agent; never on prd (production backends) or fr2 (edge). Never run bare `bun test` from the root: it walks `third_party/` (5M+ files, over a minute) before finding anything.

The only git submodules are `apps/auto`, `apps/r2b`, `apps/rosegriffon` and `apps/shenron` (`git ls-files -s | grep ^160000`); they may be uninitialized in a fresh checkout (`git submodule status` shows `-`). Everything else, `packages/*` and `crates/*` included, is tracked flat in this repository. Commits inside a submodule are made in that submodule, then the superproject pointer is bumped and `just lock` re-run so `DEPS`/`src.lock.json` match.

## Portability and Configuration

- The `justfile` runs under `sh` on Unix and `pwsh` on Windows. Every path is `{{root}}/...` with `root := env("SRC_ROOT", justfile_directory())`; keep new recipes in that form and avoid shell-specific syntax (no `Push-Location`, no `&&` chains that pwsh 5 cannot parse).
- `ay arch` root: `--root`, else `$SRC_ROOT`, else nearest ancestor with `src.lock.json`.
- Containers, never Debian/Ubuntu: Alpine runtimes, Arch Linux for the heavy `dev` image, Nix (`infra/nix/flake.nix`, `just nix-shell`) as the non-container path. Everything lives in `infra/docker/`: `Dockerfile` (one target per service: `ai-os`, `aphrody`, `yolo`, `r2-site`, `api-gateway`, `loreserver`, `r3d`, `rust-stack`, `runtime`, `dev`; cargo-chef + cargo-zigbuild for amd64/arm64 musl), `Dockerfile.dockerignore` (allowlist), `docker-bake.hcl` (matrix, GHCR `ghcr.io/aphrody-labs/*`), `compose.yaml` (profiles `core` prd, `edge` fr2, `dev`), `smoke.sh`. Pins = `tools.toml`. The PC has no engine: docker contexts `fr1` (builds), `prd`, `fr2` over ssh. Recipes: `just docker-build|docker-smoke|docker-up|docker-products`. Placement, scaling and rollback per service: `docs/infra/DEPLOY.md`. Policy: `.agents/skills/containers-alpine-arch-k8s/SKILL.md`.
- Offline docs: `third_party/docs-ecosystem/` holds sparse mirrors of Docker docs, Kubernetes website, nix.dev, and the official Arch/Alpine image repos (pinned in `src.lock.json`, refreshed by `just docs-sync`). Grep them before the web.
- Container CLIs in `~/.local/bin`: `kubectl` (Docker Desktop), `helm`, `kind`, `kustomize`, `hadolint`.
- Bootstrap: `scripts/install.ps1` / `scripts/install.sh` build `ay` once, then `ay up --bootstrap`; deploy is `just deploy` (`ay deploy`).

## Architecture

- **Ownership**: Aphrody's own products are `apps/aphrody` (aphrody.com search and package catalog), `apps/aphrody-app` (aphrody.app) and `packages/ai-os`. `apps/shenron` (DBFR, dragonballfr.com) and `apps/rosegriffon` (rosegriffon.fr) are distinct community products that Aphrody is employed to maintain and uses as testbeds for Bun, Rust, design-stack evaluation and benchmarks: never present them as Aphrody products.
- **Workspaces**: root `package.json` workspaces are `packages/*` (`infra/mesh-vn` aside, no bun package lives under `infra/`; `packages/ffi-bridge` binds the Rust cdylibs, `crates/dx12-hal` included). Packages expose `src/cli.ts`, run via `bun run --cwd packages/<pkg> src/cli.ts <cmd>` (what most `just` recipes wrap), and are AOT-compiled into `~/.local/bin`.
- **FFI**: `crates/ffi` builds `aphrody_ffi` (`depot_*` and `aphrody_*` symbols, read by `packages/forge` via `bun:ffi`; symbol names are a stable contract). **Three-way FFI**: Rust (`crates/rust-stack` -> `rust_stack_ffi.dll`), Go (`infra/cshared` -> `infra_go.dll`), and Bun (`packages/ffi-bridge`, `bun:ffi`) call each other over a C ABI. Changing an exported signature on one side means updating the other two and running `just verify-all`.
- **Deploy**: upstream only (`docs/infra/UPSTREAM-STACK.md`): images by `docker buildx bake` in CI (`images.yml`) or on `fr1` (factory: builds, CI, training, heavy agents), pushed to `ghcr.io/aphrody-labs`; `docker compose up --wait` on `prd` (`usa` node, production backends only, no compilers) and `fr2` (edge only); Cloudflare via wrangler/`cf`. Config is `infra/deploy.toml`.
- **VCS governance (pin-001)**: `src.lock.json` is the only pin; `DEPS` (gclient) and `.gitmodules` are derived from it by `ay manifests` (`ay manifests --check` / `just manifests-check` gate). Do not hand-edit them. `MAINTAINERS` (kernel format) is hand-maintained. Product names live in `identity.toml` (`just identity check`).
- **One canonical path per unit**: there are no root aliases (the former `C:/src/bun`, `C:/src/chromium`, ... junctions were removed; the list is in `var/reorg/`). Always reference `third_party/<name>`, `packages/<name>`, `crates/<name>`, `apps/<name>`. `third_party/chromium` is a gclient solution (`.gclient`, cache in `%LOCALAPPDATA%/depot_tools/git_cache`); `third_party/bun` is the `aphrody-labs/bun` fork (default branch `main`), a Rust Cargo workspace of ~130 crates under `src/` with its own `CLAUDE.md` (build with `bun bd`, never plain `bun test` there).
- **Root Cargo workspace** (`Cargo.toml`): flat `crates/<name>` members sharing `[workspace.package]` (edition 2024), `[workspace.dependencies]`, and one release profile (fat LTO, 1 codegen unit, abort). Members inherit with `edition.workspace = true`; archguard accepts that only when the root value is compliant.
- **Tooling crates**: `crates/ay` (package `aphrody`, binary `ay`) is the repo tooling CLI (no `xtk`, `depot`, `archguard`, `gitingest` or `stack-bench` binaries any more); it routes to libraries: `crates/archguard` (`ay arch`, rules `ARCH-001`..`ARCH-017` under `src/rules/`), `crates/xtask` (lib `xtk`: `ay doctor`, `ay lock`, `ay manifests`, `ay git slim --all`, `ay git audit`), `crates/depot-cli` (`ay git`, `ay ingest`, `ay graph`; logic in `depot-core`, `depot-graph`, `depot-treesitter`, `depot-ingest`), `crates/bench` (`ay bench`).
- **Code graphs**: `graphify-out/GRAPH_REPORT.md` covers `packages/`; `graphify-out/bun/` covers Bun (`third_party/bun/src`, ~420k nodes). Each report records the commit it was built from; rebuild with `just graph <path> <name>` when stale. Query these before grepping `third_party/`.

## Agent Setup

- **Skills**: `.agents/skills/*/SKILL.md` is the single source; `.claude/skills` is a junction/symlink to it (created by `ay up --bootstrap`, `[[link]] claude-skills` in tools.toml; gitignored). Add skills under `.agents/skills/` only.
- **Settings**: `.claude/settings.json` (versioned) sets `outputStyle: "Proactive"`, allow-all permissions and `permissions.deny` rules that hold in every mode (reading or editing `.env`, staging it, writing System32), and enables the project plugins (LSPs for Rust, Go, TypeScript, C/C++; `pr-review-toolkit`, `code-simplifier`, `commit-commands`, `security-guidance`). Bypass mode is not honored from project settings (Claude Code 2.1.257+): it lives in `~/.claude/settings.json` (`permissions.defaultMode: "bypassPermissions"`, `skipDangerousModePermissionPrompt: true`) or on the command line. MCP split: global = Context7, Microsoft Learn, Google Workspace (Docs, Drive, Sheets, Slides for plans, DESIGN.md, quests and assets), Vercel, Cloudflare, GitHub, Hostinger (user MCP `hostinger-api`); `apps/rosegriffon` adds Neon, Supabase and the Steam plugin; Gmail, Calendar and Claude Docs are disabled per project in `~/.claude.json` `disabledMcpServers`. Personal overrides go in `.claude/settings.local.json` (gitignored).
- **No human in the loop**: `just agent "<task>"` runs `claude -p --permission-mode bypassPermissions --output-format json`; `just agent-ci "<task>"` or an `@claude` comment runs `.github/workflows/claude.yml` on a GitHub-hosted runner. Nothing compiles on the workstation: builds and CI run on fr1 (`ci.yml` on runner `[self-hosted, fr1]`, heavy agent roles) and GitHub-hosted runners (`judge.yml`).
- **Orchestrator**: `just orch run <workflow.json>`, `just orch plan "<goal>"` and `just lifecycle --task "<task>" --paths <prefix>` run task graphs in parallel on fr1 (heavy agents), pc and fr2, prd only for production checks with engines chosen at run time from installed CLIs and `llm_models`, failover on quota/429/auth, fix tickets, budgets and JSON reports; edits go through the `infra/agents/runner.ts` queue. Publishing, messages and spending are held in `var/agents/outbox/` unless `.agents/owner-rules.json` allows them. Reference: `packages/ai-os/docs/ORCHESTRATOR.md`, skill `ai-os-orchestrator`.
- **Guard hook**: `.agents/scripts/pre-tool-guard.ts` serves `agy` (off by default, `AGENT_GUARD=warn|enforce`). Claude Code no longer runs it on every tool call; the `permissions.deny` rules replace it. Tests: `bun test ./.agents/scripts/pre-tool-guard.test.ts`.

## Autonomous Operating Loop (NHITL)

Work end to end without waiting for confirmation.

1. **Orient**: read `AGENTS.md`, the matching skill, and the graph report before touching an unfamiliar area. Fan out with Explore subagents for multi-directory searches; run independent searches and suites in parallel.
2. **Use every tool available**: Context7 for any library/CLI API before writing against it; Microsoft Learn for Windows/PowerShell; the Vercel, Supabase, Neon MCPs for those platforms; `claude-in-chrome` to verify UI visually; `/code-review` and `/simplify` on your own diff; `/security-review` for auth, FFI, and deploy code.
3. **Verify, never assume**: a change is done after `bun fmt`, `bun check`, the affected `bun test`, and the CI or prd run of `cargo test` / `go test` / `just archguard` pass. Report failures with their output.
4. **Learn from errors**: when a command or assumption fails for a non-obvious reason (wrong flag, submodule not initialized, archguard rule, shell quirk), save a `feedback` memory with cause and fix. Check memory before retrying a known-failing approach.
5. **Keep improving**: after the task passes, refactor what you touched (duplication, dead code, missing tests) in a separate commit. For continuous unattended work use `/loop` or `/schedule`.
