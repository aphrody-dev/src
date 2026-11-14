[English source](../../../README.md)

# src

Monorepo d'Aphrody. Le contrat des contributeurs et des agents est [AGENTS.md](../../../AGENTS.md) et [CLAUDE.md](../../../CLAUDE.md) ; l'architecture cible est dans [docs/ARCHITECTURE.md](../../ARCHITECTURE.md), la feuille de route dans [docs/STACK-ROADMAP.md](../../STACK-ROADMAP.md).

## Organisation

| Répertoire                                                                        | Contenu                                                                                                                                                                                                                                                  |
| :-------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/`                                                                           | `aphrody`, `aphrody-app`, `auto`, `l2l`, `nt`, `r2-site`, `r2b`, `unixwin`, `yolo`, et deux sites communautaires maintenus par Aphrody, `rosegriffon` et `shenron`. `auto`, `r2b`, `rosegriffon` et `shenron` sont des sous-modules git.                 |
| `packages/`                                                                       | Paquets Bun `@aphrody/*` : `ai-os` (le seul produit d'IA), `core`, `deploy`, `design`, `env-kit`, `ffi-bridge`, `forge`, `gaming`, `wck` et d'autres.                                                                                                    |
| `crates/`                                                                         | Crates Rust 2024 dans un seul workspace Cargo à plat : `ay` (la CLI du dépôt), `archguard`, `xtask`, `depot-*`, `lore*`, `aphrody-ui`, `core`, `core-capi`, `ffi`, `rust-stack`, `tv-*`, `gamescope-*`, `steam-depot`, `conformance`, `apm` et d'autres. |
| `infra/`                                                                          | Configuration de flotte et de déploiement assemblée à partir d'outils upstream (`docker`, `cluster`, `cloudflare`, `fleet`, `mesh-vn`, `chromium-factory` et d'autres).                                                                                  |
| `third_party/`                                                                    | Checkouts upstream et forks aphrody-labs, épinglés dans `src.lock.json` ; liste des forks dans `third_party/forks.txt`. Aucune modification locale.                                                                                                      |
| `docs/`, `assets/`, `conformance/`, `licenses/`, `plugins/`, `scripts/`, `tools/` | Documentation, ressources de marque, suites de conformité, textes de licences, plugins Claude Code (`labs`, `aphrody-nhitl`), scripts et outillage.                                                                                                      |

## Épinglage et licences

- `src.lock.json` est l'unique épinglage ; `DEPS` et `.gitmodules` en sont dérivés par `ay manifests`. `MAINTAINERS` est tenu à la main.
- Le code first-party est sous MIT OR Apache-2.0 (`LICENSE-MIT`, `LICENSE-APACHE`). La politique de dépendances est dans `deny.toml` et `docs/ARCHITECTURE.md`.

## Commandes

Rust se compile en CI ou sur l'hôte de build, pas sur le poste de travail.

```sh
just doctor          # diagnostic de la toolchain
just arch-check      # garde d'architecture (ay arch check --strict pour la forme stricte)
just lock            # verrouille le checkout dans src.lock.json, puis dérive DEPS et .gitmodules
just manifests-check # manifestes dérivés et gitlinks conformes à src.lock.json
just env-doctor      # vérifie le coffre .env masqué et l'authentification des éditeurs
just graph <path> <name>   # graphe de code tree-sitter dans graphify-out/<name>
just deploy          # docker compose pull + up --wait sur un hôte
just verify-all      # garde d'architecture, doctor, suites Bun, puis ci.yml pour Rust
```

## Où lire

| Sujet                                      | Document                                                                 |
| :----------------------------------------- | :----------------------------------------------------------------------- |
| Design system et UI                        | `docs/design/DESIGN_SYSTEM.md`, `docs/ui/STACK.md`, `packages/design/DESIGN.md` |
| Média (`crates/tv-*`)                      | `docs/tv`                                                                |
| Jeux vidéo et Steam                        | `docs/gaming/OWNERSHIP.md`                                               |
| Epic Games et Unreal Engine                | `docs/epic/RESOURCES.md`, `docs/epic/TRACKING.md`                        |
| Jeux et suite créative (plan, non démarré) | `docs/games/PLAN.md`                                                     |
| Déploiement                                | `docs/infra/DEPLOY.md`                                                   |
| Journaux de session                        | `docs/SESSION-LEDGER-2026-11-13.md`                                      |

## Labs (fusionné le 2026-11-12)

Aphrody Labs : travail de plateforme auto-hébergée ; son ancien binaire est désormais `ay conformance`.

| Chemin                                                                         | Contenu                                                                          |
| :----------------------------------------------------------------------------- | :------------------------------------------------------------------------------- |
| `crates/conformance`, `conformance/`                                           | suites de conformité épinglées, CLI `ay conformance`                             |
| `crates/lore*`, `licenses/lore`, `tools/lore`                                  | Lore VCS, absorbé (MIT)                                                          |
| `crates/apm`                                                                   | crate APM                                                                        |
| `[patch.crates-io]`                                                            | crates patchées, forks aphrody-labs épinglés par `rev` (quinn-proto, glob-match) |
| `third_party/oils`, `third_party/{vendor.lock,chrome-channels.toml,forks.txt}` | fork oils et épinglages                                                          |
| `infra/chromium-factory`                                                       | usine de build Chromium                                                          |
| `plugins/labs`                                                                 | plugin Claude Code `labs` (`docs/agents/PLUGIN.md`)                                     |

Recettes : `just lab-build`, `just lab-dev`, `just lab-conformance`.
