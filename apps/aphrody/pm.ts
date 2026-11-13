#!/usr/bin/env bun
/**
 * Aphrody package search and benchmark CLI.
 *
 *   bun run pm search <query> [--eco=<name>]   real registries, per-source errors reported
 *   bun run pm bench                           measure here and store src/data/bench-latest.json
 */

import { measureAndStore } from "./src/benchmark/stored";
import { UniversalStoreManager } from "./src/store/universal-manager";

const [command = "help", arg = ""] = process.argv.slice(2);

if (command === "search") {
  const eco =
    process.argv.find((a) => a.startsWith("--eco="))?.slice(6) ?? "all";
  const r = await new UniversalStoreManager().searchDetailed(arg, eco);
  for (const s of r.sources)
    console.log(
      `[${s.ecosystem}] ${s.ok ? `${s.count} result(s)` : `ERROR ${s.error?.code}: ${s.error?.message}`}  <${s.source}>`,
    );
  for (const p of r.packages)
    console.log(
      `- [${p.ecosystem}] ${p.name}${p.version ? ` ${p.version}` : ""}${p.stars !== undefined ? ` (${p.stars} stars)` : ""}: ${p.description}\n  ${p.installCmd || p.url || ""}`,
    );
  if (r.empty) console.log("Empty query: nothing searched.");
} else if (command === "bench") {
  const r = await measureAndStore();
  console.log(JSON.stringify(r, null, 2));
} else {
  console.log(
    "Usage: bun run pm search <query> [--eco=<name>] | bun run pm bench",
  );
}
