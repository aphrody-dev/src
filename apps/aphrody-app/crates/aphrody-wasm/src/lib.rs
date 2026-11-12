//! Browser build of aphrody-app. On native targets only the platform-independent
//! scene packing is compiled (so `cargo test --workspace` works everywhere).

pub mod scene;

#[cfg(target_arch = "wasm32")]
mod gpu;
#[cfg(target_arch = "wasm32")]
mod opfs;
#[cfg(target_arch = "wasm32")]
mod web;
