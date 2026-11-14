#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { bunify, ruleSummary } from "./index.ts";

const HELP = `bunify: switch a JS/TS monorepo (pnpm, yarn, npm, lerna) to Bun, idempotently.

Usage: bunify [root] [options]

  root                    repository root (default: current directory)
  --check                 exit 1 when something is not bunified yet; change nothing
  --no-lock               skip the lock migration (bun install --lockfile-only)
  --extra <glob>          extra package.json glob outside the workspaces (repeatable)
  --tools <glob>          JS/TS tooling globs whose spawn calls are rewritten (repeatable)
  --fullbun               also replace Node-era dependencies by Bun built-ins (execa, glob, rimraf, dotenv, ...)
  --rules <id>            limit --fullbun to these rule ids (repeatable)
  --list-rules            print the fullbun rule table and exit
  --json                  print the report as JSON
  -h, --help              this help

Steps: lock migration (Bun reads pnpm/yarn/npm locks, git dependency hashes are dropped),
pnpm-workspace.yaml/lerna.json/resolutions -> package.json workspaces, overrides,
patchedDependencies, packageExtensions, trustedDependencies + bunfig.toml; every script:
pnpm/yarn/npm/npx/node/ts-node/tsx/cross-env -> bun/bunx; tooling spawn calls and shebangs.
Run again after each upstream sync; --check in CI keeps the fork bunified.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    check: { type: "boolean" },
    "no-lock": { type: "boolean" },
    extra: { type: "string", multiple: true },
    tools: { type: "string", multiple: true },
    json: { type: "boolean" },
    fullbun: { type: "boolean" },
    rules: { type: "string", multiple: true },
    "list-rules": { type: "boolean" },
    help: { type: "boolean", short: "h" },
  },
});
if (values.help) {
  console.log(HELP);
  process.exit(0);
}
if (values["list-rules"]) {
  console.log(JSON.stringify(ruleSummary(), null, 2));
  process.exit(0);
}
const report = await bunify({
  root: resolve(positionals[0] ?? "."),
  check: values.check,
  noLock: values["no-lock"],
  extraPackages: values.extra,
  tools: values.tools,
  fullbun: values.fullbun,
  rules: values.rules,
  log: values.json ? undefined : console.log,
});
if (values.json) console.log(JSON.stringify(report, null, 2));
else {
  console.log(`${report.source}: ${report.changed.length} file(s) ${values.check ? "not bunified" : "bunified"}, lock ${report.lock}`);
  if (report.fullbun) {
    console.log(`fullbun (${report.fullbun.engine}): ${report.manual.length} manual site(s)`);
    for (const [id, s] of Object.entries(report.fullbun.rules)) console.log(`  ${id}: ${s.rewritten} rewritten, ${s.manual} manual, ${s.kept} kept, ${s.files} file(s)`);
  }
}
if (values.check && report.changed.length) process.exit(1);
