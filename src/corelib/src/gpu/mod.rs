// SPDX-License-Identifier: Apache-2.0
//! Unified GPU surface: adapter selection, device creation, render targets, and readback.
//!
//! Consolidates GPU rendering pipelines for Shenron (Manga, 3D, Vello) and
//! RoseGriffon (Nie render3d, model inspection, canvas presentation).

use serde::{Deserialize, Serialize};
use crate::error::{CorelibError, Result};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GpuPowerPreference {
    HighPerformance,
    LowPower,
    Default,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuOptions {
    pub power_preference: GpuPowerPreference,
    pub force_fallback_adapter: bool,
    pub max_fps: u32,
    pub canvas_id: Option<String>,
}

impl Default for GpuOptions {
    fn default() -> Self {
        Self {
            power_preference: GpuPowerPreference::HighPerformance,
            force_fallback_adapter: false,
            max_fps: 144,
            canvas_id: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuReport {
    pub adapter_name: String,
    pub backend: String,
    pub device_type: String,
    pub driver_info: String,
    pub max_texture_dimension_2d: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct RowLayout {
    pub bytes_per_row: u32,
    pub rows_per_image: u32,
    pub buffer_size: u64,
}

impl RowLayout {
    /// Compute 256-byte aligned row layout for GPU texture-to-buffer copies
    pub const ALIGNMENT: u32 = 256;

    pub fn new(width: u32, height: u32, bytes_per_pixel: u32) -> Self {
        let unaligned = width * bytes_per_pixel;
        let bytes_per_row = (unaligned + Self::ALIGNMENT - 1) & !(Self::ALIGNMENT - 1);
        let buffer_size = (bytes_per_row as u64) * (height as u64);
        Self {
            bytes_per_row,
            rows_per_image: height,
            buffer_size,
        }
    }
}

#[cfg(feature = "gpu")]
pub struct GpuContext {
    pub instance: wgpu::Instance,
    pub adapter: wgpu::Adapter,
    pub device: wgpu::Device,
    pub queue: wgpu::Queue,
    pub report: GpuReport,
}

#[cfg(feature = "gpu")]
impl GpuContext {
    /// Initialize sovereign GPU context targeting discrete GPU with fallback
    pub fn new_blocking(options: &GpuOptions) -> Result<Self> {
        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::all(),
            flags: wgpu::InstanceFlags::default(),
            backend_options: wgpu::BackendOptions::default(),
            ..wgpu::InstanceDescriptor::new_without_display_handle()
        });

        let power_pref = match options.power_preference {
            GpuPowerPreference::HighPerformance => wgpu::PowerPreference::HighPerformance,
            GpuPowerPreference::LowPower => wgpu::PowerPreference::LowPower,
            GpuPowerPreference::Default => wgpu::PowerPreference::None,
        };

        let adapter = pollster::block_on(instance.request_adapter(&wgpu::RequestAdapterOptions {
            power_preference: power_pref,
            force_fallback_adapter: options.force_fallback_adapter,
            compatible_surface: None,
            apply_limit_buckets: false,
        }))
        .map_err(|_| CorelibError::Gpu("Failed to find suitable GPU adapter".into()))?;

        let info = adapter.get_info();
        let limits = adapter.limits();

        let (device, queue) = pollster::block_on(adapter.request_device(&wgpu::DeviceDescriptor {
            label: Some("sovereign_gpu_device"),
            required_features: wgpu::Features::empty(),
            required_limits: wgpu::Limits::default(),
            memory_hints: wgpu::MemoryHints::Performance,
            ..Default::default()
        }))
        .map_err(|e| CorelibError::Gpu(format!("Failed to request device: {e}")))?;

        let report = GpuReport {
            adapter_name: info.name,
            backend: format!("{:?}", info.backend),
            device_type: format!("{:?}", info.device_type),
            driver_info: info.driver_info,
            max_texture_dimension_2d: limits.max_texture_dimension_2d,
        };

        Ok(Self {
            instance,
            adapter,
            device,
            queue,
            report,
        })
    }
}

#[cfg(feature = "gpu")]
pub struct RenderTarget {
    pub texture: wgpu::Texture,
    pub view: wgpu::TextureView,
    pub width: u32,
    pub height: u32,
    pub format: wgpu::TextureFormat,
    pub row_layout: RowLayout,
}

#[cfg(feature = "gpu")]
impl RenderTarget {
    pub const TARGET_FORMAT: wgpu::TextureFormat = wgpu::TextureFormat::Rgba8UnormSrgb;

    pub fn new(device: &wgpu::Device, label: &str, width: u32, height: u32) -> Result<Self> {
        let size = wgpu::Extent3d {
            width,
            height,
            depth_or_array_layers: 1,
        };

        let texture = device.create_texture(&wgpu::TextureDescriptor {
            label: Some(label),
            size,
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: Self::TARGET_FORMAT,
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT
                | wgpu::TextureUsages::TEXTURE_BINDING
                | wgpu::TextureUsages::COPY_SRC,
            view_formats: &[],
        });

        let view = texture.create_view(&wgpu::TextureViewDescriptor::default());
        let row_layout = RowLayout::new(width, height, 4);

        Ok(Self {
            texture,
            view,
            width,
            height,
            format: Self::TARGET_FORMAT,
            row_layout,
        })
    }

    /// Readback texture bytes to CPU vector
    pub fn readback_rgba(&self, device: &wgpu::Device, queue: &wgpu::Queue) -> Result<Vec<u8>> {
        let buffer = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("readback_staging_buffer"),
            size: self.row_layout.buffer_size,
            usage: wgpu::BufferUsages::COPY_DST | wgpu::BufferUsages::MAP_READ,
            mapped_at_creation: false,
        });

        let mut encoder = device.create_command_encoder(&wgpu::CommandEncoderDescriptor {
            label: Some("readback_encoder"),
        });

        encoder.copy_texture_to_buffer(
            wgpu::TexelCopyTextureInfo {
                texture: &self.texture,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            wgpu::TexelCopyBufferInfo {
                buffer: &buffer,
                layout: wgpu::TexelCopyBufferLayout {
                    offset: 0,
                    bytes_per_row: Some(self.row_layout.bytes_per_row),
                    rows_per_image: Some(self.row_layout.rows_per_image),
                },
            },
            wgpu::Extent3d {
                width: self.width,
                height: self.height,
                depth_or_array_layers: 1,
            },
        );

        let submission = queue.submit(Some(encoder.finish()));

        let slice = buffer.slice(..);
        let (tx, rx) = std::sync::mpsc::channel();
        slice.map_async(wgpu::MapMode::Read, move |res| {
            let _ = tx.send(res);
        });

        device
            .poll(wgpu::PollType::Wait {
                submission_index: Some(submission),
                timeout: None,
            })
            .map_err(|e| CorelibError::Gpu(format!("GPU poll failed: {e}")))?;

        rx.recv()
            .map_err(|e| CorelibError::Gpu(format!("Channel error during readback: {e}")))?
            .map_err(|e| CorelibError::Gpu(format!("Failed to map buffer: {e}")))?;

        let data = slice
            .get_mapped_range()
            .map_err(|e| CorelibError::Gpu(format!("Failed reading mapped range: {e}")))?;

        let unaligned_row_bytes = (self.width * 4) as usize;
        let mut result = Vec::with_capacity(unaligned_row_bytes * self.height as usize);

        for row in 0..self.height {
            let start = (row * self.row_layout.bytes_per_row) as usize;
            let end = start + unaligned_row_bytes;
            result.extend_from_slice(&data[start..end]);
        }

        drop(data);
        buffer.unmap();
        Ok(result)
    }
}
