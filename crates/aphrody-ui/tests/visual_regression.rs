// SPDX-License-Identifier: Apache-2.0
//! Image regression gate of the design system: renders the brand sources (assets/brand/src) with the
//! M3 roles of packages/design through resvg/tiny-skia (CPU, deterministic) and compares a SHA-256
//! of the RGBA pixels with `tests/fixtures/visual/*.sha256`.
//! Rewrite the goldens on fr1 with `APHRODY_UPDATE_GOLDENS=1 cargo test -p aphrody-ui --test visual_regression`.

use std::{fs, path::PathBuf};

use aphrody_ui::brand::{Palette, Svg, fill, strip_comments};
use sha2::{Digest, Sha256};

fn root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../..")
}

fn hex(c: u32) -> String {
    format!("#{:06X}", c & 0x00FF_FFFF)
}

fn check(name: &str, rgba: &[u8]) {
    let digest: String = Sha256::digest(rgba).iter().map(|b| format!("{b:02x}")).collect();
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/visual").join(format!("{name}.sha256"));
    if std::env::var("APHRODY_UPDATE_GOLDENS").as_deref() == Ok("1") {
        fs::create_dir_all(path.parent().unwrap()).unwrap();
        fs::write(&path, format!("{digest}\n")).unwrap();
        return;
    }
    let expected = fs::read_to_string(&path).unwrap_or_else(|_| panic!("golden missing: {}", path.display()));
    assert_eq!(digest, expected.trim(), "{name}: pixels changed (update the golden if intended)");
}

#[test]
fn brand_sources_render_identically() {
    let src = root().join("assets/brand/src");
    let palette = Palette::new();
    let (container, glyph) = palette.org("primary");
    let vars = [("container", hex(container)), ("glyph", hex(glyph)), ("bolt", hex(palette.accent))];
    let vars: Vec<(&str, &str)> = vars.iter().map(|(k, v)| (*k, v.as_str())).collect();
    let svg = Svg::new("X", std::path::Path::new("")).unwrap();
    for (name, size) in [("mark", 64u32), ("tile", 64)] {
        let text = fs::read_to_string(src.join(format!("{name}.svg"))).unwrap();
        let pixmap = svg.pixmap(&fill(&strip_comments(&text), &vars), size, size).unwrap();
        check(&format!("{name}-{size}"), pixmap.data());
    }
}

#[test]
fn every_on_role_meets_contrast_in_all_six_modes() {
    mod tokens {
        include!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../packages/design/tokens/tokens.rs"));
    }
    use tokens::md;
    let modes: [(&str, &[(&str, u32)]); 6] = [
        ("light", md::light::ALL),
        ("dark", md::dark::ALL),
        ("light-medium-contrast", md::light_medium_contrast::ALL),
        ("dark-medium-contrast", md::dark_medium_contrast::ALL),
        ("light-high-contrast", md::light_high_contrast::ALL),
        ("dark-high-contrast", md::dark_high_contrast::ALL),
    ];
    let argb = |rgba: u32| rgba.rotate_right(8);
    for (mode, roles) in modes {
        let get = |name: &str| roles.iter().find(|(k, _)| *k == name).map(|(_, v)| argb(*v));
        let min = if mode.ends_with("high-contrast") { 7.0 } else { 4.5 };
        let mut checked = 0;
        for (name, value) in roles {
            let Some(base) = name.strip_prefix("on-") else { continue };
            let bg = match base {
                "surface-variant" => "surface",
                other => other,
            };
            let Some(bg) = get(bg) else { continue };
            let ratio = aphrody_ui::brand::contrast(argb(*value), bg);
            assert!(ratio >= min, "{mode} {name}: {ratio:.2} < {min}");
            checked += 1;
        }
        assert!(checked >= 14, "{mode}: only {checked} pairs");
        let outline = aphrody_ui::brand::contrast(get("outline").unwrap(), get("surface").unwrap());
        assert!(outline >= 3.0, "{mode} outline/surface: {outline:.2}");
    }
}
