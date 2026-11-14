// SPDX-License-Identifier: Apache-2.0
//! Compile-time typed icon contracts replacing runtime `.woff2` icon font lookups:
//! - Web / WASM (`Dioxus`, `Leptos`, SSR): [`IconData`] `&'static str` SVG 2 structs dead-stripped per constant by LLVM/`wasm-opt`
//!   (compatible with `lucide-dioxus`, `lucide-leptos`, `icondata_core`, `dioxus-iconify`).
//! - Native / GPU (`egui`, `iced`, `wgpu`/`parley`, `GPUI`): strongly-typed [`Symbol`] enum mapping to Unicode scalar codepoints
//!   (compatible with `egui_material_icons`, `iced_lucide`, `material-icons`).

pub use crate::components::facade::icons::{IconSpec, Variation};
pub use crate::components::facade::platform::IconStyle;

include!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../packages/design/tokens/symbols.rs"));

/// Return a compile-time checked outlined icon spec for a [`Symbol`].
#[must_use]
pub const fn symbol(sym: Symbol) -> IconSpec {
    IconSpec::outlined(sym.name())
}

/// Return a compile-time checked filled icon spec for a [`Symbol`].
#[must_use]
pub const fn filled_symbol(sym: Symbol) -> IconSpec {
    IconSpec {
        name: sym.name(),
        style: IconStyle::Rounded,
        variation: Variation {
            fill: 1.0,
            weight: 400,
            grade: 0,
            optical_size: 24,
        },
        requires_label: true,
    }
}

/// Return the Unicode scalar codepoint for native GPU SDF/font-atlas rendering (`egui`, `iced`, `parley`).
#[must_use]
pub const fn gpu_codepoint(sym: Symbol) -> char {
    sym.codepoint()
}

/// Return static tree-shaken W3C SVG 2 data for Web/WASM (`Dioxus`, `Leptos`, SSR HTML).
#[must_use]
pub const fn web_svg(sym: Symbol) -> &'static IconData {
    sym.icon_data()
}

/// Legacy string helper; prefer [`symbol`] for compile-time validation.
#[must_use]
pub const fn outlined(name: &'static str) -> IconSpec {
    IconSpec::outlined(name)
}

#[cfg(test)]
mod tests {
    use super::{IconStyle, Symbol, filled_symbol, gpu_codepoint, outlined, symbol, web_svg};

    #[test]
    fn standalone_icons_require_an_accessible_label() {
        let icon = outlined("settings");
        assert_eq!(icon.style, IconStyle::Outlined);
        assert!(icon.requires_label);
    }

    #[test]
    fn typed_symbols_emit_static_svg_and_gpu_codepoint() {
        let spec = symbol(Symbol::Settings);
        assert_eq!(spec.name, "settings");
        assert_eq!(gpu_codepoint(Symbol::Settings), '\u{e8b8}');
        assert_eq!(web_svg(Symbol::Settings).view_box, "0 0 24 24");
        assert!(Symbol::Settings.to_svg(false, 20).contains("fill=\"currentColor\""));
        assert_eq!(filled_symbol(Symbol::Bolt).variation.fill, 1.0);
        assert_eq!(Symbol::parse("terminal"), Some(Symbol::Terminal));
    }
}
