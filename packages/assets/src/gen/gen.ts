#!/usr/bin/env bun
/**
 * Procedural wallpapers and backgrounds. Zero npm deps, deterministic per (theme, mode, style).
 *   bun run --cwd packages/assets gen <stills|svg|brand|textures|video|gif|index|validate|all> [--theme=a,b] [--style=..] [--size=4k,qhd,mobile] [--jobs=N]
 * Small files go to assets/generated (git); large ones to $WALLPAPER_STORE (default var/wallpapers, mirrored to fr1 /srv/artifacts/wallpapers).
 * Needs `ffmpeg` (libaom-av1, libsvtav1, libvpx-vp9, gif; no GPL codec is used) for AVIF, video and GIF.
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, dirname, relative } from "node:path";
import {
  Img,
  png,
  rng,
  hashStr,
  sha256hex,
  lum,
  contrast,
  toLin,
  clamp,
  smooth,
  lerp,
  Noise,
  ramp,
  mix,
  h2,
  type RGB,
} from "./core.ts";
import {
  loadThemes,
  palette,
  THEMES,
  MODES,
  APP_THEME,
  type Mode,
  type Pal,
} from "./themes.ts";
import {
  STYLES,
  SIZES,
  render,
  mesh,
  aurora,
  legibilize,
  safeZone,
  seedOf,
  type Style,
} from "./styles.ts";
import {
  svgMesh,
  svgWaves,
  svgStars,
  svgTopo,
  svgFacets,
  svgPattern,
  PATTERNS,
  SPINNERS,
  svgSpinner,
  svgIcon,
  svgLoading,
  GLYPHS,
} from "./svg.ts";

const root =
  process.env.SRC_ROOT ?? join(import.meta.dir, "..", "..", "..", "..");
const OUT = join(root, "assets", "generated");
const STORE = process.env.WALLPAPER_STORE ?? join(root, "var", "wallpapers");
const CDN = "https://cdn.aphrody.com/wallpapers/v1/";
const FFMPEG = process.env.FFMPEG ?? "ffmpeg";
const GENERATOR = "aphrody-assets-gen";
const themesPath =
  process.env.THEMES_JSON ??
  join(root, "packages", "design", "tokens", "themes.json");

const [cmd = "all", ...args] = Bun.argv.slice(2);
const opt = (n: string) =>
  args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const list = (n: string, all: readonly string[]) =>
  opt(n) ? opt(n)!.split(",") : [...all];
const themes = list("theme", THEMES);
const styles = list("style", STYLES) as Style[];
const sizes = SIZES.filter((s) =>
  list(
    "size",
    SIZES.map((x) => x.name),
  ).includes(s.name),
);
const tf = await loadThemes(themesPath);

const mk = (f: string) => (mkdirSync(dirname(f), { recursive: true }), f);
const put = async (f: string, d: Uint8Array | string) => (
  await Bun.write(mk(f), d),
  f
);
const Image = (
  Bun as unknown as {
    Image: new (b: Uint8Array) => {
      webp(o: object): { bytes(): Promise<Uint8Array> };
      resize(w: number, h: number): unknown;
    };
  }
).Image;

async function ff(args: string[], input?: Uint8Array): Promise<Uint8Array> {
  const p = Bun.spawn([FFMPEG, "-v", "error", "-nostdin", "-y", ...args], {
    stdin: input ?? "ignore",
    stdout: "pipe",
    stderr: "pipe",
  });
  const [out, err] = await Promise.all([
    new Response(p.stdout).bytes(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  if (p.exitCode)
    throw new Error(`ffmpeg ${args.join(" ")}: ${err.slice(0, 400)}`);
  return out;
}
const tmpf = (n: string) =>
  join(
    process.env.TMPDIR ?? process.env.TEMP ?? "/tmp",
    `wg-${process.pid}-${n}`,
  );

async function avif(pngBytes: Uint8Array, dest: string, crf = 34) {
  const t = tmpf("in.png"),
    o = tmpf("out.avif");
  await Bun.write(t, pngBytes);
  await ff([
    "-i",
    t,
    "-c:v",
    "libaom-av1",
    "-crf",
    String(crf),
    "-b:v",
    "0",
    "-cpu-used",
    "6",
    "-still-picture",
    "1",
    "-pix_fmt",
    "yuv420p10le",
    "-frames:v",
    "1",
    o,
  ]);
  await Bun.write(mk(dest), Bun.file(o));
}
async function webp(
  pngBytes: Uint8Array,
  dest: string,
  q = 82,
  size?: [number, number],
) {
  let im: any = new Image(pngBytes);
  if (size) im = im.resize(size[0], size[1]);
  await put(dest, await im.webp({ quality: q }).bytes());
}

function minContrast(img: Img, p: Pal): number {
  const [x0, y0, x1, y1] = safeZone(img.w, img.h);
  let worst = 99;
  const lt = lum(p.ink);
  for (let y = Math.floor(y0 * img.h); y < y1 * img.h; y += 5)
    for (let x = Math.floor(x0 * img.w); x < x1 * img.w; x += 5) {
      const i = (y * img.w + x) * 3;
      const L =
        0.2126 * toLin(img.d[i]! / 255) +
        0.7152 * toLin(img.d[i + 1]! / 255) +
        0.0722 * toLin(img.d[i + 2]! / 255);
      worst = Math.min(worst, contrast(L, lt));
    }
  return Math.round(worst * 100) / 100;
}

// ---------------------------------------------------------------- stills
async function stills() {
  const jobs = Number(opt("jobs") ?? 0);
  if (jobs > 1 && !opt("shard")) {
    const ps = Array.from({ length: jobs }, (_, i) =>
      Bun.spawn(
        [
          process.execPath,
          import.meta.path,
          "stills",
          `--shard=${i}/${jobs}`,
          ...args.filter((a) => !a.startsWith("--jobs")),
        ],
        { stdout: "inherit", stderr: "inherit", env: process.env },
      ),
    );
    await Promise.all(ps.map((p) => p.exited));
    return;
  }
  const [si, sn] = (opt("shard") ?? "0/1").split("/").map(Number) as [
    number,
    number,
  ];
  let k = 0;
  for (const theme of themes)
    for (const mode of MODES)
      for (const style of styles) {
        if (k++ % sn !== si) continue;
        const p = palette(tf, theme, mode);
        for (const sz of sizes) {
          const id = `${theme}-${mode}-${style}`;
          const dest = join(STORE, "wallpapers", sz.name, id);
          if (
            existsSync(`${dest}.avif`) &&
            existsSync(`${dest}.webp`) &&
            !args.includes("--force")
          )
            continue;
          const img = render(style, p, sz.w, sz.h, seedOf(theme, mode, style));
          const mc = minContrast(img, p);
          const pg = png(img.rgb8(), sz.w, sz.h);
          await webp(pg, `${dest}.webp`, 80);
          await avif(pg, `${dest}.avif`);
          await put(
            `${dest}.json`,
            JSON.stringify({ w: sz.w, h: sz.h, minContrast: mc }),
          );
          if (sz.name !== "qhd") {
            const tw = sz.name === "mobile" ? [180, 320] : [480, 270];
            await webp(
              pg,
              join(
                OUT,
                "wallpapers",
                "thumbs",
                `${id}-${sz.name === "mobile" ? "m" : "d"}.webp`,
              ),
              70,
              tw as [number, number],
            );
          }
          console.log(`${sz.name} ${id} contrast ${mc}`);
        }
      }
}

// ---------------------------------------------------------------- svg, patterns, spinners, icons, loading
async function svgs() {
  for (const theme of themes)
    for (const mode of MODES) {
      const p = palette(tf, theme, mode),
        id = `${theme}-${mode}`,
        s = (k: string) => hashStr(`${id}/${k}`);
      const d = join(OUT, "svg");
      await put(
        join(d, "backgrounds", `${id}-mesh.svg`),
        svgMesh(p, s("mesh"), "none"),
      );
      await put(
        join(d, "animated", `${id}-mesh-smil.svg`),
        svgMesh(p, s("mesh"), "smil"),
      );
      await put(
        join(d, "animated", `${id}-mesh-css.svg`),
        svgMesh(p, s("mesh"), "css"),
      );
      await put(
        join(d, "animated", `${id}-waves.svg`),
        svgWaves(p, s("waves")),
      );
      await put(
        join(d, "animated", `${id}-stars.svg`),
        svgStars(p, s("stars")),
      );
      await put(
        join(d, "backgrounds", `${id}-topo.svg`),
        svgTopo(p, s("topo")),
      );
      await put(
        join(d, "backgrounds", `${id}-facets.svg`),
        svgFacets(p, s("facets")),
      );
      for (const k of PATTERNS)
        await put(join(d, "patterns", `${id}-${k}.svg`), svgPattern(k, p));
    }
  for (const k of Object.keys(SPINNERS))
    await put(join(OUT, "svg", "spinners", `${k}.svg`), svgSpinner(k));
}

function sdfIcon(app: string, p: Pal, n: number): Img {
  const img = mesh(
    n,
    n,
    {
      ...p,
      blobs: [
        p.primary,
        mix(p.primary, p.accent, 0.6),
        p.tertiary,
        p.accent,
        p.primary,
        p.secondary,
      ],
    },
    hashStr(`icon/${app}`),
  );
  const r = n * 0.22,
    cx = n / 2;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const qx = Math.abs(x + 0.5 - cx) - (cx - r),
        qy = Math.abs(y + 0.5 - cx) - (cx - r);
      const d =
        Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
        Math.min(Math.max(qx, qy), 0) -
        r;
      const a = clamp(0.5 - d);
      const i = (y * n + x) * 3;
      const t = (x + y) / (2 * n);
      for (let c = 0; c < 3; c++)
        img.d[i + c] = lerp(
          255,
          lerp(img.d[i + c]!, p.primary[c]! * 255 * (1 - t * 0.4), 0.35),
          a,
        );
    }
  return img;
}

async function brand() {
  for (const app of Object.keys(APP_THEME)) {
    const theme = APP_THEME[app]!;
    const dir = join(OUT, "brand", app);
    for (const mode of MODES) {
      const p = palette(tf, theme, mode);
      await put(join(dir, `favicon-${mode}.svg`), svgIcon(app, p));
      await put(
        join(dir, `loading-${mode}.svg`),
        svgLoading(app, p, hashStr(`load/${app}/${mode}`)),
      );
      const og = render("mesh", p, 1200, 630, hashStr(`og/${app}/${mode}`));
      // glyph disc: original geometric mark centered in the OG image
      const cx = 600,
        cy = 315,
        R = 120;
      for (let y = cy - R - 2; y <= cy + R + 2; y++)
        for (let x = cx - R - 2; x <= cx + R + 2; x++) {
          const a = clamp(R + 0.5 - Math.hypot(x - cx, y - cy)),
            i = (y * 1200 + x) * 3;
          for (let c = 0; c < 3; c++)
            og.d[i + c] = lerp(og.d[i + c]!, p.dark ? 20 : 255, a * 0.35);
        }
      await webp(png(og.rgb8(), 1200, 630), join(dir, `og-${mode}.webp`), 82);
      if (mode === "dark") {
        for (const n of [32, 180, 512]) {
          const pg = png(sdfIcon(app, p, n).rgb8(), n, n);
          if (n === 512) await webp(pg, join(dir, "tile-512.webp"), 85);
          else
            await put(
              join(
                dir,
                n === 32 ? "favicon-32.png" : "apple-touch-icon-180.png",
              ),
              pg,
            );
        }
      }
    }
  }
}

// ---------------------------------------------------------------- tileable PBR textures
function tileN(N: Noise, u: number, v: number, f: number, oct: number): number {
  const s = (a: number, b: number) => N.fbm(a * f, b * f, oct);
  return (
    s(u, v) * (1 - u) * (1 - v) +
    s(u - 1, v) * u * (1 - v) +
    s(u, v - 1) * (1 - u) * v +
    s(u - 1, v - 1) * u * v
  );
}
async function textures() {
  const n = 512;
  const mats: Record<string, (x: number, y: number, N: Noise) => number> = {
    rock: (u, v, N) => 0.5 + 1.6 * tileN(N, u, v, 5, 5),
    cells: (u, v) => {
      let m = 9;
      const c = 6;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const ci = Math.floor(u * c) + dx,
            cj = Math.floor(v * c) + dy;
          const wi = ((ci % c) + c) % c,
            wj = ((cj % c) + c) % c;
          const px = (ci + h2(wi, wj, 1)) / c,
            py = (cj + h2(wj, wi, 2)) / c;
          m = Math.min(m, Math.hypot(u - px, v - py));
        }
      return clamp(1 - m * c * 0.9);
    },
    weave: (u, v, N) =>
      0.5 +
      0.28 * Math.sin(u * 6.283 * 16) * Math.sin(v * 6.283 * 16) +
      0.5 * 0.3 * tileN(N, u, v, 8, 3),
  };
  for (const [name, fn] of Object.entries(mats)) {
    const N = new Noise(hashStr(name));
    const hgt = new Float32Array(n * n);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) hgt[y * n + x] = clamp(fn(x / n, y / n, N));
    const at = (x: number, y: number) =>
      hgt[((y + n) % n) * n + ((x + n) % n)]!;
    const alb = new Uint8Array(n * n * 3),
      nrm = new Uint8Array(n * n * 3),
      rgh = new Uint8Array(n * n * 3),
      hm = new Uint8Array(n * n * 3);
    const rp = ramp(
      name === "cells"
        ? [
            [0.1, 0.13, 0.2],
            [0.25, 0.4, 0.7],
            [0.7, 0.8, 0.95],
          ]
        : name === "weave"
          ? [
              [0.16, 0.15, 0.17],
              [0.5, 0.48, 0.52],
            ]
          : [
              [0.2, 0.19, 0.18],
              [0.46, 0.43, 0.4],
              [0.7, 0.67, 0.62],
            ],
      256,
    );
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const i = (y * n + x) * 3,
          h = at(x, y),
          k = (h * 255) | 0;
        for (let c = 0; c < 3; c++)
          ((alb[i + c] = rp[k * 3 + c]!),
            (hm[i + c] = k),
            (rgh[i + c] = (255 * (0.45 + 0.5 * (1 - h))) | 0));
        const dx = (at(x + 1, y) - at(x - 1, y)) * 6,
          dy = (at(x, y + 1) - at(x, y - 1)) * 6,
          l = Math.hypot(dx, dy, 1);
        nrm[i] = ((-dx / l) * 0.5 + 0.5) * 255;
        nrm[i + 1] = ((-dy / l) * 0.5 + 0.5) * 255;
        nrm[i + 2] = ((1 / l) * 0.5 + 0.5) * 255;
      }
    for (const [m, d] of [
      ["albedo", alb],
      ["normal", nrm],
      ["roughness", rgh],
      ["height", hm],
    ] as const)
      await webp(png(d, n, n), join(OUT, "textures", `${name}-${m}.webp`), 92);
  }
}

// ---------------------------------------------------------------- video and gif (frame by frame into ffmpeg)
async function frames(
  p: Pal,
  kind: "mesh" | "aurora",
  w: number,
  h: number,
  n: number,
  ffArgs: string[],
) {
  const proc = Bun.spawn(
    [
      FFMPEG,
      "-v",
      "error",
      "-y",
      "-f",
      "rawvideo",
      "-pix_fmt",
      "rgb24",
      "-s",
      `${w}x${h}`,
      "-r",
      String(opt("fps") ?? 24),
      "-i",
      "-",
      ...ffArgs,
    ],
    { stdin: "pipe", stderr: "inherit" },
  );
  const seed = hashStr(`vid/${p.theme}/${p.mode}/${kind}`);
  for (let i = 0; i < n; i++) {
    const img = (kind === "mesh" ? mesh : aurora)(w, h, p, seed, i / n, 1);
    legibilize(img, p);
    proc.stdin.write(img.rgb8(7));
  }
  await proc.stdin.end();
  await proc.exited;
  if (proc.exitCode) throw new Error(`ffmpeg exit ${proc.exitCode}`);
}
async function video() {
  const w = 1280,
    h = 720,
    n = Number(opt("frames") ?? 120);
  for (const theme of themes)
    for (const mode of MODES)
      for (const kind of ["mesh", "aurora"] as const) {
        if (kind === "aurora" && mode === "light") continue;
        const p = palette(tf, theme, mode),
          base = join(STORE, "video", `${theme}-${mode}-${kind}`);
        if (existsSync(`${base}.mp4`) && !args.includes("--force")) continue;
        mk(base);
        await frames(p, kind, w, h, n, [
          "-map",
          "0:v",
          "-c:v",
          "libsvtav1",
          "-crf",
          "42",
          "-preset",
          "8",
          "-g",
          "120",
          "-pix_fmt",
          "yuv420p10le",
          "-an",
          "-movflags",
          "+faststart",
          `${base}.mp4`,
          "-map",
          "0:v",
          "-c:v",
          "libvpx-vp9",
          "-crf",
          "45",
          "-b:v",
          "0",
          "-row-mt",
          "1",
          "-deadline",
          "good",
          "-cpu-used",
          "4",
          "-pix_fmt",
          "yuv420p10le",
          "-an",
          `${base}.webm`,
        ]);
        console.log(`video ${theme}-${mode}-${kind}`);
      }
}
async function gif() {
  const w = 320,
    h = 180,
    n = 24;
  for (const theme of themes) {
    const p = palette(tf, theme, "dark"),
      dest = join(OUT, "gif", `${theme}-dark-mesh.gif`);
    mk(dest);
    await frames(p, "mesh", w, h, n, [
      "-vf",
      "fps=12,split[a][b];[a]palettegen=stats_mode=full:max_colors=96[p];[b][p]paletteuse=dither=bayer:bayer_scale=4",
      "-loop",
      "0",
      "-r",
      "12",
      dest,
    ]);
    console.log(`gif ${theme} ${statSync(dest).size}`);
  }
}

// ---------------------------------------------------------------- index, manifest, validate
function walk(d: string, base = d): string[] {
  if (!existsSync(d)) return [];
  return readdirSync(d).flatMap((n) =>
    statSync(join(d, n)).isDirectory()
      ? walk(join(d, n), base)
      : [relative(base, join(d, n)).replaceAll("\\", "/")],
  );
}
const fileSha = async (f: string) =>
  sha256hex(new Uint8Array(await Bun.file(f).arrayBuffer()));

async function index() {
  const wall: unknown[] = [];
  const store = join(STORE, "wallpapers");
  const remote: { path: string; sha: string; bytes: number }[] = [];
  for (const theme of THEMES)
    for (const mode of MODES)
      for (const style of STYLES) {
        const id = `${theme}-${mode}-${style}`,
          files: Record<string, unknown> = {};
        for (const sz of SIZES) {
          const base = join(store, sz.name, id);
          if (!existsSync(`${base}.json`)) continue;
          const meta = JSON.parse(await Bun.file(`${base}.json`).text());
          const f: Record<string, unknown> = {
            w: meta.w,
            h: meta.h,
            minContrast: meta.minContrast,
          };
          for (const ext of ["avif", "webp"]) {
            const path = `wallpapers/${sz.name}/${id}.${ext}`,
              sha = await fileSha(`${base}.${ext}`),
              bytes = statSync(`${base}.${ext}`).size;
            f[ext] = { url: CDN + path, sha256: sha, bytes };
            remote.push({ path, sha, bytes });
          }
          files[sz.name] = f;
        }
        if (!Object.keys(files).length) continue;
        const apps = Object.entries(APP_THEME)
          .filter(([, t]) => t === theme)
          .map(([a]) => a);
        wall.push({
          id,
          theme,
          mode,
          style,
          apps: theme === "mono" ? Object.keys(APP_THEME) : apps,
          thumb: {
            desktop: `wallpapers/thumbs/${id}-d.webp`,
            mobile: `wallpapers/thumbs/${id}-m.webp`,
          },
          files,
        });
      }
  const vids: unknown[] = [];
  for (const f of walk(join(STORE, "video")).filter((x) =>
    x.endsWith(".mp4"),
  )) {
    const id = f.replace(/\.mp4$/, "");
    const e: Record<string, unknown> = { id, w: 1280, h: 720, loop: true };
    for (const ext of ["mp4", "webm"]) {
      const path = `video/${id}.${ext}`;
      if (existsSync(join(STORE, path)))
        ((e[ext] = {
          url: CDN + path,
          sha256: await fileSha(join(STORE, path)),
          bytes: statSync(join(STORE, path)).size,
        }),
          remote.push({
            path,
            sha: e[ext]!["sha256" as never],
            bytes: (e[ext] as { bytes: number }).bytes,
          }));
    }
    vids.push(e);
  }
  const doc = {
    generator: GENERATOR,
    license: "MIT OR Apache-2.0",
    cdn: CDN,
    apps: APP_THEME,
    wallpapers: wall,
    videos: vids,
    svg: walk(join(OUT, "svg")).map((f) => `svg/${f}`),
    gif: walk(join(OUT, "gif")).map((f) => `gif/${f}`),
    textures: walk(join(OUT, "textures")).map((f) => `textures/${f}`),
    brand: walk(join(OUT, "brand")).map((f) => `brand/${f}`),
  };
  await put(join(OUT, "wallpapers.json"), JSON.stringify(doc, null, 1) + "\n");
  // manifest: git files and remote files, same schema as assets/library/manifest.toml
  let t = `# Generated by packages/assets/src/gen/gen.ts. License: Apache-2.0 (one of the repo licenses MIT OR Apache-2.0), author = generator.\n`;
  const entry = (
    id: string,
    kind: string,
    path: string,
    url: string,
    sha: string,
    storage: string,
  ) =>
    `\n[[asset]]\nid = "gen/${id}"\nkind = "${kind}"\npath = "${path}"\nurl = "${url}"\nlicense = "Apache-2.0"\nsha256 = "${sha}"\nauthor = "${GENERATOR}"\nattribution = "Procedural output of ${GENERATOR}; original, no third-party artwork"\nstorage = "${storage}"\n`;
  for (const f of walk(OUT)
    .filter((x) => !x.startsWith("manifest.toml") && x !== "wallpapers.json")
    .sort())
    t += entry(
      f,
      f.split("/")[0]!,
      f,
      `https://raw.githubusercontent.com/aphrody-labs/src/main/assets/generated/${f}`,
      await fileSha(join(OUT, f)),
      "git",
    );
  for (const r of remote.sort((a, b) => a.path.localeCompare(b.path)))
    t += entry(r.path, "wallpaper", r.path, CDN + r.path, r.sha, "remote");
  await put(join(OUT, "manifest.toml"), t);
  console.log(
    `index: ${wall.length} wallpaper sets, ${vids.length} videos, ${remote.length} remote files`,
  );
}

async function validate(): Promise<void> {
  const errs: string[] = [];
  const doc = JSON.parse(await Bun.file(join(OUT, "wallpapers.json")).text());
  for (const w of doc.wallpapers)
    for (const [sz, f] of Object.entries<any>(w.files)) {
      const want = SIZES.find((s) => s.name === sz)!;
      if (f.w !== want.w || f.h !== want.h)
        errs.push(`${w.id} ${sz}: dimensions`);
      if (f.minContrast < 4.5)
        errs.push(`${w.id} ${sz}: safe-zone contrast ${f.minContrast} < 4.5`);
      for (const ext of ["avif", "webp"]) {
        const file = join(STORE, "wallpapers", sz, `${w.id}.${ext}`);
        if (!existsSync(file)) {
          errs.push(`${w.id} ${sz}.${ext}: missing`);
          continue;
        }
        const b = new Uint8Array(
          await Bun.file(file).slice(0, 32).arrayBuffer(),
        );
        const sig =
          ext === "webp"
            ? String.fromCharCode(...b.slice(8, 12)) === "WEBP"
            : String.fromCharCode(...b.slice(4, 12)) === "ftypavif";
        if (!sig) errs.push(`${w.id} ${sz}.${ext}: bad format`);
        if (statSync(file).size > 5 * 1024 * 1024 * 4)
          errs.push(`${w.id} ${sz}.${ext}: over 20 MB`);
        if (ext === "webp") {
          const m = await new (Bun as any).Image(
            new Uint8Array(await Bun.file(file).arrayBuffer()),
          ).metadata();
          if (m.width !== want.w || m.height !== want.h)
            errs.push(`${w.id} ${sz}.webp: pixel size ${m.width}x${m.height}`);
        }
      }
    }
  let gitBytes = 0;
  for (const f of walk(OUT)) {
    const s = statSync(join(OUT, f)).size;
    gitBytes += s;
    if (s > 5 * 1024 * 1024)
      errs.push(`${f}: ${s} bytes over the 5 MB git cap`);
    if (
      f.endsWith(".svg") &&
      !/^<svg[\s\S]*<\/svg>\s*$/.test(await Bun.file(join(OUT, f)).text())
    )
      errs.push(`${f}: malformed svg`);
  }
  for (const e of errs) console.error(e);
  console.log(
    `validate: ${doc.wallpapers.length} sets, git ${(gitBytes / 1048576).toFixed(2)} MB, ${errs.length} errors`,
  );
  process.exitCode = errs.length ? 1 : 0;
}

const table: Record<string, () => Promise<unknown>> = {
  stills,
  wallpapers: stills,
  backgrounds: svgs,
  svg: svgs,
  brand,
  textures,
  video,
  gif,
  index,
  validate,
};
if (cmd === "gallery") {
} else if (cmd === "all")
  for (const c of [
    "stills",
    "svg",
    "brand",
    "textures",
    "gif",
    "index",
    "validate",
  ])
    await table[c]!();
else if (table[cmd] && cmd !== "gallery") await table[cmd]!();
else
  (console.error(
    "usage: gen stills|svg|brand|textures|video|gif|index|validate|all",
  ),
    (process.exitCode = 2));
void rng;
void smooth;

async function gallery() {
  const doc = JSON.parse(await Bun.file(join(OUT, "wallpapers.json")).text());
  const card = (src: string, label: string, cls = "") =>
    `<figure class="${cls}"><img loading="lazy" src="${src}" alt="${label}"><figcaption>${label}</figcaption></figure>`;
  const sec = (t: string, body: string) =>
    `<h2>${t}</h2><div class="g">${body}</div>`;
  const w = doc.wallpapers as {
    id: string;
    thumb: { desktop: string; mobile: string };
    files: Record<string, { minContrast: number }>;
  }[];
  const html =
    `<!doctype html><meta charset="utf-8"><title>Wallpapers</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:24px;background:#11131c;color:#e2e1ef;font:14px system-ui,sans-serif}h2{margin:32px 0 12px;font-size:18px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}figure{margin:0}img{width:100%;display:block;border-radius:10px;background:#222;aspect-ratio:16/9;object-fit:cover}figure.m img{aspect-ratio:9/16;max-height:320px;width:auto}figcaption{padding:4px 2px;font-size:12px;color:#c5c5d6}</style><h1>Wallpapers</h1>` +
    sec(
      `Desktop stills (${w.length})`,
      w
        .map((x) =>
          card(
            x.thumb.desktop,
            `${x.id} / ${x.files["4k"]?.minContrast ?? ""}:1`,
          ),
        )
        .join(""),
    ) +
    sec(
      "Mobile stills",
      w
        .filter((x) => x.id.includes("-dark-"))
        .map((x) => card(x.thumb.mobile, x.id, "m"))
        .join(""),
    ) +
    sec(
      "Animated GIF",
      (doc.gif as string[]).map((f) => card(f, f.split("/").pop()!)).join(""),
    ) +
    sec(
      "SVG backgrounds and animated SVG",
      (doc.svg as string[])
        .filter((f) =>
          /aphrody-(dark|light)-(mesh-smil|waves|stars|topo|facets)\.svg$/.test(
            f,
          ),
        )
        .map((f) => card(f, f.split("/").pop()!))
        .join(""),
    ) +
    sec(
      "Spinners",
      (doc.svg as string[])
        .filter((f) => f.includes("spinners"))
        .map(
          (f) =>
            `<figure style="color:#bac3ff"><img src="${f}" style="padding:40px;box-sizing:border-box;background:#1e1f29" alt="${f}"><figcaption>${f.split("/").pop()}</figcaption></figure>`,
        )
        .join(""),
    ) +
    sec(
      "Patterns",
      (doc.svg as string[])
        .filter((f) => /ember-dark-.*\.svg$/.test(f) && f.includes("patterns"))
        .map(
          (f) =>
            `<figure><div style="height:135px;border-radius:10px;background:url(${f})"></div><figcaption>${f.split("/").pop()}</figcaption></figure>`,
        )
        .join(""),
    ) +
    sec(
      "Loading, icons, OG",
      Object.keys(APP_THEME)
        .flatMap((a) => [
          card(`brand/${a}/loading-dark.svg`, `${a} loading`),
          card(`brand/${a}/og-dark.webp`, `${a} og`),
          card(`brand/${a}/tile-512.webp`, `${a} tile`),
        ])
        .join(""),
    ) +
    sec(
      "Textures",
      ["rock", "cells", "weave"]
        .flatMap((m) =>
          ["albedo", "normal", "roughness", "height"].map((k) =>
            card(`textures/${m}-${k}.webp`, `${m} ${k}`),
          ),
        )
        .join(""),
    );
  await put(join(OUT, "gallery.html"), html);
}
table.gallery = gallery;
if (cmd === "gallery" || cmd === "all") await gallery();
