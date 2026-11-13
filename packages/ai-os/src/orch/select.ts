// Sélection déclarative des moteurs : une étape décrit ses besoins (édition, outils, contexte, préférence de tri,
// listes d'autorisation/d'exclusion, modèles souhaités) et reçoit la liste `providers` ordonnée que le runner essaie
// dans l'ordre. Rien n'est figé : candidats = CLI d'agents présentes sur l'hôte + modèles découverts par le pont
// (llm_models), métadonnées de models.dev (registre d'opencode : coût, contexte, tool_call, reasoning), santé observée
// (health.ts) et refroidissements du runner. Parallèles et sources : docs/ORCHESTRATOR.md.
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { listModels } from "../llm/models";
import { clisOn, type Host } from "./fleet";
import type { Health } from "./health";
import type { RunnerState } from "./queue";

/** CLI que le runner sait lancer (infra/agents/runner.ts providerCmd), adressées « cli » ou « cli:modèle ». */
export const AGENT_CLIS = ["claude", "codex", "opencode", "pi", "agy"];

export type Needs = {
  /** L'étape modifie des fichiers : seules les CLI d'agents conviennent (llm_ask ne répond qu'en texte). */
  edit?: boolean;
  /** Appels d'outils requis (models.dev tool_call). */
  tools?: boolean;
  /** Contexte minimal en jetons (models.dev limit.context). */
  context?: number;
  reasoning?: boolean;
  /** Tri, comme provider.sort d'OpenRouter : fiabilité observée (défaut), coût, latence. */
  prefer?: "reliability" | "cost" | "latency";
  /** Expressions régulières sur l'identifiant (provider.only / provider.ignore d'OpenRouter). */
  only?: string[];
  ignore?: string[];
  /** Modèles souhaités, essayés d'abord (paramètre `models` d'OpenRouter) ; « cli:modèle » est suivi de « cli ». */
  models?: string[];
};

export type Candidate = {
  id: string; // valeur de `providers`
  kind: "cli" | "model";
  cost?: number; // $ par million de jetons (entrée + sortie), models.dev
  context?: number;
  tools?: boolean;
  reasoning?: boolean;
  why: string;
};

type Meta = {
  cost?: { input?: number; output?: number };
  limit?: { context?: number };
  tool_call?: boolean;
  reasoning?: boolean;
};
let registry: Record<string, { models?: Record<string, Meta> }> | undefined;

/** models.dev/api.json, en cache 24 h dans $AGENT_HOME ; vide hors ligne. */
export async function modelsDev(): Promise<typeof registry & {}> {
  if (registry) return registry;
  const f = join(
    Bun.env.AGENT_HOME ?? join(homedir(), ".agent"),
    "models.dev.json",
  );
  const fresh = existsSync(f) && Date.now() - statSync(f).mtimeMs < 864e5;
  if (!fresh)
    try {
      const r = await fetch(
        Bun.env.MODELS_DEV_URL ?? "https://models.dev/api.json",
        {
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (r.ok) writeFileSync(f, await r.text());
    } catch {}
  try {
    registry = JSON.parse(readFileSync(f, "utf8"));
  } catch {
    registry = {};
  }
  return registry!;
}

/** Métadonnées d'un modèle `fournisseur/modèle` du pont (OpenRouter : `openrouter/vendeur/modèle`). */
export function meta(reg: Record<string, any>, id: string): Meta | undefined {
  const i = id.indexOf("/");
  if (i < 0) return undefined;
  const p = id.slice(0, i);
  const m = id.slice(i + 1);
  return (
    reg[p]?.models?.[m] ??
    reg[m.split("/")[0]!]?.models?.[m.split("/").slice(1).join("/")]
  );
}

const sane = (p: string) => p.replace(/[^\w.-]/g, "_");

/** Candidats d'un hôte : CLI présentes (sonde du runner, sinon `command -v`) et, sur l'hôte local, modèles du pont. */
export async function candidates(
  h: Host,
  state: RunnerState | undefined,
  withModels = h.local,
): Promise<Candidate[]> {
  const probed = Object.entries(state?.clis ?? {})
    .filter(([, v]) => v && !/missing|absent|not found/i.test(String(v)))
    .map(([k]) => k)
    .filter((k) => AGENT_CLIS.includes(k));
  const clis = probed.length ? probed : await clisOn(h, AGENT_CLIS);
  const out: Candidate[] = clis.map((c) => ({
    id: c,
    kind: "cli",
    tools: true,
    why: probed.length ? "sonde du runner" : "command -v",
  }));
  if (withModels) {
    const reg = await modelsDev();
    for (const p of await listModels().catch(() => [])) {
      if (!p.available) continue;
      // Les fournisseurs CLI du pont (antigravity, claude) sont déjà couverts par les CLI du runner.
      if (p.provider === "antigravity" || p.provider === "claude") continue;
      for (const m of p.models) {
        const md = meta(reg, m.id);
        out.push({
          id: m.id,
          kind: "model",
          cost: md?.cost && (md.cost.input ?? 0) + (md.cost.output ?? 0),
          context: md?.limit?.context ?? m.context,
          tools: md?.tool_call,
          reasoning: md?.reasoning,
          why: md ? "llm_models + models.dev" : "llm_models",
        });
      }
    }
  }
  return out;
}

/** Liste `providers` ordonnée pour une étape sur un hôte. Vide si aucun moteur ne convient. */
export function rank(
  host: string,
  all: Candidate[],
  needs: Needs,
  health: Health,
  cooling: string[] = [],
): string[] {
  const re = (xs?: string[]) => (xs ?? []).map((x) => new RegExp(x, "i"));
  const only = re(needs.only);
  const ignore = re(needs.ignore);
  const usable = (id: string) =>
    (!only.length || only.some((r) => r.test(id))) &&
    !ignore.some((r) => r.test(id)) &&
    !cooling.includes(sane(id)) &&
    !health.cooling(host, id);
  const fits = (c: Candidate) =>
    usable(c.id) &&
    (!needs.edit || c.kind === "cli") &&
    (!needs.tools || c.tools !== false) &&
    (!needs.reasoning || c.reasoning !== false) &&
    (!needs.context || !c.context || c.context >= needs.context);
  const pool = all.filter(fits);
  const score = (c: Candidate) => {
    const s = health.stats(host, c.id);
    const rel = (s.ok + 1) / (s.n + 2);
    switch (needs.prefer) {
      case "cost":
        return -(c.cost ?? Number.MAX_SAFE_INTEGER / 2) + rel * 1e-6;
      case "latency":
        return -(s.p50 || 60_000) + rel;
      default:
        return rel - (s.p50 || 60_000) * 1e-9;
    }
  };
  const ranked = [...pool].sort((a, b) => score(b) - score(a)).map((c) => c.id);
  const wanted: string[] = [];
  for (const m of needs.models ?? []) {
    const cli = m.split(":")[0]!;
    const present = all.some((c) => c.id === m || c.id === cli);
    if (!present || !usable(m)) continue;
    if (needs.edit && !AGENT_CLIS.includes(cli)) continue;
    wanted.push(m);
    if (m.includes(":") && pool.some((c) => c.id === cli)) wanted.push(cli);
  }
  return [...new Set([...wanted, ...ranked])];
}
