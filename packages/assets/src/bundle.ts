import { brotliCompressSync, constants } from "node:zlib";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, extname, join } from "node:path";
import { type Asset, fileOf } from "./manifest.ts";
import type { OptRecord } from "./optimize.ts";
import { hashBytes, posix, stableJson } from "./util.ts";

export const CACHE_CONTROL = "public, max-age=31536000, immutable";
const BR_TYPES = /\.(svg|json|gltf|wasm|js|css|html|txt|hdr|ttf|otf|obj|bin)$/i; // already-compressed formats (glb meshopt, ktx2 zstd, webp, avif, opus, woff2) gain nothing

export interface BundleEntry {
  path: string;
  sha256: string;
  integrity: string;
  bytes: number;
  type: string;
  br?: { path: string; bytes: number };
  source: string;
  license: string;
  attribution: string;
}

export interface BundleManifest {
  version: 1;
  prefix: string;
  entries: Record<string, BundleEntry>;
}

export const bundleDir = (root: string) =>
  join(root, "assets", "dist", "bundle");

const MIME: Record<string, string> = {
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ktx2": "image/ktx2",
  ".glb": "model/gltf-binary",
  ".opus": "audio/ogg; codecs=opus",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
  ".mp3": "audio/mpeg",
  ".json": "application/json",
  ".hdr": "image/vnd.radiance",
};
const mime = (ext: string) =>
  MIME[ext.toLowerCase()] ?? "application/octet-stream";

/**
 * Immutable layout: `<prefix>/<kind>/<stem>.<sha256[0:10]>.<ext>` plus a `.br` sibling
 * when Brotli (q11) shrinks a compressible type. Byte-stable: same inputs, same bundle.
 */
export function bundle(
  root: string,
  opt: {
    records: OptRecord[];
    optDir: string;
    raw?: Asset[];
    out?: string;
    prefix?: string;
  },
): BundleManifest {
  const out = opt.out ?? bundleDir(root);
  const prefix = (opt.prefix ?? "_assets").replace(/^\/+|\/+$/g, "");
  rmSync(out, { recursive: true, force: true });
  mkdirSync(join(out, prefix), { recursive: true });
  const entries: Record<string, BundleEntry> = {};

  const put = (
    logical: string,
    kind: string,
    stem: string,
    ext: string,
    data: Uint8Array,
    meta: Omit<
      BundleEntry,
      "path" | "sha256" | "integrity" | "bytes" | "type" | "br"
    >,
  ) => {
    const sha = hashBytes(data);
    const rel = posix(join(prefix, kind, `${stem}.${sha.slice(0, 10)}${ext}`));
    mkdirSync(join(out, prefix, kind), { recursive: true });
    writeFileSync(join(out, rel), data);
    const e: BundleEntry = {
      path: rel,
      sha256: sha,
      integrity: `sha384-${hashBytes(data, "sha384", "base64")}`,
      bytes: data.length,
      type: mime(ext),
      ...meta,
    };
    if (BR_TYPES.test(ext) && data.length > 256) {
      const br = brotliCompressSync(data, {
        params: {
          [constants.BROTLI_PARAM_QUALITY]: 11,
          [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
        },
      });
      if (br.length < data.length * 0.97) {
        writeFileSync(join(out, `${rel}.br`), br);
        e.br = { path: `${rel}.br`, bytes: br.length };
      }
    }
    entries[logical] = e;
  };

  const covered = new Set(opt.records.map((r) => r.id));
  for (const r of opt.records) {
    const ext = extname(r.out);
    const data = new Uint8Array(readFileSync(join(opt.optDir, r.out)));
    put(
      `${r.id}${ext}`,
      r.kind,
      basename(r.out, ext).replace(/\.[0-9a-f]{10}$/, ""),
      ext,
      data,
      {
        source: r.id,
        license: r.license,
        attribution: r.attribution,
      },
    );
  }
  for (const a of opt.raw ?? []) {
    const f = fileOf(root, a);
    if (covered.has(a.id) || !existsSync(f)) continue;
    const ext = extname(f);
    put(
      `${a.id}${ext}`,
      a.kind,
      basename(f, ext),
      ext,
      new Uint8Array(readFileSync(f)),
      {
        source: a.id,
        license: a.license,
        attribution: a.attribution,
      },
    );
  }

  const sorted = Object.fromEntries(
    Object.entries(entries).sort(([x], [y]) => (x < y ? -1 : 1)),
  );
  const man: BundleManifest = { version: 1, prefix, entries: sorted };
  writeFileSync(join(out, "assets-manifest.json"), stableJson(man));
  writeFileSync(
    join(out, "_headers"),
    `/${prefix}/*\n  Cache-Control: ${CACHE_CONTROL}\n  Access-Control-Allow-Origin: *\n`,
  );
  writeFileSync(
    join(out, "assets.nginx.conf"),
    `location /${prefix}/ {\n  add_header Cache-Control "${CACHE_CONTROL}" always;\n  add_header Access-Control-Allow-Origin * always;\n  gzip_static on;\n  brotli_static on;\n  try_files $uri =404;\n}\n`,
  );
  return man;
}

/** Same manifest with absolute URLs, for a target with a public base. */
export function withUrls(m: BundleManifest, base: string): unknown {
  const b = base.replace(/\/+$/, "");
  return {
    ...m,
    base: b,
    entries: Object.fromEntries(
      Object.entries(m.entries).map(([k, e]) => [
        k,
        {
          ...e,
          url: `${b}/${e.path}`,
          ...(e.br ? { brUrl: `${b}/${e.br.path}` } : {}),
        },
      ]),
    ),
  };
}
