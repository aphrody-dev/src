# Sovereign Deep-Research Dossier: Dioxus Blitz Stylo Taffy Vello Parley Kurbo Wgpu GPUI gpui-component Servo Tokio Axum Next.js Tailwind Shadcn Base UI Rust 12

- **Generated At**: `2026-11-12T04:47:57.421Z`
- **Slug**: `dioxus-blitz-stylo-taffy-vello-parley-kurbo-wgpu-gpui-gpui-component-ser`
- **Execution Latency**: `3087.8 ms`
- **Detected Upstream Libraries**: `tokio`, `axum`, `wgpu`
- **Evidence Summary**: `21` deduplicated sources (`Tier 1: 16`, `Tier 2: 0`, `Tier 3: 5`)

## 1. Decomposed Sub-Queries & Channel Telemetry

### Targeted Sub-Queries

1. `Dioxus Blitz Stylo Taffy Vello Parley Kurbo Wgpu GPUI gpui-component Servo Tokio Axum Next.js Tailwind Shadcn Base UI Rust 12`
2. `Dioxus Blitz Stylo Taffy Vello Parley Kurbo Wgpu GPUI gpui-component Servo Tokio Axum Next.js Tailwind Shadcn Base UI Rust 12 specification architecture reference`

### Parallel Channel Status

| Channel                      | Status        |
| :--------------------------- | :------------ |
| `context7_official_docs`     | OK (12 items) |
| `exa_neural_web`             | OK (5 items)  |
| `github_live_api`            | OK (0 items)  |
| `systems_kernel_freedesktop` | OK (0 items)  |
| `local_monorepo_grounding`   | OK (5 items)  |

## 2. Ranked & Deduplicated Multi-Channel Evidence

### Tier 1: Official Spec / Context7 / Local Verified Source (16)

1. **[[Context7 /websites/rs_axum_axum] axum::serve](https://docs.rs/axum/latest/axum/serve/fn.serve.html)** (`context7`, blake3=`2b040c0ba3cc`)
   - ### axum::serve Source: https://docs.rs/axum/latest/axum/serve/fn.serve.html Serves the service with the supplied listener. This function is available on crate feature `tokio` and (crate features `http1` or `http2`) only. It supports both HTTP/1 and HTTP/2. The returned future resolves to `io::Result<()>` but never actually completes or returns an error; TCP socket errors are handled by sleeping for one second. ```APIDOC ## Function serve
2. **[[Context7 /websites/rs_axum_axum] Description](https://context7.com/websites/rs_axum_axum)** (`context7`, blake3=`7fcb51962368`)
   - ### Description Serve the service with the supplied listener. This method of running a service is intentionally simple and doesn't support any configuration. Use hyper or hyper-util if you need configuration. It supports both HTTP/1 as well as HTTP/2.
3. **[[Context7 /websites/rs_axum_axum] Serving a Router with axum::serve](https://docs.rs/axum/latest/axum/fn.serve.html)** (`context7`, blake3=`9834b2529ed7`)
   - ### Serving a Router with axum::serve Source: https://docs.rs/axum/latest/axum/fn.serve.html Example of serving an axum Router using axum::serve. Binds a TCP listener to 0.0.0.0:3000 and serves the router. `rust use axum::{Router, routing::get}; let router = Router::new().route("/", get(|| async { "Hello, World!" })); let listener = tokio::net::TcpListener::bind("0.0.0.0:3000").await.unwrap(); axum::serve(listener, router).await.unwrap(); `
4. **[[Context7 /websites/rs_tokio] Decision tree for choosing a Tokio runtime](https://docs.rs/tokio/latest/src/tokio/runtime/mod.rs.html)** (`context7`, blake3=`492030aa35f5`)
   - ### Decision tree for choosing a Tokio runtime Source: https://docs.rs/tokio/latest/src/tokio/runtime/mod.rs.html ASCII diagram illustrating the decision process for selecting between multi-threaded, local, and current-thread runtimes based on work-stealing and !Send Future requirements. ```plaintext +------------------------------------------------------+ | Do you want work-stealing or multi-thread scheduler? | +------------------------------------------------------+ | Yes |
5. **[[Context7 /websites/rs_tokio] match_flavor! macro and Handle methods](https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/mod.rs.html)** (`context7`, blake3=`0a76adedae47`)
   - ### match_flavor! macro and Handle methods Source: https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/mod.rs.html Defines the `match_flavor!` macro to dispatch on the scheduler flavor, and implements several `Handle` methods: `current`, `blocking_spawner`, `is_local`, `timer_flavor`, `is_shutdown`, `push_remote_timer`, and `can_spawn_local_on_local_runtime`. The `is_shutdown` and `push_remote_timer` methods panic on the `CurrentThread` flavor because the alternative tim
6. **[[Context7 /websites/rs_tokio] push_remote_timer: Push alternative timer handle to inject_timers](https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/multi_thread/worker.rs.html)** (`context7`, blake3=`a2d8a9b25155`)
   - ### push_remote_timer: Push alternative timer handle to inject_timers Source: https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/multi_thread/worker.rs.html Only available with tokio_unstable and feature="time". Asserts timer_flavor is Alternative, locks synced, pushes the handle to inject_timers, then notifies a parked remote worker. ```rust #[cfg(all(tokio_unstable, feature = "time"))] pub(crate) fn push_remote_timer(&self, hdl: time_alt::EntryHandle) { assert_eq!(sel
7. **[[Context7 /websites/rs_tokio] Run-queue structures for work-stealing scheduler](https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/multi_thread/queue.rs.html)** (`context7`, blake3=`4dffe67fc27a`)
   - ### Run-queue structures for work-stealing scheduler Source: https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/multi_thread/queue.rs.html Defines the Local producer handle, Steal consumer handle, and Inner queue structure with atomic head/tail and a fixed-size buffer. Uses wider integers for ABA resilience and conditional types based on atomic u64 support. ```rust //! Run-queue structures to support a work-stealing scheduler use crate::loom::cell::UnsafeCell; use crate
8. **[[Context7 /websites/rs_wgpu] is_browser_webgpu_supported: Check WebGPU support](https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search=u32+-%3E+bool)** (`context7`, blake3=`2317fa5a4528`)
   - ### is_browser_webgpu_supported: Check WebGPU support Source: https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search=u32+-%3E+bool Determines whether the Backends::BROWSER_WEBGPU backend is supported. Returns true only when called from the main thread or a dedicated worker on wasm targets; on non-wasm targets always returns false. The check verifies the presence of the 'gpu' property and attempts to create an adapter. ```rust /// Determines whether the [`Backends::BROW
9. **[[Context7 /websites/rs_wgpu] wgpu dispatch.rs: backend dispatch infrastructure](https://docs.rs/wgpu/latest/src/wgpu/dispatch.rs.html?search=)** (`context7`, blake3=`75b8bcbde59f`)
   - ### wgpu dispatch.rs: backend dispatch infrastructure Source: https://docs.rs/wgpu/latest/src/wgpu/dispatch.rs.html?search= Defines the dispatch infrastructure for wgpu backends, including the `trait_alias!` macro, callback type aliases, and the `InstanceInterface` and `AdapterInterface` traits. The code uses `#[cfg]` attributes to conditionally import backend modules and `#[cfg(send_sync)]` to vary callback signatures. The `AsAny` trait is provided for downcasting, and the `
10. **[[Context7 /websites/rs_wgpu] wgpu Sampler and SamplerDescriptor definitions](https://docs.rs/wgpu/latest/src/wgpu/api/sampler.rs.html?search=Option%3CT%3E%2C+%28T+-%3E+U%29+-%3E+Option%3CU%3E)** (`context7`, blake3=`f5119bea86bd`)

- ### wgpu Sampler and SamplerDescriptor definitions Source: https://docs.rs/wgpu/latest/src/wgpu/api/sampler.rs.html?search=Option%3CT%3E%2C+%28T+-%3E+U%29+-%3E+Option%3CU%3E Defines the `Sampler` handle and `SamplerDescriptor` type alias for the wgpu crate. The `Sampler` struct wraps a dispatch sampler and implements equality, ordering, and hash via a proxy macro. The `as_custom` method is only available with the `custom` feature and returns a custom implementation if the bac

11. **[[Context7 /websites/rs_wgpu] wgpu_core.rs backend implementation](https://docs.rs/wgpu/latest/src/wgpu/backend/wgpu_core.rs.html?search=)** (`context7`, blake3=`c5a1f627e42f`)

- ### wgpu_core.rs backend implementation Source: https://docs.rs/wgpu/latest/src/wgpu/backend/wgpu_core.rs.html?search= Rust source file for the wgpu_core backend, showing imports, the ContextWgpuCore struct, and methods for creating adapters, devices, and textures from HAL instances. Includes safety notes for raw instance handles and uses wgc::global::Global. ```rust use alloc::{ borrow::Cow::{self, Borrowed}, boxed::Box, format, string::{String, ToString as _}, sync::Arc, ve

12. **[Local Monorepo Lockfile (src.lock.json)](file:///C:/src/src.lock.json)** (`local_monorepo`, blake3=`f1afe4b3e6df`)

- Pinned toolchains: archguard=archguard v0.1.0 (Rust 2024 Sovereign Monorepo Architecture Gate), rustc=rustc 1.101.0-nightly (708c94ef0 2026-11-03), wck=wck v1.0.0 (Compile-Time Web Validator - oven-sh/bun v1.4.4 Full Rust) | Locked repositories: crates/rust-stack@098565de, third_party/dioxus@17d9a592, third_party/blitz@e65ec76e, third_party/parley@36f82852

13. **[Local Workspace Manifest: apps\shenron\Cargo.toml](file:///C:/src/apps/shenron/Cargo.toml)** (`local_monorepo`, blake3=`f21e56dcd4c0`)

- # Shenron Rust workspace: the shenron CLI, MCP server, C ABI, studio commands,

14. **[Local Workspace Manifest: apps\shenron\README.md](file:///C:/src/apps/shenron/README.md)** (`local_monorepo`, blake3=`77a08abad8df`)

- <i>Engineered for Maximum Performance with Rust 2024, Upstream Bun v1.4.4+, Next.js 16.5+ / Leptos 0.8, Axum, and GPUI / Dioxus 0.8</i>

15. **[Local Workspace Manifest: crates\rust-stack\Cargo.toml](file:///C:/src/crates/rust-stack/Cargo.toml)** (`local_monorepo`, blake3=`e0b8c56f90da`)

- name = "rust-stack"

16. **[Local Workspace Manifest: README.md](file:///C:/src/README.md)** (`local_monorepo`, blake3=`541b02483829`)

- Engineered around the foundational standards of **Linus Torvalds** (`Linux`, `Git`, POSIX/GNU clean flat hierarchy, sacred `C:\Windows\System32` userspace integrity, strict C-ABI boundaries), **Jarred Sumner** (`oven-sh/bun` v1.4.4 100% Full-Rust runtime, `bun fmt`, `bun check`, `bun:sqlite`, `bun:ffi`, AOT `--compile`), **Chromium `depot_tools`** (strict `t

### Tier 2: Upstream GitHub/GitLab Repo (0)

_No sources recorded in this tier for the given query._

### Tier 3: Neural Web (5)

1. **[Blitz](https://webengineshackfest.org/2024/slides/blitz_a_truly_modular_hackable_web_renderer_by_nico_burns.pdf)** (`exa`, blake3=`e2db5282e5d5`)
   - ## Blitz A lightweight, modular, extensible web renderer #### Dioxus Labs What is Dioxus • “React” but in Rust • Renders to • Web (WASM) • Webview (IPC) • Until now there has been no “native” rendering What is Blitz • An HTML/CSS renderer • Think: webview without JavaScript • Similar: Electron, Tauri, Sciter, Ultralight, Litehtml • Built on Servo and Rust UI ecosystem components • stylo, html5ever, taffy, parley, accesskit, vello, wgpu • Targeting Application UI (+ Embedding)
2. **[Blitz - A radically modular HTML/CSS rendering engine](https://github.com/dioxuslabs/blitz)** (`exa`, blake3=`d091f8fdf57d`)
   - # DioxusLabs/blitz A radically modular HTML/CSS rendering engine - Stars: 4445 - Forks: 267 - Watchers: 4445 - Open issues: 435 - License: Apache License 2.0 - Homepage: https://blitz.is - Default branch: main - Created: 2022-02-28T04:42:02Z ## Languages - CSS - HTML - JavaScript - Just - Kotlin - Nix - Rust ... **A modular HTML/CSS rendering engine** Build Status Crates.io Docs Crates.io License dependency status Talk to us in: the #native channel in the Dioxus Discord ## St
3. **[gpui-component](https://crates.io/crates/gpui-component)** (`exa`, blake3=`2ddf8bee6b33`)
   - # gpui-component GPUI Component: the styled component library of GPUI Kit, with 60+ desktop UI components for GPUI. - Version: 0.9.1 - Repository: https://github.com/longbridge/gpui-kit - Homepage: https://gpui-kit.com - Docs: https://docs.rs/gpui-component - Total downloads: 541228 - Recent downloads: 458273 - Dependents: 26 - Created: 2025-02-06T03:42:09.391904Z - Updated: 2026-11-09T09:48:34.510649Z License: Apache-2.0 ## Keywords - desktop - gpui - shadcn - ui - uikit ...
4. **[Rust GUI frameworks](https://andygauge.github.io/rust-gui-frameworks/42)** (`exa`, blake3=`4d834e678029`)
   - shadcn/ui is the default widget set. zgui-ui, Blinc's `cn`, gpui-component and NSH's Tailwind classes all copy the same web design system. New toolkits no longer launch with grey buttons. They launch with cards, sheets, toasts and design tokens. The look of a Rust desktop app in 2026 is the look of a 2024 web app. CSS is back, without the browser. Blitz and zgui both run Stylo, Servo's real style engine, and FerroUI brings Avalonia's selectors and control themes. Each is a re
5. **[Tokio Releases Topcoat: A Batteries-Included Full-Stack Rust Framework - InfoQ](https://www.infoq.com/news/2026/11/topcoat-rust-framework)** (`exa`, blake3=`7a1631504889`)
   - Topcoat, a modular full-stack framework for Rust built by the Tokio team, has moved out of private development with a public GitHub repository, a v0.9 release, and a series of blog posts outlining its direction. The project is positioned as a batteries-included web framework that stays entirely server-rendered, with reactivity added through cross-compiled Rust expressions rather than WebAssembly. Topcoat introduces several ideas, including a `view!` macro for mixing HTML with

## 3. Citation Ledger

| #   | Tier   | Channel          | Source                                                                                                                                                                                            | Blake3 Prefix      |
| :-- | :----- | :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :----------------- |
| 1   | Tier 1 | `context7`       | [[Context7 /websites/rs_axum_axum] axum::serve](https://docs.rs/axum/latest/axum/serve/fn.serve.html)                                                                                             | `2b040c0ba3cc9da9` |
| 2   | Tier 1 | `context7`       | [[Context7 /websites/rs_axum_axum] Description](https://context7.com/websites/rs_axum_axum)                                                                                                       | `7fcb5196236816f2` |
| 3   | Tier 1 | `context7`       | [[Context7 /websites/rs_axum_axum] Serving a Router with axum::serve](https://docs.rs/axum/latest/axum/fn.serve.html)                                                                             | `9834b2529ed7d0c3` |
| 4   | Tier 1 | `context7`       | [[Context7 /websites/rs_tokio] Decision tree for choosing a Tokio runtime](https://docs.rs/tokio/latest/src/tokio/runtime/mod.rs.html)                                                            | `492030aa35f5968c` |
| 5   | Tier 1 | `context7`       | [[Context7 /websites/rs_tokio] match_flavor! macro and Handle methods](https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/mod.rs.html)                                                      | `0a76adedae472161` |
| 6   | Tier 1 | `context7`       | [[Context7 /websites/rs_tokio] push_remote_timer: Push alternative timer handle to inject_timers](https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/multi_thread/worker.rs.html)           | `a2d8a9b25155e712` |
| 7   | Tier 1 | `context7`       | [[Context7 /websites/rs_tokio] Run-queue structures for work-stealing scheduler](https://docs.rs/tokio/latest/src/tokio/runtime/scheduler/multi_thread/queue.rs.html)                             | `4dffe67fc27ac10f` |
| 8   | Tier 1 | `context7`       | [[Context7 /websites/rs_wgpu] is_browser_webgpu_supported: Check WebGPU support](https://docs.rs/wgpu/latest/src/wgpu/util/init.rs.html?search=u32+-%3E+bool)                                     | `2317fa5a4528dec2` |
| 9   | Tier 1 | `context7`       | [[Context7 /websites/rs_wgpu] wgpu dispatch.rs: backend dispatch infrastructure](https://docs.rs/wgpu/latest/src/wgpu/dispatch.rs.html?search=)                                                   | `75b8bcbde59fd141` |
| 10  | Tier 1 | `context7`       | [[Context7 /websites/rs_wgpu] wgpu Sampler and SamplerDescriptor definitions](https://docs.rs/wgpu/latest/src/wgpu/api/sampler.rs.html?search=Option%3CT%3E%2C+%28T+-%3E+U%29+-%3E+Option%3CU%3E) | `f5119bea86bdceca` |
| 11  | Tier 1 | `context7`       | [[Context7 /websites/rs_wgpu] wgpu_core.rs backend implementation](https://docs.rs/wgpu/latest/src/wgpu/backend/wgpu_core.rs.html?search=)                                                        | `c5a1f627e42f0613` |
| 12  | Tier 1 | `local_monorepo` | [Local Monorepo Lockfile (src.lock.json)](file:///C:/src/src.lock.json)                                                                                                                           | `f1afe4b3e6dfbe3d` |
| 13  | Tier 1 | `local_monorepo` | [Local Workspace Manifest: apps\shenron\Cargo.toml](file:///C:/src/apps/shenron/Cargo.toml)                                                                                                       | `f21e56dcd4c085e2` |
| 14  | Tier 1 | `local_monorepo` | [Local Workspace Manifest: apps\shenron\README.md](file:///C:/src/apps/shenron/README.md)                                                                                                         | `77a08abad8df2330` |
| 15  | Tier 1 | `local_monorepo` | [Local Workspace Manifest: crates\rust-stack\Cargo.toml](file:///C:/src/crates/rust-stack/Cargo.toml)                                                                                             | `e0b8c56f90da5d2f` |
| 16  | Tier 1 | `local_monorepo` | [Local Workspace Manifest: README.md](file:///C:/src/README.md)                                                                                                                                   | `541b0248382971f6` |
| 17  | Tier 3 | `exa`            | [Blitz](https://webengineshackfest.org/2024/slides/blitz_a_truly_modular_hackable_web_renderer_by_nico_burns.pdf)                                                                                 | `e2db5282e5d5296f` |
| 18  | Tier 3 | `exa`            | [Blitz - A radically modular HTML/CSS rendering engine](https://github.com/dioxuslabs/blitz)                                                                                                      | `d091f8fdf57d9b96` |
| 19  | Tier 3 | `exa`            | [gpui-component](https://crates.io/crates/gpui-component)                                                                                                                                         | `2ddf8bee6b33a013` |
| 20  | Tier 3 | `exa`            | [Rust GUI frameworks](https://andygauge.github.io/rust-gui-frameworks/42)                                                                                                                         | `4d834e678029927f` |
| 21  | Tier 3 | `exa`            | [Tokio Releases Topcoat: A Batteries-Included Full-Stack Rust Framework - InfoQ](https://www.infoq.com/news/2026/11/topcoat-rust-framework)                                                       | `7a1631504889b092` |
