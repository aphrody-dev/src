//! Changement de conteneur sans réencodage (copie des paquets).

use std::path::Path;

use crate::{backend, ff, init};
use tv_core::{Error, Result};

/// Résultat d'un remux.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RemuxReport {
    /// Format conteneur de sortie choisi par FFmpeg (d'après l'extension ou `format`).
    pub format: String,
    pub streams: usize,
    pub packets: u64,
}

/// Copie tous les flux de `input` vers `output`. `format` force le conteneur (`mp4`, `mpegts`, `matroska`…).
///
/// Les flux que le conteneur cible refuse (ex. sous-titres ASS dans du MPEG-TS) sont écartés.
pub fn remux(input: &str, output: &Path, format: Option<&str>) -> Result<RemuxReport> {
    init()?;
    let mut ictx = ff::format::input(input).map_err(backend)?;
    let mut octx = match format {
        Some(f) => ff::format::output_as(output, f),
        None => ff::format::output(output),
    }
    .map_err(backend)?;

    // Correspondance index d'entrée -> index de sortie ; `None` = flux écarté.
    let mut map = vec![None; ictx.nb_streams() as usize];
    let ofmt = octx.format();
    let mut next = 0usize;
    for ist in ictx.streams() {
        let id = ist.parameters().id();
        let medium = ist.parameters().medium();
        let keep = matches!(
            medium,
            ff::media::Type::Video | ff::media::Type::Audio | ff::media::Type::Subtitle
        ) && query_codec(&ofmt, id);
        if !keep {
            continue;
        }
        let mut ost = octx.add_stream(ff::encoder::find(ff::codec::Id::None)).map_err(backend)?;
        ost.set_parameters(ist.parameters());
        // SAFETY : `codecpar` est alloué par libavformat pour ce flux ; mettre le tag à 0 laisse
        // le multiplexeur choisir le tag propre au conteneur cible.
        unsafe { (*(*ost.as_mut_ptr()).codecpar).codec_tag = 0 };
        ost.set_metadata(ist.metadata().to_owned());
        map[ist.index()] = Some(next);
        next += 1;
    }
    if next == 0 {
        return Err(Error::Unsupported(format!(
            "aucun flux de {input} n'est accepté par le conteneur {}",
            ofmt.name()
        )));
    }
    octx.set_metadata(ictx.metadata().to_owned());
    octx.write_header().map_err(backend)?;

    let mut packets = 0u64;
    for (ist, mut packet) in ictx.packets() {
        let Some(oidx) = map[ist.index()] else { continue };
        let otb = octx.stream(oidx).expect("flux de sortie créé").time_base();
        packet.rescale_ts(ist.time_base(), otb);
        packet.set_position(-1);
        packet.set_stream(oidx);
        packet.write_interleaved(&mut octx).map_err(backend)?;
        packets += 1;
    }
    octx.write_trailer().map_err(backend)?;

    Ok(RemuxReport { format: octx.format().name().to_owned(), streams: next, packets })
}

/// Vrai si le conteneur accepte ce codec (`avformat_query_codec`, mode normal).
fn query_codec(fmt: &ff::format::Output, id: ff::codec::Id) -> bool {
    // SAFETY : `fmt.as_ptr()` pointe vers un AVOutputFormat statique de libavformat.
    unsafe { ff::ffi::avformat_query_codec(fmt.as_ptr(), id.into(), ff::ffi::FF_COMPLIANCE_NORMAL) == 1 }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{probe, tests::sample};
    use tv_core::MediaKind;

    #[test]
    fn aller_retour_mkv_mp4_ts() {
        let Some(src) = sample(
            "tv-remux-src.mkv",
            &[
                "-f", "lavfi", "-i", "testsrc2=s=1280x720:r=30:d=2",
                "-f", "lavfi", "-i", "sine=f=1000:r=48000:d=2",
                "-c:v", "libx264", "-preset", "ultrafast", "-c:a", "aac",
            ],
        ) else {
            return;
        };
        let tmp = std::env::temp_dir();
        let src_info = probe(&src).unwrap();

        for (name, fmt, expected) in [
            ("tv-remux.mp4", None, "mov,mp4,m4a,3gp,3g2,mj2"),
            ("tv-remux.ts", Some("mpegts"), "mpegts"),
            ("tv-remux-back.mkv", None, "matroska,webm"),
        ] {
            let out = tmp.join(name);
            let r = remux(&src, &out, fmt).unwrap_or_else(|e| panic!("{name} : {e}"));
            assert_eq!(r.streams, 2, "{name}");
            assert!(r.packets > 100, "{name} : {} paquets", r.packets);
            let info = probe(out.to_str().unwrap()).unwrap();
            assert_eq!(info.format, expected);
            let (v, a) = (info.best(MediaKind::Video).unwrap(), info.best(MediaKind::Audio).unwrap());
            assert_eq!((v.codec.as_str(), v.width, v.height), ("h264", Some(1280), Some(720)));
            assert_eq!(a.codec, "aac");
            let d = info.duration.unwrap().as_secs_f64();
            let d0 = src_info.duration.unwrap().as_secs_f64();
            assert!((d - d0).abs() < 0.15, "{name} : durée {d} vs {d0}");
        }
    }

    #[test]
    fn flux_refuses_ecartes() {
        let Some(src) = sample(
            "tv-remux-opus.mkv",
            &["-f", "lavfi", "-i", "sine=d=1", "-c:a", "libopus"],
        ) else {
            return;
        };
        // Le conteneur GIF n'accepte aucun flux audio.
        let err = remux(&src, &std::env::temp_dir().join("tv-remux.gif"), None).unwrap_err();
        assert!(matches!(err, Error::Unsupported(_)), "{err}");
    }
}
