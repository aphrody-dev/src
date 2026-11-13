// Applique infra/agents/toolchain.toml (outillage agent : Claude Code, Codex, agy, Gemini CLI), idempotent, PC et Linux.
// Sections : [[claude.marketplace]] (repo, ou path relatif à src), [[claude.plugin]] (state present|absent|disabled ;
// refresh = recopie quand le HEAD de src change), [[claude.mcp]] (command ou url ; secrets injectés par env-kit),
// [[claude.skill]] (dossier SKILL.md copié depuis un commit épinglé), [[skill.private]], [codex], [agy], [gemini],
// [cleanup], [[secret]] (contrôle seul). `hosts` absent = tous (pc, prd, fr1, fr2). Aucun lien créé ; réglages
// modifiés par les CLI seules (jamais de réécriture de settings.json).
// Appelé par apply-user.ts, la tâche \Aphrody\AgentsSync (PC) et aphrody-agents-sync.timer (Linux) ; seul : `ay agents install|sync|check|list`
// ou bun packages/machine/src/toolchain.ts [sync|check|list]
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, renameSync, rmdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { hostname, tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

type Hosts = { hosts?: string[] };
type Marketplace = Hosts & { name: string; repo?: string; path?: string; commit?: string };
type Plugin = Hosts & { id: string; scope?: string; state?: "present" | "absent" | "disabled"; env?: string[]; refresh?: boolean };
type Mcp = Hosts & { name: string; scope?: string; command?: string[]; url?: string; env?: Record<string, string>; secrets?: string[]; state?: "absent" };
type Skill = Hosts & { name: string; repo: string; commit: string; path: string; license?: string };
type Secret = { name: string; user_env?: boolean };
type Manifest = {
  claude?: { marketplace?: Marketplace[]; plugin?: Plugin[]; mcp?: Mcp[]; skill?: Skill[] };
  skill?: { private?: (Hosts & { name: string })[] };
  codex?: { marketplace: string; plugins: string[] };
  agy?: { plugins: string[] };
  gemini?: { extensions: string[] };
  cleanup?: { link_dirs: string[]; drop_skills?: string[] };
  secret?: Secret[];
};
type Installed = { id: string; scope: string; enabled: boolean; installPath?: string };

const SRC = resolve(import.meta.dir, "..", "..", "..");
const MANIFEST = join(SRC, "infra", "agents", "toolchain.toml");
const HOME = process.env.USERPROFILE ?? process.env.HOME ?? "";
const SKILLS = join(HOME, ".claude", "skills");
const STATE = join(HOME, ".cache", "aphrody", "agents-sync.json");

/** pc sous Windows ; sur Linux HOST= de /etc/fleet/resilience.conf, sinon le nom d'hôte court. */
export function host(): string {
  if (process.platform === "win32") return "pc";
  try {
    const m = readFileSync("/etc/fleet/resilience.conf", "utf8").match(/^HOST=(\S+)/m);
    if (m) return m[1];
  } catch {}
  return hostname().split(".")[0];
}
const HOST = host();
const here = (e: Hosts) => !e.hosts || e.hosts.includes(HOST);
const fill = (s: string) => s.replaceAll("{src}", SRC).replaceAll("{home}", HOME).replaceAll("{bin}", join(HOME, ".local", "bin"));
const norm = (p: string) => p.replaceAll("\\", "/").replace(/\/+$/, "").toLowerCase();
const last = (r: { out: string; err: string }) => (r.err || r.out).trim().split("\n").at(-1);

const run = (argv: string[]) => {
  const r = Bun.spawnSync(argv, { stdout: "pipe", stderr: "pipe", stdin: "ignore", timeout: 120_000, cwd: HOME });
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
    mkdirSync(SKILLS, { recursive: true });
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

/** Ligne de commande MCP voulue : secrets injectés par `env-kit secret exec` (valeur jamais dans argv ni settings). */
function mcpArgv(s: Mcp): string[] | null {
  const cmd = (s.command ?? []).map(fill);
  if (!s.secrets?.length) return cmd;
  // CLI env-kit du checkout (le binaire ~/.local/bin/env-kit peut être d'une version sans `secret`).
  const kit = join(SRC, "packages", "env-kit", "src", "cli.ts");
  const bun = Bun.which("bun");
  return bun && existsSync(kit) && process.platform === "win32" ? [bun, kit, "secret", "exec", ...s.secrets, "--", ...cmd] : null;
}

/** Dossier d'un plugin de la marketplace racine : source locale dans src, sinon copie du cache Claude. */
function pluginDir(id: string, installed: Installed[]): { dir: string | null; local: boolean } {
  const [name] = id.split("@");
  try {
    const mk = JSON.parse(readFileSync(join(SRC, ".claude-plugin", "marketplace.json"), "utf8")) as { plugins: { name: string; source: unknown }[] };
    const e = mk.plugins.find((p) => p.name === name);
    if (typeof e?.source === "string") return { dir: join(SRC, e.source), local: true };
  } catch {}
  return { dir: installed.find((p) => p.id === id)?.installPath ?? null, local: false };
}

function claude(m: Manifest, out: string[], note: (ok: boolean, w: string) => void, check: boolean, moved: boolean): Installed[] {
  const ml = json<{ name: string; path?: string; installLocation?: string }[]>(["claude", "plugin", "marketplace", "list", "--json"]);
  let pl = json<Installed[]>(["claude", "plugin", "list", "--json"]);
  if (!ml || !pl) {
    out.push("ERR  claude plugin list --json en échec : marketplaces et plugins non appliqués");
    return [];
  }
  for (const mk of (m.claude?.marketplace ?? []).filter(here)) {
    const cur = ml.find((x) => x.name === mk.name);
    const want = mk.path !== undefined ? join(SRC, mk.path) : mk.repo!;
    // `marketplace add` sur un nom existant le repointe sans désinstaller ses plugins.
    const ok = !!cur && (mk.path === undefined || norm(cur.path ?? cur.installLocation ?? "") === norm(want));
    note(ok, `marketplace ${mk.name} (${mk.repo ?? want})`);
    if (!ok && !check) run(["claude", "plugin", "marketplace", "add", want]);
  }

  for (const p of (m.claude?.plugin ?? []).filter(here)) {
    const scope = p.scope ?? "user";
    const cur = pl.find((x) => x.id === p.id && x.scope === scope);
    if (p.state === "absent") {
      note(!cur, `plugin ${p.id} absent`);
      if (cur && !check) run(["claude", "plugin", "uninstall", p.id, "--scope", scope]);
      continue;
    }
    if (p.state === "disabled") {
      note(!cur?.enabled, `plugin ${p.id} désactivé`);
      if (cur?.enabled && !check) run(["claude", "plugin", "disable", p.id, "--scope", scope]);
      continue;
    }
    note(!!cur?.enabled, `plugin ${p.id}`);
    for (const e of p.env ?? []) out.push(`info ${p.id} : variable ${e} ${process.env[e] ? "présente" : "absente de l'env"}`);
    if (check) continue;
    let r = { code: 0, out: "", err: "" };
    if (!cur) r = run(["claude", "plugin", "install", p.id, "--scope", scope]);
    else if (!cur.enabled) r = run(["claude", "plugin", "enable", p.id, "--scope", scope]);
    else if (p.refresh && moved) r = run(["claude", "plugin", "update", p.id, "--scope", scope]);
    if (r.code !== 0) out.push(`ERR  plugin ${p.id} : ${last(r)}`);
  }
  pl = json<Installed[]>(["claude", "plugin", "list", "--json"]) ?? pl;

  // MCP : état lu dans ~/.claude.json (lecture seule) ; toute écriture passe par `claude mcp`.
  let servers: Record<string, { command?: string; args?: string[]; url?: string; env?: Record<string, string> }> = {};
  try {
    servers = JSON.parse(readFileSync(join(HOME, ".claude.json"), "utf8")).mcpServers ?? {};
  } catch {}
  for (const s of (m.claude?.mcp ?? []).filter(here)) {
    const scope = s.scope ?? "user";
    const cur = servers[s.name];
    if (s.state === "absent") {
      note(!cur, `claude mcp ${s.name} absent`);
      if (cur && !check) run(["claude", "mcp", "remove", s.name, "--scope", scope]);
      continue;
    }
    const argv = s.url ? [] : mcpArgv(s);
    if (!argv) {
      out.push(`info claude mcp ${s.name} : coffre env-kit absent sur ${HOST}, ignoré`);
      continue;
    }
    const leaked = Object.keys(cur?.env ?? {}).some((k) => s.secrets?.includes(k));
    const same = s.url
      ? cur?.url === s.url
      : !!cur && norm(cur.command ?? "") === norm(argv[0]) && JSON.stringify((cur.args ?? []).map(norm)) === JSON.stringify(argv.slice(1).map(norm));
    note(same && !leaked, `claude mcp ${s.name}${leaked ? " (secret en clair dans ~/.claude.json : remplacé par env-kit)" : ""}`);
    if ((same && !leaked) || check) continue;
    if (cur) run(["claude", "mcp", "remove", s.name, "--scope", scope]);
    const env = Object.entries(s.env ?? {}).flatMap(([k, v]) => ["-e", `${k}=${v}`]);
    const r = s.url
      ? run(["claude", "mcp", "add", "--scope", scope, "--transport", "http", s.name, s.url])
      : // name before -e: -e is variadic in `claude mcp add` and would swallow the name (fr2, 2026-11-13)
        run(["claude", "mcp", "add", "--scope", scope, s.name, ...env, "--", ...argv]);
    if (r.code !== 0) out.push(`ERR  claude mcp ${s.name} : ${last(r)}`);
  }
  return pl;
}

export async function toolchain({ check }: { check: boolean }): Promise<string[]> {
  const m = Bun.TOML.parse(await Bun.file(MANIFEST).text()) as Manifest;
  const out: string[] = [`info hôte ${HOST}, src ${SRC}`];
  const note = (ok: boolean, what: string) => out.push(`${ok ? "ok  " : check ? "DIFF" : "set "} ${what}`);
  const head = run(["git", "-c", `safe.directory=${SRC}`, "-C", SRC, "rev-parse", "HEAD"]).out.trim();
  let state: Record<string, string> = {};
  try {
    state = JSON.parse(readFileSync(STATE, "utf8"));
  } catch {}
  const moved = head !== "" && state.head !== head;

  // --- Claude Code
  let installed: Installed[] = [];
  if (Bun.which("claude")) installed = claude(m, out, note, check, moved);
  else out.push("info claude absent : section Claude ignorée");

  for (const s of (m.claude?.skill ?? []).filter(here)) {
    const f = Bun.file(join(SKILLS, s.name, ".source"));
    const ok = (await f.exists()) && (await f.text()) === stamp(s);
    note(ok, `skill ${s.name} (${s.repo}@${s.commit.slice(0, 10)})`);
    if (ok || check) continue;
    const err = installSkill(s);
    if (err) out.push(`ERR  skill ${s.name} : ${err}`);
  }
  for (const s of (m.skill?.private ?? []).filter(here))
    out.push(`${existsSync(join(SKILLS, s.name, "SKILL.md")) ? "ok  " : "WARN"} skill privée ${s.name} (${HOST}, hors dépôt)`);

  // --- agy : installe depuis le dossier du plugin (source locale de src ou cache Claude) ; recopie si HEAD a bougé.
  if (m.agy && Bun.which("agy")) {
    const have = new Set((json<{ name: string }[]>(["agy", "plugin", "list", "--json"]) ?? []).map((x) => x.name));
    for (const id of m.agy.plugins) {
      const name = id.split("@")[0];
      const { dir, local } = pluginDir(id, installed);
      note(have.has(name), `agy plugin ${name}`);
      if (check || (have.has(name) && !(local && moved))) continue;
      if (!dir) {
        out.push(`ERR  agy plugin ${name} : source introuvable (plugin Claude non installé ?)`);
        continue;
      }
      const r = run(["agy", "plugin", "install", dir]);
      if (r.code !== 0) out.push(`ERR  agy plugin ${name} : ${last(r)}`);
    }
  } else if (m.agy) out.push("info agy absent");

  // --- Codex : marketplace racine (Codex lit .claude-plugin/marketplace.json) et plugins à source locale.
  if (m.codex && Bun.which("codex")) {
    const name = m.codex.marketplace;
    const list = run(["codex", "plugin", "marketplace", "list"]).out;
    const ok = list.split("\n").some((l) => l.startsWith(`${name} `) && norm(l.slice(name.length).trim()) === norm(SRC));
    note(ok, `codex marketplace ${name}`);
    if (!ok && !check) run(["codex", "plugin", "marketplace", "add", SRC]);
    const plugins = run(["codex", "plugin", "list"]).out;
    for (const id of m.codex.plugins) {
      const has = plugins.split("\n").some((l) => l.startsWith(`${id} `) && /\binstalled, enabled\b/.test(l));
      note(has, `codex plugin ${id}`);
      if (check || (has && !moved)) continue;
      const r = run(["codex", "plugin", "add", id]);
      if (r.code !== 0) out.push(`ERR  codex plugin ${id} : ${last(r)}`);
    }
  } else if (m.codex) out.push("info codex absent");

  // --- Gemini CLI : extension liée (la CLI enregistre le chemin, aucun lien de fichiers).
  if (m.gemini && Bun.which("gemini")) {
    const list = run(["gemini", "extensions", "list"]).out;
    for (const e of m.gemini.extensions) {
      const ok = list.includes("aphrody-skills");
      note(ok, `gemini extension ${e}`);
      if (!ok && !check) {
        const r = run(["gemini", "extensions", "link", join(SRC, e), "--consent"]);
        if (r.code !== 0) out.push(`ERR  gemini extension ${e} : ${last(r)}`);
      }
    }
  } else if (m.gemini) out.push("info gemini absent");

  // --- Liens interdits (symlink, jonction) vers des skills que le plugin aphrody-skills fournit déjà.
  const ours = new Set(readdirSync(join(SRC, ".agents", "skills")));
  for (const d of (m.cleanup?.link_dirs ?? []).map(fill)) {
    if (!existsSync(d)) continue;
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (!ours.has(n) || !lstatSync(p).isSymbolicLink()) continue;
      note(false, `lien ${p} retiré (fourni par aphrody-skills)`);
      if (check) continue;
      try {
        unlinkSync(p);
      } catch {
        rmdirSync(p);
      }
    }
  }

  // Copies de skills devenues doublons d'un plugin : retirées seulement si posées par cet applier (témoin .source).
  for (const n of m.cleanup?.drop_skills ?? []) {
    const d = join(SKILLS, n);
    if (!existsSync(join(d, ".source"))) continue;
    note(false, `skill ${n} retirée (doublon d'un plugin)`);
    if (!check) rmSync(d, { recursive: true, force: true });
  }

  for (const s of m.secret ?? []) out.push(`info secret ${s.name} : ${process.env[s.name] ? "présent dans l'env" : "absent de l'env"}`);
  if (!check && head && !out.some((l) => l.startsWith("ERR"))) {
    mkdirSync(join(HOME, ".cache", "aphrody"), { recursive: true });
    writeFileSync(STATE, `${JSON.stringify({ ...state, head })}\n`);
  }
  return out;
}

/** Entrées du manifeste qui s'appliquent à cet hôte (`ay agents list`). */
export async function list(): Promise<string[]> {
  const m = Bun.TOML.parse(await Bun.file(MANIFEST).text()) as Manifest;
  const rows = [`hôte ${HOST}, src ${SRC}`];
  for (const x of (m.claude?.marketplace ?? []).filter(here)) rows.push(`claude marketplace ${x.name} ${x.repo ?? join(SRC, x.path ?? "")}`);
  for (const x of (m.claude?.plugin ?? []).filter(here)) rows.push(`claude plugin ${x.id} ${x.state ?? "present"}`);
  for (const x of (m.claude?.mcp ?? []).filter(here)) rows.push(`claude mcp ${x.name} ${x.url ?? (x.command ?? []).join(" ")}${x.secrets ? ` (coffre : ${x.secrets.join(",")})` : ""}`);
  for (const x of (m.claude?.skill ?? []).filter(here)) rows.push(`claude skill ${x.name} ${x.repo}@${x.commit.slice(0, 12)}`);
  for (const x of m.codex?.plugins ?? []) rows.push(`codex plugin ${x}`);
  for (const x of m.agy?.plugins ?? []) rows.push(`agy plugin ${x}`);
  for (const x of m.gemini?.extensions ?? []) rows.push(`gemini extension ${join(SRC, x)}`);
  rows.push(`skills src ${readdirSync(join(SRC, ".agents", "skills")).length} (.agents/skills)`);
  return rows;
}

// Verbes : install|sync (appliquer, défaut), check (ou --check : écarts seuls, code 1 si écart), list.
if (import.meta.main) {
  const verb = process.argv[2] ?? "sync";
  if (verb === "list") {
    console.log((await list()).join("\n"));
    process.exit(0);
  }
  const check = verb === "check" || process.argv.includes("--check");
  const r = await toolchain({ check });
  console.log(r.join("\n"));
  process.exit(r.some((l) => l.startsWith("ERR")) || (check && r.some((l) => l.startsWith("DIFF"))) ? 1 : 0);
}
