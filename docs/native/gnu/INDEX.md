# Écosystème GNU : index (2026-11-12)

Recensement, classification et verdicts pour notre stack (LLVM seul, Rust en priorité, pas de MinGW/MSYS sous Windows).

## Navigation

- [PHILOSOPHY.md](PHILOSOPHY.md) : quatre libertés, copyleft, GPL/LGPL/AGPL/GFDL, GNU/Linux, FSF, chronologie 1983→2026
- [PACKAGES.md](PACKAGES.md) : table des 459 entrées classées (388 actives, 71 décommissionnées)
- [DISTROS.md](DISTROS.md) : Ubuntu 26.10 (stonking) et Arch : versions, socles, remplacements déjà faits
- [MODERN.md](MODERN.md) : équivalents et réécritures, avec maturité et taux de tests
- [PLAN.md](PLAN.md) : notre feuille de route de remplacement (top 10)
- [gnu-packages.json](gnu-packages.json) : données machine, générées par `tools/gnu-index/build.ts` (curation dans `curated.ts`)

## Comptes par catégorie

| Catégorie                                                                | n       |
| ------------------------------------------------------------------------ | ------- |
| toolchain                                                                | 63      |
| networking                                                               | 43      |
| shell/userland                                                           | 38      |
| libraries                                                                | 38      |
| applications (hors taxonomie : gestion, éducation, santé, dictionnaires) | 33      |
| science/math                                                             | 33      |
| documentation/Texinfo                                                    | 30      |
| multimedia                                                               | 29      |
| desktop/GNOME-related                                                    | 21      |
| games                                                                    | 18      |
| crypto/security                                                          | 15      |
| build systems autotools                                                  | 10      |
| languages                                                                | 8       |
| editors                                                                  | 5       |
| libc/runtime                                                             | 4       |
| decommissioned                                                           | 71      |
| **Total**                                                                | **459** |

La catégorie vient d'abord de la curation, sinon de la section FSF du [GNU Manuals index](https://www.gnu.org/manual/manual.html). Conséquence : « toolchain » regroupe tout ce que la FSF range en « Software development », y compris des interpréteurs (apl, guile-*). Seuls 8 paquets ont été reclassés à la main en « languages ».

## Sources (toutes consultées le 2026-11-12)

| Donnée                            | Source                                                                                                          | Remarque                                                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Liste des paquets                 | [allgnupkgs.html](https://www.gnu.org/software/allgnupkgs.html) : 388                                           | même liste que [software.html](https://www.gnu.org/software/software.html) ($Date 2024/07/31)                                  |
| Décommissionnés                   | software.html#decommissioned : 71                                                                               | —                                                                                                                              |
| Rôle, manuel                      | manual.html : 373 entrées appariées                                                                             | sinon description du paquet Arch                                                                                               |
| Releases                          | [ftp.gnu.org/ls-lrRt.txt.gz](https://ftp.gnu.org/ls-lrRt.txt.gz) + [ftp.gnu.org/gnu/](https://ftp.gnu.org/gnu/) | version numérique la plus haute ; GnuPG et libgcrypt depuis gnupg.org/ftp/gcrypt ; environ 90 paquets publient ailleurs (null) |
| Dépôts, activité                  | [index cgit Savannah](https://git.savannah.gnu.org/cgit/)                                                       | date du dernier commit ; gcc, glibc, binutils et gdb sur sourceware/gcc.gnu.org                                                |
| Licence                           | curée, sinon `%LICENSE%` Arch                                                                                   | null quand le paquet est absent d'Arch                                                                                         |
| Ubuntu                            | archive.ubuntu.com `dists/stonking*`                                                                            | **26.10 = stonking** ; resolute = 26.04 (conflit avec la consigne)                                                             |
| Arch                              | core.db + extra.db (geo.mirror.pkgbuild.com)                                                                    | équivalent hors ligne de l'API packages/search/json                                                                            |
| `gnupackages.txt` (womb/gnumaint) | **indisponible** : clone vide, viewvc 401                                                                       | statut des mainteneurs non extrait (« active » par défaut) [NV]                                                                |

## Chiffres clés

- Ubuntu 26.10 : 176 paquets GNU présents, 22 dans le socle (Essential/required/important). **coreutils est passé à uutils** (rust-coreutils 0.12.0 par défaut). APT vérifie ses dépôts avec `sqv` (Sequoia). `ubuntu-minimal` installe sudo-rs et sudo.
- Arch : 113 paquets GNU présents ; 11 dans `base`, 18 dans `base-devel`. Aucun remplacement par défaut.
- uutils coreutils passe 676 des 719 tests de la suite GNU (94,0 %, CI du 2026-11-12).

## Limites

- Langages : curés pour environ 100 paquets ; « — » partout ailleurs [NV].
- Statut mainteneur : seules les catégories « decommissioned » et « active » sont distinguées ; les paquets non maintenus restent à identifier dans gnumaint [NV].
- Correspondance avec les distros : faite par nom, donc il peut y avoir des faux négatifs.
- Pas de crawl page par page des 388 pages Savannah : les sources agrégées l'ont remplacé (environ 15 requêtes au total, une à la fois).
