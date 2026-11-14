// SPDX-License-Identifier: Apache-2.0
//! Canonical multi-target UI component catalog, Taffy layout lowering, AccessKit tree
//! projection, Core Web Vitals overflow auditing, Wayland shell zones, and Ropey editor buffers.

use serde::{Deserialize, Serialize};
use taffy::geometry::Size;
use taffy::{TilingStrategy, WaylandShellMargins, WaylandShellZones, solve_tiling_rects};

use crate::layout::{
    Available, Display, FlexDirection, LayoutStyle, LayoutTree, LayoutVitalsAudit,
    Length, MeasureRequest, NodeKey, NodeLayout, Overflow, ParleyMeasurer, Sides,
    audit_layout_tree_vitals, monospace_measure, node_layout_to_accesskit,
};

/// 23 shared semantic UI primitives compiled identically across TUI, CLI, Web/WASM, WebGPU,
/// GPUI, embedded GPUI, pure winit+wgpu, WinUI 3, Mobile, Linux Wayland, and Unix POSIX.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum UiKind {
    AppShell,
    TitleBar,
    NavigationRail,
    Sidebar,
    StatusBar,
    SafeArea,
    DockArea,
    ResizableSplit,
    Tabs,
    Button,
    Switch,
    Checkbox,
    Slider,
    TextInput,
    CommandPalette,
    DataTable,
    VirtualList,
    ModalDialog,
    NotificationToast,
    CodeEditor,
    TerminalPane,
    PlotChart,
    WaylandSurfaceSlot,
}

impl UiKind {
    /// Complete ordered list of all 23 component primitives.
    pub const ALL: [Self; 23] = [
        Self::AppShell,
        Self::TitleBar,
        Self::NavigationRail,
        Self::Sidebar,
        Self::StatusBar,
        Self::SafeArea,
        Self::DockArea,
        Self::ResizableSplit,
        Self::Tabs,
        Self::Button,
        Self::Switch,
        Self::Checkbox,
        Self::Slider,
        Self::TextInput,
        Self::CommandPalette,
        Self::DataTable,
        Self::VirtualList,
        Self::ModalDialog,
        Self::NotificationToast,
        Self::CodeEditor,
        Self::TerminalPane,
        Self::PlotChart,
        Self::WaylandSurfaceSlot,
    ];

    /// Kebab-case identifier used across HTML tags, NSH mount instructions, GPUI, and Figma.
    #[must_use]
    pub const fn id(self) -> &'static str {
        match self {
            Self::AppShell => "app-shell",
            Self::TitleBar => "title-bar",
            Self::NavigationRail => "navigation-rail",
            Self::Sidebar => "sidebar",
            Self::StatusBar => "status-bar",
            Self::SafeArea => "safe-area",
            Self::DockArea => "dock-area",
            Self::ResizableSplit => "resizable-split",
            Self::Tabs => "tabs",
            Self::Button => "button",
            Self::Switch => "switch",
            Self::Checkbox => "checkbox",
            Self::Slider => "slider",
            Self::TextInput => "text-input",
            Self::CommandPalette => "command-palette",
            Self::DataTable => "data-table",
            Self::VirtualList => "virtual-list",
            Self::ModalDialog => "modal-dialog",
            Self::NotificationToast => "notification-toast",
            Self::CodeEditor => "code-editor",
            Self::TerminalPane => "terminal-pane",
            Self::PlotChart => "plot-chart",
            Self::WaylandSurfaceSlot => "wayland-surface-slot",
        }
    }

    /// WAI-ARIA role string aligned with AccessKit semantic projection.
    #[must_use]
    pub const fn aria_role(self) -> &'static str {
        match self {
            Self::AppShell | Self::SafeArea | Self::DockArea | Self::ResizableSplit => "region",
            Self::TitleBar | Self::StatusBar => "banner",
            Self::NavigationRail | Self::Sidebar => "navigation",
            Self::Tabs => "tablist",
            Self::Button => "button",
            Self::Switch => "switch",
            Self::Checkbox => "checkbox",
            Self::Slider => "slider",
            Self::TextInput | Self::CommandPalette => "textbox",
            Self::DataTable => "table",
            Self::VirtualList => "list",
            Self::ModalDialog => "dialog",
            Self::NotificationToast => "status",
            Self::CodeEditor | Self::TerminalPane => "code",
            Self::PlotChart => "img",
            Self::WaylandSurfaceSlot => "application",
        }
    }

    /// Maps primitive category to HTML tag name for Dioxus/Blitz SSR.
    #[must_use]
    pub const fn html_tag(self) -> &'static str {
        match self {
            Self::TitleBar => "header",
            Self::NavigationRail => "nav",
            Self::Sidebar => "aside",
            Self::DockArea => "main",
            Self::StatusBar => "footer",
            Self::Button | Self::Switch | Self::Checkbox => "button",
            Self::CodeEditor | Self::TerminalPane => "pre",
            _ => "div",
        }
    }
}

/// Target-neutral UI node tree shared across every platform backend.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct UiNode {
    pub id: String,
    pub kind: UiKind,
    pub label: String,
    pub text: Option<String>,
    pub direction_row: bool,
    pub flex_grow: f32,
    pub width: Option<f32>,
    pub height: Option<f32>,
    pub padding: f32,
    pub gap: f32,
    pub children: Vec<UiNode>,
}

impl UiNode {
    /// Creates a container node with default column flex direction.
    #[must_use]
    pub fn container(id: impl Into<String>, kind: UiKind, label: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            kind,
            label: label.into(),
            text: None,
            direction_row: false,
            flex_grow: 0.0,
            width: None,
            height: None,
            padding: 8.0,
            gap: 8.0,
            children: Vec::new(),
        }
    }

    /// Creates a leaf text/widget node.
    #[must_use]
    pub fn leaf(
        id: impl Into<String>,
        kind: UiKind,
        label: impl Into<String>,
        text: impl Into<String>,
    ) -> Self {
        Self {
            id: id.into(),
            kind,
            label: label.into(),
            text: Some(text.into()),
            direction_row: false,
            flex_grow: 0.0,
            width: None,
            height: None,
            padding: 6.0,
            gap: 4.0,
            children: Vec::new(),
        }
    }

    #[must_use]
    pub const fn row(mut self) -> Self {
        self.direction_row = true;
        self
    }

    #[must_use]
    pub const fn grow(mut self, flex_grow: f32) -> Self {
        self.flex_grow = flex_grow;
        self
    }

    #[must_use]
    pub const fn size(mut self, width: f32, height: f32) -> Self {
        self.width = Some(width);
        self.height = Some(height);
        self
    }

    #[must_use]
    pub const fn width_px(mut self, width: f32) -> Self {
        self.width = Some(width);
        self
    }

    #[must_use]
    pub const fn height_px(mut self, height: f32) -> Self {
        self.height = Some(height);
        self
    }

    #[must_use]
    pub const fn padding_px(mut self, padding: f32) -> Self {
        self.padding = padding;
        self
    }

    #[must_use]
    pub const fn gap_px(mut self, gap: f32) -> Self {
        self.gap = gap;
        self
    }

    #[must_use]
    pub fn with_children(mut self, children: Vec<UiNode>) -> Self {
        self.children = children;
        self
    }

    /// Total node count in subtree.
    #[must_use]
    pub fn count_nodes(&self) -> usize {
        1 + self.children.iter().map(Self::count_nodes).sum::<usize>()
    }

    /// Collects flat pre-order references `(id, kind, label)`.
    #[must_use]
    pub fn flatten_summary(&self) -> Vec<(String, UiKind, String)> {
        let mut out = Vec::with_capacity(self.count_nodes());
        self.collect_summary(&mut out);
        out
    }

    fn collect_summary(&self, out: &mut Vec<(String, UiKind, String)>) {
        out.push((self.id.clone(), self.kind, self.label.clone()));
        for child in &self.children {
            child.collect_summary(out);
        }
    }

    /// Lowers node properties into a host-neutral [`LayoutStyle`].
    #[must_use]
    pub fn to_layout_style(&self, is_root: bool, viewport: (f32, f32)) -> LayoutStyle {
        let mut style = LayoutStyle::default();
        style.display = Display::Flex;
        style.flex_direction = if self.direction_row {
            FlexDirection::Row
        } else {
            FlexDirection::Column
        };
        style.overflow_x = Overflow::Clip;
        style.overflow_y = Overflow::Clip;
        style.flex_grow = self.flex_grow;
        style.flex_shrink = 1.0;
        style.min_width = Length::Px(0.0);
        style.min_height = Length::Px(0.0);
        style.padding = Sides::all(Length::Px(self.padding.max(0.0)));
        style.row_gap = Length::Px(self.gap.max(0.0));
        style.column_gap = Length::Px(self.gap.max(0.0));

        if is_root {
            style.width = Length::Px(viewport.0.max(1.0));
            style.height = Length::Px(viewport.1.max(1.0));
        } else {
            if let Some(w) = self.width {
                style.width = Length::Px(w.min(viewport.0).max(0.0));
            }
            if let Some(h) = self.height {
                style.height = Length::Px(h.min(viewport.1).max(0.0));
            }
        }
        style
    }
}

/// Result of compiling a [`UiNode`] hierarchy through `taffy` + `accesskit`.
#[derive(Debug)]
pub struct ComputedUiTree {
    pub layout: NodeLayout,
    pub accesskit_update: accesskit::TreeUpdate,
    pub vitals: LayoutVitalsAudit,
}

/// Lowers `root` to `taffy::TaffyTree`, runs layout + text measurement, projects `accesskit::TreeUpdate`,
/// and audits zero-overflow M3/Core Web Vitals bounds.
pub fn compute_ui_layout(
    root: &UiNode,
    viewport_w: f32,
    viewport_h: f32,
    use_parley: bool,
) -> Result<ComputedUiTree, String> {
    let mut tree = LayoutTree::new();
    let root_key = build_taffy_node(&mut tree, root, true, (viewport_w, viewport_h))
        .map_err(|e| format!("taffy build failed: {e:?}"))?;

    if use_parley {
        let mut measurer = ParleyMeasurer::new();
        tree.compute(root_key, Some(viewport_w), Some(viewport_h), |req| {
            clamp_measure(measurer.measure(14.0, 20.0, req), req)
        })
        .map_err(|e| format!("taffy parley compute failed: {e:?}"))?;
    } else {
        let mut measurer = monospace_measure(7.5, 20.0);
        tree.compute(root_key, Some(viewport_w), Some(viewport_h), |req| {
            clamp_measure(measurer(req), req)
        })
        .map_err(|e| format!("taffy monospace compute failed: {e:?}"))?;
    }

    let layout = tree
        .export(root_key)
        .map_err(|e| format!("layout export failed: {e:?}"))?;
    let accesskit_update = node_layout_to_accesskit(&layout);
    let vitals = audit_layout_tree_vitals(&tree, root_key, (viewport_w, viewport_h))
        .map_err(|e| format!("vitals audit failed: {e:?}"))?;

    Ok(ComputedUiTree {
        layout,
        accesskit_update,
        vitals,
    })
}

fn clamp_measure((w, h): (f32, f32), req: &MeasureRequest<'_>) -> (f32, f32) {
    let bounded_w = match (req.known_width, req.available_width) {
        (Some(kw), _) => kw,
        (None, Available::Definite(aw)) => w.min(aw.max(0.0)),
        (None, _) => w,
    };
    (bounded_w.max(0.0), h.max(20.0))
}

fn build_taffy_node(
    tree: &mut LayoutTree,
    node: &UiNode,
    is_root: bool,
    viewport: (f32, f32),
) -> Result<NodeKey, crate::layout::TreeError> {
    let style = node.to_layout_style(is_root, viewport);
    if node.children.is_empty() {
        let text = node
            .text
            .as_deref()
            .filter(|s| !s.is_empty())
            .unwrap_or(node.label.as_str());
        return tree.text(&node.id, &style, text);
    }

    let mut child_keys = Vec::with_capacity(node.children.len());
    for child in &node.children {
        child_keys.push(build_taffy_node(tree, child, false, viewport)?);
    }
    tree.node(&node.id, &style, &child_keys)
}

/// Wayland compositor + tiled browser window workspace geometry computed via `taffy`.
#[derive(Clone, Debug, PartialEq, Serialize)]
pub struct WaylandWorkspaceGeometry {
    pub zones: WaylandShellZones,
    pub tiles: Vec<taffy::LayoutRect>,
}

/// Computes Wayland layer-shell anchored zones + Hyprland/Omarchy tiled surfaces inside `viewport`.
#[must_use]
pub fn solve_wayland_workspace(
    viewport_w: f32,
    viewport_h: f32,
    gap: f32,
    tile_count: usize,
    strategy: TilingStrategy,
) -> WaylandWorkspaceGeometry {
    let zones = WaylandShellZones::solve(
        Size {
            width: viewport_w.max(1.0),
            height: viewport_h.max(1.0),
        },
        WaylandShellMargins {
            top: 40.0,
            bottom: 28.0,
            left: 72.0,
            right: 260.0,
        },
    );
    let tiles = solve_tiling_rects(zones.usable_content, gap, 0.55, tile_count, strategy);
    WaylandWorkspaceGeometry { zones, tiles }
}

/// Rope-backed code buffer statistics (`ropey`) for `UiKind::CodeEditor`.
#[cfg(feature = "editor")]
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct EditorBufferMetrics {
    pub lines: usize,
    pub chars: usize,
    pub bytes: usize,
    pub first_line: String,
}

/// Builds a `ropey::Rope` buffer and extracts exact metrics for `CodeEditor` nodes.
#[cfg(feature = "editor")]
#[must_use]
pub fn measure_rope_editor_buffer(source: &str) -> EditorBufferMetrics {
    let rope = ropey::Rope::from_str(source);
    let first_line = rope
        .lines(ropey::LineType::LF_CR)
        .next()
        .map(|slice| slice.to_string().trim_end_matches(['\r', '\n']).to_owned())
        .unwrap_or_default();
    EditorBufferMetrics {
        lines: rope.len_lines(ropey::LineType::LF_CR),
        chars: rope.len_chars(),
        bytes: rope.bytes().count(),
        first_line,
    }
}
