#!/usr/bin/env bun
/**
 * Aphrody Universal Package Manager (pm.ts)
 * Built on pure oven-sh/bun (Full Rust) with zero external npm dependencies
 *
 * Commands:
 *   bun run pm search <query> [--eco=<name>]
 *   bun run pm install <packageId>
 *   bun run pm list
 *   bun run pm generations
 *   bun run pm rollback <generationId>
 *   bun run pm awesome <url-or-file>
 *   bun run pm bench
 */

import { UniversalStoreManager } from "./src/store/universal-manager";
import {
  runBenchmarkSuite,
  pickOptimalStack,
} from "./src/benchmark/stack-picker";
import { readFileSync, existsSync } from "fs";

const args = process.argv.slice(2);
const command = args[0] || "help";

const manager = UniversalStoreManager.getInstance("var/store.sqlite");

async function main() {
  switch (command) {
    case "search": {
      const q = args[1] || "";
      let eco = "all";
      const ecoArg = args.find((a) => a.startsWith("--eco="));
      if (ecoArg) {
        eco = ecoArg.split("=")[1];
      }
      console.log(`Searching Store for "${q}" across ecosystem: ${eco}...`);
      const results = await manager.search(q, eco as any);
      console.log(`Found ${results.length} package(s):`);
      results.forEach((pkg) => {
        const stackName = pkg.pickedStack
          ? pkg.pickedStack.recommendedStack.name
          : "Standard";
        console.log(
          `- [${pkg.ecosystem.toUpperCase()}] ${pkg.name} (${pkg.version})`,
        );
        console.log(`  Desc: ${pkg.description}`);
        console.log(`  Install: ${pkg.installCmd}`);
        console.log(`  Optimal Stack: ${stackName}`);
        console.log("");
      });
      break;
    }

    case "install": {
      const pkgId = args[1];
      if (!pkgId) {
        console.error(
          "Error: specify packageId to install (e.g. bun run pm install bun-elysia)",
        );
        process.exit(1);
      }
      const newGen = manager.installPackage(pkgId);
      console.log(`Package ${pkgId} installed successfully!`);
      console.log(
        `Created Declarative Generation #${newGen.id}: ${newGen.description}`,
      );
      console.log(`Active Packages: [${newGen.packages.join(", ")}]`);
      break;
    }

    case "uninstall": {
      const pkgId = args[1];
      if (!pkgId) {
        console.error("Error: specify packageId to uninstall");
        process.exit(1);
      }
      const newGen = manager.uninstallPackage(pkgId);
      console.log(`Package ${pkgId} uninstalled.`);
      console.log(
        `Created Declarative Generation #${newGen.id}: ${newGen.description}`,
      );
      break;
    }

    case "list": {
      const activeGen = manager.getActiveGeneration();
      console.log(
        `Current Active Generation #${activeGen.id} (${activeGen.timestamp})`,
      );
      console.log(`Description: ${activeGen.description}`);
      console.log(`Installed Packages (${activeGen.packages.length}):`);
      activeGen.packages.forEach((pkgId) => {
        const pkg = manager.getDatabase().getPackageById(pkgId);
        if (pkg) {
          console.log(
            `- ${pkg.name} [${pkg.ecosystem}] v${pkg.version}: ${pkg.description}`,
          );
        } else {
          console.log(`- ${pkgId} (custom / external)`);
        }
      });
      break;
    }

    case "generations": {
      const gens = manager.listGenerations();
      console.log(`Declarative Store Generations (${gens.length}):`);
      gens.forEach((g) => {
        const status = g.active ? "[ACTIVE]" : "        ";
        const rbInfo = g.rollbackId ? ` (Rollback of #${g.rollbackId})` : "";
        console.log(
          `${status} Generation #${g.id} | ${g.timestamp} | ${g.description}${rbInfo}`,
        );
        console.log(
          `         Packages (${g.packages.length}): [${g.packages.slice(0, 5).join(", ")}${g.packages.length > 5 ? "..." : ""}]`,
        );
      });
      break;
    }

    case "rollback": {
      const targetId = Number(args[1]);
      if (isNaN(targetId)) {
        console.error(
          "Error: specify target generation id (e.g. bun run pm rollback 1)",
        );
        process.exit(1);
      }
      const newGen = manager.rollback(targetId);
      console.log(`Rollback completed successfully!`);
      console.log(
        `Active Generation is now #${newGen.id} (Rolled back to state of #${targetId})`,
      );
      console.log(`Active Packages: [${newGen.packages.join(", ")}]`);
      break;
    }

    case "awesome": {
      const target = args[1];
      if (!target) {
        console.error("Error: specify awesome list URL or markdown file path");
        process.exit(1);
      }
      console.log(`Converting Awesome List from: ${target}...`);
      let content = target;
      if (existsSync(target)) {
        content = readFileSync(target, "utf-8");
      }
      const imported = await manager.convertAwesomeList(content);
      console.log(
        `Successfully converted and indexed ${imported.length} package(s) into bun:sqlite store!`,
      );
      imported.slice(0, 5).forEach((p) => {
        console.log(`- ${p.name} [${p.ecosystem}]: ${p.description}`);
      });
      break;
    }

    case "bench": {
      console.log(
        "Running Performance, LTO, AOT & Zero-Copy Stack Benchmark Engine...",
      );
      const report = await runBenchmarkSuite();
      console.log("\nHardware:");
      console.log(`  CPU: ${report.hardware.cpu}`);
      console.log(`  GPU: ${report.hardware.gpu}`);
      console.log(`  OS:  ${report.hardware.os}`);
      console.log("\n1. Zero-Copy vs Full Copy (5MB Buffer):");
      console.log(
        `  Full Copy Duration:      ${(report.zeroCopy.copyDurationNs / 1e6).toFixed(2)} ms (allocated ${report.zeroCopy.copyMemoryAllocatedBytes / 1024} KB)`,
      );
      console.log(
        `  Zero-Copy View Duration: ${(report.zeroCopy.zeroCopyDurationNs / 1e3).toFixed(2)} us (0 bytes allocated)`,
      );
      console.log(
        `  Speedup Ratio:           ${report.zeroCopy.speedupRatio}x`,
      );

      console.log("\n2. WASM SIMD / AOT vs Pure JS JIT (100,000 Vector Ops):");
      console.log(`  Pure JS JIT:  ${report.wasmSimd.jsNsPerOp} ns/op`);
      console.log(`  WASM SIMD:    ${report.wasmSimd.wasmNsPerOp} ns/op`);
      console.log(`  Speedup:      ${report.wasmSimd.speedupRatio}x`);

      console.log(
        "\n3. bun:sqlite Prepared Statement Throughput (2,000 Records):",
      );
      console.log(
        `  Insert Duration: ${(report.sqlite.insertDurationNs / 1e6).toFixed(2)} ms`,
      );
      console.log(
        `  Throughput:      ${report.sqlite.opsPerSec.toLocaleString()} ops/sec`,
      );

      console.log("\n4. Candidate Stack Auto-Picker Evaluation:");
      for (const [key, rec] of Object.entries(report.sampleRecommendations)) {
        console.log(`  Package: ${key}`);
        console.log(`    Recommended Stack: ${rec.recommendedStack.name}`);
        console.log(`    Flags: ${rec.optimalFlags.join(" ")}`);
        console.log(`    Expected Latency: ${rec.expectedLatencyReduction}`);
        console.log(`    Zero-Copy: ${rec.zeroCopyStrategy}`);
      }
      break;
    }

    default:
      console.log(`
Aphrody Universal Declarative Package Manager (pm.ts)
100% pure oven-sh/bun (Full Rust) with zero external dependencies

Usage:
  bun run pm search <query> [--eco=<name>]
  bun run pm install <packageId>
  bun run pm uninstall <packageId>
  bun run pm list
  bun run pm generations
  bun run pm rollback <generationId>
  bun run pm awesome <markdown-url-or-file>
  bun run pm bench
      `);
      break;
  }
}

main().catch((err) => {
  console.error("PM Command Error:", err);
  process.exit(1);
});
