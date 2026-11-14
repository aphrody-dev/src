# Philosophie GNU, en bref (2026-11-12)

Sources consultées le 2026-11-12. Le `$Date` CVS de chaque page est indiqué entre parenthèses.

## Les quatre libertés

Un logiciel est libre si l'utilisateur a ([free-sw.html](https://www.gnu.org/philosophy/free-sw.html), $Date 2026/06/09) :

- **0** : exécuter le programme comme il le souhaite, pour n'importe quel usage ;
- **1** : étudier son fonctionnement et le modifier (le code source est donc nécessaire) ;
- **2** : redistribuer des copies ;
- **3** : distribuer des versions modifiées.
  « Libre » renvoie à la liberté, pas au prix. La FSF distingue le logiciel libre de l'« open source », qu'elle juge centré sur la méthode plutôt que sur l'éthique ([categories.html](https://www.gnu.org/philosophy/categories.html), $Date 2025/06/05).

## Copyleft et licences

- **Copyleft** : on peut redistribuer une œuvre dérivée, mais avec les mêmes libertés.
- **GPL-3.0** : 29 juin 2007 ([gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html), $Date 2023/11/30). Elle ajoute la clause anti-« tivoïsation » (installation information) et une licence de brevets. La plupart des paquets GNU sont en GPL-3.0-or-later.
- **LGPL** : copyleft faible pour les bibliothèques (glibc en LGPL-2.1+, gnutls en LGPL-2.1+, guile en LGPL-3+). Une LGPL autorise l'édition de liens avec du code non libre, à condition de permettre le ré-édition des liens.
- **AGPL-3.0** : la GPL plus l'obligation de fournir le source aux utilisateurs d'un service réseau [NV : aucun paquet de la table n'en déclare via Arch].
- **Exceptions** : GCC Runtime Library Exception 3.1 (libgcc et libstdc++ liés dans des binaires non GPL) ; exception Autoconf 3.0 pour les scripts `configure` générés.
- **GFDL 1.3** : 3 novembre 2008 ([fdl-1.3.html](https://www.gnu.org/licenses/fdl-1.3.html), $Date 2023/11/30). C'est la licence des manuels GNU. Ses « sections invariantes » la rendent non libre au sens des DFSG de Debian, qui place ces manuels en non-free quand elles sont utilisées [NV : vérifier le statut Debian 2026].

Conséquences pour nous :

- remplacer un outil GPL par une réécriture MIT/Apache (uutils, brush, sudo-rs, rustls) supprime les obligations de copyleft sur nos distributions statiques ;
- garder glibc (LGPL) en dynamique ne pose pas de problème ;
- lier statiquement un binaire LGPL impose de fournir les objets pour permettre le ré-édition des liens.

## « GNU/Linux »

La FSF demande de dire GNU/Linux, parce que le système est GNU et que Linux en est le noyau ([why-gnu-linux.html](https://www.gnu.org/gnu/why-gnu-linux.html), $Date 2021/11/02). Linux a été écrit par Linus Torvalds en 1991 et publié sous licence libre en 1992 ([gnu-history.html](https://www.gnu.org/gnu/gnu-history.html)). Constat pour 2026 : la part GNU d'un système de base recule. Ubuntu 26.10 a remplacé coreutils par uutils, et Arch `base` ne contient que 11 paquets GNU (voir DISTROS.md). Dans nos documents, nous écrivons « Linux » pour le noyau et nommons explicitement les composants GNU.

## FSF

Fondée le 4 octobre 1985 (`foundingDate` sur [fsf.org/about](https://www.fsf.org/about/), 2026-11-12), d'abord pour financer GNU. Elle détient le copyright de nombreux paquets GNU (cessions), publie les licences, gère le répertoire du logiciel libre et la liste des manuels. GNU (le projet) et la FSF (l'association) sont deux entités distinctes. Depuis 2023, plusieurs chaînes d'outils GNU sont hébergées sur sourceware.org (glibc, binutils, gdb ; gcc.gnu.org pour GCC) plutôt que sur Savannah [NV : date et périmètre exacts].

## Chronologie 1983 → 2026

| Date                   | Fait                                                                                         | Source                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| 1983-09-27             | Annonce initiale de GNU par Richard Stallman                                                 | [initial-announcement](https://www.gnu.org/gnu/initial-announcement.html) ($Date 2025/06/07) |
| 1984-01                | Début du développement                                                                       | gnu-history.html ($Date 2025/10/27)                                                          |
| 1985-03                | Manifeste GNU                                                                                | gnu-history.html                                                                             |
| 1985-10-04             | Création de la FSF                                                                           | fsf.org/about                                                                                |
| 1989 / 1991            | GPL v1 / GPL v2 et LGPL v2                                                                   | [NV]                                                                                         |
| ~1990                  | Tous les composants majeurs trouvés ou écrits, sauf le noyau                                 | gnu-history.html                                                                             |
| 1991-1992              | Linux, puis Linux sous GPL v2                                                                | gnu-history.html                                                                             |
| 2000-2002              | GFDL 1.1 (2000), 1.2 (2002)                                                                  | [NV]                                                                                         |
| 2007-06-29             | GPL v3, LGPL v3                                                                              | gpl-3.0.html                                                                                 |
| 2007-11                | AGPL v3                                                                                      | [NV]                                                                                         |
| 2008-11-03             | GFDL 1.3                                                                                     | fdl-1.3.html                                                                                 |
| 2023                   | glibc, binutils et gdb restent sur sourceware (adhésion à Software Freedom Conservancy) [NV] | —                                                                                            |
| 2025-10 (Ubuntu 25.10) | uutils coreutils et sudo-rs adoptés par défaut                                               | annonce Canonical [NV] ; état 26.10 vérifié dans DISTROS.md                                  |
| 2026-11                | 388 paquets GNU actifs, 71 décommissionnés                                                   | allgnupkgs.html, software.html#decommissioned                                                |

Note : le fichier canonique `gnupackages.txt` (womb/gnumaint) n'est pas récupérable. Le clone de `womb.git` est vide et viewvc renvoie 401 (2026-11-12). L'index s'appuie donc sur `allgnupkgs.html` et `manual.html`.
