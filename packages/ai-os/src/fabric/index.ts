// Tissu d'inférence distribué : un llama-server coordinateur (GPU CUDA du PC) qui délègue des couches à des
// ggml-rpc-server joints uniquement par WireGuard (backend RPC de llama.cpp, tools/rpc/README.md amont).
// Configuration : infra/ai/fabric.toml. Nœuds Linux : infra/ai/fabric/node.sh (unité systemd transitoire plafonnée,
// condition d'admission vérifiée en continu). Santé : orch/health.ts (hôte = nœud, fournisseur = "fabric-rpc").
// Le modèle servi apparaît dans llm_models sous `fabric/<alias>` (llm/models.ts), absent dès que le coordinateur tombe.
import { createHash } from "node:crypto";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { selfId, shq, srcRoot } from "../orch/fleet";
import { Health } from "../orch/health";

export type Asset = { asset: string; sha256: string };
export type FabricNode = {
  id: string;
  os: "windows" | "linux";
  role?: "coordinator";
  ssh?: string;
  bind?: string;
  reach?: string;
  port?: number;
  threads?: number;
  cpu_quota?: string;
  memory_max?: string;
  gate?: string;
  heavy_lock?: string;
  priority_url?: string;
  watch_s?: number;
  enabled?: boolean;
  /** Part relative des couches confiées à ce nœud (coordinateur : appareils locaux). */
  share?: number;
};
export type Fabric = {
  coordinator: {
    node: string;
    host: string;
    port: number;
    model: string;
    ctx: number;
    cache: string;
    mesh: string[];
  };
  release: { tag: string; commit: string } & Record<string, Asset | string>;
  model: Record<
    string,
    { path: string; bytes: number; sha256: string; url?: string }
  >;
  node: FabricNode[];
};
export type NodeState = {
  id: string;
  admitted: boolean;
  reason?: string;
  endpoint?: string;
  status?: any;
};

const PROVIDER = "fabric-rpc";
const expand = (p: string) => p.replace(/^~(?=$|[\\/])/, homedir());
const dataDir = () => expand("~/.local/share/ay/ai");
const statePath = () => join(dataDir(), "fabric.json");

export function loadFabric(root = srcRoot()): Fabric {
  const p = Bun.env.AI_FABRIC_CONFIG ?? join(root, "infra/ai/fabric.toml");
  const f = Bun.TOML.parse(readFileSync(p, "utf8")) as any;
  f.coordinator.mesh ??= [];
  f.node ??= [];
  return f as Fabric;
}

/** URL OpenAI-compatible du coordinateur (llm/models.ts la lit aussi par AI_FABRIC_URL). */
export const coordinatorUrl = (f: Fabric) =>
  `http://${f.coordinator.host}:${f.coordinator.port}`;

// ------------------------------------------------------------------------------------------------
// Nœuds Linux : node.sh envoyé sur stdin, puis exécuté avec les paramètres du nœud.

function nodeEnv(f: Fabric, n: FabricNode): Record<string, string> {
  const rel = f.release[`${n.os}-x86_64`] as Asset;
  return {
    TAG: f.release.tag,
    ASSET: rel.asset,
    SHA: rel.sha256,
    BIND: n.bind ?? "",
    PORT: String(n.port ?? 50052),
    THREADS: String(n.threads ?? 2),
    CPU: n.cpu_quota ?? "100%",
    MEM: n.memory_max ?? "2G",
    GATE: n.gate ?? "always",
    LOCK: n.heavy_lock ?? "",
    PRIO: n.priority_url ?? "",
    WATCH: String(n.watch_s ?? 10),
    COORD: f.coordinator.mesh.join(", "),
    ...modelEnv(f),
  };
}

/** GGUF du coordinateur pour `warm` : mêmes octets partout (sha256), tiré par chaque nœud depuis `url`. */
const modelEnv = (f: Fabric): Record<string, string> => {
  const m = f.model[f.coordinator.model];
  return m?.url
    ? { MODEL_URL: m.url, MODEL_SHA: m.sha256, MODEL_FILE: m.path }
    : {};
};

/** Ligne sh distante : root, sinon sudo -n ; installe node.sh puis lance l'action. */
export function remoteLine(env: Record<string, string>, action: string) {
  const kv = Object.entries(env)
    .map(([k, v]) => `${k}=${shq(v)}`)
    .join(" ");
  return [
    `S=; [ "$(id -u)" = 0 ] || S="sudo -n"`,
    `$S mkdir -p /opt/aphrody/fabric`,
    `$S tee /opt/aphrody/fabric/node.sh >/dev/null`,
    `exec $S env ${kv} sh /opt/aphrody/fabric/node.sh ${shq(action)}`,
  ].join(" && ");
}

async function nodeSh(
  root: string,
  f: Fabric,
  n: FabricNode,
  action: string,
  timeoutMs = 180_000,
) {
  const script = readFileSync(join(root, "infra/ai/fabric/node.sh"));
  const p = Bun.spawn(
    [
      "ssh",
      "-o",
      "BatchMode=yes",
      "-o",
      "ConnectTimeout=10",
      n.ssh ?? n.id,
      remoteLine(nodeEnv(f, n), action),
    ],
    { stdin: script, stdout: "pipe", stderr: "pipe", timeout: timeoutMs },
  );
  const [out, err, code] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  return { code, out: out.trim(), err: err.trim() };
}

/** Port TCP joignable (nœud Windows, ou vérification après démarrage). */
export async function reachable(host: string, port: number, ms = 3000) {
  if (!host) return false;
  return await new Promise<boolean>((done) => {
    const t = setTimeout(() => done(false), ms);
    Bun.connect({
      hostname: host,
      port,
      socket: {
        open(s) {
          clearTimeout(t);
          s.end();
          done(true);
        },
        error() {
          clearTimeout(t);
          done(false);
        },
        data() {},
      },
    }).catch(() => {
      clearTimeout(t);
      done(false);
    });
  });
}

const workers = (f: Fabric, only?: string[]) =>
  f.node.filter(
    (n) =>
      n.role !== "coordinator" &&
      n.enabled !== false &&
      (!only?.length || only.includes(n.id)),
  );

// ------------------------------------------------------------------------------------------------
// Coordinateur : binaire CUDA officiel vérifié (sha256 = digest GitHub), jamais compilé ici.

const toolDir = (f: Fabric) =>
  expand(
    `~/.local/share/ay/tools/llama.cpp/${f.release.tag.replace(/^b/, "")}-cuda`,
  );

async function sha256File(p: string) {
  const h = createHash("sha256");
  for await (const c of createReadStream(p)) h.update(c as Buffer);
  return h.digest("hex");
}

export async function ensureCoordinatorBin(f: Fabric): Promise<string> {
  const dir = toolDir(f);
  const exe = join(
    dir,
    process.platform === "win32" ? "llama-server.exe" : "llama-server",
  );
  if (existsSync(exe)) return exe;
  if (process.platform !== "win32")
    throw new Error(
      "coordinateur prévu sur l'hôte Windows GPU (fabric.toml [coordinator])",
    );
  mkdirSync(dir, { recursive: true });
  for (const key of ["windows-x86_64", "windows-x86_64-cudart"]) {
    const a = f.release[key] as Asset;
    const zip = join(dir, a.asset);
    const url = `https://github.com/ggml-org/llama.cpp/releases/download/${f.release.tag}/${a.asset}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
    await Bun.write(zip, r);
    const got = await sha256File(zip);
    if (got !== a.sha256) {
      rmSync(zip);
      throw new Error(`${a.asset} : sha256 ${got} != ${a.sha256}`);
    }
    const x = Bun.spawnSync(["tar", "-xf", zip, "-C", dir]);
    rmSync(zip);
    if (x.exitCode !== 0)
      throw new Error(`extraction de ${a.asset} : ${x.stderr}`);
  }
  return exe;
}

export function modelPath(
  f: Fabric,
  alias = f.coordinator.model,
  verify = false,
) {
  const m = f.model[alias];
  if (!m) throw new Error(`modèle inconnu dans fabric.toml : ${alias}`);
  const p = join(expand(f.coordinator.cache), m.path);
  if (!existsSync(p))
    throw new Error(`GGUF absent : ${p} (ay ai pull ollama, puis lien dur)`);
  if (statSync(p).size !== m.bytes)
    throw new Error(`${p} : ${statSync(p).size} octets, attendu ${m.bytes}`);
  return { path: p, sha256: verify ? sha256File(p) : undefined };
}

/** -ts dans l'ordre des appareils de llama.cpp : nœuds RPC (ordre de --rpc) puis l'appareil local (CUDA0).
 *  Vide si une part manque : llama.cpp répartit alors selon la mémoire libre (le CPU d'un VPS l'emporterait). */
export function tensorSplit(f: Fabric, admitted: string[]): number[] {
  const by = (id: string) => f.node.find((n) => n.id === id)?.share;
  const parts = [...admitted.map(by), by(f.coordinator.node)];
  return admitted.length && parts.every((x) => typeof x === "number" && x >= 0)
    ? (parts as number[])
    : [];
}

/** Arguments du coordinateur pour une liste de nœuds RPC admis. */
export function coordinatorArgs(
  f: Fabric,
  model: string,
  rpc: string[],
  split: number[] = [],
) {
  const c = f.coordinator;
  return [
    "-m",
    model,
    "--alias",
    c.model,
    "-ngl",
    "999",
    "-c",
    String(c.ctx),
    "--host",
    c.host,
    "--port",
    String(c.port),
    "--jinja",
    "--metrics",
    "--no-webui",
    ...(rpc.length ? ["--rpc", rpc.join(",")] : []),
    ...(split.length ? ["-ts", split.join(",")] : []),
  ];
}

type State = {
  pid: number;
  started: string;
  rpc: string[];
  nodes: NodeState[];
  args: string[];
  tag: string;
};
const readState = (): State | null => {
  try {
    return JSON.parse(readFileSync(statePath(), "utf8"));
  } catch {
    return null;
  }
};
const alive = (pid: number) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

async function waitHealthy(url: string, ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const r = await fetch(`${url}/health`, {
      signal: AbortSignal.timeout(2000),
    }).catch(() => null);
    if (r?.ok) return true;
    await Bun.sleep(1000);
  }
  return false;
}

async function stopCoordinator() {
  const s = readState();
  if (s && alive(s.pid)) {
    process.kill(s.pid);
    for (let i = 0; i < 20 && alive(s.pid); i++) await Bun.sleep(250);
  }
}

// ------------------------------------------------------------------------------------------------
// Commandes

export type UpOpts = {
  only?: string[];
  split?: number[];
  local?: boolean;
  noWarm?: boolean;
};

/** Admet les nœuds (condition + santé), démarre leurs rpc-server, puis le coordinateur avec --rpc. */
export async function up(o: UpOpts = {}, root = srcRoot()) {
  const f = loadFabric(root);
  const health = new Health();
  const nodes: NodeState[] = [];
  if (!o.local)
    for (const n of workers(f, o.only)) {
      const endpoint = `${n.reach}:${n.port ?? 50052}`;
      const cool = health.cooling(n.id, PROVIDER);
      if (cool) {
        nodes.push({
          id: n.id,
          admitted: false,
          reason: `refroidissement (${cool})`,
        });
        continue;
      }
      if (n.os === "windows") {
        const ok = await reachable(n.reach ?? "", n.port ?? 50052);
        nodes.push({
          id: n.id,
          admitted: ok,
          endpoint,
          reason: ok
            ? undefined
            : n.reach
              ? "rpc-server injoignable"
              : "non déclaré (reach vide)",
        });
        continue;
      }
      const t0 = performance.now();
      const r = await nodeSh(root, f, n, "up");
      let ok =
        r.code === 0 && (await reachable(n.reach ?? "", n.port ?? 50052, 5000));
      // Cache de tenseurs rempli depuis la copie locale du nœud avant que le coordinateur charge le modèle.
      if (ok && !o.noWarm && modelEnv(f).MODEL_URL) {
        const w = await nodeSh(root, f, n, "warm", 3_600_000);
        if (w.code !== 0) r.out += `\nwarm : ${w.out || w.err}`;
        ok = w.code === 0;
      }
      const ms = Math.round(performance.now() - t0);
      // Refus par condition (75) = attendu, pas un échec de santé ; panne ssh/installation = refroidissement.
      if (r.code !== 75)
        health.record(n.id, PROVIDER, ok, ok ? null : "overload", ms);
      nodes.push({
        id: n.id,
        admitted: ok,
        endpoint,
        reason: ok
          ? undefined
          : (r.out || r.err).split("\n").slice(-3).join(" | "),
      });
    }
  const admitted = nodes.filter((n) => n.admitted);
  const rpc = admitted.map((n) => n.endpoint!);
  await stopCoordinator();
  const exe = await ensureCoordinatorBin(f);
  const model = modelPath(f).path;
  const split =
    o.split ??
    tensorSplit(
      f,
      admitted.map((n) => n.id),
    );
  const args = coordinatorArgs(
    f,
    model,
    rpc,
    split.length === 1 + rpc.length ? split : [],
  );
  mkdirSync(dataDir(), { recursive: true });
  const log = openSync(join(dataDir(), "fabric.log"), "w");
  const p = Bun.spawn([exe, ...args], {
    stdio: ["ignore", log, log],
    detached: true,
    env: { ...Bun.env, GGML_RPC_NO_RDMA: "1" },
  } as any);
  p.unref();
  const state: State = {
    pid: p.pid,
    started: new Date().toISOString(),
    rpc,
    nodes,
    args,
    tag: f.release.tag,
  };
  writeFileSync(statePath(), JSON.stringify(state, null, 2));
  const ok = await waitHealthy(coordinatorUrl(f), 600_000);
  health.record(
    selfId(),
    `fabric/${f.coordinator.model}`,
    ok,
    ok ? null : "overload",
    0,
  );
  health.close();
  return {
    ok,
    url: `${coordinatorUrl(f)}/v1`,
    model: `fabric/${f.coordinator.model}`,
    ...state,
  };
}

export async function status(root = srcRoot()) {
  const f = loadFabric(root);
  const s = readState();
  const url = coordinatorUrl(f);
  const healthy = !!(
    await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) }).catch(
      () => null,
    )
  )?.ok;
  const nodes = await Promise.all(
    workers(f).map(async (n) => {
      const port = n.port ?? 50052;
      const listening = await reachable(n.reach ?? "", port);
      if (n.os !== "linux") return { id: n.id, reach: n.reach, listening };
      const r = await nodeSh(root, f, n, "status", 30_000);
      let st: any = r.out;
      try {
        st = JSON.parse(r.out);
      } catch {}
      return {
        id: n.id,
        reach: n.reach,
        listening,
        status: st,
        err: r.err || undefined,
      };
    }),
  );
  return {
    coordinator: {
      url: `${url}/v1`,
      healthy,
      pid: s?.pid,
      alive: s ? alive(s.pid) : false,
      rpc: s?.rpc ?? [],
    },
    model: `fabric/${f.coordinator.model}`,
    nodes,
  };
}

/** Remplit le cache de tenseurs des nœuds Linux actifs depuis leur propre copie du GGUF (lien montant du PC épargné). */
export async function warm(only?: string[], root = srcRoot()) {
  const f = loadFabric(root);
  if (!modelEnv(f).MODEL_URL)
    throw new Error(`modèle ${f.coordinator.model} sans url dans fabric.toml`);
  return await Promise.all(
    workers(f, only)
      .filter((n) => n.os === "linux")
      .map(async (n) => ({
        id: n.id,
        ...(await nodeSh(root, f, n, "warm", 3_600_000)),
      })),
  );
}

export async function down(root = srcRoot()) {
  const f = loadFabric(root);
  await stopCoordinator();
  const nodes = await Promise.all(
    workers(f)
      .filter((n) => n.os === "linux")
      .map(async (n) => ({
        id: n.id,
        ...(await nodeSh(root, f, n, "down", 60_000)),
      })),
  );
  rmSync(statePath(), { force: true });
  return { stopped: true, nodes };
}

/** Une génération réelle ; tokens/s lus dans `timings` de llama-server. */
export async function bench(prompt: string, n = 128, root = srcRoot()) {
  const f = loadFabric(root);
  const t0 = performance.now();
  const r = await fetch(`${coordinatorUrl(f)}/v1/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: f.coordinator.model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: n,
      temperature: 0,
      // Longueur fixe pour comparer les débits : pas d'arrêt anticipé.
      ignore_eos: true,
    }),
    signal: AbortSignal.timeout(900_000),
  });
  const j: any = await r.json();
  const ms = Math.round(performance.now() - t0);
  const h = new Health();
  h.record(
    selfId(),
    `fabric/${f.coordinator.model}`,
    r.ok,
    r.ok ? null : "overload",
    ms,
  );
  h.close();
  return {
    ok: r.ok,
    ms,
    rpc: readState()?.rpc ?? [],
    prompt_tps: j.timings?.prompt_per_second,
    gen_tps: j.timings?.predicted_per_second,
    gen_tokens: j.timings?.predicted_n ?? j.usage?.completion_tokens,
    text: j.choices?.[0]?.message?.content?.slice(0, 120),
  };
}

/** Nœud Windows (second hôte GPU) : rpc-server au premier plan, lié à son adresse WireGuard. */
export async function serveNode(id: string, root = srcRoot()) {
  const f = loadFabric(root);
  const n = f.node.find((x) => x.id === id);
  if (!n?.bind)
    throw new Error(`nœud ${id} sans adresse bind dans fabric.toml`);
  const exe = join(toolDir(f), "ggml-rpc-server.exe");
  await ensureCoordinatorBin(f);
  const p = Bun.spawn(
    [
      exe,
      "-H",
      n.bind,
      "-p",
      String(n.port ?? 50052),
      "-c",
      "-t",
      String(n.threads ?? 4),
    ],
    {
      stdio: ["ignore", "inherit", "inherit"],
      env: { ...Bun.env, GGML_RPC_NO_RDMA: "1" },
    },
  );
  return await p.exited;
}
