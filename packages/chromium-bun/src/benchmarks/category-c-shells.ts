import type { BenchmarkRecord, ContestantMetric } from "../types.ts";
import { existsSync } from "node:fs";
import { $ } from "bun";

export interface ShellTarget {
  name: string;
  command: string;
  args: string[];
  isAvailable: boolean;
  layer: 1 | 2 | 3 | 4 | 5 | 6;
}

export function getShellTargets(): ShellTarget[] {
  const bashPath = "C:\\Program Files\\Git\\bin\\bash.exe";
  const nuPath = "C:\\Users\\aphro\\AppData\\Local\\Programs\\nu\\bin\\nu.exe";
  const coreutilsPath = "C:\\Users\\aphro\\.local\\bin\\coreutils.exe";

  return [
    {
      name: "uutils (Rust coreutils.exe true)",
      command: coreutilsPath,
      args: ["true"],
      isAvailable: existsSync(coreutilsPath),
      layer: 4, // GNU in Rust
    },
    {
      name: "Windows NT native cmd.exe (/c exit)",
      command: "cmd.exe",
      args: ["/c", "exit"],
      isAvailable: true,
      layer: 1, // POSIX / Native OS
    },
    {
      name: "Bun CLI Process (bun -e exit)",
      command: "bun",
      args: ["-e", "process.exit(0)"],
      isAvailable: true,
      layer: 6, // Bun Sovereign Runtime
    },
    {
      name: "Git Bash (bash.exe --noprofile -c exit)",
      command: bashPath,
      args: ["--noprofile", "--norc", "-c", "exit"],
      isAvailable: existsSync(bashPath),
      layer: 2, // Unix / Bash
    },
    {
      name: "Nushell (nu.exe -c exit)",
      command: nuPath,
      args: ["-c", "exit"],
      isAvailable: existsSync(nuPath),
      layer: 4, // Modern Rust Shell
    },
    {
      name: "Windows PowerShell 5.1 (-NoProfile)",
      command: "powershell.exe",
      args: ["-NoProfile", "-NonInteractive", "-Command", "exit"],
      isAvailable: true,
      layer: 1, // Windows OS Shell
    },
    {
      name: "PowerShell 7 Core (pwsh.exe -NoProfile)",
      command: "pwsh.exe",
      args: ["-NoProfile", "-NonInteractive", "-Command", "exit"],
      isAvailable: true,
      layer: 1, // Windows Shell
    },
  ];
}

export async function benchmarkCategoryC(): Promise<BenchmarkRecord[]> {
  const targets = getShellTargets().filter((t) => t.isAvailable);
  const WARMUP_RUNS = 2;
  const MEASURED_RUNS = 7;

  const contestantMetrics: ContestantMetric[] = [];

  for (const target of targets) {
    // Warmup runs
    for (let w = 0; w < WARMUP_RUNS; w++) {
      Bun.spawnSync([target.command, ...target.args]);
    }

    // Measured runs
    const timings: number[] = [];
    for (let m = 0; m < MEASURED_RUNS; m++) {
      const t0 = performance.now();
      const res = Bun.spawnSync([target.command, ...target.args]);
      const dt = performance.now() - t0;
      if (res.exitCode === 0) {
        timings.push(dt);
      }
    }

    if (timings.length > 0) {
      timings.sort((a, b) => a - b);
      const min = timings[0];
      const median = timings[Math.floor(timings.length / 2)];
      const p95 =
        timings[
          Math.min(timings.length - 1, Math.floor(timings.length * 0.95))
        ];
      const max = timings[timings.length - 1];
      const mean = timings.reduce((a, b) => a + b, 0) / timings.length;

      contestantMetrics.push({
        name: target.name,
        latencyUs: Math.round(median * 1000),
        rawDurationMs: Number(median.toFixed(2)),
        details: {
          minMs: Number(min.toFixed(2)),
          medianMs: Number(median.toFixed(2)),
          p95Ms: Number(p95.toFixed(2)),
          maxMs: Number(max.toFixed(2)),
          meanMs: Number(mean.toFixed(2)),
          runs: timings.length,
          layer: target.layer,
        },
      });
    }
  }

  // Also benchmark in-process Bun.$ pipeline
  try {
    // Warmup
    for (let w = 0; w < WARMUP_RUNS; w++) {
      await $`cmd.exe /c exit`.quiet();
    }
    const inProcessTimings: number[] = [];
    for (let m = 0; m < MEASURED_RUNS; m++) {
      const t0 = performance.now();
      await $`cmd.exe /c exit`.quiet();
      inProcessTimings.push(performance.now() - t0);
    }
    inProcessTimings.sort((a, b) => a - b);
    const median = inProcessTimings[Math.floor(inProcessTimings.length / 2)];
    contestantMetrics.push({
      name: "Bun.$ (In-Process Tagged Template Shell)",
      latencyUs: Math.round(median * 1000),
      rawDurationMs: Number(median.toFixed(2)),
      details: {
        medianMs: Number(median.toFixed(2)),
        runs: inProcessTimings.length,
        layer: 6,
      },
    });
  } catch {
    // If quiet() or tagged shell fails, proceed with spawned contestants
  }

  // Sort by median latency
  contestantMetrics.sort((a, b) => a.latencyUs! - b.latencyUs!);

  const winner = contestantMetrics[0];
  const runnerUp = contestantMetrics[1];
  const speedupFactor = Number(
    (runnerUp.latencyUs! / winner.latencyUs!).toFixed(2),
  );
  const slowest = contestantMetrics[contestantMetrics.length - 1];
  const totalSpeedupVsSlowest = Number(
    (slowest.latencyUs! / winner.latencyUs!).toFixed(1),
  );

  const targetWinner = targets.find((t) => t.name === winner.name);
  const winnerLayer = targetWinner
    ? targetWinner.layer
    : winner.name.includes("Bun")
      ? 6
      : 4;

  return [
    {
      id: "shell_startup_hyperfine",
      category: "C_SHELLS",
      title:
        "Shell & Command Runner Startup Latency (Hyperfine Multi-Run Methodology)",
      contestants: contestantMetrics,
      winner: winner.name,
      runnerUp: runnerUp.name,
      speedupFactor,
      primaryMetric: `${(winner.latencyUs! / 1000).toFixed(2)} ms median`,
      winnerLayer,
      summary: `Hyperfine startup test: ${winner.name} achieved ${(winner.latencyUs! / 1000).toFixed(2)} ms median latency, outperforming ${runnerUp.name} by ${speedupFactor}x and slowest shell (${slowest.name}) by ${totalSpeedupVsSlowest}x.`,
    },
  ];
}
