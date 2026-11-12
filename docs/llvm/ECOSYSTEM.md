# Écosystème LLVM — état au 2026-11-12

Sources (consultées le 2026-11-12) :
- [GH] `gh api repos/llvm/llvm-project` : arbre racine, tags, branches, `.github/CODEOWNERS`, `llvm/CMakeLists.txt`, `cmake/Modules/LLVMVersion.cmake`, `llvm/tools/llvm-driver/*`, `llvm/lib/*`. HEAD `main` = `46ea356` (2026-11-12T16:08Z).
- [DP] https://llvm.org/docs/DeveloperPolicy.html ; [CS] CodingStandards.html ; [TG] TestingGuide.html ; [REL] HowToReleaseLLVM.html.
- [C7] context7 `/websites/llvm` (CommandLine.html, TableGen/BackGuide.html).
- [WS] WebSearch 2026-11-12 : Discourse (ClangIR reports juin/août/sept. 2026, RFC CIR CI, LLVM 23.1.5 annoncé), LLVM Weekly #664/#667, Phoronix, Arm blog « What is new in LLVM 23 », releases.llvm.org/23.1.0.
- [NV] = non vérifié dans la session.

## Versions

| Fait | Valeur | Source |
|---|---|---|
| Dernière release | `llvmorg-23.1.5` (commit 2026-11-02) | [GH] tags |
| 23.1.0 | 2026-08-25 | [GH] |
| Trunk | `LLVM_VERSION_MAJOR 24`, tag `llvmorg-24-init` (2026-07-14) | [GH] LLVMVersion.cmake |
| Branches de release | `release/20.x` … `release/23.x` | [GH] |
| Cadence | majeure ~6 mois ; branche 2e mardi de janvier (pair) / juillet (impair) ; rc1 J+3, rc2 S+2, rc3 S+4, final S+6 ; point release toutes les 2 semaines jusqu'à X.1.5/X.1.6 | [REL] |
| Schéma | trunk `N.0.0git`, branche `X.1.0git`, puis X.1.0, X.1.1… | [REL] |
| Incident | 23.1.0 a cassé l'ABI SB d'LLDB, restaurée en 23.1.1 | [WS] releases.llvm.org/23.1.0 |

## Arbre racine (monorepo, dossiers plats par sous-projet) [GH]

`bolt clang clang-tools-extra cmake compiler-rt cross-project-tests flang flang-rt libc libclc libcxx libcxxabi libsycl libunwind lld lldb llvm llvm-libgcc mlir offload openmp orc-rt polly runtimes third-party utils` + `.ci/ .github/ CONTRIBUTING.md SECURITY.md pyproject.toml`.

## Sous-projets

| Sous-projet | Rôle | Type CMake | Note 2026 |
|---|---|---|---|
| llvm | Support, IR, passes, CodeGen/MC, outils `llvm-*` | cœur | `llvm/lib` contient aussi `CAS`, `CGData`, `DTLTO`, `SandboxIR`, `Telemetry`, `Plugins` [GH] |
| clang | front C/C++/ObjC + driver | projet | CIR (ClangIR) upstream : RFC « build par défaut » accepté par l'area team (LLVM Weekly #667, 2026-10-12) ; CIR = 1,57x le temps de clang (rapport sept. 2026) [WS] |
| clang-tools-extra | clangd, clang-tidy… | projet | rien de spécifique trouvé pour 2026 [NV] |
| mlir | IR multi-niveaux, dialectes | projet | RFC « CIR testing in Clang and MLIR CI » [WS] |
| lld | linker ELF/COFF/MachO/wasm | projet | « LLD linker improvements » sans détail (Phoronix 23.1) [WS] |
| lldb | débogueur, API SB stable | projet | cf. incident ABI |
| bolt | optimiseur post-link | projet | RFC BRay (traçage), Propeller de Google à upstreamer [WS] |
| polly | optimiseur polyédrique | projet | — |
| flang | front Fortran | projet [NV : absent de `LLVM_ALL_PROJECTS` en HEAD, liste = bolt;clang;clang-tools-extra;cross-project-tests;lld;lldb;mlir;polly] | Windows on Arm étendu (Arm blog) [WS] |
| flang-rt, compiler-rt, libc, libcxx, libcxxabi, libunwind, openmp, offload, libclc, libsycl, orc-rt, llvm-libgcc | runtimes | `LLVM_SUPPORTED_RUNTIMES` [GH] | libc : composant `mathvec` en 23 ; offload : HIP sur le nouveau driver offload par défaut en 23 [WS] |
| cross-project-tests | tests multi-projets | projet | — |

Rust dans llvm-project : aucune RFC 2026 trouvée pour du code Rust dans le dépôt [WS]. Seuls liens : RFC backend Renesas RX avec support rustc (2026-11-11), RFC type byte. RFC « Forbid AI-generated communication » (oct. 2026, N. Popov) en discussion [WS].

## Couches (règle de dépendance)

| Couche | Bibliothèques (`llvm/lib`) | Peut dépendre de |
|---|---|---|
| 0 Support | `Support`, `Demangle`, `TargetParser`, `BinaryFormat` | rien (ou Demangle) |
| 1 Formats/IR | `IR` (Core), `Bitcode`, `Object`, `MC`, `Remarks`, `Option`, `TableGen` | 0 |
| 2 Analyses/transfos | `Analysis`, `Transforms/*`, `Passes` | 0–1 |
| 3 CodeGen/Target | `CodeGen`, `Target/<arch>`, `LTO` | 0–2 |
| 4 Outils | `llvm/tools/*` (pilotes minces), `llvm-driver` | toutes |

Preuve : `llvm/lib/Passes/CMakeLists.txt` liste ses `LINK_COMPONENTS` explicitement (Analysis, CodeGen, Core, IPO, Option, Support, Target…) [GH]. Règle : « One library … should only use things from the libraries listed in its dependencies … no circular dependencies » ; une bibliothèque = un dossier d'en-têtes `include/llvm/Foo` [CS]. Pas d'exceptions ni de RTTI, `isa<>/cast<>/dyn_cast<>` maison [CS].

## Build

| Élément | Fait | Source |
|---|---|---|
| Générateur | CMake + Ninja ; `cmake -S llvm -B build -DLLVM_ENABLE_PROJECTS=clang -DLLVM_ENABLE_RUNTIMES=openmp` ; runtimes seuls : `cmake -S runtimes` | [GH] llvm/CMakeLists.txt l.159-161 |
| Garde-fou | projet inconnu → `FATAL_ERROR … Did you mean to enable it as a runtime in LLVM_ENABLE_RUNTIMES?` | [GH] l.167 |
| Multicall | `option(LLVM_TOOL_LLVM_DRIVER_BUILD "Enables building the llvm multicall tool" OFF)` | [GH] l.427 |
| Génération | `.td` → `llvm-tblgen` → `.inc` (instructions, intrinsics, options `-gen-opt-parser-defs`) | [C7] |

### llvm-driver (multicall)

- Binaire `llvm` (`OUTPUT_NAME llvm`) ; outils inscrits via `GENERATE_DRIVER` dans leur CMakeLists (24 fichiers dans `llvm/tools`, dont llvm-ar, llvm-nm, llvm-objcopy, llvm-objdump, llvm-readobj, llvm-size, llvm-symbolizer, llvm-cxxfilt, dsymutil, llvm-rc, llvm-ml…) [GH code search].
- CMake écrit `LLVMDriverTools.def` : une ligne `LLVM_DRIVER_TOOL("alias", tool_entry)` par alias, aliases visibles (symlinks) et cachés ; `llvm-` retiré du nom [GH llvm-driver/CMakeLists.txt].
- Dispatch : `sys::path::stem(Argv[0])` → outil ; `llvm` seul ou `llvm --help` liste les outils [GH llvm-driver.cpp l.44-46].
- Chaque outil expose `int llvm_objdump_main(int argc, char **argv, const llvm::ToolContext &)` au lieu de `main` [GH llvm-objdump.cpp l.3983].

## Tests [TG]

| Niveau | Outil | Emplacement | Cible |
|---|---|---|---|
| Unitaires | gtest/gmock, surtout Support et structures de données | `llvm/unittests` | `check-llvm-unit` |
| Régression | lit + FileCheck ; `RUN:` obligatoire, `%s`, `lit.local.cfg` par dossier, `REQUIRES/UNSUPPORTED/XFAIL` | `llvm/test` | `check-llvm`, `check-all` |
| Golden auto | `update_test_checks.py`, `update_llc_test_checks.py` ; opt-out `NOTE: Do not autogenerate` | `llvm/utils` | — |
| Programmes entiers | dépôt séparé `test-suite` | — | — |

« expected to always pass », à lancer avant chaque commit [TG]. Préférer les tests de régression aux tests unitaires pour les transformations [TG].

## Gouvernance

| Mécanisme | Fait | Source |
|---|---|---|
| Revue | Pull Requests GitHub, revue obligatoire | [DP] |
| Incrémental | « we prefer the incremental development approach », gros changements découpés | [DP] |
| RFC | changement majeur = RFC sur Discourse avant de coder | [DP] |
| Mainteneurs | `Maintainers.md` à la racine de chaque sous-projet | [DP] |
| CODEOWNERS | 311 lignes, sert **uniquement** à l'assignation auto ; « any LLVM project member can approve » | [GH] .github/CODEOWNERS |
| Revert | « revert to green » plutôt que fix-forward ; revert normal et rapide | [DP] |
| Tests | test obligatoire pour tout bug corrigé ou feature | [DP] |
| Nouveau sous-projet | aligné sur la mission + communauté active avec mainteneurs ; incubateur = charte + plan + RFC | [DP] |
| Accès commit | « Revisiting commit-access criteria (2026) », MaskRay, juin 2026 | [WS] |
| CI | `.github/workflows`, labelers auto `new-prs-labeler.yml`, `renovate.json`, `.ci/` | [GH] |
| Lightweight review / Programmer's Manual / Writing a pass / BuildingLLVMWithCMake | non relus dans la session | [NV] |
