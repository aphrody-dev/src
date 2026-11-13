# Naming

One identity, short tools. Decided by the owner on 2026-11-12.

## Identity

| Surface | Name |
|---|---|
| Brand, domains | Aphrody (`aphrody.com`, `aphrody.app`, `labs.aphrody.com`) |
| npm | scope `@aphrody/*` (owned), package names short: `@aphrody/<tool>` |
| crates.io | `aphrody` for the CLI crate, `aphrody-<area>` for published libraries (no scopes on crates.io). About 190 older `aphrody-*` crates exist: check a name before adding one |
| GitHub | `aphrody-dev` |

## The CLI: `ay`

One multicall binary, like `bun`, `cargo` or `busybox`: `ay <command> [subcommand]`. Package `aphrody`
(crate), binary `ay`. Every former standalone tool becomes a subcommand; no per-tool binaries, no
aliases.

| Command | Replaces | Area |
|---|---|---|
| `ay build [--target <preset>]` | ad hoc cargo/bun invocations | cross-compilation presets (windows-msvc, linux-gnu, linux-musl, macos, wasm32) |
| `ay test` | `just verify-all` pieces | runs cargo, bun and go suites |
| `ay arch check` / `ay arch graph` | `archguard` | architecture gate ARCH-001..017 |
| `ay lock` / `ay doctor` | `xtk lock`, `xtk doctor` | src.lock.json, DEPS, .repo manifest, MAINTAINERS |
| `ay git ...` | `depot` (git shims, slim) | VCS tooling |
| `ay ingest` | `gitingest` | repository digest |
| `ay graph <path>` | `graphify`, `depot-graph` | tree-sitter code graph |
| `ay deploy` | `src-deploy` (Go engine, invoked by `ay`) | deploy |
| `ay bench` | `stack-bench` | benchmarks |
| `ay ai ls/install/service/pull/config/check/auth/push/up` | ad hoc Ollama, llama.cpp, LM Studio, vLLM, mistral.rs and LiteLLM setup | inference providers discovered from the models.dev registry plus `infra/ai/ai.toml`, behind one LiteLLM proxy (fork aphrody-labs/litellm), Task Scheduler or systemd services |
| `ay upstream status/sync/check/pr/mark/gc/export` | hand rebases of the forks, Electron `git-export-patches`, ad hoc PR branches | patch stacks of aphrody-labs/bun, bunx-sh/bun and the Chromium series (`infra/upstream/stacks.toml`, statuses in `infra/upstream/status/`), replay on upstream with drop of merged patches, ephemeral `up/*` PR heads, upstream contribution rules; run by bun from `packages/upstream` (docs/upstream/STRATEGY.md). `ay bun watch` reports what upstream did; `ay upstream` keeps our patches on top of it |
| `ay sys` | (new) | OS, firmware, hardware and software profile |
| `ay auth status/repair/gh-secrets/tunnels/rotate`, `ay secret` | ad hoc `gh auth`, `gcloud auth`, `gh secret set`, token files | every authentication of the fleet and the OS secret store (DPAPI, systemd-creds), run by bun from `packages/env-kit` (docs/infra/AUTH.md) |
| `ay ssh exec/cp/hosts/check` | `ssh`, `scp` (OpenSSH client) | pure-Rust SSH (crate `aphrody-remote`, russh): exec on `usa`/`fr1`/`fr2` or `all`, SFTP copy, fleet health |
| `ay web check` | `wck` | web quality gate |
| `ay design` | `gds` | design system |
| `ay forge` | `frg` | forge |
| `ay wl` | `wslg-rs`, `wslg-cosmic-hypr` | Wayland compositor (Linux, Windows, web) |
| `ay scope` | `gamescope-rs` | gamescope mode |
| `ay wsl`, `ay userland` | `unix-distro`, `omarchy-wsl` | WSL distribution, Rust userland |

Bun-based tools (`wck`, `gds`, `frg`) keep their TypeScript implementation; `ay` dispatches to their
AOT-compiled binaries until they are ported.

## Conventions

- Commands are lowercase single words; subcommands are verbs (`check`, `build`, `sync`), as in
  `cargo` and `bun`. Flags follow GNU style (`--long`, `-s`), parsed with clap.
- Crate directories: `crates/<area>` (flat, one level), package name `aphrody-<area>` when published,
  plain `<area>` when `publish = false`. Rust library names use `snake_case`.
- Exit codes follow Unix: 0 success, 1 failure, 2 usage error.
- Config lives in the repo root (`ay.toml` when needed), environment overrides use the `AY_` prefix,
  and `SRC_ROOT` stays the repo root override.
