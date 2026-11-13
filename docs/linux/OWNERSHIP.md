# Couche système Linux : carte d'ownership (2026-11-13)

Périmètre : noyau, paquets, toolchains, distributions, images, GPU compute. Le jeu (Steam, Proton, Wine, DXVK, VKD3D, gamescope, Mesa, Vulkan, DirectX, Bazzite, CachyOS côté jeu) appartient à la couche gaming : `docs/gaming/OWNERSHIP.md`, `infra/gaming/`. Ce document n'y touche pas et réutilise ses forks.

Commandes : `ay linux` et `ay pkg` (`packages/linux`, lancés par bun ; routage dans `crates/ay/src/lib.rs`).

## 1. Arborescence

| Quoi | Où | Source unique de |
|---|---|---|
| forks | `third_party/<nom>` (clones non suivis, épinglés dans `src.lock.json`), inscrits dans `third_party/forks.txt` | code amont + nos commits |
| patchs | `infra/upstream/patches/<pile>/` (`.patches` + un `.patch` par changement, format Electron) | nos modifications des forks Linux |
| piles | `infra/upstream/stacks.toml` (`ay upstream`) | quel fork suit quel amont |
| patchsets suivis | `infra/linux/patchsets.toml` (`ay linux status/sync`) | versions amont épinglées : noyaux, patchsets, GKI, ChromeOS, GPU, llvm-mingw |
| saveurs noyau | `infra/linux/kernels.toml` + `infra/linux/build/kernel.sh` | réglages CachyOS par hôte, image de build |
| recettes de paquets | `infra/pkg/recipes/<paquet>.toml` | un paquet, toutes les distros |
| matrice distro | `infra/pkg/distros.toml` | conteneurs de build, épinglés par digest |
| GPU | `infra/linux/gpu/` (scripts + `manifest.toml`) | installation NVIDIA/AMD, sources officielles |
| AOSP / ChromiumOS | `infra/linux/android/` (miroir partiel fr1, manifestes) | branches GKI et ChromeOS suivies |
| images de base | `infra/linux/images/<distro>/`, `infra/linux/cross-windows/` | `ghcr.io/aphrody-labs/base-*` |
| CI | `.github/workflows/linux-pkg.yml`, `linux-kernel.yml`, `linux-images.yml` | matrice, noyau, images |

Les sorties générées (`ay pkg gen`) vont dans `var/pkg/` (ignoré) : seules les recettes sont versionnées, une source par paquet.

## 2. Ownership

| Composant | Propriétaire | Fork aphrody-labs | Pile `ay upstream` | Note |
|---|---|---|---|---|
| CachyOS linux-cachyos (PKGBUILD noyau) | linux | `linux-cachyos` (créé 2026-11-13) | `linux-cachyos`, 1 patch | tier 1, `docs/linux/PATCHSETS.md` |
| CachyOS-PKGBUILDS | linux | `CachyOS-PKGBUILDS` (créé) | `cachyos-pkgbuilds`, série vide | paquets userland CachyOS |
| CachyOS kernel-patches | linux | `kernel-patches` (créé) | `kernel-patches`, série vide | BORE, misc, nvidia par série noyau |
| CachyOS/linux (arbre noyau) | linux | non : remote `cachyos` de `third_party/linux` | - | même arbre que `aphrody-labs/linux` (fork torvalds), pas de doublon |
| sched-ext/scx | linux | `scx` (créé) | `scx`, série vide | ordonnanceurs sched_ext |
| zen-kernel | linux | `zen-kernel` (créé) | non (6,9 Go) : registre seul + remote `zen` | |
| XanMod | linux | non : GitLab (`xanmod/linux` GitHub archivé 2024-10-25) | registre seul + remote `xanmod` | |
| Liquorix | linux | `liquorix-package` (créé) | `liquorix`, série vide | branche `7.3/master` |
| Clear Linux | exclu | - | - | dépôts archivés par Intel (2025-08) |
| Linux amont | linux | `linux` (existant, remotes stable/next/gki/cachyos/zen/chromeos/xanmod) | - | |
| GKI (kernel/common) | linux | non (Gerrit) | registre `gki` | miroir partiel fr1 |
| ChromiumOS kernel/manifest | linux | non (Gerrit) | registre `chromeos`, `chromiumos-release` | miroir partiel fr1 |
| AOSP platform/manifest | linux | non | - | `third_party/aosp-manifest` (existant), miroir fr1 |
| kleaf (kernel/build) | linux | non | - | `third_party/kleaf` (existant) |
| mingw-w64 | linux (chaîne croisée) | `mingw-w64` (existant) | - | |
| llvm-mingw | linux (chaîne croisée) | `llvm-mingw` (existant) | registre `llvm-mingw` | |
| ReactOS | nt (LiberNT) | `reactos` (existant) | - | base de LiberNT |
| LiberNT | nt | `LiberNT` (existant) | - | « LibreNT » n'existe pas sur GitHub (recherche du 2026-11-13) : le projet est LiberNT (libernt.com), fork de ReactOS, GPL-3.0 |
| wgpu | rendu / Chromium engines | `wgpu` (existant ; `third_party/wgpu` repointé : origin = fork, upstream = gfx-rs) | - | pas de nouveau fork |
| Wine, Proton, Mesa, DXVK, VKD3D | gaming | `wine` (existant) ; Proton et Mesa : non forkés à ce jour | - | réutilisés, jamais reforkés ici |
| NVIDIA open modules, CUDA, container toolkit | linux (GPU) | non | registre `nvidia-open`, `cuda`, `nvidia-container-toolkit` | manifestes et scripts seulement |
| ROCm, RADV | linux (GPU) | non | registre `rocm`, `therock` | RADV vient de Mesa (gaming) via les paquets des distros |
| LFS bun natif | lfs | `lfs` (existant) | - | `ay lfs` |
| pacman, mkinitcpio, archlinux-docker, docker-alpine, nix.dev, pkg-linux | linux (référence) | non | - | clones de lecture existants |

## 3. Gestion de paquets par distribution

| Distribution | Format généré par `ay pkg` | Build CI | Gestionnaire |
|---|---|---|---|
| Arch, CachyOS | PKGBUILD (`makepkg`) | oui (`archlinux:base-devel`, `cachyos-v3`) | pacman |
| Debian, Ubuntu | `debian/` (debhelper 13, `dpkg-buildpackage -b`) | oui (`debian:trixie-slim`, `ubuntu:26.04`) | apt, dans le conteneur de test seulement |
| Alpine | APKBUILD (`abuild`) | oui (`alpine:3.24.4`) | apk |
| NixOS | dérivation `default.nix` (`stdenvNoCC.mkDerivation`) | oui (`nixos/nix:2.35.6`, nixpkgs `nixos-26.05` épinglé) | nix |
| Chromium OS, Gentoo | ebuild EAPI 8 + `metadata.xml` (Portage) | syntaxe seulement | emerge |
| Android | `Android.bp` (`prebuilt_etc`, `sh_binary`) quand la recette liste `android` | génération seulement | Soong |
| tous | image OCI `FROM scratch` (couche à copier) | oui | docker |

Règle Debian/Ubuntu : ce sont des cibles de sortie pour leurs utilisateurs. Leurs conteneurs servent à construire et tester le `.deb` ; aucun outil de src n'est installé par apt, et apt reste interdit sur le PC (`docs/deps/POLICY.md`, règle 1.4).

## 4. Dédoublonnage

- Une seule mécanique de suivi de patchs : `ay upstream` (piles), étendue de bun/Chromium aux forks Linux ; `ay linux sync` l'appelle au lieu de dupliquer un moteur.
- Un seul arbre noyau local (`third_party/linux`) : CachyOS, zen, XanMod, ChromeOS et GKI y sont des remotes, pas des clones.
- `docs/packaging/KERNELS.md` et `RECOMMENDATION.md` gardent l'étude comparative ; ce dossier contient la mise en œuvre.
- `crates/unix-cachyos` écrit encore `-march=raptorlake` (relevé dans `docs/packaging/OURS.md`) : la référence des drapeaux devient `infra/linux/images/arch/makepkg-aphrody.conf` (x86-64-v3) et `infra/linux/kernels.toml` (znver4 pour prd).
- La série Chromium reste dans `infra/upstream/chromium/patches` (chemin lu par `chromium-verify.sh` sur fr1) ; les nouvelles piles utilisent `infra/upstream/patches/<pile>/`.

## 5. Exclusions

| Élément | Raison |
|---|---|
| Clear Linux | archivé en amont (2025-08) |
| pilotes NVIDIA, CUDA | licences NVIDIA : aucun fichier redistribué ; scripts et manifestes vers `developer.download.nvidia.com` et les dépôts des distros |
| CRT MSVC / Windows SDK dans l'image `cross-windows` | licence Microsoft : `xwin splat` à l'exécution, jamais dans une image publiée |
| checkout AOSP ou ChromiumOS complet | espace : fr1 a 93 Go libres (`df`, 2026-11-13) pour l'usine Chromium ; miroir partiel de 3,3 Go seulement |
| fork de zen-kernel en pile quotidienne | 6,9 Go ; suivi par le registre et le remote `zen` |
| licences sans fichier (`CachyOS-PKGBUILDS`, `kernel-patches` : aucune licence détectée par l'API GitHub) | forkés sous les conditions de GitHub (fork public), rien n'est republié hors de GitHub ; nos patchs restent sous MIT OR Apache-2.0 |
