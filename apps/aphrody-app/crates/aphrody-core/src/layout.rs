//! Tiling layout algorithms (own small implementation, no external deps):
//! dwindle (Hyprland style), cosmic grid (COSMIC style), niri scroll (infinite
//! horizontal strip) and floating.

use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, PartialEq, Default, Serialize, Deserialize)]
pub struct Rect {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
}

impl Rect {
    pub const fn new(x: f32, y: f32, w: f32, h: f32) -> Self {
        Rect { x, y, w, h }
    }
    pub fn right(&self) -> f32 {
        self.x + self.w
    }
    pub fn bottom(&self) -> f32 {
        self.y + self.h
    }
    pub fn area(&self) -> f32 {
        self.w.max(0.0) * self.h.max(0.0)
    }
    pub fn inset(&self, d: f32) -> Rect {
        Rect { x: self.x + d, y: self.y + d, w: (self.w - 2.0 * d).max(0.0), h: (self.h - 2.0 * d).max(0.0) }
    }
    pub fn contains(&self, px: f32, py: f32) -> bool {
        px >= self.x && px < self.right() && py >= self.y && py < self.bottom()
    }
    pub fn intersection_area(&self, o: &Rect) -> f32 {
        let w = self.right().min(o.right()) - self.x.max(o.x);
        let h = self.bottom().min(o.bottom()) - self.y.max(o.y);
        if w > 0.0 && h > 0.0 { w * h } else { 0.0 }
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Default, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LayoutKind {
    #[default]
    Dwindle,
    CosmicGrid,
    NiriScroll,
    Floating,
}

impl LayoutKind {
    pub const ALL: [LayoutKind; 4] =
        [LayoutKind::Dwindle, LayoutKind::CosmicGrid, LayoutKind::NiriScroll, LayoutKind::Floating];

    pub fn name(&self) -> &'static str {
        match self {
            LayoutKind::Dwindle => "dwindle",
            LayoutKind::CosmicGrid => "cosmic_grid",
            LayoutKind::NiriScroll => "niri_scroll",
            LayoutKind::Floating => "floating",
        }
    }

    pub fn parse(s: &str) -> Option<LayoutKind> {
        LayoutKind::ALL.into_iter().find(|k| k.name() == s)
    }

    pub fn next(&self) -> LayoutKind {
        let i = LayoutKind::ALL.iter().position(|k| k == self).unwrap_or(0);
        LayoutKind::ALL[(i + 1) % LayoutKind::ALL.len()]
    }
}

/// Apply gap semantics: tiles are computed in the area inset by gap/2 and each
/// tile is then inset by gap/2, giving `gap` between tiles and at the edges.
fn finish(tiles: Vec<Rect>, gap: f32) -> Vec<Rect> {
    tiles.into_iter().map(|r| r.inset(gap / 2.0)).collect()
}

pub fn dwindle(area: Rect, n: usize, gap: f32) -> Vec<Rect> {
    let mut rest = area.inset(gap / 2.0);
    let mut out = Vec::with_capacity(n);
    for i in 0..n {
        if i + 1 == n {
            out.push(rest);
            break;
        }
        if rest.w >= rest.h {
            let half = rest.w / 2.0;
            out.push(Rect::new(rest.x, rest.y, half, rest.h));
            rest = Rect::new(rest.x + half, rest.y, rest.w - half, rest.h);
        } else {
            let half = rest.h / 2.0;
            out.push(Rect::new(rest.x, rest.y, rest.w, half));
            rest = Rect::new(rest.x, rest.y + half, rest.w, rest.h - half);
        }
    }
    finish(out, gap)
}

pub fn cosmic_grid(area: Rect, n: usize, gap: f32) -> Vec<Rect> {
    if n == 0 {
        return Vec::new();
    }
    let a = area.inset(gap / 2.0);
    let cols = (n as f32).sqrt().ceil() as usize;
    let rows = n.div_ceil(cols);
    let cell_h = a.h / rows as f32;
    let mut out = Vec::with_capacity(n);
    for r in 0..rows {
        let in_row = if r + 1 == rows { n - cols * (rows - 1) } else { cols };
        let cell_w = a.w / in_row as f32;
        for c in 0..in_row {
            out.push(Rect::new(a.x + c as f32 * cell_w, a.y + r as f32 * cell_h, cell_w, cell_h));
        }
    }
    finish(out, gap)
}

/// Niri-style scrolling strip. Every window is a full-height column of
/// `ratio * area.w`. `scroll` is the strip offset and is adjusted minimally so
/// that the focused column is fully visible.
pub fn niri_scroll(area: Rect, n: usize, focus: usize, ratio: f32, scroll: &mut f32, gap: f32) -> Vec<Rect> {
    if n == 0 {
        *scroll = 0.0;
        return Vec::new();
    }
    let a = area.inset(gap / 2.0);
    let col_w = (a.w * ratio.clamp(0.1, 1.0)).max(1.0);
    let total = col_w * n as f32;
    let fx = col_w * focus.min(n - 1) as f32;
    if fx < *scroll {
        *scroll = fx;
    } else if fx + col_w > *scroll + a.w {
        *scroll = fx + col_w - a.w;
    }
    *scroll = scroll.clamp(0.0, (total - a.w).max(0.0));
    let out = (0..n).map(|i| Rect::new(a.x + i as f32 * col_w - *scroll, a.y, col_w, a.h)).collect();
    finish(out, gap)
}

#[cfg(test)]
mod tests {
    use super::*;

    const OUT: Rect = Rect::new(0.0, 0.0, 1920.0, 1080.0);

    fn assert_partition(tiles: &[Rect], area: Rect) {
        let total: f32 = tiles.iter().map(Rect::area).sum();
        assert!((total - area.area()).abs() < 1.0, "coverage {total} vs {}", area.area());
        for (i, a) in tiles.iter().enumerate() {
            assert!(a.x >= area.x - 0.01 && a.right() <= area.right() + 0.01);
            assert!(a.y >= area.y - 0.01 && a.bottom() <= area.bottom() + 0.01);
            for b in &tiles[i + 1..] {
                assert!(a.intersection_area(b) < 0.5, "overlap {a:?} {b:?}");
            }
        }
    }

    #[test]
    fn dwindle_partitions_area() {
        for n in 1..=9 {
            assert_partition(&dwindle(OUT, n, 0.0), OUT);
        }
        let t = dwindle(OUT, 3, 0.0);
        assert_eq!(t[0], Rect::new(0.0, 0.0, 960.0, 1080.0));
        assert_eq!(t[1], Rect::new(960.0, 0.0, 960.0, 540.0));
    }

    #[test]
    fn grid_partitions_area() {
        for n in 1..=12 {
            assert_partition(&cosmic_grid(OUT, n, 0.0), OUT);
        }
        assert_eq!(cosmic_grid(OUT, 5, 0.0).len(), 5);
    }

    #[test]
    fn gaps_separate_tiles() {
        let t = dwindle(OUT, 2, 10.0);
        assert!((t[1].x - t[0].right() - 10.0).abs() < 0.01);
        assert!((t[0].x - 10.0).abs() < 0.01, "edge gap equals gap");
    }

    #[test]
    fn niri_keeps_focus_visible() {
        let mut s = 0.0;
        for focus in [0, 1, 2, 5, 3, 0, 5] {
            let t = niri_scroll(OUT, 6, focus, 0.5, &mut s, 0.0);
            let f = t[focus];
            assert!(f.x >= -0.01 && f.right() <= OUT.right() + 0.01, "focus {focus} offscreen {f:?}");
            assert_eq!(f.h, OUT.h);
        }
        let t = niri_scroll(OUT, 6, 5, 0.5, &mut s, 0.0);
        assert!(t[0].right() <= 0.0, "first column scrolled out");
    }

    #[test]
    fn layout_kind_names_roundtrip() {
        for k in LayoutKind::ALL {
            assert_eq!(LayoutKind::parse(k.name()), Some(k));
        }
        assert_eq!(LayoutKind::Floating.next(), LayoutKind::Dwindle);
    }
}
