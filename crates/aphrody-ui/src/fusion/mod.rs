// SPDX-License-Identifier: Apache-2.0
//! Unified full-stack Rust UI fusion layer combining Dioxus 0.8 (`dioxus`, `blitz`, `anyrender`,
//! `vello`, `taffy`), Longbridge (`nsh`, `gpui-kit`), and Zed Industries (`gpui`, `embedded_gpui`)
//! natively across TUI, CLI, Web/WASM, WebGPU, GPUI, WinUI 3, Mobile, Wayland, and POSIX Unix.

pub mod components;
pub mod dioxus_blitz;
pub mod embedded;
pub mod nsh;
pub mod pages;
pub mod targets;
pub mod theme_bridge;

#[cfg(test)]
mod tests;

use serde::Serialize;

pub use components::{
    ComputedUiTree, UiKind, UiNode, WaylandWorkspaceGeometry, compute_ui_layout,
    solve_wayland_workspace,
};
#[cfg(feature = "editor")]
pub use components::{EditorBufferMetrics, measure_rope_editor_buffer};
#[cfg(feature = "dioxus")]
pub use dioxus_blitz::build_subsecond_jump_table;
#[cfg(feature = "anyrender")]
pub use dioxus_blitz::render_layout_to_anyrender_scene;
pub use dioxus_blitz::render_dioxus_ssr_html;
#[cfg(feature = "vello")]
pub use dioxus_blitz::vello_scene_stats;
pub use embedded::{
    CapabilityMask, EmbeddedObjectRecord, Frame, InterfaceSchema, MembraneKind, ObjectHost,
    ObjectId, OcapOp, Ref, RefTable, SURFACE_API_SCHEMA, Turn, VIEW_API_SCHEMA, emit_dts_contract,
    emit_wit_contract,
};
pub use nsh::{
    AdaptiveOverlayMode, MountInstruction, NshMountBatch, NshPlatform, NshShadowNode, NshShadowTree,
    SafeAreaInsets,
};
pub use pages::CanonicalPage;
pub use targets::{RenderTarget, RenderedFrame, render_canonical_page};
pub use theme_bridge::{FusionThemePreset, ResolvedFusionTheme, ThemePresetSpec};

/// Provenance entry for an upstream repository absorbed/aligned under `aphrody-labs` and `C:\src`.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize)]
pub struct UpstreamBrickRecord {
    pub brick: &'static str,
    pub upstream: &'static str,
    pub fork: &'static str,
    pub role: &'static str,
}

/// Complete manifest of all fused ecosystems active inside `aphrody-ui::fusion`.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct EcosystemManifest {
    pub schema_version: u8,
    pub theme_count: usize,
    pub component_count: usize,
    pub page_count: usize,
    pub target_count: usize,
    pub bricks: &'static [UpstreamBrickRecord],
}

const FUSION_BRICKS: &[UpstreamBrickRecord] = &[
    UpstreamBrickRecord {
        brick: "crates/taffy",
        upstream: "DioxusLabs/taffy",
        fork: "aphrody-labs/taffy",
        role: "First-party Layer-0 Flexbox, Grid, Block, Float & Wayland tiling kernel",
    },
    UpstreamBrickRecord {
        brick: "third_party/dioxus",
        upstream: "DioxusLabs/dioxus",
        fork: "aphrody-labs/dioxus",
        role: "Dioxus 0.8 VirtualDom, signals, SSR, and Subsecond hot-patching",
    },
    UpstreamBrickRecord {
        brick: "third_party/dioxus-components",
        upstream: "DioxusLabs/dioxus-components",
        fork: "aphrody-labs/dioxus-components",
        role: "Shared DioxusLabs ARIA primitives & interaction state machines",
    },
    UpstreamBrickRecord {
        brick: "third_party/blitz",
        upstream: "DioxusLabs/blitz",
        fork: "aphrody-labs/blitz",
        role: "HTML/CSS native DOM painter & headless/windowed document shell",
    },
    UpstreamBrickRecord {
        brick: "third_party/anyrender",
        upstream: "DioxusLabs/anyrender",
        fork: "aphrody-labs/anyrender",
        role: "Unified 2D scene graph (PaintScene -> Vello/WebGPU/CPU)",
    },
    UpstreamBrickRecord {
        brick: "third_party/nsh",
        upstream: "longbridge/nsh",
        fork: "aphrody-labs/native-shell",
        role: "Native Shell shadow tree & batched platform mount instructions",
    },
    UpstreamBrickRecord {
        brick: "third_party/gpui-kit",
        upstream: "longbridge/gpui-kit",
        fork: "aphrody-labs/gpui-kit",
        role: "60+ GPU desktop widgets, theme tokens, dock & virtualized tables",
    },
    UpstreamBrickRecord {
        brick: "third_party/zed",
        upstream: "zed-industries/zed",
        fork: "aphrody-labs/zed",
        role: "GPU-accelerated UI framework (`gpui`) & ropey workspace patterns",
    },
    UpstreamBrickRecord {
        brick: "third_party/embedded_gpui",
        upstream: "zed-industries/embedded_gpui",
        fork: "aphrody-labs/embedded_gpui",
        role: "5-rule OCAP object host, revocable membranes, and WIT contracts",
    },
];

/// Returns the static inventory of fused upstream ecosystems and capabilities.
#[must_use]
pub const fn ecosystem_manifest() -> EcosystemManifest {
    EcosystemManifest {
        schema_version: 1,
        theme_count: FusionThemePreset::ALL.len(),
        component_count: UiKind::ALL.len(),
        page_count: CanonicalPage::ALL.len(),
        target_count: RenderTarget::ALL.len(),
        bricks: FUSION_BRICKS,
    }
}

/// Top-level convenience entrypoint: renders one [`CanonicalPage`] to one [`RenderTarget`] under
/// one [`FusionThemePreset`].
pub fn render_page_to_target(
    page: CanonicalPage,
    preset: FusionThemePreset,
    dark: bool,
    target: RenderTarget,
    width: Option<f32>,
    height: Option<f32>,
) -> Result<RenderedFrame, String> {
    render_canonical_page(page, preset, dark, target, width, height)
}
