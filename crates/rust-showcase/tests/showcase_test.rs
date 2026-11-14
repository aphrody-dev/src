// SPDX-License-Identifier: Apache-2.0

use rust_showcase::catalog::{ABI_BRIDGES, FIRST_PARTY_CRATES, THIRD_PARTY_BRICKS};
use rust_showcase::font::{ATLAS_H, ATLAS_W, build_rgba_atlas};
use rust_showcase::gpu_scene::{VIRT_H, VIRT_W, build_scene};
use rust_showcase::state::{ShowcaseAction, ShowcaseState, ShowcaseTab};

#[test]
fn shared_catalog_and_tabs_build_valid_gpu_scenes() {
    assert!(FIRST_PARTY_CRATES.len() >= 80);
    assert!(THIRD_PARTY_BRICKS.len() >= 18);
    assert!(ABI_BRIDGES.len() >= 5);

    let atlas = build_rgba_atlas();
    assert_eq!(atlas.len(), (ATLAS_W * ATLAS_H * 4) as usize);

    let mut state = ShowcaseState::new("test");
    for idx in 0..ShowcaseTab::ALL.len() {
        state.dispatch(ShowcaseAction::SetTab(idx));
        let snap = state.snapshot();
        let scene = build_scene(&state, &snap);
        assert!(!scene.quads.is_empty(), "tab {idx} emitted 0 quads");
        assert!(!scene.hits.is_empty(), "tab {idx} emitted 0 hitboxes");
        for hit in &scene.hits {
            assert!(hit.x >= 0.0 && hit.y >= 0.0);
            assert!(hit.x + hit.w <= VIRT_W + 1.0);
            assert!(hit.y + hit.h <= VIRT_H + 1.0);
        }
    }
}

#[test]
fn theme_search_and_taffy_actions_update_snapshot() {
    let mut state = ShowcaseState::new("desktop");
    state.dispatch(ShowcaseAction::SetPreset(3));
    state.dispatch(ShowcaseAction::ToggleDark);
    state.dispatch(ShowcaseAction::SetDomainFilter(Some(0)));
    state.dispatch(ShowcaseAction::SetSearch("taffy".to_owned()));
    let snap = state.snapshot();
    assert_eq!(snap.preset_id, "hyprland");
    assert!(snap.filtered_crates.iter().any(|c| c.package == "taffy"));
    assert_eq!(snap.rendered_frame.vitals.horizontal_overflow_px, 0.0);
    assert!(snap.native_ffi_sample.is_some());
}
