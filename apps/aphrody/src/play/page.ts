// /play: full-screen canvas for the wasm game (crates/game). WebGPU is required: without it the page
// shows a message instead of a canvas that stays black. Texts in fr and en by browser language.

/** CSP of /play only: the wasm module needs 'wasm-unsafe-eval'; no third party, no inline script. */
export const PLAY_CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export function renderPlay(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Aphrody Play</title>
<meta name="robots" content="noindex">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#10151c">
<link rel="icon" href="/play/assets/ui/logo.svg" type="image/svg+xml">
<style>
html,body{margin:0;height:100%;background:#10151c;color:#e8edf3;font:16px/1.5 system-ui,sans-serif;overflow:hidden}
#game{display:block;width:100vw;height:100vh;height:100dvh;outline:none;touch-action:none}
#msg{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
#msg[hidden]{display:none}
#msg img{width:64px;height:64px}
#msg p{max-width:36rem;margin:0}
#hint{position:fixed;left:16px;bottom:16px;max-width:calc(100vw - 32px);padding:8px 12px;border-radius:8px;background:rgb(16 21 28 / .72);font-size:14px;pointer-events:none;transition:opacity .6s}
#hint.gone{opacity:0}
</style>
</head>
<body>
<canvas id="game" tabindex="0" aria-label="Aphrody Play"></canvas>
<div id="msg" role="status" aria-live="polite"><img src="/play/assets/ui/logo.svg" alt="" width="64" height="64"><p id="msg-text"></p></div>
<div id="hint" hidden></div>
<script type="module" src="/play/play.js"></script>
</body>
</html>
`;
}
