// Sélection déclarative des moteurs : une étape décrit ses besoins (édition, outils, contexte, préférence de tri,
// listes d'autorisation/d'exclusion, modèles souhaités) et reçoit la liste `providers` ordonnée que le runner essaie
// dans l'ordre. Rien n'est figé : candidats = CLI d'agents présentes sur l'hôte + modèles découverts par le pont
// (llm_models), métadonnées de models.dev (registre d'opencode : coût, contexte, tool_call, reasoning), santé observée
// (health.ts) et refroidissements du runner. Parallèles et sources : docs/ORCHESTRATOR.md.
import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
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
type Registry = Record<string, { models?: Record<string, Meta> }>;
let registry: { at: number; data: Registry } | undefined;

/** models.dev/api.json, en cache 24 h dans $AGENT_HOME ; vide hors ligne. */
export async function modelsDev(): Promise<Registry> {
  if (
    registry &&
    Object.keys(registry.data).length &&
    Date.now() - registry.at < 864e5
  )
    return registry.data;
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
      if (r.ok) {
        const text = await r.text();
        registry = { at: Date.now(), data: JSON.parse(text) };
        try {
          mkdirSync(dirname(f), { recursive: true });
          writeFileSync(f, text);
        } catch {}
        return registry.data;
      }
    } catch {}
  try {
    registry = { at: Date.now(), data: JSON.parse(readFileSync(f, "utf8")) };
  } catch {
    registry = { at: 0, data: {} };
  }
  return registry.data;
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
  // Sonde du runner : seuls les statuts positifs explicites comptent ; les CLI qu'elle ne cite pas sont cherchées
  // sur l'hôte.
  const probe = state?.clis ?? {};
  const positive = (v: unknown) =>
    v === true || /^(ok|ready|installed|v?\d)/i.test(String(v ?? ""));
  const probed = AGENT_CLIS.filter((k) => k in probe && positive(probe[k]));
  const unknown = AGENT_CLIS.filter((k) => !(k in probe));
  const found = unknown.length ? await clisOn(h, unknown) : [];
  const out: Candidate[] = [
    ...probed.map((c) => ({
      id: c,
      kind: "cli" as const,
      tools: true,
      why: "sonde du runner",
    })),
    ...found.map((c) => ({
      id: c,
      kind: "cli" as const,
      tools: true,
      why: "command -v",
    })),
  ];
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
  // Motifs venus d'un JSON généré : les invalides sont ignorés plutôt que de faire échouer l'étape.
  const re = (xs?: unknown[]) =>
    (Array.isArray(xs) ? xs : []).flatMap((x) => {
      try {
        return typeof x === "string" ? [new RegExp(x, "i")] : [];
      } catch {
        return [];
      }
    });
  const only = re(needs.only);
  const ignore = re(needs.ignore);
  const usable = (id: string) =>
    (!only.length || only.some((r) => r.test(id))) &&
    !ignore.some((r) => r.test(id)) &&
    !cooling.includes(sane(id)) &&
    !health.cooling(host, id);
  // Une CLI d'agent gère ses outils et son contexte ; un modèle du pont doit prouver chaque capacité exigée
  // (métadonnée absente = refus), et llm_ask ne câble pas d'outils.
  const fits = (c: Candidate) =>
    usable(c.id) &&
    (c.kind === "cli" ||
      (!needs.edit &&
        !needs.tools &&
        (!needs.reasoning || c.reasoning === true) &&
        (!needs.context ||
          (typeof c.context === "number" && c.context >= needs.context))));
  const pool = all.filter(fits);
  const score = (c: Candidate) => {
    const s = health.stats(host, c.id);
    const rel = (s.ok + 1) / (s.n + 2);
    switch (needs.prefer) {
      case "cost":
        return -(c.cost ?? 1e6) + rel * 1e-3;
      case "latency":
        return -(s.p50 || 60_000) + rel;
      default:
        return rel - (s.p50 || 60_000) * 1e-9;
    }
  };
  const ranked = [...pool].sort((a, b) => score(b) - score(a)).map((c) => c.id);
  const wanted: string[] = [];
  for (const m of needs.models ?? []) {
    if (typeof m !== "string") continue;
    const cli = m.includes(":") ? m.split(":")[0]! : m;
    // Le modèle souhaité passe les mêmes filtres que son moteur (capacités, refroidissement de la CLI).
    if (!pool.some((c) => c.id === cli) || !usable(m)) continue;
    wanted.push(m);
    if (m.includes(":") && pool.some((c) => c.id === cli)) wanted.push(cli);
  }
  return [...new Set([...wanted, ...ranked])];
}
