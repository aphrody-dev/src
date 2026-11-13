// SPDX-License-Identifier: Apache-2.0
//! `gen/pet/`: Volt, the Aphrody pet. Original artwork derived only from the brand identity (a
//! rounded A-bolt tile with an amber bolt antenna and a screen face, seed blue, amber accent); it
//! depicts no existing character. Source: `assets/brand/pet/pet.svg` (placeholders below).
//!
//! One pose function per state (idle, wave, think, success, error) drives both outputs, so they never
//! drift: `pet/<state>.svg` animated in CSS (16 keyframes sampled from the pose, still under
//! `prefers-reduced-motion: reduce`), and `pet/spritesheet.{avif,webp,png}` (8 frames per state,
//! 192 px cells, one row per state) described by `pet/sprites.json`.

use super::{Ctx, Manifest, Result, fill, hex, read, strip_comments, write};
use aphrody_brand_gpu::sin;
use resvg::tiny_skia::{Pixmap, PixmapPaint, Transform};
use std::{f32::consts::TAU, fmt::Write as _, path::Path, process::Command};

pub const STATES: [(&str, f32); 5] = [("idle", 3.2), ("wave", 1.2), ("think", 2.4), ("success", 1.2), ("error", 0.8)];
const FRAMES: u32 = 8;
const CELL: u32 = 192;

#[derive(Clone, Copy)]
struct Pose {
    dx: f32,
    dy: f32,
    rot: f32,
    arm_l: f32,
    arm_r: f32,
    eye_sy: f32,
    eye_dy: f32,
    bolt: f32,
}

/// Pose of `state` at phase `t` in 0..1.
fn pose(state: &str, t: f32) -> Pose {
    let p = TAU * t;
    let mut q = Pose { dx: 0.0, dy: 0.0, rot: 0.0, arm_l: 0.0, arm_r: 0.0, eye_sy: 1.0, eye_dy: 0.0, bolt: 1.0 };
    match state {
        "wave" => {
            q.dy = -sin(p);
            q.arm_r = -70.0 + 25.0 * sin(2.0 * p);
            q.arm_l = 4.0 * sin(p);
        }
        "think" => {
            q.rot = 4.0 * sin(p);
            q.eye_dy = -2.0;
            q.bolt = 0.65 + 0.35 * sin(3.0 * p).abs();
            q.arm_r = -35.0;
        }
        "success" => {
            q.dy = -6.0 * sin(p / 2.0).abs();
            q.arm_l = 55.0;
            q.arm_r = -55.0;
        }
        "error" => {
            q.dx = 2.0 * sin(4.0 * p);
            q.bolt = 0.45;
            q.arm_l = -15.0;
            q.arm_r = 15.0;
        }
        _ => {
            q.dy = -1.5 * sin(p);
            q.arm_l = 4.0 * sin(p);
            q.arm_r = -4.0 * sin(p);
            if (0.70..0.78).contains(&t) {
                q.eye_sy = 0.15;
            }
        }
    }
    q
}

fn mouth(state: &str) -> &'static str {
    match state {
        "success" => "M41 55Q48 62 55 55",
        "error" => "M42 58L45 55.5L48 58L51 55.5L54 58",
        "think" => "M45 58L52 57",
        "wave" => "M43 56Q48 61 53 56",
        _ => "M44 57Q48 60 52 57",
    }
}

fn extras(state: &str, ok: &str, err: &str, face: &str) -> String {
    match state {
        "think" => format!("<g fill=\"#FFFFFF\"><circle cx=\"76\" cy=\"24\" r=\"2\"/><circle cx=\"81\" cy=\"17\" r=\"3\"/><rect x=\"74\" y=\"2\" width=\"20\" height=\"12\" rx=\"6\"/></g><g fill=\"{face}\"><circle cx=\"79\" cy=\"8\" r=\"1.3\"/><circle cx=\"84\" cy=\"8\" r=\"1.3\"/><circle cx=\"89\" cy=\"8\" r=\"1.3\"/></g>"),
        "success" => format!("<circle cx=\"80\" cy=\"18\" r=\"9\" fill=\"{ok}\"/><path d=\"M75.5 18L79 21.5L85 15\" fill=\"none\" stroke=\"#FFFFFF\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"),
        "error" => format!("<circle cx=\"80\" cy=\"18\" r=\"9\" fill=\"{err}\"/><rect x=\"78.8\" y=\"12\" width=\"2.4\" height=\"8\" rx=\"1.2\" fill=\"#FFFFFF\"/><circle cx=\"80\" cy=\"23.2\" r=\"1.4\" fill=\"#FFFFFF\"/>"),
        _ => String::new(),
    }
}

fn n(v: f32) -> String {
    let r = (v * 100.0).round() / 100.0;
    if r == 0.0 { "0".into() } else { format!("{r}") }
}

struct T {
    root: String,
    arm_l: String,
    arm_r: String,
    eyes: String,
    bolt: String,
}

fn static_t(q: Pose) -> T {
    T {
        root: format!("translate({} {}) rotate({} 48 80)", n(q.dx), n(q.dy), n(q.rot)),
        arm_l: format!("rotate({} 24 51)", n(q.arm_l)),
        arm_r: format!("rotate({} 72 51)", n(q.arm_r)),
        eyes: format!("translate(0 {}) scale(1 {}) translate(0 -50)", n(50.0 + q.eye_dy), n(q.eye_sy)),
        bolt: n(q.bolt),
    }
}

fn svg(t: &str, state: &str, colors: &[(&str, String)], tr: &T, style: &str) -> String {
    let get = |k: &str| colors.iter().find(|c| c.0 == k).map(|c| c.1.clone()).unwrap_or_default();
    let mut vars: Vec<(&str, String)> = colors.to_vec();
    vars.extend([
        ("state", state.to_string()),
        ("style", style.to_string()),
        ("root_t", tr.root.clone()),
        ("arm_l_t", tr.arm_l.clone()),
        ("arm_r_t", tr.arm_r.clone()),
        ("eyes_t", tr.eyes.clone()),
        ("bolt_op", tr.bolt.clone()),
        ("mouth", mouth(state).to_string()),
        ("extras", extras(state, &get("ok"), &get("err"), &get("face"))),
    ]);
    let refs: Vec<(&str, &str)> = vars.iter().map(|(k, v)| (*k, v.as_str())).collect();
    fill(t, &refs)
}

/// CSS keyframes sampled from the pose (16 steps) and the reduced-motion guard.
fn css(state: &str, dur: f32) -> String {
    let mut root = String::new();
    let mut al = String::new();
    let mut ar = String::new();
    let mut eyes = String::new();
    let mut bolt = String::new();
    for k in 0..=16 {
        let t = k as f32 / 16.0;
        let q = pose(state, t % 1.0);
        let pct = format!("{}%", n(t * 100.0));
        let _ = write!(root, "{pct}{{transform:translate({}px,{}px) rotate({}deg)}}", n(q.dx), n(q.dy), n(q.rot));
        let _ = write!(al, "{pct}{{transform:rotate({}deg)}}", n(q.arm_l));
        let _ = write!(ar, "{pct}{{transform:rotate({}deg)}}", n(q.arm_r));
        let _ = write!(eyes, "{pct}{{transform:translate(0px,{}px) scale(1,{}) translate(0px,-50px)}}", n(50.0 + q.eye_dy), n(q.eye_sy));
        let _ = write!(bolt, "{pct}{{opacity:{}}}", n(q.bolt));
    }
    let a = |name: &str| format!("animation:{state}-{name} {dur}s linear infinite");
    format!(
        "<style>.root{{transform-origin:48px 80px;{}}}.arm-l{{transform-origin:24px 51px;{}}}.arm-r{{transform-origin:72px 51px;{}}}.eyes{{transform-origin:0 0;{}}}.bolt{{{}}}\
@keyframes {state}-root{{{root}}}@keyframes {state}-arm-l{{{al}}}@keyframes {state}-arm-r{{{ar}}}@keyframes {state}-eyes{{{eyes}}}@keyframes {state}-bolt{{{bolt}}}\
@media (prefers-reduced-motion:reduce){{.root,.arm-l,.arm-r,.eyes,.bolt{{animation:none}}}}</style>",
        a("root"),
        a("arm-l"),
        a("arm-r"),
        a("eyes"),
        a("bolt")
    )
}

fn encode(png: &Path, out: &Path, avif: bool) -> Result<()> {
    let mut c = if avif {
        let mut c = Command::new("avifenc");
        c.args(["--jobs", "1", "--speed", "6", "-q", "80", "--ignore-exif", "--ignore-xmp"]).arg(png).arg(out);
        c
    } else {
        let mut c = Command::new("cwebp");
        c.args(["-quiet", "-metadata", "none", "-m", "6", "-q", "90", "-alpha_q", "100"]).arg(png).arg("-o").arg(out);
        c
    };
    let o = c.output().map_err(|e| super::Error::Tool(format!("{e}")))?;
    if !o.status.success() {
        return Err(super::Error::Tool(String::from_utf8_lossy(&o.stderr).into_owned()));
    }
    Ok(())
}

pub(super) fn pet(cx: &mut Ctx<'_>, m: &Manifest, tmp: &Path) -> Result<()> {
    let src = cx.root.join("assets/brand/pet/pet.svg");
    if !src.is_file() {
        return Ok(());
    }
    let t = strip_comments(&read(&src)?);
    let p = super::Palette::new();
    let colors: Vec<(&str, String)> = vec![
        ("body", m.brand.seed.clone()),
        ("body_dark", hex(p.light.argb("primary"))),
        ("face", hex(p.dark.argb("surface-container-lowest"))),
        ("eye", hex(p.accent)),
        ("bolt", hex(p.accent)),
        ("ok", hex(p.light.argb("primary"))),
        ("err", hex(p.light.argb("error"))),
    ];
    let still = static_t(pose("idle", 0.0));
    cx.put("pet/pet.svg", cx.svg.optimize(&svg(&t, "idle", &colors, &still, ""))?)?;
    let mut sheet = Pixmap::new(CELL * FRAMES, CELL * STATES.len() as u32).ok_or_else(|| super::Error::Render("sheet".into()))?;
    let mut rows = Vec::new();
    for (row, (state, dur)) in STATES.iter().enumerate() {
        let ident = T { root: String::new(), arm_l: String::new(), arm_r: String::new(), eyes: String::new(), bolt: "1".into() };
        let animated = svg(&t, state, &colors, &ident, &css(state, *dur));
        let compact: String = animated.lines().map(str::trim).collect::<Vec<_>>().join("");
        cx.put(&format!("pet/{state}.svg"), compact + "\n")?;
        for f in 0..FRAMES {
            let frame = svg(&t, state, &colors, &static_t(pose(state, f as f32 / FRAMES as f32)), "");
            let px = cx.svg.pixmap(&frame, CELL, CELL)?;
            sheet.draw_pixmap((f * CELL) as i32, (row as u32 * CELL) as i32, px.as_ref(), &PixmapPaint::default(), Transform::identity(), None);
        }
        rows.push(serde_json::json!({ "state": state, "row": row, "frames": FRAMES, "fps": (FRAMES as f32 / dur * 100.0).round() / 100.0 }));
    }
    let png = sheet.encode_png().map_err(|e| super::Error::Render(e.to_string()))?;
    let png_path = tmp.join("pet-sheet.png");
    write(&png_path, &png)?;
    cx.put("pet/spritesheet.png", &png)?;
    for (ext, avif) in [("avif", true), ("webp", false)] {
        let out = tmp.join(format!("pet-sheet.{ext}"));
        encode(&png_path, &out, avif)?;
        cx.put(&format!("pet/spritesheet.{ext}"), std::fs::read(&out).map_err(|e| super::Error::Io(out.clone(), e))?)?;
    }
    let json = serde_json::json!({ "name": "Volt", "cell": CELL, "columns": FRAMES, "states": rows, "license": "MIT OR Apache-2.0, original Aphrody artwork" });
    cx.put("pet/sprites.json", serde_json::to_string_pretty(&json).unwrap_or_default() + "\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn poses_loop_and_css_has_reduced_motion() {
        for (s, d) in STATES {
            let (a, b) = (pose(s, 0.0), pose(s, 1.0 - 1e-6));
            assert!((a.dy - b.dy).abs() < 0.05 && (a.arm_r - b.arm_r).abs() < 0.5, "{s}");
            let c = css(s, d);
            assert!(c.contains("prefers-reduced-motion:reduce") && c.contains(&format!("@keyframes {s}-root")));
        }
    }
}
