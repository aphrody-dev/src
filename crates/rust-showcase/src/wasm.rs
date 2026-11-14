// SPDX-License-Identifier: Apache-2.0
//! WebAssembly (`wasm32-unknown-unknown`) + WebGPU `wasm-bindgen` bindings sharing 100% of
//! `ShowcaseState`, `catalog`, `aphrody-ui::fusion`, `taffy`, and `GpuShowcaseRenderer` with Desktop.

use wasm_bindgen::prelude::*;

use crate::gpu_scene::{GpuShowcaseRenderer, build_scene};
use crate::state::{ShowcaseAction, ShowcaseSnapshot, ShowcaseState};

/// Shared stateful showcase controller exposed to Material 3 HTML/TS Web host.
#[wasm_bindgen]
pub struct RustShowcaseWeb {
    state: ShowcaseState,
    snapshot: ShowcaseSnapshot,
}

#[wasm_bindgen]
impl RustShowcaseWeb {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        console_error_panic_hook::set_once();
        let state = ShowcaseState::new("web-wasm");
        let snapshot = state.snapshot();
        Self { state, snapshot }
    }

    pub fn snapshot_json(&self) -> String {
        serde_json::to_string(&self.snapshot).unwrap_or_else(|_| "{}".to_owned())
    }

    pub fn set_tab(&mut self, idx: usize) -> String {
        self.dispatch_json(ShowcaseAction::SetTab(idx))
    }

    pub fn set_preset(&mut self, idx: usize) -> String {
        self.dispatch_json(ShowcaseAction::SetPreset(idx))
    }

    pub fn toggle_dark(&mut self) -> String {
        self.dispatch_json(ShowcaseAction::ToggleDark)
    }

    pub fn set_page(&mut self, idx: usize) -> String {
        self.dispatch_json(ShowcaseAction::SetPage(idx))
    }

    pub fn set_target(&mut self, idx: usize) -> String {
        self.dispatch_json(ShowcaseAction::SetTarget(idx))
    }

    pub fn set_tiling(&mut self, idx: usize) -> String {
        self.dispatch_json(ShowcaseAction::SetTiling(idx))
    }

    pub fn set_tile_count(&mut self, count: usize) -> String {
        self.dispatch_json(ShowcaseAction::SetTileCount(count))
    }

    pub fn set_viewport(&mut self, width: f32, height: f32) -> String {
        self.dispatch_json(ShowcaseAction::SetViewport(width, height))
    }

    pub fn set_domain(&mut self, domain_idx: i32) -> String {
        let opt = if domain_idx < 0 {
            None
        } else {
            Some(domain_idx as usize)
        };
        self.dispatch_json(ShowcaseAction::SetDomainFilter(opt))
    }

    pub fn set_search(&mut self, query: String) -> String {
        self.dispatch_json(ShowcaseAction::SetSearch(query))
    }

    pub fn select_crate(&mut self, idx: usize) -> String {
        self.dispatch_json(ShowcaseAction::SelectCrate(idx))
    }

    pub fn select_brick(&mut self, idx: usize) -> String {
        self.dispatch_json(ShowcaseAction::SelectBrick(idx))
    }

    pub fn select_abi(&mut self, idx: usize) -> String {
        self.dispatch_json(ShowcaseAction::SelectAbi(idx))
    }

    pub fn quad_count(&self) -> usize {
        build_scene(&self.state, &self.snapshot).quads.len()
    }
}

impl RustShowcaseWeb {
    fn dispatch_json(&mut self, action: ShowcaseAction) -> String {
        self.state.dispatch(action);
        self.snapshot = self.state.snapshot();
        self.snapshot_json()
    }
}

/// Shared WebGPU canvas renderer running the identical `showcase.wgsl` + `GpuShowcaseRenderer`
/// as the Windows/Linux Desktop executable.
#[wasm_bindgen]
pub struct RustShowcaseWebGpu {
    state: ShowcaseState,
    snapshot: ShowcaseSnapshot,
    renderer: GpuShowcaseRenderer,
}

#[wasm_bindgen]
impl RustShowcaseWebGpu {
    pub async fn create(canvas: web_sys::HtmlCanvasElement) -> Result<RustShowcaseWebGpu, JsValue> {
        console_error_panic_hook::set_once();
        let width = canvas.width().max(1);
        let height = canvas.height().max(1);
        let instance = wgpu::Instance::default();
        let surface = instance
            .create_surface(wgpu::SurfaceTarget::Canvas(canvas))
            .map_err(|e| JsValue::from_str(&format!("create_surface failed: {e:?}")))?;
        let renderer = GpuShowcaseRenderer::from_surface(&instance, surface, width, height)
            .await
            .map_err(|e| JsValue::from_str(&e))?;
        let state = ShowcaseState::new("web-wasm");
        let snapshot = state.snapshot();
        Ok(Self {
            state,
            snapshot,
            renderer,
        })
    }

    pub fn adapter_name(&self) -> String {
        self.renderer.adapter_name.clone()
    }

    pub fn resize(&mut self, width: u32, height: u32) {
        self.renderer.resize(width, height);
    }

    pub fn render(&mut self) {
        self.renderer.render(&self.state, &self.snapshot);
    }

    pub fn sync_from_state(
        &mut self,
        tab: usize,
        preset: usize,
        dark: bool,
        page: usize,
        target: usize,
        tiling: usize,
        tile_count: usize,
        domain: i32,
        selected_crate: usize,
        selected_brick: usize,
        selected_abi: usize,
    ) {
        self.state.tab = crate::state::ShowcaseTab::from_index(tab);
        self.state.preset_idx = preset;
        self.state.dark = dark;
        self.state.page_idx = page;
        self.state.target_idx = target;
        self.state.tiling_idx = tiling;
        self.state.tile_count = tile_count.clamp(1, 12);
        self.state.domain_filter = if domain < 0 { None } else { Some(domain as usize) };
        self.state.selected_crate_idx = selected_crate;
        self.state.selected_brick_idx = selected_brick;
        self.state.selected_abi_idx = selected_abi;
        self.snapshot = self.state.snapshot();
        self.renderer.render(&self.state, &self.snapshot);
    }

    pub fn click(&mut self, px: f32, py: f32) -> String {
        if let Some(action) = self.renderer.hit_test(px, py) {
            self.state.dispatch(action);
            self.snapshot = self.state.snapshot();
            self.renderer.render(&self.state, &self.snapshot);
        }
        serde_json::to_string(&self.snapshot).unwrap_or_else(|_| "{}".to_owned())
    }
}
