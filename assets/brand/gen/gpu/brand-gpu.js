var M;
function _() {
  return (
    (M ??= (async () => {
      let r = await fetch(new URL("brand-gpu.wasm", import.meta.url)),
        { instance: o } = await WebAssembly.instantiate(
          await r.arrayBuffer(),
          {},
        );
      return o.exports;
    })()),
    M
  );
}
async function z(r) {
  let o = navigator.gpu,
    h = await o?.requestAdapter();
  if (!o || !h) return;
  let e = await h.requestDevice(),
    a = await _(),
    O = a.vertex_count(),
    b = a.index_count(),
    v = new Float32Array(a.memory.buffer, a.mesh(), O * 8).slice(),
    x = new Uint16Array(a.memory.buffer, a.indices(), b).slice(),
    c = r.querySelector("img"),
    w = r.dataset.texture ?? c?.src;
  if (!w) return;
  let s = await createImageBitmap(await (await fetch(w)).blob()),
    T = e.createBuffer({
      size: v.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
  e.queue.writeBuffer(T, 0, v);
  let y = e.createBuffer({
    size: x.byteLength,
    usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
  });
  e.queue.writeBuffer(y, 0, x);
  let U = e.createBuffer({
      size: 128,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    }),
    P = e.createTexture({
      size: [s.width, s.height],
      format: "rgba8unorm-srgb",
      usage:
        GPUTextureUsage.TEXTURE_BINDING |
        GPUTextureUsage.COPY_DST |
        GPUTextureUsage.RENDER_ATTACHMENT,
    });
  e.queue.copyExternalImageToTexture({ source: s }, { texture: P }, [
    s.width,
    s.height,
  ]);
  let t = document.createElement("canvas"),
    f = t.getContext("webgpu");
  if (!f) return;
  let m = o.getPreferredCanvasFormat();
  f.configure({ device: e, format: m, alphaMode: "premultiplied" });
  let E = e.createShaderModule({
      code: `
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
}`,
    }),
    d = 4,
    B = e.createRenderPipeline({
      layout: "auto",
      vertex: {
        module: E,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 32,
            attributes: [
              { shaderLocation: 0, offset: 0, format: "float32x3" },
              { shaderLocation: 1, offset: 12, format: "float32x3" },
              { shaderLocation: 2, offset: 24, format: "float32x2" },
            ],
          },
        ],
      },
      fragment: { module: E, entryPoint: "fs", targets: [{ format: m }] },
      primitive: { topology: "triangle-list", cullMode: "back" },
      depthStencil: {
        format: "depth24plus",
        depthWriteEnabled: !0,
        depthCompare: "less",
      },
      multisample: { count: d },
    }),
    S = e.createBindGroup({
      layout: B.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: U } },
        {
          binding: 1,
          resource: e.createSampler({
            magFilter: "linear",
            minFilter: "linear",
          }),
        },
        { binding: 2, resource: P.createView() },
      ],
    }),
    l,
    p,
    G = () => {
      let n = r.getBoundingClientRect(),
        u = Math.min(devicePixelRatio || 1, 2);
      ((t.width = Math.max(1, Math.round(n.width * u))),
        (t.height = Math.max(1, Math.round(n.height * u))),
        l?.destroy(),
        p?.destroy(),
        (l = e.createTexture({
          size: [t.width, t.height],
          format: m,
          sampleCount: d,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        })),
        (p = e.createTexture({
          size: [t.width, t.height],
          format: "depth24plus",
          sampleCount: d,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        })));
    },
    g = (n) => {
      let u = new Float32Array(
        a.memory.buffer,
        a.frame(n, t.width / t.height),
        32,
      ).slice();
      e.queue.writeBuffer(U, 0, u);
      let C = e.createCommandEncoder(),
        i = C.beginRenderPass({
          colorAttachments: [
            {
              view: l.createView(),
              resolveTarget: f.getCurrentTexture().createView(),
              loadOp: "clear",
              storeOp: "discard",
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
            },
          ],
          depthStencilAttachment: {
            view: p.createView(),
            depthLoadOp: "clear",
            depthClearValue: 1,
            depthStoreOp: "discard",
          },
        });
      (i.setPipeline(B),
        i.setBindGroup(0, S),
        i.setVertexBuffer(0, T),
        i.setIndexBuffer(y, "uint16"),
        i.drawIndexed(b),
        i.end(),
        e.queue.submit([C.finish()]));
    };
  if (
    (t.setAttribute("role", "img"),
    t.setAttribute("aria-label", c?.alt ?? "Aphrody"),
    r.append(t),
    G(),
    g(0),
    c?.remove(),
    new ResizeObserver(() => {
      (G(), g(performance.now() / 1000));
    }).observe(r),
    matchMedia("(prefers-reduced-motion: reduce)").matches)
  )
    return;
  let A = (n) => {
    if (r.isConnected) (g(n / 1000), requestAnimationFrame(A));
  };
  requestAnimationFrame(A);
}
class R extends HTMLElement {
  connectedCallback() {
    z(this).catch(() => {});
  }
}
if (!customElements.get("aphrody-tile"))
  customElements.define("aphrody-tile", R);
