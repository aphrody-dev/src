//! Deterministic asset generation: a glTF binary (GLB) character built from boxes and a few SVG
//! icons, all from formulas. No external model, texture or font: nothing here is third-party work.

use std::fmt::Write as _;

/// One box of the character: `pivot` is the node origin (a joint), `center` the box centre
/// relative to the pivot, `half` its half extents.
pub struct Part {
    pub name: &'static str,
    pub pivot: [f32; 3],
    pub center: [f32; 3],
    pub half: [f32; 3],
    pub color: [f32; 3],
}

/// The explorer: legs and arms hang from joints so the game can swing them.
pub fn explorer_parts() -> Vec<Part> {
    let skin = [0.86, 0.66, 0.52];
    let cloth = [0.16, 0.42, 0.62];
    let pants = [0.20, 0.20, 0.26];
    let accent = [0.95, 0.62, 0.15];
    vec![
        Part {
            name: "leg_l",
            pivot: [-0.13, 0.85, 0.0],
            center: [0.0, -0.4, 0.0],
            half: [0.09, 0.425, 0.10],
            color: pants,
        },
        Part {
            name: "leg_r",
            pivot: [0.13, 0.85, 0.0],
            center: [0.0, -0.4, 0.0],
            half: [0.09, 0.425, 0.10],
            color: pants,
        },
        Part {
            name: "torso",
            pivot: [0.0, 0.85, 0.0],
            center: [0.0, 0.33, 0.0],
            half: [0.24, 0.33, 0.13],
            color: cloth,
        },
        Part {
            name: "pack",
            pivot: [0.0, 0.85, 0.0],
            center: [0.0, 0.36, 0.2],
            half: [0.17, 0.24, 0.08],
            color: accent,
        },
        Part {
            name: "arm_l",
            pivot: [-0.33, 1.4, 0.0],
            center: [0.0, -0.3, 0.0],
            half: [0.07, 0.32, 0.08],
            color: skin,
        },
        Part {
            name: "arm_r",
            pivot: [0.33, 1.4, 0.0],
            center: [0.0, -0.3, 0.0],
            half: [0.07, 0.32, 0.08],
            color: skin,
        },
        Part {
            name: "head",
            pivot: [0.0, 1.52, 0.0],
            center: [0.0, 0.14, 0.0],
            half: [0.14, 0.14, 0.14],
            color: skin,
        },
        Part {
            name: "visor",
            pivot: [0.0, 1.52, 0.0],
            center: [0.0, 0.17, -0.12],
            half: [0.15, 0.05, 0.04],
            color: accent,
        },
    ]
}

/// Faces of a unit cube: normal and four corners (counter-clockwise seen from outside).
const FACES: [([f32; 3], [[f32; 3]; 4]); 6] = [
    ([1.0, 0.0, 0.0], [[1.0, -1.0, 1.0], [1.0, -1.0, -1.0], [1.0, 1.0, -1.0], [1.0, 1.0, 1.0]]),
    ([-1.0, 0.0, 0.0], [[-1.0, -1.0, -1.0], [-1.0, -1.0, 1.0], [-1.0, 1.0, 1.0], [-1.0, 1.0, -1.0]]),
    ([0.0, 1.0, 0.0], [[-1.0, 1.0, 1.0], [1.0, 1.0, 1.0], [1.0, 1.0, -1.0], [-1.0, 1.0, -1.0]]),
    ([0.0, -1.0, 0.0], [[-1.0, -1.0, -1.0], [1.0, -1.0, -1.0], [1.0, -1.0, 1.0], [-1.0, -1.0, 1.0]]),
    ([0.0, 0.0, 1.0], [[-1.0, -1.0, 1.0], [1.0, -1.0, 1.0], [1.0, 1.0, 1.0], [-1.0, 1.0, 1.0]]),
    ([0.0, 0.0, -1.0], [[1.0, -1.0, -1.0], [-1.0, -1.0, -1.0], [-1.0, 1.0, -1.0], [1.0, 1.0, -1.0]]),
];

fn box_geometry(p: &Part) -> (Vec<[f32; 3]>, Vec<[f32; 3]>, Vec<u16>) {
    let mut pos = Vec::with_capacity(24);
    let mut nrm = Vec::with_capacity(24);
    let mut idx = Vec::with_capacity(36);
    for (normal, corners) in FACES {
        let base = pos.len() as u16;
        for c in corners {
            pos.push([
                p.center[0] + c[0] * p.half[0],
                p.center[1] + c[1] * p.half[1],
                p.center[2] + c[2] * p.half[2],
            ]);
            nrm.push(normal);
        }
        idx.extend_from_slice(&[base, base + 1, base + 2, base, base + 2, base + 3]);
    }
    (pos, nrm, idx)
}

fn pad(buf: &mut Vec<u8>, byte: u8) {
    while buf.len() % 4 != 0 {
        buf.push(byte);
    }
}

fn push_f32x3(bin: &mut Vec<u8>, v: &[[f32; 3]]) {
    for p in v {
        for c in p {
            bin.extend_from_slice(&c.to_le_bytes());
        }
    }
}

/// Serialize parts as a GLB 2.0: one node, mesh and material per part, flat colors.
pub fn build_glb(parts: &[Part]) -> Vec<u8> {
    let mut bin: Vec<u8> = Vec::new();
    let (mut views, mut accessors, mut meshes, mut nodes, mut materials) =
        (String::new(), String::new(), String::new(), String::new(), String::new());
    for (i, part) in parts.iter().enumerate() {
        let (pos, nrm, idx) = box_geometry(part);
        let (mut lo, mut hi) = ([f32::MAX; 3], [f32::MIN; 3]);
        for p in &pos {
            for k in 0..3 {
                lo[k] = lo[k].min(p[k]);
                hi[k] = hi[k].max(p[k]);
            }
        }
        let pos_off = bin.len();
        push_f32x3(&mut bin, &pos);
        let nrm_off = bin.len();
        push_f32x3(&mut bin, &nrm);
        let idx_off = bin.len();
        for i in &idx {
            bin.extend_from_slice(&i.to_le_bytes());
        }
        pad(&mut bin, 0);
        let end = bin.len();
        let sep = if i == 0 { "" } else { "," };
        let v = i * 3;
        let _ = write!(
            views,
            "{sep}{{\"buffer\":0,\"byteOffset\":{pos_off},\"byteLength\":{},\"target\":34962}},\
             {{\"buffer\":0,\"byteOffset\":{nrm_off},\"byteLength\":{},\"target\":34962}},\
             {{\"buffer\":0,\"byteOffset\":{idx_off},\"byteLength\":{},\"target\":34963}}",
            nrm_off - pos_off,
            idx_off - nrm_off,
            end - idx_off
        );
        let _ = write!(
            accessors,
            "{sep}{{\"bufferView\":{v},\"componentType\":5126,\"count\":{},\"type\":\"VEC3\",\"min\":[{},{},{}],\"max\":[{},{},{}]}},\
             {{\"bufferView\":{},\"componentType\":5126,\"count\":{},\"type\":\"VEC3\"}},\
             {{\"bufferView\":{},\"componentType\":5123,\"count\":{},\"type\":\"SCALAR\"}}",
            pos.len(),
            lo[0], lo[1], lo[2], hi[0], hi[1], hi[2],
            v + 1,
            nrm.len(),
            v + 2,
            idx.len()
        );
        let _ = write!(
            meshes,
            "{sep}{{\"name\":\"{n}\",\"primitives\":[{{\"attributes\":{{\"POSITION\":{v},\"NORMAL\":{}}},\"indices\":{},\"material\":{i},\"mode\":4}}]}}",
            v + 1,
            v + 2,
            n = part.name
        );
        let _ = write!(
            nodes,
            "{sep}{{\"name\":\"{}\",\"mesh\":{i},\"translation\":[{},{},{}]}}",
            part.name, part.pivot[0], part.pivot[1], part.pivot[2]
        );
        let _ = write!(
            materials,
            "{sep}{{\"name\":\"{}\",\"pbrMetallicRoughness\":{{\"baseColorFactor\":[{},{},{},1],\"metallicFactor\":0,\"roughnessFactor\":0.85}}}}",
            part.name, part.color[0], part.color[1], part.color[2]
        );
    }
    let children: Vec<String> = (0..parts.len()).map(|i| i.to_string()).collect();
    let root = parts.len();
    let _ = write!(
        nodes,
        ",{{\"name\":\"explorer\",\"children\":[{}]}}",
        children.join(",")
    );
    let mut json = format!(
        "{{\"asset\":{{\"version\":\"2.0\",\"generator\":\"aphrody game gen-assets\"}},\"scene\":0,\"scenes\":[{{\"nodes\":[{root}]}}],\"nodes\":[{nodes}],\"meshes\":[{meshes}],\"materials\":[{materials}],\"accessors\":[{accessors}],\"bufferViews\":[{views}],\"buffers\":[{{\"byteLength\":{}}}]}}",
        bin.len()
    )
    .into_bytes();
    pad(&mut json, b' ');
    let total = 12 + 8 + json.len() + 8 + bin.len();
    let mut out = Vec::with_capacity(total);
    out.extend_from_slice(b"glTF");
    out.extend_from_slice(&2u32.to_le_bytes());
    out.extend_from_slice(&(total as u32).to_le_bytes());
    out.extend_from_slice(&(json.len() as u32).to_le_bytes());
    out.extend_from_slice(b"JSON");
    out.extend_from_slice(&json);
    out.extend_from_slice(&(bin.len() as u32).to_le_bytes());
    out.extend_from_slice(b"BIN\0");
    out.extend_from_slice(&bin);
    out
}

/// Aphrody-style mark: a mountain ridge over a sun, from design tokens (see docs/DESIGN_SYSTEM.md).
pub fn logo_svg() -> String {
    "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 64 64\" width=\"64\" height=\"64\" role=\"img\" aria-label=\"Aphrody play\">\n  <rect width=\"64\" height=\"64\" rx=\"14\" fill=\"#10151c\"/>\n  <circle cx=\"44\" cy=\"22\" r=\"8\" fill=\"#f2a33a\"/>\n  <path d=\"M6 50 L24 22 L33 36 L40 28 L58 50 Z\" fill=\"#3b8f5a\"/>\n  <path d=\"M24 22 L29 30 L24 28 L19 30 Z\" fill=\"#f4f7fa\"/>\n</svg>\n".to_string()
}

/// Center reticle for the third-person view.
pub fn crosshair_svg() -> String {
    "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\" width=\"32\" height=\"32\">\n  <circle cx=\"16\" cy=\"16\" r=\"2\" fill=\"#ffffff\" fill-opacity=\"0.9\"/>\n  <circle cx=\"16\" cy=\"16\" r=\"9\" fill=\"none\" stroke=\"#ffffff\" stroke-opacity=\"0.6\" stroke-width=\"1.5\"/>\n</svg>\n".to_string()
}

/// Files written by `gen-assets`, relative to the output directory.
pub fn all_assets() -> Vec<(&'static str, Vec<u8>)> {
    vec![
        ("models/explorer.glb", build_glb(&explorer_parts())),
        ("ui/logo.svg", logo_svg().into_bytes()),
        ("ui/crosshair.svg", crosshair_svg().into_bytes()),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn glb_is_deterministic_and_well_formed() {
        let a = build_glb(&explorer_parts());
        assert_eq!(a, build_glb(&explorer_parts()));
        assert_eq!(&a[0..4], b"glTF");
        let total = u32::from_le_bytes(a[8..12].try_into().unwrap()) as usize;
        assert_eq!(total, a.len());
        let jlen = u32::from_le_bytes(a[12..16].try_into().unwrap()) as usize;
        assert_eq!(&a[16..20], b"JSON");
        assert_eq!(jlen % 4, 0);
        let json = std::str::from_utf8(&a[20..20 + jlen]).unwrap();
        assert!(json.contains("\"version\":\"2.0\""));
        // Brackets balance (cheap structural check without a JSON dependency).
        let open = json.matches('{').count() + json.matches('[').count();
        let close = json.matches('}').count() + json.matches(']').count();
        assert_eq!(open, close);
    }

    #[test]
    fn svgs_are_xml_roots() {
        assert!(logo_svg().starts_with("<svg"));
        assert!(crosshair_svg().trim_end().ends_with("</svg>"));
    }
}
