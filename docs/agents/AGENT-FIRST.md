# Agent-first : modèle d'exploitation de src

État au 2026-11-13. src est codé, relu, testé, corrigé, déployé et maintenu par des agents, sans humain dans la boucle. Le propriétaire n'intervient que pour publier les brouillons commerciaux (file `publish/`) et pour les gestes qui exigent son identité (UAC, OAuth).

## 1. Partage des responsabilités

| Couche | Propriétaire | Contenu |
|---|---|---|
| Orchestration, routage, choix du fournisseur/modèle | `packages/ai-os` (session nt-d6) | workflows dynamiques, bascule automatique, registre de modèles (relais `llm_models` / `llm_ask`, MCP `/mcp`, A2A `/a2a`) |
| Exécution sur les hôtes | `infra/agents/` (ce document) | sessions tmux, unités systemd user, tâche planifiée Windows, file de tâches, santé, redémarrage, journaux |
| Juge | `.github/workflows/judge.yml`, `ci.yml`, `ci-revert.yml` | verdict de chaque push sur main, revert automatique |
| Interface unique des agents | `justfile` | `check`, `fmt`, `lint`, `test`, `affected`, `test-affected`, `deploy`, `docker-*`, `agents*` |

Le runner ne choisit jamais un fournisseur : il exécute ce que la tâche nomme, dans l'ordre donné. Sans nom, il prend la réponse du relais `llm_models` (premier modèle de chaque fournisseur disponible, dans l'ordre du relais). Aucune chaîne statique n'existe dans `infra/agents`.

## 2. Rôles

| Rôle | Entrées | Sorties | Juge | Hôtes |
|---|---|---|---|---|
| `coder` | prompt, `cwd`, `commit.paths` | commit sur main | `check` de la tâche, puis `judge`/`ci` | prd, pc |
| `reviewer` | sha ou chemin | rapport `results/<id>/` | humain absent : verdict LLM (relais) ou Gemini Carbon pour les livrables | prd, pc |
| `tester` | unité, `just test-affected` | tests + commit | `check` = recette `just` | prd |
| `linter` | recette `fmt`/`lint` ciblée | commit de formatage | `bun fmt --check <dir>`, `cargo clippy` | prd, fr2 |
| `designer` | PRD, `DESIGN.md` (porte design-first d'AGENTS.md) | maquettes, tokens | `wck` / Lighthouse | pc |
| `deployer` | `just deploy <cible>` | déploiement | santé de la cible | prd |
| `sre` | `ci-watch` (CI rouge), `deps-update` | correctif commité | `judge` vert | prd, fr2 |
| `chromium` | tâches Chromium/LLVM uniquement | builds | factory (`docs/CHROMIUM-FACTORY.md`) | fr1 seul (refus à l'enqueue sinon) |
| `growth` | modèles `infra/agents/tasks/*` | brouillons dans `var/agents/publish/<id>/` | revue du propriétaire | prd, pc |

`growth` a `approval = "owner"` par défaut : la tâche finit `done`, ses fichiers sont déplacés dans `publish/<id>/` (`changes.patch`, `files/`, journaux, `README.txt`) et le checkout est restauré. Rien n'est publié, posté, envoyé ni déployé ; le propriétaire publie depuis cette file.

## 3. CLI et SDK (vérifiés dans la session)

context7, GitHub MCP et Microsoft Learn étaient injoignables (ENOTFOUND) : les versions viennent des registres (`registry.npmjs.org/<pkg>/latest`, `pypi.org/pypi/<pkg>/json`, lus depuis prd), de `--help` sur les binaires installés et de `gh api`.

| Outil | Dernière version (registre) | Installé | Mode headless utilisé par le runner |
|---|---|---|---|
| Claude Code `@anthropic-ai/claude-code` | 2.1.323 | pc 2.1.322, fr1 2.1.322, prd 2.1.318, fr2 2.1.302 | `claude -p --permission-mode bypassPermissions --output-format json --max-turns 200 --max-budget-usd B [--model M]`, prompt sur stdin ; lanceur NHITL `plugins/aphrody-nhitl/bin/claude-nhitl.ts` quand il est présent |
| Claude Agent SDK TS `@anthropic-ai/claude-agent-sdk` | 0.3.323 | consommé par ai-os | – |
| Claude Agent SDK Python `claude-agent-sdk` | 0.2.181 | consommé par ai-os | – |
| Codex CLI `@openai/codex` | 0.167.2 | fr2 0.167.2, prd 0.166.0, fr1 0.162.1, pc 0.162.0-alpha.17.2 | `codex exec --json --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox [-m M] -` |
| OpenCode `opencode-ai` | 1.19.5 | prd/fr1/fr2 1.19.5 ; pc `opencode v2.2.7` (autre distribution, conflit non résolu) | `opencode run --format json [-m provider/model] <prompt>` |
| pi `@earendil-works/pi-coding-agent` | 1.5.2 (l'ancien `@mariozechner/pi-coding-agent` 0.73.1 est marqué deprecated par npm) | prd/fr1/fr2 1.5.2 ; absent du pc | `pi -p [--model M] <prompt>` |
| Antigravity `agy` | – | pc 1.5.7, prd 1.4.12 | `agy -p <prompt> --output-format json --dangerously-skip-permissions [--model M]` ; remplace Gemini CLI (`@google/gemini-cli` 0.68.0 existe mais est legacy pour ai-os) |
| litellm (PyPI) | 1.109.1 | non installé : le routage est dans ai-os | – |
| tmux | – | prd 3.8, fr1/fr2 3.7b, pc psmux 3.4.0 (winget `arndawg.tmux-windows`) | session `agents` |
| cloudflared | – | fr1 2026.11.0, prd/fr2/pc 2026.10.7 | tunnel `mig-prd` |
| Renovate `renovate` | 44.236.5 | non utilisé (voir 7) | – |

Pièges relevés :
- Claude Code refuse `bypassPermissions` en root, et ce garde-fou n'est pas contourné : aucun runner ne tourne en root (`runner.ts work` refuse uid 0, `install.sh` aussi). Sur prd, le runner tourne sous l'utilisateur dédié `agent` (sans sudo), créé par `bootstrap-user.sh`. `install.sh` marque le checkout comme approuvé (`hasTrustDialogAccepted`) dans `~/.claude.json`.
- Bun charge automatiquement le `.env` du répertoire courant : `C:\src\.env` contient une clé `ANTHROPIC_API_KEY` non rattachée à un workspace, qui passait devant la connexion claude.ai (erreur 400). Le runner, ses unités et la tâche planifiée tournent en `bun --no-env-file`, et les variables `ANTHROPIC_*`, `CLAUDECODE`, `CLAUDE_CODE_*` de la session parente sont retirées de l'environnement des enfants (`AGENTS_KEEP_ENV=1` pour les garder).
- psmux casse les guillemets doubles de la commande de fenêtre : chemins non quotés sous Windows quand ils n'ont pas d'espace.
- `~/.local/bin/codex` sur fr2 était un lien vers un autre binaire : l'install vérifie `~/.bun/bin/<cli>`, et le runner met `~/.bun/bin` en tête du PATH.
- Codex sur le PC répond 401 (`codex login` à refaire par le propriétaire, OAuth) : le runner a basculé tout seul sur le fournisseur suivant.

## 4. File de tâches (format v1)

File par hôte, dans le checkout du runner : `var/agents/` (ignoré par git). Pas de serveur : des fichiers JSON et `rename` atomique, comme maildir.

```
var/agents/queue/{tmp,new,claimed,done,failed}/<id>.json
var/agents/results/<id>/{result.json,<n>-<provider>.log,<n>-check.log}
var/agents/publish/<id>/            brouillons approval=owner
var/agents/state/{health.json,heartbeat-<role>,cooldown-<provider>,schedule-<name>}
var/agents/log.jsonl                expédié vers prd:/var/lib/aphrody-agents/logs/<hôte>.jsonl
```

Checkouts : prd `/home/agent/agents/src` (utilisateur `agent`), fr1 et fr2 `/home/ubuntu/agents/src`, PC `C:/src`.

```json
{
  "v": 1, "id": "...", "role": "coder", "host": "prd|fr1|fr2|pc|any",
  "prompt": "...",
  "providers": ["claude", "claude:<model>", "codex[:m]", "opencode[:provider/model]", "pi[:m]", "agy[:m]", "<fournisseur relais>/<modèle>"],
  "cwd": "chemin relatif", "check": "commande, exit 0 = accepté",
  "commit": { "paths": ["préfixes"], "message": "..." },
  "approval": "none|owner", "timeout_s": 0, "budget_usd": 0, "max_attempts": 3,
  "created_by": "...", "created_at": "...",
  "attempts": [{ "provider": "", "exit": 0, "reason": "ok|agent_error|provider_unavailable|check_failed", "started": "", "ended": "", "check_exit": 0 }]
}
```

Dépôt : écrire `queue/tmp/<id>.json` puis le renommer en `queue/new/<id>.json`, ou `just agents enqueue --role R --prompt P [--host H] [--providers a,b] [--check C] [--paths p1,p2] [--message M] [--template NOM]` (hôte distant : ssh, voir 6).

Transitions : `new` -> `claimed/<id>@<hôte>.<pid>.json` (le rename désigne un seul gagnant) -> `done` | `failed` | retour en `new` quand toutes les tentatives ont échoué pour indisponibilité. Un fournisseur qui répond 429, quota, crédit, 401/403/5xx ou « not logged in » passe en refroidissement 15 min et la tâche continue sur le suivant. Chaque fournisseur a un tour d'auto-correction : la sortie du `check` en échec lui est renvoyée. Les tâches réclamées par un worker mort sont remises en `new` par le contrôle de santé.

Commit : seulement les fichiers modifiés par la tâche (différence `git status` avant/après) sous `commit.paths` (`""` = tout), trailers `Agent-Task`, `Agent-Role`, `Agent-Provider`, `Agent-Host`, `git push origin HEAD:main` avec rebase `--autostash` et trois essais.

Budgets : `budget_usd` par rôle (`fleet.toml`) passé à `--max-budget-usd` de Claude ; les autres CLI sont bornées par `timeout_s`. Les plafonds par fournisseur (quotas, coût global) relèvent d'ai-os.

## 5. Runner par hôte

- `infra/agents/runner.ts` (Bun, sans dépendance) : `up`, `work <rôle>`, `health`, `enqueue`, `status`.
- `infra/agents/fleet.toml` : rôles par hôte, timeouts, budgets, cibles ssh, planification, hôte de collecte.
- Linux (`just agents-install <hôte>` = `ssh <hôte> 'sh -s' < infra/agents/install.sh` ; pour prd, d'abord `bootstrap-user.sh` en root puis `install.sh` en `agent@prd` ; idempotent, appelé aussi par `infra/fleet/bootstrap/*.sh`) : clone blobless de main, hook `pre-push` qui refuse force-push et suppression, CLI en `bun add -g`, unités user `aphrody-agents.service` (session tmux `agents`, une fenêtre par rôle, boucle de redémarrage), `aphrody-agents-health.timer` (2 min : répare les fenêtres, ressuscite les workers sans battement depuis 120 s, remet les orphelins en file, sonde les CLI, expédie les journaux, `ci-watch`, planification), `aphrody-agents-pull.timer` (10 min, fast-forward). Linger activé.
- PC (`just agents-install-pc`) : tâches planifiées `\Aphrody\AgentsHealth` (5 min) et `\Aphrody\AgentsLogon`, `conhost.exe --headless bun --no-env-file runner.ts health`, session psmux `agents`. Sans droits admin.
- Journaux : une seule destination, `prd:/var/lib/aphrody-agents/logs/<hôte>.jsonl` (offset par hôte dans `state/ship-offset`).
- Planification (`[schedule]`, enqueue par prd) : `deps-update`, `release-notes`, `seo-check` chaque semaine. Les pages produit (`product-page-shenron`, `product-page-rosegriffon`) se lancent à la demande : `just agents enqueue --template product-page-shenron`.

Sessions en place au 2026-11-13 : prd `coder reviewer tester linter deployer sre growth`, fr2 `linter sre`, fr1 `chromium`, pc `coder reviewer designer growth`.

## 6. Accès aux hôtes (tunnels)

| Chemin | Usage | Test du 2026-11-13 |
|---|---|---|
| ssh public, alias `prd`/`fr1`/`fr2` du PC (clés uniquement) | PC -> runners : `just agents-attach prd`, `just agents status`, enqueue distant | OK (installs, enqueue PC -> prd) |
| WireGuard 10.200.77.0/24 (fr1 .1, fr2 .3, prd .5) | VPS -> VPS : expédition des journaux, enqueue | OK : fr1 et fr2 -> `root@10.200.77.5` ; ping PC -> .1/.5 OK, mais le port 22 du mesh est fermé depuis le PC (timeout), conforme au RUNBOOK |
| Tunnel Cloudflare `mig-prd` + Access for Infrastructure `mig-prd-ssh` | ssh prd sans IP publique | tunnel prêt (`/ready` : 4 connexions) ; inutilisable tant que WARP n'est pas installé sur le PC (UAC, propriétaire) |

Chaque hôte déclare ses cibles dans `fleet.toml` (`ssh = [alias, IP WireGuard, IP publique]`), essayées dans l'ordre. Rien n'est exposé publiquement : ni tmux ni la file n'écoutent sur le réseau.

## 7. CI juge, main sans PR, rollback

- Push direct sur main. Ruleset GitHub `main-no-rewrite` (id 27169448) : interdit force-push et suppression de main, laisse passer les pushes directs.
- `judge.yml` (runner GitHub hébergé) : verdict rapide de chaque push (checkdeps, identity, runner, `go test` de infra). `ci.yml` garde les builds lourds sur le runner `fr1`, arrêté exprès (`docs/infra/FLEET.md`) : ses runs restent annulés tant qu'il n'est pas réinstallé.
- `ci-revert.yml` : quand `judge` ou `ci` échoue sur un commit dont le parent était vert, le commit est reverté sur main (équivalent en une ligne : `git revert --no-edit <sha> && git push origin HEAD:main`). Ignorés : les reverts et les commits marqués `[no-revert]`.
- `ci-watch` (prd) : une CI rouge non attribuable donne une tâche `sre` `ci-fix-<sha>` (une seule ouverte à la fois).
- Dépendances : pas de Renovate, qui a besoin de branches et de PR (exclus). La tâche hebdomadaire `deps-update` applique `just deps-bump` / `just deps-lock` (ay lock) dans les bornes, vérifie, commite sur main ; le juge et le revert font le reste.

## 8. Tests de bout en bout (2026-11-13)

| Hôte | Tâche | Déroulé | Résultat |
|---|---|---|---|
| prd | `smoke-prd-lint-epic-fmt` (linter, `bun fmt` de `packages/epic-games`, check `bun fmt --check`) | claude refusé (root) -> bascule sur codex -> check vert -> commit. Le runner prd a été déplacé ensuite sous l'utilisateur `agent` | `0c8f6e4` sur main |
| pc | `smoke-pc-lint-gds-fmt` (coder, `bun fmt` de `packages/google-design`) | 1er essai : 400 (clé du `.env`) -> refroidissement + remise en file ; après `--no-env-file` : claude -> check vert -> commit | `82215ad` sur main |

## 9. Reste à faire (hors de portée des agents)

- Connexions de l'utilisateur `agent` sur prd (OAuth, interactif) : `sudo -iu agent claude login`, `sudo -iu agent codex login`, `sudo -iu agent gh auth login` (push sur main). Tant qu'elles manquent, les CLI de prd répondent « not logged in » (refroidissement, tâche remise en file) et un commit non poussé met la tâche en `failed`.
- WARP sur le PC (UAC) pour le chemin Cloudflare ; `codex login` sur le PC.
- Réinstaller un runner GitHub pour `ci.yml` (prd trop chargé d'après FLEET.md) ou porter ses étapes vers `judge.yml`.
- Les tâches planifiées sans `providers` passent par le relais (texte seulement) : ai-os doit nommer une CLI de code pour `deps-update`, ou prendre la planification à son compte.
