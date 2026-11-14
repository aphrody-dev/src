//! WebGPU renderer of the gamescope console UI (wasm32 only): one instanced-quad pipeline drawing the scene that
//! `gamescope_core::console::App` produces, letterboxed with `gamescope_core::ScalingLayout`.

use gamescope_core::console::{App, ICON_SOURCES, Shell};
use gamescope_core::ui::{ATLAS, H, QUAD_FLOATS, W};
use gamescope_core::{Resolution, ScalingLayout, ScalingMode};
use wasm_bindgen::prelude::*;

const MAX_QUADS: usize = 4096;

#[wasm_bindgen]
pub struct GamescopeConsole {
    app: App,
    device: wgpu::Device,
    queue: wgpu::Queue,
    surface: wgpu::Surface<'static>,
    config: wgpu::SurfaceConfiguration,
    pipeline: wgpu::RenderPipeline,
    bind: wgpu::BindGroup,
    atlas: wgpu::Texture,
    instances: wgpu::Buffer,
    adapter_name: String,
}

#[wasm_bindgen]
impl GamescopeConsole {
    /// Creates the WebGPU device on `canvas` (the real adapter or an error with the browser's message).
    pub async fn create(canvas: web_sys::HtmlCanvasElement, shell: u32) -> Result<GamescopeConsole, JsValue> {
        console_error_panic_hook::set_once();
        let (width, height) = (canvas.width().max(1), canvas.height().max(1));
        let instance = wgpu::Instance::default();
        let surface = instance
            .create_surface(wgpu::SurfaceTarget::Canvas(canvas))
            .map_err(|e| JsValue::from_str(&format!("create_surface failed: {e:?}")))?;
        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: Some(&surface),
                ..Default::default()
            })
            .await
            .map_err(|e| JsValue::from_str(&format!("request_adapter failed: {e:?}")))?;
        let info = adapter.get_info();
        let adapter_name = format!("{} ({:?})", info.name, info.backend);
        let (device, queue) = adapter
            .request_device(&wgpu::DeviceDescriptor { label: Some("gamescope console"), ..Default::default() })
            .await
            .map_err(|e| JsValue::from_str(&format!("request_device failed: {e:?}")))?;

        let caps = surface.get_capabilities(&adapter);
        // Colors are authored in sRGB: present them through a non-sRGB format so they appear as written.
        let format = caps.formats.iter().copied().find(|f| !f.is_srgb()).unwrap_or(caps.formats[0]);
        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format,
            width,
            height,
            present_mode: wgpu::PresentMode::Fifo,
            alpha_mode: caps.alpha_modes[0],
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
            color_space: wgpu::SurfaceColorSpace::Auto,
        };
        surface.configure(&device, &config);

        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("console.wgsl"),
            source: wgpu::ShaderSource::Wgsl(include_str!("console.wgsl").into()),
        });
        let atlas = device.create_texture(&wgpu::TextureDescriptor {
            label: Some("console atlas"),
            size: wgpu::Extent3d { width: ATLAS as u32, height: ATLAS as u32, depth_or_array_layers: 1 },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Rgba8Unorm,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });
        let view = atlas.create_view(&wgpu::TextureViewDescriptor::default());
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            mag_filter: wgpu::FilterMode::Linear,
            min_filter: wgpu::FilterMode::Linear,
            address_mode_u: wgpu::AddressMode::ClampToEdge,
            address_mode_v: wgpu::AddressMode::ClampToEdge,
            ..Default::default()
        });
        let bgl = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("console bgl"),
            entries: &[
                wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Texture {
                        sample_type: wgpu::TextureSampleType::Float { filterable: true },
                        view_dimension: wgpu::TextureViewDimension::D2,
                        multisampled: false,
                    },
                    count: None,
                },
                wgpu::BindGroupLayoutEntry {
                    binding: 1,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Sampler(wgpu::SamplerBindingType::Filtering),
                    count: None,
                },
            ],
        });
        let bind = device.create_bind_group(&wgpu::BindGroupDescriptor {
            label: Some("console bind"),
            layout: &bgl,
            entries: &[
                wgpu::BindGroupEntry { binding: 0, resource: wgpu::BindingResource::TextureView(&view) },
                wgpu::BindGroupEntry { binding: 1, resource: wgpu::BindingResource::Sampler(&sampler) },
            ],
        });
        let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("console layout"),
            bind_group_layouts: &[Some(&bgl)],
            immediate_size: 0,
        });
        let attrs = wgpu::vertex_attr_array![0 => Float32x4, 1 => Float32x4, 2 => Float32x4, 3 => Float32x4, 4 => Float32x4];
        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("console pipeline"),
            layout: Some(&layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: Some("vs"),
                compilation_options: Default::default(),
                buffers: &[Some(wgpu::VertexBufferLayout {
                    array_stride: (QUAD_FLOATS * 4) as u64,
                    step_mode: wgpu::VertexStepMode::Instance,
                    attributes: &attrs,
                })],
            },
            primitive: wgpu::PrimitiveState::default(),
            depth_stencil: None,
            multisample: wgpu::MultisampleState::default(),
            fragment: Some(wgpu::FragmentState {
                module: &shader,
                entry_point: Some("fs"),
                compilation_options: Default::default(),
                targets: &[Some(wgpu::ColorTargetState {
                    format,
                    blend: Some(wgpu::BlendState::ALPHA_BLENDING),
                    write_mask: wgpu::ColorWrites::ALL,
                })],
            }),
            multiview_mask: None,
            cache: None,
        });
        let instances = device.create_buffer(&wgpu::BufferDescriptor {
            label: Some("console instances"),
            size: (MAX_QUADS * QUAD_FLOATS * 4) as u64,
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        Ok(GamescopeConsole {
            app: App::new(Shell::from_code(shell)),
            device,
            queue,
            surface,
            config,
            pipeline,
            bind,
            atlas,
            instances,
            adapter_name,
        })
    }

    /// Atlas sources in slot order: "ui:<name>" icons are drawn by the client, "art:<file>" are fetched.
    pub fn icon_sources() -> Vec<String> {
        ICON_SOURCES.iter().map(|s| s.to_string()).collect()
    }

    pub fn adapter(&self) -> String {
        self.adapter_name.clone()
    }

    /// Uploads the 2048x2048 RGBA atlas (glyph grid + icon slots) and the measured glyph advances in em units.
    pub fn set_atlas(&mut self, rgba: &[u8], advances: &[f32]) -> Result<(), JsValue> {
        let side = ATLAS as u32;
        if rgba.len() != (side * side * 4) as usize {
            return Err(JsValue::from_str("atlas must be 2048x2048 RGBA"));
        }
        self.queue.write_texture(
            wgpu::TexelCopyTextureInfo {
                texture: &self.atlas,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            rgba,
            wgpu::TexelCopyBufferLayout { offset: 0, bytes_per_row: Some(side * 4), rows_per_image: Some(side) },
            wgpu::Extent3d { width: side, height: side, depth_or_array_layers: 1 },
        );
        self.app.set_advances(advances.to_vec());
        Ok(())
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        if width > 0 && height > 0 {
            self.config.width = width;
            self.config.height = height;
            self.surface.configure(&self.device, &self.config);
        }
    }

    pub fn input(&mut self, code: u32) {
        if let Some(i) = gamescope_core::ui::Input::from_code(code) {
            self.app.input(i);
        }
    }

    fn viewport(&self) -> gamescope_core::ViewportRect {
        ScalingLayout::compute(
            Resolution::new(W as u32, H as u32),
            Resolution::new(self.config.width, self.config.height),
            ScalingMode::Fit,
        )
        .destination_rect
    }

    /// Pointer in canvas pixels; converted to the 1920x1080 design space through the letterbox viewport.
    pub fn pointer(&mut self, x: f32, y: f32, click: bool) {
        let v = self.viewport();
        let (dx, dy) = ((x - v.x) / v.width * W, (y - v.y) / v.height * H);
        self.app.pointer(dx, dy, click);
    }

    pub fn set_shell(&mut self, code: u32) {
        self.app.set_shell(Shell::from_code(code));
    }

    pub fn set_clock(&mut self, minutes: u32) {
        self.app.set_clock(minutes);
    }

    /// JSON snapshot of the UI state (shell, screen, tab, focused item, row and column).
    pub fn state(&self) -> String {
        self.app.state_json()
    }

    pub fn animating(&self) -> bool {
        self.app.animating()
    }

    /// Advances the animations by `dt` seconds and draws one frame.
    pub fn render(&mut self, dt: f32) -> Result<(), JsValue> {
        self.app.update(dt);
        let data = self.app.frame();
        let count = (data.len() / QUAD_FLOATS).min(MAX_QUADS);
        self.queue.write_buffer(&self.instances, 0, &f32s_to_bytes(&data[..count * QUAD_FLOATS]));
        let frame = match self.surface.get_current_texture() {
            wgpu::CurrentSurfaceTexture::Success(f) | wgpu::CurrentSurfaceTexture::Suboptimal(f) => f,
            wgpu::CurrentSurfaceTexture::Outdated | wgpu::CurrentSurfaceTexture::Lost => {
                self.surface.configure(&self.device, &self.config);
                return Ok(());
            }
            _ => return Ok(()),
        };
        let view = frame.texture.create_view(&wgpu::TextureViewDescriptor::default());
        let mut encoder = self.device.create_command_encoder(&wgpu::CommandEncoderDescriptor { label: Some("console frame") });
        {
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("console pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    depth_slice: None,
                    resolve_target: None,
                    ops: wgpu::Operations { load: wgpu::LoadOp::Clear(wgpu::Color::BLACK), store: wgpu::StoreOp::Store },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            let v = self.viewport();
            pass.set_viewport(v.x, v.y, v.width, v.height, 0.0, 1.0);
            pass.set_pipeline(&self.pipeline);
            pass.set_bind_group(0, &self.bind, &[]);
            pass.set_vertex_buffer(0, self.instances.slice(..));
            pass.draw(0..6, 0..count as u32);
        }
        self.queue.submit(Some(encoder.finish()));
        // On the web the canvas presents by itself when the frame texture is dropped (no explicit present).
        Ok(())
    }
}

fn f32s_to_bytes(v: &[f32]) -> Vec<u8> {
    v.iter().flat_map(|f| f.to_le_bytes()).collect()
}
