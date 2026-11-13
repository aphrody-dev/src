# Plan: src as game engine and creative suite (state 2026-11-13)

Done and pushed: `docs/epic/RESOURCES.md`, `docs/epic/TRACKING.md`, `docs/games/MEDIA-STACK.md`, `docs/games/ARTCRAFT.md`; forks of 18 bevyengine repos, the Epic and community set, 32 storytold repos plus egui, storytold-winit, storytold-wgpu; upstream sync on fr1 (timer) and CI (`upstream-sync.yml`).

## Decisions (taken 2026-11-13 by default, owner may override)

1. UI layer: egui 0.37 for the suite (what every Craft App uses, permissive), Bevy as the engine and runtime; one wgpu/winit pair pinned in the root workspace.
2. Unlicensed storytold repos stay unused and unforked until a license is granted.
3. C root folder: not created before the archguard whitelist change and a first LLVM-IR extraction of FFmpeg on fr1 prove the shape.

## Work order once decided (all builds on fr1)

1. `just graph` on `third_party/{artcraft,photocraft,bevy}` to get real crate and dependency graphs; replace the estimates in ARTCRAFT.md.
2. Pin one wgpu/winit/egui set in the root workspace `[workspace.dependencies]`; run `cargo tree -d` on fr1 to list duplicates.
3. Absorb Craft libs (`craft-libs`, `craft-i18n`, `craft-extensions`) as `crates/*` only after license and archguard checks.
4. Media stack: add FFmpeg fork, extract C API with the `graph` recipe, then design the ABI (MEDIA-STACK.md next steps).
5. Capture apps (screenshots, design tokens) from built binaries on fr1; the marketing site exposes none.

## Known gates failing today (not caused by these docs)

`ay arch check --strict` (72+ errors, oversized binaries ARCH-014), `ay manifests verify` (gitlink pins), `ay doctor` (cl.exe missing).
