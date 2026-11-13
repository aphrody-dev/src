/**
 * Portable static/large-file site (downloads.aphrody.com, cdn.aphrody.com).
 * Same logic as infra/fleet/workers/r2-site/worker.js but on @aphrody/runtime-adapter:
 * R2 binding on Workers, S3/MinIO/R2-S3 or fs on Vercel/VPS. Config: PREFIX, SERVICE, SPA.
 */
import { defineApp, type ByteRange, type Ctx } from "../../../packages/runtime-adapter/src/index";

const SEC: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=63072000",
  "referrer-policy": "strict-origin-when-cross-origin",
};

export function parseRange(h: string | null): ByteRange | undefined {
  const m = h?.match(/^bytes=(\d+)-(\d*)$/);
  if (!m) return undefined;
  const offset = Number(m[1]);
  return m[2] ? { offset, length: Number(m[2]) - offset + 1 } : { offset };
}

type Rule = { re: RegExp; h: [string, string][] };
const RULES = new Map<string, Rule[]>();
export function parseHeaders(text: string): Rule[] {
  const out: Rule[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      const glob = line.trim().replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      out.push({ re: new RegExp(`^${glob}$`), h: [] });
      continue;
    }
    const i = line.indexOf(":");
    if (i > 0 && out.length) out[out.length - 1]!.h.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
  }
  return out;
}
async function rules(ctx: Ctx, base: string) {
  const hit = RULES.get(base);
  if (hit) return hit;
  const o = await ctx.storage!.get(K(`${base}/_headers`));
  const r = o?.body ? parseHeaders(await new Response(o.body).text()) : [];
  RULES.set(base, r);
  return r;
}
/** Versioned brand assets (cdn.aphrody.com/brand/v<N>/): same headers as the Cloudflare worker. */
export const BRAND = /^\/brand\/v\d+\//;
export const BRAND_HEADERS: [string, string][] = [
  ["cache-control", "public, max-age=31536000, immutable"],
  ["access-control-allow-origin", "*"],
  ["cross-origin-resource-policy", "cross-origin"],
  ["timing-allow-origin", "*"],
];
const K = (k: string) => k.replace(/^\/+/, "");

export default defineApp({
  name: "r2-site",
  async fetch(req, ctx) {
    const url = new URL(req.url);
    if (req.method !== "GET" && req.method !== "HEAD") return new Response("method not allowed", { status: 405 });
    if (url.pathname === "/health")
      return Response.json({ status: "ok", service: ctx.env.get("SERVICE") ?? "r2-site", target: ctx.target }, { headers: SEC });
    if (!ctx.storage) return new Response("storage not configured (STORAGE)", { status: 503 });
    const base = (ctx.env.get("PREFIX") ?? "").replace(/\/$/, "");
    let path = decodeURIComponent(url.pathname);
    if (path.endsWith("/")) path += "index.html";
    const range = parseRange(req.headers.get("range"));
    const get = (k: string) => ctx.storage!.get(K(k), range ? { range } : undefined);
    let obj = await get(base + path);
    if (!obj && !path.split("/").pop()!.includes(".")) obj = await get(`${base + path}/index.html`);
    let status = 200;
    if (!obj && ctx.env.get("SPA") === "1") obj = await get(`${base}/index.html`);
    if (!obj) {
      obj = await ctx.storage.get(K(`${base}/404.html`));
      status = 404;
      if (!obj) return new Response("not found", { status, headers: SEC });
    }
    const h = new Headers(SEC);
    if (obj.contentType) h.set("content-type", obj.contentType);
    for (const r of await rules(ctx, base)) if (r.re.test(url.pathname)) for (const [k, v] of r.h) h.set(k, v);
    // Brand CDN (assets/brand/gen, assets/brand/publish.ts): versioned, immutable, cross-origin readable.
    if (BRAND.test(url.pathname)) for (const [k, v] of BRAND_HEADERS) h.set(k, v);
    if (obj.etag) h.set("etag", obj.etag);
    h.set("accept-ranges", "bytes");
    if (obj.range && range && status === 200) {
      h.set("content-range", `bytes ${obj.range.offset}-${obj.range.offset + obj.range.length - 1}/${obj.size}`);
      status = 206;
    }
    if (!h.has("cache-control")) h.set("cache-control", path.endsWith(".html") ? "public, max-age=60" : "public, max-age=3600");
    return new Response(req.method === "HEAD" ? null : obj.body, { status, headers: h });
  },
});
