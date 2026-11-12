# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The canonical cross-agent contract is [`AGENTS.md`](./AGENTS.md) plus [`.agents/SOUL.md`](./.agents/SOUL.md). This file adds what Claude Code specifically needs: commands, architecture, and the autonomous operating loop.

## Hard Rules (enforced by `archguard` and CI)

- `packages/ai-os` (`@aphrody/ai-os`) is the sole AI product and owner of AI routing, MCP, skills, memory. Other units are generalist software; do not add AI features or AI-flavored copy outside `ai-os`.
- Domain purity: `crates/*` is Rust 2024 only (no `.ts`/`.js`/npm). `packages/*` is Bun-only `@aphrody/*` (no root `Cargo.toml`/`go.mod`). Infra is Go 1.27. Upstream code lives only in `third_party/`, never edited in place for first-party work.
- Root directories are whitelisted in `tools/archguard/archguard.rules.json` (`allowed_root_physical_dirs`). Adding a new root dir (including `.claude/`) fails `archguard check --strict` unless the whitelist is updated.
- No `postinstall`/`preinstall` scripts, no `binding.gyp`; avoid npm dependencies where a Bun built-in exists (`bun:sqlite`, `Bun.SQL`, `bun:ffi`, `bun build --compile`).
- UI work follows the Design-First Gate: PRD (*Cahier des charges*) + `DESIGN.md` before code, then `gds verify` and `wck` 100/100.
- Never touch `C:\Windows\System32`; userland binaries go in `C:\Users\aphro\.local\bin`.
- Never print, log, or stage `C:\src\.env` (only `.env.example` is committed). Zero emojis in code, Markdown, UI text, and commits.

## Commands

Toolchain: Bun 1.4.4, Cargo (Rust 2024), Go 1.27, `just` (recipes run in PowerShell). First-party CLIs are prebuilt in `~/.local/bin`: `archguard`, `xtk`, `depot`, `frg`, `gds`, `wck`, `graphify`, `src-deploy`, `ai-os`.

```powershell
bun fmt                       # format workspace (bun fmt --check in CI)
bun check                     # typecheck
bun test packages/env-kit     # test one package
bun test packages/env-kit/tests/foo.test.ts -t "name"   # single test file / test name
bun run test:packages         # all package suites listed in root package.json
cargo test --manifest-path crates/<crate>/Cargo.toml    # no root Cargo workspace; each crate is standalone
cargo test --manifest-path crates/<crate>/Cargo.toml <test_name>
cd infra; go test ./...       # Go deploy engine
archguard check --strict      # architecture / purity / hygiene gate (just archguard)
just verify-all               # archguard + xtk doctor + bun + cargo + go suites
just doctor                   # toolchain check (xtk doctor)
just lock                     # regenerate src.lock.json, DEPS, .repo manifest, MAINTAINERS
src-deploy up --all --dry-run # deploy plan (bun run deploy); deploy:live is a real production deploy
```

Most `apps/*` and `packages/*` are git submodules, and many are uninitialized in a fresh checkout (`git submodule status` shows `-`). A suite that "can't find" a package usually means the submodule is not checked out, not a code bug. Commits inside a submodule must be made in that submodule, then the superproject pointer bumped.

## Architecture

- **Workspaces**: root `package.json` workspaces are `packages/*`, `infra/mesh-vn`, `infra/ffi-bridge`. Packages expose a `src/cli.ts` entry run via `bun run --cwd packages/<pkg> src/cli.ts <cmd>` (this is what most `just` recipes wrap) and are AOT-compiled to `~/.local/bin` executables.
- **Three-way FFI**: Rust (`crates/rust-stack` -> `rust_stack_ffi.dll`), Go (`infra/cshared` -> `infra_go.dll`), and Bun (`infra/ffi-bridge`, `bun:ffi`) call each other over a C ABI. Changing an exported signature on one side requires updating the other two and running `just verify-all`.
- **Deploy engine**: `infra/cmd/src-deploy` (Go) builds OCI images, drives Cloudflare (DNS/R2/Workers), Caddy blue/green on `fr1`/`fr2`/`usa`, GCP Cloud Run, Vercel. Config is `deploy.toml`; generated Caddyfile lives in `infra/generated/`.
- **VCS governance**: `src.lock.json` is the source of truth; `DEPS` (Chromium gclient), `.repo/manifests/default.xml` (AOSP repo), and `MAINTAINERS` (kernel style) are generated from it by `xtk lock` / `xtk manifests`. Do not hand-edit the generated files.
- **Tooling crates**: `crates/xtask` (`xtk`: doctor, lock, audits), `crates/depot` (depot_tools shims, ingest, AST graph), `tools/archguard` (rule engine, rules in `archguard.rules.json`, rule IDs `ARCH-0xx`).
- **Code graph**: `graphify-out/GRAPH_REPORT.md` and `graph.json` hold a prebuilt architecture graph. Query it (`graphify`, or `depot graph query <term> <path>`) before grepping across the tree; `third_party/` is huge and should not be searched blindly.
- **Skills**: project skills live in `.agents/skills/*/SKILL.md` (Antigravity format). Claude Code does not auto-load them; read the relevant `SKILL.md` directly when a task matches its name (e.g. `bun-native-zero-dep`, `design-first-pro-max`, `rust-stack-sovereign`, `go-infra-oneclick-deploy`).
- **Hooks**: `.agents/hooks.json` + `.agents/scripts/pre-tool-guard.ts` are written for `agy`'s payload shape (`toolCall.name`, `CommandLine`) and are not active in Claude Code.

## Autonomous Operating Loop (NHITL)

Work end to end without waiting for confirmation on reversible, local actions: reading, editing, running tests/builds, creating branches, local commits when asked to commit.

1. **Orient**: read `AGENTS.md`, the relevant `.agents/skills/*/SKILL.md`, and the graph report before touching an unfamiliar area. Fan out with Explore subagents for multi-directory searches; run independent searches and test suites in parallel.
2. **Use the tools you have**: Context7 for any library/CLI API before writing against it; Microsoft Learn for Windows/PowerShell; the Vercel, Supabase, Neon MCPs for those platforms; `claude-in-chrome` to visually verify UI; `/code-review` and `/simplify` on your own diff before declaring done; `/security-review` for auth, FFI, and deploy code.
3. **Verify, never assume**: a change is done only after `bun fmt`, `bun check`, the affected `bun test` / `cargo test` / `go test`, and `archguard check --strict` pass. Report failures with their output.
4. **Learn from errors**: when a command, assumption, or approach fails for a non-obvious reason (wrong flag, submodule not initialized, archguard rule, Windows path quirk), save it as a `feedback` memory with the cause and the fix, so the next session does not repeat it. Check memory before retrying a known-failing approach.
5. **Keep improving**: after the requested task passes, look for refactors in the code you touched (duplication, dead code, missing tests) and do them in a separate commit if they are small and covered by tests. Unbounded continuous work needs an actual scheduler: use `/loop` or `/schedule`, not this file.

Still confirm first, even in autonomous mode: `deploy:live` / `src-deploy up` without `--dry-run`, `git push` (especially `--force`) and Tri-Forge mirroring (`frg`), destructive MCP calls (deleting Neon/Supabase/Vercel resources, sending email), anything touching `.env` contents, and rewriting submodule history.
