// SPDX-License-Identifier: Apache-2.0
//! Unified WebAssembly (WASM) & Browser Surface.
//!
//! Exposes shared canvas target bindings, zero-copy buffer marshaling,
//! and requestAnimationFrame tick coordination for web clients.

use serde::{Deserialize, Serialize};

/// Configuration for browser-bound execution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmBrowserConfig {
    pub canvas_id: String,
    pub device_pixel_ratio: f64,
    pub target_fps: u32,
    pub webgpu_enabled: bool,
}

impl Default for WasmBrowserConfig {
    fn default() -> Self {
        Self {
            canvas_id: "sovereign_canvas".into(),
            device_pixel_ratio: 1.0,
            target_fps: 60,
            webgpu_enabled: true,
        }
    }
}

/// Zero-copy byte buffer wrapper for marshaling between Rust and JavaScript
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmBufferPayload {
    pub name: String,
    pub length: usize,
    pub data: Vec<u8>,
}

impl WasmBufferPayload {
    pub fn new(name: impl Into<String>, data: Vec<u8>) -> Self {
        let length = data.len();
        Self {
            name: name.into(),
            length,
            data,
        }
    }

    pub fn as_slice(&self) -> &[u8] {
        &self.data
    }
}

/// Status telemetry exported to web client
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WasmEngineTelemetry {
    pub fps: f32,
    pub frame_time_ms: f32,
    pub vram_usage_bytes: u64,
    pub active_vfs_mounts: usize,
}
