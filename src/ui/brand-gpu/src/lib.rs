// SPDX-License-Identifier: Apache-2.0
//! The Aphrody brand tile in 3D: a rounded square slab (radius 12/48 of the side, as in
//! `assets/brand/src/tile.svg`) whose front face carries the tile drawing through its UVs.
//!
//! Two consumers share this geometry, so the glTF and the live renderer never drift:
//! - `ay brand build` (src/ui/kit, `brand::model`) writes it to `gen/model/<id>.glb`;
//! - built for `wasm32-unknown-unknown`, the cdylib exports the mesh and the per-frame matrices to
//!   `assets/brand/web/gpu.ts`, which draws it with WebGPU.
//!
//! Units: the tile spans -0.5..0.5 on x and y, faces +z; glTF conventions (right-handed, y up,
//! counter-clockwise front faces, UV origin top-left). No allocation, no float intrinsics from std:
//! the same code runs in `no_std` wasm and on the host, bit for bit.
#![cfg_attr(target_arch = "wasm32", no_std)]

/// Segments per rounded corner.
pub const CORNER_SEGMENTS: usize = 8;
/// Points on the outline: four corners of `CORNER_SEGMENTS + 1` points.
pub const RIM: usize = 4 * (CORNER_SEGMENTS + 1);
/// Front and back fans (center + rim each) and the side band (two points per rim point).
pub const VERTEX_COUNT: usize = 2 * (RIM + 1) + 2 * RIM;
/// Triangles: `RIM` per fan, `2 * RIM` for the band.
pub const INDEX_COUNT: usize = 3 * 4 * RIM;
/// Floats per vertex: position xyz, normal xyz, uv.
pub const STRIDE: usize = 8;
/// Half side of the tile.
pub const HALF: f32 = 0.5;
/// Corner radius: 12 / 48 of the side.
pub const RADIUS: f32 = 0.25;
/// Slab thickness.
pub const DEPTH: f32 = 0.08;
/// UV sampled by the back and the sides: the container color, left of the glyph.
pub const EDGE_UV: [f32; 2] = [0.04, 0.5];

/// cos(k * 90 / CORNER_SEGMENTS degrees), k = 0..=8; sin is the same table reversed.
const COS: [f32; CORNER_SEGMENTS + 1] = [
    1.0, 0.980_785_3, 0.923_879_5, 0.831_469_6, 0.707_106_8, 0.555_570_2, 0.382_683_43, 0.195_090_32, 0.0,
];

/// Interleaved vertices and triangle indices of the tile.
#[derive(Clone)]
#[repr(C)]
pub struct Mesh {
    pub vertices: [f32; VERTEX_COUNT * STRIDE],
    pub indices: [u16; INDEX_COUNT],
}

impl Default for Mesh {
    fn default() -> Self {
        tile()
    }
}

/// Outline point `i` (counter-clockwise from the right end of the top-right corner) and its
/// outward unit normal.
fn rim(i: usize) -> ([f32; 2], [f32; 2]) {
    let (corner, k) = (i / (CORNER_SEGMENTS + 1), i % (CORNER_SEGMENTS + 1));
    let (c, s) = (COS[k], COS[CORNER_SEGMENTS - k]);
    // Rotate (c, s) by corner * 90 degrees.
    let n = match corner {
        0 => [c, s],
        1 => [-s, c],
        2 => [-c, -s],
        _ => [s, -c],
    };
    let center = HALF - RADIUS;
    let o = match corner {
        0 => [center, center],
        1 => [-center, center],
        2 => [-center, -center],
        _ => [center, -center],
    };
    ([o[0] + RADIUS * n[0], o[1] + RADIUS * n[1]], n)
}

/// Builds the tile mesh.
#[must_use]
pub fn tile() -> Mesh {
    let mut m = Mesh { vertices: [0.0; VERTEX_COUNT * STRIDE], indices: [0; INDEX_COUNT] };
    let z = DEPTH / 2.0;
    let mut put = |v: usize, p: [f32; 3], n: [f32; 3], uv: [f32; 2]| {
        let o = v * STRIDE;
        m.vertices[o..o + 3].copy_from_slice(&p);
        m.vertices[o + 3..o + 6].copy_from_slice(&n);
        m.vertices[o + 6..o + 8].copy_from_slice(&uv);
    };
    let face_uv = |p: [f32; 2]| [p[0] + 0.5, 0.5 - p[1]];
    // Front fan: 0 center, 1..=RIM; back fan: RIM+1 center, RIM+2..; band from 2*(RIM+1).
    let back = RIM + 1;
    let band = 2 * (RIM + 1);
    put(0, [0.0, 0.0, z], [0.0, 0.0, 1.0], [0.5, 0.5]);
    put(back, [0.0, 0.0, -z], [0.0, 0.0, -1.0], EDGE_UV);
    for i in 0..RIM {
        let (p, n) = rim(i);
        put(1 + i, [p[0], p[1], z], [0.0, 0.0, 1.0], face_uv(p));
        put(back + 1 + i, [p[0], p[1], -z], [0.0, 0.0, -1.0], EDGE_UV);
        put(band + 2 * i, [p[0], p[1], z], [n[0], n[1], 0.0], face_uv(p));
        put(band + 2 * i + 1, [p[0], p[1], -z], [n[0], n[1], 0.0], face_uv(p));
    }
    let mut t = 0;
    let mut tri = |a: usize, b: usize, c: usize| {
        m.indices[t] = a as u16;
        m.indices[t + 1] = b as u16;
        m.indices[t + 2] = c as u16;
        t += 3;
    };
    for i in 0..RIM {
        let j = (i + 1) % RIM;
        tri(0, 1 + i, 1 + j);
        tri(back, back + 1 + j, back + 1 + i);
        let (fi, bi, fj, bj) = (band + 2 * i, band + 2 * i + 1, band + 2 * j, band + 2 * j + 1);
        tri(fi, bi, bj);
        tri(fi, bj, fj);
    }
    m
}

/// Axis-aligned bounds of the mesh positions (glTF accessor min/max).
#[must_use]
pub fn bounds() -> ([f32; 3], [f32; 3]) {
    ([-HALF, -HALF, -DEPTH / 2.0], [HALF, HALF, DEPTH / 2.0])
}

const PI: f32 = core::f32::consts::PI;
const TAU: f32 = core::f32::consts::TAU;

fn floor(x: f32) -> f32 {
    let t = x as i32 as f32;
    if t > x { t - 1.0 } else { t }
}

/// sin(x), range-reduced to [-pi/2, pi/2], Taylor to x^11 (error under 1e-6).
#[must_use]
pub fn sin(x: f32) -> f32 {
    let mut x = x - TAU * floor(x / TAU + 0.5);
    if x > PI / 2.0 {
        x = PI - x;
    } else if x < -PI / 2.0 {
        x = -PI - x;
    }
    let x2 = x * x;
    x * (1.0 - x2 / 6.0 * (1.0 - x2 / 20.0 * (1.0 - x2 / 42.0 * (1.0 - x2 / 72.0 * (1.0 - x2 / 110.0)))))
}

#[must_use]
pub fn cos(x: f32) -> f32 {
    sin(x + PI / 2.0)
}

/// Column-major 4x4 product `a * b`.
#[must_use]
pub fn mul(a: &[f32; 16], b: &[f32; 16]) -> [f32; 16] {
    let mut out = [0.0; 16];
    for c in 0..4 {
        for r in 0..4 {
            out[c * 4 + r] = (0..4).map(|k| a[k * 4 + r] * b[c * 4 + k]).sum();
        }
    }
    out
}

/// Matrices of frame `t` (seconds) for a viewport of `aspect` = width / height:
/// `[model-view-projection (16), model (16)]`, column-major, WebGPU clip depth 0..1.
#[must_use]
pub fn frame(t: f32, aspect: f32) -> [f32; 32] {
    let (yaw, pitch) = (0.55 * sin(0.9 * t), 0.22 * sin(0.7 * t + 1.0));
    let (cy, sy, cp, sp) = (cos(yaw), sin(yaw), cos(pitch), sin(pitch));
    let ry = [cy, 0.0, -sy, 0.0, 0.0, 1.0, 0.0, 0.0, sy, 0.0, cy, 0.0, 0.0, 0.0, 0.0, 1.0];
    let rx = [1.0, 0.0, 0.0, 0.0, 0.0, cp, sp, 0.0, 0.0, -sp, cp, 0.0, 0.0, 0.0, 0.0, 1.0];
    let model = mul(&ry, &rx);
    // 35 degree vertical field of view: f = 1 / tan(17.5 degrees).
    let (f, near, far) = (3.171_595_4, 0.1, 10.0);
    let a = if aspect > 0.0 { aspect } else { 1.0 };
    let proj = [
        f / a, 0.0, 0.0, 0.0, 0.0, f, 0.0, 0.0, 0.0, 0.0, far / (near - far), -1.0, 0.0, 0.0, near * far / (near - far), 0.0,
    ];
    let view = [1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, -2.4, 1.0];
    let mvp = mul(&proj, &mul(&view, &model));
    let mut out = [0.0; 32];
    out[..16].copy_from_slice(&mvp);
    out[16..].copy_from_slice(&model);
    out
}

/// wasm ABI for assets/brand/web/gpu.ts: `mesh()` fills the static buffers and returns the vertex
/// pointer; `indices()`, `vertex_count()`, `index_count()`; `frame(t, aspect)` returns a pointer to
/// 32 floats. Single-threaded by construction (wasm32-unknown-unknown without atomics).
#[cfg(target_arch = "wasm32")]
#[allow(unsafe_code)]
mod wasm {
    use super::{INDEX_COUNT, Mesh, STRIDE, VERTEX_COUNT};

    static mut MESH: Mesh = Mesh { vertices: [0.0; VERTEX_COUNT * STRIDE], indices: [0; INDEX_COUNT] };
    static mut FRAME: [f32; 32] = [0.0; 32];

    #[unsafe(no_mangle)]
    pub extern "C" fn mesh() -> *const f32 {
        // SAFETY: single-threaded wasm; the JS side only reads after this call returns.
        unsafe {
            MESH = super::tile();
            (&raw const MESH).cast::<f32>()
        }
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn indices() -> *const u16 {
        // SAFETY: address of a static, no reference is created.
        unsafe { (&raw const MESH.indices).cast::<u16>() }
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn vertex_count() -> u32 {
        VERTEX_COUNT as u32
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn index_count() -> u32 {
        INDEX_COUNT as u32
    }

    #[unsafe(no_mangle)]
    pub extern "C" fn frame(t: f32, aspect: f32) -> *const f32 {
        // SAFETY: single-threaded wasm, written then read by the caller before the next call.
        unsafe {
            FRAME = super::frame(t, aspect);
            (&raw const FRAME).cast::<f32>()
        }
    }

    #[panic_handler]
    fn panic(_: &core::panic::PanicInfo<'_>) -> ! {
        core::arch::wasm32::unreachable()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mesh_is_closed_and_in_bounds() {
        let m = tile();
        assert!(m.indices.iter().all(|&i| usize::from(i) < VERTEX_COUNT));
        let (lo, hi) = bounds();
        for v in m.vertices.chunks(STRIDE) {
            for k in 0..3 {
                assert!(v[k] >= lo[k] - 1e-6 && v[k] <= hi[k] + 1e-6);
            }
            let n = v[3] * v[3] + v[4] * v[4] + v[5] * v[5];
            assert!((n - 1.0).abs() < 1e-5);
            assert!((0.0..=1.0).contains(&v[6]) && (0.0..=1.0).contains(&v[7]));
        }
        // Every edge is shared by exactly two triangles within each part (closed fans and band).
        assert_eq!(m.indices.len(), INDEX_COUNT);
    }

    #[test]
    fn front_faces_point_out() {
        let m = tile();
        let p = |i: u16| {
            let o = usize::from(i) * STRIDE;
            [m.vertices[o], m.vertices[o + 1], m.vertices[o + 2], m.vertices[o + 3], m.vertices[o + 4], m.vertices[o + 5]]
        };
        for t in m.indices.chunks(3) {
            let (a, b, c) = (p(t[0]), p(t[1]), p(t[2]));
            let (u, v) = ([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [c[0] - a[0], c[1] - a[1], c[2] - a[2]]);
            let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
            let avg = [a[3] + b[3] + c[3], a[4] + b[4] + c[4], a[5] + b[5] + c[5]];
            assert!(n[0] * avg[0] + n[1] * avg[1] + n[2] * avg[2] > 0.0, "inward triangle {t:?}");
        }
    }

    #[test]
    fn trig_matches_std() {
        for i in -400..400 {
            let x = i as f32 * 0.05;
            assert!((sin(x) - x.sin()).abs() < 2e-6, "sin {x}");
            assert!((cos(x) - x.cos()).abs() < 2e-6, "cos {x}");
        }
    }

    #[test]
    fn frame_keeps_tile_in_view() {
        let f = frame(1.3, 16.0 / 9.0);
        for (x, y) in [(-0.5f32, -0.5f32), (0.5, 0.5)] {
            let m = &f[..16];
            let cx = m[0] * x + m[4] * y + m[12];
            let cw = m[3] * x + m[7] * y + m[15];
            let cz = m[2] * x + m[6] * y + m[14];
            assert!(cw > 0.0 && (cx / cw).abs() < 1.0 && (0.0..1.0).contains(&(cz / cw)));
        }
    }
}
