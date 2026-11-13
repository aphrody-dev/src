// Real captures of our products for `ay brand build` (owner rule: site images come from the real
// products only). For every [[capture]] of brand.toml with an http(s) url, headless Chrome renders the
// live page at 1440 x 900 and writes:
//   captures/<id>.png    the still, after load + 2.5 s (fonts, WebGPU first frames)
//   captures/<id>.webm   with video = true: a 6 s smooth scroll-through, screencast frames muxed at
//                        their real timestamps to 30 fps, high-quality VP9 (crf 12): the master the
//                        build encodes to AV1 and VP9.
// Runs where Chrome and ffmpeg live (fr1): bun assets/brand/capture.ts [id...]
// Chrome is driven over the DevTools protocol with Bun's WebSocket; no third-party package.
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = import.meta.dir;
const CHROME = process.env.CHROME ?? "google-chrome";
const [W, H] = [1440, 900];
type Capture = { id: string; url: string; video?: boolean; file?: string };
const m = Bun.TOML.parse(await Bun.file(join(ROOT, "brand.toml")).text()) as {
  capture?: Capture[];
};
const only = new Set(process.argv.slice(2));
const list = (m.capture ?? []).filter(
  (c) =>
    !c.file && /^https?:/.test(c.url) && (only.size === 0 || only.has(c.id)),
);
mkdirSync(join(ROOT, "captures"), { recursive: true });

const profile = mkdtempSync(join(tmpdir(), "brand-capture-"));
const chrome = Bun.spawn(
  [
    CHROME,
    "--headless=new",
    "--remote-debugging-port=0",
    `--user-data-dir=${profile}`,
    `--window-size=${W},${H}`,
    "--hide-scrollbars",
    "--mute-audio",
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-extensions",
    "--enable-unsafe-webgpu",
    "--enable-features=Vulkan",
    "--force-color-profile=srgb",
    "about:blank",
  ],
  { stdout: "ignore", stderr: "ignore" },
);

async function devtoolsUrl(): Promise<string> {
  const f = join(profile, "DevToolsActivePort");
  for (let i = 0; i < 100; i++) {
    if (existsSync(f)) {
      const [port, path] = readFileSync(f, "utf8").trim().split("\n");
      if (port && path) return `ws://127.0.0.1:${port}${path}`;
    }
    await Bun.sleep(100);
  }
  throw new Error("Chrome did not start (DevToolsActivePort)");
}

const ws = new WebSocket(await devtoolsUrl());
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map<number, (v: any) => void>();
const listeners: ((msg: any) => void)[] = [];
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(String(e.data));
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)!(msg);
    pending.delete(msg.id);
  } else for (const l of listeners) l(msg);
});
function send(
  method: string,
  params: object = {},
  sessionId?: string,
): Promise<any> {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((resolve, reject) =>
    pending.set(id, (msg) =>
      msg.error
        ? reject(new Error(`${method}: ${msg.error.message}`))
        : resolve(msg.result),
    ),
  );
}

for (const c of list) {
  const { targetId } = await send("Target.createTarget", {
    url: "about:blank",
  });
  const { sessionId } = await send("Target.attachToTarget", {
    targetId,
    flatten: true,
  });
  const s = (method: string, params: object = {}) =>
    send(method, params, sessionId);
  await s("Page.enable");
  await s("Emulation.setDeviceMetricsOverride", {
    width: W,
    height: H,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await s("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: "dark" }],
  });
  const loaded = new Promise<void>((r) =>
    listeners.push(
      (msg) =>
        msg.sessionId === sessionId &&
        msg.method === "Page.loadEventFired" &&
        r(),
    ),
  );
  await s("Page.navigate", { url: c.url });
  await Promise.race([loaded, Bun.sleep(20000)]);
  await Bun.sleep(2500);
  const shot = await s("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  writeFileSync(
    join(ROOT, "captures", `${c.id}.png`),
    Buffer.from(shot.data, "base64"),
  );
  console.log(`capture ${c.id}.png`);

  if (c.video) {
    const dir = mkdtempSync(join(tmpdir(), `brand-frames-${c.id}-`));
    const frames: { file: string; t: number }[] = [];
    listeners.push((msg) => {
      if (msg.sessionId !== sessionId || msg.method !== "Page.screencastFrame")
        return;
      const file = join(dir, `f${String(frames.length).padStart(5, "0")}.png`);
      writeFileSync(file, Buffer.from(msg.params.data, "base64"));
      frames.push({ file, t: msg.params.metadata.timestamp });
      void s("Page.screencastFrameAck", { sessionId: msg.params.sessionId });
    });
    await s("Page.startScreencast", {
      format: "png",
      everyNthFrame: 1,
      maxWidth: W,
      maxHeight: H,
    });
    // Smooth scroll-through: ease down two thirds of the page over 4.5 s, then rest.
    await s("Runtime.evaluate", {
      expression: `(() => { const end = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, innerHeight * 2.4));
        const t0 = performance.now(); const step = (t) => { const k = Math.min(1, (t - t0) / 4500);
        scrollTo(0, end * (0.5 - Math.cos(Math.PI * k) / 2)); if (k < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); })()`,
    });
    await Bun.sleep(6000);
    await s("Page.stopScreencast");
    if (frames.length < 2)
      throw new Error(`${c.id}: ${frames.length} screencast frames`);
    // Concat list with each frame held until the next one's timestamp (real timing).
    const list = frames
      .map(
        (f, i) =>
          `file '${f.file}'\nduration ${Math.max(1 / 30, (frames[i + 1]?.t ?? f.t + 1.5) - f.t).toFixed(4)}`,
      )
      .join("\n");
    writeFileSync(
      join(dir, "list.txt"),
      `${list}\nfile '${frames.at(-1)!.file}'\n`,
    );
    const ff = Bun.spawnSync([
      "ffmpeg",
      "-v",
      "error",
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      join(dir, "list.txt"),
      "-vf",
      "fps=30,scale=1280:-2:flags=lanczos,format=yuv420p",
      "-c:v",
      "libvpx-vp9",
      "-crf",
      "12",
      "-b:v",
      "0",
      "-row-mt",
      "1",
      "-an",
      "-map_metadata",
      "-1",
      "-fflags",
      "+bitexact",
      join(ROOT, "captures", `${c.id}.webm`),
    ]);
    if (ff.exitCode !== 0)
      throw new Error(`${c.id}: ffmpeg ${ff.stderr.toString()}`);
    rmSync(dir, { recursive: true, force: true });
    console.log(`capture ${c.id}.webm (${frames.length} frames)`);
  }
  await send("Target.closeTarget", { targetId });
}

ws.close();
chrome.kill();
await chrome.exited;
rmSync(profile, { recursive: true, force: true });
