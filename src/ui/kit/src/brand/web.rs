// SPDX-License-Identifier: Apache-2.0
//! Web asset stages of `ay brand build`, after the logos, icons, cards and banners of `brand`:
//!
//! | Output (gen/) | Content |
//! | :-- | :-- |
//! | `symbols/` | Material Symbols Rounded: `sprite.svg`, `svg/<name>[-fill].svg`, `symbols.json`, subset variable font + `symbols.css` |
//! | `fonts/` | OFL fonts subset to Latin, every axis kept, WOFF2, `fonts.css` (font-display swap), `fonts.json` (preload list) |
//! | `img/` | AVIF + WebP at every srcset width of the cards, wordmarks, wallpapers, captures; `img/srcset.json` |
//! | `video/` | AV1 and VP9 WebM of the captured product videos, poster frames in `img/` |
//! | `logo/<org>-animated.svg` | CSS-animated monogram, still under `prefers-reduced-motion: reduce` |
//! | `model/<id>.glb` | brand tile, glTF 2.0, EXT_meshopt_compression, KHR_texture_basisu (KTX2 UASTC) |
//! | `env/` | CC0 studio environment (KTX2 RGBA16F, zstd) for image-based lighting |
//! | `gpu/` | `brand-gpu.wasm` + `brand-gpu.js` (WebGPU, `<img>` fallback), `index.html` demo |
//! | `manifest.json` | size and sha256 of every file above, tool versions; published immutable on the CDN |
//!
//! Every encoder is pinned (tools.toml, `ay doctor`) and run single-threaded with metadata stripped,
//! so two builds from the same inputs give the same bytes; `manifest.json` proves it.

use super::{Ctx, Error, Manifest, Result, fill, hex, inner, read, strip_comments};
use serde::Deserialize;
use sha2::{Digest, Sha256};
use std::{
    collections::BTreeMap,
    ffi::OsStr,
    fmt::Write as _,
    fs,
    path::{Path, PathBuf},
    process::Command,
};

// ---------------------------------------------------------------------------------------------
// brand.toml sections

#[derive(Debug, Deserialize)]
pub struct Symbols {
    pub font_file: String,
    pub codepoints_file: String,
    pub names: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Font {
    pub id: String,
    pub family: String,
    pub path: String,
    pub blob: String,
    #[serde(default)]
    pub preload: bool,
}

#[derive(Debug, Deserialize)]
pub struct Images {
    pub widths: Vec<u32>,
    pub avif_quality: u32,
    pub webp_quality: u32,
}

/// A background image rendered from an original template of `src/` at several resolutions.
#[derive(Debug, Deserialize)]
pub struct Wallpaper {
    pub id: String,
    /// Org or product whose drawing is placed on the wallpaper.
    pub mark: String,
    pub template: String,
    /// `WIDTHxHEIGHT`.
    pub sizes: Vec<String>,
}

/// A real capture of a product, committed under `captures/` by `bun assets/brand/capture.ts`.
#[derive(Debug, Deserialize)]
pub struct Capture {
    pub id: String,
    pub url: String,
    /// srcset widths of the still (`captures/<id>.png`).
    pub widths: Vec<u32>,
    /// `captures/<id>.webm` exists (lossless VP9 recording): encode AV1 + VP9 and a poster.
    #[serde(default)]
    pub video: bool,
    /// Still taken elsewhere in the repo (e.g. docs/proofs/...), relative to the root, instead of captures/<id>.png.
    pub file: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Model {
    pub ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Environment {
    pub id: String,
    pub file: String,
    pub license: String,
    pub source: String,
}

#[derive(Debug, Deserialize)]
pub struct Gpu {
    #[serde(rename = "crate")]
    pub krate: String,
    pub loader: String,
}

// ---------------------------------------------------------------------------------------------
// Helpers

#[must_use]
pub fn sha256_hex(bytes: &[u8]) -> String {
    let mut s = String::with_capacity(64);
    for b in Sha256::digest(bytes) {
        let _ = write!(s, "{b:02x}");
    }
    s
}

/// Runs a tool, returns its stdout; a non-zero exit is an error carrying stderr.
fn exec(mut cmd: Command) -> Result<Vec<u8>> {
    let name = cmd.get_program().to_string_lossy().into_owned();
    let out = cmd.output().map_err(|e| Error::Tool(format!("{name}: {e} (installed by infra/fleet/bootstrap/fr1.sh, see `ay doctor`)")))?;
    if !out.status.success() {
        let err = String::from_utf8_lossy(&out.stderr);
        return Err(Error::Tool(format!("{name} {:?}: {}", cmd.get_args().collect::<Vec<_>>(), err.trim())));
    }
    Ok(out.stdout)
}

fn cmd<I, S>(program: &str, args: I) -> Command
where
    I: IntoIterator<Item = S>,
    S: AsRef<OsStr>,
{
    let mut c = Command::new(program);
    c.args(args);
    c
}

fn bytes(path: &Path) -> Result<Vec<u8>> {
    fs::read(path).map_err(|e| Error::Io(path.to_path_buf(), e))
}

/// First line of `program args` (stdout, else stderr), for the manifest.
fn version(program: &str, args: &[&str]) -> String {
    Command::new(program)
        .args(args)
        .output()
        .ok()
        .map(|o| {
            let s = if o.stdout.is_empty() { o.stderr } else { o.stdout };
            String::from_utf8_lossy(&s).lines().find(|l| !l.trim().is_empty()).unwrap_or("").trim().to_string()
        })
        .unwrap_or_default()
}

/// Google Fonts "latin" range (French included).
const LATIN: &str = "0000-00FF,0131,0152-0153,02BB-02BC,02C6,02DA,02DC,0304,0308,0329,2000-206F,20AC,2122,2191,2193,2212,2215,FEFF,FFFD";

fn css_unicode_range(list: &str) -> String {
    list.split(',').map(|r| format!("U+{r}")).collect::<Vec<_>>().join(", ")
}

/// Variable axes of a TrueType/OpenType font: (tag, min, default, max), from its `fvar` table.
#[must_use]
pub fn fvar_axes(font: &[u8]) -> Vec<(String, f32, f32, f32)> {
    let u16_at = |o: usize| font.get(o..o + 2).map(|b| usize::from(u16::from_be_bytes([b[0], b[1]])));
    let u32_at = |o: usize| font.get(o..o + 4).map(|b| u32::from_be_bytes([b[0], b[1], b[2], b[3]]) as usize);
    let fixed = |o: usize| font.get(o..o + 4).map(|b| i32::from_be_bytes([b[0], b[1], b[2], b[3]]) as f32 / 65536.0);
    let Some(n) = u16_at(4) else { return Vec::new() };
    let Some(off) = (0..n).find_map(|i| (font.get(12 + 16 * i..16 + 16 * i)? == b"fvar").then(|| u32_at(12 + 16 * i + 8)).flatten()) else {
        return Vec::new();
    };
    let (Some(axes), Some(count), Some(size)) = (u16_at(off + 4), u16_at(off + 8), u16_at(off + 10)) else { return Vec::new() };
    (0..count)
        .filter_map(|a| {
            let p = off + axes + a * size;
            let tag = String::from_utf8_lossy(font.get(p..p + 4)?).into_owned();
            Some((tag, fixed(p + 4)?, fixed(p + 8)?, fixed(p + 12)?))
        })
        .collect()
}

fn num(v: f32) -> String {
    let r = (v * 100.0).round() / 100.0;
    if r.fract() == 0.0 { format!("{}", r as i64) } else { format!("{r}") }
}

/// `@font-face` descriptors of the weight, width and slant axes.
fn axis_descriptors(axes: &[(String, f32, f32, f32)]) -> String {
    let mut d = String::new();
    let get = |t: &str| axes.iter().find(|a| a.0 == t);
    match get("wght") {
        Some(a) => {
            let _ = write!(d, "font-weight:{} {};", num(a.1), num(a.3));
        }
        None => d.push_str("font-weight:400;"),
    }
    if let Some(a) = get("wdth") {
        let _ = write!(d, "font-stretch:{}% {}%;", num(a.1), num(a.3));
    }
    // slnt is counter-clockwise degrees (negative = right lean); CSS oblique angles are clockwise.
    match get("slnt") {
        Some(a) => {
            let _ = write!(d, "font-style:oblique {}deg {}deg;", num(-a.3), num(-a.1));
        }
        None => d.push_str("font-style:normal;"),
    }
    d
}

struct Stage<'a> {
    root: PathBuf,
    brand_dir: &'a Path,
    tmp: PathBuf,
}

impl Stage<'_> {
    fn tmp(&self, name: &str) -> PathBuf {
        self.tmp.join(name)
    }
}

// ---------------------------------------------------------------------------------------------
// Entry

pub(super) fn run(cx: &mut Ctx<'_>, m: &Manifest, brand_dir: &Path) -> Result<()> {
    let tmp = brand_dir.join("gen-cache").join("tmp");
    if tmp.exists() {
        fs::remove_dir_all(&tmp).map_err(|e| Error::Io(tmp.clone(), e))?;
    }
    fs::create_dir_all(&tmp).map_err(|e| Error::Io(tmp.clone(), e))?;
    let st = Stage { root: cx.root.to_path_buf(), brand_dir, tmp };
    symbols(cx, m, &st)?;
    fonts(cx, m, &st)?;
    animated(cx, m, &st)?;
    images(cx, m, &st)?;
    wallpapers(cx, m, &st)?;
    captures(cx, m, &st)?;
    environment(cx, m, &st)?;
    super::model::models(cx, m, &st.tmp)?;
    super::pet::pet(cx, m, &st.tmp)?;
    gpu(cx, m, &st)?;
    let _ = fs::remove_dir_all(&st.tmp);
    manifest(cx, m)
}


// ---------------------------------------------------------------------------------------------
// Material Symbols

/// `viewBox` value of an SVG root.
fn view_box(svg: &str) -> String {
    svg.find("viewBox=\"")
        .and_then(|i| svg[i + 9..].find('"').map(|j| svg[i + 9..i + 9 + j].to_string()))
        .unwrap_or_else(|| "0 0 24 24".into())
}

/// usvg writes the default black fill explicitly; icons must inherit `currentColor`.
fn uncolor(svg: &str) -> String {
    svg.replace(" fill=\"#000000\"", "").replace(" fill=\"#000\"", "")
}

fn symbols(cx: &mut Ctx<'_>, m: &Manifest, st: &Stage<'_>) -> Result<()> {
    let Some(s) = &m.symbols else { return Ok(()) };
    let codepoints_text = read(&st.brand_dir.join(&s.codepoints_file))?;
    let codepoints: BTreeMap<&str, &str> = codepoints_text.lines().filter_map(|l| l.split_once(' ')).collect();
    let mut sprite = String::from("<svg xmlns=\"http://www.w3.org/2000/svg\">");
    let mut json = serde_json::Map::new();
    let mut cps = Vec::new();
    for name in &s.names {
        let cp = *codepoints.get(name.as_str()).ok_or_else(|| Error::Manifest(format!("symbol {name}: not in {}", s.codepoints_file)))?;
        cps.push(cp.to_string());
        let mut entry = serde_json::Map::new();
        entry.insert("codepoint".into(), cp.into());
        for (suffix, key) in [("", "outline"), ("-fill", "fill")] {
            let src = read(&st.brand_dir.join("symbols").join("24").join(format!("{name}{suffix}.svg")))?;
            let opt = uncolor(&cx.svg.optimize(&src)?);
            let (vb, body) = (view_box(&opt), inner(&opt).to_string());
            let file = format!(
                "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"24\" height=\"24\" viewBox=\"{vb}\" fill=\"currentColor\" aria-hidden=\"true\">{body}</svg>"
            );
            cx.put(&format!("symbols/svg/{name}{suffix}.svg"), &file)?;
            let _ = write!(sprite, "<symbol id=\"{name}{suffix}\" viewBox=\"{vb}\">{body}</symbol>");
            entry.insert("viewBox".into(), vb.into());
            entry.insert(key.into(), body.into());
        }
        json.insert(name.clone(), entry.into());
    }
    sprite.push_str("</svg>\n");
    cx.put("symbols/sprite.svg", sprite)?;
    cx.put("symbols/symbols.json", serde_json::to_string_pretty(&json).unwrap_or_default() + "\n")?;

    // Variable font subset: the icon codepoints, the letters of their ligatures, no layout closure
    // (a ligature survives only when its glyph is kept, so nothing else of the 4000 icons does).
    let ttf = st.tmp("symbols.ttf");
    let unicodes = format!("5F,30-39,61-7A,{}", cps.join(","));
    exec(cmd("hb-subset", [
        format!("--font-file={}", st.brand_dir.join(&s.font_file).display()),
        format!("--unicodes={unicodes}"),
        "--no-layout-closure".into(),
        format!("--output-file={}", ttf.display()),
    ]))?;
    for name in &s.names {
        let shaped = exec(cmd("hb-shape", [
            "--no-glyph-names".into(),
            "--no-positions".into(),
            "--no-clusters".into(),
            format!("--font-file={}", ttf.display()),
            format!("--text={name}"),
        ]))?;
        let shaped = String::from_utf8_lossy(&shaped);
        if shaped.contains('|') || shaped.trim() == "[0]" {
            return Err(Error::Tool(format!("symbols font: ligature `{name}` lost in the subset ({})", shaped.trim())));
        }
    }
    exec(cmd("woff2_compress", [&ttf]))?;
    cx.put("symbols/material-symbols-rounded.woff2", bytes(&st.tmp("symbols.woff2"))?)?;
    let axes = fvar_axes(&bytes(&ttf)?);
    let range = |t: &str| axes.iter().find(|a| a.0 == t).map_or_else(String::new, |a| format!("{} {}", num(a.1), num(a.3)));
    let css = format!(
        "/* Material Symbols Rounded (Apache-2.0, Google LLC), subset of `ay brand build`: {n} icons, axes FILL {fill}, GRAD {grad}, opsz {opsz}, wght {wght}. */\n\
@font-face{{font-family:\"Material Symbols Rounded\";font-style:normal;font-weight:{wght};font-display:block;src:url(material-symbols-rounded.woff2) format(\"woff2\")}}\n\
.material-symbols-rounded{{font-family:\"Material Symbols Rounded\";font-weight:normal;font-style:normal;font-size:24px;line-height:1;letter-spacing:normal;text-transform:none;display:inline-block;white-space:nowrap;word-wrap:normal;direction:ltr;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;font-feature-settings:\"liga\";font-variation-settings:\"FILL\" 0,\"wght\" 400,\"GRAD\" 0,\"opsz\" 24}}\n",
        n = s.names.len(),
        fill = range("FILL"),
        grad = range("GRAD"),
        opsz = range("opsz"),
        wght = range("wght"),
    );
    cx.put("symbols/symbols.css", css)?;
    cx.put("symbols/NOTICE", read(&st.brand_dir.join("symbols").join("NOTICE"))?)
}

// ---------------------------------------------------------------------------------------------
// Fonts

fn fonts(cx: &mut Ctx<'_>, m: &Manifest, st: &Stage<'_>) -> Result<()> {
    if m.font.is_empty() {
        return Ok(());
    }
    let mut css = String::from("/* Web fonts of `ay brand build`: SIL OFL 1.1 (see <id>-OFL.txt), Latin subset, every variable axis kept. */\n");
    let mut list = Vec::new();
    for f in &m.font {
        let src = st.brand_dir.join("gen-cache").join("fonts").join(format!("{}.ttf", f.id));
        let ttf = st.tmp(&format!("{}.ttf", f.id));
        exec(cmd("hb-subset", [
            format!("--font-file={}", src.display()),
            format!("--unicodes={LATIN}"),
            format!("--output-file={}", ttf.display()),
        ]))?;
        exec(cmd("woff2_compress", [&ttf]))?;
        let file = format!("{}.woff2", f.id);
        let woff2 = bytes(&st.tmp(&file))?;
        let axes = fvar_axes(&bytes(&src)?);
        cx.put(&format!("fonts/{file}"), &woff2)?;
        cx.put(&format!("fonts/{}-OFL.txt", f.id), bytes(&st.brand_dir.join("gen-cache").join("fonts").join(format!("{}-OFL.txt", f.id)))?)?;
        let _ = writeln!(
            css,
            "@font-face{{font-family:\"{}\";src:url({file}) format(\"woff2\");{}font-display:swap;unicode-range:{}}}",
            f.family,
            axis_descriptors(&axes),
            css_unicode_range(LATIN)
        );
        list.push(serde_json::json!({
            "id": f.id,
            "family": f.family,
            "file": format!("fonts/{file}"),
            "bytes": woff2.len(),
            "preload": f.preload,
            "axes": axes.iter().map(|a| serde_json::json!({ "tag": a.0, "min": a.1, "default": a.2, "max": a.3 })).collect::<Vec<_>>(),
            "source": format!("google/fonts {}", f.path),
            "license": "OFL-1.1",
        }));
    }
    cx.put("fonts/fonts.css", css)?;
    let preload: Vec<_> = m.font.iter().filter(|f| f.preload).map(|f| format!("fonts/{}.woff2", f.id)).collect();
    cx.put("fonts/fonts.json", serde_json::to_string_pretty(&serde_json::json!({ "fonts": list, "preload": preload })).unwrap_or_default() + "\n")
}

// ---------------------------------------------------------------------------------------------
// Animated logos

fn animated(cx: &mut Ctx<'_>, m: &Manifest, st: &Stage<'_>) -> Result<()> {
    let path = st.brand_dir.join("src").join("mark-animated.svg");
    if !path.is_file() {
        return Ok(());
    }
    let t = strip_comments(&read(&path)?);
    let palette = super::Palette::new();
    for org in &m.org {
        let (container, glyph) = palette.org(&org.container);
        let svg = fill(&t, &[("container", &hex(container)), ("glyph", &hex(glyph)), ("bolt", &hex(palette.accent))]);
        // Not through usvg: it would drop the CSS animation. Whitespace between tags only.
        let compact: String = svg.lines().map(str::trim).collect::<Vec<_>>().join("");
        cx.put(&format!("logo/{}-animated.svg", org.id), compact + "\n")?;
    }
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// Responsive raster images

/// Encodes `png` to AVIF and WebP as `img/<key>-<w>.{avif,webp}`.
fn encode(cx: &mut Ctx<'_>, st: &Stage<'_>, im: &Images, key: &str, w: u32, png: &[u8]) -> Result<()> {
    let base = key.replace('/', "_");
    let src = st.tmp(&format!("{base}-{w}.png"));
    fs::write(&src, png).map_err(|e| Error::Io(src.clone(), e))?;
    let avif = st.tmp(&format!("{base}-{w}.avif"));
    let webp = st.tmp(&format!("{base}-{w}.webp"));
    exec(cmd("avifenc", [
        OsStr::new("--jobs"), OsStr::new("1"), OsStr::new("--speed"), OsStr::new("6"),
        OsStr::new("-q"), OsStr::new(&im.avif_quality.to_string()),
        OsStr::new("--ignore-exif"), OsStr::new("--ignore-xmp"),
        src.as_os_str(), avif.as_os_str(),
    ]))?;
    exec(cmd("cwebp", [
        OsStr::new("-quiet"), OsStr::new("-metadata"), OsStr::new("none"), OsStr::new("-m"), OsStr::new("6"),
        OsStr::new("-q"), OsStr::new(&im.webp_quality.to_string()),
        src.as_os_str(), OsStr::new("-o"), webp.as_os_str(),
    ]))?;
    cx.put(&format!("img/{key}-{w}.avif"), bytes(&avif)?)?;
    cx.put(&format!("img/{key}-{w}.webp"), bytes(&webp)?)
}

fn srcset(key: &str, widths: &[u32], ext: &str) -> String {
    widths.iter().map(|w| format!("img/{key}-{w}.{ext} {w}w")).collect::<Vec<_>>().join(", ")
}

/// srcset.json entries, collected across the image stages.
fn srcsets(cx: &Ctx<'_>) -> BTreeMap<String, serde_json::Value> {
    let mut out: BTreeMap<String, Vec<u32>> = BTreeMap::new();
    for rel in cx.hashes.keys() {
        let Some(rest) = rel.strip_prefix("img/").and_then(|r| r.strip_suffix(".avif")) else { continue };
        if let Some((key, w)) = rest.rsplit_once('-') {
            if let Ok(w) = w.parse::<u32>() {
                out.entry(key.to_string()).or_default().push(w);
            }
        }
    }
    out.into_iter()
        .map(|(key, mut widths)| {
            widths.sort_unstable();
            let v = serde_json::json!({
                "widths": widths,
                "avif": srcset(&key, &widths, "avif"),
                "webp": srcset(&key, &widths, "webp"),
                "fallback": format!("img/{key}-{}.webp", widths.last().copied().unwrap_or(0)),
            });
            (key, v)
        })
        .collect()
}

fn images(cx: &mut Ctx<'_>, m: &Manifest, st: &Stage<'_>) -> Result<()> {
    let Some(im) = &m.images else { return Ok(()) };
    let mut sources: Vec<(String, String)> = Vec::new();
    for id in m.org.iter().map(|o| &o.id).chain(m.product.iter().map(|p| &p.id)) {
        sources.push((format!("og/{id}"), read(&cx.gen_dir.join("og").join(format!("{id}.svg")))?));
    }
    for org in &m.org {
        for theme in ["light", "dark"] {
            let key = format!("logo/{}-wordmark-{theme}", org.id);
            sources.push((key.clone(), read(&cx.gen_dir.join(format!("{key}.svg")))?));
        }
    }
    for (key, svg) in sources {
        let size = cx.svg.tree(&svg)?.size();
        for &w in &im.widths {
            let h = (w as f32 * size.height() / size.width()).round() as u32;
            let png = cx.svg.png(&svg, w, h)?;
            encode(cx, st, im, &key, w, &png)?;
        }
    }
    Ok(())
}

fn wallpapers(cx: &mut Ctx<'_>, m: &Manifest, st: &Stage<'_>) -> Result<()> {
    let Some(im) = &m.images else { return Ok(()) };
    let palette = super::Palette::new();
    for wp in &m.wallpaper {
        let t = strip_comments(&read(&st.brand_dir.join(&wp.template))?);
        let drawing = cx.drawings.get(&wp.mark).cloned().ok_or_else(|| Error::Manifest(format!("wallpaper {}: no drawing {}", wp.id, wp.mark)))?;
        let s = &palette.dark;
        for size in &wp.sizes {
            let (w, h) = size
                .split_once('x')
                .and_then(|(w, h)| Some((w.parse::<u32>().ok()?, h.parse::<u32>().ok()?)))
                .ok_or_else(|| Error::Manifest(format!("wallpaper {}: size {size}", wp.id)))?;
            let svg = fill(&t, &[
                ("w", &w.to_string()),
                ("h", &h.to_string()),
                ("bg", &hex(s.argb("surface-container-lowest"))),
                ("glow", &hex(s.argb("primary-container"))),
                ("band", &hex(s.argb("primary"))),
                ("accent", &hex(palette.accent)),
                ("mark", inner(&drawing)),
            ]);
            let png = cx.svg.png(&svg, w, h)?;
            let key = format!("wallpaper/{}{}", wp.id, if h > w { "-portrait" } else { "" });
            encode(cx, st, im, &key, w, &png)?;
        }
    }
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// Captures (stills and video)

fn captures(cx: &mut Ctx<'_>, m: &Manifest, st: &Stage<'_>) -> Result<()> {
    let Some(im) = &m.images else { return Ok(()) };
    let dir = st.brand_dir.join("captures");
    for c in &m.capture {
        let still = c.file.as_ref().map_or_else(|| dir.join(format!("{}.png", c.id)), |f| st.root.join(f));
        if !still.is_file() {
            cx.report.warnings.push(format!("capture {}: {} missing (bun assets/brand/capture.ts)", c.id, still.display()));
            continue;
        }
        for &w in &c.widths {
            let scaled = st.tmp(&format!("capture-{}-{w}.png", c.id));
            ffmpeg_scale(&still, &scaled, w)?;
            encode(cx, st, im, &format!("capture/{}", c.id), w, &bytes(&scaled)?)?;
        }
        let video = dir.join(format!("{}.webm", c.id));
        if c.video && video.is_file() {
            videos(cx, st, im, c, &video)?;
        }
    }
    Ok(())
}

fn ffmpeg_scale(src: &Path, dst: &Path, w: u32) -> Result<()> {
    exec(cmd("ffmpeg", [
        OsStr::new("-v"), OsStr::new("error"), OsStr::new("-y"), OsStr::new("-i"), src.as_os_str(),
        OsStr::new("-vf"), OsStr::new(&format!("scale={w}:-2:flags=lanczos")),
        OsStr::new("-frames:v"), OsStr::new("1"), OsStr::new("-flags"), OsStr::new("+bitexact"),
        dst.as_os_str(),
    ]))
    .map(|_| ())
}

/// AV1 (SVT-AV1) and VP9 WebM of a lossless recording, 1280 wide, no audio, bit-exact muxing, and
/// its first frame as poster (AVIF/WebP at the capture widths).
fn videos(cx: &mut Ctx<'_>, st: &Stage<'_>, im: &Images, c: &Capture, src: &Path) -> Result<()> {
    let common = |codec: &[&str], out: &Path| -> Vec<String> {
        let mut a: Vec<String> = ["-v", "error", "-y", "-threads", "1", "-i"].iter().map(|s| (*s).to_string()).collect();
        a.push(src.display().to_string());
        a.extend(["-an", "-sn", "-map_metadata", "-1", "-vf", "scale=1280:-2:flags=lanczos,format=yuv420p", "-r", "30"].iter().map(|s| (*s).to_string()));
        a.extend(codec.iter().map(|s| (*s).to_string()));
        a.extend(["-fflags", "+bitexact", "-flags:v", "+bitexact", "-metadata", "encoder=", "-f", "webm"].iter().map(|s| (*s).to_string()));
        a.push(out.display().to_string());
        a
    };
    let av1 = st.tmp(&format!("{}-av1.webm", c.id));
    exec(cmd("ffmpeg", common(&["-c:v", "libsvtav1", "-preset", "6", "-crf", "38", "-g", "120", "-svtav1-params", "lp=1:pin=0:tune=0"], &av1)))?;
    let vp9 = st.tmp(&format!("{}-vp9.webm", c.id));
    exec(cmd("ffmpeg", common(&["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "36", "-row-mt", "0", "-deadline", "good", "-cpu-used", "2", "-g", "120"], &vp9)))?;
    cx.put(&format!("video/{}-av1.webm", c.id), bytes(&av1)?)?;
    cx.put(&format!("video/{}-vp9.webm", c.id), bytes(&vp9)?)?;
    let poster = st.tmp(&format!("{}-poster.png", c.id));
    exec(cmd("ffmpeg", [
        OsStr::new("-v"), OsStr::new("error"), OsStr::new("-y"), OsStr::new("-i"), src.as_os_str(),
        OsStr::new("-frames:v"), OsStr::new("1"), OsStr::new("-flags"), OsStr::new("+bitexact"), poster.as_os_str(),
    ]))?;
    for &w in &c.widths {
        let scaled = st.tmp(&format!("poster-{}-{w}.png", c.id));
        ffmpeg_scale(&poster, &scaled, w)?;
        encode(cx, st, im, &format!("poster/{}", c.id), w, &bytes(&scaled)?)?;
    }
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// Environment (CC0 HDRI)

fn environment(cx: &mut Ctx<'_>, m: &Manifest, st: &Stage<'_>) -> Result<()> {
    let Some(e) = &m.environment else { return Ok(()) };
    let src = st.brand_dir.join(&e.file);
    let out = st.tmp(&format!("{}.ktx2", e.id));
    exec(cmd("ktx", [
        OsStr::new("create"), OsStr::new("--testrun"), OsStr::new("--format"), OsStr::new("R16G16B16A16_SFLOAT"),
        OsStr::new("--zstd"), OsStr::new("19"), OsStr::new("--threads"), OsStr::new("1"),
        src.as_os_str(), out.as_os_str(),
    ]))?;
    cx.put(&format!("env/{}.ktx2", e.id), bytes(&out)?)?;
    cx.put(&format!("env/{}.LICENSE.txt", e.id), format!("{}\nLicense: {}\nSource: {}\n", e.id, e.license, e.source))
}

// ---------------------------------------------------------------------------------------------
// wasm + WebGPU

const GPU_DEMO: &str = r#"<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Aphrody brand tile, WebGPU</title>
<style>html,body{margin:0;height:100%;background:#0f0f14;display:grid;place-items:center}aphrody-tile{display:block;width:min(80vmin,640px);aspect-ratio:1}aphrody-tile img,aphrody-tile canvas{width:100%;height:100%;display:block}</style>
<aphrody-tile data-texture="../icons/aphrody-labs/icon-512.png"><img src="../icons/aphrody-labs/icon.svg" alt="Aphrody Labs"></aphrody-tile>
<script type="module" src="brand-gpu.js"></script>
</html>
"#;

fn gpu(cx: &mut Ctx<'_>, m: &Manifest, st: &Stage<'_>) -> Result<()> {
    let Some(g) = &m.gpu else { return Ok(()) };
    let target_dir = std::env::var_os("CARGO_TARGET_DIR").map_or_else(|| st.root.join("target"), PathBuf::from);
    let root = st.root.display().to_string();
    let mut c = cmd("cargo", [
        "build".to_string(), "--quiet".into(), "--locked".into(), "-p".into(), g.krate.clone(), "--lib".into(), "--release".into(),
        "--target".into(), "wasm32-unknown-unknown".into(),
        "--config".into(), format!("profile.release.package.{}.opt-level=\"z\"", g.krate),
        // core from rust-src (-Zbuild-std): the pinned toolchain needs no prebuilt wasm32 std; no panic
        // locations, sources remapped: the wasm bytes do not depend on the checkout path.
        "-Zbuild-std=core".into(),
        "--config".into(), format!("target.wasm32-unknown-unknown.rustflags=[\"--remap-path-prefix={root}=/src\", \"-Zlocation-detail=none\"]"),
    ]);
    c.current_dir(&st.root).env("CARGO_TARGET_DIR", &target_dir);
    exec(c)?;
    let built = target_dir.join("wasm32-unknown-unknown").join("release").join(format!("{}.wasm", g.krate.replace('-', "_")));
    let wasm = st.tmp("brand-gpu.wasm");
    exec(cmd("wasm-opt", [OsStr::new("-Oz"), OsStr::new("--strip-debug"), OsStr::new("--strip-producers"), built.as_os_str(), OsStr::new("-o"), wasm.as_os_str()]))?;
    cx.put("gpu/brand-gpu.wasm", bytes(&wasm)?)?;
    let js = st.tmp("brand-gpu.js");
    let mut b = cmd("bun", [
        OsStr::new("build"), st.brand_dir.join(&g.loader).as_os_str(), OsStr::new("--target=browser"), OsStr::new("--format=esm"),
        OsStr::new("--minify"), OsStr::new("--outfile"), js.as_os_str(),
    ]);
    b.current_dir(&st.root);
    exec(b)?;
    cx.put("gpu/brand-gpu.js", bytes(&js)?)?;
    cx.put("gpu/index.html", GPU_DEMO)
}

// ---------------------------------------------------------------------------------------------
// Manifest

fn manifest(cx: &mut Ctx<'_>, m: &Manifest) -> Result<()> {
    let srcset = srcsets(cx);
    cx.put("img/srcset.json", serde_json::to_string_pretty(&srcset).unwrap_or_default() + "\n")?;
    let tools: BTreeMap<&str, String> = [
        ("hb-subset", version("hb-subset", &["--version"])),
        ("avifenc", version("avifenc", &["--version"])),
        ("cwebp", version("cwebp", &["-version"])),
        ("ktx", version("ktx", &["--version"])),
        ("ffmpeg", version("ffmpeg", &["-version"])),
        ("wasm-opt", version("wasm-opt", &["--version"])),
        ("bun", version("bun", &["--version"])),
        ("rustc", version("rustc", &["-V"])),
    ]
    .into_iter()
    .collect();
    let files: serde_json::Map<String, serde_json::Value> = cx
        .hashes
        .iter()
        .map(|(k, (n, h))| (k.clone(), serde_json::json!({ "size": n, "sha256": h })))
        .collect();
    let json = serde_json::json!({
        "name": m.brand.name,
        "version": m.brand.version,
        "base": format!("https://cdn.aphrody.com/brand/v{}/", m.brand.version),
        "cache": "public, max-age=31536000, immutable",
        "tools": tools,
        "files": files,
    });
    let text = serde_json::to_string_pretty(&json).unwrap_or_default() + "\n";
    let sha = sha256_hex(text.as_bytes());
    // Written outside put(): the manifest does not list itself; manifest.json.sha256 pins it.
    super::write(&cx.gen_dir.join("manifest.json"), &text)?;
    super::write(&cx.gen_dir.join("manifest.json.sha256"), format!("{sha}  manifest.json\n"))?;
    cx.report.files.push(("assets/brand/gen/manifest.json".into(), text.len() as u64));
    cx.report.manifest_sha256 = Some(sha);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sha256_of_abc() {
        assert_eq!(sha256_hex(b"abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    }

    #[test]
    fn fvar_reads_axes() {
        // Minimal sfnt: one table record (fvar) and an fvar with one wght axis 100..900, default 400.
        let mut f = vec![0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0];
        f.extend_from_slice(b"fvar");
        f.extend_from_slice(&[0, 0, 0, 0, 0, 0, 0, 28, 0, 0, 0, 36]);
        f.extend_from_slice(&[0, 1, 0, 0, 0, 16, 0, 2, 0, 1, 0, 20, 0, 0, 0, 0]);
        f.extend_from_slice(b"wght");
        for v in [100i32, 400, 900] {
            f.extend_from_slice(&(v << 16).to_be_bytes());
        }
        f.extend_from_slice(&[0, 0, 1, 0]);
        let axes = fvar_axes(&f);
        assert_eq!(axes, vec![("wght".to_string(), 100.0, 400.0, 900.0)]);
        assert_eq!(axis_descriptors(&axes), "font-weight:100 900;font-style:normal;");
        let slnt = vec![("slnt".to_string(), -10.0, 0.0, 0.0)];
        assert!(axis_descriptors(&slnt).contains("font-style:oblique 0deg 10deg;"));
    }

    #[test]
    fn view_box_and_uncolor() {
        let s = "<svg viewBox=\"0 -960 960 960\"><path fill=\"#000000\" d=\"M0 0Z\"/></svg>";
        assert_eq!(view_box(s), "0 -960 960 960");
        assert_eq!(uncolor(s), "<svg viewBox=\"0 -960 960 960\"><path d=\"M0 0Z\"/></svg>");
        assert_eq!(css_unicode_range("0000-00FF,0131"), "U+0000-00FF, U+0131");
    }
}
