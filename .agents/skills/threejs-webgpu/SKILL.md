---
name: threejs-webgpu
description: 3D scenes and GPU rendering in src. Use before any three.js scene (WebGPURenderer, TSL, glTF, lighting, post-processing, performance) or any native wgpu rendering in Rust. Absorbs CloudAI-X/threejs-skills (MIT), rewritten for bun, without React.
license: MIT
metadata:
  upstream: "CloudAI-X/threejs-skills@0e181866f095 (fork aphrody-labs/threejs-skills)"
  verified: "2026-11-13, gh api repos/<o>/<r>/releases/latest: mrdoob/three.js r187 published 2026-10-30, gfx-rs/wgpu v30.0.2 published 2026-11-12"
---

# threejs-webgpu

Two paths, only one per surface:

| Surface | Path | Forbidden |
|---|---|---|
| Web (aphrody.com, aphrody.app, demos) | `three` (fork `aphrody-labs/three.js`), `WebGPURenderer` + TSL (`three/tsl`), automatic WebGL2 fallback of the same renderer | `@react-three/fiber`, drei, gltfjsx, vite, npm |
| Desktop / native | `wgpu` (fork `aphrody-labs/wgpu`) from Rust, WGSL; GPUI for the chrome around the canvas | in-house engine on top of OpenGL |

## Rules

1. bun only: `bun add three` in the package, page served by `Bun.serve` (imported HTML, bun's bundler). glTF tools: `bun x @gltf-transform/cli@4.5.1 inspect|validate|optimize` (pinned version, npm registry of 2026-11-13, including in the references).
2. Version: check `gh api repos/mrdoob/three.js/releases/latest` before citing an API; the references below target r186, reread the r187 release notes before writing code that depends on a recent API.
3. Renderer: `new WebGPURenderer({ antialias: true })`, `await renderer.init()` before the first render, `renderer.setAnimationLoop`. Node materials (`MeshStandardNodeMaterial`, TSL) rather than GLSL `ShaderMaterial`.
4. Scene colors, backgrounds and HUD: M3 roles from `packages/design/tokens/tokens.json` (never a copied hex); HUD in Material Web on top of the canvas.
5. Accessibility and motion: `prefers-reduced-motion: reduce` = still image, no loop; canvas with `aria-label` and a text alternative; dispose geometries, materials and textures on unmount.
6. Budget: LCP < 1.2 s (canvas loaded after the content), 120 fps targeted on RTX 4070 at 4K, `renderer.info` monitored; models in glTF/GLB compressed with meshopt or Draco, KTX2 textures.
7. wgpu: no compilation on the PC; `cargo` on fr1 (`nice -n 19`) or in CI. Shared LLVM toolchain (skill `llvm-toolchain`).

## References (read on demand)

`references/` contains the upstream text (MIT license, `references/LICENSE`), without the React Three Fiber part:
`fundamentals`, `geometry`, `materials`, `lighting`, `textures`, `loaders`, `asset-pipeline`, `animation`, `interaction`, `shaders`, `postprocessing`, `performance`. Mentions of React or gltfjsx there are outside the stack: ignore them.

## Review

3D deliverable: capture via the chrome-devtools MCP (`performance_start_trace` for fps), then Gemini review (`mcp__relay__gemini_review`), verdict in `docs/reviews/`.
