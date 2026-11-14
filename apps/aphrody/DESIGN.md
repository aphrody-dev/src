# Aphrody Static Assets, Wayland Wasm & SEO Contract

Visual tokens referenced by `public/*.html` and `public/wayland/index.html` come directly from `packages/design/tokens/tokens.css` (`@aphrody/design`) and align with Figma file `2xsZi5wLPAYLGNCLZ2ZJUv` (`packages/design/tokens/figma-mockup.json`).
The interactive Wayland compositor at `public/wayland/index.html` is powered by pure-C `wasm/wayland_compositor.c` compiled with LLVM `clang --target=wasm32 -nostdlib` to `public/wayland.wasm`, loaded via `WebAssembly.instantiateStreaming` (`Content-Type: application/wasm` in `public/_headers`).
