import { type RGB, Noise, rng, toHex, mix, h2, clamp } from "./core.ts";
import type { Pal } from "./themes.ts";

const H = (c: RGB) => toHex(c);
const f1 = (n: number) => Math.round(n * 10) / 10;
const head = (w: number, h: number, extra = "") =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"${extra}>`;

export function svgMesh(
  p: Pal,
  seed: number,
  anim: "none" | "smil" | "css",
): string {
  const R = rng(seed);
  const W = 1920,
    Hh = 1080;
  const blobs = p.blobs.slice(0, 6).map((c, i) => ({
    c,
    x: 160 + R() * 1600,
    y: 100 + R() * 880,
    r: 380 + R() * 260,
    dx: (R() - 0.5) * 360,
    dy: (R() - 0.5) * 240,
    d: 18 + i * 3,
  }));
  let s = head(W, Hh);
  s += `<defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="110"/></filter></defs>`;
  if (anim === "css")
    s += `<style>.b{animation:m var(--d) ease-in-out infinite alternate}@keyframes m{to{transform:translate(var(--x),var(--y))}}@media (prefers-reduced-motion:reduce){.b{animation:none}}</style>`;
  s += `<rect width="${W}" height="${Hh}" fill="${H(p.bg)}"/><g filter="url(#b)">`;
  for (const b of blobs) {
    const circ = `<circle cx="${f1(b.x)}" cy="${f1(b.y)}" r="${f1(b.r)}" fill="${H(b.c)}" fill-opacity="0.9"`;
    if (anim === "smil")
      s += `${circ}><animateTransform attributeName="transform" type="translate" values="0 0;${f1(b.dx)} ${f1(b.dy)};0 0" dur="${b.d}s" repeatCount="indefinite" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.45 0 0.55 1;0.45 0 0.55 1"/></circle>`;
    else if (anim === "css")
      s += `${circ} class="b" style="--x:${f1(b.dx)}px;--y:${f1(b.dy)}px;--d:${b.d}s"/>`;
    else s += `${circ}/>`;
  }
  return s + `</g></svg>\n`;
}

export function svgWaves(p: Pal, seed: number, animated = true): string {
  const R = rng(seed);
  const W = 1920,
    Hh = 1080;
  let s =
    head(W, Hh) +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${H(p.bg)}"/><stop offset="1" stop-color="${H(mix(p.bg, p.bgAlt, 1))}"/></linearGradient></defs><rect width="${W}" height="${Hh}" fill="url(#g)"/>`;
  const n = 5;
  for (let i = 0; i < n; i++) {
    const y = 520 + i * 110,
      a = 40 + R() * 40,
      per = 960 / (1 + Math.floor(R() * 2)),
      ph = R() * 6.28;
    let d = `M-${per * 2} ${Hh}V${f1(y)}`;
    for (let x = -per * 2; x <= W + per * 2; x += 40)
      d += `L${x} ${f1(y + a * Math.sin((x / per) * Math.PI * 2 + ph))}`;
    d += `V${Hh}Z`;
    const col = H(mix(p.bg, p.blobs[i % p.blobs.length]!, 0.35 + 0.1 * i));
    s += `<path fill="${col}" fill-opacity="0.8" d="${d}">${animated ? `<animateTransform attributeName="transform" type="translate" from="0 0" to="${per} 0" dur="${24 + i * 8}s" repeatCount="indefinite"/>` : ""}</path>`;
  }
  return s + `</svg>\n`;
}

export function svgStars(p: Pal, seed: number, animated = true): string {
  const R = rng(seed);
  const W = 1920,
    Hh = 1080;
  let s = head(W, Hh);
  if (animated)
    s += `<style>.t{animation:t var(--d) ease-in-out infinite alternate}@keyframes t{from{opacity:.25}to{opacity:1}}@media (prefers-reduced-motion:reduce){.t{animation:none}}</style>`;
  s += `<defs><radialGradient id="n" cx="0.3" cy="0.4" r="0.8"><stop offset="0" stop-color="${H(mix(p.bg, p.pc, 1))}"/><stop offset="1" stop-color="${H(p.bg)}"/></radialGradient></defs><rect width="${W}" height="${Hh}" fill="url(#n)"/>`;
  const col = H(p.dark ? mix(p.bg, [1, 1, 1], 0.9) : mix(p.bg, p.primary, 0.9));
  const warm = H(mix(p.bg, p.accent, 0.9));
  for (let i = 0; i < 260; i++) {
    const r = 0.6 + R() ** 3 * 2.2;
    s += `<circle cx="${f1(R() * W)}" cy="${f1(R() * Hh)}" r="${f1(r)}" fill="${R() < 0.25 ? warm : col}" fill-opacity="${f1(0.4 + R() * 0.6)}"${animated ? ` class="t" style="--d:${f1(2 + R() * 5)}s;animation-delay:-${f1(R() * 6)}s"` : ""}/>`;
  }
  return s + `</svg>\n`;
}

/** Contour lines by marching squares on a coarse noise grid. */
export function svgTopo(p: Pal, seed: number): string {
  const W = 1920,
    Hh = 1080,
    gx = 80,
    gy = 45,
    cs = W / gx;
  const N = new Noise(seed);
  const f = (i: number, j: number) =>
    N.fbm((i / gx) * 2.4 + 3, (j / gx) * 2.4 + 5, 4);
  const g: number[][] = Array.from({ length: gy + 1 }, (_, j) =>
    Array.from({ length: gx + 1 }, (_, i) => f(i, j)),
  );
  let s = head(W, Hh) + `<rect width="${W}" height="${Hh}" fill="${H(p.bg)}"/>`;
  const levels = 14;
  for (let L = 0; L < levels; L++) {
    const lv = -0.45 + (L / (levels - 1)) * 0.9;
    let d = "";
    const interp = (
      a: number,
      b: number,
      x0: number,
      y0: number,
      x1: number,
      y1: number,
    ): [number, number] => {
      const t = (lv - a) / (b - a || 1e-9);
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    };
    for (let j = 0; j < gy; j++)
      for (let i = 0; i < gx; i++) {
        const a = g[j]![i]!,
          b = g[j]![i + 1]!,
          c = g[j + 1]![i + 1]!,
          dd = g[j + 1]![i]!;
        const idx =
          (a > lv ? 8 : 0) |
          (b > lv ? 4 : 0) |
          (c > lv ? 2 : 0) |
          (dd > lv ? 1 : 0);
        if (idx === 0 || idx === 15) continue;
        const x = i * cs,
          y = j * cs;
        const T = interp(a, b, x, y, x + cs, y),
          R = interp(b, c, x + cs, y, x + cs, y + cs),
          B = interp(dd, c, x, y + cs, x + cs, y + cs),
          Lf = interp(a, dd, x, y, x, y + cs);
        const seg: [number[], number[]][] = {
          1: [[Lf, B]],
          2: [[B, R]],
          3: [[Lf, R]],
          4: [[T, R]],
          5: [
            [Lf, T],
            [B, R],
          ],
          6: [[T, B]],
          7: [[Lf, T]],
          8: [[Lf, T]],
          9: [[T, B]],
          10: [
            [Lf, B],
            [T, R],
          ],
          11: [[T, R]],
          12: [[Lf, R]],
          13: [[B, R]],
          14: [[Lf, B]],
        }[idx]! as never;
        for (const [m, n] of seg)
          d += `M${f1(m[0]!)} ${f1(m[1]!)}L${f1(n[0]!)} ${f1(n[1]!)}`;
      }
    const col = H(
      mix(p.bg, L % 5 === 0 ? p.accent : p.primary, L % 5 === 0 ? 0.8 : 0.45),
    );
    s += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${L % 5 === 0 ? 2 : 1.2}" stroke-linecap="round"/>`;
  }
  return s + `</svg>\n`;
}

export function svgFacets(p: Pal, seed: number): string {
  const W = 1920,
    Hh = 1080,
    L = W / 16,
    hh = (L * Math.sqrt(3)) / 2;
  const N = new Noise(seed);
  const stops = p.ramp;
  const col = (t: number) => {
    const x = clamp(t) * (stops.length - 1),
      k = Math.min(Math.floor(x), stops.length - 2);
    return H(mix(stops[k]!, stops[k + 1]!, x - k));
  };
  let s = head(W, Hh) + `<rect width="${W}" height="${Hh}" fill="${H(p.bg)}"/>`;
  const pt = (u: number, v: number) => `${f1((u + v / 2) * L)},${f1(v * hh)}`;
  for (let j = -1; j < Hh / hh + 1; j++)
    for (let i = -Math.ceil(j / 2) - 1; i < W / L + 1; i++)
      for (const up of [0, 1]) {
        const cu = i + (up ? 2 / 3 : 1 / 3),
          cv = j + (up ? 2 / 3 : 1 / 3);
        const cx = (cu + cv / 2) * L,
          cy = cv * hh;
        const t =
          (cx / W) * 0.45 +
          (cy / Hh) * 0.25 +
          0.3 * N.fbm((cx / W) * 2.2, (cy / W) * 2.2, 3) +
          (h2(i, j, seed + up) - 0.5) * 0.16 +
          0.1;
        const pts = up
          ? [pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)]
          : [pt(i, j), pt(i + 1, j), pt(i, j + 1)];
        const c = col(t);
        s += `<polygon points="${pts.join(" ")}" fill="${c}" stroke="${c}" stroke-width="0.6"/>`;
      }
  return s + `</svg>\n`;
}

export const PATTERNS = [
  "dots",
  "grid",
  "hex",
  "diagonal",
  "plus",
  "waves",
  "triangles",
  "rings",
] as const;
export function svgPattern(kind: (typeof PATTERNS)[number], p: Pal): string {
  const bg = H(p.bg),
    fg = H(mix(p.bg, p.dark ? p.primary : p.primary, p.dark ? 0.35 : 0.3));
  const S = 48;
  const body: Record<string, string> = {
    dots: `<circle cx="24" cy="24" r="2.5" fill="${fg}"/>`,
    grid: `<path d="M48 0V48H0" fill="none" stroke="${fg}" stroke-width="1"/>`,
    hex: `<path d="M24 2l20 12v20L24 46 4 34V14z" fill="none" stroke="${fg}" stroke-width="1"/>`,
    diagonal: `<path d="M-6 6L6 -6M0 48L48 0M42 54L54 42" stroke="${fg}" stroke-width="1.5"/>`,
    plus: `<path d="M24 18v12M18 24h12" stroke="${fg}" stroke-width="2" stroke-linecap="round"/>`,
    waves: `<path d="M0 24q12-14 24 0t24 0" fill="none" stroke="${fg}" stroke-width="1.5"/>`,
    triangles: `<path d="M24 8l16 28H8z" fill="none" stroke="${fg}" stroke-width="1"/>`,
    rings: `<circle cx="24" cy="24" r="14" fill="none" stroke="${fg}" stroke-width="1"/><circle cx="24" cy="24" r="6" fill="none" stroke="${fg}" stroke-width="1"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}"><rect width="${S}" height="${S}" fill="${bg}"/>${body[kind]}</svg>\n`;
}

/** Animated spinners (SMIL, no JS, no Lottie), colored by currentColor. */
export const SPINNERS: Record<string, string> = {
  ring: `<circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-opacity=".2" stroke-width="4"/><circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="28 86"><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1s" repeatCount="indefinite"/></circle>`,
  arc: `<circle cx="24" cy="24" r="18" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 113"><animate attributeName="stroke-dasharray" values="1 113;80 33;1 113" dur="1.6s" repeatCount="indefinite"/><animate attributeName="stroke-dashoffset" values="0;-30;-113" dur="1.6s" repeatCount="indefinite"/><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="2s" repeatCount="indefinite"/></circle>`,
  dots: [0, 1, 2]
    .map(
      (i) =>
        `<circle cx="${10 + i * 14}" cy="24" r="4" fill="currentColor"><animate attributeName="cy" values="24;14;24;24" keyTimes="0;.25;.5;1" dur="1s" begin="${i * 0.15}s" repeatCount="indefinite"/><animate attributeName="fill-opacity" values="1;.4;1;1" keyTimes="0;.25;.5;1" dur="1s" begin="${i * 0.15}s" repeatCount="indefinite"/></circle>`,
    )
    .join(""),
  bars: [0, 1, 2, 3]
    .map(
      (i) =>
        `<rect x="${9 + i * 9}" y="12" width="5" height="24" rx="2.5" fill="currentColor"><animate attributeName="height" values="24;10;24" dur=".9s" begin="${i * 0.12}s" repeatCount="indefinite"/><animate attributeName="y" values="12;19;12" dur=".9s" begin="${i * 0.12}s" repeatCount="indefinite"/></rect>`,
    )
    .join(""),
  orbit: `<circle cx="24" cy="24" r="5" fill="currentColor"/><g><circle cx="24" cy="6" r="3.5" fill="currentColor"/><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="360 24 24" dur="1.2s" repeatCount="indefinite"/></g><g><circle cx="24" cy="42" r="2.5" fill="currentColor" fill-opacity=".5"/><animateTransform attributeName="transform" type="rotate" from="0 24 24" to="-360 24 24" dur="1.8s" repeatCount="indefinite"/></g>`,
  pulse: `<circle cx="24" cy="24" r="6" fill="currentColor"/><circle cx="24" cy="24" r="6" fill="none" stroke="currentColor" stroke-width="3"><animate attributeName="r" values="6;22" dur="1.2s" repeatCount="indefinite"/><animate attributeName="stroke-opacity" values=".8;0" dur="1.2s" repeatCount="indefinite"/></circle>`,
};
export const svgSpinner = (k: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" role="img" aria-label="Loading">${SPINNERS[k]}</svg>\n`;

/** Abstract geometric glyphs per surface (original shapes, no third-party marks). */
export const GLYPHS: Record<string, string> = {
  aphrody: `<circle cx="50" cy="50" r="24" fill="none" stroke="#fff" stroke-width="9"/><circle cx="50" cy="50" r="7" fill="#fff"/>`,
  nt: `<path d="M30 70V30h12l16 26V30h12v40H58L42 44v26z" fill="#fff"/>`,
  yolo: `<path d="M50 24L78 72H22z" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>`,
  game: `<path d="M50 20l26 15v30L50 80 24 65V35z" fill="none" stroke="#fff" stroke-width="8" stroke-linejoin="round"/><circle cx="50" cy="50" r="7" fill="#fff"/>`,
  shenron: `<path d="M50 20L80 50 50 80 20 50z" fill="none" stroke="#fff" stroke-width="9" stroke-linejoin="round"/>`,
  rosegriffon: `<g fill="none" stroke="#fff" stroke-width="6"><circle cx="50" cy="38" r="15"/><circle cx="39" cy="58" r="15"/><circle cx="61" cy="58" r="15"/></g>`,
};

export function svgIcon(app: string, p: Pal): string {
  const a = H(mix(p.bg, p.primary, p.dark ? 0.9 : 1)),
    b = H(mix(p.primary, p.dark ? p.tertiary : p.accent, 0.8));
  const c2 = p.dark ? H(mix(p.pc, p.accent, 0.5)) : H(p.primary);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.dark ? c2 : a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#g)"/>${GLYPHS[app]}</svg>\n`;
}

export function svgLoading(app: string, p: Pal, seed: number): string {
  const inner = svgMesh(p, seed, "smil")
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  const sp = SPINNERS.ring!;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" preserveAspectRatio="xMidYMid slice">${inner}<g transform="translate(810 290) scale(3)">${GLYPHS[app]!.replace(/#fff/g, H(p.ink))}</g><g transform="translate(936 700)" color="${H(p.ink)}">${sp}</g></svg>\n`;
}
