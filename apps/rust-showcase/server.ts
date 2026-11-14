import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = import.meta.dir;
const repoRoot = resolve(root, "../..");
const port = Number(process.env.SHOWCASE_PORT ?? "4480");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".wasm": "application/wasm",
  ".json": "application/json; charset=utf-8",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
};

const transpiler = new Bun.Transpiler({ loader: "ts" });

function withHeaders(resp: Response): Response {
  const headers = new Headers(resp.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cache-Control", "no-store");
  return new Response(resp.body, { status: resp.status, headers });
}

const server = Bun.serve({
  hostname: "127.0.0.1",
  port,
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname === "/api/health") {
      return withHeaders(
        Response.json({
          ok: true,
          service: "rust-showcase-web",
          wasmReady: existsSync(join(root, "public/pkg/rust_showcase_bg.wasm")),
        }),
      );
    }

    if (pathname === "/tokens.css") {
      const file = Bun.file(
        join(repoRoot, "packages/design/tokens/tokens.css"),
      );
      if (await file.exists()) {
        return withHeaders(
          new Response(file, { headers: { "Content-Type": MIME[".css"]! } }),
        );
      }
    }

    if (pathname === "/fonts.css") {
      const file = Bun.file(join(repoRoot, "assets/brand/gen/fonts/fonts.css"));
      if (await file.exists()) {
        return withHeaders(
          new Response(file, { headers: { "Content-Type": MIME[".css"]! } }),
        );
      }
    }

    if (pathname.startsWith("/fonts/")) {
      const rel = pathname.slice("/fonts/".length);
      const file = Bun.file(join(repoRoot, "assets/brand/gen/fonts", rel));
      if (await file.exists()) {
        return withHeaders(
          new Response(file, {
            headers: {
              "Content-Type": MIME[extname(rel)] ?? "application/octet-stream",
            },
          }),
        );
      }
    }

    if (pathname === "/app.js") {
      const tsSource = await Bun.file(join(root, "src/app.ts")).text();
      const js = transpiler.transformSync(tsSource);
      return withHeaders(
        new Response(js, { headers: { "Content-Type": MIME[".js"]! } }),
      );
    }

    const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const candidate = resolve(root, "public", rel);
    if (!candidate.startsWith(resolve(root, "public"))) {
      return withHeaders(new Response("Forbidden", { status: 403 }));
    }

    const f = Bun.file(candidate);
    if (await f.exists()) {
      const ct = MIME[extname(candidate)] ?? "application/octet-stream";
      return withHeaders(new Response(f, { headers: { "Content-Type": ct } }));
    }

    return withHeaders(new Response("Not found", { status: 404 }));
  },
});

console.log(`[rust-showcase-web] listening on http://127.0.0.1:${server.port}`);
