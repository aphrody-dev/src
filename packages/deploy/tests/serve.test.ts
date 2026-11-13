import { describe, expect, test } from "bun:test";
import { cap404, parseHeaders, serveStatic } from "../src/serve.ts";

// R2 subset: ranges and If-None-Match (onlyIf) like the binding.
function bucket(files: Record<string, string>) {
  return {
    get: async (k: string, o?: { range?: Headers; onlyIf?: Headers }) => {
      if (!(k in files)) return null;
      const data = files[k]!;
      const etag = `"${k.length}-${data.length}"`;
      const base = {
        size: data.length,
        httpEtag: etag,
        writeHttpMetadata: (h: Headers) =>
          h.set(
            "content-type",
            k.endsWith(".html") ? "text/html" : "application/octet-stream",
          ),
        text: async () => data,
      };
      if (o?.onlyIf?.get("if-none-match") === etag) return base;
      const m = o?.range?.get("range")?.match(/^bytes=(\d+)-(\d+)$/);
      if (m) {
        const offset = Number(m[1]);
        const length = Number(m[2]) - offset + 1;
        return {
          ...base,
          range: { offset, length },
          body: data.slice(offset, offset + length),
        };
      }
      return { ...base, body: data };
    },
    put: async () => {},
  };
}
const req = (path: string, h: Record<string, string> = {}) =>
  new Request(`https://cdn.aphrody.com${path}`, { headers: h });

describe("serveStatic", () => {
  const b = bucket({
    "brand/v2/mark.svg": "<svg/>",
    "_static/app-abc123.js": "x",
    "index.html": "<p>home</p>",
    "docs/index.html": "<p>docs</p>",
    "big.bin": "0123456789",
    "404.html": "<p>404</p>",
    _headers:
      "/*.bin\n  Cache-Control: public, max-age=99\n/missing\n  Cache-Control: public, max-age=31536000\n",
    "site/index.html": "<p>spa</p>",
  });

  test("brand/v<N> and _static are immutable, brand is cross-origin", async () => {
    const r = await serveStatic(b, req("/brand/v2/mark.svg"), { prefix: "" });
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toBe(
      "public, max-age=31536000, immutable",
    );
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
    expect(r.headers.get("cross-origin-resource-policy")).toBe("cross-origin");
    expect(r.headers.get("timing-allow-origin")).toBe("*");
    const s = await serveStatic(b, req("/_static/app-abc123.js"), {
      prefix: "",
    });
    expect(s.headers.get("cache-control")).toContain("immutable");
    expect(s.headers.get("access-control-allow-origin")).toBeNull();
  });

  test("crossOrigin applies to every path and answers preflight", async () => {
    const r = await serveStatic(b, req("/big.bin"), {
      prefix: "",
      crossOrigin: true,
    });
    expect(r.headers.get("timing-allow-origin")).toBe("*");
    const o = await serveStatic(
      b,
      new Request("https://cdn.aphrody.com/x", { method: "OPTIONS" }),
      {
        prefix: "",
        crossOrigin: true,
      },
    );
    expect(o.status).toBe(204);
  });

  test("range 206, ETag 304, _headers rules", async () => {
    const r = await serveStatic(b, req("/big.bin", { range: "bytes=2-5" }), {
      prefix: "",
    });
    expect(r.status).toBe(206);
    expect(r.headers.get("content-range")).toBe("bytes 2-5/10");
    expect(await r.text()).toBe("2345");
    expect(r.headers.get("cache-control")).toBe("public, max-age=99");
    const etag = (
      await serveStatic(b, req("/big.bin"), { prefix: "" })
    ).headers.get("etag")!;
    const n = await serveStatic(b, req("/big.bin", { "if-none-match": etag }), {
      prefix: "",
    });
    expect(n.status).toBe(304);
  });

  test("indexes, SPA fallback, 404 never cached beyond 60 s", async () => {
    expect(await (await serveStatic(b, req("/"), { prefix: "" })).text()).toBe(
      "<p>home</p>",
    );
    expect(
      await (await serveStatic(b, req("/docs"), { prefix: "" })).text(),
    ).toBe("<p>docs</p>");
    const spa = await serveStatic(b, req("/app/route"), {
      prefix: "site/",
      spa: true,
    });
    expect([spa.status, await spa.text()]).toEqual([200, "<p>spa</p>"]);
    const nf = await serveStatic(b, req("/missing"), { prefix: "" });
    expect(nf.status).toBe(404);
    expect(nf.headers.get("cache-control")).toBe("public, max-age=60");
    const raw = await serveStatic(b, req("/brand/v2/nope.svg"), {
      prefix: "site",
    });
    expect(raw.status).toBe(404);
    expect(raw.headers.get("cache-control")).not.toContain("immutable");
    expect((await serveStatic(b, req("/..%2fx"), { prefix: "" })).status).toBe(
      404,
    );
  });

  test("cap404 and parseHeaders", () => {
    expect(cap404("public, max-age=31536000, immutable")).toBe(
      "public, max-age=0, must-revalidate",
    );
    expect(cap404("public, max-age=30")).toBe("public, max-age=30");
    expect(cap404("public, s-maxage=600")).toBe("public, s-maxage=600");
    expect(parseHeaders("/a\n  X: 1\n")[0]!.h).toEqual([["X", "1"]]);
  });
});
