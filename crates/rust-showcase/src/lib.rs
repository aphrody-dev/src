// SPDX-License-Identifier: Apache-2.0
//! Shared-code Rust Ecosystem Showcase library for native Desktop (`winit`+`wgpu`) and Web (`wasm32`+WebGPU).

pub mod catalog;
pub mod font;
pub mod gpu_scene;
pub mod state;

#[cfg(not(target_arch = "wasm32"))]
pub mod desktop;

#[cfg(target_arch = "wasm32")]
pub mod wasm;
