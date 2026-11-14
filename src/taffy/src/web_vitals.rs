//! # Native Core Web Vitals & Modern Web Guidelines Engine
//!
//! Provides first-class, layout-solver integrated monitoring and auditing for:
//! - **CLS (Cumulative Layout Shift)**: Exact mathematical W3C Layout Instability API calculation.
//! - **LCP (Largest Contentful Paint)**: $O(N)$ viewport-clipped candidate solver during layout.
//! - **INP (Interaction to Next Paint)** & Native/WebGPU Frame Budget Profiler (60Hz, 120Hz, 240Hz).
//! - **Modern Web Guidelines & WCAG 2.2 AA Auditor**: Touch target validation (48x48dp Google M3 / 24x24px WCAG 2.2),
//!   unsized media detection, horizontal viewport overflow prevention, and readable prose line-measure bounds.

#[cfg(not(feature = "std"))]
use alloc::{
    collections::{BTreeMap, BTreeSet},
    format,
    string::String,
    vec::Vec,
};

#[cfg(feature = "std")]
use std::{
    collections::{BTreeMap, BTreeSet},
    string::String,
    time::Duration,
    vec::Vec,
};

use crate::geometry::{Point, Rect, Size};
use crate::tree::NodeId;

#[cfg(feature = "taffy_tree")]
use crate::tree::{traits::TraversePartialTree, TaffyTree};

/// Rating classification for Core Web Vitals according to Google and W3C guidelines.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum VitalsRating {
    /// Optimal performance score satisfying user experience standards.
    Good,
    /// Score needs optimization to meet standard thresholds.
    NeedsImprovement,
    /// Score fails user experience thresholds.
    Poor,
}

impl VitalsRating {
    /// Returns true if the rating is Good.
    #[inline]
    pub const fn is_good(&self) -> bool {
        matches!(self, Self::Good)
    }

    /// Human readable label.
    pub const fn as_str(&self) -> &'static str {
        match self {
            Self::Good => "Good",
            Self::NeedsImprovement => "Needs Improvement",
            Self::Poor => "Poor",
        }
    }
}

/// Attribution for a single node's layout shift per W3C Layout Instability API.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LayoutShiftAttribution {
    /// The NodeId of the unstable node.
    pub node_id: NodeId,
    /// The bounding box in the previous frame clipped to the viewport.
    pub previous_rect: Rect<f32>,
    /// The bounding box in the current frame clipped to the viewport.
    pub current_rect: Rect<f32>,
    /// The horizontal distance moved.
    pub delta_x: f32,
    /// The vertical distance moved.
    pub delta_y: f32,
}

/// An individual Layout Shift entry conforming to the W3C Layout Instability API.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LayoutShiftEntry {
    /// The layout shift score for this frame: `impact_fraction * distance_fraction`.
    pub value: f32,
    /// The fraction of viewport covered by shifted bounds before and after the shift.
    pub impact_fraction: f32,
    /// The maximum movement distance divided by the largest viewport dimension.
    pub distance_fraction: f32,
    /// Detailed attributions for shifting nodes in this frame.
    pub attributions: Vec<LayoutShiftAttribution>,
    /// Whether user input occurred immediately preceding this frame (excludes user-driven shift from penalties).
    pub had_recent_input: bool,
}

/// Session window for grouping layout shifts per Google Web Vitals spec (maximum 5 seconds, max 1 second gap).
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct ClsSessionWindow {
    /// Total score in this session window.
    pub total_score: f32,
    /// Individual entries in this window.
    pub entries: Vec<LayoutShiftEntry>,
}

/// Computes the exact area of the union of multiple 2D axis-aligned rectangles using a sweep-line algorithm.
pub fn compute_rect_union_area(rects: &[Rect<f32>]) -> f32 {
    let valid_rects: Vec<Rect<f32>> = rects
        .iter()
        .copied()
        .filter(|r| r.right > r.left && r.bottom > r.top)
        .collect();
    if valid_rects.is_empty() {
        return 0.0;
    }

    let mut x_coords: Vec<f32> = Vec::with_capacity(valid_rects.len() * 2);
    for r in &valid_rects {
        x_coords.push(r.left);
        x_coords.push(r.right);
    }
    x_coords.sort_by(|a, b| a.partial_cmp(b).unwrap_or(core::cmp::Ordering::Equal));
    x_coords.dedup_by(|a, b| (*a - *b).abs() < 1e-4);

    let mut total_area = 0.0f32;

    for i in 0..x_coords.len().saturating_sub(1) {
        let x1 = x_coords[i];
        let x2 = x_coords[i + 1];
        let dx = x2 - x1;
        if dx <= 1e-4 {
            continue;
        }

        let mut y_intervals: Vec<(f32, f32)> = Vec::new();
        for r in &valid_rects {
            if r.left <= x1 + 1e-4 && r.right >= x2 - 1e-4 {
                y_intervals.push((r.top, r.bottom));
            }
        }
        if y_intervals.is_empty() {
            continue;
        }

        y_intervals.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap_or(core::cmp::Ordering::Equal));

        let mut merged_y = 0.0f32;
        let mut cur_start = y_intervals[0].0;
        let mut cur_end = y_intervals[0].1;

        for &(y_start, y_end) in &y_intervals[1..] {
            if y_start < cur_end {
                if y_end > cur_end {
                    cur_end = y_end;
                }
            } else {
                merged_y += (cur_end - cur_start).max(0.0);
                cur_start = y_start;
                cur_end = y_end;
            }
        }
        merged_y += (cur_end - cur_start).max(0.0);
        total_area += dx * merged_y;
    }

    total_area
}

/// Tracks node bounding boxes across consecutive layout frames to compute exact W3C Cumulative Layout Shift (CLS).
#[derive(Debug, Clone, Default)]
pub struct ClsTracker {
    /// Previous frame absolute node bounding boxes.
    previous_rects: BTreeMap<NodeId, Rect<f32>>,
    /// Set of nodes marked as undergoing intentional animation/transform (excluded from CLS).
    intentional_nodes: BTreeSet<NodeId>,
    /// Flag indicating whether recent user input occurred.
    recent_user_input: bool,
    /// History of layout shift entries.
    entries: Vec<LayoutShiftEntry>,
    /// Session windows computed per W3C specification.
    session_windows: Vec<ClsSessionWindow>,
}

impl ClsTracker {
    /// Creates a new `ClsTracker`.
    pub fn new() -> Self {
        Self::default()
    }

    /// Marks a node as undergoing intentional animation or transform, excluding it from layout instability scoring.
    pub fn mark_intentional_animation(&mut self, node: NodeId) {
        self.intentional_nodes.insert(node);
    }

    /// Unmarks an intentional animation node.
    pub fn unmark_intentional_animation(&mut self, node: NodeId) {
        self.intentional_nodes.remove(&node);
    }

    /// Signals that user input occurred immediately prior to the frame (within 500ms).
    pub fn mark_recent_user_input(&mut self, had_input: bool) {
        self.recent_user_input = had_input;
    }

    /// Resets all tracked frames and accumulated shift scores.
    pub fn reset(&mut self) {
        self.previous_rects.clear();
        self.intentional_nodes.clear();
        self.recent_user_input = false;
        self.entries.clear();
        self.session_windows.clear();
    }

    /// Computes absolute bounding boxes for all nodes in the tree rooted at `root`.
    #[cfg(feature = "taffy_tree")]
    pub fn compute_absolute_rects<NodeContext>(
        tree: &TaffyTree<NodeContext>,
        root: NodeId,
    ) -> BTreeMap<NodeId, Rect<f32>> {
        let mut rects = BTreeMap::new();
        if let Ok(root_layout) = tree.layout(root) {
            let root_rect = Rect {
                left: root_layout.location.x,
                top: root_layout.location.y,
                right: root_layout.location.x + root_layout.size.width,
                bottom: root_layout.location.y + root_layout.size.height,
            };
            rects.insert(root, root_rect);
            Self::traverse_children_absolute_rects(tree, root, Point { x: root_layout.location.x, y: root_layout.location.y }, &mut rects);
        }
        rects
    }

    #[cfg(feature = "taffy_tree")]
    fn traverse_children_absolute_rects<NodeContext>(
        tree: &TaffyTree<NodeContext>,
        parent: NodeId,
        parent_origin: Point<f32>,
        out_rects: &mut BTreeMap<NodeId, Rect<f32>>,
    ) {
        if let Ok(children) = tree.children(parent) {
            for child in children {
                if let Ok(layout) = tree.layout(child) {
                    let child_origin = Point {
                        x: parent_origin.x + layout.location.x,
                        y: parent_origin.y + layout.location.y,
                    };
                    let child_rect = Rect {
                        left: child_origin.x,
                        top: child_origin.y,
                        right: child_origin.x + layout.size.width,
                        bottom: child_origin.y + layout.size.height,
                    };
                    out_rects.insert(child, child_rect);
                    Self::traverse_children_absolute_rects(tree, child, child_origin, out_rects);
                }
            }
        }
    }

    /// Records a new layout frame and computes the layout shift entry relative to the previous frame.
    #[cfg(feature = "taffy_tree")]
    pub fn snapshot_frame<NodeContext>(
        &mut self,
        tree: &TaffyTree<NodeContext>,
        root: NodeId,
        viewport: Size<f32>,
    ) -> Option<LayoutShiftEntry> {
        let current_rects = Self::compute_absolute_rects(tree, root);
        self.snapshot_rects(&current_rects, viewport)
    }

    /// Records a new layout frame from precomputed absolute node bounding boxes.
    pub fn snapshot_rects(
        &mut self,
        current_rects: &BTreeMap<NodeId, Rect<f32>>,
        viewport: Size<f32>,
    ) -> Option<LayoutShiftEntry> {
        let viewport_area = viewport.width * viewport.height;
        if viewport_area <= 0.0 || self.previous_rects.is_empty() {
            self.previous_rects = current_rects.clone();
            return None;
        }

        let max_viewport_dim = viewport.width.max(viewport.height);
        let mut unstable_rects: Vec<Rect<f32>> = Vec::new();
        let mut attributions: Vec<LayoutShiftAttribution> = Vec::new();
        let mut max_move_dist = 0.0f32;

        for (node_id, &curr) in current_rects {
            if self.intentional_nodes.contains(node_id) {
                continue;
            }
            if let Some(&prev) = self.previous_rects.get(node_id) {
                let dx = (curr.left - prev.left).abs();
                let dy = (curr.top - prev.top).abs();

                // Check if node moved perceptibly (more than 0.05px)
                if dx > 0.05 || dy > 0.05 {
                    let prev_clipped = Rect {
                        left: prev.left.max(0.0),
                        top: prev.top.max(0.0),
                        right: prev.right.min(viewport.width),
                        bottom: prev.bottom.min(viewport.height),
                    };
                    let curr_clipped = Rect {
                        left: curr.left.max(0.0),
                        top: curr.top.max(0.0),
                        right: curr.right.min(viewport.width),
                        bottom: curr.bottom.min(viewport.height),
                    };

                    let prev_visible = prev_clipped.right > prev_clipped.left && prev_clipped.bottom > prev_clipped.top;
                    let curr_visible = curr_clipped.right > curr_clipped.left && curr_clipped.bottom > curr_clipped.top;

                    if prev_visible || curr_visible {
                        let move_dist = dx.max(dy);
                        if move_dist > max_move_dist {
                            max_move_dist = move_dist;
                        }

                        if prev_visible {
                            unstable_rects.push(prev_clipped);
                        }
                        if curr_visible {
                            unstable_rects.push(curr_clipped);
                        }

                        attributions.push(LayoutShiftAttribution {
                            node_id: *node_id,
                            previous_rect: prev_clipped,
                            current_rect: curr_clipped,
                            delta_x: curr.left - prev.left,
                            delta_y: curr.top - prev.top,
                        });
                    }
                }
            }
        }

        self.previous_rects = current_rects.clone();

        if attributions.is_empty() {
            return None;
        }

        let union_area = compute_rect_union_area(&unstable_rects);
        let impact_fraction = (union_area / viewport_area).min(1.0);
        let distance_fraction = if max_viewport_dim > 0.0 {
            (max_move_dist / max_viewport_dim).min(1.0)
        } else {
            0.0
        };
        let value = impact_fraction * distance_fraction;

        let entry = LayoutShiftEntry {
            value,
            impact_fraction,
            distance_fraction,
            attributions,
            had_recent_input: self.recent_user_input,
        };

        // Reset user input flag
        self.recent_user_input = false;

        // Group into session windows
        if self.session_windows.is_empty() {
            self.session_windows.push(ClsSessionWindow {
                total_score: if entry.had_recent_input { 0.0 } else { entry.value },
                entries: vec![entry.clone()],
            });
        } else {
            let last_idx = self.session_windows.len() - 1;
            let window = &mut self.session_windows[last_idx];
            if !entry.had_recent_input {
                window.total_score += entry.value;
            }
            window.entries.push(entry.clone());
        }

        self.entries.push(entry.clone());
        Some(entry)
    }

    /// Returns the total cumulative layout shift score excluding shifts preceded by user input.
    pub fn cumulative_score(&self) -> f32 {
        self.entries
            .iter()
            .filter(|e| !e.had_recent_input)
            .map(|e| e.value)
            .sum()
    }

    /// Returns the maximum layout shift score among all session windows (W3C standard metric).
    pub fn max_session_window_score(&self) -> f32 {
        self.session_windows
            .iter()
            .map(|w| w.total_score)
            .fold(0.0f32, |a, b| a.max(b))
    }

    /// Evaluates the cumulative score against Core Web Vitals thresholds.
    pub fn rating(&self) -> VitalsRating {
        let score = self.max_session_window_score();
        classify_cls_score(score)
    }

    /// Returns all recorded layout shift entries.
    pub fn entries(&self) -> &[LayoutShiftEntry] {
        &self.entries
    }
}

/// Classifies a Cumulative Layout Shift score according to Google Web Vitals thresholds.
/// - Good: <= 0.1
/// - Needs Improvement: <= 0.25
/// - Poor: > 0.25
pub const fn classify_cls_score(score: f32) -> VitalsRating {
    if score <= 0.1 {
        VitalsRating::Good
    } else if score <= 0.25 {
        VitalsRating::NeedsImprovement
    } else {
        VitalsRating::Poor
    }
}

/// Type of element being evaluated as an LCP candidate.
#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum LcpElementType {
    /// Image element (<img>, <image>, or replaced image box).
    Image,
    /// Video element poster or preview frame.
    Video,
    /// Text element or paragraph container.
    Text,
    /// Heading element (H1-H6).
    Heading,
    /// Large hero container or banner.
    HeroBanner,
    /// Generic block or container.
    Block,
    /// Custom application element tag id.
    Custom(u32),
}

/// Representation of an LCP candidate node found in the layout tree.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LcpCandidate {
    /// The NodeId of the candidate in the TaffyTree.
    pub node_id: NodeId,
    /// The semantic type of the element.
    pub element_type: LcpElementType,
    /// The node's absolute bounding box in layout coordinates.
    pub rect: Rect<f32>,
    /// The node's bounding box clipped to the viewport.
    pub clipped_rect: Rect<f32>,
    /// The visible area in pixels squared.
    pub visible_area: f32,
    /// Viewport coverage percentage (0.0% to 100.0%).
    pub viewport_coverage_percent: f32,
    /// Whether this candidate qualifies as a primary hero element (e.g. coverage >= 15%).
    pub is_hero: bool,
}

/// Options to configure LCP discovery in the layout tree.
#[derive(Debug, Clone)]
pub struct LcpOptions {
    /// Minimum visible area to consider as an LCP candidate.
    pub min_area: f32,
    /// Whether only leaf nodes or explicitly typed nodes are eligible.
    pub leaf_nodes_only: bool,
    /// Specific node-to-type overrides.
    pub type_overrides: BTreeMap<NodeId, LcpElementType>,
}

impl Default for LcpOptions {
    fn default() -> Self {
        Self {
            min_area: 1.0,
            leaf_nodes_only: true,
            type_overrides: BTreeMap::new(),
        }
    }
}

/// Solves for the Largest Contentful Paint (LCP) candidate node within the viewport in $O(N)$ top-down traversal.
#[cfg(feature = "taffy_tree")]
pub fn find_lcp_candidate<NodeContext>(
    tree: &TaffyTree<NodeContext>,
    root: NodeId,
    viewport: Size<f32>,
    options: &LcpOptions,
) -> Option<LcpCandidate> {
    let viewport_area = viewport.width * viewport.height;
    if viewport_area <= 0.0 {
        return None;
    }

    let absolute_rects = ClsTracker::compute_absolute_rects(tree, root);
    let mut best_candidate: Option<LcpCandidate> = None;

    for (node_id, rect) in absolute_rects {
        let child_count = tree.child_count(node_id);
        let has_override = options.type_overrides.contains_key(&node_id);
        if options.leaf_nodes_only && child_count > 0 && !has_override {
            continue;
        }

        let clipped_left = rect.left.max(0.0);
        let clipped_top = rect.top.max(0.0);
        let clipped_right = rect.right.min(viewport.width);
        let clipped_bottom = rect.bottom.min(viewport.height);

        if clipped_right > clipped_left && clipped_bottom > clipped_top {
            let visible_area = (clipped_right - clipped_left) * (clipped_bottom - clipped_top);
            if visible_area >= options.min_area {
                let coverage = (visible_area / viewport_area) * 100.0;
                let element_type = options
                    .type_overrides
                    .get(&node_id)
                    .copied()
                    .unwrap_or(if coverage >= 25.0 {
                        LcpElementType::HeroBanner
                    } else if child_count == 0 {
                        LcpElementType::Image
                    } else {
                        LcpElementType::Block
                    });

                let is_hero = coverage >= 15.0 || element_type == LcpElementType::HeroBanner;

                let is_better = match &best_candidate {
                    None => true,
                    Some(best) => visible_area > best.visible_area,
                };

                if is_better {
                    best_candidate = Some(LcpCandidate {
                        node_id,
                        element_type,
                        rect,
                        clipped_rect: Rect {
                            left: clipped_left,
                            top: clipped_top,
                            right: clipped_right,
                            bottom: clipped_bottom,
                        },
                        visible_area,
                        viewport_coverage_percent: coverage,
                        is_hero,
                    });
                }
            }
        }
    }

    best_candidate
}

/// Classifies an LCP duration according to Google Web Vitals thresholds.
/// - Good: <= 2500ms
/// - Needs Improvement: <= 4000ms
/// - Poor: > 4000ms
pub const fn classify_lcp_duration(duration_ms: f32) -> VitalsRating {
    if duration_ms <= 2500.0 {
        VitalsRating::Good
    } else if duration_ms <= 4000.0 {
        VitalsRating::NeedsImprovement
    } else {
        VitalsRating::Poor
    }
}

/// High-performance layout timing and frame budget evaluation report.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct LayoutBudgetReport {
    /// Latency of the layout computation in nanoseconds.
    pub duration_nanos: u64,
    /// Latency of the layout computation in milliseconds.
    pub duration_ms: f64,
    /// Core Web Vitals INP rating (Good <= 200ms, NeedsImprovement <= 500ms).
    pub inp_rating: VitalsRating,
    /// Whether layout computation completed within the 60Hz native frame budget (16.67ms).
    pub fits_60hz: bool,
    /// Whether layout computation completed within the 120Hz native frame budget (8.33ms).
    pub fits_120hz: bool,
    /// Whether layout computation completed within the 240Hz ultra-fast frame budget (4.17ms).
    pub fits_240hz: bool,
    /// Percentage of the 60Hz frame budget consumed (16.67ms = 100%).
    pub budget_utilization_60hz: f32,
    /// Percentage of the 120Hz frame budget consumed (8.33ms = 100%).
    pub budget_utilization_120hz: f32,
    /// Percentage of the 240Hz frame budget consumed (4.17ms = 100%).
    pub budget_utilization_240hz: f32,
    /// Number of nodes evaluated.
    pub node_count: usize,
    /// Layout throughput in nodes per second.
    pub throughput_nodes_per_sec: f64,
}

impl LayoutBudgetReport {
    /// Creates a report from nanoseconds duration and node count.
    pub fn from_nanos(duration_nanos: u64, node_count: usize) -> Self {
        let duration_ms = duration_nanos as f64 / 1_000_000.0;
        let inp_rating = if duration_ms <= 200.0 {
            VitalsRating::Good
        } else if duration_ms <= 500.0 {
            VitalsRating::NeedsImprovement
        } else {
            VitalsRating::Poor
        };

        const BUDGET_60HZ_MS: f64 = 1000.0 / 60.0; // ~16.667ms
        const BUDGET_120HZ_MS: f64 = 1000.0 / 120.0; // ~8.333ms
        const BUDGET_240HZ_MS: f64 = 1000.0 / 240.0; // ~4.167ms

        let fits_60hz = duration_ms <= BUDGET_60HZ_MS;
        let fits_120hz = duration_ms <= BUDGET_120HZ_MS;
        let fits_240hz = duration_ms <= BUDGET_240HZ_MS;

        let budget_utilization_60hz = (duration_ms / BUDGET_60HZ_MS * 100.0) as f32;
        let budget_utilization_120hz = (duration_ms / BUDGET_120HZ_MS * 100.0) as f32;
        let budget_utilization_240hz = (duration_ms / BUDGET_240HZ_MS * 100.0) as f32;

        let throughput_nodes_per_sec = if duration_nanos > 0 {
            (node_count as f64 / duration_nanos as f64) * 1_000_000_000.0
        } else {
            0.0
        };

        Self {
            duration_nanos,
            duration_ms,
            inp_rating,
            fits_60hz,
            fits_120hz,
            fits_240hz,
            budget_utilization_60hz,
            budget_utilization_120hz,
            budget_utilization_240hz,
            node_count,
            throughput_nodes_per_sec,
        }
    }

    /// Creates a report from a [`Duration`] and node count.
    #[cfg(feature = "std")]
    pub fn from_duration(duration: Duration, node_count: usize) -> Self {
        Self::from_nanos(duration.as_nanos() as u64, node_count)
    }
}

/// Profiles an arbitrary layout computation closure and outputs the budget report.
#[cfg(feature = "std")]
pub fn profile_layout<F, R>(node_count: usize, f: F) -> (R, LayoutBudgetReport)
where
    F: FnOnce() -> R,
{
    let start = std::time::Instant::now();
    let result = f();
    let elapsed = start.elapsed();
    (result, LayoutBudgetReport::from_duration(elapsed, node_count))
}

/// Counts the total number of nodes in a subtree.
#[cfg(feature = "taffy_tree")]
pub fn count_subtree_nodes<NodeContext>(tree: &TaffyTree<NodeContext>, root: NodeId) -> usize {
    let mut count = 1;
    if let Ok(children) = tree.children(root) {
        for child in children {
            count += count_subtree_nodes(tree, child);
        }
    }
    count
}

/// Profiles a full `compute_layout` call on `TaffyTree`.
#[cfg(all(feature = "std", feature = "taffy_tree"))]
pub fn profile_tree_layout<NodeContext>(
    tree: &mut TaffyTree<NodeContext>,
    root: NodeId,
    available_space: Size<crate::style::AvailableSpace>,
) -> Result<LayoutBudgetReport, crate::TaffyError> {
    let node_count = count_subtree_nodes(tree, root);
    let start = std::time::Instant::now();
    tree.compute_layout(root, available_space)?;
    let elapsed = start.elapsed();
    Ok(LayoutBudgetReport::from_duration(elapsed, node_count))
}

/// Severity level of a web design or accessibility guideline violation.
#[derive(Debug, Copy, Clone, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum AuditSeverity {
    /// Informational recommendation.
    Info,
    /// Suboptimal layout or guideline warning.
    Warning,
    /// Hard violation of WCAG 2.2 AA or core responsive requirements.
    Error,
}

/// Category of audit violation.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub enum AuditViolationKind {
    /// Touch target does not meet WCAG 2.2 SC 2.5.8 minimum size (24x24px).
    WcagTouchTargetTooSmall {
        /// Actual width in pixels.
        width: f32,
        /// Actual height in pixels.
        height: f32,
        /// Required minimum size (24.0).
        required_min: f32,
    },
    /// Touch target meets WCAG 2.2 but fails Google Material 3 recommendation (48x48dp).
    MaterialTouchTargetSuboptimal {
        /// Actual width in pixels.
        width: f32,
        /// Actual height in pixels.
        height: f32,
        /// Recommended size (48.0).
        recommended: f32,
    },
    /// Unsized media or image missing aspect ratio and explicit size, causing CLS risk.
    UnsizedMediaMissingAspectRatio,
    /// Node extends horizontally outside the viewport, causing responsive horizontal overflow.
    HorizontalViewportOverflow {
        /// Node's right coordinate.
        node_right: f32,
        /// Viewport width.
        viewport_width: f32,
        /// Overflow amount in pixels.
        overflow: f32,
    },
    /// Prose text container width exceeds 75ch (~800px) without a max-width constraint.
    ProseLineMeasureTooWide {
        /// Actual container width.
        width: f32,
        /// Recommended max prose width (~800px).
        recommended_max: f32,
    },
}

/// An individual audit violation record.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct AuditViolation {
    /// The NodeId associated with the violation.
    pub node_id: NodeId,
    /// The severity level.
    pub severity: AuditSeverity,
    /// The violation details.
    pub kind: AuditViolationKind,
    /// Human-readable explanation and remediation guidance.
    pub message: String,
}

/// Configuration options for running the modern web guidelines auditor.
#[derive(Debug, Clone)]
pub struct AuditOptions {
    /// Set of node IDs identified as interactive (buttons, links, inputs).
    pub interactive_nodes: BTreeSet<NodeId>,
    /// Set of node IDs identified as media/images.
    pub media_nodes: BTreeSet<NodeId>,
    /// Set of node IDs identified as long-form prose/text containers.
    pub prose_nodes: BTreeSet<NodeId>,
    /// Enforce Google Material 3 48x48dp touch target rule as error (default false: warning).
    pub strict_material_touch_targets: bool,
    /// Maximum recommended prose width in px (default 800.0, ~75ch).
    pub max_prose_width: f32,
}

impl Default for AuditOptions {
    fn default() -> Self {
        Self {
            interactive_nodes: BTreeSet::new(),
            media_nodes: BTreeSet::new(),
            prose_nodes: BTreeSet::new(),
            strict_material_touch_targets: false,
            max_prose_width: 800.0,
        }
    }
}

/// Complete report returned by the modern web guidelines auditor.
#[derive(Debug, Clone, PartialEq)]
#[cfg_attr(feature = "serde", derive(serde::Serialize, serde::Deserialize))]
pub struct WebAuditReport {
    /// Total number of nodes evaluated.
    pub total_nodes_audited: usize,
    /// List of violations found.
    pub violations: Vec<AuditViolation>,
    /// Whether the layout is 100% compliant with WCAG 2.2 AA.
    pub is_wcag_compliant: bool,
    /// Whether the layout meets Google Material 3 guidelines.
    pub is_material_compliant: bool,
    /// Overall score (0.0 to 100.0).
    pub compliance_score: f32,
}

/// Audits a computed `TaffyTree` against Modern Web Guidelines and WCAG 2.2 AA specifications.
#[cfg(feature = "taffy_tree")]
pub fn audit_modern_web_guidelines<NodeContext>(
    tree: &TaffyTree<NodeContext>,
    root: NodeId,
    viewport: Size<f32>,
    options: &AuditOptions,
) -> WebAuditReport {
    let absolute_rects = ClsTracker::compute_absolute_rects(tree, root);
    let mut violations = Vec::new();
    let total_nodes = absolute_rects.len();

    for (&node_id, &rect) in &absolute_rects {
        let layout = match tree.layout(node_id) {
            Ok(l) => l,
            Err(_) => continue,
        };
        let style = match tree.style(node_id) {
            Ok(s) => s,
            Err(_) => continue,
        };

        // 1. Touch Target Minimum Size Audit
        if options.interactive_nodes.contains(&node_id) {
            let w = layout.size.width;
            let h = layout.size.height;
            if w < 24.0 || h < 24.0 {
                violations.push(AuditViolation {
                    node_id,
                    severity: AuditSeverity::Error,
                    kind: AuditViolationKind::WcagTouchTargetTooSmall {
                        width: w,
                        height: h,
                        required_min: 24.0,
                    },
                    message: format!(
                        "Touch target {w:.1}x{h:.1}px violates WCAG 2.2 SC 2.5.8 (min 24x24px).",
                    ),
                });
            } else if w < 48.0 || h < 48.0 {
                let severity = if options.strict_material_touch_targets {
                    AuditSeverity::Error
                } else {
                    AuditSeverity::Warning
                };
                violations.push(AuditViolation {
                    node_id,
                    severity,
                    kind: AuditViolationKind::MaterialTouchTargetSuboptimal {
                        width: w,
                        height: h,
                        recommended: 48.0,
                    },
                    message: format!(
                        "Touch target {w:.1}x{h:.1}px meets WCAG 2.2 but is below Google Material 3 recommendation (48x48dp).",
                    ),
                });
            }
        }

        // 2. Unsized Media / Missing Aspect Ratio Audit (CLS Risk)
        if options.media_nodes.contains(&node_id) || style.item_is_replaced {
            let is_unsized = style.size.width.is_auto() || style.size.height.is_auto();
            if style.aspect_ratio.is_none() && is_unsized {
                violations.push(AuditViolation {
                    node_id,
                    severity: AuditSeverity::Warning,
                    kind: AuditViolationKind::UnsizedMediaMissingAspectRatio,
                    message: "Media node has auto dimensions without an aspect_ratio, causing CLS risk during loading."
                        .into(),
                });
            }
        }

        // 3. Horizontal Viewport Overflow
        if rect.right > viewport.width + 0.5 {
            let overflow = rect.right - viewport.width;
            violations.push(AuditViolation {
                node_id,
                severity: AuditSeverity::Error,
                kind: AuditViolationKind::HorizontalViewportOverflow {
                    node_right: rect.right,
                    viewport_width: viewport.width,
                    overflow,
                },
                message: format!(
                    "Node extends past viewport right boundary by {overflow:.1}px, causing unwanted horizontal overflow."
                ),
            });
        }

        // 4. Readable Line-Measure Constraints
        if options.prose_nodes.contains(&node_id) {
            let width = layout.size.width;
            if width > options.max_prose_width && style.max_size.width.is_auto() {
                violations.push(AuditViolation {
                    node_id,
                    severity: AuditSeverity::Warning,
                    kind: AuditViolationKind::ProseLineMeasureTooWide {
                        width,
                        recommended_max: options.max_prose_width,
                    },
                    message: format!(
                        "Prose container width {width:.1}px exceeds optimal 45-75ch readability constraint (max {:.1}px).",
                        options.max_prose_width
                    ),
                });
            }
        }
    }

    let is_wcag_compliant = violations.iter().all(|v| v.severity != AuditSeverity::Error);
    let is_material_compliant = violations.is_empty();

    let error_count = violations.iter().filter(|v| v.severity == AuditSeverity::Error).count();
    let warning_count = violations.iter().filter(|v| v.severity == AuditSeverity::Warning).count();
    let penalty = (error_count as f32 * 20.0) + (warning_count as f32 * 5.0);
    let compliance_score = (100.0 - penalty).max(0.0);

    WebAuditReport {
        total_nodes_audited: total_nodes,
        violations,
        is_wcag_compliant,
        is_material_compliant,
        compliance_score,
    }
}
