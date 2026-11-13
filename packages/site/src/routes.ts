// File conventions of app/: page.ts, layout.ts, not-found.ts, route.ts, dynamic segments [param].
import { join } from "node:path";
import type { ResolvedSite } from "./config.ts";
import type { Html } from "./html.ts";
import type { Metadata } from "./metadata.ts";

export type Params = Record<string, string>;

export interface PageContext {
  site: ResolvedSite;
  locale: string;
  /** Unlocalized path of the page. */
  path: string;
  params: Params;
}

export interface PageModule {
  default: (ctx: PageContext) => Html | string | Promise<Html | string>;
  metadata?: Metadata | ((ctx: PageContext) => Metadata | Promise<Metadata>);
  generateStaticParams?: () => Params[] | Promise<Params[]>;
}

export interface LayoutModule {
  default: (
    ctx: PageContext & { children: Html; head: Html },
  ) => Html | string | Promise<Html | string>;
}

export type Handler = (
  req: Request,
  params: Params,
) => Response | Promise<Response>;
export type RouteModule = Partial<
  Record<"GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD", Handler>
>;

export interface ScannedRoute {
  kind: "page" | "route" | "not-found" | "layout";
  /** Pattern such as /blog/[slug] ("/" for the root). */
  pattern: string;
  file: string;
  params: string[];
}

const KINDS = ["page", "layout", "not-found", "route"] as const;

/** Scan app/ (sorted, deterministic). Route groups "(name)" do not appear in the URL. */
export function scanApp(appDir: string): ScannedRoute[] {
  const out: ScannedRoute[] = [];
  for (const rel of new Bun.Glob(
    "**/{page,layout,not-found,route}.{ts,tsx}",
  ).scanSync({ cwd: appDir })) {
    const parts = rel.replace(/\\/g, "/").split("/");
    const base = parts.pop()!.replace(/\.tsx?$/, "") as (typeof KINDS)[number];
    const segs = parts.filter((s) => !/^\(.*\)$/.test(s));
    for (const s of segs)
      if (!/^(\[[A-Za-z_][\w]*\]|[\w.~-]+)$/.test(s))
        throw new Error(`app/${rel}: invalid segment ${s}`);
    out.push({
      kind: base,
      pattern: `/${segs.join("/")}`,
      file: join(appDir, rel),
      params: segs.filter((s) => s.startsWith("[")).map((s) => s.slice(1, -1)),
    });
  }
  const dup = new Set<string>();
  for (const r of out) {
    const k = `${r.kind}:${r.pattern}`;
    if (dup.has(k)) throw new Error(`duplicate ${r.kind} for ${r.pattern}`);
    dup.add(k);
  }
  const pr = out.filter((r) => r.kind === "page" || r.kind === "route");
  for (const p of pr)
    if (pr.some((q) => q !== p && q.pattern === p.pattern))
      throw new Error(`page and route both define ${p.pattern}`);
  return out.sort(
    (a, b) =>
      a.pattern.localeCompare(b.pattern) || a.kind.localeCompare(b.kind),
  );
}

/** Layouts wrapping a pattern, outermost first. */
export function layoutsFor(
  routes: ScannedRoute[],
  pattern: string,
): ScannedRoute[] {
  const segs = pattern.split("/").filter(Boolean);
  const chain: ScannedRoute[] = [];
  for (let i = 0; i <= segs.length; i++) {
    const p = `/${segs.slice(0, i).join("/")}`;
    const l = routes.find((r) => r.kind === "layout" && r.pattern === p);
    if (l) chain.push(l);
  }
  return chain;
}

/** Concrete path of a pattern for params; values are URL-encoded. */
export function fillPattern(pattern: string, params: Params): string {
  return pattern.replace(/\[(\w+)\]/g, (_, k: string) => {
    const v = params[k];
    if (v === undefined || v === "")
      throw new Error(`${pattern}: missing param ${k}`);
    return encodeURIComponent(v);
  });
}

/** Match a URL path against a pattern; returns params or null. */
export function matchPattern(pattern: string, path: string): Params | null {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.startsWith("["))
      params[a[i]!.slice(1, -1)] = decodeURIComponent(b[i]!);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

/** HTML file of a page path: / -> index.html, /a/b -> a/b/index.html. */
export const htmlFile = (path: string) =>
  path === "/" ? "index.html" : `${path.replace(/^\/|\/$/g, "")}/index.html`;
