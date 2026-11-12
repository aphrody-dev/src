import { describe, expect, it } from "bun:test";
import {
  buildWinnerManifest,
  saveWinnerManifest,
  CANONICAL_HARDWARE,
} from "../src/winner-picker.ts";
import type { BenchmarkRecord } from "../src/types.ts";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

describe("Winner Picker & Manifest Generator", () => {
  const dummyRecords: BenchmarkRecord[] = [
    {
      id: "test_b1",
      category: "A_ENGINES",
      title: "Test Compute",
      contestants: [
        { name: "Bun JSC", opsPerSec: 1000 },
        { name: "Node V8", opsPerSec: 800 },
      ],
      winner: "Bun JSC",
      speedupFactor: 1.25,
      primaryMetric: "1000 ops/sec",
      winnerLayer: 6,
      summary: "Test summary",
    },
    {
      id: "test_b2",
      category: "D_BUILD",
      title: "Test Build",
      contestants: [{ name: "Siso", opsPerSec: 50 }],
      winner: "Siso",
      speedupFactor: 1.0,
      primaryMetric: "50 ops/sec",
      winnerLayer: 5,
      summary: "Test build summary",
    },
  ];

  it("should generate a valid WinnerManifest with hardware specs", () => {
    const manifest = buildWinnerManifest(dummyRecords);
    expect(manifest.totalBenchmarks).toBe(2);
    expect(manifest.hostHardware.gpu).toBe(CANONICAL_HARDWARE.gpu);
    expect(manifest.hostHardware.cpu).toBe(CANONICAL_HARDWARE.cpu);
    expect(manifest.winnersByLayer[6]).toBe(1);
    expect(manifest.winnersByLayer[5]).toBe(1);
    expect(manifest.auditSummary.totalAudited).toBeGreaterThan(0);
  });

  it("should save manifest to JSON file cleanly", () => {
    const manifest = buildWinnerManifest(dummyRecords);
    const testPath = join(process.cwd(), "test_winners.json");
    try {
      saveWinnerManifest(manifest, testPath);
      expect(existsSync(testPath)).toBe(true);
    } finally {
      if (existsSync(testPath)) unlinkSync(testPath);
    }
  });
});
