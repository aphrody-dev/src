# Décision (2026-11-12)

Sources : KERNELS.md, CONTAINERS.md, PACKAGE-MANAGERS.md, UNIFIED.md, OURS.md.

## Noyaux par hôte

| Hôte                                     | Actuel          | Décision                                                                                                               | Pourquoi                                                                                        |
| ---------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| prd (Arch, EPYC 9354P, x86-64-v4)        | 7.2.11-arch1-1  | `linux-cachyos-server` x86_64_v4 (7.3.3) depuis le dépôt CachyOS v4 ; garder `linux` Arch en entrée de boot de secours | hôte build + conteneurs ; LTO/AutoFDO + v4 ; server meilleur en stress-ng (Phoronix 2026-06-02) |
| fr2 / cdn (Ubuntu 26.10, KVM Haswell v3) | 7.3.0-9-generic | rester sur `linux-generic` Ubuntu, appliquer 7.3.0-11                                                                  | petit VPS : patches sécurité Canonical > gain marginal ; PREEMPT_DYNAMIC déjà là                |
| fr1 / vps (Ubuntu 26.10, KVM v3, 46 Go)  | 7.3.0-9-generic | idem fr2 ; réévaluer seulement si migré vers Arch                                                                      | idem                                                                                            |
| PC Windows                               | WSL interdit    | sans objet ; pas de noyau Linux local                                                                                  | contrainte utilisateur                                                                          |

BORE : non retenu (aucun gain mesuré, Phoronix 2026-06-04). Hardened : non (pénalité, io_uring coupé).

## Images de base

- Rust musl statique : `cgr.dev/chainguard/static` (0,46 Mo) ; alternative `distroless/static-debian13`.
- Rust glibc / `bun build --compile` : `gcr.io/distroless/cc-debian13` (10,7 Mo).
- Builder : `cachyos/cachyos-v3` pour binaires v3 (compatibles fr1/fr2/prd), sinon `wolfi-base`.
- Tout épinglé par digest dans le lock unifié ci-dessous ; scan `grype` en CI.

## Couche de paquets unifiée pour `ay`

Principe : étendre `src/up`, ne rien réécrire.

1. Lock unique `src.lock.json` v2 : chaque entrée = `purl` + version + digest sha256/OCI + provenance (attestation) ; `tools.toml` devient la déclaration (intentions), le lock la résolution.
2. Trait `Backend` dans src/up : `resolve(spec) -> Locked`, `fetch(Locked) -> Path`, `verify`. Backends :
   - existants : `github`, `url`, `bun`, `installer`, `ubi` (à doter d'un checksum calculé au lock, stocké dans le lock) ;
   - `cipd` (src/depot/cipd), `uv` (src/depot/vpython), `winget` (packages/machine DSC, export -> lock) ;
   - nouveaux : `oci` (oci-client 0.18 + oci-spec 0.10 : images et artefacts ORAS, distribution de nos binaires via registre), `conda` (rattler 0.55 + resolvo 0.12) pour outils natifs multi-OS, `pacman` (alpm 5.0) côté prd, `apt` piloté en CLI côté fr1/fr2.
3. Stockage : `depot-cas` comme cache content-addressed partagé (dédup FastCDC), servi depuis R2.
4. Sécurité : vérif GitHub attestations/sigstore quand publiées ; requête OSV par purl au `ay lock`.
5. Solveur : resolvo seulement pour les backends à dépendances (conda) ; les outils restent épinglés.

## Migration

1. `ay lock` calcule et inscrit les sha256 des 22 outils `ubi` (ferme la lacune d'intégrité).
2. Ajouter `purl` et `digest` au schéma src.lock.json, migrer `toolchains`.
3. Extraire le trait `Backend` ; porter les 5 sources existantes sans changement de comportement.
4. Brancher `cipd`, `uv`, `winget` (existants).
5. Ajouter `oci` puis `conda` (rattler).
6. (crate `unix-cachyos` supprimée par 5d771bb7 : refaire en recette `ay pkg`) remplacer `-march=raptorlake` par détection (`znver4` prd, `x86-64-v3` fr1/fr2) ; ajouter le basculement prd vers linux-cachyos-server.
7. Mettre à jour les noyaux : prd 7.2.15 immédiat puis cachyos-server ; fr1/fr2 `apt full-upgrade` + reboot planifié.

Mesures 2026-11-14 (conteneurs sur fr1, userland seul) : [docs/infra/OS-BENCH-2026-11.md](../infra/OS-BENCH-2026-11.md). cachyos-v3 : zstd ThinLTO 6,75 s contre 8,76 s Arch et 14,0 s Alpine ; cargo lto=thin 11,9 s contre 17,2 s Alpine.
