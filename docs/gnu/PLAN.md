# Plan : remplacement et réécriture des composants GNU (2026-11-12)

Cohérent avec docs/llvm/UNIFIED-TOOLCHAIN.md, docs/compat/PLAN.md et docs/shell/MATRIX.md :
- une seule toolchain LLVM, celle de Chromium (CLANG_REVISION), et aucun GCC ;
- réécritures Rust préférées ;
- sous Windows, aucun runtime MinGW/MSYS (cible `*-windows-gnullvm` seulement quand l'ABI MinGW est requise).
Le critère de priorité est l'impact sur notre système de base : Linux prd/fr1/fr2 (CachyOS/Arch), le poste Windows nt-03 et nos builds. Rien n'est compilé ici. Chaque étape doit passer PROOF.md (baseline GNU contre remplaçant) avant d'être adoptée.

## Top 10
| # | Cible GNU | Remplacement | Où | Preuve d'adoption | Risque |
|---|---|---|---|---|---|
| 1 | coreutils | uutils coreutils 0.12.0 | Windows natif (fin de MSYS) et Linux (`uutils-coreutils` en extra Arch, avec liens dans /usr/local/bin d'abord) | GNU testsuite 94,0 % ; c'est le défaut d'Ubuntu 26.10 | les 29 échecs (relever lesquels avant de basculer `base`) |
| 2 | bash (Windows) | niubash 1.5.0 aujourd'hui, puis brush (fork aphrody-labs) | bash.exe de Claude, scripts | shell-matrix 34/34 contre 31/34 ; bloqueurs brush #1359/#1317/#1295 | procsub, `cd` des lecteurs Windows |
| 3 | gcc + binutils | clang/clang-cl + lld + llvm-ar/objcopy/strip (LLVM Chromium) | tous nos builds, noyau `LLVM=1`, Wine/Proton (compat/PLAN.md) | déjà décidé (UNIFIED-TOOLCHAIN) | `gcc-libs` reste dans Arch `base` (libgcc_s, libstdc++ des paquets distro) : on ne le retire pas |
| 4 | gnupg + gnutls + nettle/libgcrypt (nos usages) | sequoia sq/sqv ; rustls ou BoringSSL ; RustCrypto ; signatures minisign et b3sum | vérification d'artefacts, TLS de nos binaires | apt Ubuntu utilise déjà sqv | pacman reste sur gpgme (on ne touche pas Arch) |
| 5 | findutils | uutils findutils 0.11.0, et fd en interactif | Windows natif d'abord | taux GNU à mesurer (CI uutils) [NV] | `-exec`/`-printf` sur des chemins Windows |
| 6 | diffutils | uutils diffutils 0.6.0 | Windows natif, CI | tests à mesurer [NV] | diff3/sdiff |
| 7 | make + autotools + libtool + m4 | ninja/gn/cargo + just ; meson/cmake pour les dépendances tierces | nos dépôts (justfile déjà présent) | — | on garde make pour le noyau et les tiers autotools, sans réécrire |
| 8 | sed | uutils sed 0.3.0 | Windows natif | campagne de tests à faire | regex GNU (`\+`, `-E`) |
| 9 | tar + gzip + cpio | bsdtar/bsdcpio (libarchive) ; zstd pour nos artefacts ; zlib-rs dans nos binaires | Windows (tar.exe natif = bsdtar) et nos archives | — | options GNU propres (`--transform`) |
| 10 | gdb | lldb (Linux) ; WinDbg (Windows) | débogage | — | pretty-printers Rust/Chromium |

À la suite, par ordre :
- **grep** : ripgrep en interactif ; GNU grep garde les scripts jusqu'à ce que uutils grep passe en beta ;
- **gawk** : on le garde (Arch `base`) ;
- **groff/texinfo** : remplacés par mandoc et mdBook dans nos documentations ;
- **wget** : remplacé par curl ;
- **screen** : remplacé par zellij ;
- **grub** : remplacé par systemd-boot + UKI [NV : vérifier la configuration CachyOS de fr1/prd] ;
- **emacs, guix, hurd, shepherd** : abandonnés.

## À garder tel quel (upstream, via la distro)
glibc (libc hôte ; musl seulement pour les outils statiques), gcc-libs côté distro, ncurses/readline (dépendances de bash), gmp/mpfr/mpc (dépendances de gcc dans la distro), gettext/libintl, libunistring, libidn2, gdbm, bash sous Linux, gawk, less, patch, bc (build du noyau), bison et gperf (build-deps de tiers), gnulib (embarqué).

## Candidats à une réécriture par nous
Aucun pour l'instant. Pour chaque cible du top 10, un projet Rust existe et il est actif (commits de novembre 2026). Il vaut mieux contribuer upstream (uutils, brush) depuis nos forks aphrody-labs que lancer une réécriture. Seule exception possible : `tar` avec les extensions GNU sous Windows, si bsdtar ne suffit pas (uutils tar n'a aucune release).

## Étapes
1. Windows nt-03 : déposer uutils coreutils, findutils, diffutils et sed (cible `x86_64-pc-windows-msvc`, compilés sur prd avec cargo-xwin) dans `~/.local/bin`, puis faire tourner la shell-matrix et la testsuite GNU partielle.
2. Linux prd : installer `uutils-coreutils` en parallèle, rejouer nos scripts (justfile, `ay`), comparer avec la baseline GNU et consigner le résultat dans PROOF.md.
3. Signatures : passer les vérifications d'artefacts R2 de gpg à minisign + b3sum, et sqv pour les clés OpenPGP tierces.
4. Builds : achever la purge GCC (compat/PLAN.md, 14 éléments) ; mettre lld par défaut partout.
5. Mettre à jour la revue chaque trimestre : `bun tools/gnu-index/build.ts <raw> docs/gnu` régénère gnu-packages.json, PACKAGES.md et la partie générée de DISTROS.md (sources brutes : voir INDEX.md).
