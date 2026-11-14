// SPDX-License-Identifier: Apache-2.0
//! Four canonical cross-target application pages constructed from the shared [`UiNode`] tree.

use serde::{Deserialize, Serialize};

use crate::fusion::components::{UiKind, UiNode};

/// Four flagship screens demonstrating shared UI components across all 11 render targets.
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum CanonicalPage {
    #[default]
    StudioWorkspace,
    IntelligentTerminal,
    WaylandBrowserCompositor,
    DesignSystemGallery,
}

impl CanonicalPage {
    pub const ALL: [Self; 4] = [
        Self::StudioWorkspace,
        Self::IntelligentTerminal,
        Self::WaylandBrowserCompositor,
        Self::DesignSystemGallery,
    ];

    #[must_use]
    pub const fn id(self) -> &'static str {
        match self {
            Self::StudioWorkspace => "studio-workspace",
            Self::IntelligentTerminal => "intelligent-terminal",
            Self::WaylandBrowserCompositor => "wayland-browser-compositor",
            Self::DesignSystemGallery => "design-system-gallery",
        }
    }

    #[must_use]
    pub const fn title(self) -> &'static str {
        match self {
            Self::StudioWorkspace => "Aphrody Studio Workspace",
            Self::IntelligentTerminal => "Intelligent Terminal + Shell Matrix",
            Self::WaylandBrowserCompositor => "Wayland-in-Browser Compositor (No VM)",
            Self::DesignSystemGallery => "Design System & 23 Shared Components",
        }
    }

    #[must_use]
    pub fn from_id(raw: &str) -> Option<Self> {
        match raw.trim().to_ascii_lowercase().as_str() {
            "studio-workspace" | "studio" | "ide" => Some(Self::StudioWorkspace),
            "intelligent-terminal" | "terminal" | "nsh" => Some(Self::IntelligentTerminal),
            "wayland-browser-compositor" | "wayland" | "compositor" => {
                Some(Self::WaylandBrowserCompositor)
            }
            "design-system-gallery" | "gallery" | "components" => Some(Self::DesignSystemGallery),
            _ => None,
        }
    }

    /// Builds the target-neutral [`UiNode`] layout tree for this page.
    #[must_use]
    pub fn build_ui_tree(self) -> UiNode {
        match self {
            Self::StudioWorkspace => build_studio_workspace(),
            Self::IntelligentTerminal => build_intelligent_terminal(),
            Self::WaylandBrowserCompositor => build_wayland_compositor(),
            Self::DesignSystemGallery => build_design_gallery(),
        }
    }
}

fn build_studio_workspace() -> UiNode {
    UiNode::container("studio-root", UiKind::AppShell, "Aphrody Studio Workspace")
        .padding_px(0.0)
        .gap_px(0.0)
        .with_children(vec![
            UiNode::leaf(
                "studio-titlebar",
                UiKind::TitleBar,
                "Studio TitleBar",
                "aphrody.studio :: main :: xtask-ready",
            )
            .height_px(40.0),
            UiNode::container("studio-body", UiKind::SafeArea, "Studio Body")
                .row()
                .grow(1.0)
                .padding_px(8.0)
                .with_children(vec![
                    UiNode::leaf(
                        "studio-rail",
                        UiKind::NavigationRail,
                        "NavigationRail",
                        "Files Search Git Debug",
                    )
                    .width_px(72.0),
                    UiNode::leaf(
                        "studio-sidebar",
                        UiKind::Sidebar,
                        "Workspace Explorer",
                        "src/ui/kit/src/fusion",
                    )
                    .width_px(220.0),
                    UiNode::container("studio-dock", UiKind::DockArea, "Center Dock")
                        .grow(1.0)
                        .with_children(vec![
                            UiNode::leaf(
                                "studio-tabs",
                                UiKind::Tabs,
                                "Editor Tabs",
                                "mod.rs | theme_bridge.rs | targets.rs",
                            )
                            .height_px(34.0),
                            UiNode::leaf(
                                "studio-editor",
                                UiKind::CodeEditor,
                                "Rust CodeEditor (Ropey)",
                                "pub fn render_page_to_target(page: CanonicalPage) -> Result<RenderedFrame, String>",
                            )
                            .grow(1.0),
                            UiNode::leaf(
                                "studio-terminal",
                                UiKind::TerminalPane,
                                "Integrated TerminalPane",
                                "ay ui render --page studio-workspace --target tui",
                            )
                            .height_px(136.0),
                        ]),
                ]),
            UiNode::leaf(
                "studio-status",
                UiKind::StatusBar,
                "StatusBar",
                "Rust 2024 | Taffy 0.15.1 | M3 + Hyprland",
            )
            .height_px(28.0),
        ])
}

fn build_intelligent_terminal() -> UiNode {
    UiNode::container("term-root", UiKind::AppShell, "Intelligent Terminal")
        .padding_px(0.0)
        .gap_px(0.0)
        .with_children(vec![
            UiNode::leaf(
                "term-title",
                UiKind::TitleBar,
                "Terminal Header",
                "nsh + niubash + cachy-kernel :: Wayland PTY",
            )
            .height_px(38.0),
            UiNode::leaf(
                "term-palette",
                UiKind::CommandPalette,
                "AI Command Palette",
                "> ay arch check --strict | cachy-opt | omarchy theme",
            )
            .height_px(38.0),
            UiNode::container("term-split", UiKind::ResizableSplit, "Split Panes")
                .row()
                .grow(1.0)
                .with_children(vec![
                    UiNode::leaf(
                        "term-pane-left",
                        UiKind::TerminalPane,
                        "Primary POSIX/NT PTY",
                        "aphro@workstation C:\\src $ ay graph query taffy",
                    )
                    .grow(1.0),
                    UiNode::leaf(
                        "term-pane-right",
                        UiKind::PlotChart,
                        "Telemetry PlotChart",
                        "CPU 14% | GPU SM_89 2.1ms | Zero VM overhead",
                    )
                    .width_px(280.0),
                ]),
            UiNode::leaf(
                "term-status",
                UiKind::StatusBar,
                "Terminal Status",
                "Session clean | ConPTY + POSIX bridge active",
            )
            .height_px(28.0),
        ])
}

fn build_wayland_compositor() -> UiNode {
    UiNode::container(
        "wayland-root",
        UiKind::AppShell,
        "Wayland-in-Browser Compositor",
    )
    .padding_px(0.0)
    .gap_px(0.0)
    .with_children(vec![
        UiNode::leaf(
            "wayland-bar",
            UiKind::TitleBar,
            "Wayland Shell Bar",
            "WS1: Terminal | WS2: Studio | WS3: WebGPU Preview",
        )
        .height_px(40.0),
        UiNode::container("wayland-stage", UiKind::SafeArea, "Compositor Stage")
            .row()
            .grow(1.0)
            .with_children(vec![
                UiNode::leaf(
                    "wayland-slot-a",
                    UiKind::WaylandSurfaceSlot,
                    "XDG Surface #1 (WebGPU)",
                    "xdg_toplevel::nsh-terminal [dwindle-master]",
                )
                .grow(1.0),
                UiNode::leaf(
                    "wayland-slot-b",
                    UiKind::WaylandSurfaceSlot,
                    "XDG Surface #2 (AnyRender)",
                    "xdg_toplevel::figma-inspector [dwindle-stack]",
                )
                .grow(1.0),
            ]),
        UiNode::leaf(
            "wayland-dock",
            UiKind::StatusBar,
            "Compositor Status",
            "No VM | Direct WebGPU + Smithay Wayland Wire | 60fps locked",
        )
        .height_px(28.0),
    ])
}

fn build_design_gallery() -> UiNode {
    UiNode::container("gallery-root", UiKind::AppShell, "Design System Gallery")
        .padding_px(8.0)
        .gap_px(8.0)
        .with_children(vec![
            UiNode::leaf(
                "gallery-header",
                UiKind::TitleBar,
                "Design Tokens Header",
                "9 Themes | Figma Variables | Core Web Vitals",
            )
            .height_px(38.0),
            UiNode::container("gallery-controls", UiKind::DockArea, "Interactive Controls")
                .row()
                .grow(1.0)
                .with_children(vec![
                    UiNode::leaf("btn-primary", UiKind::Button, "Primary Action", "Deploy")
                        .height_px(36.0)
                        .grow(1.0),
                    UiNode::leaf("switch-dark", UiKind::Switch, "Dark Mode", "Enabled")
                        .height_px(36.0)
                        .grow(1.0),
                    UiNode::leaf("chk-strict", UiKind::Checkbox, "Strict Audit", "Checked")
                        .height_px(36.0)
                        .grow(1.0),
                    UiNode::leaf("slider-gap", UiKind::Slider, "Tiling Gap", "12px")
                        .height_px(36.0)
                        .grow(1.0),
                    UiNode::leaf("input-seed", UiKind::TextInput, "Seed Hex", "#3355FF")
                        .height_px(36.0)
                        .grow(1.0),
                ]),
            UiNode::leaf(
                "gallery-table",
                UiKind::DataTable,
                "Preset Matrix",
                "aphrody | m3 | fluent | hyprland | omarchy | catppuccin | cachyos | nord | gruvbox",
            )
            .height_px(96.0),
            UiNode::leaf(
                "gallery-list",
                UiKind::VirtualList,
                "Render Targets",
                "tui cli web-wasm-ssr webgpu gpui embedded-gpui winit-wgpu winui3 mobile linux-wayland unix-posix",
            )
            .height_px(64.0),
            UiNode::leaf(
                "gallery-toast",
                UiKind::NotificationToast,
                "Audit Status",
                "Zero overflow | WCAG contrast verified",
            )
            .height_px(36.0),
        ])
}
