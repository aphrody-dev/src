/* SPDX-License-Identifier: MIT OR Apache-2.0 */
/*
 * src/include/uapi/ay/ui.h - Pure C Material 3 Expressive UI, Spring Motion, Layout & HTML/WGSL ABI
 *
 * Canonical C ABI shared identically across:
 *   - WebAssembly 3.0 browser runtime (`aysys.wasm`, `m3.wasm`) + WebGPU WGSL + DOM A11y tree
 *   - WASI Preview 1/2 SSR static/edge site generator (`ay-m3-ssr.wasm`)
 *   - Android NDK (`ANativeWindow` / `AChoreographer` + Jetpack Compose JNI)
 *   - Dart / Flutter (`dart:ffi`), Rust (`crates/core-capi`, `aphrody-ui`, `taffy`, `egui`, `iced`,
 *     `libcosmic`, `bevy`, `leptos`, `dioxus`, `tauri`), Pure Bun (`bun:ffi`), React, and WinUI 3.
 *
 * Color roles match `packages/design/tokens/tokens.json` (`assets/brand/brand.toml` seed #135B82,
 * Material Color Utilities 0.4.0 vibrant scheme).
 */
#ifndef _UAPI_AY_UI_H
#define _UAPI_AY_UI_H

#include "types.h"

/* Window size classes (dp / CSS px) - m3.layout.window-size-classes */
#define AY_UI_WIN_COMPACT     0u /* < 600dp */
#define AY_UI_WIN_MEDIUM      1u /* 600..839dp */
#define AY_UI_WIN_EXPANDED    2u /* 840..1199dp */
#define AY_UI_WIN_LARGE       3u /* 1200..1599dp */
#define AY_UI_WIN_EXTRA_LARGE 4u /* >= 1600dp */

/* Material 3 Expressive spring presets (androidx Compose Material3 v0_14_0) */
#define AY_UI_SPRING_FAST_SPATIAL    0u /* damping 0.6, stiffness 800  */
#define AY_UI_SPRING_FAST_EFFECTS    1u /* damping 1.0, stiffness 3800 */
#define AY_UI_SPRING_DEFAULT_SPATIAL 2u /* damping 0.8, stiffness 380  */
#define AY_UI_SPRING_DEFAULT_EFFECTS 3u /* damping 1.0, stiffness 1600 */
#define AY_UI_SPRING_SLOW_SPATIAL    4u /* damping 0.8, stiffness 200  */
#define AY_UI_SPRING_SLOW_EFFECTS    5u /* damping 1.0, stiffness 800  */

/* Material 3 component kinds shared with @material/web, Compose M3, Flutter M3 & Rust */
#define AY_UI_COMP_APP_BAR_SMALL      0u
#define AY_UI_COMP_BUTTON_FILLED      1u
#define AY_UI_COMP_BUTTON_TONAL       2u
#define AY_UI_COMP_BUTTON_OUTLINED    3u
#define AY_UI_COMP_FAB_PRIMARY        4u
#define AY_UI_COMP_CARD_FILLED        5u
#define AY_UI_COMP_CARD_OUTLINED      6u
#define AY_UI_COMP_CHIP_ASSIST        7u
#define AY_UI_COMP_NAVIGATION_BAR     8u
#define AY_UI_COMP_NAVIGATION_RAIL    9u
#define AY_UI_COMP_TEXT_FIELD_OUTLINE 10u
#define AY_UI_COMP_SWITCH             11u

/* Theme mode */
#define AY_UI_THEME_LIGHT 0u
#define AY_UI_THEME_DARK  1u

/* Core M3 semantic color roles (0xAARRGGBB) */
#define AY_UI_ROLE_SURFACE                   0u
#define AY_UI_ROLE_SURFACE_CONTAINER_LOWEST  1u
#define AY_UI_ROLE_SURFACE_CONTAINER_LOW     2u
#define AY_UI_ROLE_SURFACE_CONTAINER         3u
#define AY_UI_ROLE_SURFACE_CONTAINER_HIGH    4u
#define AY_UI_ROLE_SURFACE_CONTAINER_HIGHEST 5u
#define AY_UI_ROLE_ON_SURFACE                6u
#define AY_UI_ROLE_ON_SURFACE_VARIANT        7u
#define AY_UI_ROLE_PRIMARY                   8u
#define AY_UI_ROLE_ON_PRIMARY                9u
#define AY_UI_ROLE_PRIMARY_CONTAINER         10u
#define AY_UI_ROLE_ON_PRIMARY_CONTAINER      11u
#define AY_UI_ROLE_SECONDARY                 12u
#define AY_UI_ROLE_ON_SECONDARY              13u
#define AY_UI_ROLE_SECONDARY_CONTAINER       14u
#define AY_UI_ROLE_ON_SECONDARY_CONTAINER    15u
#define AY_UI_ROLE_TERTIARY                  16u
#define AY_UI_ROLE_ON_TERTIARY               17u
#define AY_UI_ROLE_TERTIARY_CONTAINER        18u
#define AY_UI_ROLE_ON_TERTIARY_CONTAINER     19u
#define AY_UI_ROLE_ERROR                     20u
#define AY_UI_ROLE_ON_ERROR                  21u
#define AY_UI_ROLE_OUTLINE                   22u
#define AY_UI_ROLE_OUTLINE_VARIANT           23u
#define AY_UI_ROLE_BOLT                      24u
#define AY_UI_ROLE_COUNT                     25u

struct ay_ui_spring_state {
	float value;
	float target;
	float velocity;
	float damping_ratio;
	float stiffness;
};

struct ay_ui_rect {
	__u32 id;
	__u32 kind;
	__u32 x;
	__u32 y;
	__u32 w;
	__u32 h;
	__u32 corner_radius_px;
	__u32 fill_argb;
};

struct ay_ui_adaptive_shell {
	__u32 window_class;     /* AY_UI_WIN_* */
	__u32 nav_kind;         /* AY_UI_COMP_NAVIGATION_BAR or AY_UI_COMP_NAVIGATION_RAIL */
	__u32 margin_px;        /* 16dp compact, 24dp medium+ */
	__u32 gutter_px;        /* 12dp compact, 16dp medium, 24dp expanded+ */
	__u32 columns;          /* 1, 2, 3, or 4 */
	__u32 nav_rail_width_px;/* 0 on compact, 80dp on medium/expanded, 220dp on large+ */
	__u32 bottom_bar_h_px;  /* 80dp on compact, 0 on medium+ */
	__u32 content_x;
	__u32 content_y;
	__u32 content_w;
	__u32 content_h;
};

#endif /* _UAPI_AY_UI_H */
