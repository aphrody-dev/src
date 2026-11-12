import { existsSync, readFileSync } from "fs";
import { join } from "path";

const isJson = process.argv.includes("--json");

const getNowNs = (): number => {
  if (typeof Bun !== "undefined" && typeof Bun.nanoseconds === "function") {
    return Bun.nanoseconds();
  }
  return Number(process.hrtime.bigint());
};

const candidateWasmPaths = [
  "C:\\src\\crates\\bench\\tier5_bun\\kernel.wasm",
  join(import.meta.dir, "..", "..", "..", "crates", "bench", "tier5_bun", "kernel.wasm"),
];
const wasmPath =
  candidateWasmPaths.find((p) => existsSync(p)) ?? candidateWasmPaths[0]!;
const wasmBytes = readFileSync(wasmPath);

const wasmModule = new WebAssembly.Module(wasmBytes);
const wasmInstance = new WebAssembly.Instance(wasmModule, {});

const { wasm_fma_compute, wasm_triad, memory } = wasmInstance.exports as {
  wasm_fma_compute: (ptr: number, count: number, iters: number, alpha: number, beta: number) => void;
  wasm_triad: (a: number, b: number, c: number, count: number, alpha: number) => void;
  memory: WebAssembly.Memory;
};

const computeN = 1048576;
const fmaIters = 64;
const totalFlops = computeN * fmaIters * 2.0;

const f32View = new Float32Array(memory.buffer, 0, computeN);
f32View.fill(1.0);

wasm_fma_compute(0, 1024, 16, 1.0001, 0.0001);

let minWasmComputeNs = 1e18;
for (let r = 0; r < 5; r++) {
  const t0 = getNowNs();
  wasm_fma_compute(0, computeN, fmaIters, 1.0001, 0.0001);
  const t1 = getNowNs();
  const dt = t1 - t0;
  if (dt < minWasmComputeNs) minWasmComputeNs = dt;
}

const wasmComputeSec = minWasmComputeNs / 1e9;
const wasmComputeGflops = totalFlops / wasmComputeSec / 1e9;

const streamN = 2097152;
const streamBytes = streamN * 4;
const totalStreamBytes = streamBytes * 3;
const ptrA = 0;
const ptrB = streamBytes;
const ptrC = streamBytes * 2;

let minWasmStreamNs = 1e18;
for (let r = 0; r < 5; r++) {
  const t0 = getNowNs();
  wasm_triad(ptrA, ptrB, ptrC, streamN, 3.0);
  const t1 = getNowNs();
  const dt = t1 - t0;
  if (dt < minWasmStreamNs) minWasmStreamNs = dt;
}

const wasmStreamSec = minWasmStreamNs / 1e9;
const wasmStreamGbps = totalStreamBytes / wasmStreamSec / 1e9;

const rawBuffer = new ArrayBuffer(32 * 1024 * 1024);
const tZero0 = getNowNs();
const zeroCopyView = new Float32Array(rawBuffer);
const _dummyVal = zeroCopyView[0];
const tZero1 = getNowNs();
const zeroCopyNs = tZero1 - tZero0;

const tClone0 = getNowNs();
const clonedBuffer = rawBuffer.slice(0);
const clonedView = new Float32Array(clonedBuffer);
const _dummyClone = clonedView[0];
const tClone1 = getNowNs();
const cloneNs = tClone1 - tClone0;

function runMandelbrot(size: number): number {
  let sum = 0;
  for (let y = 0; y < size; y++) {
    const ci = (2.0 * y) / size - 1.0;
    for (let x = 0; x < size; x++) {
      const cr = (2.0 * x) / size - 1.5;
      let zr = 0.0;
      let zi = 0.0;
      let i = 0;
      while (i < 50 && zr * zr + zi * zi <= 4.0) {
        const tr = zr * zr - zi * zi + cr;
        const ti = 2.0 * zr * zi + ci;
        zr = tr;
        zi = ti;
        i++;
      }
      sum += i;
    }
  }
  return sum;
}

runMandelbrot(64);
const tMandel0 = getNowNs();
runMandelbrot(256);
const tMandel1 = getNowNs();
const mandelNs = tMandel1 - tMandel0;

let shellSpawnUs = 0;
try {
  const tSpawn0 = getNowNs();
  Bun.spawnSync(["cmd.exe", "/c", "echo 1"]);
  const tSpawn1 = getNowNs();
  shellSpawnUs = (tSpawn1 - tSpawn0) / 1000.0;
} catch {
  shellSpawnUs = 0;
}

if (isJson) {
  console.log(
    JSON.stringify(
      {
        tier: "Tier 5 - Pure oven-sh/bun + Inline WebAssembly AOT",
        runtime: "Bun " + Bun.version,
        engine: "JavaScriptCore + WebAssembly AOT",
        fma_gflops: Number(wasmComputeGflops.toFixed(2)),
        fma_latency_ns: Number(minWasmComputeNs.toFixed(2)),
        stream_bandwidth_gbps: Number(wasmStreamGbps.toFixed(2)),
        stream_latency_ns: Number(minWasmStreamNs.toFixed(2)),
        zero_copy_latency_ns: Number(zeroCopyNs.toFixed(2)),
        heap_clone_latency_ns: Number(cloneNs.toFixed(2)),
        zero_copy_speedup: Number((cloneNs / Math.max(zeroCopyNs, 1)).toFixed(1)),
        octane_mandelbrot_latency_us: Number((mandelNs / 1000.0).toFixed(2)),
        shell_spawn_us: Number(shellSpawnUs.toFixed(2)),
        zero_copy_mechanism:
          "TypedArray / ArrayBuffer view / SharedArrayBuffer (0 allocations, 0 bytes copied)",
      },
      null,
      2,
    ),
  );
} else {
  console.log("====================================================================");
  console.log("Tier 5 - Pure oven-sh/bun + Inline WebAssembly AOT Result");
  console.log(`Runtime: Bun ${Bun.version} (JavaScriptCore)`);
  console.log(
    `WASM FP32 FMA Compute: ${wasmComputeGflops.toFixed(2)} GFLOPS (Latency: ${(minWasmComputeNs / 1000.0).toFixed(2)} us)`,
  );
  console.log(
    `WASM Triad Bandwidth: ${wasmStreamGbps.toFixed(2)} GB/s (Latency: ${(minWasmStreamNs / 1000.0).toFixed(2)} us)`,
  );
  console.log(
    `Zero-Copy View Latency: ${zeroCopyNs.toFixed(2)} ns vs Heap Clone: ${(cloneNs / 1000.0).toFixed(2)} us (${(cloneNs / Math.max(zeroCopyNs, 1)).toFixed(1)}x speedup)`,
  );
  console.log(`Mandelbrot (AreWeFastYet) 256x256: ${(mandelNs / 1000.0).toFixed(2)} us`);
  console.log(`Shell Spawn Latency (cmd via Bun): ${shellSpawnUs.toFixed(2)} us`);
  console.log("====================================================================");
}
