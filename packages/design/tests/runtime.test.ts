import { expect, test } from "bun:test";
import { scheme, schemeCss, searchSymbols, symbolNames } from "../src/runtime.ts";
import { symbolSvg } from "../src/bun-plugin.ts";
import { tokens } from "../src/index.ts";

test("scheme() = tokens.json pour la graine de marque", () => {
  expect(scheme(tokens.source.seed, false, tokens.source.variant as any)).toEqual(tokens.color.light);
  expect(scheme(tokens.source.seed, true, tokens.source.variant as any)).toEqual(tokens.color.dark);
});
test("schemeCss rejette une graine invalide", () => {
  expect(() => schemeCss("red")).toThrow();
  expect(schemeCss("#1A73E8")).toContain("--md-sys-color-primary:");
});
test("Material Symbols : noms et SVG", async () => {
  expect((await symbolNames()).length).toBeGreaterThan(3000);
  expect((await searchSymbols("pets"))[0]).toBe("pets");
  expect(await symbolSvg("rounded", "terminal", 18)).toMatch(/^<svg width="18" height="18"(?!.*width="48")/s);
  await expect(symbolSvg("rounded", "../x")).rejects.toThrow();
});
