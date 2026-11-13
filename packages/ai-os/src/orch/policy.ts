// Point de validation des effets externes (publication, envoi de message, dépense) : refus par défaut.
// Seule une règle explicite du propriétaire dans .agents/owner-rules.json les autorise :
//   { "rules": [ { "effect": "external", "step": "<regex>", "command": "<regex>", "granted": "AAAA-MM-JJ", "note": "…" } ] }
// Les deux expressions sont ancrées (correspondance complète) : "step" vise l'identifiant exact d'une étape (une étape
// générée « publish.x » ne profite pas d'une règle « publish »), "command" la ligne complète d'une étape cmd ou d'une
// commande d'agent (garde pre-tool-guard). Une règle sans "step" ne vaut que pour le garde.
// Le fichier n'est écrit que par le propriétaire (absent = tout effet externe refusé). Le même fichier sert au garde
// .agents/scripts/pre-tool-guard.ts (AGENT_GUARD=enforce) pour les commandes de publication lancées par un agent.
// Une étape refusée n'est pas exécutée : elle passe à l'état « held » et son contenu (brouillon) est mis en file
// dans var/agents/outbox/<run>/<étape>.json pour relecture.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type OwnerRule = {
  effect: "external";
  step?: string;
  command?: string;
  granted?: string;
  note?: string;
};

export function ownerRules(root: string): OwnerRule[] {
  const f = join(root, ".agents", "owner-rules.json");
  if (!existsSync(f)) return [];
  try {
    const j = JSON.parse(readFileSync(f, "utf8"));
    return Array.isArray(j.rules)
      ? j.rules.filter(
          (r: any) =>
            r?.effect === "external" &&
            (typeof r.step === "string" || typeof r.command === "string"),
        )
      : [];
  } catch {
    return [];
  }
}

const full = (re: string, s: string) => {
  try {
    return new RegExp(`^(?:${re})$`).test(s);
  } catch {
    return false;
  }
};

/** Règle qui autorise l'effet externe de cette étape, ou null (refus). */
export function allowExternal(
  root: string,
  step: string,
  command = "",
): OwnerRule | null {
  return (
    ownerRules(root).find(
      (r) =>
        typeof r.step === "string" &&
        full(r.step, step) &&
        (r.command === undefined || full(r.command, command)),
    ) ?? null
  );
}

/** Met un effet externe refusé en file pour le propriétaire ; renvoie le chemin relatif à la racine. */
export function hold(
  root: string,
  run: string,
  step: string,
  payload: unknown,
): string {
  const rel = join("var", "agents", "outbox", run);
  mkdirSync(join(root, rel), { recursive: true });
  const f = join(rel, `${step.replace(/[^\w.-]/g, "_")}.json`);
  writeFileSync(
    join(root, f),
    JSON.stringify(
      {
        run,
        step,
        held_at: new Date().toISOString(),
        reason:
          "effet externe sans règle du propriétaire (.agents/owner-rules.json)",
        payload,
      },
      null,
      2,
    ),
  );
  return f.replace(/\\/g, "/");
}
