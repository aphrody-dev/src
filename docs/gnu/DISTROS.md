# GNU dans Ubuntu 26.10 et Arch Linux (2026-11-12)

## Sources et conflits

- Ubuntu 26.10 = **stonking**, pas « resolute » : `dists/resolute/Release` dit `Version: 26.04`, `dists/stonking/Release` dit `Version: 26.10`, `Date: 2026-10-15` ; `devel` = tenacious 27.04 (archive.ubuntu.com, 2026-11-12). Données : `Packages.xz` et `Sources.xz` de stonking, stonking-updates et stonking-security, main et universe, amd64.
- Socle Ubuntu = binaires `Essential: yes` ou `Priority: required|important`. Le socle Arch = dépendances des métapaquets `base` (3-3) et `base-devel` (1-2) dans `core.db` (geo.mirror.pkgbuild.com, 2026-11-12). Arch n'utilise plus de groupes pour ces deux-là : ce sont des métapaquets.
- La correspondance se fait par nom (nom exact, `gnu-<nom>`, suffixe versionné, alias curés). Un paquet GNU distribué sous un autre nom peut avoir été manqué [NV]. Faux positif retiré : `fdisk` (util-linux, pas GNU fdisk) ; idem pour `health` côté Arch (app GNOME).

## Remplacements déjà faits par les distros (vérifiés dans les métadonnées)

| Domaine | Ubuntu 26.10 | Arch |
|---|---|---|
| coreutils | `coreutils` 9.10+2ubuntu1 (Essential) est un paquet de transition : `Pre-Depends: coreutils-from-uutils \| coreutils-from-gnu`. `coreutils-from-uutils` est `required` et tire `rust-coreutils` 0.12.0 (`required`), alors que `coreutils-from-gnu` est `optional`. Il existe aussi `coreutils-from-busybox` et `coreutils-from-toybox`. **uutils est le défaut.** | GNU coreutils 9.12 dans `base` ; `uutils-coreutils` 0.12.0 dans extra (optionnel) |
| sudo (pas GNU) | `ubuntu-minimal` dépend de `sudo` **et** de `sudo-rs` 0.2.14 (tous deux `important`) ; nouveau `sudo-common` | `sudo` 1.9.17p2 dans `base-devel` ; `sudo-rs` 0.2.15 dans extra |
| vérification OpenPGP | `apt` dépend de `sqv (>= 1.3.0)` (Sequoia, Rust) ; `gpgv` reste `important` ; `gpg-from-sq` et `gpgv-from-sq` en universe | pacman dépend de `gpgme` et `gnupg` ; `sequoia-sq` 1.4.1, `sequoia-sqv` 1.5.0 et `sequoia-chameleon-gnupg` 0.13.1 sont optionnels |
| findutils / diffutils / sed / grep | GNU reste Essential ; `rust-findutils`, `rust-diffutils`, `rust-sed` et `rust-grep` existent en universe (optionnels) | GNU uniquement |
| awk | `ubuntu-minimal` dépend de `mawk` ; gawk 5.3.2 hors socle | gawk 5.4.1 dans `base` et `base-devel` |
| shell | bash 5.3 Essential | bash 5.3.20 dans `base` ; `brush` 0.4.0 et `oils-for-unix` 0.38.0 dans extra |
| toolchain | gcc-16 (runtime `libgcc-s1`, `libstdc++6` dans le socle) | `gcc-libs` dans `base`, gcc/binutils dans `base-devel` ; clang/lld/lldb 23.1.4, mold 3.0.0, wild 0.11.0 dans extra |

Ce qui ressort : seul Ubuntu a remplacé un paquet GNU du socle par défaut, et c'est coreutils. Pour gpg, Ubuntu ne remplace pas GnuPG mais l'a sorti du chemin critique d'APT (sqv). Arch reste 100 % GNU dans `base`.

Tables générées (voir [gnu-packages.json](gnu-packages.json)) ; analyse et remplacements dans la section finale.

## Couverture

- Paquets GNU (hors décommissionnés) : 388
- Présents dans Ubuntu 26.10 stonking (main+universe) : 176 ; dont dans le socle (binaire Essential ou Priority required/important) : 22
- Présents dans Arch core+extra : 113 ; dont dans `base` : 11, dans `base-devel` : 18

Correspondance par nom (nom exact, `gnu-<nom>`, suffixe versionné, alias curés) : un paquet absent peut exister sous un autre nom [NV].

## Socle : paquets GNU dans les ensembles de base

| Paquet | Ubuntu source | Version Ubuntu | Socle Ubuntu (binaires) | Arch pkg | Version Arch | base | base-devel | Remplacé par la distro |
|---|---|---|---|---|---|---|---|---|
| autoconf | autoconf | 2.73-2 | — | autoconf (autoconf) | 2.73-1 |  | oui | — |
| automake | automake | 1:1.18.1-4 | — | automake (automake) | 1.19-1 |  | oui | — |
| bash | bash | 5.3-3ubuntu1 | bash(essential):required | bash (bash) | 5.3.20-1 | oui |  | — |
| binutils | binutils | 2.47-6ubuntu1 | — | binutils (binutils) | 2.47-4 |  | oui | — |
| bison | bison | 2:3.8.2+dfsg-1ubuntu1 | — | bison (bison) | 3.8.2-8 |  | oui | — |
| coreutils | coreutils | 9.10-1ubuntu2 | gnu-coreutils:required | coreutils (coreutils) | 9.12-3 | oui |  | Ubuntu : rust-coreutils 0.12.0 (uutils) via coreutils-from-uutils, Priority required ; GNU disponible en gnu-coreutils 9.10 |
| diffutils | diffutils | 1:3.12-1ubuntu2 | diffutils(essential):required | diffutils | 3.12-2 |  |  | — |
| findutils | findutils | 4.11.0-2 | findutils(essential):required | findutils (findutils) | 4.11.0-1 | oui | oui | — |
| fribidi | fribidi | 1.0.16-5 | libfribidi0:important | fribidi | 1.0.18-1 |  |  | — |
| gawk | gawk | 1:5.3.2-1ubuntu2 | — | gawk (gawk) | 5.4.1-1 | oui | oui | — |
| gcc | gcc-16 | 16.2.0-3ubuntu1 | gcc-16-base:required, libatomic1:important, libgcc-s1:required, libstdc++6:important | gcc (gcc, gcc-libs) | 16.2.1+r23+gd564253eb6c8-1 | oui | oui | — |
| gettext | gettext | 1.0-3 | — | gettext (gettext) | 1.0-2 | oui | oui | — |
| gmp | gmp | 2:6.3.0+dfsg-5ubuntu2 | libgmp10:required | gmp | 6.3.0-3 |  |  | — |
| gnupg | gnupg2 | 2.4.9-4ubuntu3 | gpgv:important | gnupg | 2.4.9-4 |  |  | Ubuntu : apt dépend de sqv ≥ 1.3.0 (Sequoia) pour vérifier les dépôts ; gpgv reste Priority important ; gpg-from-sq/gpgv-from-sq en universe (optional) ; Arch : non : pacman dépend de gpgme |
| gnutls | gnutls28 | 3.8.13-1ubuntu1 | libgnutls30t64:important | gnutls | 3.8.13-3 |  |  | — |
| grep | grep | 3.12-1 | grep(essential):required | grep (grep) | 3.12-2 | oui | oui | — |
| groff | groff | 1.24.1-1 | — | groff (groff) | 1.24.2-1 |  | oui | — |
| gzip | gzip | 1.14-1~exp2ubuntu3 | gzip(essential):required | gzip (gzip) | 1.15-1 | oui | oui | — |
| less | less | 668-1build1 | less:important | less | 1:710-1 |  |  | — |
| libc | glibc | 2.44-1ubuntu2 | libc-bin(essential):required, libc-gconv-modules-extra:required, libc6:required, locales:important | glibc (glibc) | 2.44+r50+g1848099f063e-1 | oui |  | — |
| libgcrypt | libgcrypt20 | 1.12.2-1ubuntu2 | libgcrypt20:important | libgcrypt | 1.12.4-1 |  |  | — |
| libidn2 | libidn2 | 2.3.8-5 | libidn2-0:important | libidn2 | 2.3.8-1 |  |  | — |
| libtasn1 | libtasn1-6 | 4.21.0-2 | libtasn1-6:important | libtasn1 | 4.21.0-1 |  |  | — |
| libtool | libtool | 2.5.4-11 | — | libtool (libtool) | 2.6.2-5 |  | oui | — |
| libunistring | libunistring | 1.4.2-1 | libunistring5:important | libunistring | 1.4.2-1 |  |  | — |
| m4 | m4 | 1.4.21-1 | — | m4 (m4) | 1.4.21-2 |  | oui | — |
| make | make-dfsg | 4.4.1-3 | — | make (make) | 4.4.1-3 |  | oui | — |
| ncurses | ncurses | 6.6+20260608-2 | libncursesw6:required, libtinfo6:required, ncurses-base(essential):required, ncurses-bin(essential):required | ncurses | 6.6-2 |  |  | — |
| nettle | nettle | 3.10.2-1 | libhogweed6t64:important, libnettle8t64:important | nettle | 4.0-1 |  |  | — |
| patch | patch | 2.8-2build1 | — | patch (patch) | 2.8.1-1 |  | oui | — |
| readline | readline | 8.3-4 | libreadline8t64:important, readline-common:important | readline | 8.3.6-1 |  |  | — |
| sed | sed | 4.9-3 | sed(essential):required | sed (sed) | 4.10-2 | oui | oui | — |
| tar | tar | 1.35+dfsg-5ubuntu1 | tar(essential):required | tar (tar) | 1.35-5 | oui |  | — |
| texinfo | texinfo | 7.3-2build1 | — | texinfo (texinfo) | 7.3-3 |  | oui | — |
| which | gnu-which | 2.21+dfsg-5build1 | — | which (which) | 2.25-1 |  | oui | — |

## Tous les paquets GNU présents dans au moins une distro

| Paquet | Catégorie | Ubuntu source | Ubuntu | Arch | Arch repo |
|---|---|---|---|---|---|
| a2ps | documentation/Texinfo | a2ps | 1:4.15.8-1 | a2ps 4.15.8-1 | extra |
| acct | shell/userland | acct | 6.6.4-11 | — | — |
| acm | games | acm | 6.0+20200416-1.2ubuntu1 | — | — |
| adns | libraries | adns | 1.6.2-3 | adns 1.7.0-1 | extra |
| anubis | networking | — | — | anubis 1.28.2-1 | extra |
| apl | toolchain | gnu-apl | 2.0-2 | — | — |
| aspell | documentation/Texinfo | aspell | 0.60.8.2-3 | aspell 0.60.8.3-1 | extra |
| auctex | documentation/Texinfo | auctex | 13.2-1.1 | — | — |
| autoconf | build systems autotools | autoconf | 2.73-2 | autoconf 2.73-1 | core |
| autoconf-archive | build systems autotools | autoconf-archive | 20241016-3 | autoconf-archive 1:2024.10.16-4 | extra |
| autogen | build systems autotools | autogen | 1:5.18.16-9 | autogen 5.18.16-6 | extra |
| automake | build systems autotools | automake | 1:1.18.1-4 | automake 1.19-1 | core |
| barcode | applications | barcode | 0.99-9build1 | barcode 0.99-6 | extra |
| bash | shell/userland | bash | 5.3-3ubuntu1 | bash 5.3.20-1 | core |
| bazaar | toolchain | bazaar | 0.9.4-2 | bazaar 0.9.9-1 | extra |
| bc | shell/userland | bc | 1.07.1-4build1 | bc 1.08.2-1 | extra |
| binutils | toolchain | binutils | 2.47-6ubuntu1 | binutils 2.47-4 | core |
| bison | toolchain | bison | 2:3.8.2+dfsg-1ubuntu1 | bison 3.8.2-8 | core |
| cflow | toolchain | cflow | 1:1.8-1build1 | — | — |
| clisp | languages | clisp | 1:2.49.20250504.gitf662209-2 | clisp 2.49.95-3 | extra |
| complexity | toolchain | complexity | 1.13-2 | — | — |
| coreutils | shell/userland | coreutils | 9.10-1ubuntu2 | coreutils 9.12-3 | core |
| cpio | shell/userland | cpio | 2.15+dfsg-2.1ubuntu1 | cpio 2.15-3 | extra |
| cppi | toolchain | cppi | 1.18-6 | — | — |
| cssc | toolchain | cssc | 1.4.1-1build1 | — | — |
| datamash | science/math | datamash | 1.9-2 | datamash 1.9-1 | extra |
| dc | science/math | bc | 1.07.1-4build1 | — | — |
| ddd | toolchain | ddd | 1:3.3.12-5.4build3 | — | — |
| ddrescue | shell/userland | — | — | ddrescue 1.30-2 | extra |
| dejagnu | toolchain | dejagnu | 1.6.3-3 | dejagnu 1.6.3-21 | extra |
| denemo | multimedia | denemo | 2.6.49-0.2 | — | — |
| dia | multimedia | dia | 0.98+git20260221-3 | — | — |
| dico | applications | dico | 2.12-4build1 | — | — |
| diction | documentation/Texinfo | diction | 1.14-1build1 | — | — |
| diffutils | shell/userland | diffutils | 1:3.12-1ubuntu2 | diffutils 3.12-2 | core |
| direvent | shell/userland | direvent | 5.5-1 | — | — |
| ed | editors | ed | 1.22.5-1 | ed 1.22.6-1 | extra |
| electric | science/math | electric | 9.08.1+dfsg-1 | — | — |
| emacs | editors | emacs | 1:30.2+1-11ubuntu1 | emacs 31.1-2 | extra |
| emacs-muse | networking | — | — | emacs-muse 3.20.2-2 | extra |
| emms | multimedia | emms | 6.00-1build1 | — | — |
| enscript | documentation/Texinfo | enscript | 1.6.5.90-3.2build1 | enscript 1.6.6-6 | extra |
| ferret | libraries | ferret | 0.7-6 | — | — |
| findutils | shell/userland | findutils | 4.11.0-2 | findutils 4.11.0-1 | core |
| freedink | games | freedink | 109.6-8 | — | — |
| freeipmi | shell/userland | freeipmi | 1.6.18-1ubuntu1 | freeipmi 1.6.20-1 | extra |
| fribidi | libraries | fribidi | 1.0.16-5 | fribidi 1.0.18-1 | extra |
| g-golf | desktop/GNOME-related | g-golf | 0.8.7-5 | — | — |
| gawk | shell/userland | gawk | 1:5.3.2-1ubuntu2 | gawk 5.4.1-1 | core |
| gcal | applications | gcal | 4.2.0-3build1 | — | — |
| gcc | toolchain | gcc-16 | 16.2.0-3ubuntu1 | gcc 16.2.1+r23+gd564253eb6c8-1 | core |
| gcl | languages | gcl | 2.6.14-21ubuntu1 | — | — |
| gdb | toolchain | gdb | 17.2-1ubuntu1 | gdb 18.1-1 | extra |
| gdbm | libraries | gdbm | 1.26-1build1 | gdbm 1.26-2 | core |
| gengen | toolchain | — | — | gengen 1.4.3-1 | extra |
| gengetopt | toolchain | gengetopt | 2.23+dfsg1-1build1 | gengetopt 2.23.1-1 | extra |
| gettext | libraries | gettext | 1.0-3 | gettext 1.0-2 | core |
| gforth | languages | gforth | 0.7.3+dfsg-10 | — | — |
| ghostscript | documentation/Texinfo | ghostscript | 10.07.1~dfsg-1ubuntu2.1 | ghostscript 10.08.0-1 | extra |
| gimp | multimedia | gimp | 3.2.6-1 | gimp 3.2.8-1 | extra |
| global | toolchain | global | 6.6.14-1.1build1 | global 6.7-1 | extra |
| glpk | science/math | glpk | 5.0-3 | glpk 5.0-3 | extra |
| gmp | science/math | gmp | 2:6.3.0+dfsg-5ubuntu2 | gmp 6.3.0-3 | core |
| gnat | toolchain | gnat | 14.1ubuntu2 | — | — |
| gnuastro | science/math | gnuastro | 0.24-1 | — | — |
| gnubg | games | gnubg | 1.08.003-7 | — | — |
| gnubiff | networking | gnubiff | 2.2.17-7build1 | gnubiff 2.2.17-14 | extra |
| gnucap | science/math | gnucap | 1:0.36~20171003-1.1build3 | — | — |
| gnucash | applications | gnucash | 1:5.16-2 | gnucash 5.17-1 | extra |
| gnucobol | toolchain | gnucobol | 5build1 | — | — |
| gnugo | games | gnugo | 3.9.1-1 | gnugo 3.8-8 | extra |
| gnuit | desktop/GNOME-related | gnuit | 4.9.5-5.1 | — | — |
| gnujump | games | gnujump | 1.0.8-7 | gnujump 1.0.8-7 | extra |
| gnulib | build systems autotools | gnulib | 20260704-2 | — | — |
| gnumeric | applications | gnumeric | 1.12.57-1.1build4 | gnumeric 1.12.62-2 | extra |
| gnunet | networking | gnunet | 0.20.0-9 | — | — |
| gnupg | crypto/security | gnupg2 | 2.4.9-4ubuntu3 | gnupg 2.4.9-4 | core |
| gnuradio | multimedia | gnuradio | 3.10.12.0-6build2 | gnuradio 3.10.12.0-18 | extra |
| gnushogi | games | gnushogi | 1.5~git20140725-3 | — | — |
| gnustep | desktop/GNOME-related | meta-gnustep | 14.1 | — | — |
| gnutls | crypto/security | gnutls28 | 3.8.13-1ubuntu1 | gnutls 3.8.13-3 | core |
| gperf | toolchain | gperf | 3.3-1 | gperf 3.3-2 | extra |
| gprofng-gui | toolchain | gprofng-gui | 1:2.2-2 | — | — |
| gprolog | languages | gprolog | 1.5.0-0.1 | — | — |
| grep | shell/userland | grep | 3.12-1 | grep 3.12-2 | core |
| gretl | applications | gretl | 2026b-1 | — | — |
| groff | documentation/Texinfo | groff | 1.24.1-1 | groff 1.24.2-1 | core |
| grub | libc/runtime | grub2 | 2.14-2ubuntu3 | grub 2:2.16-1 | core |
| gsasl | crypto/security | gsasl | 2.2.4-1 | gsasl 2.2.4-1 | extra |
| gsl | science/math | gsl | 2.8+dfsg-6ubuntu1 | gsl 2.8-1 | extra |
| gss | crypto/security | gss | 1.0.4-5 | — | — |
| gtypist | applications | gtypist | 2.9.5-4build1 | — | — |
| guile | languages | guile-3.0 | 3.0.11-2 | guile 3.0.11-1 | core |
| gv | documentation/Texinfo | gv | 1:3.7.4-3.2 | — | — |
| gxmessage | desktop/GNOME-related | — | — | gxmessage 4.1.1-1 | extra |
| gzip | shell/userland | gzip | 1.14-1~exp2ubuntu3 | gzip 1.15-1 | core |
| hello | toolchain | hello | 2.12.3-1 | — | — |
| help2man | documentation/Texinfo | help2man | 1.49.3maysync1 | help2man 1.49.3-2 | extra |
| hp2xx | documentation/Texinfo | hp2xx | 3.4.4-14 | — | — |
| httptunnel | networking | httptunnel | 3.3+dfsg-6build1 | httptunnel 3.3-9 | extra |
| indent | toolchain | indent | 2.2.13-8 | indent 2.2.13-2 | extra |
| inetutils | networking | inetutils | 2:2.8-2ubuntu1 | inetutils 2.8-1 | core |
| intlfonts | desktop/GNOME-related | intlfonts | 1.4.2-3 | — | — |
| jel | libraries | jel | 2.1.2-2build1 | — | — |
| less | shell/userland | less | 668-1build1 | less 1:710-1 | core |
| libc | libc/runtime | glibc | 2.44-1ubuntu2 | glibc 2.44+r50+g1848099f063e-1 | core |
| libcdio | multimedia | libcdio | 2.2.0-4.1 | libcdio 2.4.0-1 | extra |
| libextractor | multimedia | libextractor | 1:1.19-2 | libextractor 1.20-1 | extra |
| libgcrypt | crypto/security | libgcrypt20 | 1.12.2-1ubuntu2 | libgcrypt 1.12.4-1 | core |
| libiconv | libraries | — | — | libiconv 1.19.1-1 | extra |
| libidn | libraries | libidn | 1.44-1 | libidn 1.44-1 | extra |
| libidn2 | libraries | libidn2 | 2.3.8-5 | libidn2 2.3.8-1 | core |
| libmatheval | science/math | libmatheval | 1.1.11+dfsg-5build1 | — | — |
| libmicrohttpd | networking | libmicrohttpd | 1.0.10-1 | libmicrohttpd 1.0.10-1 | core |
| libsigsegv | libraries | libsigsegv | 2.15-1build1 | libsigsegv 2.15-1 | extra |
| libtasn1 | crypto/security | libtasn1-6 | 4.21.0-2 | libtasn1 4.21.0-1 | core |
| libtool | build systems autotools | libtool | 2.5.4-11 | libtool 2.6.2-5 | core |
| libunistring | libraries | libunistring | 1.4.2-1 | libunistring 1.4.2-1 | core |
| lilypond | multimedia | lilypond | 2.24.4-6 | lilypond 1:2.26.0-1 | extra |
| lrzsz | networking | lrzsz | 0.12.21rc-4 | lrzsz 0.13.1-1 | extra |
| m4 | build systems autotools | m4 | 1.4.21-1 | m4 1.4.21-2 | core |
| macchanger | networking | macchanger | 1.7.0-6build1 | macchanger 1.7.0-6 | extra |
| mailman | networking | mailman3 | 3.3.10-0ubuntu3 | — | — |
| mailutils | networking | mailutils | 1:3.21-1 | mailutils 3.21-1 | extra |
| make | build systems autotools | make-dfsg | 4.4.1-3 | make 4.4.1-3 | core |
| mc | desktop/GNOME-related | mc | 3:4.8.33-1.1build1 | mc 4.8.33-1 | extra |
| mdk | applications | mdk | 1.3.1+dfsg-2 | — | — |
| melting | science/math | melting | 5.2.0-3 | — | — |
| miscfiles | documentation/Texinfo | miscfiles | 1.5+dfsg-5build1 | — | — |
| mit-scheme | languages | mit-scheme | 12.1-6 | — | — |
| mpc | science/math | mpc | 0.35-1build2 | mpc 0.35-2 | extra |
| mpfr | science/math | mpfr4 | 4.2.2-3 | mpfr 4.2.2-1 | core |
| mtools | shell/userland | mtools | 4.0.49-1 | mtools 1:4.0.50-1 | extra |
| nano | editors | nano | 9.2-1 | nano 9.3-1 | core |
| ncurses | libraries | ncurses | 6.6+20260608-2 | ncurses 6.6-2 | core |
| nettle | crypto/security | nettle | 3.10.2-1 | nettle 4.0-1 | core |
| ocrad | documentation/Texinfo | ocrad | 0.29-1build1 | ocrad 0.29-3 | extra |
| octave | science/math | octave | 11.3.0-1build1 | octave 11.3.0-1 | extra |
| parallel | shell/userland | parallel | 20240222+ds-4 | parallel 20260922-1 | extra |
| parted | shell/userland | parted | 3.8-2 | parted 3.8-1 | extra |
| patch | shell/userland | patch | 2.8-2build1 | patch 2.8.1-1 | core |
| pem | applications | pem | 0.7.9-6build1 | — | — |
| pexec | toolchain | pexec | 1.0~rc8-7build1 | — | — |
| plotutils | multimedia | plotutils | 2.6-15build1 | plotutils 2.6-12 | extra |
| poke | toolchain | poke | 4.3+dfsg-1build1 | poke 4.3-2 | extra |
| pspp | science/math | pspp | 2.0.1-1build3 | — | — |
| r | science/math | — | — | r 4.6.2-1 | extra |
| rcs | toolchain | rcs | 5.10.1-4 | rcs 5.10.1-3 | extra |
| readline | libraries | readline | 8.3-4 | readline 8.3.6-1 | core |
| recutils | libraries | recutils | 1.9-4 | — | — |
| rush | toolchain | rush | 2.4-1build1 | — | — |
| scm | toolchain | scm | 5f4-3.1 | — | — |
| screen | shell/userland | screen | 5.0.1-3 | screen 5.0.2-2 | extra |
| sed | shell/userland | sed | 4.9-3 | sed 4.10-2 | core |
| sharutils | shell/userland | sharutils | 1:4.15.2-13 | sharutils 4.15.2-6 | extra |
| shepherd | shell/userland | shepherd | 1.0.9-3 | — | — |
| shishi | crypto/security | shishi | 1.0.3-7 | — | — |
| shtool | toolchain | shtool | 2.0.8-10ubuntu3 | — | — |
| slib | toolchain | slib | 3c1-2build1 | — | — |
| solfege | multimedia | solfege | 3.23.4-14 | — | — |
| spell | documentation/Texinfo | spell | 1.1-6 | — | — |
| stow | shell/userland | stow | 2.4.1-2build1 | stow 2.4.1-1 | extra |
| talkfilters | games | — | — | talkfilters 2.3.8-8 | extra |
| tar | shell/userland | tar | 1.35+dfsg-5ubuntu1 | tar 1.35-5 | core |
| teseq | toolchain | teseq | 1.1.1-5build1 | — | — |
| texinfo | documentation/Texinfo | texinfo | 7.3-2build1 | texinfo 7.3-3 | core |
| texmacs | documentation/Texinfo | texmacs | 1:2.1.4+ds-3 | — | — |
| time | shell/userland | time | 1.10-0.1 | time 1.10-1 | extra |
| trueprint | documentation/Texinfo | trueprint | 5.4-8 | — | — |
| unifont | desktop/GNOME-related | unifont | 1:16.0.04-1build1 | — | — |
| units | science/math | units | 2.27-1 | — | — |
| unrtf | documentation/Texinfo | unrtf | 0.21.10-clean-2build1 | unrtf 0.21.10-3 | extra |
| userv | crypto/security | userv | 1.2.3 | — | — |
| uucp | shell/userland | uucp | 1.07-31build1 | uucp 1.07-8 | extra |
| vcdimager | multimedia | vcdimager | 2.0.1+dfsg-7build1 | vcdimager 2.0.1-8 | extra |
| vera | applications | vera | 1.24-1build1 | — | — |
| wdiff | documentation/Texinfo | wdiff | 1.2.2-9build1 | wdiff 1.2.2-5 | extra |
| wget | networking | wget | 1.25.0-3ubuntu1 | wget 1.25.0-6 | extra |
| which | shell/userland | gnu-which | 2.21+dfsg-5build1 | which 2.25-1 | core |
| xaos | multimedia | xaos | 4.3.6-1 | xaos 4.3.5-1 | extra |
| xboard | games | xboard | 4.9.1-5 | xboard 4.9.1-4 | extra |
| xnee | toolchain | xnee | 3.19-9.5 | — | — |
| xorriso | shell/userland | libisoburn | 1:1.5.6-1.1ubuntu4 | — | — |
| zile | editors | zile | 2.6.2-2build2 | — | — |

## Absents des deux distros

3dldf, 8sync, alive, anastasis, archimedes, aris, artanis, avl, ballandpaddle, bayonne, bfd, bool, bpel2owfn, c-graph, c-intro-and-ref, ccaudio, ccd2cue, ccide, ccrtp, ccscript, cgicc, chess, cim, classpath, classpathx, combine, commoncpp, config, consensus, cursynth, dap, djgpp, dominion, dr-geo, easejs, edma, epsilon, fdisk, fisicalab, foliot, fontopia, fontutils, freefont, freetalk, gama, garpd, gcide, gcompris, ggradebook, gift, glean, gmediaserver, gnash, gnats, gnatsweb, gnowsys, gnu-c-manual, gnu-crypto, gnu-pw-mgr, gnuae, gnubatch, gnubik, gnuboot, gnucomm, gnudos, gnufm, gnujdoc, gnukart, gnumach, gnumed, gnump3d, gnun, gnupod, gnuprologjava, gnurobots, gnuschool, gnusound, gnuspeech, gnuspool, gnustandards, gnutrition, gnuzilla, goptical, gorm, gpaint, grabcomics, greg, gsegrafix, gslip, gsrc, gtick, guile-cv, guile-dbi, guile-gnome, guile-ncurses, guile-opengl, guile-rpc, guile-sdl, guix, gurgle, gvpe, gwl, halifax, health, html-info, hurd, hyperbole, icecat, idutils, ignuit, inklingreader, jacal, jami, java-getopt, jitter, jtw, jwhois, kawa, kopi, leg, libdbh, liberty-eiffel, libffcall, libjit, libredwg, librejs, libxmi, lightning, lims, linux-libre, liquidwar6, lispintro, lsh, marst, maverik, mcron, mcsim, mediagoblin, mempool, mes, metaexchange, metahtml, metalogic-inference, mifluz, mig, moe, motti, mpria, nana, nano-archimedes, network, oleo, oo-browser, orgadoc, osip, panorama, pascal, paxutils, pcb, pies, pipo, polyxmass, powerguru, proxyknife, psychosynth, pth, pythonwebkit, qexo, quickthreads, radius, reftex, remotecontrol, rottlog, rpge, sather, serveez, shmm, sipwitch, smalltalk, social, spacechart, sqltutor, src-highlite, ssw, stalkerfs, stump, superopt, swbis, sysutils, taler, termcap, termutils, teximpatient, tramp, trans-coord, vc-changelog, vc-dwim, vmgen, wb, websocket4j, webstump, womb, xlogmaster, xmlat
