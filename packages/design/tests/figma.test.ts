import { expect, test } from "bun:test";
import { join } from "node:path";

const pkg = join(import.meta.dir, "..");

test("figma-mockup targets 2xsZi5wLPAYLGNCLZ2ZJUv with 3 pages, 6 AutoLayout ComponentSets, and zero raw hex literals", async () => {
  const figmaCfg = await Bun.file(join(pkg, "tokens/figma.json")).json();
  const mockup = await Bun.file(join(pkg, "tokens/figma-mockup.json")).json();
  const varsFile = await Bun.file(
    join(pkg, "tokens/figma-variables.json"),
  ).json();

  expect(figmaCfg.fileKey).toBe("2xsZi5wLPAYLGNCLZ2ZJUv");
  expect(mockup.fileKey).toBe("2xsZi5wLPAYLGNCLZ2ZJUv");
  expect(mockup.themePresets).toHaveLength(9);
  expect(mockup.pages.map((p: any) => p.name)).toEqual([
    "01 Foundations & 9 Themes",
    "02 Shared Rust Components",
    "03 Wayland-in-Browser & Intelligent Terminal",
  ]);
  expect(mockup.componentSets).toHaveLength(6);

  const validVarNames = new Set<string>();
  for (const col of varsFile.collections) {
    for (const v of col.variables) validVarNames.add(v.name);
  }

  for (const cs of mockup.componentSets) {
    expect(["HORIZONTAL", "VERTICAL"]).toContain(cs.layoutMode);
    expect(cs.variants.length).toBeGreaterThanOrEqual(2);
    expect(validVarNames.has(cs.fillVariable)).toBe(true);
    expect(validVarNames.has(cs.textVariable)).toBe(true);
    expect(validVarNames.has(cs.strokeVariable)).toBe(true);
    expect(validVarNames.has(cs.radiusVariable)).toBe(true);
  }

  const pageAndComponentJson = JSON.stringify({
    pages: mockup.pages,
    componentSets: mockup.componentSets,
  });
  expect(pageAndComponentJson).not.toMatch(/#[0-9a-fA-F]{6}/);

  const syncScript = await Bun.file(join(pkg, "tokens/figma-sync.js")).text();
  expect(syncScript).toContain("01 Foundations & 9 Themes");
  expect(syncScript).toContain("WaylandSurfaceSlot");
  expect(syncScript).toContain("setBoundVariableForPaint");
});
