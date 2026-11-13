//! Procedural audio: every sound is computed from formulas, no sample files. Output is 16-bit
//! mono PCM WAV bytes that Bevy decodes like any other audio asset.

pub const SAMPLE_RATE: u32 = 22_050;

/// Small deterministic PRNG (xorshift32) so the sounds are identical on every run.
struct Rng(u32);

impl Rng {
    fn next(&mut self) -> f32 {
        self.0 ^= self.0 << 13;
        self.0 ^= self.0 >> 17;
        self.0 ^= self.0 << 5;
        (self.0 as f32 / u32::MAX as f32) * 2.0 - 1.0
    }
}

/// Encode samples in `[-1, 1]` as a RIFF/WAVE file (PCM, mono, 16 bit).
pub fn wav_bytes(samples: &[f32]) -> Vec<u8> {
    let data_len = (samples.len() * 2) as u32;
    let mut out = Vec::with_capacity(44 + samples.len() * 2);
    out.extend_from_slice(b"RIFF");
    out.extend_from_slice(&(36 + data_len).to_le_bytes());
    out.extend_from_slice(b"WAVEfmt ");
    out.extend_from_slice(&16u32.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes()); // PCM
    out.extend_from_slice(&1u16.to_le_bytes()); // mono
    out.extend_from_slice(&SAMPLE_RATE.to_le_bytes());
    out.extend_from_slice(&(SAMPLE_RATE * 2).to_le_bytes());
    out.extend_from_slice(&2u16.to_le_bytes());
    out.extend_from_slice(&16u16.to_le_bytes());
    out.extend_from_slice(b"data");
    out.extend_from_slice(&data_len.to_le_bytes());
    for s in samples {
        out.extend_from_slice(&((s.clamp(-1.0, 1.0) * 32767.0) as i16).to_le_bytes());
    }
    out
}

/// Seamless wind loop: low-passed noise filtered circularly, slowly modulated by integer-cycle
/// sines so the last sample flows into the first.
pub fn wind_loop(seconds: f32) -> Vec<f32> {
    let n = (seconds * SAMPLE_RATE as f32) as usize;
    let mut rng = Rng(0x1234_5678);
    let noise: Vec<f32> = (0..n).map(|_| rng.next()).collect();
    let mut out = vec![0.0f32; n];
    let a = 0.04;
    // Two passes over the ring: the second pass starts with the state left by the first.
    let mut y = 0.0;
    for pass in 0..2 {
        for i in 0..n {
            y += a * (noise[i] - y);
            if pass == 1 {
                out[i] = y;
            }
        }
    }
    for (i, s) in out.iter_mut().enumerate() {
        let t = i as f32 / n as f32;
        let gust = 0.65
            + 0.35 * (std::f32::consts::TAU * t * 3.0).sin()
            + 0.15 * (std::f32::consts::TAU * t * 7.0).sin();
        *s *= gust * 4.5;
    }
    out
}

/// Footstep on grass: a short noise burst with a fast exponential decay and a soft thump.
pub fn footstep() -> Vec<f32> {
    let n = (0.14 * SAMPLE_RATE as f32) as usize;
    let mut rng = Rng(0xBEEF_0001);
    let mut y = 0.0;
    (0..n)
        .map(|i| {
            let t = i as f32 / SAMPLE_RATE as f32;
            y += 0.35 * (rng.next() - y);
            let thump = (std::f32::consts::TAU * 70.0 * t).sin() * (-t * 38.0).exp();
            (y * (-t * 30.0).exp() * 1.6 + thump * 0.6) * 0.8
        })
        .collect()
}

/// Calm ambient pad: a detuned minor-seventh chord, looping on whole cycles of every partial.
pub fn pad_loop(seconds: f32) -> Vec<f32> {
    let n = (seconds * SAMPLE_RATE as f32) as usize;
    // Frequencies snapped to whole cycles over `seconds` so the loop has no click.
    let notes = [110.0f32, 130.81, 164.81, 196.0];
    let snapped: Vec<f32> = notes
        .iter()
        .map(|f| (f * seconds).round() / seconds)
        .collect();
    (0..n)
        .map(|i| {
            let t = i as f32 / SAMPLE_RATE as f32;
            let phase = i as f32 / n as f32;
            let swell = 0.6 + 0.4 * (std::f32::consts::TAU * phase * 2.0).sin();
            let sum: f32 = snapped
                .iter()
                .enumerate()
                .map(|(k, f)| {
                    (std::f32::consts::TAU * f * t).sin()
                        * (0.5 + 0.5 * (std::f32::consts::TAU * phase * (k as f32 + 1.0)).sin())
                })
                .sum();
            sum * swell * 0.12
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn wav_header_is_valid() {
        let w = wav_bytes(&[0.0, 0.5, -0.5]);
        assert_eq!(&w[0..4], b"RIFF");
        assert_eq!(&w[8..12], b"WAVE");
        assert_eq!(w.len(), 44 + 6);
        assert_eq!(u32::from_le_bytes(w[40..44].try_into().unwrap()), 6);
    }

    #[test]
    fn sounds_are_deterministic_and_bounded() {
        assert_eq!(footstep(), footstep());
        for s in wind_loop(2.0).iter().chain(pad_loop(2.0).iter()) {
            assert!(s.abs() <= 1.0, "sample out of range: {s}");
        }
    }

    #[test]
    fn pad_loops_without_a_jump() {
        let p = pad_loop(4.0);
        let step = (p[1] - p[0]).abs().max((p[p.len() - 1] - p[0]).abs());
        assert!(step < 0.05);
    }
}
