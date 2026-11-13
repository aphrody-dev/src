//! `aphrody-ui`: the Rust core of the Aphrody design system.
//!
//! One crate, one module per concern:
//! - [`color`]: Material 3 color science (HCT, CAM16, tonal palettes, dynamic schemes, contrast,
//!   quantizers, image source color), checked against `@material/material-color-utilities` 0.4.0
//!   fixtures; typography, shape, elevation, motion and state-layer tokens.
//! - [`components`]: M3 component contracts (state, variants, WAI-ARIA, focus, keyboard, measures).
//! - [`layout`]: CSS and utility parsing lowered to `taffy` layout trees.
//! - [`shared`]: theme presets and manifest types shared by the hosts.
//! - [`react`], [`next`]: React/Next.js analysis and migration front ends.
//! - [`brand`]: `ay brand build`, rendering assets/brand with `packages/design/tokens/tokens.rs`.
//!
//! Brand colors come from `packages/design` (Material Color Utilities from assets/brand/brand.toml);
//! see docs/ui/STACK.md.
#![allow(clippy::struct_excessive_bools, clippy::doc_markdown, clippy::too_many_lines)]

#[cfg(feature = "brand")]
pub mod brand;
pub mod color;
pub mod components;
#[cfg(feature = "layout")]
pub mod layout;
#[cfg(feature = "next")]
pub mod next;
#[cfg(feature = "react")]
pub mod react;
pub mod shared;
