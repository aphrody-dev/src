use crate::geometry::{GapsConfig, WindowRect};
use std::collections::HashMap;

/// Shared window tiling algorithm backed directly by first-party `taffy::solve_tiling_rects`.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum TilerAlgorithm {
    Dwindle,
    MasterStack,
    Grid,
    Monocle,
}

impl From<TilerAlgorithm> for taffy::TilingStrategy {
    fn from(algo: TilerAlgorithm) -> Self {
        match algo {
            TilerAlgorithm::Dwindle => Self::Dwindle,
            TilerAlgorithm::MasterStack => Self::MasterStack,
            TilerAlgorithm::Grid => Self::Grid,
            TilerAlgorithm::Monocle => Self::Monocle,
        }
    }
}

/// Converts a `WindowRect` into a first-party `taffy::LayoutRect`.
#[must_use]
pub fn window_rect_to_taffy(r: WindowRect) -> taffy::LayoutRect {
    taffy::LayoutRect::new(r.x as f32, r.y as f32, r.width as f32, r.height as f32)
}

/// Converts a `taffy::LayoutRect` back into a `WindowRect`.
#[must_use]
pub fn taffy_to_window_rect(r: taffy::LayoutRect) -> WindowRect {
    WindowRect::new(
        f64::from(r.x),
        f64::from(r.y),
        f64::from(r.width),
        f64::from(r.height),
    )
}

/// Solves a slice of tiled window IDs inside `screen_bounds` using first-party `taffy::solve_tiling_rects`.
#[must_use]
pub fn solve_workspace_taffy_rects(
    window_ids: &[u32],
    screen_bounds: WindowRect,
    gaps: GapsConfig,
    master_ratio: f64,
    algorithm: TilerAlgorithm,
) -> HashMap<u32, WindowRect> {
    if window_ids.is_empty() {
        return HashMap::new();
    }

    let usable = WindowRect::new(
        screen_bounds.x + gaps.outer,
        screen_bounds.y + gaps.outer,
        (screen_bounds.width - gaps.outer * 2.0).max(1.0),
        (screen_bounds.height - gaps.outer * 2.0).max(1.0),
    );
    let rects = taffy::solve_tiling_rects(
        window_rect_to_taffy(usable),
        gaps.inner as f32,
        master_ratio as f32,
        window_ids.len(),
        algorithm.into(),
    );

    window_ids
        .iter()
        .copied()
        .zip(rects.into_iter().map(taffy_to_window_rect))
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn taffy_tiler_solves_grid_dwindle_and_master_stack() {
        let screen = WindowRect::new(0.0, 0.0, 1920.0, 1080.0);
        let gaps = GapsConfig { inner: 8.0, outer: 12.0 };
        let ids = [1, 2, 3, 4];

        for algo in [
            TilerAlgorithm::Dwindle,
            TilerAlgorithm::MasterStack,
            TilerAlgorithm::Grid,
        ] {
            let map = solve_workspace_taffy_rects(&ids, screen, gaps, 0.55, algo);
            assert_eq!(map.len(), 4);
            for id in ids {
                let r = map.get(&id).unwrap();
                assert!(r.width > 100.0 && r.height > 100.0);
                assert!(r.x >= 12.0 - 0.5 && r.x + r.width <= 1908.5);
                assert!(r.y >= 12.0 - 0.5 && r.y + r.height <= 1068.5);
            }
        }
        let monocle = solve_workspace_taffy_rects(&ids, screen, gaps, 0.55, TilerAlgorithm::Monocle);
        assert_eq!(monocle.len(), 1);
    }
}
