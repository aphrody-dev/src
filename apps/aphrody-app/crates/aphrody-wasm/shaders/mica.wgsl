// Mica backdrop and rounded-rect SDF windows. Fluent UI 2 tokens:
//   #0F0F0F (bg), #1C1C1C (layer), #0078D4 (brand), #60CDFF (brand light).
// Colors are written straight to a non-sRGB canvas format.

struct Uniforms {
    // x,y = resolution in device pixels, z = time in seconds, w = window count
    info: vec4<f32>,
    // x = device pixel ratio, y = hovered window index (-1 for none)
    extra: vec4<f32>,
    // per window: x, y, w, h in device pixels
    rects: array<vec4<f32>, 32>,
    // per window: x = focused (0/1), y = hue seed
    meta: array<vec4<f32>, 32>,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

struct VsOut {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

const BG: vec3<f32> = vec3<f32>(0.0588, 0.0588, 0.0588);
const LAYER: vec3<f32> = vec3<f32>(0.1098, 0.1098, 0.1098);
const BRAND: vec3<f32> = vec3<f32>(0.0, 0.4706, 0.8314);
const BRAND_LIGHT: vec3<f32> = vec3<f32>(0.3765, 0.8039, 1.0);

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VsOut {
    var p = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
    var o: VsOut;
    o.pos = vec4<f32>(p[i], 0.0, 1.0);
    o.uv = p[i] * vec2<f32>(0.5, -0.5) + vec2<f32>(0.5, 0.5);
    return o;
}

fn hash21(p: vec2<f32>) -> f32 {
    var q = fract(p * vec2<f32>(123.34, 456.21));
    q = q + dot(q, q + 45.32);
    return fract(q.x * q.y);
}

fn value_noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let s = f * f * (3.0 - 2.0 * f);
    let a = hash21(i);
    let b = hash21(i + vec2<f32>(1.0, 0.0));
    let c = hash21(i + vec2<f32>(0.0, 1.0));
    let d = hash21(i + vec2<f32>(1.0, 1.0));
    return mix(mix(a, b, s.x), mix(c, d, s.x), s.y);
}

fn sd_round_box(p: vec2<f32>, half_size: vec2<f32>, r: f32) -> f32 {
    let q = abs(p) - half_size + vec2<f32>(r, r);
    return length(max(q, vec2<f32>(0.0, 0.0))) + min(max(q.x, q.y), 0.0) - r;
}

// Mica: a slowly drifting, low-frequency tint over the dark base, plus grain.
fn mica(px: vec2<f32>, uv: vec2<f32>) -> vec3<f32> {
    let t = u.info.z * 0.03;
    let low = value_noise(px / 420.0 + vec2<f32>(t, -t)) * 0.6 + value_noise(px / 170.0 - vec2<f32>(t, t)) * 0.4;
    var c = mix(BG, LAYER, clamp(uv.y * 0.6 + low * 0.5, 0.0, 1.0));
    c = c + BRAND * (0.045 * smoothstep(0.55, 1.0, low));
    c = c + BRAND_LIGHT * (0.012 * smoothstep(0.0, 0.4, 1.0 - uv.y) * low);
    let grain = (hash21(floor(px)) - 0.5) * 0.012;
    return c + vec3<f32>(grain, grain, grain);
}

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4<f32> {
    let res = u.info.xy;
    let px = in.uv * res;
    let dpr = max(u.extra.x, 1.0);
    var col = mica(px, in.uv);
    let count = i32(u.info.w);
    for (var i = 0; i < 32; i = i + 1) {
        if (i >= count) {
            break;
        }
        let r = u.rects[i];
        let m = u.meta[i];
        let half_size = r.zw * 0.5;
        let center = r.xy + half_size;
        let radius = 8.0 * dpr;
        let local = px - center;
        let d = sd_round_box(local, half_size, radius);
        // drop shadow, offset downward
        let sd = sd_round_box(local - vec2<f32>(0.0, 6.0 * dpr), half_size, radius);
        let shadow = exp(-max(sd, 0.0) / (14.0 * dpr)) * 0.38;
        col = mix(col, vec3<f32>(0.0, 0.0, 0.0), shadow * step(0.0, d));
        let inside = 1.0 - smoothstep(-0.75, 0.75, d);
        if (inside > 0.0) {
            // acrylic fill: the mica backdrop lifted toward the layer color
            var fill = mix(mica(px, in.uv), LAYER, 0.82) + vec3<f32>(0.018, 0.018, 0.018);
            let title_h = 32.0 * dpr;
            let in_title = step(local.y, -half_size.y + title_h);
            fill = fill + vec3<f32>(0.03, 0.03, 0.03) * in_title;
            // accent rule under the title bar for the focused window
            let rule = step(abs(local.y - (-half_size.y + title_h)), 1.0 * dpr) * m.x;
            fill = mix(fill, BRAND, rule);
            if (i32(u.extra.y) == i) {
                fill = fill + BRAND_LIGHT * 0.035;
            }
            // 1 px border; focused windows get the brand ring and a soft glow
            let ring = 1.0 - smoothstep(0.0, 1.25 * dpr, abs(d + 0.5 * dpr));
            let border = mix(vec3<f32>(0.24, 0.24, 0.24), BRAND_LIGHT, m.x);
            fill = mix(fill, border, ring * mix(0.55, 0.95, m.x));
            col = mix(col, fill, inside);
        } else if (m.x > 0.5) {
            let glow = exp(-max(d, 0.0) / (10.0 * dpr)) * 0.35;
            col = col + BRAND * glow;
        }
    }
    return vec4<f32>(clamp(col, vec3<f32>(0.0, 0.0, 0.0), vec3<f32>(1.0, 1.0, 1.0)), 1.0);
}
