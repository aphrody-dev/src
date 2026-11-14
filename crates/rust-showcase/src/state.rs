// SPDX-License-Identifier: Apache-2.0
//! Shared interactive showcase controller driving both the native Desktop (`winit`+`wgpu`)
//! and Web (`wasm32`+WebGPU+M3) interfaces from a single Rust state machine.

use serde::Serialize;
use taffy::TilingStrategy;

use aphrody_ui::fusion::{
    CanonicalPage, EcosystemManifest, FusionThemePreset, RenderTarget, RenderedFrame,
    ResolvedFusionTheme, UiKind, WaylandWorkspaceGeometry, ecosystem_manifest,
    render_canonical_page, solve_wayland_workspace,
};
use gamescope_core::{LatencyBudgetCalculator, Resolution, ScalingLayout, ScalingMode};

use crate::catalog::{
    ABI_BRIDGES, AbiBridgeEntry, CrateDomain, CrateEntry, FIRST_PARTY_CRATES, THIRD_PARTY_BRICKS,
    ThirdPartyBrick,
};

/// Top-level showcase section tabs.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ShowcaseTab {
    #[default]
    Overview,
    FusionUi,
    TaffyLayout,
    FirstPartyCrates,
    ThirdPartyForks,
    CAbiAndFfi,
}

impl ShowcaseTab {
    pub const ALL: [Self; 6] = [
        Self::Overview,
        Self::FusionUi,
        Self::TaffyLayout,
        Self::FirstPartyCrates,
        Self::ThirdPartyForks,
        Self::CAbiAndFfi,
    ];

    #[must_use]
    pub const fn index(self) -> usize {
        match self {
            Self::Overview => 0,
            Self::FusionUi => 1,
            Self::TaffyLayout => 2,
            Self::FirstPartyCrates => 3,
            Self::ThirdPartyForks => 4,
            Self::CAbiAndFfi => 5,
        }
    }

    #[must_use]
    pub const fn from_index(idx: usize) -> Self {
        match idx % 6 {
            0 => Self::Overview,
            1 => Self::FusionUi,
            2 => Self::TaffyLayout,
            3 => Self::FirstPartyCrates,
            4 => Self::ThirdPartyForks,
            _ => Self::CAbiAndFfi,
        }
    }

    #[must_use]
    pub const fn id(self) -> &'static str {
        match self {
            Self::Overview => "overview",
            Self::FusionUi => "fusion-ui",
            Self::TaffyLayout => "taffy-layout",
            Self::FirstPartyCrates => "first-party",
            Self::ThirdPartyForks => "third-party",
            Self::CAbiAndFfi => "c-abi",
        }
    }

    #[must_use]
    pub const fn label(self) -> &'static str {
        match self {
            Self::Overview => "Overview",
            Self::FusionUi => "UI Fusion",
            Self::TaffyLayout => "Taffy Layout",
            Self::FirstPartyCrates => "1P Crates",
            Self::ThirdPartyForks => "3P & Forks",
            Self::CAbiAndFfi => "C ABI & FFI",
        }
    }
}

/// Interactive action dispatched uniformly by Desktop mouse/keys and Web events.
#[derive(Clone, Debug, PartialEq)]
pub enum ShowcaseAction {
    SetTab(usize),
    SetPreset(usize),
    NextPreset,
    ToggleDark,
    SetPage(usize),
    NextPage,
    SetTarget(usize),
    NextTarget,
    SetTiling(usize),
    NextTiling,
    SetViewport(f32, f32),
    SetTileCount(usize),
    SetDomainFilter(Option<usize>),
    SetSearch(String),
    SelectCrate(usize),
    SelectBrick(usize),
    SelectAbi(usize),
    StepList(isize),
}

/// Serializable M3 RGBA swatch exported cleanly to both GPU and Web consumers.
#[derive(Clone, Debug, Serialize)]
pub struct ThemePaletteHex {
    pub primary: String,
    pub on_primary: String,
    pub primary_container: String,
    pub secondary: String,
    pub tertiary: String,
    pub surface: String,
    pub surface_container: String,
    pub surface_container_high: String,
    pub on_surface: String,
    pub on_surface_variant: String,
    pub outline: String,
    pub outline_variant: String,
    pub error: String,
}

/// Flattened summary of one first-party render target check.
#[derive(Clone, Debug, Serialize)]
pub struct TargetMatrixItem {
    pub id: &'static str,
    pub name: &'static str,
    pub a11y_nodes: usize,
    pub scene_commands: usize,
    pub overflow_px: f32,
    pub content_type: String,
}

/// Snapshot emitted by `ShowcaseState` for UI rendering, JSON inspection, and tests.
#[derive(Clone, Debug, Serialize)]
pub struct ShowcaseSnapshot {
    pub runtime_host: &'static str,
    pub tab: ShowcaseTab,
    pub preset_idx: usize,
    pub preset_id: &'static str,
    pub preset_name: &'static str,
    pub dark: bool,
    pub page_idx: usize,
    pub page_id: &'static str,
    pub page_title: &'static str,
    pub target_idx: usize,
    pub target_id: &'static str,
    pub tiling_idx: usize,
    pub tiling_name: &'static str,
    pub tile_count: usize,
    pub viewport_w: f32,
    pub viewport_h: f32,
    pub palette: ThemePaletteHex,
    pub css_variables: String,
    pub hyprland_conf: String,
    pub gpui_kit_json: serde_json::Value,
    pub manifest: EcosystemManifest,
    pub rendered_frame: RenderedFrame,
    pub wayland_geometry: WaylandWorkspaceGeometry,
    pub gamescope_matrix: [f32; 16],
    pub gamescope_budget_ms: f64,
    pub target_matrix: Vec<TargetMatrixItem>,
    pub components: Vec<&'static str>,
    pub domains: Vec<&'static str>,
    pub domain_filter: Option<usize>,
    pub search_query: String,
    pub filtered_crates: Vec<CrateEntry>,
    pub selected_crate_idx: usize,
    pub third_party_bricks: Vec<ThirdPartyBrick>,
    pub selected_brick_idx: usize,
    pub abi_bridges: Vec<AbiBridgeEntry>,
    pub selected_abi_idx: usize,
    pub first_party_total: usize,
    pub third_party_total: usize,
    pub native_ffi_sample: Option<String>,
}

/// Shared stateful engine powering both Desktop and Web targets.
#[derive(Clone, Debug)]
pub struct ShowcaseState {
    pub runtime_host: &'static str,
    pub tab: ShowcaseTab,
    pub preset_idx: usize,
    pub dark: bool,
    pub page_idx: usize,
    pub target_idx: usize,
    pub tiling_idx: usize,
    pub tile_count: usize,
    pub viewport_w: f32,
    pub viewport_h: f32,
    pub domain_filter: Option<usize>,
    pub search_query: String,
    pub selected_crate_idx: usize,
    pub selected_brick_idx: usize,
    pub selected_abi_idx: usize,
}

impl ShowcaseState {
    /// Creates initial state labeled with its runtime host (`desktop` or `web-wasm`).
    #[must_use]
    pub fn new(runtime_host: &'static str) -> Self {
        Self {
            runtime_host,
            tab: ShowcaseTab::Overview,
            preset_idx: 0,
            dark: true,
            page_idx: 0,
            target_idx: 2, // WebWasmSsr default highlight
            tiling_idx: 0, // MasterStack
            tile_count: 5,
            viewport_w: 1280.0,
            viewport_h: 720.0,
            domain_filter: None,
            search_query: String::new(),
            selected_crate_idx: 0,
            selected_brick_idx: 0,
            selected_abi_idx: 0,
        }
    }

    #[must_use]
    pub fn preset(&self) -> FusionThemePreset {
        FusionThemePreset::ALL[self.preset_idx % FusionThemePreset::ALL.len()]
    }

    #[must_use]
    pub fn page(&self) -> CanonicalPage {
        CanonicalPage::ALL[self.page_idx % CanonicalPage::ALL.len()]
    }

    #[must_use]
    pub fn target(&self) -> RenderTarget {
        RenderTarget::ALL[self.target_idx % RenderTarget::ALL.len()]
    }

    #[must_use]
    pub fn tiling_strategy(&self) -> (TilingStrategy, &'static str) {
        match self.tiling_idx % 4 {
            0 => (TilingStrategy::MasterStack, "MasterStack"),
            1 => (TilingStrategy::Dwindle, "Dwindle"),
            2 => (TilingStrategy::Grid, "Grid"),
            _ => (TilingStrategy::Monocle, "Monocle"),
        }
    }

    /// Resolves current Material 3 theme using `aphrody-ui::fusion`.
    #[must_use]
    pub fn resolved_theme(&self) -> ResolvedFusionTheme {
        ResolvedFusionTheme::resolve(self.preset(), self.dark)
    }

    /// Returns filtered first-party crates according to domain pill & search string.
    #[must_use]
    pub fn filtered_crates(&self) -> Vec<CrateEntry> {
        let q = self.search_query.trim().to_ascii_lowercase();
        let domain = self.domain_filter.map(|i| CrateDomain::ALL[i % CrateDomain::ALL.len()]);
        FIRST_PARTY_CRATES
            .iter()
            .copied()
            .filter(|c| domain.is_none_or(|d| c.domain == d))
            .filter(|c| {
                q.is_empty()
                    || c.dir.to_ascii_lowercase().contains(&q)
                    || c.package.to_ascii_lowercase().contains(&q)
                    || c.summary.to_ascii_lowercase().contains(&q)
            })
            .collect()
    }

    /// Applies any interactive user action.
    pub fn dispatch(&mut self, action: ShowcaseAction) {
        match action {
            ShowcaseAction::SetTab(i) => self.tab = ShowcaseTab::from_index(i),
            ShowcaseAction::SetPreset(i) => {
                self.preset_idx = i % FusionThemePreset::ALL.len();
            }
            ShowcaseAction::NextPreset => {
                self.preset_idx = (self.preset_idx + 1) % FusionThemePreset::ALL.len();
            }
            ShowcaseAction::ToggleDark => self.dark = !self.dark,
            ShowcaseAction::SetPage(i) => {
                self.page_idx = i % CanonicalPage::ALL.len();
            }
            ShowcaseAction::NextPage => {
                self.page_idx = (self.page_idx + 1) % CanonicalPage::ALL.len();
            }
            ShowcaseAction::SetTarget(i) => {
                self.target_idx = i % RenderTarget::ALL.len();
            }
            ShowcaseAction::NextTarget => {
                self.target_idx = (self.target_idx + 1) % RenderTarget::ALL.len();
            }
            ShowcaseAction::SetTiling(i) => self.tiling_idx = i % 4,
            ShowcaseAction::NextTiling => self.tiling_idx = (self.tiling_idx + 1) % 4,
            ShowcaseAction::SetViewport(w, h) => {
                self.viewport_w = w.clamp(320.0, 3840.0);
                self.viewport_h = h.clamp(240.0, 2160.0);
            }
            ShowcaseAction::SetTileCount(n) => self.tile_count = n.clamp(1, 12),
            ShowcaseAction::SetDomainFilter(d) => {
                self.domain_filter = d.map(|i| i % CrateDomain::ALL.len());
                self.selected_crate_idx = 0;
            }
            ShowcaseAction::SetSearch(q) => {
                self.search_query = q;
                self.selected_crate_idx = 0;
            }
            ShowcaseAction::SelectCrate(i) => {
                let len = self.filtered_crates().len().max(1);
                self.selected_crate_idx = i % len;
            }
            ShowcaseAction::SelectBrick(i) => {
                self.selected_brick_idx = i % THIRD_PARTY_BRICKS.len();
            }
            ShowcaseAction::SelectAbi(i) => {
                self.selected_abi_idx = i % ABI_BRIDGES.len();
            }
            ShowcaseAction::StepList(delta) => match self.tab {
                ShowcaseTab::FirstPartyCrates => {
                    let len = self.filtered_crates().len().max(1) as isize;
                    self.selected_crate_idx = (self.selected_crate_idx as isize + delta).rem_euclid(len) as usize;
                }
                ShowcaseTab::ThirdPartyForks => {
                    let len = THIRD_PARTY_BRICKS.len() as isize;
                    self.selected_brick_idx = (self.selected_brick_idx as isize + delta).rem_euclid(len) as usize;
                }
                ShowcaseTab::CAbiAndFfi => {
                    let len = ABI_BRIDGES.len() as isize;
                    self.selected_abi_idx = (self.selected_abi_idx as isize + delta).rem_euclid(len) as usize;
                }
                ShowcaseTab::FusionUi => {
                    let len = RenderTarget::ALL.len() as isize;
                    self.target_idx = (self.target_idx as isize + delta).rem_euclid(len) as usize;
                }
                ShowcaseTab::TaffyLayout => {
                    self.tile_count = ((self.tile_count as isize + delta).clamp(1, 12)) as usize;
                }
                ShowcaseTab::Overview => {
                    let len = FusionThemePreset::ALL.len() as isize;
                    self.preset_idx = (self.preset_idx as isize + delta).rem_euclid(len) as usize;
                }
            },
        }
    }

    /// Computes complete live snapshot across `aphrody-ui`, `taffy`, `gamescope-core`, and `rust-stack`.
    #[must_use]
    pub fn snapshot(&self) -> ShowcaseSnapshot {
        let theme = self.resolved_theme();
        let page = self.page();
        let target = self.target();
        let (strategy, tiling_name) = self.tiling_strategy();

        let rendered_frame = render_canonical_page(
            page,
            self.preset(),
            self.dark,
            target,
            Some(self.viewport_w),
            Some(self.viewport_h),
        )
        .unwrap_or_else(|e| RenderedFrame {
            page,
            target,
            preset: theme.preset.id,
            dark: self.dark,
            viewport_px: [self.viewport_w, self.viewport_h],
            layout: aphrody_ui::layout::NodeLayout {
                name: "error".into(),
                local: aphrody_ui::layout::LayoutRect { x: 0.0, y: 0.0, width: 0.0, height: 0.0 },
                absolute: aphrody_ui::layout::LayoutRect { x: 0.0, y: 0.0, width: 0.0, height: 0.0 },
                children: Vec::new(),
            },
            a11y_node_count: 0,
            vitals: aphrody_ui::layout::LayoutVitalsAudit {
                window_class: taffy::google_design::WindowSizeClass::Compact,
                horizontal_overflow_px: 0.0,
                inspected_nodes: 0,
            },
            scene_command_count: 0,
            content_type: "text/plain".to_owned(),
            payload: e,
            secondary_artifacts: Default::default(),
        });

        let target_matrix = RenderTarget::ALL
            .iter()
            .map(|&t| {
                let frame = render_canonical_page(page, self.preset(), self.dark, t, None, None);
                match frame {
                    Ok(f) => TargetMatrixItem {
                        id: t.id(),
                        name: t.id(),
                        a11y_nodes: f.a11y_node_count,
                        scene_commands: f.scene_command_count,
                        overflow_px: f.vitals.horizontal_overflow_px,
                        content_type: f.content_type,
                    },
                    Err(_) => TargetMatrixItem {
                        id: t.id(),
                        name: t.id(),
                        a11y_nodes: 0,
                        scene_commands: 0,
                        overflow_px: 0.0,
                        content_type: "error".to_owned(),
                    },
                }
            })
            .collect();

        let wayland_geometry = solve_wayland_workspace(
            self.viewport_w,
            self.viewport_h,
            f32::from(theme.preset.gap_px),
            self.tile_count,
            strategy,
        );

        let gamescope_layout = ScalingLayout::compute(
            Resolution::new(1920, 1080),
            Resolution::new(self.viewport_w as u32, self.viewport_h as u32),
            ScalingMode::Fit,
        );
        let budget = LatencyBudgetCalculator {
            gpu_execution_ms: 2.1,
            present_queue_ms: 0.8,
            ..LatencyBudgetCalculator::default()
        };

        let filtered_crates = self.filtered_crates();
        let selected_crate_idx = if filtered_crates.is_empty() {
            0
        } else {
            self.selected_crate_idx.min(filtered_crates.len() - 1)
        };

        ShowcaseSnapshot {
            runtime_host: self.runtime_host,
            tab: self.tab,
            preset_idx: self.preset_idx,
            preset_id: theme.preset.id,
            preset_name: theme.preset.display_name,
            dark: self.dark,
            page_idx: self.page_idx,
            page_id: page.id(),
            page_title: page.title(),
            target_idx: self.target_idx,
            target_id: target.id(),
            tiling_idx: self.tiling_idx,
            tiling_name,
            tile_count: self.tile_count,
            viewport_w: self.viewport_w,
            viewport_h: self.viewport_h,
            palette: ThemePaletteHex {
                primary: rgba_hex(theme.primary_rgba),
                on_primary: rgba_hex(theme.on_primary_rgba),
                primary_container: rgba_hex(theme.primary_container_rgba),
                secondary: rgba_hex(theme.secondary_rgba),
                tertiary: rgba_hex(theme.tertiary_rgba),
                surface: rgba_hex(theme.surface_rgba),
                surface_container: rgba_hex(theme.surface_container_rgba),
                surface_container_high: rgba_hex(theme.surface_container_high_rgba),
                on_surface: rgba_hex(theme.on_surface_rgba),
                on_surface_variant: rgba_hex(theme.on_surface_variant_rgba),
                outline: rgba_hex(theme.outline_rgba),
                outline_variant: rgba_hex(theme.outline_variant_rgba),
                error: rgba_hex(theme.error_rgba),
            },
            css_variables: theme.to_css_variables(),
            hyprland_conf: theme.to_hyprland_conf(),
            gpui_kit_json: theme.to_gpui_kit_json(),
            manifest: ecosystem_manifest(),
            rendered_frame,
            wayland_geometry,
            gamescope_matrix: gamescope_layout.transform_matrix,
            gamescope_budget_ms: budget.total_latency_ms(),
            target_matrix,
            components: UiKind::ALL.iter().map(|k| k.id()).collect(),
            domains: CrateDomain::ALL.iter().map(|d| d.label()).collect(),
            domain_filter: self.domain_filter,
            search_query: self.search_query.clone(),
            filtered_crates,
            selected_crate_idx,
            third_party_bricks: THIRD_PARTY_BRICKS.to_vec(),
            selected_brick_idx: self.selected_brick_idx.min(THIRD_PARTY_BRICKS.len() - 1),
            abi_bridges: ABI_BRIDGES.to_vec(),
            selected_abi_idx: self.selected_abi_idx.min(ABI_BRIDGES.len() - 1),
            first_party_total: FIRST_PARTY_CRATES.len(),
            third_party_total: THIRD_PARTY_BRICKS.len(),
            native_ffi_sample: native_rust_stack_sample(),
        }
    }
}

#[must_use]
pub fn rgba_hex(c: [u8; 4]) -> String {
    format!("#{:02X}{:02X}{:02X}", c[0], c[1], c[2])
}

#[cfg(not(target_arch = "wasm32"))]
fn native_rust_stack_sample() -> Option<String> {
    use rust_stack_ffi::shadcn_rs::{RenderTarget as StackTarget, UiPrimitive, Variant};
    let prim = UiPrimitive::Button {
        id: "showcase-cta".to_owned(),
        label: "Aphrody Fusion".to_owned(),
        variant: Variant::Primary,
        disabled: false,
    };
    Some(prim.render(StackTarget::Dioxus))
}

#[cfg(target_arch = "wasm32")]
fn native_rust_stack_sample() -> Option<String> {
    None
}
