# Toolchains forkées, patchées et optimisées pour Chromium, LiberNT et le noyau Linux (2026-11-12)

Décision du propriétaire : mingw, vcpkg, zig et le compilateur Rust sont forkés et patchés, et « non compatible Win32 » n'est plus un frein. Toute la base passe par nos forks épinglés.

## Forks (aphrody-labs)

| Upstream                                         | Fork                    | Rôle                                                                                          |
| ------------------------------------------------ | ----------------------- | --------------------------------------------------------------------------------------------- |
| llvm/llvm-project                                | llvm-project            | clang, lld et compiler-rt partagés (révision Chromium)                                        |
| rust-lang/rust, rust-lang/cargo                  | rust, cargo             | rustc sur le LLVM de Chromium, cargo patché (build-std, cranelift)                            |
| mingw-w64/mingw-w64, mstorsjo/llvm-mingw         | mingw-w64, llvm-mingw   | CRT et en-têtes Win32 libres, nécessaires à LiberNT/ReactOS et à `*-windows-gnullvm`          |
| codeberg.org/ziglang/zig (GitHub figé en 0.15.1) | zig (miroir)            | `zig cc` pour glibc ciblée, base C du cross-compile                                           |
| microsoft/vcpkg, microsoft/vcpkg-tool            | vcpkg, vcpkg-tool       | triplets LLVM (infra/vcpkg, validés sur fr2)                                                  |
| torvalds/linux, LiberNT/LiberNT, reactos/reactos | linux, LiberNT, reactos | noyaux construits avec clang (Linux : `LLVM=1` [NV], ReactOS/LiberNT : clang-cl partiel [NV]) |

## Patchs visés (ordre de gain)

1. **Une seule révision LLVM** : llvm-project épinglé sur CLANG_REVISION de Chromium. rust, zig et llvm-mingw sont reconstruits sur cette révision, ce qui donne des objets LTO compatibles partout (aujourd'hui : rustc 23.1.5 contre clang 23.1.6, même majeure, LTO OK sur fr2).
2. **rustc** : `-Zbuild-std` par défaut dans nos profils, `codegen-backend=cranelift` en dev, PGO/BOLT du compilateur lui-même (comme upstream `x.py dist` avec `rust.lto`).
3. **llvm-mingw / mingw-w64** : cible `x86_64-w64-windows-gnullvm` (ABI MinGW avec lld et libc++), utilisée pour LiberNT et pour les outils C purs. Rappel ABI : pas de frontière C++ ni .NET entre l'ABI gnu et l'ABI msvc (C-ABI-2026.md).
4. **zig** : le même LLVM, `zig cc` comme driver de cross-compilation Linux (glibc 2.17 et +) et pour la libc statique musl.
5. **vcpkg** : les triplets x64-linux-llvm et x64-windows-llvm deviennent ceux par défaut. Les ports partagés avec Chromium (zlib, icu, boringssl…) pointent vers les sources de Chromium : une copie, pas deux.
6. **Noyaux** : Linux en `make LLVM=1 LLVM_IAS=1` + ThinLTO/CFI ; LiberNT/ReactOS : build clang-cl, en remplaçant RosBE (GCC/MinGW) cible par cible.

## Contraintes qui restent (techniques, pas de licence)

- Le SDK et la CRT MSVC téléchargés par xwin ne sont pas redistribuables : ils sont retéléchargés partout, jamais publiés (CROSS-COMPILE.md).
- .NET NativeAOT : pas de cross-OS, link.exe et la CRT VC requis, donc un job Windows dédié.
- Chromium release Windows : build sur Windows. Le cross depuis Linux sert seulement à l'itération.

## Exécution

Builds de toolchain sur prd (8 cœurs) et fr1 (12 cœurs, après F0), artefacts sur R2 (`aphrody-chromium/toolchain/<rev>/`), consommés par `ay toolchain`. Chaque fork reçoit une branche `aphrody/<rev-chromium>` et un `PATCHES.md`.
