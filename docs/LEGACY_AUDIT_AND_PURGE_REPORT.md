# LEGACY AUDIT AND PURGE REPORT

**Date:** 2026-11-12
**Scope:** `C:\src` (`apps/*`, `packages/*`, `crates/*`, `infra/*`) and `C:\src\var\legacy` (`yolo-rs/*`, `aphrody-labs/*`, `bunos`, `f1p-apps`)
**Gate Verification:** `archguard check --strict --root C:\src` (PASS, 0 errors, 0 warnings, 2865 files scanned)

---

## 1. Executive Summary

1. **Purge of Superficial Mock and Demo Code in `C:\src`:**
   - Removed all superficial self-contained TypeScript mock files in `C:\src\apps\aphrody\src\suite\` (`craft-wasm.ts`, `craft-ui.ts`, `workspace-docs.ts`, `spacedrive.ts`, `locally-uncensored.ts`, `pets-and-m3-icons.ts`, `cluster-search-app.ts`, `craft-cloud-app.ts`, `fluent-office-app.ts`, `m3-workspace-app.ts`, `spacedrive-app.ts`, `storytold-suite.ts`, `suite-styles.ts`, `webgpu-canvas.ts`) and `C:\src\apps\aphrody\src\backend\` (`hub.ts`, `docx-ics-vcf.ts`, `local-studio.ts`, `wasm-creative.ts`, `workspace-db.ts`).
   - Retained only [wasm-kernel.ts](file:///C:/src/apps/aphrody/src/suite/wasm-kernel.ts) (hand-assembled WebAssembly SIMD binary kernel required by [stack-picker.ts](file:///C:/src/apps/aphrody/src/benchmark/stack-picker.ts) and [aphrody.test.ts](file:///C:/src/apps/aphrody/tests/aphrody.test.ts)).
   - Verified [apps/aphrody](file:///C:/src/apps/aphrody/server.ts) test suite (`bun --cwd C:\src\apps\aphrody test`: 49 pass, 0 fail across 2 files), [apps/yolo](file:///C:/src/apps/yolo/server.ts) test suite (`bun --cwd C:\src\apps\yolo test`: 2 pass, 0 fail), and [apps/aphrody-app](file:///C:/src/apps/aphrody-app/Cargo.toml) (`cargo check`: 0 errors across `aphrody-core`, `aphrody-wasm`, `aphrody-host`, `aphrody-android`).

2. **Legacy Repository Inventory (`C:\src\var\legacy`):**
   - Audited **40 repositories** in `C:\src\var\legacy\yolo-rs\*`, **4 repositories** in `C:\src\var\legacy\aphrody-labs\*`, `C:\src\var\legacy\bunos`, and `C:\src\var\legacy\f1p-apps`.
   - Mapped every production-grade Rust crate, TypeScript package, WebGPU/WASM creative engine (`photocraft`, `vectorcraft`, `pdfcraft`, `filmcraft`, `effectcraft`, `lightcraft`, `figcraft`, `wordcraft`, `gridcraft`, `deckcraft`, `designcraft`, `cadcraft`, `soundcraft`, `artcraft`), desktop shell, and AI runtime to its canonical destination in `C:\src`.
   - Cataloged all legacy empty stubs, zero-byte directories, and <4 KB placeholder crates/packages that must be excluded from `C:\src`.
   - Documented exact locations of all **Aphrody Pets** (`Byron Love` Oklch palette and 8x11 sprite sheet, `Gemini Pet` Atlas SVG V2 1536x2288, `OpenPets`, `Mochi Desktop`) and **Aphrody M3 Icons & Tokens** (`@aphrody/material-design-icons`, `m3-icons`, `m3-tokens`, `m3-theme`).

---

## 2. Part I: `C:\src` Purge & Cleanliness Audit

### 2.1 Purged Superficial Files in `C:\src\apps\aphrody`

The following superficial mock and demo files were removed from `C:\src\apps\aphrody`:

- `C:\src\apps\aphrody\src\suite\craft-wasm.ts`
- `C:\src\apps\aphrody\src\suite\craft-ui.ts`
- `C:\src\apps\aphrody\src\suite\workspace-docs.ts`
- `C:\src\apps\aphrody\src\suite\spacedrive.ts`
- `C:\src\apps\aphrody\src\suite\locally-uncensored.ts`
- `C:\src\apps\aphrody\src\suite\pets-and-m3-icons.ts`
- `C:\src\apps\aphrody\src\suite\cluster-search-app.ts`
- `C:\src\apps\aphrody\src\suite\craft-cloud-app.ts`
- `C:\src\apps\aphrody\src\suite\fluent-office-app.ts`
- `C:\src\apps\aphrody\src\suite\m3-workspace-app.ts`
- `C:\src\apps\aphrody\src\suite\spacedrive-app.ts`
- `C:\src\apps\aphrody\src\suite\storytold-suite.ts`
- `C:\src\apps\aphrody\src\suite\suite-styles.ts`
- `C:\src\apps\aphrody\src\suite\webgpu-canvas.ts`
- `C:\src\apps\aphrody\src\backend\hub.ts`
- `C:\src\apps\aphrody\src\backend\docx-ics-vcf.ts`
- `C:\src\apps\aphrody\src\backend\local-studio.ts`
- `C:\src\apps\aphrody\src\backend\wasm-creative.ts`
- `C:\src\apps\aphrody\src\backend\workspace-db.ts`

### 2.2 Full Monorepo Source & Stub/Placeholder Audit (`C:\src`)

| Workspace Path | Source Files | Source Bytes | Stub/Placeholder Status |
| :--- | ---: | ---: | :--- |
| [apps/aphrody](file:///C:/src/apps/aphrody) | 37 | 218,785 | **CLEAN.** Zero external dependencies. 1 fallback catch block in [stack-picker.ts](file:///C:/src/apps/aphrody/src/benchmark/stack-picker.ts#L298-L302) for non-Bun browser runtime. |
| [apps/aphrody-app](file:///C:/src/apps/aphrody-app) | 21 | 194,702 | **CLEAN.** 4 Rust crates (`aphrody-core`, `aphrody-wasm`, `aphrody-host`, `aphrody-android`). Zero stubs or `todo!()`. |
| [apps/yolo](file:///C:/src/apps/yolo) | 9 | 51,308 | **CLEAN.** Pure Bun v1.4.4 fullstack server ([server.ts](file:///C:/src/apps/yolo/server.ts)), AST module graph ([graph.ts](file:///C:/src/apps/yolo/src/framework/graph.ts)), primitives suite ([primitives.ts](file:///C:/src/apps/yolo/src/framework/primitives.ts)), and SSR engine ([ssr.ts](file:///C:/src/apps/yolo/src/framework/ssr.ts)). |
| [apps/rosegriffon](file:///C:/src/apps/rosegriffon) | 3,205 | 23,213,104 | Production Next.js + Azalee VFS/CPK monorepo. |
| [apps/shenron](file:///C:/src/apps/shenron) | 4,342 | 30,249,332 | Production Shenron / Inazuma Eleven game runtime & decompilation workspace. |
| [packages/agy](file:///C:/src/packages/agy) | 9 | 95,565 | **CLEAN.** Zero stubs. |
| [packages/ai-os](file:///C:/src/packages/ai-os) | 36 | 587,795 | **CLEAN.** Sovereign AI-OS MCP nexus, System-1 BitNet trainer, A2A protocol, and Sentinel daemon. |
| [packages/ai-triad](file:///C:/src/packages/ai-triad) | 12 | 118,704 | **CLEAN.** Multi-provider AI Triad router & council gateway. |
| [packages/brain](file:///C:/src/packages/brain) | 4 | 17,924 | **CLEAN.** Persistent memory & soul storage engine. |
| [packages/bun-parity](file:///C:/src/packages/bun-parity) | 28 | 128,258 | **CLEAN.** Chromium-Bun parity scanner & Rust patch generator. |
| [packages/bun-plugins](file:///C:/src/packages/bun-plugins) | 13 | 83,015 | **CLEAN.** Native Bun plugins & VCS metadata loader. |
| [packages/chromium-bun](file:///C:/src/packages/chromium-bun) | 37 | 230,704 | **CLEAN.** 3-VPS search cluster (`cluster-3vps.ts`), Chromium inspector, and benchmark runner. |
| [packages/env-kit](file:///C:/src/packages/env-kit) | 11 | 117,801 | **CLEAN.** Includes [registry-cleanup.ts](file:///C:/src/packages/env-kit/scripts/registry-cleanup.ts) which actively detects and deprecates/yanks legacy `@yolo-rs/*` and `yolo-*` stub packages. |
| [packages/epic-games](file:///C:/src/packages/epic-games) | 8 | 27,156 | **CLEAN.** Epic Games integration package. |
| [packages/forge](file:///C:/src/packages/forge) | 19 | 148,200 | **CLEAN.** GitHub Forge automation & CI/CD orchestrator. |
| [packages/google-design](file:///C:/src/packages/google-design) | 1,131 | 6,392,702 | **CLEAN.** Canonical Material Design 3 HCT engine, `<aphrody-pet>` custom element ([element.ts](file:///C:/src/packages/google-design/src/pets/element.ts)), WebGPU/Canvas2D pet renderers, and Material Symbols catalog. |
| [packages/knowledge-engine](file:///C:/src/packages/knowledge-engine) | 16 | 187,125 | **CLEAN.** Safe-env secret scanner and session auditor. |
| [packages/pi-opencode](file:///C:/src/packages/pi-opencode) | 9 | 65,031 | **CLEAN.** Rust-core + TypeScript OpenCode provider. |
| [packages/wck](file:///C:/src/packages/wck) | 14 | 90,355 | **CLEAN.** Web Content & CWV 100/100 verifier. |
| [crates/bench](file:///C:/src/crates/bench) | 14 | 64,432 | **CLEAN.** `stack-bench` hardware & compiler benchmark crate. |
| [crates/corelib](file:///C:/src/crates/corelib) | 8 | 58,434 | **CLEAN.** Core shared Rust primitives. |
| [crates/depot](file:///C:/src/crates/depot) | 365 | 1,816,015 | **CLEAN.** `depot-core`, `depot-graph`, `depot-treesitter`, `depot-ingest`, `depot-cli`. |
| [crates/design-system](file:///C:/src/crates/design-system) | 99 | 1,170,583 | **CLEAN.** `aphrody-design-tokens`, `aphrody-design-icons`, `aphrody-design-identity`, `aphrody-design-sprite-sheet`, `aphrody-design-layout`, `aphrody-design-emit`. |
| [crates/gamescope-rs](file:///C:/src/crates/gamescope-rs) | 15 | 106,328 | **CLEAN.** `gamescope-core`, `gamescope-wgsl`, `gamescope-cli`. |
| [crates/ring3-agent](file:///C:/src/crates/ring3-agent) | 10 | 77,122 | **CLEAN.** Ring-3 desktop automation & telemetry agent. |
| [crates/rust-stack](file:///C:/src/crates/rust-stack) | 9 | 176,594 | **CLEAN.** Pure-Rust fullstack WebUI & component engine (`shadcn_rs.rs`). |
| [crates/unix](file:///C:/src/crates/unix) | 41 | 360,294 | **CLEAN.** `unix-distro` sovereign POSIX/WSL layer. |
| [crates/wayland](file:///C:/src/crates/wayland) | 695 | 7,738,887 | **CLEAN.** Wayland compositor & protocol stack. |
| [crates/xtask](file:///C:/src/crates/xtask) | 1 | 44,442 | **CLEAN.** Monorepo `xtk` build & governance runner. |
| [infra/*](file:///C:/src/infra) | 38 | 231,347 | **CLEAN.** Go deployment orchestrator (`infra/cmd/src-deploy`), C-shared library (`infra/cshared`), Bun FFI bridge (`infra/ffi-bridge`), internal packages (`infra/internal`), and WireGuard mesh (`infra/mesh-vn`). Note: `infra/gcloud`, `infra/generated`, `infra/gitlab`, `infra/mail`, and `infra/scripts` contain no source files (0 `.go`/`.ts`/`.rs` files). |

---

## 3. Part II: Audit of `C:\src\var\legacy` Repositories

### 3.1 Complete Inventory of `C:\src\var\legacy\yolo-rs\*` (40 Repositories)

| Legacy Repository | Cargo Crates | NPM Packages | Rust Files | Rust Bytes | TS/TSX Files | TS/TSX Bytes | Audit Classification & Canonical Target in `C:\src` |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| `yolo-rs\artcraft` | 40 | 63 | 3,261 | 10,012,087 | 1,659 | 6,609,251 | **PRODUCTION.** Node-graph AI/3D/Video creative studio (Storyteller/Artcraft). Target: `apps/aphrody-app` (WASM/WebGPU) & `crates/artcraft-*`. |
| `yolo-rs\cadcraft` | 17 | 0 | 977 | 11,690,802 | 0 | 0 | **PRODUCTION.** Parametric 3D CAD kernel & B-rep solver in pure Rust. Target: `apps/aphrody-app` / `crates/cadcraft-*`. |
| `yolo-rs\carbon` | 2 | 11 | 1 | 14,540 | 17 | 163,365 | **PARTIAL / ASSETS.** Contains `Mochi` and `OpenPets` sprite assets under `packages/web/assets/`. Code superseded by `packages/ai-os`. |
| `yolo-rs\craft-anything` | 21 | 0 | 580 | 12,137,658 | 0 | 0 | **PRODUCTION.** Universal format converter & procedural asset generator. Target: `apps/aphrody-app`. |
| `yolo-rs\craft-launcher` | 7 | 0 | 96 | 1,872,206 | 0 | 0 | **PRODUCTION.** Unified desktop launcher for the `*craft` creative suite. Target: `apps/aphrody-app`. |
| `yolo-rs\deckcraft` | 29 | 0 | 594 | 10,511,302 | 0 | 0 | **PRODUCTION.** Presentation & slide deck engine (`deckcraft-*`). Note: exclude 2 stub crates (`isobmff` 362 B, `matroska` 356 B). |
| `yolo-rs\designcraft` | 22 | 0 | 657 | 15,039,352 | 0 | 0 | **PRODUCTION.** UI/UX vector layout & token authoring studio. Target: `apps/aphrody-app`. |
| `yolo-rs\effectcraft` | 41 | 0 | 1,297 | 26,155,986 | 0 | 0 | **PRODUCTION.** Real-time motion graphics, compositing & puppet-warp VFX engine (`effectcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\figcraft` | 29 | 0 | 1,249 | 17,015,377 | 0 | 0 | **PRODUCTION.** Collaborative canvas & constraint layout engine (`figcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\filmcraft` | 56 | 0 | 1,221 | 21,423,430 | 0 | 0 | **PRODUCTION.** Non-linear video editor (NLE), timeline & GPU color grading (`filmcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\gcloud-learn` | 3 | 1 | 2 | 5,104 | 20 | 51,175 | **STUB / PROTOTYPE.** Contains 1.4 KB `gcloud_native_wasm` and 200-byte stub packages (`finops`, `larry-soul`, `rag`). Do not merge; superseded by `packages/ai-os` (`google_cloud` MCP). |
| `yolo-rs\gitingest` | 0 | 0 | 0 | 0 | 0 | 0 | **EMPTY.** 0 crates, 0 packages. Superseded by `crates/depot/crates/depot-ingest`. |
| `yolo-rs\google-bun` | 0 | 9 | 0 | 0 | 22 | 81,107 | **MERGED.** Google Workspace / Cloud Bun connectors. Already consolidated into `packages/ai-os` and `apps/aphrody/src/google`. |
| `yolo-rs\google-dream` | 0 | 1 | 0 | 0 | 5 | 11,240 | **PROTOTYPE.** Small 5-file experiment (11 KB). Do not copy. |
| `yolo-rs\gridcraft` | 18 | 0 | 651 | 11,161,408 | 0 | 0 | **PRODUCTION.** High-speed columnar spreadsheet & formula evaluation engine (`gridcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\lightcraft` | 36 | 0 | 1,036 | 19,712,196 | 0 | 0 | **PRODUCTION.** RAW photo developer, non-destructive catalog & spectral grading (`lightcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\pdfcraft` | 56 | 0 | 1,438 | 29,650,494 | 0 | 0 | **PRODUCTION.** PDF 2.0 parser, renderer, form filler & layout engine (`pdfcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\photocraft` | 38 | 0 | 2,465 | 45,790,777 | 0 | 0 | **PRODUCTION.** Layer-based raster image editor, brush engine & frequency separation (`photocraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\soundcraft` | 21 | 0 | 447 | 5,428,873 | 0 | 0 | **PRODUCTION.** Digital Audio Workstation (DAW), DSP graph & synth engine (`soundcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\vectorcraft` | 32 | 0 | 2,088 | 46,303,024 | 0 | 0 | **PRODUCTION.** Bezier path editor, boolean geometry & SVG/PDF illustrator (`vectorcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\wii-os` | 30 | 2 | 302 | 3,611,694 | 54 | 6,003,054 | **DOMAIN-SPECIFIC.** Wii/GameCube/Switch emulation & menu WebGPU shaders (`ruzu`, `rdynarmic`). Target: `apps/shenron`. |
| `yolo-rs\wordcraft` | 20 | 0 | 911 | 18,632,803 | 0 | 0 | **PRODUCTION.** Rich-text pagination, OpenType shaping & `.docx`/ODF processor (`wordcraft-*`). Target: `apps/aphrody-app`. |
| `yolo-rs\yolo` | 11 | 33 | 51 | 321,487 | 921 | 6,271,373 | **MERGED / SUPERSEDED.** Core CLI and Bun framework consolidated into `apps/yolo` and `packages/ai-os`. |
| `yolo-rs\yolo-ai` | 153 | 30 | 2,553 | 21,768,628 | 303 | 1,694,139 | **PRODUCTION / MERGED.** Local LLM inference (Candle/Mistral.rs/Llama), RAG, OpenPets, and `aphrody-identity`. Merged into `packages/ai-os`, `packages/ai-triad`, and `crates/design-system`. |
| `yolo-rs\yolo-backend` | 22 | 10 | 206 | 2,888,376 | 61 | 380,876 | **PRODUCTION.** Contains `aphrody-identity` (with `byron_r0.png` and `spritesheet.webp`), SQLite task queues, and auth. Exclude empty `aphrody-drive`. |
| `yolo-rs\yolo-bun` | 0 | 7 | 0 | 0 | 309 | 2,481,177 | **MERGED.** Consolidated into `packages/bun-parity`, `packages/bun-plugins`, and `packages/chromium-bun`. |
| `yolo-rs\yolo-cloudflare` | 1 | 1 | 1 | 5,881 | 7 | 42,599 | **MERGED.** Edge worker routing already in `apps/aphrody/edge/worker.ts`. |
| `yolo-rs\yolo-cross` | 46 | 16 | 364 | 4,465,600 | 226 | 1,747,375 | **PARTIAL.** Universal package converters (Nix, Flatpak, Winget, AUR) merged into `apps/aphrody/src/store/drivers/*` and `crates/unix`. Exclude 6 `*-wasm-*-hello` stub crates and 8 empty `packages/*` dirs. |
| `yolo-rs\yolo-engine` | 11 | 3 | 14 | 111,998 | 28 | 270,553 | **MERGED.** Game & archive streaming (`yolo-cpk-stream`), merged into `apps/rosegriffon` and `apps/shenron`. |
| `yolo-rs\yolo-hub` | 1 | 0 | 18 | 90,541 | 0 | 0 | **MERGED.** Package hub registry, merged into `apps/aphrody/src/store` and `apps/aphrody-app/crates/aphrody-core/src/store.rs`. |
| `yolo-rs\yolo-os` | 47 | 20 | 382 | 4,666,890 | 748 | 6,304,174 | **MERGED.** Ring-3 agent, POSIX/WSL distro, and Wayland bridges merged into `crates/unix`, `crates/ring3-agent`, and `packages/ai-os`. |
| `yolo-rs\yolo-plugins` | 0 | 13 | 0 | 0 | 65 | 510,585 | **MERGED.** Consolidated into `packages/bun-plugins`. |
| `yolo-rs\yolo-re` | 94 | 26 | 3,608 | 65,648,962 | 799 | 6,054,647 | **PRODUCTION (SHENRON/ROSEGRIFFON).** Reverse-engineering (`nie-*`, `iecode-*`, Ghidra/radare2/CPK/CRIWARE). Target: `apps/shenron` and `packages/ai-os` (`n2b_rea`). |
| `yolo-rs\yolo-stack` | 3 | 4 | 80 | 783,642 | 24 | 75,918 | **MERGED.** Consolidated into `crates/rust-stack` and `crates/bench`. |
| `yolo-rs\yolo-standards` | 4 | 5 | 10 | 56,299 | 84 | 331,141 | **MERGED.** Consolidated into `packages/wck` and `crates/xtask` (`archguard`). |
| `yolo-rs\yolo-ui` | 273 | 85 | 3,513 | 38,576,491 | 5,798 | 44,836,413 | **PRODUCTION / MIXED.** Contains `aphrody-m3-tokens`, `yolo-icons`, `yolo-gpu` (`sprite.rs`, `sprite_sheet.rs`), `craft-ui`, and Byron assets, alongside upstream Dioxus/Base-UI forks and 45 empty `packages/*` directories. |
| `yolo-rs\yolo-vendor` | 0 | 1 | 0 | 0 | 2 | 12,961 | **OBSOLETE.** Vendor wrapper script (12 KB). Do not copy. |
| `yolo-rs\yolo-vps` | 2 | 1 | 5 | 35,391 | 28 | 204,486 | **MERGED.** Consolidated into `infra/mesh-vn` and `packages/chromium-bun/src/search/cluster-3vps.ts`. |
| `yolo-rs\yolo-web` | 249 | 37 | 4,420 | 98,239,681 | 361 | 2,456,347 | **PRODUCTION.** Servo/Chromium-Bun web engine components & WebGPU renderers. Audited via `packages/chromium-bun` and `packages/bun-parity`. |
| `yolo-rs\yolo-zig` | 2 | 1 | 4 | 3,384 | 2 | 26,223 | **OBSOLETE.** Legacy Zig experiment (ARCH-016 enforces full-Rust Bun v1.4.4 without Zig glue). Do not copy. |

### 3.2 Complete Inventory of `C:\src\var\legacy\aphrody-labs\*`, `bunos`, and `f1p-apps`

| Legacy Repository | Cargo Crates | NPM Packages | Rust Files | Rust Bytes | TS/TSX Files | TS/TSX Bytes | Audit Classification & Canonical Target in `C:\src` |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| `aphrody-labs\aphrody-m3` | 7 | 84 | 75 | 878,895 | 3,991 | 23,054,344 | **PRODUCTION (CANONICAL DESIGN SOURCE).** Material Design 3 HCT tokens, `@aphrody/material-design-icons`, `m3-icons`, `m3-tokens`, `m3-theme`, `identity` (`pet.ts`, `atlas.ts`), `app-ui` (`pet-behavior.ts`). Consolidated into `crates/design-system` and `packages/google-design`. |
| `aphrody-labs\gemini-super-app` | 18 | 13 | 212 | 2,832,600 | 78 | 963,963 | **PRODUCTION.** Contains `crates/openpets-core`, `packages/openpets_gemini`, `apps/gemini_super_app/src/gemini_pet.html`, `vendor/openpets`, and `vendor/mochi-desktop`. Consolidated into `packages/google-design/src/assets/open-pets.ts` and `packages/ai-os`. |
| `aphrody-labs\yolo` | 131 | 80 | 1,784 | 19,095,111 | 335 | 2,002,088 | **PRODUCTION / MERGED.** Tauri/Desktop/Wayland host crates and CLI tools, consolidated into `apps/aphrody-app` and `crates/wayland`. |
| `aphrody-labs\yolo-ui` | 579 | 55 | 11,157 | 195,306,951 | 5,301 | 41,816,820 | **PRODUCTION SUPERSET.** Unified workspace combining all 14 `*craft` Rust engines, `locally-uncensored`, `spacedrive`, `aphrody-m3`, `aphrody-m3-tokens`, and Byron assets (`assets/aphrody/ai/byron`). |
| `bunos` | 741 | 204 | 18,564 | 282,933,806 | 11,966 | 81,913,896 | **MASTER LEGACY MONOREPO.** Contains 586 top-level crates in `bunos/crates/*`, 62 apps in `bunos/apps/*`, and 130 packages in `bunos/packages/*`. |
| `f1p-apps` | 0 | 0 | 0 | 0 | 0 | 0 | **EMPTY DIRECTORY.** `C:\src\var\legacy\f1p-apps` is currently an empty directory (0 files, 0 subdirectories; no background archive extraction process is running). All first-party apps (`*craft`, `spacedrive`, `lu`, `aphrody-web`, `craft-hub`) are already present inside `C:\src\var\legacy\bunos\apps\*` and `C:\src\var\legacy\aphrody-labs\yolo-ui\apps\*`. |

---

## 4. Part III: Canonical Mapping vs. Excluded Legacy Stubs

### 4.1 Production-Grade Legacy Crates & Packages to Merge/Maintain in `C:\src`

1. **Aphrody Design System, Identity & Pets (`crates/design-system` & `packages/google-design`):**
   - **Legacy Sources:**
     - `C:\src\var\legacy\bunos\crates\aphrody-identity` (350 KB Rust source + 900 KB brand/pet assets: `pets.rs`, `pixel.rs`, `logo.rs`, `codex.rs`, `design.rs`, `loader.rs`, `terminal_theme.rs`, `web.rs`)
     - `C:\src\var\legacy\bunos\crates\aphrody-sprite-sheet`
     - `C:\src\var\legacy\bunos\crates\aphrody-m3`, `aphrody-m3-tokens`, `aphrody-m3-reproduce`
     - `C:\src\var\legacy\bunos\packages\identity`, `m3-icons`, `m3-tokens`, `m3-theme`, `material-design-icons`, `app-ui`
   - **Canonical Destination in `C:\src`:**
     - `C:\src\crates\design-system\crates\aphrody-design-identity`
     - `C:\src\crates\design-system\crates\aphrody-design-sprite-sheet`
     - `C:\src\crates\design-system\crates\aphrody-design-tokens`
     - `C:\src\crates\design-system\crates\aphrody-design-icons`
     - `C:\src\crates\design-system\crates\aphrody-design-layout`
     - `C:\src\crates\design-system\crates\aphrody-design-emit`
     - `C:\src\packages\google-design`
   - **Actionable Delta:** `bunos/crates/aphrody-identity/src/{design.rs,loader.rs,logo.rs,pixel.rs,terminal_theme.rs}` and `src/cli/*` contain the SVG-to-pixel Oklch rasterizer and terminal theme generators that can be added to `crates/design-system/crates/aphrody-design-identity` if CLI regeneration of the sprite sheet from source SVGs is required.

2. **Creative Suite Rust/WASM/WebGPU Engines (`apps/aphrody-app`):**
   - **Legacy Sources (`yolo-rs/*` and `bunos/crates/*`):**
     - `photocraft` (38 crates, 45.8 MB Rust): `photocraft-core`, `photocraft-algo`, `photocraft-engine`, `photocraft-gpu`, `photocraft-wasm`
     - `vectorcraft` (32 crates, 46.3 MB Rust): `vectorcraft-core`, `vectorcraft-doc`, `vectorcraft-engine`, `vectorcraft-tools`, `vectorcraft-wasm`
     - `pdfcraft` (56 crates, 29.6 MB Rust): `pdfcraft-core`, `pdfcraft-render`, `pdfcraft-forms`, `pdfcraft-wasm`
     - `effectcraft` (41 crates, 26.1 MB Rust): `effectcraft-core`, `effectcraft-effects`, `effectcraft-engine`, `effectcraft-wasm`
     - `filmcraft` (56 crates, 21.4 MB Rust): `filmcraft-core`, `filmcraft-timeline`, `filmcraft-gpu`, `filmcraft-wasm`
     - `lightcraft` (36 crates, 19.7 MB Rust): `lightcraft-core`, `lightcraft-raw`, `lightcraft-catalog`, `lightcraft-wasm`
     - `wordcraft` (20 crates, 18.6 MB Rust): `wordcraft-core`, `wordcraft-layout`, `wordcraft-docx`, `wordcraft-wasm`
     - `figcraft` (29 crates, 17.0 MB Rust): `figcraft-core`, `figcraft-canvas`, `figcraft-wasm`
     - `designcraft` (22 crates, 15.0 MB Rust): `designcraft-core`, `designcraft-wasm`
     - `craft-anything` (21 crates, 12.1 MB Rust) & `craft-ui` (`bunos/crates/craft-ui`)
     - `cadcraft` (17 crates, 11.7 MB Rust): `cadcraft-core`, `cadcraft-brep`, `cadcraft-wasm`
     - `gridcraft` (18 crates, 11.1 MB Rust): `gridcraft-core`, `gridcraft-formula`, `gridcraft-wasm`
     - `deckcraft` (29 crates, 10.5 MB Rust): `deckcraft-core`, `deckcraft-slides`, `deckcraft-wasm`
     - `artcraft` (40 crates, 10.0 MB Rust): `artcraft-core`, `artcraft-node-graph`, `artcraft-wasm`
     - `soundcraft` (21 crates, 5.4 MB Rust): `soundcraft-core`, `soundcraft-dsp`, `soundcraft-wasm`
   - **Canonical Destination in `C:\src`:**
     - `C:\src\apps\aphrody-app` (compiled to `wasm32-unknown-unknown` / WebGPU via `aphrody-wasm` and native host via `aphrody-host`, never mocked in TypeScript).

3. **File Management & Uncensored Local AI Studio (`bunos/apps/spacedrive` & `bunos/apps/lu`):**
   - **Legacy Sources:**
     - `C:\src\var\legacy\bunos\apps\spacedrive` (Virtual Distributed File System, content-addressed Blake3 indexer)
     - `C:\src\var\legacy\bunos\apps\lu` and `C:\src\var\legacy\aphrody-labs\yolo-ui\apps\locally-uncensored` (Local LLM studio with repetition-stop, GGUF/BitNet loader, multi-provider gateway)
   - **Canonical Destination in `C:\src`:**
     - AI runtime & providers: `C:\src\packages\ai-os`, `C:\src\packages\ai-triad`, `C:\src\packages\pi-opencode/src/lu-provider.ts` (already integrated).
     - VFS / Content-addressed storage: `C:\src\apps\aphrody-app\crates\aphrody-wasm\src\opfs.rs` and `C:\src\crates\depot`.

4. **Reverse Engineering & Game Runtime (`yolo-rs/yolo-re` & `yolo-rs/wii-os`):**
   - **Legacy Sources:**
     - `C:\src\var\legacy\yolo-rs\yolo-re` (94 crates, 65.6 MB Rust: `aphrody-nie-*`, `iecode-*`)
     - `C:\src\var\legacy\yolo-rs\wii-os` (30 crates, 3.6 MB Rust: `ruzu`, `rdynarmic`, `menu-render-webgpu`)
   - **Canonical Destination in `C:\src`:**
     - `C:\src\apps\shenron` and `C:\src\apps\rosegriffon`.

### 4.2 Legacy Stubs, Placeholders & Duplicates That Must NOT Be Copied into `C:\src`

The following legacy crates and packages in `bunos` and `yolo-rs` are verified stubs, empty scaffolds, or deprecated duplicates and must never be copied into `C:\src`:

1. **Zero-Byte / Empty Rust Crates:**
   - `bunos/crates/aphrody-drive` & `yolo-backend/crates/aphrody-drive` (0 `.rs` files, 0 bytes)
   - `bunos/crates/apkeep` (0 `.rs` files, 0 bytes)
   - `bunos/crates/capture_harness` (0 `.rs` files, 0 bytes)
   - `wii-os/crates/common` (0 `.rs` files, 0 bytes)
   - `yolo-ui/crates/yolo-stack-dioxus` & `yolo-ui/crates/yolo-stack-leptos` (0 `.rs` files, 0 bytes)

2. **Toy / "Hello World" WASM & Stub Crates (< 2 KB):**
   - `aphrody-wasm-bindgen-hello` (474 B), `aphrody-wasm-raw` (766 B), `aphrody-wasm-wasi-hello` (466 B) in `bunos`, `yolo-ai`, and `yolo-cross`
   - `yolo-wasm-bindgen-hello` (495 B), `yolo-wasm-raw` (802 B), `yolo-wasm-wasi-hello` (481 B) in `yolo-cross`
   - `deckcraft/crates/isobmff` (362 B) and `deckcraft/crates/matroska` (356 B)
   - `gcloud-learn/crates/gcloud_native_wasm` (1,419 B)
   - `yolo-standards/crates/yolo-coreutils-wasm` (959 B)
   - `yolo-ai/crates/aphrody-llama-sys` (1,822 B stub FFI wrapper)
   - `yolo-ai/crates/yolo-runtime` & `yolo-os/crates/yolo-runtime` (1,852 B)
   - `yolo-backend/crates/yolo-backend-core` (1,856 B)

3. **Zero-Byte / Empty TypeScript Packages:**
   - `bunos/packages/{gemma-wasm,h3blast,iecode-cpp,iecode-docs,iecode-scripts,nie-blender,niepy,yolo-python}` (0 `.ts` files)
   - `yolo-cross/packages/{aur,bun,cargo,debian,ds-dotnet,flatpak,signatures,winget}` (0 `.ts` files)
   - `yolo-ui/packages/*` (45 empty Dioxus mirror directories with 0 `.ts` files: `asset-resolver`, `autofmt`, `cli-opt`, `config-macro`, `const-serialize`, `core-macro`, `core-types`, `devtools`, `devtools-types`, `document`, `dx-env`, `dx-wire-format`, `fullstack*`, `generational-box`, `hooks`, `html*`, `liveview`, `manganis*`, `native*`, `router*`, `rsx*`, `signals`, `ssr`, `stores*`, `subsecond*`, `vdom*`, `wasm-split*`, `yolo-cosmic`, `yolo-egui`, `yolo-gpui`, `yolo-gtk`, `yolo-iced`, `yolo-qt`, `yolo-tauri`)
   - `gcloud-learn/packages/{browser-studio,core,finops,larry-soul,rag}` (199–978 B toy placeholders)
   - All `@aphrody/bun-windows-api-ms-win-*` and `@aphrody/bun-windows-ext-ms-win-*` stub packages (targeted for deprecation by [registry-cleanup.ts](file:///C:/src/packages/env-kit/scripts/registry-cleanup.ts)).

---

## 5. Part IV: Exact Locations of Aphrody Pets & M3 Icons

### 5.1 Aphrody Pets (Byron Love, Gemini Pet Atlas V2, OpenPets, Mochi Desktop)

1. **Byron Love (8x11 Oklch Sprite Sheet, Palette & Source Vectors):**
   - **Canonical `C:\src` Locations (Already Integrated):**
     - `C:\src\crates\design-system\crates\aphrody-design-identity\assets\aphrody\sprites\spritesheet.png` (1,993,069 B — 1536x2288 lossless PNG, 8 columns x 11 rows of 192x208 cells)
     - `C:\src\crates\design-system\crates\aphrody-design-identity\assets\aphrody\sprites\spritesheet.webp` (1,510,454 B — 1536x2288 lossless WebP)
     - `C:\src\crates\design-system\crates\aphrody-design-identity\assets\aphrody\animations.json` (101,746 B — full timed tracks + 16-way `directional-pose-set` gaze ring)
     - `C:\src\crates\design-system\crates\aphrody-design-identity\assets\aphrody\pet.json` (247 B — Codex-compatible manifest)
     - `C:\src\crates\design-system\crates\aphrody-design-identity\src\pets.rs` (42,841 B — Rust state machine & gaze arithmetic)
     - `C:\src\packages\google-design\src\pets\pet.ts` (Oklch/HCT measured palette: `seed: "#8c6c88"`, `hair: "#dcd894"`, `skin: "#fce0b4"`, `tunic: "#f4f4f4"`, `socks: "#8c6c88"`)
     - `C:\src\packages\google-design\src\pets\element.ts` (`<aphrody-pet>` custom element), `webgpu.ts`, `canvas2d.ts`, `runtime.ts`
     - `C:\src\apps\yolo\dist\assets\pets\sprites\spritesheet.webp` (served in `apps/yolo`)
   - **Legacy Source Locations:**
     - `C:\src\var\legacy\yolo-rs\yolo-backend\crates\aphrody-identity\assets\logo\source\byron_r0.png` (87,969 B)
     - `C:\src\var\legacy\yolo-rs\yolo-backend\crates\aphrody-identity\assets\logo\source\byron_r0_fullbody.png` (113,988 B)
     - `C:\src\var\legacy\yolo-rs\yolo-backend\crates\aphrody-identity\assets\aphrody\sprites\spritesheet.png` (1,993,069 B)
     - `C:\src\var\legacy\yolo-rs\yolo-backend\crates\aphrody-identity\assets\aphrody\sprites\spritesheet.webp` (1,510,454 B)
     - `C:\src\var\legacy\bunos\assets\aphrody\ai\byron\byron_icon.svg` (21,948 B)
     - `C:\src\var\legacy\aphrody-labs\yolo-ui\assets\aphrody\ai\byron\{byron_icon.svg,byron_icon_128.png,byron_icon_32.png}`
     - `C:\src\var\legacy\bunos\crates\aphrody-identity\src\pixel.rs` (49,457 B — Oklch sprite sheet generator & quantifier)
     - `C:\src\var\legacy\bunos\crates\aphrody-sprite-sheet`

2. **Gemini Pet (Atlas SVG V2 1536x2288 & Interactive Pet):**
   - **Legacy Source Locations:**
     - `C:\src\var\legacy\aphrody-labs\gemini-super-app\apps\gemini_super_app\src\gemini_pet.html` (7,340 B)
     - `C:\src\var\legacy\aphrody-labs\gemini-super-app\packages\openpets_gemini` (`src/openpets_gemini.test.ts`, 4,992 B)
     - `C:\src\var\legacy\bunos\packages\identity\src\{pet.ts,atlas.ts,AphrodyPet.tsx}`
     - `C:\src\var\legacy\bunos\packages\app-ui\src\pet-behavior.ts` (1,994 B)

3. **OpenPets & Mochi Desktop:**
   - **Canonical `C:\src` Location:**
     - `C:\src\packages\google-design\src\assets\open-pets.ts`
   - **Legacy Source Locations:**
     - `C:\src\var\legacy\aphrody-labs\gemini-super-app\crates\openpets-core`
     - `C:\src\var\legacy\aphrody-labs\gemini-super-app\vendor\openpets`
     - `C:\src\var\legacy\aphrody-labs\gemini-super-app\vendor\mochi-desktop`
     - `C:\src\var\legacy\yolo-rs\carbon\packages\web\assets\openpets\{default-pet-spritesheet.png,openpets-logo.webp,openpets.webp}`
     - `C:\src\var\legacy\yolo-rs\carbon\packages\web\assets\mochi\{coffee,eat,master,mochi_exe,pocket_grab}\*.png` (also duplicated in `yolo-rs\yolo-ai\packages\carbon\packages\web\assets\mochi\*`)

### 5.2 Aphrody M3 Icons, Tokens & Themes

1. **`@aphrody/material-design-icons`:**
   - **Canonical `C:\src` Locations:**
     - `C:\src\packages\google-design\upstream\material-design-icons`
     - `C:\src\packages\google-design\src\symbols\catalog.ts`
     - `C:\src\crates\design-system\crates\aphrody-design-icons` (`sources/{chromium,cosmic,fluent,material-symbols}`, `src/{bundle.rs,chromium.rs,color.rs,favicon.rs,ir.rs,lock.rs,optimize.rs,search.rs,svg_import.rs}`)
   - **Legacy Source Locations:**
     - `C:\src\var\legacy\aphrody-labs\aphrody-m3\packages\material-design-icons` (`src/index.ts`, `scripts/{export-theme.ts,svg-to-ico.ts,sync-catalogue.ts}`)
     - `C:\src\var\legacy\aphrody-labs\aphrody-m3\forks\material-design-icons`
     - `C:\src\var\legacy\bunos\packages\material-design-icons`

2. **`m3-icons` (`@aphrody/m3-icons`):**
   - **Canonical `C:\src` Locations:**
     - `C:\src\packages\google-design\src\symbols\catalog.ts` (and `m3:icon/*` virtual module plugin in [apps/yolo/build.ts](file:///C:/src/apps/yolo/build.ts))
     - `C:\src\apps\aphrody\src\design\material-tokens.ts` (`MATERIAL_SYMBOLS`, `renderMaterialSymbol`)
   - **Legacy Source Locations:**
     - `C:\src\var\legacy\aphrody-labs\aphrody-m3\packages\m3-icons`
     - `C:\src\var\legacy\aphrody-labs\yolo-ui\packages\m3-icons`
     - `C:\src\var\legacy\bunos\packages\m3-icons`

3. **`m3-tokens` (`@aphrody/m3-tokens` & `aphrody-m3-tokens`):**
   - **Canonical `C:\src` Locations:**
     - `C:\src\crates\design-system\crates\aphrody-design-tokens` (34 Rust modules: `cam16.rs`, `hct.rs`, `quantize_wu.rs`, `quantize_wsmeans.rs`, `score.rs`, `scheme.rs`, `dynamic.rs`, `contrast.rs`, `spaceui.rs`, `sheets.rs`, plus Google Compose M3 & Material Web golden fixtures)
     - `C:\src\packages\google-design\src\color-utils\hct.ts`
     - `C:\src\packages\google-design\assets\brand\{m3-tokens.css,m3-tokens.json}`
   - **Legacy Source Locations:**
     - `C:\src\var\legacy\bunos\packages\m3-tokens` (`src/wasm.ts`, `src/platform-contract.ts`, `test/*`)
     - `C:\src\var\legacy\bunos\crates\aphrody-m3-tokens`
     - `C:\src\var\legacy\aphrody-labs\aphrody-m3\packages\m3-tokens`

4. **`m3-theme` (`@aphrody/m3-theme`):**
   - **Canonical `C:\src` Locations:**
     - `C:\src\crates\design-system\crates\aphrody-design-emit` (emits CSS, Tailwind, Compose, SwiftUI, WinUI, GTK, Cosmic, Dioxus, GPUI, Chrome, Omarchy)
     - `C:\src\packages\google-design\src\theme-builder\exporter.ts`
   - **Legacy Source Locations:**
     - `C:\src\var\legacy\bunos\packages\m3-theme` (`spaceui.css`, `tailwind.css`, `tokens.css`, `src/{brand.ts,catalog.ts,index.ts,react.tsx,tauri.tsx}`)
     - `C:\src\var\legacy\aphrody-labs\aphrody-m3\packages\m3-theme`
     - `C:\src\var\legacy\aphrody-labs\yolo-ui\packages\m3-theme`
