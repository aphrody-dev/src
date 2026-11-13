# Revue de cohérence — 2026-11-13

Juge : Claude (neutre). Sources par priorité : ordres du propriétaire (CLAUDE.md global, mémoire du projet), état réel (git, fichiers, `gh api`), [facts-2026-11-13.md](facts-2026-11-13.md). Contre-revue : Gemini 4 Carbon High (gemini.google.com, chat `fd78ce1b0ba42cc0`), note 11,5/20. Statuts : corrigé, différé (fichier modifié par un autre agent dans l'heure, ou code), signalé (mémoire et configuration du propriétaire).

Catégories : D = document vs document, C = document vs code ou état réel, O = règle obsolète, X = doublon.

| # | Cat. | Incohérence | Décision (source qui l'emporte) | Correction | Statut |
|---|---|---|---|---|---|
| 1 | C | CLAUDE.md : la plupart des apps/packages et crates/bench, ring3-agent, rust-stack sont des sous-modules | `git ls-files -s` : seuls apps/auto, r2b, rosegriffon, shenron | CLAUDE.md réécrit | corrigé |
| 2 | C | CLAUDE.md : third_party/bun = aphrody-dev/bun | `git remote` : aphrody-labs/bun, main | CLAUDE.md | corrigé |
| 3 | O | CLAUDE.md : Caddy blue/green sur fr1/fr2/usa | ordre flotte : prd backends, fr2 proxy/CDN, fr1 Chromium/LLVM | CLAUDE.md | corrigé |
| 4 | O | claude.yml et ci.yml sur le runner fr1 ; CLAUDE.md « heavy builds AOSP, kernel sur fr1 » | ordre flotte ; seul runner = fr1 (offline, `gh api`) | claude.yml -> ubuntu-latest ; CLAUDE.md aligné et signale ci.yml | corrigé ; ci.yml différé |
| 5 | O | claude.yml : `--model claude-opus-5-5` | ordre : aucun modèle en dur | ligne supprimée | corrigé |
| 6 | D | AGENTS.md : le garde sert aussi Claude Code via settings.json ; CLAUDE.md : non | `.claude/settings.json` (HEAD) : aucun hook, 7 deny | AGENTS.md aligné sur CLAUDE.md | corrigé |
| 7 | C | AGENTS.md §1 : paquets agy, ai-triad, brain, knowledge-engine, pi-opencode, crates depot, wayland, gamescope-rs, unix, third_party *-ecosystem inexistants | `ls` (et facts §2) | listes réelles | corrigé |
| 8 | O | chemins absolus (`C:\src`, `file:///C:/src`, `C:\Users\aphro\.local\bin`) dans AGENTS.md, GEMINI.md, SOUL.md, README.md, MONOREPO_ATLAS.md, 20 skills | ordre : aucun chemin absolu | chemins relatifs à la racine, `~/.local/bin` | corrigé (restes : CAHIER_DES_CHARGES, deploy.toml, hooks.json, src.lock.json) |
| 9 | C | GEMINI.md/SOUL.md : packages/agy, crates/depot, `ai-os.exe mcp-stdio` | `src/cli.ts` : `ai-os relay mcp-stdio` | réécrits | corrigé |
| 10 | O | SOUL.md/GEMINI.md « préférer Gemma 4 » ; deploy.toml `ollama_models` ; env-kit/editors.ts et google-design : modèles en dur | ordre : découverte à l'exécution | SOUL/GEMINI corrigés | deploy.toml, env-kit, google-design différés |
| 11 | O | skill ai-triad-orchestrator (paquet absent, Gemini CLI) ; README §2 ai-triad ; `just triad` ; council.ts `gemini -p` ; RELAY.md « ou Gemini CLI » | ordre agy remplace Gemini CLI ; council dans ai-os | skill supprimé, README -> ai-os | justfile, council.ts, RELAY.md différés |
| 12 | D | skill go-infra : fr1/fr2 production, usa réservé à Google | deploy.toml (role, allow_non_google_workloads) et ordre flotte | skill aligné | corrigé |
| 13 | O | INFRA_MATRIX : Aphrody Labs projet séparé (C:\labs) | ordre : racine unique | fusionné | corrigé |
| 14 | O | PLUGIN.md : `--plugin-dir C:\labs\plugins\labs` | plugins/labs existe | chemin relatif | corrigé |
| 15 | O | ENGINE-DECISION : C:\labs\deny.toml | deny.toml racine l.6 (MPL-2.0) | corrigé | corrigé |
| 16 | O | ARCHITECTURE-ROOT l.57/82 : packages/nt + apps/nt-app, branches nt/*, aphrody-labs/nt purgé | apps/nt ; windows-rs : branche unique master ; facts §2 : aphrody-labs/nt actif | corrigé | corrigé |
| 17 | O | CLAUDE.md `ay git worktree`, DEPOT_ARCHITECTURE §6.3 worktrees d'agents, binaire `depot` | ordre : jamais de worktree ; `depot` remplacé par `ay git` | docs corrigées | sous-commande `ay git worktree` (crates/depot-cli, crates/ay modifié dans l'heure) différée |
| 18 | O | CAHIER_DES_CHARGES : VPS f1p/f2p/usp | fr1/fr2/prd | renommés | corrigé |
| 19 | C | apps/nt/CLAUDE.md : CI = ci.yml | nt.yml (GitHub-hosted) | corrigé | corrigé |
| 20 | D | CLAUDE.md : commandes cargo/go locales ; ordre : rien ne compile sur le PC | ordre propriétaire | CLAUDE.md : CI ou prd | corrigé (ajout Gemini) |
| 21 | X | GEMINI.md et SOUL.md recopiaient AGENTS.md | une source : AGENTS.md | réduits à des renvois et au spécifique | corrigé |
| 22 | X | AGENTS.md §5 et CLAUDE.md « Portability » dupliquent conteneurs/racine | AGENTS.md = contrat commun | à réduire dans CLAUDE.md | différé |
| 23 | X | doublons de skills mirroirs (agent-desktop, agent-browser dans third_party/ et third_party/labs/vercel-labs) | zéro duplication | dédup des forks | différé (politique de dépendances) |
| 24 | C | deploy.toml : nœud `usa` vs `prd` partout ailleurs ; fr1 « builds AOSP, kernel, wasm, Steam » | ordre flotte | renommer, restreindre fr1 | différé (deploy.toml modifié dans l'heure) |
| 25 | O | var/legacy/f1p-apps (902 Mo, ignoré) | ordre : zéro legacy | purge | différé (suppression définitive hors périmètre) |
| 26 | C | README `just triad doctor` vers packages/ai-triad absent | état réel | ligne retirée du README | recette justfile différée |

## Mémoire et configuration (signalé, non modifié)

- claude-setup-ms-bun : « fusion de C:\src\agent en cours » ; fusion faite (25ab0fc, sous-module retiré).
- claude-setup-ms-bun : noms de sessions labs-7f, nt-03… ; éphémères, à retirer.
- requirements-ledger : « Tester sur ce PC » contredit « rien ne se compile sur le PC » ; « fr1/f1p » : ancien nom.
- CLAUDE.md global « Un agent max » contre requirements-ledger « gros chantiers en sous-agents (2026-11-13), prime » : à trancher par le propriétaire dans CLAUDE.md global.
- C:\Users\aphro\nt\CLAUDE.md existe encore alors que nt-monorepo dit le dossier abandonné.
- `.claude/settings.json` en copie de travail (auteur tiers, non commité) : les 7 règles deny sont retirées, contredit CLAUDE.md §Agent Setup.
- facts-2026-11-13 : `rust-toolchain.toml` sans nightly épinglée, contre l'ordre global « nightly épinglée » ; différé (politique de dépendances).

## Remarques de Gemini

Retenues : 4 (CLAUDE.md doit signaler ci.yml encore sur fr1), 20 (compilation locale dans CLAUDE.md), 24 (usa/prd).
Réfutées :
- 5 : « supprimer --model garde Anthropic codé en dur » ; le workflow est celui de Claude Code lui-même, le fournisseur est l'outil, pas un choix de modèle.
- 8 : « ~/.local/bin est un chemin absolu déguisé » ; c'est l'emplacement d'installation imposé par le CLAUDE.md global.
- 10, 11, 17 : « rien ne justifie de différer » ; deploy.toml, justfile, ai-os et crates/ay ont été modifiés dans l'heure par d'autres agents (git log), la consigne impose de différer.
- 16 : « branche master viole tout sur main » ; master est la branche par défaut unique du fork (ordre consigné dans la mémoire nt-monorepo).
- 19 : « nt.yml non vérifié » ; il existe, push sur main, runners windows-2025-vs2026 et ubuntu-latest.
- Oubli « lockfiles parasites » : aucun package-lock/pnpm-lock/yarn.lock suivi hors third_party.
- Oubli « reliquats tv » : aucun `C:\tv` dans les docs, skills, workflows, justfile.
- Oubli « third_party/bun gitlink manquant » : third_party/* est ignoré par .gitignore l.89 (clones à plat), pas un sous-module.
