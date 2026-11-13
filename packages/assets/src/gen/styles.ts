import {
  type RGB,
  Img,
  Noise,
  ramp,
  lin2s,
  toLin,
  h2,
  rng,
  hashStr,
  smooth,
  clamp,
  lerp,
  mix,
  lum,
  contrast,
} from "./core.ts";
import type { Pal } from "./themes.ts";

export const STYLES = ["mesh", "aurora", "topo", "stars", "facets"] as const;
export type Style = (typeof STYLES)[number];

export interface Size {
  w: number;
  h: number;
  name: string;
}
export const SIZES: Size[] = [
  { w: 3840, h: 2160, name: "4k" },
  { w: 2560, h: 1440, name: "qhd" },
  { w: 1080, h: 1920, name: "mobile" },
];

const c255 = (c: RGB): RGB => [c[0] * 255, c[1] * 255, c[2] * 255];

function fill(img: Img, c: RGB) {
  const [r, g, b] = c255(c);
  for (let i = 0; i < img.d.length; i += 3)
    ((img.d[i] = r), (img.d[i + 1] = g), (img.d[i + 2] = b));
}

/** Soft vertical-diagonal base gradient shared by the styles. */
function base(img: Img, p: Pal, a: RGB, b: RGB) {
  const { w, h, d } = img;
  const A = c255(a),
    B = c255(b);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const t = smooth(0, 1, (x / w) * 0.35 + (y / h) * 0.65);
      const i = (y * w + x) * 3;
      d[i] = lerp(A[0], B[0], t);
      d[i + 1] = lerp(A[1], B[1], t);
      d[i + 2] = lerp(A[2], B[2], t);
    }
}

export function mesh(
  w: number,
  h: number,
  p: Pal,
  seed: number,
  phase = 0,
  loopN = 1,
): Img {
  const img = new Img(w, h);
  const R = rng(seed);
  const N = new Noise(seed ^ 0x51);
  const n = 7;
  const pts = Array.from({ length: n }, (_, i) => {
    const col = p.blobs[i % p.blobs.length]!;
    return {
      x: 0.08 + R() * 0.84,
      y: 0.08 + R() * 0.84,
      r: 0.22 + R() * 0.2,
      ox: R() * 6.283,
      oy: R() * 6.283,
      amp: 0.05 + R() * 0.06,
      lin: [toLin(col[0]), toLin(col[1]), toLin(col[2])] as RGB,
      wt: 0.7 + R() * 0.9,
    };
  });
  const bgl: RGB = [toLin(p.bg[0]), toLin(p.bg[1]), toLin(p.bg[2])];
  const asp = w / h;
  const M = Math.max(w, h);
  const th = phase * Math.PI * 2 * loopN;
  const cx = pts.map((q) => q.x + q.amp * Math.cos(th + q.ox));
  const cy = pts.map((q) => q.y + q.amp * Math.sin(th + q.oy));
  const d = img.d;
  const sc = 2.2 / M;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const wx = (x / M) * 2.2,
        wy = (y / M) * 2.2;
      const u = x / w + 0.05 * N.fbm(wx, wy, 3),
        v = y / h + 0.05 * N.fbm(wx + 9.7, wy - 3.1, 3);
      let r = 0,
        g = 0,
        b = 0,
        ws = 0.35;
      r = bgl[0] * ws;
      g = bgl[1] * ws;
      b = bgl[2] * ws;
      for (let k = 0; k < n; k++) {
        const q = pts[k]!;
        const dx = (u - cx[k]!) * asp,
          dy = v - cy[k]!;
        const wk = q.wt * Math.exp(-(dx * dx + dy * dy) / (q.r * q.r * 0.55));
        r += q.lin[0] * wk;
        g += q.lin[1] * wk;
        b += q.lin[2] * wk;
        ws += wk;
      }
      const i = (y * w + x) * 3;
      d[i] = lin2s(r / ws);
      d[i + 1] = lin2s(g / ws);
      d[i + 2] = lin2s(b / ws);
    }
  void sc;
  return img;
}

export function aurora(
  w: number,
  h: number,
  p: Pal,
  seed: number,
  phase = 0,
  loopN = 1,
): Img {
  const img = new Img(w, h);
  base(img, p, p.bg, mix(p.bg, p.bgAlt, 0.9));
  const N = new Noise(seed);
  const R = rng(seed ^ 0xa7);
  const M = Math.max(w, h);
  const th = phase * Math.PI * 2 * loopN;
  const layers = [0, 1, 2].map((i) => {
    const c = p.dark ? p.blobs[i % 3]! : [p.primary, p.tertiary, p.accent][i % 3]!;
    return {
      y0: 0.25 + 0.22 * i + R() * 0.1,
      amp: 0.08 + R() * 0.06,
      fr: 1.2 + R() * 1.2,
      wd: 0.07 + R() * 0.05,
      ph: R() * 6.283,
      lin: [toLin(c[0]), toLin(c[1]), toLin(c[2])] as RGB,
      s: 1.3 + 0.4 * i,
    };
  });
  const d = img.d;
  for (let y = 0; y < h; y++) {
    const v = y / h;
    for (let x = 0; x < w; x++) {
      const u = x / w;
      const i = (y * w + x) * 3;
      let ar = toLin(d[i]! / 255),
        ag = toLin(d[i + 1]! / 255),
        ab = toLin(d[i + 2]! / 255);
      for (let k = 0; k < 3; k++) {
        const L = layers[k]!;
        const wob = N.fbm(
          u * 2.4 + k * 3.7 + 0.35 * Math.cos(th + k),
          (x / M) * 1.1 + 0.35 * Math.sin(th + k),
          3,
        );
        const yc =
          L.y0 + L.amp * Math.sin(u * L.fr * 6.283 + L.ph + th) + 0.12 * wob;
        const dist = (v - yc) / L.wd;
        const streak =
          0.55 + 0.45 * N.fbm(u * 14 + k * 5, v * 0.8 + 0.25 * Math.cos(th), 2);
        const a = Math.exp(-dist * dist) * streak * 0.75 * (v > yc ? 0.8 : 1);
        if (p.dark) {
          ar += L.lin[0] * a * L.s;
          ag += L.lin[1] * a * L.s;
          ab += L.lin[2] * a * L.s;
        } else {
          // light: blend toward the layer colour (additive light saturates to white)
          const t = Math.min(1, a * 0.9);
          ar += (L.lin[0] - ar) * t;
          ag += (L.lin[1] - ag) * t;
          ab += (L.lin[2] - ab) * t;
        }
      }
      d[i] = lin2s(ar);
      d[i + 1] = lin2s(ag);
      d[i + 2] = lin2s(ab);
    }
  }
  return img;
}

export function topo(w: number, h: number, p: Pal, seed: number): Img {
  const img = new Img(w, h);
  const N = new Noise(seed);
  const M = Math.max(w, h);
  const f = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      f[y * w + x] = N.fbm((x / M) * 1.8 + 3, (y / M) * 1.8 + 5, 4);
  const rp = ramp(p.ramp);
  const line = c255(
    p.dark ? mix(p.bg, p.primary, 0.75) : mix(p.bg, p.primary, 0.7),
  );
  const lineIdx = c255(
    p.dark ? mix(p.bg, p.accent, 1) : mix(p.bg, p.accent, 1),
  );
  const lw = Math.max(1, M / 2200);
  const levels = 22;
  const d = img.d;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const v = f[i]!;
      const t = clamp(v * 1.5 + 0.5);
      const ri = (t * 0.7 * 1023) | 0;
      let r = rp[ri * 3]!,
        g = rp[ri * 3 + 1]!,
        b = rp[ri * 3 + 2]!;
      const xl = x > 0 ? f[i - 1]! : v,
        xr = x < w - 1 ? f[i + 1]! : v;
      const yu = y > 0 ? f[i - w]! : v,
        yd = y < h - 1 ? f[i + w]! : v;
      const gm = Math.hypot(xr - xl, yd - yu) * 0.5 + 1e-6;
      const s = v * levels;
      const fr = s - Math.floor(s);
      const dist = Math.min(fr, 1 - fr) / (gm * levels);
      const idx = Math.round(s) % 5 === 0;
      const wpx = lw * (idx ? 1.6 : 0.9);
      const a =
        (1 - smooth(wpx * 0.5, wpx * 0.5 + 1.1, dist)) * (idx ? 0.85 : 0.55);
      const C = idx ? lineIdx : line;
      r = lerp(r, C[0], a);
      g = lerp(g, C[1], a);
      b = lerp(b, C[2], a);
      const j = i * 3;
      d[j] = r;
      d[j + 1] = g;
      d[j + 2] = b;
    }
  return img;
}

export function stars(
  w: number,
  h: number,
  p: Pal,
  seed: number,
  phase = 0,
): Img {
  const img = new Img(w, h);
  const N = new Noise(seed);
  const M = Math.max(w, h);
  const A = c255(p.bg),
    B = c255(mix(p.bg, p.bgAlt, 1));
  const [pr, pg, pb] = [toLin(p.pc[0]), toLin(p.pc[1]), toLin(p.pc[2])];
  const [tr, tg, tb] = [toLin(p.tc[0]), toLin(p.tc[1]), toLin(p.tc[2])];
  const bl: RGB = [toLin(p.bg[0]), toLin(p.bg[1]), toLin(p.bg[2])];
  const d = img.d;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = (x / M) * 2.2,
        v = (y / M) * 2.2;
      const n1 = clamp(N.fbm(u + 1, v + 2, 5) * 1.6 + 0.35);
      const n2 = clamp(N.fbm(u * 1.3 + 40, v * 1.3 + 7, 4) * 1.6 + 0.25);
      const a1 = n1 * n1 * 0.95,
        a2 = n2 * n2 * 0.9;
      const g = smooth(0, 1, y / h);
      const i = (y * w + x) * 3;
      const r = lerp(bl[0], pr, a1) * (1 - a2) + tr * a2,
        gg = lerp(bl[1], pg, a1) * (1 - a2) + tg * a2,
        b = lerp(bl[2], pb, a1) * (1 - a2) + tb * a2;
      d[i] = lerp(lin2s(r), A[0] * (1 - g) + B[0] * g, 0.15);
      d[i + 1] = lerp(lin2s(gg), A[1] * (1 - g) + B[1] * g, 0.15);
      d[i + 2] = lerp(lin2s(b), A[2] * (1 - g) + B[2] * g, 0.15);
    }
  // Stars: one jittered point per cell on three density layers, gaussian splat.
  const star = p.dark ? mix(p.bg, [1, 1, 1], 0.92) : mix(p.bg, p.primary, 0.9);
  const warm = p.dark ? mix(p.bg, p.accent, 0.95) : mix(p.bg, p.accent, 0.8);
  const S = c255(star),
    W = c255(warm);
  const layers = [
    { cell: M / 70, rad: 1.1, pr: 0.55, br: 0.85 },
    { cell: M / 34, rad: 1.6, pr: 0.45, br: 0.95 },
    { cell: M / 13, rad: 2.6, pr: 0.35, br: 1 },
  ];
  const k = M / 3840;
  layers.forEach((L, li) => {
    const cell = L.cell;
    const rad = L.rad * Math.max(0.55, k * 1.6);
    const gx = Math.ceil(w / cell) + 1,
      gy = Math.ceil(h / cell) + 1;
    for (let cy = 0; cy < gy; cy++)
      for (let cx = 0; cx < gx; cx++) {
        const hh = h2(cx, cy, seed + li * 977);
        if (
          hh >
          L.pr *
            (0.55 +
              0.45 *
                smooth(
                  -0.4,
                  0.6,
                  N.fbm(((cx * cell) / M) * 3, ((cy * cell) / M) * 3, 2),
                ))
        )
          continue;
        const sx = (cx + h2(cx, cy, 3 + li)) * cell,
          sy = (cy + h2(cx, cy, 5 + li)) * cell;
        const br = (0.35 + 0.65 * h2(cx, cy, 7 + li) ** 2.2) * L.br;
        const tw = phase
          ? 0.65 + 0.35 * Math.sin(phase * 6.283 + h2(cx, cy, 11) * 6.283)
          : 1;
        const C = h2(cx, cy, 13) < 0.28 ? W : S;
        const r2 = rad * rad,
          ext = Math.ceil(rad * 3);
        for (
          let yy = Math.max(0, Math.floor(sy - ext));
          yy <= Math.min(h - 1, Math.ceil(sy + ext));
          yy++
        )
          for (
            let xx = Math.max(0, Math.floor(sx - ext));
            xx <= Math.min(w - 1, Math.ceil(sx + ext));
            xx++
          ) {
            const dd = (xx - sx) ** 2 + (yy - sy) ** 2;
            const a =
              Math.exp(-dd / (2 * r2 * 0.5)) * br * tw * (p.dark ? 0.95 : 0.7);
            if (a < 0.004) continue;
            const j = (yy * w + xx) * 3;
            d[j] = lerp(d[j]!, C[0], a);
            d[j + 1] = lerp(d[j + 1]!, C[1], a);
            d[j + 2] = lerp(d[j + 2]!, C[2], a);
          }
      }
  });
  return img;
}

export function facets(w: number, h: number, p: Pal, seed: number): Img {
  const img = new Img(w, h);
  const N = new Noise(seed);
  const M = Math.max(w, h);
  const L = M / 30;
  const hh = (L * Math.sqrt(3)) / 2;
  const rp = ramp(p.ramp);
  const ink = c255(
    p.dark ? mix(p.bg, [1, 1, 1], 0.5) : mix(p.bg, p.primary, 0.9),
  );
  const d = img.d;
  const rr = rng(seed ^ 0x77);
  const gdir = rr() * 6.283;
  const gx = Math.cos(gdir),
    gy = Math.sin(gdir);
  const lwpx = Math.max(0.7, M / 3600);
  for (let y = 0; y < h; y++) {
    const v = y / hh;
    const j = Math.floor(v),
      fv = v - j;
    for (let x = 0; x < w; x++) {
      const u = x / L - v * 0.5;
      const i0 = Math.floor(u),
        fu = u - i0;
      const up = fu + fv > 1 ? 1 : 0;
      const cu = i0 + (up ? 2 / 3 : 1 / 3),
        cv = j + (up ? 2 / 3 : 1 / 3);
      const cxp = (cu + cv / 2) * L,
        cyp = cv * hh;
      const t0 = ((cxp / M - 0.5) * gx + (cyp / M - 0.3) * gy) * 0.9 + 0.5;
      const t = clamp(
        t0 * 0.55 +
          0.35 * N.fbm((cxp / M) * 2.2, (cyp / M) * 2.2, 3) +
          (h2(i0, j, seed + up) - 0.5) * 0.16 +
          0.05,
      );
      const ri = (t * 1023) | 0;
      const e = up
        ? Math.min(1 - fu, 1 - fv, fu + fv - 1)
        : Math.min(fu, fv, 1 - fu - fv);
      const a = (1 - smooth(lwpx * 0.5, lwpx * 0.5 + 1, e * hh)) * 0.16;
      const k = (y * w + x) * 3;
      d[k] = lerp(rp[ri * 3]!, ink[0], a);
      d[k + 1] = lerp(rp[ri * 3 + 1]!, ink[1], a);
      d[k + 2] = lerp(rp[ri * 3 + 2]!, ink[2], a);
    }
  }
  return img;
}

/** Text-safe zone as fractions of the image: x0, y0, x1, y1. */
export function safeZone(
  w: number,
  h: number,
): [number, number, number, number] {
  return w >= h ? [0.2, 0.25, 0.8, 0.75] : [0.1, 0.2, 0.9, 0.8];
}

/**
 * Legibility pass: inside the text-safe zone, clamp pixel luminance so on-surface text keeps
 * contrast >= 4.5 (WCAG 1.4.3), feathered at the edge so no seam shows.
 */
export function legibilize(img: Img, p: Pal, ratio = 4.6) {
  const { w, h, d } = img;
  const [x0, y0, x1, y1] = safeZone(w, h);
  const lt = lum(p.ink);
  const dark = lum(p.bg) < lum(p.ink);
  const limit = dark ? (lt + 0.05) / ratio - 0.05 : ratio * (lt + 0.05) - 0.05;
  const fx = 0.06 * w,
    fy = 0.06 * h;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const ex = Math.min(x - x0 * w + fx, x1 * w + fx - x) / fx;
      const ey = Math.min(y - y0 * h + fy, y1 * h + fy - y) / fy;
      const m = smooth(0, 1, Math.min(ex, ey));
      if (m <= 0) continue;
      const i = (y * w + x) * 3;
      const r = toLin(d[i]! / 255),
        g = toLin(d[i + 1]! / 255),
        b = toLin(d[i + 2]! / 255);
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (dark ? L <= limit : L >= limit) continue;
      // scale (dark) or lift (light) in linear light to hit the limit exactly
      let nr: number, ng: number, nb: number;
      if (dark) {
        const s = limit / L;
        [nr, ng, nb] = [r * s, g * s, b * s];
      } else {
        const s = (1 - limit) / (1 - L);
        [nr, ng, nb] = [1 - (1 - r) * s, 1 - (1 - g) * s, 1 - (1 - b) * s];
      }
      d[i] = lerp(d[i]!, lin2s(nr), m);
      d[i + 1] = lerp(d[i + 1]!, lin2s(ng), m);
      d[i + 2] = lerp(d[i + 2]!, lin2s(nb), m);
    }
}

export function render(
  style: Style,
  p: Pal,
  w: number,
  h: number,
  seed: number,
): Img {
  const img =
    style === "mesh"
      ? mesh(w, h, p, seed)
      : style === "aurora"
        ? aurora(w, h, p, seed)
        : style === "topo"
          ? topo(w, h, p, seed)
          : style === "stars"
            ? stars(w, h, p, seed)
            : facets(w, h, p, seed);
  legibilize(img, p);
  return img;
}

export const seedOf = (theme: string, mode: string, style: string) =>
  hashStr(`${theme}/${mode}/${style}`);
void contrast;
