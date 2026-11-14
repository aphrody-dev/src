# Projets de gestion unifiée, bibliothèques Rust/TS, patches (2026-11-12)

## Projets

| Projet                 | Modèle                                                                   | Dernière version (GitHub, 2026-11-12)    | Intérêt pour `ay`                                                    |
| ---------------------- | ------------------------------------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------- |
| nix / guix             | store fonctionnel, multi-OS (Linux/macOS)                                | nix 2.35.6 (image Docker Hub 2026-11-10) | référence reproductibilité ; trop lourd comme couche de base Windows |
| pkgx                   | binaires relocalisables à la demande                                     | v2.11.0 (2026-07-22)                     | idée de « run-anything »                                             |
| mise / asdf            | gestion de versions par projet, backends (ubi, aqua, cargo, npm, github) | mise v2026.11.7 (2026-11-12)             | modèle de backends le plus proche de `ay up`                         |
| aqua                   | registre déclaratif de releases GitHub, checksums + vérif cosign/SLSA    | v2.66.1 (2026-11-04)                     | son registre est réutilisable comme source de métadonnées            |
| ubi / eget             | sélection d'asset de release                                             | crate ubi 0.13 (dans crates/up)          | déjà utilisé                                                         |
| Homebrew/Linuxbrew     | formules + bottles                                                       | [NV]                                     | non                                                                  |
| conda / pixi (rattler) | environnements multi-langage, solveur resolvo                            | pixi v0.84.2 (2026-11-10)                | rattler = brique Rust réutilisable                                   |
| spack                  | HPC, build source                                                        | [NV]                                     | non                                                                  |
| distrobox              | conteneurs comme environnements                                          | [NV]                                     | non (WSL interdit, Linux seulement)                                  |
| PackageKit / AppStream | abstraction D-Bus des PM système, métadonnées apps                       | [NV]                                     | modèle d'abstraction système                                         |
| Repology               | correspondance nom/version inter-distro                                  | API publique                             | mapping noms de paquets                                              |
| OSV / purl             | identifiants (`pkg:cargo/…`, `pkg:npm/…`) et base de vulnérabilités      | —                                        | identifiant canonique du lock unifié                                 |

## Bibliothèques (crates.io / GitHub, lues le 2026-11-12)

| Crate                | Version        | MAJ        | Rôle                                                       |
| -------------------- | -------------- | ---------- | ---------------------------------------------------------- |
| rattler              | 0.55.8         | 2026-11-12 | conda : repodata, install, cache                           |
| rattler_solve        | 13.0.1         | 2026-11-12 | front solveur                                              |
| resolvo              | 0.12.2         | 2026-10-08 | solveur SAT/CDCL générique (réutilisable hors conda)       |
| alpm                 | 5.0.2          | 2026-01-08 | bindings libalpm (pacman)                                  |
| rpm                  | 0.30.2         | 2026-10-07 | lecture/écriture rpm pure Rust                             |
| debian-packaging     | 0.18.0         | 2024-11-02 | .deb, dépôts apt ; peu maintenu                            |
| oci-client           | 0.18.0         | 2026-09-18 | client registre OCI (pull/push artefacts)                  |
| oci-spec             | 0.10.0         | 2026-05-27 | types image/runtime/distribution OCI                       |
| crates_io_api        | 0.12.0         | 2025-08-20 | API crates.io                                              |
| cargo-binstall       | 1.27.0 (outil) | 2026-11-11 | binaires précompilés de crates                             |
| uv (crates internes) | 0.13.8         | 2026-11-12 | non publiés comme API stable [NV] ; utiliser le binaire    |
| apk-rs, snix/tvix    | [NV]           | —          | snix (fork communautaire de tvix) : store nix en Rust [NV] |

TS (bun) : client npm = `fetch` sur registry.npmjs.org + `bun install` ; pas besoin de lib tierce.

## Patches existants

- CachyOS : pacman patché (téléchargements parallèles, détection v3/v4) [NV détail] ; `crates/unix-cachyos` (générateur pacman.conf v3 / makepkg.conf) a été supprimé par 5d771bb7 ; le profil de flags doit revenir comme recette `ay pkg` (infra/pkg/recipes).
- apk-tools v3 : 3.0.9-r0 dans Alpine 3.24 main (coexiste avec un paquet `apk-tools-0.11.0-r3` d'un autre flux [NV]).
- dnf5 : remplaçant C++ de dnf (5.4.8.0, 2026-11-11).
