//! One C ABI for the monorepo's native libraries, built as `aphrody_ffi` (`aphrody_ffi.dll`,
//! `libaphrody_ffi.so`, `libaphrody_ffi.dylib`).
//!
//! Symbol names are a stable contract with their consumers and never change:
//! - Unified ABI entrypoints: `aphrody_abi_version`, `aphrody_free`.
//! - feature `depot` (default): `depot_*`, native depot FFI contract (`crates/depot*`, `packages/ffi-bridge`).
//!   Strings are NUL-terminated and released with `depot_free_string` (or `aphrody_free`);
//!   `depot_abi_version` returns [`depot::DEPOT_ABI_VERSION`].
//! - feature `web` (default): `aphrody_*` from `corelib::web` (Boq parser; the adblock engine is
//!   `crates/adblock-capi`),
//!   framed buffers released with `aphrody_chromium_buf_free`.
//!
//! A consumer that needs one surface builds a smaller library with
//! `--no-default-features --features <surface>`.
//! `rust_stack_ffi` (`rs_*`, used by Go `src-deploy` and `packages/ffi-bridge`) stays in
//! `crates/rust-stack`.

pub use aphrody_core_capi::{aphrody_abi_version, aphrody_free};

#[cfg(feature = "depot")]
pub mod depot;
pub mod mwg;
#[cfg(feature = "web")]
pub mod web;
