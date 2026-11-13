# Plan : purge du legacy, stack LLVM 2026

Aligné sur docs/llvm/UNIFIED-TOOLCHAIN.md et TOOLCHAIN-FORKS.md : une seule révision LLVM (CLANG_REVISION de Chromium), lld, ThinLTO, et `*-windows-gnullvm` quand l'ABI MinGW est requise. Aucun GCC. C:\src est en lecture seule : les purges se font par patchs dans nos forks aphrody-labs ou dans labs/forks.

## Purge (14 éléments)

| #   | Legacy                                                    | Fichier (C:\src\third_party\…)                                         | Remplacement                                                                    |
| --- | --------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | `mingw-w64-gcc` (makedepends)                             | CachyOS-PKGBUILDS/wine-cachyos/PKGBUILD:75                             | llvm-mingw construit sur notre LLVM, `--with-mingw=llvm-mingw`                  |
| 2   | idem                                                      | CachyOS-PKGBUILDS/wine-cachyos-opt/PKGBUILD:75                         | idem                                                                            |
| 3   | `mingw-w64-gcc`, `mingw-w64-tools`                        | CachyOS-PKGBUILDS/proton-cachyos-native/PKGBUILD:130-131               | llvm-mingw + `llvm-dlltool`/`llvm-windres`                                      |
| 4   | `--with-mingw` sans valeur (gcc retenu s'il est installé) | wine-cachyos/PKGBUILD:182, wine-cachyos-opt/PKGBUILD:180               | `--with-mingw=clang` (cible `*-windows`) ou `=llvm-mingw`                       |
| 5   | `*-w64-mingw32-strip`                                     | wine-cachyos/PKGBUILD:206-207                                          | `llvm-strip`                                                                    |
| 6   | `*-mingw32-strip --strip-debug`                           | proton-cachyos-native/PKGBUILD:343-354                                 | `llvm-strip` + PDB (`-gcodeview`)                                               |
| 7   | `-march=nocona -mtune=core-avx2`                          | wine-cachyos/PKGBUILD:147-151, proton-cachyos-native/PKGBUILD:288-292  | matrice x86-64-v3 (défaut), v4, znver4                                          |
| 8   | `--disable-tests`                                         | wine-cachyos/PKGBUILD:187                                              | tests construits et exécutés (PROOF.md)                                         |
| 9   | base Wine 10.0 (`_srctag=10.0-20260425`)                  | wine-cachyos/PKGBUILD:9                                                | patches cachyos rebasés sur wine 11.21                                          |
| 10  | ancien WoW64 (`--with-wine64`)                            | rien trouvé en first-party ; à interdire                               | `--enable-archs=x86_64,i386` seul, sans libs Unix 32 bits                       |
| 11  | RosBE GCC (`--gcc`)                                       | LiberNT/configure.sh:410-487, toolchain-gcc.cmake, sdk/cmake/gcc.cmake | `--clang` avec notre LLVM ; à terme toolchain-msvc.cmake en clang-cl + lld-link |
| 12  | bootstrap RosBE par `curl … \| sh`                        | LiberNT/configure.sh:42-45                                             | toolchain épinglée `ay toolchain` (R2, b3sum)                                   |
| 13  | GCC MinGW (fork RE)                                       | n2b/forks/mingw-w64-rea, n2b/crates/n2b-mingw-rea                      | rebuild llvm-mingw ; owner r2b, hors compat, simplement signalé                 |
| 14  | `x86_64-pc-windows-gnu` (Rust)                            | déjà remplacé, cf. C:\src\docs\WINDOWS_UNIX_TOOLCHAIN.md:15            | `*-windows-gnullvm`, rien à faire                                               |

À garder : third_party/mingw-w64. Ce ne sont que des en-têtes et une CRT, utilisés à la fois par llvm-mingw et par le PE de Wine.

## Toolchain par composant (LLVM uniquement)

| Composant                      | Unix                                                                                                        | PE                                                                               | Optimisation                                                |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Wine 11.x                      | clang + lld, `-march=x86-64-v3`                                                                             | `--with-mingw=clang` + lld, CRT de notre mingw-w64                               | ThinLTO côté Unix ; PE en -O2, LTO PE seulement après PROOF |
| Proton (proton-cachyos rebasé) | idem, dans le SLR sniper                                                                                    | llvm-mingw ; DXVK, VKD3D-Proton et dxvk-nvapi via un cross-file meson llvm-mingw | PGO [NV]                                                    |
| Noyau fr1/prd                  | `make LLVM=1 LLVM_IAS=1` + ThinLTO, `kernel-patches/7.4/sched/0001-bore-cachy.patch`, ntsync chargé au boot | —                                                                                | AutoFDO + Propeller (`llvm-propeller`)                      |
| LiberNT / ReactOS              | —                                                                                                           | `--clang`, puis clang-cl + lld-link                                              | ThinLTO, à mesurer                                          |
| Système                        | cachyos-settings, ananicy-rules, `ntsync.conf`                                                              | —                                                                                | —                                                           |

## Étapes

1. ntsync : sur fr2, `modprobe ntsync` et `/etc/modules-load.d/ntsync.conf` ; sur prd, resynchroniser les modules après reboot.
2. Fork wine-labs : wine 11.21 avec les patches cachyos, `--with-mingw=clang`, x86-64-v3. Build sur fr1.
3. Fork proton-cachyos : supprimer gcc, ajouter le cross-file llvm-mingw pour dxvk, vkd3d et nvapi.
4. LiberNT : CI en `--clang` avec notre LLVM, abandon de `--gcc`.
5. Une étape n'est validée que si PROOF.md est vert par rapport à la baseline GCC.
