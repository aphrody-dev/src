//! Frontière FFmpeg : seul crate du monorepo qui parle à libav*.

use std::ffi::CStr;
use std::path::Path;
use std::sync::Once;
use std::time::Duration;

use ff::ffi;
pub use ffmpeg_next as ff;
use tv_core::{Error, MediaInfo, MediaKind, Rational, Result, StreamInfo};

mod remux;
pub use remux::{RemuxReport, remux};

static INIT: Once = Once::new();

/// Initialise libav* une seule fois (réseau inclus pour HLS, RTSP, HTTP).
pub fn init() -> Result<()> {
    let mut res = Ok(());
    INIT.call_once(|| {
        res = ff::init().map_err(backend);
        ff::format::network::init();
        ff::log::set_level(ff::log::Level::Error);
    });
    res
}

/// Version de libavcodec chargée à l'exécution, ex. `62.11.100`.
pub fn libavcodec_version() -> String {
    let v = unsafe { ffi::avcodec_version() };
    format!("{}.{}.{}", v >> 16, (v >> 8) & 0xff, v & 0xff)
}

fn backend(e: ff::Error) -> Error {
    Error::Backend {
        backend: "ffmpeg",
        message: e.to_string(),
    }
}

fn rational(r: ff::Rational) -> Rational {
    Rational::new(i64::from(r.numerator()), i64::from(r.denominator()))
}

fn cstr(p: *const std::ffi::c_char) -> Option<String> {
    (!p.is_null()).then(|| unsafe { CStr::from_ptr(p) }.to_string_lossy().into_owned())
}

fn micros(v: i64) -> Option<Duration> {
    (v > 0).then(|| Duration::from_micros(v as u64))
}

/// Analyse un fichier local ou une URL (HTTP, HLS, RTSP…) et décrit ses flux.
pub fn probe(source: &str) -> Result<MediaInfo> {
    init()?;
    if !source.contains("://") && !Path::new(source).exists() {
        return Err(Error::Invalid(format!("source introuvable : {source}")));
    }
    let ictx = ff::format::input(source).map_err(backend)?;
    let fmt = unsafe { &*ictx.as_ptr() };

    let streams = ictx
        .streams()
        .map(|st| {
            let par = unsafe { &*(*st.as_ptr()).codecpar };
            let kind = match par.codec_type {
                ffi::AVMediaType::AVMEDIA_TYPE_VIDEO => MediaKind::Video,
                ffi::AVMediaType::AVMEDIA_TYPE_AUDIO => MediaKind::Audio,
                ffi::AVMediaType::AVMEDIA_TYPE_SUBTITLE => MediaKind::Subtitle,
                ffi::AVMediaType::AVMEDIA_TYPE_DATA => MediaKind::Data,
                ffi::AVMediaType::AVMEDIA_TYPE_ATTACHMENT => MediaKind::Attachment,
                _ => MediaKind::Unknown,
            };
            let codec = cstr(unsafe { ffi::avcodec_get_name(par.codec_id) }).unwrap_or_default();
            let tb = rational(st.time_base());
            let mut s = StreamInfo::new(st.index(), kind, codec, tb);
            s.profile = cstr(unsafe { ffi::avcodec_profile_name(par.codec_id, par.profile) });
            s.bit_rate = (par.bit_rate > 0).then_some(par.bit_rate as u64);
            s.duration = tv_core::Timestamp::new(st.duration(), tb)
                .to_duration()
                .filter(|d| !d.is_zero());
            s.language = st.metadata().get("language").map(str::to_owned);
            match kind {
                MediaKind::Video => {
                    s.width = (par.width > 0).then_some(par.width as u32);
                    s.height = (par.height > 0).then_some(par.height as u32);
                    let fr = rational(st.avg_frame_rate());
                    s.frame_rate = fr.is_valid().then(|| fr.reduced());
                    // SAFETY : pour un flux vidéo, `format` contient une valeur d'AVPixelFormat (contrat libavcodec).
                    s.pixel_format = cstr(unsafe {
                        ffi::av_get_pix_fmt_name(std::mem::transmute::<i32, ffi::AVPixelFormat>(
                            par.format,
                        ))
                    });
                    s.color_transfer = cstr(unsafe { ffi::av_color_transfer_name(par.color_trc) });
                    s.color_primaries =
                        cstr(unsafe { ffi::av_color_primaries_name(par.color_primaries) });
                }
                MediaKind::Audio => {
                    s.sample_rate = (par.sample_rate > 0).then_some(par.sample_rate as u32);
                    s.channels =
                        (par.ch_layout.nb_channels > 0).then_some(par.ch_layout.nb_channels as u16);
                    // SAFETY : pour un flux audio, `format` contient une valeur d'AVSampleFormat (contrat libavcodec).
                    s.sample_format = cstr(unsafe {
                        ffi::av_get_sample_fmt_name(
                            std::mem::transmute::<i32, ffi::AVSampleFormat>(par.format),
                        )
                    });
                }
                _ => {}
            }
            s
        })
        .collect();

    Ok(MediaInfo {
        source: source.to_owned(),
        format: cstr(unsafe { (*fmt.iformat).name }).unwrap_or_default(),
        duration: micros(fmt.duration),
        bit_rate: (fmt.bit_rate > 0).then_some(fmt.bit_rate as u64),
        streams,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::process::Command;
    use tv_core::Definition;

    /// Génère un échantillon réel avec l'exécutable ffmpeg du même build que les DLL.
    pub(crate) fn sample(name: &str, args: &[&str]) -> Option<String> {
        let out = std::env::temp_dir().join(name);
        let ok = Command::new("ffmpeg")
            .args(["-hide_banner", "-loglevel", "error", "-y"])
            .args(args)
            .arg(&out)
            .status()
            .ok()?
            .success();
        ok.then(|| out.to_string_lossy().into_owned())
    }

    #[test]
    fn version_chargee() {
        init().unwrap();
        assert!(
            libavcodec_version()
                .split('.')
                .next()
                .unwrap()
                .parse::<u32>()
                .unwrap()
                >= 62
        );
    }

    #[test]
    fn source_absente() {
        assert!(matches!(
            probe("Z:/n-existe-pas.mkv"),
            Err(Error::Invalid(_))
        ));
    }

    #[test]
    fn analyse_mkv_hevc_opus() {
        let Some(p) = sample(
            "tv-ffmpeg-test.mkv",
            &[
                "-f",
                "lavfi",
                "-i",
                "testsrc2=s=1920x1080:r=50:d=1",
                "-f",
                "lavfi",
                "-i",
                "sine=f=440:r=48000:d=1",
                "-c:v",
                "libx265",
                "-x265-params",
                "log-level=none",
                "-c:a",
                "libopus",
                "-metadata:s:a:0",
                "language=fra",
            ],
        ) else {
            eprintln!("ffmpeg indisponible : test ignoré");
            return;
        };
        let m = probe(&p).unwrap();
        assert_eq!(m.format, "matroska,webm");
        let v = m.best(MediaKind::Video).unwrap();
        assert_eq!(
            (v.codec.as_str(), v.width, v.height),
            ("hevc", Some(1920), Some(1080))
        );
        assert_eq!(v.frame_rate, Some(Rational::new(50, 1)));
        assert_eq!(v.definition(), Some(Definition::FullHd));
        let a = m.best(MediaKind::Audio).unwrap();
        assert_eq!(
            (a.codec.as_str(), a.sample_rate, a.channels),
            ("opus", Some(48_000), Some(1))
        );
        assert_eq!(a.language.as_deref(), Some("fra"));
        assert!(m.duration.unwrap() >= Duration::from_millis(900));
    }
}
