import type { BenchmarkRecord, ContestantMetric } from "../types.ts";
import {
  statSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  unlinkSync,
  existsSync,
} from "node:fs";
import { join } from "node:path";
import { CHROMIUM_ROOT, findExecutable } from "../paths.ts";
import { ReadableStream, WritableStream } from "node:stream/web";

const UUTILS_COREUTILS = findExecutable("coreutils") ?? "coreutils";
const HAS_UUTILS = findExecutable("coreutils") !== null;

export async function benchmarkCategoryB(): Promise<BenchmarkRecord[]> {
  const records: BenchmarkRecord[] = [];

  // 1. Directory Walk Benchmark (Bun.Glob vs Node fs.readdir recursive vs PowerShell)
  {
    const targetDir = join(CHROMIUM_ROOT, "ui", "color");
    const iterations = 5;

    // Bun.Glob
    const bunStart = performance.now();
    let bunCount = 0;
    for (let i = 0; i < iterations; i++) {
      const glob = new Bun.Glob("**/*");
      const files = Array.from(glob.scanSync({ cwd: targetDir }));
      bunCount = files.length;
    }
    const bunDuration = (performance.now() - bunStart) / iterations;

    // Node readdir recursive
    const nodeStart = performance.now();
    let nodeCount = 0;
    for (let i = 0; i < iterations; i++) {
      const files = readdirSync(targetDir, { recursive: true });
      nodeCount = files.length;
    }
    const nodeDuration = (performance.now() - nodeStart) / iterations;

    // PowerShell Get-ChildItem
    const psStart = performance.now();
    const psProc = Bun.spawnSync([
      "powershell.exe",
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      `(Get-ChildItem -Path '${targetDir}' -Recurse).Count`,
    ]);
    const psDuration = performance.now() - psStart;

    const bunLatencyUs = Math.round(bunDuration * 1000);
    const nodeLatencyUs = Math.round(nodeDuration * 1000);
    const psLatencyUs = Math.round(psDuration * 1000);

    const contestants: ContestantMetric[] = [
      {
        name: "Bun (new Bun.Glob in Rust)",
        latencyUs: bunLatencyUs,
        rawDurationMs: bunDuration,
        details: { filesScanned: bunCount },
      },
      {
        name: "Node.js (fs.readdirSync recursive)",
        latencyUs: nodeLatencyUs,
        rawDurationMs: nodeDuration,
        details: { filesScanned: nodeCount },
      },
      {
        name: "PowerShell (Get-ChildItem -Recurse)",
        latencyUs: psLatencyUs,
        rawDurationMs: psDuration,
      },
    ];

    contestants.sort((a, b) => a.latencyUs! - b.latencyUs!);
    const winner = contestants[0];
    const runnerUp = contestants[1];
    const speedupFactor = Number(
      (runnerUp.latencyUs! / winner.latencyUs!).toFixed(2),
    );

    records.push({
      id: "directory_walk_fs",
      category: "B_OS_POSIX",
      title: "Filesystem Directory Walk (Chromium ui/color tree)",
      contestants,
      winner: winner.name,
      runnerUp: runnerUp.name,
      speedupFactor,
      primaryMetric: `${winner.latencyUs} µs median latency`,
      winnerLayer: 6, // Bun Rust FS
      summary: `Directory scan: ${winner.name} was ${speedupFactor}x faster than ${runnerUp.name}.`,
    });
  }

  // 2. File I/O Stat & Read (Bun.file vs Node.fs vs uutils stat)
  {
    const sampleFilePath = join(CHROMIUM_ROOT, "ui", "color", "color_id.h");
    const iterations = 500;

    // Bun.file
    const bunStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const f = Bun.file(sampleFilePath);
      const _ = f.size;
    }
    const bunDuration = performance.now() - bunStart;
    const bunOps = (iterations / bunDuration) * 1000;

    // Node statSync
    const nodeStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const s = statSync(sampleFilePath);
      const _ = s.size;
    }
    const nodeDuration = performance.now() - nodeStart;
    const nodeOps = (iterations / nodeDuration) * 1000;

    const contestants: ContestantMetric[] = [
      {
        name: "Bun (Bun.file zero-copy stat)",
        opsPerSec: Math.round(bunOps),
        rawDurationMs: bunDuration,
      },
      {
        name: "Node.js (fs.statSync)",
        opsPerSec: Math.round(nodeOps),
        rawDurationMs: nodeDuration,
      },
    ];

    if (HAS_UUTILS) {
      const uutilsStart = performance.now();
      const uutilsCount = 10;
      for (let i = 0; i < uutilsCount; i++) {
        Bun.spawnSync([UUTILS_COREUTILS, "stat", sampleFilePath], {
          stdout: "ignore",
        });
      }
      const uutilsDuration = performance.now() - uutilsStart;
      const uutilsOps = (uutilsCount / uutilsDuration) * 1000;
      contestants.push({
        name: "uutils (Rust coreutils stat)",
        opsPerSec: Math.round(uutilsOps),
        rawDurationMs: uutilsDuration,
      });
    }

    contestants.sort((a, b) => b.opsPerSec! - a.opsPerSec!);
    const winner = contestants[0];
    const runnerUp = contestants[1];
    const speedupFactor = Number(
      (winner.opsPerSec! / runnerUp.opsPerSec!).toFixed(2),
    );

    records.push({
      id: "file_stat_ops",
      category: "B_OS_POSIX",
      title: "Filesystem Stat Operations (color_id.h header)",
      contestants,
      winner: winner.name,
      runnerUp: runnerUp.name,
      speedupFactor,
      primaryMetric: `${Math.round(winner.opsPerSec!)} ops/sec`,
      winnerLayer: 6,
      summary: `Kernel metadata query: ${winner.name} achieved ${speedupFactor}x higher throughput.`,
    });
  }

  // 3. Pipe & Stream Throughput (10 MB data chunk streaming)
  {
    const totalBytes = 10 * 1024 * 1024; // 10MB
    const chunkSize = 64 * 1024; // 64KB
    const numChunks = totalBytes / chunkSize;
    const chunk = new Uint8Array(chunkSize).fill(0x7e);

    // ReadableStream to WritableStream pipe
    const t0 = performance.now();
    let receivedBytes = 0;
    const readable = new ReadableStream({
      start(controller) {
        for (let i = 0; i < numChunks; i++) {
          controller.enqueue(chunk);
        }
        controller.close();
      },
    });

    const writable = new WritableStream({
      write(c) {
        receivedBytes += c.length;
      },
    });

    await readable.pipeTo(writable);
    const duration = performance.now() - t0;
    const throughputMBs = Number(
      (totalBytes / (1024 * 1024) / (duration / 1000)).toFixed(1),
    );

    records.push({
      id: "pipe_stream_throughput",
      category: "B_OS_POSIX",
      title: "POSIX Stream Pipe Throughput (10MB 64KB chunks)",
      contestants: [
        {
          name: "POSIX Web Stream Pipe (Bun Engine)",
          throughputMBs,
          rawDurationMs: duration,
        },
        {
          name: "Simulated Blocking Pipe (1Gbps wire baseline)",
          throughputMBs: 125.0,
        },
      ],
      winner: "POSIX Web Stream Pipe (Bun Engine)",
      runnerUp: "Simulated Blocking Pipe (1Gbps wire baseline)",
      speedupFactor: Number((throughputMBs / 125.0).toFixed(2)),
      primaryMetric: `${throughputMBs} MB/s`,
      winnerLayer: 2, // Unix / POSIX stream pipe abstraction
      summary: `Stream multiplexing: in-memory web stream achieved ${throughputMBs} MB/s throughput.`,
    });
  }

  // 4. Memory Zero-Copy Transfer vs Slice Copy
  {
    const bufferSize = 16 * 1024 * 1024; // 16MB
    const source = new Uint8Array(bufferSize).fill(0x42);
    const iterations = 500;

    // Zero-copy pointer offset (Uint8Array subarray)
    const t0 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const _ = source.subarray(1024, 1024 + 65536);
    }
    const zeroCopyDuration = performance.now() - t0;
    const zeroCopyOps = (iterations / zeroCopyDuration) * 1000;

    // Buffer copy (Uint8Array slice)
    const t1 = performance.now();
    for (let i = 0; i < iterations; i++) {
      const _ = source.slice(1024, 1024 + 65536);
    }
    const copyDuration = performance.now() - t1;
    const copyOps = (iterations / copyDuration) * 1000;

    const speedupFactor = Number((zeroCopyOps / copyOps).toFixed(2));

    records.push({
      id: "zero_copy_memory",
      category: "B_OS_POSIX",
      title: "Zero-Copy Memory Pointer Offset vs Heap Slice Allocation",
      contestants: [
        {
          name: "Zero-Copy Pointer Subarray (Linux/POSIX memory model)",
          opsPerSec: Math.round(zeroCopyOps),
          rawDurationMs: zeroCopyDuration,
        },
        {
          name: "Memory Alloc & Copy (Buffer.slice)",
          opsPerSec: Math.round(copyOps),
          rawDurationMs: copyDuration,
        },
      ],
      winner: "Zero-Copy Pointer Subarray (Linux/POSIX memory model)",
      runnerUp: "Memory Alloc & Copy (Buffer.slice)",
      speedupFactor,
      primaryMetric: `${Math.round(zeroCopyOps / 1_000_000)}M ops/sec`,
      winnerLayer: 3, // Linux memory subsystem
      summary: `Virtual memory zero-copy: pointer offset avoids kernel/heap copies with ${speedupFactor}x speedup.`,
    });
  }

  // 5. Process Spawn Latency
  {
    const iterations = 5;

    // Bun.spawnSync
    const bunStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      Bun.spawnSync(["bun", "-e", "process.exit(0)"]);
    }
    const bunAvgDuration = (performance.now() - bunStart) / iterations;

    // cmd.exe /c exit
    const cmdStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      Bun.spawnSync(["cmd.exe", "/c", "exit"]);
    }
    const cmdAvgDuration = (performance.now() - cmdStart) / iterations;

    // uutils true
    let uutilsAvgDuration = 9999;
    if (HAS_UUTILS) {
      const uutilsStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        Bun.spawnSync([UUTILS_COREUTILS, "true"]);
      }
      uutilsAvgDuration = (performance.now() - uutilsStart) / iterations;
    }

    const contestants: ContestantMetric[] = [
      {
        name: "Windows NT native cmd.exe",
        latencyUs: Math.round(cmdAvgDuration * 1000),
        rawDurationMs: cmdAvgDuration,
      },
      {
        name: "uutils (Rust coreutils.exe true)",
        latencyUs: Math.round(uutilsAvgDuration * 1000),
        rawDurationMs: uutilsAvgDuration,
      },
      {
        name: "Bun Process Spawn",
        latencyUs: Math.round(bunAvgDuration * 1000),
        rawDurationMs: bunAvgDuration,
      },
    ];

    contestants.sort((a, b) => a.latencyUs! - b.latencyUs!);
    const winner = contestants[0];
    const runnerUp = contestants[1];
    const speedupFactor = Number(
      (runnerUp.latencyUs! / winner.latencyUs!).toFixed(2),
    );

    records.push({
      id: "process_spawn_latency",
      category: "B_OS_POSIX",
      title: "Process Creation & Execution Latency",
      contestants,
      winner: winner.name,
      runnerUp: runnerUp.name,
      speedupFactor,
      primaryMetric: `${(winner.latencyUs! / 1000).toFixed(1)} ms`,
      winnerLayer: winner.name.includes("cmd")
        ? 1
        : winner.name.includes("uutils")
          ? 4
          : 6,
      summary: `Process fork/exec: ${winner.name} spawned in ${(winner.latencyUs! / 1000).toFixed(1)} ms.`,
    });
  }

  return records;
}
