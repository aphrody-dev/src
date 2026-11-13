// npm sans humain pour tout le monorepo (docs/infra/NPM.md). Aucune valeur secrète n'est affichée ni passée en argv :
// le jeton vit dans le coffre env-kit (NPM_TOKEN) et n'en sort que par l'env ou le stdin d'un processus enfant.
//   bun scripts/npm.ts status              whoami : coffre, PC, prd (root, agent), fr2, fr1 ; secret d'org GitHub
//   bun scripts/npm.ts sync                coffre -> env utilisateur Windows, secret d'org aphrody-labs, ~/.npmrc des hôtes
//   bun scripts/npm.ts inventory [--json]  paquets publiables (src + sous-modules apps/*), version publiée
//   bun scripts/npm.ts align [--write]     repository/publishConfig exigés par le trusted publishing ; scopes non possédés -> private
//   bun scripts/npm.ts login               npm login --auth-type=web en PTY (session séparée), le propriétaire clique
//   bun scripts/npm.ts trust [--dry-run]   npm trust github pour chaque paquet publié (2FA du compte requise)
//   bun scripts/npm.ts harden [--dry-run]  npm access set mfa=publish (2FA + jetons refusés) sur les paquets déjà en OIDC
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..").replaceAll("\\", "/");
const ENV_KIT = join(ROOT, "packages/env-kit/src/cli.ts");
const REGISTRY = "https://registry.npmjs.org";
const OWNED = ["@aphrody", "@rosegriffon"]; // orgs npm dont yohan971 est owner (GET /-/org/<scope>/user)
const ORG = "aphrody-labs";
const WORKFLOW = "npm-publish.yml"; // nom du workflow appelant, vérifié par npm à chaque publish OIDC
const SUBMODULES = ["apps/rosegriffon", "apps/shenron", "apps/auto", "apps/r2b"];
/** Doublons de nom : la copie canonique est celle de shenron (domaine média). */
const CANONICAL: Record<string, string> = {
  "@aphrody/remotion": "apps/shenron",
  "@aphrody/hyperframes": "apps/shenron",
  "@aphrody/filmcraft": "apps/shenron",
};
const SESSION = join(process.env.LOCALAPPDATA ?? join(process.env.HOME ?? "~", ".local/share"), "aphrody", "npm-session.npmrc");
/** Hôtes : alias ssh -> argv. prd agent passe par le mesh WireGuard (rebond fr2). */
const HOSTS: Record<string, string[]> = {
  "prd:root": ["prd"],
  "prd:agent": ["-o", "HostKeyAlias=72.60.186.43", "-J", "fr2", "agent@10.200.77.5"],
  "fr2": ["cdn"],
  "fr1": ["vps"],
};
const SECRET = /\bnpm_[A-Za-z0-9]{20,}/g;
const mask = (s: string) => s.replace(SECRET, "[secret]");

const run = (argv: string[], opts: { stdin?: string; cwd?: string; timeout?: number } = {}) => {
  const r = Bun.spawnSync(argv, {
    cwd: opts.cwd,
    stdin: opts.stdin === undefined ? "ignore" : Buffer.from(opts.stdin),
    timeout: opts.timeout ?? 120_000,
  });
  return { code: r.exitCode, out: mask(r.stdout.toString()).trim(), err: mask(r.stderr.toString()).trim() };
};
/** Commande exécutée avec NPM_TOKEN du coffre dans son env (env-kit secret exec). */
const withToken = (argv: string[], timeout?: number) => run(["bun", ENV_KIT, "secret", "exec", "NPM_TOKEN", "--", ...argv], { timeout });
/** Valeur du coffre sur le stdin de la commande (env-kit secret pipe). */
const pipeToken = (argv: string[], timeout?: number) => run(["bun", ENV_KIT, "secret", "pipe", "NPM_TOKEN", "--", ...argv], { timeout });
const ssh = (h: string, cmd: string) => ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=20", ...HOSTS[h]!, cmd];
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

// ------------------------------------------------------------------------------------------------- inventaire
type Pkg = { path: string; repoRoot: string; slug: string; name: string; version: string; priv: boolean; json: any; indent: string };

const remoteSlug = (dir: string) => {
  const u = run(["git", "-C", dir, "remote", "get-url", "origin"]).out || run(["git", "-C", dir, "remote", "get-url", "all"]).out;
  return u.replace(/^git\+/, "").replace(/^https:\/\/github\.com\//, "").replace(/^git@github\.com:/, "").replace(/\.git$/, "");
};

function scan(): Pkg[] {
  const roots = [ROOT, ...SUBMODULES.map((s) => join(ROOT, s).replaceAll("\\", "/")).filter((d) => existsSync(join(d, ".git")))];
  const pkgs: Pkg[] = [];
  for (const repoRoot of roots) {
    const slug = repoRoot === ROOT ? `${ORG}/src` : remoteSlug(repoRoot);
    const files = run(["git", "-C", repoRoot, "ls-files", "--", "*package.json"]).out.split("\n").filter((f) => /(^|\/)package\.json$/.test(f));
    for (const f of files) {
      if (/(^|\/)(node_modules|third_party|var|fixtures?|__fixtures__)\//.test(f)) continue;
      const abs = join(repoRoot, f);
      if (!existsSync(abs)) continue;
      const text = readFileSync(abs, "utf8");
      let json: any;
      try { json = JSON.parse(text); } catch { continue; }
      if (!json.name) continue;
      pkgs.push({
        path: relative(ROOT, dirname(abs)).replaceAll("\\", "/") || ".",
        repoRoot, slug, name: json.name, version: json.version ?? "0.0.0", priv: !!json.private, json,
        indent: /^\{\r?\n(\s+)/.exec(text)?.[1] ?? "  ",
      });
    }
  }
  return pkgs;
}

const scopeOf = (n: string) => (n.startsWith("@") ? n.split("/")[0]! : "");
const publishable = (p: Pkg) => !p.priv && OWNED.includes(scopeOf(p.name)) && (!CANONICAL[p.name] || p.path.startsWith(CANONICAL[p.name]!));

async function latest(name: string): Promise<string | null> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(`${REGISTRY}/${name.replace("/", "%2f")}/latest`);
      return r.status === 200 ? ((await r.json()) as { version: string }).version : null;
    } catch { await Bun.sleep(500); }
  }
  return null;
}

async function inventory(json: boolean) {
  const rows = [];
  for (const p of scan().filter(publishable)) rows.push({ name: p.name, path: p.path, repo: p.slug, version: p.version, npm: await latest(p.name) });
  if (json) return console.log(JSON.stringify(rows, null, 2));
  for (const r of rows) console.log(`${r.name}\t${r.version}\tnpm=${r.npm ?? "-"}\t${r.repo}\t${r.path}`);
  console.log(`# ${rows.length} publiables, ${rows.filter((r) => r.npm).length} déjà sur npm`);
}

// ------------------------------------------------------------------------------------------------- alignement
function align(write: boolean) {
  let n = 0;
  for (const p of scan()) {
    const want: any = { ...p.json };
    const scope = scopeOf(p.name);
    const dup = CANONICAL[p.name] && !p.path.startsWith(CANONICAL[p.name]!);
    if (!p.priv && ((scope && !OWNED.includes(scope)) || dup)) {
      want.private = true; // scope npm non possédé, ou doublon d'un paquet canonique : jamais publiable
    } else if (publishable(p)) {
      const directory = relative(p.repoRoot, join(ROOT, p.path)).replaceAll("\\", "/");
      want.repository = { type: "git", url: `git+https://github.com/${p.slug}.git`, ...(directory ? { directory } : {}) };
      want.publishConfig = { ...(p.json.publishConfig ?? {}), access: "public", registry: `${REGISTRY}/` };
    } else continue;
    const before = JSON.stringify(p.json);
    if (JSON.stringify(want) === before) continue;
    n++;
    console.log(`${write ? "écrit" : "à aligner"}\t${p.name}\t${p.path}`);
    if (write) writeFileSync(join(ROOT, p.path, "package.json"), `${JSON.stringify(want, null, p.indent)}\n`);
  }
  console.log(`# ${n} package.json ${write ? "alignés" : "à aligner (--write)"}`);
}

// ------------------------------------------------------------------------------------------------- jeton et hôtes
async function status() {
  const out: Record<string, string> = {};
  const who = withToken(["bun", "-e", `const r=await fetch("${REGISTRY}/-/whoami",{headers:{authorization:"Bearer "+process.env.NPM_TOKEN}});console.log(r.status===200?(await r.json()).username:"invalide "+r.status)`]);
  out.vault = who.out || who.err;
  // ~/.npmrc du PC lit ${NPM_TOKEN} : valeur courante de l'env utilisateur (un processus parent peut en garder une ancienne).
  const env = { ...process.env } as Record<string, string>;
  if (process.platform === "win32")
    env.NPM_TOKEN = Bun.spawnSync(["pwsh", "-NoProfile", "-c", "[Environment]::GetEnvironmentVariable('NPM_TOKEN','User')"]).stdout.toString().trim();
  const pc = Bun.spawnSync([npm, "whoami"], { cwd: process.env.USERPROFILE ?? process.env.HOME, env });
  out.pc = pc.exitCode === 0 ? pc.stdout.toString().trim() : "non connecté";
  for (const h of Object.keys(HOSTS)) {
    const r = run(ssh(h, "cd /tmp && PATH=$HOME/.bun/bin:$PATH nice -n 19 bun pm whoami 2>&1 | tail -1"), { timeout: 90_000 });
    out[h] = r.out || r.err.slice(0, 80);
  }
  out.github = run(["gh", "secret", "list", "--org", ORG]).out.split("\n").find((l) => l.startsWith("NPM_TOKEN\t")) ? "secret d'org NPM_TOKEN présent" : "absent";
  out.session = existsSync(SESSION) ? "session npm interactive présente" : "pas de session (bun scripts/npm.ts login)";
  console.log(JSON.stringify(out, null, 2));
}

const NPMRC =
  'umask 077; t=$(cat); touch ~/.npmrc; grep -v "^//registry.npmjs.org/:_authToken=" ~/.npmrc > ~/.npmrc.n; ' +
  'printf "//registry.npmjs.org/:_authToken=%s\\n" "$t" >> ~/.npmrc.n; mv ~/.npmrc.n ~/.npmrc; chmod 600 ~/.npmrc; ' +
  'curl -s -m 20 -H "Authorization: Bearer $t" https://registry.npmjs.org/-/whoami';

function sync() {
  const out: Record<string, unknown> = {};
  if (process.platform === "win32")
    out.userenv = pipeToken(["pwsh", "-NoProfile", "-c", "[Environment]::SetEnvironmentVariable('NPM_TOKEN', [Console]::In.ReadToEnd().Trim(), 'User')"]).code === 0;
  out.github = pipeToken(["gh", "secret", "set", "NPM_TOKEN", "--org", ORG, "--visibility", "all"]).code === 0;
  for (const h of Object.keys(HOSTS)) out[h] = pipeToken(ssh(h, `bash -c '${NPMRC}'`), 90_000).out;
  console.log(JSON.stringify(out, null, 2));
}

// ------------------------------------------------------------------------------------------------- session interactive (2FA)
/** npm dans un PTY bun : Entrée envoyée aux invites, URL d'authentification ouverte chez le propriétaire, lignes
 *  d'état relayées (jamais de jeton). La session vit dans un userconfig séparé : ~/.npmrc garde le jeton du coffre. */
async function pty(argv: string[], waitMin = 15): Promise<{ code: number; text: string }> {
  let text = "";
  const opened = new Set<string>();
  const term = new Bun.Terminal({
    cols: 300,
    rows: 50,
    data(_t, d) {
      const s = new TextDecoder().decode(d).replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "");
      text += s;
      if (/press enter|appuyez sur entr/i.test(s)) term.write("\r");
      for (const url of s.match(/https:\/\/www\.npmjs\.com\/(?:login|auth)\/[^\s"']+/g) ?? []) {
        if (opened.has(url)) continue;
        opened.add(url);
        if (process.platform === "win32") Bun.spawn(["explorer.exe", url]);
      }
      for (const l of s.split(/\r?\n/)) {
        const x = mask(l).trim();
        if (x && /http|logged|error|success|authent|otp|2fa|trust|created|exists|already/i.test(x)) console.error(x.slice(0, 220));
      }
    },
  });
  const p = Bun.spawn(argv, { terminal: term });
  const timer = setTimeout(() => p.kill(), waitMin * 60_000);
  const code = await p.exited;
  clearTimeout(timer);
  term.close();
  return { code, text: mask(text) };
}

async function login() {
  mkdirSync(dirname(SESSION), { recursive: true });
  const r = await pty([npm, "login", "--auth-type=web", `--userconfig=${SESSION}`], 30);
  console.log(JSON.stringify({ login: r.code === 0, whoami: run([npm, "whoami", `--userconfig=${SESSION}`]).out }));
}

async function trust(dry: boolean) {
  const rows = scan().filter(publishable);
  const res: Record<string, string> = {};
  for (const p of rows) {
    if (!(await latest(p.name))) { res[p.name] = "absent de npm : premier publish par le workflow (jeton), puis trust"; continue; }
    const list = run([npm, "trust", "list", p.name, "--json", `--userconfig=${SESSION}`], { timeout: 60_000 });
    if (/github/i.test(list.out) && list.out.includes(p.slug) && list.out.includes(WORKFLOW)) { res[p.name] = "déjà configuré"; continue; }
    const argv = [npm, "trust", "github", p.name, "--file", WORKFLOW, "--repo", p.slug, "--allow-publish", "--allow-stage-publish", "-y", `--userconfig=${SESSION}`];
    if (dry) { res[p.name] = `dry-run : ${argv.slice(1, 8).join(" ")}`; continue; }
    const r = await pty(argv, 10);
    res[p.name] = r.code === 0 ? "configuré" : `échec ${r.code} : ${r.text.split("\n").filter((l) => /error|ERR/i.test(l)).slice(-1)[0]?.trim().slice(0, 120) ?? ""}`;
  }
  console.log(JSON.stringify(res, null, 2));
}

/** mfa=publish = « Require two-factor authentication and disallow tokens » : seul le trusted publishing reste possible.
 *  Appliqué uniquement aux paquets dont la dernière version a été publiée en OIDC (_npmUser.trustedPublisher). */
async function harden(dry: boolean) {
  const res: Record<string, string> = {};
  for (const p of scan().filter(publishable)) {
    const r = await fetch(`${REGISTRY}/${p.name.replace("/", "%2f")}/latest`);
    if (r.status !== 200) continue;
    const j = (await r.json()) as { _npmUser?: { trustedPublisher?: unknown } };
    if (!j._npmUser?.trustedPublisher) { res[p.name] = "dernière version publiée par jeton : pas encore"; continue; }
    if (dry) { res[p.name] = "dry-run : npm access set mfa=publish"; continue; }
    const x = await pty([npm, "access", "set", "mfa=publish", p.name, `--userconfig=${SESSION}`], 10);
    res[p.name] = x.code === 0 ? "2FA + jetons refusés" : `échec ${x.code}`;
  }
  console.log(JSON.stringify(res, null, 2));
}

const [cmd = "status", ...args] = Bun.argv.slice(2);
const flag = (f: string) => args.includes(f);
switch (cmd) {
  case "status": await status(); break;
  case "sync": sync(); break;
  case "inventory": await inventory(flag("--json")); break;
  case "align": align(flag("--write")); break;
  case "login": await login(); break;
  case "trust": await trust(flag("--dry-run")); break;
  case "harden": await harden(flag("--dry-run")); break;
  default:
    console.error("usage : bun scripts/npm.ts status|sync|inventory [--json]|align [--write]|login|trust [--dry-run]|harden [--dry-run]");
    process.exit(2);
}
