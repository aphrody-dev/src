// SPDX-License-Identifier: Apache-2.0
//! Deterministic check of the two CSS sheets this crate generates (`tokens_css` and `static_css`).

use aphrody_design_tokens::{
    scheme::Variant,
    sheets::{BASELINE_SEED, static_css, tokens_css},
};

#[test]
fn fusion_tokens_sheet_is_deterministic_and_complete() {
    let first = tokens_css(BASELINE_SEED, Variant::TonalSpot, 0.0);
    let second = tokens_css(BASELINE_SEED, Variant::TonalSpot, 0.0);
    assert_eq!(first, second);
    assert!(first.contains("--md-sys-color-primary:"));
    assert!(first.contains("--md-sys-color-surface:"));
    assert!(first.len() > 2_000);
}

#[test]
fn static_tokens_sheet_is_deterministic_and_complete() {
    let first = static_css();
    let second = static_css();
    assert_eq!(first, second);
    assert!(first.contains("--md-sys-shape-corner-"));
    assert!(first.contains("--md-sys-typescale-"));
    assert!(first.len() > 2_000);
}
