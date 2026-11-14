use hypr_tiler::geometry::WindowRect;
use std::collections::HashMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LayerType {
    Background, // cosmic-bg
    Bottom,
    Top,     // cosmic-panel, cosmic-applets
    Overlay, // cosmic-launcher, cosmic-osd
}

bitflags::bitflags! {
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct LayerAnchor: u32 {
        const TOP = 1;
        const BOTTOM = 2;
        const LEFT = 4;
        const RIGHT = 8;
    }
}

#[derive(Debug, Clone)]
pub struct LayerSurface {
    pub id: u32,
    pub layer: LayerType,
    pub anchor: LayerAnchor,
    pub exclusive_zone: i32, // e.g. 48px panel
    pub width: u32,
    pub height: u32,
    pub margin_top: i32,
    pub margin_bottom: i32,
    pub margin_left: i32,
    pub margin_right: i32,
}

pub struct LayerShellManager {
    pub surfaces: HashMap<u32, LayerSurface>,
}

impl LayerShellManager {
    pub fn new() -> Self {
        Self {
            surfaces: HashMap::new(),
        }
    }

    pub fn add_surface(&mut self, surface: LayerSurface) {
        self.surfaces.insert(surface.id, surface);
    }

    pub fn remove_surface(&mut self, id: u32) {
        self.surfaces.remove(&id);
    }

    /// Calculates exclusive margins aggregated across anchored surfaces for `taffy::WaylandShellZones`.
    #[must_use]
    pub fn taffy_margins(&self) -> taffy::WaylandShellMargins {
        let mut margins = taffy::WaylandShellMargins::ZERO;
        for surf in self.surfaces.values() {
            if surf.exclusive_zone > 0 {
                let ez = surf.exclusive_zone as f32;
                if surf.anchor.contains(LayerAnchor::TOP) {
                    margins.top += ez;
                } else if surf.anchor.contains(LayerAnchor::BOTTOM) {
                    margins.bottom += ez;
                } else if surf.anchor.contains(LayerAnchor::LEFT) {
                    margins.left += ez;
                } else if surf.anchor.contains(LayerAnchor::RIGHT) {
                    margins.right += ez;
                }
            }
        }
        margins
    }

    /// Solves full Wayland output zones (`top_bar`, `bottom_bar`, `left_panel`, `right_panel`, `usable_content`, `overlay`)
    /// directly via first-party `taffy::WaylandShellZones`.
    #[must_use]
    pub fn solve_taffy_zones(&self, screen_bounds: WindowRect) -> taffy::WaylandShellZones {
        taffy::WaylandShellZones::solve(
            taffy::Size {
                width: screen_bounds.width.max(0.0) as f32,
                height: screen_bounds.height.max(0.0) as f32,
            },
            self.taffy_margins(),
        )
    }

    /// Calculates usable workspace area for tiling windows after reserving exclusive zones (e.g. cosmic-panel)
    pub fn calculate_usable_area(&self, screen_bounds: WindowRect) -> WindowRect {
        let zones = self.solve_taffy_zones(screen_bounds);
        WindowRect::new(
            screen_bounds.x + f64::from(zones.usable_content.x),
            screen_bounds.y + f64::from(zones.usable_content.y),
            f64::from(zones.usable_content.width).max(100.0),
            f64::from(zones.usable_content.height).max(100.0),
        )
    }
}
