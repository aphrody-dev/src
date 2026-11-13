// SPDX-License-Identifier: Apache-2.0
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_INSTALL } from "../src/engines/install.ts";
import { freePort } from "../src/engines/launch.ts";
import { ENGINES, getEngine, repoRoot } from "../src/engines/registry.ts";

const tools = readFileSync(join(repoRoot(), "tools.toml"), "utf8");
const forks = readFileSync(
  join(repoRoot(), "third_party", "forks.txt"),
  "utf8",
);

describe("engines registry", () => {
  test("ids are unique", () => {
    const ids = ENGINES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every ay-installed engine is pinned in tools.toml", () => {
    for (const e of ENGINES)
      if (e.install.via === "ay")
        expect(tools).toContain(`name = "${e.install.tool}"`);
  });

  test("every upstream on GitHub is listed in third_party/forks.txt", () => {
    for (const e of ENGINES) {
      const m = /^https:\/\/github\.com\/([^/]+\/[^/]+)$/.exec(e.upstream);
      if (m) expect(forks.toLowerCase()).toContain(`${m[1]!.toLowerCase()} `);
    }
  });

  test("third_party paths stay relative and flat", () => {
    for (const e of ENGINES)
      if (e.thirdParty)
        expect(e.thirdParty).toMatch(/^third_party\/[^/]+(\/src\/v8)?$/);
  });

  test("default install set only names known engines", () => {
    for (const id of DEFAULT_INSTALL) expect(() => getEngine(id)).not.toThrow();
  });

  test("CDP and WebDriver engines describe how to serve", () => {
    for (const e of ENGINES)
      if (e.protocol === "cdp" || e.protocol === "webdriver") {
        const argv = e.serve?.(9333, "profile") ?? [];
        expect(argv.join(" ")).toContain("9333");
      }
  });

  test("freePort returns a usable TCP port", () => {
    const p = freePort();
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(65536);
  });
});
