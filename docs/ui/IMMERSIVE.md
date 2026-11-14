# Immersive stage (apps/aphrody, home and /play)

Code: `apps/aphrody/src/immersive/` (stage.ts WebGPU renderer, shader.ts WGSL, motion.ts springs from the M3 duration tokens of `packages/design/tokens/tokens.css` via a Bun macro, nav.ts spatial navigation, sound.ts, play-launcher.ts, home-entry.ts). Textures and sounds come from `assets/library` only (aerial_grass_rock and aerial_rocks_02 diffuse, normal and roughness at 512 px WebP; ui rollover1 and click1 OGG).

The DOM stays the source of truth (links, buttons, focus, text). The canvas draws a lit plate, shadow and parallax particles at each item rectangle. Inputs: pointer, arrows and WASD, gamepad (d-pad, left stick, A, right stick for parallax). Fallbacks: no WebGPU, forced-colors, prefers-contrast, save-data, device loss: plain DOM. prefers-reduced-motion: static frames drawn on events only.

Measured 2026-11-13 on the workstation (Chrome 157, RTX 4070, 144 Hz display, viewport 1887x2044, dpr 1, local server):

- Frame rate, home cards and /play launcher: 144 fps, frame time p50 6.9 ms, p95 7.0 to 7.2 ms, max 7.3 ms (300 frames, vsync bound; GPU headroom not measured).
- Reduced motion: 0 frames while idle, 1 frame per input event.
- Navigation: ArrowRight/ArrowLeft and a mocked gamepad d-pad move focus between cards (checked in page); real gamepad hardware not tested.
- Lighthouse (desktop, local): home accessibility 100, SEO 100, best practices 92 (console errors from edge-only resources absent on the local server: image optimizer, insights.js, font CSP); /play accessibility 100, best practices 100, SEO 54 (intentional noindex).
- Home trace: LCP 198 ms, CLS 0.00.
- Screenshots: `apps/aphrody/public/shots/immersive-home.webp`, `immersive-play.webp`.

Not measured: mobile, 4K, GPU time per frame, other browsers, text contrast over the lit plate by pixel sampling (plate mix is capped at 18 percent of the texture), French copy of the launcher.
