// SPDX-License-Identifier: Apache-2.0
//! First-party implementation of the Longbridge NSH (`native-shell`) 8-platform shadow tree,
//! batched mount instructions, and adaptive desktop popup vs mobile bottom-sheet lowering.

use serde::{Deserialize, Serialize};

/// Eight runtime shells targeted by Longbridge NSH.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum NshPlatform {
    Ios,
    Android,
    MacOs,
    Windows,
    Linux,
    WebWasm,
    Tui,
    HarmonyOs,
}

impl NshPlatform {
    pub const ALL: [Self; 8] = [
        Self::Ios,
        Self::Android,
        Self::MacOs,
        Self::Windows,
        Self::Linux,
        Self::WebWasm,
        Self::Tui,
        Self::HarmonyOs,
    ];

    #[must_use]
    pub const fn is_mobile(self) -> bool {
        matches!(self, Self::Ios | Self::Android | Self::HarmonyOs)
    }

    #[must_use]
    pub const fn safe_area_insets(self) -> SafeAreaInsets {
        match self {
            Self::Ios => SafeAreaInsets {
                top: 59.0,
                bottom: 34.0,
                left: 0.0,
                right: 0.0,
            },
            Self::Android | Self::HarmonyOs => SafeAreaInsets {
                top: 32.0,
                bottom: 24.0,
                left: 0.0,
                right: 0.0,
            },
            Self::MacOs => SafeAreaInsets {
                top: 28.0,
                bottom: 0.0,
                left: 0.0,
                right: 0.0,
            },
            Self::Windows | Self::Linux | Self::WebWasm | Self::Tui => SafeAreaInsets::ZERO,
        }
    }
}

/// Platform safe-area insets in logical pixels.
#[derive(Clone, Copy, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct SafeAreaInsets {
    pub top: f32,
    pub bottom: f32,
    pub left: f32,
    pub right: f32,
}

impl SafeAreaInsets {
    pub const ZERO: Self = Self {
        top: 0.0,
        bottom: 0.0,
        left: 0.0,
        right: 0.0,
    };
}

/// Presentation role adapted automatically between desktop popup and mobile bottom-sheet.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum AdaptiveOverlayMode {
    DesktopPopup,
    MobileBottomSheet,
}

/// One node in the NSH platform-agnostic shadow tree.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct NshShadowNode {
    pub id: u32,
    pub kind: String,
    pub label: String,
    pub props_json: serde_json::Value,
    pub children: Vec<u32>,
}

/// Batched mount command emitted when reconciling [`NshShadowTree`].
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "op", rename_all = "kebab-case")]
pub enum MountInstruction {
    CreateView {
        node_id: u32,
        native_widget: String,
        label: String,
    },
    SetSafeArea {
        node_id: u32,
        insets: SafeAreaInsets,
    },
    AdaptOverlay {
        node_id: u32,
        mode: AdaptiveOverlayMode,
    },
    AppendChild {
        parent_id: u32,
        child_id: u32,
    },
    SetFrame {
        node_id: u32,
        x: f32,
        y: f32,
        width: f32,
        height: f32,
    },
}

/// Reconciled NSH mount batch ready for a host bridge (UIKit, Jetpack Compose, WinUI, AppKit, DOM, TUI).
#[derive(Clone, Debug, Serialize)]
pub struct NshMountBatch {
    pub platform: NshPlatform,
    pub safe_area: SafeAreaInsets,
    pub overlay_mode: AdaptiveOverlayMode,
    pub instructions: Vec<MountInstruction>,
}

/// Shadow tree builder producing deterministic [`MountInstruction`] batches.
#[derive(Clone, Debug, Default)]
pub struct NshShadowTree {
    next_id: u32,
    nodes: Vec<NshShadowNode>,
}

impl NshShadowTree {
    #[must_use]
    pub fn new() -> Self {
        Self {
            next_id: 1,
            nodes: Vec::new(),
        }
    }

    pub fn push_node(
        &mut self,
        kind: impl Into<String>,
        label: impl Into<String>,
        props_json: serde_json::Value,
        children: Vec<u32>,
    ) -> u32 {
        let id = self.next_id;
        self.next_id = self.next_id.saturating_add(1);
        self.nodes.push(NshShadowNode {
            id,
            kind: kind.into(),
            label: label.into(),
            props_json,
            children,
        });
        id
    }

    /// Lowers the shadow tree into an ordered batch of native mount instructions for `platform`.
    #[must_use]
    pub fn compile_for_platform(
        &self,
        platform: NshPlatform,
        rects: &[(u32, [f32; 4])],
    ) -> NshMountBatch {
        let safe_area = platform.safe_area_insets();
        let overlay_mode = if platform.is_mobile() {
            AdaptiveOverlayMode::MobileBottomSheet
        } else {
            AdaptiveOverlayMode::DesktopPopup
        };

        let mut instructions = Vec::with_capacity(self.nodes.len() * 2);
        for node in &self.nodes {
            instructions.push(MountInstruction::CreateView {
                node_id: node.id,
                native_widget: map_native_widget(platform, &node.kind),
                label: node.label.clone(),
            });
            if node.kind == "safe-area" || node.kind == "app-shell" {
                instructions.push(MountInstruction::SetSafeArea {
                    node_id: node.id,
                    insets: safe_area,
                });
            }
            if matches!(node.kind.as_str(), "modal-dialog" | "command-palette") {
                instructions.push(MountInstruction::AdaptOverlay {
                    node_id: node.id,
                    mode: overlay_mode,
                });
            }
        }
        for node in &self.nodes {
            for &child in &node.children {
                instructions.push(MountInstruction::AppendChild {
                    parent_id: node.id,
                    child_id: child,
                });
            }
        }
        for &(node_id, [x, y, width, height]) in rects {
            instructions.push(MountInstruction::SetFrame {
                node_id,
                x,
                y,
                width,
                height,
            });
        }

        NshMountBatch {
            platform,
            safe_area,
            overlay_mode,
            instructions,
        }
    }
}

#[must_use]
fn map_native_widget(platform: NshPlatform, kind: &str) -> String {
    let prefix = match platform {
        NshPlatform::Ios => "UIKit",
        NshPlatform::Android => "Compose",
        NshPlatform::MacOs => "AppKit",
        NshPlatform::Windows => "WinUI3",
        NshPlatform::Linux => "Wayland",
        NshPlatform::WebWasm => "DomElement",
        NshPlatform::Tui => "RatatuiWidget",
        NshPlatform::HarmonyOs => "ArkUI",
    };
    format!("{prefix}::{kind}")
}
