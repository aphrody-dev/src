// SPDX-License-Identifier: Apache-2.0
//! Format layer over `storytold/craft-libs`: [`detect`] a format from its leading bytes and read its
//! header with [`probe`] without decoding pixels.

/// A file format this crate recognizes.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Format {
    Svg,
    Webp,
    Exr,
    Psd,
    Tiff,
    Heif,
}

/// What the header of a file says.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Info {
    pub format: Format,
    /// Canvas size in pixels; `None` where the header gives none (SVG, TIFF).
    pub size: Option<(u32, u32)>,
    /// Parts or IFDs; 1 for a single image.
    pub count: usize,
}

/// Why a header could not be read.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Error {
    Unknown,
    Malformed(Format, String),
}

impl core::fmt::Display for Error {
    fn fmt(&self, f: &mut core::fmt::Formatter<'_>) -> core::fmt::Result {
        match self {
            Error::Unknown => f.write_str("unrecognized format"),
            Error::Malformed(format, why) => write!(f, "malformed {format:?}: {why}"),
        }
    }
}

impl std::error::Error for Error {}

/// Format of `bytes` from its magic number, `None` when unknown.
pub fn detect(bytes: &[u8]) -> Option<Format> {
    if bytes.starts_with(b"8BPS") {
        Some(Format::Psd)
    } else if bytes.starts_with(&[0x76, 0x2f, 0x31, 0x01]) {
        Some(Format::Exr)
    } else if craft_webp::is_webp(bytes) {
        Some(Format::Webp)
    } else if craft_tiff::Tiff::sniff(bytes).is_some() {
        Some(Format::Tiff)
    } else if bytes.get(4..8) == Some(b"ftyp") && matches!(bytes.get(8..12), Some(b"heic" | b"heix" | b"mif1" | b"msf1" | b"hevc")) {
        Some(Format::Heif)
    } else if craft_svg::sniff::is_svg(bytes) || craft_svg::sniff::is_svgz(bytes) {
        Some(Format::Svg)
    } else {
        None
    }
}

/// Detects the format and reads its header; pixels are not decoded.
pub fn probe(bytes: &[u8]) -> Result<Info, Error> {
    let format = detect(bytes).ok_or(Error::Unknown)?;
    let bad = |why: String| Error::Malformed(format, why);
    match format {
        Format::Svg => Ok(Info { format, size: None, count: 1 }),
        Format::Webp => {
            let info = craft_webp::scan(bytes, 4096).ok_or_else(|| bad("no canvas".into()))?;
            Ok(Info { format, size: Some((info.width, info.height)), count: info.frames.len().max(1) })
        }
        Format::Exr => {
            let parts = craft_exr::decode::parts(bytes, &craft_exr::decode::Limits::default()).map_err(|e| bad(e.to_string()))?;
            let size = craft_exr::decode::pick_part(&parts).and_then(|i| parts.get(i)).map(|p| window_size(p.display_window));
            Ok(Info { format, size, count: parts.len() })
        }
        Format::Psd => {
            let file = craft_psd::file::PsdFile::from_bytes(bytes).map_err(|e| bad(e.to_string()))?;
            Ok(Info { format, size: Some((file.header.width, file.header.height)), count: 1 })
        }
        Format::Tiff => {
            let tiff = craft_tiff::Tiff::parse(bytes).map_err(|e| bad(e.to_string()))?;
            Ok(Info { format, size: None, count: tiff.ifds.len() })
        }
        Format::Heif => {
            let info = craft_heif::probe(bytes).map_err(|e| bad(format!("{e:?}")))?;
            Ok(Info { format, size: Some((info.width, info.height)), count: 1 })
        }
    }
}

fn window_size(w: craft_exr::decode::Window) -> (u32, u32) {
    (w.width, w.height)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SVG: &[u8] = br#"<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4"/></svg>"#;

    #[test]
    fn detects_by_magic() {
        assert_eq!(detect(SVG), Some(Format::Svg));
        assert_eq!(detect(b"8BPS\0\x01"), Some(Format::Psd));
        assert_eq!(detect(&[0x76, 0x2f, 0x31, 0x01, 2, 0, 0, 0]), Some(Format::Exr));
        assert_eq!(detect(b"RIFF\0\0\0\0WEBPVP8 "), Some(Format::Webp));
        assert_eq!(detect(b"II*\0\x08\0\0\0"), Some(Format::Tiff));
        assert_eq!(detect(b"\0\0\0\x18ftypheic"), Some(Format::Heif));
        assert_eq!(detect(b"plain text"), None);
    }

    #[test]
    fn probes_svg_and_rejects_unknown() {
        assert_eq!(probe(SVG), Ok(Info { format: Format::Svg, size: None, count: 1 }));
        assert_eq!(probe(b"nope"), Err(Error::Unknown));
    }

    #[test]
    fn probes_minimal_tiff() {
        // Little-endian header, IFD at 8 with one entry (ImageWidth = 4) and no next IFD.
        let tiff = [b'I', b'I', 42, 0, 8, 0, 0, 0, 1, 0, 0, 1, 3, 0, 1, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0];
        let info = probe(&tiff).expect("tiff");
        assert_eq!((info.format, info.count), (Format::Tiff, 1));
    }

    #[test]
    fn webp_still_roundtrip_header() {
        // A lossy VP8 frame header (key frame, 16x8) inside a RIFF container built by craft-webp.
        let mut vp8 = vec![0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, 16, 0, 8, 0];
        vp8.extend_from_slice(&[0; 16]);
        let file = craft_webp::still(16, 8, &vp8, &craft_webp::Extras::default()).expect("still");
        let info = probe(&file).expect("probe");
        assert_eq!((info.format, info.size), (Format::Webp, Some((16, 8))));
    }

    #[test]
    fn truncated_headers_are_errors() {
        assert!(matches!(probe(b"8BPS\0\x01"), Err(Error::Malformed(Format::Psd, _))));
    }
}
