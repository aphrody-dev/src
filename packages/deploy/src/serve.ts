// Serve one immutable deployment from R2 (Workers runtime). Used by the platform Worker for previews and
// production aliases, and by the apps/aphrody edge Worker for aphrody.com. Supports the `_headers` file
// (Cloudflare Pages syntax, `*` wildcard, later rules win), directory indexes, `404.html`, ranges and ETags.
import { keys, type ProjectState } from "./state.ts";

export interface R2Like {
  get(key: string, opts?: unknown): Promise<any>;
  put(key: string, value: any, opts?: unknown): Promise<any>;
  delete?(key: string | string[]): Promise<void>;
  list?(opts: unknown): Promise<any>;
}

const SEC: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "strict-transport-security": "max-age=63072000; includeSubDomains",
  "referrer-policy": "strict-origin-when-cross-origin",
};

type Rule = { re: RegExp; h: [string, string][] };
const RULES = new Map<string, Rule[]>();

export function parseHeaders(text: string): Rule[] {
  const out: Rule[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) {
      const glob = line
        .trim()
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      out.push({ re: new RegExp(`^${glob}$`), h: [] });
      continue;
    }
    const i = line.indexOf(":");
    if (i > 0 && out.length)
      out[out.length - 1]!.h.push([
        line.slice(0, i).trim(),
        line.slice(i + 1).trim(),
      ]);
  }
  return out;
}

async function rules(bucket: R2Like, base: string): Promise<Rule[]> {
  const hit = RULES.get(base);
  if (hit) return hit;
  const obj = await bucket.get(`${base}/_headers`);
  const r = obj ? parseHeaders(await obj.text()) : [];
  if (RULES.size > 64) RULES.clear();
  RULES.set(base, r);
  return r;
}

// Production pointers are cached per isolate for a few seconds: a promote or rollback is visible within TTL.
const STATE = new Map<string, { at: number; s: ProjectState | null }>();
const TTL = 5_000;

export async function readState(
  bucket: R2Like,
  project: string,
  fresh = false,
): Promise<ProjectState | null> {
  const c = STATE.get(project);
  if (!fresh && c && Date.now() - c.at < TTL) return c.s;
  const obj = await bucket.get(keys.state(project));
  const s = obj ? ((await obj.json()) as ProjectState) : null;
  STATE.set(project, { at: Date.now(), s });
  return s;
}

export function forgetState(project: string): void {
  STATE.delete(project);
}

/** Serve `request` from deployment `<project>@<sha>`, through the zone cache (Cache API, keyed by sha: a
 * deployment never changes, so a promote or rollback switches keys and needs no purge). */
export async function serveDeployment(
  bucket: R2Like,
  project: string,
  sha: string,
  req: Request,
  extra: Record<string, string> = {},
  ctx?: { waitUntil(p: Promise<unknown>): void },
): Promise<Response> {
  const cache = (globalThis as { caches?: { default?: any } }).caches?.default;
  if (!cache || req.method !== "GET" || req.headers.has("range"))
    return fromR2(bucket, project, sha, req, extra);
  let norm: string;
  try {
    norm = encodeURI(decodeURIComponent(new URL(req.url).pathname));
  } catch {
    return fromR2(bucket, project, sha, req, extra);
  }
  const tag = Object.entries(extra)
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  const key = new Request(
    `https://deploy-cache.aphrody.app/${keys.base(project, sha)}${norm}?${encodeURIComponent(tag)}`,
  );
  const hit = (await cache.match(key)) as Response | undefined;
  if (hit) {
    const h = new Headers(hit.headers);
    h.set(
      "cache-control",
      h.get("x-client-cache-control") ?? "public, max-age=0, must-revalidate",
    );
    h.delete("x-client-cache-control");
    h.set("x-aphrody-cache", "hit");
    const inm = req.headers.get("if-none-match");
    if (inm && inm === h.get("etag"))
      return new Response(null, { status: 304, headers: h });
    return new Response(hit.body, { status: hit.status, headers: h });
  }
  const res = await fromR2(
    bucket,
    project,
    sha,
    new Request(req.url, { method: "GET" }),
    extra,
  );
  if (res.status !== 200) return res;
  const stored = res.clone();
  const sh = new Headers(stored.headers);
  sh.set("x-client-cache-control", sh.get("cache-control") ?? "");
  sh.set("cache-control", "public, max-age=31536000, immutable");
  const put = cache.put(
    key,
    new Response(stored.body, { status: 200, headers: sh }),
  );
  if (ctx) ctx.waitUntil(put);
  else await put;
  res.headers.set("x-aphrody-cache", "miss");
  return res;
}

async function fromR2(
  bucket: R2Like,
  project: string,
  sha: string,
  req: Request,
  extra: Record<string, string> = {},
): Promise<Response> {
  if (req.method !== "GET" && req.method !== "HEAD")
    return new Response("method not allowed", { status: 405, headers: SEC });
  const url = new URL(req.url);
  const base = keys.base(project, sha);
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    return new Response("bad request", { status: 400, headers: SEC });
  }
  if (path.includes("..") || path.includes("\0"))
    return new Response("not found", { status: 404, headers: SEC });
  if (path.endsWith("/")) path += "index.html";
  const opts = { range: req.headers, onlyIf: req.headers };
  let obj = await bucket.get(base + path, opts);
  if (!obj && !path.split("/").pop()!.includes("."))
    obj = await bucket.get(`${base}${path}/index.html`, opts);
  let status = 200;
  if (!obj) {
    obj = await bucket.get(`${base}/404.html`);
    status = 404;
    if (!obj)
      return new Response("not found", {
        status,
        headers: { ...SEC, ...extra },
      });
  }
  const h = new Headers(SEC);
  obj.writeHttpMetadata(h);
  for (const r of await rules(bucket, base))
    if (r.re.test(url.pathname)) for (const [k, v] of r.h) h.set(k, v);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  h.set("x-aphrody-deploy", `${project}@${sha.slice(0, 12)}`);
  h.set("etag", obj.httpEtag);
  h.set("accept-ranges", "bytes");
  if (!("body" in obj)) return new Response(null, { status: 304, headers: h });
  if (obj.range && req.headers.has("range") && status === 200) {
    const { offset = 0, length = obj.size } = obj.range;
    h.set(
      "content-range",
      `bytes ${offset}-${offset + length - 1}/${obj.size}`,
    );
    status = 206;
  }
  if (!h.has("cache-control"))
    h.set(
      "cache-control",
      /\.html$/.test(path) || status === 404
        ? "public, max-age=0, must-revalidate"
        : "public, max-age=3600",
    );
  return new Response(req.method === "HEAD" ? null : obj.body, {
    status,
    headers: h,
  });
}

/** Serve the production deployment of `project`, or null when it has none yet. */
export async function serveProduction(
  bucket: R2Like,
  project: string,
  req: Request,
  ctx?: { waitUntil(p: Promise<unknown>): void },
): Promise<Response | null> {
  const s = await readState(bucket, project);
  if (!s?.production) return null;
  return serveDeployment(bucket, project, s.production, req, {}, ctx);
}
