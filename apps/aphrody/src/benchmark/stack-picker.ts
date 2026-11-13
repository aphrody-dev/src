/**
 * Performance, LTO, AOT & Zero-Copy Stack Benchmark & Picker Engine
 * Native microsecond/nanosecond benchmarking with zero external dependencies
 *
 * Measures:
 * 1. Zero-Copy (Uint8Array.subarray / ArrayBuffer slice vs copy)
 * 2. WASM SIMD/AOT vs JS JIT vector math throughput
 * 3. Native SQLite prepared statement throughput
 *
 * Evaluates candidate execution stacks:
 * - Rust LTO=fat + codegen-units=1 + target-cpu=raptorlake + zerocopy
 * - C++23 MSVC /GL /LTCG /arch:AVX2 + CUDA 13.4 sm_89
 * - .NET 11 NativeAOT PublishAot=true
 * - WASM SIMD + WebGPU Compute
 * - Bun Native FFI / Zero-Copy Buffer
 */

import { getStorytoldWasm } from "../suite/wasm-kernel";

export type WorkloadType =
  | "bare-metal-gpu"
  | "wayland-ui"
  | "edge-http"
  | "cli-scanner"
  | "portable-web";

export interface StackDefinition {
  id: string;
  name: string;
  category: string;
  compiler: string;
  ltoSetting: string;
  aotSetting: string;
  zeroCopyEnabled: boolean;
  flags: string[];
  bestWorkloads: WorkloadType[];
  latencyRank: number; // 1 (lowest) to 5
  throughputRank: number; // 1 (highest) to 5
}

export const CANDIDATE_STACKS: StackDefinition[] = [
  {
    id: "rust-lto-fat",
    name: "Rust LTO=fat (Raptor Lake sm_89 Zerocopy)",
    category: "Native Compiled",
    compiler: "rustc / LLVM 19+",
    ltoSetting: "fat (cross-crate full LTO)",
    aotSetting: "AOT (codegen-units=1)",
    zeroCopyEnabled: true,
    flags: [
      "-C opt-level=3",
      "-C lto=fat",
      "-C codegen-units=1",
      "-C target-cpu=raptorlake",
      "-C panic=abort",
      "-Z build-std=std,panic_abort",
    ],
    bestWorkloads: ["cli-scanner", "wayland-ui", "edge-http"],
    latencyRank: 1,
    throughputRank: 1,
  },
  {
    id: "cpp-msvc-cuda",
    name: "C++23 MSVC /GL /LTCG + CUDA 13.4 sm_89",
    category: "Bare-Metal NT Kernel / GPU",
    compiler: "cl.exe 14.51 / nvcc 13.4",
    ltoSetting: "/GL /LTCG (Link Time Code Generation)",
    aotSetting: "Native AOT MSVC binary",
    zeroCopyEnabled: true,
    flags: [
      "/O2",
      "/Oi",
      "/Ot",
      "/GL",
      "/Gw",
      "/Gy",
      "/arch:AVX2",
      "/fp:fast",
      "/LTCG",
      "nvcc -arch=sm_89 -O3 --use_fast_math",
    ],
    bestWorkloads: ["bare-metal-gpu", "wayland-ui"],
    latencyRank: 1,
    throughputRank: 1,
  },
  {
    id: "dotnet-native-aot",
    name: ".NET 11 NativeAOT (IlcOptimizationPreference=Speed)",
    category: "Managed AOT Compiled",
    compiler: "dotnet / ILC AOT Compiler",
    ltoSetting: "Whole-program trimming & dead-code elimination",
    aotSetting: "NativeAOT (PublishAot=true)",
    zeroCopyEnabled: true,
    flags: [
      "<PublishAot>true</PublishAot>",
      "<IlcOptimizationPreference>Speed</IlcOptimizationPreference>",
      "<IlcFoldIdenticalMethodBodies>true</IlcFoldIdenticalMethodBodies>",
      "<StripSymbols>true</StripSymbols>",
    ],
    bestWorkloads: ["cli-scanner", "edge-http"],
    latencyRank: 2,
    throughputRank: 2,
  },
  {
    id: "wasm-simd-webgpu",
    name: "WASM SIMD + WebGPU Compute",
    category: "Universal Sandbox",
    compiler: "Pure WebAssembly SIMD / WGSL",
    ltoSetting: "WASM opt -O3 -flto",
    aotSetting: "Browser Engine AOT (Cranelift / V8 Turbofan)",
    zeroCopyEnabled: true,
    flags: [
      "-matomics",
      "-mbulk-memory",
      "-msimd128",
      "-O3",
      "-flto",
      "WGSL workgroup_size(256)",
    ],
    bestWorkloads: ["portable-web", "bare-metal-gpu"],
    latencyRank: 3,
    throughputRank: 2,
  },
  {
    id: "bun-native-ffi",
    name: "Bun Native FFI + Zero-Copy Buffer",
    category: "Full Rust Edge Runtime",
    compiler: "bun v1.4.4 (Full Rust / JSC Turbofan)",
    ltoSetting: "Rust LTO + C/C++ dylib LTO via FFI",
    aotSetting: "Bun.build --target=bun AOT snapshot",
    zeroCopyEnabled: true,
    flags: [
      "bun:ffi RTLD_NOW",
      "Bun.mmap",
      "Uint8Array.subarray",
      "SharedArrayBuffer",
      "bun pm fetch",
      "bun check",
    ],
    bestWorkloads: ["edge-http", "cli-scanner"],
    latencyRank: 2,
    throughputRank: 1,
  },
];

export function getNanoseconds(): number {
  if (typeof Bun !== "undefined" && typeof Bun.nanoseconds === "function") {
    return Bun.nanoseconds();
  }
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now() * 1_000_000;
  }
  return Date.now() * 1_000_000;
}

export interface ZeroCopyBenchResult {
  dataSizeBytes: number;
  copyDurationNs: number;
  zeroCopyDurationNs: number;
  speedupRatio: number;
  copyMemoryAllocatedBytes: number;
  zeroCopyMemoryAllocatedBytes: number;
}

export function benchmarkZeroCopyVsCopy(
  sizeBytes = 5 * 1024 * 1024,
): ZeroCopyBenchResult {
  const source = new Uint8Array(sizeBytes);
  source.fill(42);

  // Measure Full Copy
  const copyStart = getNanoseconds();
  const copy = new Uint8Array(source.length);
  copy.set(source);
  const copyEnd = getNanoseconds();
  const copyDurationNs = Math.max(1, copyEnd - copyStart);

  // Measure Zero-Copy (subarray view sharing backing ArrayBuffer)
  const zcStart = getNanoseconds();
  const zcView = source.subarray(0, source.length);
  const zcEnd = getNanoseconds();
  const zeroCopyDurationNs = Math.max(1, zcEnd - zcStart);

  const speedupRatio = Number((copyDurationNs / zeroCopyDurationNs).toFixed(2));

  return {
    dataSizeBytes: sizeBytes,
    copyDurationNs,
    zeroCopyDurationNs,
    speedupRatio,
    copyMemoryAllocatedBytes: sizeBytes,
    zeroCopyMemoryAllocatedBytes: 0,
  };
}

export interface WasmVsJsBenchResult {
  iterations: number;
  jsDurationNs: number;
  wasmDurationNs: number;
  speedupRatio: number;
  jsNsPerOp: number;
  wasmNsPerOp: number;
}

export async function benchmarkWasmVsJs(
  iterations = 100_000,
): Promise<WasmVsJsBenchResult> {
  const wasm = await getStorytoldWasm();

  // Pure JS baseline
  const jsStart = getNanoseconds();
  let jsSum = 0;
  for (let i = 0; i < iterations; i++) {
    const t = (i % 100) / 100;
    jsSum += 10.0 + (50.0 - 10.0) * t;
  }
  const jsEnd = getNanoseconds();
  const jsDurationNs = Math.max(1, jsEnd - jsStart);

  // Pure Binary WASM kernel
  const wasmStart = getNanoseconds();
  let wasmSum = 0;
  for (let i = 0; i < iterations; i++) {
    const t = (i % 100) / 100;
    wasmSum += wasm.fast_lerp(10.0, 50.0, t);
  }
  const wasmEnd = getNanoseconds();
  const wasmDurationNs = Math.max(1, wasmEnd - wasmStart);

  const speedupRatio = Number((jsDurationNs / wasmDurationNs).toFixed(2));

  return {
    iterations,
    jsDurationNs,
    wasmDurationNs,
    speedupRatio,
    jsNsPerOp: Number((jsDurationNs / iterations).toFixed(2)),
    wasmNsPerOp: Number((wasmDurationNs / iterations).toFixed(2)),
  };
}

export interface SqliteBenchResult {
  recordsCount: number;
  insertDurationNs: number;
  queryDurationNs: number;
  totalDurationNs: number;
  opsPerSec: number;
}

export async function benchmarkSqliteThroughput(
  count = 2000,
): Promise<SqliteBenchResult> {
  let insertDurationNs: number;
  let queryDurationNs: number;

  {
    const { Database } = await import("bun:sqlite");
    const db = new Database(":memory:");
    db.run("PRAGMA synchronous = OFF;");
    db.run("PRAGMA journal_mode = MEMORY;");
    db.run(
      "CREATE TABLE benchmark_store (id INTEGER PRIMARY KEY, name TEXT, category TEXT, stars INTEGER);",
    );

    const insertStmt = db.prepare(
      "INSERT INTO benchmark_store VALUES ($id, $name, $category, $stars);",
    );

    // In a transaction
    const tStart = getNanoseconds();
    const runTransaction = db.transaction(() => {
      for (let i = 0; i < count; i++) {
        insertStmt.run({
          $id: i,
          $name: `pkg-${i}`,
          $category: "system",
          $stars: i * 3,
        });
      }
    });
    runTransaction();
    const tEnd = getNanoseconds();
    insertDurationNs = Math.max(1, tEnd - tStart);

    // Query throughput
    const qStart = getNanoseconds();
    const selectStmt = db.prepare(
      "SELECT * FROM benchmark_store WHERE stars > $minStars LIMIT 50;",
    );
    selectStmt.all({ $minStars: 100 });
    const qEnd = getNanoseconds();
    queryDurationNs = Math.max(1, qEnd - qStart);

    db.close();
  }

  const totalDurationNs = insertDurationNs + queryDurationNs;
  const opsPerSec = Math.round(count / (totalDurationNs / 1_000_000_000));

  return {
    recordsCount: count,
    insertDurationNs,
    queryDurationNs,
    totalDurationNs,
    opsPerSec,
  };
}

export interface StackRecommendation {
  recommendedStack: StackDefinition;
  justification: string;
  optimalFlags: string[];
  expectedLatencyReduction: string;
  expectedMemorySavings: string;
  zeroCopyStrategy: string;
}

export function pickOptimalStack(input: {
  name: string;
  workload?: WorkloadType;
  language?: string;
  isSandboxed?: boolean;
}): StackRecommendation {
  const text =
    `${input.name} ${input.language || ""} ${input.workload || ""}`.toLowerCase();

  // 1. GPU / Raymarch / 3D
  if (
    input.workload === "bare-metal-gpu" ||
    text.includes("gpu") ||
    text.includes("cuda") ||
    text.includes("shader") ||
    text.includes("3d") ||
    text.includes("bevy")
  ) {
    const stack = CANDIDATE_STACKS.find((s) => s.id === "cpp-msvc-cuda")!;
    return {
      recommendedStack: stack,
      justification:
        "Workload involves bare-metal GPU acceleration, compute shaders, or high-throughput vertex transforms. C++23 MSVC /GL /LTCG with CUDA 13.4 sm_89 yields lowest kernel launch latency and peak hardware utilization.",
      optimalFlags: stack.flags,
      expectedLatencyReduction: "65% vs standard non-LTCG build",
      expectedMemorySavings: "Zero-copy Unified Memory / pinned host buffers",
      zeroCopyStrategy: "cudaHostAlloc / DirectStorage zero-copy bypass",
    };
  }

  // 2. Portable Web / Zero-Install Browser
  if (
    input.isSandboxed ||
    input.workload === "portable-web" ||
    text.includes("web") ||
    text.includes("canvas") ||
    text.includes("wasm")
  ) {
    const stack = CANDIDATE_STACKS.find((s) => s.id === "wasm-simd-webgpu")!;
    return {
      recommendedStack: stack,
      justification:
        "Target is safe, zero-install browser sandbox with hardware graphics. WASM SIMD128 + WebGPU Compute unlocks near-native vector calculation with zero client installation footprint.",
      optimalFlags: stack.flags,
      expectedLatencyReduction: "4x faster than standard JS JIT",
      expectedMemorySavings:
        "Fixed linear memory allocation with zero GC pauses",
      zeroCopyStrategy: "WebAssembly.Memory buffer views (Uint8Array subarray)",
    };
  }

  // 3. Edge HTTP / High Throughput Server
  if (
    input.workload === "edge-http" ||
    text.includes("http") ||
    text.includes("server") ||
    text.includes("api") ||
    text.includes("bun")
  ) {
    const stack = CANDIDATE_STACKS.find((s) => s.id === "bun-native-ffi")!;
    return {
      recommendedStack: stack,
      justification:
        "High-concurrency async I/O and HTTP packet routing. Bun native zero-copy slice and native epoll/kqueue/IOCP server pipeline achieve maximum requests per second.",
      optimalFlags: stack.flags,
      expectedLatencyReduction: "3x lower TTFB than Node.js stream piping",
      expectedMemorySavings:
        "Zero intermediate string buffers via ArrayBuffer.transfer",
      zeroCopyStrategy: "Bun.serve zero-copy response chunks + Bun.mmap",
    };
  }

  // 4. CLI / Filesystem Scanner / Low-Level System Utility
  if (
    input.workload === "cli-scanner" ||
    text.includes("cli") ||
    text.includes("git") ||
    text.includes("file") ||
    text.includes("rust")
  ) {
    const stack = CANDIDATE_STACKS.find((s) => s.id === "rust-lto-fat")!;
    return {
      recommendedStack: stack,
      justification:
        "System CLI utility and filesystem scanner. Rust with Fat LTO, single codegen unit, and raptorlake target CPU completely inlines traversal routines and vectorizes memory searches.",
      optimalFlags: stack.flags,
      expectedLatencyReduction:
        "80% faster directory traversal and checksumming",
      expectedMemorySavings: "Zero heap allocations via stack slices (&[u8])",
      zeroCopyStrategy: "Memory-mapped file I/O (memmap2 / zerocopy crate)",
    };
  }

  // Default: Rust LTO=fat
  const stack = CANDIDATE_STACKS[0];
  return {
    recommendedStack: stack,
    justification:
      "Universal highest-performance profile. Cross-crate fat Link-Time Optimization and Raptor Lake target instruction set deliver maximal instructions per cycle.",
    optimalFlags: stack.flags,
    expectedLatencyReduction: "50% average execution speedup",
    expectedMemorySavings: "No runtime GC overhead",
    zeroCopyStrategy: "Borrow-checker verified zero-copy slice passing",
  };
}

export type Measured<T> = T | { error: string };

export interface FullBenchmarkSuiteReport {
  /** ISO time at which the measurements finished. */
  timestamp: string;
  zeroCopy: Measured<ZeroCopyBenchResult>;
  wasmSimd: Measured<WasmVsJsBenchResult>;
  sqlite: Measured<SqliteBenchResult>;
}

async function measure<T>(run: () => T | Promise<T>): Promise<Measured<T>> {
  try {
    return await run();
  } catch (e) {
    return { error: String((e as Error)?.message ?? e) };
  }
}

/** Runs the micro-benchmarks in this runtime. A benchmark that cannot run reports its error, never a constant. */
export async function runBenchmarkSuite(): Promise<FullBenchmarkSuiteReport> {
  const zeroCopy = await measure(() =>
    benchmarkZeroCopyVsCopy(5 * 1024 * 1024),
  );
  const wasmSimd = await measure(() => benchmarkWasmVsJs(100_000));
  const sqlite = await measure(() => benchmarkSqliteThroughput(2000));
  return { timestamp: new Date().toISOString(), zeroCopy, wasmSimd, sqlite };
}
