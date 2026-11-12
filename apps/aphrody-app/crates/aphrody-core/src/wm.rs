//! Window manager model: workspaces, windows, focus, layouts.
//!
//! This is a deterministic model of a tiling compositor's window policy. It is
//! not a real compositor: it owns no GPU buffers or input devices.

use crate::layout::{self, LayoutKind, Rect};
use serde::Serialize;
use std::collections::BTreeMap;

pub type WindowId = u32;

#[derive(Clone, Debug, Serialize)]
pub struct Window {
    pub id: WindowId,
    pub title: String,
    pub app_id: String,
    pub float_rect: Rect,
}

#[derive(Clone, Debug, Serialize)]
pub struct Workspace {
    pub name: String,
    pub windows: Vec<WindowId>,
    pub focused: Option<WindowId>,
    pub layout: LayoutKind,
    pub scroll_x: f32,
    pub column_ratio: f32,
}

#[derive(Clone, Debug, Serialize)]
pub struct Placed {
    pub id: WindowId,
    pub title: String,
    pub app_id: String,
    pub rect: Rect,
    pub focused: bool,
}

#[derive(Clone, Debug)]
pub struct WindowManager {
    pub output: Rect,
    pub gap: f32,
    pub workspaces: Vec<Workspace>,
    pub active: usize,
    windows: BTreeMap<WindowId, Window>,
    next_id: WindowId,
}

impl WindowManager {
    pub fn new(output: Rect, workspace_count: usize) -> Self {
        let count = workspace_count.max(1);
        let workspaces = (0..count)
            .map(|i| Workspace {
                name: format!("{}", i + 1),
                windows: Vec::new(),
                focused: None,
                layout: LayoutKind::Dwindle,
                scroll_x: 0.0,
                column_ratio: 0.5,
            })
            .collect();
        WindowManager { output, gap: 8.0, workspaces, active: 0, windows: BTreeMap::new(), next_id: 1 }
    }

    pub fn window(&self, id: WindowId) -> Option<&Window> {
        self.windows.get(&id)
    }

    pub fn window_count(&self) -> usize {
        self.windows.len()
    }

    pub fn workspace_of(&self, id: WindowId) -> Option<usize> {
        self.workspaces.iter().position(|w| w.windows.contains(&id))
    }

    pub fn add_window(&mut self, title: &str, app_id: &str) -> WindowId {
        let id = self.next_id;
        self.next_id += 1;
        let k = self.windows.len() as f32;
        let (w, h) = ((self.output.w * 0.4).max(120.0), (self.output.h * 0.4).max(80.0));
        let x = (self.output.x + 40.0 + 32.0 * (k % 8.0)).min((self.output.right() - w).max(self.output.x));
        let y = (self.output.y + 40.0 + 32.0 * (k % 8.0)).min((self.output.bottom() - h).max(self.output.y));
        self.windows.insert(
            id,
            Window { id, title: title.to_string(), app_id: app_id.to_string(), float_rect: Rect::new(x, y, w, h) },
        );
        let ws = &mut self.workspaces[self.active];
        ws.windows.push(id);
        ws.focused = Some(id);
        id
    }

    pub fn set_title(&mut self, id: WindowId, title: &str) {
        if let Some(w) = self.windows.get_mut(&id) {
            w.title = title.to_string();
        }
    }

    pub fn set_app_id(&mut self, id: WindowId, app_id: &str) {
        if let Some(w) = self.windows.get_mut(&id) {
            w.app_id = app_id.to_string();
        }
    }

    pub fn remove_window(&mut self, id: WindowId) -> bool {
        if self.windows.remove(&id).is_none() {
            return false;
        }
        for ws in &mut self.workspaces {
            if let Some(pos) = ws.windows.iter().position(|w| *w == id) {
                ws.windows.remove(pos);
                if ws.focused == Some(id) {
                    ws.focused = ws.windows.get(pos.saturating_sub(1).min(ws.windows.len().saturating_sub(1))).copied();
                }
            }
        }
        true
    }

    pub fn focus_window(&mut self, id: WindowId) -> bool {
        match self.workspace_of(id) {
            Some(i) => {
                self.active = i;
                self.workspaces[i].focused = Some(id);
                true
            }
            None => false,
        }
    }

    fn step_focus(&mut self, delta: isize) {
        let ws = &mut self.workspaces[self.active];
        if ws.windows.is_empty() {
            return;
        }
        let cur = ws.focused.and_then(|f| ws.windows.iter().position(|w| *w == f)).unwrap_or(0) as isize;
        let n = ws.windows.len() as isize;
        ws.focused = Some(ws.windows[(cur + delta).rem_euclid(n) as usize]);
    }

    pub fn focus_next(&mut self) {
        self.step_focus(1);
    }

    pub fn focus_prev(&mut self) {
        self.step_focus(-1);
    }

    /// Swap the focused window with its next neighbour in the tiling order.
    pub fn swap_focused_next(&mut self) {
        let ws = &mut self.workspaces[self.active];
        if let Some(f) = ws.focused {
            if let Some(i) = ws.windows.iter().position(|w| *w == f) {
                let j = (i + 1) % ws.windows.len();
                ws.windows.swap(i, j);
            }
        }
    }

    pub fn switch_workspace(&mut self, index: usize) -> bool {
        if index < self.workspaces.len() {
            self.active = index;
            true
        } else {
            false
        }
    }

    pub fn move_focused_to_workspace(&mut self, index: usize) -> bool {
        if index >= self.workspaces.len() || index == self.active {
            return false;
        }
        let Some(id) = self.workspaces[self.active].focused else { return false };
        let src = &mut self.workspaces[self.active];
        let pos = src.windows.iter().position(|w| *w == id).unwrap();
        src.windows.remove(pos);
        src.focused = src.windows.get(pos.saturating_sub(1).min(src.windows.len().saturating_sub(1))).copied();
        let dst = &mut self.workspaces[index];
        dst.windows.push(id);
        dst.focused = Some(id);
        true
    }

    pub fn set_layout(&mut self, kind: LayoutKind) {
        self.workspaces[self.active].layout = kind;
    }

    pub fn cycle_layout(&mut self) {
        let ws = &mut self.workspaces[self.active];
        ws.layout = ws.layout.next();
    }

    pub fn resize_output(&mut self, output: Rect) {
        self.output = output;
    }

    /// Move a floating window (only meaningful in the floating layout).
    pub fn set_float_rect(&mut self, id: WindowId, r: Rect) {
        if let Some(w) = self.windows.get_mut(&id) {
            w.float_rect = r;
        }
    }

    /// Compute placement for the active workspace.
    pub fn arrange(&mut self) -> Vec<Placed> {
        self.arrange_workspace(self.active)
    }

    pub fn arrange_workspace(&mut self, index: usize) -> Vec<Placed> {
        let (output, gap) = (self.output, self.gap);
        let ws = &mut self.workspaces[index];
        let n = ws.windows.len();
        let focus_idx = ws.focused.and_then(|f| ws.windows.iter().position(|w| *w == f)).unwrap_or(0);
        let rects: Vec<Rect> = match ws.layout {
            LayoutKind::Dwindle => layout::dwindle(output, n, gap),
            LayoutKind::CosmicGrid => layout::cosmic_grid(output, n, gap),
            LayoutKind::NiriScroll => {
                layout::niri_scroll(output, n, focus_idx, ws.column_ratio, &mut ws.scroll_x, gap)
            }
            LayoutKind::Floating => ws.windows.iter().map(|id| self.windows[id].float_rect).collect(),
        };
        let ws = &self.workspaces[index];
        ws.windows
            .iter()
            .zip(rects)
            .map(|(id, rect)| {
                let w = &self.windows[id];
                Placed { id: *id, title: w.title.clone(), app_id: w.app_id.clone(), rect, focused: ws.focused == Some(*id) }
            })
            .collect()
    }

    pub fn rect_of(&mut self, id: WindowId) -> Option<Rect> {
        let ws = self.workspace_of(id)?;
        self.arrange_workspace(ws).into_iter().find(|p| p.id == id).map(|p| p.rect)
    }

    /// Topmost window under the point on the active workspace.
    pub fn window_at(&mut self, x: f32, y: f32) -> Option<WindowId> {
        self.arrange().into_iter().rev().find(|p| p.rect.contains(x, y)).map(|p| p.id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn wm() -> WindowManager {
        let mut w = WindowManager::new(Rect::new(0.0, 0.0, 1600.0, 900.0), 4);
        w.gap = 0.0;
        w
    }

    #[test]
    fn add_focus_remove() {
        let mut w = wm();
        let a = w.add_window("a", "x");
        let b = w.add_window("b", "x");
        let c = w.add_window("c", "x");
        assert_eq!(w.workspaces[0].focused, Some(c));
        w.focus_next();
        assert_eq!(w.workspaces[0].focused, Some(a));
        w.focus_prev();
        assert_eq!(w.workspaces[0].focused, Some(c));
        assert!(w.remove_window(c));
        assert_eq!(w.workspaces[0].focused, Some(b));
        assert!(!w.remove_window(c));
        assert_eq!(w.arrange().len(), 2);
    }

    #[test]
    fn workspaces_isolate_windows() {
        let mut w = wm();
        let a = w.add_window("a", "x");
        let b = w.add_window("b", "x");
        assert!(w.move_focused_to_workspace(2));
        assert_eq!(w.workspace_of(b), Some(2));
        assert_eq!(w.arrange().len(), 1);
        assert!(w.switch_workspace(2));
        assert_eq!(w.arrange()[0].id, b);
        assert!(w.focus_window(a));
        assert_eq!(w.active, 0);
        assert!(!w.switch_workspace(9));
    }

    #[test]
    fn every_layout_places_every_window() {
        let mut w = wm();
        for i in 0..5 {
            w.add_window(&format!("w{i}"), "app");
        }
        for k in LayoutKind::ALL {
            w.set_layout(k);
            let p = w.arrange();
            assert_eq!(p.len(), 5, "{k:?}");
            assert_eq!(p.iter().filter(|p| p.focused).count(), 1);
            assert!(p.iter().all(|p| p.rect.w > 0.0 && p.rect.h > 0.0));
        }
    }

    #[test]
    fn hit_testing_prefers_topmost_floating() {
        let mut w = wm();
        let a = w.add_window("a", "x");
        let b = w.add_window("b", "x");
        w.set_layout(LayoutKind::Floating);
        w.set_float_rect(a, Rect::new(0.0, 0.0, 400.0, 400.0));
        w.set_float_rect(b, Rect::new(200.0, 200.0, 400.0, 400.0));
        assert_eq!(w.window_at(300.0, 300.0), Some(b));
        assert_eq!(w.window_at(10.0, 10.0), Some(a));
        assert_eq!(w.window_at(1500.0, 10.0), None);
    }
}
