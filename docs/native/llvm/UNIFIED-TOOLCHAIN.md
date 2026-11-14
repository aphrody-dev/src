# Une seule toolchain LLVM, du code partagé, LTO/AOT/FFI au maximum (2026-11-12)

Objectif du propriétaire : Chromium, vcpkg, LiberNT, Rust, bun, node-api et .NET compilent avec la même stack, partagent le même code, poussent FFI, AOT et LTO au maximum, et le code mort est purgé automatiquement. [V] = source consultée aujourd'hui, [NV] = à vérifier.

## 1. Ancre : la toolchain de Chromium

Chromium épingle son clang **et** son rustc, tous deux construits sur la même révision LLVM : `tools/clang/scripts/update.py` (CLANG_REVISION) et `tools/rust/update_rust.py` (RUST_REVISION). Pour Stable 157 : clang `llvmorg-24-init-7747-g62397f8b`, rust `1edd55dc…` [V third_party/chrome-channels.toml, `aphrody x channels`].
→ C'est la seule paire clang+rustc garantie sur le même LLVM. La doc rustc recommande « rustc et LLVM construits sur exactement le même LLVM » pour le LTO inter-langages [V doc.rust-lang.org/rustc/linker-plugin-lto].

Règle : **une toolchain = celle du canal Chromium suivi**, publiée sur R2 par la fabrique (F-tool), consommée partout via `ay toolchain` (tarball content-addressed, même chemin relatif sur Windows et Linux).

## 2. Qui compile quoi avec quoi

| Composant                          | Compilateur / éditeur de liens                                                                                                                                              | LTO                                                                                                                     | Notes                                                                                                                                                         |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chromium, V8, Dawn, Skia           | clang/clang-cl + lld de Chromium                                                                                                                                            | ThinLTO (official build)                                                                                                | déjà le cas (args/labs_agent.gn)                                                                                                                              |
| Rust (src)                         | rustc de Chromium (ou nightly appariée, `rustc -vV`) + lld                                                                                                                  | `-Clinker-plugin-lto`, thin ; fat pour `min`                                                                            | Windows : clang-cl + lld-link, `AR=llvm-lib` (lib.exe plante sur les .obj LTO) [V doc rustc]                                                                  |
| C / C++ (src, vcpkg)               | clang-cl / clang via triplet custom `VCPKG_CHAINLOAD_TOOLCHAIN_FILE` → toolchain.cmake LLVM                                                                                 | `-flto=thin`                                                                                                            | [V learn.microsoft.com/vcpkg/users/triplets]                                                                                                                  |
| LiberNT / ReactOS                  | clang-cl (cible PE) au lieu de RosBE GCC/MinGW                                                                                                                              | à mesurer                                                                                                               | ReactOS a un support clang partiel [NV]                                                                                                                       |
| bun (réécrit en Rust, plus de Zig) | scripts TS + ninja ; CMake 3.30.5 seulement pour les deps ; Rust nightly-2026-09-15, LLVM 23.1.1 (clang et rustc sur le même majeur) [V oven-sh/bun ccb3611f2a, 2026-11-12] | ThinLTO cross-language bun+JSC+Rust par défaut en release ; PGO C++/Rust + orderfile, PGO indisponible sous Windows [V] | écart : Chromium 157 = LLVM 24, bun = LLVM 23. Deux toolchains tant que bun n'est pas porté sur 24 (à tester sur prd). Détails : docs/bun/AOT-LTO-FFI-2026.md |
| node-api (N-API) addons            | clang-cl + lld ; ABI C stable                                                                                                                                               | thin entre l'addon et les libs C/Rust                                                                                   | via napi-rs pour Rust [NV]                                                                                                                                    |
| .NET 10/11                         | NativeAOT (ILCompiler) ; lien natif link.exe ou lld-link [NV]                                                                                                               | pas de LTO IL↔LLVM                                                                                                      | interop : `[LibraryImport]` vers les libs C ABI ; node-api-dotnet pour le pont JS [NV]                                                                        |
| Go, Zig, Python                    | Zig = LLVM (zig cc) ; Go = son propre backend (cgo via clang) ; Python = extensions via clang                                                                               | Zig oui ; Go non                                                                                                        | séparés par langage, liens uniquement via ABI C                                                                                                               |

Conflit ouvert (à trancher par le propriétaire) : nt utilise MSVC (« full msv » : D3D12, NativeAOT, CMake VS 2026). clang-cl reste compatible ABI MSVC (mêmes en-têtes et STL) : une migration progressive est possible, une par cible.

## 3. Code partagé : une seule ABI C au centre

- Les bibliothèques cœur sont en Rust ou C/C++, exposées par **une** couche C ABI (`depot-capi`, l'équivalent de llvm-c ; couche 3 de AY-AS-LLVM.md). En-têtes générés par cbindgen.
- Consommateurs : bun (`bun:ffi`), node-api (addon fin), .NET (`LibraryImport` générés), Python (cffi), Go (cgo), Zig (`@cImport`). Aucun port parallèle de la même logique dans un autre langage.
- Les mêmes dépendances C/C++ (zlib, icu, boringssl…) viennent de **third_party de Chromium** quand Chromium les a déjà, sinon de vcpkg avec la même toolchain. Jamais deux copies.

## 4. Séparation par langage (racine)

```
sys/         C pur + ASM (Layer 0)      packages/   TypeScript (bun) uniquement
crates/      Rust uniquement            dotnet/     C# .NET 10/11
```

Pas de fichier d'un langage dans le dossier d'un autre, sauf build.rs et les bindings générés (dans `gen/`, ignorés par git).

## 5. Purge automatique (`ay prune`, CI)

| Langage | Mort / inutilisé détecté par                                                                                                                |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Rust    | `cargo machete` / `cargo udeps` (deps), `-Wunused` + `dead_code` en `deny`, crates sans dépendant ni bin → signalés                         |
| TS      | bun (imports inutilisés) + analyse des exports non référencés (style knip) [NV : choisir un outil compatible bun]                           |
| C/C++   | clang `-Wunused*`, `--gc-sections` / `/OPT:REF` + rapport du linker (symboles retirés)                                                      |
| .NET    | analyseurs IDE0051/IDE0052, trimming NativeAOT (rapport)                                                                                    |
| Tous    | couverture réelle (llvm-cov, profils PGO) : tout code jamais exécuté par les tests ni par les profils de prod passe en revue de suppression |

Règles : crates et packages « minces » (une fonction de réexport, ou moins de N lignes sans logique) fusionnés dans leur parent ; doublons détectés par hash d'AST tree-sitter (`ay graph dup`) ; legacy (aucun appel en 90 jours de profils) proposé à la suppression. `ay prune --apply` ouvre une PR, jamais de suppression silencieuse.

## 6. Commentaires

Anglais, et seulement là où le code ne dit pas déjà ce qu'il fait (pourquoi, invariants, liens vers des sources). Commentaires redondants, paraphrases, code commenté et TODO sans ticket : retirés par `ay prune`.

## 7. Ordre (après le merge labs et le flatten de nt-03 ; builds sur prd ou fr2)

1. F-tool : publier la toolchain Chromium 157 (clang+lld+rustc) sur R2 ; `ay toolchain` la pose.
2. Rust de src avec cette toolchain : `cargo build` identique, puis `-Clinker-plugin-lto` ; mesurer taille et temps.
3. vcpkg : triplet `x64-windows-llvm` / `x64-linux-llvm` chainload ; reconstruire les ports utilisés.
4. `depot-capi` + bindings générés pour bun, node-api et .NET.
5. `ay prune` en mode rapport, puis appliqué par PR.
6. LiberNT, puis bun, avec la même toolchain (expérimental, mesuré).

## vcpkg résultats (2026-11-12, fr2)

Fichiers : `infra/vcpkg/triplets/x64-linux-llvm.cmake`, `x64-windows-llvm.cmake`, `infra/vcpkg/toolchains/linux-llvm.cmake`, `windows-llvm.cmake`. Mécanisme `VCPKG_CHAINLOAD_TOOLCHAIN_FILE` [V learn.microsoft.com/vcpkg/users/triplets]. Usage : `vcpkg install <port>:x64-linux-llvm --overlay-triplets=infra/vcpkg/triplets`.

- Toolchain Linux : clang/clang++ + `-fuse-ld=lld` (`CMAKE_LINKER_TYPE LLD`), llvm-ar/llvm-ranlib/llvm-nm, `-flto=thin -fPIC`, libs statiques, CRT dynamique. `LABS_LTO=off` coupe ThinLTO. Triple forcé à `x86_64-unknown-linux-gnu` (celui de rustc) : sans ça lld avertit « Linking two modules of different target triples » en LTO croisé (`x86_64-pc-linux-gnu` côté clang Ubuntu).
- Toolchain Windows : clang-cl, lld-link, llvm-lib, llvm-rc, llvm-mt, `-flto=thin`, `/MD`. [NV] écrite, jamais testée (aucun build Windows autorisé).
- Swap de toolchain : `LLVM_ROOT` (passé par `VCPKG_ENV_PASSTHROUGH`) pointe vers le `bin` de la toolchain. Défaut provisoire : apt.llvm.org `/usr/lib/llvm-23/bin` (Linux), `C:/Program Files/LLVM/bin` (Windows). Quand `third_party/toolchain-157.toml` existera (toolchain Chromium 157 sur R2, `aphrody-chromium/toolchain/157/`), exporter `LLVM_ROOT=<pose>/bin` ; aucun fichier à modifier. Le hash de la toolchain entre dans l'ABI vcpkg, les binaires cachés seront donc reconstruits.

Validation sur fr2 (Ubuntu 26.10, 6 cœurs, `nice`, `VCPKG_MAX_CONCURRENCY=4`) [V] :

| Élément                                | Résultat                                                                                                                                                                         |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| vcpkg                                  | fork aphrody-labs/vcpkg `177e817` (shallow), outil 2026-10-29                                                                                                                    |
| clang                                  | 23.1.6 (apt.llvm.org `llvm-toolchain-resolute-23` ; la distro n'a que 22.1.8, pas de dépôt apt.llvm.org pour 26.10)                                                              |
| rustc                                  | nightly 1.102.0 (3ef0c22cd 2026-11-11), LLVM 23.1.5 ; même majeure que clang, LTO croisé OK                                                                                      |
| zlib 1.3.2#3, zstd 1.5.7, fmt          | build OK en 23 s ; libz.a 15 objets, libzstd.a 37, libfmt.a 2 : tous `LLVM IR bitcode` (`file`), producteur `LLVM23.1.6` (`llvm-bcanalyzer -dump`)                               |
| Rust `-Clinker-plugin-lto` + libzstd.a | `rustc -Clinker-plugin-lto -Clinker=clang -Clink-arg=-fuse-ld=lld -l static=zstd` : lien OK, aller-retour compress/decompress OK, aucun avertissement après correction du triple |

Notes : installés sur fr2 et laissés en place : `clang-23 lld-23 llvm-23` (apt.llvm.org, `/etc/apt/sources.list.d/llvm23.list`), `zip`, rustup nightly minimal (la toolchain `stable` de fr2 est cassée : « missing manifest »). Arbre de travail et cache binaire vcpkg supprimés (~460 Mo).

## F-tool résultats (2026-11-12)

- Source : prebuilts Chromium 157 (`CLANG_REVISION` llvmorg-24-init-7747-g62397f8b-67, `RUST_REVISION` 1edd55dc…-1125), `commondatastorage.googleapis.com/chromium-browser-clang/{Linux_x64,Win}/`.
- Paquets : clang (inclut lld, ld.lld, lld-link, llvm-ar/nm/objcopy/readobj/symbolizer…), llvm-code-coverage, llvmobjdump, rust-toolchain (rustc, cargo, clippy, rustfmt, bindgen, crubit). Pas de paquet lld séparé (404).
- R2 : `aphrody-chromium/toolchain/157/{linux-x64,windows-x64}/<paquet>.<blake3[0:16]>.tar.zst` (8 objets, ~1,0 Go) ; manifeste `third_party/toolchain-157.toml` (tailles, sha256, blake3, URLs source).
- Vérifié sur prd (Linux) : `clang version 24.0.0git` (llvm-project 86922d51) ; `rustc 1.100.0-nightly (1edd55dcf 2026-09-09)`, `LLVM version: 24.0.0`. Même LLVM majeur.
- Note : zstd -19 est ~15-25 % plus gros que le xz d'origine ; à reconsidérer (`--ultra -22 --long`) si la taille compte.
