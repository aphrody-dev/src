// SPDX-License-Identifier: Apache-2.0
//! Shared Material-3-themed instanced GPU scene builder & `wgpu` 30 renderer
//! used identically by both the native Desktop window (`winit`) and Web (`wasm32` WebGPU).

use aphrody_ui::fusion::{CanonicalPage, FusionThemePreset, RenderTarget, ResolvedFusionTheme, UiKind};

use crate::catalog::{ABI_BRIDGES, CrateDomain, FIRST_PARTY_CRATES, THIRD_PARTY_BRICKS};
use crate::font::{ATLAS_H, ATLAS_W, build_rgba_atlas, glyph_uv};
use crate::state::{ShowcaseAction, ShowcaseSnapshot, ShowcaseState, ShowcaseTab};

/// Virtual logical scene dimensions fitted inside any host window or canvas.
pub const VIRT_W: f32 = 1440.0;
pub const VIRT_H: f32 = 900.0;
pub const MAX_QUADS: usize = 16384;

/// Single 20-float GPU instance matching `showcase.wgsl` `VIn`.
#[repr(C)]
#[derive(Clone, Copy, Debug, bytemuck::Pod, bytemuck::Zeroable)]
pub struct QuadInstance {
    pub rect: [f32; 4], // x, y, w, h
    pub c0: [f32; 4],
    pub c1: [f32; 4],
    pub uv: [f32; 4],
    pub prm: [f32; 4], // radius, border_width, kind (0=box,1=glyph,2=ring), pad
}

/// Interactive hit rectangle in virtual `1440x900` coordinates.
#[derive(Clone, Debug)]
pub struct HitRegion {
    pub x: f32,
    pub y: f32,
    pub w: f32,
    pub h: f32,
    pub action: ShowcaseAction,
}

impl HitRegion {
    #[must_use]
    pub fn contains(&self, px: f32, py: f32) -> bool {
        px >= self.x && px <= self.x + self.w && py >= self.y && py <= self.y + self.h
    }
}

/// Output of one shared UI layout & GPU draw build pass.
pub struct BuiltScene {
    pub quads: Vec<QuadInstance>,
    pub hits: Vec<HitRegion>,
    pub clear_rgba: [f32; 4],
}

#[must_use]
fn rgba_f32(c: [u8; 4], alpha_mul: f32) -> [f32; 4] {
    [
        f32::from(c[0]) / 255.0,
        f32::from(c[1]) / 255.0,
        f32::from(c[2]) / 255.0,
        (f32::from(c[3]) / 255.0) * alpha_mul,
    ]
}

struct ScenePainter<'a> {
    quads: &'a mut Vec<QuadInstance>,
    hits: &'a mut Vec<HitRegion>,
}

impl<'a> ScenePainter<'a> {
    fn box_fill(&mut self, x: f32, y: f32, w: f32, h: f32, r: f32, c0: [f32; 4], c1: [f32; 4], border: f32) {
        if self.quads.len() >= MAX_QUADS || w <= 0.0 || h <= 0.0 {
            return;
        }
        self.quads.push(QuadInstance {
            rect: [x, y, w, h],
            c0,
            c1,
            uv: [0.0; 4],
            prm: [r, border, 0.0, 0.0],
        });
    }

    fn box_solid(&mut self, x: f32, y: f32, w: f32, h: f32, r: f32, col: [f32; 4]) {
        self.box_fill(x, y, w, h, r, col, col, 0.0);
    }

    fn card(&mut self, x: f32, y: f32, w: f32, h: f32, r: f32, fill: [f32; 4], border_col: [f32; 4]) {
        self.box_fill(x, y, w, h, r, fill, border_col, 1.0);
        // Subtle inner highlight top/fill cleanly rendered with border_col outline ring
        self.box_solid(x + 1.0, y + 1.0, (w - 2.0).max(0.0), (h - 2.0).max(0.0), (r - 1.0).max(0.0), fill);
        if self.quads.len() < MAX_QUADS {
            self.quads.push(QuadInstance {
                rect: [x, y, w, h],
                c0: border_col,
                c1: border_col,
                uv: [0.0; 4],
                prm: [r, 1.25, 2.0, 0.0],
            });
        }
    }

    fn hit_card(
        &mut self,
        x: f32,
        y: f32,
        w: f32,
        h: f32,
        r: f32,
        fill: [f32; 4],
        border_col: [f32; 4],
        action: ShowcaseAction,
    ) {
        self.card(x, y, w, h, r, fill, border_col);
        self.hits.push(HitRegion { x, y, w, h, action });
    }

    fn text(&mut self, mut x: f32, y: f32, scale: f32, color: [f32; 4], s: &str, max_w: f32) {
        let adv = 9.0 * scale;
        let gw = 8.0 * scale;
        let gh = 11.0 * scale;
        let start_x = x;
        for ch in s.chars() {
            if x + gw - start_x > max_w {
                break;
            }
            if ch != ' ' && self.quads.len() < MAX_QUADS {
                self.quads.push(QuadInstance {
                    rect: [x, y, gw, gh],
                    c0: color,
                    c1: color,
                    uv: glyph_uv(ch),
                    prm: [0.0, 0.0, 1.0, 0.0],
                });
            }
            x += adv;
        }
    }

    fn badge(&mut self, x: f32, y: f32, h: f32, r: f32, bg: [f32; 4], fg: [f32; 4], label: &str) -> f32 {
        let w = (label.chars().count() as f32 * 9.5 + 22.0).max(60.0);
        self.box_solid(x, y, w, h, r, bg);
        self.text(x + 11.0, y + (h - 11.0) * 0.5, 1.05, fg, label, w - 16.0);
        w
    }

    fn hit_chip(
        &mut self,
        x: f32,
        y: f32,
        w: f32,
        h: f32,
        r: f32,
        active: bool,
        theme: &ResolvedFusionTheme,
        label: &str,
        action: ShowcaseAction,
    ) {
        let bg = if active {
            rgba_f32(theme.primary_rgba, 1.0)
        } else {
            rgba_f32(theme.surface_container_high_rgba, 1.0)
        };
        let fg = if active {
            rgba_f32(theme.on_primary_rgba, 1.0)
        } else {
            rgba_f32(theme.on_surface_rgba, 1.0)
        };
        let border = if active {
            rgba_f32(theme.primary_rgba, 1.0)
        } else {
            rgba_f32(theme.outline_variant_rgba, 1.0)
        };
        self.hit_card(x, y, w, h, r, bg, border, action);
        self.text(x + 12.0, y + (h - 12.0) * 0.5, 1.08, fg, label, w - 20.0);
    }
}

/// Builds the complete Material-3 GPU quad scene + click hitboxes from `state` & `snapshot`.
#[must_use]
pub fn build_scene(state: &ShowcaseState, snap: &ShowcaseSnapshot) -> BuiltScene {
    let theme = state.resolved_theme();
    let rad = f32::from(theme.preset.corner_radius_px);

    let surface = rgba_f32(theme.surface_rgba, 1.0);
    let surf_low = rgba_f32(theme.surface_container_rgba, 1.0);
    let surf_hi = rgba_f32(theme.surface_container_high_rgba, 1.0);
    let primary = rgba_f32(theme.primary_rgba, 1.0);
    let on_primary = rgba_f32(theme.on_primary_rgba, 1.0);
    let pri_cont = rgba_f32(theme.primary_container_rgba, 1.0);
    let secondary = rgba_f32(theme.secondary_rgba, 1.0);
    let tertiary = rgba_f32(theme.tertiary_rgba, 1.0);
    let on_surf = rgba_f32(theme.on_surface_rgba, 1.0);
    let on_var = rgba_f32(theme.on_surface_variant_rgba, 1.0);
    let outline_var = rgba_f32(theme.outline_variant_rgba, 1.0);

    let mut quads = Vec::with_capacity(2048);
    let mut hits = Vec::with_capacity(96);
    let mut p = ScenePainter {
        quads: &mut quads,
        hits: &mut hits,
    };

    // Background
    p.box_solid(0.0, 0.0, VIRT_W, VIRT_H, 0.0, surface);

    // Top Header Bar (y=0..60)
    p.box_solid(0.0, 0.0, VIRT_W, 60.0, 0.0, surf_low);
    p.box_solid(0.0, 59.0, VIRT_W, 1.0, 0.0, outline_var);
    p.badge(20.0, 14.0, 32.0, 8.0, primary, on_primary, "APHRODY");
    p.text(
        136.0,
        21.0,
        1.45,
        on_surf,
        "Rust Ecosystem Showcase (Shared Core -> Desktop + Web)",
        740.0,
    );

    // Header interactive controls on the right
    let host_label = if state.runtime_host == "desktop" {
        "HOST: WIN/NATIVE WGPU"
    } else {
        "HOST: WASM32 WEBGPU"
    };
    p.badge(850.0, 15.0, 30.0, 15.0, pri_cont, on_surf, host_label);
    p.hit_chip(
        1078.0,
        14.0,
        196.0,
        32.0,
        16.0,
        true,
        &theme,
        &format!("Theme: {}", theme.preset.id),
        ShowcaseAction::NextPreset,
    );
    p.hit_chip(
        1286.0,
        14.0,
        134.0,
        32.0,
        16.0,
        !state.dark,
        &theme,
        if state.dark { "Mode: Dark" } else { "Mode: Light" },
        ShowcaseAction::ToggleDark,
    );

    // Left Navigation Rail (x=0..216, y=60..864)
    p.box_solid(0.0, 60.0, 216.0, 804.0, 0.0, surf_low);
    p.box_solid(215.0, 60.0, 1.0, 804.0, 0.0, outline_var);
    p.text(18.0, 78.0, 1.05, on_var, "NAVIGATION [1-6]", 180.0);

    for (idx, tab) in ShowcaseTab::ALL.iter().enumerate() {
        let ty = 104.0 + idx as f32 * 52.0;
        let active = state.tab == *tab;
        p.hit_chip(
            14.0,
            ty,
            188.0,
            42.0,
            rad,
            active,
            &theme,
            &format!("{}  {}", idx + 1, tab.label()),
            ShowcaseAction::SetTab(idx),
        );
    }

    // Rail Summary Card
    p.card(14.0, 444.0, 188.0, 398.0, rad, surf_hi, outline_var);
    p.text(28.0, 462.0, 1.15, primary, "LIVE ENGINE STATS", 164.0);
    let stats = [
        format!("1P Crates:   {}", snap.first_party_total),
        format!("3P Bricks:   {}", snap.third_party_total),
        format!("C ABI Mods:  {}", snap.abi_bridges.len()),
        format!("M3 Themes:   {}", snap.manifest.theme_count),
        format!("Primitives:  {}", snap.manifest.component_count),
        format!("Targets:     {}", snap.manifest.target_count),
        format!("Pages:       {}", snap.manifest.page_count),
        format!("A11y Nodes:  {}", snap.rendered_frame.a11y_node_count),
        format!("Scene Cmds:  {}", snap.rendered_frame.scene_command_count),
        format!("Overflow:    {:.0}px", snap.rendered_frame.vitals.horizontal_overflow_px),
        format!("Taffy Tiles: {}", snap.wayland_geometry.tiles.len()),
        format!("FPS Budget:  {:.1}ms", snap.gamescope_budget_ms),
    ];
    for (i, line) in stats.iter().enumerate() {
        p.text(28.0, 496.0 + i as f32 * 26.0, 1.02, on_surf, line, 162.0);
    }

    // Main Content Canvas (x=232..1424, y=74..852)
    let cx = 232.0;
    let cy = 74.0;
    let cw = VIRT_W - cx - 18.0;

    match state.tab {
        ShowcaseTab::Overview => {
            p.card(cx, cy, cw, 114.0, rad, surf_low, outline_var);
            p.text(cx + 22.0, cy + 18.0, 1.6, on_surf, "Aphrody Sovereign Rust Framework", cw - 44.0);
            p.text(
                cx + 22.0,
                cy + 52.0,
                1.1,
                on_var,
                "Single shared Rust core (`crates/rust-showcase` + `crates/aphrody-ui` + `crates/taffy` + `crates/gamescope-core`)",
                cw - 44.0,
            );
            p.text(
                cx + 22.0,
                cy + 76.0,
                1.1,
                primary,
                "Compiling natively via cargo-xwin (Win64 DX12/Vulkan) & wasm32-unknown-unknown (WebGPU + Material 3 CSS)",
                cw - 44.0,
            );

            // 6 KPI tiles across 2 rows of 3
            let kpis = [
                ("82 Workspace Crates", "UI, Bevy, Lore, Depot, tv-*, C ABI", primary),
                ("Taffy 0.15.1 Kernel", "First-party Flexbox, Grid & Wayland", secondary),
                ("aphrody-ui::fusion", "9 M3 Presets x 23 UI x 11 Targets", tertiary),
                ("Dioxus 0.8 + AnyRender", "VDOM SSR, Subsecond & Vello scenes", primary),
                ("GPUI + NSH + OCAP", "Longbridge kit/shell + Zed 5-rule OCAP", secondary),
                ("Pure C23 ABI Bridges", "core-capi, ffi, adblock, rust_stack", tertiary),
            ];
            let card_w = (cw - 32.0) / 3.0;
            for (i, (title, sub, accent)) in kpis.iter().enumerate() {
                let col = (i % 3) as f32;
                let row = (i / 3) as f32;
                let kx = cx + col * (card_w + 16.0);
                let ky = cy + 130.0 + row * 108.0;
                p.card(kx, ky, card_w, 94.0, rad, surf_low, outline_var);
                p.box_solid(kx + 12.0, ky + 16.0, 5.0, 62.0, 2.5, *accent);
                p.text(kx + 28.0, ky + 20.0, 1.25, on_surf, title, card_w - 40.0);
                p.text(kx + 28.0, ky + 52.0, 1.0, on_var, sub, card_w - 40.0);
            }

            // Interactive 9-Preset Theme Strip
            let py = cy + 356.0;
            p.card(cx, py, cw, 168.0, rad, surf_low, outline_var);
            p.text(cx + 20.0, py + 16.0, 1.25, on_surf, "Live M3 DynamicScheme Switcher (9 Monorepo Presets)", cw - 40.0);
            let pw = (cw - 40.0 - 4.0 * 12.0) / 5.0;
            for (idx, preset) in FusionThemePreset::ALL.iter().enumerate() {
                let c = (idx % 5) as f32;
                let r = (idx / 5) as f32;
                p.hit_chip(
                    cx + 20.0 + c * (pw + 12.0),
                    py + 52.0 + r * 52.0,
                    pw,
                    40.0,
                    10.0,
                    state.preset_idx == idx,
                    &theme,
                    preset.spec().id,
                    ShowcaseAction::SetPreset(idx),
                );
            }

            // Architecture Layers Strip
            let ly = cy + 540.0;
            p.card(cx, ly, cw, 232.0, rad, surf_low, outline_var);
            p.text(cx + 20.0, ly + 16.0, 1.25, on_surf, "Layered Dependency Policy (DEPS.rules + checkdeps + archguard)", cw - 40.0);
            let layers = [
                ("L0/L1 Foundations", "taffy, aphrody-env, core, tv-core, depot-cas, aphrody-brand-gpu, bun-flat, lore-base"),
                ("L2 Platform & HAL", "dx12-hal, cosmic-compat, hypr-tiler, smithay-wayland-wire, depot-gclient, corelib, aphrody-vault"),
                ("L3 Fusion & Services", "aphrody-ui, rust-stack, core-capi, ffi, adblock-capi, gamescope-wgsl, lore-server, archguard"),
                ("L5 Cross-Target Apps", "rust-showcase (Win64 Desktop + WASM32 WebGPU), gamescope-cli, gamescope-web-wasm, game, ay"),
            ];
            for (i, (lname, ldesc)) in layers.iter().enumerate() {
                let ry = ly + 52.0 + i as f32 * 42.0;
                p.box_solid(cx + 20.0, ry, cw - 40.0, 34.0, 8.0, surf_hi);
                p.text(cx + 32.0, ry + 10.0, 1.05, primary, lname, 220.0);
                p.text(cx + 260.0, ry + 10.0, 1.0, on_surf, ldesc, cw - 290.0);
            }
        }
        ShowcaseTab::FusionUi => {
            // Canonical Pages selector
            p.card(cx, cy, cw, 110.0, rad, surf_low, outline_var);
            p.text(cx + 20.0, cy + 14.0, 1.2, on_surf, "Canonical Pages [P] — Shared UiNode Tree", cw - 40.0);
            let pw = (cw - 40.0 - 36.0) / 4.0;
            for (idx, pg) in CanonicalPage::ALL.iter().enumerate() {
                p.hit_chip(
                    cx + 20.0 + idx as f32 * (pw + 12.0),
                    cy + 48.0,
                    pw,
                    44.0,
                    10.0,
                    state.page_idx == idx,
                    &theme,
                    pg.id(),
                    ShowcaseAction::SetPage(idx),
                );
            }

            // 11 Render Targets selector
            let ty = cy + 124.0;
            p.card(cx, ty, cw, 168.0, rad, surf_low, outline_var);
            p.text(cx + 20.0, ty + 14.0, 1.2, on_surf, "11 Fusion Render Targets [R] — Live Target Lowering", cw - 40.0);
            let tw = (cw - 40.0 - 48.0) / 4.0;
            for (idx, tgt) in RenderTarget::ALL.iter().enumerate() {
                let col = (idx % 4) as f32;
                let row = (idx / 4) as f32;
                p.hit_chip(
                    cx + 20.0 + col * (tw + 14.0),
                    ty + 46.0 + row * 38.0,
                    tw,
                    32.0,
                    8.0,
                    state.target_idx == idx,
                    &theme,
                    tgt.id(),
                    ShowcaseAction::SetTarget(idx),
                );
            }

            // Left: Live Target Frame Diagnostics + Payload Preview; Right: 23 Components + Swatches
            let by = cy + 306.0;
            let lw = (cw - 16.0) * 0.62;
            let rw = (cw - 16.0) * 0.38;
            p.card(cx, by, lw, 466.0, rad, surf_low, outline_var);
            p.text(
                cx + 20.0,
                by + 16.0,
                1.2,
                primary,
                &format!("Live Frame: {} @ {}", snap.page_id, snap.target_id),
                lw - 40.0,
            );
            p.text(
                cx + 20.0,
                by + 44.0,
                1.0,
                on_var,
                &format!(
                    "Content-Type: {} | A11y: {} | AnyRender: {} | Overflow: {:.0}px",
                    snap.rendered_frame.content_type,
                    snap.rendered_frame.a11y_node_count,
                    snap.rendered_frame.scene_command_count,
                    snap.rendered_frame.vitals.horizontal_overflow_px,
                ),
                lw - 40.0,
            );
            p.box_solid(cx + 18.0, by + 72.0, lw - 36.0, 376.0, 8.0, surf_hi);
            for (li, line) in snap.rendered_frame.payload.lines().take(15).enumerate() {
                p.text(cx + 28.0, by + 84.0 + li as f32 * 23.0, 0.98, on_surf, line, lw - 56.0);
            }

            p.card(cx + lw + 16.0, by, rw, 466.0, rad, surf_low, outline_var);
            p.text(cx + lw + 34.0, by + 16.0, 1.18, on_surf, "M3 Swatches & 23 Primitives", rw - 40.0);
            let swatches = [
                ("Primary", primary),
                ("Secondary", secondary),
                ("Tertiary", tertiary),
                ("Container", pri_cont),
                ("SurfaceHi", surf_hi),
            ];
            let sw_w = (rw - 36.0) / 5.0;
            for (i, (sname, scol)) in swatches.iter().enumerate() {
                let sx = cx + lw + 30.0 + i as f32 * (sw_w + 2.0);
                p.box_solid(sx, by + 48.0, sw_w - 6.0, 36.0, 8.0, *scol);
                p.text(sx, by + 90.0, 0.85, on_var, sname, sw_w);
            }
            for (i, kind) in UiKind::ALL.iter().enumerate() {
                let c = (i % 2) as f32;
                let r = (i / 2) as f32;
                p.box_solid(
                    cx + lw + 30.0 + c * ((rw - 48.0) * 0.5),
                    by + 116.0 + r * 27.0,
                    (rw - 56.0) * 0.5,
                    22.0,
                    6.0,
                    surf_hi,
                );
                p.text(
                    cx + lw + 38.0 + c * ((rw - 48.0) * 0.5),
                    by + 121.0 + r * 27.0,
                    0.92,
                    on_surf,
                    kind.id(),
                    (rw - 70.0) * 0.5,
                );
            }
        }
        ShowcaseTab::TaffyLayout => {
            p.card(cx, cy, cw, 92.0, rad, surf_low, outline_var);
            p.text(cx + 20.0, cy + 14.0, 1.25, on_surf, "First-Party `crates/taffy` 0.15.1 — Wayland Layer-Shell & Tiling", cw - 40.0);
            let modes = ["MasterStack", "Dwindle", "Grid", "Monocle"];
            for (i, m) in modes.iter().enumerate() {
                p.hit_chip(
                    cx + 20.0 + i as f32 * 168.0,
                    cy + 44.0,
                    156.0,
                    34.0,
                    8.0,
                    state.tiling_idx % 4 == i,
                    &theme,
                    m,
                    ShowcaseAction::SetTiling(i),
                );
            }
            p.hit_chip(
                cx + 716.0,
                cy + 44.0,
                140.0,
                34.0,
                8.0,
                false,
                &theme,
                "- Tile",
                ShowcaseAction::SetTileCount(state.tile_count.saturating_sub(1)),
            );
            p.hit_chip(
                cx + 868.0,
                cy + 44.0,
                140.0,
                34.0,
                8.0,
                false,
                &theme,
                "+ Tile",
                ShowcaseAction::SetTileCount(state.tile_count + 1),
            );
            p.badge(
                cx + 1020.0,
                cy + 46.0,
                30.0,
                8.0,
                pri_cont,
                on_surf,
                &format!("Tiles: {}", state.tile_count),
            );

            // Live Taffy Geometry Viewport Simulation
            let vy = cy + 108.0;
            let vh = 664.0;
            p.card(cx, vy, cw, vh, rad, surf_low, outline_var);
            let inner_x = cx + 24.0;
            let inner_y = vy + 46.0;
            let inner_w = cw - 48.0;
            let inner_h = vh - 70.0;
            p.text(
                inner_x,
                vy + 14.0,
                1.1,
                primary,
                &format!(
                    "Solved 1280x720 Wayland Zones via `TaffyTree` ({}) -> Scale {:.2}x",
                    snap.tiling_name,
                    inner_w / snap.viewport_w
                ),
                cw - 48.0,
            );
            p.box_solid(inner_x, inner_y, inner_w, inner_h, 10.0, surface);

            let sx = inner_w / snap.viewport_w.max(1.0);
            let sy = inner_h / snap.viewport_h.max(1.0);
            let z = &snap.wayland_geometry.zones;

            let zones = [
                ("Top Bar", z.top_bar, surf_hi),
                ("Left Rail", z.left_panel, surf_hi),
                ("Right Drawer", z.right_panel, surf_hi),
                ("Status Bar", z.bottom_bar, surf_hi),
            ];
            for (zname, r, col) in zones {
                let rx = inner_x + r.x * sx;
                let ry = inner_y + r.y * sy;
                let rw = r.width * sx;
                let rh = r.height * sy;
                p.card(rx, ry, rw, rh, 6.0, col, outline_var);
                p.text(rx + 8.0, ry + 8.0, 0.9, on_var, zname, rw - 16.0);
            }

            for (idx, tile) in snap.wayland_geometry.tiles.iter().enumerate() {
                let rx = inner_x + tile.x * sx;
                let ry = inner_y + tile.y * sy;
                let rw = tile.width * sx;
                let rh = tile.height * sy;
                let accent = match idx % 3 {
                    0 => primary,
                    1 => secondary,
                    _ => tertiary,
                };
                p.card(rx, ry, rw, rh, 10.0, pri_cont, accent);
                p.text(
                    rx + 12.0,
                    ry + 14.0,
                    1.1,
                    on_surf,
                    &format!("Wayland Surface #{}", idx + 1),
                    rw - 24.0,
                );
                p.text(
                    rx + 12.0,
                    ry + 38.0,
                    0.95,
                    on_var,
                    &format!("{:.0}x{:.0} @ ({:.0},{:.0})", tile.width, tile.height, tile.x, tile.y),
                    rw - 24.0,
                );
            }
        }
        ShowcaseTab::FirstPartyCrates => {
            p.card(cx, cy, cw, 92.0, rad, surf_low, outline_var);
            p.text(
                cx + 20.0,
                cy + 12.0,
                1.2,
                on_surf,
                &format!("First-Party Workspace Crates ({} total)", FIRST_PARTY_CRATES.len()),
                cw - 40.0,
            );
            p.hit_chip(
                cx + 20.0,
                cy + 44.0,
                92.0,
                34.0,
                8.0,
                state.domain_filter.is_none(),
                &theme,
                "All",
                ShowcaseAction::SetDomainFilter(None),
            );
            let dw = (cw - 132.0 - 72.0) / 7.0;
            for (i, d) in CrateDomain::ALL.iter().enumerate() {
                p.hit_chip(
                    cx + 122.0 + i as f32 * (dw + 10.0),
                    cy + 44.0,
                    dw,
                    34.0,
                    8.0,
                    state.domain_filter == Some(i),
                    &theme,
                    d.label(),
                    ShowcaseAction::SetDomainFilter(Some(i)),
                );
            }

            let list = &snap.filtered_crates;
            let visible = 13usize;
            let page_start = (snap.selected_crate_idx / visible) * visible;
            let ly = cy + 108.0;
            let lw = cw * 0.56;
            let rw = cw - lw - 16.0;
            p.card(cx, ly, lw, 664.0, rad, surf_low, outline_var);
            p.text(
                cx + 18.0,
                ly + 14.0,
                1.05,
                on_var,
                &format!("Showing {}-{} of {} crates (Up/Down or Click)", page_start + 1, (page_start + visible).min(list.len()), list.len()),
                lw - 36.0,
            );

            for (slot, (idx, entry)) in list.iter().enumerate().skip(page_start).take(visible).enumerate() {
                let ry = ly + 46.0 + slot as f32 * 46.0;
                let active = idx == snap.selected_crate_idx;
                p.hit_chip(
                    cx + 14.0,
                    ry,
                    lw - 28.0,
                    38.0,
                    8.0,
                    active,
                    &theme,
                    &format!("[{}] crates/{}  ->  {}", entry.layer, entry.dir, entry.package),
                    ShowcaseAction::SelectCrate(idx),
                );
            }

            // Detail Card
            p.card(cx + lw + 16.0, ly, rw, 664.0, rad, surf_low, outline_var);
            if let Some(sel) = list.get(snap.selected_crate_idx) {
                p.badge(cx + lw + 36.0, ly + 24.0, 30.0, 8.0, primary, on_primary, sel.layer);
                p.badge(cx + lw + 120.0, ly + 24.0, 30.0, 8.0, pri_cont, on_surf, sel.domain.label());
                p.text(cx + lw + 36.0, ly + 72.0, 1.5, on_surf, &format!("crates/{}", sel.dir), rw - 52.0);
                p.text(cx + lw + 36.0, ly + 106.0, 1.15, primary, &format!("Cargo pkg: {}", sel.package), rw - 52.0);
                p.box_solid(cx + lw + 36.0, ly + 142.0, rw - 52.0, 1.0, 0.0, outline_var);
                p.text(cx + lw + 36.0, ly + 162.0, 1.1, on_var, "Capabilities & Scope:", rw - 52.0);
                for (li, chunk) in wrap_lines(sel.summary, 42).into_iter().enumerate() {
                    p.text(cx + lw + 36.0, ly + 194.0 + li as f32 * 26.0, 1.1, on_surf, &chunk, rw - 52.0);
                }
                if let Some(sample) = &snap.native_ffi_sample {
                    p.text(cx + lw + 36.0, ly + 390.0, 1.05, primary, "Live `rust_stack::shadcn_rs` output:", rw - 52.0);
                    for (li, chunk) in wrap_lines(sample, 42).into_iter().take(6).enumerate() {
                        p.text(cx + lw + 36.0, ly + 422.0 + li as f32 * 24.0, 0.98, on_var, &chunk, rw - 52.0);
                    }
                }
            }
        }
        ShowcaseTab::ThirdPartyForks => {
            let visible = 13usize;
            let page_start = (snap.selected_brick_idx / visible) * visible;
            let lw = cw * 0.54;
            let rw = cw - lw - 16.0;
            p.card(cx, cy, lw, 772.0, rad, surf_low, outline_var);
            p.text(
                cx + 18.0,
                cy + 16.0,
                1.2,
                on_surf,
                &format!("Absorbed & Forked Third-Party Rust Ecosystem ({})", THIRD_PARTY_BRICKS.len()),
                lw - 36.0,
            );
            for (slot, (idx, brick)) in THIRD_PARTY_BRICKS.iter().enumerate().skip(page_start).take(visible).enumerate() {
                let ry = cy + 54.0 + slot as f32 * 53.0;
                p.hit_chip(
                    cx + 14.0,
                    ry,
                    lw - 28.0,
                    44.0,
                    8.0,
                    idx == snap.selected_brick_idx,
                    &theme,
                    &format!("{}  [{}]", brick.name, brick.category),
                    ShowcaseAction::SelectBrick(idx),
                );
            }

            p.card(cx + lw + 16.0, cy, rw, 772.0, rad, surf_low, outline_var);
            if let Some(b) = THIRD_PARTY_BRICKS.get(snap.selected_brick_idx) {
                p.badge(cx + lw + 36.0, cy + 24.0, 30.0, 8.0, primary, on_primary, b.category);
                p.text(cx + lw + 36.0, cy + 72.0, 1.4, on_surf, b.name, rw - 52.0);
                p.text(cx + lw + 36.0, cy + 108.0, 1.1, primary, &format!("Pin: {}", b.version_or_pin), rw - 52.0);
                p.text(cx + lw + 36.0, cy + 142.0, 1.05, on_var, &format!("Upstream: {}", b.upstream), rw - 52.0);
                p.text(cx + lw + 36.0, cy + 174.0, 1.05, on_surf, &format!("Monorepo/Fork: {}", b.fork_or_location), rw - 52.0);
                p.box_solid(cx + lw + 36.0, cy + 212.0, rw - 52.0, 1.0, 0.0, outline_var);
                p.text(cx + lw + 36.0, cy + 232.0, 1.15, primary, "Exposed Capabilities:", rw - 52.0);
                for (li, chunk) in wrap_lines(b.features_exposed, 44).into_iter().enumerate() {
                    p.text(cx + lw + 36.0, cy + 266.0 + li as f32 * 26.0, 1.08, on_surf, &chunk, rw - 52.0);
                }
            }
        }
        ShowcaseTab::CAbiAndFfi => {
            let lw = cw * 0.44;
            let rw = cw - lw - 16.0;
            p.card(cx, cy, lw, 772.0, rad, surf_low, outline_var);
            p.text(cx + 20.0, cy + 18.0, 1.25, on_surf, "Unified C23 ABI Bridges (LLVM Cross-LTO)", lw - 40.0);
            for (idx, abi) in ABI_BRIDGES.iter().enumerate() {
                p.hit_chip(
                    cx + 16.0,
                    cy + 62.0 + idx as f32 * 64.0,
                    lw - 32.0,
                    52.0,
                    10.0,
                    idx == snap.selected_abi_idx,
                    &theme,
                    &format!("{} ({} syms)", abi.library, abi.symbols.len()),
                    ShowcaseAction::SelectAbi(idx),
                );
            }

            p.card(cx + lw + 16.0, cy, rw, 772.0, rad, surf_low, outline_var);
            if let Some(abi) = ABI_BRIDGES.get(snap.selected_abi_idx) {
                p.badge(cx + lw + 36.0, cy + 24.0, 30.0, 8.0, tertiary, on_primary, abi.crate_dir);
                p.text(cx + lw + 36.0, cy + 72.0, 1.45, on_surf, abi.library, rw - 52.0);
                p.text(cx + lw + 36.0, cy + 108.0, 1.05, primary, &format!("Header: {}", abi.header), rw - 52.0);
                p.text(cx + lw + 36.0, cy + 140.0, 1.05, on_var, &format!("Consumers: {}", abi.consumers), rw - 52.0);
                p.box_solid(cx + lw + 36.0, cy + 176.0, rw - 52.0, 1.0, 0.0, outline_var);
                p.text(cx + lw + 36.0, cy + 196.0, 1.15, primary, "Exported `extern \"C\"` Symbols:", rw - 52.0);
                for (si, sym) in abi.symbols.iter().enumerate() {
                    p.box_solid(cx + lw + 36.0, cy + 232.0 + si as f32 * 34.0, rw - 64.0, 28.0, 6.0, surf_hi);
                    p.text(cx + lw + 48.0, cy + 240.0 + si as f32 * 34.0, 1.02, on_surf, sym, rw - 80.0);
                }
            }
        }
    }

    // Bottom Status Bar (y=864..900)
    p.box_solid(0.0, 864.0, VIRT_W, 36.0, 0.0, surf_low);
    p.box_solid(0.0, 864.0, VIRT_W, 1.0, 0.0, outline_var);
    p.text(
        20.0,
        875.0,
        1.0,
        on_var,
        "[1-6] Tab   [T] Cycle 9 M3 Themes   [D] Dark/Light   [P] Page   [R] Target   [L] Taffy Strategy   [Up/Down] Select   Click any chip/card",
        VIRT_W - 40.0,
    );

    BuiltScene {
        quads,
        hits,
        clear_rgba: surface,
    }
}

fn wrap_lines(s: &str, max_chars: usize) -> Vec<String> {
    let mut lines = Vec::new();
    let mut current = String::new();
    for word in s.split_whitespace() {
        if !current.is_empty() && current.len() + 1 + word.len() > max_chars {
            lines.push(std::mem::take(&mut current));
        }
        if !current.is_empty() {
            current.push(' ');
        }
        current.push_str(word);
    }
    if !current.is_empty() {
        lines.push(current);
    }
    lines
}

/// Computes letterboxed viewport `(x, y, width, height)` fitting `1440x900` inside `(win_w, win_h)`.
#[must_use]
pub fn fit_viewport(win_w: u32, win_h: u32) -> (f32, f32, f32, f32) {
    let ww = win_w.max(1) as f32;
    let wh = win_h.max(1) as f32;
    let scale = (ww / VIRT_W).min(wh / VIRT_H);
    let vw = VIRT_W * scale;
    let vh = VIRT_H * scale;
    ((ww - vw) * 0.5, (wh - vh) * 0.5, vw, vh)
}

/// Maps window pixel coordinates `(px, py)` into virtual `1440x900` scene coordinates.
#[must_use]
pub fn window_to_virtual(px: f32, py: f32, win_w: u32, win_h: u32) -> (f32, f32) {
    let (vx, vy, vw, vh) = fit_viewport(win_w, win_h);
    let u = ((px - vx) / vw.max(1.0)) * VIRT_W;
    let v = ((py - vy) / vh.max(1.0)) * VIRT_H;
    (u, v)
}

/// Shared `wgpu` 30 pipeline wrapper driving both Desktop (`winit`) and WebGPU (`wasm32`) canvases.
pub struct GpuShowcaseRenderer {
    pub device: wgpu::Device,
    pub queue: wgpu::Queue,
    pub surface: wgpu::Surface<'static>,
    pub config: wgpu::SurfaceConfiguration,
    pub pipeline: wgpu::RenderPipeline,
    pub bind: wgpu::BindGroup,
    pub instances: wgpu::Buffer,
    pub adapter_name: String,
    pub hits: Vec<HitRegion>,
}

impl GpuShowcaseRenderer {
    /// Initializes `wgpu` pipeline + pure-Rust RGBA font atlas on an already-created `Surface`.
    pub async fn from_surface(
        instance: &wgpu::Instance,
        surface: wgpu::Surface<'static>,
        width: u32,
        height: u32,
    ) -> Result<Self, String> {
        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::HighPerformance,
                compatible_surface: Some(&surface),
                ..Default::default()
            })
            .await
            .map_err(|e| format!("request_adapter failed: {e:?}"))?;

        let info = adapter.get_info();
        let adapter_name = format!("{} ({:?})", info.name, info.backend);

        let (device, queue) = adapter
            .request_device(&wgpu::DeviceDescriptor {
                label: Some("rust-showcase device"),
                ..Default::default()
            })
            .await
            .map_err(|e| format!("request_device failed: {e:?}"))?;

        let caps = surface.get_capabilities(&adapter);
        let format = caps
            .formats
            .iter()
            .copied()
            .find(|f| !f.is_srgb())
            .unwrap_or(caps.formats[0]);

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format,
            width: width.max(1),
            height: height.max(1),
            present_mode: wgpu::PresentMode::Fifo,
            alpha_mode: caps.alpha_modes[0],
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
            color_space: wgpu::SurfaceColorSpace::Auto,
        };
        surface.configure(&device, &config);

        let shader = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("showcase.wgsl"),
            source: wgpu::ShaderSource::Wgsl(include_str!("showcase.wgsl").into()),
        });

        let atlas = device.create_texture(&wgpu::TextureDescriptor {
            label: Some("showcase font atlas"),
            size: wgpu::Extent3d {
                width: ATLAS_W,
                height: ATLAS_H,
                depth_or_array_layers: 1,
            },
            mip_level_count: 1,
            sample_count: 1,
            dimension: wgpu::TextureDimension::D2,
            format: wgpu::TextureFormat::Rgba8Unorm,
            usage: wgpu::TextureUsages::TEXTURE_BINDING | wgpu::TextureUsages::COPY_DST,
            view_formats: &[],
        });

        let atlas_bytes = build_rgba_atlas();
        queue.write_texture(
            wgpu::TexelCopyTextureInfo {
                texture: &atlas,
                mip_level: 0,
                origin: wgpu::Origin3d::ZERO,
                aspect: wgpu::TextureAspect::All,
            },
            &atlas_bytes,
            wgpu::TexelCopyBufferLayout {
                offset: 0,
                bytes_per_row: Some(ATLAS_W * 4),
                rows_per_image: Some(ATLAS_H),
            },
            wgpu::Extent3d {
                width: ATLAS_W,
                height: ATLAS_H,
                depth_or_array_layers: 1,
            },
        );

        let view = atlas.create_view(&wgpu::TextureViewDescriptor::default());
        let sampler = device.create_sampler(&wgpu::SamplerDescriptor {
            mag_filter: wgpu::FilterMode::Nearest,
            min_filter: wgpu::FilterMode::Linear,
            address_mode_u: wgpu::AddressMode::ClampToEdge,
            address_mode_v: wgpu::AddressMode::ClampToEdge,
            ..Default::default()
        });

        let bgl = device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
            label: Some("showcase bgl"),
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
            label: Some("showcase bind"),
            layout: &bgl,
            entries: &[
                wgpu::BindGroupEntry {
                    binding: 0,
                    resource: wgpu::BindingResource::TextureView(&view),
                },
                wgpu::BindGroupEntry {
                    binding: 1,
                    resource: wgpu::BindingResource::Sampler(&sampler),
                },
            ],
        });

        let layout = device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
            label: Some("showcase layout"),
            bind_group_layouts: &[Some(&bgl)],
            immediate_size: 0,
        });

        let attrs = wgpu::vertex_attr_array![
            0 => Float32x4,
            1 => Float32x4,
            2 => Float32x4,
            3 => Float32x4,
            4 => Float32x4
        ];
        let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
            label: Some("showcase pipeline"),
            layout: Some(&layout),
            vertex: wgpu::VertexState {
                module: &shader,
                entry_point: Some("vs"),
                compilation_options: Default::default(),
                buffers: &[Some(wgpu::VertexBufferLayout {
                    array_stride: std::mem::size_of::<QuadInstance>() as u64,
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
            label: Some("showcase instances"),
            size: (MAX_QUADS * std::mem::size_of::<QuadInstance>()) as u64,
            usage: wgpu::BufferUsages::VERTEX | wgpu::BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });

        Ok(Self {
            device,
            queue,
            surface,
            config,
            pipeline,
            bind,
            instances,
            adapter_name,
            hits: Vec::new(),
        })
    }

    /// Reconfigures swapchain when window or HTML canvas resizes.
    pub fn resize(&mut self, width: u32, height: u32) {
        if width > 0 && height > 0 {
            self.config.width = width;
            self.config.height = height;
            self.surface.configure(&self.device, &self.config);
        }
    }

    /// Renders `state` + `snap` onto the GPU surface and updates click hitboxes.
    pub fn render(&mut self, state: &ShowcaseState, snap: &ShowcaseSnapshot) {
        let scene = build_scene(state, snap);
        self.hits = scene.hits;
        let count = scene.quads.len().min(MAX_QUADS);
        if count > 0 {
            self.queue
                .write_buffer(&self.instances, 0, bytemuck::cast_slice(&scene.quads[..count]));
        }

        let frame = match self.surface.get_current_texture() {
            wgpu::CurrentSurfaceTexture::Success(f) | wgpu::CurrentSurfaceTexture::Suboptimal(f) => f,
            wgpu::CurrentSurfaceTexture::Outdated | wgpu::CurrentSurfaceTexture::Lost => {
                self.surface.configure(&self.device, &self.config);
                return;
            }
            _ => return,
        };

        let view = frame.texture.create_view(&wgpu::TextureViewDescriptor::default());
        let mut encoder = self
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("showcase frame"),
            });
        {
            let c = scene.clear_rgba;
            let mut pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("showcase pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    depth_slice: None,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color {
                            r: f64::from(c[0]),
                            g: f64::from(c[1]),
                            b: f64::from(c[2]),
                            a: 1.0,
                        }),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
                multiview_mask: None,
            });
            let (vx, vy, vw, vh) = fit_viewport(self.config.width, self.config.height);
            pass.set_viewport(vx, vy, vw, vh, 0.0, 1.0);
            pass.set_pipeline(&self.pipeline);
            pass.set_bind_group(0, &self.bind, &[]);
            pass.set_vertex_buffer(0, self.instances.slice(..));
            pass.draw(0..6, 0..count as u32);
        }
        self.queue.submit(Some(encoder.finish()));
        #[cfg(not(target_arch = "wasm32"))]
        self.queue.present(frame);
    }

    /// Evaluates a window-pixel click against the most recent rendered hitboxes.
    #[must_use]
    pub fn hit_test(&self, px: f32, py: f32) -> Option<ShowcaseAction> {
        let (vx, vy) = window_to_virtual(px, py, self.config.width, self.config.height);
        self.hits
            .iter()
            .rev()
            .find(|h| h.contains(vx, vy))
            .map(|h| h.action.clone())
    }
}
