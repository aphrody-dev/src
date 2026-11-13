// /os: the browser OS shell (launcher on the WebGPU stage, windows, apps). Texts come from packages/i18n
// (keys os.*, en fr zh-CN ja es); the catalog subset is embedded as JSON so the client needs no fetch.
import { catalogs } from "../../../../packages/i18n/src/index.ts";

export const OS_LOCALES = ["en", "fr", "zh-CN", "ja", "es"] as const;
export type OsLocale = (typeof OS_LOCALES)[number];

/** EmulatorJS (GPL-3.0) is fetched from its CDN only after a click; this is the single third-party origin. */
export const EMU_CDN = "https://cdn.emulatorjs.org";

/** CSP of /os: v86 and Ruffle need wasm; apps are same-origin; the emulator CDN and the game frame are the only extras. */
export const OS_CSP = [
  "default-src 'self'",
  `script-src 'self' 'wasm-unsafe-eval' ${EMU_CDN}`,
  `style-src 'self' 'unsafe-inline' ${EMU_CDN}`,
  `img-src 'self' data: blob: ${EMU_CDN} https://shared.akamai.steamstatic.com https://cdn1.epicgames.com https://cdn2.unrealengine.com`,
  "media-src 'self' blob:",
  `font-src 'self' data: ${EMU_CDN}`,
  "worker-src 'self' blob:",
  `connect-src 'self' blob: data: ${EMU_CDN}`,
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join("; ");

export const APPS = [
  "library",
  "store",
  "game",
  "linux",
  "flash",
  "emulator",
  "console",
  "settings",
] as const;
export type AppId = (typeof APPS)[number];

const ICONS: Record<AppId, string> = {
  library:
    '<path d="M4 5h4v14H4zM10 5h4v14h-4zM16.5 6.2l3.7-1 3 13.5-3.7 1z"/>',
  store:
    '<path d="M4 8l1.5-4h13L20 8v2a3 3 0 0 1-5 2 3 3 0 0 1-6 0 3 3 0 0 1-5-2zM5 14v6h14v-6"/>',
  game: '<path d="M7 8h10a4 4 0 0 1 4 4.5l-.7 4a2.5 2.5 0 0 1-4.3 1L15 16H9l-1 1.5a2.5 2.5 0 0 1-4.3-1l-.7-4A4 4 0 0 1 7 8zM8 10.5v3M6.5 12h3"/>',
  linux: '<path d="M4 5h16v11H4zM8 20h8M12 16v4M7 9l3 2-3 2M12 13h4"/>',
  flash: '<path d="M13 2L5 13h6l-1 9 8-12h-6z"/>',
  emulator: '<path d="M3 8h18v8H3zM7 10v4M5 12h4M16 11h.01M18.5 13h.01"/>',
  console: '<path d="M4 4h16v16H4zM4 9h16M8 13l2 2-2 2M12 17h4"/>',
  settings:
    '<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const prefix = (l: OsLocale) => (l === "en" ? "/os" : `/os/${l}`);

export const OS_CSS = `
:root{color-scheme:dark;--stage-bg:#10151c;--stage-tile:#17202b;--stage-accent:#7fd0ff;--stage-rule:#34414f;--fg:#e8edf3;--mut:#a9b6c4;--win:#141b24;--wall:none}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:#10151c;color:var(--fg);font:16px/1.5 "Atkinson Hyperlegible Next",system-ui,sans-serif}
:root.stage-on body{background:transparent}
body::before{content:"";position:fixed;inset:0;z-index:-2;background:var(--wall) center/cover;opacity:.55;filter:blur(2px)}
.skip{position:absolute;left:8px;top:-48px;background:#7fd0ff;color:#10151c;padding:8px 12px;border-radius:6px;z-index:99}.skip:focus{top:8px}
header.bar{display:flex;align-items:center;gap:12px;padding:max(14px,env(safe-area-inset-top)) max(24px,env(safe-area-inset-right)) 0 max(24px,env(safe-area-inset-left))}
header.bar img{width:44px;height:44px}
header.bar h1{margin:0;font-size:1.25rem}header.bar p{margin:0;color:var(--mut);font-size:.9rem}
#clock{margin-left:auto;color:var(--mut);font-variant-numeric:tabular-nums}
#home{padding:24px max(24px,env(safe-area-inset-right)) 96px max(24px,env(safe-area-inset-left));max-width:1180px;margin:0 auto}
#home h2{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.tiles{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr));list-style:none;margin:0;padding:0}
.l-card{min-height:156px;display:flex}
.l-card button{flex:1;display:flex;flex-direction:column;align-items:flex-start;justify-content:flex-end;gap:4px;padding:18px;border:0;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer;border-radius:6px}
.l-card button:focus-visible,:root[data-input=pad] .l-card button:focus{outline:2px solid #7fd0ff;outline-offset:3px}
.l-card svg{width:34px;height:34px;fill:none;stroke:#7fd0ff;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;margin-bottom:auto}
.l-card .ico{margin-bottom:auto}.l-card .t{font-size:1.2rem;font-weight:700}.l-card .d{color:var(--mut);font-size:.9rem}
:root:not(.stage-on) .l-card{background:#17202b;border:1px solid #34414f;border-radius:6px}
#hint{position:fixed;left:0;right:0;bottom:0;padding:10px 24px;color:var(--mut);font-size:.85rem;background:linear-gradient(transparent,rgb(16 21 28/.9));pointer-events:none}
#windows{position:fixed;inset:0;pointer-events:none;z-index:10}
.win{position:absolute;display:flex;flex-direction:column;pointer-events:auto;background:var(--win);border:1px solid var(--stage-rule);border-radius:10px;box-shadow:0 18px 60px rgb(0 0 0/.55);min-width:min(320px,100vw);min-height:200px;overflow:hidden}
.win.max{inset:0!important;width:auto!important;height:auto!important;border-radius:0}
.win:focus-within{border-color:#7fd0ff}
.win>header{display:flex;align-items:center;gap:8px;padding:6px 8px 6px 14px;background:#1a2430;cursor:grab;touch-action:none;user-select:none}
.win>header h2{margin:0;font-size:.95rem;flex:1;font-weight:700}
.win>header button{min-width:44px;min-height:36px;border:0;border-radius:6px;background:transparent;color:var(--fg);font:inherit;cursor:pointer}
.win>header button:hover,.win>header button:focus-visible{background:#2a3848;outline:2px solid #7fd0ff;outline-offset:-2px}
.win .body{flex:1;overflow:auto;padding:16px;min-height:0;position:relative}
.win .body.flush{padding:0;overflow:hidden}
.btn,.win button.b{min-height:44px;padding:0 16px;border:1px solid var(--stage-rule);border-radius:8px;background:#1d2835;color:var(--fg);font:inherit;cursor:pointer}
.btn:hover{background:#27364a}.btn:focus-visible,.win .item:focus-visible,.win input:focus-visible,.win select:focus-visible,.win a:focus-visible{outline:2px solid #7fd0ff;outline-offset:2px}
.btn.pri{background:#7fd0ff;color:#0b1118;border-color:#7fd0ff;font-weight:700}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:0 0 12px}
.list{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.list li{display:flex;align-items:center;gap:10px;padding:8px 12px;background:#1a2430;border-radius:8px}
.list .cover{border-radius:4px;object-fit:cover;flex:none}.list .ico{flex:none;border-radius:6px;object-fit:contain}.list .m{max-width:46%}
.list .n{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.list .m{color:var(--mut);font-size:.85rem}
.drop{border:2px dashed var(--stage-rule);border-radius:10px;padding:18px;text-align:center;color:var(--mut);margin-bottom:12px}
.drop.on{border-color:#7fd0ff;color:var(--fg)}
.win input[type=search],.win select{min-height:44px;padding:0 12px;border:1px solid var(--stage-rule);border-radius:8px;background:#0f151d;color:var(--fg);font:inherit}
.win iframe{border:0;width:100%;height:100%;background:#000;display:block}
.vmscreen{background:#000;display:flex;align-items:center;justify-content:center;height:100%}
.vmscreen canvas{max-width:100%;max-height:100%}
.vmscreen>div{color:#cfcfcf}
.walls{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}
.walls button{padding:0;border:2px solid transparent;border-radius:8px;overflow:hidden;background:none;cursor:pointer}
.walls button[aria-pressed=true]{border-color:#7fd0ff}.walls img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}
.note{color:var(--mut);font-size:.85rem;margin:8px 0}
.err{color:#ffb4a8}
table.kv{border-collapse:collapse;width:100%}table.kv td,table.kv th{padding:6px 8px;border-bottom:1px solid var(--stage-rule);text-align:left;font-size:.9rem}
.gs{padding:8px 14px;background:#141b24;border-bottom:1px solid var(--stage-rule);margin:0}.gs[hidden]{display:none}.gs-f{display:flex;gap:6px;align-items:center;font-size:.85rem;color:var(--mut)}.gs-f select{min-height:36px}.win>header>button:not([data-a]){min-width:auto;padding:0 12px;font-size:.85rem}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media (forced-colors:active){.win{border:2px solid CanvasText}}
`;

/** Apps that are a real product show that product's own icon (vendor favicons, owner mark for Aphrody Play). */
const REAL_ICON: Record<string, string> = {
  game: "/os/aphrody.svg",
  linux: "/os/ico/alpine.svg",
  flash: "/os/ico/ruffle.png",
  emulator: "/os/ico/emulatorjs.svg",
  console: "/os/ico/github.svg",
};

export function renderOs(root: string, locale: OsLocale, pet: string): string {
  const cat = catalogs[locale] as Record<string, string>;
  const sub: Record<string, string> = {};
  for (const [k, v] of Object.entries(catalogs.en as Record<string, string>))
    if (k.startsWith("os.")) sub[k] = cat[k] ?? v;
  const t = (k: string) => esc(sub[k] ?? k);
  const tiles = APPS.map(
    (a) =>
      `<li class="l-card"><button type="button" data-app="${a}">${REAL_ICON[a] ? `<img class="ico" src="${REAL_ICON[a]}" alt="" width="34" height="34">` : `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[a]}</svg>`}<span class="t">${t(`os.app.${a}`)}</span><span class="d">${t(`os.app.${a}.d`)}</span></button></li>`,
  ).join("");
  const alt = OS_LOCALES.map(
    (l) =>
      `<link rel="alternate" hreflang="${l}" href="https://aphrody.com${prefix(l)}">`,
  ).join("");
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${t("os.title")}</title>
<meta name="description" content="${t("os.tagline")}">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#10151c">
<link rel="canonical" href="https://aphrody.com${prefix(locale)}">${alt}
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/atkinson-next.woff2" as="font" type="font/woff2" crossorigin>
<style>@font-face{font-family:"Atkinson Hyperlegible Next";src:url(/atkinson-next.woff2) format("woff2");font-display:swap}${OS_CSS}</style>
</head>
<body>
<a class="skip" href="#home">${t("os.skip")}</a>
<header class="bar"><img src="/favicon.svg" alt="" width="44" height="44"><div><h1>${t("os.title")}</h1><p>${t("os.tagline")}</p></div><time id="clock"></time></header>
<main id="home"><h2>${t("os.apps")}</h2><ul class="tiles">${tiles}</ul></main>
<div id="windows"></div>
<p id="hint">${t("os.hint")}</p>
<script type="application/json" id="i18n">${JSON.stringify(sub).replace(/</g, "\\u003c")}</script>
<script type="module" src="/os/os.js"></script>
</body>
</html>
`;
}
