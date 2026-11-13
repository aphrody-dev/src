import { describe, expect, test } from "bun:test";
import { checkEntries, parseManifest, sha256 } from "../src/manifest.ts";

const good = `
[[asset]]
id = "a"
kind = "icon"
path = "icons/a.svg"
url = "https://example.org/a.svg"
license = "MIT"
sha256 = "${"a".repeat(64)}"
author = "x"
attribution = "x, MIT"
`;

describe("manifest", () => {
  test("valid entry passes", () => {
    expect(checkEntries(parseManifest(good))).toEqual([]);
  });
  test("missing license fails", () => {
    expect(
      checkEntries(parseManifest(good.replace('license = "MIT"\n', ""))),
    ).toContain("a: missing SPDX license");
  });
  test("non redistributable license fails", () => {
    const errs = checkEntries(
      parseManifest(good.replace('"MIT"', '"CC-BY-NC-4.0"')),
    );
    expect(errs.some((e) => e.includes("not allowed"))).toBe(true);
  });
  test("missing hash fails", () => {
    const errs = checkEntries(parseManifest(good.replace(/sha256 = .*\n/, "")));
    expect(errs.some((e) => e.includes("sha256"))).toBe(true);
  });
  test("path traversal fails", () => {
    const errs = checkEntries(
      parseManifest(good.replace("icons/a.svg", "../a.svg")),
    );
    expect(errs.some((e) => e.includes("unsafe path"))).toBe(true);
  });
  test("sha256 of empty input", async () => {
    expect(await sha256(new Uint8Array())).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });
});
