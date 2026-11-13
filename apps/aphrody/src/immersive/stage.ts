// Stage: WebGPU canvas behind real DOM items. The DOM stays the source of truth (links, buttons, focus,
// screen readers, text); the canvas draws depth, light and motion at each item's rectangle.
// Inputs: pointer, keyboard (arrows, WASD) and gamepad (d-pad, left stick, A, right stick = parallax).
// Fallbacks: no WebGPU, device loss, forced-colors, prefers-contrast, save-data -> nothing is drawn and
// the page is the plain DOM. prefers-reduced-motion -> static frames on events, no parallax or drift.
import { WGSL } from "./shader.ts";
import { Spring, dur } from "./motion.ts";
import { pickNext, stickDir, type Box, type Dir } from "./nav.ts";

export interface StageOptions {
  items: HTMLElement[];
  /** Base URL of the texture set (diff, nor, rough webp per material). */
  assetBase: string;
  materials: string[];
  /** Called on focus change and activation (sound hooks). */
  onFocus?: (el: HTMLElement) => void;
  onActivate?: (el: HTMLElement) => void;
  /** When it returns false the stage ignores keyboard and gamepad navigation (a window owns the input). */
  active?: () => boolean;
}

export interface StageStats {
  frames: number;
  dts: number[];
  gpu: string;
  mode: "motion" | "static";
  input: "ptr" | "kbd" | "pad";
}

export interface StageHandle {
  stats: StageStats;
  destroy(): void;
}

const MAX_TILT = 0.06;
const FOCUSABLE = 'a[href],button,md-outlined-button,md-filled-button,md-text-button,[tabindex]:not([tabindex="-1"])';
/** The element that takes focus for an item: the item itself or its first focusable descendant. */
const targetOf = (el: HTMLElement): HTMLElement | null => (el.matches(FOCUSABLE) ? el : el.querySelector<HTMLElement>(FOCUSABLE));
/** Activates a target; Material Web link buttons keep their anchor in a shadow root. */
const activate = (t: HTMLElement) => (t.shadowRoot?.querySelector<HTMLElement>("a,button") ?? t).click();
const PARTICLES = 40;

export function stageSupported(): { ok: boolean; why?: string } {
  const mq = (q: string) => matchMedia(q).matches;
  if (!navigator.gpu) return { ok: false, why: "no webgpu" };
  if (mq("(forced-colors: active)")) return { ok: false, why: "forced-colors" };
  if (mq("(prefers-contrast: more)")) return { ok: false, why: "prefers-contrast" };
  if ((navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData) return { ok: false, why: "save-data" };
  return { ok: true };
}

const cssColor = (name: string, fallback: string): [number, number, number] => {
  const probe = document.createElement("span");
  probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  document.body.appendChild(probe);
  const m = getComputedStyle(probe).color.match(/[\d.]+/g)!.map(Number);
  probe.remove();
  return [m[0]! / 255, m[1]! / 255, m[2]! / 255];
};

async function loadLayer(device: GPUDevice, tex: GPUTexture, url: string, layer: number) {
  const blob = await (await fetch(url)).blob();
  const bmp = await createImageBitmap(blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
  device.queue.copyExternalImageToTexture({ source: bmp }, { texture: tex, origin: [0, 0, layer] }, [512, 512]);
  bmp.close();
}

interface ItemState {
  el: HTMLElement;
  focus: Spring;
  hover: Spring;
  press: Spring;
  tx: Spring;
  ty: Spring;
  z: Spring;
  enter: Spring;
  box: Box;
}

export async function startStage(o: StageOptions): Promise<StageHandle | null> {
  if (!stageSupported().ok || !o.items.length) return null;
  const adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" }).catch(() => null);
  if (!adapter) return null;
  const device = await adapter.requestDevice().catch(() => null);
  if (!device) return null;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.className = "stage-canvas";
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", zIndex: "-1", pointerEvents: "none" });
  document.body.prepend(canvas);
  const ctx = canvas.getContext("webgpu")!;
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: "premultiplied" });

  const mats = o.materials.length;
  const mk = (fmt: GPUTextureFormat) =>
    device.createTexture({ size: [512, 512, mats], format: fmt, usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT });
  const albedo = mk("rgba8unorm-srgb");
  const normal = mk("rgba8unorm");
  const rough = mk("rgba8unorm");
  await Promise.all(
    o.materials.flatMap((m, i) => [
      loadLayer(device, albedo, `${o.assetBase}/${m}_diff.webp`, i),
      loadLayer(device, normal, `${o.assetBase}/${m}_nor.webp`, i),
      loadLayer(device, rough, `${o.assetBase}/${m}_rough.webp`, i),
    ]),
  );

  const module = device.createShaderModule({ code: WGSL });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs" },
    fragment: {
      module,
      entryPoint: "fs",
      targets: [
        {
          format,
          blend: {
            color: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
          },
        },
      ],
    },
    primitive: { topology: "triangle-list" },
  });

  const n = o.items.length;
  const count = 1 + PARTICLES + 2 * n;
  const itemData = new Float32Array(count * 16);
  const itemBuf = device.createBuffer({ size: itemData.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const uni = new Float32Array(28);
  const uniBuf = device.createBuffer({ size: uni.byteLength, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const bind = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniBuf } },
      { binding: 1, resource: { buffer: itemBuf } },
      { binding: 2, resource: device.createSampler({ magFilter: "linear", minFilter: "linear", addressModeU: "repeat", addressModeV: "repeat" }) },
      { binding: 3, resource: albedo.createView({ dimension: "2d-array" }) },
      { binding: 4, resource: normal.createView({ dimension: "2d-array" }) },
      { binding: 5, resource: rough.createView({ dimension: "2d-array" }) },
    ],
  });

  // Palette from the page tokens (--stage-* when the page defines them, else its own variables).
  const pick = (a: string, b: string, f: string) => cssColor(getComputedStyle(document.documentElement).getPropertyValue(a) ? a : b, f);
  const bg = pick("--stage-bg", "--paper", "#151B21");
  const tile = pick("--stage-tile", "--tile", "#1C242C");
  const accent = pick("--stage-accent", "--active", "#3FC1B9");
  const rule = pick("--stage-rule", "--rule", "#647381");

  const tShort = dur("short4");
  const tMed = dur("medium1");
  const states: ItemState[] = o.items.map((el, i) => {
    const s = (x = 0, t = 0, sec = tMed) => new Spring(x, t, sec);
    const st: ItemState = {
      el,
      focus: s(),
      hover: s(),
      press: s(0, 0, tShort),
      tx: s(),
      ty: s(),
      z: s(0, 0, tMed),
      enter: s(0, 1, dur("long2") + i * 0.06),
      box: { x: 0, y: 0, w: 0, h: 0 },
    };
    if (reduced) st.enter.snap(1);
    el.classList.add("stage-item");
    return st;
  });

  const seeds = Array.from({ length: PARTICLES }, (_, i) => {
    const r = (k: number) => ((Math.sin(i * 127.1 + k * 311.7) * 43758.5453) % 1 + 1) % 1;
    return { x: r(1), y: r(2), size: 2 + r(3) * 5, speed: 0.08 + r(4) * 0.22, alpha: 0.10 + r(5) * 0.22, par: 0.4 + r(6) * 1.8, z: -200 + r(7) * 500 };
  });

  const stats: StageStats = { frames: 0, dts: [], gpu: adapter.info?.description || adapter.info?.vendor || "unknown", mode: reduced ? "static" : "motion", input: "ptr" };
  let ptr = { x: innerWidth * 0.5, y: innerHeight * 0.3 };
  let ptrActive = false;
  let par = { x: 0, y: 0, tx: 0, ty: 0 };
  let hoverIdx = -1;
  let dead = false;
  let raf = 0;
  let last = performance.now();
  let dirty = true;
  const root = document.documentElement;
  const setInput = (m: StageStats["input"]) => {
    stats.input = m;
    root.dataset.input = m;
  };
  setInput("ptr");

  const focusedIdx = () => states.findIndex((s) => s.el === document.activeElement || s.el.contains(document.activeElement));
  const nav = states.map((_, i) => i).filter((i) => targetOf(states[i]!.el));
  const focusItem = (i: number, vis = true) => {
    const t = states[i] && targetOf(states[i]!.el);
    if (!t) return;
    t.focus({ preventScroll: false, focusVisible: vis } as FocusOptions);
    t.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    o.onFocus?.(states[i]!.el);
  };
  const move = (dir: Dir) => {
    const cur = focusedIdx();
    const from = cur < 0 ? hoverIdx : cur;
    const k = pickNext(nav.map((i) => states[i]!.box), nav.indexOf(from), dir);
    if (k >= 0) focusItem(nav[k]!);
    return k >= 0;
  };

  const onPointerMove = (e: PointerEvent) => {
    ptr = { x: e.clientX, y: e.clientY };
    ptrActive = true;
    if (stats.input !== "ptr") setInput("ptr");
    par.tx = -((e.clientX / innerWidth) * 2 - 1) * 16;
    par.ty = -((e.clientY / innerHeight) * 2 - 1) * 12;
    dirty = true;
  };
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, Dir> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down", a: "left", d: "right", w: "up", s: "down" };
    const dir = map[e.key];
    if (e.key === "Tab" || dir) setInput("kbd");
    if (!dir || e.ctrlKey || e.metaKey || e.altKey || o.active?.() === false) return;
    const t = e.target as HTMLElement;
    if (t.matches?.("input,textarea,select,[contenteditable]")) return;
    if (focusedIdx() < 0 && hoverIdx < 0) {
      focusItem(nav[0] ?? 0);
      e.preventDefault();
    } else if (move(dir)) e.preventDefault();
    dirty = true;
  };
  const enterHandlers = states.map((s, i) => {
    const enter = () => ((hoverIdx = i), (dirty = true));
    const leave = () => {
      if (hoverIdx === i) hoverIdx = -1;
      dirty = true;
    };
    const down = () => ((s.press.target = 1), (dirty = true));
    const up = () => ((s.press.target = 0), (dirty = true));
    const click = () => o.onActivate?.(s.el);
    const foc = () => (o.onFocus?.(s.el), (dirty = true));
    s.el.addEventListener("pointerenter", enter);
    s.el.addEventListener("pointerleave", leave);
    s.el.addEventListener("pointerdown", down);
    s.el.addEventListener("pointerup", up);
    s.el.addEventListener("pointercancel", up);
    s.el.addEventListener("click", click);
    s.el.addEventListener("focus", foc);
    s.el.addEventListener("blur", () => (dirty = true));
    return () => {
      s.el.removeEventListener("pointerenter", enter);
      s.el.removeEventListener("pointerleave", leave);
      s.el.removeEventListener("pointerdown", down);
      s.el.removeEventListener("pointerup", up);
      s.el.removeEventListener("pointercancel", up);
      s.el.removeEventListener("click", click);
      s.el.removeEventListener("focus", foc);
    };
  });
  const onResize = () => {
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    dirty = true;
  };
  const onScroll = () => (dirty = true);
  addEventListener("pointermove", onPointerMove, { passive: true });
  addEventListener("keydown", onKey);
  addEventListener("resize", onResize);
  addEventListener("scroll", onScroll, { passive: true });
  onResize();

  // Gamepad: edge-triggered navigation with repeat, right stick drives parallax, A activates.
  let padHeld: Dir | null = null;
  let padNext = 0;
  let aWas = false;
  const pollPad = (now: number) => {
    if (o.active?.() === false) return;
    const gp = [...(navigator.getGamepads?.() ?? [])].find((g) => g?.connected);
    if (!gp) return;
    const ax = gp.axes;
    const bt = gp.buttons;
    let dir = stickDir(ax[0] ?? 0, ax[1] ?? 0);
    if (bt[14]?.pressed) dir = "left";
    else if (bt[15]?.pressed) dir = "right";
    else if (bt[12]?.pressed) dir = "up";
    else if (bt[13]?.pressed) dir = "down";
    if (dir) {
      if (stats.input !== "pad") setInput("pad");
      if (dir !== padHeld || now >= padNext) {
        if (focusedIdx() < 0 && hoverIdx < 0) focusItem(nav[0] ?? 0);
        else if (move(dir)) gp.vibrationActuator?.playEffect?.("dual-rumble", { duration: 18, strongMagnitude: 0.15, weakMagnitude: 0.1 }).catch?.(() => {});
        padNext = now + (dir === padHeld ? 140 : 320);
        padHeld = dir;
      }
    } else padHeld = null;
    const a = !!bt[0]?.pressed;
    if (a && !aWas) {
      const i = focusedIdx();
      if (i >= 0) {
        states[i]!.press.target = 1;
        const t = targetOf(states[i]!.el);
        if (t) activate(t);
      }
    }
    if (!a && aWas) states.forEach((s) => (s.press.target = 0));
    aWas = a;
    const rx = ax[2] ?? 0;
    const ry = ax[3] ?? 0;
    if (Math.hypot(rx, ry) > 0.15) {
      par.tx = -rx * 16;
      par.ty = -ry * 12;
    }
  };

  const frame = (now: number) => {
    if (dead) return;
    const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
    last = now;
    stats.frames++;
    if (stats.dts.length < 1200) stats.dts.push(dt * 1000);
    if (!reduced || dirty) pollPad(now);

    let moving = false;
    const fi = focusedIdx();
    states.forEach((s, i) => {
      const r = s.el.getBoundingClientRect();
      s.box = { x: r.x, y: r.y, w: r.width, h: r.height };
      s.focus.target = i === fi ? 1 : 0;
      s.hover.target = i === hoverIdx && stats.input === "ptr" ? 1 : 0;
      const lit = i === hoverIdx || i === fi;
      s.z.target = lit ? 36 : 0;
      if (i === hoverIdx && ptrActive && !reduced) {
        s.tx.target = ((ptr.y - (r.y + r.height / 2)) / Math.max(r.height, 1)) * -MAX_TILT * 2;
        s.ty.target = ((ptr.x - (r.x + r.width / 2)) / Math.max(r.width, 1)) * MAX_TILT * 2;
      } else {
        s.tx.target = 0;
        s.ty.target = 0;
      }
      for (const sp of [s.focus, s.hover, s.press, s.tx, s.ty, s.z, s.enter]) {
        if (reduced) sp.snap(sp.target);
        else if (sp.step(dt)) moving = true;
      }
    });
    if (!reduced) {
      const k = 1 - Math.exp(-dt * 7);
      par.x += (par.tx - par.x) * k;
      par.y += (par.ty - par.y) * k;
    }

    // Instances: backdrop, far particles, shadows, cards, near particles.
    let o16 = 0;
    const put = (a: number[]) => {
      itemData.set(a, o16);
      o16 += 16;
    };
    put([0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1, 0, 0, 0.02]);
    const particle = (p: (typeof seeds)[number]) =>
      put([p.x * innerWidth, p.y * innerHeight, p.size, p.size, p.z, 0, 0, 2, 0, 0, 0, 0, Math.random() * 0 + p.x, p.speed, p.alpha, p.par]);
    seeds.filter((p) => p.z < 0).forEach(particle);
    states.forEach((s) => put([s.box.x, s.box.y, s.box.w, s.box.h, s.z.x, s.tx.x, s.ty.x, 0, s.focus.x, s.hover.x, 0, 0, s.enter.x, 0, 0, 0.5]));
    states.forEach((s, i) => put([s.box.x, s.box.y, s.box.w, s.box.h, s.z.x, s.tx.x, s.ty.x, 1, s.focus.x, s.hover.x, i % mats, s.press.x, s.enter.x, 0, 0, 0.5]));
    seeds.filter((p) => p.z >= 0).forEach(particle);

    uni.set([innerWidth, innerHeight, now / 1000, dpr, ptr.x, ptr.y, par.x, par.y, ...bg, 1, ...tile, 1, ...accent, 1, ...rule, 1, reduced ? 0 : 1, 0, ptrActive || fi >= 0 ? 1 : 0, 0]);
    // Light follows the focused card when the pointer is idle.
    if (!ptrActive && fi >= 0) {
      const b = states[fi]!.box;
      uni[4] = b.x + b.w / 2;
      uni[5] = b.y + b.h / 2;
    }
    device.queue.writeBuffer(uniBuf, 0, uni);
    device.queue.writeBuffer(itemBuf, 0, itemData);
    const enc = device.createCommandEncoder();
    const pass = enc.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), clearValue: { r: 0, g: 0, b: 0, a: 0 }, loadOp: "clear", storeOp: "store" }] });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bind);
    pass.draw(6, count);
    pass.end();
    device.queue.submit([enc.finish()]);
    dirty = moving;
    if (!reduced || moving || dirty) raf = requestAnimationFrame(frame);
    else raf = 0;
  };
  // Static mode redraws on events only; motion mode runs every frame.
  const kick = () => {
    if (!raf && !dead) raf = requestAnimationFrame(frame);
  };
  if (reduced) {
    for (const ev of ["pointermove", "keydown", "scroll", "resize", "focusin", "pointerenter"]) addEventListener(ev, kick, { passive: true, capture: true });
  }

  (stats as unknown as { debug: () => unknown }).debug = () => ({ n, count, enter: states.map((s) => s.enter.x), box: states.map((s) => s.box), tile, bg, accent, rule, rows: Array.from({ length: count }, (_, i) => Array.from(itemData.slice(i * 16, i * 16 + 16)).map((x) => +x.toFixed(2))).filter((r) => r[7]! < 2) });
  const destroy = () => {
    if (dead) return;
    dead = true;
    cancelAnimationFrame(raf);
    removeEventListener("pointermove", onPointerMove);
    removeEventListener("keydown", onKey);
    removeEventListener("resize", onResize);
    removeEventListener("scroll", onScroll);
    enterHandlers.forEach((f) => f());
    canvas.remove();
    root.classList.remove("stage-on");
    device.destroy();
  };
  device.lost.then(() => destroy());
  root.classList.add("stage-on");
  raf = requestAnimationFrame(frame);
  return { stats, destroy };
}
