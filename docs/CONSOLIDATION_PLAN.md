# Consolidation plan: one Rust workspace, one CLI

Status: proposed (2026-11-12). Source: read-only inventory of every first-party `Cargo.toml` outside `third_party/`. Nothing below has been moved yet.

## Goals (from the owner)

- Clean Rust: flat workspace, no crates nested inside crates, no dead code, Cargo best practices.
- Published crates.io dependencies instead of vendored copies; minimal vendoring.
- Duplicated projects merged; thin TypeScript packages turned into scripts, useful ones kept.
- One full-Rust, LTO + AOT CLI that manages the whole repo: VCS (git, gix, depot_tools, repo), code ingest and graphs (gitingest, graphify, tree-sitter), architecture gate, distro tooling (CachyOS, Omarchy, kernel), Bun and Chromium tooling, deploy.
- A real build factory: cross-compilation for native Rust, C++ (Chromium), Bun, and WASM apps, with one FFI story.
- aphrody.app: a full-Rust monorepo product that builds, deploys, monitors and links native Rust, WASM and C++ apps, with a correct FFI layer, LTO/AOT, and cross-compilation in mind.

## What exists today

| Area             | Units                                                                                                                                             | Problem                                                                                                                            |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| Repo tooling     | `crates/depot` (9 crates, ~12k LOC, bins `depot`, `gitingest`, `depot-graph`, `graphify`), `crates/xtask` (`xtk`, 1.3k), `tools/archguard` (3.2k) | Three CLIs with overlapping `manifests`, `lock`, `slim`, `graph`, `doctor`; `graphify` and `depot-graph` are the same binary twice |
| Distro           | `crates/unix` (4 crates, ~5k)                                                                                                                     | Nested workspace; vendors coreutils, chwd, CachyOS-Settings under `upstream/`                                                      |
| Wayland / tiling | `crates/wayland` (5 crates, ~3.6k), `apps/aphrody-app/crates/aphrody-core` (wire, wm, layout)                                                     | Two hand-rolled wire formats and two tilers; 113k LOC of vendored smithay/libcosmic/wayland-rs that no crate uses                  |
| GPU              | `crates/gamescope-rs` (4 crates), `crates/corelib` gpu module                                                                                     | Path deps into `third_party/wgpu` although crates.io `wgpu` is pinned too                                                          |
| Design           | `crates/design-system` (7 crates, ~31k)                                                                                                           | 2 crates with no dependents (`identity`, `layout`); path dep into `third_party/taffy`                                              |
| FFI              | 7 cdylibs: depot-ffi, corelib, rust_stack_ffi, sovereign-polyglot-ffi, pi_opencode_native, aios-wasm-kernel, aphrody-android                      | No shared ABI crate; consumers in TS (`bun:ffi`), Go (`src-deploy`) and the browser                                                |
| Servers          | rust-stack (axum), ring3-agent, aphrody-host, gamescope-cli                                                                                       | Four HTTP servers                                                                                                                  |
| Dead             | `infra_ffi_bridge`, `agy-desktop`, archguard lib target, `aphrody-env` Rust loader, all `upstream/` clones                                        | No dependents                                                                                                                      |

Out of scope: `apps/shenron` and `apps/rosegriffon` are community products Aphrody maintains, not Aphrody products. Their workspaces stay separate. Inside them, the duplicated `shenron-gpu` and RE crates should be deduplicated by their maintainers' process, not merged into Aphrody tooling.

## Target layout

One workspace at `C:\src\Cargo.toml` (root repo), `resolver = "3"`, `exclude = ["third_party", "**/upstream", "apps/shenron", "apps/rosegriffon"]`, shared `[workspace.dependencies]`, `[workspace.lints]`, and release profile `lto = "fat"`, `codegen-units = 1`, `panic = "abort"`. Members are flat `crates/<name>`:

| Crate                 | Built from                                                                                                |
| :-------------------- | :-------------------------------------------------------------------------------------------------------- |
| `src-cli` (bin `src`) | depot-cli + xtk + archguard bin + unix-distro bins + wslg-cli bins + gamescope-cli + stack-bench          |
| `src-core`            | depot-core + xtk probes, lock and manifest generators (one implementation)                                |
| `src-code`            | depot-treesitter + depot-graph + depot-ingest + archguard graph; replaces polyglot-ffi's tree-sitter copy |
| `src-arch`            | archguard rules                                                                                           |
| `src-vcs`             | depot forge/fork/worktree/migrate on current `gix`; replaces every `Command::new("git")`                  |
| `src-re`              | depot-re + corelib `re`                                                                                   |
| `src-distro`          | unix-cachyos + omarchy + uutils on crates.io `uu_*`                                                       |
| `wm`                  | one Wayland wire format and one tiler (aphrody-core + hypr-tiler + smithay-wayland-wire)                  |
| `gpu`                 | corelib gpu + gamescope core/wgsl on crates.io `wgpu`                                                     |
| `design`              | design-system reduced to tokens, emit+icons, layout                                                       |
| `ffi`                 | one C-ABI crate with stable symbol names, cdylib per consumer feature                                     |
| `agent`               | ring3-agent + rust-stack on one axum server                                                               |

CLI tree:

```text
src doctor | lock | manifests | slim [--all] | info | maintainer | bench
src vcs      {gix, worktree, fork, forge, clone, audit}
src code     {ingest, graph {build, query, path, explain, mcp}, ast, rope, ignore}
src arch     {check, rules, graph}
src re       {analyze, disasm, lua, migrate}
src distro   {cachyos, omarchy, wsl, uutils}
src gpu      {gamescope}
src build    {native, wasm, chromium, bun} --target <triple>   (build factory)
src deploy   {plan, up, status}                                 (wraps infra/src-deploy)
src artifacts {verify, hash, init}
```

## Done

- 2026-11-12: unused `upstream/` reference clones deleted from crates/depot, crates/unix, crates/wayland and packages/google-design (icons and color utilities kept, they are read by code).
- 2026-11-12: `crates/corelib`, `crates/gamescope-rs` (wgpu 30.0) and `crates/design-system` (taffy 0.15) build against crates.io instead of `third_party/`. corelib needed one change (`PollType::Wait.submission_index` is an `Option` in the released API). The `third_party/taffy` fork branch `feat/google-design-web-vitals` carries ~1,900 lines of first-party code (`google_design.rs`, `web_vitals.rs`) that no crate uses; it should move into `crates/design` or be dropped.

## Order of work (each step ends green: `cargo test --workspace`, `just verify-all`, `archguard check --strict`)

1. Delete dead units and the `upstream/` reference clones (no first-party path dep points into them).
2. Switch `third_party/wgpu` and `third_party/taffy` path deps to their crates.io versions after diffing for local patches.
3. Create the root workspace with the crates that already live in the root repo (archguard, corelib, design-system), then bring in submodule crates one at a time with `git subtree` so history is kept; archive each old remote after its crate lands.
4. Merge the three repo CLIs into `src-cli`, keeping `depot`, `xtk`, `archguard` as thin aliases until scripts and docs are migrated.
5. Unify FFI behind `ffi` with symbol names preserved for `bun:ffi` (forge, ai-os, pi-opencode) and Go (`src-deploy`).
6. Merge the Wayland wire and tiling code into `wm`; aphrody-app depends on it.
7. Add `src build` cross-compilation targets (x86_64/aarch64 Linux musl and gnu, x86_64-pc-windows-msvc, wasm32-unknown-unknown, aarch64-linux-android) with per-target `cfg` gating so the host build still works.
8. Thin TS packages: `brain` and `epic-games` parsers become scripts or move into `src-re`; `bun-plugins` just/vcs-meta plugins are replaced by `src`.

## Risks

- Submodules with their own remotes (depot, xtask, unix, wayland, bench, ring3-agent, rust-stack, gamescope-rs, infra, apps, packages): flattening rewrites where history lives.
- FFI consumers in three runtimes; library file names and exported symbols must stay stable or be shimmed.
- `wayland-backend` needs Unix sockets; the Windows DX12/WSLg path is why the hand-rolled wire format exists.
- libcosmic and cosmic-* are git-only crates.

## Open question for the owner

aphrody.app is today a browser tiling shell (`apps/aphrody-app`). The new direction describes it as a full-Rust monorepo that builds, deploys, monitors and links apps. Two readings: (a) aphrody.app becomes the product UI on top of `src build` / `src deploy` / monitoring, or (b) the workspace above _is_ aphrody.app. This decides where the root workspace lives.
