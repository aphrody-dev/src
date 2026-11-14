import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyManagedBlock,
  extractManagedBlock,
  scanBinDir,
  scanCmdBrokenTargets,
  whichAll,
} from "../src/binpath.ts";

describe("binpath", () => {
  test("extractManagedBlock and applyManagedBlock manage Unix PATH idempotently", () => {
    const initial = "# existing\nexport FOO=bar\n";
    const once = applyManagedBlock(initial, ["/opt/bin", "/usr/local/bin"]);
    expect(extractManagedBlock(once)).toEqual(["/opt/bin", "/usr/local/bin"]);
    const twice = applyManagedBlock(once, ["/opt/bin"]);
    expect(extractManagedBlock(twice)).toEqual(["/opt/bin"]);
    expect(twice).toContain("export FOO=bar");
    const cleared = applyManagedBlock(twice, []);
    expect(extractManagedBlock(cleared)).toEqual([]);
  });

  test("scanCmdBrokenTargets detects missing .exe and .ts targets", () => {
    const dir = mkdtempSync(join(tmpdir(), "binpath-cmd-"));
    try {
      const okExe = join(dir, "ok.exe");
      writeFileSync(okExe, "stub");
      expect(scanCmdBrokenTargets(`@"${okExe}" %*`, dir)).toEqual([]);
      expect(scanCmdBrokenTargets(`@"%~dp0missing.exe" %*`, dir)).toEqual([
        `${dir}\\missing.exe`,
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("scanBinDir detects stale backups and 0-byte files", () => {
    const dir = mkdtempSync(join(tmpdir(), "binpath-scan-"));
    try {
      writeFileSync(join(dir, "tool.exe.old"), "old");
      writeFileSync(join(dir, "empty.exe"), "");
      writeFileSync(join(dir, "good.exe"), "ok");
      const issues = scanBinDir(dir);
      expect(issues.map((i) => i.kind).sort()).toEqual(["stale", "zero-byte"]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("whichAll finds bun on PATH", () => {
    const hits = whichAll("bun");
    expect(hits.length).toBeGreaterThan(0);
  });
});
