#!/usr/bin/env bun
// Self-host a Cloudflare Worker module (infra/fleet/workers/*/worker.js) on Bun: same fetch(req, env) code,
// R2 bindings backed by any S3 endpoint (R2's own S3 API, MinIO, rustfs), [vars] read from the worker's toml.
//   bun infra/fleet/workers/selfhost.ts infra/fleet/workers/api-gateway/api.aphrody.com.toml
// Env: PORT (8080), HOST (0.0.0.0), S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
//      S3_BUCKET_<BINDING> overrides the toml bucket_name. Health: GET /__health.
import { dirname, resolve } from "node:path";

type Cfg = { main: string; vars?: Record<string, string>; r2_buckets?: { binding: string; bucket_name: string }[] };
const cfgPath = resolve(Bun.argv[2] ?? Bun.env.WORKER_CONFIG ?? "");
const cfg = Bun.TOML.parse(await Bun.file(cfgPath).text()) as Cfg;
const mod = (await import(resolve(dirname(cfgPath), cfg.main))).default as { fetch(req: Request, env: unknown, ctx: unknown): Promise<Response> };

// Minimal R2Bucket.get(key, { range, onlyIf }) over S3: the subset the workers in this repo use.
function r2(bucket: string) {
  const s3 = new Bun.S3Client({ bucket, endpoint: Bun.env.S3_ENDPOINT, region: Bun.env.S3_REGION });
  return {
    async get(key: string, o: { range?: Headers; onlyIf?: Headers } = {}) {
      const f = s3.file(key);
      let st: Awaited<ReturnType<typeof f.stat>>;
      try {
        st = await f.stat();
      } catch {
        return null;
      }
      const etag = st.etag?.replace(/^W\//, "") ?? "";
      const meta = { size: st.size, httpEtag: etag, writeHttpMetadata: (h: Headers) => st.type && h.set("content-type", st.type) };
      if (o.onlyIf?.get("if-none-match")?.includes(etag.replaceAll('"', ""))) return meta;
      const m = /bytes=(\d*)-(\d*)/.exec(o.range?.get("range") ?? "");
      if (m) {
        const offset = m[1] ? Number(m[1]) : Math.max(0, st.size - Number(m[2]));
        const end = m[1] && m[2] ? Number(m[2]) + 1 : st.size;
        return { ...meta, range: { offset, length: end - offset }, body: f.slice(offset, end).stream() };
      }
      return { ...meta, body: f.stream() };
    },
  };
}

const env: Record<string, unknown> = { ...cfg.vars };
for (const b of cfg.r2_buckets ?? []) env[b.binding] = r2(Bun.env[`S3_BUCKET_${b.binding}`] ?? b.bucket_name);
const ctx = { waitUntil: (p: Promise<unknown>) => void p.catch(console.error), passThroughOnException() {} };

const server = Bun.serve({
  port: Number(Bun.env.PORT ?? 8080),
  hostname: Bun.env.HOST ?? "0.0.0.0",
  fetch: (req) => (new URL(req.url).pathname === "/__health" ? Response.json({ ok: true, worker: cfg.main }) : mod.fetch(req, env, ctx)),
});
console.log(`selfhost ${cfgPath} on ${server.url}`);
