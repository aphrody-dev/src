import { describe, expect, it } from "bun:test";
import { CHROMIUM_DEPENDENCY_AUDIT } from "../src/audit/purge-matrix.ts";

describe("Chromium Third-Party Keep vs Purge Matrix", () => {
  it("should have comprehensive audit coverage", () => {
    expect(CHROMIUM_DEPENDENCY_AUDIT.length).toBeGreaterThanOrEqual(20);
  });

  it("should classify Node, Rollup, Terser, SQLite, and compression scripts as PURGE_FOR_BUN", () => {
    const purged = CHROMIUM_DEPENDENCY_AUDIT.filter(
      (d) => d.verdict === "PURGE_FOR_BUN",
    );
    expect(purged.length).toBeGreaterThanOrEqual(10);

    const nodeAudit = purged.find((p) => p.name.includes("node-and-webui"));
    expect(nodeAudit).toBeDefined();
    expect(nodeAudit?.layer).toBe(6);

    const tsAudit = purged.find((p) => p.name.includes("typescript-tsc"));
    expect(tsAudit).toBeDefined();
    expect(tsAudit?.replacementOrNativePath).toContain("bun check");
    expect(tsAudit?.replacementOrNativePath).toContain("bun fmt");

    const sqliteAudit = purged.find((p) => p.name.includes("sqlite"));
    expect(sqliteAudit).toBeDefined();
    expect(sqliteAudit?.replacementOrNativePath).toContain("bun:sqlite");

    const compressionAudit = purged.find((p) => p.name.includes("compression"));
    expect(compressionAudit).toBeDefined();
    expect(compressionAudit?.replacementOrNativePath).toContain(
      "zstdCompressSync",
    );
  });

  it("should classify Dawn, Skia, Blink, V8, CC, Views, Siso, and SIMD as KEEP_CHROMIUM_NATIVE", () => {
    const kept = CHROMIUM_DEPENDENCY_AUDIT.filter(
      (d) => d.verdict === "KEEP_CHROMIUM_NATIVE",
    );
    expect(kept.length).toBeGreaterThanOrEqual(10);

    const dawnAudit = kept.find((k) => k.name.includes("dawn"));
    expect(dawnAudit).toBeDefined();
    expect(dawnAudit?.layer).toBe(5);

    const skiaAudit = kept.find((k) => k.name.includes("skia"));
    expect(skiaAudit).toBeDefined();
    expect(skiaAudit?.layer).toBe(5);

    const v8Audit = kept.find((k) => k.name.includes("v8"));
    expect(v8Audit).toBeDefined();

    const highwayAudit = kept.find((k) => k.name.includes("highway"));
    expect(highwayAudit).toBeDefined();
  });
});
