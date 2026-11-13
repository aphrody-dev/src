// WGSL of the stage: one pipeline, one instanced quad draw. Kinds: 0 shadow, 1 card, 2 particle, 3 backdrop.
// Cards are lit by a point light that follows the pointer (or the focused card) using the normal and
// roughness maps of the library textures; colors come from the page tokens through the uniform.
export const WGSL = /* wgsl */ `
struct U { view: vec4f, ptr: vec4f, bg: vec4f, tile: vec4f, accent: vec4f, rule: vec4f, mode: vec4f };
struct Item { rect: vec4f, p: vec4f, s: vec4f, c: vec4f };
@group(0) @binding(0) var<uniform> u: U;
@group(0) @binding(1) var<storage, read> items: array<Item>;
@group(0) @binding(2) var samp: sampler;
@group(0) @binding(3) var albedoT: texture_2d_array<f32>;
@group(0) @binding(4) var normalT: texture_2d_array<f32>;
@group(0) @binding(5) var roughT: texture_2d_array<f32>;

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) local: vec2f,
  @location(1) uv: vec2f,
  @location(2) @interpolate(flat) idx: u32,
};

const D = 1400.0;

@vertex fn vs(@builtin(vertex_index) vi: u32, @builtin(instance_index) ii: u32) -> VOut {
  var corners = array<vec2f, 6>(vec2f(0, 0), vec2f(1, 0), vec2f(0, 1), vec2f(0, 1), vec2f(1, 0), vec2f(1, 1));
  let q = corners[vi];
  let it = items[ii];
  let kind = u32(it.p.w + 0.5);
  var size = it.rect.zw;
  var ctr = it.rect.xy + size * 0.5;
  var pad = 0.0;
  var off = vec2f(0.0);
  var scale = 1.0;
  if (kind == 0u) { pad = 30.0; off = vec2f(0.0, 12.0 + 12.0 * it.s.x + 8.0 * it.s.y); }
  if (kind == 1u || kind == 0u) { scale = 0.96 + 0.04 * it.c.x; }
  if (kind == 2u) {
    let t = u.view.z * it.c.y * u.mode.x + it.c.x * 6.2831853;
    ctr = ctr + vec2f(sin(t) * 36.0, cos(t * 0.7) * 26.0);
  }
  if (kind == 3u) { size = u.view.xy; ctr = size * 0.5; }
  let local = (q - 0.5) * (size + 2.0 * pad);
  var p = vec3f(local * scale, 0.0);
  if (kind <= 1u) {
    let tx = it.p.y; let ty = it.p.z;
    p = vec3f(p.x, p.y * cos(tx), p.y * sin(tx));
    p = vec3f(p.x * cos(ty) + p.z * sin(ty), p.y, -p.x * sin(ty) + p.z * cos(ty));
  }
  let z = p.z + it.p.x;
  let s = D / (D - z);
  let scr = ctr + off + u.ptr.zw * it.c.w + p.xy * s;
  var o: VOut;
  o.pos = vec4f(scr.x / u.view.x * 2.0 - 1.0, 1.0 - scr.y / u.view.y * 2.0, 0.0, 1.0);
  o.local = local;
  o.uv = q;
  o.idx = ii;
  return o;
}

fn sdBox(p: vec2f, b: vec2f, r: f32) -> f32 {
  let q = abs(p) - b + r;
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

@fragment fn fs(v: VOut) -> @location(0) vec4f {
  let it = items[v.idx];
  let kind = u32(it.p.w + 0.5);
  let focus = it.s.x; let hover = it.s.y; let layer = i32(it.s.z + 0.5); let press = it.s.w;
  let acc = u.accent.rgb;
  if (kind == 3u) {
    let px = v.uv * u.view.xy;
    let tex = textureSampleLevel(albedoT, samp, px / 512.0 * 0.7 + u.ptr.zw * 0.0015, 0, 0.0).rgb;
    let d = length(px - u.ptr.xy) / max(u.view.x, u.view.y);
    let glow = exp(-d * d * 9.0) * 0.10 * u.mode.z;
    let vig = smoothstep(0.55, 1.1, length(v.uv - 0.5) * 1.6) * 0.10;
    let a = 0.05 + glow + vig;
    let col = mix(tex, acc, glow / max(a, 0.001)) * (1.0 - vig * 4.0);
    return vec4f(col * a, a);
  }
  if (kind == 2u) {
    let d = length(v.uv - 0.5) * 2.0;
    let a = (1.0 - smoothstep(0.0, 1.0, d)) * it.c.z;
    return vec4f(acc * a, a);
  }
  let size = it.rect.zw;
  let d = sdBox(v.local, size * 0.5, 6.0);
  if (kind == 0u) {
    let a = (1.0 - smoothstep(-6.0, 30.0, d)) * (0.10 + 0.10 * focus + 0.06 * hover) * it.c.x;
    return vec4f(0.0, 0.0, 0.0, a);
  }
  let cov = 1.0 - smoothstep(-0.5, 0.5, d);
  let tuv = (v.local + size * 0.5) / 512.0;
  let alb = textureSampleLevel(albedoT, samp, tuv, layer, 0.0).rgb;
  let nm = textureSampleLevel(normalT, samp, tuv, layer, 0.0).rgb * 2.0 - 1.0;
  let rough = textureSampleLevel(roughT, samp, tuv, layer, 0.0).r;
  let n = normalize(vec3f(nm.x, nm.y, max(nm.z, 0.2)));
  let lp = vec3f(u.ptr.xy - (it.rect.xy + size * 0.5), 220.0 + 120.0 * (1.0 - focus));
  let l = normalize(lp - vec3f(v.local, 0.0));
  let diff = max(dot(n, l), 0.0);
  let h = normalize(l + vec3f(0.0, 0.0, 1.0));
  let spec = pow(max(dot(n, h), 0.0), 28.0) * (1.0 - rough);
  let base = u.tile.rgb;
  let mat = alb * (0.35 + 0.95 * diff);
  var col = mix(base, mat, 0.08 + 0.05 * focus + 0.04 * hover) + vec3f(spec) * (0.03 + 0.05 * hover + 0.04 * focus);
  col = col * (1.0 - 0.05 * press);
  let edge = smoothstep(-1.6, -0.4, d);
  let ring = mix(u.rule.rgb, acc, max(focus, hover));
  col = mix(col, ring, edge);
  let a = cov * it.c.x;
  return vec4f(col * a, a);
}
`;
