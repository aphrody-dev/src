// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "bun:test";
import {
  ContentShieldsEngine,
  SsrfGuard,
  THREE_VPS_CLUSTER_TOPOLOGY,
  ThreeVpsSearchCluster,
  assertNodeWorkloadAllowed,
  auditUrlInRealChromium,
  ChromiumTrackingEngine,
  compareDottedVersions,
  DualEngineCoordinator,
  encodeBoqFreq,
  findLocalChromiumBinary,
  isAllowedByRobotsTxt,
  parseBoqEnvelopes,
  parseRobotsTxt,
  SovereignGroundingVerifier,
  V8PageIsolateConfig,
} from "../src/index.ts";

describe("@aphrody/chromium-bun — Browser, Crawler & 3-VPS Datacenter Search", () => {
  test("SSRF Guard blocks loopback, WireGuard mesh, and cloud metadata IPs", async () => {
    const guard = new SsrfGuard();
    expect(await guard.isSafe("http://127.0.0.1:8080/admin")).toBe(false);
    expect(await guard.isSafe("http://10.200.77.1:9000/internal")).toBe(false);
    expect(await guard.isSafe("http://169.254.169.254/latest/meta-data/")).toBe(
      false,
    );
    expect(
      await guard.isSafe("http://metadata.google.internal/computeMetadata/v1/"),
    ).toBe(false);
    expect(await guard.isSafe("http://[::1]:3000/")).toBe(false);
    expect(await guard.isSafe("https://93.184.216.34/")).toBe(true);
  });

  test("Content Shields strips scripts/trackers via HTMLRewriter and extracts clean DOM metadata", () => {
    const shields = new ContentShieldsEngine();
    expect(
      shields.shouldBlockUrl("https://www.googletagmanager.com/gtm.js"),
    ).toBe(true);
    expect(shields.shouldBlockUrl("https://aphrody.com/assets/app.js")).toBe(
      false,
    );

    const html = `<!doctype html>
      <html>
        <head>
          <title>Aphrody Sovereign Search</title>
          <meta name="description" content="Distributed 3-VPS BM25 + RRF engine" />
          <script>window.evil = 1;</script>
        </head>
        <body>
          <h1>Cluster Search Engine</h1>
          <p>Sub-millisecond FTS5 ranking over WireGuard 10.200.77.0/24.</p>
          <a href="/docs/architecture">Architecture</a>
          <a href="https://doubleclick.net/pixel.gif">Ad Pixel</a>
        </body>
      </html>`;

    const doc = shields.extractCleanDocument(html, "https://aphrody.com/");
    expect(doc.title).toBe("Aphrody Sovereign Search");
    expect(doc.description).toBe("Distributed 3-VPS BM25 + RRF engine");
    expect(doc.headings).toContain("Cluster Search Engine");
    expect(doc.text).not.toContain("window.evil");
    expect(doc.links).toEqual(["https://aphrody.com/docs/architecture"]);
    expect(doc.trackersBlocked).toBe(1);
  });

  test("RFC 9309 robots.txt parser enforces longest-match allow/disallow rules", () => {
    const rules = parseRobotsTxt(
      [
        "User-agent: *",
        "Disallow: /private",
        "Allow: /private/public-doc",
        "Crawl-delay: 1",
      ].join("\n"),
      "aphrodybot",
    );

    expect(isAllowedByRobotsTxt(rules, "https://aphrody.com/docs")).toBe(true);
    expect(
      isAllowedByRobotsTxt(rules, "https://aphrody.com/private/secret"),
    ).toBe(false);
    expect(
      isAllowedByRobotsTxt(
        rules,
        "https://aphrody.com/private/public-doc/readme",
      ),
    ).toBe(true);
  });

  test("3-VPS Search Cluster enforces usa strict Google egress policy and executes RRF k=60 fusion", async () => {
    expect(THREE_VPS_CLUSTER_TOPOLOGY.fr1.publicIp).toBe("51.77.147.152");
    expect(THREE_VPS_CLUSTER_TOPOLOGY.fr2.publicIp).toBe("51.255.162.6");
    expect(THREE_VPS_CLUSTER_TOPOLOGY.usa.publicIp).toBe("72.60.186.43");
    expect(THREE_VPS_CLUSTER_TOPOLOGY.usa.allowNonGoogleWorkloads).toBe(false);

    expect(() => assertNodeWorkloadAllowed("usa", "web-crawl")).toThrow(
      /Sovereign Egress Policy Violation/,
    );
    expect(() =>
      assertNodeWorkloadAllowed("usa", "google-custom-search"),
    ).not.toThrow();

    const cluster = new ThreeVpsSearchCluster({ allowPrivateCrawl: true });
    try {
      const res = await cluster.search("craft wasm creative");
      expect(res.hits.length).toBeGreaterThan(0);
      expect(res.knowledgeCard).not.toBeNull();
      expect(res.knowledgeCard?.subdomain).toBe("craft.aphrody.app");
      expect(res.hits[0]?.rrfScore).toBeGreaterThan(0);

      // Live local server crawl & shard indexing test
      const srv = Bun.serve({
        port: 0,
        fetch(req) {
          const u = new URL(req.url);
          if (u.pathname === "/robots.txt") {
            return new Response("User-agent: *\nAllow: /\n", {
              headers: { "Content-Type": "text/plain" },
            });
          }
          return new Response(
            `<!doctype html><html><head><title>Quantum WGSL Raymarcher</title><meta name="description" content="Real-time signed distance field kernel"/></head><body><h1>Quantum Raymarcher</h1><p>Zero-copy WebGPU compute dispatch on sm_89.</p></body></html>`,
            { headers: { "Content-Type": "text/html; charset=utf-8" } },
          );
        },
      });

      try {
        const crawled = await cluster.crawlAndIndexOnFr2(
          `http://127.0.0.1:${srv.port}/wgsl-raymarcher`,
        );
        expect(crawled.title).toBe("Quantum WGSL Raymarcher");
        expect(crawled.blake3Hash).toBeDefined();

        const afterSearch = await cluster.search("Quantum Raymarcher sm_89");
        expect(
          afterSearch.hits.some((h) => h.title === "Quantum WGSL Raymarcher"),
        ).toBe(true);
      } finally {
        srv.stop(true);
      }
    } finally {
      cluster.close();
    }
  });

  test("Real Headless Chromium CDP navigates, measures Core Web Vitals, and captures WebP screenshot", async () => {
    const chromeBin = findLocalChromiumBinary();
    if (!chromeBin) return;

    const srv = Bun.serve({
      port: 0,
      fetch() {
        return new Response(
          `<!doctype html><html lang="en"><head><meta charset="utf-8"/><title>Aphrody Real CDP Probe</title></head><body><header>Brand</header><main><h1>Real Chromium Verification</h1><p>Sub-100ms native Bun v1.4.4 render.</p><a href="/workspace">Workspace</a></main><footer>Legal</footer></body></html>`,
          { headers: { "Content-Type": "text/html; charset=utf-8" } },
        );
      },
    });

    try {
      const audit = await auditUrlInRealChromium(
        `http://127.0.0.1:${srv.port}/`,
        {
          forbidExternalGoogleLinks: true,
        },
      );
      expect(audit.passed).toBe(true);
      expect(audit.title).toBe("Aphrody Real CDP Probe");
      expect(audit.consoleErrors).toEqual([]);
      expect(audit.pageExceptions).toEqual([]);
      expect(audit.externalGoogleLinks).toEqual([]);
      expect(audit.screenshotBytes).toBeGreaterThan(100);
      expect(audit.accessibility.headings).toContain(
        "Real Chromium Verification",
      );
    } finally {
      srv.stop(true);
    }
  });

  test("DualEngineCoordinator enforces Host Bun (JSC) <-> Guest V8 isolation & ChromiumTrackingEngine patches", () => {
    const v8Config = new V8PageIsolateConfig({
      maxOldSpaceSizeMb: 512,
      exposeGc: true,
    });
    expect(v8Config.toFlagString()).toContain("--max-old-space-size=512");
    expect(v8Config.toFlagString()).toContain("--expose-gc");

    expect(
      () => new V8PageIsolateConfig({ customFlags: ["--no-sandbox"] }),
    ).toThrow(/Security violation/);

    const coord = new DualEngineCoordinator(v8Config);
    expect(() =>
      coord.buildRuntimeEvaluate({ expression: "Bun.serve({ port: 3000 })" }),
    ).toThrow(/Dual-Runtime boundary violation/);

    const env = coord.buildSerializedV8Call("(a, b) => a + b", [20, 22]);
    expect(env.method).toBe("Runtime.evaluate");
    expect(env.meta.sourcePlane).toBe("host-bun-webkit");
    expect(env.meta.targetPlane).toBe("guest-browser-v8");

    const tracker = new ChromiumTrackingEngine();
    expect(tracker.getPatchProposals().length).toBeGreaterThanOrEqual(5);
    expect(compareDottedVersions("136.0.7103.48", "135.0.0.0")).toBeGreaterThan(
      0,
    );
  });

  test("Google Boq wire protocol roundtrip & SovereignGroundingVerifier fact-checking", async () => {
    const freq = encodeBoqFreq("CCqFvf", ["search-query", 1]);
    expect(freq).toContain("CCqFvf");

    const rawBoq = [
      ")]}'",
      "82",
      '[["wrb.fr","CCqFvf","[\\"nbid-1\\",[\\"thread-1\\"]]",null,null,null,"generic"]]',
    ].join("\n");
    const parsed = parseBoqEnvelopes<[string, string[]]>(rawBoq);
    expect(parsed.length).toBe(1);
    expect(parsed[0]?.[0]).toBe("nbid-1");

    const cluster = new ThreeVpsSearchCluster();
    try {
      const verifier = new SovereignGroundingVerifier(cluster);
      const claimRes = await verifier.verifyClaim(
        "Craft Creative Cloud provides WebGPU and WASM vector design tools.",
      );
      expect(claimRes.assessment).toBe("True");
      expect(claimRes.confidenceScore).toBeGreaterThanOrEqual(75);
    } finally {
      cluster.close();
    }
  });
});
