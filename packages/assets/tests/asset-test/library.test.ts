import { expect, test } from "bun:test";
import { join } from "node:path";
import { runTests } from "../../src/test.ts";

const root = join(import.meta.dir, "..", "..", "..", "..");

test("every committed Bevy asset, .meta RON sidecar, and SVG2 file passes validators", async () => {
  const { results } = await runTests({
    root,
    recursive: true,
    types: ["image", "svg", "model", "font", "hdri"],
  });
  expect(results.length).toBeGreaterThan(0);
  expect(
    results
      .filter((r) => !r.ok && !r.skipped)
      .map((r) => `${r.id}: ${r.detail}`),
  ).toEqual([]);
}, 120_000);
