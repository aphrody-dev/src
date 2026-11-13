// `bpt llms extract` refreshes test/llms/cases.json from https://bun.com/llms-full.txt.
// `bpt llms run name=/path/to/bun ...` runs the cases with each binary and prints a Markdown report
// (`--out <file>` writes it, `--json <file>` writes the raw results).

import { join } from "node:path";
import type { Extracted } from "./extract.ts";
import { refresh } from "./extract.ts";
import { type CaseResult, runAll } from "./run.ts";

export const CASES_PATH = join(
  import.meta.dir,
  "..",
  "..",
  "test",
  "llms",
  "cases.json",
);

/** A failure the example causes itself: it uses a name or a file it does not define. */
export function notSelfContained(r: CaseResult): boolean {
  return (
    r.status === "error" ||
    r.failures.every((f) =>
      /^(throws |rejects )?ReferenceError|^not reached$/.test(f.actual),
    )
  );
}

export function report(
  data: Extracted,
  runs: { name: string; bin: string; version: string; results: CaseResult[] }[],
): string {
  const checks = data.cases.reduce(
    (n, c) =>
      n + c.expectations.filter((e) => e.mode !== "unverifiable").length,
    0,
  );
  const lines: string[] = [];
  lines.push(
    `Source: ${data.source}, sha256 \`${data.sha256.slice(0, 16)}\`, read ${data.fetched.slice(0, 10)}.`,
  );
  lines.push(
    `${data.cases.length} examples with ${checks} checked results; ${data.skipped.length} examples left out (network, server, subprocess, files, npm packages, or no checkable result).`,
  );
  lines.push("");
  lines.push(
    "| binary | version | pass | doc and behavior differ | example not self-contained |",
  );
  lines.push("|---|---|---|---|---|");
  for (const r of runs) {
    const pass = r.results.filter((x) => x.status === "pass").length;
    const ctx = r.results.filter(
      (x) => x.status !== "pass" && notSelfContained(x),
    ).length;
    lines.push(
      `| ${r.name} | ${r.version} | ${pass} | ${r.results.length - pass - ctx} | ${ctx} |`,
    );
  }
  lines.push("");
  const ids = new Set(
    runs.flatMap((r) =>
      r.results
        .filter((x) => x.status !== "pass" && !notSelfContained(x))
        .map((x) => x.id),
    ),
  );
  if (ids.size) {
    lines.push(
      "| example | documented | " + runs.map((r) => r.name).join(" | ") + " |",
    );
    lines.push("|---|---|" + runs.map(() => "---").join("|") + "|");
    for (const id of ids) {
      const c = data.cases.find((x) => x.id === id)!;
      const first = runs
        .map((r) => r.results.find((x) => x.id === id)!)
        .find((x) => x.failures.length)!;
      const exp = first.failures[0]!.expectation;
      const cell = (r: (typeof runs)[number]) => {
        const res = r.results.find((x) => x.id === id)!;
        const f = res.failures.find((f) => f.expectation.line === exp.line);
        return f
          ? "`" +
              f.actual.replace(/\s+/g, " ").replace(/\|/g, "\\|").slice(0, 60) +
              "`"
          : "as documented";
      };
      lines.push(
        `| [${id}](${c.url}) | \`${exp.source.replace(/\|/g, "\\|").slice(0, 70)}\` | ${runs.map(cell).join(" | ")} |`,
      );
    }
  }
  return lines.join("\n") + "\n";
}

export async function main(args: string[]): Promise<number> {
  const sub = args[0];
  if (sub === "extract") {
    const data = await refresh(CASES_PATH);
    console.log(
      `${data.cases.length} cases, ${data.skipped.length} skipped -> ${CASES_PATH}`,
    );
    return 0;
  }
  if (sub === "run") {
    const data: Extracted = await Bun.file(CASES_PATH).json();
    const bins = args
      .slice(1)
      .filter((a) => a.includes("=") && !a.startsWith("--"));
    if (bins.length === 0) bins.push(`current=${process.execPath}`);
    const runs = [];
    for (const kv of bins) {
      const name = kv.slice(0, kv.indexOf("="));
      const bin = kv.slice(kv.indexOf("=") + 1);
      const version = (
        await new Response(Bun.spawn([bin, "--revision"]).stdout).text()
      ).trim();
      runs.push({ name, bin, version, results: await runAll(bin, data.cases) });
    }
    const md = report(data, runs);
    const out = args[args.indexOf("--out") + 1];
    if (args.includes("--out") && out) await Bun.write(out, md);
    const json = args[args.indexOf("--json") + 1];
    if (args.includes("--json") && json)
      await Bun.write(json, JSON.stringify(runs, null, 1));
    console.log(md);
    return 0;
  }
  console.error(
    "usage: bpt llms extract | bpt llms run [name=/path/to/bun ...] [--out report.md] [--json results.json]",
  );
  return 2;
}
