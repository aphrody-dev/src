use taffy::{
    prelude::*, FigmaAutoLayoutAlign, FigmaAutoLayoutDirection, FigmaAutoLayoutSpec, LayoutRect,
    TerminalSplitNode, TilingStrategy, WaylandShellMargins, WaylandShellZones, solve_terminal_panes,
    solve_tiling_rects,
};

#[test]
fn wayland_shell_zones_compute_consistent_rects() {
    let zones = WaylandShellZones::solve(
        Size { width: 1920.0, height: 1080.0 },
        WaylandShellMargins { top: 36.0, bottom: 48.0, left: 72.0, right: 240.0 },
    );

    assert_eq!(zones.viewport, LayoutRect::new(0.0, 0.0, 1920.0, 1080.0));
    assert_eq!(zones.top_bar, LayoutRect::new(0.0, 0.0, 1920.0, 36.0));
    assert_eq!(zones.left_panel, LayoutRect::new(0.0, 36.0, 72.0, 996.0));
    assert_eq!(zones.usable_content, LayoutRect::new(72.0, 36.0, 1608.0, 996.0));
    assert_eq!(zones.right_panel, LayoutRect::new(1680.0, 36.0, 240.0, 996.0));
    assert_eq!(zones.bottom_bar, LayoutRect::new(0.0, 1032.0, 1920.0, 48.0));
    assert_eq!(zones.overlay, zones.viewport);
}

#[test]
fn tiling_strategies_produce_non_overlapping_within_viewport() {
    let vp = LayoutRect::new(10.0, 20.0, 1000.0, 600.0);

    for strategy in [TilingStrategy::MasterStack, TilingStrategy::Dwindle, TilingStrategy::Grid] {
        let rects = solve_tiling_rects(vp, 8.0, 0.55, 4, strategy);
        assert_eq!(rects.len(), 4);
        for rect in &rects {
            assert!(rect.width > 0.0 && rect.height > 0.0, "empty tile: {rect:?}");
            assert!(rect.x >= vp.x - 0.5 && rect.x + rect.width <= vp.x + vp.width + 0.5);
            assert!(rect.y >= vp.y - 0.5 && rect.y + rect.height <= vp.y + vp.height + 0.5);
        }
    }

    let monocle = solve_tiling_rects(vp, 8.0, 0.55, 4, TilingStrategy::Monocle);
    assert_eq!(monocle, vec![vp]);
}

#[test]
fn terminal_splitter_computes_proportional_panes() {
    let tree = TerminalSplitNode::Row {
        weight: 1.0,
        children: vec![
            TerminalSplitNode::Pane { id: 1, weight: 0.5 },
            TerminalSplitNode::Column {
                weight: 0.5,
                children: vec![
                    TerminalSplitNode::Pane { id: 2, weight: 0.5 },
                    TerminalSplitNode::Pane { id: 3, weight: 0.5 },
                ],
            },
        ],
    };

    let panes = solve_terminal_panes(&tree, LayoutRect::new(0.0, 0.0, 1008.0, 608.0), 8.0);
    assert_eq!(panes.len(), 3);
    assert!((panes[0].rect.width - 500.0).abs() < 1.0);
    assert!((panes[0].rect.height - 608.0).abs() < 1.0);
    assert!((panes[1].rect.x - 508.0).abs() < 1.0);
    assert!((panes[1].rect.height - 300.0).abs() < 1.0);
    assert!((panes[2].rect.y - 308.0).abs() < 1.0);
}

#[test]
fn figma_autolayout_translates_to_taffy_tree() {
    let spec = FigmaAutoLayoutSpec {
        direction: FigmaAutoLayoutDirection::Horizontal,
        gap: 12.0,
        padding: [16.0, 20.0, 16.0, 20.0],
        width: Some(320.0),
        height: Some(80.0),
        primary_align: FigmaAutoLayoutAlign::SpaceBetween,
        counter_align: FigmaAutoLayoutAlign::Center,
        wrap: false,
    };

    let mut tree: TaffyTree<()> = TaffyTree::new();
    let child_a = tree
        .new_leaf(Style { size: Size { width: length(40.0), height: length(24.0) }, ..Style::DEFAULT })
        .unwrap();
    let child_b = tree
        .new_leaf(Style { size: Size { width: length(60.0), height: length(24.0) }, ..Style::DEFAULT })
        .unwrap();
    let frame = tree.new_with_children(spec.to_taffy_style(), &[child_a, child_b]).unwrap();
    tree.compute_layout(frame, Size::MAX_CONTENT).unwrap();

    let la = tree.layout(child_a).unwrap();
    let lb = tree.layout(child_b).unwrap();
    assert_eq!(la.location.x, 20.0);
    assert_eq!(la.location.y, 28.0);
    assert_eq!(lb.location.x, 240.0);
    assert_eq!(lb.location.y, 28.0);
}

#[test]
fn design_md_screen_spec_solves_taffy_shell_and_panes() {
    let plan = taffy::ecosystem::solve_design_md_taffy_grid(
        taffy::ecosystem::DesignMdScreenSpec::desktop(3),
    )
    .expect("solve_design_md_taffy_grid");
    assert_eq!(plan.size_class, taffy::google_design::WindowSizeClass::Large);
    assert_eq!(plan.recommended_columns, 12);
    assert_eq!(plan.panes.len(), 3);
    assert!(plan.shell.usable_content.width > 0.0);
    assert!(plan.shell.usable_content.height > 0.0);
    for pane in &plan.panes {
        assert!(pane.x >= plan.shell.usable_content.x);
        assert!(pane.y >= plan.shell.usable_content.y);
        assert!(pane.width > 0.0 && pane.height > 0.0);
    }
}
