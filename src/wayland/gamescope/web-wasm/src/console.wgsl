// Gamescope console UI: one instanced quad pipeline. Each instance is 20 floats (see gamescope_core::ui::Quad):
// rect, color 0, color 1, atlas uv, then (radius, border, kind, aux). Kinds: 0 fill, 1 glyph, 2 icon, 3 shadow,
// 4 ring, 5 generative art, 6 medal, 7 glow. Design space is 1920x1080; the viewport letterboxes it.
@group(0) @binding(0) var atlas: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

struct VIn {
  @builtin(vertex_index) vi: u32,
  @location(0) rect: vec4f,
  @location(1) c0: vec4f,
  @location(2) c1: vec4f,
  @location(3) uv: vec4f,
  @location(4) prm: vec4f,
}

struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) lp: vec2f,
  @location(1) t: vec2f,
  @location(2) @interpolate(flat) rect: vec4f,
  @location(3) @interpolate(flat) c0: vec4f,
  @location(4) @interpolate(flat) c1: vec4f,
  @location(5) @interpolate(flat) uv: vec4f,
  @location(6) @interpolate(flat) prm: vec4f,
}

@vertex
fn vs(i: VIn) -> VOut {
  var corners = array<vec2f, 6>(vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0), vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0));
  let c = corners[i.vi];
  var pad = 2.0;
  if (i.prm.z > 2.5 && i.prm.z < 3.5) {
    pad = i.prm.w * 2.0 + 2.0;
  }
  let size = i.rect.zw + vec2f(pad * 2.0);
  let p = i.rect.xy - vec2f(pad) + c * size;
  var o: VOut;
  o.pos = vec4f(p.x / 960.0 - 1.0, 1.0 - p.y / 540.0, 0.0, 1.0);
  o.lp = p - (i.rect.xy + i.rect.zw * 0.5);
  o.t = (p - i.rect.xy) / i.rect.zw;
  o.rect = i.rect;
  o.c0 = i.c0;
  o.c1 = i.c1;
  o.uv = i.uv;
  o.prm = i.prm;
  return o;
}

fn sd_rr(p: vec2f, h: vec2f, r: f32) -> f32 {
  let q = abs(p) - h + vec2f(r);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

fn hash(n: f32) -> f32 {
  return fract(sin(n * 127.1) * 43758.5453);
}

@fragment
fn fs(i: VOut) -> @location(0) vec4f {
  let kind = i.prm.z;
  let half = i.rect.zw * 0.5;
  let r = min(i.prm.x, min(half.x, half.y));
  let d = sd_rr(i.lp, half, r);
  let cov = clamp(0.5 - d, 0.0, 1.0);
  let tc = clamp(i.t, vec2f(0.0), vec2f(1.0));
  let tex = textureSampleLevel(atlas, samp, i.uv.xy + tc * i.uv.zw, 0.0);
  var col = i.c0.rgb;
  var a = 0.0;
  if (kind < 0.5) {
    let m = mix(i.c0, i.c1, tc.y);
    col = m.rgb;
    a = m.a * cov;
  } else if (kind < 1.5) {
    a = i.c0.a * tex.a;
  } else if (kind < 2.5) {
    col = tex.rgb * i.c0.rgb;
    a = tex.a * i.c0.a * cov;
  } else if (kind < 3.5) {
    let b = max(i.prm.w, 1.0);
    let s = clamp(0.5 - d / (2.0 * b), 0.0, 1.0);
    a = i.c0.a * s * s;
  } else if (kind < 4.5) {
    a = i.c0.a * cov * (1.0 - clamp(0.5 - (d + i.prm.y), 0.0, 1.0));
  } else if (kind < 5.5) {
    let s = i.prm.w;
    let h1 = hash(s);
    let h2 = hash(s + 7.3);
    let h3 = hash(s + 13.1);
    let uv = tc;
    var c = mix(i.c1.rgb, i.c0.rgb, clamp(0.35 + (uv.x * (h1 - 0.5) + (1.0 - uv.y)) * 0.6, 0.0, 1.0));
    let d1 = length((uv - vec2f(h1, h2)) * vec2f(1.3, 1.0));
    c = mix(c, min(i.c0.rgb * 1.3, vec3f(1.0)), smoothstep(0.6, 0.0, d1) * 0.55);
    let d2 = length((uv - vec2f(h3, 1.0 - h2)) * vec2f(1.2, 1.0));
    c = mix(c, vec3f(1.0), smoothstep(0.3, 0.0, d2) * 0.18);
    let ang = h3 * 3.14159;
    c = c + 0.035 * sin((uv.x * cos(ang) + uv.y * sin(ang)) * (10.0 + h1 * 14.0));
    col = c;
    a = cov;
  } else if (kind < 6.5) {
    let rad = min(half.x, half.y);
    var n = 0.0;
    if (i.prm.w > 1.5) {
      n = 12.0;
    } else if (i.prm.w > 0.5) {
      n = 6.0;
    }
    let R = rad * 0.94 * (1.0 + select(0.0, 0.05 * cos(n * atan2(i.lp.y, i.lp.x)), n > 0.0));
    let l = length(i.lp);
    let edge = clamp(0.5 - (l - R), 0.0, 1.0);
    let k = l / rad;
    col = mix(i.c0.rgb, i.c1.rgb, clamp(0.5 - i.lp.y / rad * 0.45, 0.0, 1.0));
    if (k > 0.72 && k < 0.82) {
      col = i.c1.rgb;
    }
    if (k < 0.2) {
      col = i.c1.rgb;
    }
    a = edge * i.c0.a;
  } else {
    let q = length(i.lp / half);
    let g = clamp(1.0 - q, 0.0, 1.0);
    a = i.c0.a * g * g;
  }
  return vec4f(col, a);
}
