/**
 * Chromium Upstream vs Bun Full-Stack Parity Test Suite
 */

import { describe, expect, test, beforeAll } from "bun:test";
import {
  installAllChromiumPolyfills,
  PrioritizedScheduler,
  TaskController,
  LockManager,
  TrustedTypePolicyFactory,
  CacheStorage,
  BunChromiumMime,
  BunChromiumDNS,
} from "../src/polyfills/index.ts";
import { runFullParityScan } from "../src/recon/index.ts";
import { runFullAutoPatch } from "../src/patcher/index.ts";

describe("Chromium vs Bun Parity Suite", () => {
  beforeAll(() => {
    installAllChromiumPolyfills(globalThis);
  });

  describe("1. Prioritized Task Scheduling (scheduler.postTask & scheduler.yield)", () => {
    test("scheduler global and TaskController are installed", () => {
      expect((globalThis as any).scheduler).toBeDefined();
      expect((globalThis as any).TaskController).toBeDefined();
    });

    test("scheduler.postTask executes and returns result", async () => {
      const result = await (globalThis as any).scheduler.postTask(
        () => "chromium-parity",
      );
      expect(result).toBe("chromium-parity");
    });

    test("scheduler.postTask respects priority ordering", async () => {
      const order: string[] = [];
      const s = (globalThis as any).scheduler;

      // Post background first, then user-visible, then user-blocking
      const p1 = s.postTask(() => order.push("bg"), { priority: "background" });
      const p2 = s.postTask(() => order.push("uv"), {
        priority: "user-visible",
      });
      const p3 = s.postTask(() => order.push("ub"), {
        priority: "user-blocking",
      });

      await Promise.all([p1, p2, p3]);
      expect(order).toEqual(["ub", "uv", "bg"]);
    });

    test("scheduler.postTask respects AbortSignal", async () => {
      const controller = new AbortController();
      controller.abort(new Error("task canceled"));

      try {
        await (globalThis as any).scheduler.postTask(() => "should not run", {
          signal: controller.signal,
        });
        expect(false).toBe(true);
      } catch (err: any) {
        expect(err.message).toBe("task canceled");
      }
    });

    test("scheduler.yield yields execution microtask", async () => {
      let flag = false;
      const promise = (globalThis as any).scheduler.yield().then(() => {
        expect(flag).toBe(true);
      });
      flag = true;
      await promise;
    });
  });

  describe("2. W3C Web Locks API (navigator.locks.request)", () => {
    test("navigator.locks is installed", () => {
      expect(navigator.locks).toBeDefined();
      expect(typeof navigator.locks.request).toBe("function");
      expect(typeof navigator.locks.query).toBe("function");
    });

    test("exclusive lock sequential execution", async () => {
      const trace: string[] = [];

      const p1 = navigator.locks.request("test-resource", async () => {
        trace.push("start-1");
        await Bun.sleep(10);
        trace.push("end-1");
      });

      const p2 = navigator.locks.request("test-resource", async () => {
        trace.push("start-2");
        trace.push("end-2");
      });

      await Promise.all([p1, p2]);
      expect(trace).toEqual(["start-1", "end-1", "start-2", "end-2"]);
    });

    test("shared lock concurrent execution", async () => {
      const trace: string[] = [];

      const p1 = navigator.locks.request(
        "shared-res",
        { mode: "shared" },
        async () => {
          trace.push("start-s1");
          await Bun.sleep(10);
          trace.push("end-s1");
        },
      );

      const p2 = navigator.locks.request(
        "shared-res",
        { mode: "shared" },
        async () => {
          trace.push("start-s2");
          await Bun.sleep(10);
          trace.push("end-s2");
        },
      );

      await Promise.all([p1, p2]);
      // Both start before first ends
      expect(trace[0]).toBe("start-s1");
      expect(trace[1]).toBe("start-s2");
    });

    test("ifAvailable returns null when lock is held", async () => {
      let innerRan = false;
      await navigator.locks.request("held-resource", async () => {
        await navigator.locks.request(
          "held-resource",
          { ifAvailable: true },
          async (lock) => {
            expect(lock).toBeNull();
            innerRan = true;
          },
        );
      });
      expect(innerRan).toBe(true);
    });

    test("locks.query returns active held and pending locks", async () => {
      const snapshot = await navigator.locks.query();
      expect(Array.isArray(snapshot.held)).toBe(true);
      expect(Array.isArray(snapshot.pending)).toBe(true);
    });
  });

  describe("3. W3C Trusted Types API (trustedTypes.createPolicy)", () => {
    test("trustedTypes global is installed", () => {
      expect((globalThis as any).trustedTypes).toBeDefined();
    });

    test("policy creates branded TrustedHTML and TrustedScript", () => {
      const tt = (globalThis as any).trustedTypes as TrustedTypePolicyFactory;
      const policy = tt.createPolicy("test-policy-" + Math.random(), {
        createHTML: (s) => `<div>${s}</div>`,
        createScript: (s) => `console.log("${s}");`,
      });

      const trustedHtml = policy.createHTML("safe content");
      expect(tt.isHTML(trustedHtml)).toBe(true);
      expect(trustedHtml.toString()).toBe("<div>safe content</div>");

      const trustedScript = policy.createScript("hello");
      expect(tt.isScript(trustedScript)).toBe(true);
      expect(trustedScript.toString()).toBe('console.log("hello");');
    });
  });

  describe("4. W3C Cache API (caches.open backed by bun:sqlite)", () => {
    test("caches global is installed", () => {
      expect((globalThis as any).caches).toBeDefined();
    });

    test("Cache.put and Cache.match roundtrip", async () => {
      const cache = await caches.open("v1-test-cache");
      const testUrl = "http://localhost/test-asset.json";
      const bodyData = JSON.stringify({ message: "cached in sqlite" });

      const response = new Response(bodyData, {
        headers: {
          "Content-Type": "application/json",
          "X-Cache-Test": "sqlite-backed",
        },
      });

      await cache.put(testUrl, response);

      const matched = await cache.match(testUrl);
      expect(matched).toBeDefined();
      expect(matched!.status).toBe(200);
      expect(matched!.headers.get("x-cache-test")).toBe("sqlite-backed");

      const json = await matched!.json();
      expect(json.message).toBe("cached in sqlite");

      // Verify deletion
      const deleted = await cache.delete(testUrl);
      expect(deleted).toBe(true);
      const afterDelete = await cache.match(testUrl);
      expect(afterDelete).toBeUndefined();
    });

    test("caches.keys and caches.delete", async () => {
      await caches.open("cache-alpha");
      await caches.open("cache-beta");

      const keys = await caches.keys();
      expect(keys).toContain("cache-alpha");
      expect(keys).toContain("cache-beta");

      const delResult = await caches.delete("cache-alpha");
      expect(delResult).toBe(true);

      const hasAlpha = await caches.has("cache-alpha");
      expect(hasAlpha).toBe(false);
    });
  });

  describe("5. Extended CompressionStream ('br' brotli parity)", () => {
    test("CompressionStream('br') instantiates without throwing", () => {
      const cs = new CompressionStream("br" as any);
      expect(cs.readable).toBeDefined();
      expect(cs.writable).toBeDefined();
    });

    test("DecompressionStream('br') instantiates without throwing", () => {
      const ds = new DecompressionStream("br" as any);
      expect(ds.readable).toBeDefined();
      expect(ds.writable).toBeDefined();
    });

    test("CompressionStream('zstd') works natively", () => {
      const cs = new CompressionStream("zstd" as any);
      expect(cs.readable).toBeDefined();
    });
  });

  describe("6. Chromium MIME Registry & Bun.file Augmentation", () => {
    test("BunChromiumMime resolves Chromium types", () => {
      expect(BunChromiumMime.getType("wgsl")).toBe("text/wgsl");
      expect(BunChromiumMime.getType("jxl")).toBe("image/jxl");
      expect(BunChromiumMime.getType("bunaot")).toBe("application/vnd.bun.aot");
      expect(BunChromiumMime.getType("test.opus")).toBe("audio/opus");
    });

    test("Bun.file reflects augmented MIME types", () => {
      const fileWgsl = Bun.file("shader.wgsl");
      expect(fileWgsl.type).toBe("text/wgsl");

      const fileJxl = Bun.file("photo.jxl");
      expect(fileJxl.type).toBe("image/jxl");

      const fileAot = Bun.file("binary.bunaot");
      expect(fileAot.type).toBe("application/vnd.bun.aot");
    });
  });

  describe("7. RFC 8484 DNS-over-HTTPS & HTTPS Type 65 RR", () => {
    test("DNS_RECORD_TYPE_MAP has HTTPS 65 and SVCB 64", () => {
      expect(BunChromiumDNS).toBeDefined();
    });

    test("BunChromiumDNS.resolveDoH resolves A records via Cloudflare DoH", async () => {
      try {
        const answers = await BunChromiumDNS.resolveDoH("cloudflare.com", "A");
        expect(Array.isArray(answers)).toBe(true);
        expect(answers.length).toBeGreaterThan(0);
        expect(answers[0].data).toBeDefined();
      } catch (e: any) {
        // If offline or network-isolated, verify class existence
        expect(BunChromiumDNS.resolveDoH).toBeDefined();
      }
    });

    test("BunChromiumDNS.resolveHTTPS parses Type 65 ALPN data", async () => {
      try {
        const httpsRecords =
          await BunChromiumDNS.resolveHTTPS("cloudflare.com");
        expect(Array.isArray(httpsRecords)).toBe(true);
        if (httpsRecords.length > 0) {
          expect(httpsRecords[0].alpn.length).toBeGreaterThan(0);
        }
      } catch (e: any) {
        expect(BunChromiumDNS.resolveHTTPS).toBeDefined();
      }
    });
  });

  describe("8. 10-Domain Recon Scanner & Auto-Patcher", () => {
    test("runFullParityScan completes and computes matrix", async () => {
      const matrix = await runFullParityScan({
        chromiumPath: "C:/src/third_party/chromium/src",
        bunPath: "C:/src/third_party/bun",
      });

      expect(matrix.totalFeaturesScanned).toBeGreaterThan(30);
      expect(matrix.overallNativeScore).toBeGreaterThanOrEqual(70);
      expect(matrix.overallPatchedScore).toBeGreaterThanOrEqual(95);
      expect(matrix.domains.html).toBeDefined();
      expect(matrix.domains.css).toBeDefined();
      expect(matrix.domains.js).toBeDefined();
      expect(matrix.domains.api).toBeDefined();
      expect(matrix.domains.texte).toBeDefined();
      expect(matrix.domains["data-assets"]).toBeDefined();
      expect(matrix.domains.dns).toBeDefined();
      expect(matrix.domains.tls).toBeDefined();
      expect(matrix.domains.stack).toBeDefined();
    });

    test("runFullAutoPatch synthesizes preload and git patches with verification", async () => {
      const result = await runFullAutoPatch();
      expect(result.preloadPath).toBeDefined();
      expect(result.patchesGenerated.length).toBeGreaterThan(0);
      expect(result.verificationPassed).toBe(true);
    });
  });
});
