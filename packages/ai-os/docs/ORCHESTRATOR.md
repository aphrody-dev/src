# Orchestrateur multi-agents (`ai-os orch`)

État du 2026-11-13. Code : `src/orch/` ; tests : `test/orch/` ; preuve : `fixtures/orch/proof.json`.

L'orchestrateur exécute un graphe d'étapes calculé à l'exécution, en parallèle, sur les hôtes de la flotte. Il choisit pour chaque étape un moteur parmi ceux réellement disponibles (CLI d'agents et modèles découverts). Il bascule quand un moteur ou un hôte échoue, ouvre des tickets de correction, s'arrête sur ses budgets et retient tout effet externe tant que le propriétaire ne l'a pas autorisé par une règle.

## Couches

| Couche                                                                            | Propriétaire                                  | Rôle                                                                                                                                                  |
| --------------------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ai-os/src/orch`                                                         | ai-os (ce document)                           | graphe, routage, bascule, réparation, cycle de vie, garde-fous                                                                                        |
| `infra/agents/runner.ts`, `infra/agents/fleet.toml`, `docs/agents/AGENT-FIRST.md` | labs-1b                                       | exécution sur les hôtes : une session tmux par hôte (une fenêtre par rôle), file `var/agents/queue`, commit borné aux chemins, contrôle d'acceptation |
| `src/llm`                                                                         | ai-os                                         | fournisseurs et modèles découverts (`llm_models`, `llm_ask`)                                                                                          |
| `src/relay`                                                                       | ai-os                                         | outils `orch_run`, `orch_engines`, `fleet_status`, `gemini_review` (MCP, A2A, JSON-RPC)                                                               |
| ssh, WireGuard, cloudflared                                                       | agent infra (`ay auth`, `docs/infra/AUTH.md`) | accès aux hôtes ; l'orchestrateur ne crée aucun tunnel                                                                                                |

Hôtes : `infra/agents/fleet.toml` (`[hosts.*]`, rôles, checkout du runner), croisé avec `infra/deploy.toml` (`ssh_alias`, `role`). Un nœud de rôle `build` (fr1, réservé à Chromium et LLVM) est exclu d'office. Plafond par hôte : `ORCH_MAX_AGENTS_<HOTE>`, sinon `ORCH_MAX_AGENTS`, sinon 3 en local et 2 à distance.

## Commandes

```sh
just orch hosts                       # hôtes, état des runners (heartbeat, sonde des CLI, refroidissements)
just orch engines --edit              # candidats et liste `providers` calculée, par hôte
just orch engines --model agy:<modèle>
just orch health                      # refroidissements et issues observées (hôte, fournisseur)
just orch run fixtures/orch/proof.json
just orch plan "<objectif>"           # un planificateur produit le graphe, qui est ensuite exécuté
just lifecycle --task "<tâche>" --paths packages/ai-os [--apply]
just orch design aphrody [--url https://aphrody.com]
just orch market aphrody "<brief>"
```

Toutes les commandes écrivent du JSON sur stdout. Les événements partent en JSONL sur stderr (sauf avec `--quiet`) et dans `$AGENT_HOME/orch/runs/<run>.jsonl`. Le code de sortie est 0 si toutes les étapes sont `done` ou `held`. Les mêmes fonctions sont exposées par le relais : `orch_run` et `orch_engines`.

## Format d'un workflow

````json
{
  "name": "…",
  "limits": { "maxSteps": 48, "budgetUsd": 20 },
  "steps": [
    {
      "id": "a",
      "do": "cmd",
      "hosts": ["prd"],
      "run": "nice -n 19 cargo test -j 4",
      "timeout_s": 3600
    },
    {
      "id": "b",
      "do": "agent",
      "role": "reviewer",
      "deps": ["a"],
      "needs": { "context": 100000 },
      "prompt": "Relis :\n{{a}}",
      "out": "docs/reviews/claude-2026-11-13-x.md"
    },
    {
      "id": "c",
      "do": "agent",
      "role": "coder",
      "deps": ["b"],
      "needs": { "edit": true },
      "prompt": "Corrige :\n{{b}}",
      "check": "bun check",
      "commit": { "paths": ["packages/ai-os"], "message": "…" }
    },
    { "id": "d", "do": "tool", "tool": "fleet_status", "args": {} },
    {
      "id": "e",
      "do": "agent",
      "role": "sre",
      "expand": true,
      "prompt": "… réponds par ```json {\"steps\":[…]} ```"
    }
  ]
}
````

| Champ                | Effet                                                                                                                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `do`                 | `cmd` : ligne sh lancée dans le checkout de l'hôte, ou dans `$HOME` avec `"repo": false` ; `agent` : sous-agent ; `tool` : outil du relais                                                                                            |
| `deps`, `{{id}}`     | ordre du graphe ; `{{id}}` reçoit la sortie de l'étape `id` (20 000 caractères au plus)                                                                                                                                               |
| `hosts`              | hôtes admis, dans l'ordre de préférence ; à défaut, ceux dont `fleet.toml` liste le rôle, l'hôte local en tête                                                                                                                        |
| `needs`              | besoins déclarés pour le routage (section suivante)                                                                                                                                                                                   |
| `check`, `commit`    | transmis au runner : contrôle d'acceptation, puis commit limité aux préfixes de `paths`                                                                                                                                               |
| `expand`             | la sortie peut ajouter des étapes (`{"steps":[…]}`). Leurs identifiants sont préfixés par celui du parent. Elles héritent de ses restrictions (effet externe, chemins de commit). Les ajouts sont bornés par `maxSteps` et `maxDepth` |
| `out`                | la sortie est écrite dans un fichier, sous `docs/reviews/` ou `var/` uniquement                                                                                                                                                       |
| `effect: "external"` | publication, envoi ou dépense : l'étape est retenue (voir « Point de validation »)                                                                                                                                                    |
| `onFail`             | `fix` (défaut pour `cmd`) ouvre un ticket de correction ; `continue` laisse passer les dépendants ; `stop` les fait sauter                                                                                                            |

Exécution d'une étape `agent` :

- si un worker du rôle bat sur l'hôte (`state/heartbeat-<rôle>` de moins de 2 minutes), la tâche part dans la file du runner, au format v1 de `docs/agents/AGENT-FIRST.md` : `queue/tmp`, puis renommage dans `queue/new`. L'orchestrateur lit ensuite `results/<id>/result.json` et le journal de la tentative acceptée ;
- sinon, une étape en lecture seule (relecture, jugement, plan, brouillon) est lancée directement : CLI en mode plan ou en bac à sable lecture seule, à distance par ssh avec `nice -n 19` et `timeout`, en local en priorité BELOW_NORMAL ;
- une étape qui modifie des fichiers passe toujours par la file : seul le runner sait borner les commits et juger avec `check`.

## Routage déclaratif (`select.ts`)

Une étape décrit ses besoins dans `needs`. Aucune liste de modèles n'est écrite dans le code.

- `edit` : l'étape modifie des fichiers. Seules les CLI d'agents conviennent, car `llm_ask` ne répond qu'en texte.
- `tools`, `reasoning`, `context` : filtres appliqués aux métadonnées models.dev (`tool_call`, `reasoning`, `limit.context`).
- `prefer` : `reliability` (par défaut), `cost` ou `latency`, comme `provider.sort` d'OpenRouter.
- `only`, `ignore` : expressions régulières sur l'identifiant, comme `provider.only` et `provider.ignore` d'OpenRouter.
- `models` : modèles souhaités, essayés d'abord (le paramètre `models` d'OpenRouter, l'option `gateway.models` de l'AI Gateway). `cli:modèle` est suivi de `cli`, son modèle par défaut.

Construction de la liste des candidats :

- les CLI que le runner sait lancer (`claude`, `codex`, `opencode`, `pi`, `agy`), présentes sur l'hôte : sonde `state/health.json` du runner, sinon `command -v` ;
- sur l'hôte local, les modèles de `llm_models`, enrichis par `https://models.dev/api.json` (cache de 24 h dans `$AGENT_HOME`).

Le tri s'appuie sur la santé apprise par hôte et par fournisseur (`$AGENT_HOME/orch.sqlite`) : taux de succès lissé, latence p50, coût. Sont exclus :

- les fournisseurs en refroidissement local ;
- les fichiers `state/cooldown-*` du runner ;
- les clés déjà essayées pour l'étape.

Le résultat est la liste `providers` de la tâche v1, que le runner essaie dans l'ordre.

## Bascule et réparation

| Classe (`classify.ts`) | Signal                                              | Action                                                                             |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `quota`                | 402, crédits, quota de compte, `RESOURCE_EXHAUSTED` | refroidissement de 15 min doublé à chaque échec, fournisseur suivant sans attendre |
| `throttle`             | 429 / rate limit sans texte de quota                | une relance après `Retry-After` (60 s au plus), puis fournisseur suivant           |
| `auth`                 | session expirée, 401/403                            | écarté 6 h sur cet hôte, fournisseur suivant                                       |
| `missing`              | binaire ou checkout absent (127)                    | hôte suivant ; pas de ticket de correction                                         |
| `context`, `policy`    | contexte dépassé, refus de contenu                  | fournisseur suivant                                                                |
| `timeout`, `overload`  | délai, 5xx, réseau                                  | une relance, puis fournisseur suivant                                              |
| `task`                 | le moteur a répondu, la tâche a échoué              | `cmd` : ticket de correction ; `agent` : fournisseur suivant                       |

Quand aucun fournisseur d'un hôte ne répond, l'étape passe à l'hôte suivant de `hosts`. Une tâche déjà en file est retirée (`queue/failed`) si toutes ses tentatives sont `provider_unavailable`.

Ticket de correction : une étape `cmd` en échec engendre `<id>#fix<n>`, une étape `agent`. Elle prend le rôle `coder` avec `needs.edit` et reçoit la fin de la sortie. Son `check` est la commande elle-même. Les dépendants attendent le ticket. Il y a au plus `fixRounds` tickets par étape (`ORCH_FIX_ROUNDS`, 1 par défaut). Le runner ajoute son propre tour d'auto-correction par fournisseur.

## Garde-fous

| Limite                                                                                                 | Défaut                   | Variable                   |
| ------------------------------------------------------------------------------------------------------ | ------------------------ | -------------------------- |
| étapes, générées comprises                                                                             | 48                       | `ORCH_MAX_STEPS`           |
| profondeur d'expansion                                                                                 | 3                        | `ORCH_MAX_DEPTH`           |
| budget en $ (somme des `budget_usd` confiés à la file ; le runner les applique par `--max-budget-usd`) | 20                       | `ORCH_BUDGET_USD`          |
| jetons des exécutions directes                                                                         | 2 000 000                | `ORCH_TOKEN_BUDGET`        |
| échéance                                                                                               | 4 h                      | `ORCH_DEADLINE_MS`         |
| échecs consécutifs avant arrêt                                                                         | 4                        | `ORCH_MAX_FAILS`           |
| agents simultanés par hôte                                                                             | 3 en local, 2 à distance | `ORCH_MAX_AGENTS[_<HOTE>]` |

Autres garde-fous :

- détection de cycle ;
- aucune boucle sans fin : chaque étape a un délai, chaque relance un nombre borné d'essais ;
- priorité basse partout ;
- compilation et conteneurs sur prd uniquement (`nice -n 19`, `-j 4`).

## Point de validation des effets externes

Les effets externes sont refusés par défaut : publication, envoi de message, dépense.

- **Étape marquée `effect: "external"`** (ou héritée d'un parent qui l'est) : elle n'est exécutée que si une règle de `.agents/owner-rules.json` l'autorise. Les expressions sont ancrées (correspondance complète) : `step` vise l'identifiant exact de l'étape (une étape générée `publish.x` ne profite pas d'une règle `publish`), `command` facultatif sa ligne de commande. Une règle sans `step` ne vaut que pour le garde des agents. Ce fichier n'est écrit que par le propriétaire :
  ```json
  {
    "rules": [
      {
        "effect": "external",
        "step": "publish-aphrody-blog",
        "command": "bun run --cwd apps/aphrody publish-blog",
        "granted": "AAAA-MM-JJ",
        "note": "…"
      }
    ]
  }
  ```
- **Sans règle**, l'étape prend l'état `held` : son contenu (brouillon, consigne remplie) est mis en file dans `var/agents/outbox/<run>/<étape>.json`. Les brouillons marketing de `just orch market` sont écrits dans `var/agents/outbox/<produit>-<date>.md`, et rien n'est publié.
- **Tâches de file** : une étape externe autorisée part avec `approval: "none"` ; les autres tâches `growth` partent avec `approval: "owner"`, que le runner ne commite jamais. Une étape externe ne s'exécute jamais en direct (lecture seule) : sans worker, elle échoue au lieu de paraître faite.
- **Commandes lancées par les agents eux-mêmes** : le garde `.agents/scripts/pre-tool-guard.ts` (`AGENT_GUARD=enforce`) bloque, sauf règle `command` correspondante dans le même fichier :
  - `npm|bun|cargo|… publish` et `gh release create` ;
  - les envois `resend` ;
  - les outils MCP d'envoi, de publication ou de paiement.

## Cycle de vie (`lifecycle.ts`)

`just lifecycle` enchaîne, sans humain :

1. code (sous-agent `coder`, si `--task`) ;
2. `bun fmt --check` des chemins (un écart ouvre un ticket coder qui formate et commite) ; synchronisation git unique de prd ;
3. en parallèle : `bun check`, `ay arch check --strict`, et `cargo clippy` sur prd ;
4. tests : `bun test` (paquets), `cargo test` et `go test` sur prd ;
5. juges en parallèle :
   - Gemini web via `gemini_review` (Chrome du relais) ;
   - un juge Claude (rôle `reviewer`, contexte ≥ 100 000) ;
   - verdicts écrits dans `docs/reviews/<juge>-<date>-<sujet>.md` ;
6. correction des défauts vérifiés (`check` : `bun check && ay arch check --strict`) ;
7. `docker build --target runtime` sur prd (Alpine, `Dockerfile` racine) ;
8. `ay deploy up --all --dry-run` (`--apply` pour déployer) ;
9. `fleet_status` ;
10. optimisation : un agent `sre` propose au plus 3 tâches, ajoutées au graphe (`expand`).

Variantes produit :

- `design` : PRD et DESIGN.md (`gds plan`), puis `gds verify`, `wck`, et un juge ;
- `market` : faits issus de `git log`, brouillons rédigés, publication `held`.

## Preuve d'exécution (2026-11-13, `fixtures/orch/proof.json`)

Run `20261113T013445-proof-fleet-vycu` (26,8 s, ok), après la mise en service des runners sur pc, prd et fr2 : les étapes `agent` passent par les files v1.

| Étape            | Hôte     | Tentatives                                                                                        |
| ---------------- | -------- | ------------------------------------------------------------------------------------------------- |
| pc-gemini        | pc       | file : `agy:gemini-4-carbon-high` exclu (refroidissement quota appris au run précédent), `agy` ok |
| pc-claude        | pc       | file : `claude` ok                                                                                |
| prd-agent        | prd      | file : `claude` exclu sur prd (refroidissement auth appris), routé sur `opencode`, ok             |
| prd-sys, fr2-sys | prd, fr2 | commandes en parallèle, `nice=19`                                                                 |
| plan             | pc       | file : `claude` ok ; plan.disk-prd et plan.disk-fr2 générés à l'exécution, ok                     |
| publish          | —        | `held`                                                                                            |

Run `20261113T010749-proof-fleet-p9kk` (14,9 s, exécution directe, avant les runners) :

| Étape     | Hôte        | Tentatives                                                                                                    |
| --------- | ----------- | ------------------------------------------------------------------------------------------------------------- |
| pc-gemini | pc          | `agy:gemini-4-carbon-high` quota (épuisé), puis `agy` ok                                                      |
| pc-claude | pc          | `claude` ok                                                                                                   |
| prd-agent | prd puis pc | `prd/claude` auth (session OAuth expirée sur prd), puis `pc/claude` ok                                        |
| prd-sys   | prd         | ok : `nproc=8 nice=19`, tmux 3.8, bun 1.4.4                                                                   |
| fr2-sys   | fr2         | ok : `nproc=6 nice=19`, tmux 3.7b, bun 1.4.4                                                                  |
| plan      | pc          | `claude` ok ; deux étapes générées à l'exécution : plan.disk-prd (prd) et plan.disk-fr2 (fr2), toutes deux ok |
| publish   | —           | `held` : effet externe sans règle, mis en file dans `var/agents/outbox/`                                      |

Revue Gemini (Carbon High, gemini.google.com) : 9,5/20, verdict et suites dans `docs/reviews/gemini-2026-11-13-orch.md`.

## Parallèle avec les projets de référence (relevé du 2026-11-13)

| Projet                                     | Ce qui est repris                                                                                                                                                                                                                                                                                                                                                      | Source                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| opencode @c5a1532                          | registre de modèles avec coût, contexte, `tool_call`, `reasoning` (models.dev) ; classes d'erreur séparant quota (402, ou 429 avec un texte de quota) et throttle (429) ; sous-agents déclarés en données, sans délégation récursive                                                                                                                                   | `third_party/opencode` : `packages/core/src/models-dev/v1.ts:9-60`, `packages/ai/src/provider-error.ts:230-266`, `packages/ai/src/schema/errors.ts:69-215`, `packages/core/src/plugin/agent.ts:55-95`                                                                                                                                          |
| opencode (contre-exemple)                  | son « small model » choisi dans une liste de familles écrite en dur : non repris                                                                                                                                                                                                                                                                                       | `packages/core/src/model.ts:307-319`                                                                                                                                                                                                                                                                                                           |
| OpenRouter                                 | `models` en liste de repli ; `provider.only` / `ignore` / `sort` ; 402 = crédits (sans relance), 429 et 503 avec `Retry-After`                                                                                                                                                                                                                                         | https://openrouter.ai/docs/guides/routing/model-fallbacks, https://openrouter.ai/docs/guides/routing/provider-selection, https://openrouter.ai/docs/api/reference/errors-and-debugging                                                                                                                                                         |
| Vercel AI SDK @2ebc78b, AI Gateway         | registre de fournisseurs adressé par `fournisseur:modèle` ; `isRetryable` pour 408, 409, 429 et ≥ 500 ; `Retry-After` borné à 60 s ; `gateway.models` / `order` ; essais tracés par modèle                                                                                                                                                                             | `third_party/vercel-ai` : `packages/ai/src/registry/provider-registry.ts:176-199`, `packages/provider/src/errors/api-call-error.ts:28-32`, `packages/ai/src/util/retry-with-exponential-backoff.ts:27-66`, `packages/gateway/src/gateway-provider-options.ts:58-145` ; https://vercel.com/docs/ai-gateway/models-and-providers/model-fallbacks |
| Google ADK js @13912a9, python @df9f9d0    | routeur rappelé après chaque échec avec les clés déjà essayées ; repli seulement avant toute sortie ; séquentiel, parallèle et boucle bornée (`maxIterations`) ; agent utilisé comme outil                                                                                                                                                                             | `third_party/adk-js` : `core/src/utils/failover_utils.ts:22-75`, `core/src/agents/loop_agent.ts:22,88` ; `third_party/adk-python` : `src/google/adk/models/_fallback_model.py:207-280`                                                                                                                                                         |
| A2A                                        | carte d'agent avec skills et capacités (servie par le relais)                                                                                                                                                                                                                                                                                                          | `third_party/adk-js/core/src/a2a/agent_card.ts:379-459`                                                                                                                                                                                                                                                                                        |
| OpenAI Agents SDK js @7589b9c              | `maxTurns` borné avec erreur typée ; garde-fous d'entrée et de sortie ; agents utilisés comme outils (`asTool`)                                                                                                                                                                                                                                                        | `third_party/openai-agents-js` : `packages/agents-core/src/runner/constants.ts:2`, `packages/agents-core/src/agent.ts:355-447,765`                                                                                                                                                                                                             |
| Claude Agent SDK 0.3.323 (npm, 2026-11-12) | `fallbackModel`, `maxTurns`, `maxBudgetUsd`, hooks PreToolUse, `permissionMode`. Le SDK lance le binaire Claude Code (`spawn`, `--output-format stream-json`) et embarque Claude Code 2.1.323 en dépendances optionnelles par plateforme. ai-os pilote donc directement la CLI `claude` (2.1.322 sur le PC) : pas de dépendance npm, conformément à la règle du paquet | `npm view @anthropic-ai/claude-agent-sdk` (version 0.3.323, `claudeCodeVersion` 2.1.323, peer `zod`, `@anthropic-ai/sdk`, `@modelcontextprotocol/sdk`) ; types relevés sur le paquet 0.3.312 (`sdk.d.ts`)                                                                                                                                      |
| Cursor                                     | agents cloud parallèles et isolés ; modèle explicite ou défaut utilisateur → équipe → système ; critères du mode « Auto » non publiés                                                                                                                                                                                                                                  | https://cursor.com/docs/cloud-agent, https://cursor.com/docs/cloud-agent/api/endpoints, https://cursor.com/docs/models                                                                                                                                                                                                                         |
| LiteLLM Router @a7052ea8                   | refroidissement par déploiement après échecs (429, 401, 402, 404, 408, 5xx) ; replis distincts pour dépassement de contexte et refus de contenu ; routage par coût et par latence                                                                                                                                                                                      | `third_party/litellm` : `litellm/router_utils/cooldown_handlers.py:285-331`, `litellm/router_utils/fallback_event_handlers.py:265-275`, `litellm/router.py:80-115`                                                                                                                                                                             |
