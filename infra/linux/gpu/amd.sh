#!/bin/sh
# AMD GPU: RADV (Mesa Vulkan) everywhere, ROCm where AMD or the distribution builds it (docs/linux/GPU.md).
# Non-interactive and idempotent; run as root. --dry-run prints the commands. Versions: manifest.toml.
#   gpu-amd [--dry-run] [--no-rocm]
set -eu
ROCM=${ROCM_VERSION:-7.2.4}
DRY=0 WITH_ROCM=1
for a in "$@"; do
  case $a in
    --dry-run) DRY=1 ;; --no-rocm) WITH_ROCM=0 ;;
    *) echo "gpu-amd: unknown option $a" >&2; exit 2 ;;
  esac
done
run() { if [ $DRY = 1 ]; then echo "+ $*"; else "$@"; fi; }
[ $DRY = 1 ] || [ "$(id -u)" = 0 ] || { echo "gpu-amd: run as root" >&2; exit 1; }
. /etc/os-release
case " $ID ${ID_LIKE:-} " in
  *" arch "*|*" cachyos "*)
    pkgs="vulkan-radeon linux-firmware-amdgpu"
    [ $WITH_ROCM = 1 ] && pkgs="$pkgs rocm-hip-sdk rocminfo"
    # shellcheck disable=SC2086
    run pacman -S --needed --noconfirm $pkgs
    ;;
  *" ubuntu "*|*" debian "*)
    export DEBIAN_FRONTEND=noninteractive
    pkgs="mesa-vulkan-drivers"
    if [ $WITH_ROCM = 1 ]; then
      case "${VERSION_CODENAME:-}" in
        jammy|noble)
          # AMD's repository covers these LTS releases only (repo.radeon.com/rocm/apt/$ROCM/dists).
          if [ ! -f /etc/apt/sources.list.d/rocm.list ]; then
            run mkdir -p /etc/apt/keyrings
            run sh -c 'curl -fsSL https://repo.radeon.com/rocm/rocm.gpg.key | gpg --dearmor --yes -o /etc/apt/keyrings/rocm.gpg'
            run sh -c "echo 'deb [arch=amd64 signed-by=/etc/apt/keyrings/rocm.gpg] https://repo.radeon.com/rocm/apt/$ROCM $VERSION_CODENAME main' > /etc/apt/sources.list.d/rocm.list"
          fi
          pkgs="$pkgs rocm" ;;
        *) pkgs="$pkgs rocminfo" # distribution build (Debian main); AMD's repository has no $VERSION_CODENAME
          ;;
      esac
    fi
    run apt-get update -q
    # shellcheck disable=SC2086
    run apt-get install -y --no-install-recommends $pkgs
    ;;
  *" alpine "*)
    run apk add --no-cache mesa-vulkan-ati
    [ $WITH_ROCM = 0 ] || echo "gpu-amd: no ROCm build for Alpine; RADV installed" >&2
    ;;
  *" nixos "*)
    echo "gpu-amd: NixOS: hardware.graphics.enable = true (RADV); ROCm via nixpkgs rocmPackages" >&2; exit 3 ;;
  *) echo "gpu-amd: unsupported distribution $ID" >&2; exit 3 ;;
esac
if [ -n "${SUDO_USER:-}" ] && ! id -nG "$SUDO_USER" | grep -qw render; then run usermod -aG render,video "$SUDO_USER"; fi
echo "gpu-amd: done (check with vulkaninfo --summary and rocminfo)"
