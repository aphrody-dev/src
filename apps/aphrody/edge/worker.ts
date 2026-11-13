/**
 * Cloudflare Worker of aphrody.com (route `aphrody.com/*`, custom domain www.aphrody.com).
 * Static pages come from the production deployment of project "aphrody" on aphrody.app
 * (R2 bucket aphrody-dist, pointer deploys/aphrody/_state.json, packages/deploy): a deploy or a
 * rollback moves the pointer, this Worker is not redeployed. Dynamic endpoints (/api/*, /g/*,
 * /search) go to the Bun origin on prd (ORIGIN_URL, or the zone origin through the tunnel when
 * ORIGIN_URL is empty).
 */
import {
  readState,
  serveProduction,
  type R2Like,
} from "../../../packages/deploy/src/serve.ts";
import {
  runtime,
  type DONamespace,
  type ImagesBinding,
} from "../../../packages/deploy/src/runtime.ts";

interface Env {
  BUCKET: R2Like;
  INSIGHTS?: DONamespace; // Durable Object Insights of the Worker aphrody-deploy (script_name)
  IMAGES?: ImagesBinding;
  ORIGIN_URL?: string;
  PROJECT?: string;
}

const dynamic = (p: string) =>
  p.startsWith("/api/") ||
  p.startsWith("/g/") ||
  p === "/search" ||
  p === "/healthz";

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx?: { waitUntil(p: Promise<unknown>): void },
  ): Promise<Response> {
    const url = new URL(request.url);
    if (url.hostname === "www.aphrody.com")
      return Response.redirect(
        `https://aphrody.com${url.pathname}${url.search}`,
        301,
      );
    // Former technical pages (package search, catalog and benchmark APIs): gone from the public site.
    if (url.pathname === "/search" || url.pathname.startsWith("/search/"))
      return Response.redirect("https://aphrody.com/", 301);
    if (/^\/api\/(pm|bnc)(\/|$)/.test(url.pathname))
      return new Response("gone\n", {
        status: 410,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "public, max-age=3600",
        },
      });
    if (dynamic(url.pathname)) {
      // Same-zone subrequest from a route Worker goes to the origin (cloudflared tunnel -> prd), not back here.
      const target = env.ORIGIN_URL
        ? new URL(url.pathname + url.search, env.ORIGIN_URL)
        : url;
      return fetch(new Request(target, request));
    }
    const project = env.PROJECT ?? "aphrody";
    // /_aphrody/*: analytics beacon, speed insights, image optimization, edge config (packages/deploy/src/runtime.ts).
    if (url.pathname.startsWith("/_aphrody/")) {
      const st = await readState(env.BUCKET, project);
      const rt = await runtime(
        request,
        env,
        project,
        st?.production ?? "",
        ctx,
      );
      if (rt) return rt;
    }
    const r = await serveProduction(env.BUCKET, project, request, ctx);
    return (
      r ??
      new Response(
        "aphrody.com: no production deployment (ay deploy aphrody)",
        { status: 503, headers: { "cache-control": "no-store" } },
      )
    );
  },
};
