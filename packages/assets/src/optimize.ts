import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
 * One real optimizer per type, no fallback: a missing tool is an error that names it.
 * Every output is deterministic (metadata stripped, fixed parameters), named
 * `<stem>.<sha256[0:10]>.<ext>` and cached by sha256(input) + recipe + RECIPE_VERSION.
 *
 *   png/jpg    webp   cwebp (libwebp)
 *   png/jpg    avif   avifenc (libavif, aom)
 *   textures   ktx2   toktx (KTX-Software, UASTC + zstd)
 *   glb/gltf   glb    gltfpack (meshoptimizer: meshopt + KHR_texture_basisu)
 *   audio      opus   opusenc (everything but wav is decoded to wav by ffmpeg first)
 *   svg        svg    svgo (in-process, multipass)
 *   ttf/otf    woff2  wawoff2 (google/woff2 as wasm, in-process)
 */
export interface OptOut {
  recipe: string;
  ext: string;
  tool: string;
  bytes: Uint8Array;
}

export const RECIPE_VERSION = 2;
const WEBP_Q = 80;
const AVIF_Q = 50;
const OPUS_KBPS = 96;

type Maker = (src: string, tmp: string) => Promise<OptOut>;

const rd = (p: string) => new Uint8Array(readFileSync(p));

async function tool(cmd: string[], out: string): Promise<Uint8Array> {
  const r = await run(cmd, { nice: true });
  if (!r.ok || !existsSync(out))
    throw new Error(`${cmd[0]} failed: ${r.err.trim().slice(0, 200)}`);
  return rd(out);
}

const webp: Maker = async (src, tmp) => ({
  recipe: `webp-q${WEBP_Q}`,
  ext: "webp",
  tool: "cwebp",
  bytes: await tool(
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
      `${tmp}.webp`,
    ],
    `${tmp}.webp`,
  ),
});

const avif: Maker = async (src, tmp) => ({
  recipe: `avif-q${AVIF_Q}`,
  ext: "avif",
  tool: "avifenc",
  bytes: await tool(
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
      `${tmp}.avif`,
    ],
    `${tmp}.avif`,
  ),
});

const ktx2: Maker = async (src, tmp) => ({
  recipe: "ktx2-uastc2-zstd18",
  ext: "ktx2",
  tool: "toktx",
  bytes: await tool(
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
      `${tmp}.ktx2`,
      src,
    ],
    `${tmp}.ktx2`,
  ),
});

const glb: Maker = async (src, tmp) => ({
  recipe: "gltfpack-cc-tc",
  ext: "glb",
  tool: "gltfpack",
  bytes: await tool(
    ["gltfpack", "-i", src, "-o", `${tmp}.glb`, "-cc", "-tc"],
    `${tmp}.glb`,
  ),
});

const opus: Maker = async (src, tmp) => {
  let input = src;
  if (!/\.wav$/i.test(src)) {
    input = `${tmp}.wav`;
    await tool(
      ["ffmpeg", "-v", "error", "-y", "-i", src, "-map_metadata", "-1", input],
      input,
    );
  }
  return {
    recipe: `opus-${OPUS_KBPS}k`,
    ext: "opus",
    tool: "opusenc",
    bytes: await tool(
      [
        "opusenc",
        "--quiet",
        "--bitrate",
        String(OPUS_KBPS),
        input,
        `${tmp}.opus`,
      ],
      `${tmp}.opus`,
    ),
  };
};

const svg: Maker = async (src) => {
  const { optimize } = await import("svgo");
  const r = optimize(readFileSync(src, "utf8"), { multipass: true });
  return {
    recipe: "svgo-multipass",
    ext: "svg",
    tool: "svgo",
    bytes: new TextEncoder().encode(r.data),
  };
};

// The wasm module shares one heap: calls must not overlap or its buffers get detached.
let woff2Lock: Promise<unknown> = Promise.resolve();
const woff2: Maker = (src) => {
  const run = woff2Lock.then(async () => {
    const w = (await import("wawoff2")) as unknown as {
      compress(b: Uint8Array): Promise<Uint8Array>;
    };
    return {
      recipe: "woff2",
      ext: "woff2",
      tool: "wawoff2",
      bytes: new Uint8Array(await w.compress(rd(src))),
    };
  });
  woff2Lock = run.catch(() => undefined);
  return run;
};

/** External executables each recipe needs; in-process recipes (svg, woff2) need none. */
export const NEEDS: Record<string, string[]> = {
  webp: ["cwebp"],
  avif: ["avifenc"],
  ktx2: ["toktx"],
  glb: ["gltfpack"],
  opus: ["opusenc"],
  svg: [],
  woff2: [],
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
  if (/^\.(wav|flac|ogg|mp3)$/.test(e)) return [{ name: "opus", make: opus }];
  if (e === ".svg") return [{ name: "svg", make: svg }];
  if (/^\.(ttf|otf)$/.test(e)) return [{ name: "woff2", make: woff2 }];
  return [];
}

/** Names of required executables missing from PATH for these recipes (empty = ready). */
export function missingTools(recipes: Iterable<string>): string[] {
  const miss = new Set<string>();
  for (const r of recipes)
    for (const t of NEEDS[r] ?? []) if (!which(t)) miss.add(t);
  if ([...recipes].includes("opus") && !which("ffmpeg")) miss.add("ffmpeg");
  return [...miss].sort();
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
  failed: { id: string; recipe: string; reason: string }[];
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
  const need = missingTools(new Set(todo.map((t) => t.m.name)));
  if (need.length)
    throw new Error(
      `missing optimizer(s): ${need.join(", ")}. Install them (fr1: apt libwebp/libavif/ktx-software/opus-tools; PC: winget Google.Libwebp Mozilla.opus-tools, release binaries of libavif, KTX-Software, meshoptimizer) and re-run.`,
    );
  const res: OptResult = { records: [], failed: [], cached: 0, built: 0 };
  await pool(todo, opts.jobs ?? 4, async ({ a, f, m }) => {
    const srcSha = a.sha256 || (await hashFile(f));
    const key = join(
      cache,
      `${srcSha.slice(0, 24)}.${m.name}.v${RECIPE_VERSION}.json`,
    );
    if (existsSync(key)) {
      const rec = JSON.parse(readFileSync(key, "utf8")) as OptRecord;
      if (existsSync(join(dir, rec.out))) {
        res.records.push({ ...rec, id: a.id });
        res.cached++;
        return;
      }
    }
    const tmp = join(
      cache,
      `tmp-${process.pid}-${Math.random().toString(36).slice(2)}`,
    );
    let o: OptOut;
    try {
      o = await m.make(f, tmp);
    } catch (e) {
      res.failed.push({ id: a.id, recipe: m.name, reason: String(e) });
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
