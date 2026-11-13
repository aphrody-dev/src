import { expect, test } from "bun:test";
import { BRAND, BRAND_HEADERS, parseHeaders, parseRange } from "./app";

test("versioned brand paths are immutable and cross-origin", () => {
  expect(BRAND.test("/brand/v1/fonts/inter.woff2")).toBe(true);
  expect(BRAND.test("/brand/v12/manifest.json")).toBe(true);
  expect(BRAND.test("/brand/latest/manifest.json")).toBe(false);
  expect(BRAND.test("/downloads/brand/v1/x")).toBe(false);
  const h = Object.fromEntries(BRAND_HEADERS);
  expect(h["cache-control"]).toContain("immutable");
  expect(h["access-control-allow-origin"]).toBe("*");
  expect(h["cross-origin-resource-policy"]).toBe("cross-origin");
});

test("ranges and _headers rules", () => {
  expect(parseRange("bytes=10-19")).toEqual({ offset: 10, length: 10 });
  expect(parseRange("bytes=5-")).toEqual({ offset: 5 });
  const r = parseHeaders("/*.woff2\n  Cache-Control: x\n");
  expect(r[0]!.re.test("/a.woff2")).toBe(true);
  expect(r[0]!.h).toEqual([["Cache-Control", "x"]]);
});
