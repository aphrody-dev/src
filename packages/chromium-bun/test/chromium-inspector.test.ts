import { describe, expect, it } from "bun:test";
import { inspectChromiumTree } from "../src/audit/chromium-inspector.ts";
import { existsSync } from "node:fs";

describe("Chromium & depot_tools Sovereign Inspection", () => {
  it("should confirm Chromium root and depot_tools presence on disk", () => {
    expect(existsSync("C:\\src\\third_party\\chromium\\src")).toBe(true);
    expect(existsSync("C:\\src\\third_party\\depot_tools")).toBe(true);
  });

  it("should detect all key Chromium native subsystems", () => {
    const inspection = inspectChromiumTree();
    expect(inspection.isChromiumPristine).toBe(true);
    expect(inspection.summary.detectedSubsystems).toBe(
      inspection.summary.totalSubsystems,
    );

    const dawn = inspection.subsystems.find((s) => s.name.includes("Dawn"));
    expect(dawn).toBeDefined();
    expect(dawn?.exists).toBe(true);

    const skia = inspection.subsystems.find((s) => s.name.includes("Skia"));
    expect(skia).toBeDefined();
    expect(skia?.exists).toBe(true);

    const v8 = inspection.subsystems.find((s) => s.name.includes("V8"));
    expect(v8).toBeDefined();
    expect(v8?.exists).toBe(true);

    const blink = inspection.subsystems.find((s) => s.name.includes("Blink"));
    expect(blink).toBeDefined();
    expect(blink?.exists).toBe(true);

    const views = inspection.subsystems.find((s) => s.name.includes("Views"));
    expect(views).toBeDefined();
    expect(views?.exists).toBe(true);
  });

  it("should probe GN and Chromium Node toolchain versions", () => {
    const inspection = inspectChromiumTree();
    const gn = inspection.toolchains.find((t) => t.tool.includes("gn"));
    expect(gn?.detected).toBe(true);
    expect(gn?.version).toContain("2614");

    const node = inspection.toolchains.find((t) =>
      t.tool.includes("Chromium Bundled Node.js"),
    );
    expect(node?.detected).toBe(true);
    expect(node?.version).toContain("v24.");
  });

  it("should extract real Material 3 tokens from Chromium ui/color", () => {
    const inspection = inspectChromiumTree();
    expect(inspection.material3TokensSample.length).toBeGreaterThan(0);
    expect(
      inspection.material3TokensSample.some((tok) => tok.startsWith("kColor")),
    ).toBe(true);
  });
});
