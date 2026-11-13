// File d'agents de infra/agents/runner.ts (couche d'exécution de labs-1b, doc docs/agents/AGENT-FIRST.md), format v1
// produit et lu tel quel : <src de l'hôte>/var/agents/queue/{tmp,new,claimed,done,failed}/<id>.json,
// résultats results/<id>/result.json, état state/{health.json,heartbeat-<role>,cooldown-<provider>}.
// Dépôt atomique : écriture dans tmp/ puis renommage dans new/. À distance : une session ssh par opération.
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { exec, type Host, shq } from "./fleet";

export type Attempt = {
  provider: string;
  exit: number;
  reason: "ok" | "agent_error" | "provider_unavailable" | "check_failed";
  started: string;
  ended: string;
  check_exit?: number;
};

export type QueueTask = {
  v: 1;
  id: string;
  prompt: string;
  role:
    | "coder"
    | "reviewer"
    | "tester"
    | "linter"
    | "designer"
    | "deployer"
    | "sre"
    | "growth";
  host: string;
  providers?: string[];
  cwd?: string;
  check?: string;
  commit?: { paths: string[]; message: string };
  approval?: "none" | "owner";
  timeout_s?: number;
  budget_usd?: number;
  max_attempts?: number;
  attempts?: Attempt[];
  created_by?: string;
  created_at?: string;
};

export type QueueResult = {
  id: string;
  status: "done" | "failed";
  host: string;
  provider?: string;
  attempts: Attempt[];
  commit?: { sha?: string; files: string[]; error?: string };
  results?: string;
};

const home = (h: Host) =>
  h.local && Bun.env.AGENTS_HOME ? Bun.env.AGENTS_HOME : `${h.src}/var/agents`;

export async function enqueue(h: Host, t: QueueTask): Promise<void> {
  const body = JSON.stringify(t, null, 2);
  const base = home(h);
  if (h.local) {
    for (const d of ["tmp", "new"])
      mkdirSync(join(base, "queue", d), { recursive: true });
    const tmp = join(base, "queue", "tmp", `${t.id}.json`);
    writeFileSync(tmp, body);
    renameSync(tmp, join(base, "queue", "new", `${t.id}.json`));
    return;
  }
  const q = `${base}/queue`;
  const r = await exec(
    h,
    [
      `mkdir -p ${shq(`${q}/tmp`)} ${shq(`${q}/new`)} && cat > ${shq(`${q}/tmp/${t.id}.json`)} && mv ${shq(`${q}/tmp/${t.id}.json`)} ${shq(`${q}/new/${t.id}.json`)}`,
    ],
    { raw: true, stdin: body, timeoutMs: 30_000 },
  );
  if (r.code) throw new Error(`enqueue ${h.id} : ${r.err.trim()}`);
}

/** Résultat final (done/failed) ou null tant que la tâche est en file, réclamée ou remise en file. */
export async function poll(h: Host, id: string): Promise<QueueResult | null> {
  const base = home(h);
  const f = `${base}/results/${id}/result.json`;
  // La tâche remise en new/ après des fournisseurs indisponibles garde un result.json intermédiaire : seul
  // done/ ou failed/ est final.
  if (h.local) {
    const final = ["done", "failed"].some((d) =>
      existsSync(join(base, "queue", d, `${id}.json`)),
    );
    return final && existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
  }
  const r = await exec(
    h,
    [
      `if [ -f ${shq(`${base}/queue/done/${id}.json`)} ] || [ -f ${shq(`${base}/queue/failed/${id}.json`)} ]; then cat ${shq(f)}; fi`,
    ],
    { raw: true, timeoutMs: 30_000 },
  );
  const t = r.out.trim();
  return t ? JSON.parse(t) : null;
}

/** Tentatives déjà faites sur une tâche encore en file (remise en new/ ou réclamée). */
export async function pendingAttempts(h: Host, id: string): Promise<Attempt[]> {
  const base = home(h);
  const read = (t: string) => {
    try {
      return (JSON.parse(t).attempts ?? []) as Attempt[];
    } catch {
      return [];
    }
  };
  if (h.local) {
    const f = join(base, "queue", "new", `${id}.json`);
    return existsSync(f) ? read(readFileSync(f, "utf8")) : [];
  }
  const r = await exec(
    h,
    [`cat ${shq(`${base}/queue/new/${id}.json`)} 2>/dev/null`],
    {
      raw: true,
      timeoutMs: 30_000,
    },
  );
  return read(r.out);
}

/** Retire une tâche encore en new/ (re-routage vers un autre hôte). */
export async function withdraw(h: Host, id: string): Promise<boolean> {
  const base = home(h);
  const src = `${base}/queue/new/${id}.json`;
  const dst = `${base}/queue/failed/${id}.json`;
  if (h.local) {
    if (!existsSync(src)) return false;
    mkdirSync(join(base, "queue", "failed"), { recursive: true });
    renameSync(src, dst);
    return true;
  }
  const r = await exec(
    h,
    [`mkdir -p ${shq(`${base}/queue/failed`)} && mv ${shq(src)} ${shq(dst)}`],
    {
      raw: true,
      timeoutMs: 30_000,
    },
  );
  return r.code === 0;
}

export type RunnerState = {
  alive: boolean; // un worker du rôle a battu depuis moins de 2 min
  roles: string[]; // rôles vivants
  clis: Record<string, string>; // sonde des CLI (state/health.json)
  cooling: string[]; // fournisseurs en refroidissement (state/cooldown-*, 15 min)
};

const FRESH_MS = 120_000;
const COOL_MS = 15 * 60_000;

/** État du runner d'un hôte, lu dans state/ (une session ssh). */
export async function runnerState(h: Host): Promise<RunnerState> {
  const base = home(h);
  let files: { name: string; age: number; body?: string }[] = [];
  if (h.local) {
    const d = join(base, "state");
    if (existsSync(d))
      files = readdirSync(d).map((name) => ({
        name,
        age: Date.now() - statSync(join(d, name)).mtimeMs,
        body:
          name === "health.json"
            ? readFileSync(join(d, name), "utf8")
            : undefined,
      }));
  } else {
    const r = await exec(
      h,
      [
        `cd ${shq(`${base}/state`)} 2>/dev/null || exit 0; now=$(date +%s); for f in *; do [ -f "$f" ] && echo "F $(( now - $(stat -c %Y "$f") )) $f"; done; echo; cat health.json 2>/dev/null`,
      ],
      { raw: true, timeoutMs: 30_000 },
    );
    const [list, ...rest] = r.out.split("\n\n");
    files = (list ?? "")
      .split("\n")
      .map((l) => l.match(/^F (\d+) (.+)$/))
      .filter((m): m is RegExpMatchArray => !!m)
      .map((m) => ({ name: m[2]!, age: Number(m[1]) * 1000 }));
    const hj = files.find((f) => f.name === "health.json");
    if (hj) hj.body = rest.join("\n\n");
  }
  const roles = files
    .filter((f) => f.name.startsWith("heartbeat-") && f.age < FRESH_MS)
    .map((f) => f.name.slice("heartbeat-".length));
  let clis: Record<string, string> = {};
  try {
    clis =
      JSON.parse(files.find((f) => f.name === "health.json")?.body ?? "{}")
        .clis ?? {};
  } catch {}
  return {
    alive: roles.length > 0,
    roles,
    clis,
    cooling: files
      .filter((f) => f.name.startsWith("cooldown-") && f.age < COOL_MS)
      .map((f) => f.name.slice("cooldown-".length)),
  };
}

/** Sortie de l'agent pour la tentative acceptée (results/<id>/<n>-<fournisseur>.log), tronquée. */
export async function output(
  h: Host,
  r: QueueResult,
  max = 20_000,
): Promise<string> {
  const n = r.attempts.findLastIndex((a) => a.reason === "ok");
  if (n < 0) return "";
  const p = r.attempts[n]!.provider.replace(/[^\w.-]/g, "_");
  const f = `${home(h)}/results/${r.id}/${n}-${p}.log`;
  const text = h.local
    ? existsSync(f)
      ? readFileSync(f, "utf8")
      : ""
    : (
        await exec(h, [`cat ${shq(f)} 2>/dev/null`], {
          raw: true,
          timeoutMs: 30_000,
        })
      ).out;
  return text.slice(-max);
}
