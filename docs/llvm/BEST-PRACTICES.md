# Pratiques LLVM transposables à src (Rust + bun) — 2026-11-12

Sources LLVM : voir ECOSYSTEM.md ([GH], [DP], [CS], [TG], [C7]). État src : lecture le 2026-11-12 de `C:\src\README.md`, `AGENTS.md`, `Cargo.toml`, `crates/*/Cargo.toml`, `crates/ay/src/*`, `docs/ARCHITECTURE-ROOT.md`, `C:\labs\docs\ARCHITECTURE.md` [SRC]. Rien n'a été compilé ni testé.

## État src mesuré [SRC]

- 49 crates à plat dans `crates/`, préfixes hétérogènes (`depot-`, `aphrody-design-`, `gamescope-`, `unix-`, sans préfixe : `sys`, `rt`, `up`, `remote`, `ffi`, `corelib`, `xtask`).
- `ay` = package `aphrody`, `[[bin]] ay` + `[lib] ay` ; 1076 lignes ; `enum Cmd` clap de 24 variantes, presque toutes `Rest` (args transmis tels quels) puis `Route` vers la lib propriétaire. Déjà « driver mince sur bibliothèques ».
- `up::shim` : `ay` est déjà lancé sous d'autres noms (lien dur `<tool>.exe` + `<tool>.shim`) — base existante pour un dispatch argv[0].
- Aucun crate depot n'a de `[[bin]]` : tout passe par `ay`.
- `depot-cli` agrège 18 modules `commands/*` et dépend de 7 libs : c'est une couche « outils » séparée du driver.
- `ffi` dépend de 7 crates `depot-*` (couche bindings au-dessus, comme `llvm-c`).
- `depot-core` (17 modules : path, style, ignore, sys, gix_engine, just_engine, vault, magika…) joue le rôle de Support mais mêle des moteurs lourds.
- Tests : `tests/` dans 9 crates seulement ; pas de golden test de CLI.
- Table de commandes dupliquée : doc-comments clap + `docs/NAMING.md` + `GRAPH_SUBCOMMANDS` en dur.

## Transposition

| Pratique LLVM | Fait LLVM | src aujourd'hui | Action |
|---|---|---|---|
| Library-first | chaque outil = `<tool>_main(argc, argv, ToolContext)` sur des libs [GH] | oui de fait (Route → lib) | formaliser : `pub fn tool_main(args, &ToolContext) -> i32` dans chaque lib-outil |
| Couches strictes, sans dépendance montante | `LINK_COMPONENTS` explicites, pas de cycle [CS][GH] | cycles impossibles (cargo) mais pas de couches déclarées ; `xtk → depot-core`, `ffi → 7 libs` | couche en métadonnée `[package.metadata.layer]` + règle archguard (ARCH-0xx) « dépend seulement de couche ≤ » |
| Un seul Support | `llvm/lib/Support` | `depot-core` + `sys` + `corelib` se recouvrent [NV sur le recouvrement exact] | `depot-core` = Support ; moteurs lourds (gix, just, magika, vault) descendent d'un cran en libs dédiées |
| Peu d'includes | « #include hurts compile time » [CS] | features par défaut larges [NV] | `default-features = false` dans `[workspace.dependencies]`, features par outil |
| Tests lit/FileCheck | `RUN:`, `%s`, `CHECK:`, `lit.local.cfg`, `REQUIRES/XFAIL` [TG] | absent | `tests/lit/<outil>/*.test` + harnais Rust (voir AY-AS-LLVM.md) |
| Golden auto-régénérés | `update_test_checks.py` [TG] | absent | `ay lit --update` réécrit les `CHECK:` |
| unittests séparés | `llvm/unittests` gtest [TG] | `#[cfg(test)]` + `tests/` | garder `#[test]` pour les libs, lit pour les CLI |
| TableGen | `.td` → `.inc` ; options `-gen-opt-parser-defs` [C7] | clap derive à la main | `tools.toml` → build.rs → table clap + dispatch + doc |
| Options stables, `--help`/`--help-hidden` | `OptParser.td` : `HelpText`, `Flags<[HelpHidden]>`, `Alias` [GH ObjdumpOpts.td] | aide par sous-crate, hétérogène | champs `hidden`, `alias` dans la spec ; garde CI « aucune option retirée sans alias » |
| Multicall | `LLVM_TOOL_LLVM_DRIVER_BUILD`, stem argv[0], `.def` généré [GH] | `ay <cmd>` + shims `up` | `ay` binaire unique + liens `ay-gclient`, `gclient`… générés |
| Monorepo à sous-projets top-level | `clang/ lld/ mlir/ …` [GH] | `crates/ packages/ apps/ third_party/` | garder le modèle Chromium plat (ROOT-ARCHITECTURE) : la couche = préfixe, pas un dossier |
| Incrémental + revert to green | [DP] | phases « annulée si ça casse » | une PR = un crate déplacé ; revert immédiat si compte de tests baisse |
| RFC avant gros changement | Discourse [DP] | docs/ ad hoc | `docs/rfc/NNNN-titre.md`, statut dans l'en-tête [NV : pas d'équivalent existant vérifié] |
| CODEOWNERS = assignation seule | [GH] | `MAINTAINERS` généré par `ay lock` | garder ; ajouter `Maintainers.md` par couche plutôt que par crate |
| Test obligatoire par fix | [DP] | non imposé | gate CI : PR touchant `src/` d'un outil sans `tests/` modifié → avertissement |

## Ce qui ne se transpose pas

- CMake/`LLVM_ENABLE_PROJECTS` : cargo features + `-p` suffisent ; un équivalent est `ay build --tools gclient,vpy` qui active les features du driver.
- Pas d'exceptions/RTTI : sans objet en Rust ; l'équivalent est « pas de `anyhow` dans les libs » (erreurs typées, `anyhow` réservé aux drivers) [NV : usage actuel non audité].
- Python (lit, update scripts) : interdit côté outillage maison (bun/Rust seulement) → réécriture minimale en Rust.
