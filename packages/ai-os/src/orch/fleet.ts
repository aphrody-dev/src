// Hôtes de l'orchestrateur et exécution bornée sur chacun.
// Sources : infra/agents/fleet.toml (hôtes, rôles, checkout `src` du runner, couche de labs-1b) et infra/deploy.toml
// (`ssh_alias`, `role`). Un nœud de rôle `build` (fr1 : Chromium et LLVM) ne reçoit jamais d'agent.
// Tout tourne en priorité basse : `nice -n 19` + `timeout` à distance, BELOW_NORMAL en local (hérité par les enfants).
import { existsSync, readFileSync } from "node:fs";
import { constants, hostname, setPriority } from "node:os";
import { dirname, join, resolve } from "node:path";

export type Host = {
  id: string; // nom de fleet.toml : pc, prd, fr2
  local: boolean;
  ssh?: string; // alias ssh (deploy.toml ssh_alias)
  // Cibles ssh essayées dans l'ordre (fleet.toml `ssh` : <hôte>-mesh = sshd via le mesh mTLS TCP 7444,
  // infra/cluster, indépendant de WireGuard ; puis ssh direct). Repli seulement si ssh échoue à se connecter (255).
  sshTargets?: string[];
  src: string; // checkout du runner sur l'hôte
  roles: string[];
  maxAgents: number; // tâches simultanées confiées par l'orchestrateur
};

export type ExecResult = {
  code: number;
  out: string;
  err: string;
  ms: number;
};

/** Racine de src : $SRC_ROOT, sinon l'ancêtre qui contient src.lock.json. */
export function srcRoot(): string {
  if (Bun.env.SRC_ROOT) return resolve(Bun.env.SRC_ROOT);
  let d = import.meta.dir;
  while (!existsSync(join(d, "src.lock.json"))) {
    const up = dirname(d);
    if (up === d) return resolve(import.meta.dir, "../../../..");
    d = up;
  }
  return d;
}

const toml = (p: string): any =>
  existsSync(p) ? Bun.TOML.parse(readFileSync(p, "utf8")) : {};

const WIN = process.platform === "win32";
/** Identifiant fleet.toml de la machine courante (AGENTS_HOST prime). */
export const selfId = () => Bun.env.AGENTS_HOST ?? (WIN ? "pc" : hostname());

/** Entier strictement positif, sinon la valeur par défaut. */
const posInt = (v: unknown, d: number) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n >= 1 ? n : d;
};

export function hosts(root = srcRoot()): Host[] {
  const fleet = toml(join(root, "infra/agents/fleet.toml"));
  const deploy = toml(join(root, "infra/deploy.toml"));
  const nodes = Object.entries<any>(deploy.nodes ?? {});
  const me = selfId();
  const out: Host[] = [];
  for (const [id, h] of Object.entries<any>(fleet.hosts ?? {})) {
    const node =
      nodes.find(([n]) => n === id) ??
      nodes.find(([, n]) => n.ssh_alias === id);
    if (node?.[1].role === "build") continue; // fr1
    const local = id === me;
    if (!local && typeof h.src !== "string") continue; // checkout du runner inconnu
    const cap = posInt(
      Bun.env[`ORCH_MAX_AGENTS_${id.toUpperCase()}`] ?? Bun.env.ORCH_MAX_AGENTS,
      local ? 3 : 2,
    );
    out.push({
      id,
      local,
      ssh: local ? undefined : (node?.[1].ssh_alias ?? id),
      sshTargets: local
        ? undefined
        : [
            ...new Set<string>([
              ...(Array.isArray(h.ssh) ? h.ssh : []),
              node?.[1].ssh_alias ?? id,
            ]),
          ],
      src: local ? root : h.src,
      roles: h.roles ?? [],
      maxAgents: cap,
    });
  }
  // Machine absente de fleet.toml : ajoutée en local, sauf si c'est un nœud de build (fr1).
  const meNode = nodes.find(([n, v]) => n === me || v.ssh_alias === me);
  if (!out.some((h) => h.local) && meNode?.[1].role !== "build")
    out.unshift({
      id: me,
      local: true,
      src: root,
      roles: [],
      maxAgents: posInt(Bun.env.ORCH_MAX_AGENTS, 3),
    });
  return out;
}

/** Guillemets sh : 'a'\''b'. */
export const shq = (s: string) => `'${s.replace(/'/g, `'\\''`)}'`;

/** Commande argv sur un hôte, depuis son checkout `src` (ou `cwd` relatif), délai borné, priorité basse. */
export async function exec(
  h: Host,
  argv: string[],
  o: {
    cwd?: string;
    stdin?: string;
    timeoutMs?: number;
    raw?: boolean;
    home?: boolean;
  } = {},
): Promise<ExecResult> {
  const t0 = performance.now();
  const timeoutMs = o.timeoutMs ?? 600_000;
  let cmds: string[][];
  let cwd: string | undefined;
  if (h.local) {
    cmds = [argv];
    cwd = o.home ? undefined : resolve(h.src, o.cwd ?? ".");
  } else {
    const dir = o.cwd ? `${h.src}/${o.cwd}` : h.src;
    const body = o.raw
      ? argv.join(" ")
      : `exec nice -n 19 timeout -k 10 ${Math.ceil(timeoutMs / 1000)} ${argv.map(shq).join(" ")}`;
    const remote = o.home
      ? `cd; ${body}`
      : o.raw
        ? `cd ${shq(dir)} 2>/dev/null; ${body}`
        : `cd ${shq(dir)} || { printf 'checkout absent : %s\\n' ${shq(dir)} >&2; exit 127; }; ${body}`;
    cmds = (h.sshTargets ?? [h.ssh!]).map((t) => [
      "ssh",
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=10",
      t,
      remote,
    ]);
  }
  let r: ExecResult = { code: 255, out: "", err: "aucune cible ssh", ms: 0 };
  for (const cmd of cmds) {
    r = await run(cmd);
    if (h.local || r.code !== 255) return r; // 255 = connexion ssh impossible : cible suivante
  }
  return r;

  async function run(cmd: string[]): Promise<ExecResult> {
    try {
      const p = Bun.spawn(cmd, {
        cwd,
        stdin: o.stdin !== undefined ? Buffer.from(o.stdin) : "ignore",
        stdout: "pipe",
        stderr: "pipe",
        timeout: timeoutMs + 15_000,
      });
      if (h.local && p.pid)
        try {
          setPriority(p.pid, constants.priority.PRIORITY_BELOW_NORMAL);
        } catch {}
      const [out, err, code] = await Promise.all([
        new Response(p.stdout).text(),
        new Response(p.stderr).text(),
        p.exited,
      ]);
      // 124 seulement si le délai est atteint ; un autre signal (OOM, crash) reste un échec ordinaire.
      const late = performance.now() - t0 >= timeoutMs;
      return {
        code: p.signalCode ? (late ? 124 : 128 + 9) : code,
        out,
        err,
        ms: Math.round(performance.now() - t0),
      };
    } catch (e) {
      return {
        code: 127,
        out: "",
        err: e instanceof Error ? e.message : String(e),
        ms: Math.round(performance.now() - t0),
      };
    }
  }
}

/** Ligne de commande sh (pour `check` et les étapes `cmd` écrites en texte). */
export const shell = (
  h: Host,
  line: string,
  timeoutMs?: number,
  home = false,
) =>
  h.local
    ? exec(
        h,
        WIN ? [Bun.which("niu") ?? "sh", "-c", line] : ["sh", "-c", line],
        {
          timeoutMs,
          home,
        },
      )
    : exec(h, ["sh", "-c", line], { timeoutMs, home });

/** CLI d'agents présentes sur l'hôte (une seule connexion ssh). */
export async function clisOn(h: Host, names: string[]): Promise<string[]> {
  if (h.local) return names.filter((n) => Bun.which(n));
  const r = await exec(
    h,
    [
      `for c in ${names.map(shq).join(" ")}; do command -v $c >/dev/null 2>&1 && echo $c; done`,
    ],
    { raw: true, timeoutMs: 20_000 },
  );
  return r.out.split(/\s+/).filter((n) => names.includes(n));
}
