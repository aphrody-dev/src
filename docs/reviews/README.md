# Revues de src : le tribunal `ai-os review`

Toute revue de livrable passe par une seule commande, sans humain et sans navigateur :

```sh
just review <chemins|diff|A..B|commit> [-- chemins] [--voices gemini,claude,judge] [--threshold 16] [--fix]
# équivalent : bun packages/ai-os/src/cli.ts review …
```

- **Trois voix.** Gemini (Google, Chromium, Python, Go) et Claude (Rust, bun) plaident en parallèle. Le juge neutre (C, C++, natif) reçoit ensuite les deux plaidoiries, contre-vérifie chaque grief et tranche. Sa note est la note finale. Sans juge, c'est la plus basse des deux voix qui compte.
- **Moteurs.** Aucun modèle n'est codé en dur. `packages/ai-os/config/review.json` déclare seulement des familles de moteurs par voix et des classes de tâche (`config/model-routing.json`). L'ordre vient de `orch/select.ts` : CLI d'agents (agy, claude, codex…), modèles de `llm_models`, santé observée. L'appel passe par `orch/inline.ts` en lecture seule. Chaque voix a un délai (`timeout_s`) ; un échec, ou une réponse sans note, fait passer au moteur suivant. Un modèle du pont dont le contexte est trop petit pour la consigne est écarté.
- **Dédoublonnage.** Le client sortant du relais (`relay/outbound.ts`) calcule une clé sha256 sur la consigne et le moteur. Il partage les appels identiques en vol (singleflight) et garde la réponse 24 h dans `var/review/cache.sqlite`. `--no-cache` désactive ce cache.
- **Ancrage.** Chaque revue reçoit :
  - les listes de contrôle de [CHECKLISTS.md](CHECKLISTS.md), distillées des verdicts passés ;
  - les extraits pertinents des sources officielles Google, choisis selon le sujet des fichiers revus : Chromium styleguide et code_reviews, depot_tools, google/eng-practices, google/styleguide, ChromiumOS, Android Soong, Bazel.

  Les sources sont lues dans le dépôt officiel : `gh api` pour GitHub, gitiles pour googlesource. Elles sont mises en cache dans `var/review/sources/`, ignoré par git, et rafraîchies au plus une fois par jour, avec le commit source noté. `ai-os review sources --force` force le rafraîchissement.
- **Garde-fous.** Le slug est confiné à `docs/reviews` (`^[a-z0-9][a-z0-9-]{0,63}# Revues de src : le tribunal `ai-os review`

Toute revue de livrable passe par une seule commande, sans humain et sans navigateur :

```sh
just review <chemins|diff|A..B|commit> [-- chemins] [--voices gemini,claude,judge] [--threshold 16] [--fix]
# équivalent : bun packages/ai-os/src/cli.ts review …
```

- **Trois voix.** Gemini (Google, Chromium, Python, Go) et Claude (Rust, bun) plaident en parallèle. Le juge neutre (C, C++, natif) reçoit ensuite les deux plaidoiries, contre-vérifie chaque grief et tranche. Sa note est la note finale. Sans juge, c'est la plus basse des deux voix qui compte.
- **Moteurs.** Aucun modèle n'est codé en dur. `packages/ai-os/config/review.json` déclare seulement des familles de moteurs par voix et des classes de tâche (`config/model-routing.json`). L'ordre vient de `orch/select.ts` : CLI d'agents (agy, claude, codex…), modèles de `llm_models`, santé observée. L'appel passe par `orch/inline.ts` en lecture seule. Chaque voix a un délai (`timeout_s`) ; un échec, ou une réponse sans note, fait passer au moteur suivant. Un modèle du pont dont le contexte est trop petit pour la consigne est écarté.
- **Dédoublonnage.** Le client sortant du relais (`relay/outbound.ts`) calcule une clé sha256 sur la consigne et le moteur. Il partage les appels identiques en vol (singleflight) et garde la réponse 24 h dans `var/review/cache.sqlite`. `--no-cache` désactive ce cache.
- **Ancrage.** Chaque revue reçoit :
  - les listes de contrôle de [CHECKLISTS.md](CHECKLISTS.md), distillées des verdicts passés ;
  - les extraits pertinents des sources officielles Google, choisis selon le sujet des fichiers revus : Chromium styleguide et code_reviews, depot_tools, google/eng-practices, google/styleguide, ChromiumOS, Android Soong, Bazel.

  Les sources sont lues dans le dépôt officiel : `gh api` pour GitHub, gitiles pour googlesource. Elles sont mises en cache dans `var/review/sources/`, ignoré par git, et rafraîchies au plus une fois par jour, avec le commit source noté. ). Les fichiers ignorés par git et les fichiers de secrets (`.env*`, clés) sont écartés, et le contenu est expurgé avant d'aller au moteur ou dans un verdict (motifs de `nhitl/index.ts`). Une revue tronquée, ou à laquelle il manque une voix, finit au mieux « incomplet », jamais « conforme ».
- **Sortie.** L'outil écrit :
  - `docs/reviews/<voix>-<date>-<slug>.md` : note /20, moteur, essais, sources avec leur commit, listes appliquées, verdict brut ;
  - une ligne de [INDEX.md](INDEX.md), remplacée à chaque nouveau tour.

  Code de sortie : 0 si la revue est conforme ou en `--dry-run` ; 1 si elle est sous le seuil, incomplète ou gelée ; 2 si aucun moteur n'a répondu.
- **Correction automatique (`--fix`).** Si la note reste sous le seuil, l'outil ouvre un ticket coder de l'orchestrateur sur les fichiers revus, avec un commit borné poussé sur main par le runner, puis relit main à jour. La revue est gelée après deux tours sans progrès (`docs/ALPHABET.md`, « Arrêt et gel »). Il n'y a pas de correction automatique sur `diff` (arbre de travail local).
- **NHITL.** Une voix sans moteur est indexée dans `var/agents/nhitl.sqlite` (source `review`, catégorie `engine_missing`) et repasse à `fixed` dès qu'un moteur répond.
- **Automatisation.**
  - `ai-os orch lifecycle` et `design` passent par l'outil `review` du relais (MCP, A2A, JSON-RPC).
  - Le job `review` de `judge.yml` juge chaque push sur main. Ce job est indicatif : il ne bloque rien et ne déclenche pas ci-revert. Le verdict va dans le résumé du run.
  - Rien de lourd ne tourne : la revue ne fait que des appels réseau, sans compilation (règle de charge de prd sans objet).
- **Archives.**
  - Les anciens verdicts, rendus par Gemini web, sont `gemini-*` et `judge-*`.
  - Les revues automatiques par commit, venues du hook `relay/hook.ts`, sont dans `auto/`.
  - `ai-os review mine` recompte leurs notes.
