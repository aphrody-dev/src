// Jeton GitHub des agents, toujours frais (docs/infra/GITHUB-APP.md) : jeton d'installation de l'App aphrody-labs,
// borné aux permissions des rôles, mis en cache dans <AGENTS_HOME>/state/gh-token.json (0600) et re-minté quand il
// lui reste moins de 10 min. La clé de l'App est lue dans le credstore (systemd-creds --user) par ce processus seul,
// jamais exportée. Appelé à chaque usage, donc une tâche de plusieurs heures ne perd jamais l'accès :
//   bun infra/agents/gh-token.ts            jeton sur stdout (tube uniquement) : wrapper `gh` des agents
//   bun infra/agents/gh-token.ts git get    protocole credential helper de git (username/password)
//   bun infra/agents/gh-token.ts install <dir>   écrit <dir>/gh (wrapper qui pose GH_TOKEN puis exécute le vrai gh)
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { delimiter, join, resolve } from "node:path";
import {
  appJwt,
  installationToken,
} from "../../packages/env-kit/src/github-app.ts";

export const AGENT_PERMISSIONS = {
  contents: "write",
  pull_requests: "write",
  issues: "write",
  actions: "write",
  checks: "read",
  statuses: "read",
  security_events: "write",
  secret_scanning_alerts: "write",
  vulnerability_alerts: "read",
};
const MARGIN_MS = 600_000;

const SRC = resolve(process.env.SRC_ROOT ?? join(import.meta.dir, "..", ".."));
const HOME = resolve(process.env.AGENTS_HOME ?? join(SRC, "var", "agents"));
const CACHE = join(HOME, "state", "gh-token.json");

function cred(name: string): string | undefined {
  if (process.env[name]) return process.env[name];
  const f = join(
    process.env.HOME ?? "",
    ".config",
    "credstore.encrypted",
    name,
  );
  if (!existsSync(f)) return undefined;
  const r = spawnSync(
    "systemd-creds",
    ["--user", `--name=${name}`, "decrypt", f, "-"],
    { encoding: "utf8" },
  );
  return r.status === 0 ? r.stdout.trim() : undefined;
}

/** Jeton valide au moins 10 min ; undefined si l'App n'est pas configurée sur cet hôte. */
export async function token(now = Date.now()): Promise<string | undefined> {
  try {
    const c = JSON.parse(readFileSync(CACHE, "utf8")) as {
      token: string;
      expires_at: string;
    };
    if (Date.parse(c.expires_at) - now > MARGIN_MS) return c.token;
  } catch {}
  const pem = cred("APHRODY_APP_KEY");
  const cid = cred("APHRODY_APP_CLIENT_ID");
  if (!pem || !cid) return undefined;
  const t = await installationToken({
    owner: "aphrody-labs",
    permissions: AGENT_PERMISSIONS,
    jwt: appJwt(pem, cid),
  });
  mkdirSync(join(HOME, "state"), { recursive: true });
  const tmp = `${CACHE}.${process.pid}`;
  writeFileSync(
    tmp,
    JSON.stringify({ token: t.token, expires_at: t.expires_at }),
    { mode: 0o600 },
  );
  renameSync(tmp, CACHE);
  return t.token;
}

/** Écrit le wrapper `gh` dans dir ; le vrai gh est cherché dans PATH hors de dir. */
export function installWrapper(dir: string): string | undefined {
  const real = (process.env.PATH ?? "")
    .split(delimiter)
    .filter((d) => d && resolve(d) !== resolve(dir))
    .map((d) => join(d, "gh"))
    .find((p) => existsSync(p));
  if (!real) return undefined;
  mkdirSync(dir, { recursive: true });
  const f = join(dir, "gh");
  const body = `#!/bin/sh\n# Généré par infra/agents/gh-token.ts : GH_TOKEN frais à chaque appel.\nt=$('${process.execPath}' '${join(import.meta.dir, "gh-token.ts")}') && [ -n "$t" ] && GH_TOKEN="$t" && GITHUB_TOKEN="$t" && export GH_TOKEN GITHUB_TOKEN\nexec '${real}' "$@"\n`;
  if (!existsSync(f) || readFileSync(f, "utf8") !== body) {
    writeFileSync(f, body);
    chmodSync(f, 0o755);
  }
  return f;
}

if (import.meta.main) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === "install") {
    console.log(installWrapper(resolve(arg ?? join(HOME, "bin"))) ?? "");
    process.exit(0);
  }
  if (cmd === "git") {
    // Seule l'opération get répond ; store/erase sont ignorées (le jeton vit dans le cache).
    if (arg !== "get") process.exit(0);
    const input = await Bun.stdin.text();
    if (!/^host=github\.com$/m.test(input)) process.exit(0);
    const t = await token();
    if (t) process.stdout.write(`username=x-access-token\npassword=${t}\n`);
    process.exit(0);
  }
  if (process.stdout.isTTY) {
    console.error(
      "gh-token : jeton non affiché sur un terminal (tube ou wrapper uniquement)",
    );
    process.exit(2);
  }
  const t = await token();
  if (t) process.stdout.write(t);
  process.exit(t ? 0 : 1);
}
