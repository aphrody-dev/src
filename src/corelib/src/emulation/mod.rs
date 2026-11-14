// SPDX-License-Identifier: Apache-2.0
//! Unified Emulation & Simulation Surface.
//!
//! Provides deterministic frame-stepping, virtual file system (VFS) mounting,
//! input state handling, and scripting runtime abstractions across Shenron & RoseGriffon.

use std::collections::HashMap;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use crate::error::{CorelibError, Result};

/// Deterministic fixed-step simulation clock
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimulationClock {
    pub target_fps: u32,
    pub fixed_delta_seconds: f64,
    pub accumulator: f64,
    pub current_frame: u64,
    pub total_elapsed: f64,
}

impl SimulationClock {
    pub fn new(target_fps: u32) -> Self {
        let fps = target_fps.max(1);
        Self {
            target_fps: fps,
            fixed_delta_seconds: 1.0 / (fps as f64),
            accumulator: 0.0,
            current_frame: 0,
            total_elapsed: 0.0,
        }
    }

    /// Advance clock by real-world delta time, returning the number of fixed ticks to execute
    pub fn advance(&mut self, dt_seconds: f64) -> u32 {
        // Clamp maximum frame time to prevent "spiral of death" during hitches
        let clamped_dt = dt_seconds.min(0.25);
        self.accumulator += clamped_dt;
        self.total_elapsed += clamped_dt;

        let mut ticks = 0;
        while self.accumulator >= self.fixed_delta_seconds {
            self.accumulator -= self.fixed_delta_seconds;
            self.current_frame += 1;
            ticks += 1;
        }
        ticks
    }

    /// Calculate interpolation factor (alpha in [0.0, 1.0)) for rendering between frames
    pub fn interpolation_alpha(&self) -> f64 {
        self.accumulator / self.fixed_delta_seconds
    }
}

/// Unified gamepad and keyboard input state
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct InputState {
    pub buttons_down: u32,
    pub buttons_pressed: u32,
    pub buttons_released: u32,
    pub left_stick_x: f32,
    pub left_stick_y: f32,
    pub right_stick_x: f32,
    pub right_stick_y: f32,
    pub left_trigger: f32,
    pub right_trigger: f32,
}

impl InputState {
    pub const BUTTON_A: u32 = 1 << 0;
    pub const BUTTON_B: u32 = 1 << 1;
    pub const BUTTON_X: u32 = 1 << 2;
    pub const BUTTON_Y: u32 = 1 << 3;
    pub const BUTTON_LB: u32 = 1 << 4;
    pub const BUTTON_RB: u32 = 1 << 5;
    pub const BUTTON_START: u32 = 1 << 6;
    pub const BUTTON_SELECT: u32 = 1 << 7;
    pub const DPAD_UP: u32 = 1 << 8;
    pub const DPAD_DOWN: u32 = 1 << 9;
    pub const DPAD_LEFT: u32 = 1 << 10;
    pub const DPAD_RIGHT: u32 = 1 << 11;

    pub fn is_down(&self, mask: u32) -> bool {
        (self.buttons_down & mask) != 0
    }

    pub fn is_pressed(&self, mask: u32) -> bool {
        (self.buttons_pressed & mask) != 0
    }

    pub fn end_frame(&mut self) {
        self.buttons_pressed = 0;
        self.buttons_released = 0;
    }
}

/// Virtual File System (VFS) mounting and content dispatcher
#[derive(Debug, Default)]
pub struct SovereignVfs {
    mounts: HashMap<String, PathBuf>,
    in_memory_files: HashMap<String, Vec<u8>>,
}

impl SovereignVfs {
    pub fn new() -> Self {
        Self::default()
    }

    /// Mount an archive or host directory to a virtual prefix (e.g. `data/common/script/`)
    pub fn mount(&mut self, prefix: &str, host_path: impl Into<PathBuf>) {
        let clean_prefix = prefix.trim_matches('/').to_string();
        self.mounts.insert(clean_prefix, host_path.into());
    }

    /// Insert a virtual in-memory file
    pub fn insert_file(&mut self, virtual_path: &str, content: Vec<u8>) {
        let clean_path = virtual_path.trim_matches('/').to_string();
        self.in_memory_files.insert(clean_path, content);
    }

    /// Read bytes from virtual file path (checks memory first, then host mounts with optional mmap)
    pub fn read_bytes(&self, virtual_path: &str) -> Result<Vec<u8>> {
        let clean_path = virtual_path.trim_matches('/');

        // 1. In-memory check
        if let Some(data) = self.in_memory_files.get(clean_path) {
            return Ok(data.clone());
        }

        // 2. Mount point resolution
        for (prefix, host_dir) in &self.mounts {
            if clean_path.starts_with(prefix) {
                let rel = clean_path.strip_prefix(prefix).unwrap_or("").trim_start_matches('/');
                let target = host_dir.join(rel);
                if target.is_file() {
                    #[cfg(not(target_arch = "wasm32"))]
                    {
                        let file = std::fs::File::open(&target)
                            .map_err(|e| CorelibError::Vfs(format!("Failed opening '{virtual_path}': {e}")))?;
                        let mmap = unsafe { memmap2::Mmap::map(&file) }
                            .map_err(|e| CorelibError::Vfs(format!("Failed mapping '{virtual_path}': {e}")))?;
                        return Ok(mmap.to_vec());
                    }
                    #[cfg(target_arch = "wasm32")]
                    {
                        return std::fs::read(&target)
                            .map_err(|e| CorelibError::Vfs(format!("Failed reading '{virtual_path}': {e}")));
                    }
                }
            }
        }

        Err(CorelibError::Vfs(format!("File not found in VFS: '{virtual_path}'")))
    }
}
