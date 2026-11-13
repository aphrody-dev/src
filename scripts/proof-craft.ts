// Live proof of the Craft Apps hosted at /craft/<id>: real Chrome with the local GPU (WebGPU adapter required),
// page opened with ?autostart=1, wait for the framed wasm app, screenshot, one interaction (mouse move, click and
// a key on the iframe centre), second screenshot. Per app: adapter, distinct colours and non-background share of each
// capture (decoded by Chrome itself), and whether the interaction changed the picture. The screenshots are what to look at.
//   bun scripts/proof-craft.ts [--base https://aphrody.com] [--ids photocraft,filmcraft] [--out docs/reviews/proof/craft] [--wait 45] [--chrome <path>]
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arg = (n: string, d: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : d;
};
const base = arg("base", "https://aphrody.com");
const out = arg("out", "docs/reviews/proof/craft");
const waitS = Number(arg("wait", "45"));
const ids = arg(
  "ids",
  "photocraft,filmcraft,soundcraft,craft-launcher,vectorcraft,lightcraft,designcraft,effectcraft,gridcraft,cadcraft,deckcraft,wordcraft,pdfcraft",
).split(",");
const chrome = [arg("chrome", ""), process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome"].find(
  (c): c is string => !!c && existsSync(c),
);
if (!chrome) throw new Error("no Chrome binary (set CHROME or --chrome)");

class Cdp {
  private id = 0;
  private pending = new Map<number, (v: any) => void>();
  constructor(private ws: WebSocket) {
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(String(e.data));
      if (m.id && this.pending.has(m.id)) {
        this.pending.get(m.id)!(m);
        this.pending.delete(m.id);
      }
    });
  }
  static async connect(url: string) {
    const ws = new WebSocket(url);
    await new Promise<void>((res, rej) => {
      ws.addEventListener("open", () => res());
      ws.addEventListener("error", () => rej(new Error("CDP websocket failed")));
    });
    return new Cdp(ws);
  }
  send(method: string, params: object = {}): Promise<any> {
    const id = ++this.id;
    return new Promise((res) => {
      this.pending.set(id, res);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async eval<T>(expression: string): Promise<T> {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? "eval failed");
    return r.result?.result?.value as T;
  }
  close() {
    this.ws.close();
  }
}

/** Decoded in Chrome: distinct colours (5-bit per channel) and share of pixels that differ from the most common one. */
const STATS = (b64: string) => `(async () => {
  const bin = atob(${JSON.stringify(b64)}); const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  const bmp = await createImageBitmap(new Blob([u], { type: "image/png" }));
  const c = new OffscreenCanvas(bmp.width, bmp.height); const g = c.getContext("2d"); g.drawImage(bmp, 0, 0);
  const d = g.getImageData(0, 0, bmp.width, bmp.height).data; const m = new Map();
  for (let i = 0; i < d.length; i += 4) { const k = (d[i] >> 3) << 10 | (d[i+1] >> 3) << 5 | (d[i+2] >> 3); m.set(k, (m.get(k) || 0) + 1); }
  let top = 0; for (const v of m.values()) top = Math.max(top, v);
  return { colours: m.size, nonDominantShare: Math.round((1 - top / (d.length / 4)) * 1000) / 1000 };
})()`;

mkdirSync(out, { recursive: true });
const port = 9700 + Math.floor(Math.random() * 200);
const profile = mkdtempSync(join(tmpdir(), "proof-craft-"));
const proc = Bun.spawn(
  [chrome, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--window-size=1440,900", "--no-first-run",
   "--no-default-browser-check", "--enable-unsafe-webgpu", "--ignore-gpu-blocklist", "--headless=new", "about:blank"],
  { stdout: "ignore", stderr: "ignore" },
);
const results: any[] = [];
try {
  let target: any = null;
  for (let i = 0; i < 50 && !target; i++) {
    await Bun.sleep(200);
    try {
      target = ((await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()) as any[]).find((t) => t.type === "page");
    } catch {}
  }
  if (!target) throw new Error("Chrome DevTools endpoint did not answer");
  const cdp = await Cdp.connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const shot = async (name: string) => {
    const r = await cdp.send("Page.captureScreenshot", { format: "png" });
    const data: string = r.result.data;
    writeFileSync(join(out, name), Buffer.from(data, "base64"));
    return { file: name, bytes: Math.round((data.length * 3) / 4), ...(await cdp.eval<any>(STATS(data))) };
  };
  for (const id of ids) {
    const url = `${base}/craft/${id}?autostart=1`;
    const row: any = { id, url };
    try {
      await cdp.send("Page.navigate", { url });
      let st: any = null;
      for (let i = 0; i < 40; i++) {
        await Bun.sleep(500);
        st = await cdp.eval<any>("window.__craft ?? null").catch(() => null);
        if (st && (st.launched || st.error)) break;
      }
      row.host = st;
      if (!st?.launched) {
        row.verdict = `not launched: ${st?.error ?? "window.__craft missing"}`;
        row.before = await shot(`${id}-error.png`);
        results.push(row);
        continue;
      }
      await Bun.sleep(waitS * 1000);
      row.title = await cdp.eval<string>("document.title");
      row.before = await shot(`${id}-1-loaded.png`);
      const cx = 720, cy = 500;
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x: cx, y: cy });
      await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x: cx, y: cy, button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: cx, y: cy, button: "left", clickCount: 1 });
      await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "a", text: "a" });
      await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "a" });
      await Bun.sleep(2500);
      row.after = await shot(`${id}-2-after-click.png`);
      row.drew = row.before.colours > 24 && row.before.nonDominantShare > 0.02;
      row.responded = row.after.bytes !== row.before.bytes || row.after.nonDominantShare !== row.before.nonDominantShare;
      row.verdict = row.drew ? (row.responded ? "drew and changed after interaction" : "drew, no change after interaction") : "blank or near-uniform";
    } catch (e) {
      row.verdict = `error: ${String(e)}`;
    }
    console.error(`${id}: ${row.verdict}`);
    results.push(row);
  }
  const ua = await cdp.eval<string>("navigator.userAgent");
  writeFileSync(join(out, "results.json"), JSON.stringify({ base, userAgent: ua, results }, null, 2));
  cdp.close();
} finally {
  proc.kill();
  await proc.exited.catch(() => {});
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
console.log(JSON.stringify(results.map((r) => ({ id: r.id, verdict: r.verdict, adapter: r.host?.adapter })), null, 1));
