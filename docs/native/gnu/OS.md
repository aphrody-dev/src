# Aphrody, système GNU (cible, 2026-11-14)

Ordre du propriétaire (2026-11-14) : refactoriser Aphrody en système d'exploitation GNU. Définition retenue, d'après gnu.org (`gnu/linux-and-gnu.html`, `gnu/gnu.html`) : GNU est le système entier, noyau excepté. Aphrody fournit le noyau (`src/kernel`, rôle de Linux ou de Hurd) ainsi que chaque paquet GNU, réécrit ou repris en Rust ou en C sur l'ABI `src/include/ay/sys.h`.

Sources de vérité, toutes sous `docs/research/` :

- Liste et versions : GSRC, bzr `gsrc/trunk` (revno 12334, 434 paquets `pkg/gnu`), extrait par `scripts/gsrc-gnu.ts` dans `gsrc-gnu-2026-11-14.json`.
- Recettes, entrées et phases `check` : Guix `gnu/packages/*.scm` (`guix-gnu-2026-11-14.json`) ; amorçage dans `commencement.scm` (hex0 -> mes -> tcc -> gcc).
- Descriptions : `manual/blurbs.html` (`gnu-blurbs-2026-11-14.json`).
- Inventaire et verdicts : `docs/native/gnu/gnu-packages.json`. Adoption : PLAN.md (preuve par la testsuite GNU).

## Correspondance système GNU -> Aphrody

| Composant du système GNU | Aphrody | État |
| --- | --- | --- |
| noyau (Linux, Hurd) | Linux amont de référence (stable 7.3, LTS, GKI Android, ChromeOS ; `docs/research/linux-kernel-upstream-2026-11-14.md`) ; couche propre `src/kernel`, `src/arch`, `src/drivers` (C, style Linux) | suivi, existant |
| GNU libc | `src/posix` (personnalité POSIX/Linux) ; glibc de la distro sous Linux | existant, partiel |
| chaîne d'outils (gcc, binutils, gdb) | LLVM partagé avec Chromium (PLAN.md n°3, n°10) | décidé |
| paquets GNU (coreutils, findutils, diffutils, sed, grep, tar, gzip, bc, ed, m4, which, time, make...) | `src/gnu/<id GSRC>`, une unité par paquet | à regrouper |
| shell (bash) | niubash puis brush (PLAN.md n°2) | en cours |
| init et services (shepherd) | systemd sur la flotte ; `ay` côté machine | hors périmètre (PLAN.md) |
| gestion de paquets et de système (Guix) | `ay up` (`tools.toml`), `ay machine`, images `infra/os` | existant |
| manuels Texinfo et info | `docs/native/gnu/<id>.md` ; `--help` et `--version` au format GNU | à faire |

## Règles

1. Un paquet GNU = `src/gnu/<id>`, où `<id>` est le répertoire GSRC (`coreutils`, `gcc16`). Sa ligne de `src/gnu/packages.toml` porte version amont, sha256, dépendances GSRC, statut (`rust`, `c`, `fork`, `upstream`) et lien vers la preuve.
2. Les copies aplaties d'un amont Rust (uutils diffutils, findutils, sed) suivent ARCHITECTURE.md §9.2 : fork `aphrody-labs` épinglé dans `third_party/`, consommé par `src/gnu/<id>`, sans copie dans `src/`.
3. Chaque binaire suit les GNU Coding Standards : `--help`, `--version`, options longues, codes de sortie. `just gnu-check <id>` lance la testsuite GNU amont sur fr2 et écrit `src/gnu/<id>/PROOF.md`.
4. Ordre de build : dépendances `builddeps`/`libdeps` de GSRC. Builds sur fr1, tests et benchmarks sur fr2, rien sur le PC.
5. Un paquet n'est déclaré remplacé que si sa preuve atteint au moins le taux de l'amont Rust de référence (coreutils : 94,0 %).

## Étapes

1. Générer `src/gnu/packages.toml` depuis GSRC, avec un gate de dérive contre `gnu-packages.json`.
2. Scinder la crate multi-outils `src/gnu` (bc, ed, m4, time, which) en `src/gnu/{bc,ed,m4,time,which}`, et rattacher `*-flat` selon la règle 2.
3. Ajouter `src/gnu/*` aux `members` du `Cargo.toml` racine (session de layout) et un `DEPS.rules` par paquet (couche 2).
4. Brancher `just gnu-check` sur fr2 et produire les PROOF.md du Top 10 de PLAN.md.
5. Ajouter une section « système GNU » à ARCHITECTURE.md qui renvoie ici.
