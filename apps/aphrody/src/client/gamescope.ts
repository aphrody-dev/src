// Client of /gamescope: real WebGPU check, the glyph and icon atlas (browser font engine, vendor favicons), input
// (keyboard, Gamepad API, pointer) forwarded to the Rust UI, and the frame loop. window.__gamescope exposes the state
// for scripts/proof-gamescope.ts.
const CDN = "https://cdn.aphrody.com/gamescope/";
const ATLAS = 2048;
const CELL = 72;
const COLS = 14;
const PX = 52;
const ORIGIN_X = 10;
const BASELINE = 56;
const ICON_X0 = 1024;
const ICON = 128;
const ICON_COLS = 8;

interface Console {
  adapter(): string;
  set_atlas(rgba: Uint8Array, advances: Float32Array): void;
  resize(w: number, h: number): void;
  input(code: number): void;
  pointer(x: number, y: number, click: boolean): void;
  set_shell(code: number): void;
  set_clock(minutes: number): void;
  state(): string;
  render(dt: number): void;
}
interface Wasm {
  default(opts: unknown): Promise<unknown>;
  GamescopeConsole: {
    create(canvas: HTMLCanvasElement, shell: number): Promise<Console>;
    icon_sources(): string[];
  };
}
interface Proof {
  gpu: boolean;
  adapter?: string;
  ready: boolean;
  frames: number;
  error?: string;
  state: () => string;
  press: (code: number) => void;
}
const proof: Proof = { gpu: false, ready: false, frames: 0, state: () => "{}", press: () => {} };
(window as unknown as { __gamescope: Proof }).__gamescope = proof;

const msg = document.getElementById("msg")!;
const canvas = document.getElementById("gs") as HTMLCanvasElement;
const fail = (text: string) => {
  proof.error = text;
  msg.textContent = text;
};

type Ctx = CanvasRenderingContext2D;

/** Own UI icons, white on transparent, drawn in a 128px cell (tinted by the shader). */
function drawUi(g: Ctx, name: string): void {
  g.save();
  g.translate(64, 64);
  g.strokeStyle = "#fff";
  g.fillStyle = "#fff";
  g.lineWidth = 10;
  g.lineCap = "round";
  g.lineJoin = "round";
  const poly = (pts: number[][], close = true) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (close) g.closePath();
  };
  switch (name) {
    case "search":
      g.beginPath(); g.arc(-8, -8, 30, 0, Math.PI * 2); g.stroke();
      poly([[14, 14], [42, 42]], false); g.stroke();
      break;
    case "settings": {
      g.beginPath(); g.arc(0, 0, 18, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        poly([[Math.cos(a) * 30, Math.sin(a) * 30], [Math.cos(a) * 46, Math.sin(a) * 46]], false); g.stroke();
      }
      break;
    }
    case "more":
      for (const x of [-30, 0, 30]) { g.beginPath(); g.arc(x, 0, 8, 0, Math.PI * 2); g.fill(); }
      break;
    case "wishlist":
      g.beginPath();
      g.moveTo(0, 40);
      g.bezierCurveTo(-60, 0, -42, -44, -18, -40);
      g.bezierCurveTo(-8, -38, 0, -30, 0, -22);
      g.bezierCurveTo(0, -30, 8, -38, 18, -40);
      g.bezierCurveTo(42, -44, 60, 0, 0, 40);
      g.stroke();
      break;
    case "cart":
      poly([[-48, -36], [-30, -36], [-18, 18], [32, 18], [42, -20], [-26, -20]], false); g.stroke();
      for (const x of [-12, 26]) { g.beginPath(); g.arc(x, 40, 7, 0, Math.PI * 2); g.fill(); }
      break;
    case "power":
      g.beginPath(); g.arc(0, 4, 34, -Math.PI * 0.32, Math.PI * 1.32, false); g.stroke();
      poly([[0, -44], [0, -6]], false); g.stroke();
      break;
    case "plus":
      poly([[0, -40], [0, 40]], false); g.stroke();
      poly([[-40, 0], [40, 0]], false); g.stroke();
      break;
    case "user":
      g.beginPath(); g.arc(0, -16, 20, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(0, 52, 42, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      break;
    case "check":
      poly([[-36, 2], [-10, 28], [38, -26]], false); g.stroke();
      break;
    case "wifi":
      for (const r of [22, 40, 58]) { g.beginPath(); g.arc(0, 30, r, Math.PI * 1.25, Math.PI * 1.75); g.stroke(); }
      g.beginPath(); g.arc(0, 30, 6, 0, Math.PI * 2); g.fill();
      break;
    case "play":
      poly([[-26, -40], [-26, 40], [42, 0]]); g.fill();
      break;
    case "star": {
      const pts: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? 20 : 48, a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push([Math.cos(a) * r, Math.sin(a) * r + 4]);
      }
      poly(pts); g.fill();
      break;
    }
  }
  g.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error(`image failed: ${src}`));
    i.src = src;
  });
}

async function buildAtlas(sources: string[]): Promise<{ rgba: Uint8Array; advances: Float32Array }> {
  const font = new FontFace("Inter", "url(/gamescope/inter.woff2)", { weight: "100 900" });
  await font.load();
  document.fonts.add(font);
  const c = document.createElement("canvas");
  c.width = c.height = ATLAS;
  const g = c.getContext("2d", { willReadFrequently: true })!;
  g.font = `500 ${PX}px Inter, system-ui, sans-serif`;
  g.fillStyle = "#fff";
  g.textBaseline = "alphabetic";
  const advances = new Float32Array(224);
  for (let code = 32; code <= 255; code++) {
    const i = code - 32;
    const ch = String.fromCharCode(code);
    advances[i] = g.measureText(ch).width / PX;
    g.fillText(ch, (i % COLS) * CELL + ORIGIN_X, Math.floor(i / COLS) * CELL + BASELINE);
  }
  for (let slot = 0; slot < sources.length; slot++) {
    const [kind, name] = [sources[slot].slice(0, sources[slot].indexOf(":")), sources[slot].slice(sources[slot].indexOf(":") + 1)];
    const x = ICON_X0 + (slot % ICON_COLS) * ICON;
    const y = Math.floor(slot / ICON_COLS) * ICON;
    g.save();
    g.translate(x, y);
    g.beginPath();
    g.rect(0, 0, ICON, ICON);
    g.clip();
    if (kind === "ui") drawUi(g, name);
    else {
      try {
        const img = await loadImage(`/gamescope/art/${name}`);
        const s = Math.min(ICON / img.naturalWidth, ICON / img.naturalHeight) || 1;
        const w = (img.naturalWidth || ICON) * s, h = (img.naturalHeight || ICON) * s;
        g.imageSmoothingQuality = "high";
        g.drawImage(img, (ICON - w) / 2, (ICON - h) / 2, w, h);
      } catch (e) {
        console.warn(String(e));
      }
    }
    g.restore();
  }
  const data = g.getImageData(0, 0, ATLAS, ATLAS).data;
  return { rgba: new Uint8Array(data.buffer, data.byteOffset, data.byteLength), advances };
}

async function main() {
  const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<{ info?: Record<string, string> } | null> } }).gpu;
  if (!gpu) return fail("This browser has no WebGPU (navigator.gpu is undefined). Use a recent Chrome, Edge or Safari with a supported GPU, over HTTPS.");
  let adapter;
  try {
    adapter = await gpu.requestAdapter();
  } catch (e) {
    return fail(`WebGPU failed to initialise: ${String(e)}`);
  }
  if (!adapter) return fail("WebGPU is present but the browser found no GPU adapter (requestAdapter returned null). Check the GPU driver and chrome://gpu.");
  proof.gpu = true;
  const i = adapter.info;
  proof.adapter = [i?.vendor, i?.architecture, i?.description].filter(Boolean).join(" ");

  const params = new URLSearchParams(location.search);
  let shell = params.get("shell") === "switch" ? 1 : 0;
  const buttons = [...document.querySelectorAll<HTMLButtonElement>(".shells button")];
  const mark = () => buttons.forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.shell === "switch" ? 1 : 0) === shell)));
  mark();

  const size = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
  };
  size();

  let wasm: Wasm;
  try {
    wasm = (await import(/* @vite-ignore */ CDN + "gamescope.js")) as Wasm;
    await wasm.default({ module_or_path: CDN + "gamescope_bg.wasm" });
  } catch (e) {
    return fail(`The gamescope wasm build could not be loaded from ${CDN}: ${String(e)}`);
  }
  let ui: Console;
  try {
    ui = await wasm.GamescopeConsole.create(canvas, shell);
  } catch (e) {
    return fail(`WebGPU console failed to start: ${String(e)}`);
  }
  try {
    const atlas = await buildAtlas(wasm.GamescopeConsole.icon_sources());
    ui.set_atlas(atlas.rgba, atlas.advances);
  } catch (e) {
    return fail(`Atlas failed: ${String(e)}`);
  }
  proof.adapter = ui.adapter();
  const clock = () => {
    const d = new Date();
    ui.set_clock(d.getHours() * 60 + d.getMinutes());
  };
  clock();
  setInterval(clock, 30000);
  proof.state = () => ui.state();
  proof.press = (code) => ui.input(code);
  msg.textContent = "";

  new ResizeObserver(() => {
    size();
    ui.resize(canvas.width, canvas.height);
  }).observe(canvas);

  const setShell = (s: number) => {
    shell = s;
    ui.set_shell(s);
    mark();
    const u = new URL(location.href);
    u.searchParams.set("shell", s ? "switch" : "ps");
    history.replaceState(null, "", u);
  };
  buttons.forEach((b) => b.addEventListener("click", () => { setShell(b.dataset.shell === "switch" ? 1 : 0); canvas.focus(); }));

  const KEYS: Record<string, number> = {
    ArrowUp: 0, ArrowDown: 1, ArrowLeft: 2, ArrowRight: 3, Enter: 4, " ": 4, Escape: 5, Backspace: 5,
    q: 6, PageUp: 6, e: 7, PageDown: 7, Tab: 8, o: 8,
  };
  window.addEventListener("keydown", (ev) => {
    if ((ev.target as HTMLElement)?.tagName === "BUTTON" && (ev.key === "Enter" || ev.key === " ")) return;
    const code = KEYS[ev.key];
    if (code === undefined || ev.ctrlKey || ev.altKey || ev.metaKey) return;
    ev.preventDefault();
    ui.input(code);
  });
  const toCanvas = (ev: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    return [((ev.clientX - r.left) * canvas.width) / r.width, ((ev.clientY - r.top) * canvas.height) / r.height] as const;
  };
  canvas.addEventListener("pointermove", (ev) => ui.pointer(...toCanvas(ev), false));
  canvas.addEventListener("pointerdown", (ev) => { canvas.focus(); ui.pointer(...toCanvas(ev), true); });
  canvas.focus();

  // Gamepad API: d-pad, left stick, A select, B back, Y options, L1 and R1 tabs; held directions repeat.
  const held = new Map<number, number>();
  const pollPad = (now: number) => {
    for (const pad of navigator.getGamepads?.() ?? []) {
      if (!pad) continue;
      const b = (n: number) => !!pad.buttons[n]?.pressed;
      const ax = pad.axes[0] ?? 0, ay = pad.axes[1] ?? 0;
      const want: [number, boolean][] = [
        [0, b(12) || ay < -0.6], [1, b(13) || ay > 0.6], [2, b(14) || ax < -0.6], [3, b(15) || ax > 0.6],
        [4, b(0)], [5, b(1)], [6, b(4)], [7, b(5)], [8, b(3)],
      ];
      for (const [code, down] of want) {
        const key = pad.index * 16 + code;
        if (!down) { held.delete(key); continue; }
        const next = held.get(key);
        if (next === undefined) { held.set(key, now + 380); ui.input(code); }
        else if (code < 4 && now >= next) { held.set(key, now + 120); ui.input(code); }
      }
    }
  };

  proof.ready = true;
  let last = performance.now();
  const frame = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    pollPad(now);
    try {
      ui.render(dt);
      proof.frames++;
    } catch (e) {
      fail(`Render failed: ${String(e)}`);
      return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

await main();

export {};
