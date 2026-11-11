// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "bun:test";
import {
  auditUrlInRealChromium,
  findLocalChromiumBinary,
} from "../../../packages/chromium-bun/src/index.ts";
import { buildYoloApp } from "../build.ts";
import { startYoloServer } from "../server.ts";

describe("@aphrody/yolo — Reproducible Fullstack Bun v1.4.4 Framework", () => {
  test("buildYoloApp compiles AST graph, virtual M3 icons, and satisfies WCK 14KB/30KB budgets", async () => {
    const stats = await buildYoloApp();
    expect(stats.moduleCount).toBeGreaterThanOrEqual(8);
    expect(stats.htmlGzBytes + stats.cssGzBytes).toBeLessThanOrEqual(14 * 1024);
    expect(stats.jsGzBytes).toBeLessThanOrEqual(30 * 1024);
  });

  test("startYoloServer serves CSP-nonced SSR, Bun primitives, AST graph, M3 icons, and 3-VPS RRF search", async () => {
    const handle = await startYoloServer({ port: 0, autoBuild: false });
    try {
      const base = `http://127.0.0.1:${handle.port}`;

      const homeRes = await fetch(`${base}/`);
      expect(homeRes.status).toBe(200);
      const csp = homeRes.headers.get("content-security-policy") || "";
      expect(csp).toContain("nonce-");
      const html = await homeRes.text();
      expect(html).toContain("<aphrody-pet");
      expect(html).toContain("--md-sys-color-primary");

      const primRes = await fetch(`${base}/api/primitives`);
      expect(primRes.status).toBe(200);
      const prim = (await primRes.json()) as { allVerified: boolean; items: unknown[] };
      expect(prim.allVerified).toBe(true);
      expect(prim.items.length).toBe(8);

      const graphRes = await fetch(`${base}/api/graph`);
      expect(graphRes.status).toBe(200);
      const graph = (await graphRes.json()) as { totalModules: number; totalEdges: number };
      expect(graph.totalModules).toBeGreaterThanOrEqual(8);
      expect(graph.totalEdges).toBeGreaterThan(0);

      const iconsRes = await fetch(`${base}/api/icons?q=search`);
      expect(iconsRes.status).toBe(200);
      const icons = (await iconsRes.json()) as { count: number; icons: Array<{ name: string; svg: string }> };
      expect(icons.count).toBeGreaterThan(0);
      expect(icons.icons[0]?.svg).toContain("<svg");

      const clusterRes = await fetch(`${base}/api/cluster/search?q=yolo`);
      expect(clusterRes.status).toBe(200);
      const search = (await clusterRes.json()) as { hits: Array<{ title: string }> };
      expect(search.hits.length).toBeGreaterThan(0);

      const petSprite = await fetch(`${base}/assets/pets/sprites/spritesheet.webp`);
      expect(petSprite.status).toBe(200);
      expect((await petSprite.arrayBuffer()).byteLength).toBeGreaterThan(100_000);

      if (findLocalChromiumBinary()) {
        const audit = await auditUrlInRealChromium(`${base}/`, { forbidExternalGoogleLinks: true });
        expect(audit.passed).toBe(true);
        expect(audit.consoleErrors).toEqual([]);
        expect(audit.pageExceptions).toEqual([]);
        expect(audit.externalGoogleLinks).toEqual([]);
      }
    } finally {
      handle.close();
    }
  });
});
