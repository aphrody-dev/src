// SPDX-License-Identifier: Apache-2.0
//! Native Windows/Linux Desktop host (`winit` 0.30.13 + `wgpu` 30.0.1) driving the shared showcase.

use std::sync::Arc;

use winit::application::ApplicationHandler;
use winit::dpi::LogicalSize;
use winit::event::{ElementState, MouseButton, MouseScrollDelta, WindowEvent};
use winit::event_loop::{ActiveEventLoop, ControlFlow, EventLoop};
use winit::keyboard::{Key, NamedKey};
use winit::window::{Window, WindowAttributes, WindowId};

use crate::gpu_scene::GpuShowcaseRenderer;
use crate::state::{ShowcaseAction, ShowcaseSnapshot, ShowcaseState};

struct DesktopHost {
    state: ShowcaseState,
    snapshot: ShowcaseSnapshot,
    window: Option<Arc<Window>>,
    renderer: Option<GpuShowcaseRenderer>,
    cursor_pos: (f32, f32),
}

impl DesktopHost {
    fn new() -> Self {
        let state = ShowcaseState::new("desktop");
        let snapshot = state.snapshot();
        Self {
            state,
            snapshot,
            window: None,
            renderer: None,
            cursor_pos: (0.0, 0.0),
        }
    }

    fn apply(&mut self, action: ShowcaseAction) {
        self.state.dispatch(action);
        self.snapshot = self.state.snapshot();
        if let Some(w) = &self.window {
            w.request_redraw();
        }
    }
}

impl ApplicationHandler for DesktopHost {
    fn resumed(&mut self, event_loop: &ActiveEventLoop) {
        if self.window.is_some() {
            return;
        }
        let attrs = WindowAttributes::default()
            .with_title("Aphrody Rust Ecosystem Showcase — Native Desktop (wgpu + Taffy + aphrody-ui)")
            .with_inner_size(LogicalSize::new(1440.0, 900.0));
        let window = Arc::new(
            event_loop
                .create_window(attrs)
                .expect("failed to create desktop window"),
        );
        let size = window.inner_size();
        let instance = wgpu::Instance::default();
        let surface = instance
            .create_surface(Arc::clone(&window))
            .expect("failed to create wgpu surface");
        let renderer = pollster::block_on(GpuShowcaseRenderer::from_surface(
            &instance,
            surface,
            size.width,
            size.height,
        ))
        .expect("failed to initialize GpuShowcaseRenderer");

        println!("[rust-showcase] GPU adapter: {}", renderer.adapter_name);
        println!(
            "[rust-showcase] Loaded {} 1P crates, {} 3P bricks, {} ABI bridges, {} fusion targets",
            self.snapshot.first_party_total,
            self.snapshot.third_party_total,
            self.snapshot.abi_bridges.len(),
            self.snapshot.manifest.target_count
        );

        self.window = Some(window);
        self.renderer = Some(renderer);
        if let Some(w) = &self.window {
            w.request_redraw();
        }
    }

    fn window_event(&mut self, event_loop: &ActiveEventLoop, _id: WindowId, event: WindowEvent) {
        match event {
            WindowEvent::CloseRequested => event_loop.exit(),
            WindowEvent::Resized(size) => {
                if let Some(r) = &mut self.renderer {
                    r.resize(size.width, size.height);
                }
                if let Some(w) = &self.window {
                    w.request_redraw();
                }
            }
            WindowEvent::CursorMoved { position, .. } => {
                self.cursor_pos = (position.x as f32, position.y as f32);
            }
            WindowEvent::MouseInput {
                state: ElementState::Pressed,
                button: MouseButton::Left,
                ..
            } => {
                let hit = self
                    .renderer
                    .as_ref()
                    .and_then(|r| r.hit_test(self.cursor_pos.0, self.cursor_pos.1));
                if let Some(action) = hit {
                    self.apply(action);
                }
            }
            WindowEvent::MouseWheel { delta, .. } => {
                let dy = match delta {
                    MouseScrollDelta::LineDelta(_, y) => y,
                    MouseScrollDelta::PixelDelta(p) => p.y as f32 / 30.0,
                };
                if dy < 0.0 {
                    self.apply(ShowcaseAction::StepList(1));
                } else if dy > 0.0 {
                    self.apply(ShowcaseAction::StepList(-1));
                }
            }
            WindowEvent::KeyboardInput { event, .. } if event.state == ElementState::Pressed => {
                match event.logical_key {
                    Key::Named(NamedKey::Escape) => event_loop.exit(),
                    Key::Named(NamedKey::ArrowDown) => self.apply(ShowcaseAction::StepList(1)),
                    Key::Named(NamedKey::ArrowUp) => self.apply(ShowcaseAction::StepList(-1)),
                    Key::Named(NamedKey::ArrowRight) => {
                        let next = (self.state.tab.index() + 1) % 6;
                        self.apply(ShowcaseAction::SetTab(next));
                    }
                    Key::Named(NamedKey::ArrowLeft) => {
                        let prev = (self.state.tab.index() + 5) % 6;
                        self.apply(ShowcaseAction::SetTab(prev));
                    }
                    Key::Character(ref ch) => match ch.as_str() {
                        "1" => self.apply(ShowcaseAction::SetTab(0)),
                        "2" => self.apply(ShowcaseAction::SetTab(1)),
                        "3" => self.apply(ShowcaseAction::SetTab(2)),
                        "4" => self.apply(ShowcaseAction::SetTab(3)),
                        "5" => self.apply(ShowcaseAction::SetTab(4)),
                        "6" => self.apply(ShowcaseAction::SetTab(5)),
                        "t" | "T" => self.apply(ShowcaseAction::NextPreset),
                        "d" | "D" => self.apply(ShowcaseAction::ToggleDark),
                        "p" | "P" => self.apply(ShowcaseAction::NextPage),
                        "r" | "R" => self.apply(ShowcaseAction::NextTarget),
                        "l" | "L" => self.apply(ShowcaseAction::NextTiling),
                        "q" | "Q" => event_loop.exit(),
                        _ => {}
                    },
                    _ => {}
                }
            }
            WindowEvent::RedrawRequested => {
                if let Some(r) = &mut self.renderer {
                    r.render(&self.state, &self.snapshot);
                }
            }
            _ => {}
        }
    }
}

/// Runs the native Desktop `winit` + `wgpu` showcase window.
pub fn run_desktop() {
    let event_loop = EventLoop::new().expect("failed to create event loop");
    event_loop.set_control_flow(ControlFlow::Wait);
    let mut app = DesktopHost::new();
    event_loop.run_app(&mut app).expect("desktop event loop error");
}
