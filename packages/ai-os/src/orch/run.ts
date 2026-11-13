// Orchestrateur : workflow = graphe d'étapes calculé à l'exécution, exécuté en parallèle sur les hôtes de la flotte.
//   - étapes `cmd` (ligne sh, priorité basse), `tool` (outil du relais), `agent` (sous-agent : file du runner
//     infra/agents/runner.ts si un worker du rôle bat sur l'hôte, sinon exécution directe en lecture seule) ;
//   - `expand` : la sortie d'une étape peut ajouter des étapes ({"steps":[…]}), bornées en nombre et en profondeur ;
//   - bascule : chaque échec est classé (classify.ts) ; quota/auth/absence -> fournisseur suivant (liste `providers`
//     calculée par select.ts), puis hôte suivant ; throttle/surcharge/délai -> une relance après attente ;
//   - réparation : une commande qui échoue ouvre un ticket de correction (sous-agent coder, `check` = la commande),
//     les étapes dépendantes attendent le ticket ; au plus `fixRounds` tickets par étape ;
//   - garde-fous : étapes, profondeur, budget en $ (somme des budget_usd confiés), jetons, échéance, arrêt après N échecs
//     consécutifs, effets externes refusés sans règle du propriétaire (policy.ts).
// Journal JSONL : $AGENT_HOME/orch/runs/<run>.jsonl ; rapport JSON en retour.
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, normalize } from "node:path";
import { classify, type FailClass, retryAfterMs, switches } from "./classify";
import { type Host, hosts as fleetHosts, shell, srcRoot } from "./fleet";
import { Health } from "./health";
import { inline } from "./inline";
import { allowExternal, hold } from "./policy";
import * as Q from "./queue";
import { candidates, type Needs, rank } from "./select";

export type Role = Q.QueueTask["role"];

export type Step = {
  id: string;
  deps?: string[];
  do: "agent" | "cmd" | "tool";
  /** agent : consigne ; {{id}} = sortie de l'étape id. */
  prompt?: string;
  role?: Role;
  /** cmd : ligne sh exécutée depuis le checkout de l'hôte (ou son répertoire personnel si repo: false). */
  run?: string;
  repo?: boolean;
  /** tool : outil du relais (relay/tools.ts) et ses arguments. */
  tool?: string;
  args?: Record<string, unknown>;
  /** Hôtes admis, par préférence (défaut : hôtes dont fleet.toml liste le rôle, local d'abord). */
  hosts?: string[];
  needs?: Needs;
  check?: string;
  commit?: { paths: string[]; message: string };
  effect?: "external";
  expand?: boolean;
  /** Fichier où écrire la sortie (sous docs/reviews/ ou var/ uniquement). */
  out?: string;
  onFail?: "fix" | "stop" | "continue";
  timeout_s?: number;
  budget_usd?: number;
};

export type Workflow = {
  name: string;
  steps: Step[];
  limits?: Partial<Limits>;
};

export type Limits = {
  maxSteps: number;
  maxDepth: number;
  budgetUsd: number;
  tokenBudget: number;
  deadlineMs: number;
  maxConsecutiveFailures: number;
  fixRounds: number;
  pollMs: number;
};

const env = (k: string, d: number) => Number(Bun.env[k] ?? d);
export const defaultLimits = (): Limits => ({
  maxSteps: env("ORCH_MAX_STEPS", 48),
  maxDepth: env("ORCH_MAX_DEPTH", 3),
  budgetUsd: env("ORCH_BUDGET_USD", 20),
  tokenBudget: env("ORCH_TOKEN_BUDGET", 2_000_000),
  deadlineMs: env("ORCH_DEADLINE_MS", 4 * 3600_000),
  maxConsecutiveFailures: env("ORCH_MAX_FAILS", 4),
  fixRounds: env("ORCH_FIX_ROUNDS", 1),
  pollMs: env("ORCH_POLL_MS", 10_000),
});

type Status = "pending" | "running" | "done" | "failed" | "skipped" | "held";
export type Try = {
  host: string;
  provider?: string;
  ok: boolean;
  cls?: FailClass;
  ms: number;
  via: "queue" | "inline" | "cmd" | "tool";
};
type State = {
  step: Step;
  depth: number;
  status: Status;
  host?: string;
  provider?: string;
  output: string;
  tries: Try[];
  fixes: number;
  /** Ticket de correction qui remplace cette étape pour ses dépendants. */
  fixedBy?: string;
  note?: string;
  t0?: number;
  ms?: number;
};

export type RunOptions = {
  hosts?: Host[];
  limits?: Partial<Limits>;
  dryRun?: boolean;
  root?: string;
  onEvent?: (e: Record<string, unknown>) => void;
};

const DEFAULT_ROLE: Record<Step["do"], Role> = {
  agent: "reviewer",
  cmd: "linter",
  tool: "sre",
};

export async function runWorkflow(wf: Workflow, o: RunOptions = {}) {
  const root = o.root ?? srcRoot();
  const L = { ...defaultLimits(), ...wf.limits, ...o.limits };
  const fleet = o.hosts ?? fleetHosts(root);
  const runId = `${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}-${wf.name.replace(/[^\w-]/g, "")}-${Math.random().toString(36).slice(2, 6)}`;
  const logDir = join(
    Bun.env.AGENT_HOME ?? join(homedir(), ".agent"),
    "orch",
    "runs",
  );
  mkdirSync(logDir, { recursive: true });
  const logFile = join(logDir, `${runId}.jsonl`);
  const health = new Health();
  const t0 = Date.now();
  const emit = (event: string, data: Record<string, unknown> = {}) => {
    const e = { ts: new Date().toISOString(), run: runId, event, ...data };
    appendFileSync(logFile, `${JSON.stringify(e)}\n`);
    o.onEvent?.(e);
  };

  const st = new Map<string, State>();
  const add = (s: Step, depth: number) => {
    if (st.has(s.id)) throw new Error(`étape en double : ${s.id}`);
    if (st.size >= L.maxSteps)
      throw new Error(`plafond d'étapes atteint (${L.maxSteps})`);
    st.set(s.id, {
      step: s,
      depth,
      status: "pending",
      output: "",
      tries: [],
      fixes: 0,
    });
  };
  for (const s of wf.steps) add(s, 0);
  for (const s of wf.steps)
    for (const d of s.deps ?? [])
      if (!st.has(d)) throw new Error(`${s.id} dépend de ${d}, absente`);

  const busy = new Map<string, number>(fleet.map((h) => [h.id, 0]));
  let spentUsd = 0;
  let tokens = 0;
  let consecutive = 0;
  let stopped: string | undefined;

  // Résolution d'une dépendance à travers les tickets de correction.
  const resolve = (id: string): State => {
    let s = st.get(id)!;
    while (s.fixedBy) s = st.get(s.fixedBy)!;
    return s;
  };
  const outputOf = (id: string) => {
    const s = resolve(id);
    return s.status === "done" ? s.output : "";
  };
  const fill = (text: string) =>
    text.replace(/\{\{([\w.#-]+)\}\}/g, (_, id) =>
      st.has(id) ? outputOf(id).slice(-20_000) : `{{${id}}}`,
    );

  const runnerCache = new Map<string, { at: number; v: Q.RunnerState }>();
  const runner = async (h: Host) => {
    const c = runnerCache.get(h.id);
    if (c && Date.now() - c.at < 60_000) return c.v;
    const v = await Q.runnerState(h).catch(
      () =>
        ({ alive: false, roles: [], clis: {}, cooling: [] }) as Q.RunnerState,
    );
    runnerCache.set(h.id, { at: Date.now(), v });
    return v;
  };

  const hostsFor = (s: Step): Host[] => {
    const role = s.role ?? DEFAULT_ROLE[s.do];
    const pool = s.hosts?.length
      ? s.hosts
          .map((id) => fleet.find((h) => h.id === id))
          .filter((h): h is Host => !!h)
      : [...fleet].sort((a, b) => Number(b.local) - Number(a.local));
    return s.hosts?.length || s.do !== "agent"
      ? pool
      : pool.filter((h) => h.local || h.roles.includes(role));
  };

  // ---------- exécution d'une étape sur un hôte ----------
  async function cmdStep(s: State, h: Host): Promise<boolean> {
    const r = await shell(
      h,
      fill(s.step.run!),
      (s.step.timeout_s ?? 1800) * 1000,
      s.step.repo === false,
    );
    const ok = r.code === 0;
    s.output = `${r.out}${r.err ? `\n[stderr]\n${r.err}` : ""}`.slice(-20_000);
    const cls = ok
      ? undefined
      : r.code === 127
        ? "missing"
        : r.code === 124
          ? "timeout"
          : "task";
    s.tries.push({ host: h.id, ok, cls, ms: r.ms, via: "cmd" });
    return ok;
  }

  async function toolStep(s: State, h: Host): Promise<boolean> {
    const t1 = performance.now();
    try {
      const { toolByName } = await import("../relay/tools.ts");
      const t = toolByName.get(s.step.tool!);
      if (!t) throw new Error(`outil inconnu : ${s.step.tool}`);
      const args = JSON.parse(fill(JSON.stringify(s.step.args ?? {})));
      const r = await t.run(args);
      s.output = (typeof r === "string" ? r : JSON.stringify(r, null, 2)).slice(
        -40_000,
      );
      s.tries.push({
        host: h.id,
        ok: true,
        ms: Math.round(performance.now() - t1),
        via: "tool",
      });
      return true;
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      s.output = msg;
      s.tries.push({
        host: h.id,
        ok: false,
        cls: classify(msg),
        ms: Math.round(performance.now() - t1),
        via: "tool",
      });
      return false;
    }
  }

  async function agentStep(
    s: State,
    h: Host,
    providers: string[],
  ): Promise<"ok" | "fail" | "reroute"> {
    const step = s.step;
    const role = step.role ?? DEFAULT_ROLE.agent;
    const prompt = fill(step.prompt ?? "");
    const rs = await runner(h);
    if (rs.roles.includes(role)) {
      const id = `${runId}-${step.id}`.replace(/[^\w.-]/g, "_").slice(0, 120);
      const budget = step.budget_usd ?? 2;
      spentUsd += budget;
      const task: Q.QueueTask = {
        v: 1,
        id,
        prompt,
        role,
        host: h.id,
        providers,
        cwd: undefined,
        check: step.check,
        commit: step.commit,
        approval:
          step.effect === "external" || role === "growth" ? "owner" : "none",
        timeout_s: step.timeout_s,
        budget_usd: budget,
        max_attempts: 3,
        created_by: `ai-os/orch ${runId}`,
        created_at: new Date().toISOString(),
      };
      await Q.enqueue(h, task);
      emit("enqueue", { step: step.id, host: h.id, task: id, providers });
      const until = Date.now() + ((step.timeout_s ?? 3600) + 600) * 1000;
      while (Date.now() < until) {
        await Bun.sleep(L.pollMs);
        const r = await Q.poll(h, id);
        if (r) {
          for (const a of r.attempts) {
            const cls: FailClass | undefined =
              a.reason === "ok"
                ? undefined
                : a.reason === "provider_unavailable"
                  ? "quota"
                  : "task";
            health.record(
              h.id,
              a.provider,
              a.reason === "ok",
              cls ?? null,
              Date.parse(a.ended) - Date.parse(a.started),
            );
            s.tries.push({
              host: h.id,
              provider: a.provider,
              ok: a.reason === "ok",
              cls,
              ms: Date.parse(a.ended) - Date.parse(a.started),
              via: "queue",
            });
          }
          if (r.status === "done") {
            s.provider = r.provider;
            s.output = await Q.output(h, r);
            return "ok";
          }
          s.output = `échec dans la file de ${h.id} : ${r.attempts.map((a) => `${a.provider}:${a.reason}`).join(", ")}`;
          return r.attempts.every((a) => a.reason === "provider_unavailable")
            ? "reroute"
            : "fail";
        }
        // Tous les fournisseurs indisponibles sur cet hôte : retirer la tâche et changer d'hôte.
        const pend = await Q.pendingAttempts(h, id);
        if (
          pend.length >= providers.length &&
          pend.every((a) => a.reason === "provider_unavailable") &&
          (await Q.withdraw(h, id))
        ) {
          for (const a of pend)
            health.record(h.id, a.provider, false, "quota", 0);
          s.output = `fournisseurs indisponibles sur ${h.id}`;
          return "reroute";
        }
        if (Date.now() - t0 > L.deadlineMs) break;
      }
      s.output = `délai dépassé dans la file de ${h.id}`;
      return "fail";
    }
    if (step.needs?.edit) {
      s.output = `aucun worker « ${role} » sur ${h.id} : une étape qui modifie des fichiers passe par la file`;
      s.tries.push({
        host: h.id,
        ok: false,
        cls: "missing",
        ms: 0,
        via: "queue",
      });
      return "reroute";
    }
    // Exécution directe, fournisseur par fournisseur (routeur rappelé après chaque échec, clé déjà essayée exclue).
    for (const p of providers) {
      if (tokens >= L.tokenBudget) {
        s.output = "budget de jetons épuisé";
        return "fail";
      }
      for (let attempt = 0; attempt < 2; attempt++) {
        const r = await inline(h, p, prompt, (step.timeout_s ?? 900) * 1000);
        tokens += r.tokens;
        health.record(h.id, p, r.ok, r.cls ?? null, r.ms);
        s.tries.push({
          host: h.id,
          provider: p,
          ok: r.ok,
          cls: r.cls,
          ms: r.ms,
          via: "inline",
        });
        emit("try", {
          step: step.id,
          host: h.id,
          provider: p,
          ok: r.ok,
          cls: r.cls,
          ms: r.ms,
        });
        if (r.ok) {
          s.provider = p;
          s.output = r.text;
          return "ok";
        }
        s.output = r.text;
        if (switches(r.cls!) || r.cls === "task" || attempt === 1) break;
        await Bun.sleep(
          Math.max(retryAfterMs(r.text), r.cls === "throttle" ? 5_000 : 2_000),
        );
      }
    }
    return "reroute";
  }

  async function execute(s: State): Promise<void> {
    const step = s.step;
    s.t0 = Date.now();
    if (
      step.effect === "external" &&
      !allowExternal(root, `${step.id} ${step.run ?? ""} ${step.tool ?? ""}`)
    ) {
      const prompt = step.prompt ? fill(step.prompt) : undefined;
      s.note = hold(root, runId, step.id, { step: { ...step, prompt } });
      s.status = "held";
      return;
    }
    const tried = new Set<string>();
    for (const h of hostsFor(step)) {
      if (tried.has(h.id)) continue;
      tried.add(h.id);
      while ((busy.get(h.id) ?? 0) >= h.maxAgents) await Bun.sleep(500);
      busy.set(h.id, (busy.get(h.id) ?? 0) + 1);
      s.host = h.id;
      emit("start", { step: step.id, do: step.do, host: h.id });
      try {
        if (step.do === "cmd") {
          if (await cmdStep(s, h)) return void (s.status = "done");
          const last = s.tries.at(-1)!;
          if (last.cls === "missing") continue; // checkout ou outil absent : hôte suivant
          s.status = "failed";
          return;
        }
        if (step.do === "tool") {
          s.status = (await toolStep(s, h)) ? "done" : "failed";
          return;
        }
        const rs = await runner(h);
        const all = await candidates(h, rs);
        const providers = rank(h.id, all, step.needs ?? {}, health, rs.cooling);
        emit("route", { step: step.id, host: h.id, providers });
        if (!providers.length) {
          s.tries.push({
            host: h.id,
            ok: false,
            cls: "missing",
            ms: 0,
            via: "inline",
          });
          s.output = `aucun moteur ne convient sur ${h.id}`;
          continue;
        }
        const r = await agentStep(s, h, providers);
        if (r === "ok") return void (s.status = "done");
        if (r === "fail") return void (s.status = "failed");
      } finally {
        busy.set(h.id, (busy.get(h.id) ?? 1) - 1);
      }
    }
    s.status = "failed";
  }

  // ---------- après une étape ----------
  function expand(s: State) {
    if (!s.step.expand || s.status !== "done") return;
    if (s.depth + 1 > L.maxDepth)
      return emit("expand-refused", { step: s.step.id, reason: "profondeur" });
    const m =
      s.output.match(/```json\s*([\s\S]*?)```/) ??
      s.output.match(/(\{[\s\S]*"steps"[\s\S]*\})/);
    if (!m) return;
    let spec: any;
    try {
      spec = JSON.parse(m[1]!);
    } catch {
      return emit("expand-refused", {
        step: s.step.id,
        reason: "JSON invalide",
      });
    }
    const raw: any[] = Array.isArray(spec?.steps) ? spec.steps : [];
    const local = new Set(raw.map((x) => String(x?.id ?? "")));
    const prefix = `${s.step.id}.`;
    for (const x of raw) {
      if (
        !x ||
        typeof x.id !== "string" ||
        !["agent", "cmd", "tool"].includes(x.do)
      )
        continue;
      const child: Step = {
        id: prefix + x.id,
        do: x.do,
        prompt: typeof x.prompt === "string" ? x.prompt : undefined,
        run: typeof x.run === "string" ? x.run : undefined,
        repo: x.repo === false ? false : undefined,
        timeout_s:
          typeof x.timeout_s === "number"
            ? Math.min(x.timeout_s, 7200)
            : undefined,
        tool: typeof x.tool === "string" ? x.tool : undefined,
        args: x.args && typeof x.args === "object" ? x.args : undefined,
        role: x.role,
        hosts: Array.isArray(x.hosts) ? x.hosts.map(String) : undefined,
        needs: x.needs && typeof x.needs === "object" ? x.needs : undefined,
        check: typeof x.check === "string" ? x.check : undefined,
        // Une étape générée hérite des restrictions du parent : pas d'effet externe levé, pas de commit hors parent.
        effect:
          x.effect === "external" || s.step.effect === "external"
            ? "external"
            : undefined,
        commit:
          s.step.commit && x.commit
            ? {
                paths: s.step.commit.paths,
                message: String(x.commit.message ?? s.step.commit.message),
              }
            : undefined,
        expand: x.expand === true,
        onFail: x.onFail,
        deps: [
          s.step.id,
          ...(Array.isArray(x.deps)
            ? x.deps
                .filter((d: string) => local.has(d))
                .map((d: string) => prefix + d)
            : []),
        ],
      };
      try {
        add(child, s.depth + 1);
        emit("expand", { parent: s.step.id, step: child.id, do: child.do });
      } catch (e: any) {
        emit("expand-refused", { step: child.id, reason: e.message });
        break;
      }
    }
  }

  function repair(s: State) {
    if (
      s.status !== "failed" ||
      s.step.onFail === "stop" ||
      s.step.onFail === "continue"
    )
      return;
    if (s.step.do !== "cmd" || s.fixes >= L.fixRounds) return;
    if (s.tries.at(-1)?.cls === "missing") return; // hôte, checkout ou outil absent : rien à corriger dans le code
    s.fixes++;
    const fix: Step = {
      id: `${s.step.id}#fix${s.fixes}`,
      do: "agent",
      role: "coder",
      needs: { edit: true },
      hosts: s.host ? [s.host] : undefined,
      prompt: `La commande \`${s.step.run}\` échoue sur ${s.host} (sortie ci-dessous). Corrige la cause par le plus petit changement, sans désactiver de contrôle.\n\n${s.output.slice(-6000)}`,
      check: s.step.run,
      commit: s.step.commit,
      onFail: "stop",
    };
    try {
      add(fix, s.depth);
      s.fixedBy = fix.id;
      emit("fix-ticket", { step: s.step.id, ticket: fix.id });
    } catch (e: any) {
      emit("fix-refused", { step: s.step.id, reason: e.message });
    }
  }

  function writeOut(s: State) {
    if (s.status !== "done" || !s.step.out) return;
    const rel = normalize(s.step.out).replace(/\\/g, "/");
    if (!/^(docs\/reviews|var)\//.test(rel) || rel.includes(".."))
      return emit("out-refused", { step: s.step.id, out: rel });
    const f = join(root, rel);
    mkdirSync(dirname(f), { recursive: true });
    writeFileSync(f, s.output.endsWith("\n") ? s.output : `${s.output}\n`);
    emit("out", { step: s.step.id, out: rel });
  }

  // ---------- boucle ----------
  const running = new Map<string, Promise<string>>();
  emit("run", {
    workflow: wf.name,
    steps: wf.steps.length,
    hosts: fleet.map((h) => h.id),
    limits: L,
  });
  while (true) {
    let progressed = false;
    if (!stopped && Date.now() - t0 > L.deadlineMs) stopped = "échéance";
    if (!stopped && spentUsd > L.budgetUsd) stopped = "budget $";
    if (!stopped && tokens > L.tokenBudget) stopped = "budget de jetons";
    if (!stopped && consecutive >= L.maxConsecutiveFailures)
      stopped = `${consecutive} échecs consécutifs`;
    for (const s of st.values()) {
      if (s.status !== "pending" || running.has(s.step.id)) continue;
      if (stopped) {
        s.status = "skipped";
        s.note = stopped;
        continue;
      }
      const deps = (s.step.deps ?? []).map(resolve);
      if (deps.some((d) => d.status === "pending" || d.status === "running"))
        continue;
      // Toute autre issue change l'état de l'étape (sautée, terminée en dry-run, lancée).
      progressed = true;
      const blocked = deps.find(
        (d) =>
          d.status !== "done" &&
          !(d.status === "failed" && d.step.onFail === "continue"),
      );
      if (blocked) {
        s.status = "skipped";
        s.note = `dépendance ${blocked.step.id} : ${blocked.status}`;
        continue;
      }
      if (o.dryRun) {
        s.status = "done";
        s.output = `[dry-run] ${s.step.do} ${s.step.run ?? s.step.tool ?? (s.step.prompt ?? "").slice(0, 80)}`;
        continue;
      }
      s.status = "running";
      running.set(
        s.step.id,
        execute(s)
          .catch((e) => {
            s.status = "failed";
            s.output = String(e?.message ?? e);
          })
          .then(() => s.step.id),
      );
    }
    if (!running.size) {
      const left = [...st.values()].filter((s) => s.status === "pending");
      if (!left.length) break;
      if (progressed) continue;
      for (const s of left) {
        s.status = "skipped";
        s.note = "dépendance circulaire";
      }
      break;
    }
    const id = await Promise.race(running.values());
    running.delete(id);
    const s = st.get(id)!;
    s.ms = Date.now() - (s.t0 ?? Date.now());
    consecutive =
      s.status === "failed"
        ? consecutive + 1
        : s.status === "done"
          ? 0
          : consecutive;
    emit("end", {
      step: id,
      status: s.status,
      host: s.host,
      provider: s.provider,
      ms: s.ms,
      tries: s.tries.length,
    });
    writeOut(s);
    expand(s);
    repair(s);
  }
  health.close();

  const steps = [...st.values()].map((s) => ({
    id: s.step.id,
    do: s.step.do,
    status: s.status,
    host: s.host,
    provider: s.provider,
    ms: s.ms,
    tries: s.tries,
    fixedBy: s.fixedBy,
    note: s.note,
    output: s.output.slice(0, 600),
  }));
  const final = (s: State) => resolve(s.step.id).status;
  const ok =
    !stopped &&
    [...st.values()].every(
      (s) =>
        ["done", "held"].includes(final(s)) || s.step.onFail === "continue",
    );
  const report = {
    run: runId,
    workflow: wf.name,
    ok,
    stopped,
    ms: Date.now() - t0,
    spent: { usd_reserved: spentUsd, tokens },
    hosts: [...new Set(steps.map((s) => s.host).filter(Boolean))],
    providers: [
      ...new Set(
        steps.flatMap((s) => s.tries.map((t) => t.provider)).filter(Boolean),
      ),
    ],
    log: logFile,
    steps,
  };
  emit("report", { ok, stopped });
  return report;
}
