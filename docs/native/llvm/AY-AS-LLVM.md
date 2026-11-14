# `ay` façon LLVM — conception (2026-11-12)

Contraintes : noms de package conservés (seuls les dossiers changent), `identity.toml` seule source des noms (ARCHITECTURE.md §Identité), dossiers plats `crates/<couche>-<nom>`, zéro duplication, rien compilé sur le PC. Ne pas toucher `C:\src` tant que nt-03 restructure.

## 1. Driver multicall

Modèle : `llvm-driver` (stem d'argv[0], table `.def` générée, outils exposant `*_main`) [GH].

```
ay <outil> [args]        forme canonique
ay-<outil> [args]        lien dur/symlink, stem "ay-<outil>"
<alias> [args]           alias visible (ex. gclient, vpython3) déclaré dans la spec
```

Ordre de résolution dans `main` :

1. `up::shim::run_if_shim()` (existe : un `<nom>.shim` à côté gagne toujours).
2. stem(argv[0]) ∈ table générée → `tool_main` de l'outil.
3. stem == `identity.cli` (`ay`) → argv[1] = outil ; `ay`/`ay --help` liste les outils.
4. sinon erreur « outil inconnu » avec suggestion (distance d'édition).

Contrat d'un outil (dans sa lib, module `tool`) :

```rust
pub fn tool_main(args: &[OsString], cx: &support::ToolContext) -> i32
// ToolContext { argv0, root (détectée .lore/Cargo.toml), identity, stdout/stderr, color }
```

`ToolContext` vit dans la couche Support (depot-core) ; aucun outil n'appelle `std::env::args()` ni `process::exit`.

Liens : `ay install-links [--dir ~/.local/bin]` crée `ay-<outil>` et alias (lien dur Windows, symlink Unix), réutilise le code de `up::shim`. Les noms dérivent de `identity.toml` (`cli = "ay"` → préfixe `ay-`).

## 2. Couches

| L   | Couche                 | Crates (package → dossier cible)                                                                                                                                                                                                                                               | Dépend de                                |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 0   | support                | `depot-core` (path, style, ignore, sys, ToolContext, erreurs) ; `sys` → `crates/sys-probe` ; `sovereign-corelib` → `crates/sys-corelib`                                                                                                                                        | std + tiers                              |
| 0t  | test-support (dev-dep) | nouveau `depot-lit` (harnais RUN/CHECK)                                                                                                                                                                                                                                        | 0                                        |
| 1   | formats/clients        | `depot-cas`, `depot-treesitter`, `depot-re`, `depot-forge`, `aphrody-remote` → `crates/depot-remote`                                                                                                                                                                           | 0                                        |
| 2   | domaine (libs-outils)  | `depot-cipd`, `depot-gclient`, `depot-vpython`, `depot-graph`, `depot-ingest`, `depot-migrate`, `aphrody-up` → `crates/depot-up`, `aphrody-rt` → `crates/depot-rt`, `archguard` → `crates/depot-archguard`, `xtk` → `crates/depot-xtask`, `stack-bench` → `crates/depot-bench` | 0–1, même couche si acyclique et déclaré |
| 3   | bindings               | `ffi` → `crates/depot-capi` (comme `llvm-c`)                                                                                                                                                                                                                                   | 0–2                                      |
| 4   | driver                 | `aphrody` (`crates/ay` → `crates/depot-ay`), bin `ay`                                                                                                                                                                                                                          | 0–2 (jamais 3)                           |

`depot-cli` disparaît en tant que couche : chaque `commands/<x>.rs` devient le module `tool` de la lib qui possède la logique (ingest → depot-ingest, graph → depot-graph, re/lua/disasm → depot-re, ast/rope → depot-treesitter, forge → depot-forge, migrate → depot-migrate ; worktree/fork/slim/gix/ignore/just/artifacts/info/manifests → depot-core ou une lib `depot-vcs` si depot-core devient trop lourd). Le package `depot-cli` reste comme façade de ré-export le temps d'une release, puis se vide (pas de doublon : déplacement, pas copie).

Moteurs lourds de depot-core (`gix_engine`, `just_engine`, `magika`, `vault`) : candidats L1 séparés pour que Support reste léger ; décision après mesure du temps de build sur prd.

Règle archguard (nouvelle, ex. ARCH-018) : `[package.metadata.aphrody] layer = N` obligatoire ; une dépendance vers une couche > N est une erreur ; le driver ne dépend que de crates ayant un module `tool`.

## 3. Spec déclarative (TableGen-like)

`crates/depot-ay/tools.toml` (seule source ; remplace doc-comments clap de `Cmd`, `GRAPH_SUBCOMMANDS` et la table de `docs/ay/NAMING.md`) :

```toml
[tool.gclient]
crate   = "depot-gclient"      # entrée = depot_gclient::tool::tool_main
about   = "gclient en Rust : revinfo, getdep, setdep, sync, hooks, root"
aliases = ["gclient"]          # liens visibles
hidden_aliases = []
subcommands = ["revinfo", "getdep", "setdep", "sync", "hooks", "root"]
feature = "gclient"            # cargo feature du driver
platforms = ["windows", "linux"]

[tool.vpy]
crate = "depot-vpython"
aliases = ["vpython3"]
```

`build.rs` du driver génère dans `OUT_DIR` :

- `tools.rs` : table `&[ToolEntry { name, aliases, about, main: fn }]` + `match` de dispatch, gardée par `#[cfg(feature)]` ;
- `help.txt` (liste `ay --help`) et `docs/ay/TOOLS.md` régénéré par `ay manifests` (vérifié en CI, jamais édité à la main).

Options d'un outil : chaque lib garde son parser clap (équivalent des `*Opts.td` par outil) ; la spec ne décrit que la surface driver. Garde de stabilité : `ay lit` capture `--help` de chaque outil en golden ; supprimer une option sans `alias` fait échouer le test.

Note : `crates/ay/src/build.rs` est le module `ay build`, pas un build script. Le build script sera `crates/depot-ay/build.rs` à la racine du crate.

## 4. Tests façon lit

```
crates/<lib>/tests/lit/<outil>/
  lit.toml              substitutions (%ay, %t, %root), REQUIRES par défaut
  revinfo.test          # RUN: %ay gclient revinfo --root %S/Inputs/basic | %check %s
                        # CHECK: src/v8: https://...
                        # REQUIRES: windows
  Inputs/basic/...      données
crates/depot-ay/tests/lit/driver/   argv0.test, help.test, unknown-tool.test
```

- Harnais `depot-lit` : un `tests/lit.rs` par crate (`harness = false`) découvre `*.test`, exécute les `RUN:` sans shell externe (pipe interne, builtins `cat`, `not`, `env`), applique `CHECK`, `CHECK-NEXT`, `CHECK-NOT`, `REQUIRES`, `UNSUPPORTED`, `XFAIL`.
- `ay lit [--update] <chemin>` : exécution ciblée et régénération des `CHECK:` (équivalent `update_test_checks.py`).
- Avant d'écrire `depot-lit`, vérifier le harnais `crates/conformance` de labs et les crates tiers (`filecheck`, `lit` Rust) [NV] : réutiliser plutôt que réécrire.
- Les `#[test]` unitaires restent dans les libs (équivalent `unittests/`).

## 5. Migration crate par crate

| Package (inchangé) | Dossier actuel    | Dossier cible          | Couche | Travail                                                                                           |
| ------------------ | ----------------- | ---------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| depot-core         | crates/depot-core | idem                   | 0      | + `ToolContext`, racine, identity ; sortir moteurs lourds plus tard                               |
| sys                | crates/sys        | crates/sys-probe       | 0      | `ay sys` → `sys::tool`                                                                            |
| sovereign-corelib  | crates/corelib    | crates/sys-corelib     | 0      | —                                                                                                 |
| depot-cas          | idem              | idem                   | 1      | —                                                                                                 |
| depot-treesitter   | idem              | idem                   | 1      | reçoit `commands/{ast,rope}`                                                                      |
| depot-re           | idem              | idem                   | 1      | reçoit `commands/{re,lua}`                                                                        |
| depot-forge        | idem              | idem                   | 1      | reçoit `commands/forge`                                                                           |
| aphrody-remote     | crates/remote     | crates/depot-remote    | 1      | `ay ssh`                                                                                          |
| depot-cipd         | idem              | idem                   | 2      | `tool_main` (cipd)                                                                                |
| depot-gclient      | idem              | idem                   | 2      | `tool_main` (gclient, fetch, cl, ninja, gn ?) [NV : propriétaire réel de cl/ninja/gn à confirmer] |
| depot-vpython      | idem              | idem                   | 2      | `vpy` + alias `vpython3`                                                                          |
| depot-graph        | idem              | idem                   | 2      | reçoit `commands/graph` ; supprime `GRAPH_SUBCOMMANDS`                                            |
| depot-ingest       | idem              | idem                   | 2      | reçoit `commands/ingest`                                                                          |
| depot-migrate      | idem              | idem                   | 2      | reçoit `commands/migrate`                                                                         |
| aphrody-up         | crates/up         | crates/depot-up        | 2      | shim + `install-links`                                                                            |
| aphrody-rt         | crates/rt         | crates/depot-rt        | 2      | —                                                                                                 |
| archguard          | crates/archguard  | crates/depot-archguard | 2      | + règle de couches                                                                                |
| xtk                | crates/xtask      | crates/depot-xtask     | 2      | doctor, lock, manifests                                                                           |
| stack-bench        | crates/bench      | crates/depot-bench     | 2      | cfg(windows)                                                                                      |
| depot-cli          | idem              | supprimé après vidage  | —      | façade transitoire                                                                                |
| ffi                | crates/ffi        | crates/depot-capi      | 3      | —                                                                                                 |
| aphrody            | crates/ay         | crates/depot-ay        | 4      | build.rs + tools.toml + dispatch argv0                                                            |

Hors périmètre `ay` (inchangés ici) : `aphrody-design-*`, `gamescope-*`, `unix-*`, `ring3-agent`, `dx12-hal`, etc. — leur couche suit ARCHITECTURE.md.

Renommer un dossier = mettre à jour `[workspace.dependencies] path`, les `path = "../x"` (ex. `crates/ay/Cargo.toml` utilise encore `path` direct pour depot-gclient, depot-vpython, remote, sys, up, rt → passer en `.workspace = true`), `src.lock.json`/MAINTAINERS via `ay lock`. Un dossier par PR.
