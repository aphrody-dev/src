import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { server } from "../server";
import {
  buildSitemaps,
  SITEMAP_FILES,
  adsTxt,
  sellersJson,
  securityTxt,
  robotsTxt,
  webmcpJson,
  indexNowKey,
  allIndexableUrls,
} from "../src/seo/documents";
import {
  renderHome,
  renderVertical,
  renderPackageHub,
  renderNews,
  renderSearchResults,
} from "../src/seo/html";
import { LOCALES, NEWS, VERTICALS, SITE_URL } from "../src/seo/site";
import { WEBMCP_TOOLS } from "../src/seo/webmcp-tools";
import {
  buildCsp,
  CONSENT_DEFAULT_SNIPPET,
  readGoogleConfig,
} from "../src/google/config";
import { handleCollect, MAX_RELAY_BODY_BYTES } from "../src/google/relay";
import { getHashEngine, loadFfiBlake3, strongEtag } from "../src/runtime/hash";
import { PAGE_CSS } from "../src/seo/page-css";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");
const IDS = {
  PUBLIC_GTM_ID: "GTM-ABC1234",
  PUBLIC_GA4_MEASUREMENT_ID: "G-TEST123456",
  PUBLIC_GOOGLE_ADS_ID: "AW-123456789",
  PUBLIC_ADSENSE_CLIENT_ID: "ca-pub-1234567890123456",
};

/** Minimal well-formedness check: balanced tags, single root, no bare ampersands. */
function assertWellFormed(xml: string): void {
  expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
  const body = xml.replace(/<\?xml[^>]*\?>/, "");
  expect(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;)/.test(body)).toBe(false);
  const stack: string[] = [];
  let roots = 0;
  for (const m of body.matchAll(/<(\/?)([A-Za-z][\w:.-]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClose] = m;
    if (selfClose) continue;
    if (closing) {
      expect(stack.pop()).toBe(name);
    } else {
      if (stack.length === 0) roots++;
      stack.push(name);
    }
  }
  expect(stack.length).toBe(0);
  expect(roots).toBe(1);
}

function ldGraph(html: string): Array<Record<string, any>> {
  const blocks = [
    ...html.matchAll(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    ),
  ];
  expect(blocks.length).toBe(1);
  const json = JSON.parse(blocks[0][1]);
  expect(json["@context"]).toBe("https://schema.org");
  return json["@graph"];
}

describe("Sitemap index and child sitemaps", () => {
  const files = buildSitemaps("2026-11-10");

  it("generates a valid sitemap index referencing the core and image sitemaps", () => {
    const index = files["sitemap.xml"];
    assertWellFormed(index);
    expect(index).toContain("<sitemapindex");
    for (const f of SITEMAP_FILES)
      expect(index).toContain(`<loc>${SITE_URL}/${f}</loc>`);
    expect(SITEMAP_FILES.length).toBe(2);
  });

  it("generates well-formed child sitemaps with hreflang alternates", () => {
    for (const f of SITEMAP_FILES) {
      assertWellFormed(files[f]);
      expect(files[f]).toContain("<urlset");
      for (const loc of files[f].matchAll(/<loc>([^<]+)<\/loc>/g))
        expect(loc[1].startsWith(SITE_URL)).toBe(true);
    }
    const core = files["sitemap-core.xml"];
    expect(core).toContain('hreflang="fr-FR"');
    expect(core).toContain('hreflang="en-US"');
    expect(core).toContain('hreflang="x-default"');
    expect(files["sitemap-images.xml"]).toContain("<image:loc>");
  });

  it("serves the index and children from the server and from dist", async () => {
    for (const f of ["sitemap.xml", ...SITEMAP_FILES]) {
      expect(existsSync(join(DIST, f))).toBe(true);
      const res = await server.fetch(new Request(`http://localhost:3000/${f}`));
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("xml");
      assertWellFormed(await res.text());
    }
  });

  it("lists every indexable URL for IndexNow", () => {
    const urls = allIndexableUrls();
    expect(urls).toContain(`${SITE_URL}/`);
    expect(urls).toContain(`${SITE_URL}/en`);
    expect(urls.some((u) => u.includes("/search/"))).toBe(false);
    expect(urls.some((u) => u.includes("ai-gemini"))).toBe(false);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("Schema.org JSON-LD @graph", () => {
  it("home pages carry an honest brand graph", () => {
    for (const l of LOCALES) {
      const html = renderHome(l, {});
      const graph = ldGraph(html);
      const types = graph.map((n) => n["@type"]);
      for (const t of ["Organization", "WebSite", "BreadcrumbList", "ItemList"])
        expect(types).toContain(t);
      for (const t of [
        "WebApplication",
        "SoftwareApplication",
        "FAQPage",
        "Dataset",
      ])
        expect(types).not.toContain(t);
      const site = graph.find((n) => n["@type"] === "WebSite")!;
      expect(site.potentialAction["@type"]).toBe("SearchAction");
      expect(site.potentialAction.target.urlTemplate).toContain(
        "{search_term_string}",
      );
      const org = graph.find((n) => n["@type"] === "Organization")!;
      expect(org.email).toBe("contact@aphrody.com");
      expect(org.sameAs).toEqual(["https://github.com/aphrody-dev"]);
      const list = graph.find((n) => n["@type"] === "ItemList")!;
      expect(list.itemListElement.map((i: { url: string }) => i.url)).toEqual([
        "https://aphrody.com/search",
        "https://aphrody.com" + (l === "fr" ? "" : "/en") + "/search/packages",
        "https://aphrody.com" +
          (l === "fr" ? "" : "/en") +
          "/search/benchmarks",
      ]);
      const raw = JSON.stringify(graph);
      expect(raw).not.toContain("aggregateRating");
      expect(raw).not.toContain("aphrody.app");
      expect(html).toContain(
        '<link rel="canonical" href="https://aphrody.com/',
      );
      expect(html).toContain(
        '<meta property="og:locale" content="' +
          (l === "fr" ? "fr_FR" : "en_US") +
          '">',
      );
    }
  });

  it("every topic hub carries a valid graph, canonical, hreflang and speculationrules", () => {
    for (const v of VERTICALS) {
      for (const l of LOCALES) {
        const html = renderVertical(v, l, {});
        const types = ldGraph(html).map((n) => n["@type"]);
        for (const t of [
          "Organization",
          "WebSite",
          "WebApplication",
          "BreadcrumbList",
          "FAQPage",
          "ItemList",
        ]) {
          expect(types).toContain(t);
        }
        expect(types.includes("Dataset")).toBe(v.slug === "benchmarks");
        expect(html).toContain('hreflang="fr-FR"');
        expect(html).toContain('hreflang="en-US"');
        expect(html).toContain('hreflang="x-default"');
        const rules = html.match(
          /<script type="speculationrules">([\s\S]*?)<\/script>/,
        );
        expect(rules).not.toBeNull();
        expect(JSON.parse(rules![1]).prefetch.length).toBeGreaterThan(0);
        expect(html.match(/<h1>/g)!.length).toBe(1);
      }
    }
  });

  it("package hubs, news and search results render valid pages", () => {
    const hub = renderPackageHub(
      "bun",
      [{ name: "x", description: "d", installCmd: "bun add x" }],
      "en",
      {},
    );
    expect(ldGraph(hub).map((n) => n["@type"])).toContain("ItemList");
    const news = renderNews(NEWS[0], "fr", {});
    expect(ldGraph(news).map((n) => n["@type"])).toContain("NewsArticle");
    const results = renderSearchResults(
      "<script>alert(1)</script>",
      "fr",
      [],
      [],
      {},
    );
    expect(results).not.toContain("<script>alert(1)</script>");
    expect(results).toContain("noindex");
  });

  it("built home exists in both languages with its JSON-LD graph", () => {
    expect(existsSync(join(DIST, "en", "index.html"))).toBe(true);
    // Technical hubs are no longer published.
    for (const v of VERTICALS)
      expect(existsSync(join(DIST, "search", v.slug, "index.html"))).toBe(
        false,
      );
    const html = readFileSync(join(DIST, "index.html"), "utf-8");
    // Holding home (src/holding/page.ts): Organization, WebSite, product ItemList. No SearchAction:
    // the site has no search, and Google retired the sitelinks search box on 2024-11-21.
    expect(ldGraph(html).length).toBe(3);
    expect(html).not.toContain("SearchAction");
  });
});

describe("Consent Mode v2 and Google stack", () => {
  it("default consent is denied for all advertising and analytics signals, before any external script", () => {
    const html = renderHome("fr", {});
    expect(html).toContain(CONSENT_DEFAULT_SNIPPET);
    for (const k of [
      "ad_storage",
      "ad_user_data",
      "ad_personalization",
      "analytics_storage",
    ]) {
      expect(CONSENT_DEFAULT_SNIPPET).toContain(`${k}:'denied'`);
      expect(CONSENT_DEFAULT_SNIPPET).not.toContain(`${k}:'granted'`);
    }
    expect(CONSENT_DEFAULT_SNIPPET).toContain("gtag('consent','default'");
    expect(html.indexOf("gtag('consent','default'")).toBeLessThan(
      html.indexOf('src="/boot.js"'),
    );
    expect(html).not.toContain("googletagmanager.com");
    expect(html).not.toContain("googlesyndication.com");
  });

  it("only valid env ids are accepted, and CSP opens only for configured services", () => {
    expect(readGoogleConfig({})).toEqual({});
    expect(
      readGoogleConfig({
        PUBLIC_GTM_ID: "<script>",
        PUBLIC_GA4_MEASUREMENT_ID: "nope",
      }),
    ).toEqual({});
    const cfg = readGoogleConfig(IDS);
    expect(cfg).toEqual({
      gtm: "GTM-ABC1234",
      ga4: "G-TEST123456",
      ads: "AW-123456789",
      adsense: "ca-pub-1234567890123456",
    });
    expect(buildCsp({})).not.toContain("googletagmanager");
    expect(buildCsp(cfg)).toContain("https://www.googletagmanager.com");
    expect(buildCsp(cfg)).toContain("https://pagead2.googlesyndication.com");
    expect(buildCsp({})).toContain("object-src 'none'");
  });

  it("boot.js defers loading, uses the relay, and shows an accessible banner", () => {
    const boot = readFileSync(join(DIST, "boot.js"), "utf-8");
    expect(boot).toContain("requestIdleCallback");
    expect(boot).toContain("server_container_url");
    expect(boot).toContain("consent-banner");
    expect(boot).toContain("aria-label");
    const css = readFileSync(join(DIST, "style.css"), "utf-8");
    expect(css).toContain(".consent-banner");
    expect(css).toContain("min-height:48px");
    expect(css).toContain("safe-area-inset-bottom");
  });

  it("reserves ad slots with fixed min-height and containment only when AdSense is configured", () => {
    const v = VERTICALS[0];
    expect(renderVertical(v, "fr", {})).not.toContain('class="ad-slot"');
    const withAds = renderVertical(v, "fr", readGoogleConfig(IDS));
    expect(withAds).toContain('class="ad-slot"');
    expect(withAds).toContain("ca-pub-1234567890123456");
    expect(PAGE_CSS).toContain("min-height:280px");
    expect(PAGE_CSS).toContain("contain:strict");
  });
});

describe("ads.txt, sellers.json, security.txt, humans.txt, robots.txt", () => {
  it("ads.txt authorizes Google only when AdSense is configured", () => {
    expect(adsTxt({ adsense: "ca-pub-1234567890123456" })).toContain(
      "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0",
    );
    expect(adsTxt({})).not.toMatch(/^google\.com,/m);
  });

  it("serves the compliance files", async () => {
    for (const p of [
      "/ads.txt",
      "/sellers.json",
      "/.well-known/security.txt",
      "/humans.txt",
      "/robots.txt",
      "/llms.txt",
      "/llms-full.txt",
    ]) {
      const res = await server.fetch(new Request(`http://localhost:3000${p}`));
      expect(res.status).toBe(200);
    }
    expect(sellersJson().sellers).toEqual([]);
    const sec = securityTxt("2026-11-10");
    expect(sec).toContain("Contact:");
    expect(sec).toContain("Expires: 2027-11-10");
    expect(
      JSON.parse(readFileSync(join(DIST, "sellers.json"), "utf-8")).version,
    ).toBe("1.0");
  });

  it("robots.txt names the search and AI crawlers and the sitemap index", () => {
    const robots = robotsTxt();
    for (const ua of [
      "*",
      "Googlebot",
      "Google-Extended",
      "OAI-SearchBot",
      "ClaudeBot",
      "PerplexityBot",
    ]) {
      expect(robots).toContain(`User-agent: ${ua}`);
    }
    expect(robots).toContain("Sitemap: https://aphrody.com/sitemap.xml");
  });

  it("IndexNow key file and endpoint work, submission needs a token", async () => {
    const key = indexNowKey({});
    expect(key).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
    expect(indexNowKey({ INDEXNOW_KEY: "custom-key-12345" })).toBe(
      "custom-key-12345",
    );
    const keyRes = await server.fetch(
      new Request(`http://localhost:3000/${key}.txt`),
    );
    expect(await keyRes.text()).toBe(key);
    const info = await (
      await server.fetch(new Request("http://localhost:3000/api/seo/indexnow"))
    ).json();
    expect(info.key).toBe(key);
    expect(info.urlList.length).toBeGreaterThanOrEqual(2);
    const denied = await server.fetch(
      new Request("http://localhost:3000/api/seo/indexnow", { method: "POST" }),
    );
    expect(denied.status).toBe(403);
  });
});

describe("First-party GA4 relay (/g/collect)", () => {
  it("is inert when no measurement id is configured", async () => {
    let called = 0;
    const res = await handleCollect(
      new Request("http://x/g/collect?tid=G-TEST123456"),
      {
        fetchImpl: (async () => {
          called++;
          return new Response();
        }) as unknown as typeof fetch,
      },
    );
    expect(res.status).toBe(204);
    expect(res.headers.get("x-aphrody-relay")).toBe("disabled");
    expect(called).toBe(0);
    const viaServer = await server.fetch(
      new Request("http://localhost:3000/g/collect?tid=G-TEST123456"),
    );
    expect(viaServer.status).toBe(204);
  });

  it("forwards only hits for the configured id and rejects abuse", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (u: string) => {
      calls.push(u);
      return new Response();
    }) as unknown as typeof fetch;
    const ok = await handleCollect(
      new Request("http://x/g/collect?v=2&tid=G-TEST123456&en=page_view"),
      { ga4: "G-TEST123456", fetchImpl },
    );
    expect(ok.status).toBe(204);
    expect(ok.headers.get("x-aphrody-relay")).toBe("forwarded");
    expect(calls.length).toBe(1);
    expect(calls[0]).toStartWith(
      "https://www.google-analytics.com/g/collect?v=2&tid=G-TEST123456",
    );
    const wrong = await handleCollect(
      new Request("http://x/g/collect?tid=G-OTHER000000"),
      { ga4: "G-TEST123456", fetchImpl },
    );
    expect(wrong.status).toBe(400);
    const big = await handleCollect(
      new Request("http://x/g/collect?tid=G-TEST123456", {
        method: "POST",
        body: "a".repeat(MAX_RELAY_BODY_BYTES + 1),
      }),
      { ga4: "G-TEST123456", fetchImpl },
    );
    expect(big.status).toBe(413);
    const put = await handleCollect(
      new Request("http://x/g/collect", { method: "PUT" }),
      { ga4: "G-TEST123456", fetchImpl },
    );
    expect(put.status).toBe(405);
    expect(calls.length).toBe(1);
  });
});

describe("WebMCP", () => {
  it("manifest lists every tool with a valid input schema", async () => {
    const manifest = webmcpJson() as {
      tools: Array<{ name: string; inputSchema: { type: string } }>;
    };
    expect(manifest.tools.map((t) => t.name)).toEqual(
      WEBMCP_TOOLS.map((t) => t.name),
    );
    for (const t of manifest.tools) expect(t.inputSchema.type).toBe("object");
    // The manifest describes technical tools (catalog, benchmarks): no longer published on the public site.
    expect(existsSync(join(DIST, ".well-known", "webmcp.json"))).toBe(false);
  });

  it("boot.js feature-detects navigator.modelContext", () => {
    const boot = readFileSync(join(DIST, "boot.js"), "utf-8");
    expect(boot).toContain("modelContext");
    expect(boot).toContain("registerTool");
    expect(boot).toContain("provideContext");
  });
});

describe("Zero-copy static serving, hashing and progressive enhancement", () => {
  it("serves pre-compressed buffers with strong ETag and honors If-None-Match", async () => {
    const first = await server.fetch(
      new Request("http://localhost:3000/style.css", {
        headers: { "accept-encoding": "br, gzip" },
      }),
    );
    expect(first.status).toBe(200);
    expect(first.headers.get("content-encoding")).toBe("br");
    expect(first.headers.get("vary")).toContain("Accept-Encoding");
    const etag = first.headers.get("etag")!;
    expect(etag).toMatch(/^"(b3|s2)-[0-9a-f]{32}-br"$/);
    const second = await server.fetch(
      new Request("http://localhost:3000/style.css", {
        headers: { "accept-encoding": "br", "if-none-match": etag },
      }),
    );
    expect(second.status).toBe(304);
    const gz = await server.fetch(
      new Request("http://localhost:3000/style.css", {
        headers: { "accept-encoding": "gzip" },
      }),
    );
    expect(gz.headers.get("content-encoding")).toBe("gzip");
    expect(gz.headers.get("etag")).not.toBe(etag);
  });

  it("hash engine falls back to SHA-256 and is stable", () => {
    expect(loadFfiBlake3(["C:/does/not/exist/rust_stack_ffi.dll"])).toBeNull();
    const e = getHashEngine();
    expect(["blake3-ffi", "sha256"]).toContain(e.name);
    expect(e.hex(new Uint8Array([1, 2, 3]))).toMatch(/^[0-9a-f]{64}$/);
    expect(strongEtag(new Uint8Array([1, 2, 3]))).toBe(
      strongEtag(new Uint8Array([1, 2, 3])),
    );
  });

  it("sends security, Link preload headers; 404s unknown paths; redirects trailing slashes", async () => {
    const home = await server.fetch(new Request("http://localhost:3000/"));
    expect(home.headers.get("link")).toContain("rel=preload");
    expect(home.headers.get("strict-transport-security")).toContain("max-age=");
    const missing = await server.fetch(
      new Request("http://localhost:3000/definitely-missing"),
    );
    expect(missing.status).toBe(404);
    const slash = await server.fetch(
      new Request("http://localhost:3000/search/web/", { redirect: "manual" }),
    );
    expect(slash.status).toBe(301);
    const traversal = await server.fetch(
      new Request("http://localhost:3000/..%2f..%2fpackage.json"),
    );
    expect(traversal.status).toBe(404);
  });

  it("home is complete without JavaScript, with the brand favicon set and generated illustrations", () => {
    const home = readFileSync(join(DIST, "index.html"), "utf-8");
    expect(home).not.toContain('<div id="root"></div>');
    expect(home).toContain('href="/art.svg#volt"');
    expect(existsSync(join(DIST, "art.svg"))).toBe(true);
    for (const id of ["nt", "aphrody-app", "ay"])
      expect(existsSync(join(DIST, "icons", `${id}.svg`))).toBe(true);
    // The served favicon set is the generated brand monogram (assets/brand/gen/icons/aphrody-labs), byte for byte.
    const gen = join(
      import.meta.dir,
      "..",
      "..",
      "..",
      "assets",
      "brand",
      "gen",
      "icons",
      "aphrody-labs",
    );
    for (const [from, to] of [
      ["favicon.ico", "favicon.ico"],
      ["icon.svg", "favicon.svg"],
      ["apple-touch-icon.png", "apple-touch-icon.png"],
    ] as const)
      expect(
        readFileSync(join(DIST, to)).equals(readFileSync(join(gen, from))),
      ).toBe(true);
  });
});
