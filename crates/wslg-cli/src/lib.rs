#[cfg(windows)]
pub mod app;

#[cfg(windows)]
pub use app::run;

/// WSLg compositor host: Windows only.
#[cfg(not(windows))]
pub fn run() -> Result<(), Box<dyn std::error::Error>> {
    Err("wslg-cli runs on Windows only (D3D12, Hyper-V sockets)".into())
}
