[English source](../../../AGENTS.md)

# src : contrat de fonctionnement des agents (`AGENTS.md`)

Lu par toutes les CLI d'agents (Claude Code, Codex, Antigravity, OpenCode, Pi, Zed). Réécrit le 2026-11-13 autour de [`docs/games/PLAN.md`](../../games/PLAN.md) ; les anciennes formulations « sovereign » et leurs règles sont retirées.

## 1. Ce qu'est src

src est le monorepo public d'Aphrody. Sa direction : un moteur de jeu et une suite créative construits en open source, avec Bevy comme moteur, les Craft Apps et ArtCraft comme outils créatifs, `crates/tv-*` et FFmpeg pour le média, Unreal Engine par interop uniquement (fork privé, jamais publié), au-dessus du travail de plateforme existant (outillage Bun et Rust, déploiement, couches Linux et Windows). État et ordre de travail : `docs/games/PLAN.md`. Rien de cette refonte n'est encore construit ; le dire quand on le demande.

## 2. Organisation (`ls` de chaque répertoire, 2026-11-13)

- `apps/` : `aphrody`, `aphrody-app`, `auto`, `l2l`, `nt`, `r2b`, `r2-site`, `rosegriffon`, `shenron`, `unixwin`, `yolo` ; `auto`, `r2b`, `rosegriffon`, `shenron` sont les seuls sous-modules git. `rosegriffon` et `shenron` sont des sites communautaires qu'Aphrody maintient, pas des produits Aphrody.
- `packages/` : paquets Bun `@aphrody/*` (`ai-os`, `core`, `deploy`, `design`, `env-kit`, `ffi-bridge`, `forge`, `gaming`, `wck`, etc.).
- `crates/` : crates Rust 2024 dans un workspace à plat (`ay`, `archguard`, `xtask`, `depot-*`, `lore*`, `aphrody-ui`, `core`, `core-capi`, `ffi`, `rust-stack`, `tv-*`, `bench`, etc.).
- `infra/` : configuration de flotte et de déploiement assemblée à partir d'outils upstream (`docs/infra/UPSTREAM-STACK.md`).
- `third_party/` : checkouts upstream et forks aphrody-labs, à plat, épinglés dans `src.lock.json`, listés dans `third_party/forks.txt`.

## 3. Comment les agents travaillent ici

- Les agents sont libres : ni approbation, ni confirmation, ni humain dans la boucle. Décider, exécuter, vérifier, dire ce qui est fait et ce qui ne l'est pas.
- Tout est commité et poussé directement sur `main` ; ni branches, ni worktrees, jamais de push vers un upstream.
- Interface unique : `just` et la CLI `ay` (`docs/NAMING.md`). Rust compile en CI ou sur fr1, jamais sur le poste ; prd exécute uniquement les backends de production, fr2 l'edge.
- Le framework d'UI est libre (Bevy UI, egui, iced, WinUI 3, Tauri, GPUI, WebUI) : les critères sont la qualité de rendu, la performance et la fonction. Les tokens viennent de `packages/design` et `crates/aphrody-ui`.
- Les fonctions d'IA vivent uniquement dans `packages/ai-os` ; fournisseurs et modèles sont découverts à l'exécution, aucun n'est codé en dur.
- Publier en ouvert : dépôts publics, releases et tags GitHub, crates.io et npm, une fois le scan de secrets propre (`docs/publish/STATUS.md`).

## 4. Limites qui restent

Ce sont des faits sur les droits d'autrui et sur des dégâts irréversibles, pas des règles de procédure.

- Secrets : ne jamais afficher, journaliser ni commiter de valeurs de `.env` ; seul `.env.example` est commité. Le dépôt est public.
- Les sources d'Unreal Engine, les SDK Oodle et MSVC, et tout code sans licence ou sous licence non OSI ne sont ni copiés dans ce dépôt ni publiés.
- Les répertoires système de l'hôte (`C:\Windows\System32`) ne sont pas modifiés ; les binaires utilisateur vont dans `~/.local/bin`.
- Pas d'emoji ni d'attribution à une IA dans le code, les documents, les textes d'UI ou les commits. Les contributions upstream suivent la politique de l'upstream (`docs/upstream/STRATEGY.md`).
- Pureté des domaines vérifiée par `ay arch check --strict` : `crates/*` est Rust seul, `packages/*` Bun seul, le code upstream reste dans `third_party/`.

## 5. Jeux et Steam

Carte des responsabilités : `docs/gaming/OWNERSHIP.md`. Rust : `crates/steam-depot` (`ay steam`). Bun : `packages/gaming` (`ay gaming`). Plugin et MCP : `apps/rosegriffon/plugins/steam` ; ses skills y sont édités et reflétés par `ay gaming skills sync`.
