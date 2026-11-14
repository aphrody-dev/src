# Benchmark userland OS sur fr1 (2026-11-14)

Mesure du userland et de la chaîne d'outils (libc glibc/musl, clang/rustc de la distro, paquets compilés v3), pas du noyau : tous les conteneurs partagent le noyau de l'hôte fr1 (`7.3.0-10-generic`, Ubuntu, VM Haswell 12 coeurs, sans AVX-512). Le noyau CachyOS 7.4-rc2 n'est pas mesuré ici.

## Verdict

- Compilation C ThinLTO (zstd) : `cachyos-v3` est le plus rapide (6,75 s, -23 % vs Arch), grâce à un clang/lld rebuild en x86-64-v3. Alpine (musl) est le plus lent (14 s, +60 %).
- Cargo release lto=thin : CachyOS (11,9 à 12,3 s), Arch et Azure Linux (12,8 à 13,0 s) devant Fedora (14,1 s) ; Ubuntu et Alpine ~17 s (+40 %). Le rustc Ubuntu 1.97.1 (build source) et Alpine 1.100.0 sont les plus lents.
- bun install + build --compile : écart nul (409 à 445 ms, dans le bruit) : même binaire bun 1.4.4, libc et fs sans effet.
- nginx 16 KiB : 85 à 92k req/s en régime propre, pas de différence significative (le bruit de l'hôte partagé domine).
- Décision : CachyOS (variante v3 pour les builds clang/LTO, base cachyos standard pour le serving) ; `cachyos-v4` inexécutable sur fr1 (SIGILL, pas d'AVX-512). Arch donne le même profil que CachyOS standard sur cargo/bun/nginx ; le gain CachyOS vient de la variante v3.

## Méthode

- Un conteneur par distro, même hôte, `docker run --cpuset-cpus 0-7 --network host`, sources en lecture seule copiées dans `/work` (overlayfs) avant chaque run (`--prepare`), `hyperfine --warmup 1 --runs 5` piloté depuis l'hôte via `docker exec` (surcoût constant). wrk épinglé sur les CPU 8-11 (`taskset`).
- Deux passes : P1 ordre cachyos, cachyos-v3, arch, fedora, ubuntu, alpine ; P2 ordre inverse (alpine, ubuntu, fedora, arch, cachyos-v3, cachyos). Azure Linux 4 lancé en fin de chaque passe.
- Charges : (1) zstd 1.5.7 (release GitHub, aucun C de taille moyenne dans `third_party`), `make -j8 -C programs zstd CC=clang MOREFLAGS="-flto=thin -fuse-ld=lld"` ; (2) `src/archguard` copié en crate autonome (dépendances vendorées, hors ligne, `lto="thin"`, `CARGO_INCREMENTAL=0`, sans sccache, `-j8`) ; (3) `packages/bunify` + dépendances typescript/zod/hono figées (`bun.lock`), `bun install --frozen-lockfile` cache chaud puis `bun build --compile`, bun 1.4.4 identique (build musl sur Alpine) ; (4) nginx 4 workers, fichier statique 16 KiB, `wrk -t4 -c128 -d10s`, 1 run de chauffe + 5 runs (hyperfine inadapté à une durée fixe, moyenne et écart-type des req/s).
- Script reproductible : `infra/bench/os-bench/os-bench.sh` (exécuté via `aphrody-heavy`). Lancé après la fin de `release.sh` et du build noyau.

## Résultats (moyenne +- écart-type, 5 runs)

| Distro | zstd P1 | zstd P2 | cargo P1 | cargo P2 | bun P1 (ms) | bun P2 (ms) | wrk P1 (req/s) | wrk P2 (req/s) | ay time bun p50/p90/p99 P1 (ms) |
|:--|--:|--:|--:|--:|--:|--:|--:|--:|:--|
| cachyos | 8.93 +- 1.10 | 8.51 +- 0.47 | 12.08 +- 0.53 | 12.53 +- 0.58 | 433 +- 13 | 422 +- 9 | 89760 +- 3288 | 93714 +- 1342 | 473/509/511 |
| cachyos-v3 | 6.84 +- 0.41 | 6.65 +- 0.23 | 12.67 +- 2.65 | 11.17 +- 0.46 | 739 +- 144 | 418 +- 17 | 53216 +- 4396 | 90933 +- 1544 | 815/1035/1104 |
| arch | 8.58 +- 0.45 | 8.95 +- 1.33 | 12.91 +- 0.24 | 12.64 +- 0.26 | 426 +- 18 | 418 +- 15 | 81627 +- 2762 | 87879 +- 2621 | 493/521/524 |
| fedora | 8.32 +- 0.51 | 8.71 +- 1.12 | 14.48 +- 1.79 | 13.67 +- 1.12 | 432 +- 11 | 431 +- 22 | 90276 +- 2673 | 59039 +- 22997 | 480/492/504 |
| azurelinux | 7.22 +- 0.66 | 12.01 +- 4.07 | 12.63 +- 1.11 | 13.30 +- 1.74 | 412 +- 8 | 478 +- 69 | 91634 +- 1681 | 77589 +- 15889 | 451/475/489 |
| ubuntu | 9.15 +- 0.61 | 8.74 +- 0.64 | 17.86 +- 0.95 | 16.14 +- 0.57 | 425 +- 35 | 416 +- 6 | 84316 +- 5472 | 73290 +- 22577 | 488/501/519 |
| alpine | 14.05 +- 0.57 | 14.04 +- 0.43 | 17.03 +- 0.98 | 17.36 +- 0.78 | 415 +- 7 | 403 +- 19 | 86684 +- 3112 | 92495 +- 1645 | 469/510/543 |

Moyenne des deux passes (s / ms / req/s) :
| Distro | zstd (s) | cargo (s) | bun (ms) | wrk (req/s) |
|:--|--:|--:|--:|--:|
| cachyos | 8.72 | 12.31 | 428 | 91737 |
| cachyos-v3 | 6.75 | 11.92 | 578 | 72074 |
| arch | 8.76 | 12.77 | 422 | 84753 |
| fedora | 8.52 | 14.07 | 431 | 74657 |
| azurelinux | 9.62 | 12.97 | 445 | 84611 |
| ubuntu | 8.95 | 17.00 | 421 | 78803 |
| alpine | 14.04 | 17.20 | 409 | 89590 |

`ay time` (p50/p90/p99, 10 runs, charge bun) est donné dans la dernière colonne de P1 : il confirme l'absence d'écart (451 à 493 ms de p50 hors le run v3 bruité). `ay bench` ne convient pas (suite matérielle Windows, tiers CUDA/MSVC/.NET), non utilisé.

## Versions

| Distro | Image | clang | rustc | libc | gcc | nginx |
|:--|:--|:--|:--|:--|:--|:--|
| cachyos | CachyOS | 23.1.5 | 1.99.1 | (GNU libc) 2.44 | 16.2.1 | 1.30.6 |
| cachyos-v3 | CachyOS | 23.1.5 | 1.99.1 | (GNU libc) 2.44 | 16.2.1 | 1.30.6 |
| arch | Arch Linux | 23.1.5 | 1.99.1 | (GNU libc) 2.44 | 16.2.1 | 1.30.6 |
| fedora | Fedora Linux 45 (Container Image) | 23.1.5 (Fedora 23.1.5-2.fc45) | 1.99.1 | (GNU libc) 2.44 | 16.2.1 | 1.30.6 |
| azurelinux | Azure Linux 4.0 (WSL) | 21.1.8 (Microsoft Corporation 21.1.8-14.azl4) | 1.99.0 | (GNU libc) 2.42 | 15.3.1 | 1.30.6 |
| ubuntu | Ubuntu 26.10 | Ubuntu 22.1.8 (1ubuntu1) | 1.97.1 | (Ubuntu GLIBC 2.44-1ubuntu2.1) 2.44 | 15.3.0 | 1.30.4 (Ubuntu) |
| alpine | Alpine Linux edge | Alpine 23.1.5 | 1.100.0 | musl libc (x86_64) | 15.2.0 | 1.30.6 |

Images : `cachyos/cachyos`, `cachyos/cachyos-v3`, `archlinux:latest`, `fedora:45`, `ubuntu:26.10`, `alpine:edge`, `aphrody/azurelinux:4` (import local du tarball WSL officiel Azure Linux 4.0). bun 1.4.4 (release GitHub), hyperfine 1.20.0, wrk 4.1.0.

## Limites

- `cachyos-v4` : image présente sur Docker Hub mais `pacman` plante (SIGILL, code 132) : l'hôte (Haswell virtualisé, AVX2 sans AVX-512) ne l'exécute pas. Non mesuré.
- Hôte fr1 partagé avec d'autres jobs (load 3 à 36 selon les runs, builds cargo/noyau d'autres agents) : écarts-types parfois très larges (cachyos-v3 bun P1 739 ms, fedora/ubuntu wrk P2). Les deux passes en ordre inverse servent à repérer ces valeurs ; seuls les écarts répétés dans les deux passes sont à retenir (zstd v3 et alpine, cargo Ubuntu/Alpine).
- Versions d'outils non identiques par construction (clang 21.1.8 Azure, 22.1.8 Ubuntu, 23.1.5 les autres ; rustc 1.97.1 à 1.100.0) : on mesure la distro telle qu'elle est livrée, pas un compilateur figé. Le gain de cachyos-v3 vs cachyos est donc un effet de paquets x86-64-v3, pas du noyau.
- Pas de noyau CachyOS (7.4-rc2) : hors périmètre conteneur. 5 runs seulement, charges courtes (7 à 17 s) ; pas de test de bun serve ni de charge multi-fichiers.
- Mesures en conteneur sur overlayfs : le comportement du fs natif d'une machine CachyOS (btrfs/xfs) peut différer.

## Sorties hyperfine brutes (P1)

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos/zstd` | 8.927 ± 1.096 | 7.949 | 10.497 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos/cargo` | 12.080 ± 0.527 | 11.393 | 12.764 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos/bun` | 433.2 ± 13.1 | 411.0 | 443.5 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos-v3/zstd` | 6.837 ± 0.413 | 6.494 | 7.413 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos-v3/cargo` | 12.669 ± 2.654 | 11.218 | 17.405 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos-v3/bun` | 739.1 ± 143.6 | 616.3 | 987.9 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `arch/zstd` | 8.583 ± 0.450 | 8.097 | 9.257 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `arch/cargo` | 12.912 ± 0.237 | 12.630 | 13.185 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `arch/bun` | 426.5 ± 18.4 | 394.2 | 438.5 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `fedora/zstd` | 8.323 ± 0.509 | 7.968 | 9.213 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `fedora/cargo` | 14.481 ± 1.795 | 12.298 | 17.173 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `fedora/bun` | 431.5 ± 11.2 | 420.7 | 449.2 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `azurelinux/zstd` | 7.220 ± 0.659 | 6.628 | 8.242 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `azurelinux/cargo` | 12.632 ± 1.107 | 11.552 | 14.305 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `azurelinux/bun` | 411.8 ± 7.7 | 402.4 | 423.5 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `ubuntu/zstd` | 9.155 ± 0.613 | 8.557 | 10.117 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `ubuntu/cargo` | 17.858 ± 0.951 | 17.014 | 19.130 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `ubuntu/bun` | 425.5 ± 35.4 | 388.2 | 481.5 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `alpine/zstd` | 14.050 ± 0.572 | 13.183 | 14.628 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `alpine/cargo` | 17.028 ± 0.980 | 16.278 | 18.737 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `alpine/bun` | 415.5 ± 7.1 | 408.7 | 424.3 | 1.00 |

## Sorties hyperfine brutes (P2)

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `alpine/zstd` | 14.035 ± 0.429 | 13.491 | 14.619 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `alpine/cargo` | 17.365 ± 0.785 | 16.516 | 18.299 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `alpine/bun` | 403.4 ± 19.5 | 383.7 | 429.5 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `ubuntu/zstd` | 8.738 ± 0.639 | 8.000 | 9.730 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `ubuntu/cargo` | 16.137 ± 0.568 | 15.342 | 16.748 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `ubuntu/bun` | 416.2 ± 6.5 | 410.3 | 425.7 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `fedora/zstd` | 8.712 ± 1.121 | 7.259 | 9.813 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `fedora/cargo` | 13.668 ± 1.125 | 12.489 | 15.364 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `fedora/bun` | 431.4 ± 21.7 | 412.0 | 465.6 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `azurelinux/zstd` | 12.010 ± 4.074 | 6.305 | 15.662 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `azurelinux/cargo` | 13.301 ± 1.737 | 11.973 | 16.352 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `azurelinux/bun` | 478.4 ± 68.5 | 431.6 | 599.8 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `arch/zstd` | 8.946 ± 1.332 | 8.088 | 11.312 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `arch/cargo` | 12.637 ± 0.260 | 12.265 | 12.899 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `arch/bun` | 418.4 ± 14.9 | 395.8 | 431.9 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos-v3/zstd` | 6.654 ± 0.233 | 6.343 | 6.945 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos-v3/cargo` | 11.173 ± 0.464 | 10.803 | 11.944 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos-v3/bun` | 417.6 ± 16.5 | 399.7 | 435.4 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos/zstd` | 8.509 ± 0.470 | 8.009 | 9.201 | 1.00 |

| Command | Mean [s] | Min [s] | Max [s] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos/cargo` | 12.532 ± 0.579 | 12.054 | 13.506 | 1.00 |

| Command | Mean [ms] | Min [ms] | Max [ms] | Relative |
|:---|---:|---:|---:|---:|
| `cachyos/bun` | 422.0 ± 9.0 | 406.4 | 429.4 | 1.00 |

