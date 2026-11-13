import { serve } from "bun";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { getSuggestions } from "./src/data/suggestions";
import { UniversalStoreManager } from "./src/store/universal-manager";
import { runBenchmarkSuite } from "./src/benchmark/stack-picker";
import { AssetStore, respondWithAsset } from "./src/runtime/assets";
import { getHashEngine } from "./src/runtime/hash";
import {
  buildCsp,
  readGoogleConfig,
  type GoogleConfig,
} from "./src/google/config";
import { handleCollect } from "./src/google/relay";
import { indexNowKey, indexNowPayload } from "./src/seo/documents";
import { render404, renderSearchResults } from "./src/seo/html";
import type { Locale } from "./src/seo/site";
import { PLAY_CSP } from "./src/play/page";
import { handleOs, isOs, osHeaders } from "./src/os/server";

const PORT = Number(process.env.PORT) || 3000;

function resolveDist(): string {
  if (process.env.APHRODY_DIST) return process.env.APHRODY_DIST;
  const candidates = [
    join(import.meta.dir, "dist"),
    join(dirname(process.execPath), "dist"),
    join(process.cwd(), "dist"),
  ];
  return (
    candidates.find((c) => existsSync(join(c, "index.html"))) || candidates[0]
  );
}

const DIST_DIR = resolveDist();
const storeManager = UniversalStoreManager.getInstance("var/store.sqlite");
const assets = new AssetStore(DIST_DIR);

/** Google ids: runtime env first, else the config baked into dist/ by the build. */
function loadGoogleConfig(): GoogleConfig {
  const fromEnv = readGoogleConfig(process.env);
  if (Object.keys(fromEnv).length) return fromEnv;
  try {
    return readGoogleConfig(
      JSON.parse(readFileSync(join(DIST_DIR, "g-cfg.json"), "utf-8")) as never,
    );
  } catch {
    return {};
  }
}
const GOOGLE_CFG = loadGoogleConfig();
const INDEXNOW_KEY = indexNowKey(process.env);

const SECURITY_HEADERS: Record<string, string> = {
  "Content-Security-Policy": buildCsp(GOOGLE_CFG),
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "microphone=(), camera=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-XSS-Protection": "1; mode=block",
};

/** /play ships a wasm module: its own CSP (adds wasm-unsafe-eval, no third party). */
const PLAY_HEADERS: Record<string, string> = {
  ...SECURITY_HEADERS,
  "Content-Security-Policy": PLAY_CSP,
  "Permissions-Policy":
    "microphone=(), camera=(), geolocation=(), gamepad=(self)",
};
const OS_HEADERS = osHeaders(SECURITY_HEADERS);
const isPlay = (pathname: string) =>
  pathname === "/play" || pathname.startsWith("/play/");

/** CDNs (for example Cloudflare) can turn these Link headers into 103 Early Hints. */
const LINK_HOME =
  '</atkinson-next.woff2>; rel=preload; as=font; type="font/woff2"; crossorigin, </boot.js>; rel=modulepreload';
const LINK_PAGE =
  "</style.css>; rel=preload; as=style, </boot.js>; rel=modulepreload";

function jsonResponse(data: unknown, status = 200, req?: Request): Response {
  const payload = JSON.stringify(data);
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache",
    ...SECURITY_HEADERS,
  };
  if (req && (req.headers.get("accept-encoding") || "").includes("gzip")) {
    headers["Content-Encoding"] = "gzip";
    return new Response(Bun.gzipSync(Buffer.from(payload)), {
      status,
      headers,
    });
  }
  return new Response(payload, { status, headers });
}

function withSecurity(res: Response): Response {
  for (const [k, v] of Object.entries(SECURITY_HEADERS))
    if (!res.headers.has(k)) res.headers.set(k, v);
  return res;
}

function localeOf(req: Request, url: URL): Locale {
  const hl = url.searchParams.get("hl");
  if (hl === "en" || hl === "fr") return hl;
  if (url.pathname.startsWith("/en/") || url.pathname === "/en") return "en";
  return (req.headers.get("accept-language") || "")
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "fr";
}

function clientId(
  req: Request,
  srv?: { requestIP?: (r: Request) => { address: string } | null },
): string {
  const fwd =
    req.headers.get("cf-connecting-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
  return fwd || srv?.requestIP?.(req)?.address || "local";
}

function htmlHeaders(pathname: string): Record<string, string> {
  return {
    ...(isOs(pathname)
      ? OS_HEADERS
      : isPlay(pathname)
      ? PLAY_HEADERS
      : {
          Link: pathname === "/" || pathname === "/en" ? LINK_HOME : LINK_PAGE,
          ...SECURITY_HEADERS,
        }),
  };
}

export const server = serve({
  port: PORT,
  async fetch(
    req: Request,
    srv?: { requestIP?: (r: Request) => { address: string } | null },
  ) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // 1. API: Autocomplete Suggestions (short: /api/q, legacy: /api/complete)
    if (pathname === "/api/q" || pathname === "/api/complete") {
      const q = url.searchParams.get("q") || "";
      const suggestions = getSuggestions(q);
      return jsonResponse({ query: q, suggestions }, 200, req);
    }

    // 2. Health check (short: /ok, legacy: /healthz, /api/health)
    if (
      pathname === "/ok" ||
      pathname === "/healthz" ||
      pathname === "/api/health"
    ) {
      return jsonResponse(
        { status: "healthy", service: "aphrody", hash: getHashEngine().name },
        200,
        req,
      );
    }

    // 3. API: Store Search (short: /api/pm, legacy: /api/store/search)
    if (pathname === "/api/pm" || pathname === "/api/store/search") {
      const q = url.searchParams.get("q") || "";
      const eco = (url.searchParams.get("ecosystem") || "all") as any;
      const packages = await storeManager.search(q, eco);
      return jsonResponse(
        { query: q, ecosystem: eco, count: packages.length, packages },
        200,
        req,
      );
    }

    // 7. API: Performance, LTO, AOT & Zero-Copy Stack Benchmark (short: /api/bnc, legacy: /api/bench)
    if (pathname === "/api/bnc" || pathname === "/api/bench") {
      try {
        const report = await runBenchmarkSuite();
        return jsonResponse(report, 200, req);
      } catch (err: any) {
        return jsonResponse({ error: err.message }, 500, req);
      }
    }

    // 9. First-party GA4 relay
    if (pathname === "/g/collect") {
      return withSecurity(await handleCollect(req, { ga4: GOOGLE_CFG.ga4 }));
    }

    // 10. IndexNow: GET = dry-run payload, POST = submit (requires INDEXNOW_ADMIN_TOKEN)
    if (pathname === "/api/seo/indexnow") {
      const payload = indexNowPayload(INDEXNOW_KEY);
      if (req.method === "GET")
        return jsonResponse(
          { submit: "POST with Authorization: Bearer <token>", ...payload },
          200,
          req,
        );
      if (req.method === "POST") {
        const token = process.env.INDEXNOW_ADMIN_TOKEN || "";
        if (!token || req.headers.get("authorization") !== `Bearer ${token}`) {
          return jsonResponse({ error: "forbidden" }, 403, req);
        }
        try {
          const r = await fetch("https://api.indexnow.org/indexnow", {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(8000),
          });
          return jsonResponse(
            {
              submitted: (payload.urlList as string[]).length,
              status: r.status,
            },
            200,
            req,
          );
        } catch (err: any) {
          return jsonResponse(
            { error: "upstream_failed", message: String(err?.message || err) },
            502,
            req,
          );
        }
      }
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, POST" },
      });
    }

    // 11. IndexNow key file
    if (pathname === `/${INDEXNOW_KEY}.txt`) {
      return new Response(INDEXNOW_KEY, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, max-age=86400",
          ...SECURITY_HEADERS,
        },
      });
    }

    // 12. No-JavaScript search results page (noindex)
    // The former AI mode pages are gone for good (AI features live only in packages/ai-os).
    if (
      pathname === "/search/ai-gemini" ||
      pathname === "/en/search/ai-gemini"
    ) {
      return withSecurity(
        new Response("Gone", {
          status: 410,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
      );
    }

    if (pathname === "/search") {
      const q = (url.searchParams.get("q") || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 200);
      const locale = localeOf(req, url);
      const pkgs = q ? (await storeManager.search(q, "all")).slice(0, 6) : [];
      const html = renderSearchResults(
        q,
        locale,
        q
          ? getSuggestions(q)
              .slice(0, 8)
              .map((s) => s.text)
          : [],
        pkgs.map((p) => ({
          name: p.name,
          description: p.description,
          installCmd: p.installCmd,
        })),
        GOOGLE_CFG,
      );
      return new Response(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "private, no-cache",
          ...htmlHeaders(pathname),
        },
      });
    }

    // 12b. /os: VM image proxy, console data, open package catalog
    if (isOs(pathname)) {
      const r = await handleOs(req, url, storeManager, jsonResponse);
      if (r) return withSecurity(r);
    }

    // 13. Static assets from memory (pre-compressed, strong ETag, 304)
    if (req.method !== "GET" && req.method !== "HEAD") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD", ...SECURITY_HEADERS },
      });
    }
    if (pathname.length > 1 && pathname.endsWith("/")) {
      return Response.redirect(
        url.origin + pathname.slice(0, -1) + url.search,
        301,
      );
    }

    const asset = assets.get(pathname);
    if (asset) {
      return respondWithAsset(
        req,
        asset,
        asset.ext === ".html"
          ? htmlHeaders(pathname)
          : isOs(pathname)
            ? OS_HEADERS
            : isPlay(pathname)
              ? PLAY_HEADERS
              : SECURITY_HEADERS,
      );
    }

    return new Response(render404(localeOf(req, url), GOOGLE_CFG), {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-cache",
        ...htmlHeaders(pathname),
      },
    });
  },
});

console.log(`Aphrody server running at http://localhost:${server.port}`);
