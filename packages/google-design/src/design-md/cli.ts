// Copyright 2026 Aphrody. Licensed under the Apache License, Version 2.0.
//
// DESIGN.md CLI, same contract as upstream `design.md` (google-labs-code/design.md packages/cli: lint, export,
// spec; JSON on stdout, exit 1 on lint errors, 2 on unreadable input) on node:util parseArgs instead of citty.
// Reached as `ay design lint|export|spec` and `gds lint|export|spec`.
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import {
  CssVarsEmitterHandler,
  DtcgEmitterHandler,
  DEFAULT_RULE_DESCRIPTORS,
  lint,
  serializeCssVars,
  serializeTailwindV4,
  TailwindEmitterHandler,
  TailwindV4EmitterHandler,
} from "./index.ts";

export const FORMATS = [
  "css-tailwind",
  "json-tailwind",
  "tailwind",
  "dtcg",
  "css-vars",
] as const;

async function readInput(file: string): Promise<string> {
  if (file === "-") return await new Response(Bun.stdin.stream()).text();
  return readFileSync(file, "utf8");
}

const USAGE = `design.md (absorbed google-labs-code/design.md)
  lint <file|->   [--format json|text]       findings + summary, exit 1 on errors
  export <file|-> --format ${FORMATS.join("|")} [--prefix p]
  spec            [--format markdown|json]   format specification (spec.md)`;

export async function runDesignMd(argv: string[]): Promise<number> {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      format: { type: "string" },
      prefix: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });
  const [cmd, file] = positionals;
  if (values.help || !cmd) {
    console.log(USAGE);
    return cmd ? 0 : 2;
  }
  if (cmd === "spec") {
    const spec = readFileSync(new URL("./spec.md", import.meta.url), "utf8");
    if (values.format === "json")
      console.log(
        JSON.stringify(
          {
            spec,
            rules: DEFAULT_RULE_DESCRIPTORS.map((r) => ({
              name: r.name,
              severity: r.severity,
              description: r.description,
            })),
          },
          null,
          2,
        ),
      );
    else process.stdout.write(spec);
    return 0;
  }
  if (cmd !== "lint" && cmd !== "export") {
    console.error(USAGE);
    return 2;
  }
  if (!file) {
    console.error(`design.md ${cmd}: missing <file>`);
    return 2;
  }
  let content: string;
  try {
    content = await readInput(file);
  } catch (e) {
    console.error(`Error: cannot read ${file}: ${(e as Error).message}`);
    return 2;
  }
  const report = lint(content);
  if (cmd === "lint") {
    if (values.format === "text") {
      for (const f of report.findings)
        console.log(`${f.severity}\t${f.path ?? ""}\t${f.message}`);
      const s = report.summary;
      console.log(
        `${s.errors} error(s), ${s.warnings} warning(s), ${s.infos} info(s)`,
      );
    } else
      console.log(
        JSON.stringify(
          { findings: report.findings, summary: report.summary },
          null,
          2,
        ),
      );
    return report.summary.errors > 0 ? 1 : 0;
  }
  const format = values.format ?? "";
  if (!(FORMATS as readonly string[]).includes(format)) {
    console.error(
      JSON.stringify({
        error: "INVALID_FORMAT",
        message: `Invalid format "${format}". Valid formats: ${FORMATS.join(", ")}`,
      }),
    );
    return 1;
  }
  const fail = (e: { code?: string; message: string }) => (
    console.error(
      JSON.stringify({ error: e.code ?? e.message, message: e.message }),
    ),
    1
  );
  if (format === "css-tailwind") {
    const r = new TailwindV4EmitterHandler().execute(report.designSystem);
    if (!r.success) return fail(r.error);
    process.stdout.write(serializeTailwindV4(r.data.theme));
  } else if (format === "dtcg") {
    const r = new DtcgEmitterHandler().execute(report.designSystem);
    if (!r.success) return fail(r.error);
    for (const w of r.warnings ?? [])
      console.error(
        JSON.stringify({ warning: w.code, path: w.path, message: w.message }),
      );
    console.log(JSON.stringify(r.data, null, 2));
  } else if (format === "css-vars") {
    const r = new CssVarsEmitterHandler().execute(report.designSystem);
    if (!r.success) return fail(r.error);
    console.log(
      serializeCssVars(r.data.declarations, { prefix: values.prefix }),
    );
  } else {
    const r = new TailwindEmitterHandler().execute(report.designSystem);
    if (!r.success) return fail(r.error);
    console.log(JSON.stringify(r.data, null, 2));
  }
  return 0;
}

if (import.meta.main) process.exit(await runDesignMd(Bun.argv.slice(2)));
