# Codebase Digest: apps

- Files analyzed: 217
- Total lines: 8632
- Total size: 589.7 KB
- Git branch: `main`
- Git HEAD commit: `272c544f (docker: ship vendor icons, wallpaper thumbs and crates/game/assets to the bun-build stage (aphrody, r2-site, api-gateway images))`
- Digest mode: `AST-Smart Outline`

## Directory Structure

```text
apps/
├── DEPS.rules (2 lines, 91 B, ~23 tokens)
├── aphrody/
│   ├── DESIGN.md (50 lines, 4.0 KB, ~1.1k tokens)
│   ├── PRD.md (77 lines, 7.1 KB, ~2.1k tokens)
│   ├── README.md (90 lines, 6.3 KB, ~1.7k tokens)
│   ├── build.ts (17 lines, 538 B, ~173 tokens)
│   ├── edge/
│   │   └── worker.ts (5 lines, 166 B, ~51 tokens)
│   ├── package.json (18 lines, 741 B, ~244 tokens)
│   ├── pm.ts (5 lines, 163 B, ~49 tokens)
│   ├── server.ts (24 lines, 887 B, ~262 tokens)
│   ├── src/
│   │   ├── benchmark/
│   │   │   └── stack-picker.ts (15 lines, 692 B, ~172 tokens)
│   │   ├── client/
│   │   │   ├── boot.ts (18 lines, 861 B, ~251 tokens)
│   │   │   └── play.ts (6 lines, 239 B, ~70 tokens)
│   │   ├── data/
│   │   │   ├── games.json (625 lines, 66.5 KB, ~17.2k tokens)
│   │   │   └── suggestions.ts (3 lines, 139 B, ~38 tokens)
│   │   ├── design/
│   │   │   └── material-tokens.ts (10 lines, 529 B, ~141 tokens)
│   │   ├── globals.d.ts (2 lines, 66 B, ~19 tokens)
│   │   ├── google/
│   │   │   ├── config.ts (9 lines, 476 B, ~127 tokens)
│   │   │   └── relay.ts (4 lines, 168 B, ~46 tokens)
│   │   ├── holding/
│   │   │   └── page.ts (21 lines, 991 B, ~287 tokens)
│   │   ├── immersive/
│   │   │   ├── build.ts (4 lines, 195 B, ~56 tokens)
│   │   │   ├── home-entry.ts (3 lines, 83 B, ~27 tokens)
│   │   │   ├── motion.ts (7 lines, 225 B, ~72 tokens)
│   │   │   ├── nav.ts (5 lines, 263 B, ~84 tokens)
│   │   │   ├── play-launcher.ts (4 lines, 129 B, ~40 tokens)
│   │   │   ├── shader.ts (1 lines, 36 B, ~11 tokens)
│   │   │   ├── sound.ts (5 lines, 162 B, ~50 tokens)
│   │   │   ├── stage.ts (11 lines, 458 B, ~128 tokens)
│   │   │   └── tokens.macro.ts (6 lines, 217 B, ~61 tokens)
│   │   ├── m3.css (1 lines, 36 B, ~11 tokens)
│   │   ├── os/
│   │   │   ├── build.ts (6 lines, 151 B, ~47 tokens)
│   │   │   ├── client/
│   │   │   │   ├── apps.ts (18 lines, 680 B, ~208 tokens)
│   │   │   │   ├── gamescope.ts (11 lines, 510 B, ~161 tokens)
│   │   │   │   ├── i18n.ts (1 lines, 35 B, ~11 tokens)
│   │   │   │   ├── lib.ts (6 lines, 285 B, ~91 tokens)
│   │   │   │   ├── os.ts (7 lines, 197 B, ~68 tokens)
│   │   │   │   ├── wgsl.d.ts (1 lines, 34 B, ~10 tokens)
│   │   │   │   └── wm.ts (5 lines, 143 B, ~44 tokens)
│   │   │   ├── page.ts (5 lines, 266 B, ~81 tokens)
│   │   │   ├── server.ts (4 lines, 132 B, ~39 tokens)
│   │   │   ├── vendor.lock.json (34 lines, 2.0 KB, ~585 tokens)
│   │   │   └── vendor.ts (6 lines, 255 B, ~75 tokens)
│   │   ├── play/
│   │   │   └── page.ts (4 lines, 207 B, ~64 tokens)
│   │   ├── runtime/
│   │   │   ├── assets.ts (13 lines, 494 B, ~140 tokens)
│   │   │   └── hash.ts (12 lines, 431 B, ~122 tokens)
│   │   ├── seo/
│   │   │   ├── documents.ts (22 lines, 1.1 KB, ~322 tokens)
│   │   │   ├── home-css.ts (1 lines, 35 B, ~11 tokens)
│   │   │   ├── home.ts (11 lines, 409 B, ~124 tokens)
│   │   │   ├── html.ts (21 lines, 883 B, ~246 tokens)
│   │   │   ├── page-css.ts (2 lines, 86 B, ~25 tokens)
│   │   │   ├── schema-graph.ts (8 lines, 348 B, ~94 tokens)
│   │   │   ├── site.ts (14 lines, 724 B, ~197 tokens)
│   │   │   └── webmcp-tools.ts (2 lines, 67 B, ~19 tokens)
│   │   ├── store/
│   │   │   ├── database.ts (13 lines, 467 B, ~134 tokens)
│   │   │   ├── drivers/
│   │   │   │   ├── aur.ts (3 lines, 100 B, ~29 tokens)
│   │   │   │   ├── bun.ts (3 lines, 100 B, ~29 tokens)
│   │   │   │   ├── flatpak.ts (3 lines, 104 B, ~29 tokens)
│   │   │   │   ├── nix.ts (3 lines, 100 B, ~29 tokens)
│   │   │   │   ├── playstore.ts (3 lines, 106 B, ~29 tokens)
│   │   │   │   ├── wasm-hub.ts (3 lines, 106 B, ~29 tokens)
│   │   │   │   └── winget.ts (3 lines, 103 B, ~29 tokens)
│   │   │   ├── types.ts (4 lines, 134 B, ~39 tokens)
│   │   │   └── universal-manager.ts (16 lines, 539 B, ~155 tokens)
│   │   ├── style.css (1 lines, 36 B, ~11 tokens)
│   │   ├── suite/
│   │   │   └── wasm-kernel.ts (7 lines, 410 B, ~109 tokens)
│   │   └── types.d.ts (3 lines, 95 B, ~27 tokens)
│   ├── tests/
│   │   ├── aphrody.test.ts (10 lines, 293 B, ~91 tokens)
│   │   ├── immersive.test.ts (6 lines, 195 B, ~63 tokens)
│   │   ├── play.test.ts (3 lines, 81 B, ~26 tokens)
│   │   └── seo.test.ts (15 lines, 469 B, ~150 tokens)
│   ├── tsconfig.json (14 lines, 523 B, ~168 tokens)
│   └── wrangler.toml (35 lines, 1.1 KB, ~314 tokens)
├── aphrody-app/
│   ├── Cargo.toml (30 lines, 604 B, ~189 tokens)
│   ├── README.md (29 lines, 1.9 KB, ~551 tokens)
│   ├── crates/
│   │   ├── aphrody-android/
│   │   │   ├── Cargo.toml (13 lines, 273 B, ~74 tokens)
│   │   │   └── src/
│   │   │       └── lib.rs (15 lines, 561 B, ~156 tokens)
│   │   ├── aphrody-core/
│   │   │   ├── Cargo.toml (11 lines, 309 B, ~80 tokens)
│   │   │   └── src/
│   │   │       ├── fluid.rs (72 lines, 3.5 KB, ~1.1k tokens)
│   │   │       ├── layout.rs (26 lines, 1.2 KB, ~399 tokens)
│   │   │       ├── lib.rs (11 lines, 274 B, ~87 tokens)
│   │   │       ├── state.rs (17 lines, 646 B, ~193 tokens)
│   │   │       ├── store.rs (93 lines, 5.0 KB, ~1.6k tokens)
│   │   │       ├── wayland.rs (30 lines, 1.6 KB, ~480 tokens)
│   │   │       ├── webmcp.rs (37 lines, 1.9 KB, ~620 tokens)
│   │   │       ├── wire.rs (22 lines, 1.2 KB, ~373 tokens)
│   │   │       └── wm.rs (38 lines, 1.9 KB, ~571 tokens)
│   │   ├── aphrody-host/
│   │   │   ├── Cargo.toml (16 lines, 360 B, ~101 tokens)
│   │   │   └── src/
│   │   │       ├── dist.rs (21 lines, 940 B, ~287 tokens)
│   │   │       ├── http.rs (39 lines, 1.8 KB, ~548 tokens)
│   │   │       ├── main.rs (14 lines, 357 B, ~112 tokens)
│   │   │       └── tui.rs (11 lines, 456 B, ~122 tokens)
│   │   └── aphrody-wasm/
│   │       ├── Cargo.toml (83 lines, 1.7 KB, ~467 tokens)
│   │       ├── shaders/
│   │       │   └── mica.wgsl (116 lines, 4.5 KB, ~1.5k tokens)
│   │       └── src/
│   │           ├── gpu.rs (10 lines, 381 B, ~112 tokens)
│   │           ├── lib.rs (5 lines, 107 B, ~37 tokens)
│   │           ├── opfs.rs (24 lines, 1.0 KB, ~328 tokens)
│   │           ├── scene.rs (10 lines, 408 B, ~121 tokens)
│   │           └── web.rs (36 lines, 1.3 KB, ~402 tokens)
│   ├── packaging/
│   │   ├── alpine/
│   │   │   └── APKBUILD (24 lines, 486 B, ~153 tokens)
│   │   ├── arch/
│   │   │   └── PKGBUILD (21 lines, 605 B, ~185 tokens)
│   │   ├── nix/
│   │   │   └── default.nix (16 lines, 471 B, ~133 tokens)
│   │   └── wayland/
│   │       └── aphrody-app.desktop (7 lines, 194 B, ~53 tokens)
│   ├── tools/
│   │   └── rustc_argfile.rs (3 lines, 70 B, ~23 tokens)
│   └── web/
│       └── index.html (1 lines, 36 B, ~11 tokens)
├── l2l/
│   └── PLAN.md (80 lines, 11.2 KB, ~2.6k tokens)
├── nt/
│   ├── CLAUDE.md (11 lines, 1.3 KB, ~352 tokens)
│   ├── Directory.Build.props (20 lines, 1.2 KB, ~290 tokens)
│   ├── Directory.Packages.props (11 lines, 535 B, ~135 tokens)
│   ├── Nt.slnx (8 lines, 216 B, ~70 tokens)
│   ├── README.md (37 lines, 2.6 KB, ~676 tokens)
│   ├── base/
│   │   └── shell/
│   │       └── explorer/
│   │           ├── Nt.App.csproj (61 lines, 4.1 KB, ~1.0k tokens)
│   │           ├── Package.appxmanifest (40 lines, 1.5 KB, ~412 tokens)
│   │           ├── Program.cs (71 lines, 2.9 KB, ~717 tokens)
│   │           └── app.manifest (10 lines, 516 B, ~150 tokens)
│   ├── bunfig.toml (7 lines, 135 B, ~41 tokens)
│   ├── docs/
│   │   ├── bun/
│   │   │   ├── dotnet-native.md (135 lines, 19.5 KB, ~5.4k tokens)
│   │   │   └── feature-graph.md (390 lines, 120.2 KB, ~22.6k tokens)
│   │   ├── interop/
│   │   │   ├── bun-lowlevel.md (93 lines, 17.1 KB, ~5.0k tokens)
│   │   │   ├── dotnet-lowlevel.md (61 lines, 12.0 KB, ~3.2k tokens)
│   │   │   ├── mapping.md (68 lines, 28.5 KB, ~6.8k tokens)
│   │   │   └── node-api-dotnet.md (100 lines, 20.7 KB, ~5.6k tokens)
│   │   ├── msindex/
│   │   │   ├── README.md (76 lines, 3.4 KB, ~902 tokens)
│   │   │   └── lock.json (530 lines, 26.3 KB, ~7.5k tokens)
│   │   ├── plan/
│   │   │   └── architecture-microsoft.md (78 lines, 5.7 KB, ~1.6k tokens)
│   │   └── research/
│   │       ├── bench/
│   │       │   ├── dotnet-ffi-linux-x64.ci.json (36 lines, 1006 B, ~365 tokens)
│   │       │   ├── dotnet-ffi-win-x64.ci.json (36 lines, 1.0 KB, ~371 tokens)
│   │       │   └── dotnet-ffi-win-x64.local.json (36 lines, 1.0 KB, ~374 tokens)
│   │       ├── claude-to-nt-stack.md (56 lines, 9.3 KB, ~2.4k tokens)
│   │       ├── facts.json (588 lines, 17.5 KB, ~6.4k tokens)
│   │       ├── rust-in-windows.md (56 lines, 7.8 KB, ~1.9k tokens)
│   │       ├── shell-replacement.md (46 lines, 5.7 KB, ~1.6k tokens)
│   │       └── windows-nt-map.json (2203 lines, 69.7 KB, ~24.1k tokens)
│   ├── global.json (6 lines, 176 B, ~60 tokens)
│   ├── justfile (96 lines, 3.9 KB, ~1.2k tokens)
│   ├── modules/
│   │   └── web/
│   │       ├── nt.html (1 lines, 35 B, ~11 tokens)
│   │       ├── nt.ts (22 lines, 816 B, ~247 tokens)
│   │       ├── ntsys-format.ts (2 lines, 59 B, ~19 tokens)
│   │       ├── package.json (4 lines, 111 B, ~39 tokens)
│   │       ├── scene.wgsl (107 lines, 3.9 KB, ~1.4k tokens)
│   │       └── wgsl.d.ts (1 lines, 34 B, ~10 tokens)
│   ├── nuget.config (14 lines, 577 B, ~162 tokens)
│   ├── package.json (13 lines, 419 B, ~150 tokens)
│   ├── sdk/
│   │   ├── dotnet/
│   │   │   └── Nt.Interop/
│   │   │       ├── Exports.cs (215 lines, 7.8 KB, ~2.0k tokens)
│   │   │       ├── Ffi.cs (26 lines, 1.1 KB, ~300 tokens)
│   │   │       ├── Nt.Interop.csproj (22 lines, 1.6 KB, ~399 tokens)
│   │   │       └── Types.cs (63 lines, 1.7 KB, ~453 tokens)
│   │   ├── rust/
│   │   │   ├── Cargo.toml (14 lines, 717 B, ~195 tokens)
│   │   │   ├── brand/
│   │   │   │   ├── Cargo.toml (10 lines, 262 B, ~79 tokens)
│   │   │   │   └── src/
│   │   │   │       └── lib.rs (5 lines, 163 B, ~51 tokens)
│   │   │   ├── rust-toolchain.toml (6 lines, 292 B, ~88 tokens)
│   │   │   └── winui-hello/
│   │   │       ├── Cargo.toml (9 lines, 277 B, ~77 tokens)
│   │   │       └── src/
│   │   │           └── main.rs (8 lines, 377 B, ~115 tokens)
│   │   ├── tools/
│   │   │   ├── bun-graph.ts (18 lines, 526 B, ~159 tokens)
│   │   │   ├── dotnet-ffi/
│   │   │   │   ├── bench.ts (9 lines, 330 B, ~100 tokens)
│   │   │   │   ├── checks.ts (5 lines, 129 B, ~39 tokens)
│   │   │   │   ├── ecma335.ts (54 lines, 2.4 KB, ~735 tokens)
│   │   │   │   ├── gen.ts (14 lines, 495 B, ~155 tokens)
│   │   │   │   ├── hosted.test.ts (5 lines, 122 B, ~39 tokens)
│   │   │   │   ├── hostfxr.ts (11 lines, 367 B, ~109 tokens)
│   │   │   │   ├── interop.ts (6 lines, 154 B, ~48 tokens)
│   │   │   │   ├── model.ts (13 lines, 400 B, ~126 tokens)
│   │   │   │   └── native.test.ts (6 lines, 143 B, ~46 tokens)
│   │   │   ├── fetch-tools.ts (4 lines, 97 B, ~29 tokens)
│   │   │   ├── gpuprobe/
│   │   │   │   ├── CMakeLists.txt (31 lines, 1.7 KB, ~467 tokens)
│   │   │   │   ├── CMakePresets.json (32 lines, 919 B, ~309 tokens)
│   │   │   │   ├── probe.cpp (7 lines, 278 B, ~88 tokens)
│   │   │   │   ├── vcpkg-configuration.json (8 lines, 397 B, ~126 tokens)
│   │   │   │   └── vcpkg.json (7 lines, 372 B, ~122 tokens)
│   │   │   ├── host/
│   │   │   │   ├── desktop-svg.ts (9 lines, 317 B, ~99 tokens)
│   │   │   │   ├── ntmap.ts (5 lines, 118 B, ~40 tokens)
│   │   │   │   ├── ntsys.ts (10 lines, 471 B, ~139 tokens)
│   │   │   │   ├── pe-icon.ts (6 lines, 196 B, ~58 tokens)
│   │   │   │   ├── pe.ts (9 lines, 409 B, ~122 tokens)
│   │   │   │   ├── server.ts (11 lines, 296 B, ~100 tokens)
│   │   │   │   └── winindex.ts (8 lines, 293 B, ~84 tokens)
│   │   │   ├── msindex/
│   │   │   │   ├── crt.ts (7 lines, 180 B, ~58 tokens)
│   │   │   │   ├── fsx.ts (4 lines, 150 B, ~46 tokens)
│   │   │   │   ├── graph.ts (16 lines, 565 B, ~183 tokens)
│   │   │   │   ├── idl.ts (5 lines, 138 B, ~42 tokens)
│   │   │   │   ├── main.ts (16 lines, 387 B, ~127 tokens)
│   │   │   │   ├── system.ts (12 lines, 601 B, ~178 tokens)
│   │   │   │   └── winmd.ts (8 lines, 336 B, ~99 tokens)
│   │   │   ├── ntport/
│   │   │   │   ├── cmake.ts (7 lines, 260 B, ~80 tokens)
│   │   │   │   └── parse-worker.ts (5 lines, 183 B, ~55 tokens)
│   │   │   └── vsdev.ts (2 lines, 55 B, ~17 tokens)
│   │   └── vcpkg/
│   │       └── ports/
│   │           ├── directx-headers/
│   │           │   ├── portfile.cmake (22 lines, 920 B, ~205 tokens)
│   │           │   ├── usage (4 lines, 170 B, ~38 tokens)
│   │           │   └── vcpkg.json (13 lines, 683 B, ~222 tokens)
│   │           └── wil/
│   │               ├── portfile.cmake (24 lines, 1.0 KB, ~239 tokens)
│   │               └── vcpkg.json (12 lines, 558 B, ~183 tokens)
│   └── tsconfig.json (14 lines, 472 B, ~152 tokens)
├── r2-site/
│   ├── package.json (10 lines, 363 B, ~125 tokens)
│   ├── src/
│   │   ├── app.test.ts (3 lines, 70 B, ~22 tokens)
│   │   ├── app.ts (8 lines, 344 B, ~100 tokens)
│   │   ├── entry.cf.ts (5 lines, 179 B, ~56 tokens)
│   │   ├── entry.vercel.ts (3 lines, 85 B, ~26 tokens)
│   │   └── entry.vps.ts (3 lines, 85 B, ~26 tokens)
│   └── wrangler/
│       ├── cdn.aphrody.com.toml (13 lines, 483 B, ~148 tokens)
│       ├── creator.aphrody.com.toml (12 lines, 503 B, ~151 tokens)
│       ├── downloads.aphrody.com.toml (12 lines, 493 B, ~147 tokens)
│       └── shell.aphrody.app.toml (12 lines, 543 B, ~164 tokens)
├── unixwin/
│   └── tests/
│       ├── lib.ts (5 lines, 126 B, ~39 tokens)
│       ├── niubash.test.ts (4 lines, 85 B, ~27 tokens)
│       ├── paths.test.ts (6 lines, 127 B, ~40 tokens)
│       └── winuxcmd.test.ts (3 lines, 71 B, ~22 tokens)
└── yolo/
    ├── PRD.md (64 lines, 5.4 KB, ~1.7k tokens)
    ├── build.ts (9 lines, 340 B, ~101 tokens)
    ├── package.json (19 lines, 763 B, ~254 tokens)
    ├── server.ts (15 lines, 561 B, ~170 tokens)
    ├── src/
    │   ├── client/
    │   │   ├── app.ts (17 lines, 837 B, ~236 tokens)
    │   │   ├── index.html (1 lines, 36 B, ~11 tokens)
    │   │   └── style.css (1 lines, 36 B, ~11 tokens)
    │   ├── framework/
    │   │   ├── graph.ts (11 lines, 412 B, ~114 tokens)
    │   │   ├── primitives.ts (7 lines, 301 B, ~80 tokens)
    │   │   └── ssr.ts (11 lines, 439 B, ~135 tokens)
    │   └── virtual-modules.d.ts (1 lines, 35 B, ~11 tokens)
    ├── tests/
    │   └── yolo-fullstack.test.ts (5 lines, 131 B, ~42 tokens)
    └── tsconfig.json (14 lines, 508 B, ~165 tokens)
```

## Source Files

================================================
FILE: aphrody/README.md
================================================

# aphrody.com

Pixel-identical replica of `https://www.google.com/` aligned with `https://design.google/`, Chromium UI (`C:\src\third_party\chromium\src\docs\ui\index.md` / GoogleChrome standards), Microsoft Fluent UI 2, Apple macOS Sequoia traffic-light windowing, Storytold WASM+WebGPU Creative Suite, and Universal Declarative Store & Multi-Ecosystem Package Manager.

Built in **100% pure oven-sh/bun (Full Rust) TypeScript + Web Standards (DOM, HTML5, CSS3, SVG, WebGPU, WebAssembly) with ZERO external npm dependencies**.

## Architecture & Principles

- **Zero External Dependencies**: Zero npm dependencies (`dependencies: {}`, `devDependencies: {}`), no `node_modules`, no `bun.lock`.
- **Pure Bun Toolchain (Full Rust)**: `Bun.serve()` HTTP server, `Bun.build()` native bundler, `bun:test` test framework, `bun fmt` native formatter, `bun check` native TypeScript type checker, `bun:sqlite` declarative database, and `Bun.gzipSync()` compression.
- **Web Standards**: Native DOM manipulation, Custom Elements, HTML5 Web Speech API (`SpeechRecognition`), WebGPU (`navigator.gpu` + WGSL shaders), pure hand-assembled binary WebAssembly (`WebAssembly.instantiate` SIMD/vector math kernel), and CSS variables.
- **Hardware Acceleration**: Tuned for Intel Core i7-13700F (16C/24T Raptor Lake, AVX2) + NVIDIA GeForce RTX 4070 (Ada Lovelace `sm_89`, CUDA 13.4).

## Systems & Features

### 1. Unified Adaptive Shell & Design System Parity

- **Google Material Design 3 (`https://m3.material.io/`)**: Complete HCT tonal surface containers (`surfaceContainerLowest`..`highest`), elevation levels 1..5, state layer opacities (hover 8%, focus 10%, pressed 12%, dragged 16%), adaptive layout breakpoints (`Compact <600px`, `Medium 600-839px`, `Expanded >=840px`), and crisp vector SVG Material Symbols registry.
- **Microsoft Fluent UI 2 (`https://github.com/microsoft/fluentui`)**: Complete token parity for Desktop OS (`colorNeutralBackground1`..`6`, Mica and Acrylic backdrop tokens, `colorBrandBackground`, `strokeWidthThin`, `borderRadiusMedium` 4px / `Large` 8px, Fluent typography ramp with `Segoe UI Variable`, command bar, split views, and dual-ring focus stroke).
- **Apple macOS Sequoia/Tahoe Traffic-Light Windowing System (`src/windowing/macos-window.ts`)**: Floating, snappable, maximizable, and minimizable window manager with pixel-accurate traffic-light controls:
  - Close: `#FF5F56` (`1px solid #E0443E`) with hover `×` glyph (`#4D0000`)
  - Minimize: `#FFBD2E` (`1px solid #DEA123`) with hover `−` glyph (`#995700`)
  - Maximize / Zoom: `#27C93F` (`1px solid #1AAB29`) with diagonal double-ended expand arrows glyph (`#006500`)
  - Inactive unfocused state (`#DCDCDC` / `#464646`) that illuminates on cluster hover
  - Draggable titlebar, split-tile left/right (50%), double-click zoom, and dock minimize/restore animation.

### 2. Storytold Full WASM + WebGPU Creative & Production App Suite (`src/suite/storytold-suite.ts`)

- Real interactive creative applications upstreamed from `github.com/storytold/*`:
  - **Artcraft**: Vector & procedural canvas with brush engine and Bezier math
  - **Storyteller Bevy**: Interactive 3D ECS mesh & lighting studio
  - **Hanashi Graphics Demo**: Realtime WGSL procedural generative shader with 60fps loop
  - **Point Generator**: 3D LiDAR and particle physics simulation
  - **Runtime Audio Importer**: Low-latency audio spectrum visualizer & procedural DSP
  - **CodeCraft WASM**: Pure WebAssembly compiler & bytecode inspector
- **Pure Binary WASM SIMD Kernel**: Hand-assembled valid WebAssembly binary module compiled directly from byte opcodes with `WebAssembly.instantiate` (vector math `vec4_dot`, `fast_lerp`, `compute_orbit`, `add`) with zero npm dependencies and sub-20ns latency.
- **Live WebGPU + 2D Canvas Fallback**: Full WebGPU pipeline rendering on hardware with automatic graceful fallback to 2D Canvas in headless test environments.

### 3. Universal Declarative Store & Multi-Ecosystem Package Manager (`pm.ts` + `src/store/`)

- Built natively on top of `bun pm` / `bun install` + `bun:sqlite` declarative state with NixOS-style generations and instant rollback capability.
- Multi-Ecosystem Drivers supported:
  1. `bun`: `bun install`, `bun pm ls`, `bun pm cache pack/unpack/prune`, `bun pm fetch`, `bunx`, `bun check`, `bun fmt`
  2. `winget`: Windows Package Manager native manifests & installation commands
  3. `aur`: Arch User Repository official RPC v5 search & CachyOS PKGBUILD integration
  4. `nix`: Nixpkgs & NixOS declarative configuration / flake generation (`generateNixDeclarativeFlake`)
  5. `flatpak`: Flathub API v2 sandboxed application manifests
  6. `playstore`: Google Play Store APK / metadata pipeline adapter
  7. `wasm-hub`: Browser zero-install WASM + WebGPU application execution hub
  8. `awesome`: Awesome-List Markdown to Universal Store converter (parses ANY GitHub Awesome List into installable packages with auto-detected ecosystem commands).

### 4. Performance, LTO, AOT & Zero-Copy Stack Benchmark & Auto-Picker Engine (`src/benchmark/stack-picker.ts`)

- Measures real nanosecond execution via `Bun.nanoseconds()`:
  - Zero-Copy (`Uint8Array.subarray` / `SharedArrayBuffer` / `ArrayBuffer.transfer` / `Bun.mmap`) vs memory copy (measuring >35x speedup and 0 byte heap delta)
  - WASM SIMD / AOT vs JS JIT vector operations
  - `bun:sqlite` prepared statement throughput (>1,200,000 ops/sec)
- Evaluates and auto-picks candidate execution stacks:
  - `Rust LTO=fat + codegen-units=1 + target-cpu=raptorlake + zerocopy`
  - `C++23 MSVC /GL /LTCG /arch:AVX2 + CUDA 13.4 sm_89`
  - `.NET 11 NativeAOT PublishAot=true`
  - `WASM SIMD + WebGPU Compute`
  - `Bun Native FFI / Zero-Copy Buffer`
- Across workload profiles (`Bare-Metal GPU Compute`, `Wayland/UI Compositor`, `Edge HTTP/API Server`, `CLI/Filesystem Scanner`, `Portable Web/Store App`).

## Commands & CLI

```bash
# Production bundle build with native Bun.build()
bun run build

# Start native Bun server (static dist/ + /api/complete + /api/store/* + /api/bench)
bun run start

# Run comprehensive bun:test suite (100% pass)
bun test

# Run native Bun type checker & formatter
bun run check
bun run fmt

# Universal Package Manager CLI
bun run pm search <query> [--eco=<bun|winget|aur|nix|flatpak|playstore|wasm>]
bun run pm install <packageId>
bun run pm list
bun run pm generations
bun run pm rollback <generationId>
bun run pm awesome <markdown-url-or-file>
bun run pm bench
```

================================================
FILE: aphrody-app/README.md
================================================

# Aphrody App (`aphrody.app`)

Pure-Rust (Edition 2024, zero TypeScript) multi-target desktop & web application combining WebGPU/WGSL Mica rendering, Wayland wire-protocol & tiling layouts, Fluid-style total-order CRDT state (`SharedMap`, `SharedString`, `SharedCounter`), Blake3 content-addressed OPFS/WAL storage, and W3C WebMCP (`navigator.modelContext` + HTTP JSON-RPC `/mcp`).

## Workspace Crates

- `crates/aphrody-core`: Pure-Rust Wayland wire framing, tiling layouts (`dwindle`, `cosmic_grid`, `niri_scroll`, `floating`), Fluid-style sequenced operations, Blake3 WAL/VFS block store, and WebMCP JSON-RPC 2.0 registry.
- `crates/aphrody-wasm`: `wasm32-unknown-unknown` client mounting WebGPU (`mica.wgsl`), OPFS persistence, and `navigator.modelContext` WebMCP tools.
- `crates/aphrody-host`: Native CLI, ANSI TUI (`aphrody-app tui`), COOP/COEP HTTP + SSE Fluid sequencer + `/mcp` server (`aphrody-app serve`), static bundle builder (`aphrody-app build-dist`), and benchmark suite (`aphrody-app bench`).
- `crates/aphrody-android`: Android NDK `cdylib` (`aarch64-linux-android` / `x86_64-linux-android`) exposing C-ABI/JNI entrypoints over `aphrody-core`.

## Build & Verification

```bash
cargo test --workspace
cargo build --release -p aphrody-host
aphrody-app build-dist --root . --out ./dist
wck ./dist
```

## Multi-OS Packaging

- **Cloudflare Workers**: `wrangler.toml`; the built shell is served at https://shell.aphrody.app (Worker `aphrody-app-site`, R2 `aphrody-dist/sites/aphrody.app`). The apex https://aphrody.app is the deployment platform (`packages/deploy`).
- **Windows 11**: `aphrody-app.exe` (`x86_64-pc-windows-msvc`)
- **Arch / CachyOS**: `packaging/arch/PKGBUILD`
- **NixOS**: `packaging/nix/default.nix`
- **Alpine (musl)**: `packaging/alpine/APKBUILD`
- **Wayland Session**: `packaging/wayland/aphrody-app.desktop`
- **Android Native**: `cargo build -p aphrody-android --target aarch64-linux-android --release`

================================================
FILE: nt/README.md
================================================

# nt

Modèle du **vrai** Windows NT de ce poste, en direct et rendu entièrement par le GPU, sur la pile Microsoft.
Architecture et décisions : [docs/plan/architecture-microsoft.md](docs/plan/architecture-microsoft.md).

```
base/shell/explorer/  coque native WinUI 3 (place d'explorer.exe) (Windows App SDK 2.6.5 : Fluent, Mica, NavigationView, WebView2)
modules/web/        portage navigateur : scène GPU du noyau : WebGPU 3840x2160 MSAA 4x, boîtes instanciées + atlas glyphes/icônes, sans texte DOM
sdk/tools/host/     lecture du Windows réel via bun:ffi
                    ntsys.ts        ntdll : processeurs, compteurs, processus/threads, pilotes, pool, types et espace de noms d'objets
                    winindex.ts     index NTFS de %SystemRoot% (FindFirstFileExW + SQLite FTS5 + en-têtes PE)
                    pe.ts           lecteur PE/COFF (exports, imports, ressources)
                    pe-icon.ts      icônes réelles des PE, chemins des processus, volume NTFS et $MFT
                    desktop-svg.ts  bureau entier vectorisé en SVG (UI Automation)
                    server.ts       Bun.serve : WebSocket /kernel, /api/icon, /api/index, /desktop.svg
sdk/tools/msindex/  index récursif de la pile Microsoft (ECMA-335, API Sets, chargeur, registre WinRT, RoGetActivationFactory), verrouillé
sdk/tools/gpuprobe/ sonde des capacités Direct3D 12 (C++23 `import std`, CMake 4.5 + Ninja, vcpkg : WIL, DirectX-Headers)
sdk/tools/          fetch-tools.ts : DXC 1.9.2609, Agility SDK 1.620.2, niubash 1.5.0, CMake 4.5.0, Ninja 1.13.2 ; vsdev.ts : environnement VS
sdk/vcpkg/ports/    ports vcpkg aphrody-labs (overlay) : directx-headers 1.620.2, wil
sdk/rust/           WinUI 3 depuis Rust (windows-reactor, fork windows-rs épinglé)
.config/            configuration.winget : poste de développement (WinGet Configuration v3, DSC v3)
docs/               plan/ (architecture), research/ (faits relevés sur le poste), bun/, interop/,
                    msindex/ (pile Microsoft indexée et prouvée sur le poste : just msindex <src>)
```

Le cœur Rust de nt est le monorepo à plat basé sur windows-rs : fork `aphrody-labs/windows-rs` (master).

```
just serve        # http://localhost:8787/  (?report=1 : mesure d'affichage réelle)
just index        # index de C:\Windows
just setup        # poste Windows (winget configure)
just app          # coque WinUI 3 NativeAOT non empaquetée (just msix : MSIX)
just probe        # sonde D3D12 C++23 import std
just winui-rs     # WinUI 3 depuis Rust
```

Aucune compilation sur le poste du propriétaire : `.github/workflows/ci.yml` compile la coque, la sonde et la scène.

================================================
FILE: nt/docs/msindex/README.md
================================================

# msindex : pile Microsoft indexée et prouvée sur ce poste

Généré le 2026-11-12 par `sdk/tools/msindex` (`just msindex <src>`), vérifiable par `just msindex-verify <src>`.
Machine : Windows 26H1 build 28120 (28000.7.amd64fre.br_release_flt.260716-1702). Index : `target/index/msindex.sqlite` (tables node, edge, proof, fts).

Empreinte du graphe : `1b9767a8e6b276d7c3766b9379880d9e815ab34b8112e7b7e5f66ec5db7976a1` ; des preuves : `8ce53b64fdda6ca36d74a0ab68705c1d85f1595776993e868f3c706c582bde95`.

## Sources

- Win32 + WDK + WinRT : Windows.Win32.winmd et Windows.winmd de windows-rs (2196dbbc27), Windows.Wdk.winmd (NuGet microsoft.windows.wdk.win32metadata 0.13.25-experimental, SHA-512 vérifié).
- Windows App SDK 2.6.5 : 11 paquets NuGet ; sources WindowsAppSDK et microsoft-ui-xaml (1723 types IDL, 17 fonctionnalités).
- .NET : .NET 10.0.15, .NET 11.0.0 (packs de référence et runtime partagé).
- windows-rs : 326 crates du monorepo nt.
- C/C++ : UCRT 10.0.26100.0 (1529 déclarations, 1257 exportées par ucrtbase.dll), 11 DLL CRT/STL, `import std` MSVC 14.52.37025 (894 noms).
- API Sets : schéma v6 du système, 989 contrats.

## Preuves

| contrôle               | réussis | total | méthode                                                                                      |
| ---------------------- | ------- | ----- | -------------------------------------------------------------------------------------------- |
| RoGetActivationFactory | 1820    | 1848  | fabrique obtenue (IID_IActivationFactory), classes en processus                              |
| activation-export      | 1847    | 1848  | DllPath exporte DllGetActivationFactory                                                      |
| apiset-host            | 857     | 989   | PEB->ApiSetMap : le contrat a une DLL hôte                                                   |
| dotnet-impl            | 8262    | 8262  | type de référence défini (TypeDef) par le runtime partagé, redirections ExportedType suivies |
| loader                 | 16697   | 16806 | LoadLibraryExW(DONT_RESOLVE_DLL_REFERENCES) + GetProcAddress (processus enfant)              |
| pe-export              | 18409   | 18520 | contrat API Set résolu, nom présent dans la table d'exports PE de l'hôte                     |
| ucrtbase-export        | 1257    | 1529  | déclaration _ACRTIMP exportée par ucrtbase.dll                                               |
| wasdk-activation       | 1665    | 1665  | appxfragment du paquet -> DLL du paquet exportant DllGetActivationFactory                    |
| winrt-registered       | 1864    | 1891  | HKLM\SOFTWARE\Microsoft\WindowsRuntime\ActivatableClassId                                    |

## Nœuds par type

- constant : 155908
- method : 107924
- field : 103326
- property : 48674
- struct : 32493
- function : 18520
- interface : 15749
- constructor : 10319
- class : 10195
- enum : 8463
- export : 4735
- delegate : 3780
- event : 2575
- cargo-feature : 1694
- c-function : 1529
- idl-runtimeclass : 1180
- apiset : 989
- namespace : 936
- std-export : 894
- header : 849
- attribute : 825
- assembly : 343
- idl-enum : 328
- crate : 326
- idl-interface : 171
- idl : 170
- component : 95
- idl-delegate : 65
- idl-gated : 49
- winmd : 40
- idl-apicontract : 25
- idl-struct : 24
- scope : 18
- feature : 17
- package : 11
- dll : 11
- source : 6
- repo : 2
- runtime : 2
- rdl-area : 2
- index : 1
- rdl : 1
- headers : 1
- module : 1

================================================
FILE: aphrody/package.json
================================================

// [OUTLINE - 17 symbols, 20 lines]
// L2: "name": "@aphrody/aphrody"
// L3: "version": "1.0.0"
// L4: "description": "aphrody.com - Aphrody brand homepage, search with package catalog, and runtime benchmarks, in pure Bun web standards"
// L5: "private": true
// L6: "type": "module"
// L7-L17: "scripts":
// L8: "build": "bun run build.ts"
// L9: "build:aot": "bun build --compile --minify --bytecode server.ts --outfile dist/aphrody-web.exe"
// L10: "dev": "bun run server.ts"
// L11: "start": "bun run server.ts"
// L12: "test": "bun test"
// L13: "pm": "bun run pm.ts"
// L14: "fmt": "bun fmt"
// L15: "check": "bun check"
// L16: "deploy:dry": "bunx wrangler@4.161.0 deploy --dry-run"
// L18: "dependencies":
// L19: "devDependencies":

================================================
FILE: aphrody-app/Cargo.toml
================================================

[workspace]
resolver = "3"
members = [
"crates/aphrody-core",
"crates/aphrody-wasm",
"crates/aphrody-host",
"crates/aphrody-android",
]

[workspace.package]
version = "0.1.0"
edition = "2024"
license = "MIT OR Apache-2.0"

[workspace.dependencies]
aphrody-core = { path = "crates/aphrody-core" }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
blake3 = { version = "1", default-features = false, features = ["std", "pure"] }

[profile.release]
opt-level = 3
lto = "fat"
codegen-units = 1
panic = "abort"
strip = true

[profile.wasm-release]
inherits = "release"
opt-level = "s"

================================================
FILE: aphrody-app/crates/aphrody-android/Cargo.toml
================================================

[package]
name = "aphrody-android"
version.workspace = true
edition.workspace = true
license.workspace = true
description = "Android NativeActivity shell around aphrody-core"

[lib]
name = "aphrody_app"
crate-type = ["cdylib"]

[dependencies]
aphrody-core.workspace = true

================================================
FILE: aphrody-app/crates/aphrody-core/Cargo.toml
================================================

[package]
name = "aphrody-core"
version.workspace = true
edition.workspace = true
license.workspace = true
description = "Pure Rust core: Wayland-style WM model, Fluid-style sequenced ops, Blake3 VFS, WebMCP registry"

[dependencies]
serde.workspace = true
serde_json.workspace = true
blake3.workspace = true

================================================
FILE: aphrody-app/crates/aphrody-host/Cargo.toml
================================================

[package]
name = "aphrody-host"
version.workspace = true
edition.workspace = true
license.workspace = true
description = "Native aphrody-app binary: serve, tui, build-dist, doctor, bench"

[[bin]]
name = "aphrody-app"
path = "src/main.rs"

[dependencies]
aphrody-core.workspace = true
serde.workspace = true
serde_json.workspace = true
blake3.workspace = true

================================================
FILE: aphrody-app/crates/aphrody-wasm/Cargo.toml
================================================

[package]
name = "aphrody-wasm"
version.workspace = true
edition.workspace = true
license.workspace = true
description = "Browser build: WebGPU + WGSL renderer, OPFS storage, WebMCP registration"

[lib]
name = "aphrody_app_wasm"
crate-type = ["cdylib", "rlib"]

[dependencies]
aphrody-core.workspace = true
serde_json.workspace = true

[target.'cfg(target_arch = "wasm32")'.dependencies]
wasm-bindgen = "=0.2.129"
wasm-bindgen-futures = "0.4"
js-sys = "0.3"
serde.workspace = true

[target.'cfg(target_arch = "wasm32")'.dependencies.web-sys]
version = "0.3"
features = [
"Window",
"Document",
"Element",
"HtmlElement",
"HtmlCanvasElement",
"Navigator",
"Location",
"Performance",
"DomRect",
"Event",
"EventTarget",
"KeyboardEvent",
"MouseEvent",
"PointerEvent",
"MessageEvent",
"EventSource",
"RequestInit",
"Response",
"console",
"Gpu",
"GpuAdapter",
"GpuDevice",
"GpuQueue",
"GpuCanvasContext",
"GpuCanvasConfiguration",
"GpuTextureFormat",
"GpuShaderModule",
"GpuShaderModuleDescriptor",
"GpuRenderPipeline",
"GpuRenderPipelineDescriptor",
"GpuVertexState",
"GpuFragmentState",
"GpuColorTargetState",
"GpuBuffer",
"GpuBufferDescriptor",
"GpuBindGroup",
"GpuBindGroupDescriptor",
"GpuBindGroupEntry",
"GpuBufferBinding",
"GpuBindGroupLayout",
"GpuCommandEncoder",
"GpuCommandBuffer",
"GpuRenderPassEncoder",
"GpuRenderPassDescriptor",
"GpuRenderPassColorAttachment",
"GpuTexture",
"GpuTextureView",
"GpuLoadOp",
"GpuStoreOp",
"GpuAutoLayoutMode",
"gpu_buffer_usage",
"StorageManager",
"FileSystemDirectoryHandle",
"FileSystemFileHandle",
"FileSystemGetFileOptions",
"FileSystemWritableFileStream",
"File",
"Blob",
]

================================================
FILE: nt/justfile
================================================

# nt — point d'entrée unique. Architecture : docs/plan/architecture-microsoft.md.

# Windows (niubash) et Unix ; les recettes qui lisent le Windows réel sont marquées [windows].

set shell := ["sh", "-cu"]
set windows-shell := ["niu", "-cu"]

rid_os := if os() == "windows" { "win" } else if os() == "macos" { "osx" } else { "linux" }
rid_arch := if arch() == "aarch64" { "arm64" } else { "x64" }
rid := env("NT_RID", rid_os + "-" + rid_arch)
platform := if rid =~ "arm64$" { "ARM64" } else { "x64" }

default: lint web

# Outils épinglés : DXC 1.9.2609, Agility SDK 1.620.2 ; Windows : niubash 1.5.0, CMake 4.5.0, Ninja 1.13.2 -> sdk/tools/

tools:
bun sdk/tools/fetch-tools.ts

install:
bun install --frozen-lockfile

lint: install
bun fmt --check
bun check

# Scène GPU du noyau (WebGPU) -> target/web

web: install
bun build modules/web/nt.html --outdir target/web --minify

# Serveur : noyau NT en direct (WebSocket /kernel), /api/icon, /api/index, /desktop.svg

serve: install
bun sdk/tools/host/server.ts

# Index complet de %SystemRoot% (FindFirstFileExW + SQLite FTS5 + en-têtes PE) -> target/index/windows.sqlite

[windows]
index root="":
bun sdk/tools/host/winindex.ts {{ root }} --pe

# Bureau Windows entier vectorisé en SVG (UI Automation) -> target/desktop.svg

[windows]
desktop-svg:
bun sdk/tools/host/desktop-svg.ts

# Poste de développement Windows : WinGet Configuration v3 (VS Build Tools 2026 + C++, .NET 11, bun, just, niubash, Rust…)

[windows]
setup:
winget configure -f .config/configuration.winget

# Sonde des capacités Direct3D 12 : C++23 `import std` (CMake 4.5 + Ninja + MSVC), vcpkg (directx-headers, wil)

[windows]
probe: tools
cd sdk/tools/gpuprobe && bun ../vsdev.ts cmake --workflow --preset windows

# Coque native WinUI 3 NativeAOT, non empaquetée autonome -> target/dotnet/publish/Nt.App/ ; données : `just serve`

[windows]
app:
dotnet publish base/shell/explorer -c Release -r {{ rid }}

# .NET -> bun sans node-api-dotnet (docs/bun/dotnet-native.md) : Nt.Interop en IL (hostfxr) et NativeAOT, puis liaisons

# bun:ffi générées depuis les métadonnées ECMA-335 -> target/dotnet-ffi. Compile : CI uniquement.

interop:
dotnet build sdk/dotnet/Nt.Interop -c Release
dotnet publish sdk/dotnet/Nt.Interop -c Release -r {{ rid }}
bun sdk/tools/dotnet-ffi/gen.ts target/dotnet/bin/Nt.Interop/release/Nt.Interop.dll --out target/dotnet-ffi --native target/dotnet/publish/Nt.Interop/release_{{ rid }}

# Tests d'interop (après `just interop`) : NativeAOT puis CoreCLR hébergé, chacun dans son processus

test-interop:
bun test ./sdk/tools/dotnet-ffi/native.test.ts
bun test ./sdk/tools/dotnet-ffi/hosted.test.ts

# Coût d'appel bun -> .NET (OS, JS, NativeAOT, CoreCLR) -> target/bench/dotnet-ffi-<rid>.json

bench-interop:
NT_RID={{ rid }} bun sdk/tools/dotnet-ffi/bench.ts

# Graphe des fonctionnalités de bun amont (arbre source local) -> docs/bun/feature-graph.{json,md}

bun-graph src:
bun sdk/tools/bun-graph.ts {{ src }} --out docs/bun

# Index récursif et prouvé de la pile Microsoft du poste (Win32/WDK/WinRT, Windows App SDK + WinUI 3, .NET 10/11, windows-rs,

# UCRT/CRT/STL) -> target/index/msindex.sqlite, docs/msindex/{lock.json,README.md}. src : racine du monorepo src.

[windows]
msindex src:
bun sdk/tools/msindex/main.ts --src {{ src }}

# Reproductibilité : entrées identiques au verrou docs/msindex/lock.json et même empreinte de graphe, sinon échec

[windows]
msindex-verify src:
bun sdk/tools/msindex/main.ts --src {{ src }} --verify

# Coque en MSIX projet unique -> target/dotnet/msix/ ; signé si NT_CERT (pfx) et NT_CERT_PASSWORD sont définis

[windows]
msix:
dotnet publish base/shell/explorer -c Release -r {{ rid }} -p:Platform={{ platform }} -p:NtPackage=msix

# WinUI 3 depuis Rust (windows-reactor, fork windows-rs épinglé) -> target/cargo/release/reactor-winui-hello.exe

[windows]
winui-rs:
cd sdk/rust && cargo -Zgit=shallow-deps build --release --locked

================================================
FILE: nt/modules/web/package.json
================================================

// [OUTLINE - 3 symbols, 5 lines]
// L2: "name": "@aphrody/web"
// L3: "private": true
// L4: "type": "module"

================================================
FILE: nt/package.json
================================================

// [OUTLINE - 12 symbols, 16 lines]
// L2: "name": "@aphrody/nt"
// L3: "version": "0.0.0"
// L4: "private": true
// L5: "type": "module"
// L6-L8: "dependencies":
// L7: "@aphrody/ffi-bridge": "workspace:*"
// L9-L15: "devDependencies":
// L10: "@types/bun": "catalog:"
// L11: "@webgpu/types": "catalog:"
// L12: "tree-sitter-c": "catalog:"
// L13: "tree-sitter-cpp": "catalog:"
// L14: "web-tree-sitter": "catalog:"

================================================
FILE: nt/sdk/rust/Cargo.toml
================================================

# Échantillons Rust de nt sur la pile WinUI de windows-rs (windows-reactor : WinUI 3 déclaratif, Windows App SDK 2.x).

# Le cœur Rust de nt vit dans le monorepo windows-rs (fork aphrody-labs, master) ; ici seulement des échantillons.

[workspace]
resolver = "3"
members = ["brand", "winui-hello"]

[workspace.package]
edition = "2024"
publish = false

[workspace.dependencies]

# Fork aphrody-labs/windows-rs épinglé par commit (= microsoft/windows-rs master 8ca69fda du 2026-11-11) :

# windows-reactor 0.101.0, non publié sur crates.io (0.100.0). Dépendance git, jamais de chemin local.

windows-reactor = { git = "https://github.com/aphrody-labs/windows-rs", rev = "8ca69fdaa9d69c78b9bcfbee96c6916f2282e7f0" }

================================================
FILE: nt/sdk/rust/brand/Cargo.toml
================================================

[package]
name = "nt-brand"
version = "0.1.0"
edition.workspace = true
publish.workspace = true
description = "Couleurs de marque de nt : rôles Material 3 de packages/design/tokens/tokens.rs (RGBA u32)."
license = "MIT OR Apache-2.0"

[lib]
path = "src/lib.rs"

================================================
FILE: nt/sdk/rust/winui-hello/Cargo.toml
================================================

# Conventions des échantillons windows-rs (crates/samples/reactor/*) : version 0.0.0, édition 2024, non publié.

[package]
name = "reactor-winui-hello"
version = "0.0.0"
edition.workspace = true
publish.workspace = true

[dependencies]
windows-reactor = { workspace = true }

================================================
FILE: r2-site/package.json
================================================

// [OUTLINE - 9 symbols, 12 lines]
// L2: "name": "@aphrody/r2-site"
// L3: "version": "0.1.0"
// L4: "private": true
// L5: "type": "module"
// L6: "description": "Portable large-file/static site (downloads, cdn) on @aphrody/runtime-adapter"
// L7-L11: "scripts":
// L8: "start": "bun run src/entry.vps.ts"
// L9: "test": "bun test"
// L10: "check": "bun check"

================================================
FILE: yolo/package.json
================================================

// [OUTLINE - 18 symbols, 23 lines]
// L2: "name": "@aphrody/yolo"
// L3: "version": "1.0.0"
// L4: "description": "Reproducible Fullstack Aphrody Bun v1.4.4 Framework, AST Module Graph, Material Design 3 Stack, Aphrody Pets & 3-VPS Search Inspector"
// L5: "private": true
// L6: "type": "module"
// L7-L9: "bin":
// L8: "yolo": "./server.ts"
// L10-L18: "scripts":
// L11: "build": "bun run build.ts"
// L12: "build:aot": "bun build --compile --minify --bytecode server.ts --outfile $HOME/.local/bin/yolo"
// L13: "dev": "bun run server.ts"
// L14: "start": "bun run server.ts"
// L15: "test": "bun test"
// L16: "fmt": "bun fmt"
// L17: "check": "bun check"
// L19-L21: "dependencies":
// L20: "@aphrody/chromium-bun": "workspace:*"
// L22: "devDependencies":

================================================
FILE: aphrody-app/crates/aphrody-android/src/lib.rs
================================================

// [OUTLINE - 7 symbols, 75 lines]
// import aphrody_core
// import aphrody_core
// import aphrody_core
// import std
// import std
// import std
// import super
// L11-L14: struct AndroidHost
// L16-L22: fn host() -> &'static AndroidHost
// L26-L30: pub extern "C" fn aphrody_android_resize(width: f32, height: f32)
// L35-L49: pub unsafe extern "C" fn aphrody_android_rpc(json_utf8: *const c_char) -> *mut c_char
// L53-L59: pub unsafe extern "C" fn aphrody_android_string_free(ptr: *mut c_char)
// L62-L75: mod tests
// L66-L74: fn android_c_abi_roundtrip()

================================================
FILE: aphrody-app/crates/aphrody-core/src/lib.rs
================================================

// [OUTLINE - 10 symbols, 21 lines]
// L1: pub mod fluid;
// L2: pub mod layout;
// L3: pub mod state;
// L4: pub mod store;
// L5: pub mod wayland;
// L6: pub mod webmcp;
// L7: pub mod wire;
// L8: pub mod wm;
// L13: pub trait MaybeSend
// L17: pub trait MaybeSend: Send

================================================
FILE: aphrody-app/crates/aphrody-host/src/main.rs
================================================

// [OUTLINE - 6 symbols, 152 lines]
// import aphrody_core
// import aphrody_core
// import aphrody_core
// import serde_json
// import std
// import std
// import std
// L1: mod dist;
// L2: mod http;
// L3: mod tui;
// L25-L35: fn flag_val(args: &[String], flag: &str) -> Option<String>
// L37-L145: fn run() -> Result<(), String>
// L147-L152: fn main()

================================================
FILE: aphrody-app/crates/aphrody-wasm/src/lib.rs
================================================

// [OUTLINE - 4 symbols, 11 lines]
// L4: pub mod scene;
// L7: mod gpu;
// L9: mod opfs;
// L11: mod web;

================================================
FILE: nt/sdk/rust/brand/src/lib.rs
================================================

// [OUTLINE - 3 symbols, 29 lines]
// import super
// L10-L17: pub const fn rgba_f32(c: u32) -> [f32; 4]
// L20-L29: mod tests
// L24-L28: fn primaire_de_marque()

================================================
FILE: nt/sdk/rust/winui-hello/src/main.rs
================================================

// [OUTLINE - 6 symbols, 49 lines]
// import windows_reactor
// L9-L12: enum Message
// L14-L16: struct Hello
// L22-L24: fn create(_input: &(), _context: &ComponentContext<Self>) -> Self
// L26-L31: fn update(&mut self, message: Message, _context: &ComponentContext<Self>)
// L33-L44: fn view(&self, _input: &(), context: &mut ViewContext<Self>) -> View
// L47-L49: fn main()

================================================
FILE: DEPS.rules
================================================

# checkdeps layer rules (see docs/ARCHITECTURE.md). Inherited by subdirectories.

layer = 5

================================================
FILE: aphrody/DESIGN.md
================================================

# DESIGN.md — aphrody.com

Design specification for the aphrody.com brand homepage. Requirements and content live in `PRD.md`; this file defines the visual system. The tokens are implemented in `src/seo/home-css.ts`.

## 1. Idea

Aphrody's flagship idea is the tiling desktop (aphrody.app). The homepage borrows that vernacular instead of a generic card grid: the products form one tiled composition, partitioned like the "dwindle" layout of `aphrody-core`, separated by uniform gaps, and the tile under the pointer or keyboard focus takes the "active border", exactly as a focused window does in a tiling window manager. That is the one bold element. Everything else is quiet: left-aligned prose, generous margins, no decoration.

## 2. Color

| Token      | Light     | Dark      | Use                                              |
| :--------- | :-------- | :-------- | :----------------------------------------------- |
| `--paper`  | `#F2F4F1` | `#151B21` | Page background                                  |
| `--tile`   | `#FFFFFF` | `#1C242C` | Tile surface                                     |
| `--ink`    | `#17202A` | `#E6EAEE` | Text, brand mark                                 |
| `--muted`  | `#55606B` | `#A3ADB7` | Secondary text                                   |
| `--rule`   | `#848E96` | `#647381` | Tile borders (3:1 against the page, WCAG 1.4.11) |
| `--active` | `#0B7A75` | `#3FC1B9` | Active tile border, focus ring, links            |
| `--live`   | `#2E6B3A` | `#7CC98A` | "En ligne" status                                |
| `--dev`    | `#8A5A00` | `#E3B35C` | "En développement" status                        |

Contrast (WCAG 2.2, computed): light ink/paper 14.87, muted/tile 6.42, active/paper 4.68, active/tile 5.18, live/tile 6.40, dev/tile 5.93, rule/paper 3.02; dark ink/paper 14.35, muted/tile 6.89, active/tile 7.13, live/tile 7.91, dev/tile 8.12, rule/paper 3.56. Theme follows `prefers-color-scheme`; no toggle is needed without JavaScript.

## 3. Type

- One family: **Atkinson Hyperlegible Next** (OFL, variable weight), self-hosted as `/atkinson-next.woff2` (license: `/atkinson-next-OFL.txt`), preloaded, `font-display: optional` so a late font never swaps in and shifts the layout (CLS 0).
- Scale (1.25 ratio, 18 px body): h1 `clamp(2.25rem, 1.6rem + 2.6vw, 3.6rem)` / 1.08, weight 700, tracking -0.015em; h2 1.6rem / 1.2, weight 700; tile name 1.4rem / 1.2, weight 700; body 1.125rem / 1.6; small 0.95rem / 1.5.
- Sentence case everywhere. No all-caps labels, no single-word accents in headlines, no monospace labels.
- Measure: prose capped at 64ch.

## 4. Layout

- Container: `max-width: 76rem`, side padding `clamp(1.25rem, 4vw, 3rem)`.
- Mosaic: CSS grid `2fr 1fr 1fr` x 2 rows at >= 720 px (dwindle: the main tile takes half, the rest splits recursively). The aphrody.app tile spans both rows of column 1 and lists verified facts from its repository; Recherche spans columns 2-3 on row 1; Paquets and Benchmarks split row 2. Gap `0.75rem` (the "gaps_in" of a tiling WM). Tiles have a 1 px `--rule` border and a 6 px radius, the same on every tile because they are siblings of equal rank.
- Below 720 px: single column, aphrody.app first.
- Section rhythm: `clamp(3rem, 6vw, 6rem)` between sections; sections are separated by space, not by rules.

## 5. Interaction and motion

- Tile hover and `:focus-visible`: border becomes `--active` and an inset 1 px ring doubles it to 2 px, so nothing moves, transition 120 ms. This is the only motion on the page, and it answers the user's pointer or keyboard.
- `prefers-reduced-motion: reduce` removes the transition.
- Focus ring for every other link: 2 px `--active` outline, 3 px offset.
- Touch targets >= 44 x 44 px.

## 6. Anti-slop rules

- No emoji, no gradients, no shadows, no stock imagery, no fake metrics or testimonials.
- No eyebrow labels above headings, no middle-dot meta strings, no arrows appended to link text.
- Product status is plain text with a colored text label, never a fake "live" pulse animation.
- Copy names things by what people use ("le catalogue de paquets"), not by how they are built.

================================================
FILE: aphrody/PRD.md
================================================

# Cahier des charges (PRD) — aphrody.com, page d'accueil de la marque

| Champ           | Valeur                                                                                             |
| :-------------- | :------------------------------------------------------------------------------------------------- |
| Surface         | `https://aphrody.com/` (fr, par défaut) et `https://aphrody.com/en`                                |
| Rôle de la page | Dire qui est Aphrody, ce qu'elle fait, et mener à ses produits                                     |
| Propriétaire    | Aphrody (`contact@aphrody.com`)                                                                    |
| Runtime         | Bun 1.4.4, HTML/CSS rendus au build (`build.ts` -> `dist/`), servis par `server.ts` derrière nginx |
| Vérification    | `bun test`, `gds verify`, `gds audit-slop`, `wck dist` 100/100                                     |

## 1. Objectif

Remplacer l'ancienne page d'accueil (clone d'interface de moteur de recherche, rendue en JavaScript, avec un « Mode IA Gemini ») par une page de marque statique, lisible sans JavaScript, optimisée pour le référencement.

- La recherche reste disponible, mais sur `/search` (page secondaire, liée depuis l'en-tête).
- Aucune fonctionnalité d'IA sur aphrody.com. Règle du dépôt : seul `packages/ai-os` porte de l'IA. Le Mode IA Gemini (`/api/gemini/search`, `/search/ai-gemini`) et Local Studio (`/api/studio/*`) sont retirés. `/search/ai-gemini` répond `410 Gone`.

## 2. Public et parcours

1. **Visiteur qui découvre Aphrody** (moteur de recherche, lien partagé) : comprend en moins de 5 secondes ce qu'est Aphrody et voit la liste des produits avec leur statut.
2. **Développeur** : trouve la recherche, le catalogue de paquets et les benchmarks en un clic depuis la mosaïque.
3. **Partenaire ou association** qui cherche un prestataire : trouve ce qu'Aphrody sait faire et un contact direct.

## 3. Contenu (uniquement des faits vérifiables)

Chaque produit affiché est réel, et son statut est vérifié au moment de l'écriture (2026-11-12).

| Produit              | URL                    | Statut affiché                                | Fait vérifié                                                                                                                        |
| :------------------- | :--------------------- | :-------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| Recherche Aphrody    | `/search`              | En ligne                                      | `/search` et `/api/q` répondent 200 en production                                                                                   |
| Catalogue de paquets | `/search/packages`     | En ligne                                      | Bun, winget, AUR, Nix, Flatpak, Play Store, WASM hub ; pages 200 en production                                                      |
| Benchmarks           | `/search/benchmarks`   | En ligne                                      | Mesures calculées à la demande par `/api/bnc` ; page 200 en production                                                              |
| aphrody.app          | `https://aphrody.app/` | En développement, pas encore ouvert au public | Dépôt `apps/aphrody-app` : mosaïque de fenêtres (dwindle, grille, défilement), rendu WebGPU, stockage local ; domaine en erreur 526 |

Interdits : témoignages, notes, chiffres d'usage, logos de clients, promesses de dates, textes de remplissage. Un produit dont l'URL ne répond pas n'est jamais présenté comme disponible. Les sites communautaires maintenus par Aphrody (DBFR, Shenron, Rose Griffon) ne sont pas des produits Aphrody et n'apparaissent pas sur la page.

## 4. Structure de la page

```text
+--------------------------------------------------------------------------+
| En-tête : Aphrody      Produits  Recherche  Contact            FR | EN   |
+--------------------------------------------------------------------------+
| H1 (phrase de marque) + paragraphe d'introduction (max 64ch)             |
+--------------------------------------+-----------------------------------+
|                                      | Recherche                         |
|  aphrody.app (tuile principale)      +-----------------+-----------------+
|                                      | Paquets         | Benchmarks      |
+--------------------------------------+-----------------+-----------------+
| Ce que fait Aphrody : 3 paragraphes courts (sites, logiciels, systèmes)  |
+--------------------------------------------------------------------------+
| Contact : adresse e-mail, ce qu'on peut demander                         |
+--------------------------------------------------------------------------+
| Pied de page : mentions, langues, liens produits                         |
+--------------------------------------------------------------------------+
```

- Mosaïque : partition « dwindle » (la tuile principale prend 3/5 de la largeur, le reste est découpé récursivement), comme `apps/aphrody-app/crates/aphrody-core/src/layout.rs`. Sous 720 px, les tuiles s'empilent.
- Une tuile est un lien unique (toute la surface est cliquable), avec nom, phrase descriptive et statut.

## 5. SEO

- `title` fr : « Aphrody — sites et logiciels web indépendants » ; en : « Aphrody — independent websites and web software ».
- `description` : une phrase factuelle sur ce que fait Aphrody et ses produits.
- Une seule balise `h1` visible. Canonical, hreflang fr-FR / en-US / x-default, Open Graph avec `og:locale`.
- JSON-LD : `Organization` (nom, url, logo, e-mail, `sameAs` limité aux URL qui répondent), `WebSite` avec `SearchAction` vers `/search`, `ItemList` des produits, `BreadcrumbList`. `Dataset` pour les benchmarks (`/api/bnc`), pas d'`aggregateRating`, pas de `SoftwareApplication` tant qu'aphrody.app n'est pas public.
- Sitemaps et `robots.txt` sans référence à Gemini.

## 6. Critères d'acceptation

| Critère                      | Cible                                                                            | Vérification              |
| :--------------------------- | :------------------------------------------------------------------------------- | :------------------------ |
| Page lisible sans JavaScript | Tout le contenu et tous les liens présents dans le HTML                          | test `home` dans `tests/` |
| LCP / CLS                    | <= 1200 ms / 0.00                                                                | `wck dist`                |
| Accessibilité                | WCAG 2.2 AA, focus visible, cibles >= 44 px                                      | `wck`, revue clavier      |
| Poids                        | HTML + CSS de la home < 30 Ko compressé, police < 60 Ko                          | taille de `dist/`         |
| Aucune trace d'IA            | 0 occurrence de « Gemini », « IA », « AI mode » sur la home et dans les sitemaps | tests                     |
| Anti-slop                    | 0 emoji, 0 formule promotionnelle                                                | `gds audit-slop`          |

================================================
FILE: aphrody/build.ts
================================================

// [OUTLINE - 2 symbols, 280 lines]
// import fs
// import path
// import node:zlib
// import ../../packages/wck/src/index
// import ../../packages/deploy/src/m3
// import ./src/google/config
// import ./src/seo/documents
// import ./src/seo/page-css
// import ./src/seo/html
// import ./src/play/page
// import ./src/immersive/build
// import ./src/os/build
// import ./src/os/page
// import ./src/holding/page
// L52-L56: function emit(rel: string, content: string | Uint8Array): void
// L233-L238: function walk(dir: string): string[]

================================================
FILE: aphrody/edge/worker.ts
================================================

// [OUTLINE - 2 symbols, 86 lines]
// import @aphrody/deploy/src/serve.ts
// import @aphrody/deploy/src/runtime.ts
// L20-L26: interface Env
// L35-L85: async fetch(

================================================
FILE: aphrody/pm.ts
================================================

// [OUTLINE - 1 symbols, 228 lines]
// import ./src/store/universal-manager
// import ./src/benchmark/stack-picker
// import fs
// L28-L223: async function main()

================================================
FILE: aphrody/server.ts
================================================

// [OUTLINE - 8 symbols, 339 lines]
// import bun
// import fs
// import path
// import ./src/data/suggestions
// import ./src/store/universal-manager
// import ./src/benchmark/stack-picker
// import ./src/runtime/assets
// import ./src/runtime/hash
// import ./src/google/config
// import ./src/google/relay
// import ./src/seo/documents
// import ./src/seo/html
// import ./src/seo/site
// import ./src/play/page
// import ./src/os/server
// L23-L33: function resolveDist(): string
// L40-L50: function loadGoogleConfig(): GoogleConfig
// L81-L96: function jsonResponse(data: unknown, status = 200, req?: Request): Response
// L98-L102: function withSecurity(res: Response): Response
// L104-L113: function localeOf(req: Request, url: URL): Locale
// L115-L123: function clientId(
// L125-L136: function htmlHeaders(pathname: string): Record<string, string>
// L140-L336: async fetch(

================================================
FILE: aphrody/src/benchmark/stack-picker.ts
================================================

// [OUTLINE - 13 symbols, 487 lines]
// import ../suite/wasm-kernel
// L20-L25: type WorkloadType =
// L27-L39: interface StackDefinition
// L146-L157: function getNanoseconds(): number
// L159-L166: interface ZeroCopyBenchResult
// L168-L197: function benchmarkZeroCopyVsCopy(
// L199-L206: interface WasmVsJsBenchResult
// L208-L243: async function benchmarkWasmVsJs(
// L245-L251: interface SqliteBenchResult
// L253-L315: async function benchmarkSqliteThroughput(
// L317-L324: interface StackRecommendation
// L326-L430: function pickOptimalStack(input:
// L432-L444: interface FullBenchmarkSuiteReport
// L446-L487: async function runBenchmarkSuite(): Promise<FullBenchmarkSuiteReport>

================================================
FILE: aphrody/src/client/boot.ts
================================================

// [OUTLINE - 16 symbols, 253 lines]
// import ./../seo/webmcp-tools
// L13-L19: interface Cfg
// L25-L31: function safe(fn: () => void): void
// L39-L41: function gtag(..._args: unknown[]): void
// L44-L61: function initShortcut(): void
// L64: type Decision =
// L66-L73: function readDecision(): Decision | null
// L75-L86: function applyConsent(granted: boolean): void
// L88-L96: function saveDecision(granted: boolean): void
// L98-L123: function showBanner(): void
// L125-L135: function addReopen(): void
// L138-L144: function addScript(src: string, extra?: (s: HTMLScriptElement) => void): void
// L147-L163: function loadAdsense(): void
// L165-L188: function loadGoogleTags(): void
// L190-L206: function whenIdleOrInteracted(fn: () => void): void
// L209-L232: function initWebMcp(): void
// L217-L225: async execute(args: Record<string, unknown>)

================================================
FILE: aphrody/src/client/play.ts
================================================

// [OUTLINE - 4 symbols, 91 lines]
// import ../immersive/play-launcher.ts
// L5-L9: interface PlayState
// L28-L31: function show(message: string)
// L33-L43: async function hasWebGpu(): Promise<boolean>
// L48-L88: async function main()

================================================
FILE: aphrody/src/data/games.json
================================================

// [OUTLINE - 624 symbols, 1 lines]
// L1: "store":"epic"
// L1: "ext_id":"d37f3694e7a04edb8347f3cb6320f9d3"
// L1: "name":"Alien: Isolation"
// L1: "url":"https://store.epicgames.com/p/alien-isolation"
// L1: "cover":"https://cdn1.epicgames.com/df37f065c3f14eadbf011177396e2966/offer/EGS_AlienIsolation_CreativeAssembly_S5-1920x1080-1cf3b9a86adcefeebf903451b1b3fb49.jpg"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"SEGA of Europe"
// L1: "release":null
// L1: "desc":
// L1: "en":"Discover the true meaning of fear in Alien: Isolation, a survival horror set in an atmosphere of constant dread and mortal danger... Created using the CATHODE™ engine."
// L1: "fr":"Découvrez le vrai sens de la peur dans Alien: Isolation, un survival horror se déroulant dans une atmosphère d'épouvante et de danger constants. Créé avec le moteur CATHODE™."
// L1: "zh-CN":"在《Alien: Isolation》这款以持续恐惧和致命危险气氛为背景的生存恐怖游戏中，发掘恐惧的真正意义。 使用 CATHODE™ 引擎打造。"
// L1: "ja":"絶え間ない不安と死の危険の気配が迫る『Alien: Isolation』で真の恐怖を味わおう。 CATHODE™エンジンを使用して制作。"
// L1: "es":"Descubre el verdadero significado del terror en Alien: Isolation, un juego de horror y supervivencia que transcurre en un ambiente de constante tensión y peligro. Creado con el motor de juego CATHODE™."
// L1: "store":"epic"
// L1: "ext_id":"8f80897c0b6e4e678fed08da169d44be"
// L1: "name":"Castlevania Anniversary Collection"
// L1: "url":"https://store.epicgames.com/p/32b3e0adbe0c4399be1874958194f97f"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/1ff2f74ba0ef4019b6905d8abe268819/castlevania-anniversary-collection-yex6f.jpg"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"KONAMI"
// L1: "release":null
// L1: "desc":
// L1: "en":"Konami's Castlevania Anniversary Collection traces the origins of the historic vampire franchise. Included is a unique eBook with details provided by developers, artists and others inspired by the Castlevania legacy which sheds a fresh light into the world of Castlevania."
// L1: "fr":"La collection Konami Castlevania Collection retrace les origines de la franchise du célèbre vampire."
// L1: "zh-CN":"Konami's Castlevania Anniversary Collection traces the origins of the historic vampire franchise. Included is a unique eBook with details provided by developers, artists and others inspired by the Castlevania legacy which sheds a fresh light into the world of Castlevania."
// L1: "ja":"コナミグループ創業50周年を記念し、珠玉の名作を集めた「アニバーサリーコレクション」が登場！　本作ではムチを武器に魔王ドラキュラに挑むホラーアクション「悪魔城ドラキュラ」シリーズの初期８タイトルに加え、秘蔵の開発資料を見られる大ボリュームの「ボーナスブック」を収録。"
// L1: "es":"Konami's Castlevania Anniversary Collection traces the origins of the historic vampire franchise. Included is a unique eBook with details provided by developers, artists and others inspired by the Castlevania legacy which sheds a fresh light into the world of Castlevania."
// L1: "store":"epic"
// L1: "ext_id":"921e40c4c69f4d728914ca2a4f0aa407"
// L1: "name":"Eternal Threads"
// L1: "url":"https://store.epicgames.com/p/a9152a8924cc4e438f0e61106ec02f7d"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/08813e055af64315b8a55b2e521f4e04/eternal-threads-1vm6i.jpg"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"Secret Mode Limited"
// L1: "release":null
// L1: "desc":
// L1: "en":"Eternal Threads is a single-player, first-person story-driven puzzle game of time manipulation, choice and consequence."
// L1: "fr":"Eternal Threads est un jeu de réflexion narratif, solo, en vue subjective, de manipulation temporelle, de choix et de conséquences."
// L1: "zh-CN":"《无穷时线》是一款关于时间操纵、选择和结果的第一人称剧情驱动型单机解谜游戏。"
// L1: "ja":"『Eternal Threads』は、時間を操作し、選択することで、結末を変えていく、シングルプレイでストーリー主体のパズルゲームです。"
// L1: "es":"Eternal Threads es un juego de puzles en primera persona narrativo de un jugador que trata de manipulación temporal, decisiones y consecuencias."
// L1: "store":"epic"
// L1: "ext_id":"be5600439b434624802764f704755cde"
// L1: "name":"Ghostrunner 2"
// L1: "url":"https://store.epicgames.com/p/ghostrunner-2"
// L1: "cover":"https://cdn1.epicgames.com/offer/708f57aaa04b42ef885be16c8288f0ac/EGS_Ghostrunner2_OneMoreLevel_S1_2560x1440-15845148fae1d0cfd7f3e98c9b3ba6ba"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"505 Games"
// L1: "release":null
// L1: "desc":
// L1: "en":"Ghostrunner 2 is a hardcore FPP slasher set in a post-apocalyptic, cyberpunk world. Featuring everything fans loved about Ghostrunner plus incredible boss fights, new interactive story, thrilling motorbike levels, improved skills, and more cyber ninja action. "
// L1: "fr":"Ghostrunner 2 est un slasher FPP intense se déroulant dans un monde cyberpunk post-apocalyptique. Il comprend tout ce que les fans ont adoré dans Ghostrunner, avec en plus des combats de boss, une nouvelle histoire interactive, des niveaux en moto palpitants, des compétences améliorées et plus d'act"
// L1: "zh-CN":"《幽灵行者 2》是第一人称视角硬核砍杀游戏的续作，故事背景设定在后世界末日的赛博朋克世界。游戏延续了《幽灵行者》粉丝喜爱的所有内容，包括精彩绝伦的 BOSS 战、全新的可互动式剧情主线、刺激的摩托车关卡、重新优化的技能以及更多生化忍者的打斗场面。 "
// L1: "ja":"『ゴーストランナー 2』は、サイバーパンクの街を駆け抜けるハードコアFPPアクションゲーム！『ゴーストランナー』で好評だった要素に加え、熾烈なボス戦、没入感あふれる新たなストーリー、迫力満点のバイクステージ、改良されたスキル、サイバー忍者アクションが集結！ "
// L1: "es":"Ghostrunner 2 es acción hardcore en primera persona con katanas en un mundo ciberpunk postapocalíptico. Con lo que gustó de Ghostrunner e increíbles batallas contra jefes, más habilidades, una historia interactiva, niveles en moto y más acción ciberninja. "
// L1: "store":"epic"
// L1: "ext_id":"9975548b6d404a94b8a9bdb34cad49e9"
// L1: "name":"Knightica"
// L1: "url":"https://store.epicgames.com/p/72b46f5d95624fd5b7e7d81b7dcaead1"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/357100ca5613420e98208c5f14585e9d/knightica-1nuxm.png"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":true
// L1: "developer":"Goblinz Studio SAS"
// L1: "release":null
// L1: "desc":
// L1: "en":"Recruit units, place them strategically, and find the synergies in this Roguelike AutoBattler!\nKnightica lets you guide a warband through challenges to free the Kingdoms.\nDiscover combinations, weave powerful enchants, face dangerous monsters, and lead your army to victory!"
// L1: "fr":"Recrutez des unités puissantes, placez-les stratégiquement et trouvez les meilleures synergies dans cet Autobattler Roguelike !\nKnightica vous permet de guider une bande à travers de nombreux défis pour libérer les royaumes.\nDécouvrez des combinaisons optimales, tissez de puissants enchantements, af"
// L1: "zh-CN":"在这款类Rogue自走棋游戏中，征招强大单位，悉心排兵布阵，调整策略，充分发掘军队的协同效果！\n 在《Knightica》中，你将指挥一整支战团，跨越重重挑战，最后解放王国。\n 优化组合方案，巧用附魔法术，迎战危险怪物，最终带领你的军队走向胜利！"
// L1: "ja":"強力なユニットを戦略的に配置して、シナジーを得るローグライク・オートバトラー。\n目的は戦隊を率いて数々の敵に挑み、王国を解放すること。\n部隊の最適な組み合わせを見つけ、強力な魔法を編み出し、危険なモンスターと対決して、自軍を勝利に導こう！"
// L1: "es":"Recluta unidades, sitúalas estratégicamente y descubre sinergias increíbles en este roguelike con luchas automáticas.\nEn Knightica, liderarás un ejército y superarás retos para liberar los Reinos.\nEncuentra combinaciones óptimas, crea encantamientos, enfréntate a monstruos ¡y álzate con la victoria!"
// L1: "store":"epic"
// L1: "ext_id":"944b5b5d646d46bc92bc33edfe983d26"
// L1: "name":"LISA: The Definitive Edition"
// L1: "url":"https://store.epicgames.com/p/lisa-the-definitive-edition"
// L1: "cover":"https://cdn2.unrealengine.com/egs-lisathedefinitiveedition-dingalingproductions-bundles-s1-2560x1440-5be18c558828.jpg"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"Serenity Forge"
// L1: "release":null
// L1: "desc":
// L1: "en":"Explore Olathe and unmask its twisted secrets with LISA: The Definitive Edition, including the original narrative-driven RPG LISA: The Painful and its sequel LISA: The Joyful."
// L1: "fr":"Explorez Olathe et découvrez ses terribles secrets avec LISA: Definitive Edition, qui contient le jeu de rôle narratif d'origine LISA: The Painful et sa suite, LISA: The Joyful."
// L1: "zh-CN":"入手《LISA: Definitive Edition》，探索 Olathe，揭开背后隐藏的扭曲秘密。Definitive Edition 包括叙事驱动角色扮演原作《LISA: The Painful》及续作《LISA: The Joyful》。"
// L1: "ja":"オレイサを探索し、オリジナルのストーリー重視のRPG『LISA: The Painful』とその続編『LISA: The Joyful』を収録した『LISA: Definitive Edition』で、倒錯した謎を明かそう。"
// L1: "es":"Explora Olathe y descubre sus retorcidos secretos con LISA: Definitive Edition, que incluye el RPG narrativo original LISA: The Painful y su secuela, LISA: The Joyful."
// L1: "store":"epic"
// L1: "ext_id":"4a88d0dc64114b20b67339c74543f859"
// L1: "name":"Lost Castle: The Old Ones Awaken"
// L1: "url":"https://store.epicgames.com/p/lost-castle-the-old-ones-awaken"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/a6d76157ad884f2c9aa470b30da9e2ff/lost-castle-r390n.png"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"Another Indie Studio Limited"
// L1: "release":null
// L1: "desc":
// L1: "en":"The Old Ones Awaken adds new levels to explore, new enemies to defeat, and new bosses to face along with a host exciting new weapons and equipment to wield and wear."
// L1: "fr":"Les Chasseurs de trésor ont creusé trop profondément sous Castle Harwood, et les voilà dans des lieux qui n’auraient jamais dû sortir de l’oubli."
// L1: "zh-CN":"“遗迹的守护者” DLC中包含了两张全新的地图等你来挑战！"
// L1: "ja":"Old Ones Awakenには、新たなレベルが含まれています！"
// L1: "es":"¡The Old Ones Awaken incluye nuevos niveles que explorar!"
// L1: "store":"epic"
// L1: "ext_id":"c76046dddcdb43619c33ce0395941033"
// L1: "name":"Luftrausers"
// L1: "url":"https://store.epicgames.com/p/luftrausers"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/85ddeeec9d4243b3a2d78aab87bfae7f/luftrausers-1mxb1.png"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"Devolver Digital, Inc."
// L1: "release":null
// L1: "desc":
// L1: "en":"The skies are aflame and the seas will overflow with wreckage in Vlambeer’s stylish arcade shooter LUFTRAUSERS! Take to the skies in customized fighter planes to battle battleships, submarines, and rival aces for glory, honor, and high scores."
// L1: "fr":"The skies are aflame and the seas will overflow with wreckage in Vlambeer’s stylish arcade shooter LUFTRAUSERS! Take to the skies in customized fighter planes to battle battleships, submarines, and rival aces for glory, honor, and high scores."
// L1: "zh-CN":"The skies are aflame and the seas will overflow with wreckage in Vlambeer’s stylish arcade shooter LUFTRAUSERS! Take to the skies in customized fighter planes to battle battleships, submarines, and rival aces for glory, honor, and high scores."
// L1: "ja":"The skies are aflame and the seas will overflow with wreckage in Vlambeer’s stylish arcade shooter LUFTRAUSERS! Take to the skies in customized fighter planes to battle battleships, submarines, and rival aces for glory, honor, and high scores."
// L1: "es":"The skies are aflame and the seas will overflow with wreckage in Vlambeer’s stylish arcade shooter LUFTRAUSERS! Take to the skies in customized fighter planes to battle battleships, submarines, and rival aces for glory, honor, and high scores."
// L1: "store":"epic"
// L1: "ext_id":"1f9a12b06b4f437790b6913ad136a08c"
// L1: "name":"Mark of the Deep"
// L1: "url":"https://store.epicgames.com/p/2fd257a6cd80405a833f9004ff07993a"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/83a240506a884c10ad8fb99694e57a0d/mark-of-the-deep-w1ygr.png"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"Light Up Games"
// L1: "release":null
// L1: "desc":
// L1: "en":"Mark of the Deep is an epic pirate-themed adventure with a strong narrative and a thrilling mix of Metroidvania and Souls-Like elements. Embark on this journey, explore the mysteries of a cursed island and find your missing pirate crew!"
// L1: "fr":"Mark of the Deep est une aventure épique sur le thème des pirates, dotée d'une narration captivante et d'un mélange palpitant de Metroidvania et de souls-like. Lancez-vous dans ce périple, explorez les mystères d'une île maudite et retrouvez votre équipage de pirates disparu !"
// L1: "zh-CN":"深渊之印是一款史诗般的海盗冒险游戏，拥有强烈的叙事性，并融合了广受好评的银河恶魔城游戏与魂系游戏的惊险元素。以海盗刘琦的身份踏上旅程，探索受诅咒岛屿的奥秘，寻找失踪的海盗船员！"
// L1: "ja":"『Mark of the Deep』は、緻密なストーリー展開と、高く評価されているメトロイドヴァニアやソウルライクゲームの要素を組み合わせた壮大な海賊アドベンチャーです。プレイヤーは海賊ルーキーとして、呪われた島の謎を解き明かし、行方不明の仲間たちを探し出す旅に出ることになります！"
// L1: "es":"Mark of the Deep es una épica aventura pirata con fuerte narrativa y una emocionante mezcla de elementos de juegos Metroidvania y Souls-Like. ¡Embárcate en este viaje en la piel del pirata Rookie, explora los misterios de una isla maldita y encuentra a tus compañeros perdidos!"
// L1: "store":"epic"
// L1: "ext_id":"d3e5b556640144bfa5de2d5d3b283d68"
// L1: "name":"Model Builder: Complete Edition"
// L1: "url":"https://store.epicgames.com/p/3f18c54a6e00424ba6e8f4422167cac7"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/7472ec268e344e77a85e95976c0ffc6d/model-builder-1vfgr.png"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"Green Man Gaming Publishing"
// L1: "release":null
// L1: "desc":
// L1: "en":"Join the latest trend in simulation games, bring out your creativity and make awesome-looking models with the base game and all available DLCs. Assemble, customize and display your creations, whether you’re a veteran or a novice. Get building, and get creative!"
// L1: "fr":"Join the latest trend in simulation games, bring out your creativity and make awesome-looking models with the base game and all available DLCs. Assemble, customize and display your creations, whether you’re a veteran or a novice. Get building, and get creative!"
// L1: "zh-CN":"Join the latest trend in simulation games, bring out your creativity and make awesome-looking models with the base game and all available DLCs. Assemble, customize and display your creations, whether you’re a veteran or a novice. Get building, and get creative!"
// L1: "ja":"Join the latest trend in simulation games, bring out your creativity and make awesome-looking models with the base game and all available DLCs. Assemble, customize and display your creations, whether you’re a veteran or a novice. Get building, and get creative!"
// L1: "es":"Join the latest trend in simulation games, bring out your creativity and make awesome-looking models with the base game and all available DLCs. Assemble, customize and display your creations, whether you’re a veteran or a novice. Get building, and get creative!"
// L1: "store":"epic"
// L1: "ext_id":"f967cff9761c4198b4e972cfd71e40d7"
// L1: "name":"Monument Valley"
// L1: "url":"https://store.epicgames.com/p/monument-valley-02"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/e56a7411805046d3b5b7253a6e4e0faa/monument-valley-1gys5.jpg"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"ustwo games"
// L1: "release":null
// L1: "desc":
// L1: "en":"Embark on a journey of forgiveness through impossible environments and illusionary puzzles. Experience this meditative and calming puzzle game by manipulating monuments and creating evolving paths to explore new, surreal, and mysterious worlds."
// L1: "fr":"Embarquez pour une odyssée rédemptrice à travers des environnements invraisemblables et des casse-tête trompeurs. Dans ce jeu de réflexion méditatif et apaisant, manipulez des monuments et formez des chemins évolutifs pour explorer de nouveaux mondes surréalistes et mystérieux."
// L1: "zh-CN":"踏上宽恕之旅，穿越几乎不可能破解的环境和幻想谜题。操纵纪念碑、创建不断发展的道路，探索全新超现实且神秘的世界，体验这款冥想且平静的解谜游戏。"
// L1: "ja":"奇想天外な環境を進み、目を惑わすパズルを解きながら、許しの旅へと出かけましょう。この瞑想的なパズルゲームでモニュメントを操作し、展開する道を作りながら、斬新かつシュールで神秘的な世界を探検しましょう。"
// L1: "es":"Embárcate en un viaje de perdón a través de entornos imposibles y rompecabezas ilusorios. Sumérgete en este juego de rompecabezas meditativo y relajante, donde manipulas monumentos y creas caminos en constante evolución para explorar mundos nuevos, surrealistas y misteriosos."
// L1: "store":"epic"
// L1: "ext_id":"af6b823b8698465f9aedc3bddf2e8686"
// L1: "name":"TerraScape"
// L1: "url":"https://store.epicgames.com/p/f229ed53ddba40788e0ab62978e9eaf9"
// L1: "cover":"https://cdn1.epicgames.com/spt-assets/a740a2eed807469f88b9dff17e7cd3a3/terrascape-j7p8d.png"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"Bitfall Studios GmbH"
// L1: "release":null
// L1: "desc":
// L1: "en":"Build gorgeous kingdoms on floating islands by strategically placing buildings in this cozy, medieval City-Puzzler. Discover secret combinations, take on monthly challenges and explore randomly generated maps in various single- and multiplayer game modes."
// L1: "fr":"Bâtissez de magnifiques royaumes sur des îles flottantes en plaçant vos bâtiments avec stratégie dans ce puzzle de construction médiéval chaleureux. Découvrez des combinaisons secrètes, relevez des défis hebdomadaires et explorez des cartes générées aléatoirement dans différents modes solo et multij"
// L1: "zh-CN":"在这款温馨惬意的中世纪城市建造解谜游戏中，通过合理布局建筑，在浮空岛屿上打造壮丽王国。发现隐藏组合，挑战每周任务，并在多种单人和多人游戏模式中探索随机生成的地图。"
// L1: "ja":"心地よい中世の街づくりパズルで、建物を戦略的に配置しながら浮遊島に美しい王国を築きましょう。秘密の組み合わせを発見し、ウィークリーチャレンジに挑戦し、さまざまなソロおよびマルチプレイモードで自動生成マップを探索できます。"
// L1: "es":"Construye reinos espectaculares sobre islas flotantes colocando edificios estratégicamente en este acogedor rompecabezas de construcción medieval. Descubre combinaciones secretas, enfréntate a desafíos semanales y explora mapas generados de forma procedimental en distintos modos para un jugador y mu"
// L1: "store":"epic"
// L1: "ext_id":"1f723b00df58467998c4984ca39915ad"
// L1: "name":"Them's Fightin' Herds"
// L1: "url":"https://store.epicgames.com/p/thems-fightin-herds"
// L1: "cover":"https://cdn1.epicgames.com/offer/a567c32599bf4d4fb609e424f3691b39/EGS_ThemsFightinHerds_Mane6Inc_S1_2560x1440-da3a940faafe30c602d3966d2c295825"
// L1: "platforms":["windows"]
// L1: "genres":[]
// L1: "free":false
// L1: "developer":"Gameplay Group International Inc."
// L1: "release":null
// L1: "desc":
// L1: "en":"Them's Fightin' Herds"
// L1: "fr":"Them's Fightin' Herds"
// L1: "zh-CN":"Them's Fightin' Herds"
// L1: "ja":"Them's Fightin' Herds"
// L1: "es":"Them's Fightin' Herds"
// L1: "store":"steam"
// L1: "ext_id":"2784470"
// L1: "name":"9 Kings"
// L1: "url":"https://store.steampowered.com/app/2784470"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2784470/640a138fbc6918daa276a4653360eca9e4488b65/header.jpg?t=1794518469"
// L1: "platforms":["windows","mac"]
// L1: "genres":["RPG","Strategy"]
// L1: "free":false
// L1: "developer":"Sad Socket"
// L1: "release":"Nov 12, 2026"
// L1: "desc":
// L1: "en":"A fast-paced roguelike kingdom builder. Grow your empire and fight massive battles against powerful rival kings. Break the game with thousands of insane builds to become the King of Kings."
// L1: "fr":"Bâtissez votre royaume dans ce roguelike effréné. Étendez votre empire et livrez des batailles homériques contre de puissants rivaux royaux. Cassez le jeu avec des milliers de decks démentiels pour régner sans partage."
// L1: "zh-CN":"一款快节奏的王国建造类Roguelike游戏，数百张独特卡牌，数千种疯狂构筑，突破游戏规则……与九王史诗对决、赢得战斗、扩展帝国，成就众王之王！"
// L1: "ja":"高速ペースのローグライク王国建設ゲーム。帝国を成長させ、対立する強力な王たちと大規模な戦いを繰り広げろ。無数の常識外れの組み合わせでゲームをぶち壊し、王の中の王となれ。"
// L1: "es":"Levanta tu imperio en este trepidante constructor de reinos roguelike. Libra cruentas batallas contra tus homónimos rivales. Explota las mecánicas con cientos de construcciones increíbles para convertirte en el rey de reyes."
// L1: "store":"steam"
// L1: "ext_id":"5240510"
// L1: "name":"Altertum"
// L1: "url":"https://store.steampowered.com/app/5240510"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5240510/0dbd6f79ed869bd6e12e042a64faf0a53b09a917/header.jpg?t=1794560385"
// L1: "platforms":["windows"]
// L1: "genres":["Indie","RPG"]
// L1: "free":false
// L1: "developer":"AltertumStudio"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"An exploratory RPG where you freely roam the surface and dungeons, craft gear, customize your home, and travel at your own pace while uncovering hidden history amid the turmoil surrounding the Empire's historical records."
// L1: "fr":"An exploratory RPG where you freely roam the surface and dungeons, craft gear, customize your home, and travel at your own pace while uncovering hidden history amid the turmoil surrounding the Empire's historical records."
// L1: "zh-CN":"An exploratory RPG where you freely roam the surface and dungeons, craft gear, customize your home, and travel at your own pace while uncovering hidden history amid the turmoil surrounding the Empire's historical records."
// L1: "ja":"地上とダンジョンを自由に探索しつつ、入手した素材で装備や道具を製造したり、自分の家をカスタマイズしたり、旅人となり自由に旅をしつつ、帝国が管理する歴史書を巡って巻き起こる騒動を追いかけ、隠された歴史を紐解いていく探索系ハクスラRPG。"
// L1: "es":"An exploratory RPG where you freely roam the surface and dungeons, craft gear, customize your home, and travel at your own pace while uncovering hidden history amid the turmoil surrounding the Empire's historical records."
// L1: "store":"steam"
// L1: "ext_id":"5477110"
// L1: "name":"Ascension Tournament"
// L1: "url":"https://store.steampowered.com/app/5477110"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5477110/4f2d2dc1c493e209cff3377a5e0566426c06a608/header.jpg?t=1793664913"
// L1: "platforms":["windows"]
// L1: "genres":["Indie","Strategy"]
// L1: "free":false
// L1: "developer":"仙大工作室"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"Xianxia auto-battler: 42 cultivators, 7 elements, 14 bonds. Eight teams, 100 Embers each — lose them all and you are out. No fixed finish line: fight until you ascend or fall. Your rivals are real lineups left by other players — AI stand-ins when the player pool is thin."
// L1: "fr":"Xianxia auto-battler: 42 cultivators, 7 elements, 14 bonds. Eight teams, 100 Embers each — lose them all and you are out. No fixed finish line: fight until you ascend or fall. Your rivals are real lineups left by other players — AI stand-ins when the player pool is thin."
// L1: "zh-CN":"修仙自走棋锦标赛：42 位仙家弟子、7 大元素、14 种羁绊、224种独特功法，自由搭配队伍、洗练功法，无数种可能。8 队各持 100 火种，输光即出局——没有固定终点，一直打到登顶或陨落。你的对手是历代玩家留下的真实阵容，人手不足时由 AI 补位。"
// L1: "ja":"Xianxia auto-battler: 42 cultivators, 7 elements, 14 bonds. Eight teams, 100 Embers each — lose them all and you are out. No fixed finish line: fight until you ascend or fall. Your rivals are real lineups left by other players — AI stand-ins when the player pool is thin."
// L1: "es":"Xianxia auto-battler: 42 cultivators, 7 elements, 14 bonds. Eight teams, 100 Embers each — lose them all and you are out. No fixed finish line: fight until you ascend or fall. Your rivals are real lineups left by other players — AI stand-ins when the player pool is thin."
// L1: "store":"steam"
// L1: "ext_id":"2406770"
// L1: "name":"Bodycam"
// L1: "url":"https://store.steampowered.com/app/2406770"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2406770/36264077393918f3945447eed3d6374cdf21e69a/header.jpg?t=1794250615"
// L1: "platforms":["windows"]
// L1: "genres":["Action","Indie","Massively Multiplayer","Simulation","Strategy","Early Access"]
// L1: "free":false
// L1: "developer":"Reissad"
// L1: "release":"Jun 7, 2024"
// L1: "desc":
// L1: "en":"Bodycam is the first tactical multiplayer FPS with a true body-camera view in Unreal Engine 5. Close-quarters combats feel raw and loud. Every angle, callout, and bullet matters. Play Deathmatch, Team Deathmatch, and Wingman on photoreal maps where teamplay, tactics, and clutch skill are key."
// L1: "fr":"Bodycam est le premier FPS multijoueur tactique avec une véritable vue de caméra corporelle dans Unreal Engine 5. Les combats rapprochés semblent bruts et bruyants. Chaque angle, légende et puce compte. Jouez à Deathmatch, Team Deathmatch et Wingman sur des cartes photoréalistes où le jeu d'équipe."
// L1: "zh-CN":"Bodycam 是虚幻引擎 5 中第一款具有真实随身摄像机视图的战术多人 FPS。近距离战斗感觉原始而响亮。每个角度、标注和项目符号都很重要。在逼真的地图上玩死亡竞赛、团队死亡竞赛和僚机，其中团队合作、战术和关键技能是关键没有准星、弹药计数器或 HUD。团队协作与战术决策将决定胜负。每一次交火都要求你保持冷静、精准并迅速行动。沉浸在逼真的战场中，与队友配合完成任务。在瞬息万变的战局中，善用掩体、聆听声音并掌握每个关键时刻。"
// L1: "ja":"Bodycam は、Unreal Engine 5 での真のボディカメラ ビューを備えた初の戦術的マルチプレイヤー FPS です。接近戦は生々しくて騒々しいように感じられます。あらゆる角度、吹き出し、箇条書きが重要です。チームプレイ、戦術、クラッチ スキルが鍵となるフォトリアル マップで、デスマッチ、チーム デスマッチ、ウィングマンをプレイします HUDはありません。チームワークと戦術が勝敗を分けます。"
// L1: "es":"Bodycam es el primer FPS táctico multijugador con una vista real de la cámara corporal en Unreal Engine 5. Los combates cuerpo a cuerpo se sienten crudos y ruidosos. Cada ángulo, leyenda y viñeta importa. Juega Deathmatch, Team Deathmatch y Wingman en mapas fotorrealistas donde el juego en equipo."
// L1: "store":"steam"
// L1: "ext_id":"4435490"
// L1: "name":"Call of Duty®: Modern Warfare® 4"
// L1: "url":"https://store.steampowered.com/app/4435490"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4435490/0c492be3204835d71e8b454b6eb1817f8ff68c0d/header.jpg?t=1794339680"
// L1: "platforms":["windows"]
// L1: "genres":["Action"]
// L1: "free":false
// L1: "developer":"Infinity Ward"
// L1: "release":"Oct 22, 2026"
// L1: "desc":
// L1: "en":"War erupts on the Korean Peninsula as North Korea launches an invasion that threatens to destabilize the world in Call of Duty®: Modern Warfare® 4."
// L1: "fr":"La péninsule coréenne entre en guerre tandis que la Corée du Nord lance une invasion de grande envergure qui pourrait bien bouleverser le monde entier dans Call of Duty®: Modern Warfare® 4."
// L1: "zh-CN":"在《使命召唤®：现代战争® 4》中，朝鲜发动全面侵袭，半岛爆发战争，世界岌岌可危。"
// L1: "ja":"「Call of Duty®: Modern Warfare® 4」では、朝鮮半島で戦争が勃発。北朝鮮が大規模侵攻に踏み切り、世界情勢を揺るがす脅威が広がっていく。"
// L1: "es":"La guerra estalla en la península de Corea cuando Corea del Norte lanza una invasión a gran escala que amenaza con desestabilizar el mundo en Call of Duty®: Modern Warfare® 4."
// L1: "store":"steam"
// L1: "ext_id":"4576490"
// L1: "name":"Casualties: Unknown"
// L1: "url":"https://store.steampowered.com/app/4576490"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4576490/907888dce73f50c48410b5ab92971a0d95776b29/header.jpg?t=1794232782"
// L1: "platforms":["windows"]
// L1: "genres":["Action","Adventure","Simulation"]
// L1: "free":false
// L1: "developer":"Orsoniks"
// L1: "release":"Nov 9, 2026"
// L1: "desc":
// L1: "en":"Casualties: Unknown is an unforgiving cave-exploration survival simulator. Your captors have tasked you with retrieving lost cargo on a foreign planet, explore its 11 layers and do your best to survive diverse hostile environments. You are just one of the thousands of test subjects sent to die."
// L1: "fr":"Casualties: Unknown est un simulateur de survie et de spéléologie. Vos capteurs vous envoient récupérer un chargement sur une planète inconnue où vous devrez réchapper aux environnements hostiles répartis sur 11 strates. Vous n'êtes que l'un des milliers de cobayes envoyés à une mort certaine."
// L1: "zh-CN":"《Casualties: Unknown》是一款残酷无情的洞穴探险生存游戏。身为俘虏的你被派到异星上找回丢失的货物，你需要探索这颗星球的全部11层洞穴，在各色恶劣环境中奋力求生。而你实际上只是成千上万被派来送死的实验体之一。"
// L1: "ja":"『Casualties: Unknown』は過酷な洞窟環境を探索するサバイバルシミュレーション。囚われの身となったあなたは、未知の惑星で失われた貨物を回収する任務を課せられる。11層からなる階層を探索し、多種多様で過酷な環境で生き延びろ。あなたは死んだところで気にも留められない、何千もの被験者の1人に過ぎないのだが…"
// L1: "es":"Casualties: Unknown is an unforgiving cave-exploration survival simulator. Your captors have tasked you with retrieving lost cargo on a foreign planet, explore its 11 layers and do your best to survive diverse hostile environments. You are just one of the thousands of test subjects sent to die."
// L1: "store":"steam"
// L1: "ext_id":"4651080"
// L1: "name":"CelSector"
// L1: "url":"https://store.steampowered.com/app/4651080"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4651080/6c4ee73b627c590e950ede978cf005eaa6b2d0a8/header.jpg?t=1794513521"
// L1: "platforms":["windows"]
// L1: "genres":["Action"]
// L1: "free":false
// L1: "developer":"YumamiSoft"
// L1: "release":"Nov 12, 2026"
// L1: "desc":
// L1: "en":"A 2D sci-fi action side-scroller where you fight to survive a facility overrun by biological nightmares. Blast through enemies with an arsenal of firearms, deeply customize your character's appearance, and avoid hazards, traps, and mutations."
// L1: "fr":"A 2D sci-fi action side-scroller where you fight to survive a facility overrun by biological nightmares. Blast through enemies with an arsenal of firearms, deeply customize your character's appearance, and avoid hazards, traps, and mutations."
// L1: "zh-CN":"这是一款2D科幻横版动作游戏。在一座被生物梦魇占领的设施中，你必须为了生存而战。用丰富的枪械武器轰碎敌人，深度自定义你的角色外观，并努力避开各种危险、陷阱以及异种突变。"
// L1: "ja":"生物的悪夢に支配された研究施設で生き残りを懸けて戦う、2D SF横スクロールアクションゲーム。多彩な銃器を駆使して敵を粉砕し、キャラクターの見た目を自由にカスタマイズしながら、数々の罠やハザード、そして肉体変異の脅威を回避せよ。"
// L1: "es":"Un juego de acción y ciencia ficción en 2D de desplazamiento lateral donde luchas por sobrevivir en una instalación plagada de pesadillas biológicas. Ábrete paso a tiros con un arsenal de armas de fuego, personaliza profundamente la apariencia de tu personaje y evita peligros, trampas y mutaciones."
// L1: "store":"steam"
// L1: "ext_id":"597170"
// L1: "name":"Clone Drone in the Danger Zone"
// L1: "url":"https://store.steampowered.com/app/597170"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/597170/header.jpg?t=1784069375"
// L1: "platforms":["windows","mac"]
// L1: "genres":["Action","Indie"]
// L1: "free":false
// L1: "developer":"Doborog Games"
// L1: "release":"Jul 27, 2021"
// L1: "desc":
// L1: "en":"Clone Drone in the Danger Zone is a robot voxel slice-em-up where any part of your body can be sliced off. With your mind downloaded into a robot gladiator, you must survive the sinister trials of the arena."
// L1: "fr":"Clone Drone in the Danger Zone is a robot voxel slice-em-up where any part of your body can be sliced off. With your mind downloaded into a robot gladiator, you must survive the sinister trials of the arena."
// L1: "zh-CN":"Clone Drone in the Danger Zone是一款第三人称刀剑格斗游戏，在游戏中你身体的任何部位都有可能被削的七零八落。由于意识被下载到了一个机器人角斗士身上，你必须在斗技场残酷的考验中顽强的活下来。"
// L1: "ja":"『Clone Drone in the Danger Zone』は、体のあらゆる部分を切断できる、三人称視点のソードバトルアクションです。ロボットの剣闘士にインストールされた精神体であるあなたは、アリーナで待ち受ける凶悪な試練の数々を生き残らなければなりません。"
// L1: "es":"Clone Drone in the Danger Zone es un juego de luchas a espada en tercera persona, donde te pueden mutilar cualquier parte del cuerpo. Tu mente ha sido descargada en un robot gladiador y deberás sobrevivir a las siniestras pruebas de la arena de lucha."
// L1: "store":"steam"
// L1: "ext_id":"1289670"
// L1: "name":"EA Play"
// L1: "url":"https://store.steampowered.com/app/1289670"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1289670/ceda3c4ec3c3f9e0f9d64d9a8edf392a8a445f26/header.jpg?t=1793118321"
// L1: "platforms":["windows"]
// L1: "genres":["Action","Sports"]
// L1: "free":false
// L1: "developer":"Electronic Arts"
// L1: "release":"Aug 31, 2020"
// L1: "desc":
// L1: "en":"Unlock a world of thrill. Get unlimited access to a collection of EA’s top titles, trials of select new games, &amp; member discounts and rewards*."
// L1: "fr":"Découvrez un monde de sensations fortes. Profitez d'un accès illimité à une collection des meilleurs titres EA, des essais sur une sélection de nouveaux jeux, ainsi que des réductions et des récompenses pour les membres*."
// L1: "zh-CN":"解锁精彩世界。获取 EA 顶级游戏的无限畅玩权利、精选新游戏的试玩版及会员折扣与奖励*。"
// L1: "ja":"スリルあふれる世界をアンロック。EAのトップタイトルのコレクションや選り抜きの新作ゲームのトライアル、メンバー割引や報酬*を無制限に楽しもう。"
// L1: "es":"Desbloquea un mundo de emociones. Obtén acceso ilimitado a una colección de los mejores títulos de EA, pruebas de una selección de títulos nuevos, y descuentos y recompensas para miembros*."
// L1: "store":"steam"
// L1: "ext_id":"4758990"
// L1: "name":"Faraday Corridors"
// L1: "url":"https://store.steampowered.com/app/4758990"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4758990/a7f3b106f76e740fd61dccd208150f6cccb2f89e/header.jpg?t=1794558789"
// L1: "platforms":["windows","mac","linux"]
// L1: "genres":["Casual","Indie"]
// L1: "free":false
// L1: "developer":"Uralys Studio"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"A brain-teasing puzzle game with a speedrun twist. Flip switches, rotate cells and guide your pawns to the exit. Then do it again, but faster."
// L1: "fr":"Un jeu de réflexion qui vire au contre-la-montre. Actionnez des interrupteurs, faites pivoter des cellules et guidez vos pions jusqu'à la sortie. Puis recommencez, mais plus vite."
// L1: "zh-CN":"一款烧脑解谜游戏，解开之后就是速通挑战。 拨动开关、旋转格子，引导你的棋子抵达出口。 然后再来一次，这次更快。"
// L1: "ja":"スピードランの要素を秘めた、頭を使うパズルゲーム。 スイッチを切り替え、セルを回転させ、駒を出口へ導こう。 そしてもう一度、今度はもっと速く。"
// L1: "es":"Un juego de puzles de ingenio que se convierte en una carrera contrarreloj. Acciona interruptores, gira celdas y guía a tus fichas hasta la salida. Y luego, otra vez, pero más rápido."
// L1: "store":"steam"
// L1: "ext_id":"5361230"
// L1: "name":"Goblin And Glory"
// L1: "url":"https://store.steampowered.com/app/5361230"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5361230/c78c945209470c238459045f24cdaa6632b6fcb4/header.jpg?t=1794560634"
// L1: "platforms":["windows"]
// L1: "genres":["Casual","Strategy"]
// L1: "free":false
// L1: "developer":"DS Games"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"Build your goblin crew, upgrade your sword, and fight through 10 dungeons! Goblin &amp; Glory is a pixel-art clicker game with auto-attacking helpers, relic choices, and 60-second boss battles. Earn prestige, unlock permanent abilities, and return stronger with every run."
// L1: "fr":"Build your goblin crew, upgrade your sword, and fight through 10 dungeons! Goblin &amp; Glory is a pixel-art clicker game with auto-attacking helpers, relic choices, and 60-second boss battles. Earn prestige, unlock permanent abilities, and return stronger with every run."
// L1: "zh-CN":"Build your goblin crew, upgrade your sword, and fight through 10 dungeons! Goblin &amp; Glory is a pixel-art clicker game with auto-attacking helpers, relic choices, and 60-second boss battles. Earn prestige, unlock permanent abilities, and return stronger with every run."
// L1: "ja":"Build your goblin crew, upgrade your sword, and fight through 10 dungeons! Goblin &amp; Glory is a pixel-art clicker game with auto-attacking helpers, relic choices, and 60-second boss battles. Earn prestige, unlock permanent abilities, and return stronger with every run."
// L1: "es":"Build your goblin crew, upgrade your sword, and fight through 10 dungeons! Goblin &amp; Glory is a pixel-art clicker game with auto-attacking helpers, relic choices, and 60-second boss battles. Earn prestige, unlock permanent abilities, and return stronger with every run."
// L1: "store":"steam"
// L1: "ext_id":"5406930"
// L1: "name":"Guild of Champions"
// L1: "url":"https://store.steampowered.com/app/5406930"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5406930/90ffbb4be578bd25844aafbaaf6036c375e98a64/header.jpg?t=1794420503"
// L1: "platforms":["windows","linux"]
// L1: "genres":["Indie","Simulation","Sports","Strategy"]
// L1: "free":false
// L1: "developer":"Soft Rot"
// L1: "release":"Coming soon"
// L1: "desc":
// L1: "en":"Run an e-sports organization on the road to Worlds. Sign and trade pro players, set the lineup and training, then draft and command your team in live 5v5 arena matches, or simulate them. Manage money, morale and chemistry season after season."
// L1: "fr":"Run an e-sports organization on the road to Worlds. Sign and trade pro players, set the lineup and training, then draft and command your team in live 5v5 arena matches, or simulate them. Manage money, morale and chemistry season after season."
// L1: "zh-CN":"Run an e-sports organization on the road to Worlds. Sign and trade pro players, set the lineup and training, then draft and command your team in live 5v5 arena matches, or simulate them. Manage money, morale and chemistry season after season."
// L1: "ja":"Run an e-sports organization on the road to Worlds. Sign and trade pro players, set the lineup and training, then draft and command your team in live 5v5 arena matches, or simulate them. Manage money, morale and chemistry season after season."
// L1: "es":"Run an e-sports organization on the road to Worlds. Sign and trade pro players, set the lineup and training, then draft and command your team in live 5v5 arena matches, or simulate them. Manage money, morale and chemistry season after season."
// L1: "store":"steam"
// L1: "ext_id":"5246270"
// L1: "name":"Idle Purrates Clicker"
// L1: "url":"https://store.steampowered.com/app/5246270"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5246270/c2c2c9529fe5a198b70c5cfb20a9eba7b424bbdb/header_alt_assets_0.jpg?t=1794228047"
// L1: "platforms":["windows"]
// L1: "genres":["Casual"]
// L1: "free":false
// L1: "developer":"Storm Trident S.A."
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"Build a fearless feline crew, plunder treasure-filled shores, flip mysterious coins and upgrade your way to fortune! Conquer each beach, blast enemy ships and become the richest purrate captain the seven seas have ever seen."
// L1: "fr":"Build a fearless feline crew, plunder treasure-filled shores, flip mysterious coins and upgrade your way to fortune! Conquer each beach, blast enemy ships and become the richest purrate captain the seven seas have ever seen."
// L1: "zh-CN":"Build a fearless feline crew, plunder treasure-filled shores, flip mysterious coins and upgrade your way to fortune! Conquer each beach, blast enemy ships and become the richest purrate captain the seven seas have ever seen."
// L1: "ja":"Build a fearless feline crew, plunder treasure-filled shores, flip mysterious coins and upgrade your way to fortune! Conquer each beach, blast enemy ships and become the richest purrate captain the seven seas have ever seen."
// L1: "es":"Build a fearless feline crew, plunder treasure-filled shores, flip mysterious coins and upgrade your way to fortune! Conquer each beach, blast enemy ships and become the richest purrate captain the seven seas have ever seen."
// L1: "store":"steam"
// L1: "ext_id":"5011370"
// L1: "name":"Lowbar Legends"
// L1: "url":"https://store.steampowered.com/app/5011370"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5011370/101958b959ed141ad7898c9cc8401bc8d9ab0c61/header.jpg?t=1794483516"
// L1: "platforms":["windows"]
// L1: "genres":["Casual","Indie","Massively Multiplayer","RPG","Simulation","Free To Play"]
// L1: "free":true
// L1: "developer":"Idleforge Games"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"The idle MMO that lives above your Windows taskbar. Chop, smelt, slay and raid with your clan while you work. Every item you loot trades on the Steam Community Market · gear, keys, chests, even the pets. Free to play. No ads, no energy, no subscription."
// L1: "fr":"MMO idle qui vit au-dessus de votre barre des tâches Windows. Coupez, fondez, combattez et raidez avec votre clan tout en travaillant. Tout votre butin s'échange sur le Marché communautaire Steam : équipements, clés, coffres, familiers. Free-to-play, sans pub ni abonnement."
// L1: "zh-CN":"活在你 Windows 任务栏上方的挂机 MMO。工作之余，和你的公会一起砍伐、熔炼、厮杀、突袭。你掠夺到的每件物品都能在 Steam 社区市场交易·装备、钥匙、宝箱，连宠物也不例外。免费游玩。没有广告、没有体力、没有订阅。"
// L1: "ja":"Windowsのタスクバーの上に住むアイドルMMO。仕事の合間に、クランと一緒に伐採し、精錬し、討伐し、レイドしよう。拾ったアイテムはすべてSteamコミュニティマーケットで取引可能·装備、鍵、チェスト、ペットまで。基本プレイ無料。広告なし、スタミナなし、サブスクなし。"
// L1: "es":"El MMO idle que vive sobre tu barra de tareas de Windows. Tala, funde, combate y haz raids con tu clan mientras trabajas. Todo lo que lootees se intercambia en el Mercado de la Comunidad de Steam · equipo, llaves, cofres, hasta las mascotas. Free-to-play. Sin anuncios, sin energía, sin suscripción."
// L1: "store":"steam"
// L1: "ext_id":"2487190"
// L1: "name":"Main Sequence"
// L1: "url":"https://store.steampowered.com/app/2487190"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2487190/9f75d23dd877267e001e58afe082b7b3eaf53caa/header_alt_assets_1.jpg?t=1794507021"
// L1: "platforms":["windows"]
// L1: "genres":["Indie","Simulation","Strategy","Early Access"]
// L1: "free":false
// L1: "developer":"Tumbling Dumpling Studio"
// L1: "release":"Nov 12, 2026"
// L1: "desc":
// L1: "en":"Main Sequence is a first-person space-sim factory builder where you design spaceships, build space stations, and automate everything. Start with a single ship and grow to become an interstellar industrial empire as you leave your mark on the galaxy."
// L1: "fr":"Main Sequence est un jeu de simulation d'usine spatiale à la première personne où vous concevez des vaisseaux, des stations spatiales et des automatisations. Commencez avec un vaisseau, bâtissez un empire industriel interstellaire et marquez la galaxie."
// L1: "zh-CN":"《Main Sequence》是一款第一人称太空模拟工厂建造游戏。在游戏中，你将设计宇宙飞船、建造空间站，并实现全面自动化。从一艘飞船起步，逐步发展成横跨星际的工业帝国，在银河中留下属于你的印记。"
// L1: "ja":"『Main Sequence』は一人称視点のスペースシミュ・工場作りゲーム。宇宙船を設計したり、宇宙ステーションを建築したり、あらゆるものを自動化できます。一隻の船から駆け出し、銀河を股にかける工業帝国を築き上げ、己の名前を銀河史に刻みましょう。"
// L1: "es":"Main Sequence es un juego de construcción de fábricas y simulador espacial en 1.ª persona en el que diseñas naves, construyes estaciones espaciales y lo automatizas todo. Empieza con una nave, conviértete en un imperio industrial interestelar y deja marca en la galaxia."
// L1: "store":"steam"
// L1: "ext_id":"5378110"
// L1: "name":"One More Lawn"
// L1: "url":"https://store.steampowered.com/app/5378110"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5378110/9ac5251c1c2fd82c9b6fc5205e71dc94f65ec583/header.jpg?t=1794516748"
// L1: "platforms":["windows"]
// L1: "genres":["Casual","Indie","Simulation"]
// L1: "free":false
// L1: "developer":"Superdou"
// L1: "release":"Nov 12, 2026"
// L1: "desc":
// L1: "en":"Mow lawns in first person on a beat-up riding mower, solo or online co-op up to 6 players. You're a grumpy old man who smokes, drinks cheap beer and doesn't care, but leaves perfect stripes. A picky neighbor, an abandoned golf course, an island wedding."
// L1: "fr":"Mow lawns in first person on a beat-up riding mower, solo or online co-op up to 6 players. You're a grumpy old man who smokes, drinks cheap beer and doesn't care, but leaves perfect stripes. A picky neighbor, an abandoned golf course, an island wedding."
// L1: "zh-CN":"Mow lawns in first person on a beat-up riding mower, solo or online co-op up to 6 players. You're a grumpy old man who smokes, drinks cheap beer and doesn't care, but leaves perfect stripes. A picky neighbor, an abandoned golf course, an island wedding."
// L1: "ja":"Mow lawns in first person on a beat-up riding mower, solo or online co-op up to 6 players. You're a grumpy old man who smokes, drinks cheap beer and doesn't care, but leaves perfect stripes. A picky neighbor, an abandoned golf course, an island wedding."
// L1: "es":"Corta el pasto en primera persona arriba de un tractorcito destartalado, solo o en cooperativo online, hasta 6. Eres un viejo gruñón que fuma, toma cerveza barata y no le importa nada, pero deja franjas perfectas. Una vecina exigente, un campo de golf abandonado, una boda en una isla."
// L1: "store":"steam"
// L1: "ext_id":"5485060"
// L1: "name":"PAWHOLD: Idle Desktop Cat Space Game"
// L1: "url":"https://store.steampowered.com/app/5485060"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5485060/d93f6d862fbb5aee209006d0792c6cee6207fa39/header.jpg?t=1793191905"
// L1: "platforms":["windows"]
// L1: "genres":["Casual","Indie","Free To Play"]
// L1: "free":true
// L1: "developer":"Crater Studios"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"Somewhere out there, an AI keeps generating worlds and enemies to conquer mankind. Your cats are on the task. An idle pixel squad shooter that lives along the bottom of your screen while you work: four cat commandos fight, you click to help, bank the bounty and refit the crew."
// L1: "fr":"Quelque part, une IA génère sans fin des mondes et des ennemis pour conquérir l'humanité. Vos chats sont sur le coup. Un shooter idle en pixel art niché en bas de l'écran pendant que vous bossez : quatre chats commandos se battent, vous aidez d'un clic, encaissez les primes et rééquipez l'équipe."
// L1: "zh-CN":"在遥远的某处，一个 AI 正不断生成世界和敌人，企图征服人类。而接下这项任务的，是你的猫咪们。这是一款趁你工作时待在屏幕底部的放置类像素小队射击游戏：四名猫咪突击队员负责战斗，你点点鼠标帮把手，存入赏金，再给小队改装整备。"
// L1: "ja":"どこか遠くで、AIが人類を征服するための世界と敵を生み出し続けている。迎え撃つのは、あなたのネコたち。仕事中、画面の下にずっといてくれる放置系ドット絵スクワッドシューター。4匹のネコ・コマンドーが戦い、あなたはクリックで援護。賞金を預けて、クルーを強化しよう。"
// L1: "es":"En algún lugar, una IA no para de generar mundos y enemigos para conquistar a la humanidad. Tus gatos están en ello. Un shooter idle en pixel art que vive al pie de tu pantalla mientras trabajas: cuatro gatos comando luchan, tú ayudas con clics, cobras las recompensas y reequipas a la tripulación."
// L1: "store":"steam"
// L1: "ext_id":"4911480"
// L1: "name":"Playworlds"
// L1: "url":"https://store.steampowered.com/app/4911480"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4911480/549b741a174608da1aef6a2c05e84f3146c827be/header.jpg?t=1794559145"
// L1: "platforms":["windows","mac"]
// L1: "genres":["Adventure","RPG","Free To Play"]
// L1: "free":true
// L1: "developer":"ElserAI"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"An AI roleplaying adventure shaped by you. Create a character, explore worlds with an AI game master."
// L1: "fr":"An AI roleplaying adventure shaped by you. Create a character, explore worlds with an AI game master."
// L1: "zh-CN":"用你的选择塑造 AI 角色扮演冒险。创建角色，与 AI 游戏主持人探索世界。"
// L1: "ja":"An AI roleplaying adventure shaped by you. Create a character, explore worlds with an AI game master."
// L1: "es":"An AI roleplaying adventure shaped by you. Create a character, explore worlds with an AI game master."
// L1: "store":"steam"
// L1: "ext_id":"5090130"
// L1: "name":"Provinces"
// L1: "url":"https://store.steampowered.com/app/5090130"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5090130/76f327c7317c5f5fba330f461851d778633ad2b3/header.jpg?t=1792598153"
// L1: "platforms":["windows"]
// L1: "genres":["Indie","Strategy"]
// L1: "free":false
// L1: "developer":"PezhetGames"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"Command your one and only army in a compact turn-based strategy played across a medieval war board. Roll for Action Points, cut enemy supply lines, build your realm and storm rival capitals, then watch your tiny soldiers settle the fight in fast automatic battles."
// L1: "fr":"Command your one and only army in a compact turn-based strategy played across a medieval war board. Roll for Action Points, cut enemy supply lines, build your realm and storm rival capitals, then watch your tiny soldiers settle the fight in fast automatic battles."
// L1: "zh-CN":"Command your one and only army in a compact turn-based strategy played across a medieval war board. Roll for Action Points, cut enemy supply lines, build your realm and storm rival capitals, then watch your tiny soldiers settle the fight in fast automatic battles."
// L1: "ja":"Command your one and only army in a compact turn-based strategy played across a medieval war board. Roll for Action Points, cut enemy supply lines, build your realm and storm rival capitals, then watch your tiny soldiers settle the fight in fast automatic battles."
// L1: "es":"Command your one and only army in a compact turn-based strategy played across a medieval war board. Roll for Action Points, cut enemy supply lines, build your realm and storm rival capitals, then watch your tiny soldiers settle the fight in fast automatic battles."
// L1: "store":"steam"
// L1: "ext_id":"5094790"
// L1: "name":"QUTAS67 - Qubic Ultimate Tap Adventure Simulator 2067"
// L1: "url":"https://store.steampowered.com/app/5094790"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5094790/180a49cf6ff5fc3c4f02070e4859a71eaafbc8f8/header.jpg?t=1794560361"
// L1: "platforms":["windows","mac"]
// L1: "genres":["Casual","Free To Play"]
// L1: "free":true
// L1: "developer":"QubicGames"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"QUTAS 67 is a clicker game set in the year 2067, where players build a criminal empire by clicking and hiring managers to rob increasingly larger buildings with the ultimate goal of finally &quot;releasing&quot; the iconic, endlessly delayed game. 6️⃣7️⃣"
// L1: "fr":"QUTAS67 est un jeu de clics situé en 2067. Construisez un empire criminel en cliquant et en recrutant des gérants pour cambrioler des bâtiments toujours plus importants. Votre objectif ultime : enfin « sortir » le jeu culte dont la sortie est repoussée sans cesse. 6️⃣7️⃣"
// L1: "zh-CN":"QUTAS67是一款以2067年为背景的点击游戏。通过不断点击和雇用经理，抢劫规模越来越大的建筑，建立犯罪帝国。最终目标？亲手让那款无数次延期的传奇游戏终于“发售”！6️⃣7️⃣"
// L1: "ja":"QUTAS67は2067年を舞台にしたクリッカーゲーム。クリックとマネージャーの雇用で犯罪帝国を築き、次々と大きな建物を襲おう。最終目標は、延期され続けた伝説のゲームをついに「発売」すること！ 6️⃣7️⃣"
// L1: "es":"QUTAS67 es un juego de clics ambientado en 2067 en el que construyes un imperio criminal haciendo clic y contratando gestores para atracar edificios cada vez más grandes. ¿Tu objetivo final? Conseguir que por fin «salga» el legendario juego que lleva una eternidad retrasándose. 6️⃣7️⃣"
// L1: "store":"steam"
// L1: "ext_id":"3999510"
// L1: "name":"Siren's Well 2"
// L1: "url":"https://store.steampowered.com/app/3999510"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/3999510/ebd0afd37ede0907a5623d7da5aac3c0f8aa842d/header.jpg?t=1794559143"
// L1: "platforms":["windows","linux"]
// L1: "genres":["Action","Adventure"]
// L1: "free":false
// L1: "developer":"OneManOnly Studios"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"&quot;The Crowley blood stains the mansion's hallways, where voices whisper horrors that time tried to bury.&quot;"
// L1: "fr":"&quot;Le sang des Crowley tache les couloirs du manoir, où des voix chuchotent des horreurs que le temps a tenté d'enterrer.&quot;"
// L1: "zh-CN":"&quot;克劳利的血染红了大宅的走廊，声音低语着被时间试图埋葬的恐怖。&quot;"
// L1: "ja":"&quot;クロウリーの血が屋敷の廊下を染め、時が葬ろうとした恐怖の声が囁く。&quot;"
// L1: "es":"&quot;La sangre de los Crowley mancha los pasillos de la mansión, donde voces susurran horrores que el tiempo intentó enterrar.&quot;"
// L1: "store":"steam"
// L1: "ext_id":"4459590"
// L1: "name":"Slotbound"
// L1: "url":"https://store.steampowered.com/app/4459590"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4459590/560f439f789caa08634fbf9ff462c73bf06fbf41/header.jpg?t=1794535601"
// L1: "platforms":["windows","mac"]
// L1: "genres":["Indie","Strategy"]
// L1: "free":false
// L1: "developer":"Optima Arch"
// L1: "release":"Nov 12, 2026"
// L1: "desc":
// L1: "en":"A roguelike auto-battler defense where luck meets strategy. Spin a 3x3 slot machine to summon units and grow your army by absorbing others. Use Items and Cores to manipulate the odds and survive challenging judgement waves and boss waves. Every spin and every choice counts."
// L1: "fr":"Un roguelike de défense autobattler où la chance rencontre la stratégie. Faites tourner une machine à sous 3×3 pour invoquer des unités et renforcez votre armée en absorbant les autres. Utilisez Objets et Noyaux pour influencer les probabilités et survivre aux vagues de jugement et aux boss."
// L1: "zh-CN":"这是一款让运气与策略交织的 Roguelike 自动战斗防守游戏。转动 3x3老虎机来召唤单位，通过吸收其他单位来壮大你的军队。利用道具与核心改变概率、扭转局势，并在危险的审判波次与 Boss 战中生存下来。每一次转动，每一个选择，都至关重要。"
// L1: "ja":"運と戦略が交差する、ローグライト・オートバトラー防衛ゲーム。3x3 スロットマシンを回してユニットを召喚し、仲間を吸収して軍勢を強化しましょう。アイテムとコアを駆使して確率を操り、手強い審判ウェーブやボスウェーブを生き残れ。すべてのスピンと、すべての選択が勝敗を分けます。"
// L1: "es":"Un roguelike de defensa autobattler donde la suerte se une a la estrategia. Gira una tragaperras 3×3 para invocar unidades y fortalece tu ejército absorbiendo otras. Usa Objetos y Núcleos para manipular las probabilidades y supera oleadas de juicio y jefes. Cada giro y decisión cuentan."
// L1: "store":"steam"
// L1: "ext_id":"5496700"
// L1: "name":"Sudoku Supreme"
// L1: "url":"https://store.steampowered.com/app/5496700"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/5496700/5a38056d125cf7cd7e4ff74df5bfd8c5e5f3222d/header.jpg?t=1793630054"
// L1: "platforms":["windows"]
// L1: "genres":["Casual"]
// L1: "free":false
// L1: "developer":"Interloper Games"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"Sudoku, beautifully set. 200 puzzles across four difficulty levels - Easy, Medium, Hard and Supreme. Every puzzle has one unique solution, with difficulty shaped by the logic it takes to solve it."
// L1: "fr":"Le sudoku, avec élégance. 200 grilles réparties en quatre niveaux de difficulté : Facile, Moyen, Difficile et Suprême. Chaque grille a une solution unique, et sa difficulté dépend de la logique nécessaire pour la résoudre."
// L1: "zh-CN":"精致优雅的数独。200 道谜题，分为简单、中等、困难和至尊四个难度。每道谜题都有唯一解，难度取决于解题所需的逻辑技巧。"
// L1: "ja":"美しく仕上げた数独。かんたん・ふつう・むずかしい・スプリームの4つの難易度に200問を収録。どのパズルも答えはひとつで、難易度は解くために必要な論理によって決まります。"
// L1: "es":"Sudoku con una presentación exquisita. 200 rompecabezas en cuatro niveles de dificultad: Fácil, Medio, Difícil y Supremo. Cada rompecabezas tiene una única solución y su dificultad depende de la lógica necesaria para resolverlo."
// L1: "store":"steam"
// L1: "ext_id":"489830"
// L1: "name":"The Elder Scrolls V: Skyrim Special Edition"
// L1: "url":"https://store.steampowered.com/app/489830"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/489830/header.jpg?t=1786648247"
// L1: "platforms":["windows"]
// L1: "genres":["RPG"]
// L1: "free":false
// L1: "developer":"Bethesda Game Studios"
// L1: "release":"Oct 27, 2016"
// L1: "desc":
// L1: "en":"Winner of more than 200 Game of the Year Awards, The Elder Scrolls V: Skyrim Special Edition brings the epic fantasy to life in stunning detail. The Special Edition includes the critically acclaimed game and add-ons with all-new features."
// L1: "fr":"Lauréat de plus de 200 récompenses du Jeu de l'année, The Elder Scrolls V: Skyrim Special Edition donne vie jusque dans ses moindres détails à un univers de fantasy épique. La Special Edition contient le jeu et ses extensions acclamés par la critique ainsi que de nouvelles fonctionnalités."
// L1: "zh-CN":"荣获超过200项年度游戏大奖的《The Elder Scrolls V: Skyrim》推出特别版，以令人惊叹的细致画面带来史诗奇幻巨作。特别版内含大获好评的主游戏、附加内容，还有全新功能。"
// L1: "ja":"200以上のGame of the Yearアワードを獲得した『The Elder Scrolls V: Skyrim Special Edition』は、詳細にわたる描写で無限のファンタジーに命を吹き込みます。Special Editionには高い評価を受けた基本ゲームやアドオンに加え、新しい機能が含まれます。"
// L1: "es":"The Elder Scrolls V: Skyrim Special Edition, ganador de más de 200 premios al “Juego del año”, da vida a la fantasía épica con un nivel de detalle asombroso. La Special Edition incluye el juego aclamado por la crítica y complementos con nuevas funcionalidades."
// L1: "store":"steam"
// L1: "ext_id":"4631070"
// L1: "name":"Vroomity Loops"
// L1: "url":"https://store.steampowered.com/app/4631070"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4631070/14e6bed5ff6fbe46664c8840ae336eff7c42bfab/header.jpg?t=1792786292"
// L1: "platforms":["windows","mac"]
// L1: "genres":["Casual","Indie","Strategy"]
// L1: "free":false
// L1: "developer":"Happy Chimkens"
// L1: "release":"Nov 13, 2026"
// L1: "desc":
// L1: "en":"A 2D puzzle game inspired by the erratic behaviours of Portuguese drivers... especially in roundabouts... because as we all know it, as soon as you enter a roundabout the common sense goes out the window. "
// L1: "fr":"A 2D puzzle game inspired by the erratic behaviours of Portuguese drivers... especially in roundabouts... because as we all know it, as soon as you enter a roundabout the common sense goes out the window. "
// L1: "zh-CN":"A 2D puzzle game inspired by the erratic behaviours of Portuguese drivers... especially in roundabouts... because as we all know it, as soon as you enter a roundabout the common sense goes out the window. "
// L1: "ja":"A 2D puzzle game inspired by the erratic behaviours of Portuguese drivers... especially in roundabouts... because as we all know it, as soon as you enter a roundabout the common sense goes out the window. "
// L1: "es":"A 2D puzzle game inspired by the erratic behaviours of Portuguese drivers... especially in roundabouts... because as we all know it, as soon as you enter a roundabout the common sense goes out the window. "
// L1: "store":"steam"
// L1: "ext_id":"266410"
// L1: "name":"iRacing"
// L1: "url":"https://store.steampowered.com/app/266410"
// L1: "cover":"https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/266410/header.jpg?t=1793718419"
// L1: "platforms":["windows"]
// L1: "genres":["Massively Multiplayer","Racing","Simulation","Sports"]
// L1: "free":false
// L1: "developer":"iRacing.com Motorsport Simulations"
// L1: "release":"Jan 12, 2015"
// L1: "desc":
// L1: "en":"We are the world’s premier motorsports racing game. An iRacing membership provides entry into the newest form of motorsport: internet racing. Internet racing is a fun, easy, and inexpensive way for race fan and gamers alike to enjoy the thrill of the racetrack from the comfort of their home."
// L1: "fr":"We are the world’s premier motorsports racing game. An iRacing membership provides entry into the newest form of motorsport: internet racing. Internet racing is a fun, easy, and inexpensive way for race fan and gamers alike to enjoy the thrill of the racetrack from the comfort of their home."
// L1: "zh-CN":"We are the world’s premier motorsports racing game. An iRacing membership provides entry into the newest form of motorsport: internet racing. Internet racing is a fun, easy, and inexpensive way for race fan and gamers alike to enjoy the thrill of the racetrack from the comfort of their home."
// L1: "ja":"We are the world’s premier motorsports racing game. An iRacing membership provides entry into the newest form of motorsport: internet racing. Internet racing is a fun, easy, and inexpensive way for race fan and gamers alike to enjoy the thrill of the racetrack from the comfort of their home."
// L1: "es":"We are the world’s premier motorsports racing game. An iRacing membership provides entry into the newest form of motorsport: internet racing. Internet racing is a fun, easy, and inexpensive way for race fan and gamers alike to enjoy the thrill of the racetrack from the comfort of their home."

================================================
FILE: aphrody/src/data/suggestions.ts
================================================

// [OUTLINE - 2 symbols, 46 lines]
// L1-L4: interface SuggestionItem
// L22-L46: function getSuggestions(query: string): SuggestionItem[]

================================================
FILE: aphrody/src/design/material-tokens.ts
================================================

// [OUTLINE - 8 symbols, 203 lines]
// import ../../../../assets/brand/gen/symbols/symbols.json
// L8-L38: interface MaterialThemeTokens
// L129: type MaterialBreakpoint = "compact" | "medium" | "expanded";
// L131-L135: function getMaterialBreakpoint(width: number): MaterialBreakpoint
// L137-L151: function getMaterialCssVariables(
// L157-L162: type SymbolEntry =
// L168-L175: function renderMaterialSymbol(
// L195-L197: function m3Vars(t: MaterialThemeTokens): string
// L199-L203: function getMaterialCssSubset(): string

================================================
FILE: aphrody/src/globals.d.ts
================================================

// [OUTLINE - 1 symbols, 45 lines]
// L5-L8: interface ImportMeta

================================================
FILE: aphrody/src/google/config.ts
================================================

// [OUTLINE - 8 symbols, 132 lines]
// L8-L16: interface GoogleEnv
// L18-L27: interface GoogleConfig
// L36-L39: function pick(value: string | undefined, re: RegExp): string | undefined
// L42-L57: function readGoogleConfig(env: GoogleEnv =
// L59-L61: function hasAnyGoogleId(cfg: GoogleConfig): boolean
// L75-L77: function consentScriptTag(): string
// L80-L82: function configScriptTag(cfg: GoogleConfig): string
// L84-L132: function buildCsp(cfg: GoogleConfig): string

================================================
FILE: aphrody/src/google/relay.ts
================================================

// [OUTLINE - 3 symbols, 76 lines]
// L13-L17: interface RelayOptions
// L19-L24: function noContent(state: string): Response
// L26-L76: async function handleCollect(

================================================
FILE: aphrody/src/holding/page.ts
================================================

// [OUTLINE - 16 symbols, 403 lines]
// import node:fs
// import node:path
// import ../../../../packages/deploy/src/m3.ts
// import ../../../../packages/i18n/src/index.ts
// L18: type HoldingLocale = (typeof HOME_LOCALES)[number];
// L19: type State = "built" | "partial" | "planned";
// L21-L29: interface ProductBase
// L31-L35: interface Product extends ProductBase
// L107-L110: function rng(seed: number)
// L113-L124: function hill(
// L128-L146: function pines(
// L149-L173: function pet(root: string): string
// L177-L224: function artSprite(root: string): string
// L229-L231: function heroScene(alt: string): string
// L242-L290: function holdingJsonLd(l: HoldingLocale): Record<string, unknown>
// L292-L313: function renderHolding(root: string, l: HoldingLocale): string
// L316-L330: function productIcons(
// L333-L336: function holding404(root: string): string
// L339-L345: function themeBlocks(root: string): string
// L401-L403: function holdingCss(root: string): string

================================================
FILE: aphrody/src/immersive/build.ts
================================================

// [OUTLINE - 1 symbols, 43 lines]
// import node:fs
// import node:path
// L16-L43: async function buildImmersive(root: string, dist: string, entries: Record<string, string>): Promise<string[]>

================================================
FILE: aphrody/src/immersive/home-entry.ts
================================================

// [OUTLINE - 1 symbols, 18 lines]
// import ./stage.ts
// L7-L14: function boot()

================================================
FILE: aphrody/src/immersive/motion.ts
================================================

// [OUTLINE - 5 symbols, 45 lines]
// import ./tokens.macro.ts
// L8-L12: function dur(name: string): number
// L15-L45: class Spring
// L17-L21: constructor(
// L23-L40: step(dt: number): boolean
// L41-L44: snap(v: number)

================================================
FILE: aphrody/src/immersive/nav.ts
================================================

// [OUTLINE - 4 symbols, 39 lines]
// L2: type Dir = "left" | "right" | "up" | "down";
// L3-L8: interface Box
// L14-L33: function pickNext(boxes: Box[], from: number, dir: Dir): number
// L36-L39: function stickDir(x: number, y: number, dead = 0.5): Dir | null

================================================
FILE: aphrody/src/immersive/play-launcher.ts
================================================

// [OUTLINE - 1 symbols, 52 lines]
// import ./stage.ts
// import ./sound.ts
// L9-L52: async function launcher(): Promise<void>

================================================
FILE: aphrody/src/immersive/shader.ts
================================================

// [OUTLINE - 0 symbols, 110 lines]

================================================
FILE: aphrody/src/immersive/sound.ts
================================================

// [OUTLINE - 4 symbols, 46 lines]
// L3-L7: interface Sounds
// L11-L46: function createSounds(base: string): Sounds
// L25-L33: unlock()
// L34-L43: play(name)

================================================
FILE: aphrody/src/immersive/stage.ts
================================================

// [OUTLINE - 7 symbols, 414 lines]
// import ./shader.ts
// import ./motion.ts
// import ./nav.ts
// L10-L20: interface StageOptions
// L22-L28: interface StageStats
// L30-L33: interface StageHandle
// L43-L50: function stageSupported():
// L61-L66: async function loadLayer(device: GPUDevice, tex: GPUTexture, url: string, layer: number)
// L68-L78: interface ItemState
// L80-L414: async function startStage(o: StageOptions): Promise<StageHandle | null>

================================================
FILE: aphrody/src/immersive/tokens.macro.ts
================================================

// [OUTLINE - 3 symbols, 25 lines]
// import node:fs
// import node:path
// L6-L11: interface MotionTokens
// L13-L20: function parseMotion(css: string): MotionTokens
// L22-L25: function motionTokens(): MotionTokens

================================================
FILE: aphrody/src/m3.css
================================================

// [OUTLINE - 0 symbols, 155 lines]

================================================
FILE: aphrody/src/os/build.ts
================================================

// [OUTLINE - 1 symbols, 71 lines]
// import node:fs
// import node:path
// import ./page.ts
// import ./vendor.ts
// L23-L71: async function buildOs(

================================================
FILE: aphrody/src/os/client/apps.ts
================================================

// [OUTLINE - 13 symbols, 750 lines]
// import ./i18n.ts
// import ./wm.ts
// import ./lib.ts
// import ./gamescope.ts
// L7: type Launch = (app: string, file?: string) => void;
// L43-L102: function library(launch: Launch): Win
// L180-L189: interface Game
// L199-L339: function store(): Win
// L342-L407: function settings(o:
// L410-L426: function game(): Win
// L429-L431: interface V86
// L432-L511: function linux(file?: string): Win
// L514-L569: function flash(file?: string): Win
// L573-L614: function emulator(file?: string): Win
// L617-L642: function consoleApp(): Win
// L647-L750: function withGamescope(w: Win, host: HTMLElement): void
// L746-L748: get handle()

================================================
FILE: aphrody/src/os/client/gamescope.ts
================================================

// [OUTLINE - 8 symbols, 348 lines]
// import ../../../../../crates/gamescope-wgsl/src/shaders/easu.wgsl
// import ../../../../../crates/gamescope-wgsl/src/shaders/rcas.wgsl
// L8: type Filter = "off" | "linear" | "nearest" | "fsr";
// L9: type Scaling = "fit" | "integer" | "stretch" | "fill" | "center";
// L10-L15: interface GsOptions
// L16-L26: interface GsHandle
// L29-L59: function layout(
// L76-L103: function findCanvas(
// L105-L348: async function startGamescope(
// L339-L345: function destroy()

================================================
FILE: aphrody/src/os/client/i18n.ts
================================================

// [OUTLINE - 0 symbols, 12 lines]

================================================
FILE: aphrody/src/os/client/lib.ts
================================================

// [OUTLINE - 5 symbols, 95 lines]
// L2: type Kind = "rom" | "iso" | "swf" | "other";
// L3-L9: interface Entry
// L42-L53: async function list(): Promise<Entry[]>
// L54-L58: async function put(file: File): Promise<void>
// L65-L88: async function pick(accept = ""): Promise<File[]>

================================================
FILE: aphrody/src/os/client/os.ts
================================================

// [OUTLINE - 0 symbols, 149 lines]
// import ../../immersive/stage.ts
// import ../../immersive/sound.ts
// import ../../immersive/nav.ts
// import ./i18n.ts
// import ./wm.ts
// import ./apps.ts

================================================
FILE: aphrody/src/os/client/wgsl.d.ts
================================================

// [OUTLINE - 0 symbols, 4 lines]

================================================
FILE: aphrody/src/os/client/wm.ts
================================================

// [OUTLINE - 3 symbols, 107 lines]
// import ./i18n.ts
// L4-L9: interface Win
// L19-L102: function openWindow(
// L59-L66: function close()

================================================
FILE: aphrody/src/os/page.ts
================================================

// [OUTLINE - 3 symbols, 160 lines]
// import ../../../../packages/i18n/src/index.ts
// L6: type OsLocale = (typeof OS_LOCALES)[number];
// L37: type AppId = (typeof APPS)[number];
// L121-L160: function renderOs(root: string, locale: OsLocale, pet: string): string

================================================
FILE: aphrody/src/os/server.ts
================================================

// [OUTLINE - 1 symbols, 171 lines]
// import ./page.ts
// import ../store/universal-manager
// L117-L171: async function handleOs(

================================================
FILE: aphrody/src/os/vendor.lock.json
================================================

// [OUTLINE - 33 symbols, 43 lines]
// L2-L6: "v86-js":
// L3: "url": "https://github.com/copy/v86/releases/download/latest/libv86.js"
// L4: "sha256": "e257912c4a1129e36a86c1e2df69904ab969d87bffd24aa6676e84d6ddffc1c6"
// L5: "out": "v86/libv86.js"
// L7-L11: "v86-wasm":
// L8: "url": "https://github.com/copy/v86/releases/download/latest/v86.wasm"
// L9: "sha256": "2f0c4150f266415b754a84a32e6f8e4c975a1d3abb94c78b047fa30027db1ef1"
// L10: "out": "v86/v86.wasm"
// L12-L16: "v86-seabios":
// L13: "url": "https://raw.githubusercontent.com/copy/v86/315b2b0b758703ef0e6cc7b4088d6068f83f3c20/bios/seabios.bin"
// L14: "sha256": "73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98"
// L15: "out": "v86/seabios.bin"
// L17-L21: "v86-vgabios":
// L18: "url": "https://raw.githubusercontent.com/copy/v86/315b2b0b758703ef0e6cc7b4088d6068f83f3c20/bios/vgabios.bin"
// L19: "sha256": "a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880"
// L20: "out": "v86/vgabios.bin"
// L22-L26: "v86-license":
// L23: "url": "https://raw.githubusercontent.com/copy/v86/315b2b0b758703ef0e6cc7b4088d6068f83f3c20/LICENSE"
// L24: "sha256": "3f61ba65e3215b09ef264ba8d777d73c19644309fbb705967634eb5147e500a0"
// L25: "out": "v86/LICENSE"
// L27-L31: "v86-bios-license":
// L28: "url": "https://raw.githubusercontent.com/copy/v86/315b2b0b758703ef0e6cc7b4088d6068f83f3c20/bios/COPYING.LESSER"
// L29: "sha256": "a853c2ffec17057872340eee242ae4d96cbf2b520ae27d903e1b2fef1a5f9d1c"
// L30: "out": "v86/COPYING.LESSER"
// L32-L42: "ruffle":
// L33: "url": "https://github.com/ruffle-rs/ruffle/releases/download/nightly-2026-11-13/ruffle-nightly-2026_11_13-web-selfhosted.zip"
// L34: "sha256": "bc2d1e72a7f967822d0c2b5e2e7b62d436784da57a95eb3e5fdd4a820c992f8e"
// L35-L41: "extract":
// L36: "ruffle.js": "ruffle/ruffle.js"
// L37: "ruffle_web-wasm_mvp_bg.TG6ZWLMF.wasm": "ruffle/ruffle_web-wasm_mvp_bg.TG6ZWLMF.wasm"
// L38: "ruffle_web_bg.JVLQNYQO.wasm": "ruffle/ruffle_web_bg.JVLQNYQO.wasm"
// L39: "LICENSE_APACHE": "ruffle/LICENSE_APACHE"
// L40: "LICENSE_MIT": "ruffle/LICENSE_MIT"

================================================
FILE: aphrody/src/os/vendor.ts
================================================

// [OUTLINE - 3 symbols, 95 lines]
// import node:fs
// import node:path
// L7-L13: interface Entry
// L24-L61: async function unzip(buf: Uint8Array): Promise<Map<string, Uint8Array>>
// L63-L95: async function fetchVendor(dir: string): Promise<string[]>

================================================
FILE: aphrody/src/play/page.ts
================================================

// [OUTLINE - 2 symbols, 96 lines]
// import ../../../../packages/i18n/src/index.ts
// L7: type PlayLocale = (typeof PLAY_LOCALES)[number];
// L27-L96: function renderPlay(locale: PlayLocale = "en"): string

================================================
FILE: aphrody/src/runtime/assets.ts
================================================

// [OUTLINE - 8 symbols, 194 lines]
// import fs
// import path
// import node:zlib
// import ./hash
// L38-L47: interface Asset
// L50-L63: function cacheControlFor(urlPath: string, ext: string): string
// L65-L147: class AssetStore
// L69-L71: constructor(distDir: string)
// L74-L102: private locate(pathname: string):
// L104-L146: get(pathname: string): Asset | null
// L149-L156: function etagMatches(header: string | null, etag: string): boolean
// L158-L194: function respondWithAsset(

================================================
FILE: aphrody/src/runtime/hash.ts
================================================

// [OUTLINE - 7 symbols, 89 lines]
// import fs
// import os
// import path
// import bun:ffi
// L14: type HexFn = (bytes: Uint8Array) => string;
// L16-L20: interface HashEngine
// L22-L24: function sha256Hex(bytes: Uint8Array): string
// L26-L33: function dllCandidates(
// L35-L71: function loadFfiBlake3(
// L75-L83: function getHashEngine(): HashEngine
// L86-L89: function strongEtag(bytes: Uint8Array, variant = ""): string

================================================
FILE: aphrody/src/seo/documents.ts
================================================

// [OUTLINE - 16 symbols, 274 lines]
// import ./site
// import ../holding/page
// import ../../../../packages/i18n/src/index.ts
// import ./webmcp-tools
// import ../google/config
// L37-L43: function xmlEscape(s: string): string
// L45-L54: function alternates(frPath: string): string
// L56-L65: function urlEntries(paths: string[], lastmod: string): string
// L67-L94: function buildSitemaps(buildDate: string): Record<string, string>
// L97-L102: function allIndexableUrls(): string[]
// L113-L122: function robotsTxt(): string
// L125-L150: function llmsTxt(): string
// L152-L170: function llmsFullTxt(): string
// L172-L193: function agentJson(): Record<string, unknown>
// L195-L213: function webmcpJson(): Record<string, unknown>
// L215-L221: function adsTxt(cfg: GoogleConfig): string
// L223-L230: function sellersJson(contactEmail?: string): Record<string, unknown>
// L232-L242: function securityTxt(buildDate: string, contactEmail?: string): string
// L244-L253: function humansTxt(buildDate: string): string
// L256-L265: function indexNowKey(
// L267-L274: function indexNowPayload(key: string): Record<string, unknown>

================================================
FILE: aphrody/src/seo/home-css.ts
================================================

// [OUTLINE - 0 symbols, 62 lines]

================================================
FILE: aphrody/src/seo/home.ts
================================================

// [OUTLINE - 6 symbols, 298 lines]
// import ./site
// import ./schema-graph
// import ../google/config
// import ./home-css
// L19: type Status = "live" | "dev";
// L21-L30: interface Tile
// L33-L45: interface HomeCopy
// L188-L194: function esc(s: string): string
// L196-L207: function tileHtml(t: Tile, c: Pick<HomeCopy, "status">): string
// L209-L298: function renderBrandHome(locale: Locale): string

================================================
FILE: aphrody/src/seo/html.ts
================================================

// [OUTLINE - 15 symbols, 448 lines]
// import ./site
// import ./schema-graph
// import ../google/config
// import ./page-css
// import ./home
// L78-L84: function esc(s: string): string
// L95-L110: interface PageSpec
// L112-L121: function searchForm(locale: Locale, id: string, value = ""): string
// L123-L134: function adSlot(
// L136-L204: function renderDocument(p: PageSpec): string
// L206-L214: function topicsNav(locale: Locale, current?: string): string
// L216-L230: function faqHtml(
// L233-L235: function renderHome(locale: Locale, _cfg: GoogleConfig): string
// L237-L257: function breadcrumbs(
// L259-L305: function renderVertical(
// L307-L311: interface HubPackage
// L313-L359: function renderPackageHub(
// L361-L403: function renderNews(
// L405-L417: function render404(locale: Locale, cfg: GoogleConfig): string
// L419-L446: function renderSearchResults(

================================================
FILE: aphrody/src/seo/page-css.ts
================================================

// [OUTLINE - 1 symbols, 38 lines]
// L7-L14: function minifyCss(css: string): string

================================================
FILE: aphrody/src/seo/schema-graph.ts
================================================

// [OUTLINE - 6 symbols, 165 lines]
// import ./site
// L12-L15: interface GraphFaq
// L16-L19: interface GraphCrumb
// L20-L23: interface GraphItem
// L25-L37: interface PageGraphOptions
// L42-L149: function buildPageGraph(o: PageGraphOptions): Record<string, unknown>
// L151-L155: function graphToScript(graph: Record<string, unknown>): string

================================================
FILE: aphrody/src/seo/site.ts
================================================

// [OUTLINE - 13 symbols, 391 lines]
// L12: type Locale = "fr" | "en";
// L17-L23: interface LocalizedHub
// L25-L30: interface Vertical
// L280: type PackageEcosystem = (typeof PACKAGE_ECOSYSTEMS)[number];
// L314-L319: interface NewsArticle
// L348-L350: function localePrefix(locale: Locale): string
// L353-L357: function localizedPath(path: string, locale: Locale): string
// L359-L361: function absoluteUrl(path: string): string
// L363-L365: function verticalPath(slug: string): string
// L367-L369: function packageHubPath(eco: string): string
// L371-L373: function newsPath(slug: string): string
// L376-L387: function pathGroups(): Record<
// L389-L391: function findVertical(slug: string): Vertical | undefined

================================================
FILE: aphrody/src/seo/webmcp-tools.ts
================================================

// [OUTLINE - 1 symbols, 56 lines]
// L7-L18: interface WebMcpTool

================================================
FILE: aphrody/src/store/database.ts
================================================

// [OUTLINE - 8 symbols, 153 lines]
// import bun:sqlite
// import fs
// import path
// import ./types
// L12-L153: class StoreDatabase
// L15-L26: constructor(dbPath?: string)
// L28-L60: private initSchema(): void
// L62-L97: public upsertPackage(pkg: StorePackage): void
// L99-L106: public upsertBatch(packages: StorePackage[]): void
// L108-L130: public searchPackages(
// L132-L148: private rowToPackage(r: any): StorePackage
// L150-L152: public close(): void

================================================
FILE: aphrody/src/store/drivers/aur.ts
================================================

// [OUTLINE - 1 symbols, 95 lines]
// import ../types
// L57-L95: async function searchAurPackages(

================================================
FILE: aphrody/src/store/drivers/bun.ts
================================================

// [OUTLINE - 1 symbols, 73 lines]
// import ../types
// L65-L73: async function searchBunPackages(

================================================
FILE: aphrody/src/store/drivers/flatpak.ts
================================================

// [OUTLINE - 1 symbols, 94 lines]
// import ../types
// L57-L94: async function searchFlatpakPackages(

================================================
FILE: aphrody/src/store/drivers/nix.ts
================================================

// [OUTLINE - 1 symbols, 66 lines]
// import ../types
// L58-L66: async function searchNixPackages(

================================================
FILE: aphrody/src/store/drivers/playstore.ts
================================================

// [OUTLINE - 1 symbols, 66 lines]
// import ../types
// L58-L66: async function searchPlayStorePackages(

================================================
FILE: aphrody/src/store/drivers/wasm-hub.ts
================================================

// [OUTLINE - 1 symbols, 100 lines]
// import ../types
// L92-L100: async function searchWasmHubPackages(

================================================
FILE: aphrody/src/store/drivers/winget.ts
================================================

// [OUTLINE - 1 symbols, 94 lines]
// import ../types
// L84-L94: async function searchWingetPackages(

================================================
FILE: aphrody/src/store/types.ts
================================================

// [OUTLINE - 2 symbols, 33 lines]
// import ../benchmark/stack-picker
// L8-L16: type Ecosystem =
// L18-L33: interface StorePackage

================================================
FILE: aphrody/src/store/universal-manager.ts
================================================

// [OUTLINE - 5 symbols, 107 lines]
// import ./database
// import ./drivers/bun
// import ./drivers/winget
// import ./drivers/aur
// import ./drivers/nix
// import ./drivers/flatpak
// import ./drivers/playstore
// import ./drivers/wasm-hub
// import ../benchmark/stack-picker
// import ./types
// L27-L107: class UniversalStoreManager
// L31-L34: constructor(dbPath?: string)
// L36-L41: public static getInstance(dbPath?: string): UniversalStoreManager
// L43-L54: private seedCuratedPackages(): void
// L56-L106: public async search(

================================================
FILE: aphrody/src/style.css
================================================

// [OUTLINE - 0 symbols, 418 lines]

================================================
FILE: aphrody/src/suite/wasm-kernel.ts
================================================

// [OUTLINE - 6 symbols, 191 lines]
// L13-L27: interface StorytoldWasmExports
// L29-L41: function encodeLeb128(value: number): number[]
// L43-L45: function makeSection(id: number, contents: number[]): number[]
// L47-L50: function encodeString(str: string): number[]
// L52-L178: function buildStorytoldWasmBinary(): Uint8Array
// L182-L191: async function getStorytoldWasm(): Promise<StorytoldWasmExports>

================================================
FILE: aphrody/src/types.d.ts
================================================

// [OUTLINE - 2 symbols, 65 lines]
// L11-L14: interface ImportMeta
// L33-L47: class Database

================================================
FILE: aphrody/tests/aphrody.test.ts
================================================

// [OUTLINE - 0 symbols, 413 lines]
// import bun:test
// import fs
// import path
// import ../src/data/suggestions
// import ../server
// import ../src/design/material-tokens
// import ../src/suite/wasm-kernel
// import ../src/store/universal-manager
// import ../src/benchmark/stack-picker

================================================
FILE: aphrody/tests/immersive.test.ts
================================================

// [OUTLINE - 0 symbols, 67 lines]
// import bun:test
// import ../src/immersive/motion.ts
// import ../src/immersive/nav.ts
// import ../src/immersive/tokens.macro.ts
// import ../src/play/page

================================================
FILE: aphrody/tests/play.test.ts
================================================

// [OUTLINE - 0 symbols, 26 lines]
// import bun:test
// import ../src/play/page

================================================
FILE: aphrody/tests/seo.test.ts
================================================

// [OUTLINE - 2 symbols, 529 lines]
// import bun:test
// import fs
// import path
// import ../server
// import ../src/seo/documents
// import ../src/seo/html
// import ../src/seo/site
// import ../src/seo/webmcp-tools
// import ../src/google/config
// import ../src/google/relay
// import ../src/runtime/hash
// import ../src/seo/page-css
// L44-L62: function assertWellFormed(xml: string): void
// L64-L74: function ldGraph(html: string): Array<Record<string, any>>

================================================
FILE: aphrody/tsconfig.json
================================================

// [OUTLINE - 13 symbols, 16 lines]
// L2-L14: "compilerOptions":
// L3: "target": "ESNext"
// L4: "module": "ESNext"
// L5: "moduleResolution": "bundler"
// L6: "lib": ["DOM", "DOM.Iterable", "ESNext"]
// L7: "strict": true
// L8: "skipLibCheck": true
// L9: "allowSyntheticDefaultImports": true
// L10: "forceConsistentCasingInFileNames": true
// L11: "allowImportingTsExtensions": true
// L12: "noEmit": true
// L13: "types": ["bun", "@webgpu/types"]
// L15: "include": ["src", "server.ts", "build.ts", "tests", "edge"]

================================================
FILE: aphrody/wrangler.toml
================================================

name = "aphrody"
main = "edge/worker.ts"
compatibility_date = "2026-11-01"
workers_dev = false

# aphrody.com is served from the production deployment of project "aphrody" on aphrody.app

# (packages/deploy: R2 aphrody-dist, deploys/aphrody/<sha>/, pointer deploys/aphrody/_state.json).

# `ay deploy aphrody` builds dist/ in CI and moves the pointer; this Worker is deployed only when

# edge/worker.ts or packages/deploy/src/serve.ts change. Headers (HSTS, CSP, Link preload) come

# from dist/_headers of each deployment.

routes = [
{ pattern = "aphrody.com/*", zone_name = "aphrody.com" },
{ pattern = "www.aphrody.com", custom_domain = true },
]

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "aphrody-dist"

[vars]
PROJECT = "aphrody"

# Empty: /api/_, /g/_, /search go to the zone origin (cloudflared tunnel mig-prd -> prd aphrody service).

ORIGIN_URL = ""

# Web Analytics + Speed Insights of aphrody.com: the Insights Durable Object lives in the platform Worker.

[[durable_objects.bindings]]
name = "INSIGHTS"
class_name = "Insights"
script_name = "aphrody-deploy"

[images]
binding = "IMAGES"

[observability]
enabled = true

================================================
FILE: aphrody-app/crates/aphrody-core/src/fluid.rs
================================================

// [OUTLINE - 67 symbols, 746 lines]
// import serde
// import serde_json
// import std
// import super
// L24-L31: pub enum OpBody
// L34-L40: pub struct Op
// L43-L48: pub struct SequencedOp
// L51-L55: pub enum SeqError
// L58-L64: fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result
// L71-L75: pub struct Sequencer
// L78-L80: pub fn new() -> Self
// L82-L84: pub fn last_seq(&self) -> u64
// L86-L103: pub fn submit(&mut self, op: Op) -> Result<SequencedOp, SeqError>
// L106-L108: pub fn since(&self, after: u64) -> &[SequencedOp]
// L114-L118: pub struct SharedMap
// L121-L123: pub fn get(&self, k: &str) -> Option<&Value>
// L124-L126: pub fn len(&self) -> usize
// L127-L129: pub fn is_empty(&self) -> bool
// L130-L132: pub fn to_json(&self) -> Value
// L134-L150: fn apply_local(&mut self, body: &OpBody)
// L152-L175: fn apply_remote(&mut self, body: &OpBody)
// L177-L190: fn ack(&mut self, body: &OpBody)
// L196-L198: pub struct SharedCounter
// L201-L203: pub fn value(&self) -> i64
// L209-L213: struct Removal
// L216-L222: struct Segment
// L225-L229: fn len_in(&self, ref_seq: u64, client: ClientId) -> usize
// L230-L239: fn split(&mut self, at: usize) -> Segment
// L243-L245: pub struct SharedString
// L248-L250: pub fn text(&self) -> String
// L252-L254: pub fn len(&self) -> usize
// L256-L258: pub fn is_empty(&self) -> bool
// L260-L299: fn insert(&mut self, pos: usize, text: &str, ref_seq: u64, client: ClientId, seq: u64, cseq: u64)
// L301-L335: fn remove(&mut self, start: usize, end: usize, ref_seq: u64, client: ClientId, seq: u64, cseq: u64)
// L337-L348: fn ack(&mut self, client: ClientId, cseq: u64, seq: u64)
// L354-L357: pub enum ApplyError
// L360-L365: fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result
// L371-L379: pub struct Replica
// L382-L392: pub fn new(client: ClientId) -> Self
// L394-L396: pub fn last_seq(&self) -> u64
// L397-L399: pub fn pending_len(&self) -> usize
// L400-L402: pub fn map(&self, ch: &str) -> Option<&SharedMap>
// L403-L405: pub fn string(&self, ch: &str) -> Option<&SharedString>
// L406-L408: pub fn counter(&self, ch: &str) -> i64
// L410-L445: fn local(&mut self, channel: &str, mut body: OpBody) -> Op
// L447-L449: pub fn map_set(&mut self, ch: &str, key: &str, value: Value) -> Op
// L450-L452: pub fn map_delete(&mut self, ch: &str, key: &str) -> Op
// L453-L455: pub fn map_clear(&mut self, ch: &str) -> Op
// L456-L458: pub fn counter_add(&mut self, ch: &str, delta: i64) -> Op
// L459-L461: pub fn string_insert(&mut self, ch: &str, pos: usize, text: &str) -> Op
// L462-L464: pub fn string_remove(&mut self, ch: &str, start: usize, end: usize) -> Op
// L467-L513: pub fn process(&mut self, sop: &SequencedOp) -> Result<(), ApplyError>
// L516-L522: pub fn snapshot(&self) -> Value
// L526-L746: mod tests
// L529-L533: struct Net
// L536-L538: fn new(n: usize) -> Net
// L539-L541: fn submit(&mut self, op: Op)
// L542-L549: fn deliver(&mut self, r: usize, max: usize)
// L550-L554: fn flush(&mut self)
// L555-L561: fn assert_converged(&self)
// L564: struct Lcg(u64);
// L566-L569: fn next(&mut self, m: usize) -> usize
// L573-L587: fn sequencer_is_total_ordered_and_idempotent()
// L590-L599: fn counter_converges()
// L602-L613: fn map_last_writer_wins_by_sequence()
// L616-L633: fn map_clear_and_delete()
// L636-L648: fn string_concurrent_inserts_converge()
// L651-L663: fn string_insert_inside_concurrent_remove()
// L666-L704: fn randomized_convergence()
// L708-L734: fn small_string_scenarios_converge()
// L736-L745: fn rejects_gaps()

================================================
FILE: aphrody-app/crates/aphrody-core/src/layout.rs
================================================

// [OUTLINE - 23 symbols, 205 lines]
// import serde
// import super
// L8-L13: pub struct Rect
// L16-L18: pub const fn new(x: f32, y: f32, w: f32, h: f32) -> Self
// L19-L21: pub fn right(&self) -> f32
// L22-L24: pub fn bottom(&self) -> f32
// L25-L27: pub fn area(&self) -> f32
// L28-L30: pub fn inset(&self, d: f32) -> Rect
// L31-L33: pub fn contains(&self, px: f32, py: f32) -> bool
// L34-L38: pub fn intersection_area(&self, o: &Rect) -> f32
// L43-L49: pub enum LayoutKind
// L55-L62: pub fn name(&self) -> &'static str
// L64-L66: pub fn parse(s: &str) -> Option<LayoutKind>
// L68-L71: pub fn next(&self) -> LayoutKind
// L76-L78: fn finish(tiles: Vec<Rect>, gap: f32) -> Vec<Rect>
// L80-L99: pub fn dwindle(area: Rect, n: usize, gap: f32) -> Vec<Rect>
// L101-L118: pub fn cosmic_grid(area: Rect, n: usize, gap: f32) -> Vec<Rect>
// L123-L140: pub fn niri_scroll(area: Rect, n: usize, focus: usize, ratio: f32, scroll: &mut f32, gap: f32) -> Vec<Rect>
// L143-L205: mod tests
// L148-L158: fn assert_partition(tiles: &[Rect], area: Rect)
// L161-L168: fn dwindle_partitions_area()
// L171-L176: fn grid_partitions_area()
// L179-L183: fn gaps_separate_tiles()
// L186-L196: fn niri_keeps_focus_visible()
// L199-L204: fn layout_kind_names_roundtrip()

================================================
FILE: aphrody-app/crates/aphrody-core/src/state.rs
================================================

// [OUTLINE - 9 symbols, 181 lines]
// import crate
// import crate
// import crate
// import crate
// import crate
// import serde_json
// import super
// L10-L16: pub struct AppState
// L19-L22: pub fn new(output: Rect, storage: Box<dyn Storage>) -> Result<Self, String>
// L24-L26: pub fn in_memory(output: Rect) -> Self
// L29-L33: pub fn commit(&mut self, op: crate::fluid::Op) -> Result<u64, String>
// L35-L43: pub fn windows_json(&mut self) -> Value
// L46-L48: fn err(m: impl Into<String>) -> ToolError
// L51-L154: pub fn builtin_registry() -> ToolRegistry<AppState>
// L157-L181: mod tests
// L161-L180: fn builtin_tools_drive_state()

================================================
FILE: aphrody-app/crates/aphrody-core/src/store.rs
================================================

// [OUTLINE - 83 symbols, 754 lines]
// import crate
// import serde
// import std
// import file
// import super
// import std
// import std
// import std
// import super
// L10-L16: pub enum StorageError
// L19-L27: fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result
// L34-L43: pub trait Storage: MaybeSend
// L40-L42: fn flush(&mut self) -> StorageResult<()>
// L46-L48: fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>>
// L49-L51: fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()>
// L52-L54: fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()>
// L55-L57: fn delete(&mut self, key: &str) -> StorageResult<bool>
// L58-L60: fn list(&self, prefix: &str) -> StorageResult<Vec<String>>
// L61-L63: fn flush(&mut self) -> StorageResult<()>
// L66-L73: pub fn validate_key(key: &str) -> StorageResult<()>
// L76-L78: pub struct MemStorage
// L81-L83: pub fn new() -> Self
// L84-L86: pub fn len(&self) -> usize
// L87-L89: pub fn is_empty(&self) -> bool
// L93-L96: fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>>
// L97-L101: fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()>
// L102-L106: fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()>
// L107-L110: fn delete(&mut self, key: &str) -> StorageResult<bool>
// L111-L113: fn list(&self, prefix: &str) -> StorageResult<Vec<String>>
// L120-L208: mod file
// L128-L130: pub struct FileStorage
// L132-L134: fn io<E: std::fmt::Display>(e: E) -> StorageError
// L137-L141: pub fn open(root: impl Into<PathBuf>) -> StorageResult<Self>
// L143-L146: fn path(&self, key: &str) -> StorageResult<PathBuf>
// L148-L164: fn walk(dir: &Path, prefix: &str, out: &mut Vec<String>) -> StorageResult<()>
// L168-L174: fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>>
// L175-L183: fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()>
// L184-L192: fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()>
// L193-L199: fn delete(&mut self, key: &str) -> StorageResult<bool>
// L200-L206: fn list(&self, prefix: &str) -> StorageResult<Vec<String>>
// L213: pub struct Hash(pub [u8; 32]);
// L216-L218: pub fn of(data: &[u8]) -> Hash
// L219-L227: pub fn to_hex(&self) -> String
// L228-L237: pub fn from_hex(s: &str) -> Option<Hash>
// L241-L243: fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result
// L247-L249: fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error>
// L253-L256: fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error>
// L264-L266: pub struct BlockStore<S: Storage>
// L269-L271: pub fn new(storage: S) -> Self
// L272-L274: pub fn storage(&self) -> &S
// L275-L277: pub fn storage_mut(&mut self) -> &mut S
// L278-L280: pub fn into_storage(self) -> S
// L282-L285: fn key(h: &Hash) -> String
// L287-L289: pub fn has(&self, h: &Hash) -> StorageResult<bool>
// L292-L299: pub fn put(&mut self, data: &[u8]) -> StorageResult<Hash>
// L302-L308: pub fn get(&self, h: &Hash) -> StorageResult<Vec<u8>>
// L312-L321: pub fn put_blob(&mut self, data: &[u8]) -> StorageResult<Hash>
// L323-L342: fn parse_manifest(m: &[u8]) -> StorageResult<(Vec<Hash>, u64)>
// L344-L354: pub fn get_blob(&self, root: &Hash) -> StorageResult<Vec<u8>>
// L356-L358: pub fn block_count(&self) -> StorageResult<usize>
// L362-L378: pub fn gc(&mut self, roots: &[Hash]) -> StorageResult<usize>
// L388-L392: pub enum WalRecord
// L395-L402: pub fn wal_encode(rec: &WalRecord) -> Vec<u8>
// L406-L426: pub fn wal_decode(buf: &[u8]) -> (Vec<WalRecord>, usize)
// L432-L435: pub enum Node
// L438-L442: pub struct DirEntry
// L444-L447: pub struct Vfs<S: Storage>
// L449-L463: pub fn normalize_path(p: &str) -> StorageResult<String>
// L465-L475: fn parents(path: &str) -> Vec<String>
// L479-L496: pub fn open(storage: S) -> StorageResult<Self>
// L498-L517: fn apply(index: &mut BTreeMap<String, Node>, rec: &WalRecord)
// L519-L523: fn log(&mut self, rec: WalRecord) -> StorageResult<()>
// L525-L534: pub fn mkdir_p(&mut self, path: &str) -> StorageResult<()>
// L536-L548: pub fn write(&mut self, path: &str, data: &[u8]) -> StorageResult<Hash>
// L550-L557: pub fn read(&self, path: &str) -> StorageResult<Vec<u8>>
// L559-L569: pub fn remove(&mut self, path: &str) -> StorageResult<bool>
// L571-L574: pub fn stat(&self, path: &str) -> StorageResult<Option<Node>>
// L576-L596: pub fn list(&self, dir: &str) -> StorageResult<Vec<DirEntry>>
// L599-L604: pub fn checkpoint(&mut self) -> StorageResult<()>
// L607-L614: pub fn gc(&mut self) -> StorageResult<usize>
// L616-L618: pub fn blocks(&self) -> &BlockStore<S>
// L620-L622: pub fn into_storage(self) -> S
// L626-L754: mod tests
// L630-L635: fn hash_hex_roundtrip_and_known_vector()
// L638-L649: fn blockstore_dedup_and_verify()
// L652-L660: fn blob_chunking_roundtrip()
// L663-L669: fn key_validation()
// L672-L688: fn vfs_basic_tree()
// L691-L700: fn wal_recovery_without_checkpoint()
// L703-L722: fn wal_torn_tail_is_ignored()
// L725-L736: fn checkpoint_truncates_wal_and_gc_reclaims()
// L740-L753: fn file_backend_roundtrip()

================================================
FILE: aphrody-app/crates/aphrody-core/src/wayland.rs
================================================

// [OUTLINE - 24 symbols, 444 lines]
// import crate
// import crate
// import std
// import super
// import crate
// L17-L26: pub enum Interface
// L29-L40: pub fn name(&self) -> &'static str
// L54-L59: struct XdgSurface
// L62-L67: struct Toplevel
// L69-L77: pub struct Session
// L80-L82: fn default() -> Self
// L85-L112: fn signature(iface: Interface, opcode: u16) -> Option<&'static str>
// L115-L126: pub fn new() -> Self
// L128-L130: pub fn object_interface(&self, id: u32) -> Option<Interface>
// L132-L135: fn emit(&mut self, object_id: u32, opcode: u16, args: Vec<Arg>)
// L137-L140: fn next_serial(&mut self) -> u32
// L142-L144: fn protocol_error(&mut self, object: u32, code: u32, msg: &str)
// L146-L153: fn new_object(&mut self, id: u32, iface: Interface) -> bool
// L157-L176: pub fn feed(&mut self, wm: &mut WindowManager, mut bytes: &[u8]) -> Result<Vec<u8>, WireError>
// L178-L308: fn dispatch(&mut self, wm: &mut WindowManager, id: u32, iface: Interface, op: u16, a: &[Arg])
// L310-L323: fn destroy_xdg_surface(&mut self, wm: &mut WindowManager, xs_id: u32)
// L327-L347: fn commit(&mut self, wm: &mut WindowManager, surface: u32)
// L350-L354: pub fn request_close(&mut self, window: WindowId) -> Option<Vec<u8>>
// L358-L444: mod tests
// L362-L364: fn req(id: u32, op: u16, args: Vec<Arg>) -> Vec<u8>
// L366-L377: fn events(mut bytes: &[u8], sigs: &dyn Fn(u32, u16) -> &'static str) -> Vec<Message>
// L380-L420: fn registry_and_toplevel_handshake_maps_a_window()
// L423-L430: fn sync_fires_done_and_delete_id()
// L433-L443: fn protocol_errors_are_reported()

================================================
FILE: aphrody-app/crates/aphrody-core/src/webmcp.rs
================================================

// [OUTLINE - 34 symbols, 370 lines]
// import serde_json
// import super
// L12-L17: pub struct Field
// L20-L22: pub fn req(name: &str, schema: Schema, description: &str) -> Field
// L23-L25: pub fn opt(name: &str, schema: Schema, description: &str) -> Field
// L29-L36: pub enum Schema
// L39-L41: pub fn string() -> Schema
// L42-L44: pub fn one_of(values: &[&str]) -> Schema
// L45-L47: pub fn integer(min: i64, max: i64) -> Schema
// L48-L50: pub fn object(fields: Vec<Field>) -> Schema
// L51-L53: pub fn empty_object() -> Schema
// L55-L97: pub fn to_json(&self) -> Value
// L99-L101: pub fn validate(&self, v: &Value) -> Result<(), String>
// L103-L143: fn validate_at(&self, v: &Value, path: &str) -> Result<(), String>
// L147-L150: pub struct ToolError
// L153-L155: pub fn new(code: i32, message: impl Into<String>) -> Self
// L159-L161: fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result
// L168-L174: pub struct Tool<C>
// L176-L178: pub struct ToolRegistry<C>
// L181-L183: fn default() -> Self
// L189-L191: pub fn new() -> Self
// L193-L200: pub fn register(&mut self, name: &str, description: &str, input: Schema, read_only: bool, handler: Handler<C>)
// L202-L204: pub fn len(&self) -> usize
// L205-L207: pub fn is_empty(&self) -> bool
// L208-L210: pub fn names(&self) -> Vec<&str>
// L213-L227: pub fn list_json(&self) -> Value
// L229-L234: pub fn call(&self, ctx: &mut C, name: &str, args: &Value) -> Result<Value, ToolError>
// L237-L247: pub fn well_known(&self, name: &str, description: &str, endpoint: &str) -> Value
// L250-L291: pub fn handle_jsonrpc(&self, ctx: &mut C, body: &str, server_name: &str, server_version: &str) -> Option<String>
// L294-L296: fn rpc_err(id: Value, code: i32, message: &str) -> Value
// L299-L370: mod tests
// L302-L319: fn registry() -> ToolRegistry<i64>
// L322-L331: fn schema_validation()
// L334-L341: fn json_schema_output()
// L344-L362: fn jsonrpc_flow()
// L366-L369: fn duplicate_names_rejected()

================================================
FILE: aphrody-app/crates/aphrody-core/src/wire.rs
================================================

// [OUTLINE - 20 symbols, 252 lines]
// import super
// L11-L17: pub enum WireError
// L20-L28: fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result
// L34-L38: pub struct Header
// L41-L53: pub fn parse(buf: &[u8]) -> Result<Header, WireError>
// L55-L61: pub fn encode(&self) -> [u8; HEADER_LEN]
// L67-L75: pub enum Arg
// L78-L82: pub struct Message
// L84-L86: fn pad4(n: usize) -> usize
// L89-L91: pub fn new(object_id: u32, opcode: u16, args: Vec<Arg>) -> Self
// L93-L123: pub fn encode_into(&self, out: &mut Vec<u8>) -> Result<(), WireError>
// L125-L129: pub fn encode(&self) -> Result<Vec<u8>, WireError>
// L133-L141: pub fn decode(buf: &[u8], signature: &str) -> Result<(Message, usize), WireError>
// L144-L151: fn take_u32(p: &[u8], off: &mut usize) -> Result<u32, WireError>
// L153-L189: pub fn decode_args(p: &[u8], signature: &str) -> Result<Vec<Arg>, WireError>
// L193-L202: pub fn next_frame(buf: &[u8]) -> Result<Option<(Header, &[u8])>, WireError>
// L205-L252: mod tests
// L209-L214: fn header_layout_matches_wayland()
// L217-L227: fn string_padding_and_roundtrip()
// L230-L239: fn rejects_malformed()
// L242-L251: fn frame_splitting()

================================================
FILE: aphrody-app/crates/aphrody-core/src/wm.rs
================================================

// [OUTLINE - 33 symbols, 314 lines]
// import crate
// import serde
// import std
// import super
// L13-L18: pub struct Window
// L21-L28: pub struct Workspace
// L31-L37: pub struct Placed
// L40-L47: pub struct WindowManager
// L50-L63: pub fn new(output: Rect, workspace_count: usize) -> Self
// L65-L67: pub fn window(&self, id: WindowId) -> Option<&Window>
// L69-L71: pub fn window_count(&self) -> usize
// L73-L75: pub fn workspace_of(&self, id: WindowId) -> Option<usize>
// L77-L92: pub fn add_window(&mut self, title: &str, app_id: &str) -> WindowId
// L94-L98: pub fn set_title(&mut self, id: WindowId, title: &str)
// L100-L104: pub fn set_app_id(&mut self, id: WindowId, app_id: &str)
// L106-L119: pub fn remove_window(&mut self, id: WindowId) -> bool
// L121-L130: pub fn focus_window(&mut self, id: WindowId) -> bool
// L132-L140: fn step_focus(&mut self, delta: isize)
// L142-L144: pub fn focus_next(&mut self)
// L146-L148: pub fn focus_prev(&mut self)
// L151-L159: pub fn swap_focused_next(&mut self)
// L161-L168: pub fn switch_workspace(&mut self, index: usize) -> bool
// L170-L183: pub fn move_focused_to_workspace(&mut self, index: usize) -> bool
// L185-L187: pub fn set_layout(&mut self, kind: LayoutKind)
// L189-L192: pub fn cycle_layout(&mut self)
// L194-L196: pub fn resize_output(&mut self, output: Rect)
// L199-L203: pub fn set_float_rect(&mut self, id: WindowId, r: Rect)
// L206-L208: pub fn arrange(&mut self) -> Vec<Placed>
// L210-L232: pub fn arrange_workspace(&mut self, index: usize) -> Vec<Placed>
// L234-L237: pub fn rect_of(&mut self, id: WindowId) -> Option<Rect>
// L240-L242: pub fn window_at(&mut self, x: f32, y: f32) -> Option<WindowId>
// L246-L314: mod tests
// L249-L253: fn wm() -> WindowManager
// L256-L270: fn add_focus_remove()
// L273-L285: fn workspaces_isolate_windows()
// L288-L300: fn every_layout_places_every_window()
// L303-L313: fn hit_testing_prefers_topmost_floating()

================================================
FILE: aphrody-app/crates/aphrody-host/src/dist.rs
================================================

// [OUTLINE - 16 symbols, 223 lines]
// import aphrody_core
// import std
// import std
// import super
// L13-L17: pub struct Opts
// L19-L22: fn run(cmd: &mut Command, what: &str) -> Result<(), String>
// L25-L27: pub fn target_dir(root: &Path) -> PathBuf
// L29-L43: fn build_wasm(root: &Path) -> Result<PathBuf, String>
// L45-L47: pub fn short_hash(bytes: &[u8]) -> String
// L49-L56: pub fn robots_txt() -> String
// L58-L66: pub fn sitemap_xml() -> String
// L68-L80: pub fn llms_txt() -> String
// L82-L101: pub fn manifest_webmanifest() -> String
// L104-L106: pub fn icon_svg() -> &'static str
// L108-L118: pub fn headers_file() -> String
// L120-L124: fn write(out: &Path, rel: &str, bytes: &[u8]) -> Result<(), String>
// L127-L197: pub fn build(o: &Opts) -> Result<Vec<(String, usize)>, String>
// L200-L223: mod tests
// L204-L215: fn static_files_are_well_formed()
// L218-L222: fn no_emoji_or_non_ascii_in_generated_text()

================================================
FILE: aphrody-app/crates/aphrody-host/src/http.rs
================================================

// [OUTLINE - 23 symbols, 438 lines]
// import aphrody_core
// import aphrody_core
// import aphrody_core
// import serde_json
// import std
// import std
// import std
// import std
// import std
// import std
// import std
// import super
// import aphrody_core
// import std
// import std
// L19-L25: pub struct Request
// L27-L34: pub struct Shared
// L37-L46: pub fn new(state: AppState, dist: PathBuf) -> Shared
// L49-L57: pub fn pump(&self, st: &AppState)
// L60-L62: fn sse_frame(sop: &SequencedOp) -> String
// L64-L81: pub fn content_type(path: &str) -> &'static str
// L83-L91: pub fn security_headers() -> Vec<(&'static str, String)>
// L93-L108: pub fn parse_request(buf: &[u8]) -> Option<(Request, usize)>
// L110-L138: fn read_request(stream: &mut TcpStream) -> std::io::Result<Option<Request>>
// L140-L151: fn status_text(code: u16) -> &'static str
// L153-L163: fn respond(stream: &mut TcpStream, code: u16, extra: &[(&str, String)], body: &[u8], head_only: bool)
// L165-L171: fn json_resp(stream: &mut TcpStream, code: u16, v: serde_json::Value, cors: bool)
// L173-L183: pub fn safe_rel(path: &str) -> Option<PathBuf>
// L185-L202: fn serve_static(stream: &mut TcpStream, dist: &Path, path: &str, head_only: bool)
// L204-L252: fn handle_events(mut stream: TcpStream, shared: &Shared, req: &Request)
// L254-L325: fn handle_conn(mut stream: TcpStream, shared: Arc<Shared>)
// L328-L337: pub fn serve(addr: &str, shared: Arc<Shared>, on_ready: impl FnOnce(std::net::SocketAddr)) -> std::io::Result<()>
// L340-L438: mod tests
// L347-L357: fn parses_requests_and_rejects_traversal()
// L359-L371: fn start() -> (std::net::SocketAddr, Arc<Shared>)
// L373-L379: fn http(addr: std::net::SocketAddr, req: &str) -> String
// L382-L393: fn serves_static_with_isolation_headers()
// L396-L437: fn mcp_and_ops_relay_end_to_end()

================================================
FILE: aphrody-app/crates/aphrody-host/src/tui.rs
================================================

// [OUTLINE - 7 symbols, 139 lines]
// import aphrody_core
// import aphrody_core
// import super
// L8-L12: struct Cell
// L21-L25: pub struct Options
// L27-L36: pub fn demo_wm(layout: LayoutKind, windows: usize) -> WindowManager
// L38-L114: pub fn render(wm: &mut WindowManager, opt: &Options) -> String
// L117-L139: mod tests
// L121-L130: fn plain_snapshot_contains_titles_and_active_workspace()
// L133-L138: fn color_snapshot_uses_fluent_tokens()

================================================
FILE: aphrody-app/crates/aphrody-wasm/shaders/mica.wgsl
================================================

// Mica backdrop and rounded-rect SDF windows. Fluent UI 2 tokens:
// #0F0F0F (bg), #1C1C1C (layer), #0078D4 (brand), #60CDFF (brand light).
// Colors are written straight to a non-sRGB canvas format.

struct Uniforms {
// x,y = resolution in device pixels, z = time in seconds, w = window count
info: vec4<f32>,
// x = device pixel ratio, y = hovered window index (-1 for none)
extra: vec4<f32>,
// per window: x, y, w, h in device pixels
rects: array<vec4<f32>, 32>,
// per window: x = focused (0/1), y = hue seed
meta: array<vec4<f32>, 32>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsOut {
@builtin(position) pos: vec4<f32>,
@location(0) uv: vec2<f32>,
};

const BG: vec3<f32> = vec3<f32>(0.0588, 0.0588, 0.0588);
const LAYER: vec3<f32> = vec3<f32>(0.1098, 0.1098, 0.1098);
const BRAND: vec3<f32> = vec3<f32>(0.0, 0.4706, 0.8314);
const BRAND_LIGHT: vec3<f32> = vec3<f32>(0.3765, 0.8039, 1.0);

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VsOut {
var p = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
var o: VsOut;
o.pos = vec4<f32>(p[i], 0.0, 1.0);
o.uv = p[i] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5);
return o;
}

fn hash21(p: vec2<f32>) -> f32 {
var q = fract(p * vec2<f32>(123.34, 456.21));
q = q + dot(q, q + 45.32);
return fract(q.x * q.y);
}

fn value_noise(p: vec2<f32>) -> f32 {
let i = floor(p);
let f = fract(p);
let s = f * f * (3.0 - 2.0 * f);
let a = hash21(i);
let b = hash21(i + vec2<f32>(1.0, 0.0));
let c = hash21(i + vec2<f32>(0.0, 1.0));
let d = hash21(i + vec2<f32>(1.0, 1.0));
return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

fn sd_round_box(p: vec2<f32>, half_size: vec2<f32>, r: f32) -> f32 {
let q = abs(p) - half_size + vec2<f32>(r, r);
return length(max(q, vec2<f32>(0.0, 0.0))) + min(max(q.x, q.y), 0.0) - r;
}

// Mica: a slowly drifting, low-frequency tint over the dark base, plus grain.
fn mica(px: vec2<f32>, uv: vec2<f32>) -> vec3<f32> {
let t = u.info.z * 0.03;
let low = value_noise(px / 420.0 + vec2<f32>(t, -t)) * 0.6 + value_noise(px / 170.0 - vec2<f32>(t, t)) * 0.4;
var c = mix(BG, LAYER, clamp(uv.y * 0.6 + low * 0.5, 0.0, 1.0));
c = c + BRAND * (0.045 * smoothstep(0.55, 1.0, low));
c = c + BRAND_LIGHT * (0.012 * smoothstep(0.0, 0.4, 1.0 - uv.y) * low);
let grain = (hash21(floor(px)) - 0.5) * 0.012;
return c + vec3<f32>(grain, grain, grain);
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
let res = u.info.xy;
let px = in.uv * res;
let dpr = max(u.extra.x, 1.0);
var col = mica(px, in.uv);
let count = i32(u.info.w);
for (var i = 0; i < 32; i = i + 1) {
if (i >= count) {
break;
}
let r = u.rects[i];
let m = u.meta[i];
let half_size = r.zw * 0.5;
let center = r.xy + half_size;
let radius = 8.0 * dpr;
let local = px - center;
let d = sd_round_box(local, half_size, radius);
// drop shadow, offset downward
let sd = sd_round_box(local - vec2<f32>(0.0, 6.0 * dpr), half_size, radius);
let shadow = exp(-max(sd, 0.0) / (14.0 * dpr)) * 0.38;
col = mix(col, vec3<f32>(0.0, 0.0, 0.0), shadow * step(0.0, d));
let inside = 1.0 - smoothstep(-0.75, 0.75, d);
if (inside > 0.0) {
// acrylic fill: the mica backdrop lifted toward the layer color
var fill = mix(mica(px, in.uv), LAYER, 0.82) + vec3<f32>(0.018, 0.018, 0.018);
let title_h = 32.0 * dpr;
let in_title = step(local.y, -half_size.y + title_h);
fill = fill + vec3<f32>(0.03, 0.03, 0.03) * in_title;
// accent rule under the title bar for the focused window
let rule = step(abs(local.y - (-half_size.y + title_h)), 1.0 * dpr) * m.x;
fill = mix(fill, BRAND, rule);
if (i32(u.extra.y) == i) {
fill = fill + BRAND_LIGHT * 0.035;
}
// 1 px border; focused windows get the brand ring and a soft glow
let ring = 1.0 - smoothstep(0.0, 1.25 * dpr, abs(d + 0.5 * dpr));
let border = mix(vec3<f32>(0.24, 0.24, 0.24), BRAND_LIGHT, m.x);
fill = mix(fill, border, ring * mix(0.55, 0.95, m.x));
col = mix(col, fill, inside);
} else if (m.x > 0.5) {
let glow = exp(-max(d, 0.0) / (10.0 * dpr)) * 0.35;
col = col + BRAND * glow;
}
}
return vec4<f32>(clamp(col, vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(1.0, 1.0, 1.0)), 1.0);
}

================================================
FILE: aphrody-app/crates/aphrody-wasm/src/gpu.rs
================================================

// [OUTLINE - 4 symbols, 87 lines]
// import crate
// import js_sys
// import wasm_bindgen
// import wasm_bindgen_futures
// import web_sys
// L16-L23: pub struct Renderer
// L25-L27: fn js(e: JsValue) -> String
// L30-L68: pub async fn new(canvas: &HtmlCanvasElement, wgsl: &str) -> Result<Renderer, String>
// L70-L85: pub fn render(&self, uniforms: &[u8]) -> Result<(), String>

================================================
FILE: aphrody-app/crates/aphrody-wasm/src/opfs.rs
================================================

// [OUTLINE - 15 symbols, 170 lines]
// import aphrody_core
// import js_sys
// import std
// import std
// import std
// import wasm_bindgen
// import wasm_bindgen_futures
// import web_sys
// L16-L22: struct Inner
// L25-L27: pub struct OpfsStorage
// L29-L31: fn fname(key: &str) -> String
// L33-L35: fn kname(file: &str) -> String
// L37-L39: fn js(e: JsValue) -> String
// L43-L69: pub async fn open() -> Result<OpfsStorage, String>
// L71-L103: fn schedule(&self)
// L106-L115: async fn write_file(dir: &FileSystemDirectoryHandle, name: &str, bytes: &[u8]) -> Result<(), String>
// L118-L121: fn get(&self, key: &str) -> StorageResult<Option<Vec<u8>>>
// L122-L132: fn put(&mut self, key: &str, value: &[u8]) -> StorageResult<()>
// L133-L143: fn append(&mut self, key: &str, value: &[u8]) -> StorageResult<()>
// L144-L159: fn delete(&mut self, key: &str) -> StorageResult<bool>
// L160-L162: fn list(&self, prefix: &str) -> StorageResult<Vec<String>>
// L163-L166: fn flush(&mut self) -> StorageResult<()>
// L170: fn _assert_error_type(_: StorageError)

================================================
FILE: aphrody-app/crates/aphrody-wasm/src/scene.rs
================================================

// [OUTLINE - 5 symbols, 58 lines]
// import aphrody_core
// import super
// import aphrody_core
// import aphrody_core
// L11-L23: pub fn pack_uniforms(res: (f32, f32), time: f32, dpr: f32, hover: Option<usize>, placed: &[Placed]) -> Vec<f32>
// L25-L27: pub fn to_bytes(f: &[f32]) -> Vec<u8>
// L30-L58: mod tests
// L36-L50: fn packs_to_wgsl_layout()
// L53-L57: fn shader_declares_matching_array_sizes()

================================================
FILE: aphrody-app/crates/aphrody-wasm/src/web.rs
================================================

// [OUTLINE - 21 symbols, 367 lines]
// import crate
// import crate
// import crate
// import aphrody_core
// import aphrody_core
// import aphrody_core
// import aphrody_core
// import aphrody_core
// import js_sys
// import std
// import std
// import wasm_bindgen
// import wasm_bindgen_futures
// import web_sys
// L21-L31: struct App
// L38-L40: fn window() -> Window
// L42-L46: fn set_status(doc: &Document, text: &str)
// L48-L50: fn with_app<R>(f: impl FnOnce(&mut App) -> R) -> Option<R>
// L52-L67: fn hud_text(app: &mut App) -> String
// L70-L72: fn app_storage(&self) -> &'static str
// L74-L79: fn persist_layout(&mut self)
// L81-L88: fn click(&mut self)
// L91-L96: fn post_op(op: &aphrody_core::fluid::Op)
// L98-L100: fn random_client_id() -> u64
// L103-L110: pub fn start()
// L112-L162: async fn run() -> Result<(), String>
// L164-L221: fn install_input(canvas: &HtmlCanvasElement)
// L223-L252: fn connect_relay()
// L254-L266: fn start_frame_loop()
// L268-L291: fn frame(app: &mut App, t_ms: f64)
// L295-L301: fn call_tool(name: &str, args_json: &str) -> Result<String, String>
// L305-L307: pub fn mcp_tools() -> String
// L311-L313: pub fn mcp_call(name: &str, args_json: &str) -> Result<String, JsValue>
// L317-L319: pub fn mcp_jsonrpc(body: &str) -> Option<String>
// L321-L367: fn register_webmcp()

================================================
FILE: aphrody-app/packaging/alpine/APKBUILD
================================================

# Alpine Linux APKBUILD

pkgname=aphrody-app
pkgver=0.1.0
pkgrel=0
pkgdesc="Pure Rust WebGPU/WGSL Wayland tiling shell and WebMCP host"
url="https://aphrody.app"
arch="x86_64 aarch64"
license="MIT"
makedepends="cargo"

build() {
cd "$startdir/../.."
cargo build --release --locked -p aphrody-host
}

check() {
cd "$startdir/../.."
cargo test --workspace --locked
}

package() {
cd "$startdir/../.."
install -Dm755 "target/release/aphrody-app" "$pkgdir/usr/bin/aphrody-app"
}

================================================
FILE: aphrody-app/packaging/arch/PKGBUILD
================================================

# PKGBUILD for Arch Linux / CachyOS

pkgname=aphrody-app
pkgver=0.1.0
pkgrel=1
pkgdesc="Pure Rust WebGPU/WGSL Wayland tiling desktop shell, OPFS/WAL store, Fluid sync and WebMCP host"
arch=('x86_64' 'aarch64')
url="https://aphrody.app"
license=('MIT')
depends=()
makedepends=('cargo' 'rustc')

build() {
cd "$startdir/../.."
cargo build --release --locked -p aphrody-host
}

package() {
cd "$startdir/../.."
install -Dm755 "target/release/aphrody-app" "$pkgdir/usr/bin/aphrody-app"
install -Dm644 "packaging/wayland/aphrody-app.desktop" "$pkgdir/usr/share/wayland-sessions/aphrody-app.desktop"
}

================================================
FILE: aphrody-app/packaging/nix/default.nix
================================================

{ lib, rustPlatform }:

rustPlatform.buildRustPackage {
pname = "aphrody-app";
version = "0.1.0";
src = ../..;
cargoLock.lockFile = ../../Cargo.lock;
cargoBuildFlags = [ "-p" "aphrody-host" ];
meta = with lib; {
description = "Pure Rust WebGPU/WGSL Wayland tiling desktop shell and WebMCP host";
homepage = "https://aphrody.app";
license = licenses.mit;
mainProgram = "aphrody-app";
platforms = platforms.unix ++ platforms.windows;
};
}

================================================
FILE: aphrody-app/packaging/wayland/aphrody-app.desktop
================================================

[Desktop Entry]
Name=Aphrody Shell
Comment=Pure Rust WebGPU/WGSL Wayland Tiling Shell
Exec=/usr/bin/aphrody-app tui
Type=Application
DesktopNames=Aphrody
Keywords=wayland;wm;tiling;webgpu;rust;

================================================
FILE: aphrody-app/tools/rustc_argfile.rs
================================================

// [OUTLINE - 1 symbols, 22 lines]
// import std
// L6-L22: fn main()

================================================
FILE: aphrody-app/web/index.html
================================================

// [OUTLINE - 0 symbols, 203 lines]

================================================
FILE: l2l/PLAN.md
================================================

# l2l extraction plan

l2l is the single home for migration tooling: the polyglot, poly-stack migrator (any language or
stack to Rust + Bun), Node-to-Bun conversion, AST/IR tooling on oxc, tree-sitter and LLVM, and the
Bun plugins and loaders it needs. Written on 2026-11-12 from measurements of the tree; execution
happens in a dedicated session working directly in `apps/l2l`.

## 1. Evidence: where migration code lives today

Measured with `tokei` (code lines), `dust` (disk) and `git remote`.

| Source                                                                                                                                             | Size                                                                       | Repo                                 | Content                                                                                                                                                     | Verdict                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `third_party/n2b`                                                                                                                                  | 10 GiB (vendor 6.8 GiB, target 2.5 GiB, migrations 611 MiB, forks 146 MiB) | local-only git, 3 commits, no remote | Rust 5.1k, TS 2.7k: `n2b-core`, `n2b-cli`, `n2b-migrate`, `n2b-polyglot`, `n2b-llvm`, `n2b-dotnet` (node-api-dotnet rewrite), `n2b-ghidra`, `n2b-mingw-rea` | first-party code wrongly under `third_party/`; core of l2l (ghidra/mingw parts go to r2b)                   |
| `third_party/n2b/migrations/vscode-zed`, `ue58-sovereign`                                                                                          | 611 MiB                                                                    | same                                 | migration proofs                                                                                                                                            | keep as l2l fixtures only if they are reproducible; outputs are not committed                               |
| `third_party/n2b/vendor/oxc/*` (oxc, oxc-resolver, oxc-node, oxc-sourcemap, oxc-browserslist, oxc-zed, oxlint-migrate, eslint-plugin-oxlint, tsrs) | 184 MiB                                                                    | upstream oxc-project repos           | upstream                                                                                                                                                    | pin under `third_party/oxc` in `src.lock.json`; l2l depends on the published crates, forks only for patches |
| `third_party/n2b/vendor/llvm-project`                                                                                                              | 2.7 GiB                                                                    | llvm/llvm-project                    | duplicate of `third_party/llvm-project`                                                                                                                     | delete after pointing to `third_party/llvm-project`                                                         |
| `third_party/n2b/vendor/tree-sitter`, `microsoft`, `helix`, `ripgrep`                                                                              | 870 MiB                                                                    | upstream                             | duplicates of `third_party/tree-sitter`, `third_party/microsoft`, forks under aphrody-dev                                                                   | delete after repointing                                                                                     |
| `third_party/n2b/vendor/nodejs`, `typescript`, `typescript-go`, `vscode`, `electron`, `vercel-typescript*`                                         | 2.2 GiB                                                                    | upstream                             | reference sources for migrations                                                                                                                            | pin read-only in `third_party/` (sparse), never vendored in l2l                                             |
| `crates/depot-migrate`                                                                                                                             | 16 KiB                                                                     | aphrody-dev/src                      | Rust                                                                                                                                                        | move to l2l                                                                                                 |
| `packages/bun-plugins`                                                                                                                             | 128 KiB                                                                    | aphrody-dev/src                      | TS 2.5k                                                                                                                                                     | move to `apps/l2l/packages/bun-plugins`                                                                     |
| `packages/bun-parity`                                                                                                                              | 226 KiB                                                                    | aphrody-dev/src                      | TS 3.5k, Node/Bun parity checks                                                                                                                             | move; it is the conversion test oracle                                                                      |
| GitHub `yolo-rs/yolo-bun`                                                                                                                          | 40 MB                                                                      | yolo-rs                              | `packages/package-converter`, `bun-loaders`, `bun-workspace`, `yolo-bun-plugin`, Bun patch queue                                                            | absorb converter, loaders and plug                                                                          |

[... truncated by token budget ...]
