#!/usr/bin/env bun
// SPDX-License-Identifier: Apache-2.0
import { inspectChromiumTree } from "./audit/chromium-inspector.ts";
import { CHROMIUM_DEPENDENCY_AUDIT } from "./audit/purge-matrix.ts";
import { runAllBenchmarks } from "./benchmarks/runner.ts";
import { runEnginesCommand } from "./engines/cli.ts";
import { getAllLayers } from "./layers.ts";
import {
  auditUrlInRealChromium,
  runAgentBrowserSnapshot,
  runLighthouseAudit,
} from "./qa/real-browser-audit.ts";
import { runFullE2eRealConditionSuite } from "./qa/e2e-runner.ts";
import {
  CLUSTER_TOPOLOGY,
  ThreeVpsSearchCluster,
} from "./search/cluster-3vps.ts";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const cmd = args[0] ?? "help";

  switch (cmd) {
    case "search": {
      const query = args.slice(1).join(" ") || "aphrody";
      const cluster = new ThreeVpsSearchCluster();
      try {
        const res = await cluster.search(query, { useGrounding: true });
        console.log(JSON.stringify(res, null, 2));
      } finally {
        cluster.close();
      }
      break;
    }
    case "cluster": {
      const probe = args.includes("--probe");
      const cluster = new ThreeVpsSearchCluster();
      try {
        const health = await cluster.probeClusterHealth(probe);
        console.log(
          JSON.stringify({ topology: CLUSTER_TOPOLOGY, health }, null, 2),
        );
      } finally {
        cluster.close();
      }
      break;
    }
    case "crawl": {
      const url = args[1];
      if (!url) {
        console.error("Usage: chromium-bun crawl <url> [--chromium]");
        process.exit(1);
      }
      const useChromium = args.includes("--chromium");
      const cluster = new ThreeVpsSearchCluster({
        allowPrivateCrawl: args.includes("--allow-private"),
      });
      try {
        const res = await cluster.crawlAndIndex(url, {
          renderWithChromium: useChromium,
        });
        console.log(JSON.stringify(res, null, 2));
      } finally {
        cluster.close();
      }
      break;
    }
    case "audit-url": {
      const url = args[1] ?? "https://aphrody.com/";
      const withLighthouse = args.includes("--lighthouse");
      const withAgentBrowser = args.includes("--agent-browser");
      const forbidGoogle = args.includes("--no-external-google");

      const cdp = await auditUrlInRealChromium(url, {
        forbidExternalGoogleLinks: forbidGoogle,
      });
      const agentBrowser = withAgentBrowser
        ? await runAgentBrowserSnapshot(url)
        : null;
      const lighthouse = withLighthouse ? await runLighthouseAudit(url) : null;

      console.log(JSON.stringify({ cdp, agentBrowser, lighthouse }, null, 2));
      if (!cdp.passed || (lighthouse && !lighthouse.passed)) {
        process.exit(1);
      }
      break;
    }
    case "e2e-suite": {
      const report = await runFullE2eRealConditionSuite({
        withLighthouse: !args.includes("--no-lighthouse"),
        withAgentBrowser: !args.includes("--no-agent-browser"),
        includeProd: !args.includes("--local-only"),
      });
      console.log(JSON.stringify(report, null, 2));
      if (!report.allLocalPassed) {
        process.exit(1);
      }
      break;
    }
    case "inspect": {
      console.log(JSON.stringify(inspectChromiumTree(), null, 2));
      break;
    }
    case "layers": {
      console.log(JSON.stringify(getAllLayers(), null, 2));
      break;
    }
    case "matrix": {
      console.log(JSON.stringify(CHROMIUM_DEPENDENCY_AUDIT, null, 2));
      break;
    }
    case "engines": {
      process.exitCode = await runEnginesCommand(args.slice(1));
      break;
    }
    case "bench": {
      await runAllBenchmarks();
      break;
    }
    default: {
      console.log(
        [
          "chromium-bun — Sovereign Bun v1.4.4 + Chromium Browser, Crawler & 3-VPS Search Engine",
          "",
          "Commands:",
          "  search <query>                                    Query the RRF search cluster (nodes from infra/deploy.toml)",
          "  cluster [--probe]                                 Show 3-VPS WireGuard/MASQUE cluster topology & health",
          "  crawl <url> [--chromium] [--allow-private]        Crawl and index a page on the production node",
          "  audit-url <url> [--lighthouse] [--agent-browser]  Run real headless Chromium Web Vitals & QA audit",
          "  inspect | layers | matrix | bench                 6-Layer Chromium extraction & benchmarks",
          "  engines list|channels|path|install|launch         Browser, automation and crawl engines (engines/registry.ts)",
        ].join("\n"),
      );
      break;
    }
  }
}

if (import.meta.main) {
  void main();
}
