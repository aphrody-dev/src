// SPDX-License-Identifier: MIT OR Apache-2.0
/*
 * src/ui/site_wasi.c - Pure C (`-std=gnu11`) + WASI Preview 1 Material 3 Expressive Site Emitter
 *
 * Compiles to a standalone 38 KB WASI WebAssembly module (`target/sys/ay-m3-site.wasm`) via WASI-SDK 34
 * (`clang --target=wasm32-wasip1`) + Binaryen `wasm-opt -O3`.
 *
 * Emits a complete, WCAG 2.2 AA & Modern Web Guidelines compliant Material 3 Expressive page to stdout
 * consuming `/tokens.css` (`packages/design/tokens/tokens.css`), `ay_ui_emit_m3_card_html`, `ay_ui_color_argb`,
 * `ay_ui_compute_shell`, and linking the interactive WebGPU/WebAssembly surface (`/m3/` + `/wayland/`).
 */

#include <stdio.h>
#include "../include/ay/sys.h"

int main(void)
{
	struct ay_ui_adaptive_shell compact_shell, expanded_shell;
	struct ay_ui_spring_state spring;
	char card_c_wasm[1024];
	char card_compose_flutter[1024];
	char card_rust_bun[1024];
	__u32 primary_light = ay_ui_color_argb(AY_UI_THEME_LIGHT, AY_UI_ROLE_PRIMARY);
	__u32 primary_dark = ay_ui_color_argb(AY_UI_THEME_DARK, AY_UI_ROLE_PRIMARY);

	ay_ui_compute_shell(390u, 844u, &compact_shell);
	ay_ui_compute_shell(1440u, 900u, &expanded_shell);
	ay_ui_spring_init(&spring, AY_UI_SPRING_FAST_SPATIAL, 0.0f, 1.0f);
	ay_ui_spring_step(&spring, 0.016f);

	ay_ui_emit_m3_card_html(
		card_c_wasm, sizeof(card_c_wasm),
		"Pure C11 + WebAssembly 3.0 + WebGPU + WASI", 42u,
		"Freestanding -std=gnu11 core (aysys.wasm + ay-m3-site.wasm) sharing exact M3 tokens, spring physics, and adaptive layout.", 121u,
		"Open M3 Wasm Studio", 19u,
		"/m3/", 4u);

	ay_ui_emit_m3_card_html(
		card_compose_flutter, sizeof(card_compose_flutter),
		"Android NDK + Jetpack Compose + Flutter M3", 42u,
		"Compose-first Expressive springs (damping 0.6 / stiffness 800), Theme.kt, ndk_theme.h, and aphrody_theme.dart from one seed.", 124u,
		"Wayland Wasm (wasm32)", 21u,
		"/wayland/", 9u);

	ay_ui_emit_m3_card_html(
		card_rust_bun, sizeof(card_rust_bun),
		"Rust + Pure Bun + WinUI 3 + Figma & Stitch", 42u,
		"Zero-drift adapters for Taffy, egui, iced, libcosmic, Bevy, Leptos, Dioxus, Tauri, React, WinUI 3, DESIGN.md, and Stitch.", 121u,
		"GitHub Repository", 17u,
		"https://github.com/aphrody-labs/aphrody", 39u);

	printf("<!doctype html>\n"
	       "<html lang=\"en\">\n"
	       "<head>\n"
	       "  <meta charset=\"utf-8\" />\n"
	       "  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />\n"
	       "  <title>Aphrody Pure-C M3 Studio - WebAssembly, WebGPU &amp; Cross-Platform UI</title>\n"
	       "  <meta name=\"description\" content=\"Pure C11, WebAssembly 3.0, WASI and WebGPU Material 3 Expressive UI sharing exact tokens across Android NDK, Compose, Flutter, Rust, Bun, and WinUI 3.\" />\n"
	       "  <link rel=\"canonical\" href=\"https://aphrody.com/m3/\" />\n"
	       "  <link rel=\"icon\" href=\"/favicon.ico\" sizes=\"any\" />\n"
	       "  <link rel=\"icon\" href=\"/icon.svg\" type=\"image/svg+xml\" />\n"
	       "  <link rel=\"stylesheet\" href=\"/tokens.css\" />\n"
	       "  <style>\n"
	       "    *{box-sizing:border-box}\n"
	       "    body{margin:0;font-family:var(--md-ref-typeface-plain);background:var(--md-sys-color-surface);color:var(--md-sys-color-on-surface);min-height:100svh}\n"
	       "    header.app-bar{min-height:64px;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0.75rem 1.5rem;background:var(--md-sys-color-surface-container);border-bottom:1px solid var(--md-sys-color-outline-variant)}\n"
	       "    main{max-width:76rem;margin:0 auto;padding:1.5rem;display:grid;gap:1.5rem}\n"
	       "    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(19rem,1fr));gap:1rem}\n"
	       "    .surface-box{background:var(--md-sys-color-surface-container-low);border:1px solid var(--md-sys-color-outline-variant);border-radius:var(--md-sys-shape-corner-large);padding:1.25rem}\n"
	       "    a,md-filled-button{color:var(--md-sys-color-primary);text-decoration:none;font-weight:600}\n"
	       "    md-filled-button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 1.25rem;border-radius:var(--md-sys-shape-corner-full);background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary)}\n"
	       "    button{min-height:40px;padding:0 1rem;border-radius:var(--md-sys-shape-corner-full);border:1px solid var(--md-sys-color-outline);background:var(--md-sys-color-surface-container-high);color:var(--md-sys-color-on-surface);font-family:inherit;font-weight:500;cursor:pointer}\n"
	       "    button.primary{background:var(--md-sys-color-primary);color:var(--md-sys-color-on-primary);border-color:var(--md-sys-color-primary)}\n"
	       "    button:focus-visible,canvas:focus-visible,a:focus-visible{outline:3px solid var(--md-sys-color-secondary);outline-offset:2px}\n"
	       "    canvas{width:100%%;max-width:720px;height:auto;display:block;border-radius:var(--md-sys-shape-corner-medium);border:1px solid var(--md-sys-color-outline-variant);background:var(--md-sys-color-surface-container-lowest)}\n"
	       "    code{font-family:var(--md-ref-typeface-code);font-size:var(--md-sys-typescale-body-small-size)}\n"
	       "  </style>\n"
	       "</head>\n"
	       "<body>\n"
	       "  <header class=\"app-bar\">\n"
	       "    <div><a href=\"/\">Aphrody</a> / <strong>Pure-C Material 3 Expressive (WASI + WebGPU)</strong></div>\n"
	       "    <code id=\"m3-status\">Seed #135B82 | Light #%06X / Dark #%06X</code>\n"
	       "  </header>\n"
	       "  <main>\n"
	       "    <section class=\"grid\" aria-label=\"Cross-Platform Material 3 Targets\">\n"
	       "      %s\n"
	       "      %s\n"
	       "      %s\n"
	       "    </section>\n"
	       "    <section class=\"surface-box\" aria-label=\"Interactive Pure-C Spring &amp; WebGPU Surface\">\n"
	       "      <h2 style=\"margin:0 0 0.5rem;font-size:var(--md-sys-typescale-title-large-size)\">Interactive Pure-C M3 Expressive Spring &amp; Adaptive Shell (`aysys.wasm`)</h2>\n"
	       "      <p style=\"margin:0 0 1rem;color:var(--md-sys-color-on-surface-variant)\">Compact 390dp -&gt; nav=%u cols=%u | Desktop 1440dp -&gt; rail=%upx cols=%u | Fast-Spatial 16ms step=%.4f</p>\n"
	       "      <div style=\"display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem\" role=\"toolbar\" aria-label=\"M3 Spring Controls\">\n"
	       "        <button id=\"btn-spring-spatial\" class=\"primary\" type=\"button\" data-preset=\"0\">Trigger Fast-Spatial Spring (0.6 / 800)</button>\n"
	       "        <button id=\"btn-spring-default\" type=\"button\" data-preset=\"2\">Default-Spatial (0.8 / 380)</button>\n"
	       "        <button id=\"btn-spring-effects\" type=\"button\" data-preset=\"1\">Fast-Effects (1.0 / 3800)</button>\n"
	       "        <button id=\"btn-theme-toggle\" type=\"button\">Toggle Light / Dark Scheme</button>\n"
	       "      </div>\n"
	       "      <canvas id=\"m3-canvas\" width=\"720\" height=\"260\" tabindex=\"0\" role=\"img\" aria-label=\"WebGPU and Canvas2D surface driven by pure C ay_ui_spring_step and ay_ui_compute_shell in aysys.wasm\"></canvas>\n"
	       "      <p id=\"m3-telemetry\" style=\"margin:0.75rem 0 0\"><code>Loading /m3/aysys.wasm...</code></p>\n"
	       "    </section>\n"
	       "  </main>\n"
	       "  <script type=\"module\" src=\"/m3/m3-host.js\"></script>\n"
	       "</body>\n"
	       "</html>\n",
	       primary_light & 0xFFFFFFu,
	       primary_dark & 0xFFFFFFu,
	       card_c_wasm,
	       card_compose_flutter,
	       card_rust_bun,
	       compact_shell.nav_kind,
	       compact_shell.columns,
	       expanded_shell.nav_rail_width_px,
	       expanded_shell.columns,
	       (double)spring.value);
	return 0;
}
