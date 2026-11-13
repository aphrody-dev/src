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

test("SemVer 2.0.0: leading zeros refused in numeric pre-release ids, build metadata ignored by cmp", () => {
  expect(SEMVER.test("0.3.0-canary.01")).toBe(false);
  expect(SEMVER.test("0.3.0-canary.1+abc1234")).toBe(true);
  expect(cmp("0.3.0-canary.1+aaa", "0.3.0-canary.1+bbb")).toBe(0);
  // semver.org §11 chain
  const chain = ["1.0.0-alpha", "1.0.0-alpha.1", "1.0.0-alpha.beta", "1.0.0-beta", "1.0.0-beta.2", "1.0.0-beta.11", "1.0.0-rc.1", "1.0.0"];
  for (let i = 1; i < chain.length; i++) expect(cmp(chain[i - 1]!, chain[i]!)).toBeLessThan(0);
  expect(latestStable(["v01.2.3", "v1.2.3+meta", "v0.4.0"])).toBe("0.4.0");
});

test("[workspace.package] with arrays before version; missing key throws", () => {
  const t = '[workspace.package]\nauthors = ["a"]\nkeywords = ["x", "y"]\nversion = "0.2.0"\n[workspace.dependencies]\nx = "1"\n';
  expect(setWorkspaceVersion(t, "0.3.0")).toContain('keywords = ["x", "y"]\nversion = "0.3.0"');
  expect(() => setWorkspaceVersion('[package]\nversion = "1.0.0"\n', "0.3.0")).toThrow();
});

test("dependency tables are rewritten, non-dependency sections are not", () => {
  const root = "/r";
  const inh = new Set([norm(resolve(root, "../a"))]);
  const t = [
    "[package.metadata.x]",
    'foo = { path = "../a", version = "0.2.0" }',
    "[dependencies.a]",
    'path = "../a"',
    'version = "0.2.0"',
    "[target.'cfg(windows)'.dev-dependencies]",
    'a = { version = "0.2.0", path = "../a" }',
    "[build-dependencies.other]",
    'path = "../other"',
    'version = "0.2.0"',
  ].join("\n");
  const out = setPathDepVersions(t, root, inh, "0.3.0").split("\n");
  expect(out[1]).toBe('foo = { path = "../a", version = "0.2.0" }');
  expect(out[4]).toBe('version = "0.3.0"');
  expect(out[6]).toBe('a = { version = "0.3.0", path = "../a" }');
  expect(out[9]).toBe('version = "0.2.0"');
});
