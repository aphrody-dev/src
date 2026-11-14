// SPDX-License-Identifier: Apache-2.0
import { loadTrackers, validateTrackers } from "./config.ts";
import { buildGraph, writeGraph } from "./graph.ts";
import { generateMetadata } from "./metadata.ts";
import {
  type Outcome,
  type TrackersDoc,
  readTrackers,
  refresh,
  trackersPath,
  writeTrackers,
} from "./run.ts";

const val = (o: Outcome | undefined): string =>
  !o ? "-" : "error" in o ? `ERR(${o.error.slice(0, 50)})` : o.value;

export function summary(doc: TrackersDoc): string {
  const s = doc.channels.chromiumdash.Windows;
  const rows = [
    `generated ${doc.generated_at}`,
    `channels (chromiumdash Windows): ${["stable", "beta", "dev", "canary"].map((c) => `${c} ${s?.[c]?.version ?? "?"}${s?.[c]?.v8_version ? ` (V8 ${s[c]?.v8_version})` : ""}`).join(" | ")}`,
    `chrome for testing: ${JSON.stringify(doc.channels.chrome_for_testing)}`,
    ...doc.targets.map(
      (t) =>
        `${t.id.padEnd(20)} ${val(t.version).slice(0, 44).padEnd(44)} V8 ${(t.v8 ?? []).map(val).join(" / ") || "-"}`,
    ),
    ...(doc.conflicts.length
      ? ["conflicts:", ...doc.conflicts.map((c) => `  - ${c}`)]
      : []),
  ];
  return rows.join("\n");
}

export async function runTrackersCommand(args: string[]): Promise<void> {
  const sub = args[0] ?? "help";
  const flag = (n: string) => args.includes(`--${n}`);
  const only = args
    .find((a) => a.startsWith("--only="))
    ?.slice(7)
    .split(",");
  switch (sub) {
    case "refresh": {
      const doc = await refresh({ only, links: !flag("no-links") });
      await writeTrackers(doc);
      console.log(summary(doc));
      return;
    }
    case "graph": {
      const doc = await readTrackers();
      if (!doc)
        throw new Error(
          `${trackersPath()} missing: run trackers refresh first`,
        );
      const g = await buildGraph(doc, { gn: !flag("no-gn") });
      await writeGraph(g);
      console.log(
        `graph: ${g.nodes.length} nodes, ${g.edges.length} edges (${g.edges.filter((e) => e.kind === "gn").length} gn, ${g.edges.filter((e) => e.kind === "deps").length} deps, ${g.edges.filter((e) => e.kind === "consumes").length} consumes)`,
        g.notes.join("; "),
      );
      return;
    }
    case "metadata": {
      const r = await generateMetadata();
      console.log(
        `metadata: ${r.written} README.chromium written, ${r.removed} stale removed`,
      );
      return;
    }
    case "all": {
      const doc = await refresh({ only, links: !flag("no-links") });
      await writeTrackers(doc);
      const g = await buildGraph(doc, { gn: !flag("no-gn") });
      await writeGraph(g);
      const m = await generateMetadata(doc);
      console.log(summary(doc));
      console.log(
        `graph: ${g.nodes.length} nodes, ${g.edges.length} edges; metadata: ${m.written} README.chromium`,
      );
      return;
    }
    case "show": {
      const doc = await readTrackers();
      if (!doc) throw new Error("no trackers file");
      console.log(summary(doc));
      return;
    }
    case "check": {
      const errs = validateTrackers(await loadTrackers());
      if (errs.length) {
        console.error(errs.join("\n"));
        process.exit(1);
      }
      console.log("trackers: configuration consistent");
      return;
    }
    default:
      console.log(
        "Usage: trackers <refresh|graph|metadata|all|show|check> [--only=id,id] [--no-links] [--no-gn]\n  refresh   live versions, links, V8 pins -> third_party/chromium-trackers.json\n  graph     DEPS + gn components + consumers -> third_party/chromium-graph.{json,mmd}\n  metadata  third_party/metadata/<dir>/README.chromium\n  check     ECOSYSTEM.toml [tracker.*] consistency (offline)",
      );
  }
}
