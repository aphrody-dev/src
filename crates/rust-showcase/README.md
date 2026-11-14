# rust-showcase

Shared-code Rust ecosystem showcase compiling cleanly to both a native Desktop GPU window (`winit` + `wgpu` on Windows DX12/Vulkan and Linux) and a WebAssembly + WebGPU SPA (`wasm-bindgen` + Material 3 CSS tokens in `apps/rust-showcase`).

It exposes interactive live state and inspection across:

- `aphrody-ui::fusion` (9 M3/Hyprland/Fluent/Omarchy presets, 23 shared primitives, 4 canonical pages, 11 render targets)
- First-party `crates/taffy` v0.15.1 Flexbox, Grid, and Wayland tiling solver + `AccessKit` projection
- All 83 first-party Rust workspace crates across L0..L5
- All absorbed and forked third-party Rust bricks (`Dioxus 0.8`, `Blitz`, `AnyRender`, `Vello`, `Parley`, `Kurbo`, `Peniko`, `GPUI`, `gpui-kit`, `embedded_gpui`, `nsh`, `Bevy`, `wgpu`, `winit`, `egui`, `Ratatui`, `Ropey`, `Gitoxide`, `OxC`, `windows-rs`, `Lore`)
- Pure C ABI (`core-capi`, `ffi`, `adblock-capi`, `mwg_capi`, `rust_stack_ffi`)
