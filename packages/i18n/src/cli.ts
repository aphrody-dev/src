#!/usr/bin/env bun
import { readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { checkCatalogs, extractKeys, reportOk } from "./check.ts";
import { SOURCE_LOCALE } from "./negotiate.ts";
import type { Catalog } from "./i18n.ts";

const USAGE = `aphrody-i18n <command>
  check [--dir locales] [--json]     compare every catalog with en: missing/extra keys, placeholders, syntax
  extract <path...> [--dir locales]  list t("key") call sites; with a catalog, report unknown and unused keys
exit code 1 when a problem is found`;

const defaultDir = new URL("../locales", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function loadDir(dir: string): Promise<Record<string, Catalog>> {
  const out: Record<string, Catalog> = {};
  for (const f of await readdir(dir)) {
    if (f.endsWith(".json"))
      out[f.slice(0, -5)] = (await Bun.file(join(dir, f)).json()) as Catalog;
  }
  return out;
}

async function walk(path: string, acc: string[]): Promise<void> {
  const st = await Bun.file(path).exists();
  if (st) {
    acc.push(path);
    return;
  }
  for (const e of await readdir(path, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(path, e.name);
    if (e.isDirectory()) await walk(p, acc);
    else if (/\.(ts|tsx|js|jsx|mjs)$/.test(e.name)) acc.push(p);
  }
}

async function main(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  const dir = resolve(flag(rest, "--dir") ?? defaultDir);
  if (cmd === "check") {
    const all = await loadDir(dir);
    const source = all[SOURCE_LOCALE];
    if (!source) {
      console.error(`no ${SOURCE_LOCALE}.json in ${dir}`);
      return 1;
    }
    const { [SOURCE_LOCALE]: _, ...others } = all;
    const reports = checkCatalogs(source, others);
    if (rest.includes("--json")) console.log(JSON.stringify(reports, null, 2));
    else {
      for (const r of reports) {
        console.log(`${r.locale}: ${reportOk(r) ? "ok" : "FAIL"}`);
        for (const [label, list] of [
          ["missing", r.missing],
          ["extra", r.extra],
          ["placeholders", r.placeholders],
          ["syntax", r.syntax],
        ] as const)
          if (list.length) console.log(`  ${label}: ${list.join(", ")}`);
      }
    }
    return reports.every(reportOk) ? 0 : 1;
  }
  if (cmd === "extract") {
    const paths = rest.filter(
      (a, i) => !a.startsWith("--") && rest[i - 1] !== "--dir",
    );
    if (!paths.length) {
      console.error(USAGE);
      return 2;
    }
    const files: string[] = [];
    for (const p of paths) await walk(resolve(p), files);
    const used = new Set<string>();
    for (const f of files)
      for (const k of extractKeys(await Bun.file(f).text())) used.add(k);
    const source = (
      (await loadDir(dir).catch(() => ({}))) as Record<string, Catalog>
    )[SOURCE_LOCALE];
    const keys = [...used].sort();
    if (!source) {
      console.log(keys.join("\n"));
      return 0;
    }
    const unknown = keys.filter((k) => !(k in source));
    const unused = Object.keys(source).filter((k) => !used.has(k));
    console.log(
      JSON.stringify({ files: files.length, keys, unknown, unused }, null, 2),
    );
    return unknown.length ? 1 : 0;
  }
  if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
    console.log(USAGE);
    return 0;
  }
  console.error(USAGE);
  return 2;
}

process.exitCode = await main(Bun.argv.slice(2));
