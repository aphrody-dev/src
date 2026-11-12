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
| `ay sys` | (new) | OS, firmware, hardware and software profile |
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
