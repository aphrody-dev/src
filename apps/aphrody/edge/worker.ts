/**
 * Cloudflare Worker of aphrody.com (route `aphrody.com/*`, custom domain www.aphrody.com).
 * Static pages come from the production deployment of project "aphrody" on aphrody.app
 * (R2 bucket aphrody-dist, pointer deploys/aphrody/_state.json, packages/deploy): a deploy or a
 * rollback moves the pointer, this Worker is not redeployed. Dynamic endpoints (/api/*, /g/*,
 * /search) go to the Bun origin on prd (ORIGIN_URL, or the zone origin through the tunnel when
 * ORIGIN_URL is empty).
 */
import {
  serveProduction,
  type R2Like,
} from "../../../packages/deploy/src/serve.ts";

interface Env {
  BUCKET: R2Like;
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
    if (dynamic(url.pathname)) {
      // Same-zone subrequest from a route Worker goes to the origin (cloudflared tunnel -> prd), not back here.
      const target = env.ORIGIN_URL
        ? new URL(url.pathname + url.search, env.ORIGIN_URL)
        : url;
      return fetch(new Request(target, request));
    }
    const r = await serveProduction(
      env.BUCKET,
      env.PROJECT ?? "aphrody",
      request,
      ctx,
    );
    return (
      r ??
      new Response(
        "aphrody.com: no production deployment (ay deploy aphrody)",
        { status: 503, headers: { "cache-control": "no-store" } },
      )
    );
  },
};
