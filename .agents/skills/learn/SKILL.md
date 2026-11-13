---
name: learn
description: Boucle d'apprentissage locale (façon Hermes). Distille ~/.claude/learning/journal.jsonl en mémoires (un fait par fichier), fusionne/supprime les doublons et entrées périmées, et crée des skills à partir de procédures réussies répétées. Utiliser sur demande « learn », en fin de grosse tâche, ou quand le digest de début de session signale des entrées en attente.
---
Tout reste local. Aucune archive : on supprime ou on fusionne.

1. `bun ${CLAUDE_PLUGIN_ROOT}/skills/learn/scripts/digest.ts` : agrège le journal non traité (erreurs récurrentes, corrections du propriétaire, récupérations échec->succès, par projet) et liste les mémoires existantes avec leurs descriptions.
2. Mémoires (`~/.claude/projects/<projet>/memory/`, ou le projet du `cwd` de l'entrée) :
   - un fait durable par fichier `<slug>.md`, frontmatter `name`, `description` (une ligne, concrète), `metadata.type` (`user` | `feedback` | `project` | `reference`) ; corps : le fait, puis `**Why:**` et `**How to apply:**`.
   - Corrections du propriétaire -> `feedback`. Erreur répétée avec contournement trouvé -> `reference`.
   - Avant d'écrire : si un fichier couvre déjà le sujet, le mettre à jour ; fusionner les doublons (garder un fichier, supprimer les autres) ; supprimer ce qui est contredit ou obsolète (chemin disparu, outil retiré).
   - `MEMORY.md` = index, une ligne par fichier : `- [Titre](fichier.md) — accroche`. Pas d'autre contenu.
   - Ignorer le bruit ponctuel (faute de frappe, erreur unique sans leçon).
3. Skills d'expérience : une procédure réussie vue ≥2 fois (mêmes commandes/étapes) et non couverte -> `C:\src\.agents\skills\<nom>\SKILL.md` (source unique, exposé à tous les agents par le plugin aphrody-skills ; commiter aussitôt) (frontmatter `name`, `description` déclencheuse ; corps : étapes minimales, commandes exactes vérifiées). Améliorer un skill existant plutôt qu'en créer un voisin.
4. `bun ${CLAUDE_PLUGIN_ROOT}/skills/learn/scripts/digest.ts --done` : marque le journal traité (tronque les entrées traitées).
Rapport : 3 lignes (mémoires créées/fusionnées/supprimées, skills créés).
