// /gamescope: the gamescope console UI (crates/gamescope-web-wasm, wgpu/WGSL on WebGPU) in a full-window canvas.
// The wasm build lives on cdn.aphrody.com/gamescope/ (published by the fr1 build), not in the site deployment.
// ?shell=ps|switch selects the layout variant; the two buttons switch it at runtime.

/** CSP of /gamescope: wasm needs 'wasm-unsafe-eval'; scripts and the wasm module come from self and the first-party CDN. */
export const GAMESCOPE_CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdn.aphrody.com 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self' https://cdn.aphrody.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export const GAMESCOPE_PERMISSIONS = "microphone=(), camera=(), geolocation=(), gamepad=(self), fullscreen=(self)";

const STYLE = `
:root{color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#000;color:#f1dfdb;font:16px/1.4 system-ui,sans-serif;overflow:hidden}
body{display:flex;flex-direction:column}
header{display:flex;align-items:center;gap:14px;padding:6px 14px;background:#140c0b;border-bottom:1px solid #3d3230;min-height:48px}
header a{color:#ffb4a6;text-decoration:none;min-height:36px;display:inline-flex;align-items:center}
header span{color:#b5a29e;font-size:.9rem}
.shells{margin-left:auto;display:flex;gap:8px}
.shells button{min-height:36px;padding:0 16px;font:inherit;font-weight:600;border:1px solid #534340;border-radius:18px;background:#271d1c;color:#f1dfdb;cursor:pointer}
.shells button[aria-pressed=true]{background:#ffb4a6;color:#561e14;border-color:#ffb4a6}
.shells button:focus-visible{outline:2px solid #fff;outline-offset:2px}
main{flex:1;min-height:0;position:relative}
canvas{position:absolute;inset:0;width:100%;height:100%;display:block;background:#000;outline:none}
#msg{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;color:#ffb4a6;margin:0}
#msg:empty{display:none}
`;

export function renderGamescope(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Gamescope console UI | Aphrody</title>
<meta name="description" content="A console-style home screen written in Rust with wgpu and WGSL, running as WebAssembly on WebGPU.">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="dark">
<link rel="icon" href="/favicon.svg">
<style>${STYLE}</style>
</head>
<body>
<header>
<a href="/">Aphrody</a><span>Gamescope console UI. Arrow keys or gamepad to move, Enter to select, Esc to go back.</span>
<div class="shells" role="group" aria-label="Layout">
<button type="button" data-shell="ps" aria-pressed="true">Tab layout</button>
<button type="button" data-shell="switch" aria-pressed="false">Dock layout</button>
</div>
</header>
<main>
<canvas id="gs" tabindex="0" aria-label="Gamescope console UI"></canvas>
<p id="msg" role="status" aria-live="polite">Checking WebGPU.</p>
</main>
<script type="module" src="/gamescope/gamescope.js"></script>
</body>
</html>
`;
}
