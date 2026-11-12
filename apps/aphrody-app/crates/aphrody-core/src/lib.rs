pub mod fluid;
pub mod layout;
pub mod state;
pub mod store;
pub mod wayland;
pub mod webmcp;
pub mod wire;
pub mod wm;

/// Marker for values that must be `Send` on native targets but not on wasm32,
/// where the single-threaded OPFS backend holds non-`Send` JS handles.
#[cfg(target_arch = "wasm32")]
pub trait MaybeSend {}
#[cfg(target_arch = "wasm32")]
impl<T: ?Sized> MaybeSend for T {}
#[cfg(not(target_arch = "wasm32"))]
pub trait MaybeSend: Send {}
#[cfg(not(target_arch = "wasm32"))]
impl<T: ?Sized + Send> MaybeSend for T {}

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
