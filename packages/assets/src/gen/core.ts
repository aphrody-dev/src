/** Deterministic primitives for the procedural generators: PRNG, noise, color (OKLab), PNG, WCAG. */
import { deflateSync } from "node:zlib";

export type RGB = [number, number, number];

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++)
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer hash to [0,1), stateless (for per-cell and per-pixel randomness). */
export function h2(x: number, y: number, s = 0): number {
  let h =
    Math.imul(x | 0, 0x27d4eb2d) ^
    Math.imul(y | 0, 0x165667b1) ^
    Math.imul(s | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const G = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Seeded 2D gradient (Perlin) noise in about [-1,1] and fractal sums. */
export class Noise {
  private p = new Uint8Array(512);
  constructor(seed: number) {
    const r = rng(seed);
    const a = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    for (let i = 0; i < 512; i++) this.p[i] = a[i & 255]!;
  }
  n(x: number, y: number): number {
    const xi = Math.floor(x),
      yi = Math.floor(y);
    const xf = x - xi,
      yf = y - yi;
    const X = xi & 255,
      Y = yi & 255;
    const p = this.p;
    const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
    const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);
    const g = (h: number, dx: number, dy: number) => {
      const q = G[h & 7]!;
      return q[0] * dx + q[1] * dy;
    };
    const aa = p[p[X]! + Y]!,
      ab = p[p[X]! + Y + 1]!,
      ba = p[p[X + 1]! + Y]!,
      bb = p[p[X + 1]! + Y + 1]!;
    const x1 = g(aa, xf, yf) + u * (g(ba, xf - 1, yf) - g(aa, xf, yf));
    const x2 =
      g(ab, xf, yf - 1) + u * (g(bb, xf - 1, yf - 1) - g(ab, xf, yf - 1));
    return (x1 + v * (x2 - x1)) * 1.1;
  }
  fbm(x: number, y: number, oct = 5, gain = 0.5): number {
    let s = 0,
      a = 0.5,
      f = 1,
      n = 0;
    for (let i = 0; i < oct; i++) {
      s += a * this.n(x * f + i * 17.3, y * f - i * 9.1);
      n += a;
      a *= gain;
      f *= 2;
    }
    return s / n;
  }
}

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function hex(h: string): RGB {
  const n = parseInt(h.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}
export function toHex(c: RGB): string {
  const b = (v: number) =>
    Math.round(clamp(v) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${b(c[0])}${b(c[1])}${b(c[2])}`.toUpperCase();
}

export const toLin = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
export const toSrgb = (v: number) =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;

export function lum(c: RGB): number {
  return 0.2126 * toLin(c[0]) + 0.7152 * toLin(c[1]) + 0.0722 * toLin(c[2]);
}
export function contrast(a: number, b: number): number {
  const hi = Math.max(a, b),
    lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

export function toLab(c: RGB): RGB {
  const r = toLin(c[0]),
    g = toLin(c[1]),
    b = toLin(c[2]);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
export function fromLab(c: RGB): RGB {
  const l = (c[0] + 0.3963377774 * c[1] + 0.2158037573 * c[2]) ** 3;
  const m = (c[0] - 0.1055613458 * c[1] - 0.0638541728 * c[2]) ** 3;
  const s = (c[0] - 0.0894841775 * c[1] - 1.291485548 * c[2]) ** 3;
  return [
    toSrgb(clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    toSrgb(clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    toSrgb(clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}
export function mix(a: RGB, b: RGB, t: number): RGB {
  const x = toLab(a),
    y = toLab(b);
  return fromLab([
    lerp(x[0], y[0], t),
    lerp(x[1], y[1], t),
    lerp(x[2], y[2], t),
  ]);
}

/** 1024-entry color ramp through the stops (OKLab interpolation), flat sRGB 0..255 triplets. */
export function ramp(stops: RGB[], n = 1024): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (stops.length - 1);
    const k = Math.min(Math.floor(t), stops.length - 2);
    const c = mix(stops[k]!, stops[k + 1]!, t - k);
    out[i * 3] = c[0] * 255;
    out[i * 3 + 1] = c[1] * 255;
    out[i * 3 + 2] = c[2] * 255;
  }
  return out;
}

/** Linear-light to sRGB (0..255) lookup for blended accumulation. */
export const LIN2S = (() => {
  const t = new Float32Array(4097);
  for (let i = 0; i <= 4096; i++) t[i] = toSrgb(i / 4096) * 255;
  return t;
})();
export const lin2s = (v: number) =>
  LIN2S[Math.min(4096, Math.max(0, (v * 4096 + 0.5) | 0))]!;

/** Float RGB image, sRGB 0..255 per channel. */
export class Img {
  d: Float32Array;
  constructor(
    public w: number,
    public h: number,
  ) {
    this.d = new Float32Array(w * h * 3);
  }
  /** Quantize to 8 bits with deterministic blue-ish dither (kills banding in smooth gradients). */
  rgb8(seed = 1): Uint8Array {
    const { w, h, d } = this;
    const o = new Uint8Array(w * h * 3);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const dv = h2(x, y, seed) + h2(x + 7919, y + 104729, seed) - 1;
        const i = (y * w + x) * 3;
        for (let k = 0; k < 3; k++) {
          const v = d[i + k]! + dv * 0.9;
          o[i + k] = v < 0 ? 0 : v > 255 ? 255 : (v + 0.5) | 0;
        }
      }
    return o;
  }
}

const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]!) & 255]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Minimal deterministic PNG writer (8-bit RGB, filter 0, no metadata). */
export function png(
  rgb: Uint8Array,
  w: number,
  h: number,
  level = 1,
): Uint8Array {
  const raw = new Uint8Array((w * 3 + 1) * h);
  for (let y = 0; y < h; y++)
    raw.set(rgb.subarray(y * w * 3, (y + 1) * w * 3), y * (w * 3 + 1) + 1);
  const z = new Uint8Array(deflateSync(raw, { level }));
  const chunk = (type: string, data: Uint8Array) => {
    const o = new Uint8Array(12 + data.length);
    const dv = new DataView(o.buffer);
    dv.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) o[4 + i] = type.charCodeAt(i);
    o.set(data, 8);
    dv.setUint32(8 + data.length, crc32(o.subarray(4, 8 + data.length)));
    return o;
  };
  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w);
  dv.setUint32(4, h);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const parts = [
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", z),
    chunk("IEND", new Uint8Array(0)),
  ];
  const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0));
  let off = 0;
  for (const p of parts) (out.set(p, off), (off += p.length));
  return out;
}

export async function sha256hex(b: Uint8Array | string): Promise<string> {
  const h = new Bun.CryptoHasher("sha256");
  h.update(b);
  return h.digest("hex");
}
