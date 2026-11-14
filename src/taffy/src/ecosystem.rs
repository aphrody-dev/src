//! # First-Party Monorepo Layout Ecosystem Extensions
//!
//! Shared Layer-0 layout solvers built directly on top of Taffy for:
//! - Wayland layer-shell anchored zone decomposition (`cosmic-compat`, `smithay-wayland-wire`, Wayland-in-browser).
//! - Hyprland-style tiling geometry (`hypr-tiler`) solved via Taffy Flexbox & CSS Grid.
//! - Recursive terminal splitter layouts for Microsoft `IntelligentTerminal`.
//! - Figma AutoLayout -> `taffy::Style` translation for `packages/design` and `aphrody-ui`.

#[cfg(not(feature = "std"))]
use alloc::vec;
#[cfg(not(feature = "std"))]
use alloc::vec::Vec;

#[cfg(feature = "std")]
use std::vec::Vec;

use crate::geometry::{Point, Rect, Size};
use crate::style::{AlignContent, AlignItems, Display, JustifyContent, Position, Style};
use crate::style_helpers::{auto, length, percent};

#[cfg(feature = "flexbox")]
use crate::style::{FlexDirection, FlexWrap};
#[cfg(feature = "grid")]
use crate::style_helpers::evenly_sized_tracks;
#[cfg(feature = "taffy_tree")]
use crate::style::AvailableSpace;
#[cfg(feature = "taffy_tree")]
use crate::tree::{Layout, NodeId, TaffyTree};

/// Canonical pixel rectangle `(x, y, width, height)` in logical surface coordinates.
#[derive(Debug, Copy, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LayoutRect {
    /// Horizontal offset from the left edge of the parent surface.
    pub x: f32,
    /// Vertical offset from the top edge of the parent surface.
    pub y: f32,
    /// Rectangle width in logical pixels.
    pub width: f32,
    /// Rectangle height in logical pixels.
    pub height: f32,
}

impl LayoutRect {
    /// Zero-sized rectangle at origin.
    pub const ZERO: Self = Self { x: 0.0, y: 0.0, width: 0.0, height: 0.0 };

    /// Construct a rectangle from `(x, y, width, height)`.
    pub const fn new(x: f32, y: f32, width: f32, height: f32) -> Self {
        Self { x, y, width, height }
    }

    /// Construct a `LayoutRect` from a computed Taffy `Layout` with an accumulated parent origin.
    #[cfg(feature = "taffy_tree")]
    pub fn from_taffy_layout(layout: &Layout, origin: Point<f32>) -> Self {
        Self {
            x: origin.x + layout.location.x,
            y: origin.y + layout.location.y,
            width: layout.size.width,
            height: layout.size.height,
        }
    }
}

/// Exclusive Wayland layer-shell edge reservations for a single output.
#[derive(Debug, Copy, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct WaylandShellMargins {
    /// Reserved height for anchored top bars (e.g. waybar / top panel).
    pub top: f32,
    /// Reserved height for anchored bottom docks / taskbars.
    pub bottom: f32,
    /// Reserved width for anchored left panels / drawers.
    pub left: f32,
    /// Reserved width for anchored right drawers / notification centers.
    pub right: f32,
}

impl WaylandShellMargins {
    /// No reserved layer-shell margins.
    pub const ZERO: Self = Self { top: 0.0, bottom: 0.0, left: 0.0, right: 0.0 };
}

impl Default for WaylandShellMargins {
    fn default() -> Self {
        Self::ZERO
    }
}

/// Decomposed Wayland layer-shell screen regions computed by Taffy.
#[derive(Debug, Copy, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct WaylandShellZones {
    /// Full physical/logical viewport rectangle.
    pub viewport: LayoutRect,
    /// Top layer-shell bar zone.
    pub top_bar: LayoutRect,
    /// Left panel / navigation rail zone between top and bottom bars.
    pub left_panel: LayoutRect,
    /// Usable tiled/windowed application workspace area inside exclusive zones.
    pub usable_content: LayoutRect,
    /// Right inspector / drawer zone between top and bottom bars.
    pub right_panel: LayoutRect,
    /// Bottom dock / status bar zone.
    pub bottom_bar: LayoutRect,
    /// Full-output overlay zone anchored at `(0, 0)` spanning the entire output.
    pub overlay: LayoutRect,
}

impl WaylandShellZones {
    /// Computes Wayland layer-shell anchored zones via a real `TaffyTree` flexbox hierarchy.
    #[cfg(all(feature = "taffy_tree", feature = "flexbox"))]
    pub fn solve(viewport: Size<f32>, margins: WaylandShellMargins) -> Self {
        let vp_w = viewport.width.max(0.0);
        let vp_h = viewport.height.max(0.0);
        let top_h = margins.top.clamp(0.0, vp_h);
        let bottom_h = margins.bottom.clamp(0.0, (vp_h - top_h).max(0.0));
        let left_w = margins.left.clamp(0.0, vp_w);
        let right_w = margins.right.clamp(0.0, (vp_w - left_w).max(0.0));

        let mut tree: TaffyTree<()> = TaffyTree::new();

        let top_node = tree
            .new_leaf(Style {
                size: Size { width: percent(1.0), height: length(top_h) },
                flex_shrink: 0.0,
                ..Style::DEFAULT
            })
            .expect("taffy leaf allocation");

        let left_node = tree
            .new_leaf(Style {
                size: Size { width: length(left_w), height: percent(1.0) },
                flex_shrink: 0.0,
                ..Style::DEFAULT
            })
            .expect("taffy leaf allocation");

        let center_node = tree
            .new_leaf(Style {
                flex_grow: 1.0,
                size: Size { width: auto(), height: percent(1.0) },
                ..Style::DEFAULT
            })
            .expect("taffy leaf allocation");

        let right_node = tree
            .new_leaf(Style {
                size: Size { width: length(right_w), height: percent(1.0) },
                flex_shrink: 0.0,
                ..Style::DEFAULT
            })
            .expect("taffy leaf allocation");

        let middle_row = tree
            .new_with_children(
                Style {
                    display: Display::Flex,
                    flex_direction: FlexDirection::Row,
                    flex_grow: 1.0,
                    size: Size { width: percent(1.0), height: auto() },
                    ..Style::DEFAULT
                },
                &[left_node, center_node, right_node],
            )
            .expect("taffy container allocation");

        let bottom_node = tree
            .new_leaf(Style {
                size: Size { width: percent(1.0), height: length(bottom_h) },
                flex_shrink: 0.0,
                ..Style::DEFAULT
            })
            .expect("taffy leaf allocation");

        let overlay_node = tree
            .new_leaf(Style {
                position: Position::Absolute,
                inset: Rect::zero(),
                size: Size { width: percent(1.0), height: percent(1.0) },
                ..Style::DEFAULT
            })
            .expect("taffy leaf allocation");

        let root = tree
            .new_with_children(
                Style {
                    display: Display::Flex,
                    flex_direction: FlexDirection::Column,
                    size: Size { width: length(vp_w), height: length(vp_h) },
                    ..Style::DEFAULT
                },
                &[top_node, middle_row, bottom_node, overlay_node],
            )
            .expect("taffy root allocation");

        tree.compute_layout(
            root,
            Size { width: AvailableSpace::Definite(vp_w), height: AvailableSpace::Definite(vp_h) },
        )
        .expect("taffy layout solve");

        let mid_layout = *tree.layout(middle_row).expect("middle row layout");
        let mid_origin = mid_layout.location;

        Self {
            viewport: LayoutRect::new(0.0, 0.0, vp_w, vp_h),
            top_bar: LayoutRect::from_taffy_layout(tree.layout(top_node).expect("top bar layout"), Point::ZERO),
            left_panel: LayoutRect::from_taffy_layout(tree.layout(left_node).expect("left panel layout"), mid_origin),
            usable_content: LayoutRect::from_taffy_layout(tree.layout(center_node).expect("usable layout"), mid_origin),
            right_panel: LayoutRect::from_taffy_layout(
                tree.layout(right_node).expect("right panel layout"),
                mid_origin,
            ),
            bottom_bar: LayoutRect::from_taffy_layout(
                tree.layout(bottom_node).expect("bottom bar layout"),
                Point::ZERO,
            ),
            overlay: LayoutRect::from_taffy_layout(tree.layout(overlay_node).expect("overlay layout"), Point::ZERO),
        }
    }
}

/// Window tiling algorithm shared across Hyprland/Omarchy and Wayland-in-browser compositors.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum TilingStrategy {
    /// Recursive binary BSP/dwindle split alternating horizontal and vertical flex containers.
    Dwindle,
    /// Left master column paired with a vertical stack column for remaining windows.
    MasterStack,
    /// Balanced CSS Grid layout computed via Taffy Grid.
    Grid,
    /// Single active maximized tile covering the full usable area.
    Monocle,
}

/// Computes `count` window tile rectangles inside `area` using Taffy layout trees.
#[cfg(all(feature = "taffy_tree", feature = "flexbox", feature = "grid"))]
pub fn solve_tiling_rects(
    area: LayoutRect,
    gap: f32,
    master_ratio: f32,
    count: usize,
    strategy: TilingStrategy,
) -> Vec<LayoutRect> {
    if count == 0 {
        return Vec::new();
    }

    let safe_gap = gap.max(0.0);
    let safe_ratio = master_ratio.clamp(0.15, 0.85);
    let origin = Point { x: area.x, y: area.y };

    if count == 1 || strategy == TilingStrategy::Monocle {
        return vec![LayoutRect::new(area.x, area.y, area.width.max(0.0), area.height.max(0.0))];
    }

    let mut tree: TaffyTree<()> = TaffyTree::new();
    let mut leaves: Vec<NodeId> = Vec::with_capacity(count);
    let mut parent_map: Vec<(NodeId, Option<NodeId>)> = Vec::new();

    let root = match strategy {
        TilingStrategy::Monocle => unreachable!("handled above"),
        TilingStrategy::MasterStack => {
            let master = tree
                .new_leaf(Style {
                    flex_grow: safe_ratio,
                    size: Size { width: percent(safe_ratio), height: percent(1.0) },
                    ..Style::DEFAULT
                })
                .expect("taffy master leaf");
            leaves.push(master);

            let mut stack_children = Vec::with_capacity(count - 1);
            for _ in 1..count {
                let child = tree
                    .new_leaf(Style {
                        flex_grow: 1.0,
                        size: Size { width: percent(1.0), height: auto() },
                        ..Style::DEFAULT
                    })
                    .expect("taffy stack leaf");
                stack_children.push(child);
                leaves.push(child);
            }

            let stack_col = tree
                .new_with_children(
                    Style {
                        display: Display::Flex,
                        flex_direction: FlexDirection::Column,
                        flex_grow: 1.0 - safe_ratio,
                        gap: Size { width: length(safe_gap), height: length(safe_gap) },
                        size: Size { width: auto(), height: percent(1.0) },
                        ..Style::DEFAULT
                    },
                    &stack_children,
                )
                .expect("taffy stack column");

            let root = tree
                .new_with_children(
                    Style {
                        display: Display::Flex,
                        flex_direction: FlexDirection::Row,
                        gap: Size { width: length(safe_gap), height: length(safe_gap) },
                        size: Size { width: length(area.width.max(0.0)), height: length(area.height.max(0.0)) },
                        ..Style::DEFAULT
                    },
                    &[master, stack_col],
                )
                .expect("taffy master-stack root");

            parent_map.push((master, None));
            for ch in stack_children {
                parent_map.push((ch, Some(stack_col)));
            }
            root
        }
        TilingStrategy::Grid => {
            let cols = integer_ceil_sqrt(count);
            let rows = count.div_ceil(cols);
            for _ in 0..count {
                let cell = tree
                    .new_leaf(Style {
                        size: Size { width: percent(1.0), height: percent(1.0) },
                        ..Style::DEFAULT
                    })
                    .expect("taffy grid cell");
                leaves.push(cell);
                parent_map.push((cell, None));
            }
            tree.new_with_children(
                Style {
                    display: Display::Grid,
                    grid_template_columns: evenly_sized_tracks(cols as u16),
                    grid_template_rows: evenly_sized_tracks(rows as u16),
                    gap: Size { width: length(safe_gap), height: length(safe_gap) },
                    size: Size { width: length(area.width.max(0.0)), height: length(area.height.max(0.0)) },
                    ..Style::DEFAULT
                },
                &leaves,
            )
            .expect("taffy grid root")
        }
        TilingStrategy::Dwindle => {
            let root = build_dwindle_tree(
                &mut tree,
                count,
                safe_gap,
                safe_ratio,
                0,
                &mut leaves,
                &mut parent_map,
            );
            let mut style = tree.style(root).expect("dwindle root style").clone();
            style.size = Size { width: length(area.width.max(0.0)), height: length(area.height.max(0.0)) };
            tree.set_style(root, style).expect("set dwindle root size");
            root
        }
    };

    tree.compute_layout(
        root,
        Size {
            width: AvailableSpace::Definite(area.width.max(0.0)),
            height: AvailableSpace::Definite(area.height.max(0.0)),
        },
    )
    .expect("tiling compute_layout");

    // Accumulate nested container offsets for any leaf whose direct parent is below root.
    let mut rects = Vec::with_capacity(leaves.len());
    for (node, _) in &parent_map {
        let abs_origin = resolve_node_origin(&tree, root, *node, origin);
        let layout = tree.layout(*node).expect("leaf layout");
        rects.push(LayoutRect::from_taffy_layout(layout, abs_origin));
    }
    rects
}

/// Recursively constructs a binary split dwindle Taffy subtree.
#[cfg(all(feature = "taffy_tree", feature = "flexbox"))]
fn build_dwindle_tree(
    tree: &mut TaffyTree<()>,
    remaining: usize,
    gap: f32,
    master_ratio: f32,
    depth: usize,
    leaves: &mut Vec<NodeId>,
    entries: &mut Vec<(NodeId, Option<NodeId>)>,
) -> NodeId {
    if remaining == 1 {
        let leaf = tree
            .new_leaf(Style {
                flex_grow: if depth == 0 { 1.0 } else { 1.0 - master_ratio },
                size: Size { width: percent(1.0), height: percent(1.0) },
                ..Style::DEFAULT
            })
            .expect("dwindle leaf");
        leaves.push(leaf);
        entries.push((leaf, None));
        return leaf;
    }

    let first_is_horizontal = depth % 2 == 0;
    let first_leaf = tree
        .new_leaf(Style {
            flex_grow: master_ratio,
            size: Size {
                width: if first_is_horizontal { auto() } else { percent(1.0) },
                height: if first_is_horizontal { percent(1.0) } else { auto() },
            },
            ..Style::DEFAULT
        })
        .expect("dwindle first leaf");
    leaves.push(first_leaf);
    entries.push((first_leaf, None));

    let sub = build_dwindle_tree(tree, remaining - 1, gap, master_ratio, depth + 1, leaves, entries);

    let container = tree
        .new_with_children(
            Style {
                display: Display::Flex,
                flex_direction: if first_is_horizontal { FlexDirection::Row } else { FlexDirection::Column },
                flex_grow: 1.0 - master_ratio,
                gap: Size { width: length(gap), height: length(gap) },
                size: Size {
                    width: if depth == 0 { percent(1.0) } else { auto() },
                    height: if depth == 0 { percent(1.0) } else { auto() },
                },
                ..Style::DEFAULT
            },
            &[first_leaf, sub],
        )
        .expect("dwindle split container");

    // Ensure children fill along the cross axis inside split containers.
    let mut sub_style = tree.style(sub).expect("sub style").clone();
    sub_style.flex_grow = 1.0 - master_ratio;
    sub_style.size = Size {
        width: if first_is_horizontal { auto() } else { percent(1.0) },
        height: if first_is_horizontal { percent(1.0) } else { auto() },
    };
    tree.set_style(sub, sub_style).expect("set sub style");

    container
}

/// Computes `ceil(sqrt(n))` without floating-point dependencies so it remains `no_std` safe.
fn integer_ceil_sqrt(n: usize) -> usize {
    let mut k = 1usize;
    while k.saturating_mul(k) < n {
        k += 1;
    }
    k
}

/// Walks parent pointers up to `root` to obtain a node's absolute parent origin.
#[cfg(feature = "taffy_tree")]
fn resolve_node_origin(tree: &TaffyTree<()>, root: NodeId, node: NodeId, root_origin: Point<f32>) -> Point<f32> {
    let mut origin = root_origin;
    let mut cursor = tree.parent(node);
    while let Some(p) = cursor {
        if p == root {
            break;
        }
        if let Ok(layout) = tree.layout(p) {
            origin.x += layout.location.x;
            origin.y += layout.location.y;
        }
        cursor = tree.parent(p);
    }
    origin
}

/// Recursive split tree node representing terminal tab/pane layouts (Microsoft `IntelligentTerminal`).
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum TerminalSplitNode {
    /// Leaf terminal session identified by `id` and proportional `weight`.
    Pane {
        /// Logical pane identifier.
        id: u64,
        /// Relative flex growth weight (> 0.0).
        weight: f32,
    },
    /// Horizontal row container splitting width across child nodes.
    Row {
        /// Relative flex growth weight inside its parent container.
        weight: f32,
        /// Ordered child subtrees arranged left-to-right.
        children: Vec<TerminalSplitNode>,
    },
    /// Vertical column container splitting height across child nodes.
    Column {
        /// Relative flex growth weight inside its parent container.
        weight: f32,
        /// Ordered child subtrees arranged top-to-bottom.
        children: Vec<TerminalSplitNode>,
    },
}

/// Solved bounding rectangle for one terminal leaf pane.
#[derive(Debug, Copy, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct TerminalPaneRect {
    /// Logical pane identifier from [`TerminalSplitNode::Pane`].
    pub id: u64,
    /// Computed screen/viewport rectangle for this terminal pane.
    pub rect: LayoutRect,
}

/// Solves a recursive [`TerminalSplitNode`] tree inside `viewport` using Taffy Flexbox.
#[cfg(all(feature = "taffy_tree", feature = "flexbox"))]
pub fn solve_terminal_panes(root_spec: &TerminalSplitNode, viewport: LayoutRect, gap: f32) -> Vec<TerminalPaneRect> {
    let mut tree: TaffyTree<()> = TaffyTree::new();
    let mut leaf_ids: Vec<(u64, NodeId)> = Vec::new();
    let safe_gap = gap.max(0.0);

    let root = build_terminal_node(&mut tree, root_spec, safe_gap, true, &mut leaf_ids);
    let mut root_style = tree.style(root).expect("terminal root style").clone();
    root_style.size = Size { width: length(viewport.width.max(0.0)), height: length(viewport.height.max(0.0)) };
    tree.set_style(root, root_style).expect("set terminal root size");

    tree.compute_layout(
        root,
        Size {
            width: AvailableSpace::Definite(viewport.width.max(0.0)),
            height: AvailableSpace::Definite(viewport.height.max(0.0)),
        },
    )
    .expect("terminal pane solve");

    let origin = Point { x: viewport.x, y: viewport.y };
    leaf_ids
        .into_iter()
        .map(|(id, node)| {
            let abs_origin = resolve_node_origin(&tree, root, node, origin);
            let layout = tree.layout(node).expect("terminal leaf layout");
            TerminalPaneRect { id, rect: LayoutRect::from_taffy_layout(layout, abs_origin) }
        })
        .collect()
}

/// Helper building one Taffy node for a [`TerminalSplitNode`].
#[cfg(all(feature = "taffy_tree", feature = "flexbox"))]
fn build_terminal_node(
    tree: &mut TaffyTree<()>,
    spec: &TerminalSplitNode,
    gap: f32,
    is_root: bool,
    leaves: &mut Vec<(u64, NodeId)>,
) -> NodeId {
    match spec {
        TerminalSplitNode::Pane { id, weight } => {
            let node = tree
                .new_leaf(Style {
                    flex_grow: weight.max(0.01),
                    size: Size { width: percent(1.0), height: percent(1.0) },
                    ..Style::DEFAULT
                })
                .expect("terminal leaf node");
            leaves.push((*id, node));
            node
        }
        TerminalSplitNode::Row { weight, children } => {
            let built: Vec<NodeId> = children
                .iter()
                .map(|c| build_terminal_node(tree, c, gap, false, leaves))
                .collect();
            for &child in &built {
                let mut st = tree.style(child).expect("row child style").clone();
                st.size = Size { width: auto(), height: percent(1.0) };
                tree.set_style(child, st).expect("row child update");
            }
            tree.new_with_children(
                Style {
                    display: Display::Flex,
                    flex_direction: FlexDirection::Row,
                    flex_grow: if is_root { 1.0 } else { weight.max(0.01) },
                    gap: Size { width: length(gap), height: length(gap) },
                    ..Style::DEFAULT
                },
                &built,
            )
            .expect("terminal row node")
        }
        TerminalSplitNode::Column { weight, children } => {
            let built: Vec<NodeId> = children
                .iter()
                .map(|c| build_terminal_node(tree, c, gap, false, leaves))
                .collect();
            for &child in &built {
                let mut st = tree.style(child).expect("col child style").clone();
                st.size = Size { width: percent(1.0), height: auto() };
                tree.set_style(child, st).expect("col child update");
            }
            tree.new_with_children(
                Style {
                    display: Display::Flex,
                    flex_direction: FlexDirection::Column,
                    flex_grow: if is_root { 1.0 } else { weight.max(0.01) },
                    gap: Size { width: length(gap), height: length(gap) },
                    ..Style::DEFAULT
                },
                &built,
            )
            .expect("terminal column node")
        }
    }
}

/// Primary layout axis for Figma AutoLayout frames.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash, Default)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum FigmaAutoLayoutDirection {
    /// Horizontal stacking (`HORIZONTAL`).
    Horizontal,
    /// Vertical stacking (`VERTICAL`).
    #[default]
    Vertical,
}

/// Alignment mapping for Figma primary and counter AutoLayout axes.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash, Default)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum FigmaAutoLayoutAlign {
    /// Align items at the start edge (`MIN`).
    #[default]
    Min,
    /// Center items along the axis (`CENTER`).
    Center,
    /// Align items at the end edge (`MAX`).
    Max,
    /// Distribute space evenly between items (`SPACE_BETWEEN`).
    SpaceBetween,
    /// Stretch items to fill cross-axis size.
    Stretch,
}

/// Declarative Figma AutoLayout frame descriptor convertible straight into [`Style`].
#[derive(Debug, Copy, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct FigmaAutoLayoutSpec {
    /// Primary AutoLayout flow direction.
    pub direction: FigmaAutoLayoutDirection,
    /// Item spacing (`itemSpacing`) in pixels.
    pub gap: f32,
    /// Inner container padding in CSS order `[top, right, bottom, left]`.
    pub padding: [f32; 4],
    /// Fixed width in pixels (`None` resolves to `auto()`).
    pub width: Option<f32>,
    /// Fixed height in pixels (`None` resolves to `auto()`).
    pub height: Option<f32>,
    /// Primary-axis alignment (`primaryAxisAlignItems`).
    pub primary_align: FigmaAutoLayoutAlign,
    /// Counter-axis alignment (`counterAxisAlignItems`).
    pub counter_align: FigmaAutoLayoutAlign,
    /// Whether AutoLayout wraps overflowing children across lines.
    pub wrap: bool,
}

impl Default for FigmaAutoLayoutSpec {
    fn default() -> Self {
        Self {
            direction: FigmaAutoLayoutDirection::Vertical,
            gap: 0.0,
            padding: [0.0; 4],
            width: None,
            height: None,
            primary_align: FigmaAutoLayoutAlign::Min,
            counter_align: FigmaAutoLayoutAlign::Min,
            wrap: false,
        }
    }
}

impl FigmaAutoLayoutSpec {
    /// Translates this Figma AutoLayout specification directly into a [`Style`].
    #[cfg(feature = "flexbox")]
    pub fn to_taffy_style(&self) -> Style {
        let safe_gap = self.gap.max(0.0);
        Style {
            display: Display::Flex,
            flex_direction: match self.direction {
                FigmaAutoLayoutDirection::Horizontal => FlexDirection::Row,
                FigmaAutoLayoutDirection::Vertical => FlexDirection::Column,
            },
            flex_wrap: if self.wrap { FlexWrap::Wrap } else { FlexWrap::NoWrap },
            gap: Size { width: length(safe_gap), height: length(safe_gap) },
            padding: Rect {
                top: length(self.padding[0].max(0.0)),
                right: length(self.padding[1].max(0.0)),
                bottom: length(self.padding[2].max(0.0)),
                left: length(self.padding[3].max(0.0)),
            },
            size: Size {
                width: self.width.map(length).unwrap_or_else(auto),
                height: self.height.map(length).unwrap_or_else(auto),
            },
            justify_content: match self.primary_align {
                FigmaAutoLayoutAlign::Min => JustifyContent::FLEX_START,
                FigmaAutoLayoutAlign::Center => JustifyContent::CENTER,
                FigmaAutoLayoutAlign::Max => JustifyContent::FLEX_END,
                FigmaAutoLayoutAlign::SpaceBetween => JustifyContent::SPACE_BETWEEN,
                FigmaAutoLayoutAlign::Stretch => JustifyContent::STRETCH,
            },
            align_items: match self.counter_align {
                FigmaAutoLayoutAlign::Min | FigmaAutoLayoutAlign::SpaceBetween => AlignItems::FLEX_START,
                FigmaAutoLayoutAlign::Center => AlignItems::CENTER,
                FigmaAutoLayoutAlign::Max => AlignItems::FLEX_END,
                FigmaAutoLayoutAlign::Stretch => AlignItems::STRETCH,
            },
            align_content: if self.wrap { AlignContent::FLEX_START } else { AlignContent::STRETCH },
            ..Style::DEFAULT
        }
    }
}

/// Screen layout spec extracted from a `DESIGN.md` document (from `google-labs-code/design.md`
/// and `stitch-sdk`), mapped directly onto `taffy` + Google Design / Wayland shell geometry.
#[derive(Debug, Copy, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct DesignMdScreenSpec {
    /// Viewport width in logical pixels.
    pub viewport_width: f32,
    /// Viewport height in logical pixels.
    pub viewport_height: f32,
    /// Outer margin from `DESIGN.md` layout tokens (or responsive Google Design fallback when `None`).
    pub margin: Option<f32>,
    /// Grid gutter in logical pixels.
    pub gutter: f32,
    /// Optional top bar / shell header height.
    pub top_bar_height: f32,
    /// Optional left navigation rail / panel width.
    pub nav_width: f32,
    /// Number of content panes/cards to distribute inside the main workspace.
    pub pane_count: usize,
}

impl DesignMdScreenSpec {
    /// Default desktop specification (`1440x900`) aligned with `DESIGN.md` Material 3 tokens.
    pub const fn desktop(pane_count: usize) -> Self {
        Self {
            viewport_width: 1440.0,
            viewport_height: 900.0,
            margin: None,
            gutter: 16.0,
            top_bar_height: 56.0,
            nav_width: 240.0,
            pane_count,
        }
    }
}

/// Solved `DESIGN.md` screen layout combining `WaylandShellZones`, responsive `WindowSizeClass`,
/// and Taffy-computed content pane rectangles.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct DesignMdLayoutPlan {
    /// Google Design / Material 3 adaptive window size class for the viewport width.
    pub size_class: crate::google_design::WindowSizeClass,
    /// Outer margin used in logical pixels.
    pub margin: f32,
    /// Recommended responsive grid columns for this viewport.
    pub recommended_columns: u16,
    /// Wayland shell zones (`top_bar`, `left_panel`, `main_workspace`, etc.).
    pub shell: WaylandShellZones,
    /// Computed pane rectangles inside `shell.main_workspace`.
    pub panes: Vec<LayoutRect>,
}

/// Solves a `DESIGN.md` + Stitch screen layout through `taffy` (`WaylandShellZones` + `solve_tiling_rects`).
#[cfg(all(feature = "taffy_tree", feature = "flexbox", feature = "grid"))]
pub fn solve_design_md_taffy_grid(spec: DesignMdScreenSpec) -> Result<DesignMdLayoutPlan, crate::TaffyError> {
    let size_class = crate::google_design::WindowSizeClass::from_width(spec.viewport_width);
    let margin = spec.margin.unwrap_or_else(|| size_class.margin_dp()).max(0.0);
    let recommended_columns = size_class.grid_columns();
    let nav_width = match size_class {
        crate::google_design::WindowSizeClass::Compact => 0.0,
        _ => spec.nav_width.max(0.0),
    };
    let margins = WaylandShellMargins {
        top: spec.top_bar_height.max(0.0),
        bottom: 0.0,
        left: nav_width,
        right: 0.0,
    };
    let shell = WaylandShellZones::solve(
        Size { width: spec.viewport_width, height: spec.viewport_height },
        margins,
    );
    let panes = solve_tiling_rects(
        shell.usable_content,
        spec.gutter.max(0.0),
        0.5,
        spec.pane_count,
        TilingStrategy::Grid,
    );
    Ok(DesignMdLayoutPlan { size_class, margin, recommended_columns, shell, panes })
}
