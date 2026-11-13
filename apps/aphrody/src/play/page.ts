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
:root{--stage-bg:#10151c;--stage-tile:#17202b;--stage-accent:#7fd0ff;--stage-rule:#34414f}
:root.stage-on,:root.stage-on body{background:#10151c}:root.stage-on body{background:transparent}
#launcher{position:fixed;inset:0;z-index:3;display:flex;flex-direction:column;justify-content:center;gap:28px;padding:max(24px,env(safe-area-inset-top)) max(24px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(24px,env(safe-area-inset-left));max-width:1100px;margin:0 auto;overflow:auto}
#launcher[hidden]{display:none}
#launcher:not([hidden]) ~ #msg{visibility:hidden}
#launcher h1{margin:0;font-size:clamp(2rem,1.2rem + 3vw,3.5rem);line-height:1.05;letter-spacing:-.01em}
#launcher .sub{margin:8px 0 0;color:#a9b6c4;max-width:46ch}
.l-row{display:grid;gap:16px;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr))}
.l-card{min-height:168px;display:flex}
.l-card button{flex:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:6px;padding:20px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:6px}
.l-card button:focus-visible{outline:2px solid #7fd0ff;outline-offset:3px}
:root[data-input=pad] .l-card button:focus{outline:2px solid #7fd0ff;outline-offset:3px}
.l-card .t{font-size:1.35rem;font-weight:700}.l-card .d{color:#a9b6c4;font-size:.95rem}.l-card .l-state{font-size:.85rem;font-weight:700;color:#7fd0ff}
.l-card:not(:has(button)){display:none}
:root:not(.stage-on) .l-card{background:#17202b;border:1px solid #34414f;border-radius:6px}
#l-panel{margin:0;max-width:60ch;color:#c7d2de;font-size:.95rem}#l-panel[hidden]{display:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<main id="launcher" aria-labelledby="l-title">
<div><h1 id="l-title">Aphrody Play</h1><p class="sub" id="l-sub">Open-world slice on Bevy. Arrow keys, WASD, a gamepad or the pointer move between cards.</p></div>
<div class="l-row">
<div class="l-card"><button id="l-start" type="button"><span class="t">Start</span><span class="d">Enter, click or gamepad A</span></button></div>
<div class="l-card"><button id="l-controls" type="button" aria-expanded="false" aria-controls="l-panel"><span class="t">Controls</span><span class="d">Keyboard, mouse, gamepad</span></button></div>
<div class="l-card"><button id="l-sound" type="button" aria-pressed="true" data-on="On" data-off="Off"><span class="t">Sound</span><span class="l-state">On</span></button></div>
</div>
<p id="l-panel" hidden>WASD or left stick: walk. Shift: run. Space or A: jump. T: speed up the day. Click to capture the mouse, Esc to release it.</p>
</main>
<canvas id="game" tabindex="0" aria-label="Aphrody Play"></canvas>
<div id="msg" role="status" aria-live="polite"><img src="/play/assets/ui/logo.svg" alt="" width="64" height="64"><p id="msg-text"></p></div>
<div id="hint" hidden></div>
<script type="module" src="/play/play.js"></script>
</body>
</html>
`;
}
