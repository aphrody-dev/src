// SPDX-License-Identifier: Apache-2.0 OR MIT
//! Isolated OS & zero-copy memory-map boundary (`Rust-in-Linux` / `Rust-for-Chromium` FFI rule).
//! Every `unsafe` call carries an explicit `// SAFETY:` proof.

use crate::error::{ErrorKind, N2bError, N2bResult};
use memmap2::Mmap;
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HostHardwareProfile {
    pub logical_cpus: usize,
    pub total_ram_mb: u64,
    pub os_family: String,
    pub arch: String,
}

/// Queries native host CPU/RAM telemetry using `windows-sys` on Windows NT or portable fallback.
pub fn query_host_hardware() -> HostHardwareProfile {
    let logical_cpus = std::thread::available_parallelism()
        .map(|n| n.get())
        .unwrap_or(1);

    #[cfg(windows)]
    let total_ram_mb = {
        use windows_sys::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
        let mut status = MEMORYSTATUSEX {
            dwLength: core::mem::size_of::<MEMORYSTATUSEX>() as u32,
            dwMemoryLoad: 0,
            ullTotalPhys: 0,
            ullAvailPhys: 0,
            ullTotalPageFile: 0,
            ullAvailPageFile: 0,
            ullTotalVirtual: 0,
            ullAvailVirtual: 0,
            ullAvailExtendedVirtual: 0,
        };
        // SAFETY: `status` is stack-allocated, fully initialized with valid `dwLength = sizeof(MEMORYSTATUSEX)`,
        // and outlives the synchronous Win32 `GlobalMemoryStatusEx` kernel32 call.
        let ok = unsafe { GlobalMemoryStatusEx(&mut status) };
        if ok != 0 {
            status.ullTotalPhys / (1024 * 1024)
        } else {
            0
        }
    };

    #[cfg(not(windows))]
    let total_ram_mb = 0;

    HostHardwareProfile {
        logical_cpus,
        total_ram_mb,
        os_family: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
    }
}

/// Memory-maps a read-only file if non-empty, avoiding heap copies across 100k+ file monorepos.
pub enum MappedBuffer {
    Empty,
    Mmap(Mmap),
}

impl MappedBuffer {
    pub fn open(path: &Path) -> N2bResult<Self> {
        let file = File::open(path).map_err(|e| N2bError::io(&e, &path.display().to_string()))?;
        let meta = file
            .metadata()
            .map_err(|e| N2bError::io(&e, &path.display().to_string()))?;
        if meta.len() == 0 {
            return Ok(Self::Empty);
        }
        // SAFETY: `file` is opened read-only. In static analysis and read-only submodule / source walks,
        // underlying files are immutable during the map's short lexical lifetime.
        let mmap = unsafe { Mmap::map(&file) }
            .map_err(|e| N2bError::new(ErrorKind::Io, format!("mmap {}: {e}", path.display())))?;
        Ok(Self::Mmap(mmap))
    }

    #[inline]
    pub fn as_bytes(&self) -> &[u8] {
        match self {
            Self::Empty => &[],
            Self::Mmap(m) => m.as_ref(),
        }
    }
}
