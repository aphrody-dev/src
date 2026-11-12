/**
 * In-memory static asset store: files from dist/ are read once, kept as
 * pre-compressed buffers (brotli + gzip) and answered with a strong ETag,
 * Vary: Accept-Encoding and conditional 304 handling.
 */

import { existsSync, readFileSync, statSync } from "fs";
import { extname, join, normalize, resolve, sep } from "path";
import { brotliCompressSync, constants as zc } from "node:zlib";
import { strongEtag } from "./hash";

export const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".wasm": "application/wasm",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

const COMPRESSIBLE = new Set([
  ".html",
  ".js",
  ".css",
  ".svg",
  ".json",
  ".txt",
  ".xml",
  ".wasm",
]);

export interface Asset {
  urlPath: string;
  type: string;
  ext: string;
  raw: Uint8Array;
  gz?: Uint8Array;
  br?: Uint8Array;
  etag: { raw: string; gz?: string; br?: string };
  cacheControl: string;
}

/** Hashed chunk names are immutable; stable names revalidate cheaply via ETag. */
export function cacheControlFor(urlPath: string, ext: string): string {
  if (/\/chunk-[a-z0-9]+\.(js|css)$/i.test(urlPath) || ext === ".woff2") {
    return "public, max-age=31536000, immutable";
  }
  if (
    ext === ".html" ||
    urlPath.endsWith(".xml") ||
    urlPath.endsWith(".txt") ||
    urlPath.endsWith(".json")
  ) {
    return "public, max-age=0, must-revalidate";
  }
  return "public, max-age=3600, stale-while-revalidate=86400";
}

export class AssetStore {
  private cache = new Map<string, Asset | null>();
  private root: string;

  constructor(distDir: string) {
    this.root = resolve(distDir);
  }

  /** Map a URL pathname to a file under dist/, or null when unsafe or absent. */
  private locate(pathname: string): { file: string; urlPath: string } | null {
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    if (
      decoded.includes("\0") ||
      decoded.includes("\\") ||
      decoded.split("/").includes("..")
    )
      return null;
    if (/(^|\/)_[^/]*$/.test(decoded)) return null; // _headers and similar edge config files
    const candidates: string[] = [];
    if (decoded.endsWith("/")) candidates.push(decoded + "index.html");
    else {
      candidates.push(decoded);
      if (!extname(decoded)) candidates.push(decoded + "/index.html");
    }
    for (const c of candidates) {
      const file = resolve(join(this.root, normalize(c)));
      if (file !== this.root && !file.startsWith(this.root + sep)) continue;
      if (/\.(gz|br)$/.test(file)) continue;
      if (existsSync(file) && statSync(file).isFile())
        return { file, urlPath: c };
    }
    return null;
  }

  get(pathname: string): Asset | null {
    const hit = this.cache.get(pathname);
    if (hit !== undefined) return hit;
    const loc = this.locate(pathname);
    let asset: Asset | null = null;
    if (loc) {
      const raw = new Uint8Array(readFileSync(loc.file));
      const ext = extname(loc.file).toLowerCase();
      const compress = COMPRESSIBLE.has(ext) && raw.byteLength > 256;
      const gzFile = loc.file + ".gz";
      const brFile = loc.file + ".br";
      const gz = compress
        ? existsSync(gzFile)
          ? new Uint8Array(readFileSync(gzFile))
          : Bun.gzipSync(raw)
        : undefined;
      const br = compress
        ? existsSync(brFile)
          ? new Uint8Array(readFileSync(brFile))
          : new Uint8Array(
              brotliCompressSync(raw, {
                params: { [zc.BROTLI_PARAM_QUALITY]: 11 },
              }),
            )
        : undefined;
      asset = {
        urlPath: loc.urlPath,
        type: MIME_TYPES[ext] || "application/octet-stream",
        ext,
        raw,
        gz,
        br,
        etag: {
          raw: strongEtag(raw),
          gz: gz ? strongEtag(raw, "gz") : undefined,
          br: br ? strongEtag(raw, "br") : undefined,
        },
        cacheControl: cacheControlFor(loc.urlPath, ext),
      };
    }
    this.cache.set(pathname, asset);
    return asset;
  }
}

export function etagMatches(header: string | null, etag: string): boolean {
  if (!header) return false;
  if (header.trim() === "*") return true;
  return header
    .split(",")
    .map((t) => t.trim().replace(/^W\//, ""))
    .includes(etag);
}

export function respondWithAsset(
  req: Request,
  asset: Asset,
  extra: Record<string, string> = {},
): Response {
  const accept = req.headers.get("accept-encoding") || "";
  let body: Uint8Array = asset.raw;
  let etag = asset.etag.raw;
  const headers: Record<string, string> = {
    "Content-Type": asset.type,
    "Cache-Control": asset.cacheControl,
    Vary: "Accept-Encoding",
    ...extra,
  };
  if (asset.br && /\bbr\b/.test(accept)) {
    body = asset.br;
    etag = asset.etag.br!;
    headers["Content-Encoding"] = "br";
  } else if (asset.gz && /\bgzip\b/.test(accept)) {
    body = asset.gz;
    etag = asset.etag.gz!;
    headers["Content-Encoding"] = "gzip";
  }
  headers.ETag = etag;
  if (etagMatches(req.headers.get("if-none-match"), etag)) {
    delete headers["Content-Encoding"];
    return new Response(null, { status: 304, headers });
  }
  headers["Content-Length"] = String(body.byteLength);
  return new Response(
    req.method === "HEAD" ? null : (body as unknown as BodyInit),
    {
      status: 200,
      headers,
    },
  );
}
