import {
  existsSync,
  mkdirSync,
  readFileSync,
  copyFileSync,
  writeFileSync,
} from "node:fs";
import { join, basename, extname } from "node:path";
import { type Asset, fileOf } from "./manifest.ts";
import {
  hashBytes,
  hashFile,
  pool,
  run,
  which,
  posix,
  stableJson,
} from "./util.ts";

/**
 * Optimization recipes. Every output is deterministic (no timestamps, metadata stripped,
 * fixed parameters), named `<stem>.<sha256[0:10]>.<ext>` and cached by
 * sha256(input) + recipe id, so a re-run with the same inputs does no work.
 *
 * Tool order per type (first available wins, none available = skipped and reported):
 *   png/jpg      webp: Bun.Image | cwebp        avif: Bun.Image | avifenc | ffmpeg(libaom)
 *   textures     ktx2 (UASTC + zstd): toktx (KTX-Software, free)
 *   glb          meshopt: gltfpack (meshoptimizer, MIT)
 *   wav/flac/mp3/ogg  opus: ffmpeg(libopus) | opusenc
 *   svg          svgo | built-in whitespace/comment minifier
 *   ttf/otf      woff2: woff2_compress (Google, MIT)
 */
export interface OptOut {
  recipe: string;
  ext: string;
  tool: string;
  bytes: Uint8Array;
}

export const RECIPE_VERSION = 1;
const WEBP_Q = 80;
const AVIF_Q = 50;
const OPUS_KBPS = 96;

type Maker = (
  src: string,
  tmp: string,
  a: Pick<Asset, "kind">,
) => Promise<OptOut | null>;

const rd = (p: string) => new Uint8Array(readFileSync(p));

async function viaBunImage(
  src: string,
  fmt: "webp" | "avif",
): Promise<Uint8Array | null> {
  const I = (
    Bun as unknown as { Image?: new (b: Uint8Array) => Record<string, any> }
  ).Image;
  if (!I) return null;
  try {
    const im = new I(rd(src));
    const out = await (
      fmt === "webp"
        ? im.webp({ quality: WEBP_Q })
        : im.avif({ quality: AVIF_Q })
    ).bytes();
    return out.length ? out : null;
  } catch {
    return null;
  }
}

const webp: Maker = async (src, tmp) => {
  const b = await viaBunImage(src, "webp");
  if (b)
    return {
      recipe: `webp-q${WEBP_Q}`,
      ext: "webp",
      tool: "Bun.Image",
      bytes: b,
    };
  if (which("cwebp")) {
    const o = `${tmp}.webp`;
    const r = await run(
      [
        "cwebp",
        "-quiet",
        "-q",
        String(WEBP_Q),
        "-m",
        "6",
        "-metadata",
        "none",
        src,
        "-o",
        o,
      ],
      { nice: true },
    );
    if (r.ok)
      return {
        recipe: `webp-q${WEBP_Q}`,
        ext: "webp",
        tool: "cwebp",
        bytes: rd(o),
      };
  }
  return null;
};

const avif: Maker = async (src, tmp) => {
  const b = await viaBunImage(src, "avif");
  if (b)
    return {
      recipe: `avif-q${AVIF_Q}`,
      ext: "avif",
      tool: "Bun.Image",
      bytes: b,
    };
  const o = `${tmp}.avif`;
  if (which("avifenc")) {
    const r = await run(
      [
        "avifenc",
        "-q",
        String(AVIF_Q),
        "-s",
        "6",
        "-j",
        "2",
        "--ignore-icc",
        src,
        o,
      ],
      { nice: true },
    );
    if (r.ok)
      return {
        recipe: `avif-q${AVIF_Q}`,
        ext: "avif",
        tool: "avifenc",
        bytes: rd(o),
      };
  }
  if (which("ffmpeg")) {
    const r = await run(
      [
        "ffmpeg",
        "-v",
        "error",
        "-y",
        "-i",
        src,
        "-map_metadata",
        "-1",
        "-c:v",
        "libaom-av1",
        "-crf",
        "32",
        "-still-picture",
        "1",
        o,
      ],
      { nice: true },
    );
    if (r.ok)
      return {
        recipe: `avif-q${AVIF_Q}`,
        ext: "avif",
        tool: "ffmpeg",
        bytes: rd(o),
      };
  }
  return null;
};

const ktx2: Maker = async (src, tmp) => {
  if (!which("toktx")) return null;
  const o = `${tmp}.ktx2`;
  const r = await run(
    [
      "toktx",
      "--t2",
      "--genmipmap",
      "--encode",
      "uastc",
      "--uastc_quality",
      "2",
      "--zcmp",
      "18",
      "--threads",
      "2",
      o,
      src,
    ],
    { nice: true },
  );
  return r.ok
    ? { recipe: "ktx2-uastc2-zstd18", ext: "ktx2", tool: "toktx", bytes: rd(o) }
    : null;
};

const glb: Maker = async (src, tmp) => {
  if (!which("gltfpack")) return null;
  const o = `${tmp}.glb`;
  const r = await run(["gltfpack", "-i", src, "-o", o, "-cc", "-tc"], {
    nice: true,
  });
  return r.ok
    ? { recipe: "gltfpack-cc-tc", ext: "glb", tool: "gltfpack", bytes: rd(o) }
    : null;
};

const opus: Maker = async (src, tmp) => {
  const o = `${tmp}.opus`;
  if (which("ffmpeg")) {
    const r = await run(
      [
        "ffmpeg",
        "-v",
        "error",
        "-y",
        "-i",
        src,
        "-map_metadata",
        "-1",
        "-fflags",
        "+bitexact",
        "-flags:a",
        "+bitexact",
        "-c:a",
        "libopus",
        "-b:a",
        `${OPUS_KBPS}k`,
        "-vn",
        o,
      ],
      { nice: true },
    );
    if (r.ok)
      return {
        recipe: `opus-${OPUS_KBPS}k`,
        ext: "opus",
        tool: "ffmpeg",
        bytes: rd(o),
      };
  }
  if (which("opusenc") && /\.(wav|flac|ogg)$/i.test(src)) {
    const r = await run(
      ["opusenc", "--quiet", "--bitrate", String(OPUS_KBPS), src, o],
      { nice: true },
    );
    if (r.ok)
      return {
        recipe: `opus-${OPUS_KBPS}k`,
        ext: "opus",
        tool: "opusenc",
        bytes: rd(o),
      };
  }
  return null;
};

/** Conservative built-in minifier: drops comments, XML prolog, inter-tag whitespace. */
export function minifySvg(s: string): string {
  return s
    .replace(/<\?xml[^>]*\?>/g, "")
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/>\s+</g, "><")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const svg: Maker = async (src, tmp) => {
  if (which("svgo")) {
    const o = `${tmp}.svg`;
    const r = await run(["svgo", "--multipass", "-q", "-i", src, "-o", o]);
    if (r.ok)
      return {
        recipe: "svgo-multipass",
        ext: "svg",
        tool: "svgo",
        bytes: rd(o),
      };
  }
  const t = minifySvg(readFileSync(src, "utf8"));
  return {
    recipe: "svg-builtin-min",
    ext: "svg",
    tool: "builtin",
    bytes: new TextEncoder().encode(t),
  };
};

const woff2: Maker = async (src, tmp) => {
  if (!which("woff2_compress")) return null;
  const copy = `${tmp}${extname(src)}`;
  copyFileSync(src, copy);
  const r = await run(["woff2_compress", copy]);
  const o = copy.replace(/\.(ttf|otf)$/i, ".woff2");
  return r.ok && existsSync(o)
    ? { recipe: "woff2", ext: "woff2", tool: "woff2_compress", bytes: rd(o) }
    : null;
};

export function makersFor(
  ext: string,
  kind: string,
): { name: string; make: Maker }[] {
  const e = ext.toLowerCase();
  if (/^\.(png|jpe?g)$/.test(e)) {
    const m = [
      { name: "webp", make: webp },
      { name: "avif", make: avif },
    ];
    if (kind === "texture") m.push({ name: "ktx2", make: ktx2 });
    return m;
  }
  if (e === ".glb" || e === ".gltf") return [{ name: "glb", make: glb }];
  if (/^\.(wav|flac|mp3|ogg)$/.test(e)) return [{ name: "opus", make: opus }];
  if (e === ".svg") return [{ name: "svg", make: svg }];
  if (/^\.(ttf|otf)$/.test(e)) return [{ name: "woff2", make: woff2 }];
  return [];
}

export interface OptRecord {
  id: string;
  src: string;
  srcSha256: string;
  recipe: string;
  tool: string;
  out: string;
  sha256: string;
  bytes: number;
  srcBytes: number;
  license: string;
  attribution: string;
  kind: string;
}

export interface OptResult {
  records: OptRecord[];
  skipped: { id: string; recipe: string; reason: string }[];
  cached: number;
  built: number;
}

export const optDir = (root: string) =>
  join(root, "assets", "dist", "optimized");

/** Content-hashed outputs in `assets/dist/optimized/<kind>/`, cache index in `.cache/` next to them. */
export async function optimize(
  root: string,
  assets: Asset[],
  opts: { jobs?: number; dir?: string } = {},
): Promise<OptResult> {
  const dir = opts.dir ?? optDir(root);
  const cache = join(dir, ".cache");
  mkdirSync(cache, { recursive: true });
  const todo = assets.flatMap((a) => {
    const f = fileOf(root, a);
    return existsSync(f)
      ? makersFor(extname(f), a.kind).map((m) => ({ a, f, m }))
      : [];
  });
  const res: OptResult = { records: [], skipped: [], cached: 0, built: 0 };
  await pool(todo, opts.jobs ?? 4, async ({ a, f, m }) => {
    const srcSha = a.sha256 || (await hashFile(f));
    const key = join(
      cache,
      `${srcSha.slice(0, 24)}.${m.name}.v${RECIPE_VERSION}.json`,
    );
    if (existsSync(key)) {
      const rec = JSON.parse(readFileSync(key, "utf8")) as
        OptRecord | { skipped: string };
      if ("out" in rec && existsSync(join(dir, rec.out))) {
        res.records.push({ ...rec, id: a.id });
        res.cached++;
        return;
      }
      if ("skipped" in rec && !rec.skipped.startsWith("tool")) {
        res.skipped.push({ id: a.id, recipe: m.name, reason: rec.skipped });
        return;
      }
    }
    const tmp = join(
      cache,
      `tmp-${process.pid}-${Math.random().toString(36).slice(2)}`,
    );
    const o = await m.make(f, tmp, a);
    if (!o) {
      res.skipped.push({
        id: a.id,
        recipe: m.name,
        reason: "tool unavailable or failed",
      });
      return;
    }
    const sha = hashBytes(o.bytes);
    const rel = posix(
      join(
        a.kind,
        `${basename(a.path, extname(a.path))}.${sha.slice(0, 10)}.${o.ext}`,
      ),
    );
    mkdirSync(join(dir, a.kind), { recursive: true });
    if (!existsSync(join(dir, rel))) writeFileSync(join(dir, rel), o.bytes);
    const rec: OptRecord = {
      id: a.id,
      src: a.path,
      srcSha256: srcSha,
      recipe: o.recipe,
      tool: o.tool,
      out: rel,
      sha256: sha,
      bytes: o.bytes.length,
      srcBytes: Bun.file(f).size,
      license: a.license,
      attribution: a.attribution,
      kind: a.kind,
    };
    writeFileSync(key, stableJson(rec));
    res.records.push(rec);
    res.built++;
  });
  // Merge with earlier runs (other kinds/filters) so optimized.json stays the full index.
  const idx = join(dir, "optimized.json");
  const all = new Map<string, OptRecord>();
  if (existsSync(idx))
    for (const r of JSON.parse(readFileSync(idx, "utf8")) as OptRecord[])
      if (existsSync(join(dir, r.out))) all.set(`${r.id}|${r.recipe}`, r);
  for (const r of res.records) all.set(`${r.id}|${r.recipe}`, r);
  const merged = [...all.values()].sort((x, y) => (x.out < y.out ? -1 : 1));
  writeFileSync(idx, stableJson(merged));
  return res;
}
