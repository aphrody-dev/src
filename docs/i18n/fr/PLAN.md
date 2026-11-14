[English source](../../games/PLAN.md)

# Jeux et suite créative dans src : plan (réécrit le 2026-11-13)

Ce document remplace la première version, qui proposait des décisions déjà prises par le dépôt (pile UI, pins GPU, binding FFmpeg, ABI C) et qui est retirée. Chaque ligne cite l'endroit où le fait a été lu le 2026-11-13. Rien n'est construit sauf mention contraire.

## 1. Ce qui existe déjà

| Domaine               | État                                                                                                                                                                                                                           | Lu dans                                                 |
| :-------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------ |
| Décision UI           | Décision du propriétaire du 2026-11-13, amendée le jour même : le framework est libre (Bevy UI, egui, iced, WinUI 3, Tauri, GPUI, WebUI et autres) ; critères : qualité de rendu, performance, fonction                        | `docs/ui/STACK.md`                                      |
| Design system         | Tokens dans `packages/design` ; cœur Rust `crates/aphrody-ui`, avec adaptateurs de layout `to_bevy` et `to_egui` derrière les features optionnelles `bevy` et `egui`                                                           | `docs/design/DESIGN_SYSTEM.md`, `crates/aphrody-ui/Cargo.toml` |
| Pins moteur et GPU    | `[workspace.dependencies]` : bevy 0.20, egui 0.37, wgpu 30.0.1, winit 0.31.0-beta.4, image 0.25.10                                                                                                                             | `Cargo.toml`                                            |
| Domaine média         | `crates/tv-core`, `tv-ffmpeg` (wrapper sûr sur `ffmpeg-next` 9.1.0), `tv-cli`, `tv-i18n`                                                                                                                                       | `docs/tv/plan-ecosysteme-c-rust.mdx`                    |
| Politique de licences | Liste d'autorisation dans `deny.toml` ; GPL, LGPL, AGPL, licences non OSI et dépôts `NOASSERTION` refusés sans revue enregistrée ; libav* de FFmpeg lié dynamiquement, jamais vendu                                            | `docs/ARCHITECTURE.md`, `deny.toml`                     |
| ABI C                 | `crates/core-capi` (cbindgen, `include/aphrody_core.h`) au-dessus de `crates/core` ; binding Bun dans `packages/core/src/ffi.ts`                                                                                               | `docs/native/llvm/C-ABI-2026.md`                               |
| Graphe de code        | `ay graph build` (tree-sitter), recette `just graph <path> <name>`, sortie dans `graphify-out/<name>` (non suivie)                                                                                                             | `justfile`                                              |
| Mise à plat           | `ay flat list\|sync\|check` copie les crates feuilles du fork bun dans `crates/bun-flat`, avec commit du fork et licence par module dans `flat.toml`                                                                           | `crates/bun-flat/flat.toml`                             |
| Checkouts épinglés    | `third_party/artcraft` (`83aad5eb`), `third_party/ffmpeg` (`46d13a83`), `third_party/storyteller-bevy` (`4ce8b72c`), `third_party/wgpu` (fork aphrody-labs), `third_party/winit` ; dans le lock depuis `4c6bf057` (2026-11-12) | `DEPS`, `src.lock.json`                                 |
| Forks suivis          | 18 bevyengine, 33 storytold et 10 EpicGames dans `third_party/forks.txt`                                                                                                                                                       | `docs/epic/TRACKING.md`                                 |
| Direction             | « Epic track (not scheduled) » ; Unreal Engine uniquement via le fork privé                                                                                                                                                    | `docs/STACK-ROADMAP.md`, `docs/ARCHITECTURE.md`         |

## 2. Versions qui contraignent une fusion (`gh api`, 2026-11-13)

| Pile                          | wgpu                       | winit                      | UI                               | Licence                                                        |
| :---------------------------- | :------------------------- | :------------------------- | :------------------------------- | :------------------------------------------------------------- |
| workspace src                 | 30.0.1                     | 0.31.0-beta.4              | selon `docs/ui/STACK.md`         | MIT OR Apache-2.0                                              |
| Bevy v0.20.1                  | 30                         | 0.30                       | bevy_ui                          | MIT OR Apache-2.0                                              |
| Craft Apps                    | 30.0, via `storytold/egui` | 0.30.13, `storytold/winit` | egui 0.37.0 (fork)               | Apache-2.0                                                     |
| ArtCraft Studio               | non lu                     | non lu                     | Tauri 2.11.2 et front TypeScript | Apache-2.0 et MIT                                              |
| `storytold/artcraft-services` | n/a                        | n/a                        | n/a                              | « ArtCraft License (WIP) », fair source, usage personnel privé |

Lecture : les trois piles Rust sont sur wgpu 30, un seul wgpu suffit. winit diffère : src épingle 0.31.0-beta.4, Bevy 0.20.1 et le fork egui de Craft utilisent 0.30.x. Aujourd'hui seul `gamescope-cli` dépend de winit ; ajouter `bevy_winit` ou `egui-winit` en introduirait un second.

## 3. Conflits trouvés, avec le défaut appliqué en attendant le propriétaire

1. Tranché le 2026-11-13 : tout framework d'UI est accepté si le résultat est beau, optimisé et fonctionnel. Les Craft Apps gardent egui ; les tokens Aphrody les atteignent par la feature `egui` de `aphrody-ui`. Cela amende la règle des quatre références de `docs/ui/STACK.md`.
2. `third_party/storyteller-bevy` est épinglé alors que le dépôt n'a ni fichier de licence ni champ `license`. Défaut : lecture seule de référence, rien copié dans `crates/`, candidat au retrait du lock.
3. `docs/tv/plan-ecosysteme-c-rust.mdx` liste x264 et x265 (GPL) alors que `docs/ARCHITECTURE.md` refuse la GPL et que le test `ffmpeg_build_is_lgpl` rejette `--enable-gpl`. Défaut : ce que le test impose (build LGPL, encodeurs matériels).
4. Un nouveau répertoire racine `C` contredit la stratification et la liste blanche d'archguard. Défaut : aucun nouveau répertoire racine ; toute nouvelle surface C va dans `core-capi` ou une crate `<domaine>-capi`.
5. `storytold/artcraft-services` est sous licence non OSI. Défaut : ni fork ni copie ; seule son API HTTP documentée peut être appelée (`docs/games/ARTCRAFT.md`).

## 4. Ordre de travail, chaque étape avec son contrôle

Les builds Rust tournent en CI ou sur fr1, jamais sur le poste.

| #   | Étape                                                                                                                                              | Contrôle                                            | État                                                                                                                          |
| :-- | :------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------- |
| 1   | Graphe des checkouts existants avec `just graph third_party/<path> <name>`                                                                         | `GRAPH_REPORT.md` avec nombres de nœuds et d'arêtes | Fait le 2026-11-13 (par ex. libavcodec 29819 / 97225, `artcraft/crates` 34314 / 69018) ; chaque exécution a pris 6 s ou moins |
| 2   | IR LLVM de ces bibliothèques avec le clang partagé, sur fr1                                                                                        | fichiers `.bc` depuis un build LGPL configuré       | Non démarré                                                                                                                   |
| 3   | Couche formats : évaluer `storytold/craft-libs` (Apache-2.0, 114 crates `craft-<name>`) en dépendances git épinglées par `rev`, sans copie         | `cargo deny check licenses` passe en CI             | Non démarré                                                                                                                   |
| 4   | Média : étendre `crates/tv-*` selon `docs/tv` ; ce plan n'ajoute rien                                                                              | tests de `tv-ffmpeg`, dont `ffmpeg_build_is_lgpl`   | Propriété de la session qui maintient `crates/tv-*`                                                                           |
| 5   | Moteur : ajouter les crates Bevy une feature à la fois derrière la feature `bevy` de `aphrody-ui` ; trancher winit 0.30 ou 0.31 avant `bevy_winit` | `cargo tree -d` en CI liste un winit et un wgpu     | Non démarré                                                                                                                   |
| 6   | Mettre à plat les seules crates feuilles à modifier : généraliser `ay flat` à un `flat.toml` par fork ; sources sans licence ou non OSI exclues    | `ay flat check --fork third_party/<name>` propre    | Fait le 2026-11-13 : un flat.toml par fork (bun, diffutils), contrôle SPDX contre deny.toml                                   |
| 7   | Captures des Craft Apps depuis des builds de release faits sur fr1, stockées hors de git                                                           | fichiers listés dans `docs/games/ARTCRAFT.md`       | Non démarré                                                                                                                   |
| 8   | Unreal Engine : inchangé, fork privé, interop seule                                                                                                | `docs/epic/RESOURCES.md`                            | Aucun travail prévu ici                                                                                                       |

## 5. Non fait

- Aucune crate ajoutée, aucun code déplacé, aucun build lancé pour ce plan. La refonte de src en moteur de jeu et suite créative n'a pas démarré.
- Gardes en échec mesurés le 2026-11-13, indépendamment de ces documents : `ay arch check --strict` (72 erreurs ou plus, dont des binaires de plus de 50 Mo), `ay manifests verify` (pins qui ne sont pas des gitlinks), `ay doctor` (`cl.exe` absent).

## 6. Cible fixée par le propriétaire le 2026-11-13 (enregistrée, rien démarré)

- Trois apps seulement, une par domaine : `shenron`, `rosegriffon`, et une app Aphrody fusionnant `apps/aphrody` (aphrody.com) et `apps/aphrody-app` (aphrody.app). Tout autre app, paquet et crate est mis à plat dans du code partagé ; le code de `shenron` et `rosegriffon` non spécifique à leur produit passe dans des crates et paquets partagés.
- L'app Aphrody fusionnée héberge et déploie les Craft Apps, ArtCraft et le jeu : WebAssembly et WebGPU plein écran dans le navigateur, monde ouvert multijoueur, 120 fps en 1080p, manette (Xbox, PlayStation), clavier et souris, audio et vidéo, construite sur Bevy avec une matrice de fonctionnalités face à Unreal Engine.
- Upstreams nommés par le propriétaire, à vérifier avec `gh api` avant tout usage : `vercel-labs/ui`, `vercel-labs/native`, `niri-wm/niri`, `niri-wm/awesome-niri`, l'organisation DioxusLabs, `longbridge` (composants GPUI, `nsh`), `cloudflare/vinext`, `vercel/next.js`, `vercel/vercel`, `vercel/ai`, `vercel/turborepo`, `mui/base-ui`, shadcn, `tailwindlabs/tailwindcss`, Microsoft WebUI, iced et COSMIC.
- Nettoyage : retirer les copies tierces vendues et imbriquées dans apps, packages et crates ; une version par dépendance ; binaires plus petits.
- Contrôles à définir avant de commencer : un build de l'app fusionnée en CI, une exécution navigateur mesurant la fréquence d'images, et une liste de parité par fonctionnalité remplacée. Aucun n'existe aujourd'hui.
- Les personnages et mascottes (Inazuma Eleven, Dragon Ball, Tux, mascotte Bun, logos tiers) appartiennent à leurs ayants droit ; seules les ressources dont la licence permet la redistribution entrent dans ce dépôt public.
