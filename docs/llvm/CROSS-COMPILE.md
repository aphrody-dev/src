# Cross-compilation 2026 (LLVM vs MSVC)

Date : 2026-11-12. Légende : [V] vérifié dans la session (source + date), [NV] non vérifié. Complète UNIFIED-TOOLCHAIN.md.

## Versions constatées (gh api / Codeberg, 2026-11-12)

| Outil | Version | Source |
|---|---|---|
| LLVM | 23.1.5 (2026-11-03) | gh releases llvm/llvm-project [V] |
| cargo-xwin | 0.23.1 (2026-08-13) | gh releases rust-cross/cargo-xwin [V] |
| xwin | 0.10.0 (2026-08-12) | gh releases Jake-Shadle/xwin [V] |
| cargo-zigbuild | 0.24.1 (2026-11-04) | gh releases rust-cross/cargo-zigbuild [V] |
| Zig | 0.17.1 (tag), dépôt déplacé sur Codeberg ; GitHub figé à 0.15.1 | Codeberg API tags + gh repo description [V] |
| llvm-mingw | 20261104 | gh releases mstorsjo/llvm-mingw [V] |
| msvc-wine | pas de release, actif (commit 2026-11-12) | gh commits [V] |
| cross-rs | dernière release v0.2.5 (2023-02-04), main actif (commit 2026-10-31) | gh [V] |
| prd | rustc LLVM 23.1.1, clang 23.1.4, cargo-xwin 0.23.1 + cache xwin | `ssh prd` [V] |

## Matrice hôte → cible

| Cible | Hôte Linux (prd/CI) | Hôte Windows (PC) | Limites |
|---|---|---|---|
| windows-msvc (Rust) | **cargo-xwin** (clang-cl + lld-link + CRT/SDK via xwin) | cargo natif (link.exe ou lld-link) | SDK MS non redistribuable (voir licence) |
| windows-msvc (C/C++23) | clang-cl + lld-link + splat xwin/msvc-wine (`/winsysroot`) | clang-cl ou cl.exe | `import std` : module STL MSVC à compiler soi-même [NV] |
| windows-msvc (.NET NativeAOT) | **impossible** | `dotnet publish -r win-x64` | cross-OS non supporté (Learn) |
| windows-gnu / gnullvm | cargo-zigbuild ou llvm-mingw | idem | ABI C++ incompatible MSVC ; refusé pour runtime (voir MinGW) |
| linux-gnu (glibc ancienne) | **cargo-zigbuild** `--target x86_64-unknown-linux-gnu.2.17` | cargo-zigbuild | pas de `crt-static` glibc ; utiliser musl |
| linux-musl (statique) | cargo-zigbuild ou cargo natif + `rust-lld` | cargo-zigbuild | allocateur musl lent : mimalloc [NV] |
| linux (.NET NativeAOT) | natif / conteneur `sdk:10.0-noble-aot` | conteneur/WSL (WSL interdit chez nous → CI Linux) | même OS requis |
| macOS | cargo-zigbuild + SDK macOS (images docker fournies) | idem | licence SDK Apple [NV] ; .NET : Mac requis |
| wasm32-wasip2 / unknown | cargo natif (rust-lld) | cargo natif | pas de toolchain C : clang `--target=wasm32` + wasi-sdk [NV] |
| Chromium win | gn/ninja Linux, `DEPOT_TOOLS_WIN_TOOLCHAIN_BASE_URL` + zip `package_from_installed.py` | gclient natif | voir Chromium |

## Par outil

- **cargo-xwin** : télécharge CRT + SDK via xwin, compile C avec clang-cl, lie avec lld-link. Validé sur prd 2026-11-12 : Rust + C (cc crate) → `hx.exe` 115 712 o (LTO fat, strip) ; avec `-Clinker-plugin-lto` + `CFLAGS=-flto=thin` : 114 176 o ; exécuté sur le PC : `hello xwin 42` [V]. Inlining effectif de `c_add` non prouvé (binaire strippé) [NV]. Condition du LTO croisé : LLVM rustc (23.1.1) et clang (23.1.4) même majeure [V prd] ; règle rustc book « linker-plugin-lto » [NV, non relu].
- **xwin** : outil MIT/Apache-2.0 ; `--accept-license` / `XWIN_ACCEPT_LICENSE=1` vaut acceptation de la licence Microsoft (README xwin, 2026-11-12) [V]. Le contenu (CRT, SDK) reste sous licence Visual Studio/Build Tools : msvc-wine indique « Visual Studio isn't redistributable, the installed toolchain isn't either » et pointe la licence `go.microsoft.com/fwlink/?LinkId=2086102` (README msvc-wine, 2026-11-12) [V]. Conséquence : ne jamais publier le splat (R2, image docker, artefact CI public) ; le télécharger dans chaque environnement. Usage commercial / Build Tools : termes exacts à relire [NV].
- **cargo-zigbuild / `zig cc`** : `zig cc` comme linker. glibc ciblée par suffixe `.2.17` ; défaut 2.28 pour Zig 0.12–0.14 ; avertissement de repli non relayé ; `crt-static` glibc non supporté (README cargo-zigbuild, 2026-11-12) [V]. Windows : seulement `*-windows-gnu` (MinGW) ; msvc non fourni par Zig [NV]. Non validé sur prd (Zig absent, charge 13 sur 8 cœurs).
- **cross-rs** : Docker, dernière release 2023 → éviter ; zigbuild ou xwin couvrent le besoin [V dates].
- **`-Zbuild-std`** : nightly seulement ; utile pour `panic=abort` + `opt-level` sur std, cibles tier 3 [NV statut 2026 ; wg-cargo-std-aware actif, issue mise à jour 2026-05-07 V].
- **msvc-wine** : télécharge VS via manifests officiels, utilisable comme source MSVC/SDK pour clang-cl sans Wine ; cl.exe/link.exe sous Wine possible (README) [V].
- **MSVC natif sur Linux** : aucun binaire cl.exe/link.exe Linux ; seule voie = Wine (msvc-wine) [V README msvc-wine ; absence d'annonce MS NV].
- **.NET NativeAOT** : « Native AOT does not support cross-OS compilation », cross-arch x64↔arm64 OK ; link.exe + CRT statique VC requis sur Windows, « no plans to support Native AOT without Visual Studio » (Learn, native-aot/cross-compile et aspnet native-aot-tutorial, consultés 2026-11-12) [V]. → job Windows dédié (PC ou runner Windows).
- **Chromium win depuis Linux** : supporté sauf `js2gtest` ; `.asm` stubbés → Crashpad ne remonte pas les crashs, NaCl désactivé ; toolchain = zip produit par `package_from_installed.py` sur une machine Windows, servi via `DEPOT_TOOLS_WIN_TOOLCHAIN_BASE_URL` + `GYP_MSVS_HASH_<hash>` (docs/win_cross.md, chromium main, lu 2026-11-12) [V]. → builds release Windows officielles restent sur Windows (Crashpad).
- **mingw-w64 / llvm-mingw** : `x86_64-pc-windows-gnu` Tier 1, `*-windows-gnullvm` Tier 2 (rustc platform-support.md, commit 2026-10-23) [V]. Jugement : la règle « pas de MinGW/MSYS » vise les shells runtime ; comme toolchain, llvm-mingw est admissible pour des outils CLI isolés en C pur, mais **refusé pour tout ce qui croise une frontière C++ ou .NET** (ABI C++ Itanium, CRT différent de l'UCRT MSVC ? llvm-mingw cible UCRT par défaut [NV]). Défaut : msvc partout sur Windows.

## Recommandations

1. Windows : une seule ABI, `x86_64-pc-windows-msvc`. PC = clang-cl/lld-link natif ; prd/CI = cargo-xwin. Pas de gnu.
2. Linux distribué : cargo-zigbuild `.2.17` (ou `.2.28`) pour les binaires CLI ; musl pour statique.
3. .NET NativeAOT : un build par OS (Windows sur PC/runner Windows, Linux sur prd). Aucun cross-OS.
4. LTO croisé Rust↔C : uniquement si majeure LLVM identique (pin rustc nightly ↔ clang), vérifier `rustc -vV` en CI.
5. Splat MSVC/SDK : jamais redistribué ; cache local par machine (`~/.cache/cargo-xwin`).
6. Chromium : cross Linux→Windows pour l'itération dev ; release sur Windows.
