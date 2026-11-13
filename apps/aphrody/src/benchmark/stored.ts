/**
 * Stored benchmark results served by /api/bnc. Only a real run, written by `bun run bench`, is served:
 * it carries the time, the commit and the machine it was measured on. No run stored = not measured.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { arch, cpus, platform, release, totalmem } from "os";
import { dirname, join } from "path";
import {
  runBenchmarkSuite,
  type FullBenchmarkSuiteReport,
} from "./stack-picker";

export const BENCH_FILE = join(
  import.meta.dir,
  "..",
  "data",
  "bench-latest.json",
);

export interface StoredBenchmark extends FullBenchmarkSuiteReport {
  commit: string;
  dirty: boolean;
  host: {
    runtime: string;
    os: string;
    arch: string;
    cpu: string;
    logicalCores: number;
    memoryBytes: number;
  };
}

export type BenchState =
  | { measured: true; ageSeconds: number; result: StoredBenchmark }
  | { measured: false; reason: string };

export function readStored(file = BENCH_FILE): BenchState {
  if (!existsSync(file))
    return {
      measured: false,
      reason: "no benchmark run is stored; run `bun run bench` in apps/aphrody",
    };
  try {
    const result = JSON.parse(readFileSync(file, "utf8")) as StoredBenchmark;
    const t = Date.parse(result.timestamp);
    if (!result.commit || Number.isNaN(t))
      return {
        measured: false,
        reason: "stored benchmark has no timestamp or commit",
      };
    return {
      measured: true,
      ageSeconds: Math.max(0, Math.round((Date.now() - t) / 1000)),
      result,
    };
  } catch (e) {
    return {
      measured: false,
      reason: `stored benchmark is unreadable: ${(e as Error).message}`,
    };
  }
}

function git(args: string[]): string {
  const r = Bun.spawnSync(["git", ...args], { cwd: import.meta.dir });
  if (r.exitCode !== 0) throw new Error(`git ${args.join(" ")} failed`);
  return r.stdout.toString().trim();
}

export async function measureAndStore(
  file = BENCH_FILE,
): Promise<StoredBenchmark> {
  const run = await runBenchmarkSuite();
  const result: StoredBenchmark = {
    ...run,
    commit: git(["rev-parse", "HEAD"]),
    dirty: git(["status", "--porcelain", "--", "."]).length > 0,
    host: {
      runtime: `bun ${Bun.version}`,
      os: `${platform()} ${release()}`,
      arch: arch(),
      cpu: cpus()[0]?.model.trim() ?? "unknown",
      logicalCores: cpus().length,
      memoryBytes: totalmem(),
    },
  };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(result, null, 2) + "\n");
  return result;
}

if (import.meta.main) {
  const r = await measureAndStore();
  console.log(
    `stored ${BENCH_FILE} at ${r.timestamp} (commit ${r.commit.slice(0, 8)})`,
  );
}
