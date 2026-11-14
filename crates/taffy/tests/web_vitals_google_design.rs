//! Comprehensive unit and integration tests for:
//! - Exact mathematical Cumulative Layout Shift (CLS)
//! - Largest Contentful Paint (LCP) candidate solver
//! - Modern Web Guidelines & WCAG 2.2 AA layout auditor
//! - Sub-millisecond INP frame layout budget profiler
//! - Google Design System (Material 3 Expressive) tokens and framework bridges

use taffy::prelude::*;
use taffy::{
    audit_modern_web_guidelines, classify_cls_score, classify_lcp_duration,
    google_brand, m3_bento_grid_style, m3_card_style, m3_navigation_rail_style,
    m3_search_bar_style, m3_touch_button_style, profile_tree_layout,
    AuditOptions, AuditSeverity, AuditViolationKind, ClsTracker, DioxusStyleBridge,
    GpuiLayoutBridge, LcpElementType, LcpOptions, LongbridgeThemeBridge,
    M3ColorScheme, M3CornerRadius, M3Elevation, M3TypographyScale, Point, VitalsRating,
    WindowSizeClass,
};

#[test]
fn test_exact_cls_detection_unreserved_vs_reserved_banner() {
    let viewport = Size {
        width: 400.0,
        height: 800.0,
    };
    let mut tracker = ClsTracker::new();

    // -------------------------------------------------------------
    // Scenario A: Unreserved dynamic banner insertion causes high CLS
    // -------------------------------------------------------------
    let mut tree_a: TaffyTree<()> = TaffyTree::new();

    let header_style = Style {
        size: Size {
            width: percent(1.0),
            height: length(60.0),
        },
        ..Default::default()
    };
    let header_node = tree_a.new_leaf(header_style.clone()).unwrap();

    let article_style = Style {
        size: Size {
            width: percent(1.0),
            height: length(400.0),
        },
        ..Default::default()
    };
    let article_node = tree_a.new_leaf(article_style.clone()).unwrap();

    let root_style = Style {
        display: Display::Flex,
        flex_direction: FlexDirection::Column,
        size: Size {
            width: length(400.0),
            height: length(800.0),
        },
        ..Default::default()
    };
    let root_a = tree_a.new_with_children(root_style.clone(), &[header_node, article_node]).unwrap();

    tree_a
        .compute_layout(
            root_a,
            Size {
                width: AvailableSpace::Definite(400.0),
                height: AvailableSpace::Definite(800.0),
            },
        )
        .unwrap();

    // Frame 1 snapshot (initial frame, baseline)
    let shift_f1 = tracker.snapshot_frame(&tree_a, root_a, viewport);
    assert!(shift_f1.is_none(), "Initial frame should not report a layout shift");
    assert_eq!(tracker.cumulative_score(), 0.0);

    // Frame 2: An unreserved ad banner is inserted between header and article!
    let banner_style = Style {
        size: Size {
            width: percent(1.0),
            height: length(120.0),
        },
        ..Default::default()
    };
    let banner_node = tree_a.new_leaf(banner_style).unwrap();
    tree_a.set_children(root_a, &[header_node, banner_node, article_node]).unwrap();

    tree_a
        .compute_layout(
            root_a,
            Size {
                width: AvailableSpace::Definite(400.0),
                height: AvailableSpace::Definite(800.0),
            },
        )
        .unwrap();

    // Frame 2 snapshot (article shifted down by 120px)
    let shift_f2 = tracker.snapshot_frame(&tree_a, root_a, viewport);
    assert!(shift_f2.is_some(), "Unreserved banner insertion must trigger a layout shift");
    let entry = shift_f2.unwrap();

    assert!(entry.value > 0.0, "Shift value must be positive");
    // Article moved down by 120px in an 800px high viewport:
    // distance_fraction = 120.0 / 800.0 = 0.15
    assert!(
        (entry.distance_fraction - 0.15).abs() < 1e-3,
        "Distance fraction should be 0.15, got {}",
        entry.distance_fraction
    );
    assert!(entry.impact_fraction > 0.0, "Impact fraction must be positive");
    assert!(tracker.cumulative_score() > 0.0);

    // -------------------------------------------------------------
    // Scenario B: Reserved space / placeholder prevents all CLS
    // -------------------------------------------------------------
    let mut tracker_b = ClsTracker::new();
    let mut tree_b: TaffyTree<()> = TaffyTree::new();

    let header_b = tree_b.new_leaf(header_style).unwrap();

    // Reserved slot with fixed height = 120.0 (or aspect ratio)
    let reserved_slot_style = Style {
        size: Size {
            width: percent(1.0),
            height: length(120.0),
        },
        ..Default::default()
    };
    let reserved_slot_node = tree_b.new_leaf(reserved_slot_style).unwrap();

    let article_b = tree_b.new_leaf(article_style).unwrap();
    let root_b = tree_b
        .new_with_children(root_style, &[header_b, reserved_slot_node, article_b])
        .unwrap();

    tree_b
        .compute_layout(
            root_b,
            Size {
                width: AvailableSpace::Definite(400.0),
                height: AvailableSpace::Definite(800.0),
            },
        )
        .unwrap();

    let shift_b1 = tracker_b.snapshot_frame(&tree_b, root_b, viewport);
    assert!(shift_b1.is_none());

    // Frame 2: The ad content populates inside the reserved slot
    let ad_content_style = Style {
        size: Size {
            width: percent(1.0),
            height: percent(1.0),
        },
        ..Default::default()
    };
    let ad_content = tree_b.new_leaf(ad_content_style).unwrap();
    tree_b.set_children(reserved_slot_node, &[ad_content]).unwrap();

    tree_b
        .compute_layout(
            root_b,
            Size {
                width: AvailableSpace::Definite(400.0),
                height: AvailableSpace::Definite(800.0),
            },
        )
        .unwrap();

    let shift_b2 = tracker_b.snapshot_frame(&tree_b, root_b, viewport);
    assert!(
        shift_b2.is_none(),
        "Reserved slot prevents content below from shifting -> zero CLS"
    );
    assert_eq!(tracker_b.cumulative_score(), 0.0);
    assert_eq!(tracker_b.rating(), VitalsRating::Good);
}

#[test]
fn test_lcp_hero_node_detection_responsive_12_column_m3() {
    let viewport = Size {
        width: 1000.0,
        height: 800.0,
    };
    let mut tree: TaffyTree<()> = TaffyTree::new();

    // Navigation Rail (80px width)
    let nav_rail_style = m3_navigation_rail_style();
    let nav_rail = tree.new_leaf(nav_rail_style).unwrap();

    // Main Content container
    let main_style = Style {
        display: Display::Flex,
        flex_direction: FlexDirection::Column,
        flex_grow: 1.0,
        gap: Size {
            width: zero(),
            height: length(16.0),
        },
        padding: Rect {
            left: length(24.0),
            right: length(24.0),
            top: length(24.0),
            bottom: length(24.0),
        },
        ..Default::default()
    };

    // Google Search Bar (584x48)
    let search_bar = tree.new_leaf(m3_search_bar_style()).unwrap();

    // Hero Banner: 700x300 = 210,000 px^2 (dominates LCP)
    let hero_banner_style = Style {
        size: Size {
            width: length(700.0),
            height: length(300.0),
        },
        ..Default::default()
    };
    let hero_banner = tree.new_leaf(hero_banner_style).unwrap();

    // Secondary Bento Grid with smaller cards (each 200x120 = 24,000 px^2)
    let card1 = tree.new_leaf(m3_card_style()).unwrap();
    let card2 = tree.new_leaf(m3_card_style()).unwrap();
    let bento_grid_style = m3_bento_grid_style(2, 16.0);
    let bento_grid = tree.new_with_children(bento_grid_style, &[card1, card2]).unwrap();

    let main_container = tree
        .new_with_children(main_style, &[search_bar, hero_banner, bento_grid])
        .unwrap();

    // Root layout container
    let root_style = Style {
        display: Display::Flex,
        flex_direction: FlexDirection::Row,
        size: Size {
            width: length(1000.0),
            height: length(800.0),
        },
        ..Default::default()
    };
    let root = tree.new_with_children(root_style, &[nav_rail, main_container]).unwrap();

    tree.compute_layout(
        root,
        Size {
            width: AvailableSpace::Definite(1000.0),
            height: AvailableSpace::Definite(800.0),
        },
    )
    .unwrap();

    let lcp_candidate = taffy::find_lcp_candidate(&tree, root, viewport, &LcpOptions::default());
    assert!(lcp_candidate.is_some(), "An LCP candidate must be found");

    let candidate = lcp_candidate.unwrap();
    assert_eq!(
        candidate.node_id, hero_banner,
        "The 700x300 hero banner should be identified as the LCP candidate"
    );
    assert_eq!(candidate.visible_area, 210000.0);
    assert!(
        candidate.viewport_coverage_percent >= 25.0,
        "Viewport coverage should be ~26.25%, got {:.2}%",
        candidate.viewport_coverage_percent
    );
    assert!(candidate.is_hero, "Must be tagged as is_hero");
    assert_eq!(candidate.element_type, LcpElementType::HeroBanner);
}

#[test]
fn test_wcag22_material3_touch_target_auditor() {
    let viewport = Size {
        width: 600.0,
        height: 800.0,
    };
    let mut tree: TaffyTree<()> = TaffyTree::new();

    // 1. Undersized button: 18x18px (Violates WCAG 2.2 SC 2.5.8 < 24x24)
    let undersized_style = Style {
        size: Size {
            width: length(18.0),
            height: length(18.0),
        },
        ..Default::default()
    };
    let undersized_btn = tree.new_leaf(undersized_style).unwrap();

    // 2. Suboptimal button: 30x30px (Meets WCAG 2.2 >= 24x24, but fails Google M3 < 48x48)
    let suboptimal_style = Style {
        size: Size {
            width: length(30.0),
            height: length(30.0),
        },
        ..Default::default()
    };
    let suboptimal_btn = tree.new_leaf(suboptimal_style).unwrap();

    // 3. Compliant button using m3_touch_button_style (>= 48x48dp)
    let compliant_btn = tree.new_leaf(m3_touch_button_style()).unwrap();

    // 4. Unsized image without aspect_ratio (Causes CLS risk)
    let unsized_media_style = Style {
        size: Size {
            width: auto(),
            height: auto(),
        },
        ..Default::default()
    };
    let unsized_image = tree.new_leaf(unsized_media_style).unwrap();

    let root_style = Style {
        display: Display::Flex,
        flex_direction: FlexDirection::Column,
        size: Size {
            width: length(600.0),
            height: length(800.0),
        },
        ..Default::default()
    };
    let root = tree
        .new_with_children(
            root_style,
            &[undersized_btn, suboptimal_btn, compliant_btn, unsized_image],
        )
        .unwrap();

    tree.compute_layout(
        root,
        Size {
            width: AvailableSpace::Definite(600.0),
            height: AvailableSpace::Definite(800.0),
        },
    )
    .unwrap();

    let mut audit_options = AuditOptions::default();
    audit_options.interactive_nodes.insert(undersized_btn);
    audit_options.interactive_nodes.insert(suboptimal_btn);
    audit_options.interactive_nodes.insert(compliant_btn);
    audit_options.media_nodes.insert(unsized_image);

    let report = audit_modern_web_guidelines(&tree, root, viewport, &audit_options);

    // Assert violations
    assert!(
        !report.is_wcag_compliant,
        "Tree with 18x18 button must fail WCAG 2.2 compliance"
    );
    assert!(!report.is_material_compliant);

    // Verify 18x18 button produced WCAG error
    let wcag_error = report.violations.iter().find(|v| {
        v.node_id == undersized_btn
            && matches!(v.kind, AuditViolationKind::WcagTouchTargetTooSmall { .. })
    });
    assert!(wcag_error.is_some(), "Undersized button must produce a WcagTouchTargetTooSmall error");
    assert_eq!(wcag_error.unwrap().severity, AuditSeverity::Error);

    // Verify 30x30 button produced Material warning
    let m3_warning = report.violations.iter().find(|v| {
        v.node_id == suboptimal_btn
            && matches!(v.kind, AuditViolationKind::MaterialTouchTargetSuboptimal { .. })
    });
    assert!(m3_warning.is_some(), "Suboptimal button must produce MaterialTouchTargetSuboptimal warning");
    assert_eq!(m3_warning.unwrap().severity, AuditSeverity::Warning);

    // Verify m3_touch_button_style button produced NO violations
    let compliant_violations = report.violations.iter().filter(|v| v.node_id == compliant_btn).count();
    assert_eq!(compliant_violations, 0, "m3_touch_button_style must produce zero violations");

    // Verify unsized image produced CLS risk warning
    let media_warning = report.violations.iter().find(|v| {
        v.node_id == unsized_image
            && matches!(v.kind, AuditViolationKind::UnsizedMediaMissingAspectRatio)
    });
    assert!(media_warning.is_some(), "Unsized media must produce UnsizedMediaMissingAspectRatio");
}

#[test]
fn test_submillisecond_inp_budget_1000_node_bento_grid() {
    let mut tree: TaffyTree<()> = TaffyTree::new();

    // Build 1,000 leaf nodes inside a 4-column Bento Grid
    const TOTAL_NODES: usize = 1000;
    let mut card_nodes = Vec::with_capacity(TOTAL_NODES);

    let card_style = Style {
        size: Size {
            width: length(120.0),
            height: length(80.0),
        },
        padding: Rect {
            left: length(8.0),
            right: length(8.0),
            top: length(8.0),
            bottom: length(8.0),
        },
        ..Default::default()
    };

    for _ in 0..TOTAL_NODES {
        let node = tree.new_leaf(card_style.clone()).unwrap();
        card_nodes.push(node);
    }

    let bento_container_style = m3_bento_grid_style(4, 8.0);
    let root = tree.new_with_children(bento_container_style, &card_nodes).unwrap();

    let report_res = profile_tree_layout(
        &mut tree,
        root,
        Size {
            width: AvailableSpace::Definite(1200.0),
            height: AvailableSpace::MinContent,
        },
    );

    assert!(report_res.is_ok(), "Profiled tree layout should succeed");
    let report = report_res.unwrap();

    assert!(report.node_count >= TOTAL_NODES);
    assert_eq!(report.inp_rating, VitalsRating::Good, "1000 nodes must easily pass <= 200ms INP");
    assert!(report.fits_60hz, "1000 nodes should fit within 60Hz (16.67ms)");
    assert!(report.throughput_nodes_per_sec > 0.0);
}

#[test]
fn test_google_design_tokens_and_bridges() {
    // 1. Window Size Classes
    assert_eq!(WindowSizeClass::from_width(480.0), WindowSizeClass::Compact);
    assert_eq!(WindowSizeClass::from_width(720.0), WindowSizeClass::Medium);
    assert_eq!(WindowSizeClass::from_width(1080.0), WindowSizeClass::Expanded);
    assert_eq!(WindowSizeClass::from_width(1440.0), WindowSizeClass::Large);
    assert_eq!(WindowSizeClass::from_width(1920.0), WindowSizeClass::ExtraLarge);

    assert_eq!(WindowSizeClass::Compact.grid_columns(), 4);
    assert_eq!(WindowSizeClass::Medium.grid_columns(), 8);
    assert_eq!(WindowSizeClass::Expanded.grid_columns(), 12);

    // 2. Google Brand Palette
    assert_eq!(google_brand::GOOGLE_BLUE.to_css_hex(), "#4285f4");
    assert_eq!(google_brand::GOOGLE_RED.to_css_hex(), "#ea4335");
    assert_eq!(google_brand::GOOGLE_YELLOW.to_css_hex(), "#fbbc05");
    assert_eq!(google_brand::GOOGLE_GREEN.to_css_hex(), "#34a853");

    // 3. Color Schemes
    let light = M3ColorScheme::light();
    let dark = M3ColorScheme::dark();
    assert_ne!(light.surface, dark.surface);
    let [r, g, b, a] = light.primary.to_f32_rgba();
    assert!(r >= 0.0 && r <= 1.0);
    assert!(g >= 0.0 && g <= 1.0);
    assert!(b >= 0.0 && b <= 1.0);
    assert_eq!(a, 1.0);

    // 4. Typography Scale
    let typo = M3TypographyScale::standard();
    assert_eq!(typo.display_large.font_size, 57.0);
    assert_eq!(typo.headline_medium.font_size, 28.0);
    assert_eq!(typo.body_medium.font_size, 14.0);
    assert_eq!(typo.label_large.font_size, 14.0);

    // 5. Corner Radius & Elevation
    assert_eq!(M3CornerRadius::None.to_dp(), 0.0);
    assert_eq!(M3CornerRadius::ExtraSmall.to_dp(), 4.0);
    assert_eq!(M3CornerRadius::Small.to_dp(), 8.0);
    assert_eq!(M3CornerRadius::Medium.to_dp(), 12.0);
    assert_eq!(M3CornerRadius::Large.to_dp(), 16.0);
    assert_eq!(M3CornerRadius::ExtraLarge.to_dp(), 28.0);
    assert_eq!(M3CornerRadius::Full.to_dp(), 9999.0);

    assert_eq!(M3Elevation::Level0.to_dp(), 0.0);
    assert_eq!(M3Elevation::Level5.to_dp(), 12.0);

    // 6. Dioxus Style Bridge
    let search_style = m3_search_bar_style();
    let css = DioxusStyleBridge::to_css_style(&search_style);
    assert!(css.contains("display: flex;"));
    assert!(css.contains("flex-direction: row;"));
    assert!(css.contains("width: 584.0px;"));
    assert!(css.contains("height: 48.0px;"));

    // 7. GPUI & Longbridge Theme Bridge
    let layout = Layout {
        order: 0,
        location: Point { x: 10.0, y: 20.0 },
        size: Size { width: 300.0, height: 150.0 },
        ..Default::default()
    };
    let (ox, oy, w, h) = GpuiLayoutBridge::to_gpui_bounds(&layout);
    assert_eq!((ox, oy, w, h), (10.0, 20.0, 300.0, 150.0));

    let theme_tokens = LongbridgeThemeBridge::to_theme_tokens(&light);
    assert!(theme_tokens.iter().any(|(k, _)| *k == "primary"));
    assert!(theme_tokens.iter().any(|(k, _)| *k == "surface"));

    // 8. Vitals classification helpers
    assert_eq!(classify_cls_score(0.05), VitalsRating::Good);
    assert_eq!(classify_cls_score(0.15), VitalsRating::NeedsImprovement);
    assert_eq!(classify_cls_score(0.30), VitalsRating::Poor);

    assert_eq!(classify_lcp_duration(1800.0), VitalsRating::Good);
    assert_eq!(classify_lcp_duration(3200.0), VitalsRating::NeedsImprovement);
    assert_eq!(classify_lcp_duration(4500.0), VitalsRating::Poor);
}
