// /craft and /craft/<id>: host pages of the Craft Apps (wasm32 + WebGPU builds on cdn.aphrody.com/craft/<id>/).
// The app loads lazily, in an iframe, only after the visitor presses Launch (or ?autostart=1) and only when a
// WebGPU adapter exists: without one the page states why, it does not start an app that would fall back.
import { CRAFT_APPS, CRAFT_CDN, type CraftApp } from "./apps";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * CSP of /craft: the app runs in a cross-origin iframe from the first-party CDN. No COOP/COEP is sent: the
 * Craft builds do not use SharedArrayBuffer (upstream packaging/web/README.md), so isolation is not needed and
 * a COEP would require CORP on every CDN response.
 */
export const CRAFT_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://cdn.aphrody.com",
  "frame-src https://cdn.aphrody.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");
const CDN = '"https://cdn.aphrody.com"';
// Delegated to the CDN origin that hosts the framed app (allow= on the iframe alone is not enough).
export const CRAFT_PERMISSIONS = ["microphone", "gamepad", "fullscreen", "clipboard-read", "clipboard-write"]
  .map((f) => `${f}=(self ${CDN})`)
  .concat(["camera=()", "geolocation=()"])
  .join(", ");

const STYLE = `
:root{color-scheme:dark}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#0e141b;color:#e6edf5;font:16px/1.45 system-ui,sans-serif}
body{display:flex;flex-direction:column}
header{display:flex;align-items:center;gap:14px;padding:10px 16px;border-bottom:1px solid #263241;background:#131b24}
header img{width:40px;height:40px;border-radius:8px;object-fit:contain}
header h1{margin:0;font-size:1.15rem}
header p{margin:0;color:#a9b6c4;font-size:.9rem}
header a.home{margin-left:auto;color:#7fd0ff;min-height:44px;display:inline-flex;align-items:center;padding:0 8px}
main{flex:1;position:relative;min-height:0}
#frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
#panel{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}
#panel[hidden]{display:none}
#panel img{width:96px;height:96px;object-fit:contain}
#panel button{min-height:48px;padding:0 28px;font:inherit;font-weight:700;border:0;border-radius:8px;background:#7fd0ff;color:#06222f;cursor:pointer}
#panel button:focus-visible,a:focus-visible{outline:2px solid #fff;outline-offset:3px}
#msg{max-width:60ch;color:#ffb4a8}
#msg:empty{display:none}
ul.grid{list-style:none;margin:0;padding:24px;display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
ul.grid a{display:flex;gap:14px;align-items:center;padding:16px;border:1px solid #263241;border-radius:10px;background:#131b24;color:inherit;text-decoration:none;min-height:88px}
ul.grid a:hover,ul.grid a:focus-visible{border-color:#7fd0ff}
ul.grid img{width:48px;height:48px;object-fit:contain;flex:none}
ul.grid b{display:block}ul.grid span{color:#a9b6c4;font-size:.9rem}
`;

function shell(title: string, description: string, body: string, app?: CraftApp): string {
  const icon = app ? `${CRAFT_CDN}${app.id}/${app.icon}` : "/favicon.svg";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex">
<meta name="color-scheme" content="dark">
<link rel="icon" href="${esc(icon)}">
<style>${STYLE}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

export function renderCraftApp(app: CraftApp): string {
  const base = `${CRAFT_CDN}${app.id}/`;
  const body = `<header>
<img src="${base}${app.icon}" alt="" width="40" height="40">
<div><h1>${esc(app.name)}</h1><p>${esc(app.about)}</p></div>
<a class="home" href="/craft">All Craft Apps</a>
</header>
<main data-app="${app.id}" data-src="${base}">
<div id="panel">
<img src="${base}${app.icon}" alt="" width="96" height="96">
<button id="launch" type="button" disabled>Launch ${esc(app.name)}</button>
<p id="msg" role="status" aria-live="polite">Checking WebGPU.</p>
</div>
<iframe id="frame" title="${esc(app.name)}" hidden allow="fullscreen; clipboard-read; clipboard-write; gamepad; microphone; autoplay" referrerpolicy="no-referrer"></iframe>
</main>
<script type="module" src="/craft/craft.js"></script>`;
  return shell(`${app.name} | Aphrody`, app.about, body, app);
}

export function renderCraftIndex(): string {
  const items = CRAFT_APPS.map(
    (a) =>
      `<li><a href="/craft/${a.id}"><img src="${CRAFT_CDN}${a.id}/${a.icon}" alt="" width="48" height="48" loading="lazy"><div><b>${esc(a.name)}</b><span>${esc(a.about)}</span></div></a></li>`,
  ).join("\n");
  const body = `<header><div><h1>Craft Apps</h1><p>Open-source creative suite compiled to WebAssembly, running on WebGPU in the browser.</p></div><a class="home" href="/">Aphrody</a></header>
<main><ul class="grid">
${items}
</ul></main>`;
  return shell("Craft Apps | Aphrody", "Open-source creative suite running as WebAssembly on WebGPU.", body);
}
