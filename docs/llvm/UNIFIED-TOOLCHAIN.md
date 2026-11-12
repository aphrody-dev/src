# Une seule toolchain LLVM, du code partagé, LTO/AOT/FFI au maximum (2026-11-12)

Objectif du propriétaire : Chromium, vcpkg, LiberNT, Rust, bun, node-api et .NET compilent avec la même stack, partagent le même code, poussent FFI, AOT et LTO au maximum, et le code mort est purgé automatiquement. [V] = source consultée aujourd'hui, [NV] = à vérifier.

## 1. Ancre : la toolchain de Chromium

Chromium épingle son clang **et** son rustc, tous deux construits sur la même révision LLVM : `tools/clang/scripts/update.py` (CLANG_REVISION) et `tools/rust/update_rust.py` (RUST_REVISION). Pour Stable 157 : clang `llvmorg-24-init-7747-g62397f8b`, rust `1edd55dc…` [V third_party/chrome-channels.toml, `aphrody x channels`].
→ C'est la seule paire clang+rustc garantie sur le même LLVM. La doc rustc recommande « rustc et LLVM construits sur exactement le même LLVM » pour le LTO inter-langages [V doc.rust-lang.org/rustc/linker-plugin-lto].

Règle : **une toolchain = celle du canal Chromium suivi**, publiée sur R2 par la fabrique (F-tool), consommée partout via `ay toolchain` (tarball content-addressed, même chemin relatif sur Windows et Linux).

## 2. Qui compile quoi avec quoi

| Composant | Compilateur / éditeur de liens | LTO | Notes |
|---|---|---|---|
| Chromium, V8, Dawn, Skia | clang/clang-cl + lld de Chromium | ThinLTO (official build) | déjà le cas (args/labs_agent.gn) |
| Rust (src) | rustc de Chromium (ou nightly appariée, `rustc -vV`) + lld | `-Clinker-plugin-lto`, thin ; fat pour `min` | Windows : clang-cl + lld-link, `AR=llvm-lib` (lib.exe plante sur les .obj LTO) [V doc rustc] |
| C / C++ (src, vcpkg) | clang-cl / clang via triplet custom `VCPKG_CHAINLOAD_TOOLCHAIN_FILE` → toolchain.cmake LLVM | `-flto=thin` | [V learn.microsoft.com/vcpkg/users/triplets] |
| LiberNT / ReactOS | clang-cl (cible PE) au lieu de RosBE GCC/MinGW | à mesurer | ReactOS a un support clang partiel [NV] |
| bun | build upstream CMake + clang ; aligner sur la version LLVM de Chromium | thin [NV] | version LLVM exigée par bun [NV : SetupLLVM introuvable via gh aujourd'hui] |
| node-api (N-API) addons | clang-cl + lld ; ABI C stable | thin entre l'addon et les libs C/Rust | via napi-rs pour Rust [NV] |
| .NET 10/11 | NativeAOT (ILCompiler) ; lien natif link.exe ou lld-link [NV] | pas de LTO IL↔LLVM | interop : `[LibraryImport]` vers les libs C ABI ; node-api-dotnet pour le pont JS [NV] |
| Go, Zig, Python | Zig = LLVM (zig cc) ; Go = son propre backend (cgo via clang) ; Python = extensions via clang | Zig oui ; Go non | séparés par langage, liens uniquement via ABI C |

Conflit ouvert (à trancher par le propriétaire) : nt utilise MSVC (« full msv » : D3D12, NativeAOT, CMake VS 2026). clang-cl reste compatible ABI MSVC (mêmes en-têtes et STL) : une migration progressive est possible, une par cible.

## 3. Code partagé : une seule ABI C au centre

- Les bibliothèques cœur sont en Rust ou C/C++, exposées par **une** couche C ABI (`depot-capi`, l'équivalent de llvm-c ; couche 3 de AY-AS-LLVM.md). En-têtes générés par cbindgen.
- Consommateurs : bun (`bun:ffi`), node-api (addon fin), .NET (`LibraryImport` générés), Python (cffi), Go (cgo), Zig (`@cImport`). Aucun port parallèle de la même logique dans un autre langage.
- Les mêmes dépendances C/C++ (zlib, icu, boringssl…) viennent de **third_party de Chromium** quand Chromium les a déjà, sinon de vcpkg avec la même toolchain. Jamais deux copies.

## 4. Séparation par langage (racine)

```
crates/      Rust uniquement            packages/   TypeScript (bun) uniquement
native/c/    C pur                      native/cpp/ C++23
dotnet/      C# .NET 10/11              go/  zig/  python/
```
Pas de fichier d'un langage dans le dossier d'un autre, sauf build.rs et les bindings générés (dans `gen/`, ignorés par git).

## 5. Purge automatique (`ay prune`, CI)

| Langage | Mort / inutilisé détecté par |
|---|---|
| Rust | `cargo machete` / `cargo udeps` (deps), `-Wunused` + `dead_code` en `deny`, crates sans dépendant ni bin → signalés |
| TS | bun (imports inutilisés) + analyse des exports non référencés (style knip) [NV : choisir un outil compatible bun] |
| C/C++ | clang `-Wunused*`, `--gc-sections` / `/OPT:REF` + rapport du linker (symboles retirés) |
| .NET | analyseurs IDE0051/IDE0052, trimming NativeAOT (rapport) |
| Tous | couverture réelle (llvm-cov, profils PGO) : tout code jamais exécuté par les tests ni par les profils de prod passe en revue de suppression |

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
