// shell-matrix : exécute les cas de conformité sur chaque shell candidat et produit une matrice.
// Usage : bun packages/shell-matrix/src/cli.ts [--json out.json] [--md out.md] <nom=commande-ou-chemin>...
// Sans argument : lit les candidats de shells.json (noms de commandes résolus dans le PATH par Bun.which).
import { dirname, join } from "node:path";
import { type Case, cases } from "./cases.ts";

type Result = {
  id: string;
  group: Case["group"];
  pass: boolean;
  got: string;
  ms: number;
};
const here = dirname(dirname(import.meta.path));
const args = process.argv.slice(2);
const flag = (k: string) => {
  const i = args.indexOf(k);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const jsonOut = flag("--json");
const mdOut = flag("--md");
const shells: Record<string, string> = args.length
  ? Object.fromEntries(args.map((a) => a.split("=") as [string, string]))
  : ((await Bun.file(join(here, "shells.json")).json()) as Record<
      string,
      string
    >);

const norm = (s: string) => s.replace(/\r\n/g, "\n").replace(/\n+$/, "");

async function run(bin: string, c: Case): Promise<Result> {
  const t0 = performance.now();
  const argv = [bin, ...(c.argv ?? ["-c"]), c.script];
  try {
    const p = Bun.spawn(argv, {
      stdout: "pipe",
      stderr: "pipe",
      stdin: "ignore",
      env: { ...process.env },
    });
    const timer = setTimeout(() => p.kill(), 10_000);
    const out = norm(await new Response(p.stdout).text());
    await p.exited;
    clearTimeout(timer);
    return {
      id: c.id,
      group: c.group,
      pass: out === c.expect,
      got: out.slice(0, 200),
      ms: performance.now() - t0,
    };
  } catch (e) {
    return {
      id: c.id,
      group: c.group,
      pass: false,
      got: `spawn error: ${String(e).slice(0, 160)}`,
      ms: performance.now() - t0,
    };
  }
}

const matrix: Record<string, Result[]> = {};
const resolved: Record<string, string | null> = {};
for (const [name, cmd] of Object.entries(shells)) {
  const bin = Bun.which(cmd);
  resolved[name] = bin;
  if (!bin) {
    matrix[name] = cases.map((c) => ({
      id: c.id,
      group: c.group,
      pass: false,
      got: `introuvable dans le PATH : ${cmd}`,
      ms: 0,
    }));
    continue;
  }
  matrix[name] = [];
  for (const c of cases) matrix[name].push(await run(bin, c));
}

const groups = ["claude", "posix", "bash", "windows"] as const;
const score = (rs: Result[], g?: string) => {
  const sel = g ? rs.filter((r) => r.group === g) : rs;
  return `${sel.filter((r) => r.pass).length}/${sel.length}`;
};
const lines = [
  `| shell | total | ${groups.join(" | ")} | ms médian |`,
  `|---|---:|${groups.map(() => "---:").join("|")}|---:|`,
  ...Object.entries(matrix).map(([n, rs]) => {
    const ms =
      rs.map((r) => r.ms).sort((a, b) => a - b)[Math.floor(rs.length / 2)] ?? 0;
    return `| ${n} | ${score(rs)} | ${groups.map((g) => score(rs, g)).join(" | ")} | ${ms.toFixed(1)} |`;
  }),
  "",
  "Échecs :",
  ...Object.entries(matrix).flatMap(([n, rs]) =>
    rs
      .filter((r) => !r.pass)
      .map((r) => `- ${n} · ${r.id} → ${JSON.stringify(r.got)}`),
  ),
];
console.log(lines.join("\n"));
if (jsonOut)
  await Bun.write(
    jsonOut,
    JSON.stringify(
      { date: new Date().toISOString(), shells, resolved, matrix },
      null,
      1,
    ),
  );
if (mdOut) await Bun.write(mdOut, `${lines.join("\n")}\n`);
