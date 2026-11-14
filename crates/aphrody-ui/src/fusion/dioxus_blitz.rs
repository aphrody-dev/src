// SPDX-License-Identifier: Apache-2.0
//! Dioxus 0.8 VirtualDOM SSR (`dioxus-vdom` + `dioxus-ssr`), Subsecond hot-patch jump tables,
//! AnyRender 2D vector scene recording (`anyrender::Scene`), and Vello scene diagnostics.

#[cfg(feature = "dioxus")]
use dioxus_core::dioxus_vdom::{
    Attribute, DynamicNode, VNode, VText,
    view::{AttributeBuilderTarget, ElementTag, ViewExt, element_builder},
};

#[cfg(feature = "anyrender")]
use anyrender::{PaintScene, Scene};
#[cfg(feature = "anyrender")]
use crate::layout::ecosystem::{kurbo, peniko};

use crate::fusion::components::{UiKind, UiNode};
use crate::fusion::theme_bridge::ResolvedFusionTheme;
#[cfg(feature = "anyrender")]
use crate::layout::{NodeLayout, node_layout_to_scene_quads};

#[cfg(feature = "dioxus")]
macro_rules! define_html_tag {
    ($name:ident, $tag:literal) => {
        struct $name;
        impl ElementTag for $name {
            const NAME: &'static str = $tag;
        }
    };
}

#[cfg(feature = "dioxus")]
define_html_tag!(DivTag, "div");
#[cfg(feature = "dioxus")]
define_html_tag!(HeaderTag, "header");
#[cfg(feature = "dioxus")]
define_html_tag!(NavTag, "nav");
#[cfg(feature = "dioxus")]
define_html_tag!(AsideTag, "aside");
#[cfg(feature = "dioxus")]
define_html_tag!(MainTag, "main");
#[cfg(feature = "dioxus")]
define_html_tag!(ButtonTag, "button");
#[cfg(feature = "dioxus")]
define_html_tag!(PreTag, "pre");
#[cfg(feature = "dioxus")]
define_html_tag!(FooterTag, "footer");

#[cfg(feature = "dioxus")]
fn build_element_vnode<T: ElementTag>(
    node: &UiNode,
    inline_style: String,
    children: Vec<VNode>,
) -> VNode {
    let base = element_builder::<T>()
        .append_attribute(Attribute::new("id", node.id.clone(), None, false))
        .append_attribute(Attribute::new("data-ui-kind", node.kind.id(), None, false))
        .append_attribute(Attribute::new("role", node.kind.aria_role(), None, false))
        .append_attribute(Attribute::new("aria-label", node.label.clone(), None, false))
        .append_attribute(Attribute::new("style", inline_style, None, false));

    let text_content = node.text.as_deref().unwrap_or(node.label.as_str());
    if children.is_empty() {
        base.child(DynamicNode::Text(VText::new(text_content)))
            .into_vnode()
    } else {
        base.child(DynamicNode::Fragment(children)).into_vnode()
    }
}

#[cfg(feature = "dioxus")]
fn ui_node_to_vnode(node: &UiNode) -> VNode {
    let flex_dir = if node.direction_row { "row" } else { "column" };
    let mut style = format!(
        "display:flex;flex-direction:{flex_dir};padding:{pad}px;gap:{gap}px;border-radius:var(--aphrody-radius-window);",
        pad = node.padding,
        gap = node.gap,
    );
    if node.flex_grow > 0.0 {
        style.push_str(&format!("flex-grow:{};", node.flex_grow));
    }
    if let Some(w) = node.width {
        style.push_str(&format!("width:{w}px;"));
    }
    if let Some(h) = node.height {
        style.push_str(&format!("height:{h}px;"));
    }

    let children: Vec<VNode> = node.children.iter().map(ui_node_to_vnode).collect();
    match node.kind {
        UiKind::TitleBar => build_element_vnode::<HeaderTag>(node, style, children),
        UiKind::NavigationRail => build_element_vnode::<NavTag>(node, style, children),
        UiKind::Sidebar => build_element_vnode::<AsideTag>(node, style, children),
        UiKind::DockArea => build_element_vnode::<MainTag>(node, style, children),
        UiKind::StatusBar => build_element_vnode::<FooterTag>(node, style, children),
        UiKind::Button | UiKind::Switch | UiKind::Checkbox => {
            build_element_vnode::<ButtonTag>(node, style, children)
        }
        UiKind::CodeEditor | UiKind::TerminalPane => {
            build_element_vnode::<PreTag>(node, style, children)
        }
        _ => build_element_vnode::<DivTag>(node, style, children),
    }
}

/// Renders a shared [`UiNode`] hierarchy into full SSR HTML using Dioxus 0.8 (`dioxus-vdom` + `dioxus-ssr`)
/// paired with resolved M3 CSS custom properties.
#[cfg(feature = "dioxus")]
pub fn render_dioxus_ssr_html(
    root: &UiNode,
    theme: &ResolvedFusionTheme,
    target_name: &str,
) -> Result<String, String> {
    let body_vnode = ui_node_to_vnode(root);
    let shell_vnode = element_builder::<DivTag>()
        .append_attribute(Attribute::new(
            "data-aphrody-target",
            target_name.to_owned(),
            None,
            false,
        ))
        .append_attribute(Attribute::new(
            "data-aphrody-preset",
            theme.preset.id,
            None,
            false,
        ))
        .append_attribute(Attribute::new(
            "class",
            "aphrody-fusion-root",
            None,
            false,
        ))
        .child(DynamicNode::Fragment(vec![body_vnode]))
        .into_vnode();

    let mut renderer = dioxus_ssr::Renderer::new();
    let body_html = renderer.render_element(Ok(shell_vnode));
    let css = theme.to_css_variables();
    Ok(format!(
        "<!doctype html>\n<html lang=\"en\" data-theme=\"{preset}\" data-mode=\"{mode}\">\n\
<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n\
<title>{title}</title>\n<style>\n{css}\n\
html,body{{margin:0;padding:0;background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);font-family:system-ui,sans-serif;}}\n\
.aphrody-fusion-root{{min-height:100vh;width:100%;box-sizing:border-box;}}\n\
[data-ui-kind=title-bar],[data-ui-kind=status-bar]{{background:var(--md-sys-color-surface-container-high);border-bottom:1px solid var(--md-sys-color-outline-variant);}}\n\
[data-ui-kind=button]{{background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);border:none;cursor:pointer;}}\n\
</style>\n</head>\n<body>\n{body_html}\n</body>\n</html>\n",
        preset = theme.preset.id,
        mode = if theme.dark { "dark" } else { "light" },
        title = root.label,
    ))
}

/// Fallback HTML builder when compiled without the `dioxus` feature.
#[cfg(not(feature = "dioxus"))]
pub fn render_dioxus_ssr_html(
    root: &UiNode,
    theme: &ResolvedFusionTheme,
    target_name: &str,
) -> Result<String, String> {
    let css = theme.to_css_variables();
    Ok(format!(
        "<!doctype html><html data-theme=\"{}\" data-target=\"{target_name}\"><head><style>{css}</style></head><body><div id=\"{}\">{}</div></body></html>",
        theme.preset.id, root.id, root.label
    ))
}

/// Creates a `subsecond-types` hot-patch [`subsecond_types::JumpTable`] for live Rust hot-reloading.
#[cfg(feature = "dioxus")]
#[must_use]
pub fn build_subsecond_jump_table(
    lib_path: &str,
    mappings: &[(u64, u64)],
) -> subsecond_types::JumpTable {
    let mut map = subsecond_types::AddressMap::default();
    for &(old_addr, new_addr) in mappings {
        map.insert(old_addr, new_addr);
    }
    subsecond_types::JumpTable {
        lib: std::path::PathBuf::from(lib_path),
        map,
        aslr_reference: 0x1_0000_0000,
        new_base_address: 0x1_0000_0000,
        ifunc_count: 0,
    }
}

/// Lowers a computed Taffy [`NodeLayout`] into a recorded 2D vector [`anyrender::Scene`].
#[cfg(feature = "anyrender")]
#[must_use]
pub fn render_layout_to_anyrender_scene(
    layout: &NodeLayout,
    theme: &ResolvedFusionTheme,
) -> Scene {
    let quads = node_layout_to_scene_quads(
        layout,
        f64::from(theme.preset.corner_radius_px),
        theme.surface_container_rgba,
        Some(theme.outline_variant_rgba),
    );
    let mut scene = Scene::new();
    let [sr, sg, sb, sa] = theme.surface_rgba;
    let [fr, fg, fb, fa] = theme.surface_container_rgba;
    let [or, og, ob, oa] = theme.outline_variant_rgba;
    let fill_color = peniko::Color::from_rgba8(fr, fg, fb, fa);
    let root_color = peniko::Color::from_rgba8(sr, sg, sb, sa);
    let stroke_color = peniko::Color::from_rgba8(or, og, ob, oa);

    for (idx, quad) in quads.iter().enumerate() {
        let color = if idx == 0 { root_color } else { fill_color };
        scene.fill(
            peniko::Fill::NonZero,
            kurbo::Affine::IDENTITY,
            color,
            None,
            &quad.shape,
        );
        if quad.stroke_width > 0.0 {
            let stroke = kurbo::Stroke::new(quad.stroke_width);
            scene.stroke(
                &stroke,
                kurbo::Affine::IDENTITY,
                stroke_color,
                None,
                &quad.shape,
            );
        }
    }
    scene
}

/// Inspects an [`vello::Scene`] baseline encoding when the `vello` feature is enabled.
#[cfg(feature = "vello")]
#[must_use]
pub fn vello_scene_stats() -> serde_json::Value {
    let scene = vello::Scene::new();
    let enc = scene.encoding();
    serde_json::json!({
        "backend": "vello-wgpu",
        "antialias": "Msaa16",
        "path_tags": enc.path_tags.len(),
        "path_data": enc.path_data.len(),
        "draw_tags": enc.draw_tags.len(),
    })
}
