use std::fmt;
use std::time::Duration;

use serde::{Deserialize, Serialize};

/// Nombre rationnel exact (base de temps, fréquence d'images, rapport d'aspect).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct Rational {
    pub num: i64,
    pub den: i64,
}

impl Rational {
    pub const fn new(num: i64, den: i64) -> Self {
        Self { num, den }
    }

    pub fn is_valid(self) -> bool {
        self.den != 0
    }

    pub fn as_f64(self) -> Option<f64> {
        self.is_valid().then(|| self.num as f64 / self.den as f64)
    }

    /// Forme réduite, dénominateur positif.
    pub fn reduced(self) -> Self {
        if self.den == 0 {
            return self;
        }
        let g = gcd(self.num.unsigned_abs(), self.den.unsigned_abs()).max(1) as i64;
        let sign = if self.den < 0 { -1 } else { 1 };
        Self::new(sign * self.num / g, sign * self.den / g)
    }
}

const fn gcd(mut a: u64, mut b: u64) -> u64 {
    while b != 0 {
        let t = a % b;
        a = b;
        b = t;
    }
    a
}

impl fmt::Display for Rational {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}/{}", self.num, self.den)
    }
}

/// Horodatage exprimé dans une base de temps.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Timestamp {
    pub value: i64,
    pub time_base: Rational,
}

impl Timestamp {
    pub const fn new(value: i64, time_base: Rational) -> Self {
        Self { value, time_base }
    }

    /// Conversion en durée, sans perte jusqu'à la nanoseconde ; `None` si négatif ou base invalide.
    pub fn to_duration(self) -> Option<Duration> {
        let Rational { num, den } = self.time_base;
        if den <= 0 || num < 0 || self.value < 0 {
            return None;
        }
        let nanos = i128::from(self.value) * i128::from(num) * 1_000_000_000 / i128::from(den);
        u64::try_from(nanos).ok().map(Duration::from_nanos)
    }

    /// Rééchelonne vers une autre base de temps (arrondi au plus proche, comme `av_rescale_q`).
    pub fn rescale(self, to: Rational) -> Option<Self> {
        let (a, b) = (self.time_base, to);
        if a.den == 0 || b.num == 0 {
            return None;
        }
        let n = i128::from(self.value) * i128::from(a.num) * i128::from(b.den);
        let d = i128::from(a.den) * i128::from(b.num);
        let half = d.abs() / 2;
        let v = if (n >= 0) == (d > 0) {
            (n + half * d.signum()) / d
        } else {
            (n - half * d.signum()) / d
        };
        i64::try_from(v).ok().map(|value| Self::new(value, to))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reduction() {
        assert_eq!(Rational::new(240, 2).reduced(), Rational::new(120, 1));
        assert_eq!(
            Rational::new(60000, -1001).reduced(),
            Rational::new(-60000, 1001)
        );
        assert!((Rational::new(120000, 1001).as_f64().unwrap() - 119.88).abs() < 0.01);
        assert_eq!(Rational::new(1, 0).as_f64(), None);
    }

    #[test]
    fn temps() {
        let ts = Timestamp::new(90_000, Rational::new(1, 90_000));
        assert_eq!(ts.to_duration(), Some(Duration::from_secs(1)));
        let ms = ts.rescale(Rational::new(1, 1000)).unwrap();
        assert_eq!(ms.value, 1000);
        let back = Timestamp::new(1, Rational::new(1, 3))
            .rescale(Rational::new(1, 1000))
            .unwrap();
        assert_eq!(back.value, 333);
        assert_eq!(Timestamp::new(-1, Rational::new(1, 1)).to_duration(), None);
    }
}
