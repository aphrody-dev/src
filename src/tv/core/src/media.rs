use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::Rational;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum MediaKind {
    Video,
    Audio,
    Subtitle,
    Data,
    Attachment,
    Unknown,
}

/// Définition déduite des pixels réels, jamais du libellé commercial.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Definition {
    Sd,
    Hd,
    FullHd,
    Uhd4k,
    Uhd8k,
}

impl Definition {
    /// Classe sur la plus grande dimension (gère formats cinéma et verticaux).
    pub const fn from_size(width: u32, height: u32) -> Self {
        let long = if width > height { width } else { height };
        if long >= 7680 {
            Self::Uhd8k
        } else if long >= 3840 {
            Self::Uhd4k
        } else if long >= 1920 {
            Self::FullHd
        } else if long >= 1280 {
            Self::Hd
        } else {
            Self::Sd
        }
    }
}

/// Description d'un flux élémentaire.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct StreamInfo {
    pub index: usize,
    pub kind: MediaKind,
    /// Nom du codec tel que FFmpeg le nomme (`av1`, `hevc`, `opus`…).
    pub codec: String,
    pub profile: Option<String>,
    pub time_base: Rational,
    pub duration: Option<Duration>,
    pub bit_rate: Option<u64>,
    pub language: Option<String>,
    // Vidéo
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub frame_rate: Option<Rational>,
    pub pixel_format: Option<String>,
    pub color_transfer: Option<String>,
    pub color_primaries: Option<String>,
    // Audio
    pub sample_rate: Option<u32>,
    pub channels: Option<u16>,
    pub sample_format: Option<String>,
}

impl StreamInfo {
    pub fn new(
        index: usize,
        kind: MediaKind,
        codec: impl Into<String>,
        time_base: Rational,
    ) -> Self {
        Self {
            index,
            kind,
            codec: codec.into(),
            profile: None,
            time_base,
            duration: None,
            bit_rate: None,
            language: None,
            width: None,
            height: None,
            frame_rate: None,
            pixel_format: None,
            color_transfer: None,
            color_primaries: None,
            sample_rate: None,
            channels: None,
            sample_format: None,
        }
    }

    pub fn definition(&self) -> Option<Definition> {
        Some(Definition::from_size(self.width?, self.height?))
    }

    /// HDR si la fonction de transfert est PQ (SMPTE 2084) ou HLG (ARIB STD-B67).
    pub fn is_hdr(&self) -> bool {
        matches!(
            self.color_transfer.as_deref(),
            Some("smpte2084" | "arib-std-b67")
        )
    }
}

/// Description d'un média complet (fichier ou flux réseau).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct MediaInfo {
    pub source: String,
    /// Nom(s) du format conteneur (`mov,mp4,m4a,3gp,3g2,mj2`, `mpegts`…).
    pub format: String,
    pub duration: Option<Duration>,
    pub bit_rate: Option<u64>,
    pub streams: Vec<StreamInfo>,
}

impl MediaInfo {
    pub fn best(&self, kind: MediaKind) -> Option<&StreamInfo> {
        self.streams
            .iter()
            .filter(|s| s.kind == kind)
            .max_by_key(|s| {
                (
                    s.width.unwrap_or(0) as u64 * s.height.unwrap_or(0) as u64,
                    s.bit_rate.unwrap_or(0),
                )
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn definition_reelle() {
        assert_eq!(Definition::from_size(3840, 2160), Definition::Uhd4k);
        assert_eq!(Definition::from_size(1920, 1080), Definition::FullHd);
        assert_eq!(Definition::from_size(1080, 1920), Definition::FullHd);
        assert_eq!(Definition::from_size(720, 576), Definition::Sd);
    }

    #[test]
    fn meilleur_flux_et_hdr() {
        let tb = Rational::new(1, 90_000);
        let mut a = StreamInfo::new(0, MediaKind::Video, "hevc", tb);
        (a.width, a.height) = (Some(1920), Some(1080));
        let mut b = StreamInfo::new(1, MediaKind::Video, "av1", tb);
        (b.width, b.height, b.color_transfer) = (Some(3840), Some(2160), Some("smpte2084".into()));
        let m = MediaInfo {
            source: "x".into(),
            format: "mpegts".into(),
            duration: None,
            bit_rate: None,
            streams: vec![a, b],
        };
        let best = m.best(MediaKind::Video).unwrap();
        assert_eq!(best.codec, "av1");
        assert!(best.is_hdr());
        assert_eq!(best.definition(), Some(Definition::Uhd4k));
        assert!(m.best(MediaKind::Audio).is_none());
        assert!(
            serde_json::to_string(&m)
                .unwrap()
                .contains("\"kind\":\"video\"")
        );
    }
}
