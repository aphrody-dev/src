// Frame-rate check of the browser game (docs/games/PARITY.md, check "fps"): drives Chrome over the
// DevTools protocol, loads /play, samples requestAnimationFrame intervals, prints median fps and
// the p95 frame time as one JSON line. Exit 0 = measured (and above --min-fps when given),
// 1 = measured but below target, 2 = not measured (no Chrome, no WebGPU, game did not start).
//
//   bun scripts/game-fps.ts [--url http://127.0.0.1:3000/play?autostart=1] [--seconds 20] [--warmup 8]
//                           [--width 1920] [--height 1080] [--min-fps 120] [--chrome <path>] [--headed]
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export interface FpsSummary {
  frames: number;
  medianFps: number;
  p95FrameMs: number;
  p99FrameMs: number;
  worstFrameMs: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1,
  );
  return sorted[Math.max(0, i)];
}

/** `frameMs`: durations between consecutive animation frames. Median fps = 1000 / median duration. */
export function summarize(frameMs: number[]): FpsSummary {
  const sorted = [...frameMs].sort((a, b) => a - b);
  const median = percentile(sorted, 50);
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    frames: frameMs.length,
    medianFps: median > 0 ? round(1000 / median) : 0,
    p95FrameMs: round(percentile(sorted, 95)),
    p99FrameMs: round(percentile(sorted, 99)),
    worstFrameMs: round(sorted.at(-1) ?? 0),
  };
}

function findChrome(explicit?: string): string | null {
  const candidates = [
    explicit,
    process.env.CHROME,
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ];
  return candidates.find((c): c is string => !!c && existsSync(c)) ?? null;
}

function arg(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

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
  static async connect(url: string): Promise<Cdp> {
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

const SAMPLER = (ms: number) => `new Promise((resolve) => {
  const out = [];
  let last = performance.now();
  const end = last + ${ms};
  const tick = (t) => {
    out.push(t - last);
    last = t;
    if (t < end) requestAnimationFrame(tick); else resolve(out.slice(1));
  };
  requestAnimationFrame(tick);
})`;

function notMeasured(reason: string): never {
  console.log(JSON.stringify({ measured: false, reason }));
  console.error(`not measured: ${reason}`);
  process.exit(2);
}

if (import.meta.main) {
  const url = arg("url", "http://127.0.0.1:3000/play?autostart=1");
  const seconds = Number(arg("seconds", "20"));
  const warmup = Number(arg("warmup", "8"));
  const width = arg("width", "1920");
  const height = arg("height", "1080");
  const minFps = Number(arg("min-fps", "0"));
  const headed = process.argv.includes("--headed");

  const chrome = findChrome(arg("chrome", ""));
  if (!chrome) notMeasured("no Chrome binary (set CHROME or --chrome)");
  const port = 9222 + Math.floor(Math.random() * 500);
  const profile = mkdtempSync(join(tmpdir(), "game-fps-"));
  const proc = Bun.spawn(
    [
      chrome!,
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      `--window-size=${width},${height}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--enable-unsafe-webgpu",
      "--ignore-gpu-blocklist",
      // Uncapped presentation: measures what the renderer can do, not the monitor refresh rate.
      "--disable-frame-rate-limit",
      "--disable-gpu-vsync",
      ...(headed ? [] : ["--headless=new"]),
      "about:blank",
    ],
    { stdout: "ignore", stderr: "ignore" },
  );
  let cdp: Cdp | null = null;
  try {
    let target: any = null;
    for (let i = 0; i < 50 && !target; i++) {
      await Bun.sleep(200);
      try {
        const list = (await (
          await fetch(`http://127.0.0.1:${port}/json/list`)
        ).json()) as any[];
        target = list.find((t) => t.type === "page");
      } catch {}
    }
    if (!target) notMeasured("Chrome DevTools endpoint did not answer");
    cdp = await Cdp.connect(target.webSocketDebuggerUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: Number(width),
      height: Number(height),
      deviceScaleFactor: 1,
      mobile: false,
    });
    await cdp.send("Page.navigate", { url });
    // The page sets window.__play = { gpu, started } (apps/aphrody/src/client/play.ts).
    let state: { gpu: boolean; started: boolean; error?: string } | null = null;
    for (let i = 0; i < 120; i++) {
      await Bun.sleep(500);
      state = await cdp
        .eval<typeof state>("window.__play ?? null")
        .catch(() => null);
      if (state && (!state.gpu || state.started || state.error)) break;
    }
    if (!state)
      notMeasured("page did not expose window.__play (is /play served?)");
    if (!state!.gpu)
      notMeasured("navigator.gpu has no adapter in this browser");
    if (state!.error) notMeasured(`game failed to start: ${state!.error}`);
    if (!state!.started) notMeasured("game did not start within 60 s");
    await Bun.sleep(warmup * 1000);
    const frames = await cdp.eval<number[]>(SAMPLER(seconds * 1000));
    const s = summarize(frames);
    const info = await cdp.eval<string>("navigator.userAgent");
    console.log(
      JSON.stringify({
        measured: true,
        url,
        width: Number(width),
        height: Number(height),
        seconds,
        userAgent: info,
        ...s,
      }),
    );
    console.error(
      `median ${s.medianFps} fps, p95 frame ${s.p95FrameMs} ms (${s.frames} frames)`,
    );
    process.exitCode = minFps > 0 && s.medianFps < minFps ? 1 : 0;
  } finally {
    cdp?.close();
    proc.kill();
    await proc.exited.catch(() => {});
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  }
}
