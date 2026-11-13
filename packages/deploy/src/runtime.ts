// Runtime surface of every deployment served by aphrody.app (previews, production domains, aphrody.com), under
// the reserved prefix /_aphrody/. The part of Vercel's platform a static deployment needs at request time:
//   GET  /_aphrody/insights.js        Web Analytics + Speed Insights client (no cookie, no identifier)
//   POST /_aphrody/v                  beacon: page view or Core Web Vitals of one visit -> Durable Object Insights
//   GET  /_aphrody/image?url=&w=&q=   image optimization (Images binding): resize, AVIF/WebP by Accept, cached by sha
//   GET  /_aphrody/config[/<key>]     edge config of the project (R2 deploys/<p>/_config.json), read at the edge
// The dashboard reads the same Durable Object (summary) and writes the edge config through the API (worker.ts).
import type { R2Like } from "./serve.ts";
import { keys } from "./state.ts";

export interface DONamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(req: Request): Promise<Response> };
}
export interface ImagesBinding {
  input(s: ReadableStream): {
    transform(o: Record<string, unknown>): {
      output(o: Record<string, unknown>): Promise<{ response(): Response }>;
    };
  };
}
export interface RuntimeEnv {
  BUCKET: R2Like;
  INSIGHTS?: DONamespace;
  IMAGES?: ImagesBinding;
}
type Ctx = { waitUntil(p: Promise<unknown>): void } | undefined;

export const PREFIX = "/_aphrody/";
export const METRICS = ["LCP", "INP", "CLS", "FCP", "TTFB"] as const;
export const WIDTHS = [
  64, 128, 256, 384, 640, 750, 828, 1080, 1200, 1280, 1920, 2048, 3840,
];
const NOSTORE = { "cache-control": "no-store" };

// LCP, CLS, FCP, TTFB as defined by web.dev; INP approximated by the longest interaction of the visit
// (web-vitals takes the 98th percentile once a visit has more than 50 interactions). Sent once, when the page
// is hidden. A prerendered page counts its view when it is shown.
export const CLIENT = `(()=>{const u="/_aphrody/v",p=location.pathname,b=o=>navigator.sendBeacon&&navigator.sendBeacon(u,JSON.stringify(o)),v=()=>b({k:"pv",p,r:document.referrer});document.prerendering?document.addEventListener("prerenderingchange",v,{once:!0}):v();const m={},o=(t,f,x)=>{try{new PerformanceObserver(l=>l.getEntries().forEach(f)).observe({type:t,buffered:!0,...x})}catch{}};o("largest-contentful-paint",e=>m.LCP=e.startTime);o("paint",e=>{e.name==="first-contentful-paint"&&(m.FCP=e.startTime)});let w=0,f=0,l=0;o("layout-shift",e=>{if(e.hadRecentInput)return;e.startTime-l<1e3&&e.startTime-f<5e3?w+=e.value:(w=e.value,f=e.startTime);l=e.startTime;m.CLS=Math.max(m.CLS||0,w)});o("event",e=>{e.interactionId&&e.duration>(m.INP||0)&&(m.INP=e.duration)},{durationThreshold:16});const n=performance.getEntriesByType("navigation")[0];n&&(m.TTFB=n.responseStart);let s=0;addEventListener("visibilitychange",()=>{document.visibilityState==="hidden"&&!s&&Object.keys(m).length&&(s=1,b({k:"v",p,m}))})})();`;

/** Handle /_aphrody/* for deployment `project@sha`; null for any other path. */
export async function runtime(
  req: Request,
  env: RuntimeEnv,
  project: string,
  sha: string,
  ctx?: Ctx,
): Promise<Response | null> {
  const url = new URL(req.url);
  if (!url.pathname.startsWith(PREFIX)) return null;
  const sub = url.pathname.slice(PREFIX.length);
  if (sub === "insights.js")
    return new Response(CLIENT, {
      headers: {
        "content-type": "text/javascript; charset=utf-8",
        "cache-control": "public, max-age=3600",
        "x-content-type-options": "nosniff",
      },
    });
  if (sub === "v") return beacon(req, env, project);
  if (sub === "image") return image(req, env, project, sha, ctx);
  if (sub === "config" || sub.startsWith("config/"))
    return config(env, project, sub.slice(7));
  return new Response("not found", { status: 404, headers: NOSTORE });
}

async function beacon(
  req: Request,
  env: RuntimeEnv,
  project: string,
): Promise<Response> {
  if (req.method !== "POST")
    return new Response(null, { status: 405, headers: NOSTORE });
  if (!env.INSIGHTS) return new Response(null, { status: 204 });
  const body = await req.text();
  if (body.length > 2048)
    return new Response(null, { status: 413, headers: NOSTORE });
  const cf = (req as { cf?: { country?: string } }).cf;
  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|lighthouse|headless/i.test(ua))
    return new Response(null, { status: 204 });
  const stub = env.INSIGHTS.get(env.INSIGHTS.idFromName(project));
  await stub.fetch(
    new Request("https://insights/ingest", {
      method: "POST",
      body,
      headers: {
        "x-country": cf?.country ?? "XX",
        "x-device": /Mobi|Android/i.test(ua) ? "mobile" : "desktop",
      },
    }),
  );
  return new Response(null, { status: 204, headers: NOSTORE });
}

/** Read the analytics summary of `project` (dashboard, API). */
export async function insightsSummary(
  env: RuntimeEnv,
  project: string,
  days = 7,
): Promise<Summary | null> {
  if (!env.INSIGHTS) return null;
  const stub = env.INSIGHTS.get(env.INSIGHTS.idFromName(project));
  const r = await stub.fetch(
    new Request(`https://insights/summary?days=${days}`),
  );
  return r.ok ? ((await r.json()) as Summary) : null;
}

async function image(
  req: Request,
  env: RuntimeEnv,
  project: string,
  sha: string,
  ctx: Ctx,
): Promise<Response> {
  const url = new URL(req.url);
  const src = url.searchParams.get("url") ?? "";
  const w = Number(url.searchParams.get("w"));
  const q = Math.min(100, Math.max(1, Number(url.searchParams.get("q") ?? 75)));
  if (
    !/^\/[^/\\]/.test(src) ||
    src.includes("..") ||
    !WIDTHS.includes(w) ||
    !/\.(png|jpe?g|webp|avif|gif)$/i.test(src)
  )
    return new Response("bad image request", { status: 400, headers: NOSTORE });
  const accept = req.headers.get("accept") ?? "";
  const format = accept.includes("image/avif")
    ? "image/avif"
    : accept.includes("image/webp")
      ? "image/webp"
      : undefined;
  const cache = (globalThis as { caches?: { default?: any } }).caches?.default;
  const key = new Request(
    `https://deploy-cache.aphrody.app/_img/${keys.base(project, sha)}${encodeURI(src)}?w=${w}&q=${q}&f=${format ?? "orig"}`,
  );
  const hit = cache
    ? ((await cache.match(key)) as Response | undefined)
    : undefined;
  if (hit) return hit;
  const obj = await env.BUCKET.get(keys.file(project, sha, src));
  if (!obj) return new Response("not found", { status: 404, headers: NOSTORE });
  let res: Response;
  if (env.IMAGES) {
    const out = await env.IMAGES.input(obj.body)
      .transform({ width: w, fit: "scale-down" })
      .output({
        format: format ?? obj.httpMetadata?.contentType ?? "image/png",
        quality: q,
      });
    const r = out.response() as Response;
    res = new Response(r.body, { headers: r.headers });
  } else {
    res = new Response(obj.body, {
      headers: {
        "content-type":
          obj.httpMetadata?.contentType ?? "application/octet-stream",
      },
    });
  }
  res.headers.set("cache-control", "public, max-age=31536000, immutable");
  res.headers.set("vary", "Accept");
  res.headers.set("x-content-type-options", "nosniff");
  if (cache) {
    const put = cache.put(key, res.clone());
    if (ctx) ctx.waitUntil(put);
    else await put;
  }
  return res;
}

const CONFIG = new Map<string, { at: number; v: Record<string, unknown> }>();

export async function readConfig(
  bucket: R2Like,
  project: string,
  fresh = false,
): Promise<Record<string, unknown>> {
  const c = CONFIG.get(project);
  if (!fresh && c && Date.now() - c.at < 10_000) return c.v;
  const o = await bucket.get(keys.config(project));
  const v = o ? ((await o.json()) as Record<string, unknown>) : {};
  CONFIG.set(project, { at: Date.now(), v });
  return v;
}
export const forgetConfig = (project: string) => CONFIG.delete(project);

async function config(
  env: RuntimeEnv,
  project: string,
  key: string,
): Promise<Response> {
  const all = await readConfig(env.BUCKET, project);
  const h = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "public, max-age=10",
    "x-content-type-options": "nosniff",
  };
  if (!key) return new Response(JSON.stringify(all), { headers: h });
  if (!Object.hasOwn(all, key))
    return new Response("null", { status: 404, headers: h });
  return new Response(JSON.stringify(all[key]), { headers: h });
}

// ---------- Durable Object (SQLite storage), one instance per project ----------

export interface Summary {
  days: number;
  views: number;
  byDay: { day: string; n: number }[];
  paths: { key: string; n: number }[];
  referrers: { key: string; n: number }[];
  countries: { key: string; n: number }[];
  devices: { key: string; n: number }[];
  vitals: Record<string, { p75: number; n: number }>;
}

interface SqlLike {
  exec(q: string, ...b: unknown[]): { toArray(): any[]; one?(): any };
}

const RANGE: Record<string, [number, number]> = {
  LCP: [0, 60_000],
  INP: [0, 60_000],
  FCP: [0, 60_000],
  TTFB: [0, 60_000],
  CLS: [0, 10],
};
const CAP = 50_000; // samples per metric and day

export class Insights {
  sql: SqlLike;
  constructor(state: { storage: { sql: SqlLike } }) {
    this.sql = state.storage.sql;
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS pv(day TEXT, path TEXT, ref TEXT, country TEXT, device TEXT, n INTEGER, PRIMARY KEY(day, path, ref, country, device))",
    );
    this.sql.exec(
      "CREATE TABLE IF NOT EXISTS vit(day TEXT, metric TEXT, path TEXT, v REAL)",
    );
    this.sql.exec("CREATE INDEX IF NOT EXISTS vit_dm ON vit(day, metric)");
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const day = new Date().toISOString().slice(0, 10);
    if (url.pathname === "/ingest") {
      let b: any;
      try {
        b = JSON.parse(await req.text());
      } catch {
        return new Response(null, { status: 400 });
      }
      const path = typeof b?.p === "string" ? b.p.slice(0, 200) : "/";
      if (b?.k === "pv") {
        let ref = "";
        try {
          ref = b.r ? new URL(String(b.r)).hostname.slice(0, 100) : "";
        } catch {}
        const country = (req.headers.get("x-country") ?? "XX").slice(0, 2);
        const device =
          req.headers.get("x-device") === "mobile" ? "mobile" : "desktop";
        this.sql.exec(
          "INSERT INTO pv VALUES (?, ?, ?, ?, ?, 1) ON CONFLICT(day, path, ref, country, device) DO UPDATE SET n = n + 1",
          day,
          path,
          ref,
          country,
          device,
        );
      } else if (b?.k === "v" && b.m && typeof b.m === "object") {
        for (const [metric, value] of Object.entries(b.m)) {
          const r = RANGE[metric];
          const v = Number(value);
          if (!r || !Number.isFinite(v) || v < r[0] || v > r[1]) continue;
          const n = this.sql
            .exec(
              "SELECT COUNT(*) AS n FROM vit WHERE day = ? AND metric = ?",
              day,
              metric,
            )
            .toArray()[0]?.n;
          if (n >= CAP) continue;
          this.sql.exec(
            "INSERT INTO vit VALUES (?, ?, ?, ?)",
            day,
            metric,
            path,
            v,
          );
        }
      }
      const old = new Date(Date.now() - 90 * 86400_000)
        .toISOString()
        .slice(0, 10);
      this.sql.exec("DELETE FROM pv WHERE day < ?", old);
      this.sql.exec("DELETE FROM vit WHERE day < ?", old);
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/summary") {
      const days = Math.min(
        90,
        Math.max(1, Number(url.searchParams.get("days") ?? 7)),
      );
      const from = new Date(Date.now() - (days - 1) * 86400_000)
        .toISOString()
        .slice(0, 10);
      const top = (col: string) =>
        this.sql
          .exec(
            `SELECT ${col} AS key, SUM(n) AS n FROM pv WHERE day >= ? GROUP BY ${col} ORDER BY n DESC LIMIT 10`,
            from,
          )
          .toArray();
      const byDay = this.sql
        .exec(
          "SELECT day, SUM(n) AS n FROM pv WHERE day >= ? GROUP BY day ORDER BY day",
          from,
        )
        .toArray();
      const vitals: Summary["vitals"] = {};
      for (const m of METRICS) {
        const n =
          this.sql
            .exec(
              "SELECT COUNT(*) AS n FROM vit WHERE day >= ? AND metric = ?",
              from,
              m,
            )
            .toArray()[0]?.n ?? 0;
        if (!n) continue;
        const p75 = this.sql
          .exec(
            "SELECT v FROM vit WHERE day >= ? AND metric = ? ORDER BY v LIMIT 1 OFFSET ?",
            from,
            m,
            Math.min(n - 1, Math.floor(n * 0.75)),
          )
          .toArray()[0]?.v;
        vitals[m] = { p75, n };
      }
      const s: Summary = {
        days,
        views: byDay.reduce((a: number, r: any) => a + r.n, 0),
        byDay,
        paths: top("path"),
        referrers: top("ref"),
        countries: top("country"),
        devices: top("device"),
        vitals,
      };
      return Response.json(s);
    }
    return new Response("not found", { status: 404 });
  }
}

/** Good / needs improvement / poor thresholds of web.dev (LCP, INP, CLS, FCP, TTFB). */
export function rating(metric: string, v: number): "good" | "ni" | "poor" {
  const t: Record<string, [number, number]> = {
    LCP: [2500, 4000],
    INP: [200, 500],
    CLS: [0.1, 0.25],
    FCP: [1800, 3000],
    TTFB: [800, 1800],
  };
  const [g, p] = t[metric] ?? [Infinity, Infinity];
  return v <= g ? "good" : v <= p ? "ni" : "poor";
}
