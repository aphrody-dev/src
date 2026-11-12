/**
 * Cloudflare Worker entry: static assets come from ./dist (ASSETS binding),
 * dynamic endpoints (/api/*, /g/*, /search) are proxied to the Bun origin
 * (the aphrody-web AOT binary or `bun run server.ts`) given by ORIGIN_URL.
 * Pure TypeScript, zero dependencies; the minimal Env type is declared locally.
 */

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
  ORIGIN_URL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const dynamic =
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/g/") ||
      url.pathname === "/search";
    if (!dynamic) return env.ASSETS.fetch(request);
    if (!env.ORIGIN_URL) {
      return new Response("Origin not configured (set ORIGIN_URL)", {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      });
    }
    return fetch(
      new Request(new URL(url.pathname + url.search, env.ORIGIN_URL), request),
    );
  },
};
