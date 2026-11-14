// SPDX-License-Identifier: Apache-2.0
//! Unit tests proving shared pages, components, OCAP membranes, NSH batches, AnyRender scenes,
//! Dioxus 0.8 SSR, Ratatui buffers, Ropey editors, and all 9 themes work together across 11 targets.

use taffy::TilingStrategy;

use super::*;
use crate::shared::YoloThemePreset;

#[test]
fn theme_bridge_exports_all_nine_presets_with_css_gpui_hyprland_winui() {
    assert_eq!(FusionThemePreset::ALL.len(), 9);
    for preset in FusionThemePreset::ALL {
        let dark = ResolvedFusionTheme::resolve(preset, true);
        let light = ResolvedFusionTheme::resolve(preset, false);
        assert_eq!(dark.roles().len(), 49);
        assert_eq!(light.roles().len(), 49);
        assert!(dark.to_css_variables().contains("--md-sys-color-primary:"));
        assert!(dark.to_hyprland_conf().contains("col.active_border"));
        assert!(dark.to_winui_xaml_resources().contains("SystemAccentColor"));
        assert_eq!(dark.to_gpui_kit_json()["preset"], preset.id());
        let roundtrip = FusionThemePreset::from_yolo(preset.to_yolo());
        assert!(!roundtrip.id().is_empty());
    }
    assert_eq!(
        FusionThemePreset::from_yolo(YoloThemePreset::Hyprland),
        FusionThemePreset::Hyprland
    );
}

#[test]
fn canonical_pages_render_zero_overflow_across_all_11_targets() {
    let manifest = ecosystem_manifest();
    assert_eq!(manifest.theme_count, 9);
    assert_eq!(manifest.component_count, 23);
    assert_eq!(manifest.page_count, 4);
    assert_eq!(manifest.target_count, 11);

    for page in CanonicalPage::ALL {
        for target in RenderTarget::ALL {
            let preset = match target {
                RenderTarget::LinuxWayland => FusionThemePreset::Hyprland,
                RenderTarget::UnixPosix => FusionThemePreset::Omarchy,
                RenderTarget::WinUi3 => FusionThemePreset::Fluent,
                _ => FusionThemePreset::Aphrody,
            };
            let frame = render_page_to_target(page, preset, preset.spec().default_dark, target, None, None)
                .unwrap_or_else(|e| panic!("failed {:?} on {:?}: {e}", page, target));
            assert_eq!(frame.vitals.horizontal_overflow_px, 0.0, "overflow on {:?}/{:?}", page, target);
            assert!(frame.a11y_node_count >= 4);
            assert!(!frame.payload.is_empty());
        }
    }
}

#[cfg(feature = "dioxus")]
#[test]
fn dioxus_ssr_and_subsecond_jump_table_work() {
    let frame = render_page_to_target(
        CanonicalPage::StudioWorkspace,
        FusionThemePreset::Catppuccin,
        true,
        RenderTarget::WebWasmSsr,
        Some(1280.0),
        Some(720.0),
    )
    .unwrap();
    assert!(frame.payload.contains("<!doctype html>"));
    assert!(frame.payload.contains("data-aphrody-target=\"web-wasm-ssr\""));
    assert!(frame.payload.contains("data-ui-kind=\"code-editor\""));
    assert!(frame.secondary_artifacts.contains_key("subsecond_jump_table.json"));

    let jt = build_subsecond_jump_table("patch.so", &[(0x100, 0x200)]);
    assert_eq!(jt.map.get(&0x100), Some(&0x200));
}

#[cfg(feature = "anyrender")]
#[test]
fn anyrender_scene_records_fill_and_stroke_commands() {
    let frame = render_page_to_target(
        CanonicalPage::DesignSystemGallery,
        FusionThemePreset::CachyOs,
        true,
        RenderTarget::WinitWgpu,
        Some(1280.0),
        Some(720.0),
    )
    .unwrap();
    assert!(frame.scene_command_count >= 10);
}

#[cfg(feature = "tui")]
#[test]
fn ratatui_buffer_and_anstyle_cli_render_non_empty() {
    let tui_frame = render_page_to_target(
        CanonicalPage::IntelligentTerminal,
        FusionThemePreset::Gruvbox,
        true,
        RenderTarget::Tui,
        Some(800.0),
        Some(480.0),
    )
    .unwrap();
    assert!(tui_frame.payload.contains("Intelligent Terminal"));
    assert!(tui_frame.payload.contains("gruvbox"));

    let cli_frame = render_page_to_target(
        CanonicalPage::IntelligentTerminal,
        FusionThemePreset::Nord,
        true,
        RenderTarget::Cli,
        Some(720.0),
        Some(400.0),
    )
    .unwrap();
    assert!(cli_frame.payload.contains("\x1b["));
    assert!(cli_frame.payload.contains("term-pane-left"));
}

#[test]
fn embedded_gpui_ocap_revocation_and_nsh_platform_adaptation_work() {
    let mut host = ObjectHost::new();
    let frame = host.begin_frame(1280, 720);
    let r = host.objects.insert(
        "surface-api",
        "BrowserWaylandSlot",
        [0.0, 0.0, 640.0, 480.0],
        MembraneKind::Revocable { revoked: false },
    );
    host.submit_turn(Turn {
        frame_seq: frame.seq,
        ops: vec![
            OcapOp::SetViewLabel {
                target: r.id,
                label: "RenamedSlot".to_owned(),
            },
            OcapOp::Revoke { target: r.id },
        ],
    });
    assert_eq!(host.tick().unwrap(), 2);
    assert!(host.objects.get(r.id).is_none());

    host.submit_turn(Turn {
        frame_seq: frame.seq + 1,
        ops: vec![OcapOp::SetViewLabel {
            target: r.id,
            label: "ShouldFailAfterRevoke".to_owned(),
        }],
    });
    assert!(host.tick().is_err());
    assert!(emit_wit_contract().contains("interface surface-api"));
    assert!(emit_dts_contract().contains("export interface ViewApi"));

    let mut shadow = NshShadowTree::new();
    let sheet = shadow.push_node("modal-dialog", "Command", serde_json::json!({}), vec![]);
    let desktop = shadow.compile_for_platform(NshPlatform::Linux, &[(sheet, [0.0, 0.0, 400.0, 300.0])]);
    let mobile = shadow.compile_for_platform(NshPlatform::Ios, &[(sheet, [0.0, 0.0, 390.0, 300.0])]);
    assert_eq!(desktop.overlay_mode, AdaptiveOverlayMode::DesktopPopup);
    assert_eq!(mobile.overlay_mode, AdaptiveOverlayMode::MobileBottomSheet);
    assert!(mobile.safe_area.top > desktop.safe_area.top);

    let geom = solve_wayland_workspace(1280.0, 720.0, 12.0, 3, TilingStrategy::Dwindle);
    assert_eq!(geom.tiles.len(), 3);
    assert!(geom.zones.usable_content.width > 500.0);
}

#[cfg(feature = "editor")]
#[test]
fn ropey_editor_buffer_metrics_and_parley_layout_work() {
    let metrics = measure_rope_editor_buffer("line 1\nline 2\nline 3");
    assert_eq!(metrics.lines, 3);
    assert_eq!(metrics.first_line, "line 1");

    let tree = CanonicalPage::StudioWorkspace.build_ui_tree();
    let computed = compute_ui_layout(&tree, 1280.0, 720.0, true).unwrap();
    assert_eq!(computed.vitals.horizontal_overflow_px, 0.0);
}
