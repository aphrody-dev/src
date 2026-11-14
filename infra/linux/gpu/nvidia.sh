#!/bin/sh
# NVIDIA open kernel modules + CUDA + container toolkit from official repositories (docs/native/linux/GPU.md).
# Non-interactive and idempotent; run as root. --dry-run prints the commands. Versions: manifest.toml.
#   gpu-nvidia [--dry-run] [--no-cuda] [--no-container]
set -eu
CUDA_PKG=${CUDA_PKG:-cuda-toolkit-13-5}
DRY=0 CUDA=1 CTK=1
for a in "$@"; do
  case $a in
    --dry-run) DRY=1 ;; --no-cuda) CUDA=0 ;; --no-container) CTK=0 ;;
    *) echo "gpu-nvidia: unknown option $a" >&2; exit 2 ;;
  esac
done
run() { if [ $DRY = 1 ]; then echo "+ $*"; else "$@"; fi; }
[ $DRY = 1 ] || [ "$(id -u)" = 0 ] || { echo "gpu-nvidia: run as root" >&2; exit 1; }
. /etc/os-release
case " $ID ${ID_LIKE:-} " in
  *" arch "*|*" cachyos "*)
    pkgs="nvidia-open nvidia-utils"
    # CachyOS kernels ship a matching prebuilt module package (linux-cachyos-nvidia-open).
    if pacman -Qq linux-cachyos >/dev/null 2>&1; then pkgs="linux-cachyos-nvidia-open nvidia-utils"; fi
    [ $CUDA = 1 ] && pkgs="$pkgs cuda"
    [ $CTK = 1 ] && pkgs="$pkgs nvidia-container-toolkit"
    # shellcheck disable=SC2086
    run pacman -S --needed --noconfirm $pkgs
    ;;
  *" debian "*|*" ubuntu "*)
    case "$ID:${VERSION_ID:-}" in
      debian:13) repo=debian13 ;; ubuntu:24.04) repo=ubuntu2404 ;; ubuntu:26.04|ubuntu:26.10) repo=ubuntu2604 ;;
      *) echo "gpu-nvidia: no NVIDIA CUDA repository for $ID $VERSION_ID" >&2; exit 3 ;;
    esac
    base="https://developer.download.nvidia.com/compute/cuda/repos/$repo/x86_64"
    export DEBIAN_FRONTEND=noninteractive
    if ! dpkg -s cuda-keyring >/dev/null 2>&1; then
      tmp=$(mktemp -d)
      run curl -fsSLo "$tmp/cuda-keyring.deb" "$base/cuda-keyring_1.1-1_all.deb"
      run dpkg -i "$tmp/cuda-keyring.deb"
      rm -rf "$tmp"
    fi
    pkgs="nvidia-open"
    [ $CUDA = 1 ] && pkgs="$pkgs $CUDA_PKG"
    if [ $CTK = 1 ] && [ ! -f /etc/apt/sources.list.d/nvidia-container-toolkit.list ]; then
      run sh -c 'curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor --yes -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg'
      run sh -c 'echo "deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://nvidia.github.io/libnvidia-container/stable/deb/$(dpkg --print-architecture) /" > /etc/apt/sources.list.d/nvidia-container-toolkit.list'
    fi
    [ $CTK = 1 ] && pkgs="$pkgs nvidia-container-toolkit"
    run apt-get update -q
    # shellcheck disable=SC2086
    run apt-get install -y --no-install-recommends $pkgs
    ;;
  *" alpine "*)
    echo "gpu-nvidia: NVIDIA ships no musl driver; use NVK (mesa-vulkan-nouveau) or a glibc host" >&2; exit 3 ;;
  *" nixos "*)
    echo "gpu-nvidia: NixOS: set hardware.nvidia.open = true and hardware.nvidia-container-toolkit.enable = true in configuration.nix" >&2; exit 3 ;;
  *) echo "gpu-nvidia: unsupported distribution $ID" >&2; exit 3 ;;
esac
if [ $CTK = 1 ] && command -v nvidia-ctk >/dev/null 2>&1; then
  command -v docker >/dev/null 2>&1 && run nvidia-ctk runtime configure --runtime=docker
  command -v podman >/dev/null 2>&1 && run nvidia-ctk cdi generate --output=/etc/cdi/nvidia.yaml
fi
echo "gpu-nvidia: done (reboot to load the open kernel modules; check with nvidia-smi)"
