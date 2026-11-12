//! One C ABI for the monorepo's native libraries, built as `aphrody_ffi` (`aphrody_ffi.dll`,
//! `libaphrody_ffi.so`, `libaphrody_ffi.dylib`).
//!
//! Symbol names are a stable contract with their consumers and never change:
//! - feature `depot` (default): `depot_*`, read by `bun:ffi` in `packages/forge`
//!   (`src/depot_ffi.ts`, `src/depot-bridge.ts`). Strings are NUL-terminated and released
//!   with `depot_free_string`; `depot_abi_version` returns [`depot::DEPOT_ABI_VERSION`].
//! - feature `web` (default): `aphrody_*` from `corelib::web` (Boq parser, adblock engine),
//!   framed buffers released with `aphrody_chromium_buf_free`.
//!
//! A consumer that needs one surface builds a smaller library with
//! `--no-default-features --features <surface>`.
//! `rust_stack_ffi` (`rs_*`, used by Go `src-deploy` and `infra/ffi-bridge`) stays in
//! `crates/rust-stack`.

#[cfg(feature = "depot")]
pub mod depot;
#[cfg(feature = "web")]
pub mod web;
