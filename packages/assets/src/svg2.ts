// W3C SVG 2 Candidate Recommendation (https://www.w3.org/TR/2026/CR-SVG2-20261006/) validator,
// optimizer (`svgo`), and cel-shaded vector contour serializer (MCU QuantizerCelebi -> quadratic splines).
import {
  QuantizerCelebi,
  hexFromArgb,
} from "@material/material-color-utilities";
import { optimize as svgoOptimize } from "svgo";

export interface Svg2Report {
  ok: boolean;
  errors: string[];
  bytes: number;
  hasViewBox: boolean;
  hasTitleOrHidden: boolean;
}

/** Checks an SVG string against W3C CR-SVG2-20261006 authoring requirements. */
export function validateSvg2(svg: string, name = "image.svg"): Svg2Report {
  const errors: string[] = [];
  const trimmed = svg.trim();
  if (!trimmed.startsWith("<svg"))
    errors.push(`${name}: must start with <svg> root element`);
  if (!/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/.test(trimmed)) {
    errors.push(
      `${name}: missing SVG namespace xmlns="http://www.w3.org/2000/svg"`,
    );
  }
  const hasViewBox = /\bviewBox="[-\d.\s]+"/.test(trimmed);
  if (!hasViewBox) errors.push(`${name}: missing explicit viewBox attribute`);

  // SVG 2 deprecates XLink in favor of plain `href` in the default namespace
  if (/\bxlink:href\b|\bxmlns:xlink\b/.test(trimmed)) {
    errors.push(
      `${name}: deprecated SVG 1.1 XLink attribute (use plain href per CR-SVG2-20261006)`,
    );
  }
  // Reject base64 raster embeds masquerading as SVGs
  if (/<image\b[^>]*data:image\//i.test(trimmed)) {
    errors.push(
      `${name}: embedded base64 raster <image> forbidden; convert to pure vector geometry`,
    );
  }
  const hasTitleOrHidden =
    /<title>[\s\S]*?<\/title>/.test(trimmed) ||
    /\baria-hidden="true"/.test(trimmed) ||
    /\brole="img"/.test(trimmed);

  return {
    ok: errors.length === 0,
    errors,
    bytes: new TextEncoder().encode(svg).byteLength,
    hasViewBox,
    hasTitleOrHidden,
  };
}

/** Optimizes an SVG strictly preserving SVG 2 `viewBox`, `<title>`, `aria-hidden`, IDs/`<symbol>`, and plain `href`. */
export function optimizeSvg2(
  svg: string,
  opts: { removeDimensions?: boolean } = {},
): string {
  const plugins: unknown[] = [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          removeUselessDefs: false,
          removeHiddenElems: false,
          removeUnknownsAndDefaults: {
            keepRoleAttr: true,
            keepAriaAttrs: true,
          },
        },
      },
    },
  ];
  if (opts.removeDimensions !== false) plugins.push("removeDimensions");
  const res = svgoOptimize(svg, {
    multipass: true,
    floatPrecision: 2,
    plugins: plugins as never,
  });
  return res.data;
}

function rdp(pts: [number, number][], eps: number): [number, number][] {
  if (pts.length <= 3) return pts;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  let maxD = 0;
  let idx = 0;
  const dx = last[0] - first[0];
  const dy = last[1] - first[1];
  const lenSq = dx * dx + dy * dy;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const d =
      lenSq === 0
        ? Math.hypot(p[0] - first[0], p[1] - first[1])
        : Math.abs(
            dy * p[0] - dx * p[1] + last[0] * first[1] - last[1] * first[0],
          ) / Math.sqrt(lenSq);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > eps) {
    const left = rdp(pts.slice(0, idx + 1), eps);
    const right = rdp(pts.slice(idx), eps);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function rdpClosed(loop: [number, number][], eps: number): [number, number][] {
  if (loop.length < 5) return loop;
  let a = 0;
  let b = Math.floor(loop.length / 2);
  let bestD = 0;
  const step = Math.max(1, Math.floor(loop.length / 16));
  for (let i = 0; i < loop.length; i += step) {
    const p = loop[i]!;
    for (let j = i + 1; j < loop.length; j += step) {
      const q = loop[j]!;
      const d = (p[0] - q[0]) ** 2 + (p[1] - q[1]) ** 2;
      if (d > bestD) {
        bestD = d;
        a = i;
        b = j;
      }
    }
  }
  const s1 =
    a < b ? loop.slice(a, b + 1) : [...loop.slice(a), ...loop.slice(0, b + 1)];
  const s2 =
    a < b ? [...loop.slice(b), ...loop.slice(0, a + 1)] : loop.slice(b, a + 1);
  return [...rdp(s1, eps).slice(0, -1), ...rdp(s2, eps).slice(0, -1)];
}

/** Converts RGBA pixels into a clean W3C SVG 2 pure vector `<path>` illustration (zero `<image>` embeds). */
export function vectorizeRgbaToSvg2(
  rgba: Uint8Array,
  w: number,
  h: number,
  opts: { title?: string; maxColors?: number } = {},
): { svg: string; palette: string[]; pathCount: number } {
  const maxColors = opts.maxColors ?? 12;
  const nPix = w * h;
  const opaquePixels: number[] = [];
  const pixArgb = new Int32Array(nPix);
  for (let i = 0; i < nPix; i++) {
    const r = rgba[i * 4]!;
    const g = rgba[i * 4 + 1]!;
    const b = rgba[i * 4 + 2]!;
    const a = rgba[i * 4 + 3]!;
    if (a < 135) {
      pixArgb[i] = -1;
      continue;
    }
    const argb = ((255 << 24) | (r << 16) | (g << 8) | b) >>> 0;
    pixArgb[i] = argb;
    opaquePixels.push(argb);
  }
  if (opaquePixels.length === 0) {
    return {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img"><title>${opts.title ?? "Empty vector"}</title></svg>`,
      palette: [],
      pathCount: 0,
    };
  }

  const qMap = QuantizerCelebi.quantize(opaquePixels, maxColors);
  const palRgb = [...qMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([c]) => {
      const r = (c >> 16) & 255;
      const g = (c >> 8) & 255;
      const b = c & 255;
      return [
        r,
        g,
        b,
        hexFromArgb(c).toUpperCase(),
        0.2126 * r + 0.7152 * g + 0.0722 * b,
      ] as const;
    });

  const idxGrid = new Int16Array(nPix).fill(-1);
  for (let i = 0; i < nPix; i++) {
    const argb = pixArgb[i]!;
    if (argb === -1) continue;
    const r = (argb >> 16) & 255;
    const g = (argb >> 8) & 255;
    const b = argb & 255;
    let best = 0;
    let bestD = 1e9;
    for (let k = 0; k < palRgb.length; k++) {
      const [pr, pg, pb] = palRgb[k]!;
      const d =
        (r - pr) ** 2 * 0.299 + (g - pg) ** 2 * 0.587 + (b - pb) ** 2 * 0.114;
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    idxGrid[i] = best;
  }

  // Majority filter clears isolated 1px anti-aliasing noise before contour tracing
  const smoothed = new Int16Array(idxGrid);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const c = idxGrid[y * w + x]!;
      if (c === -1) continue;
      let same = 0;
      const tally = new Map<number, number>();
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nb = idxGrid[(y + dy) * w + (x + dx)]!;
          if (nb === -1) continue;
          if (nb === c) same++;
          tally.set(nb, (tally.get(nb) ?? 0) + 1);
        }
      }
      if (same <= 2) {
        let bestK = c;
        let bestV = 0;
        for (const [k, v] of tally) {
          if (v > bestV) {
            bestV = v;
            bestK = k;
          }
        }
        smoothed[y * w + x] = bestK;
      }
    }
  }

  const counts = new Int32Array(palRgb.length);
  for (let i = 0; i < nPix; i++) if (smoothed[i]! >= 0) counts[smoothed[i]!]++;

  const darkest = palRgb.reduce(
    (best, p, i) => (p[4] < palRgb[best]![4] ? i : best),
    0,
  );
  const layerOrder = palRgb
    .map((_, k) => k)
    .filter((k) => counts[k]! >= 6)
    .sort((a, b) => counts[b]! - counts[a]!);

  const traceMask = (
    inMask: (x: number, y: number) => boolean,
    smoothEps = 0.5,
  ): string => {
    const outEdges = new Map<number, number[]>();
    const vkey = (x: number, y: number) => y * (w + 1) + x;
    const addEdge = (x0: number, y0: number, x1: number, y1: number) => {
      const k = vkey(x0, y0);
      let list = outEdges.get(k);
      if (!list) {
        list = [];
        outEdges.set(k, list);
      }
      list.push(vkey(x1, y1));
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (!inMask(x, y)) continue;
        if (!inMask(x, y - 1)) addEdge(x, y, x + 1, y);
        if (!inMask(x + 1, y)) addEdge(x + 1, y, x + 1, y + 1);
        if (!inMask(x, y + 1)) addEdge(x + 1, y + 1, x, y + 1);
        if (!inMask(x - 1, y)) addEdge(x, y + 1, x, y);
      }
    }
    const loops: [number, number][][] = [];
    for (const [startK, starts] of outEdges) {
      while (starts.length > 0) {
        const loop: [number, number][] = [];
        let cur = startK;
        let next = starts.pop()!;
        let prevDx = (next % (w + 1)) - (cur % (w + 1));
        let prevDy = Math.floor(next / (w + 1)) - Math.floor(cur / (w + 1));
        loop.push([cur % (w + 1), Math.floor(cur / (w + 1))]);
        cur = next;
        let guard = 0;
        while (cur !== startK && guard++ < nPix * 4) {
          const cx = cur % (w + 1);
          const cy = Math.floor(cur / (w + 1));
          loop.push([cx, cy]);
          const cand = outEdges.get(cur);
          if (!cand || cand.length === 0) break;
          let pickIdx = 0;
          if (cand.length > 1) {
            for (let i = 0; i < cand.length; i++) {
              const nk = cand[i]!;
              const dx = (nk % (w + 1)) - cx;
              const dy = Math.floor(nk / (w + 1)) - cy;
              if (prevDx * dy - prevDy * dx > 0) {
                pickIdx = i;
                break;
              }
            }
          }
          next = cand.splice(pickIdx, 1)[0]!;
          prevDx = (next % (w + 1)) - cx;
          prevDy = Math.floor(next / (w + 1)) - cy;
          cur = next;
        }
        if (loop.length >= 4) loops.push(loop);
      }
    }
    let dAll = "";
    for (const rawLoop of loops) {
      const simp: [number, number][] = [];
      const m = rawLoop.length;
      for (let i = 0; i < m; i++) {
        const p0 = rawLoop[(i - 1 + m) % m]!;
        const p1 = rawLoop[i]!;
        const p2 = rawLoop[(i + 1) % m]!;
        if (
          (p1[0] - p0[0]) * (p2[1] - p1[1]) -
            (p1[1] - p0[1]) * (p2[0] - p1[0]) !==
          0
        )
          simp.push(p1);
      }
      if (simp.length < 3) continue;
      let minX = w,
        maxX = 0,
        minY = h,
        maxY = 0;
      for (const [px, py] of simp) {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
      if ((maxX - minX) * (maxY - minY) <= 4) continue;
      let pts = rdpClosed(simp, smoothEps);
      if (pts.length < 3) continue;
      const nxt: [number, number][] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i]!;
        const b = pts[(i + 1) % pts.length]!;
        nxt.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]]);
        nxt.push([0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
      }
      pts = nxt;
      const n = pts.length;
      const mid = (
        a: [number, number],
        b: [number, number],
      ): [number, number] => [(a[0] + b[0]) * 0.5, (a[1] + b[1]) * 0.5];
      const f = (v: number) => Number(v.toFixed(1));
      const m0 = mid(pts[n - 1]!, pts[0]!);
      let d = `M${f(m0[0])} ${f(m0[1])}`;
      for (let i = 0; i < n; i++) {
        const c = pts[i]!;
        const e = mid(c, pts[(i + 1) % n]!);
        d += `Q${f(c[0])} ${f(c[1])} ${f(e[0])} ${f(e[1])}`;
      }
      dAll += d + "Z";
    }
    return dAll;
  };

  const silD = traceMask(
    (x, y) => x >= 0 && y >= 0 && x < w && y < h && smoothed[y * w + x]! >= 0,
    0.45,
  );
  const layers: { color: string; d: string }[] = [];
  if (silD) layers.push({ color: palRgb[darkest]![3], d: silD });
  for (const k of layerOrder) {
    if (k === darkest) continue;
    const d = traceMask(
      (x, y) => x >= 0 && y >= 0 && x < w && y < h && smoothed[y * w + x] === k,
      0.5,
    );
    if (d) layers.push({ color: palRgb[k]![3], d });
  }

  const title = opts.title ? `<title>${opts.title}</title>` : "";
  const paths = layers
    .map((l) => `<path fill="${l.color}" fill-rule="evenodd" d="${l.d}"/>`)
    .join("");
  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img">${title}${paths}</svg>`;
  return {
    svg: optimizeSvg2(rawSvg),
    palette: layerOrder.map((k) => palRgb[k]![3]),
    pathCount: layers.length,
  };
}
