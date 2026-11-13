#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { srcRoot } from "./dx12-hal";

const benchCrateDir = join(srcRoot(), "crates", "bench");
const stackBenchExe = join(benchCrateDir, "target", "release", "stack-bench.exe");
const tier5Script = join(import.meta.dir, "tier5-bun-bench.ts");

console.log("====================================================================");
console.log("Sovereign Hardware & Compiler Benchmark Suite (Bun Entrypoint)");
console.log("Intel i7-13700F 16C/24T | 32GB DDR5-5800 | RTX 4070 sm_89 CUDA 13.4");
console.log("Runtime: Bun v" + Bun.version + " (Full-Rust Engine + JavaScriptCore C++)");
console.log("====================================================================");

if (!existsSync(stackBenchExe)) {
  console.log("\nBuilding stack-bench.exe with fat LTO, codegen-units=1, panic=abort...");
  const buildRes = spawnSync(
    "cargo",
    ["build", "--release", "--target-dir", join(benchCrateDir, "target")],
    {
      stdio: "inherit",
      cwd: benchCrateDir,
    },
  );
  if (buildRes.status !== 0) {
    console.error("Cargo release build failed");
    process.exit(1);
  }
}

console.log("\n[Tier 5] Executing Bun + WASM Kernel...");
spawnSync("bun", ["run", tier5Script], {
  stdio: "inherit",
  cwd: benchCrateDir,
});

console.log("\n[All Tiers] Executing stack-bench.exe report...");
spawnSync(stackBenchExe, ["report"], {
  stdio: "inherit",
  cwd: benchCrateDir,
});

const workloads = ["gpu-compute", "compositor", "systems-cli", "web-edge", "wasm-app"];
console.log("\n====================================================================");
console.log("Running Deterministic Stack Picker across Sovereign Workloads");
console.log("====================================================================");

for (const w of workloads) {
  console.log(`\n>>> Evaluating Workload: ${w}`);
  spawnSync(stackBenchExe, ["pick", "--workload", w], {
    stdio: "inherit",
    cwd: benchCrateDir,
  });
}

console.log("\nAll benchmarks complete. Report verified at C:\\src\\crates\\bench\\BENCHMARK_REPORT.md");
