//! Chunk geometry as plain vectors (no engine types), so it is unit-testable and the same code
//! runs natively and in WebAssembly.

use crate::noise;

/// World units per chunk side.
pub const CHUNK_SIZE: f32 = 32.0;
/// Quads per chunk side (vertices per side = `CHUNK_RES + 1`).
pub const CHUNK_RES: usize = 32;

pub struct ChunkData {
    pub positions: Vec<[f32; 3]>,
    pub normals: Vec<[f32; 3]>,
    pub colors: Vec<[f32; 4]>,
    pub indices: Vec<u32>,
}

/// Height-banded vertex color: sand, grass, rock, snow.
pub fn biome_color(h: f32, slope: f32) -> [f32; 4] {
    let sand = [0.76, 0.70, 0.50, 1.0];
    let grass = [0.23, 0.48, 0.20, 1.0];
    let rock = [0.42, 0.40, 0.38, 1.0];
    let snow = [0.94, 0.96, 0.98, 1.0];
    let lerp = |a: [f32; 4], b: [f32; 4], t: f32| {
        let t = t.clamp(0.0, 1.0);
        [
            a[0] + (b[0] - a[0]) * t,
            a[1] + (b[1] - a[1]) * t,
            a[2] + (b[2] - a[2]) * t,
            1.0,
        ]
    };
    let base = if h < -9.0 {
        sand
    } else if h < 30.0 {
        lerp(grass, rock, (h - 18.0) / 12.0)
    } else {
        lerp(rock, snow, (h - 46.0) / 12.0)
    };
    lerp(base, rock, (slope - 0.45) * 3.0)
}

/// Normal from central differences of the analytic height: continuous across chunk borders.
pub fn normal_at(seed: u32, x: f32, z: f32) -> [f32; 3] {
    let e = CHUNK_SIZE / CHUNK_RES as f32;
    let dx = noise::height(seed, x + e, z) - noise::height(seed, x - e, z);
    let dz = noise::height(seed, x, z + e) - noise::height(seed, x, z - e);
    let n = [-dx, 2.0 * e, -dz];
    let len = (n[0] * n[0] + n[1] * n[1] + n[2] * n[2]).sqrt();
    [n[0] / len, n[1] / len, n[2] / len]
}

/// Geometry of chunk `(cx, cz)`, vertices in world space.
pub fn build_chunk(seed: u32, cx: i32, cz: i32) -> ChunkData {
    let n = CHUNK_RES + 1;
    let step = CHUNK_SIZE / CHUNK_RES as f32;
    let (ox, oz) = (cx as f32 * CHUNK_SIZE, cz as f32 * CHUNK_SIZE);
    let mut positions = Vec::with_capacity(n * n);
    let mut normals = Vec::with_capacity(n * n);
    let mut colors = Vec::with_capacity(n * n);
    for j in 0..n {
        for i in 0..n {
            let (x, z) = (ox + i as f32 * step, oz + j as f32 * step);
            let h = noise::height(seed, x, z);
            let nrm = normal_at(seed, x, z);
            positions.push([x, h, z]);
            normals.push(nrm);
            colors.push(biome_color(h, 1.0 - nrm[1]));
        }
    }
    let mut indices = Vec::with_capacity(CHUNK_RES * CHUNK_RES * 6);
    for j in 0..CHUNK_RES {
        for i in 0..CHUNK_RES {
            let a = (j * n + i) as u32;
            let b = a + 1;
            let c = a + n as u32;
            let d = c + 1;
            indices.extend_from_slice(&[a, c, b, b, c, d]);
        }
    }
    ChunkData {
        positions,
        normals,
        colors,
        indices,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chunk_shape() {
        let c = build_chunk(1, 0, 0);
        let n = CHUNK_RES + 1;
        assert_eq!(c.positions.len(), n * n);
        assert_eq!(c.indices.len(), CHUNK_RES * CHUNK_RES * 6);
        assert!(c.indices.iter().all(|&i| (i as usize) < c.positions.len()));
    }

    #[test]
    fn neighbours_share_border_vertices() {
        let a = build_chunk(5, 0, 0);
        let b = build_chunk(5, 1, 0);
        let n = CHUNK_RES + 1;
        for j in 0..n {
            assert_eq!(a.positions[j * n + CHUNK_RES], b.positions[j * n]);
            assert_eq!(a.normals[j * n + CHUNK_RES], b.normals[j * n]);
        }
    }

    #[test]
    fn upward_normals() {
        let c = build_chunk(2, 3, -4);
        assert!(c.normals.iter().all(|n| n[1] > 0.0));
    }
}
