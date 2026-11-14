// Shared instanced SDF + gradient + glyph pipeline shader for both Windows/Linux Desktop (wgpu)
// and Chrome WebAssembly WebGPU (wasm32). Virtual scene space is 1440x900 letterboxed cleanly.
@group(0) @binding(0) var atlas: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

struct Uniforms {
  viewport: vec4f, // (offset_x, offset_y, scale_x, scale_y) in NDC helper -> (virt_w, virt_h, 0, 0)
};

struct VIn {
  @builtin(vertex_index) vi: u32,
  @location(0) rect: vec4f, // x, y, w, h in virtual 1440x900 px
  @location(1) c0: vec4f,   // top / main color
  @location(2) c1: vec4f,   // bottom / border color
  @location(3) uv: vec4f,   // u0, v0, uw, vh
  @location(4) prm: vec4f,  // radius, border_width, kind (0=box, 1=glyph, 2=ring), pad
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
  var corners = array<vec2f, 6>(
    vec2f(0.0, 0.0),
    vec2f(1.0, 0.0),
    vec2f(0.0, 1.0),
    vec2f(0.0, 1.0),
    vec2f(1.0, 0.0),
    vec2f(1.0, 1.0)
  );
  let c = corners[i.vi];
  let pad = 1.5;
  let size = i.rect.zw + vec2f(pad * 2.0);
  let p = i.rect.xy - vec2f(pad) + c * size;

  var o: VOut;
  // Virtual space 1440 x 900 mapped directly to NDC
  o.pos = vec4f(p.x / 720.0 - 1.0, 1.0 - p.y / 450.0, 0.0, 1.0);
  o.lp = p - (i.rect.xy + i.rect.zw * 0.5);
  o.t = (p - i.rect.xy) / max(i.rect.zw, vec2f(0.001));
  o.rect = i.rect;
  o.c0 = i.c0;
  o.c1 = i.c1;
  o.uv = i.uv;
  o.prm = i.prm;
  return o;
}

fn sd_rounded_box(p: vec2f, h: vec2f, r: f32) -> f32 {
  let q = abs(p) - h + vec2f(r);
  return length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0) - r;
}

@fragment
fn fs(i: VOut) -> @location(0) vec4f {
  let kind = i.prm.z;
  let half = i.rect.zw * 0.5;
  let r = min(i.prm.x, min(half.x, half.y));
  let d = sd_rounded_box(i.lp, half, r);
  let cov = clamp(0.5 - d, 0.0, 1.0);

  if (kind > 0.5 && kind < 1.5) {
    // Glyph sampling from pure-Rust RGBA bitmap atlas
    let tc = clamp(i.t, vec2f(0.0), vec2f(1.0));
    let tex = textureSampleLevel(atlas, samp, i.uv.xy + tc * i.uv.zw, 0.0);
    let a = i.c0.a * tex.a;
    if (a < 0.01) { discard; }
    return vec4f(i.c0.rgb * a, a);
  }

  if (kind > 1.5) {
    // Outlined border ring
    let bw = max(i.prm.y, 1.0);
    let ring = cov * (1.0 - clamp(0.5 - (d + bw), 0.0, 1.0));
    let a = i.c0.a * ring;
    if (a < 0.01) { discard; }
    return vec4f(i.c0.rgb * a, a);
  }

  // Rounded filled box with optional vertical gradient & optional 1px border (prm.y > 0)
  let grad = mix(i.c0, i.c1, clamp(i.t.y, 0.0, 1.0));
  var col = grad.rgb;
  var a = grad.a * cov;
  if (i.prm.y > 0.01) {
    let inner_cov = clamp(0.5 - (d + i.prm.y), 0.0, 1.0);
    let border_mix = cov - inner_cov;
    col = mix(col, i.c1.rgb, clamp(border_mix, 0.0, 1.0));
  }
  if (a < 0.01) { discard; }
  return vec4f(col * a, a);
}
