#!/usr/bin/env bun
import { runFullLabsBenchmarkSuite } from "./monorepo-build-arena.ts";
import {
  benchmarkPortlessRouter,
  PortlessRouterRegistry,
  startPortlessRouterServer,
} from "./portless-router.ts";
import { discoverAndValidateSkills } from "./skills-compat.ts";

function printHelp(): void {
  console.log(`labs: C:\\src Standards & Empirical Benchmark Harness (Bun v${Bun.version})

Usage:
  just labs <command> [options]

Commands:
  bench                    Run full 5-arena empirical benchmark suite
  verify-skills            Discover and validate SKILL.md frontmatter + progressive-disclosure budgets across repos
  portless [--serve]       Print deterministic <service>.localhost routes (or start live Bun.serve router with --serve)
  help                     Display this usage information
`);
}

export async function runCli(argv = process.argv.slice(2)): Promise<number> {
  const cmd = argv[0] ?? "help";

  switch (cmd) {
    case "verify-skills": {
      const report = discoverAndValidateSkills();
      console.log(
        `[labs:verify-skills] Validated ${report.validCount}/${report.totalDiscovered} SKILL.md files (${report.invalidCount} errors)`,
      );
      console.log(
        `[labs:verify-skills] Token budget: ${report.totalDiscoveryTokens} discovery tokens vs ${report.totalActivationTokens} full tokens (${report.averageProgressiveSavingsPct}% progressive savings)`,
      );
      for (const s of report.skills) {
        console.log(
          `  ${s.name.padEnd(32)} [${s.sourceGroup}]  discovery=${String(s.discoveryTokens).padStart(3)}t  full=${String(s.fullActivationTokens).padStart(5)}t  saved=${s.progressiveSavingsPct}%`,
        );
      }
      if (report.issues.length > 0) {
        for (const issue of report.issues) {
          console.error(`  [INVALID] ${issue.filePath}: ${issue.reason}`);
        }
        return 1;
      }
      return 0;
    }

    case "portless": {
      const registry = new PortlessRouterRegistry(true);
      if (argv.includes("--serve")) {
        const portFlagIdx = argv.indexOf("--port");
        const listenPort =
          portFlagIdx !== -1 && argv[portFlagIdx + 1]
            ? Number(argv[portFlagIdx + 1])
            : 1355;
        const running = startPortlessRouterServer({
          port: listenPort,
          registry,
          proxyUpstream: true,
        });
        console.log(
          `[labs:portless] Listening on http://127.0.0.1:${running.port} (${registry.listRoutes().length} deterministic .localhost routes)`,
        );
        for (const r of registry.listRoutes()) {
          console.log(
            `  http://${r.hostname}:${running.port} -> 127.0.0.1:${r.targetPort} (${r.workspacePath})`,
          );
        }
        return 0;
      }

      const bench = await benchmarkPortlessRouter(250_000, 200);
      console.log(
        `[labs:portless] Deterministic .localhost Route Table (zeroCollisions=${bench.zeroCollisions}, lookup=${bench.lookupAvgMicroseconds}us):`,
      );
      for (const r of registry.listRoutes()) {
        console.log(
          `  http://${r.hostname.padEnd(26)} -> 127.0.0.1:${r.targetPort}  (${r.workspacePath})`,
        );
      }
      return 0;
    }

    case "bench": {
      const t0 = Bun.nanoseconds();
      const res = await runFullLabsBenchmarkSuite({ writeArtifacts: true });
      const elapsedSec = ((Bun.nanoseconds() - t0) / 1e9).toFixed(2);
      console.log(
        `[labs:bench] Completed 5-arena empirical suite in ${elapsedSec}s`,
      );
      console.log(
        `  1. Skills Parser:    ${res.skillsParser.sovereignOpsPerSec.toLocaleString()} ops/s vs ${res.skillsParser.baselineOpsPerSec.toLocaleString()} ops/s (${res.skillsParser.speedupFactor}x faster)`,
      );
      console.log(
        `  2. JSON-Render SSR:  ${res.jsonRender.sovereignSsrOpsPerSec.toLocaleString()} ops/s vs ${res.jsonRender.baselineVdomOpsPerSec.toLocaleString()} ops/s (${res.jsonRender.speedupFactor}x faster, ${res.jsonRender.sovereignGzipBytes}B gz, CLS=${res.jsonRender.clsScore})`,
      );
      console.log(
        `  3. Portless Router:  ${res.portlessRouter.lookupAvgMicroseconds}us lookup (${res.portlessRouter.lookupOpsPerSec.toLocaleString()} ops/s), ${res.portlessRouter.httpRequestsPerSec.toLocaleString()} HTTP req/s`,
      );
      console.log(
        `  4. AI Stream SSE:    ${res.aiStream.sovereignFramesPerSec.toLocaleString()} frames/s (${res.aiStream.sovereignMegabytesPerSec} MB/s) vs ${res.aiStream.baselineFramesPerSec.toLocaleString()} frames/s (${res.aiStream.speedupFactor}x faster)`,
      );
      console.log(
        `  5. Monorepo & FFI:   Merkle FFI ${res.monorepoBuild.merkleSnapshot.rustFfiMs}ms vs Node ${res.monorepoBuild.merkleSnapshot.nodeStyleCryptoWalkMs}ms (${res.monorepoBuild.merkleSnapshot.speedupFactor}x faster); depot.exe ${res.monorepoBuild.cliColdStart.depotInfoAvgMs}ms vs node ${res.monorepoBuild.cliColdStart.nodeBaselineScriptAvgMs}ms (${res.monorepoBuild.cliColdStart.depotVsNodeSpeedup}x faster)`,
      );
      console.log(
        `  Artifacts written:   BENCHMARK_REPORT.md, benchmark-results.json`,
      );
      return 0;
    }

    case "help":
    case "--help":
    case "-h":
      printHelp();
      return 0;

    default:
      console.error(`Unknown command: ${cmd}`);
      printHelp();
      return 1;
  }
}

if (import.meta.main) {
  const code = await runCli();
  if (code !== 0 && !process.argv.includes("--serve")) {
    process.exit(code);
  }
}
