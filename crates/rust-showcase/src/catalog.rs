// SPDX-License-Identifier: Apache-2.0
//! Verified monorepo catalog of all first-party Rust workspace crates, absorbed/forked
//! third-party Rust bricks, and C23 ABI bridges.

use serde::Serialize;

/// Domain grouping for first-party workspace crates.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CrateDomain {
    UiDesign,
    GamingGpu,
    BuildDepot,
    VcsLore,
    MediaTv,
    CoreCabi,
    OsAgents,
}

impl CrateDomain {
    pub const ALL: [Self; 7] = [
        Self::UiDesign,
        Self::GamingGpu,
        Self::BuildDepot,
        Self::VcsLore,
        Self::MediaTv,
        Self::CoreCabi,
        Self::OsAgents,
    ];

    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::UiDesign => "UI & Design",
            Self::GamingGpu => "Gaming & GPU",
            Self::BuildDepot => "Depot & Build",
            Self::VcsLore => "Lore VCS",
            Self::MediaTv => "Media tv-*",
            Self::CoreCabi => "Core & C ABI",
            Self::OsAgents => "OS, Shell & CLI",
        }
    }
}

/// Metadata entry for a first-party crate in `C:\src\crates`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
pub struct CrateEntry {
    pub dir: &'static str,
    pub package: &'static str,
    pub domain: CrateDomain,
    pub layer: &'static str,
    pub summary: &'static str,
}

/// Provenance entry for an absorbed or forked third-party Rust brick.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
pub struct ThirdPartyBrick {
    pub name: &'static str,
    pub version_or_pin: &'static str,
    pub upstream: &'static str,
    pub fork_or_location: &'static str,
    pub category: &'static str,
    pub features_exposed: &'static str,
}

/// Exported pure-C ABI boundary across Rust/C23/Bun/.NET/Zig.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
pub struct AbiBridgeEntry {
    pub crate_dir: &'static str,
    pub library: &'static str,
    pub header: &'static str,
    pub symbols: &'static [&'static str],
    pub consumers: &'static str,
}

/// Complete catalog of first-party crates in `C:\src\crates`.
pub const FIRST_PARTY_CRATES: &[CrateEntry] = &[
    // UI & Design
    CrateEntry { dir: "aphrody-ui", package: "aphrody-ui", domain: CrateDomain::UiDesign, layer: "L3", summary: "Unified M3 HCT/schemes, 23 UI contracts, Taffy layout, Dioxus SSR, AnyRender, Vello, Ratatui, Ropey, NSH, OCAP GPUI, DESIGN.md" },
    CrateEntry { dir: "taffy", package: "taffy", domain: CrateDomain::UiDesign, layer: "L1", summary: "First-party Layer-0 Flexbox, Grid, Block, Float & Wayland tiling kernel (DioxusLabs/taffy v0.15.1)" },
    CrateEntry { dir: "aphrody-brand-gpu", package: "aphrody-brand-gpu", domain: CrateDomain::UiDesign, layer: "L1", summary: "Procedural brand slab glTF mesh + no_std wasm32 WebGPU renderer" },
    CrateEntry { dir: "aphrody-i18n", package: "aphrody-i18n", domain: CrateDomain::UiDesign, layer: "L1", summary: "Shared ICU plural/select localization catalogs & Accept-Language negotiation" },
    CrateEntry { dir: "rust-stack", package: "rust-stack", domain: CrateDomain::UiDesign, layer: "L3", summary: "Pure-Rust fullstack: Better-Auth (Argon2id/Ed25519), shadcn_rs, Open-WebUI, OpenCode, Gateway + C-ABI FFI" },
    CrateEntry { dir: "rust-showcase", package: "rust-showcase", domain: CrateDomain::UiDesign, layer: "L5", summary: "Shared-code Desktop (winit+wgpu) & Web (WASM+WebGPU+M3) monorepo Rust showcase" },
    CrateEntry { dir: "asset-test", package: "asset-test", domain: CrateDomain::UiDesign, layer: "L3", summary: "Multi-format validators: FFmpeg decode, resvg SVG, craft-formats, glTF + headless Bevy" },

    // Gaming & GPU
    CrateEntry { dir: "game", package: "game", domain: CrateDomain::GamingGpu, layer: "L5", summary: "Open-world Bevy 0.20 vertical slice: streamed terrain, third-person controller, day/night, synth audio" },
    CrateEntry { dir: "gamescope-core", package: "gamescope-core", domain: CrateDomain::GamingGpu, layer: "L3", summary: "Pure-Rust micro-compositor pacing, integer/fit/fill scaling, console UI painter" },
    CrateEntry { dir: "gamescope-wgsl", package: "gamescope-wgsl", domain: CrateDomain::GamingGpu, layer: "L3", summary: "WGSL compute shaders: FSR 1.0 EASU, RCAS & HDR compositor on wgpu 30" },
    CrateEntry { dir: "gamescope-cli", package: "gamescope-cli", domain: CrateDomain::GamingGpu, layer: "L5", summary: "Gamescope winit 0.30 + wgpu 30 desktop presenter & GPU latency benchmarker" },
    CrateEntry { dir: "gamescope-web-wasm", package: "gamescope-web-wasm", domain: CrateDomain::GamingGpu, layer: "L5", summary: "Gamescope WebAssembly + WebGPU console shell & instanced quad WGSL renderer" },
    CrateEntry { dir: "steam-depot", package: "steam-depot", domain: CrateDomain::GamingGpu, layer: "L3", summary: "VDF text/binary parser & writer, Steam library discovery, Proton & Remote Play tuning" },
    CrateEntry { dir: "dx12-hal", package: "dx12-hal", domain: CrateDomain::GamingGpu, layer: "L2", summary: "Windows D3D12 + DirectComposition hardware abstraction layer with C ABI" },
    CrateEntry { dir: "craft-formats", package: "craft-formats", domain: CrateDomain::GamingGpu, layer: "L1", summary: "Header probe & decoder layer for SVG, WebP, EXR, PSD, TIFF & HEIF (storytold/craft-libs)" },
    CrateEntry { dir: "aphrody-cef", package: "aphrody-cef", domain: CrateDomain::GamingGpu, layer: "L3", summary: "Chromium Embedded Framework & off-screen rendering abstractions unified with aphrody-v8" },

    // Depot & Build
    CrateEntry { dir: "depot-core", package: "depot-core", domain: CrateDomain::BuildDepot, layer: "L1", summary: "Core depot graph, VCS, and repository primitives" },
    CrateEntry { dir: "depot-cas", package: "depot-cas", domain: CrateDomain::BuildDepot, layer: "L1", summary: "Content-addressed store: FastCDC v2020 chunking, BLAKE3 IDs, zstd, sha256 index" },
    CrateEntry { dir: "depot-cipd", package: "depot-cipd", domain: CrateDomain::BuildDepot, layer: "L2", summary: "CIPD client in Rust with depot-cas caching (`ay cipd ensure`)" },
    CrateEntry { dir: "depot-cli", package: "depot-cli", domain: CrateDomain::BuildDepot, layer: "L3", summary: "Command layer behind `ay git`, `ay ingest`, `ay graph`" },
    CrateEntry { dir: "depot-forge", package: "depot-forge", domain: CrateDomain::BuildDepot, layer: "L2", summary: "GitHub/GitLab/Gitea API forge client & release automation" },
    CrateEntry { dir: "depot-gclient", package: "depot-gclient", domain: CrateDomain::BuildDepot, layer: "L2", summary: "Chromium gclient in Rust: DEPS evaluator, revinfo, getdep/setdep, sync planner on gix" },
    CrateEntry { dir: "depot-graph", package: "depot-graph", domain: CrateDomain::BuildDepot, layer: "L2", summary: "Tree-sitter symbol & call graph engine + persistent query store" },
    CrateEntry { dir: "depot-ingest", package: "depot-ingest", domain: CrateDomain::BuildDepot, layer: "L2", summary: "Token-budgeted repository outline & context ingestion" },
    CrateEntry { dir: "depot-migrate", package: "depot-migrate", domain: CrateDomain::BuildDepot, layer: "L2", summary: "Monorepo migration planner (Node/Electron/TS -> Bun/Rust)" },
    CrateEntry { dir: "depot-re", package: "depot-re", domain: CrateDomain::BuildDepot, layer: "L2", summary: "Clean-room reverse engineering suite: iced-x86 CFG, PE/ELF/Mach-O goblin, Lua 5.2" },
    CrateEntry { dir: "depot-vpython", package: "depot-vpython", domain: CrateDomain::BuildDepot, layer: "L2", summary: "Chromium vpython spec runner (`vpython.toml` + `.uv.lock`, PEP 723) on uv" },
    CrateEntry { dir: "factory", package: "aphrody-factory", domain: CrateDomain::BuildDepot, layer: "L3", summary: "Chromium factory (F4): sync, gn gen, siso over NativeLink REAPI, R2 publish" },
    CrateEntry { dir: "xtask", package: "xtk", domain: CrateDomain::BuildDepot, layer: "L3", summary: "Workspace diagnostics: `ay doctor [--deps]`, `ay lock`, `ay manifests`, `ay git slim`" },

    // Lore VCS (15 absorbed crates)
    CrateEntry { dir: "lore", package: "aphrody-lore", domain: CrateDomain::VcsLore, layer: "L3", summary: "Lore game-scale binary VCS (absorbed from Epic Games Lore, MIT)" },
    CrateEntry { dir: "lore-aws", package: "aphrody-lore-aws", domain: CrateDomain::VcsLore, layer: "L3", summary: "Lore S3 & AWS storage transport" },
    CrateEntry { dir: "lore-base", package: "aphrody-lore-base", domain: CrateDomain::VcsLore, layer: "L1", summary: "Lore shared base types & diagnostics" },
    CrateEntry { dir: "lore-capi", package: "aphrody-lore-capi", domain: CrateDomain::VcsLore, layer: "L3", summary: "Lore C ABI library exports" },
    CrateEntry { dir: "lore-chaos-client", package: "aphrody-lore-chaos-client", domain: CrateDomain::VcsLore, layer: "L3", summary: "Lore fault-injection test harness" },
    CrateEntry { dir: "lore-client", package: "aphrody-lore-client", domain: CrateDomain::VcsLore, layer: "L3", summary: "Lore client CLI & protocol state machine" },
    CrateEntry { dir: "lore-credential", package: "aphrody-lore-credential", domain: CrateDomain::VcsLore, layer: "L2", summary: "Lore OS credential store provider" },
    CrateEntry { dir: "lore-error-set", package: "aphrody-lore-error-set", domain: CrateDomain::VcsLore, layer: "L1", summary: "Composable traceable error enums" },
    CrateEntry { dir: "lore-error-set-macro", package: "aphrody-lore-error-set-macro", domain: CrateDomain::VcsLore, layer: "L1", summary: "Proc-macro support for lore-error-set" },
    CrateEntry { dir: "lore-fuse", package: "aphrody-lore-fuse", domain: CrateDomain::VcsLore, layer: "L3", summary: "Lore virtual FUSE filesystem projection" },
    CrateEntry { dir: "lore-hashicorp", package: "aphrody-lore-hashicorp", domain: CrateDomain::VcsLore, layer: "L3", summary: "Lore Vault / Consul / PKI integration" },
    CrateEntry { dir: "lore-integration-tests", package: "aphrody-lore-integration-tests", domain: CrateDomain::VcsLore, layer: "L3", summary: "End-to-end Lore server & client integration tests" },
    CrateEntry { dir: "lore-io", package: "aphrody-lore-io", domain: CrateDomain::VcsLore, layer: "L1", summary: "Lore zero-copy streaming I/O" },
    CrateEntry { dir: "lore-macro", package: "aphrody-lore-macro", domain: CrateDomain::VcsLore, layer: "L1", summary: "Lore procedural macros" },
    CrateEntry { dir: "lore-notification", package: "aphrody-lore-notification", domain: CrateDomain::VcsLore, layer: "L2", summary: "Lore lock/commit event notifications" },
    CrateEntry { dir: "lore-proto", package: "aphrody-lore-proto", domain: CrateDomain::VcsLore, layer: "L1", summary: "Lore wire protocol framing & types" },
    CrateEntry { dir: "lore-revision", package: "aphrody-lore-revision", domain: CrateDomain::VcsLore, layer: "L2", summary: "Lore revision graph & path rules" },
    CrateEntry { dir: "lore-server", package: "aphrody-lore-server", domain: CrateDomain::VcsLore, layer: "L3", summary: "Lore high-throughput VCS server daemon" },
    CrateEntry { dir: "lore-storage", package: "aphrody-lore-storage", domain: CrateDomain::VcsLore, layer: "L2", summary: "Lore chunked CAS backend & storage drivers" },
    CrateEntry { dir: "lore-telemetry", package: "aphrody-lore-telemetry", domain: CrateDomain::VcsLore, layer: "L2", summary: "Lore structured metrics & traces" },
    CrateEntry { dir: "lore-transport", package: "aphrody-lore-transport", domain: CrateDomain::VcsLore, layer: "L2", summary: "Lore QUIC (aphrody-labs/quinn) & HTTP/3 transport" },

    // Media tv-*
    CrateEntry { dir: "tv-core", package: "tv-core", domain: CrateDomain::MediaTv, layer: "L1", summary: "Shared media domain types: rationals, timestamps, streams, errors" },
    CrateEntry { dir: "tv-ffmpeg", package: "tv-ffmpeg", domain: CrateDomain::MediaTv, layer: "L2", summary: "Safe LGPL-2.1 FFmpeg 9.x wrapper yielding tv-core streams" },
    CrateEntry { dir: "tv-i18n", package: "tv-i18n", domain: CrateDomain::MediaTv, layer: "L2", summary: "Fluent localization for tv domain across 16 languages & CLDR plurals" },
    CrateEntry { dir: "tv-cli", package: "tv-cli", domain: CrateDomain::MediaTv, layer: "L3", summary: "Command-line entrypoint for media inspection & transcoding" },

    // Core & C ABI
    CrateEntry { dir: "core", package: "aphrody-core", domain: CrateDomain::CoreCabi, layer: "L1", summary: "Tree-sitter 0.27 multi-language parsing, symbol/ref index, BLAKE3 hashing" },
    CrateEntry { dir: "corelib", package: "aphrody-corelib", domain: CrateDomain::CoreCabi, layer: "L2", summary: "Product engine: wgpu pipeline, RE formats, Epic assets, Boq wire format, adblock glue" },
    CrateEntry { dir: "core-capi", package: "aphrody-core-capi", domain: CrateDomain::CoreCabi, layer: "L3", summary: "Canonical C23 ABI over aphrody-core + Pure-C mwg_core + ai-os SQLite bridge" },
    CrateEntry { dir: "ffi", package: "aphrody-ffi", domain: CrateDomain::CoreCabi, layer: "L3", summary: "Stable cbindgen C ABI over depot, Boq parser & mwg C kernel (aphrody_ffi)" },
    CrateEntry { dir: "adblock-capi", package: "aphrody-adblock-capi", domain: CrateDomain::CoreCabi, layer: "L3", summary: "C ABI over Brave adblock-rust engine for Chromium & Bun" },
    CrateEntry { dir: "aphrody-v8", package: "aphrody-v8", domain: CrateDomain::CoreCabi, layer: "L2", summary: "V8 runtime & C ABI abstractions replicating rusty_v8" },
    CrateEntry { dir: "aphrody-env", package: "aphrody-env", domain: CrateDomain::CoreCabi, layer: "L1", summary: "Zero-dependency Rust 2024 .env loader & SecretString redaction guard" },
    CrateEntry { dir: "aphrody-vault", package: "aphrody-vault", domain: CrateDomain::CoreCabi, layer: "L2", summary: "Encrypted var/secrets vault (DPAPI, systemd-creds, Hello NCrypt, age envelopes) + C ABI" },
    CrateEntry { dir: "bun-flat", package: "aphrody-bun-flat", domain: CrateDomain::CoreCabi, layer: "L1", summary: "Flattened leaf Rust crates of aphrody-labs/bun fork (wyhash, HdrHistogram, sort_by_number)" },
    CrateEntry { dir: "diffutils-flat", package: "aphrody-diffutils-flat", domain: CrateDomain::CoreCabi, layer: "L1", summary: "POSIX BRE translation flattened from aphrody-labs/diffutils (uutils)" },

    // OS, Shell, Agents & CLI
    CrateEntry { dir: "ay", package: "aphrody", domain: CrateDomain::OsAgents, layer: "L5", summary: "Monorepo multicall CLI (`ay arch|ui|git|ingest|graph|brand|steam|sys|up|rt|bench|doctor`)" },
    CrateEntry { dir: "archguard", package: "archguard", domain: CrateDomain::OsAgents, layer: "L3", summary: "Monorepo domain-purity, dependency graph, secret-hygiene & zero-emoji gate (`ay arch`)" },
    CrateEntry { dir: "agent-context", package: "agent-context", domain: CrateDomain::OsAgents, layer: "L3", summary: "Native SQLite reader/writer sharing packages/ai-os agent context schema" },
    CrateEntry { dir: "agent-py", package: "agent-py", domain: CrateDomain::OsAgents, layer: "L3", summary: "PyO3 bridge exposing agent-context to Python" },
    CrateEntry { dir: "apm", package: "aphrody-apm", domain: CrateDomain::OsAgents, layer: "L3", summary: "Rust port of Microsoft Agent Package Manager (`apm.yml`, lockfile resolution)" },
    CrateEntry { dir: "bench", package: "stack-bench", domain: CrateDomain::OsAgents, layer: "L3", summary: "Hardware & LLVM/Win32 benchmark suite (`ay bench`)" },
    CrateEntry { dir: "conformance", package: "aphrody-conformance", domain: CrateDomain::OsAgents, layer: "L3", summary: "Pinned upstream conformance harness & JSON reporter" },
    CrateEntry { dir: "cosmic-compat", package: "cosmic-compat", domain: CrateDomain::OsAgents, layer: "L2", summary: "COSMIC desktop layer-shell, session, and M3 theme compatibility adapter" },
    CrateEntry { dir: "hypr-tiler", package: "hypr-tiler", domain: CrateDomain::OsAgents, layer: "L2", summary: "Hyprland-compatible tiling layout solver backed directly by first-party `taffy`" },
    CrateEntry { dir: "smithay-wayland-wire", package: "smithay-wayland-wire", domain: CrateDomain::OsAgents, layer: "L2", summary: "Portable Wayland wire protocol encoder/decoder shared across Windows & Linux" },
    CrateEntry { dir: "unix-omarchy", package: "aphrody-omarchy", domain: CrateDomain::OsAgents, layer: "L3", summary: "Unified Omarchy + CachyOS + Arch/Linux hardware probe, kernel patchsets, Aether themes & WSL2 builder" },
    CrateEntry { dir: "wslg-cli", package: "wslg-cli", domain: CrateDomain::OsAgents, layer: "L4", summary: "WSLg Wayland/DX12 diagnostic & launcher CLI" },
    CrateEntry { dir: "net", package: "aphrody-net", domain: CrateDomain::OsAgents, layer: "L2", summary: "Unified network probe: DNS, TCP, rustls TLS, ALPN, HTTP/1.1 & HTTP/2 timings" },
    CrateEntry { dir: "remote", package: "aphrody-remote", domain: CrateDomain::OsAgents, layer: "L3", summary: "Pure-Rust SSH client (`russh`, no OpenSSH binary) for `ay ssh` & fleet health" },
    CrateEntry { dir: "rt", package: "aphrody-rt", domain: CrateDomain::OsAgents, layer: "L3", summary: "Multi-runtime manager behind `ay rt` (Python uv, Bun, Node, Deno, PyTorch)" },
    CrateEntry { dir: "sys", package: "aphrody-sys", domain: CrateDomain::OsAgents, layer: "L2", summary: "Low-level Windows/Linux machine profile: SMBIOS, CPUID, PCI, GPUs, toolchains (`ay sys`)" },
    CrateEntry { dir: "up", package: "aphrody-up", domain: CrateDomain::OsAgents, layer: "L3", summary: "Manifest-driven toolchain installer & sha256 updater (`tools.toml`, `ay up`)" },
    CrateEntry { dir: "docs", package: "aphrody-docs", domain: CrateDomain::OsAgents, layer: "L3", summary: "SQLite FTS5 Bun documentation & skills search engine (`ay docs`)" },
];

/// Third-party Rust ecosystems, upstream crates, and `aphrody-labs` forks unified into `C:\src`.
pub const THIRD_PARTY_BRICKS: &[ThirdPartyBrick] = &[
    ThirdPartyBrick { name: "DioxusLabs/taffy", version_or_pin: "0.15.1 (1P absorbed)", upstream: "https://github.com/DioxusLabs/taffy", fork_or_location: "crates/taffy + [patch.crates-io]", category: "Layer-0 Layout", features_exposed: "Flexbox, CSS Grid, Block, Float, calc(), WaylandShellZones, MasterStack/Spiral/Grid tilers" },
    ThirdPartyBrick { name: "DioxusLabs/dioxus", version_or_pin: "0.8 (rev 17d9a592)", upstream: "https://github.com/DioxusLabs/dioxus", fork_or_location: "aphrody-labs/dioxus", category: "UI / VDOM / SSR", features_exposed: "dioxus-core, dioxus-signals, dioxus-ssr, subsecond-types live jump table" },
    ThirdPartyBrick { name: "DioxusLabs/dioxus-components", version_or_pin: "rev 9a758255", upstream: "https://github.com/DioxusLabs/dioxus-components", fork_or_location: "aphrody-labs/dioxus-components", category: "UI Primitives", features_exposed: "23 semantic ARIA primitives & interaction state contracts" },
    ThirdPartyBrick { name: "DioxusLabs/blitz", version_or_pin: "third_party/blitz", upstream: "https://github.com/DioxusLabs/blitz", fork_or_location: "aphrody-labs/blitz", category: "HTML/CSS Engine", features_exposed: "Native HTML/CSS DOM painter, headless document shell, stylo+parley+taffy integration" },
    ThirdPartyBrick { name: "DioxusLabs/anyrender", version_or_pin: "0.14.0", upstream: "https://github.com/DioxusLabs/anyrender", fork_or_location: "aphrody-labs/anyrender", category: "2D Vector Scene", features_exposed: "PaintScene trait lowering Taffy layouts into unified Vello/WebGPU/CPU draw commands" },
    ThirdPartyBrick { name: "linebender/vello + parley + kurbo + peniko", version_or_pin: "vello 0.12 | parley 0.11.1 | kurbo 0.13.1 | peniko 0.6.1", upstream: "https://github.com/linebender/vello", fork_or_location: "crates/aphrody-ui + third_party/vello", category: "GPU 2D & Text", features_exposed: "Compute-shader 2D rasterizer, Parley text shaping, Kurbo Bezier geometry, Peniko brushes" },
    ThirdPartyBrick { name: "AccessKit/accesskit", version_or_pin: "0.25.2 / 0.24.1", upstream: "https://github.com/AccessKit/accesskit", fork_or_location: "crates/aphrody-ui/src/layout/ecosystem.rs", category: "Accessibility", features_exposed: "TreeUpdate semantic projection from Taffy NodeLayout for Windows UIA & Linux AT-SPI" },
    ThirdPartyBrick { name: "zed-industries/zed (GPUI)", version_or_pin: "zed v1.28.1 / gpui 0.2.2", upstream: "https://github.com/zed-industries/zed", fork_or_location: "aphrody-labs/zed + tokens.rs", category: "Desktop GPU UI", features_exposed: "GPU-accelerated hybrid immediate/retained desktop UI with M3 tokens.rs" },
    ThirdPartyBrick { name: "zed-industries/embedded_gpui", version_or_pin: "rev 28bc6d3d", upstream: "https://github.com/zed-industries/embedded_gpui", fork_or_location: "aphrody-labs/embedded_gpui + fusion/embedded.rs", category: "OCAP Embedding", features_exposed: "5-rule OCAP host: ObjectId, Frame lease, Turn flush, Revocable/Attenuated membranes, WIT/.d.ts" },
    ThirdPartyBrick { name: "longbridge/gpui-kit", version_or_pin: "0.9.1 (rev 6808964c)", upstream: "https://github.com/longbridge/gpui-kit", fork_or_location: "aphrody-labs/gpui-kit + fusion/theme_bridge.rs", category: "Desktop Components", features_exposed: "GPUI component kit theme JSON exporter mapped from all 9 M3 DynamicSchemes" },
    ThirdPartyBrick { name: "longbridge/nsh", version_or_pin: "third_party/nsh", upstream: "https://github.com/longbridge/nsh", fork_or_location: "aphrody-labs/native-shell + fusion/nsh.rs", category: "Multi-Shell Bridge", features_exposed: "8-platform shadow tree (iOS/Android/macOS/Windows/Linux/WebWasm/TUI/HarmonyOS) + mount batches" },
    ThirdPartyBrick { name: "bevyengine/bevy", version_or_pin: "0.20.1", upstream: "https://github.com/bevyengine/bevy", fork_or_location: "crates/game + aphrody-ui (bevy + web)", category: "Game Engine & ECS", features_exposed: "Modular ECS, bevy_ui, bevy_pbr, bevy_gltf, WebGPU WASM target, 1 winit/1 wgpu workspace" },
    ThirdPartyBrick { name: "gfx-rs/wgpu + winit", version_or_pin: "wgpu 30.0.1 | winit 0.30.13", upstream: "https://github.com/gfx-rs/wgpu", fork_or_location: "aphrody-labs/wgpu + Cargo.toml", category: "GPU & Windowing", features_exposed: "Deduplicated single wgpu 30 + winit 0.30 across Desktop DX12/Vulkan and Chrome WebGPU" },
    ThirdPartyBrick { name: "emilk/egui", version_or_pin: "0.37.0", upstream: "https://github.com/emilk/egui", fork_or_location: "crates/aphrody-ui (egui feature)", category: "Immediate GUI", features_exposed: "Craft-compatible immediate UI adapter driven by aphrody-ui layout & tokens" },
    ThirdPartyBrick { name: "ratatui + ropey + lightningcss + oxc", version_or_pin: "ratatui-core 0.1.2 | ropey 2.0-beta.1 | lightningcss 1.0-alpha.72", upstream: "https://github.com/ratatui/ratatui", fork_or_location: "crates/aphrody-ui", category: "TUI, Editor & CSS", features_exposed: "M3 ANSI TUI buffer, O(log N) Ropey code editor metrics, LightningCSS + OxC TSX layout parser" },
    ThirdPartyBrick { name: "microsoft/windows-rs", version_or_pin: "windows 0.62.2 | windows-sys 0.61.2", upstream: "https://github.com/microsoft/windows-rs", fork_or_location: "aphrody-labs/windows-rs", category: "Windows Native", features_exposed: "D3D12, DirectComposition, DXGI, WinRT, DPAPI/NCrypt Hello vault bindings" },
    ThirdPartyBrick { name: "Byron/gitoxide + quinn + sntrup761", version_or_pin: "gix 0.90.0 | PQC sntrup761", upstream: "https://github.com/Byron/gitoxide", fork_or_location: "aphrody-labs/quinn + sntrup761 + glob-match", category: "VCS, QUIC & Crypto", features_exposed: "Pure-Rust git plumbing, QUIC Lore transport, post-quantum KEM sntrup761, fast glob matching" },
    ThirdPartyBrick { name: "tree-sitter + iced-x86 + goblin + brave/adblock", version_or_pin: "tree-sitter 0.27 | iced-x86 1.22 | goblin 0.10.7", upstream: "https://github.com/tree-sitter/tree-sitter", fork_or_location: "crates/core + depot-re + adblock-capi", category: "Parsing, RE & Filter", features_exposed: "12 language grammars, x86/x64 CFG disassembler, PE/ELF/Mach-O loader, C ABI adblocker" },
    ThirdPartyBrick { name: "EpicGames/Lore + ValveSoftware/gamescope", version_or_pin: "15 crates absorbed | gamescope-rs", upstream: "https://github.com/ValveSoftware/gamescope", fork_or_location: "crates/lore* + crates/gamescope-*", category: "Studio Infra", features_exposed: "Game-scale CAS VCS & pure-Rust FSR EASU/RCAS micro-compositor" },
];

/// Exported pure-C ABI boundary modules across the workspace.
pub const ABI_BRIDGES: &[AbiBridgeEntry] = &[
    AbiBridgeEntry {
        crate_dir: "crates/core-capi",
        library: "aphrody_core_capi",
        header: "crates/core-capi/include/aphrody_core.h + aphrody_mwg.h",
        symbols: &[
            "aphrody_free",
            "core_abi_version",
            "core_parse_json",
            "core_query_json",
            "core_blake3_hex",
            "mwg_abi_version",
            "mwg_audit_html_json",
            "mwg_audit_css_json",
            "mwg_audit_js_json",
            "mwg_parse_mdx_json",
            "mwg_search_guidance_json",
            "mwg_feature_lookup_json",
            "mwg_hash64",
        ],
        consumers: "Bun (bun:ffi), C23 Pure-C mwg_core, Zig, ai-os SQLite",
    },
    AbiBridgeEntry {
        crate_dir: "crates/ffi",
        library: "aphrody_ffi",
        header: "crates/ffi/include/aphrody_ffi.h (cbindgen)",
        symbols: &[
            "aphrody_abi_version",
            "depot_abi_version",
            "depot_free_string",
            "depot_gix_status_json",
            "depot_just_recipes_json",
            "depot_ingest_json",
            "depot_graph_query_json",
            "depot_forge_repo_json",
            "depot_magika_detect_json",
            "depot_helix_rope_edit",
            "depot_migrate_run_json",
            "depot_re_audit_json",
            "depot_lua52_transcode_hex",
            "aphrody_boq_parse",
        ],
        consumers: "Bun, C/C++23, .NET 11 LibraryImport, Cross-Language LTO",
    },
    AbiBridgeEntry {
        crate_dir: "crates/adblock-capi",
        library: "aphrody_adblock_capi",
        header: "crates/adblock-capi/include/aphrody_adblock.h",
        symbols: &[
            "aphrody_adblock_new",
            "aphrody_adblock_free",
            "aphrody_adblock_check_request",
            "aphrody_adblock_cosmetic",
            "aphrody_adblock_buf_free",
        ],
        consumers: "Chromium fork + Bun native adblock filter",
    },
    AbiBridgeEntry {
        crate_dir: "crates/rust-stack",
        library: "rust_stack_ffi",
        header: "crates/rust-stack/src/ffi.rs",
        symbols: &[
            "rust_stack_ffi_version",
            "rust_stack_shadcn_render",
            "rust_stack_auth_verify",
        ],
        consumers: "Bun sub-microsecond FFI bridge + Open-WebUI + OpenAI Gateway :4320",
    },
    AbiBridgeEntry {
        crate_dir: "crates/aphrody-vault + crates/dx12-hal",
        library: "aphrody_vault + dx12_hal",
        header: "crates/aphrody-vault/src/capi.rs",
        symbols: &["aphrody_vault_open", "aphrody_vault_get", "dx12_hal_probe"],
        consumers: "OS credential store (DPAPI/Hello/systemd-creds) & DirectComposition surface",
    },
];
