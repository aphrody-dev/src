// Bun server of a built site: route.ts handlers first, then dist/ with _headers, _redirects, .br/.gz and 404.html.
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { headersFor, parseHeaders } from "./headers.ts";
import {
  type RouteModule,
  type ScannedRoute,
  matchPattern,
  scanApp,
} from "./routes.ts";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

export interface ServeOptions {
  dist: string;
  /** app/ directory whose route.ts files are served. */
  appDir?: string;
  port?: number;
  hostname?: string;
}

export async function loadRoutes(
  appDir: string,
): Promise<{ route: ScannedRoute; mod: RouteModule }[]> {
  const rs = scanApp(appDir).filter((r) => r.kind === "route");
  return Promise.all(
    rs.map(async (route) => ({
      route,
      mod: (await import(route.file)) as RouteModule,
    })),
  );
}

export async function createHandler(
  o: ServeOptions,
): Promise<(req: Request) => Promise<Response>> {
  const dist = normalize(o.dist);
  const rules = existsSync(join(dist, "_headers"))
    ? parseHeaders(readFileSync(join(dist, "_headers"), "utf8"))
    : [];
  const redirects = existsSync(join(dist, "_redirects"))
    ? readFileSync(join(dist, "_redirects"), "utf8")
        .split(/\r?\n/)
        .filter((l) => l.trim())
        .map((l) => l.trim().split(/\s+/) as [string, string, string?])
    : [];
  const routes = o.appDir ? await loadRoutes(o.appDir) : [];
  const fileOf = (p: string): string | null => {
    const rel = normalize(decodeURIComponent(p)).replace(/^[/\\]+/, "");
    for (const c of [rel, join(rel, "index.html"), `${rel}.html`]) {
      const f = join(dist, c);
      if (!(f === dist || f.startsWith(dist + sep))) return null;
      if (
        existsSync(f) &&
        statSync(f).isFile() &&
        !c.split(/[/\\]/).some((s) => s.startsWith("_") && s !== "_static")
      )
        return f;
    }
    return null;
  };
  const send = (
    req: Request,
    f: string,
    path: string,
    status = 200,
  ): Response => {
    const h: Record<string, string> = {
      ...headersFor(rules, path),
      "Content-Type": MIME[extname(f)] ?? "application/octet-stream",
      Vary: "Accept-Encoding",
    };
    const ae = req.headers.get("accept-encoding") ?? "";
    for (const [enc, ext] of [
      ["br", ".br"],
      ["gzip", ".gz"],
    ] as const)
      if (ae.includes(enc) && existsSync(f + ext))
        return new Response(Bun.file(f + ext), {
          status,
          headers: { ...h, "Content-Encoding": enc },
        });
    return new Response(Bun.file(f), { status, headers: h });
  };
  return async (req) => {
    const url = new URL(req.url);
    const path = url.pathname;
    for (const [from, to, code] of redirects)
      if (from === path)
        return Response.redirect(new URL(to!, url).href, Number(code ?? 301));
    for (const { route, mod } of routes) {
      const params = matchPattern(route.pattern, path);
      if (!params) continue;
      const h =
        mod[req.method as keyof RouteModule] ??
        (req.method === "HEAD" ? mod.GET : undefined);
      if (!h) return new Response("Method Not Allowed", { status: 405 });
      const res = await h(req, params);
      for (const [k, v] of Object.entries(headersFor(rules, path)))
        if (k !== "Cache-Control" && !res.headers.has(k)) res.headers.set(k, v);
      if (!res.headers.has("Cache-Control"))
        res.headers.set("Cache-Control", "no-store");
      return res;
    }
    const f = fileOf(path);
    if (f) return send(req, f, path);
    const nf = join(dist, "404.html");
    return existsSync(nf)
      ? send(req, nf, "/404.html", 404)
      : new Response("Not Found", { status: 404 });
  };
}

export async function serveSite(o: ServeOptions) {
  const fetch = await createHandler(o);
  return Bun.serve({
    port: o.port ?? Number(Bun.env.PORT || 3000),
    hostname: o.hostname,
    fetch,
  });
}
