use std::process::ExitCode;
use std::time::Duration;

use clap::{Arg, ArgAction, ArgMatches, Command};
use tv_core::{Definition, MediaInfo, MediaKind, StreamInfo};
use tv_i18n::I18n;

fn lang_from_args() -> Option<String> {
    let mut args = std::env::args();
    while let Some(a) = args.next() {
        if let Some(v) = a.strip_prefix("--lang=") {
            return Some(v.to_owned());
        }
        if a == "--lang" {
            return args.next();
        }
    }
    None
}

/// Construite à l'exécution pour que l'aide soit dans la langue choisie.
fn cli(t: &I18n) -> Command {
    Command::new("tv")
        .version(env!("CARGO_PKG_VERSION"))
        .about(t.t("app-description"))
        .subcommand_required(true)
        .arg(
            Arg::new("lang")
                .long("lang")
                .global(true)
                .env("TV_LANG")
                .value_parser(tv_i18n::LANGUAGES)
                .help(t.t("arg-lang")),
        )
        .subcommand(
            Command::new("probe")
                .about(t.t("cmd-probe"))
                .arg(Arg::new("source").required(true).help(t.t("arg-source")))
                .arg(
                    Arg::new("json")
                        .long("json")
                        .action(ArgAction::SetTrue)
                        .help(t.t("arg-json")),
                ),
        )
}

fn main() -> ExitCode {
    let t = lang_from_args().map_or_else(I18n::from_system, |l| I18n::new(&l));
    let m = cli(&t).get_matches();
    match m.subcommand() {
        Some(("probe", sub)) => probe(&t, sub),
        _ => unreachable!("sous-commande obligatoire"),
    }
}

fn probe(t: &I18n, m: &ArgMatches) -> ExitCode {
    let source = m.get_one::<String>("source").expect("argument obligatoire");
    match tv_ffmpeg::probe(source) {
        Ok(info) if m.get_flag("json") => {
            println!(
                "{}",
                serde_json::to_string_pretty(&info).expect("sérialisation")
            );
            ExitCode::SUCCESS
        }
        Ok(info) => {
            print!("{}", render(t, &info));
            ExitCode::SUCCESS
        }
        Err(e) => {
            eprintln!("{} : {e}", t.t("label-error"));
            ExitCode::FAILURE
        }
    }
}

fn duration(d: Option<Duration>, t: &I18n) -> String {
    d.map_or_else(
        || t.t("value-unknown"),
        |d| {
            let s = d.as_secs();
            format!(
                "{:02}:{:02}:{:02}.{:03}",
                s / 3600,
                s / 60 % 60,
                s % 60,
                d.subsec_millis()
            )
        },
    )
}

fn kbps(b: Option<u64>, t: &I18n) -> String {
    b.map_or_else(|| t.t("value-unknown"), |b| format!("{} kb/s", b / 1000))
}

fn definition(d: Definition, t: &I18n) -> String {
    t.t(match d {
        Definition::Sd => "def-sd",
        Definition::Hd => "def-hd",
        Definition::FullHd => "def-fullhd",
        Definition::Uhd4k => "def-uhd4k",
        Definition::Uhd8k => "def-uhd8k",
    })
}

fn stream_line(s: &StreamInfo, t: &I18n) -> String {
    let kind = t.t(match s.kind {
        MediaKind::Video => "kind-video",
        MediaKind::Audio => "kind-audio",
        MediaKind::Subtitle => "kind-subtitle",
        MediaKind::Data => "kind-data",
        _ => "kind-other",
    });
    let mut out = format!("  #{} {kind} : {}", s.index, s.codec);
    if let Some(p) = &s.profile {
        out += &format!(" ({p})");
    }
    if let (Some(w), Some(h)) = (s.width, s.height) {
        out += &format!(" | {} {w}x{h}", t.t("label-resolution"));
        if let Some(d) = s.definition() {
            out += &format!(" [{}]", definition(d, t));
        }
    }
    if let Some(fps) = s.frame_rate.and_then(|r| r.as_f64()) {
        out += &format!(" | {} {fps:.3}", t.t("label-frame-rate"));
    }
    if let Some(pf) = &s.pixel_format {
        out += &format!(" | {} {pf}", t.t("label-pixel-format"));
    }
    if s.kind == MediaKind::Video {
        let range = t.t(if s.is_hdr() { "range-hdr" } else { "range-sdr" });
        out += &format!(" | {} {range}", t.t("label-dynamic-range"));
    }
    if let Some(sr) = s.sample_rate {
        out += &format!(" | {} {sr} Hz", t.t("label-sample-rate"));
    }
    if let Some(c) = s.channels {
        out += &format!(" | {} {c}", t.t("label-channels"));
    }
    if let Some(l) = &s.language {
        out += &format!(" | {} {l}", t.t("label-language"));
    }
    out
}

fn render(t: &I18n, m: &MediaInfo) -> String {
    let mut out = format!("{}\n", m.source);
    out += &format!("{} : {}\n", t.t("label-format"), m.format);
    out += &format!("{} : {}\n", t.t("label-duration"), duration(m.duration, t));
    out += &format!("{} : {}\n", t.t("label-bitrate"), kbps(m.bit_rate, t));
    out += &format!(
        "{}\n",
        t.t_args(
            "streams-count",
            &[("count", (m.streams.len() as i64).into())]
        )
    );
    for s in &m.streams {
        out += &stream_line(s, t);
        out.push('\n');
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use tv_core::Rational;

    fn media() -> MediaInfo {
        let mut v = StreamInfo::new(0, MediaKind::Video, "av1", Rational::new(1, 1000));
        (v.width, v.height, v.frame_rate) = (Some(3840), Some(2160), Some(Rational::new(120, 1)));
        v.color_transfer = Some("smpte2084".into());
        let mut a = StreamInfo::new(1, MediaKind::Audio, "opus", Rational::new(1, 48_000));
        (a.sample_rate, a.channels) = (Some(48_000), Some(2));
        MediaInfo {
            source: "x.mkv".into(),
            format: "matroska,webm".into(),
            duration: Some(Duration::from_millis(61_500)),
            bit_rate: Some(8_000_000),
            streams: vec![v, a],
        }
    }

    #[test]
    fn rendu_francais() {
        let out = render(&I18n::new("fr-FR"), &media());
        assert!(out.contains("Durée : 00:01:01.500"));
        assert!(out.contains("Débit : 8000 kb/s"));
        assert!(out.contains("2 flux"));
        assert!(out.contains("Résolution 3840x2160 [4K UHD]"));
        assert!(out.contains("Plage dynamique HDR"));
        assert!(out.contains("Échantillonnage 48000 Hz"));
    }

    #[test]
    fn aide_localisee() {
        let help = cli(&I18n::new("ja-JP")).render_long_help().to_string();
        assert!(help.contains("動画・画像・音声・ストリーミングのツールキット"));
        cli(&I18n::new("en-US")).debug_assert();
    }
}
