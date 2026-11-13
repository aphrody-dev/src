# Games and creative suite in src: plan (rewritten 2026-11-13)

This replaces the first version of this file. That version proposed decisions the repository had already taken (UI stack, GPU pins, FFmpeg binding, C ABI) and is withdrawn. Every row below cites where the fact was read on 2026-11-13. Nothing here is built unless a row says so.

## 1. What already exists

| Area | State | Read in |
| :--- | :--- | :--- |
| UI decision | Owner decision of 2026-11-13, amended the same day: the framework is free (Bevy UI, egui, iced, WinUI 3, Tauri, GPUI, WebUI and others); the criteria are rendering quality, performance and function | `docs/ui/STACK.md` |
| Design system | Tokens in `packages/design`; Rust core `crates/aphrody-ui`, with layout adapters `to_bevy` (`css_to_bevy_node`) and `to_egui` behind the optional features `bevy` and `egui` | `docs/DESIGN_SYSTEM.md`, `crates/aphrody-ui/Cargo.toml`, `crates/aphrody-ui/src/layout/mod.rs` |
| Engine and GPU pins | `[workspace.dependencies]`: bevy 0.20, egui 0.37, wgpu 30.0.1, winit 0.31.0-beta.4, image 0.25.10 | `Cargo.toml` lines 124 to 162 |
| Crates using those pins | `aphrody-ui` (bevy with `bevy_ui`, egui; both optional), `corelib` (wgpu, optional), `gamescope-cli` (wgpu, winit), `gamescope-web-wasm` and `gamescope-wgsl` (wgpu) | `crates/*/Cargo.toml` |
| Media domain | `crates/tv-core`, `tv-ffmpeg` (safe wrapper over `ffmpeg-next` 9.1.0), `tv-cli`, `tv-i18n`; codec and container choice per domain | `docs/tv/plan-ecosysteme-c-rust.mdx`, `Cargo.toml` line 79 |
| License policy | Allow-list in `deny.toml`; GPL, LGPL, AGPL, non-OSI licenses and repositories reported `NOASSERTION` are refused unless a review is recorded; FFmpeg libav* is linked dynamically, never vendored | `docs/ARCHITECTURE.md` lines 405 to 411, `deny.toml` |
| C ABI | `crates/core-capi` (cbindgen, `include/aphrody_core.h`) over `crates/core` (tree-sitter grammars, BLAKE3, index); Bun binding in `packages/core/src/ffi.ts`; rules in `docs/llvm/C-ABI-2026.md` | those files |
| Code graph | `ay graph build` (tree-sitter), recipe `just graph <path> <name>`, output in `graphify-out/<name>` (not tracked) | `justfile` lines 74 to 76 |
| Flattening | `ay flat list|sync|check` copies leaf crates of the bun fork into `crates/bun-flat`, one module per upstream crate, with the fork commit and a license per module in `flat.toml` | `crates/bun-flat/flat.toml` |
| Pinned checkouts | `third_party/artcraft` at `83aad5eb` (storytold upstream), `third_party/ffmpeg` at `46d13a83` (git.ffmpeg.org), `third_party/storyteller-bevy` at `4ce8b72c`, `third_party/wgpu` (aphrody-labs fork), `third_party/winit` (upstream); in the lock since commit `4c6bf057` (2026-11-12) | `DEPS` lines 70, 128, 286, `src.lock.json` |
| Forks tracked | 18 bevyengine, 33 storytold and 10 EpicGames entries in `third_party/forks.txt`, synced by the fr1 timer and `upstream-sync.yml` | `docs/epic/TRACKING.md` |
| Direction | "Epic track (not scheduled)"; Unreal Engine only through the private fork | `docs/STACK-ROADMAP.md`, `docs/ARCHITECTURE.md` lines 126 to 133 |

## 2. Versions that constrain a merge (`gh api`, 2026-11-13)

| Stack | wgpu | winit | UI | License |
| :--- | :--- | :--- | :--- | :--- |
| src workspace | 30.0.1 | 0.31.0-beta.4 | per `docs/ui/STACK.md` | MIT OR Apache-2.0 |
| Bevy v0.20.1 (latest release) | 30 | 0.30 | bevy_ui | MIT OR Apache-2.0 |
| Craft Apps (photocraft, filmcraft, soundcraft, craft-launcher, craft-libs) | 30.0, through `storytold/egui` at `6d518fc7` | 0.30.13, `storytold/winit` at `a517b384` | egui 0.37.0 (fork) | Apache-2.0 |
| ArtCraft Studio (`storytold/artcraft`) | not read | not read | Tauri 2.11.2 web view and a TypeScript front end | Apache-2.0 and MIT files |
| `storytold/artcraft-services` (backend) | n/a | n/a | n/a | "ArtCraft License (WIP)", fair source, private personal use only |

Reading: all three Rust stacks are on wgpu 30, so one wgpu is enough. winit differs: src pins 0.31.0-beta.4, Bevy 0.20.1 and the Craft egui fork use 0.30.x. Today only `gamescope-cli` depends on winit and `aphrody-ui` enables only `bevy_ui`, so there is one winit in the workspace. Adding `bevy_winit` or `egui-winit` would add a second one.

## 3. Conflicts found, with the default applied until the owner decides

1. Settled by the owner on 2026-11-13: any UI framework is accepted (Bevy UI, craft-ui and egui, wgpu, iced, WinUI 3, Tauri and others) provided the result is good-looking, optimized and functional. The Craft Apps therefore keep egui, and Aphrody tokens reach them through the `egui` feature of `aphrody-ui`. This amends the four-reference rule of `docs/ui/STACK.md`.
2. `third_party/storyteller-bevy` is pinned although the repository has no license file and no `license` field (last upstream commit 2024-04-09). Default: reference reading only, nothing copied into `crates/`, candidate for removal from the lock.
3. `docs/tv/plan-ecosysteme-c-rust.mdx` lists x264 and x265 (GPL) while `docs/ARCHITECTURE.md` refuses GPL and the `tv-ffmpeg` test `ffmpeg_build_is_lgpl` rejects a libavutil built with `--enable-gpl`. Default: what the test enforces (LGPL build, hardware encoders).
4. A new root directory named `C` contradicts the layering (the C ABI is `crates/core-capi`) and the root whitelist of archguard. Default: no new root directory. A new C surface goes into `core-capi` or into a `<domain>-capi` crate under the rules of `docs/llvm/C-ABI-2026.md`.
5. `storytold/artcraft-services` is under a non-OSI license. Default: not forked, not copied; only its documented HTTP API may be called (`docs/games/ARTCRAFT.md`).

## 4. Work order, each step with its check

Rust builds run in CI or on fr1, never on the workstation.

| # | Step | Check | State |
| :--- | :--- | :--- | :--- |
| 1 | Graph the checkouts that exist with `just graph third_party/<path> <name>` | `GRAPH_REPORT.md` with node and edge counts | Done 2026-11-13 with `ay graph build`, output in `graphify-out/` (not tracked), nodes / edges: libavutil 5055 / 11345, libavcodec 29819 / 97225, libavformat 10006 / 40174, libavfilter 11588 / 38477, libswscale 3022 / 6917, libswresample 404 / 724, libavdevice 1778 / 3407, `artcraft/crates` 34314 / 69018, `storyteller-bevy` 5317 / 7256. Each run took 6 s or less on the workstation |
| 2 | LLVM IR of the same libraries with the shared clang (`docs/llvm/UNIFIED-TOOLCHAIN.md`) on fr1 | `.bc` files produced from a configured LGPL build | Not started |
| 3 | Format layer: evaluate `storytold/craft-libs` (Apache-2.0, 114 `craft-<name>` crates such as psd, pdf, exr, heif, tiff, webp, svg, raw, docx, xlsx) as git dependencies pinned by `rev`, without copying | `cargo deny check licenses` passes in CI with the pins | Not started |
| 4 | Media: extend `crates/tv-*` as `docs/tv` describes; this plan adds nothing | tests of `tv-ffmpeg`, including `ffmpeg_build_is_lgpl` | Owned by the session that maintains `crates/tv-*` |
| 5 | Engine: add Bevy crates one feature at a time behind the `bevy` feature of `aphrody-ui`; settle winit 0.30 or 0.31 before enabling `bevy_winit` | `cargo tree -d` in CI lists one winit and one wgpu | Not started |
| 6 | Flatten only leaf crates that must be modified: generalize `ay flat` to a `flat.toml` per fork (`--fork` already exists); unlicensed and non-OSI sources are excluded | `ay flat check --fork third_party/<name>` is clean | Not started |
| 7 | Captures of the Craft Apps (screenshots, tokens) from release builds made on fr1, stored outside git | files listed in `docs/games/ARTCRAFT.md` | Not started |
| 8 | Unreal Engine: unchanged, private fork, interop only | `docs/epic/RESOURCES.md` | No work planned here |

## 5. Not done

- No crate was added, no code moved and no build was run for this plan. Refactoring src into a game engine and creative suite has not started.
- Gates that failed when measured on 2026-11-13, independently of these documents: `ay arch check --strict` (72 errors or more, among them binaries over 50 MB), `ay manifests verify` (pins that are not gitlinks), `ay doctor` (`cl.exe` missing).

## 6. Target set by the owner on 2026-11-13 (recorded, nothing started)

- Three apps only, one per domain: `shenron`, `rosegriffon`, and one Aphrody app merging `apps/aphrody` (aphrody.com) and `apps/aphrody-app` (aphrody.app). Every other app, package and crate is flattened into shared code; code of `shenron` and `rosegriffon` that is not specific to their product moves to shared crates and packages and is reused.
- The merged Aphrody app hosts and deploys the Craft Apps, ArtCraft and the game: full-screen WebAssembly and WebGPU in the browser, open-world multiplayer, 120 fps at 1080p, gamepad (Xbox, PlayStation), keyboard and mouse, audio and video, built on Bevy with a feature matrix against Unreal Engine.
- Upstreams the owner named, to check with `gh api` before any use: `vercel-labs/ui`, `vercel-labs/native`, `niri-wm/niri`, `niri-wm/awesome-niri`, the DioxusLabs organisation, `longbridge` (GPUI components, `nsh`), `cloudflare/vinext`, `vercel/next.js`, `vercel/vercel`, `vercel/ai`, `vercel/turborepo`, `mui/base-ui`, shadcn, `tailwindlabs/tailwindcss`, Microsoft WebUI, iced and COSMIC.
- Cleanup: remove vendored and nested third-party copies inside apps, packages and crates; one version per dependency; smaller binaries.
- Checks to define before work starts: one build of the merged app in CI, a browser run that measures frame rate, and a parity list per replaced feature. None exists today.
- Character and mascot assets (Inazuma Eleven and Dragon Ball characters, Tux, the Bun mascot, third-party logos) belong to their owners; only assets whose license allows redistribution go into this public repository.
