// Point de validation des effets externes (publication, envoi de message, dépense) : refus par défaut.
// Seule une règle explicite du propriétaire dans .agents/owner-rules.json les autorise, étape par étape :
//   { "rules": [ { "effect": "external", "match": "<regex sur l'id d'étape ou la commande>", "granted": "AAAA-MM-JJ", "note": "…" } ] }
// Le fichier n'est écrit que par le propriétaire (absent = tout effet externe refusé). Le même fichier sert au garde
// .agents/scripts/pre-tool-guard.ts (AGENT_GUARD=enforce) pour les commandes de publication lancées par un agent.
// Une étape refusée n'est pas exécutée : elle passe à l'état « held » et son contenu (brouillon) est mis en file
// dans var/agents/outbox/<run>/<étape>.json pour relecture.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type OwnerRule = {
  effect: "external";
  match: string;
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
          (r: any) => r?.effect === "external" && typeof r.match === "string",
        )
      : [];
  } catch {
    return [];
  }
}

/** Règle qui autorise cet effet externe, ou null (refus). */
export function allowExternal(root: string, subject: string): OwnerRule | null {
  for (const r of ownerRules(root))
    try {
      if (new RegExp(r.match, "i").test(subject)) return r;
    } catch {}
  return null;
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
