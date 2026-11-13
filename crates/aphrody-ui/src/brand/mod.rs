// SPDX-License-Identifier: Apache-2.0
//! The Aphrody brand pipeline behind `ay brand build`.
//!
//! One source, `assets/brand/` (`brand.toml`, SVG templates in `src/`, Material Symbols in
//! `symbols/`), one output tree, `assets/brand/gen/`:
//!
//! | Output | Content |
//! | :-- | :-- |
//! | `logo/` | monograms and wordmarks per organisation, text outlined to paths |
//! | `icons/<id>/` | `icon.svg`, PNGs 16..1024, `favicon.ico`, `app.ico`, `apple-touch-icon.png`, `maskable-512.png`, `site.webmanifest` |
//! | `og/` | 1200 x 630 social cards (PNG and SVG) |
//! | `badges/` | static README badges |
//! | `banner/` | ANSI truecolor and plain banners for CLIs and TUIs |
//! | `profile/` | statistics cards from `docs/profile/stats.json` |
//!
//! Colors come from the shared design tokens, `packages/design/tokens/tokens.rs` (the M3
//! schemes and per-hue tonal palettes generated from brand.toml by Material Color Utilities),
//! included at compile time: no color science runs here. Everything is rasterized by resvg/tiny-skia and every SVG goes through usvg, which resolves
//! styles, shapes text with the pinned Google Sans Flex and writes plain paths: no output needs a
//! font, a script or a network request to display.

include!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../packages/design/tokens/tokens.rs"));

/// `0xRRGGBBAA` of tokens.rs to the `0xAARRGGBB` used here.
const fn argb(rgba: u32) -> u32 {
    rgba.rotate_right(8)
}
use resvg::{
    tiny_skia::{Pixmap, Transform},
    usvg,
};
use serde::Deserialize;
use std::{
    collections::BTreeMap,
    fmt::{self, Write as _},
    fs,
    path::{Path, PathBuf},
    sync::Arc,
};

/// PNG sides of every icon set (16..64 tab and taskbar, 180 apple-touch, 192/512 web manifest).
pub const PNG_SIZES: &[u32] = &[16, 24, 32, 48, 64, 128, 180, 192, 256, 512, 1024];
/// Images of `favicon.ico`.
pub const FAVICON_SIZES: &[u32] = &[16, 32, 48];
/// Images of the Windows application `.ico` (shell sizes up to 256 for the jumbo view).
pub const APP_ICO_SIZES: &[u32] = &[16, 20, 24, 32, 40, 48, 64, 256];

/// Build error.
#[derive(Debug)]
pub enum Error {
    Io(PathBuf, std::io::Error),
    Manifest(String),
    Svg(String),
    Render(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(p, e) => write!(f, "{}: {e}", p.display()),
            Self::Manifest(m) => write!(f, "brand.toml: {m}"),
            Self::Svg(m) => write!(f, "svg: {m}"),
            Self::Render(m) => write!(f, "render: {m}"),
        }
    }
}

impl std::error::Error for Error {}

type Result<T> = std::result::Result<T, Error>;

fn read(path: &Path) -> Result<String> {
    fs::read_to_string(path).map_err(|e| Error::Io(path.to_path_buf(), e))
}

fn write(path: &Path, bytes: impl AsRef<[u8]>) -> Result<()> {
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| Error::Io(dir.to_path_buf(), e))?;
    }
    fs::write(path, bytes).map_err(|e| Error::Io(path.to_path_buf(), e))
}

// ---------------------------------------------------------------------------------------------
// Manifest

#[derive(Debug, Deserialize)]
pub struct Manifest {
    pub brand: Brand,
    #[serde(default)]
    pub org: Vec<Org>,
    #[serde(default)]
    pub product: Vec<Product>,
    #[serde(default)]
    pub badge: Vec<Badge>,
}

#[derive(Debug, Deserialize)]
pub struct Brand {
    pub name: String,
    pub version: u32,
    pub seed: String,
    pub variant: String,
    pub accent: String,
    pub font: String,
    #[serde(default)]
    pub font_fallback: Vec<String>,
    pub font_file: String,
}

#[derive(Debug, Deserialize)]
pub struct Org {
    pub id: String,
    pub name: String,
    pub suffix: String,
    pub tagline: String,
    pub container: String,
    pub url: String,
}

#[derive(Debug, Deserialize)]
pub struct Product {
    pub id: String,
    pub name: String,
    pub symbol: String,
    pub hue: f64,
    pub tagline: String,
    pub path: String,
    #[serde(default)]
    pub deploy: Vec<String>,
    #[serde(default)]
    pub ico: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct Badge {
    pub id: String,
    pub label: String,
    pub value: String,
}

impl Manifest {
    pub fn load(path: &Path) -> Result<Self> {
        toml::from_str(&read(path)?).map_err(|e| Error::Manifest(e.to_string()))
    }
}

// ---------------------------------------------------------------------------------------------
// Color

/// `#RRGGBB` to opaque ARGB.
pub fn parse_hex(s: &str) -> Result<u32> {
    let h = s.strip_prefix('#').unwrap_or(s);
    if h.len() != 6 {
        return Err(Error::Manifest(format!("color {s}: expected #RRGGBB")));
    }
    u32::from_str_radix(h, 16)
        .map(|rgb| 0xFF00_0000 | rgb)
        .map_err(|_| Error::Manifest(format!("color {s}: not hexadecimal")))
}

/// Opaque ARGB to `#RRGGBB`.
#[must_use]
pub fn hex(argb: u32) -> String {
    format!("#{:06X}", argb & 0x00FF_FFFF)
}

/// WCAG 2.x relative luminance of an ARGB color.
#[must_use]
pub fn luminance(argb: u32) -> f64 {
    let ch = |shift: u32| {
        let c = f64::from((argb >> shift) & 0xFF) / 255.0;
        if c <= 0.039_28 { c / 12.92 } else { ((c + 0.055) / 1.055).powf(2.4) }
    };
    0.2126 * ch(16) + 0.7152 * ch(8) + 0.0722 * ch(0)
}

/// WCAG 2.x contrast ratio.
#[must_use]
pub fn contrast(a: u32, b: u32) -> f64 {
    let (la, lb) = (luminance(a), luminance(b));
    (la.max(lb) + 0.05) / (la.min(lb) + 0.05)
}

/// One M3 color scheme of packages/design/tokens/tokens.rs (kebab role name to ARGB).
#[derive(Debug, Clone, Default)]
pub struct Scheme(pub BTreeMap<String, u32>);

impl Scheme {
    /// ARGB of `role`; opaque magenta when the role is missing, which a review spots at once.
    #[must_use]
    pub fn argb(&self, role: &str) -> u32 {
        self.0.get(role).copied().unwrap_or(0xFFFF_00FF)
    }

    fn from_tokens(all: &[(&str, u32)]) -> Self {
        Self(all.iter().map(|(k, v)| ((*k).to_owned(), argb(*v))).collect())
    }
}

/// The shared design tokens of the monorepo (`@aphrody/design`, generated from brand.toml by
/// Material Color Utilities): the single source of the M3 schemes used here.
pub const DESIGN_TOKENS: &str = "packages/design/tokens/tokens.rs";

/// The resolved colors of the brand.
pub struct Palette {
    pub light: Scheme,
    pub dark: Scheme,
    pub accent: u32,
    pub primary_hue: f64,
    /// Near-black tile of the Dev organisation (neutral palette, tone 10).
    pub ink: u32,
}

impl Default for Palette {
    fn default() -> Self {
        Self::new()
    }
}

impl Palette {
    /// The schemes, accent and ink of the shared tokens (`DESIGN_TOKENS`, compiled in).
    #[must_use]
    pub fn new() -> Self {
        Self {
            light: Scheme::from_tokens(md::light::ALL),
            dark: Scheme::from_tokens(md::dark::ALL),
            accent: argb(md::BOLT),
            primary_hue: md::hue::PRIMARY,
            ink: argb(md::INK),
        }
    }

    /// Tile color of a product hue: HCT chroma 56, tone 40 (white glyph at >= 4.5:1).
    #[must_use]
    pub fn product(&self, hue: f64) -> u32 {
        argb(md::hue::at(&md::hue::TILE_40, hue))
    }

    /// `(container, glyph)` of an organisation tile.
    #[must_use]
    pub fn org(&self, container: &str) -> (u32, u32) {
        match container {
            "ink" => (self.ink, self.dark.argb("primary")),
            _ => (self.light.argb("primary"), self.light.argb("on-primary")),
        }
    }
}

// ---------------------------------------------------------------------------------------------
// SVG

/// Text shaping and rendering context: the pinned brand font, nothing from the system.
pub struct Svg {
    options: usvg::Options<'static>,
}

impl Svg {
    /// Loads `font_file` (absent: SVGs without text still work, text fails loudly).
    pub fn new(font_family: &str, font_file: &Path) -> Result<Self> {
        let mut db = usvg::fontdb::Database::new();
        if font_file.is_file() {
            db.load_font_data(fs::read(font_file).map_err(|e| Error::Io(font_file.to_path_buf(), e))?);
        }
        db.set_sans_serif_family(font_family);
        let mut options = usvg::Options::default();
        options.font_family = font_family.to_string();
        options.fontdb = Arc::new(db);
        Ok(Self { options })
    }

    /// `true` when the brand font is loaded.
    #[must_use]
    pub fn has_font(&self) -> bool {
        self.options.fontdb.len() > 0
    }

    pub fn tree(&self, svg: &str) -> Result<usvg::Tree> {
        usvg::Tree::from_str(svg, &self.options).map_err(|e| Error::Svg(e.to_string()))
    }

    /// Normalized, optimized SVG: styles resolved, text outlined to paths, 2-decimal coordinates.
    pub fn optimize(&self, svg: &str) -> Result<String> {
        let tree = self.tree(svg)?;
        let opt = usvg::WriteOptions {
            coordinates_precision: 2,
            transforms_precision: 5,
            indent: usvg::Indent::None,
            attributes_indent: usvg::Indent::None,
            ..usvg::WriteOptions::default()
        };
        Ok(tree.to_string(&opt))
    }

    /// Right edge of the drawn content, for sizing a canvas to its text.
    pub fn content_right(&self, svg: &str) -> Result<f32> {
        let tree = self.tree(svg)?;
        Ok(tree.root().abs_bounding_box().map_or(0.0, |r| r.right()))
    }

    /// Rasterizes to `w` x `h` (the SVG is scaled to fit the width).
    pub fn pixmap(&self, svg: &str, w: u32, h: u32) -> Result<Pixmap> {
        let tree = self.tree(svg)?;
        let mut pixmap = Pixmap::new(w, h).ok_or_else(|| Error::Render(format!("size {w}x{h}")))?;
        let k = w as f32 / tree.size().width();
        resvg::render(&tree, Transform::from_scale(k, k), &mut pixmap.as_mut());
        Ok(pixmap)
    }

    /// PNG at `k` times the SVG size (review previews).
    pub fn png_scaled(&self, svg: &str, k: f32) -> Result<Vec<u8>> {
        let size = self.tree(svg)?.size();
        let (w, h) = ((size.width() * k).ceil() as u32, (size.height() * k).ceil() as u32);
        self.png(svg, w, h)
    }

    pub fn png(&self, svg: &str, w: u32, h: u32) -> Result<Vec<u8>> {
        self.pixmap(svg, w, h)?.encode_png().map_err(|e| Error::Render(e.to_string()))
    }
}

/// Fills `{key}` placeholders.
#[must_use]
pub fn fill(template: &str, vars: &[(&str, &str)]) -> String {
    let mut out = template.to_string();
    for (k, v) in vars {
        out = out.replace(&format!("{{{k}}}"), v);
    }
    out
}

/// The children of the root `<svg>` element, to nest one drawing in another.
#[must_use]
pub fn inner(svg: &str) -> &str {
    let start = svg.find("<svg").and_then(|i| svg[i..].find('>').map(|j| i + j + 1)).unwrap_or(0);
    let end = svg.rfind("</svg>").unwrap_or(svg.len());
    &svg[start..end]
}

/// Removes XML comments, so that template documentation never reaches a filled drawing.
#[must_use]
pub fn strip_comments(svg: &str) -> String {
    let mut out = String::with_capacity(svg.len());
    let mut rest = svg;
    while let Some(i) = rest.find("<!--") {
        out.push_str(&rest[..i]);
        rest = rest[i..].find("-->").map_or("", |j| &rest[i + j + 3..]);
    }
    out.push_str(rest);
    out
}

/// Escapes text content for XML.
#[must_use]
pub fn xml_text(s: &str) -> String {
    s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;")
}

/// Path data of a Material Symbols SVG (`d` of its single path).
pub fn symbol_path(svg: &str) -> Result<String> {
    let i = svg.find(" d=\"").ok_or_else(|| Error::Svg("symbol without path".into()))? + 4;
    let j = svg[i..].find('"').ok_or_else(|| Error::Svg("unterminated path".into()))?;
    Ok(svg[i..i + j].to_string())
}

/// Small-size variant (under 48 px): drops the corner notch of product tiles and thins the cut
/// around the bolt of the monogram, which would otherwise fall under one pixel and blur.
#[must_use]
pub fn small(svg: &str) -> String {
    let mut out = svg.to_string();
    if let Some(i) = out.find("<path class=\"notch\"") {
        if let Some(j) = out[i..].find("/>") {
            out.replace_range(i..i + j + 2, "");
        }
    }
    out.replacen("stroke-width=\"3.2\"", "stroke-width=\"2\"", 1)
}

/// Same drawing with square corners, for full-bleed icons (apple-touch, maskable).
#[must_use]
pub fn full_bleed(svg: &str) -> String {
    svg.replacen("rx=\"12\"", "rx=\"0\"", 1)
}

// ---------------------------------------------------------------------------------------------
// ICO

/// ICO container of PNG-compressed images, smallest first (Windows Vista and later).
#[must_use]
pub fn ico(images: &[(u32, Vec<u8>)]) -> Vec<u8> {
    let count = images.len() as u16;
    let mut out = Vec::new();
    out.extend_from_slice(&0u16.to_le_bytes());
    out.extend_from_slice(&1u16.to_le_bytes());
    out.extend_from_slice(&count.to_le_bytes());
    let mut offset = 6 + 16 * u32::from(count);
    for (side, png) in images {
        let dim = if *side >= 256 { 0 } else { *side as u8 };
        out.extend_from_slice(&[dim, dim, 0, 0]);
        out.extend_from_slice(&1u16.to_le_bytes());
        out.extend_from_slice(&32u16.to_le_bytes());
        out.extend_from_slice(&(png.len() as u32).to_le_bytes());
        out.extend_from_slice(&offset.to_le_bytes());
        offset += png.len() as u32;
    }
    for (_, png) in images {
        out.extend_from_slice(png);
    }
    out
}

/// Sides of the images in an ICO, read back from its directory.
#[must_use]
pub fn ico_sides(bytes: &[u8]) -> Vec<u32> {
    if bytes.len() < 6 || bytes[2..4] != [1, 0] {
        return Vec::new();
    }
    let n = usize::from(u16::from_le_bytes([bytes[4], bytes[5]]));
    (0..n)
        .filter_map(|i| bytes.get(6 + 16 * i).map(|&w| if w == 0 { 256 } else { u32::from(w) }))
        .collect()
}

// ---------------------------------------------------------------------------------------------
// ANSI banner

/// Truecolor banner: the icon in half blocks (two pixels per cell), name and tagline beside it.
#[must_use]
pub fn ansi_banner(pixmap: &Pixmap, title: &str, tagline: &str, title_rgb: u32) -> String {
    let (w, h) = (pixmap.width(), pixmap.height());
    let px = |x: u32, y: u32| {
        let c = pixmap.pixel(x, y).map(|p| p.demultiply());
        c.filter(|c| c.alpha() >= 128).map(|c| (c.red(), c.green(), c.blue()))
    };
    let rows = h.div_ceil(2);
    let mut out = String::new();
    for row in 0..rows {
        for x in 0..w {
            match (px(x, row * 2), px(x, row * 2 + 1)) {
                (Some(t), Some(b)) => {
                    let _ = write!(out, "\x1b[38;2;{};{};{}m\x1b[48;2;{};{};{}m\u{2580}", t.0, t.1, t.2, b.0, b.1, b.2);
                }
                (Some(t), None) => {
                    let _ = write!(out, "\x1b[49m\x1b[38;2;{};{};{}m\u{2580}", t.0, t.1, t.2);
                }
                (None, Some(b)) => {
                    let _ = write!(out, "\x1b[49m\x1b[38;2;{};{};{}m\u{2584}", b.0, b.1, b.2);
                }
                (None, None) => out.push_str("\x1b[0m "),
            }
        }
        out.push_str("\x1b[0m");
        let (r, g, b) = ((title_rgb >> 16) & 0xFF, (title_rgb >> 8) & 0xFF, title_rgb & 0xFF);
        if row == rows / 2 - 1 {
            let _ = write!(out, "  \x1b[1;38;2;{r};{g};{b}m{title}\x1b[0m");
        } else if row == rows / 2 {
            let _ = write!(out, "  \x1b[2m{tagline}\x1b[0m");
        }
        out.push('\n');
    }
    out
}

/// Plain banner for terminals without color (`NO_COLOR`, logs).
#[must_use]
pub fn plain_banner(title: &str, tagline: &str) -> String {
    format!("   /\\\n  /~~\\   {title}\n /    \\  {tagline}\n")
}

// ---------------------------------------------------------------------------------------------
// Statistics card

#[derive(Debug, Deserialize)]
pub struct Stats {
    pub generated: String,
    pub source: String,
    pub accounts: Vec<AccountStats>,
}

#[derive(Debug, Deserialize)]
pub struct AccountStats {
    pub id: String,
    pub title: String,
    pub rows: Vec<(String, String)>,
    #[serde(default)]
    pub languages: Vec<(String, u64)>,
}

// ---------------------------------------------------------------------------------------------
// Build

/// Options of `ay brand build`.
#[derive(Debug, Clone, Default)]
pub struct BuildOptions {
    /// Monorepo root (the directory holding `assets/brand`).
    pub root: PathBuf,
    /// Copy web icon sets and `.ico` files to the `deploy` and `ico` paths of `brand.toml`.
    pub deploy: bool,
}

/// What a build wrote, relative to the root.
#[derive(Debug, Default)]
pub struct Report {
    pub files: Vec<(String, u64)>,
    pub deployed: Vec<String>,
    pub warnings: Vec<String>,
}

struct Ctx<'a> {
    root: &'a Path,
    gen_dir: PathBuf,
    svg: Svg,
    report: Report,
}

impl Ctx<'_> {
    fn put(&mut self, rel: &str, bytes: impl AsRef<[u8]>) -> Result<()> {
        let bytes = bytes.as_ref();
        write(&self.gen_dir.join(rel), bytes)?;
        self.report.files.push((format!("assets/brand/gen/{rel}"), bytes.len() as u64));
        Ok(())
    }
}

/// Renders the whole brand.
pub fn build(opts: &BuildOptions) -> Result<Report> {
    let brand_dir = opts.root.join("assets").join("brand");
    let manifest = Manifest::load(&brand_dir.join("brand.toml"))?;
    let palette = Palette::new();
    let svg = Svg::new(&manifest.brand.font, &brand_dir.join(&manifest.brand.font_file))?;
    if !svg.has_font() {
        return Err(Error::Manifest(format!(
            "{} missing: run `bun assets/brand/fetch.ts` first",
            manifest.brand.font_file
        )));
    }
    let gen_dir = brand_dir.join("gen");
    let mut cx = Ctx { root: &opts.root, gen_dir, svg, report: Report::default() };
    let src = |name: &str| read(&brand_dir.join("src").join(name)).map(|s| if name.ends_with(".svg") { strip_comments(&s) } else { s });
    let (mark_t, tile_t, word_t, og_t) = (src("mark.svg")?, src("tile.svg")?, src("wordmark.svg")?, src("og.svg")?);

    let accent = hex(palette.accent);
    let font = font_stack(&manifest.brand);

    // Organisations: monogram, wordmarks, icon set, social card, banner.
    for org in &manifest.org {
        let (container, glyph) = palette.org(&org.container);
        let mark = fill(&mark_t, &[("container", &hex(container)), ("glyph", &hex(glyph)), ("bolt", &accent)]);
        cx.put(&format!("logo/{}.svg", org.id), cx.svg.optimize(&mark)?)?;
        for dark in [false, true] {
            let scheme = if dark { &palette.dark } else { &palette.light };
            let vars = |width: &str| {
                fill(&word_t, &[
                    ("width", width),
                    ("mark", inner(&mark)),
                    ("font", &font),
                    ("ink", &hex(scheme.argb("on-surface"))),
                    ("suffix_color", &hex(scheme.argb("primary"))),
                    ("name", &xml_text(&org.name)),
                    ("suffix", &xml_text(&org.suffix)),
                ])
            };
            let right = cx.svg.content_right(&vars("800"))?;
            let width = format!("{}", (right + 8.0).ceil() as u32);
            let theme = if dark { "dark" } else { "light" };
            cx.put(&format!("logo/{}-wordmark-{theme}.svg", org.id), cx.svg.optimize(&vars(&width))?)?;
            cx.put(&format!("preview/{}-wordmark-{theme}.png", org.id), cx.svg.png_scaled(&vars(&width), 3.0)?)?;
        }
        let title = format!("{} {}", org.name, org.suffix);
        icon_set(&mut cx, &org.id, &title, &mark, container)?;
        social(&mut cx, &og_t, &palette, &font, &org.id, &mark, &title, &org.tagline, &org.url)?;
        banner(&mut cx, &org.id, &mark, &title, &org.tagline, palette.dark.argb("primary"))?;
    }

    // Products: tile, icon set, social card, banner, deploy.
    for p in &manifest.product {
        let sym_file = brand_dir.join("symbols").join(format!("{}.svg", p.symbol));
        let symbol = symbol_path(&read(&sym_file)?)?;
        let container = palette.product(p.hue);
        let glyph = 0xFFFF_FFFF;
        let ratio = contrast(glyph, container);
        if ratio < 4.5 {
            cx.report.warnings.push(format!("{}: glyph contrast {ratio:.2} < 4.5", p.id));
        }
        let tile = fill(&tile_t, &[
            ("container", &hex(container)),
            ("glyph", &hex(glyph)),
            ("bolt", &accent),
            ("symbol", &symbol),
        ]);
        icon_set(&mut cx, &p.id, &p.name, &tile, container)?;
        let url = format!("github.com/aphrody-labs/src/tree/main/{}", p.path);
        social(&mut cx, &og_t, &palette, &font, &p.id, &tile, &p.name, &p.tagline, &url)?;
        banner(&mut cx, &p.id, &tile, &p.name, &p.tagline, argb(md::hue::at(&md::hue::TILE_80, p.hue)))?;
        if opts.deploy {
            deploy(&mut cx, p)?;
        }
    }

    badges(&mut cx, &manifest, &palette, &font)?;
    stats_cards(&mut cx, &palette, &font)?;

    // Index of the output, for the CDN upload and the archive of a build.
    let mut index = String::from("{\n  \"version\": ");
    let _ = write!(index, "{},\n  \"files\": {{\n", manifest.brand.version);
    let files: Vec<String> = cx
        .report
        .files
        .iter()
        .map(|(f, n)| format!("    \"{}\": {n}", f.trim_start_matches("assets/brand/gen/")))
        .collect();
    index.push_str(&files.join(",\n"));
    index.push_str("\n  }\n}\n");
    cx.put("index.json", index)?;
    Ok(cx.report)
}

fn font_stack(brand: &Brand) -> String {
    std::iter::once(brand.font.as_str())
        .chain(brand.font_fallback.iter().map(String::as_str))
        .map(|f| if f.contains(' ') { format!("'{f}'") } else { f.to_string() })
        .collect::<Vec<_>>()
        .join(", ")
}

fn icon_set(cx: &mut Ctx<'_>, id: &str, name: &str, drawing: &str, theme: u32) -> Result<()> {
    let dir = format!("icons/{id}");
    let optimized = cx.svg.optimize(drawing)?;
    cx.put(&format!("{dir}/icon.svg"), &optimized)?;
    let mut pngs = BTreeMap::new();
    let small_drawing = small(drawing);
    let at = |s: u32| if s < 48 { small_drawing.as_str() } else { drawing };
    for &s in PNG_SIZES {
        let png = cx.svg.png(at(s), s, s)?;
        cx.put(&format!("{dir}/icon-{s}.png"), &png)?;
        pngs.insert(s, png);
    }
    for &s in &[20u32, 40] {
        pngs.insert(s, cx.svg.png(at(s), s, s)?);
    }
    let pick = |sizes: &[u32]| sizes.iter().map(|s| (*s, pngs[s].clone())).collect::<Vec<_>>();
    cx.put(&format!("{dir}/favicon.ico"), ico(&pick(FAVICON_SIZES)))?;
    cx.put(&format!("{dir}/app.ico"), ico(&pick(APP_ICO_SIZES)))?;
    let bleed = full_bleed(drawing);
    cx.put(&format!("{dir}/apple-touch-icon.png"), cx.svg.png(&bleed, 180, 180)?)?;
    cx.put(&format!("{dir}/maskable-512.png"), cx.svg.png(&bleed, 512, 512)?)?;
    let manifest = serde_json::json!({
        "name": name,
        "short_name": name,
        "icons": [
            { "src": "icon.svg", "sizes": "any", "type": "image/svg+xml" },
            { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
            { "src": "icon-512.png", "sizes": "512x512", "type": "image/png" },
            { "src": "maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
        ],
        "theme_color": hex(theme),
        "background_color": hex(theme),
        "display": "standalone"
    });
    cx.put(&format!("{dir}/site.webmanifest"), serde_json::to_string_pretty(&manifest).unwrap_or_default() + "\n")
}

#[allow(clippy::too_many_arguments)]
fn social(cx: &mut Ctx<'_>, og_t: &str, p: &Palette, font: &str, id: &str, mark: &str, title: &str, tagline: &str, url: &str) -> Result<()> {
    let s = &p.dark;
    let svg = fill(og_t, &[
        ("bg", &hex(s.argb("surface-container-lowest"))),
        ("band", &hex(s.argb("primary-container"))),
        ("accent", &hex(p.accent)),
        ("mark", inner(mark)),
        ("font", font),
        ("ink", &hex(s.argb("on-surface"))),
        ("muted", &hex(s.argb("on-surface-variant"))),
        ("link", &hex(s.argb("primary"))),
        ("title", &xml_text(title)),
        ("tagline", &xml_text(tagline)),
        ("url", &xml_text(url)),
    ]);
    // Text extent only: drop the background and the bands from the template.
    let probe: String = og_t.lines().filter(|l| !l.contains("{bg}") && !l.contains("{band}") && !l.contains("{accent}")).collect::<Vec<_>>().join("\n");
    let probe = fill(&probe, &[("mark", ""), ("font", font), ("ink", "#000"), ("muted", "#000"), ("link", "#000"), ("title", &xml_text(title)), ("tagline", &xml_text(tagline)), ("url", &xml_text(url))]);
    let right = cx.svg.content_right(&probe)?;
    // The first band starts at x=964 on the tagline baseline (y=436).
    if right > 955.0 {
        cx.report.warnings.push(format!("og/{id}: text reaches x={right:.0}, into the speed bands"));
    }
    cx.put(&format!("og/{id}.svg"), cx.svg.optimize(&svg)?)?;
    cx.put(&format!("og/{id}.png"), cx.svg.png(&svg, 1200, 630)?)
}

fn banner(cx: &mut Ctx<'_>, id: &str, drawing: &str, title: &str, tagline: &str, title_rgb: u32) -> Result<()> {
    let px = cx.svg.pixmap(&small(drawing), 16, 16)?;
    cx.put(&format!("banner/{id}.ansi"), ansi_banner(&px, title, tagline, title_rgb))?;
    cx.put(&format!("banner/{id}.txt"), plain_banner(title, tagline))
}

fn badges(cx: &mut Ctx<'_>, m: &Manifest, p: &Palette, font: &str) -> Result<()> {
    let toolchain = read(&cx.root.join("rust-toolchain.toml"))
        .ok()
        .and_then(|t| t.parse::<toml::Table>().ok())
        .and_then(|t| t.get("toolchain")?.get("channel")?.as_str().map(str::to_string));
    let measure = |svg: &Svg, text: &str, weight: u32| -> Result<f32> {
        let probe = format!(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"22\"><text x=\"0\" y=\"15\" font-family=\"{font}\" font-size=\"12\" font-weight=\"{weight}\">{}</text></svg>",
            xml_text(text)
        );
        svg.content_right(&probe)
    };
    for b in &m.badge {
        let value = match b.value.as_str() {
            "@rust-toolchain" => match &toolchain {
                Some(v) => v.clone(),
                None => {
                    cx.report.warnings.push(format!("badge {}: rust-toolchain.toml unreadable", b.id));
                    continue;
                }
            },
            v => v.to_string(),
        };
        let lw = (measure(&cx.svg, &b.label, 450)? + 20.0).ceil();
        let vw = (measure(&cx.svg, &value, 650)? + 20.0).ceil();
        let w = lw + vw;
        let svg = format!(
            "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{w}\" height=\"22\" viewBox=\"0 0 {w} 22\" role=\"img\" aria-label=\"{label}: {value}\">\
<rect width=\"{w}\" height=\"22\" rx=\"11\" fill=\"{vbg}\"/>\
<path d=\"M11 0H{lw}V22H11A11 11 0 0 1 11 0Z\" fill=\"{lbg}\"/>\
<text x=\"10\" y=\"15\" font-family=\"{font}\" font-size=\"12\" font-weight=\"450\" fill=\"{lfg}\">{label}</text>\
<text x=\"{vx}\" y=\"15\" font-family=\"{font}\" font-size=\"12\" font-weight=\"650\" fill=\"{vfg}\">{value}</text></svg>",
            label = xml_text(&b.label),
            value = xml_text(&value),
            vbg = hex(p.light.argb("primary")),
            lbg = hex(p.ink),
            lfg = hex(p.dark.argb("on-surface")),
            vfg = hex(p.light.argb("on-primary")),
            vx = lw + 10.0,
        );
        cx.put(&format!("badges/{}.svg", b.id), cx.svg.optimize(&svg)?)?;
    }
    Ok(())
}

fn stats_cards(cx: &mut Ctx<'_>, p: &Palette, font: &str) -> Result<()> {
    let path = cx.root.join("docs").join("profile").join("stats.json");
    let Ok(text) = read(&path) else { return Ok(()) };
    let stats: Stats = serde_json::from_str(&text).map_err(|e| Error::Manifest(format!("stats.json: {e}")))?;
    for (theme, s) in [("light", &p.light), ("dark", &p.dark)] {
        for a in &stats.accounts {
            let w = 480.0_f32;
            let rows_h = 28.0 * a.rows.len() as f32;
            let has_lang = !a.languages.is_empty();
            let h = 64.0 + rows_h + if has_lang { 98.0 } else { 0.0 } + 32.0;
            let mut svg = format!(
                "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"{w}\" height=\"{h}\" viewBox=\"0 0 {w} {h}\" role=\"img\" aria-label=\"{t}\"><title>{t}</title>\
<rect x=\"0.5\" y=\"0.5\" width=\"{w1}\" height=\"{h1}\" rx=\"16\" fill=\"{bg}\" stroke=\"{line}\"/>\
<text x=\"24\" y=\"42\" font-family=\"{font}\" font-size=\"20\" font-weight=\"650\" fill=\"{ink}\">{t}</text>",
                t = xml_text(&a.title),
                w1 = w - 1.0,
                h1 = h - 1.0,
                bg = hex(s.argb("surface-container-low")),
                line = hex(s.argb("outline-variant")),
                ink = hex(s.argb("on-surface")),
            );
            let mut y = 76.0;
            for (k, v) in &a.rows {
                let _ = write!(
                    svg,
                    "<text x=\"24\" y=\"{y}\" font-family=\"{font}\" font-size=\"14\" fill=\"{m}\">{k}</text>\
<text x=\"456\" y=\"{y}\" text-anchor=\"end\" font-family=\"{font}\" font-size=\"14\" font-weight=\"650\" fill=\"{ink}\">{v}</text>",
                    m = hex(s.argb("on-surface-variant")),
                    ink = hex(s.argb("on-surface")),
                    k = xml_text(k),
                    v = xml_text(v),
                );
                y += 28.0;
            }
            if has_lang {
                let total: u64 = a.languages.iter().map(|l| l.1).sum::<u64>().max(1);
                let top: Vec<_> = a.languages.iter().take(5).collect();
                let bar_y = y - 4.0;
                let _ = write!(svg, "<clipPath id=\"bar\"><rect x=\"24\" y=\"{bar_y}\" width=\"432\" height=\"10\" rx=\"5\"/></clipPath><g clip-path=\"url(#bar)\"><rect x=\"24\" y=\"{bar_y}\" width=\"432\" height=\"10\" fill=\"{}\"/>", hex(s.argb("surface-container-highest")));
                let mut x = 24.0_f32;
                let tones = if theme == "dark" { &md::hue::SERIES_70 } else { &md::hue::SERIES_45 };
                let colors: Vec<u32> = (0..top.len())
                    .map(|i| argb(md::hue::at(tones, p.primary_hue + 72.0 * i as f64)))
                    .collect();
                for (i, (_, n)) in top.iter().enumerate() {
                    let lw = 432.0 * (*n as f32) / total as f32;
                    let _ = write!(svg, "<rect x=\"{x}\" y=\"{bar_y}\" width=\"{lw}\" height=\"10\" fill=\"{}\"/>", hex(colors[i]));
                    x += lw;
                }
                svg.push_str("</g>");
                let mut lx = 24.0_f32;
                let mut ly = bar_y + 36.0;
                for (i, (name, n)) in top.iter().enumerate() {
                    let pct = 100.0 * (*n as f64) / total as f64;
                    let label = format!("{name} {pct:.1}%");
                    if lx + 14.0 + 7.2 * label.chars().count() as f32 > 456.0 {
                        lx = 24.0;
                        ly += 22.0;
                    }
                    let _ = write!(
                        svg,
                        "<circle cx=\"{cx}\" cy=\"{cy}\" r=\"5\" fill=\"{c}\"/><text x=\"{tx}\" y=\"{ly}\" font-family=\"{font}\" font-size=\"12\" fill=\"{m}\">{l}</text>",
                        cx = lx + 5.0,
                        cy = ly - 4.0,
                        c = hex(colors[i]),
                        tx = lx + 14.0,
                        m = hex(s.argb("on-surface-variant")),
                        l = xml_text(&label),
                    );
                    lx += 14.0 + 7.2 * label.chars().count() as f32 + 14.0;
                }
            }
            let _ = write!(
                svg,
                "<text x=\"24\" y=\"{fy}\" font-family=\"{font}\" font-size=\"11\" fill=\"{m}\">{src}, {gen}</text></svg>",
                fy = h - 18.0,
                m = hex(s.argb("outline")),
                src = xml_text(&stats.source),
                gen = xml_text(&stats.generated),
            );
            cx.put(&format!("profile/stats-{}-{theme}.svg", a.id), cx.svg.optimize(&svg)?)?;
            cx.put(&format!("preview/stats-{}-{theme}.png", a.id), cx.svg.png_scaled(&svg, 2.0)?)?;
        }
    }
    Ok(())
}

fn deploy(cx: &mut Ctx<'_>, p: &Product) -> Result<()> {
    let set = cx.gen_dir.join("icons").join(&p.id);
    let copy = |from: &Path, to: &Path| -> Result<()> {
        let bytes = fs::read(from).map_err(|e| Error::Io(from.to_path_buf(), e))?;
        write(to, bytes)
    };
    for dir in &p.deploy {
        let dst = cx.root.join(dir);
        for (from, to) in [
            ("favicon.ico", "favicon.ico"),
            ("icon.svg", "favicon.svg"),
            ("apple-touch-icon.png", "apple-touch-icon.png"),
            ("icon-192.png", "icon-192.png"),
            ("icon-512.png", "icon-512.png"),
            ("maskable-512.png", "maskable-512.png"),
            ("site.webmanifest", "site.webmanifest"),
        ] {
            copy(&set.join(from), &dst.join(to))?;
        }
        copy(&cx.gen_dir.join("og").join(format!("{}.png", p.id)), &dst.join("og-image.png"))?;
        cx.report.deployed.push(dir.clone());
    }
    for target in &p.ico {
        copy(&set.join("app.ico"), &cx.root.join(target))?;
        cx.report.deployed.push(target.clone());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hex_round_trip() {
        assert_eq!(hex(parse_hex("#3355ff").unwrap()), "#3355FF");
        assert!(parse_hex("#123").is_err());
    }

    #[test]
    fn contrast_bounds() {
        assert!((contrast(0xFFFF_FFFF, 0xFF00_0000) - 21.0).abs() < 1e-9);
        assert!((contrast(0xFF77_7777, 0xFF77_7777) - 1.0).abs() < 1e-9);
    }

    #[test]
    fn ico_directory_reads_back() {
        let bytes = ico(&[(16, vec![1, 2]), (256, vec![3])]);
        assert_eq!(ico_sides(&bytes), vec![16, 256]);
        assert_eq!(bytes.len(), 6 + 32 + 3);
    }

    #[test]
    fn templates_fill_and_nest() {
        let s = fill("<svg a=\"{x}\"><g>{x}</g></svg>", &[("x", "1")]);
        assert_eq!(s, "<svg a=\"1\"><g>1</g></svg>");
        assert_eq!(inner(&s), "<g>1</g>");
        let tile = "<svg><rect/><path class=\"notch\" d=\"M1\"/><path class=\"bolt-cut\" stroke-width=\"3.2\"/></svg>";
        assert_eq!(small(tile), "<svg><rect/><path class=\"bolt-cut\" stroke-width=\"2\"/></svg>");
        assert_eq!(strip_comments("a<!-- {x} -->b<!--c-->"), "ab");
        assert_eq!(symbol_path("<svg><path d=\"M0 0Z\"/></svg>").unwrap(), "M0 0Z");
    }

    #[test]
    fn product_tiles_keep_white_glyph_readable() {
        let p = Palette::new();
        assert_eq!(hex(p.light.argb("primary")), "#1242FF");
        for hue in (0..360).step_by(15) {
            let c = p.product(f64::from(hue));
            assert!(contrast(0xFFFF_FFFF, c) >= 4.5, "hue {hue}: {}", hex(c));
        }
        let (c, g) = p.org("primary");
        assert!(contrast(c, g) >= 4.5);
        let (c, g) = p.org("ink");
        assert!(contrast(c, g) >= 4.5);
    }

    #[test]
    fn sources_render_without_font() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../assets/brand/src");
        let svg = Svg::new("X", Path::new("")).unwrap();
        let mark = fill(&strip_comments(&read(&root.join("mark.svg")).unwrap()), &[("container", "#3355FF"), ("glyph", "#FFFFFF"), ("bolt", "#FFB300")]);
        let png = svg.png(&mark, 32, 32).unwrap();
        assert_eq!(&png[1..4], b"PNG");
        let banner = ansi_banner(&svg.pixmap(&mark, 16, 16).unwrap(), "t", "g", 0xFF11_2233);
        assert_eq!(banner.lines().count(), 8);
    }
}
