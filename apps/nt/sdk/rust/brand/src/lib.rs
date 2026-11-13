//! Marque de nt : rôles Material 3 générés par `packages/design` (Material Color Utilities depuis
//! `assets/brand/brand.toml`). Fluent et WinUI 3 restent la pile de contrôles de nt ; ce crate ne
//! fournit que les couleurs, formes et durées de la marque, en `u32` RGBA (`0xRRGGBBFF`).
#![no_std]
#![forbid(unsafe_code)]

include!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../../../../packages/design/tokens/tokens.rs"));

/// Composantes `[r, g, b, a]` dans `0.0..=1.0` (D3D12 clear color, `windows::UI::Color` après mise à l'échelle).
pub const fn rgba_f32(c: u32) -> [f32; 4] {
    [
        ((c >> 24) & 0xFF) as f32 / 255.0,
        ((c >> 16) & 0xFF) as f32 / 255.0,
        ((c >> 8) & 0xFF) as f32 / 255.0,
        (c & 0xFF) as f32 / 255.0,
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn primaire_de_marque() {
        assert_eq!(md::light::PRIMARY, 0x1242FFFF);
        assert_eq!(md::dark::PRIMARY, 0xBAC3FFFF);
        assert_eq!(rgba_f32(md::light::ON_PRIMARY), [1.0, 1.0, 1.0, 1.0]);
    }
}
