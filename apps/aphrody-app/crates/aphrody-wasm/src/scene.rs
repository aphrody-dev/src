//! Platform-independent scene packing for the WGSL uniform block. Layout must
//! match `Uniforms` in `shaders/mica.wgsl` (std140-compatible, 16-byte aligned).

use aphrody_core::wm::Placed;

pub const MAX_WINDOWS: usize = 32;
/// 2 vec4 header + 32 rect vec4 + 32 meta vec4 = 66 vec4 = 1056 bytes.
pub const UNIFORM_FLOATS: usize = 4 * (2 + 2 * MAX_WINDOWS);
pub const UNIFORM_BYTES: usize = UNIFORM_FLOATS * 4;

pub fn pack_uniforms(res: (f32, f32), time: f32, dpr: f32, hover: Option<usize>, placed: &[Placed]) -> Vec<f32> {
    let mut f = vec![0.0f32; UNIFORM_FLOATS];
    let n = placed.len().min(MAX_WINDOWS);
    f[0..4].copy_from_slice(&[res.0, res.1, time, n as f32]);
    f[4..8].copy_from_slice(&[dpr, hover.map_or(-1.0, |h| h as f32), 0.0, 0.0]);
    for (i, p) in placed.iter().take(n).enumerate() {
        let r = 8 + i * 4;
        f[r..r + 4].copy_from_slice(&[p.rect.x, p.rect.y, p.rect.w, p.rect.h]);
        let m = 8 + MAX_WINDOWS * 4 + i * 4;
        f[m..m + 4].copy_from_slice(&[if p.focused { 1.0 } else { 0.0 }, (p.id % 7) as f32 / 7.0, 0.0, 0.0]);
    }
    f
}

pub fn to_bytes(f: &[f32]) -> Vec<u8> {
    f.iter().flat_map(|v| v.to_le_bytes()).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use aphrody_core::layout::Rect;
    use aphrody_core::wm::WindowManager;

    #[test]
    fn packs_to_wgsl_layout() {
        assert_eq!(UNIFORM_BYTES, 1056);
        assert_eq!(UNIFORM_BYTES % 16, 0);
        let mut wm = WindowManager::new(Rect::new(0.0, 0.0, 800.0, 600.0), 1);
        wm.add_window("a", "x");
        wm.add_window("b", "x");
        let p = wm.arrange();
        let f = pack_uniforms((800.0, 600.0), 1.5, 2.0, Some(1), &p);
        assert_eq!(&f[0..4], &[800.0, 600.0, 1.5, 2.0]);
        assert_eq!(f[5], 1.0);
        assert_eq!(&f[8..12], &[p[0].rect.x, p[0].rect.y, p[0].rect.w, p[0].rect.h]);
        let meta1 = 8 + MAX_WINDOWS * 4 + 4;
        assert_eq!(f[meta1], 1.0, "second window is focused");
        assert_eq!(to_bytes(&f).len(), UNIFORM_BYTES);
    }

    #[test]
    fn shader_declares_matching_array_sizes() {
        let src = include_str!("../shaders/mica.wgsl");
        assert_eq!(src.matches("array<vec4<f32>, 32>").count(), 2);
        assert!(src.contains("@vertex") && src.contains("@fragment"));
    }
}
