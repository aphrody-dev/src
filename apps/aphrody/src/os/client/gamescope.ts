// Gamescope display pipeline in the browser: any canvas in a window (VM, emulator, Flash, game frame) is read
// each frame, upscaled with the WGSL passes of crates/gamescope-wgsl (EASU then RCAS, the same files the Rust
// crate compiles) and presented with the scaling modes of crates/gamescope-core (stretch, center, integer, fit,
// fill), under a frame cap. Overlay canvas on top of the source; input still reaches the source (pointer-events none).
import EASU from "../../../../../crates/gamescope-wgsl/src/shaders/easu.wgsl" with { type: "text" };
import RCAS from "../../../../../crates/gamescope-wgsl/src/shaders/rcas.wgsl" with { type: "text" };

export type Filter = "off" | "linear" | "nearest" | "fsr";
export type Scaling = "fit" | "integer" | "stretch" | "fill" | "center";
export interface GsOptions {
  filter: Filter;
  scaling: Scaling;
  sharpness: number;
  cap: number;
}
export interface GsHandle {
  opts: GsOptions;
  stats: {
    src: string;
    dst: string;
    fps: number;
    frames: number;
    gpuMs: number;
  };
  destroy(): void;
}

/** Layout of crates/gamescope-core scaling.rs (same formulas). Returns x, y, w, h in target pixels. */
export function layout(
  sw: number,
  sh: number,
  tw: number,
  th: number,
  mode: Scaling,
): [number, number, number, number] {
  const sa = sw / sh;
  const ta = tw / th;
  let w: number;
  let h: number;
  switch (mode) {
    case "stretch":
      [w, h] = [tw, th];
      break;
    case "center":
      [w, h] = [Math.min(sw, tw), Math.min(sh, th)];
      break;
    case "integer": {
      const s = Math.max(1, Math.min(Math.floor(tw / sw), Math.floor(th / sh)));
      [w, h] = [sw * s, sh * s];
      break;
    }
    case "fill":
      [w, h] = sa > ta ? [th * sa, th] : [tw, tw / sa];
      break;
    default:
      [w, h] = sa > ta ? [tw, tw / sa] : [th * sa, th];
  }
  return [(tw - w) / 2, (th - h) / 2, w, h];
}

const BLIT = /* wgsl */ `
struct U { rect: vec4<f32> };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var tex: texture_2d<f32>;
@group(0) @binding(2) var smp: sampler;
struct V { @builtin(position) p: vec4<f32>, @location(0) uv: vec2<f32> };
@vertex fn vs(@builtin(vertex_index) i: u32) -> V {
  var c = array<vec2<f32>, 6>(vec2(0.,0.), vec2(1.,0.), vec2(0.,1.), vec2(0.,1.), vec2(1.,0.), vec2(1.,1.));
  let q = c[i];
  let ndc = vec2(u.rect.x + q.x * u.rect.z, u.rect.y + q.y * u.rect.w);
  return V(vec4(ndc.x * 2. - 1., 1. - ndc.y * 2., 0., 1.), q);
}
@fragment fn fs(v: V) -> @location(0) vec4<f32> { return vec4(textureSample(tex, smp, v.uv).rgb, 1.); }`;

/** First canvas under `root`, looking through open shadow roots and same-origin iframes. */
export function findCanvas(
  root: ParentNode,
  skip: Element,
): HTMLCanvasElement | null {
  for (const el of root.querySelectorAll("*")) {
    if (el === skip) continue;
    if (
      el instanceof HTMLCanvasElement &&
      el.width > 1 &&
      el.height > 1 &&
      getComputedStyle(el).display !== "none"
    )
      return el;
    const sh = (el as HTMLElement).shadowRoot;
    if (sh) {
      const c = findCanvas(sh, skip);
      if (c) return c;
    }
    if (el instanceof HTMLIFrameElement) {
      try {
        const d = el.contentDocument;
        const c = d && findCanvas(d, skip);
        if (c) return c;
      } catch {}
    }
  }
  return null;
}

export async function startGamescope(
  host: HTMLElement,
  opts: GsOptions,
): Promise<GsHandle | null> {
  if (!navigator.gpu) return null;
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) return null;
  const gpuDevice: GPUDevice = device;
  device.addEventListener("uncapturederror", (e) =>
    console.error("gamescope:", (e as GPUUncapturedErrorEvent).error.message),
  );
  const overlay = document.createElement("canvas");
  overlay.setAttribute("aria-hidden", "true");
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    background: "#000",
  });
  host.style.position = "relative";
  host.append(overlay);
  const ctx = overlay.getContext("webgpu")!;
  const format = navigator.gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: "opaque" });

  const easu = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: device.createShaderModule({ code: EASU }),
      entryPoint: "main",
    },
  });
  const rcas = device.createComputePipeline({
    layout: "auto",
    compute: {
      module: device.createShaderModule({ code: RCAS }),
      entryPoint: "main",
    },
  });
  const blitMod = device.createShaderModule({ code: BLIT });
  const blit = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: blitMod, entryPoint: "vs" },
    fragment: { module: blitMod, entryPoint: "fs", targets: [{ format }] },
  });
  const lin = device.createSampler({
    magFilter: "linear",
    minFilter: "linear",
  });
  const near = device.createSampler({
    magFilter: "nearest",
    minFilter: "nearest",
  });
  const ub = (n: number) =>
    device.createBuffer({
      size: n,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
  const easuU = ub(32);
  const rcasU = ub(32);
  const blitU = ub(16);

  const handle: GsHandle = {
    opts,
    stats: { src: "", dst: "", fps: 0, frames: 0, gpuMs: 0 },
    destroy,
  };
  let src: HTMLCanvasElement | null = null;
  // WebGL canvases drop their buffer after compositing, so the frames are read from the canvas capture stream.
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  let inTex: GPUTexture | null = null;
  let mid: GPUTexture | null = null;
  let out: GPUTexture | null = null;
  let key = "";
  let dead = false;
  let raf = 0;
  let last = 0;
  const recent: number[] = [];
  const dpr = () => Math.min(devicePixelRatio || 1, 2);

  const frame = (now: number) => {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    if (opts.cap > 0 && now - last < 1000 / opts.cap - 1) return;
    if (!src || !src.isConnected) {
      src = findCanvas(host, overlay);
      if (!src) return;
      video.srcObject = src.captureStream();
      void video.play();
    }
    if (video.readyState < 2 || !video.videoWidth) return;
    const tw = Math.max(1, Math.round(overlay.clientWidth * dpr()));
    const th = Math.max(1, Math.round(overlay.clientHeight * dpr()));
    if (overlay.width !== tw || overlay.height !== th)
      [overlay.width, overlay.height] = [tw, th];
    // Passthrough: the source stays visible and the overlay hides.
    overlay.style.visibility = opts.filter === "off" ? "hidden" : "visible";
    if (opts.filter === "off") return;
    const sw = video.videoWidth;
    const sh = video.videoHeight;
    const [x, y, w, h] = layout(sw, sh, tw, th, opts.scaling);
    const ow = Math.min(8192, Math.max(1, Math.round(w)));
    const oh = Math.min(8192, Math.max(1, Math.round(h)));
    const k = `${sw}x${sh}>${ow}x${oh}>${opts.filter}`;
    if (k !== key) {
      key = k;
      inTex?.destroy();
      mid?.destroy();
      out?.destroy();
      inTex = device.createTexture({
        size: [sw, sh],
        format: "rgba8unorm",
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.RENDER_ATTACHMENT,
      });
      const su =
        GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING;
      mid = device.createTexture({
        size: [ow, oh],
        format: "rgba8unorm",
        usage: su,
      });
      out = device.createTexture({
        size: [ow, oh],
        format: "rgba8unorm",
        usage: su,
      });
    }
    try {
      device.queue.copyExternalImageToTexture(
        { source: video },
        { texture: inTex! },
        [sw, sh],
      );
    } catch {
      return;
    }
    const enc = device.createCommandEncoder();
    let shown = inTex!;
    if (opts.filter === "fsr") {
      device.queue.writeBuffer(
        easuU,
        0,
        new Float32Array([sw, sh, 1 / sw, 1 / sh, ow, oh, 1 / ow, 1 / oh]),
      );
      device.queue.writeBuffer(
        rcasU,
        0,
        new Float32Array([ow, oh, 1 / ow, 1 / oh, opts.sharpness, 0, 0, 0]),
      );
      const p1 = enc.beginComputePass();
      p1.setPipeline(easu);
      p1.setBindGroup(
        0,
        device.createBindGroup({
          layout: easu.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: easuU } },
            { binding: 1, resource: inTex!.createView() },
            { binding: 2, resource: mid!.createView() },
          ],
        }),
      );
      p1.dispatchWorkgroups(Math.ceil(ow / 16), Math.ceil(oh / 16));
      p1.end();
      const p2 = enc.beginComputePass();
      p2.setPipeline(rcas);
      p2.setBindGroup(
        0,
        device.createBindGroup({
          layout: rcas.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: { buffer: rcasU } },
            { binding: 1, resource: mid!.createView() },
            { binding: 2, resource: out!.createView() },
          ],
        }),
      );
      p2.dispatchWorkgroups(Math.ceil(ow / 16), Math.ceil(oh / 16));
      p2.end();
      shown = out!;
    }
    device.queue.writeBuffer(
      blitU,
      0,
      new Float32Array([x / tw, y / th, w / tw, h / th]),
    );
    const pass = enc.beginRenderPass({
      colorAttachments: [
        {
          view: ctx.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });
    pass.setPipeline(blit);
    pass.setBindGroup(
      0,
      device.createBindGroup({
        layout: blit.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: blitU } },
          { binding: 1, resource: shown.createView() },
          {
            binding: 2,
            resource:
              opts.filter === "nearest" ||
              (opts.scaling === "integer" && opts.filter !== "fsr")
                ? near
                : lin,
          },
        ],
      }),
    );
    pass.draw(6);
    pass.end();
    device.queue.submit([enc.finish()]);
    recent.push(now);
    while (recent.length > 1 && now - recent[0]! > 1000) recent.shift();
    last = now;
    handle.stats.frames++;
    handle.stats.fps = recent.length;
    handle.stats.src = `${sw}x${sh}`;
    handle.stats.dst = `${w.toFixed(0)}x${h.toFixed(0)}`;
  };
  function destroy() {
    dead = true;
    cancelAnimationFrame(raf);
    video.srcObject = null;
    overlay.remove();
    gpuDevice.destroy();
  }
  raf = requestAnimationFrame(frame);
  return handle;
}
