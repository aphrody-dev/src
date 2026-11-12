import { SRC_ROOT, srcPath } from "../src/root.ts";
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  auditFourPillars,
  parseAospRepoManifestProjects,
  parseChromiumDepsPins,
  parseKernelMaintainersSubsystems,
} from "../src/pillars.ts";
import { scanMonorepoRepos } from "../src/vcs.ts";

describe("4-Pillar VCS Governance (Git + Chromium + Kernel + AOSP)", () => {
  test("scanMonorepoRepos skips root NTFS junctions and scans canonical tiers only", () => {
    const repos = scanMonorepoRepos(SRC_ROOT, { fast: true });
    expect(repos.length).toBeGreaterThanOrEqual(6);
    const names = repos.map((r) => r.name);
    expect(names).toContain("src");
    expect(names).toContain("apps/shenron");
    expect(names).toContain("apps/rosegriffon");
    expect(names).toContain("crates/rust-stack");
    expect(names).toContain("crates/bench");
    expect(names).toContain("crates/ring3-agent");
    // Root junctions like `bun`, `linux`, `chromium`, `vcs`, `vercel` must never be duplicated as top-level entries
    expect(names).not.toContain("bun");
    expect(names).not.toContain("linux");
    expect(names).not.toContain("chromium");
    expect(names).not.toContain("vcs");
    expect(names).not.toContain("vercel");
  }, 15000);

  test("parses root Chromium DEPS, AOSP default.xml, and Kernel MAINTAINERS", () => {
    const deps = readFileSync(srcPath("DEPS"), "utf-8");
    const pins = parseChromiumDepsPins(deps);
    expect(Object.keys(pins).length).toBeGreaterThanOrEqual(100);
    expect(pins["third_party/chromium/src"]).toContain(
      "https://chromium.googlesource.com/chromium/src.git@",
    );

    const aospXml = readFileSync(srcPath(".repo", "manifests", "default.xml"), "utf-8");
    const projs = parseAospRepoManifestProjects(aospXml);
    expect(projs.length).toBeGreaterThanOrEqual(100);
    expect(projs.some((p) => p.path === "third_party/aosp-manifest")).toBe(true);
    expect(projs.some((p) => p.path === "third_party/kleaf")).toBe(true);

    const maint = readFileSync(srcPath("MAINTAINERS"), "utf-8");
    const subs = parseKernelMaintainersSubsystems(maint);
    expect(subs.length).toBeGreaterThanOrEqual(10);
  });

  test("auditFourPillars reports all 4 pillars healthy with 0 dangling junctions", () => {
    const report = auditFourPillars(SRC_ROOT);
    expect(report.danglingJunctions.length).toBe(0);
    expect(report.pillars.git.healthy).toBe(true);
    expect(report.pillars.chromium.healthy).toBe(true);
    expect(report.pillars.kernel.healthy).toBe(true);
    expect(report.pillars.aosp.healthy).toBe(true);
    expect(report.allHealthy).toBe(true);
  });
});
