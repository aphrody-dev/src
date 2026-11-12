import type {
  BenchmarkRecord,
  SovereignLayerId,
  WinnerManifest,
} from "./types.ts";
import { CHROMIUM_DEPENDENCY_AUDIT } from "./audit/purge-matrix.ts";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

export interface HostHardwareSpecs {
  gpu: string;
  cpu: string;
  ram: string;
  os: string;
}

export const CANONICAL_HARDWARE: HostHardwareSpecs = {
  gpu: "NVIDIA GeForce RTX 4070 12GB (Ada Lovelace sm_89, Driver 621.14, CUDA 13.4, Vulkan 1.4)",
  cpu: "Intel Core i7-13700F (16C/24T: 8P + 8E, up to 5.2 GHz, AVX2, FMA3, BMI2)",
  ram: "32 GB DDR5-5800 MT/s Dual-Channel",
  os: "Microsoft Windows NT 10.0.26100 (x64) with native IOCP & DirectStorage",
};

export function buildWinnerManifest(
  benchmarks: BenchmarkRecord[],
): WinnerManifest {
  const winnersByLayer: Record<SovereignLayerId, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
  };

  for (const b of benchmarks) {
    if (b.winnerLayer >= 1 && b.winnerLayer <= 6) {
      winnersByLayer[b.winnerLayer as SovereignLayerId] =
        (winnersByLayer[b.winnerLayer as SovereignLayerId] || 0) + 1;
    }
  }

  const purgedCount = CHROMIUM_DEPENDENCY_AUDIT.filter(
    (d) => d.verdict === "PURGE_FOR_BUN",
  ).length;
  const keptCount = CHROMIUM_DEPENDENCY_AUDIT.filter(
    (d) => d.verdict === "KEEP_CHROMIUM_NATIVE",
  ).length;

  return {
    timestamp: new Date().toISOString(),
    hostHardware: CANONICAL_HARDWARE,
    totalBenchmarks: benchmarks.length,
    winnersByLayer,
    winners: benchmarks,
    auditSummary: {
      totalAudited: CHROMIUM_DEPENDENCY_AUDIT.length,
      purgedForBun: purgedCount,
      keptChromiumNative: keptCount,
    },
  };
}

export function saveWinnerManifest(
  manifest: WinnerManifest,
  targetPath?: string,
): string {
  const path = targetPath || join(process.cwd(), "winners.json");
  writeFileSync(path, JSON.stringify(manifest, null, 2), "utf-8");
  return path;
}
