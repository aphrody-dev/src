import { describe, expect, it } from "bun:test";
import {
  CHROMIUM_ROOT,
  DEPOT_TOOLS_ROOT,
  inspectChromiumTree,
} from "../src/audit/chromium-inspector.ts";
import { existsSync } from "node:fs";

// Integration probe of a local Chromium checkout: skipped where the tree is absent (CI).
const hasTree = existsSync(CHROMIUM_ROOT) && existsSync(DEPOT_TOOLS_ROOT);

describe.skipIf(!hasTree)("Chromium & depot_tools Sovereign Inspection", () => {
  it("should confirm Chromium root and depot_tools presence on disk", () => {
    expect(existsSync(CHROMIUM_ROOT)).toBe(true);
    expect(existsSync(DEPOT_TOOLS_ROOT)).toBe(true);
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
    // Contract of `gn --version`, not a pinned revision of the host tool.
    expect(gn?.version).toMatch(/^\d+ \([0-9a-f]+\)$/);

    const node = inspection.toolchains.find((t) =>
      t.tool.includes("Chromium Bundled Node.js"),
    );
    expect(node?.detected).toBe(true);
    expect(node?.version).toMatch(/^v\d+\./);
  });

  it("should extract real Material 3 tokens from Chromium ui/color", () => {
    const inspection = inspectChromiumTree();
    expect(inspection.material3TokensSample.length).toBeGreaterThan(0);
    expect(
      inspection.material3TokensSample.some((tok) => tok.startsWith("kColor")),
    ).toBe(true);
  });
});
