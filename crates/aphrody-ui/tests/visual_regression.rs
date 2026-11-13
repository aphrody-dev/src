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
    if std::env::var_os("APHRODY_UPDATE_GOLDENS").is_some() {
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
fn brand_roles_meet_contrast() {
    let p = Palette::new();
    for (bg, fg) in [("surface", "on-surface"), ("primary", "on-primary"), ("primary-container", "on-primary-container")] {
        for s in [&p.light, &p.dark] {
            let ratio = aphrody_ui::brand::contrast(s.argb(bg), s.argb(fg));
            assert!(ratio >= 4.5, "{bg}/{fg}: {ratio:.2}");
        }
    }
}
