#[cfg(windows)]
pub mod hyperv;
#[cfg(unix)]
pub mod unix;

use crate::wire::{WaylandMessage, WireError};
use std::collections::VecDeque;
use std::path::PathBuf;

/// Cross-platform Wayland compositor/client transport endpoint descriptor.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WaylandEndpoint {
    UnixSocket(PathBuf),
    HyperVVsock { vm_id: String, port: u32 },
    Loopback,
}

impl WaylandEndpoint {
    /// Returns the default native endpoint for the active platform and environment.
    pub fn default_native() -> Self {
        let display = std::env::var("WAYLAND_DISPLAY")
            .ok()
            .filter(|v| !v.trim().is_empty())
            .unwrap_or_else(|| "wayland-0".to_string());
        let p = PathBuf::from(&display);
        if p.is_absolute() {
            return Self::UnixSocket(p);
        }
        if let Ok(rt) = std::env::var("XDG_RUNTIME_DIR")
            && !rt.trim().is_empty()
        {
            return Self::UnixSocket(PathBuf::from(rt).join(&display));
        }
        #[cfg(windows)]
        {
            Self::HyperVVsock {
                vm_id: "wildcard".to_string(),
                port: hyperv::WSL2_WAYLAND_VSOCK_PORT,
            }
        }
        #[cfg(not(windows))]
        {
            Self::UnixSocket(PathBuf::from("/tmp").join(display))
        }
    }
}

pub trait WaylandTransport: Send + Sync {
    fn send(&mut self, msg: &WaylandMessage) -> Result<(), WireError>;
    fn receive(&mut self) -> Result<Option<WaylandMessage>, WireError>;
    fn is_connected(&self) -> bool;
}

pub struct LoopbackTransport {
    pub client_to_server: VecDeque<WaylandMessage>,
    pub server_to_client: VecDeque<WaylandMessage>,
    pub connected: bool,
}

impl Default for LoopbackTransport {
    fn default() -> Self {
        Self::new()
    }
}

impl LoopbackTransport {
    pub fn new() -> Self {
        Self {
            client_to_server: VecDeque::new(),
            server_to_client: VecDeque::new(),
            connected: true,
        }
    }

    pub fn client_send(&mut self, msg: WaylandMessage) {
        self.client_to_server.push_back(msg);
    }

    pub fn server_receive(&mut self) -> Option<WaylandMessage> {
        self.client_to_server.pop_front()
    }

    pub fn server_send(&mut self, msg: WaylandMessage) {
        self.server_to_client.push_back(msg);
    }

    pub fn client_receive(&mut self) -> Option<WaylandMessage> {
        self.server_to_client.pop_front()
    }
}
