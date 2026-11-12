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

