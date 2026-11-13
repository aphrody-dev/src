/**
 * Static/large-file sites from R2 (cdn, downloads, creator, shell.aphrody.app). Thin entry over
 * serveStatic (@aphrody/deploy/src/serve.ts), the only static server of the repo. Config: PREFIX (key
 * prefix, "" = bucket root), SERVICE (health name), SPA ("1" = index.html fallback), CROSS_ORIGIN ("1" =
 * CORS + CORP + Timing-Allow-Origin on every response). Workers: entry.cf.ts on the R2 binding; VPS and
 * Vercel: entry.vps.ts / entry.vercel.ts on @aphrody/runtime-adapter storage (S3, MinIO, fs).
 */
import { serveStatic, type R2Like } from "@aphrody/deploy/src/serve.ts";
import {
  defineApp,
  type ByteRange,
  type Storage,
} from "@aphrody/runtime-adapter";

export interface Vars {
  get(name: string): string | undefined;
}

export function parseRange(h: string | null): ByteRange | undefined {
  const m = h?.match(/^bytes=(\d+)-(\d*)$/);
  if (!m) return undefined;
  const offset = Number(m[1]);
  return m[2] ? { offset, length: Number(m[2]) - offset + 1 } : { offset };
}

/** runtime-adapter Storage seen as the R2 subset serveStatic reads (range from the request headers). */
export function storageBucket(s: Storage): R2Like {
  return {
    async get(key: string, opts?: unknown) {
      const hs = (opts as { range?: Headers } | undefined)?.range;
      const range = parseRange(hs?.get?.("range") ?? null);
      const o = await s.get(key, range ? { range } : undefined);
      if (!o) return null;
      return {
        body: o.body,
        size: o.size,
        httpEtag: o.etag,
        range: o.range,
        writeHttpMetadata: (h: Headers) =>
          o.contentType && h.set("content-type", o.contentType),
        text: () => new Response(o.body).text(),
      };
    },
    put: (k: string, v: any) => s.put(k, v),
  };
}

const SEC = {
  "x-content-type-options": "nosniff",
  "cache-control": "no-store",
};

export function handle(
  req: Request,
  bucket: R2Like | null,
  vars: Vars,
  target: string,
): Promise<Response> | Response {
  if (new URL(req.url).pathname === "/health")
    return Response.json(
      { status: "ok", service: vars.get("SERVICE") ?? "r2-site", target },
      { headers: SEC },
    );
  if (!bucket)
    return new Response("storage not configured (STORAGE)", {
      status: 503,
      headers: SEC,
    });
  return serveStatic(bucket, req, {
    prefix: vars.get("PREFIX") ?? "",
    spa: vars.get("SPA") === "1",
    crossOrigin: vars.get("CROSS_ORIGIN") === "1",
  });
}

export default defineApp({
  name: "r2-site",
  fetch: (req, ctx) =>
    handle(
      req,
      ctx.storage ? storageBucket(ctx.storage) : null,
      ctx.env,
      ctx.target,
    ),
});
