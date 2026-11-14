// SPDX-License-Identifier: Apache-2.0
//! Native target-specific lowering across all 11 execution targets (`Tui`, `Cli`, `WebWasmSsr`,
//! `WebGpu`, `Gpui`, `EmbeddedGpui`, `WinitWgpu`, `WinUi3`, `Mobile`, `LinuxWayland`, `UnixPosix`).

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use taffy::TilingStrategy;

#[cfg(feature = "anyrender")]
use crate::fusion::dioxus_blitz::render_layout_to_anyrender_scene;
#[cfg(feature = "dioxus")]
use crate::fusion::dioxus_blitz::build_subsecond_jump_table;
#[cfg(feature = "vello")]
use crate::fusion::dioxus_blitz::vello_scene_stats;
#[cfg(feature = "editor")]
use crate::fusion::components::{UiKind, measure_rope_editor_buffer};

use crate::fusion::components::{UiNode, compute_ui_layout, solve_wayland_workspace};
use crate::fusion::dioxus_blitz::render_dioxus_ssr_html;
use crate::fusion::embedded::{
    MembraneKind, OcapOp, ObjectHost, Turn, emit_dts_contract, emit_wit_contract,
};
use crate::fusion::nsh::{NshPlatform, NshShadowTree};
use crate::fusion::pages::CanonicalPage;
use crate::fusion::theme_bridge::{FusionThemePreset, ResolvedFusionTheme};
use crate::layout::{LayoutVitalsAudit, NodeLayout};

/// Eleven native deployment targets sharing identical components, themes, and layouts.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RenderTarget {
    Tui,
    Cli,
    #[default]
    WebWasmSsr,
    WebGpu,
    Gpui,
    EmbeddedGpui,
    WinitWgpu,
    WinUi3,
    Mobile,
    LinuxWayland,
    UnixPosix,
}

impl RenderTarget {
    /// Ordered list of all 11 supported targets.
    pub const ALL: [Self; 11] = [
        Self::Tui,
        Self::Cli,
        Self::WebWasmSsr,
        Self::WebGpu,
        Self::Gpui,
        Self::EmbeddedGpui,
        Self::WinitWgpu,
        Self::WinUi3,
        Self::Mobile,
        Self::LinuxWayland,
        Self::UnixPosix,
    ];

    /// Canonical kebab-case target slug.
    #[must_use]
    pub const fn id(self) -> &'static str {
        match self {
            Self::Tui => "tui",
            Self::Cli => "cli",
            Self::WebWasmSsr => "web-wasm-ssr",
            Self::WebGpu => "webgpu",
            Self::Gpui => "gpui",
            Self::EmbeddedGpui => "embedded-gpui",
            Self::WinitWgpu => "winit-wgpu",
            Self::WinUi3 => "winui3",
            Self::Mobile => "mobile",
            Self::LinuxWayland => "linux-wayland",
            Self::UnixPosix => "unix-posix",
        }
    }

    /// Parses a target identifier case-insensitively with common aliases.
    #[must_use]
    pub fn from_id(raw: &str) -> Option<Self> {
        match raw.trim().to_ascii_lowercase().as_str() {
            "tui" | "ratatui" => Some(Self::Tui),
            "cli" | "ansi" => Some(Self::Cli),
            "web-wasm-ssr" | "web" | "wasm" | "ssr" | "dioxus" => Some(Self::WebWasmSsr),
            "webgpu" | "wgsl" => Some(Self::WebGpu),
            "gpui" | "zed" | "gpui-kit" => Some(Self::Gpui),
            "embedded-gpui" | "ocap" | "wit" => Some(Self::EmbeddedGpui),
            "winit-wgpu" | "winit" | "vello" | "anyrender" => Some(Self::WinitWgpu),
            "winui3" | "winui" | "fluent" | "windows" => Some(Self::WinUi3),
            "mobile" | "ios" | "android" | "nsh" => Some(Self::Mobile),
            "linux-wayland" | "wayland" | "hyprland" | "linux" => Some(Self::LinuxWayland),
            "unix-posix" | "unix" | "posix" => Some(Self::UnixPosix),
            _ => None,
        }
    }

    /// Corresponding Longbridge NSH runtime platform.
    #[must_use]
    pub const fn nsh_platform(self) -> NshPlatform {
        match self {
            Self::Tui | Self::Cli | Self::UnixPosix => NshPlatform::Tui,
            Self::WebWasmSsr | Self::WebGpu => NshPlatform::WebWasm,
            Self::WinUi3 => NshPlatform::Windows,
            Self::Mobile => NshPlatform::Ios,
            Self::LinuxWayland | Self::Gpui | Self::EmbeddedGpui | Self::WinitWgpu => {
                NshPlatform::Linux
            }
        }
    }

    /// Recommended logical pixel dimensions when width/height are omitted.
    #[must_use]
    pub const fn default_viewport(self) -> (f32, f32) {
        match self {
            Self::Tui => (960.0, 540.0),
            Self::Cli => (720.0, 400.0),
            Self::Mobile => (390.0, 844.0),
            _ => (1280.0, 720.0),
        }
    }
}

/// Unified render output spanning computed Taffy layout, AccessKit semantics, vitals, and target artifact.
#[derive(Clone, Debug, Serialize)]
pub struct RenderedFrame {
    pub page: CanonicalPage,
    pub target: RenderTarget,
    pub preset: &'static str,
    pub dark: bool,
    pub viewport_px: [f32; 2],
    pub layout: NodeLayout,
    pub a11y_node_count: usize,
    pub vitals: LayoutVitalsAudit,
    pub scene_command_count: usize,
    pub content_type: String,
    pub payload: String,
    pub secondary_artifacts: BTreeMap<String, String>,
}

/// Renders any [`CanonicalPage`] into any [`RenderTarget`] under any [`FusionThemePreset`].
pub fn render_canonical_page(
    page: CanonicalPage,
    preset: FusionThemePreset,
    dark: bool,
    target: RenderTarget,
    width: Option<f32>,
    height: Option<f32>,
) -> Result<RenderedFrame, String> {
    let (def_w, def_h) = target.default_viewport();
    let w = width.unwrap_or(def_w).max(160.0);
    let h = height.unwrap_or(def_h).max(120.0);

    let ui_tree = page.build_ui_tree();
    let theme = ResolvedFusionTheme::resolve(preset, dark);
    let computed = compute_ui_layout(&ui_tree, w, h, false)?;

    #[cfg(feature = "anyrender")]
    let scene_command_count = render_layout_to_anyrender_scene(&computed.layout, &theme)
        .commands
        .len();
    #[cfg(not(feature = "anyrender"))]
    let scene_command_count = 0usize;

    let mut secondary_artifacts = BTreeMap::new();
    #[cfg(feature = "editor")]
    if let Some(code_node) = find_kind(&ui_tree, UiKind::CodeEditor) {
        let metrics = measure_rope_editor_buffer(
            code_node.text.as_deref().unwrap_or(code_node.label.as_str()),
        );
        secondary_artifacts.insert(
            "ropey_editor.json".to_owned(),
            serde_json::to_string_pretty(&metrics).unwrap_or_default(),
        );
    }

    let (content_type, payload) = match target {
        RenderTarget::Tui => (
            "text/plain; charset=utf-8".to_owned(),
            render_tui_frame(page, &ui_tree, &computed.layout, &theme, w, h, &mut secondary_artifacts),
        ),
        RenderTarget::Cli => (
            "text/x-ansi; charset=utf-8".to_owned(),
            render_cli_ansi(page, &ui_tree, &computed.layout, &theme),
        ),
        RenderTarget::WebWasmSsr => {
            #[cfg(feature = "dioxus")]
            {
                let jt = build_subsecond_jump_table("libaphrody_ui_patch.so", &[(0x1000, 0x2400)]);
                secondary_artifacts.insert(
                    "subsecond_jump_table.json".to_owned(),
                    serde_json::to_string_pretty(&jt).unwrap_or_default(),
                );
            }
            (
                "text/html; charset=utf-8".to_owned(),
                render_dioxus_ssr_html(&ui_tree, &theme, target.id())?,
            )
        }
        RenderTarget::WebGpu => (
            "application/json".to_owned(),
            render_webgpu_descriptor(page, &ui_tree, &computed.layout, &theme, w, h, scene_command_count),
        ),
        RenderTarget::Gpui => (
            "application/json".to_owned(),
            render_gpui_kit_frame(page, &ui_tree, &computed.layout, &theme),
        ),
        RenderTarget::EmbeddedGpui => (
            "application/json".to_owned(),
            render_embedded_ocap_frame(page, &computed.layout, w, h, &mut secondary_artifacts)?,
        ),
        RenderTarget::WinitWgpu => (
            "application/json".to_owned(),
            render_winit_wgpu_frame(page, &computed.layout, &theme, scene_command_count),
        ),
        RenderTarget::WinUi3 => {
            secondary_artifacts.insert("ThemeResources.xaml".to_owned(), theme.to_winui_xaml_resources());
            (
                "application/xaml+xml".to_owned(),
                render_winui3_xaml(page, &ui_tree, &computed.layout),
            )
        }
        RenderTarget::Mobile => (
            "application/json".to_owned(),
            render_nsh_mobile_frame(&ui_tree, &computed.layout, &theme, target.nsh_platform()),
        ),
        RenderTarget::LinuxWayland => {
            secondary_artifacts.insert("hyprland.conf".to_owned(), theme.to_hyprland_conf());
            (
                "application/json".to_owned(),
                render_wayland_frame(page, &theme, w, h),
            )
        }
        RenderTarget::UnixPosix => (
            "application/json".to_owned(),
            render_unix_posix_frame(page, &ui_tree, &computed.layout, &theme, w, h),
        ),
    };

    Ok(RenderedFrame {
        page,
        target,
        preset: preset.id(),
        dark,
        viewport_px: [w, h],
        a11y_node_count: computed.accesskit_update.nodes.len(),
        layout: computed.layout,
        vitals: computed.vitals,
        scene_command_count,
        content_type,
        payload,
        secondary_artifacts,
    })
}

#[cfg(feature = "tui")]
fn render_tui_frame(
    page: CanonicalPage,
    tree: &UiNode,
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
    width: f32,
    height: f32,
    secondary: &mut BTreeMap<String, String>,
) -> String {
    use ratatui_core::buffer::Buffer;
    use ratatui_core::layout::Rect;
    use ratatui_core::style::{Color, Modifier, Style};
    use ratatui_core::widgets::Widget;
    use ratatui_widgets::block::Block;
    use ratatui_widgets::paragraph::Paragraph;

    let cols = ((width / 10.0).round() as u16).clamp(40, 120);
    let rows = ((height / 20.0).round() as u16).clamp(16, 40);
    let area = Rect::new(0, 0, cols, rows);
    let mut buf = Buffer::empty(area);

    let [pr, pg, pb, _] = theme.primary_rgba;
    let [sr, sg, sb, _] = theme.surface_rgba;
    let [fr, fg, fb, _] = theme.on_surface_rgba;
    let root_style = Style::default()
        .fg(Color::Rgb(fr, fg, fb))
        .bg(Color::Rgb(sr, sg, sb));
    let accent_style = Style::default()
        .fg(Color::Rgb(pr, pg, pb))
        .add_modifier(Modifier::BOLD);

    let outer = Block::bordered()
        .title(format!(" {} [{}] ", page.title(), theme.preset.id))
        .border_style(accent_style)
        .style(root_style);
    outer.render(area, &mut buf);

    let mut body = String::new();
    for (idx, (id, kind, label)) in tree.flatten_summary().iter().take(12).enumerate() {
        body.push_str(&format!("{}. [{}] {} ({id})\n", idx + 1, kind.id(), label));
    }
    let inner_area = Rect::new(
        1,
        1,
        cols.saturating_sub(2),
        rows.saturating_sub(3),
    );
    Paragraph::new(body.clone()).style(root_style).render(inner_area, &mut buf);

    let footer = format!(
        "Taffy: {}x{} | Nodes: {}",
        layout.absolute.width as u32,
        layout.absolute.height as u32,
        tree.count_nodes()
    );
    buf.set_stringn(
        2,
        rows.saturating_sub(2),
        &footer,
        usize::from(cols.saturating_sub(4)),
        accent_style,
    );

    secondary.insert(
        "ratatui_geometry.json".to_owned(),
        serde_json::json!({ "cols": cols, "rows": rows }).to_string(),
    );

    let mut out = String::with_capacity(usize::from(cols + 1) * usize::from(rows));
    for y in 0..rows {
        for x in 0..cols {
            let sym = buf.cell((x, y)).map_or(" ", |c| c.symbol());
            out.push_str(sym);
        }
        out.push('\n');
    }
    out
}

#[cfg(not(feature = "tui"))]
fn render_tui_frame(
    page: CanonicalPage,
    tree: &UiNode,
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
    _width: f32,
    _height: f32,
    _secondary: &mut BTreeMap<String, String>,
) -> String {
    format!(
        "[{}] {} ({}x{}, nodes={})",
        theme.preset.id,
        page.title(),
        layout.absolute.width,
        layout.absolute.height,
        tree.count_nodes()
    )
}

fn render_cli_ansi(
    page: CanonicalPage,
    tree: &UiNode,
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
) -> String {
    #[cfg(feature = "tui")]
    let styled_banner = {
        let [br, bg, bb, _] = theme.primary_rgba;
        let [fr, fg, fb, _] = theme.on_primary_rgba;
        let style = anstyle::Style::new()
            .bold()
            .fg_color(Some(anstyle::Color::Rgb(anstyle::RgbColor(fr, fg, fb))))
            .bg_color(Some(anstyle::Color::Rgb(anstyle::RgbColor(br, bg, bb))));
        format!(
            "{style} {} [{}] {}{reset}\n",
            page.title(),
            theme.preset.id,
            if theme.dark { "dark" } else { "light" },
            reset = style.render_reset()
        )
    };
    #[cfg(not(feature = "tui"))]
    let styled_banner = format!("{}\n", theme.to_ansi_header_banner(page.title()));

    let mut out = styled_banner;
    let mut flat_rects = Vec::new();
    collect_rects(layout, &mut flat_rects);
    for ((id, kind, label), rect) in tree.flatten_summary().into_iter().zip(flat_rects.into_iter()) {
        out.push_str(&format!(
            "  - {:<20} {:<24} ({:.0}x{:.0} @ {:.0},{:.0}) {}\n",
            kind.id(),
            id,
            rect[2],
            rect[3],
            rect[0],
            rect[1],
            label
        ));
    }
    out
}

fn render_webgpu_descriptor(
    page: CanonicalPage,
    tree: &UiNode,
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
    w: f32,
    h: f32,
    scene_commands: usize,
) -> String {
    let wayland = solve_wayland_workspace(
        w,
        h,
        f32::from(theme.preset.gap_px),
        2,
        TilingStrategy::Dwindle,
    );
    serde_json::to_string_pretty(&serde_json::json!({
        "renderer": "wgpu+anyrender+wgsl",
        "no_vm": true,
        "page": page.id(),
        "preset": theme.preset.id,
        "scene_commands": scene_commands,
        "shared_nodes": tree.count_nodes(),
        "wayland_surface_slots": wayland.tiles,
        "root_bounds": layout.absolute,
    }))
    .unwrap_or_default()
}

fn render_gpui_kit_frame(
    page: CanonicalPage,
    tree: &UiNode,
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
) -> String {
    serde_json::to_string_pretty(&serde_json::json!({
        "framework": "aphrody-gpui-kit",
        "page": page.id(),
        "theme": theme.to_gpui_kit_json(),
        "node_count": tree.count_nodes(),
        "layout": layout,
    }))
    .unwrap_or_default()
}

fn render_embedded_ocap_frame(
    page: CanonicalPage,
    layout: &NodeLayout,
    w: f32,
    h: f32,
    secondary: &mut BTreeMap<String, String>,
) -> Result<String, String> {
    let mut host = ObjectHost::new();
    let frame = host.begin_frame(w as u32, h as u32);
    let surface_ref = host.objects.insert(
        "surface-api",
        page.title(),
        [
            layout.absolute.x,
            layout.absolute.y,
            layout.absolute.width,
            layout.absolute.height,
        ],
        MembraneKind::Audited {
            audit_channel: "aphrody-ui".to_owned(),
        },
    );
    host.submit_turn(Turn {
        frame_seq: frame.seq,
        ops: vec![
            OcapOp::ResizeSurface {
                target: surface_ref.id,
                width: w,
                height: h,
            },
            OcapOp::Invalidate {
                target: surface_ref.id,
            },
        ],
    });
    let applied = host.tick()?;

    secondary.insert("embedded_gpui.wit".to_owned(), emit_wit_contract());
    secondary.insert("embedded_gpui.d.ts".to_owned(), emit_dts_contract());

    Ok(serde_json::to_string_pretty(&serde_json::json!({
        "protocol": "embedded-gpui-ocap-5-rules",
        "frame": frame,
        "applied_ops": applied,
        "root_handle": surface_ref,
        "audit_log": host.audit_log,
    }))
    .unwrap_or_default())
}

fn render_winit_wgpu_frame(
    page: CanonicalPage,
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
    scene_commands: usize,
) -> String {
    #[cfg(feature = "vello")]
    let vello_info = vello_scene_stats();
    #[cfg(not(feature = "vello"))]
    let vello_info = serde_json::json!({ "backend": "anyrender-recording" });

    serde_json::to_string_pretty(&serde_json::json!({
        "window_backend": "winit-wgpu",
        "page": page.id(),
        "preset": theme.preset.id,
        "scene_commands": scene_commands,
        "vello": vello_info,
        "viewport": [layout.absolute.width, layout.absolute.height],
    }))
    .unwrap_or_default()
}

fn render_winui3_xaml(page: CanonicalPage, tree: &UiNode, layout: &NodeLayout) -> String {
    format!(
        "<Page x:Class=\"Aphrody.Fusion.{class_name}\" xmlns=\"http://schemas.microsoft.com/winfx/2006/xaml/presentation\" xmlns:x=\"http://schemas.microsoft.com/winfx/2006/xaml\">\n\
  <Grid Padding=\"8\" Tag=\"{page_id}\" Width=\"{w}\" Height=\"{h}\">\n\
    <TextBlock Text=\"{title}\" />\n\
    <!-- Shared UiNode count: {nodes} -->\n\
  </Grid>\n\
</Page>\n",
        class_name = page.id().replace('-', "_"),
        page_id = page.id(),
        w = layout.absolute.width,
        h = layout.absolute.height,
        title = page.title(),
        nodes = tree.count_nodes(),
    )
}

fn render_nsh_mobile_frame(
    tree: &UiNode,
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
    platform: NshPlatform,
) -> String {
    let mut shadow = NshShadowTree::new();
    let mut rects = Vec::new();
    let mut layout_rects = Vec::new();
    collect_rects(layout, &mut layout_rects);

    for (idx, (id, kind, label)) in tree.flatten_summary().into_iter().enumerate() {
        let node_id = shadow.push_node(
            kind.id(),
            label,
            serde_json::json!({ "id": id, "ariaRole": kind.aria_role() }),
            Vec::new(),
        );
        if let Some(r) = layout_rects.get(idx).copied() {
            rects.push((node_id, r));
        }
    }
    let batch = shadow.compile_for_platform(platform, &rects);
    serde_json::to_string_pretty(&serde_json::json!({
        "theme": theme.to_nsh_styles_json(),
        "mount_batch": batch,
    }))
    .unwrap_or_default()
}

fn render_wayland_frame(
    page: CanonicalPage,
    theme: &ResolvedFusionTheme,
    w: f32,
    h: f32,
) -> String {
    let geom = solve_wayland_workspace(
        w,
        h,
        f32::from(theme.preset.gap_px),
        3,
        TilingStrategy::Dwindle,
    );
    serde_json::to_string_pretty(&serde_json::json!({
        "compositor": "smithay-wayland-wire+hypr-tiler",
        "page": page.id(),
        "preset": theme.preset.id,
        "wayland_zones": geom.zones,
        "tiled_windows": geom.tiles,
    }))
    .unwrap_or_default()
}

fn render_unix_posix_frame(
    page: CanonicalPage,
    tree: &UiNode,
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
    w: f32,
    h: f32,
) -> String {
    serde_json::to_string_pretty(&serde_json::json!({
        "shell": "nsh+niubash+unix-posix",
        "page": page.id(),
        "preset": theme.preset.id,
        "viewport": [w, h],
        "nodes": tree.count_nodes(),
        "ansi_banner": theme.to_ansi_header_banner(page.title()),
        "root_rect": layout.absolute,
    }))
    .unwrap_or_default()
}

fn collect_rects(node: &NodeLayout, out: &mut Vec<[f32; 4]>) {
    out.push([
        node.absolute.x,
        node.absolute.y,
        node.absolute.width,
        node.absolute.height,
    ]);
    for child in &node.children {
        collect_rects(child, out);
    }
}

#[cfg(feature = "editor")]
fn find_kind(node: &UiNode, kind: UiKind) -> Option<&UiNode> {
    if node.kind == kind {
        return Some(node);
    }
    node.children.iter().find_map(|c| find_kind(c, kind))
}
