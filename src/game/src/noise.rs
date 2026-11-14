//! Deterministic 2D gradient-free value noise and fractal terrain height. Pure functions, no
//! engine types: the same seed always produces the same world, natively and in WebAssembly.

/// Integer hash to `[0, 1)`; lattice values of the noise.
fn hash(seed: u32, x: i32, y: i32) -> f32 {
    let mut h = seed
        .wrapping_add((x as u32).wrapping_mul(0x9E37_79B1))
        .wrapping_add((y as u32).wrapping_mul(0x85EB_CA77));
    h ^= h >> 15;
    h = h.wrapping_mul(0x2C1B_3C6D);
    h ^= h >> 12;
    h = h.wrapping_mul(0x297A_2D39);
    h ^= h >> 15;
    (h >> 8) as f32 / (1u32 << 24) as f32
}

fn smooth(t: f32) -> f32 {
    t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
}

/// Value noise in `[0, 1)`.
pub fn value(seed: u32, x: f32, y: f32) -> f32 {
    let (x0, y0) = (x.floor(), y.floor());
    let (fx, fy) = (smooth(x - x0), smooth(y - y0));
    let (xi, yi) = (x0 as i32, y0 as i32);
    let a = hash(seed, xi, yi);
    let b = hash(seed, xi + 1, yi);
    let c = hash(seed, xi, yi + 1);
    let d = hash(seed, xi + 1, yi + 1);
    let top = a + (b - a) * fx;
    let bottom = c + (d - c) * fx;
    top + (bottom - top) * fy
}

/// Fractal Brownian motion in `[0, 1)`.
pub fn fbm(seed: u32, x: f32, y: f32, octaves: u32) -> f32 {
    let (mut amp, mut freq, mut sum, mut norm) = (0.5, 1.0, 0.0, 0.0);
    for i in 0..octaves {
        sum += amp * value(seed.wrapping_add(i * 101), x * freq, y * freq);
        norm += amp;
        amp *= 0.5;
        freq *= 2.0;
    }
    sum / norm
}

/// Terrain height in world units at `(x, z)`: rolling hills with ridged mountains.
pub fn height(seed: u32, x: f32, z: f32) -> f32 {
    let base = fbm(seed, x * 0.004, z * 0.004, 5);
    let ridge = 1.0 - (fbm(seed ^ 0xA5A5, x * 0.0025, z * 0.0025, 4) * 2.0 - 1.0).abs();
    let mountains = ridge.powi(3) * 90.0;
    base * 38.0 - 14.0 + mountains
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn deterministic() {
        assert_eq!(height(7, 12.5, -80.25), height(7, 12.5, -80.25));
        assert_ne!(height(7, 12.5, -80.25), height(8, 12.5, -80.25));
    }

    #[test]
    fn value_in_unit_range() {
        for i in -50..50 {
            let v = value(3, i as f32 * 0.37, i as f32 * -0.91);
            assert!((0.0..1.0).contains(&v));
        }
    }

    #[test]
    fn continuous() {
        let a = height(1, 100.0, 100.0);
        let b = height(1, 100.01, 100.0);
        assert!((a - b).abs() < 0.2);
    }
}
