// Applique infra/agents/toolchain.toml (outillage agent du PC, Claude Code scope user), idempotent.
// Sections : [[claude.marketplace]], [[claude.plugin]] (state = "absent" pour désinstaller un doublon),
// [[claude.mcp]], [[claude.skill]] (dossier SKILL.md copié depuis un commit épinglé), [[secret]] (contrôle seul).
// Appelé par apply-user.ts ; seul : bun packages/machine/src/toolchain.ts [--check]
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

type Marketplace = { name: string; repo: string; commit?: string };
type Plugin = { id: string; scope?: string; state?: "present" | "absent"; env?: string[] };
type Mcp = { name: string; scope?: string; command: string[]; env?: Record<string, string> };
type Skill = { name: string; repo: string; commit: string; path: string; license?: string };
type Secret = { name: string; user_env?: boolean };
type Manifest = {
  claude?: { marketplace?: Marketplace[]; plugin?: Plugin[]; mcp?: Mcp[]; skill?: Skill[] };
  secret?: Secret[];
};

const MANIFEST = join(import.meta.dir, "..", "..", "..", "infra", "agents", "toolchain.toml");
const SKILLS = join(process.env.USERPROFILE ?? process.env.HOME ?? "", ".claude", "skills");

const run = (argv: string[]) => {
  const r = Bun.spawnSync(argv, { stdout: "pipe", stderr: "pipe", stdin: "ignore", timeout: 120_000 });
  return { code: r.exitCode, out: r.stdout.toString(), err: r.stderr.toString() };
};
const json = <T>(argv: string[]): T | null => {
  const r = run(argv);
  try {
    return r.code === 0 ? (JSON.parse(r.out) as T) : null;
  } catch {
    return null;
  }
};

/** Fichier témoin d'une skill installée : repo@commit:path. */
const stamp = (s: Skill) => `${s.repo}@${s.commit}:${s.path}\n`;

export function installSkill(s: Skill): string | null {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(s.name)) return `nom de skill invalide : ${s.name}`;
  const tmp = mkdtempSync(join(tmpdir(), "skill-"));
  try {
    const tgz = join(tmp, "src.tgz");
    const dl = Bun.spawnSync(["gh", "api", `repos/${s.repo}/tarball/${s.commit}`], { stdout: Bun.file(tgz), stderr: "pipe", stdin: "ignore", timeout: 300_000 });
    if (dl.exitCode !== 0) return `téléchargement ${s.repo}@${s.commit} : ${dl.stderr.toString().trim()}`;
    const xdir = join(tmp, "x");
    mkdirSync(xdir);
    const x = run(["tar", "-xzf", tgz, "-C", xdir]);
    if (x.code !== 0) return `extraction : ${x.err.trim()}`;
    const root = readdirSync(xdir)[0];
    if (!root) return "archive vide";
    const base = resolve(xdir, root);
    const from = resolve(base, s.path);
    if (!from.startsWith(base + sep)) return `chemin hors archive : ${s.path}`;
    if (!existsSync(join(from, "SKILL.md"))) return `SKILL.md absent de ${s.repo}/${s.path}@${s.commit}`;
    // Copie à côté puis bascule : jamais de skill à moitié copiée ; le témoin voyage avec le dossier.
    const to = join(SKILLS, s.name);
    const next = `${to}.new`;
    rmSync(next, { recursive: true, force: true });
    cpSync(from, next, { recursive: true });
    writeFileSync(join(next, ".source"), stamp(s));
    rmSync(to, { recursive: true, force: true });
    renameSync(next, to);
    return null;
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export async function toolchain({ check }: { check: boolean }): Promise<string[]> {
  const m = Bun.TOML.parse(await Bun.file(MANIFEST).text()) as Manifest;
  const out: string[] = [];
  const note = (ok: boolean, what: string) => out.push(`${ok ? "ok  " : check ? "DIFF" : "set "} ${what}`);

  const ml = json<{ name: string }[]>(["claude", "plugin", "marketplace", "list", "--json"]);
  const pl = json<{ id: string; scope: string; enabled: boolean }[]>(["claude", "plugin", "list", "--json"]);
  if (!ml || !pl) return [...out, "ERR  claude plugin list --json en échec : marketplaces et plugins non appliqués"];
  const markets = new Set(ml.map((x) => x.name));
  for (const mk of m.claude?.marketplace ?? []) {
    const ok = markets.has(mk.name);
    note(ok, `marketplace ${mk.name} (${mk.repo})`);
    if (!ok && !check) run(["claude", "plugin", "marketplace", "add", mk.repo]);
  }

  const installed = pl;
  for (const p of m.claude?.plugin ?? []) {
    const scope = p.scope ?? "user";
    const has = installed.some((x) => x.id === p.id && x.scope === scope);
    if (p.state === "absent") {
      note(!has, `plugin ${p.id} absent`);
      if (has && !check) run(["claude", "plugin", "uninstall", p.id, "--scope", scope]);
      continue;
    }
    note(has, `plugin ${p.id}`);
    if (!has && !check) run(["claude", "plugin", "install", p.id, "--scope", scope]);
    for (const e of p.env ?? []) out.push(`info ${p.id} : variable ${e} ${process.env[e] ? "présente" : "absente de l'env"}`);
  }

  for (const s of m.claude?.mcp ?? []) {
    const has = run(["claude", "mcp", "get", s.name]).code === 0;
    note(has, `claude mcp ${s.name}`);
    if (has || check) continue;
    const env = Object.entries(s.env ?? {}).flatMap(([k, v]) => ["-e", `${k}=${v}`]);
    run(["claude", "mcp", "add", "--scope", s.scope ?? "user", ...env, s.name, "--", ...s.command]);
  }

  for (const s of m.claude?.skill ?? []) {
    const f = Bun.file(join(SKILLS, s.name, ".source"));
    const ok = (await f.exists()) && (await f.text()) === stamp(s);
    note(ok, `skill ${s.name} (${s.repo}@${s.commit.slice(0, 10)})`);
    if (ok || check) continue;
    const err = installSkill(s);
    if (err) out.push(`ERR  skill ${s.name} : ${err}`);
  }

  for (const s of m.secret ?? []) out.push(`info secret ${s.name} : ${process.env[s.name] ? "présent dans l'env" : "absent de l'env"}`);
  return out;
}

if (import.meta.main) {
  const check = process.argv.includes("--check");
  const r = await toolchain({ check });
  console.log(r.join("\n"));
  process.exit(r.some((l) => l.startsWith("ERR")) || (check && r.some((l) => l.startsWith("DIFF"))) ? 1 : 0);
}
