/// <reference types="@webgpu/types" />
// Minimal WebGPU renderer of the Aphrody brand tile, built by `ay brand build` into gen/gpu/brand-gpu.js.
// Geometry and per-frame matrices come from crates/aphrody-brand-gpu (wasm32, no dependencies, same
// mesh as gen/model/*.glb); this file only uploads them and draws. Usage:
//   <aphrody-tile data-texture="icons/aphrody-labs/icon-512.png"><img src="icons/aphrody-labs/icon.svg" alt="Aphrody"></aphrody-tile>
//   <script type="module" src="gpu/brand-gpu.js"></script>
// Fallback: without WebGPU, or on any failure, the <img> stays. prefers-reduced-motion draws one still frame.

type Exports = {
  memory: WebAssembly.Memory;
  mesh(): number;
  indices(): number;
  vertex_count(): number;
  index_count(): number;
  frame(t: number, aspect: number): number;
};

const WGSL = /* wgsl */ `
struct U { mvp: mat4x4f, model: mat4x4f };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var samp: sampler;
@group(0) @binding(2) var tex: texture_2d<f32>;
struct O { @builtin(position) p: vec4f, @location(0) n: vec3f, @location(1) uv: vec2f };
@vertex fn vs(@location(0) p: vec3f, @location(1) n: vec3f, @location(2) uv: vec2f) -> O {
  var o: O;
  o.p = u.mvp * vec4f(p, 1.0);
  o.n = (u.model * vec4f(n, 0.0)).xyz;
  o.uv = uv;
  return o;
}
@fragment fn fs(i: O) -> @location(0) vec4f {
  let base = textureSample(tex, samp, i.uv).rgb;
  let n = normalize(i.n);
  let l = normalize(vec3f(0.35, 0.65, 1.0));
  let h = normalize(l + vec3f(0.0, 0.0, 1.0));
  let lit = base * (0.32 + 0.72 * max(dot(n, l), 0.0)) + vec3f(0.4 * pow(max(dot(n, h), 0.0), 80.0));
  return vec4f(pow(lit, vec3f(1.0 / 2.2)), 1.0);
}`;

let wasm: Promise<Exports> | undefined;
function loadWasm(): Promise<Exports> {
  wasm ??= (async () => {
    const res = await fetch(new URL("brand-gpu.wasm", import.meta.url));
    const { instance } = await WebAssembly.instantiate(await res.arrayBuffer(), {});
    return instance.exports as unknown as Exports;
  })();
  return wasm;
}

async function start(host: HTMLElement): Promise<void> {
  const gpu = (navigator as Navigator & { gpu?: GPU }).gpu;
  const adapter = await gpu?.requestAdapter();
  if (!gpu || !adapter) return;
  const device = await adapter.requestDevice();
  const w = await loadWasm();
  const vcount = w.vertex_count();
  const icount = w.index_count();
  const vertices = new Float32Array(w.memory.buffer, w.mesh(), vcount * 8).slice();
  const indices = new Uint16Array(w.memory.buffer, w.indices(), icount).slice();

  const img = host.querySelector("img");
  const src = host.dataset.texture ?? img?.src;
  if (!src) return;
  const bitmap = await createImageBitmap(await (await fetch(src)).blob());

  const vbuf = device.createBuffer({ size: vertices.byteLength, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(vbuf, 0, vertices);
  const ibuf = device.createBuffer({ size: indices.byteLength, usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST });
  device.queue.writeBuffer(ibuf, 0, indices);
  const ubuf = device.createBuffer({ size: 128, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const texture = device.createTexture({
    size: [bitmap.width, bitmap.height],
    format: "rgba8unorm-srgb",
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
  });
  device.queue.copyExternalImageToTexture({ source: bitmap }, { texture }, [bitmap.width, bitmap.height]);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("webgpu");
  if (!ctx) return;
  const format = gpu.getPreferredCanvasFormat();
  ctx.configure({ device, format, alphaMode: "premultiplied" });
  const module = device.createShaderModule({ code: WGSL });
  const sampleCount = 4;
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs",
      buffers: [{
        arrayStride: 32,
        attributes: [
          { shaderLocation: 0, offset: 0, format: "float32x3" },
          { shaderLocation: 1, offset: 12, format: "float32x3" },
          { shaderLocation: 2, offset: 24, format: "float32x2" },
        ],
      }],
    },
    fragment: { module, entryPoint: "fs", targets: [{ format }] },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: { format: "depth24plus", depthWriteEnabled: true, depthCompare: "less" },
    multisample: { count: sampleCount },
  });
  const bind = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: ubuf } },
      { binding: 1, resource: device.createSampler({ magFilter: "linear", minFilter: "linear" }) },
      { binding: 2, resource: texture.createView() },
    ],
  });

  let msaa: GPUTexture | undefined;
  let depth: GPUTexture | undefined;
  const resize = () => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(r.width * dpr));
    canvas.height = Math.max(1, Math.round(r.height * dpr));
    msaa?.destroy();
    depth?.destroy();
    msaa = device.createTexture({ size: [canvas.width, canvas.height], format, sampleCount, usage: GPUTextureUsage.RENDER_ATTACHMENT });
    depth = device.createTexture({ size: [canvas.width, canvas.height], format: "depth24plus", sampleCount, usage: GPUTextureUsage.RENDER_ATTACHMENT });
  };

  const draw = (t: number) => {
    const m = new Float32Array(w.memory.buffer, w.frame(t, canvas.width / canvas.height), 32).slice();
    device.queue.writeBuffer(ubuf, 0, m);
    const enc = device.createCommandEncoder();
    const pass = enc.beginRenderPass({
      colorAttachments: [{ view: msaa!.createView(), resolveTarget: ctx.getCurrentTexture().createView(), loadOp: "clear", storeOp: "discard", clearValue: { r: 0, g: 0, b: 0, a: 0 } }],
      depthStencilAttachment: { view: depth!.createView(), depthLoadOp: "clear", depthClearValue: 1, depthStoreOp: "discard" },
    });
    pass.setPipeline(pipeline);
    pass.setBindGroup(0, bind);
    pass.setVertexBuffer(0, vbuf);
    pass.setIndexBuffer(ibuf, "uint16");
    pass.drawIndexed(icount);
    pass.end();
    device.queue.submit([enc.finish()]);
  };

  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", img?.alt ?? "Aphrody");
  host.append(canvas);
  resize();
  draw(0);
  img?.remove();
  new ResizeObserver(() => {
    resize();
    draw(performance.now() / 1000);
  }).observe(host);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const loop = (ms: number) => {
    if (host.isConnected) {
      draw(ms / 1000);
      requestAnimationFrame(loop);
    }
  };
  requestAnimationFrame(loop);
}

class AphrodyTile extends HTMLElement {
  connectedCallback(): void {
    start(this).catch(() => {
      /* WebGPU or wasm unavailable: the <img> fallback stays. */
    });
  }
}

if (!customElements.get("aphrody-tile")) customElements.define("aphrody-tile", AphrodyTile);
