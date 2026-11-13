import type {
  BenchmarkRecord,
  SovereignLayerId,
  WinnerManifest,
} from "./types.ts";
import { CHROMIUM_DEPENDENCY_AUDIT } from "./audit/purge-matrix.ts";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

export interface HostHardwareSpecs {
  gpu: string;
  cpu: string;
  ram: string;
  os: string;
}

function run(cmd: string[]): string | null {
  try {
    const r = Bun.spawnSync(cmd, { stdout: "pipe", stderr: "ignore" });
    return r.exitCode === 0 ? r.stdout.toString().trim() : null;
  } catch {
    return null; // binary absent
  }
}

/** Reads OS, CPU, RAM and GPU of the machine running the benchmarks, at call time. */
export function detectHostHardware(): HostHardwareSpecs {
  const cpus = os.cpus();
  const threads = cpus.length || navigator.hardwareConcurrency;
  const model = cpus[0]?.model.trim() ?? "unknown CPU";
  const gpuLines = run([
    "nvidia-smi",
    "--query-gpu=name,memory.total,driver_version",
    "--format=csv,noheader",
  ]);
  return {
    os: `${os.type()} ${os.release()} (${os.arch()}) [${navigator.userAgent}]`,
    cpu: `${model} (${threads} threads)`,
    ram: `${Math.round(os.totalmem() / 2 ** 30)} GB`,
    gpu: gpuLines
      ? gpuLines.split("\n").join("; ")
      : "none detected (nvidia-smi absent)",
  };
}

export interface RunProvenance {
  commit: string;
  command: string;
  host: string;
}

export function detectProvenance(): RunProvenance {
  return {
    commit: run(["git", "rev-parse", "HEAD"]) ?? "unknown",
    command: process.argv.join(" "),
    host: os.hostname(),
  };
}

export function buildWinnerManifest(
  benchmarks: BenchmarkRecord[],
  hardware: HostHardwareSpecs = detectHostHardware(),
  provenance: RunProvenance = detectProvenance(),
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
    hostHardware: hardware,
    provenance,
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
