# Écosystème compat Windows (Wine / Proton / ReactOS / LiberNT) — 2026-11-12

Sources : dépôts locaux `C:\src\third_party\*` (commit + date), `src.lock.json`, contrôles ssh fr2 (`cdn`) et prd. [NV] = non vérifié dans la session.

## Déjà présent dans C:\src (à réutiliser, sans recloner)

| Dépôt                                                                   | Commit                 | Contenu utile                                                                                                                                                              |
| ----------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| third_party/wine (fork aphrody-labs, upstream gitlab.winehq.org)        | 7384c8b 2026-11-11     | Wine 11.21 (`VERSION`)                                                                                                                                                     |
| third_party/CachyOS-PKGBUILDS                                           | 2d24d58 2026-11-10     | wine-cachyos(-opt), proton-cachyos-native/-slr, umu-launcher 1.4.4, llvm, llvm-git, llvm-propeller 20260727, cachyos-settings 1.4.4 (+ variantes DE), cachyos-ksm-settings |
| third_party/kernel-patches (CachyOS)                                    | lock                   | séries 5.15 → 7.4 ; 7.4/sched : `0001-bore-cachy.patch`, `0001-prjc-cachy.patch` ; 7.4/misc : `dkms-clang.patch`, aufs, acpi-call, rt-i915, nvidia                         |
| third_party/ananicy-rules                                               | lock                   | règles ananicy-cpp (00-default, types, cgroups)                                                                                                                            |
| third_party/cachy-chroot, cachyos-wsl, cachyos-{hyprland,niri}-settings | lock                   | outillage/config                                                                                                                                                           |
| third_party/LiberNT (fork aphrody-labs)                                 | b9d7fc111b4 2026-11-12 | NT moderne dérivé ReactOS, CMake, `toolchain-{clang,gcc,msvc}.cmake`                                                                                                       |
| third_party/mingw-w64 (fork)                                            | a215715 2026-11-11     | CRT + en-têtes Win32 libres                                                                                                                                                |
| third_party/n2b/forks/mingw-w64-rea, crates/n2b-mingw-rea               | —                      | fork RE de mingw (hors périmètre compat)                                                                                                                                   |

Absents : `linux-cachyos` (PKGBUILDs noyau, dépôt séparé), source de proton-cachyos (récupérée par tag dans le PKGBUILD), `reactos` (seulement en remote de LiberNT), `llvm-mingw`, DXVK, VKD3D-Proton et dxvk-nvapi (sous-modules de proton-cachyos).

## Wine (WineHQ)

- Version : 11.21 (branche dev), `VERSION` local 2026-11-11. Le shallow clone upstream fait sur fr2 le 2026-11-12 confirme les options ci-dessous.
- Séparation PE/Unix : les DLL sont compilées en PE par le cross-compilateur, la partie Unix va dans des `.so` séparés (`__wine_unix_call`).
- `--enable-archs={i386,x86_64,arm,aarch64,arm64ec,none}` : c'est le nouveau WoW64. Un seul build 64 bits contient aussi les PE i386 et n'a besoin d'aucune lib Unix 32 bits (`./configure --help`, fr2, 2026-11-12). `--with-wine64=DIR` sert encore à l'ancien WoW64 à deux arbres, qui est legacy.
- Cross-compilateur PE (`configure.ac` l.425-455, local) :
  - `--with-mingw=clang` (ou `/chemin/clang`) : clang seul, cible `*-windows`.
  - `--with-mingw=llvm-mingw` : `<cpu>-w64-mingw32-clang`.
  - Par défaut, configure essaie `*-w64-mingw32-clang`, puis gcc, puis `clang`. arm64ec n'existe qu'avec clang. `--help` n'affiche que `--without-mingw`, mais les valeurs clang et llvm-mingw sont acceptées (lu dans la source).
- Pilote Wayland construit par défaut (l'option `--without-wayland` existe). wine-cachyos le force avec `--with-wayland`.
- ntsync : Wine l'utilise si `/dev/ntsync` existe [NV : version d'intégration upstream]. CachyOS livre `ntsync.conf` (modules-load.d) dans wine-cachyos, wine-cachyos-opt et proton-cachyos-*.

## ntsync (noyau)

- `drivers/misc/ntsync` est en mainline (livré dans les noyaux distro, voir ci-dessous). Version d'arrivée [NV].
- fr2 : noyau 7.3.0-9-generic, `CONFIG_NTSYNC=m`, `ntsync.ko.zst` présent mais pas chargé (pas de `/dev/ntsync`).
- prd : noyau 7.2.11-arch1-1, `CONFIG_NTSYNC=m` dans /proc/config.gz, mais `modinfo ntsync` ne le trouve pas. Les modules ne correspondent probablement pas au noyau en cours (reboot en attente), à vérifier.

## Proton / Valve

- proton-cachyos : tag `cachyos-11.0-20261015-native` / `-slr` (PKGBUILD), base Proton 11.0. Dernière version Valve [NV].
- Composants : dxvk, dxvk-igdext, dxvk-nvapi, vkd3d-proton, et en extras dxvk-low-latency, vkd3d-low-latency, dxvk-sarek. Versions [NV] (sous-modules du tag).
- Build : `--enable-wow64` (nouveau WoW64), `-O3 -march=nocona -mtune=core-avx2`. Le PE est compilé avec `mingw-w64-gcc` + `mingw-w64-tools`.
- umu-launcher 1.4.4 (commit 1031d24) : lance Proton hors Steam, dans le Steam Linux Runtime.

## wine-cachyos

- `_srctag=10.0-20260425` : base Wine 10.0, une majeure de retard sur upstream 11.21.
- `--with-mingw --enable-archs=x86_64,i386 --with-wayland --disable-tests`, `-O2 -march=nocona -mtune=core-avx2`, LTO côté hôte. Dépend de `mingw-w64-gcc` ; le strip passe par `*-w64-mingw32-strip`.

## Optimisations CachyOS

- Ordonnanceur : BORE au-dessus d'EEVDF (`bore-cachy.patch`), Project C en option (`prjc-cachy.patch`). sched-ext [NV].
- Noyau : variantes x86-64-v3/v4/znver4, build clang `LLVM=1` + ThinLTO, AutoFDO + Propeller (paquet `llvm-propeller` présent) [NV pour le détail : linux-cachyos n'est pas dans le monorepo]. `dkms-clang.patch` permet les DKMS sur un noyau compilé avec clang.
- Espace utilisateur : cachyos-settings 1.4.4 (sysctl, udev, zram, ntsync), ksm-settings, ananicy-rules.
- Dépôts de paquets x86-64-v3/v4/znver4 [NV].

## ReactOS / LiberNT

- LiberNT : CMake, `configure.sh --clang` (par défaut) ou `--gcc`. Le README indique amd64 en Clang par défaut, GCC encore possible. La toolchain vient de RosBE (`~/.local/opt/rosbe/llvm`, bootstrap `LiberNT/libernt-build-toolchain`). Un `toolchain-msvc.cmake` existe aussi (MSVC/clang-cl).
- ReactOS upstream : x64 expérimental, build MSVC/clang-cl partiel [NV].

## Legacy

GCC MinGW (`mingw-w64-gcc`, `*-w64-mingw32-gcc/strip`), ancien WoW64 à deux arbres (`--with-wine64`, libs Unix 32 bits), RosBE-GCC (`--gcc`, `toolchain-gcc.cmake`, `sdk/cmake/gcc.cmake`), baseline `-march=nocona`, wine-cachyos sur base 10.0, `--disable-tests` dans les builds de référence.

## Notes consolidées (dédup 2026-11-12, voir DEDUP-2026-11-12.md)

Originaux laissés en place ; ici seulement ce qui n'était pas déjà ci-dessus.

| Sujet                            | Fait                                                                                                                                                                                                                  | Source                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Git for Windows / MSYS2 / Cygwin | MSYS2 = fork Cygwin (`msys-2.0.dll`), Git for Windows embarque un runtime MSYS2 ; `fork` Cygwin sans COW ; conversion de chemins `MSYS_NO_PATHCONV=1` ; pty historiquement en pipes nommés (ConPTY depuis Cygwin 3.1) | labs/docs/shell/windows-native.md §4                                |
| Règle first-party                | aucun `msys-2.0.dll`, `cygwin1.dll` ni GCC MinGW dans un chemin de build ; `*-windows-gnullvm` au lieu de `*-windows-gnu` ; Linux→Windows via `cargo xwin`                                                            | C:\src\docs\WINDOWS_UNIX_TOOLCHAIN.md l.15-17, 111                  |
| llvm-mingw                       | release 20261104 (mstorsjo) [V au 2026-11-12] ; cible `x86_64-w64-windows-gnullvm`, reconstruit sur CLANG_REVISION                                                                                                    | labs/docs/llvm/CROSS-COMPILE.md l.14, TOOLCHAIN-FORKS.md l.11-20    |
| msvc-wine                        | pas de release, commit 2026-11-12 ; source MSVC/SDK pour clang-cl sans Wine ; seule voie pour cl.exe sous Linux                                                                                                       | CROSS-COMPILE.md l.15, 41-42                                        |
| Git (fork)                       | third_party/git = fork aphrody-labs de microsoft/git (a6974a1, 2026-11-09) ; third_party/niu-git = git natif MSVC sans MSYS2 (06bc343, 2026-10-28)                                                                    | git remote, src.lock.json                                           |
| GCC                              | third_party/gcc : clone sparse/shallow (11 fichiers, 3c632b9 2026-11-12), épinglé dans src.lock.json ; contraire à PLAN.md (aucun GCC)                                                                                | src.lock.json l.1463                                                |
| Orchestration                    | crate C:\src\crates\unix-cachyos : détection matériel, pacman/makepkg, runtime Proton/Wine/EAC                                                                                                                        | C:\src\docs\MONOREPO_ATLAS.md l.89                                  |
| Legacy bunos                     | Wine/Proton/DXVK/VKD3D non compilés : binaires Kron4ek Wine-Builds, Valve Proton, dépôts CachyOS, via `buncc wine`/`buncc proton` (abandonné, remplacé par PLAN.md)                                                   | var/dedup-quarantine/2026-11-12/…/skills/wine-proton-stack/SKILL.md |
| Legacy MSYS2                     | bench MSYS2 `clang64` vs buncc desktop : prefix GTK4+Qt en 57 s (180 Mo) côté MSYS2, plus rapide ; « plus optimisé que MSYS2 » non prouvé                                                                             | C:\src\var\legacy\bunos\docs\BUNCC-DESKTOP.md l.64-86               |
| Fork RE mingw                    | n2b/forks/mingw-w64-rea : commit propre 474c482 (intrinsics REA, CRT PE64 hook) au-dessus de d19ea2d ; pas un doublon de third_party/mingw-w64                                                                        | git log local                                                       |
