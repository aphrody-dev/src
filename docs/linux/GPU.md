# GPU et compute sous Linux : NVIDIA et AMD (2026-11-13)

Scripts : `infra/linux/gpu/nvidia.sh`, `amd.sh` (POSIX, non interactifs, idempotents, `--dry-run`), installés par le paquet `aphrody-gpu-setup` (`/usr/libexec/aphrody/gpu-nvidia`, `gpu-amd`). Versions : `infra/linux/gpu/manifest.toml`, suivies par `ay linux status --group gpu`. Rien de propriétaire n'est redistribué : uniquement des dépôts officiels (NVIDIA, AMD, distributions).

Le PC (RTX 4070, Windows) n'est pas concerné : pas de Linux local (skill `windows-machine`).

## Versions relevées en direct

| Composant | Version | Source |
|---|---|---|
| NVIDIA open kernel modules | 620.70.06 (2026-11-05) | release `NVIDIA/open-gpu-kernel-modules` ; paquet `nvidia-open_620.70.06` des dépôts CUDA ubuntu2604 et debian13 |
| CUDA | 13.5.0 (2026-11-04) | `developer.download.nvidia.com/compute/cuda/redist/redistrib_13.5.0.json` ; `cuda-toolkit-13-5_13.5.0-1` (ubuntu2604, debian13) |
| NVIDIA container toolkit | 1.20.2 (dépôt apt) / v1.20.1 (release GitHub) | conflit de sources signalé : le dépôt apt est en avance sur la release GitHub |
| Arch | nvidia-open 615.78.08 (extra), 620.70.06 (extra-testing) ; cuda 13.4.3 ; nvidia-container-toolkit 1.20.1 | archlinux.org JSON |
| CachyOS | `linux-cachyos-nvidia-open` 7.3.3 (module précompilé pour le noyau CachyOS) | mirror.cachyos.org |
| ROCm (AMD) | 7.2.4, dépôt apt pour jammy et noble seulement | `repo.radeon.com/rocm/apt/7.2.4/dists` |
| TheRock | therock-10.1 (2026-10-05) ; Arch `rocm-hip-sdk` 7.2.4 (extra), 10.0 (extra-testing) | release `ROCm/TheRock` ; archlinux.org. `ROCm/ROCm` redirige vers `ROCm/legacy-rocm-build`, archivé |
| RADV | Mesa : Arch `vulkan-radeon` 26.2.7 ; Debian `mesa` 26.2.6 (sid) ; Alpine `mesa-vulkan-ati` | Mesa appartient à la couche gaming |

## Bonnes pratiques retenues

NVIDIA :
- modules ouverts (`nvidia-open`) sur Turing et plus récents ; sur CachyOS, le paquet de modules précompilé assorti au noyau plutôt que DKMS ;
- CUDA depuis le dépôt NVIDIA de la distro (`cuda-keyring`), paquet versionné `cuda-toolkit-13-5` : le pilote ne suit pas un méta-paquet `cuda` qui monterait de branche ;
- conteneurs : `nvidia-container-toolkit`, `nvidia-ctk runtime configure --runtime=docker` pour Docker, CDI (`nvidia-ctk cdi generate`) pour Podman ;
- Alpine : aucun pilote NVIDIA musl ; NVK (Mesa) ou hôte glibc ;
- NixOS : `hardware.nvidia.open = true`, `hardware.nvidia-container-toolkit.enable = true`.

AMD :
- RADV (Mesa) pour Vulkan partout ; firmware `linux-firmware-amdgpu` sur Arch ;
- ROCm : paquets Arch (`rocm-hip-sdk`), dépôt AMD sur Ubuntu LTS (jammy, noble), `rocminfo` de Debian ailleurs ; Ubuntu 26.x n'a pas de dépôt AMD au 2026-11-13 ;
- utilisateur dans les groupes `render` et `video`.

## Docker

Images de base `ghcr.io/aphrody-labs/base-{arch-v3,alpine,debian,nix}` (`infra/linux/images`), construites par `linux-images.yml` à partir d'images amont épinglées par digest, avec attestation de provenance ; les consommateurs épinglent le digest affiché dans le résumé du job. Les images GPU ne sont pas publiées : le runtime NVIDIA vient de l'hôte (container toolkit), CUDA reste sous licence NVIDIA.
