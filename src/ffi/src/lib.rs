//! One C ABI for the monorepo's native libraries, built as `aphrody_ffi` (`aphrody_ffi.dll`,
//! `libaphrody_ffi.so`, `libaphrody_ffi.dylib`).
//!
//! Symbol names are a stable contract with their consumers and never change:
//! - Unified ABI entrypoints: `aphrody_abi_version`, `aphrody_free`.
//! - feature `depot` (default): `depot_*`, native depot FFI contract (`crates/depot*`).
//!   Strings are NUL-terminated and released with `depot_free_string` (or `aphrody_free`);
//!   `depot_abi_version` returns [`depot::DEPOT_ABI_VERSION`].
//! - feature `re` (default): `aphrody_re_*`, `aphrody_ghidra_*`, `aphrody_mingw_*`, `aphrody_lua52_*`
//!   (`src/re`). Strings are released with `aphrody_free`.
//! - feature `web` (default): `aphrody_*` from `corelib::web` (Boq parser; the adblock engine is
//!   `src/corelib/adblock-capi`),
//!   framed buffers released with `aphrody_chromium_buf_free`.
//!
//! A consumer that needs one surface builds a smaller library with
//! `--no-default-features --features <surface>`.
//! `rust_stack_ffi` (`rs_*`, used by Go `src-deploy` and `packages/ffi-bridge`) stays in
//! `src/rust-stack`.

pub use aphrody_core_capi::{aphrody_abi_version, aphrody_free};

#[cfg(feature = "depot")]
pub mod depot;
pub mod mwg;
#[cfg(feature = "re")]
pub mod re;
#[cfg(feature = "web")]
pub mod web;
