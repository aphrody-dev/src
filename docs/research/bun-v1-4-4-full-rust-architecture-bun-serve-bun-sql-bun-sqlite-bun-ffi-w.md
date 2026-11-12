# Sovereign Deep-Research Dossier: Bun v1.4.4 Full-Rust architecture Bun.serve Bun.SQL bun:sqlite bun:ffi WebGPU WASM32 Material Design 3 Expressive HCT Fluent 2 CRDT Spacedrive VDFS 10

- **Generated At**: `2026-11-12T03:57:51.882Z`
- **Slug**: `bun-v1-4-4-full-rust-architecture-bun-serve-bun-sql-bun-sqlite-bun-ffi-w`
- **Execution Latency**: `3308.2 ms`
- **Detected Upstream Libraries**: `bun`, `wgpu`, `sqlite`
- **Evidence Summary**: `24` deduplicated sources (`Tier 1: 20`, `Tier 2: 2`, `Tier 3: 2`)

## 1. Decomposed Sub-Queries & Channel Telemetry

### Targeted Sub-Queries
1. `Bun v1.4.4 Full-Rust architecture Bun.serve Bun.SQL bun:sqlite bun:ffi WebGPU WASM32 Material Design 3 Expressive HCT Fluent 2 CRDT Spacedrive VDFS 10`
2. `Bun v1.4.4 Full-Rust architecture Bun.serve Bun.SQL bun:sqlite bun:ffi WebGPU WASM32 Material Design 3 Expressive HCT Fluent 2 CRDT Spacedrive VDFS 10 specification architecture reference`

### Parallel Channel Status
| Channel | Status |
| :--- | :--- |
| `context7_official_docs` | OK (12 items) |
| `exa_neural_web` | OK (5 items) |
| `github_live_api` | OK (0 items) |
| `systems_kernel_freedesktop` | OK (2 items) |
| `local_monorepo_grounding` | OK (6 items) |

## 2. Ranked & Deduplicated Multi-Channel Evidence

### Tier 1: Official Spec / Context7 / Local Verified Source (20)

1. **[[Context7 /oven-sh/bun] Bun 1.4 repo describes itself as Rust with C++ only for JavaScriptCore integration](https://github.com/oven-sh/bun/blob/main/CLAUDE.md)** (`context7`, blake3=`05210a2fec8a`)
   - ### Bun 1.4 repo describes itself as Rust with C++ only for JavaScriptCore integration Source: https://github.com/oven-sh/bun/blob/main/CLAUDE.md The top of the repo's own developer guide (checked out at version 1.4.3 per the LATEST file) states the runtime is written primarily in Rust, with C++ remaining only for JavaScriptCore integration, powered by WebKit's JavaScriptCore engine. This directly confirms Bun 1.4 ships the Rust implementation (no .zig files exist in the buil
2. **[[Context7 /oven-sh/bun] Call native SQLite library with bun:ffi dlopen](https://github.com/oven-sh/bun/blob/main/docs/runtime/ffi.mdx)** (`context7`, blake3=`8694395a83b3`)
   - ### Call native SQLite library with bun:ffi dlopen Source: https://github.com/oven-sh/bun/blob/main/docs/runtime/ffi.mdx Load a dynamic library using `dlopen` and invoke an exported function like `sqlite3_libversion`. Uses `suffix` to dynamically resolve the platform-specific library extension (.dylib, .so, or .dll). ```ts import { dlopen, FFIType, suffix } from "bun:ffi"; // `suffix` is either "dylib", "so", or "dll" depending on the platform // you don't have to use "suffix
3. **[[Context7 /oven-sh/bun] Create fullstack Bun server with HTML routes, API routes, and SQLite](https://github.com/oven-sh/bun/blob/main/docs/bundler/fullstack.mdx)** (`context7`, blake3=`6e554290ef4d`)
   - ### Create fullstack Bun server with HTML routes, API routes, and SQLite Source: https://github.com/oven-sh/bun/blob/main/docs/bundler/fullstack.mdx Defines a Bun.serve instance with frontend HTML routes, CRUD API routes for users backed by bun:sqlite, a health check, development HMR/console, and a 404 fallback. ```typescript import { serve } from "bun"; import { Database } from "bun:sqlite"; import homepage from "./public/index.html"; import dashboard from "./public/dashboar
4. **[[Context7 /oven-sh/bun] Create SQLite connections with Bun.SQL](https://github.com/oven-sh/bun/blob/main/docs/runtime/sql.mdx)** (`context7`, blake3=`84e5758c3660`)
   - ### Create SQLite connections with Bun.SQL Source: https://github.com/oven-sh/bun/blob/main/docs/runtime/sql.mdx Shows how to create SQLite connections using Bun.SQL with in-memory, file-based, and options object approaches. The options object requires `filename` to select SQLite, making `adapter` optional; a plain filename string needs `{ adapter: "sqlite" }`. ```typescript import { SQL } from "bun"; // In-memory database const memory = new SQL(":memory:"); const memory2 = n
5. **[[Context7 /websites/rs_wgpu] is_browser_webgpu_supported: Check WebGPU support](https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search=u32+-%3E+bool)** (`context7`, blake3=`2317fa5a4528`)
   - ### is_browser_webgpu_supported: Check WebGPU support Source: https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search=u32+-%3E+bool Determines whether the Backends::BROWSER_WEBGPU backend is supported. Returns true only when called from the main thread or a dedicated worker on wasm targets; on non-wasm targets always returns false. The check verifies the presence of the 'gpu' property and attempts to create an adapter. ```rust /// Determines whether the [`Backends::BROW
6. **[[Context7 /websites/rs_wgpu] Remove BROWSER_WEBGPU backend if unsupported](https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search=)** (`context7`, blake3=`c50378fe7505`)
   - ### Remove BROWSER_WEBGPU backend if unsupported Source: https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search= Conditionally removes the BROWSER_WEBGPU backend from the instance description when the browser does not support WebGPU, then creates the instance. ```rust .contains(wgt::Backends::BROWSER_WEBGPU) && !is_browser_webgpu_supported().await { instance_desc.backends.remove(wgt::Backends::BROWSER_WEBGPU); } crate::Instance::new(instance_desc) } ```
7. **[[Context7 /websites/rs_wgpu] wgpu Adapter methods source code](https://docs.rs/wgpu/latest/src/wgpu/api/adapter.rs.html?search=std%3A%3Avec)** (`context7`, blake3=`9479733e752b`)
   - ### wgpu Adapter methods source code Source: https://docs.rs/wgpu/latest/src/wgpu/api/adapter.rs.html?search=std%3A%3Avec This snippet contains the full source code of the `Adapter` struct's methods from the wgpu crate's `adapter.rs` file. It includes methods for accessing the underlying HAL adapter, custom backend adapters, surface support, features, limits, adapter info, downlevel capabilities, texture format features, presentation timestamps, and cooperative matrix propert
8. **[[Context7 /websites/rs_wgpu] wgpu Surface API: SurfaceConfiguration and Surface methods](https://docs.rs/wgpu/latest/src/wgpu/api/surface.rs.html?search=std%3A%3Avec)** (`context7`, blake3=`75052585ff9f`)
   - ### wgpu Surface API: SurfaceConfiguration and Surface methods Source: https://docs.rs/wgpu/latest/src/wgpu/api/surface.rs.html?search=std%3A%3Avec Rust source code for the `Surface` type and its methods in wgpu's `surface.rs`. It defines `SurfaceConfiguration`, the `Surface` struct, and methods `get_capabilities`, `display_hdr_info`, and `get_default_config`. The `get_default_config` method returns a configuration with `SurfaceColorSpace::Auto` and `desired_maximum_frame_lat
9. **[[Context7 /websites/sqlite_docs] Artifact 0a2ec4716a55fa7d5ac45df6e7f3d8eda6da519c9ee4f1b137fc9b78596e12a7](https://www.sqlite.org/src/artifact/0a2ec4716a55fa7d)** (`context7`, blake3=`e6e2af71f687`)
   - ### Artifact 0a2ec4716a55fa7d5ac45df6e7f3d8eda6da519c9ee4f1b137fc9b78596e12a7 Source: https://www.sqlite.org/src/artifact/0a2ec4716a55fa7d > /* > ** The SQLITE_THREADSAFE macro must be defined as 0, 1, or 2. > ** 0 means mutexes are permanently disable and the library is never > ** threadsafe. 1 means the library is serialized which is the highest
10. **[[Context7 /websites/sqlite_docs] Disable mutexes at compile-time with -DSQLITE_THREADSAFE=0](https://www.sqlite.org/custombuild.html)** (`context7`, blake3=`6e61f84e8860`)
   - ### Disable mutexes at compile-time with -DSQLITE_THREADSAFE=0 Source: https://www.sqlite.org/custombuild.html Recompile SQLite with this option to completely disable the mutex subsystem. Recommended for single-threaded applications or those using SQLite from a single thread, as it improves performance and reduces library footprint. ```c -DSQLITE_THREADSAFE=0 ```
11. **[[Context7 /websites/sqlite_docs] Skip flattening for MATERIALIZED CTEs](https://www.sqlite.org/src/artifact/9350f79c65ee53cf)** (`context7`, blake3=`c7e3a6fa2e02`)
   - ### Skip flattening for MATERIALIZED CTEs Source: https://www.sqlite.org/src/artifact/9350f79c65ee53cf Prevents the usual optimizations (flattening and ORDER BY elimination) on MATERIALIZED common table expressions because they act as optimization fences. ```c /* Do not attempt the usual optimizations (flattening and ORDER BY ** elimination) on a MATERIALIZED common table expression because ** a MATERIALIZED common table expression is an optimization fence. */ if( pItem->fg.i
12. **[Bun APIs](https://bun.com/docs/runtime/bun-apis.md)** (`exa`, blake3=`c1fc4d32b4e2`)
   - # Bun APIs > Overview of Bun's native APIs available on the Bun global object and built-in modules Bun implements a set of native APIs on the `Bun` global object and through several built-in modules. These APIs are heavily optimized and are the canonical "Bun-native" way to implement common functionality. Bun strives to implement standard Web APIs wherever possible. Bun introduces new APIs primarily for server-side tasks where no standard exists, such as file I/O and starting
13. **[Bun v1.4.4 | Bun Blog](https://bun.com/blog/bun-v1.4.4)** (`exa`, blake3=`244c3c21e49b`)
   - ## New in `Bun.SQL` and `bun:sqlite`# ### `Bun.SQL` uses up to 48% less CPU per query# We reworked `Bun.SQL`, `bun:sqlite` and `node:sqlite` in a single change that replaces 149 open pull requests and fixes 51 issues. Every query allocates less memory and executes fewer instructions on the client. Client-side CPU usage with PostgreSQL, measured in user-space instructions on Linux x64: | Operation | Change | | --- | --- | | Point `SELECT` | -48% | | 100-row `SELECT` | -30% | |
14. **[Local AI-OS 25-Feed Sentinel Report (SENTINEL_REPORT.md)](file:///C:/src/packages/ai-os/SENTINEL_REPORT.md)** (`local_monorepo`, blake3=`9870c4b566b8`)
   - Generated: `2026-11-12T03:51:22.854Z` | Engine: `oven-sh/bun v1.4.4` | WAL DB: `sentinel.sqlite` | Live: **4** | Cached: **0** | Offline: **0** | ## Chrome Canary vs `C:\src\packages\bun-parity` Live Alignment | - **Local Sovereign Runtime**: `Bun v1.4.4` — Native Blink/Web Parity: **71%**, Patched Sovereign Parity: **100%**
15. **[Local Monorepo Lockfile (src.lock.json)](file:///C:/src/src.lock.json)** (`local_monorepo`, blake3=`78acfd4384d4`)
   - Pinned toolchains: archguard=archguard v0.1.0 (Rust 2024 Sovereign Monorepo Architecture Gate), bun=1.4.4, wck=wck v1.0.0 (Compile-Time Web Validator - oven-sh/bun v1.4.4 Full Rust) | Locked repositories: packages/bun-parity@c80e20e2, packages/bun-plugins@5575e694, packages/chromium-bun@3b36569f, packages/google-design@d777e76f
16. **[Local Workspace Manifest: apps\aphrody\README.md](file:///C:/src/apps/aphrody/README.md)** (`local_monorepo`, blake3=`2cfe81b08043`)
   - Pixel-identical replica of `https://www.google.com/` aligned with `https://design.google/`, Chromium UI (`C:\src\third_party\chromium\src\docs\ui\index.md` / GoogleChrome standards), Microsoft Fluent UI 2, Apple macOS Sequoia traffic-light windowing, Storytold WASM+WebGPU Creative Suite, and Universal Declarative Store & Multi-Ecosystem Package Manager.
17. **[Local Workspace Manifest: packages\ai-os\README.md](file:///C:/src/packages/ai-os/README.md)** (`local_monorepo`, blake3=`4e82ab38e2e2`)
   - Unified Multi-Protocol AI Control Plane, Native `bun:ffi` Computer-Use Bus, Multi-Provider Inference Federation, and Real-Time/Nightly Standards Sentinel built in **100% pure `oven-sh/bun` v1.4.4** (`dependencies: {}`, `devDependencies: {}`).
18. **[Local Workspace Manifest: packages\google-design\README.md](file:///C:/src/packages/google-design/README.md)** (`local_monorepo`, blake3=`f4188495901d`)
   - # Google Design Sovereign Mirror & UI Gate (`gds`)
19. **[Local Workspace Manifest: README.md](file:///C:/src/README.md)** (`local_monorepo`, blake3=`c0cbd73657ad`)
   - # Sovereign Monorepo (`C:\src`) — Architecture & Operating Topology (Late 2026)
20. **[Welcome to Bun](https://bun.com/docs.md)** (`exa`, blake3=`6e56c88ac7e5`)
   - Hello world in minutes with Bun.serve. ... Bun is an all-in-one toolkit for JavaScript and TypeScript apps. It ships as a single executable called `bun`. At its core is the Bun runtime, a fast JavaScript runtime designed as a drop-in replacement for Node.js. It's written in Rust and powered by JavaScriptCore, reducing startup time and memory usage.

### Tier 2: Upstream GitHub/GitLab Repo (2)

1. **[Freedesktop GitLab: barracuda156/wayland](https://gitlab.freedesktop.org/barracuda156/wayland)** (`systems_upstream`, blake3=`71a19c0221b8`)
   - Core Wayland window system code and protocol for macOS
2. **[Freedesktop GitLab: dougnazar/weston](https://gitlab.freedesktop.org/dougnazar/weston)** (`systems_upstream`, blake3=`d4e4508b6d02`)
   - A lightweight and functional Wayland compositor

### Tier 3: Neural Web (2)

1. **[Feature catalog — oven-sh/bun codebase unpack](https://codevetter.com/unpack/bun/feature-catalog)** (`exa`, blake3=`823f77454ac6`)
   - User-facing surface splits four ways: the CLI subcommand table, the `Bun` global namespace, the Node.js compatibility layer, and Web APIs. The CLI covers running scripts, package management (install/add/update/remove/link/patch/publish/audit/why/dedupe/prune/outdated), bundling (`bun build`, including `--compile` standalone executables), testing (`bun test`), a REPL, `bunx`, `bun init`/`bun create`, and self-upgrade. The `Bun` global is defined by a JSC hash table in `BunObje
2. **[Networking and I/O | oven-sh/bun | DeepWiki](https://deepwiki.com/oven-sh/bun/5-networking-and-io)** (`exa`, blake3=`34d41c0d7406`)
   - This document provides a high-level overview of Bun's networking and I/O infrastructure. Bun features a high-performance networking stack built on a custom fork of `uWebSockets` and `uSockets`, tightly integrated with the Zig runtime, Rust-based request handling, and JavaScriptCore (JSC). ... - HTTP Server (Bun.serve) — Document Bun.serve(): routing, request/response handling, TLS, WebSocket upgrade, static/file/HTML routes, error handlers, graceful shutdown, uWS HttpContext/

## 3. Citation Ledger

| # | Tier | Channel | Source | Blake3 Prefix |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Tier 1 | `context7` | [[Context7 /oven-sh/bun] Bun 1.4 repo describes itself as Rust with C++ only for JavaScriptCore integration](https://github.com/oven-sh/bun/blob/main/CLAUDE.md) | `05210a2fec8a836a` |
| 2 | Tier 1 | `context7` | [[Context7 /oven-sh/bun] Call native SQLite library with bun:ffi dlopen](https://github.com/oven-sh/bun/blob/main/docs/runtime/ffi.mdx) | `8694395a83b31a00` |
| 3 | Tier 1 | `context7` | [[Context7 /oven-sh/bun] Create fullstack Bun server with HTML routes, API routes, and SQLite](https://github.com/oven-sh/bun/blob/main/docs/bundler/fullstack.mdx) | `6e554290ef4d66c4` |
| 4 | Tier 1 | `context7` | [[Context7 /oven-sh/bun] Create SQLite connections with Bun.SQL](https://github.com/oven-sh/bun/blob/main/docs/runtime/sql.mdx) | `84e5758c3660296c` |
| 5 | Tier 1 | `context7` | [[Context7 /websites/rs_wgpu] is_browser_webgpu_supported: Check WebGPU support](https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search=u32+-%3E+bool) | `2317fa5a4528dec2` |
| 6 | Tier 1 | `context7` | [[Context7 /websites/rs_wgpu] Remove BROWSER_WEBGPU backend if unsupported](https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search=) | `c50378fe750553dc` |
| 7 | Tier 1 | `context7` | [[Context7 /websites/rs_wgpu] wgpu Adapter methods source code](https://docs.rs/wgpu/latest/src/wgpu/api/adapter.rs.html?search=std%3A%3Avec) | `9479733e752babe5` |
| 8 | Tier 1 | `context7` | [[Context7 /websites/rs_wgpu] wgpu Surface API: SurfaceConfiguration and Surface methods](https://docs.rs/wgpu/latest/src/wgpu/api/surface.rs.html?search=std%3A%3Avec) | `75052585ff9faedb` |
| 9 | Tier 1 | `context7` | [[Context7 /websites/sqlite_docs] Artifact 0a2ec4716a55fa7d5ac45df6e7f3d8eda6da519c9ee4f1b137fc9b78596e12a7](https://www.sqlite.org/src/artifact/0a2ec4716a55fa7d) | `e6e2af71f6879e63` |
| 10 | Tier 1 | `context7` | [[Context7 /websites/sqlite_docs] Disable mutexes at compile-time with -DSQLITE_THREADSAFE=0](https://www.sqlite.org/custombuild.html) | `6e61f84e88603feb` |
| 11 | Tier 1 | `context7` | [[Context7 /websites/sqlite_docs] Skip flattening for MATERIALIZED CTEs](https://www.sqlite.org/src/artifact/9350f79c65ee53cf) | `c7e3a6fa2e02c677` |
| 12 | Tier 1 | `exa` | [Bun APIs](https://bun.com/docs/runtime/bun-apis.md) | `c1fc4d32b4e2e218` |
| 13 | Tier 1 | `exa` | [Bun v1.4.4 / Bun Blog](https://bun.com/blog/bun-v1.4.4) | `244c3c21e49bb817` |
| 14 | Tier 1 | `local_monorepo` | [Local AI-OS 25-Feed Sentinel Report (SENTINEL_REPORT.md)](file:///C:/src/packages/ai-os/SENTINEL_REPORT.md) | `9870c4b566b80f4b` |
| 15 | Tier 1 | `local_monorepo` | [Local Monorepo Lockfile (src.lock.json)](file:///C:/src/src.lock.json) | `78acfd4384d41fe4` |
| 16 | Tier 1 | `local_monorepo` | [Local Workspace Manifest: apps\aphrody\README.md](file:///C:/src/apps/aphrody/README.md) | `2cfe81b08043f7be` |
| 17 | Tier 1 | `local_monorepo` | [Local Workspace Manifest: packages\ai-os\README.md](file:///C:/src/packages/ai-os/README.md) | `4e82ab38e2e28e3f` |
| 18 | Tier 1 | `local_monorepo` | [Local Workspace Manifest: packages\google-design\README.md](file:///C:/src/packages/google-design/README.md) | `f4188495901def75` |
| 19 | Tier 1 | `local_monorepo` | [Local Workspace Manifest: README.md](file:///C:/src/README.md) | `c0cbd73657ad6026` |
| 20 | Tier 1 | `exa` | [Welcome to Bun](https://bun.com/docs.md) | `6e56c88ac7e53124` |
| 21 | Tier 2 | `systems_upstream` | [Freedesktop GitLab: barracuda156/wayland](https://gitlab.freedesktop.org/barracuda156/wayland) | `71a19c0221b89cba` |
| 22 | Tier 2 | `systems_upstream` | [Freedesktop GitLab: dougnazar/weston](https://gitlab.freedesktop.org/dougnazar/weston) | `d4e4508b6d02b9b0` |
| 23 | Tier 3 | `exa` | [Feature catalog — oven-sh/bun codebase unpack](https://codevetter.com/unpack/bun/feature-catalog) | `823f77454ac643f5` |
| 24 | Tier 3 | `exa` | [Networking and I/O / oven-sh/bun / DeepWiki](https://deepwiki.com/oven-sh/bun/5-networking-and-io) | `34d41c0d74068a5d` |
