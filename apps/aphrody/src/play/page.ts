// /play: full-screen canvas for the wasm game (crates/game). WebGPU is required: without it the page
// shows a message instead of a canvas that stays black. Texts come from packages/i18n (keys play.*), the page
// is server-rendered per locale: /play (en), /play/fr, /play/zh-CN, /play/ja, /play/es.
import { catalogs } from "../../../../packages/i18n/src/index.ts";

export const PLAY_LOCALES = ["en", "fr", "zh-CN", "ja", "es"] as const;
export type PlayLocale = (typeof PLAY_LOCALES)[number];
const playPath = (l: PlayLocale) => (l === "en" ? "/play" : `/play/${l}`);
const NATIVE: Record<PlayLocale, string> = { en: "English", fr: "Français", "zh-CN": "中文", ja: "日本語", es: "Español" };
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** CSP of /play only: the wasm module needs 'wasm-unsafe-eval'; no third party, no inline script. */
export const PLAY_CSP = [
  "default-src 'self'",
  "script-src 'self' https://cdn.aphrody.com 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://cdn.aphrody.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export function renderPlay(locale: PlayLocale = "en"): string {
  const en = catalogs.en as Record<string, string>;
  const cat = catalogs[locale] as Record<string, string>;
  const dict: Record<string, string> = {};
  for (const k of Object.keys(en)) if (k.startsWith("play.")) dict[k] = cat[k] ?? en[k]!;
  const t = (k: string) => esc(dict[k]!);
  const alt = PLAY_LOCALES.map(
    (l) => `<link rel="alternate" hreflang="${l}" href="https://aphrody.com${playPath(l)}">`,
  ).join("");
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Aphrody Play</title>
<meta name="description" content="${t("play.sub")}">
<meta name="robots" content="noindex">
<link rel="canonical" href="https://aphrody.com${playPath(locale)}">${alt}
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
.l-lang{display:flex;flex-wrap:wrap;gap:8px 16px}.l-lang a{color:#a9b6c4;min-height:44px;display:inline-flex;align-items:center;padding:0 4px;text-decoration:underline}.l-lang a[aria-current]{color:#7fd0ff;text-decoration:none;font-weight:700}.l-lang a:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}
#l-panel{margin:0;max-width:60ch;color:#c7d2de;font-size:.95rem}#l-panel[hidden]{display:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
</style>
</head>
<body>
<main id="launcher" aria-labelledby="l-title">
<div><h1 id="l-title">Aphrody Play</h1><p class="sub" id="l-sub">${t("play.sub")}</p></div>
<div class="l-row">
<div class="l-card"><button id="l-start" type="button"><span class="t">${t("play.start")}</span><span class="d">${t("play.start.d")}</span></button></div>
<div class="l-card"><button id="l-controls" type="button" aria-expanded="false" aria-controls="l-panel"><span class="t">${t("play.controls")}</span><span class="d">${t("play.controls.d")}</span></button></div>
<div class="l-card"><button id="l-sound" type="button" aria-pressed="true" data-on="${t("play.on")}" data-off="${t("play.off")}"><span class="t">${t("play.sound")}</span><span class="l-state">${t("play.on")}</span></button></div>
</div>
<p id="l-panel" hidden>${t("play.panel")}</p>
<nav class="l-lang" aria-label="Language">${PLAY_LOCALES.map((l) => `<a href="${playPath(l)}" hreflang="${l}" lang="${l}"${l === locale ? ' aria-current="page"' : ""}>${NATIVE[l]}</a>`).join("")}</nav>
</main>
<canvas id="game" tabindex="0" aria-label="Aphrody Play"></canvas>
<div id="msg" role="status" aria-live="polite"><img src="/play/assets/ui/logo.svg" alt="" width="64" height="64"><p id="msg-text"></p></div>
<div id="hint" hidden></div>
<script type="application/json" id="i18n">${JSON.stringify(dict).replace(/</g, "\u003c")}</script>
<script type="module" src="/play/play.js"></script>
</body>
</html>
`;
}
