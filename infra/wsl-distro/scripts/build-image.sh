#!/usr/bin/env bash
# build-aphrody-omarchy-wsl.sh - Reproducible RootFS & .wsl Builder
# Fuses CachyOS/cachyos-wsl + omacom/omarchy + gitlab.archlinux.org
set -euo pipefail

export TZ=UTC
declare -r WORKDIR="${1:-./work}"
declare -r IMAGE_VERSION="${2:-2026.11.11}"
declare -r BUILDDIR="${WORKDIR}/build"
declare -r OUTPUTDIR="${WORKDIR}/output"
SOURCE_DATE_EPOCH=$(date -u -d "$(awk -F. '{print $1"-"$2"-"$3}' <<< "${IMAGE_VERSION}")" +"%s")
export SOURCE_DATE_EPOCH

declare -r PROFILE="${PROFILE:-desktop}"
# PROFILE=dev: lean shell for Claude Code and builds (no desktop stack).
declare -ra DEV_PACKAGES=(
    base
    base-devel
    sudo
    bash
    bash-completion
    uutils-coreutils
    git
    openssh
    ripgrep
    fd
    jq
    bat
    eza
    zoxide
    fzf
    just
    rustup
    sccache
    mold
    clang
    lld
    nodejs
    unzip
    zstd
    cachyos-keyring
    cachyos-mirrorlist
    cachyos-v3-mirrorlist
)
declare -ra DESKTOP_PACKAGES=(
    base
    sudo
    fish
    cachyos-keyring
    cachyos-mirrorlist
    cachyos-v3-mirrorlist
    cachyos-settings
    cachyos-fish-config
    ananicy-cpp
    cachyos-ananicy-rules
    mesa
    vulkan-dzn
    wayland
    wayland-protocols
    hyprland
    cosmic-session
    quickshell
    ghostty
    alacritty
    neovim
)
if [ "$PROFILE" = dev ]; then PACKAGES=("${DEV_PACKAGES[@]}"); else PACKAGES=("${DESKTOP_PACKAGES[@]}"); fi

mkdir -vp "${BUILDDIR}/var/lib/pacman" "${OUTPUTDIR}"
cp -a rootfs/* "${BUILDDIR}/"
ln -sf /usr/lib/os-release "${BUILDDIR}/etc/os-release"

fakechroot -- fakeroot -- pacman -Sy --disable-sandbox-filesystem \
    -r "${BUILDDIR}" --noconfirm --dbpath "${BUILDDIR}/var/lib/pacman" \
    --config rootfs/etc/pacman.conf --noscriptlet "${PACKAGES[@]}"

# Mask Hyper-V conflicting TTY & network units (microsoft/WSL#13595)
ln -sf /dev/null "${BUILDDIR}/etc/systemd/system/getty@.service"
ln -sf /dev/null "${BUILDDIR}/etc/systemd/system/serial-getty@.service"
# Units known to break WSL (learn.microsoft.com/windows/wsl/build-custom-distro, systemd recommendations).
for unit in console-getty.service systemd-firstboot.service systemd-networkd.service systemd-resolved.service \
    NetworkManager.service systemd-tmpfiles-setup.service systemd-tmpfiles-clean.service systemd-tmpfiles-clean.timer \
    systemd-tmpfiles-setup-dev-early.service systemd-tmpfiles-setup-dev.service tmp.mount; do
    ln -sf /dev/null "${BUILDDIR}/etc/systemd/system/${unit}"
done
# Per-profile registration name; no resolv.conf; drop the shortcut icon line if no .ico is shipped.
sed -i "s/^defaultName = .*/defaultName = aphrody-${PROFILE}/" "${BUILDDIR}/etc/wsl-distribution.conf"
rm -f "${BUILDDIR}/etc/resolv.conf"
[ -f "${BUILDDIR}/usr/lib/wsl/aphrody-omarchy.ico" ] || sed -i "/^icon = /d" "${BUILDDIR}/etc/wsl-distribution.conf"

chmod 0755 "${BUILDDIR}/usr/lib/wsl/first-setup-aphrody-omarchy.sh"
chmod 0440 "${BUILDDIR}/etc/sudoers.d/10-wheel"
rm -rf "${BUILDDIR}/etc/pacman.d/gnupg/"*

fakeroot -- tar --numeric-owner --xattrs --acls \
    --mtime="@${SOURCE_DATE_EPOCH}" --clamp-mtime --sort=name \
    -C "${BUILDDIR}" -cf "${OUTPUTDIR}/aphrody-${PROFILE}-${IMAGE_VERSION}.tar" .

xz -T0 -9 "${OUTPUTDIR}/aphrody-${PROFILE}-${IMAGE_VERSION}.tar"
mv -v "${OUTPUTDIR}/aphrody-${PROFILE}-${IMAGE_VERSION}.tar.xz" "${OUTPUTDIR}/aphrody-${PROFILE}-${IMAGE_VERSION}.wsl"
sha256sum "${OUTPUTDIR}/aphrody-${PROFILE}-${IMAGE_VERSION}.wsl" > "${OUTPUTDIR}/aphrody-${PROFILE}-${IMAGE_VERSION}.wsl.SHA256"
