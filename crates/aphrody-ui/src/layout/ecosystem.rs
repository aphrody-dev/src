// SPDX-License-Identifier: Apache-2.0
//! Direct Taffy ecosystem bindings for `aphrody-ui`:
//! - **Parley (`parley`)** text shaping and wrapping inside `LayoutTree` leaf measurers
//! - **Kurbo (`kurbo`) + Peniko (`peniko`)** 2D vector geometry and paint brushes
//! - **AccessKit (`accesskit`)** semantic UI accessibility tree construction
//! - **Taffy Google Design + Core Web Vitals** responsive size class & overflow diagnostics

pub use accesskit;
pub use kurbo;
pub use parley;
pub use peniko;

use crate::layout::tree::{Available, LayoutTree, MeasureRequest, NodeKey, NodeLayout};

/// Text measurer backed directly by `parley` (`FontContext` + `LayoutContext`).
pub struct ParleyMeasurer {
    font_cx: parley::FontContext,
    layout_cx: parley::LayoutContext<()>,
}

impl Default for ParleyMeasurer {
    fn default() -> Self {
        Self::new()
    }
}

impl ParleyMeasurer {
    /// Creates a new Parley measurer initialized from system fonts.
    #[must_use]
    pub fn new() -> Self {
        Self {
            font_cx: parley::FontContext::new(),
            layout_cx: parley::LayoutContext::new(),
        }
    }

    /// Measures `req.text` at `font_size` px and `line_height` px under the Taffy constraint.
    pub fn measure(
        &mut self,
        font_size: f32,
        line_height: f32,
        req: &MeasureRequest<'_>,
    ) -> (f32, f32) {
        if req.text.is_empty() {
            return (0.0, line_height.max(font_size));
        }

        let safe_font_size = font_size.max(1.0);
        let safe_line_height = line_height.max(safe_font_size);

        let mut builder =
            self.layout_cx
                .ranged_builder(&mut self.font_cx, req.text, 1.0, true);
        builder.push_default(parley::StyleProperty::FontSize(safe_font_size));
        builder.push_default(parley::StyleProperty::LineHeight(
            parley::LineHeight::Absolute(safe_line_height),
        ));
        let mut layout: parley::Layout<()> = builder.build(req.text);
        let cw = layout.calculate_content_widths();

        let max_advance = match (req.known_width, req.available_width) {
            (Some(w), _) => Some(w.max(1.0)),
            (None, Available::Definite(w)) => Some(w.max(cw.min).max(1.0)),
            (None, Available::MinContent) => Some(cw.min.max(1.0)),
            (None, Available::MaxContent) => None,
        };

        layout.break_all_lines(max_advance);

        let shaped_w = if max_advance.is_none() {
            cw.max.max(layout.width())
        } else {
            layout.width().max(layout.full_width())
        };
        let shaped_h = layout.height();

        // Fallback metrics only when headless environments ship zero system fonts in fontique.
        if shaped_w <= 0.0 {
            let char_w = safe_font_size * 0.56;
            let full = req.text.chars().count() as f32 * char_w;
            let limit = max_advance.unwrap_or(full).max(char_w);
            let lines = ((full / limit).ceil()).max(1.0);
            return (full.min(limit), lines * safe_line_height);
        }

        (shaped_w, shaped_h.max(safe_line_height))
    }
}

/// Paintable vector primitive converted from a computed Taffy [`NodeLayout`].
#[derive(Debug, Clone)]
pub struct SceneQuad {
    /// Original layout node name.
    pub name: String,
    /// Rounded-corner 2D rectangle in root pixel space.
    pub shape: kurbo::RoundedRect,
    /// Solid or gradient Peniko brush.
    pub fill: peniko::Brush,
    /// Optional stroke color.
    pub stroke_color: Option<peniko::Color>,
    /// Stroke width in logical pixels.
    pub stroke_width: f64,
}

/// Converts a computed [`NodeLayout`] tree into flat painter quads (`kurbo` + `peniko`).
#[must_use]
pub fn node_layout_to_scene_quads(
    root: &NodeLayout,
    corner_radius: f64,
    fill_rgba: [u8; 4],
    stroke_rgba: Option<[u8; 4]>,
) -> Vec<SceneQuad> {
    let mut out = Vec::new();
    let fill = peniko::Brush::Solid(peniko::Color::from_rgba8(
        fill_rgba[0],
        fill_rgba[1],
        fill_rgba[2],
        fill_rgba[3],
    ));
    let stroke_color = stroke_rgba.map(|c| peniko::Color::from_rgba8(c[0], c[1], c[2], c[3]));
    collect_quads(root, corner_radius.max(0.0), &fill, stroke_color, &mut out);
    out
}

fn collect_quads(
    node: &NodeLayout,
    corner_radius: f64,
    fill: &peniko::Brush,
    stroke_color: Option<peniko::Color>,
    out: &mut Vec<SceneQuad>,
) {
    let r = node.absolute;
    let shape = kurbo::RoundedRect::new(
        f64::from(r.x),
        f64::from(r.y),
        f64::from(r.x + r.width),
        f64::from(r.y + r.height),
        corner_radius,
    );
    out.push(SceneQuad {
        name: node.name.clone(),
        shape,
        fill: fill.clone(),
        stroke_color,
        stroke_width: if stroke_color.is_some() { 1.0 } else { 0.0 },
    });
    for child in &node.children {
        collect_quads(child, corner_radius, fill, stroke_color, out);
    }
}

/// Converts a computed [`NodeLayout`] tree into an [`accesskit::TreeUpdate`] snapshot.
#[must_use]
pub fn node_layout_to_accesskit(root: &NodeLayout) -> accesskit::TreeUpdate {
    let mut nodes: Vec<(accesskit::NodeId, accesskit::Node)> = Vec::new();
    let mut next_id = 1u64;
    let root_id = build_accesskit_node(root, &mut next_id, &mut nodes);
    accesskit::TreeUpdate {
        nodes,
        tree: Some(accesskit::TreeInfo::new(root_id)),
        tree_id: accesskit::TreeId::ROOT,
        focus: root_id,
    }
}

fn build_accesskit_node(
    layout_node: &NodeLayout,
    next_id: &mut u64,
    out: &mut Vec<(accesskit::NodeId, accesskit::Node)>,
) -> accesskit::NodeId {
    let id = accesskit::NodeId::from(*next_id);
    *next_id += 1;

    let mut child_ids = Vec::with_capacity(layout_node.children.len());
    for child in &layout_node.children {
        child_ids.push(build_accesskit_node(child, next_id, out));
    }

    let role = if child_ids.is_empty() {
        accesskit::Role::Label
    } else {
        accesskit::Role::GenericContainer
    };
    let mut node = accesskit::Node::new(role);
    let b = layout_node.absolute;
    node.set_bounds(accesskit::Rect {
        x0: f64::from(b.x),
        y0: f64::from(b.y),
        x1: f64::from(b.x + b.width),
        y1: f64::from(b.y + b.height),
    });
    if !layout_node.name.is_empty() {
        node.set_label(layout_node.name.clone());
    }
    if !child_ids.is_empty() {
        node.set_children(child_ids);
    }

    out.push((id, node));
    id
}

/// Summary combining Material 3 WindowSizeClass and layout overflow checks for a [`LayoutTree`].
#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
pub struct LayoutVitalsAudit {
    /// Material Design 3 responsive window class for the audited viewport width.
    pub window_class: taffy::google_design::WindowSizeClass,
    /// Minimum horizontal overflow (pixels beyond `viewport.0`, 0.0 when clean).
    pub horizontal_overflow_px: f32,
    /// Count of nodes inspected in the exported subtree.
    pub inspected_nodes: usize,
}

/// Audits a computed [`LayoutTree`] against Google Material 3 responsive viewport constraints.
pub fn audit_layout_tree_vitals(
    tree: &LayoutTree,
    root: NodeKey,
    viewport: (f32, f32),
) -> Result<LayoutVitalsAudit, crate::layout::tree::TreeError> {
    let exported = tree.export(root)?;
    let (inspected_nodes, max_right) = scan_overflow(&exported);
    Ok(LayoutVitalsAudit {
        window_class: taffy::google_design::WindowSizeClass::from_width(viewport.0),
        horizontal_overflow_px: (max_right - viewport.0).max(0.0),
        inspected_nodes,
    })
}

fn scan_overflow(node: &NodeLayout) -> (usize, f32) {
    let mut count = 1usize;
    let mut max_right = node.absolute.x + node.absolute.width;
    for child in &node.children {
        let (c_count, c_right) = scan_overflow(child);
        count += c_count;
        if c_right > max_right {
            max_right = c_right;
        }
    }
    (count, max_right)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::layout::parse::parse_style;
    use crate::layout::style::{FlexWrap, LayoutStyle, Length};
    use crate::layout::tokens::TokenTable;

    #[test]
    fn parley_kurbo_peniko_accesskit_pipeline_roundtrip() {
        let tokens = TokenTable::default();
        let root_style = parse_style(
            "display: flex; flex-direction: column; width: 400px; padding: 16px; gap: 12px;",
            &tokens,
        )
        .unwrap();
        let mut child_style =
            parse_style("flex-wrap: wrap; width: 100%;", &tokens).unwrap();
        child_style.flex_wrap = FlexWrap::Balance;

        let mut tree = LayoutTree::new();
        let title = tree
            .text("title", &child_style, "Aphrody Parley Taffy Title")
            .unwrap();
        let root = tree.node("card", &root_style, &[title]).unwrap();

        let mut measurer = ParleyMeasurer::new();
        tree.compute(root, Some(400.0), Some(300.0), |req| {
            measurer.measure(16.0, 22.0, req)
        })
        .unwrap();

        let exported = tree.export(root).unwrap();
        assert_eq!(exported.children.len(), 1);
        assert!(exported.absolute.height >= 54.0);

        let quads =
            node_layout_to_scene_quads(&exported, 12.0, [24, 24, 37, 255], Some([137, 180, 250, 255]));
        assert_eq!(quads.len(), 2);
        assert_eq!(quads[0].shape.radii().top_left, 12.0);

        let a11y = node_layout_to_accesskit(&exported);
        assert_eq!(a11y.nodes.len(), 2);
        assert!(a11y.tree.is_some());

        let audit = audit_layout_tree_vitals(&tree, root, (1280.0, 720.0)).unwrap();
        assert_eq!(audit.horizontal_overflow_px, 0.0);
        assert_eq!(audit.inspected_nodes, 2);
        assert_eq!(
            audit.window_class,
            taffy::google_design::WindowSizeClass::Large
        );
        let _ = (Length::Auto, LayoutStyle::default());
    }
}
