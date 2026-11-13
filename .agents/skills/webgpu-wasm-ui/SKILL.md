---
name: webgpu-wasm-ui
description: src rules for GPU UI rendering and native compute in the browser. Use BEFORE any WebGPU code (adapter, device, limits, WGSL, canvas, compute), WebAssembly (streaming load, SIMD, threads, memory, DWARF debugging, WasmGC), Worker or OffscreenCanvas, or any web UI rendered on canvas, and to know where WebGPU is available in Chrome.
---

# webgpu-wasm-ui

Authoritative spec: `docs/design/specs/gpu-wasm/webgpu-wasm.md` + `.json` (ids `web.webgpu.*`, `web.wasm.*`, `web.workers.*`, sources developer.chrome.com and web.dev read on 2026-11-13, mirror `third_party/design-mirror`).

## Place in the src UI direction

- `docs/ui/STACK.md` sets the targets: native desktop in GPUI (D3D11) or WebUI, nt in pure GPU D3D12 4K 120 fps via its agent, 3D through three.js WebGPURenderer or wgpu (skill `threejs-webgpu`).
- This skill covers the browser target: WebGPU and wasm in Chrome and the other engines, when a web surface must render or compute on the GPU.
- Code shared between native and web: Rust + wgpu or C++ + Dawn compiled to wasm; a single WGSL shader base.
- A UI drawn on canvas stays accessible and measurable: synchronized DOM tree (`web.webgpu.ui-a11y`), specs `a11y/web` and `perf/core-web-vitals` apply (skill `web-a11y-seo-cwv`).

## Key points

- Chrome: WebGPU on by default since 113 (Windows D3D12, macOS, ChromeOS), Android 12+ since 121, Linux since 144 (Intel Gen12+) then 147-148 (NVIDIA, Wayland) in progressive rollout. Firefox 141 (Windows), Safari 26. Always detect `navigator.gpu` and a `null` adapter, with fallback.
- Limits: `requestDevice()` gives the lowest common denominator; request `requiredLimits`/`requiredFeatures` explicitly. Older hardware: `featureLevel: "compatibility"` (Chrome 146).
- Windows: `powerPreference` has no effect in Chrome, a single adapter.
- Asynchronous errors, device loss to handle, `label` on every object; check "Hardware accelerated" in `chrome://gpu` before measuring.
- WGSL: recent extension only after `navigator.gpu.wgslLanguageFeatures` and a `requires` directive.
- wasm: `instantiateStreaming`/`compileStreaming`, `Content-Type: application/wasm`; one binary per cohort (SIMD, threads, exceptions) chosen by wasm-feature-detect; threads = COOP `same-origin` + COEP `require-corp`; no memory view kept after `memory.grow`; separate DWARF 5 for debugging.
- Workers: rendering in a worker via transferred OffscreenCanvas, module workers, main thread without any task > 50 ms.

## Procedure

1. Read the spec, apply the MUSTs, cite the ids in review and in commits.
2. Test on the workstation (RTX 4070, Chrome 157; skill `chrome` for flags, `chrome://gpu`, headless) and in software mode for the fallback.
3. Any new version or availability: read `developer.chrome.com/docs/web-platform/webgpu/news` live, update the JSON then the `.md`, record the conflict.

## Neighbouring skills

`threejs-webgpu` (3D scenes, native wgpu), `ui-system` (targets and tokens), `gpui-kit` (GPUI desktop), `modern-web-guidance:modern-web-guidance` (web APIs, WebAssembly section), `chrome` (browser GPU configuration).
