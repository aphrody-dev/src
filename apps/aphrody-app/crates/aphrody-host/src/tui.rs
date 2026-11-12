//! ANSI snapshot of workspaces and windows (a read-only inspector view of the
//! window manager model, not a terminal compositor).

use aphrody_core::layout::{LayoutKind, Rect};
use aphrody_core::wm::WindowManager;

#[derive(Clone, Copy, PartialEq)]
struct Cell {
    ch: char,
    fg: (u8, u8, u8),
    bg: (u8, u8, u8),
}

const BG: (u8, u8, u8) = (0x0F, 0x0F, 0x0F);
const LAYER: (u8, u8, u8) = (0x1C, 0x1C, 0x1C);
const BRAND: (u8, u8, u8) = (0x00, 0x78, 0xD4);
const BRAND_LIGHT: (u8, u8, u8) = (0x60, 0xCD, 0xFF);
const MUTED: (u8, u8, u8) = (0x8A, 0x8A, 0x8A);
const FG: (u8, u8, u8) = (0xF3, 0xF3, 0xF3);

pub struct Options {
    pub width: usize,
    pub height: usize,
    pub color: bool,
}

pub fn demo_wm(layout: LayoutKind, windows: usize) -> WindowManager {
    let mut wm = WindowManager::new(Rect::new(0.0, 0.0, 1920.0, 1080.0), 4);
    wm.gap = 0.0;
    let names = ["Terminal", "Files", "Editor", "Browser", "Settings", "Monitor", "Notes", "Mail"];
    for i in 0..windows {
        wm.add_window(names[i % names.len()], &format!("org.aphrody.{}", names[i % names.len()].to_lowercase()));
    }
    wm.set_layout(layout);
    wm
}

pub fn render(wm: &mut WindowManager, opt: &Options) -> String {
    let (w, h) = (opt.width.max(20), opt.height.max(6));
    let mut grid = vec![Cell { ch: ' ', fg: FG, bg: BG }; w * h];
    let output = wm.output;
    let placed = wm.arrange();
    let sx = w as f32 / output.w;
    let sy = h as f32 / output.h;
    for p in &placed {
        let x0 = ((p.rect.x * sx).round() as isize).clamp(0, w as isize) as usize;
        let y0 = ((p.rect.y * sy).round() as isize).clamp(0, h as isize) as usize;
        let x1 = (((p.rect.x + p.rect.w) * sx).round() as isize).clamp(0, w as isize) as usize;
        let y1 = (((p.rect.y + p.rect.h) * sy).round() as isize).clamp(0, h as isize) as usize;
        if x1 < x0 + 3 || y1 < y0 + 2 {
            continue;
        }
        let border = if p.focused { BRAND_LIGHT } else { MUTED };
        for y in y0..y1 {
            for x in x0..x1 {
                let (top, bot, left, right) = (y == y0, y == y1 - 1, x == x0, x == x1 - 1);
                let ch = match (top, bot, left, right) {
                    (true, _, true, _) => '\u{250C}',
                    (true, _, _, true) => '\u{2510}',
                    (_, true, true, _) => '\u{2514}',
                    (_, true, _, true) => '\u{2518}',
                    (true, ..) | (_, true, ..) => '\u{2500}',
                    (_, _, true, _) | (_, _, _, true) => '\u{2502}',
                    _ => ' ',
                };
                grid[y * w + x] = Cell { ch, fg: border, bg: LAYER };
            }
        }
        let label = format!(" {} ", p.title);
        for (i, c) in label.chars().take(x1 - x0 - 2).enumerate() {
            grid[y0 * w + x0 + 1 + i] = Cell { ch: c, fg: if p.focused { FG } else { MUTED }, bg: if p.focused { BRAND } else { LAYER } };
        }
        if y1 - y0 > 2 {
            let sub = format!("#{} {}x{}", p.id, p.rect.w as i32, p.rect.h as i32);
            for (i, c) in sub.chars().take(x1 - x0 - 3).enumerate() {
                grid[(y0 + 1) * w + x0 + 2 + i] = Cell { ch: c, fg: MUTED, bg: LAYER };
            }
        }
    }
    let mut out = String::new();
    // Workspace bar.
    let mut bar = String::new();
    for (i, ws) in wm.workspaces.iter().enumerate() {
        let tag = format!(" {}:{} ", ws.name, ws.windows.len());
        if opt.color {
            let (fg, bg) = if i == wm.active { (FG, BRAND) } else { (MUTED, LAYER) };
            bar.push_str(&format!("\x1b[38;2;{};{};{}m\x1b[48;2;{};{};{}m{tag}", fg.0, fg.1, fg.2, bg.0, bg.1, bg.2));
        } else {
            bar.push_str(&if i == wm.active { format!("[{tag}]") } else { tag.clone() });
        }
    }
    let layout = wm.workspaces[wm.active].layout.name();
    if opt.color {
        out.push_str(&format!("{bar}\x1b[0m  layout {layout}\n"));
    } else {
        out.push_str(&format!("{bar}  layout {layout}\n"));
    }
    for y in 0..h {
        let mut last: Option<((u8, u8, u8), (u8, u8, u8))> = None;
        for x in 0..w {
            let c = grid[y * w + x];
            if opt.color && last != Some((c.fg, c.bg)) {
                out.push_str(&format!("\x1b[38;2;{};{};{}m\x1b[48;2;{};{};{}m", c.fg.0, c.fg.1, c.fg.2, c.bg.0, c.bg.1, c.bg.2));
                last = Some((c.fg, c.bg));
            }
            out.push(c.ch);
        }
        if opt.color {
            out.push_str("\x1b[0m");
        }
        out.push('\n');
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn plain_snapshot_contains_titles_and_active_workspace() {
        let mut wm = demo_wm(LayoutKind::Dwindle, 3);
        let s = render(&mut wm, &Options { width: 80, height: 24, color: false });
        assert!(s.starts_with("[ 1:3 ]"), "{}", s.lines().next().unwrap());
        for t in ["Terminal", "Files", "Editor"] {
            assert!(s.contains(t), "{t}");
        }
        assert_eq!(s.lines().count(), 25);
        assert!(!s.contains('\x1b'));
    }

    #[test]
    fn color_snapshot_uses_fluent_tokens() {
        let mut wm = demo_wm(LayoutKind::CosmicGrid, 4);
        let s = render(&mut wm, &Options { width: 80, height: 24, color: true });
        assert!(s.contains("38;2;96;205;255"), "focus ring color #60CDFF");
        assert!(s.contains("48;2;0;120;212"), "brand #0078D4");
    }
}
