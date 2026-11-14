// Locale x viewport proof of aphrody.com pages in real Chrome over CDP: for every page and locale at 1440,
// 820 and 390 px it takes a webp screenshot, measures horizontal overflow, scans the visible text for raw
// i18n keys, reads the canonical and hreflang links and the platform font used by the h1 (CJK check).
//   bun scripts/proof-matrix.ts [--base https://aphrody.com] [--out docs/reviews/proof]
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arg = (n: string, d: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i > 0 ? process.argv[i + 1]! : d;
};
const base = arg("base", "https://aphrody.com");
const out = arg("out", "docs/reviews/proof");
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const LOCS = ["en", "fr", "zh-CN", "ja", "es"];
const WIDTHS: Array<[string, number, number]> = [
  ["desktop", 1440, 900],
  ["tablet", 820, 1180],
  ["mobile", 390, 844],
];
const pathOf = (b: string, l: string) =>
  b === "/" ? (l === "fr" ? "/" : `/${l}`) : l === "en" ? b : `${b}/${l}`;

mkdirSync(out, { recursive: true });
const dir = mkdtempSync(join(tmpdir(), "proof-"));
const port = 9400 + Math.floor(Math.random() * 300);
const proc = Bun.spawn(
  [
    chrome,
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    "--no-first-run",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdout: "ignore", stderr: "ignore" },
);
let list: any[] = [];
for (let i = 0; i < 50 && !list.length; i++) {
  await Bun.sleep(200);
  try {
    list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  } catch {}
}
const ws = new WebSocket(
  list.find((t) => t.type === "page").webSocketDebuggerUrl,
);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map<number, (v: any) => void>();
ws.onmessage = (e) => {
  const m = JSON.parse(String(e.data));
  if (m.id && pending.has(m.id)) pending.get(m.id)!(m);
};
const send = (method: string, params: object = {}) =>
  new Promise<any>((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
await send("Page.enable");
await send("DOM.enable");
await send("CSS.enable");

const rows: any[] = [];
for (const [bp, label] of [
  ["/", "home"],
  ["/play", "play"],
  ["/os", "os"],
] as const)
  for (const l of LOCS)
    for (const [dev, w, h] of WIDTHS) {
      await send("Emulation.setDeviceMetricsOverride", {
        width: w,
        height: h,
        deviceScaleFactor: 1,
        mobile: dev === "mobile",
      });
      await send("Page.navigate", { url: base + pathOf(bp, l) });
      await Bun.sleep(3500);
      const ev = await send("Runtime.evaluate", {
        returnByValue: true,
        expression: `(()=>{const e=document.documentElement,t=document.body.innerText;
          const raw=(t.match(/\\b(home|os|play|nav|action|status)\\.[a-z][a-z0-9]*(\\.[a-z0-9]+)*\\b/g)||[]).filter(x=>!/\\.(com|app|exe|js|fr)$/.test(x));
          return {lang:e.lang,over:Math.max(e.scrollWidth,document.body.scrollWidth)-innerWidth,raw,
            canon:document.querySelector('link[rel=canonical]')?.href||null,
            hl:[...document.querySelectorAll('link[rel=alternate][hreflang]')].map(a=>a.hreflang),
            h1:(document.querySelector('h1')?.innerText||'').slice(0,50),len:t.length}})()`,
      });
      const v = ev.result.result.value;
      let font = "";
      try {
        const doc = await send("DOM.getDocument", { depth: 0 });
        const q = await send("DOM.querySelector", {
          nodeId: doc.result.root.nodeId,
          selector: "h1",
        });
        if (q.result.nodeId) {
          const f = await send("CSS.getPlatformFontsForNode", {
            nodeId: q.result.nodeId,
          });
          font = (f.result.fonts || []).map((x: any) => x.familyName).join("+");
        }
      } catch {}
      const file = `${label}-${l}-${w}.webp`;
      const shot = await send("Page.captureScreenshot", {
        format: "webp",
        quality: 30,
      });
      writeFileSync(join(out, file), Buffer.from(shot.result.data, "base64"));
      rows.push({ page: label, locale: l, width: w, file, font, ...v });
      console.log(
        JSON.stringify({
          page: label,
          l,
          w,
          lang: v.lang,
          over: v.over,
          raw: v.raw.length,
          hl: v.hl.length,
          font,
        }),
      );
    }
writeFileSync(join(out, "matrix.json"), JSON.stringify(rows, null, 1));
ws.close();
proc.kill();
try {
  rmSync(dir, { recursive: true, force: true });
} catch {}
