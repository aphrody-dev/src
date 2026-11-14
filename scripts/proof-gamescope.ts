// Live proof of /gamescope: real Chrome with the local GPU (WebGPU adapter required) opens the page for each layout
// variant, screenshots the login screen, presses Enter with a real key event (profile picker to home), screenshots,
// presses ArrowRight (focus moves to the next tile) and screenshots again. The state JSON of the Rust UI is recorded
// before and after, so the focus move is checked from the source of truth and not only from pixels.
//   bun scripts/proof-gamescope.ts [--base https://aphrody.com] [--out docs/reviews/proof] [--chrome <path>]
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const arg = (n: string, d: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : d;
};
const base = arg("base", "https://aphrody.com");
const out = arg("out", "docs/reviews/proof");
const chrome = [
  arg("chrome", ""),
  process.env.CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
].find((c): c is string => !!c && existsSync(c));
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
      ws.addEventListener("error", () =>
        rej(new Error("CDP websocket failed")),
      );
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
    const r = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.result?.exceptionDetails)
      throw new Error(
        r.result.exceptionDetails.exception?.description ?? "eval failed",
      );
    return r.result?.result?.value as T;
  }
  close() {
    this.ws.close();
  }
}

mkdirSync(out, { recursive: true });
const port = 9900 + Math.floor(Math.random() * 90);
const profile = mkdtempSync(join(tmpdir(), "proof-gamescope-"));
const proc = Bun.spawn(
  [
    chrome,
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=1920,1128",
    "--no-first-run",
    "--no-default-browser-check",
    "--enable-unsafe-webgpu",
    "--ignore-gpu-blocklist",
    "--headless=new",
    "about:blank",
  ],
  { stdout: "ignore", stderr: "ignore" },
);
const rows: any[] = [];
try {
  let target: any = null;
  for (let i = 0; i < 50 && !target; i++) {
    await Bun.sleep(200);
    try {
      target = (
        (await (
          await fetch(`http://127.0.0.1:${port}/json/list`)
        ).json()) as any[]
      ).find((t) => t.type === "page");
    } catch {}
  }
  if (!target) throw new Error("Chrome DevTools endpoint did not answer");
  const cdp = await Cdp.connect(target.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1128,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const shot = async (name: string) => {
    const r = await cdp.send("Page.captureScreenshot", {
      format: "webp",
      quality: 90,
    });
    writeFileSync(join(out, name), Buffer.from(r.result.data, "base64"));
    return name;
  };
  const key = async (k: string, code: number) => {
    await cdp.send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: k,
      code: k,
      windowsVirtualKeyCode: code,
    });
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: k,
      code: k,
      windowsVirtualKeyCode: code,
    });
  };
  const state = async () =>
    JSON.parse(await cdp.eval<string>("window.__gamescope.state()"));
  for (const shell of ["ps", "switch"]) {
    const row: any = { shell, url: `${base}/gamescope?shell=${shell}` };
    try {
      await cdp.send("Page.navigate", { url: row.url });
      let st: any = null;
      for (let i = 0; i < 120; i++) {
        await Bun.sleep(500);
        st = await cdp
          .eval<any>(
            "window.__gamescope ? {ready: window.__gamescope.ready, error: window.__gamescope.error, adapter: window.__gamescope.adapter, frames: window.__gamescope.frames} : null",
          )
          .catch(() => null);
        if (st && (st.ready || st.error)) break;
      }
      row.host = st;
      if (!st?.ready) {
        row.verdict = `not ready: ${st?.error ?? "window.__gamescope missing"}`;
        row.shotError = await shot(`gamescope-${shell}-error.webp`);
        rows.push(row);
        continue;
      }
      await Bun.sleep(1500);
      row.login = {
        state: await state(),
        shot: await shot(`gamescope-${shell}-1-login.webp`),
      };
      await key("Enter", 13);
      await Bun.sleep(2500);
      row.homeBefore = {
        state: await state(),
        shot: await shot(`gamescope-${shell}-2-home.webp`),
      };
      await key("ArrowRight", 39);
      await Bun.sleep(1500);
      row.homeAfter = {
        state: await state(),
        shot: await shot(`gamescope-${shell}-3-after-right.webp`),
      };
      row.frames = (await cdp.eval<any>("window.__gamescope.frames")) as number;
      row.moved = row.homeBefore.state.focus !== row.homeAfter.state.focus;
      row.verdict = row.moved
        ? `focus ${row.homeBefore.state.label} -> ${row.homeAfter.state.label}`
        : "focus did not move";
    } catch (e) {
      row.verdict = `error: ${String(e)}`;
    }
    console.error(`${shell}: ${row.verdict}`);
    rows.push(row);
  }
  const ua = await cdp.eval<string>("navigator.userAgent");
  writeFileSync(
    join(out, "gamescope-results.json"),
    JSON.stringify({ base, userAgent: ua, rows }, null, 2),
  );
  cdp.close();
} finally {
  proc.kill();
  await proc.exited.catch(() => {});
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {}
}
console.log(
  JSON.stringify(
    rows.map((r) => ({
      shell: r.shell,
      verdict: r.verdict,
      adapter: r.host?.adapter,
      frames: r.frames,
    })),
    null,
    1,
  ),
);
