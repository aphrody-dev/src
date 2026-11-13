// SPDX-License-Identifier: Apache-2.0
/**
 * Yolo Fullstack Production Server (Pure Bun v1.4.4)
 * Serves SSR HTMLRewriter CSP-nonced pages, pre-compressed Brotli/Gzip assets,
 * .yolo/graph.sqlite AST inspector, native Bun primitives diagnostics, M3 Symbols, and 3-VPS Search.
 */
import { existsSync, readFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { ThreeVpsSearchCluster } from "@aphrody/chromium-bun/search";
import { generatedSymbols, symbolSvg } from "../../packages/design/src/bun-plugin.ts";
import { searchSymbols } from "../../packages/design/src/runtime.ts";
import { buildYoloApp } from "./build.ts";
import { YoloModuleGraph } from "./src/framework/graph.ts";
import { runBunFullstackDiagnostics } from "./src/framework/primitives.ts";
import {
  BRAND_SEED,
  buildM3InlineThemeCss,
  generateCspNonce,
  renderSsrDocument,
} from "./src/framework/ssr.ts";

const APP_ROOT = import.meta.dir;
const DIST_DIR = join(APP_ROOT, "dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function securityHeaders(nonce?: string): Record<string, string> {
  const base: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  if (nonce) {
    base["Content-Security-Policy"] = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'unsafe-inline'`,
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
    ].join("; ");
  }
  return base;
}

export interface YoloServerHandle {
  readonly server: ReturnType<typeof Bun.serve>;
  readonly port: number;
  close(): void;
}

export async function startYoloServer(options?: {
  port?: number;
  autoBuild?: boolean;
}): Promise<YoloServerHandle> {
  if ((options?.autoBuild ?? true) && !existsSync(join(DIST_DIR, "app.js"))) {
    await buildYoloApp();
  }

  const htmlTemplate = readFileSync(join(DIST_DIR, "index.html"), "utf8");
  const graph = new YoloModuleGraph(
    APP_ROOT,
    join(APP_ROOT, ".yolo/graph.sqlite"),
  );
  let cachedGraph = graph.scanProject();
  const cluster = new ThreeVpsSearchCluster({ allowPrivateCrawl: false });

  const server = Bun.serve({
    port: options?.port ?? Number(Bun.env.PORT || 3092),
    async fetch(req) {
      const url = new URL(req.url);
      const path = url.pathname;

      if (path === "/ok" || path === "/healthz") {
        return Response.json(
          {
            ok: true,
            service: "yolo",
            bun: Bun.version,
            modules: cachedGraph.totalModules,
          },
          { headers: securityHeaders() },
        );
      }

      if (path === "/robots.txt") {
        return new Response(
          "User-agent: *\nAllow: /\nSitemap: https://yolo.aphrody.com/sitemap.xml\n",
          {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              ...securityHeaders(),
            },
          },
        );
      }

      if (path === "/sitemap.xml") {
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://yolo.aphrody.com/</loc></url></urlset>`,
          {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              ...securityHeaders(),
            },
          },
        );
      }

      if (path === "/api/graph") {
        if (url.searchParams.get("rescan") === "1") {
          cachedGraph = graph.scanProject();
        }
        return Response.json(cachedGraph, { headers: securityHeaders() });
      }

      if (path === "/api/primitives") {
        const report = await runBunFullstackDiagnostics();
        return Response.json(report, { headers: securityHeaders() });
      }

      if (path === "/api/theme") {
        const seed = url.searchParams.get("seed") || BRAND_SEED;
        return Response.json(
          { seed, css: buildM3InlineThemeCss(seed) },
          { headers: securityHeaders() },
        );
      }

      if (path === "/api/icons") {
        const q = url.searchParams.get("q") || "";
        const available = new Set(await generatedSymbols());
        const icons = await Promise.all(
          // Catalogue complet pour la recherche, rendu limité aux symboles générés par ay brand build.
          (await searchSymbols(q, 4000)).filter((n) => available.has(n)).slice(0, 24).map(async (name) => ({
            name,
            svg: await symbolSvg("rounded", name, 24),
          })),
        );
        return Response.json(
          { count: icons.length, icons },
          { headers: securityHeaders() },
        );
      }

      if (path === "/api/cluster/health") {
        const health = await cluster.probeClusterHealth(false);
        return Response.json(health, { headers: securityHeaders() });
      }

      if (path === "/api/cluster/search") {
        const q = url.searchParams.get("q") || "aphrody";
        const result = await cluster.search(q);
        return Response.json(result, { headers: securityHeaders() });
      }

      if (path === "/" || path === "/index.html") {
        const nonce = generateCspNonce();
        const seed = url.searchParams.get("seed") || BRAND_SEED;
        const html = renderSsrDocument(htmlTemplate, {
          nonce,
          seedHex: seed,
          canonicalUrl: `https://yolo.aphrody.com${path === "/" ? "/" : path}`,
          initialState: {
            bunVersion: Bun.version,
            moduleCount: cachedGraph.totalModules,
            seedHex: seed,
          },
        });

        const acceptEnc = req.headers.get("accept-encoding") || "";
        const bodyBytes = new TextEncoder().encode(html);
        if (acceptEnc.includes("gzip")) {
          const gzBytes = Bun.gzipSync(bodyBytes);
          return new Response(new Uint8Array(gzBytes), {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Content-Encoding": "gzip",
              "Cache-Control": "no-cache",
              ...securityHeaders(nonce),
            },
          });
        }
        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache",
            ...securityHeaders(nonce),
          },
        });
      }

      // Static asset serving from dist/ with path traversal guard & br/gzip negotiation
      const safeRel = normalize(path)
        .replace(/^(\.\.(\/|\\|$))+/, "")
        .replace(/^[/\\]+/, "");
      const targetPath = join(DIST_DIR, safeRel);
      if (!targetPath.startsWith(DIST_DIR) || !existsSync(targetPath)) {
        return new Response("Not Found", {
          status: 404,
          headers: securityHeaders(),
        });
      }

      const ext = extname(targetPath).toLowerCase();
      const mime = MIME_TYPES[ext] || "application/octet-stream";
      const acceptEnc = req.headers.get("accept-encoding") || "";
      const cacheHeader =
        ext === ".woff2" || ext === ".webp" || ext === ".png"
          ? "public, max-age=31536000, immutable"
          : "public, max-age=3600";

      if (acceptEnc.includes("br") && existsSync(`${targetPath}.br`)) {
        return new Response(Bun.file(`${targetPath}.br`), {
          headers: {
            "Content-Type": mime,
            "Content-Encoding": "br",
            "Cache-Control": cacheHeader,
            ...securityHeaders(),
          },
        });
      }
      if (acceptEnc.includes("gzip") && existsSync(`${targetPath}.gz`)) {
        return new Response(Bun.file(`${targetPath}.gz`), {
          headers: {
            "Content-Type": mime,
            "Content-Encoding": "gzip",
            "Cache-Control": cacheHeader,
            ...securityHeaders(),
          },
        });
      }

      return new Response(Bun.file(targetPath), {
        headers: {
          "Content-Type": mime,
          "Cache-Control": cacheHeader,
          ...securityHeaders(),
        },
      });
    },
  });

  const boundPort = server.port ?? 3092;
  return {
    server,
    port: boundPort,
    close() {
      server.stop(true);
      graph.close();
      cluster.close();
    },
  };
}

if (import.meta.main) {
  void startYoloServer().then((handle) => {
    console.log(
      `[yolo] Fullstack Aphrody Bun v${Bun.version} server listening on http://127.0.0.1:${handle.port}`,
    );
  });
}
