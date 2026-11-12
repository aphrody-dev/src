//! WebGPU renderer built directly on web-sys (no wgpu), drawing one
//! full-screen triangle with the Mica/SDF fragment shader.

use crate::scene::UNIFORM_BYTES;
use js_sys::JsNullable;
use wasm_bindgen::{JsCast, JsValue};
use wasm_bindgen_futures::JsFuture;
use web_sys::{
    GpuAdapter, GpuBindGroup, GpuBindGroupDescriptor, GpuBindGroupEntry, GpuBuffer, GpuBufferBinding,
    GpuBufferDescriptor, GpuCanvasConfiguration, GpuCanvasContext, GpuColorTargetState, GpuDevice,
    GpuFragmentState, GpuLoadOp, GpuQueue, GpuRenderPassColorAttachment, GpuRenderPassDescriptor,
    GpuRenderPipeline, GpuRenderPipelineDescriptor, GpuShaderModuleDescriptor, GpuStoreOp, GpuVertexState,
    HtmlCanvasElement, GpuAutoLayoutMode, gpu_buffer_usage,
};

pub struct Renderer {
    device: GpuDevice,
    queue: GpuQueue,
    ctx: GpuCanvasContext,
    pipeline: GpuRenderPipeline,
    bind_group: GpuBindGroup,
    ubuf: GpuBuffer,
}

fn js(e: JsValue) -> String {
    e.as_string().unwrap_or_else(|| format!("{e:?}"))
}

impl Renderer {
    pub async fn new(canvas: &HtmlCanvasElement, wgsl: &str) -> Result<Renderer, String> {
        let window = web_sys::window().ok_or("no window")?;
        let nav = window.navigator();
        let gpu = nav.gpu();
        if gpu.is_undefined() || gpu.is_null() {
            return Err("navigator.gpu is not available".into());
        }
        let adapter = JsFuture::from(gpu.request_adapter()).await.map_err(js)?;
        if adapter.is_null() || adapter.is_undefined() {
            return Err("no WebGPU adapter".into());
        }
        let adapter: GpuAdapter = adapter.unchecked_into();
        let device: GpuDevice = JsFuture::from(adapter.request_device()).await.map_err(js)?.unchecked_into();
        let queue = device.queue();
        let ctx: GpuCanvasContext = canvas
            .get_context("webgpu")
            .map_err(js)?
            .ok_or("canvas.getContext('webgpu') returned null")?
            .unchecked_into();
        let format = gpu.get_preferred_canvas_format();
        ctx.configure(&GpuCanvasConfiguration::new(&device, format)).map_err(js)?;

        let module = device.create_shader_module(&GpuShaderModuleDescriptor::new(wgsl));
        let vertex = GpuVertexState::new(&module);
        vertex.set_entry_point("vs_main");
        let targets = [JsNullable::wrap(GpuColorTargetState::new(format))];
        let fragment = GpuFragmentState::new(&module, &targets);
        fragment.set_entry_point("fs_main");
        let desc = GpuRenderPipelineDescriptor::new_with_gpu_auto_layout_mode(GpuAutoLayoutMode::Auto, &vertex);
        desc.set_fragment(&fragment);
        let pipeline = device.create_render_pipeline(&desc).map_err(js)?;

        let ubuf = device
            .create_buffer(&GpuBufferDescriptor::new(UNIFORM_BYTES as u32, gpu_buffer_usage::UNIFORM | gpu_buffer_usage::COPY_DST))
            .map_err(js)?;
        let entry = GpuBindGroupEntry::new_with_gpu_buffer_binding(0, &GpuBufferBinding::new(&ubuf));
        let bind_group = device.create_bind_group(&GpuBindGroupDescriptor::new(&[entry], &pipeline.get_bind_group_layout(0)));
        Ok(Renderer { device, queue, ctx, pipeline, bind_group, ubuf })
    }

    pub fn render(&self, uniforms: &[u8]) -> Result<(), String> {
        self.queue
            .write_buffer_with_u32_and_u8_slice(&self.ubuf, 0, uniforms)
            .map_err(js)?;
        let view = self.ctx.get_current_texture().map_err(js)?.create_view().map_err(js)?;
        let color = GpuRenderPassColorAttachment::new_with_gpu_texture_view(GpuLoadOp::Clear, GpuStoreOp::Store, &view);
        let pass_desc = GpuRenderPassDescriptor::new(&[JsNullable::wrap(color)]);
        let encoder = self.device.create_command_encoder();
        let pass = encoder.begin_render_pass(&pass_desc).map_err(js)?;
        pass.set_pipeline(&self.pipeline);
        pass.set_bind_group(0, Some(&self.bind_group));
        pass.draw(3);
        pass.end();
        self.queue.submit(&[encoder.finish()]);
        Ok(())
    }
}

