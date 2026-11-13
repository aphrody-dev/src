import { expect, test } from "bun:test";
import { resolve } from "node:path";
import { cmp, latestStable, norm, SEMVER, setPathDepVersions, setWorkspaceVersion } from "../src/freeze.ts";

test("SemVer precedence: canary after the stable it follows, rc before its stable", () => {
  expect(cmp("0.3.0-canary.12", "0.2.0")).toBeGreaterThan(0);
  expect(cmp("0.3.0-rc.1", "0.3.0")).toBeLessThan(0);
  expect(cmp("0.3.0-canary.2", "0.3.0-canary.10")).toBeLessThan(0);
  expect(cmp("1.0.0", "0.99.99")).toBeGreaterThan(0);
  expect(SEMVER.test("2026.11.0")).toBe(true); // valid SemVer, rejected by policy (docs/VERSIONING.md), not by syntax
  expect(SEMVER.test("0.3")).toBe(false);
});

test("latestStable ignores pre-releases and non-version tags", () => {
  expect(latestStable(["refs/tags/v0.2.0", "v0.10.0-rc.1", "canary", "v0.9.1", "foo/1.0.0"])).toBe("0.9.1");
  expect(latestStable([])).toBeNull();
});

test("workspace version and path deps on inheriting crates are rewritten, others untouched", () => {
  const root = "/r";
  const toml = '[workspace.package]\nversion = "0.2.0"\nedition = "2024"\n\n[workspace.dependencies]\na = { version = "0.2.0", path = "crates/a" }\nb = { version = "1.4.8", path = "crates/b" }\nserde = { version = "1" }\n';
  const out = setPathDepVersions(setWorkspaceVersion(toml, "0.3.0"), root, new Set([norm(resolve(root, "crates/a"))]), "0.3.0");
  expect(out).toContain('[workspace.package]\nversion = "0.3.0"');
  expect(out).toContain('a = { version = "0.3.0", path = "crates/a" }');
  expect(out).toContain('b = { version = "1.4.8", path = "crates/b" }');
  expect(out).toContain('serde = { version = "1" }');
});
