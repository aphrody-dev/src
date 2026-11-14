//! Gamescope console UI primitives: geometry, spatial focus navigation, smoothing, and the quad painter that
//! turns a scene into GPU instance data. Pure CPU logic, unit-testable without a GPU.

/// Design resolution; the renderer letterboxes it into the canvas through [`crate::ScalingLayout`].
pub const W: f32 = 1920.0;
pub const H: f32 = 1080.0;

// Atlas layout shared with the web client (which rasterizes it) and the shader (which samples it).
pub const ATLAS: f32 = 2048.0;
pub const GLYPH_CELL: f32 = 72.0;
pub const GLYPH_COLS: usize = 14;
pub const GLYPH_PX: f32 = 52.0;
pub const GLYPH_ORIGIN_X: f32 = 10.0;
pub const GLYPH_BASELINE: f32 = 56.0;
pub const GLYPH_FIRST: u32 = 32;
pub const GLYPH_LAST: u32 = 255;
pub const ICON_X0: f32 = 1024.0;
pub const ICON_CELL: f32 = 128.0;
pub const ICON_COLS: usize = 8;

pub const KIND_FILL: f32 = 0.0;
pub const KIND_GLYPH: f32 = 1.0;
pub const KIND_ICON: f32 = 2.0;
pub const KIND_SHADOW: f32 = 3.0;
pub const KIND_RING: f32 = 4.0;
pub const KIND_ART: f32 = 5.0;
pub const KIND_MEDAL: f32 = 6.0;
pub const KIND_GLOW: f32 = 7.0;

pub type Color = [f32; 4];

pub fn rgb(hex: u32) -> Color {
    [
        ((hex >> 16) & 0xFF) as f32 / 255.0,
        ((hex >> 8) & 0xFF) as f32 / 255.0,
        (hex & 0xFF) as f32 / 255.0,
        1.0,
    ]
}

pub fn alpha(mut c: Color, a: f32) -> Color {
    c[3] *= a.clamp(0.0, 1.0);
    c
}

pub fn mix(a: Color, b: Color, t: f32) -> Color {
    let t = t.clamp(0.0, 1.0);
    [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t,
    ]
}

pub fn lerp(a: f32, b: f32, t: f32) -> f32 {
    a + (b - a) * t
}

/// HSV (all 0..1) to a color; used for the generative tile art palettes.
pub fn hsv(h: f32, s: f32, v: f32) -> Color {
    let h = h.rem_euclid(1.0) * 6.0;
    let i = h.floor();
    let f = h - i;
    let (p, q, t) = (v * (1.0 - s), v * (1.0 - s * f), v * (1.0 - s * (1.0 - f)));
    let (r, g, b) = match i as i32 % 6 {
        0 => (v, t, p),
        1 => (q, v, p),
        2 => (p, v, t),
        3 => (p, q, v),
        4 => (t, p, v),
        _ => (v, p, q),
    };
    [r, g, b, 1.0]
}

#[derive(Clone, Copy, Debug, PartialEq, Default)]
pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

impl Rect {
    pub const fn new(x: f32, y: f32, w: f32, h: f32) -> Self {
        Self { x, y, w, h }
    }
    pub fn cx(&self) -> f32 {
        self.x + self.w * 0.5
    }
    pub fn cy(&self) -> f32 {
        self.y + self.h * 0.5
    }
    pub fn contains(&self, px: f32, py: f32) -> bool {
        px >= self.x && px <= self.x + self.w && py >= self.y && py <= self.y + self.h
    }
    pub fn scaled(&self, s: f32) -> Rect {
        Rect::new(self.cx() - self.w * s * 0.5, self.cy() - self.h * s * 0.5, self.w * s, self.h * s)
    }
    pub fn inset(&self, d: f32) -> Rect {
        Rect::new(self.x + d, self.y + d, (self.w - 2.0 * d).max(0.0), (self.h - 2.0 * d).max(0.0))
    }
    pub fn moved(&self, dx: f32, dy: f32) -> Rect {
        Rect::new(self.x + dx, self.y + dy, self.w, self.h)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Dir {
    Up,
    Down,
    Left,
    Right,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Input {
    Dir(Dir),
    Select,
    Back,
    PrevTab,
    NextTab,
    Options,
}

impl Input {
    /// Codes shared with the JS side: 0..3 arrows, 4 select, 5 back, 6 previous tab, 7 next tab, 8 options.
    pub fn from_code(code: u32) -> Option<Input> {
        Some(match code {
            0 => Input::Dir(Dir::Up),
            1 => Input::Dir(Dir::Down),
            2 => Input::Dir(Dir::Left),
            3 => Input::Dir(Dir::Right),
            4 => Input::Select,
            5 => Input::Back,
            6 => Input::PrevTab,
            7 => Input::NextTab,
            8 => Input::Options,
            _ => return None,
        })
    }
}

/// Spatial focus navigation: the nearest item whose center lies strictly in the pressed direction, weighting the
/// perpendicular offset so that focus follows rows and columns the way a D-pad user expects.
pub fn spatial_next(rects: &[Rect], from: usize, dir: Dir) -> Option<usize> {
    let c = *rects.get(from)?;
    let (fx, fy) = (c.cx(), c.cy());
    let mut best: Option<(usize, f32)> = None;
    for (i, r) in rects.iter().enumerate() {
        if i == from {
            continue;
        }
        let (dx, dy) = (r.cx() - fx, r.cy() - fy);
        let (primary, secondary) = match dir {
            Dir::Right => (dx, dy.abs()),
            Dir::Left => (-dx, dy.abs()),
            Dir::Down => (dy, dx.abs()),
            Dir::Up => (-dy, dx.abs()),
        };
        if primary <= 1.0 {
            continue;
        }
        // Horizontal moves stay within the band of the current row.
        if matches!(dir, Dir::Left | Dir::Right) && secondary > (c.h + r.h) * 0.75 {
            continue;
        }
        let cost = primary + secondary * 3.0;
        if best.is_none_or(|(_, b)| cost < b) {
            best = Some((i, cost));
        }
    }
    best.map(|(i, _)| i)
}

/// Exponential smoothing toward a target (frame-rate independent).
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Smooth {
    pub v: f32,
    pub t: f32,
}

impl Smooth {
    pub const fn new(v: f32) -> Self {
        Self { v, t: v }
    }
    pub fn step(&mut self, dt: f32, rate: f32) {
        let k = 1.0 - (-rate * dt).exp();
        self.v += (self.t - self.v) * k;
        if (self.t - self.v).abs() < 1e-3 {
            self.v = self.t;
        }
    }
    pub fn settled(&self) -> bool {
        self.v == self.t
    }
}

/// X offsets of consecutive tiles of the given widths (selected tiles are wider, so neighbours are pushed aside).
pub fn row_xs(widths: &[f32], gap: f32) -> Vec<f32> {
    let mut x = 0.0;
    widths
        .iter()
        .map(|w| {
            let at = x;
            x += w + gap;
            at
        })
        .collect()
}

/// One GPU instance: 20 floats (rect, two colors, atlas uv, radius, border, kind, aux).
#[derive(Clone, Copy, Debug, Default, PartialEq)]
pub struct Quad {
    pub rect: [f32; 4],
    pub c0: Color,
    pub c1: Color,
    pub uv: [f32; 4],
    pub radius: f32,
    pub border: f32,
    pub kind: f32,
    pub aux: f32,
}

pub const QUAD_FLOATS: usize = 20;

impl Quad {
    pub fn to_floats(&self) -> [f32; QUAD_FLOATS] {
        let r = self.rect;
        let (a, b, u) = (self.c0, self.c1, self.uv);
        [
            r[0], r[1], r[2], r[3], a[0], a[1], a[2], a[3], b[0], b[1], b[2], b[3], u[0], u[1], u[2], u[3],
            self.radius, self.border, self.kind, self.aux,
        ]
    }
}

/// Collects quads for one frame and expands text into glyph quads using the measured advances.
pub struct Painter {
    pub quads: Vec<Quad>,
    advances: Vec<f32>,
}

impl Painter {
    pub fn new(advances: &[f32]) -> Self {
        Self { quads: Vec::with_capacity(512), advances: advances.to_vec() }
    }

    fn quad(&mut self, q: Quad) {
        self.quads.push(q);
    }

    pub fn fill(&mut self, r: Rect, c0: Color, c1: Color, radius: f32) {
        self.quad(Quad { rect: [r.x, r.y, r.w, r.h], c0, c1, radius, kind: KIND_FILL, ..Default::default() });
    }

    pub fn solid(&mut self, r: Rect, c: Color, radius: f32) {
        self.fill(r, c, c, radius);
    }

    pub fn ring(&mut self, r: Rect, c: Color, width: f32, radius: f32) {
        self.quad(Quad { rect: [r.x, r.y, r.w, r.h], c0: c, c1: c, radius, border: width, kind: KIND_RING, ..Default::default() });
    }

    pub fn shadow(&mut self, r: Rect, c: Color, blur: f32, radius: f32) {
        self.quad(Quad { rect: [r.x, r.y, r.w, r.h], c0: c, c1: c, radius, kind: KIND_SHADOW, aux: blur, ..Default::default() });
    }

    pub fn glow(&mut self, r: Rect, c: Color) {
        self.quad(Quad { rect: [r.x, r.y, r.w, r.h], c0: c, c1: c, kind: KIND_GLOW, ..Default::default() });
    }

    /// Generative tile art (own art): two palette colors and a seed, shaded in WGSL.
    pub fn art(&mut self, r: Rect, seed: f32, c0: Color, c1: Color, radius: f32) {
        self.quad(Quad { rect: [r.x, r.y, r.w, r.h], c0, c1, radius, kind: KIND_ART, aux: seed, ..Default::default() });
    }

    pub fn medal(&mut self, r: Rect, base: Color, light: Color, tier: f32) {
        self.quad(Quad { rect: [r.x, r.y, r.w, r.h], c0: base, c1: light, kind: KIND_MEDAL, aux: tier, ..Default::default() });
    }

    /// Atlas icon slot `slot`, multiplied by `tint`.
    pub fn icon(&mut self, r: Rect, slot: usize, tint: Color, radius: f32) {
        let x = ICON_X0 + (slot % ICON_COLS) as f32 * ICON_CELL;
        let y = (slot / ICON_COLS) as f32 * ICON_CELL;
        self.quad(Quad {
            rect: [r.x, r.y, r.w, r.h],
            c0: tint,
            c1: tint,
            uv: [x / ATLAS, y / ATLAS, ICON_CELL / ATLAS, ICON_CELL / ATLAS],
            radius,
            kind: KIND_ICON,
            ..Default::default()
        });
    }

    fn glyph_index(ch: char) -> usize {
        let c = ch as u32;
        (if (GLYPH_FIRST..=GLYPH_LAST).contains(&c) { c } else { '?' as u32 } - GLYPH_FIRST) as usize
    }

    /// Advance of one glyph in em units (default 0.56 until the client measured the real font).
    fn advance_em(&self, ch: char) -> f32 {
        self.advances.get(Self::glyph_index(ch)).copied().unwrap_or(0.56)
    }

    pub fn text_width(&self, s: &str, size: f32) -> f32 {
        s.chars().map(|c| self.advance_em(c) * size).sum()
    }

    /// Draws `s` with its em box top at `y`; returns the pen advance.
    pub fn text(&mut self, x: f32, y: f32, size: f32, color: Color, s: &str) -> f32 {
        if color[3] <= 0.003 {
            return self.text_width(s, size);
        }
        let k = size / GLYPH_PX;
        let baseline = y + size * 0.88;
        let mut pen = x;
        for ch in s.chars() {
            let idx = Self::glyph_index(ch);
            if ch != ' ' {
                let (cx, cy) = ((idx % GLYPH_COLS) as f32, (idx / GLYPH_COLS) as f32);
                self.quad(Quad {
                    rect: [pen - GLYPH_ORIGIN_X * k, baseline - GLYPH_BASELINE * k, GLYPH_CELL * k, GLYPH_CELL * k],
                    c0: color,
                    c1: color,
                    uv: [cx * GLYPH_CELL / ATLAS, cy * GLYPH_CELL / ATLAS, GLYPH_CELL / ATLAS, GLYPH_CELL / ATLAS],
                    kind: KIND_GLYPH,
                    ..Default::default()
                });
            }
            pen += self.advance_em(ch) * size;
        }
        pen - x
    }

    pub fn text_center(&mut self, cx: f32, y: f32, size: f32, color: Color, s: &str) {
        let w = self.text_width(s, size);
        self.text(cx - w * 0.5, y, size, color, s);
    }

    pub fn text_right(&mut self, right: f32, y: f32, size: f32, color: Color, s: &str) {
        let w = self.text_width(s, size);
        self.text(right - w, y, size, color, s);
    }

    pub fn flatten(&self) -> Vec<f32> {
        let mut v = Vec::with_capacity(self.quads.len() * QUAD_FLOATS);
        for q in &self.quads {
            v.extend_from_slice(&q.to_floats());
        }
        v
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn spatial_nav_follows_rows_and_columns() {
        // two rows of three
        let mut r = Vec::new();
        for row in 0..2 {
            for col in 0..3 {
                r.push(Rect::new(col as f32 * 120.0, row as f32 * 200.0, 100.0, 100.0));
            }
        }
        assert_eq!(spatial_next(&r, 0, Dir::Right), Some(1));
        assert_eq!(spatial_next(&r, 1, Dir::Down), Some(4));
        assert_eq!(spatial_next(&r, 4, Dir::Up), Some(1));
        assert_eq!(spatial_next(&r, 0, Dir::Left), None);
        assert_eq!(spatial_next(&r, 2, Dir::Right), None);
        assert_eq!(spatial_next(&r, 0, Dir::Up), None);
    }

    #[test]
    fn smooth_converges_and_settles() {
        let mut s = Smooth::new(0.0);
        s.t = 1.0;
        for _ in 0..600 {
            s.step(1.0 / 60.0, 14.0);
        }
        assert!(s.settled());
        assert_eq!(s.v, 1.0);
    }

    #[test]
    fn row_xs_pushes_neighbours_when_selected_is_wider() {
        let xs = row_xs(&[106.0, 181.0, 106.0], 24.0);
        assert_eq!(xs, vec![0.0, 130.0, 335.0]);
    }

    #[test]
    fn quads_flatten_to_20_floats_and_text_expands_to_glyphs() {
        let mut p = Painter::new(&[]);
        let w = p.text(0.0, 0.0, 52.0, [1.0; 4], "Hi a");
        assert!((w - 4.0 * 0.56 * 52.0).abs() < 1e-3);
        assert_eq!(p.quads.len(), 3); // the space draws nothing
        assert_eq!(p.flatten().len(), 3 * QUAD_FLOATS);
        assert_eq!(p.quads[0].kind, KIND_GLYPH);
    }

    #[test]
    fn measured_advances_are_used() {
        let mut adv = vec![0.5; 224];
        adv[(b'i' - 32) as usize] = 0.25;
        let p = Painter::new(&adv);
        assert!((p.text_width("ii", 100.0) - 50.0).abs() < 1e-3);
    }

    #[test]
    fn input_codes_round_trip() {
        assert_eq!(Input::from_code(4), Some(Input::Select));
        assert_eq!(Input::from_code(3), Some(Input::Dir(Dir::Right)));
        assert_eq!(Input::from_code(99), None);
    }

    #[test]
    fn hud_overlay_uses_first_party_taffy() {
        let rects = compute_hud_overlay_rects(1280.0, 720.0, 3);
        assert_eq!(rects.len(), 3);
        assert!(rects[0].x >= 24.0);
        assert!(rects[1].x > rects[0].x);
        assert_eq!(rects[0].height, 44.0);
    }
}

/// Computes horizontal overlay HUD pill bounding rects using first-party `taffy::TaffyTree`.
#[must_use]
pub fn compute_hud_overlay_rects(
    viewport_w: f32,
    viewport_h: f32,
    item_count: usize,
) -> Vec<taffy::LayoutRect> {
    if item_count == 0 {
        return Vec::new();
    }
    let mut tree: taffy::TaffyTree<()> = taffy::TaffyTree::new();
    let mut leaves = Vec::with_capacity(item_count);
    for _ in 0..item_count {
        let leaf = tree
            .new_leaf(taffy::Style {
                flex_grow: 1.0,
                size: taffy::Size {
                    width: taffy::style_helpers::auto(),
                    height: taffy::style_helpers::length(44.0),
                },
                ..taffy::Style::DEFAULT
            })
            .expect("hud leaf");
        leaves.push(leaf);
    }
    let root = tree
        .new_with_children(
            taffy::Style {
                display: taffy::Display::Flex,
                flex_direction: taffy::FlexDirection::Row,
                gap: taffy::Size {
                    width: taffy::style_helpers::length(16.0),
                    height: taffy::style_helpers::length(0.0),
                },
                padding: taffy::Rect {
                    left: taffy::style_helpers::length(24.0),
                    right: taffy::style_helpers::length(24.0),
                    top: taffy::style_helpers::length(20.0),
                    bottom: taffy::style_helpers::length(0.0),
                },
                size: taffy::Size {
                    width: taffy::style_helpers::length(viewport_w.max(64.0)),
                    height: taffy::style_helpers::length(viewport_h.max(64.0)),
                },
                ..taffy::Style::DEFAULT
            },
            &leaves,
        )
        .expect("hud root");
    tree.compute_layout(
        root,
        taffy::Size {
            width: taffy::AvailableSpace::Definite(viewport_w.max(64.0)),
            height: taffy::AvailableSpace::Definite(viewport_h.max(64.0)),
        },
    )
    .expect("hud compute layout");
    leaves
        .into_iter()
        .map(|id| {
            let l = tree.layout(id).expect("hud item layout");
            taffy::LayoutRect::from_taffy_layout(l, taffy::Point::ZERO)
        })
        .collect()
}
