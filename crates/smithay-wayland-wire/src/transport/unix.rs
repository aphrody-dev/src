use crate::wire::{WaylandMessage, WireError};
use std::env;
use std::io::{ErrorKind, Read, Write};
use std::os::unix::net::{UnixListener, UnixStream};
use std::path::{Path, PathBuf};

/// Resolves the Wayland socket path from `$WAYLAND_DISPLAY` and `$XDG_RUNTIME_DIR`.
pub fn resolve_wayland_socket_path() -> PathBuf {
    let display = env::var("WAYLAND_DISPLAY")
        .ok()
        .filter(|v| !v.trim().is_empty())
        .unwrap_or_else(|| "wayland-0".to_string());
    let path = PathBuf::from(&display);
    if path.is_absolute() {
        return path;
    }
    let runtime_dir = env::var("XDG_RUNTIME_DIR")
        .ok()
        .filter(|v| !v.trim().is_empty())
        .unwrap_or_else(|| "/tmp".to_string());
    Path::new(&runtime_dir).join(display)
}

/// Framed Wayland transport over a native POSIX `UnixStream`.
pub struct UnixWaylandTransport {
    stream: UnixStream,
    rx_buf: Vec<u8>,
    connected: bool,
}

impl UnixWaylandTransport {
    /// Connects to an existing Wayland Unix socket path in non-blocking mode.
    pub fn connect(path: &Path) -> std::io::Result<Self> {
        let stream = UnixStream::connect(path)?;
        stream.set_nonblocking(true)?;
        Ok(Self {
            stream,
            rx_buf: Vec::with_capacity(4096),
            connected: true,
        })
    }

    /// Binds a listener socket, removes a stale socket file if present, and wraps an accepted peer.
    pub fn bind_listener(path: &Path) -> std::io::Result<UnixListener> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        if path.exists() {
            let _ = std::fs::remove_file(path);
        }
        UnixListener::bind(path)
    }

    /// Wraps an already-connected `UnixStream` in non-blocking mode.
    pub fn from_stream(stream: UnixStream) -> std::io::Result<Self> {
        stream.set_nonblocking(true)?;
        Ok(Self {
            stream,
            rx_buf: Vec::with_capacity(4096),
            connected: true,
        })
    }
}

impl super::WaylandTransport for UnixWaylandTransport {
    fn send(&mut self, msg: &WaylandMessage) -> Result<(), WireError> {
        let mut buf = Vec::with_capacity(32);
        msg.encode(&mut buf);
        match self.stream.write_all(&buf) {
            Ok(()) => Ok(()),
            Err(e) if e.kind() == ErrorKind::BrokenPipe || e.kind() == ErrorKind::ConnectionReset => {
                self.connected = false;
                Err(WireError::UnexpectedEof)
            }
            Err(_) => {
                self.connected = false;
                Err(WireError::UnexpectedEof)
            }
        }
    }

    fn receive(&mut self) -> Result<Option<WaylandMessage>, WireError> {
        let mut tmp = [0u8; 4096];
        loop {
            match self.stream.read(&mut tmp) {
                Ok(0) => {
                    self.connected = false;
                    return if self.rx_buf.is_empty() {
                        Ok(None)
                    } else {
                        Err(WireError::UnexpectedEof)
                    };
                }
                Ok(n) => self.rx_buf.extend_from_slice(&tmp[..n]),
                Err(e) if e.kind() == ErrorKind::WouldBlock => break,
                Err(_) => {
                    self.connected = false;
                    return Err(WireError::UnexpectedEof);
                }
            }
        }

        if self.rx_buf.len() < 8 {
            return Ok(None);
        }
        let (sender_id, opcode, size, _payload) = match WaylandMessage::decode_raw(&self.rx_buf) {
            Ok(decoded) => decoded,
            Err(WireError::BufferTooShort { .. }) => return Ok(None),
            Err(e) => return Err(e),
        };
        self.rx_buf.drain(..size);
        Ok(Some(WaylandMessage::new(sender_id, opcode, Vec::new())))
    }

    fn is_connected(&self) -> bool {
        self.connected
    }
}
