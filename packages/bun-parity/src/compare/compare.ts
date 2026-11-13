// `bpt compare name=/path/to/bun ...` : bun stable, canary and the aphrody-labs/bun fork side by side.
// Writes a Markdown report (`--out <file>`, docs/bun/COMPARISON.md by default from the repo root).
//
// Benchmarks follow the method of the fork's CI (third_party/bun/scripts/native-bench.sh): the same
// fixtures (third_party/bun/scripts/native-bench/fixtures), hyperfine with 3 warmups and RUNS runs per
// binary in turn on one machine, `bun install` warm with node_modules removed before each run, and
// Bun.serve under `oha -z 10s -c 64`. On Windows the shell fixture runs a Windows-safe variant
// (fixtures/shell-windows.ts here): /usr/bin and /dev/null do not exist there.

import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { cpus, totalmem, tmpdir, type as osType, release } from "node:os";
import { join, resolve } from "node:path";
import { CASES_PATH, report as llmsReport } from "../llms/cli.ts";
import type { Extracted } from "../llms/extract.ts";
import { runAll } from "../llms/run.ts";

type Bin = { name: string; path: string };

const REPO = resolve(import.meta.dir, "..", "..", "..", "..");
const BUN_SRC = join(REPO, "third_party", "bun");
const FIXTURES = join(BUN_SRC, "scripts", "native-bench", "fixtures");

function sh(cmd: string[], cwd?: string): string {
  const r = Bun.spawnSync({ cmd, cwd, stdout: "pipe", stderr: "pipe" });
  return r.stdout.toString().trim();
}

function sha256(path: string): string {
  return new Bun.CryptoHasher("sha256")
    .update(readFileSync(path))
    .digest("hex");
}

function binaries(bins: Bin[]): string {
  const rows = bins.map((b) => {
    const version = sh([b.path, "--version"]);
    const revision = sh([b.path, "--revision"]);
    return `| ${b.name} | ${version} | ${revision} | ${statSync(b.path).size.toLocaleString("en-US")} | \`${sha256(b.path).slice(0, 16)}\` |`;
  });
  return [
    "| binary | version | revision | size (bytes) | sha256 |",
    "|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}

async function gh(path: string): Promise<any> {
  const out = sh(["gh", "api", path]);
  return out ? JSON.parse(out) : undefined;
}

async function sources(): Promise<string> {
  const lines: string[] = [];
  const stable = await gh("repos/oven-sh/bun/releases/latest");
  const main = await gh("repos/oven-sh/bun/commits/main");
  const sinceStable = await gh(
    `repos/oven-sh/bun/compare/${stable?.tag_name}...main`,
  );
  const fork = await gh(
    "repos/oven-sh/bun/compare/main...aphrody-labs:bun:main",
  );
  lines.push(
    `- stable: \`${stable?.tag_name}\` (${stable?.published_at?.slice(0, 10)}), GitHub API \`releases/latest\`.`,
  );
  lines.push(
    `- canary: oven-sh/bun main \`${main?.sha?.slice(0, 10)}\` (${main?.commit?.committer?.date}), ${sinceStable?.ahead_by} commits after \`${stable?.tag_name}\`.`,
  );
  lines.push(
    `- fork: aphrody-labs/bun main, ${fork?.ahead_by} commits ahead of oven-sh/bun main and ${fork?.behind_by} behind.`,
  );
  lines.push("");
  lines.push("| fork commit | subject |");
  lines.push("|---|---|");
  for (const c of fork?.commits ?? [])
    lines.push(
      `| \`${c.sha.slice(0, 10)}\` | ${c.commit.message.split("\n")[0].replace(/\|/g, "\\|")} |`,
    );
  return lines.join("\n");
}

// What each binary exposes: Bun.*, node: modules, globals, CLI commands.
const SURFACE = `
const help = Bun.spawnSync([process.execPath, "--help"]).stdout.toString();
const commands = [...help.matchAll(/^\\s{2}([a-z][a-z-]*)\\s{2,}/gm)].map(m => m[1]);
console.log(JSON.stringify({
  bun: Object.keys(Bun).sort(),
  modules: require("node:module").builtinModules.slice().sort(),
  globals: Object.getOwnPropertyNames(globalThis).sort(),
  commands: [...new Set(commands)].sort(),
}));
`;

function surface(bins: Bin[]): string {
  const dir = mkdtempSync(join(tmpdir(), "bun-surface-"));
  const file = join(dir, "surface.js");
  writeFileSync(file, SURFACE);
  const data = bins.map((b) => ({
    b,
    s: JSON.parse(sh([b.path, file], dir) || "{}") as Record<string, string[]>,
  }));
  rmSync(dir, { recursive: true, force: true });
  const lines = [
    "| binary | `Bun.*` | `node:` modules | globals | CLI commands |",
    "|---|---|---|---|---|",
  ];
  for (const { b, s } of data)
    lines.push(
      `| ${b.name} | ${s.bun?.length} | ${s.modules?.length} | ${s.globals?.length} | ${s.commands?.length} |`,
    );
  const base = data[0]!;
  for (const { b, s } of data.slice(1)) {
    for (const key of ["bun", "modules", "globals", "commands"] as const) {
      const a = new Set(base.s[key]);
      const c = new Set(s[key]);
      const added = [...c].filter((x) => !a.has(x));
      const removed = [...a].filter((x) => !c.has(x));
      if (added.length || removed.length) {
        lines.push("");
        lines.push(
          `${b.name} against ${base.b.name}, ${key}: ${added.length ? "added " + added.map((x) => "`" + x + "`").join(", ") : ""}${added.length && removed.length ? "; " : ""}${removed.length ? "removed " + removed.map((x) => "`" + x + "`").join(", ") : ""}`,
        );
      }
    }
  }
  return lines.join("\n");
}

function hyperfine(
  label: string,
  tpl: string,
  bins: Bin[],
  cwd: string,
  extra: string[] = [],
): string {
  console.error(`bench: ${label}`);
  const json = join(cwd, `hf-${label.replace(/[^a-z0-9]+/gi, "-")}.json`);
  const args = [
    "hyperfine",
    "--warmup",
    "3",
    "--runs",
    process.env.RUNS ?? "30",
    "--export-json",
    json,
    ...extra,
  ];
  for (const b of bins)
    args.push("-n", b.name, tpl.replaceAll("{B}", `"${b.path}"`));
  const r = Bun.spawnSync({ cmd: args, cwd, stdout: "pipe", stderr: "pipe" });
  let res: { mean: number; stddev: number }[];
  try {
    // hyperfine 2 (schema_version 2) puts the statistics under summary.time_wall_clock.
    res = JSON.parse(readFileSync(json, "utf8")).results.map(
      (x: any) => x.summary?.time_wall_clock ?? x,
    );
    if (res.some((x) => typeof x.mean !== "number")) throw new Error("no mean");
  } catch {
    const why =
      r.stderr.toString().trim().split("\n").filter(Boolean).pop() ??
      "hyperfine failed";
    return `| ${label} | ${bins.map(() => "n/a").join(" | ")} | \`${why.replace(/\|/g, "\\|").slice(0, 120)}\` |`;
  }
  const best = Math.min(...res.map((x) => x.mean));
  const cells = res.map(
    (x) =>
      `${(x.mean * 1000).toFixed(1)} ± ${(x.stddev * 1000).toFixed(1)} ms${x.mean === best ? " **(best)**" : ""}`,
  );
  return `| ${label} | ${cells.join(" | ")} | |`;
}

async function http(bins: Bin[], cwd: string): Promise<string> {
  const oha = process.env.OHA || Bun.which("oha");
  if (!oha)
    return `| http | ${bins.map(() => "n/a").join(" | ")} | oha not found (PATH or $OHA) |`;
  const cells: string[] = [];
  console.error("bench: http");
  for (const b of bins) {
    const proc = Bun.spawn({
      cmd: [b.path, "serve.ts"],
      cwd,
      stdout: "ignore",
      stderr: "ignore",
    });
    for (let i = 0; i < 100; i++) {
      try {
        if ((await fetch("http://localhost:3901/")).ok) break;
      } catch {}
      await Bun.sleep(100);
    }
    const out = sh(
      [
        oha,
        "-z",
        "10s",
        "-c",
        "64",
        "--no-tui",
        "--output-format",
        "json",
        "http://localhost:3901/",
      ],
      cwd,
    );
    proc.kill();
    await proc.exited;
    try {
      const j = JSON.parse(out);
      cells.push(
        `${Math.floor(j.summary.requestsPerSec).toLocaleString("en-US")} req/s, p99 ${(j.latencyPercentiles.p99 * 1000).toFixed(2)} ms`,
      );
    } catch {
      cells.push("n/a");
    }
  }
  return `| http (Bun.serve, oha -z 10s -c 64) | ${cells.join(" | ")} | |`;
}

async function bench(bins: Bin[]): Promise<string> {
  const work = mkdtempSync(join(tmpdir(), "bun-bench-"));
  cpSync(FIXTURES, work, { recursive: true });
  if (process.platform === "win32")
    cpSync(
      join(import.meta.dir, "fixtures", "shell-windows.ts"),
      join(work, "shell.ts"),
    );
  // node_modules removed before each install run, by a script: cmd.exe mangles nested quotes.
  writeFileSync(
    join(work, "rm-node-modules.js"),
    `require("fs").rmSync("node_modules", { recursive: true, force: true });\n`,
  );
  const rm = `"${bins[0]!.path}" rm-node-modules.js`;
  const rows = [
    `| case | ${bins.map((b) => b.name).join(" | ")} | note |`,
    `|---|${bins.map(() => "---").join("|")}|---|`,
    hyperfine("startup `-e 0`", "{B} -e 0", bins, work, ["-N"]),
    hyperfine("startup `--version`", "{B} --version", bins, work, ["-N"]),
    hyperfine("Bun Shell", "{B} shell.ts", bins, work, ["-N"]),
    hyperfine("bun:ffi (2M calls)", "{B} ffi.ts", bins, work, ["-N"]),
    hyperfine(
      "bun test (1000 tests)",
      "{B} test ./runner.test.ts",
      bins,
      work,
      ["-N", "-i"],
    ),
    (() => {
      const saved = process.env.RUNS;
      process.env.RUNS = "10";
      const row = hyperfine(
        "bun install (warm cache)",
        "{B} install",
        bins,
        work,
        ["-N", "--prepare", rm],
      );
      process.env.RUNS = saved;
      return row;
    })(),
    await http(bins, work),
  ];
  rmSync(work, { recursive: true, force: true });
  return rows.join("\n");
}

/** The bun versions `ay rt` installed (tools.toml `tools_dir`, `bun/<version>`): newest release, canary, fork. */
export function installed(): Bin[] {
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const root = join(
    process.env.AY_TOOLS_DIR || join(home, ".local", "share", "ay", "tools"),
    "bun",
  );
  const exe = process.platform === "win32" ? "bun.exe" : "bun";
  if (!existsSync(root)) return [];
  const dirs = readdirSync(root);
  const releases = dirs
    .filter((d) => /^\d+\.\d+\.\d+$/.test(d))
    .sort((a, b) => Bun.semver.order(a, b));
  const out: Bin[] = [];
  const add = (name: string, dir: string | undefined) => {
    if (dir && existsSync(join(root, dir, exe)))
      out.push({ name, path: join(root, dir, exe) });
  };
  add("stable", releases.at(-1));
  add("canary", "canary");
  add("fork", "fork");
  return out;
}

export async function main(args: string[]): Promise<number> {
  const bins: Bin[] = args
    .filter((a) => a.includes("=") && !a.startsWith("--"))
    .map((kv) => ({
      name: kv.slice(0, kv.indexOf("=")),
      path: kv.slice(kv.indexOf("=") + 1),
    }));
  if (bins.length === 0) bins.push(...installed());
  if (bins.length === 0) {
    console.error(
      "usage: bpt compare [name=/path/to/bun ...] [--out file.md] [--no-bench]",
    );
    console.error(
      "without names: the stable, canary and fork bun installed by `ay rt install bun@<version|canary>` and `ay rt install bun@fork --from <bun.exe>`",
    );
    return 2;
  }
  for (const b of bins)
    if (!existsSync(b.path))
      throw new Error(`${b.name}: ${b.path} does not exist`);
  const out = args.includes("--out")
    ? args[args.indexOf("--out") + 1]!
    : join(REPO, "docs", "bun", "COMPARISON.md");
  const cases: Extracted = await Bun.file(CASES_PATH).json();
  const runs = [];
  for (const b of bins)
    runs.push({
      name: b.name,
      bin: b.path,
      version: sh([b.path, "--revision"]),
      results: await runAll(b.path, cases.cases),
    });

  const machine = `${osType()} ${release()} ${process.arch}, ${cpus()[0]?.model.trim()} (${cpus().length} threads), ${Math.round(totalmem() / 2 ** 30)} GiB`;
  const md = [
    "# bun : stable, canary et fork aphrody-labs/bun",
    "",
    `Mesuré le ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC sur ${machine}. Rejouer : \`just bun-compare\` (ou \`bun packages/bun-parity/bin/bpt.ts compare ${bins.map((b) => b.name + "=<chemin>").join(" ")}\`).`,
    "",
    "## Binaires",
    "",
    binaries(bins),
    "",
    "## Révisions et patchs du fork",
    "",
    await sources(),
    "",
    "## API et commandes exposées",
    "",
    surface(bins),
    "",
    "## Résultats documentés (bun.com/llms-full.txt)",
    "",
    llmsReport(cases, runs),
    "",
    ...(args.includes("--no-bench")
      ? []
      : [
          "## Performances",
          "",
          `Méthode de \`third_party/bun/scripts/native-bench.sh\` (CI du fork) : mêmes fixtures, hyperfine ${process.env.RUNS ?? "30"} exécutions après 3 de chauffe, binaires l'un après l'autre sur la même machine. Moyenne ± écart type. Outils : ${sh(["hyperfine", "--version"])}, ${sh([process.env.OHA || "oha", "--version"]) || "oha absent"}. \`bun install\` sans \`--frozen-lockfile=false\` (bench.sh) : bun 1.4.4 refuse une valeur à cette option.`,
          "",
          await bench(bins),
          "",
        ]),
  ].join("\n");
  writeFileSync(out, md);
  console.log(md);
  return 0;
}
