#!/usr/bin/env bash
# build-image.sh - reproducible aphrody WSL image (.wsl), run inside an Arch Linux container (fakechroot, fakeroot, pacman).
# Follows CachyOS/cachyos-wsl@2cedd88a scripts/build-image.sh and learn.microsoft.com/windows/wsl/build-custom-distro
# (MicrosoftDocs/WSL@7b28cc1e): wsl.conf and wsl-distribution.conf root:root 0644, no /etc/resolv.conf, no kernel or
# initramfs in the archive, masked units, gzip-compressed tar renamed .wsl.
#   usage: scripts/build-image.sh <workdir> <image-version YYYY.MM.DD> ; PROFILE=dev|desktop (default desktop)
#   on fr1: scripts/build-on-fr1.sh (Arch container under aphrody-heavy)
set -euo pipefail
cd "$(dirname "$0")/.."

export TZ=UTC
declare -r WORKDIR="$(realpath -m "${1:-./work}")"
declare -r IMAGE_VERSION="${2:-$(date -u +%Y.%m.%d)}"
declare -r BUILDDIR="${WORKDIR}/build"
declare -r OUTPUTDIR="${WORKDIR}/output"
declare -r PROFILE="${PROFILE:-desktop}"
SOURCE_DATE_EPOCH=$(date -u -d "$(awk -F. '{print $1"-"$2"-"$3}' <<< "${IMAGE_VERSION}")" +"%s")
export SOURCE_DATE_EPOCH
# cachyos-mirrorlist pinned to CachyOS/CachyOS-PKGBUILDS@b9899e36; v3 derived as the package does (sed $arch -> $arch_v3).
declare -r MIRRORLIST_URL="https://raw.githubusercontent.com/CachyOS/CachyOS-PKGBUILDS/b9899e3679ca4b1b43d4b016d1d959293d4fc344/cachyos-mirrorlist/cachyos-mirrorlist"

# PROFILE=dev: lean shell for Claude Code and builds (no desktop stack).
declare -ra DEV_PACKAGES=(
    base base-devel sudo bash bash-completion fish uutils-coreutils git openssh ripgrep fd jq bat eza zoxide fzf just
    rustup sccache mold clang lld nodejs unzip zstd
    cachyos-keyring cachyos-mirrorlist cachyos-v3-mirrorlist cachyos-hooks cachyos-settings cachyos-rate-mirrors
)
# PROFILE=desktop: WSLg clients (Wayland/X11 through the WSLg compositor), Mesa d3d12 (GL) and dzn (Vulkan).
declare -ra DESKTOP_PACKAGES=(
    base sudo fish
    cachyos-keyring cachyos-mirrorlist cachyos-v3-mirrorlist cachyos-hooks cachyos-settings cachyos-rate-mirrors
    cachyos-fish-config ananicy-cpp cachyos-ananicy-rules
    mesa vulkan-dzn vulkan-icd-loader wayland wayland-protocols
    hyprland cosmic-session quickshell ghostty alacritty neovim
)
if [ "$PROFILE" = dev ]; then PACKAGES=("${DEV_PACKAGES[@]}"); else PACKAGES=("${DESKTOP_PACKAGES[@]}"); fi

echo "SOURCE_DATE_EPOCH: ${SOURCE_DATE_EPOCH} PROFILE: ${PROFILE}"
rm -rf "${BUILDDIR}"
mkdir -vp "${BUILDDIR}/alpm-hooks/usr/share/libalpm/hooks" "${BUILDDIR}/var/lib/pacman" "${OUTPUTDIR}" "${WORKDIR}/pacman.d"
find /usr/share/libalpm/hooks -exec ln -sf /dev/null "${BUILDDIR}/alpm-hooks"{} \;

# Build-time mirrorlists: the ones from the packages are not installed yet.
curl -fsSL "${MIRRORLIST_URL}" -o "${WORKDIR}/pacman.d/cachyos-mirrorlist"
sed 's|/$arch/|/$arch_v3/|g' "${WORKDIR}/pacman.d/cachyos-mirrorlist" > "${WORKDIR}/pacman.d/cachyos-v3-mirrorlist"
cp /etc/pacman.d/mirrorlist "${WORKDIR}/pacman.d/mirrorlist"
sed "s|Include = /etc/pacman.d/|Include = ${WORKDIR}/pacman.d/|g" rootfs/etc/pacman.conf > "${WORKDIR}/pacman.conf"

cp --recursive --preserve=timestamps rootfs/* "${BUILDDIR}/"
ln -sf /usr/lib/os-release "${BUILDDIR}/etc/os-release"

fakechroot -- fakeroot -- pacman -Sy --disable-sandbox-filesystem -r "${BUILDDIR}" \
    --logfile /dev/null --noconfirm --dbpath "${BUILDDIR}/var/lib/pacman" \
    --config "${WORKDIR}/pacman.conf" --noscriptlet \
    --hookdir "${BUILDDIR}/alpm-hooks/usr/share/libalpm/hooks/" "${PACKAGES[@]}"

# Replicate the parts of the scriptlets and hooks skipped by --noscriptlet / --hookdir (as upstream).
fakechroot -- fakeroot -- chroot "${BUILDDIR}" update-ca-trust
fakechroot -- fakeroot -- chroot "${BUILDDIR}" /usr/bin/systemd-sysusers --root "/"
[ -x "${BUILDDIR}/usr/share/libalpm/scripts/cachyos-branding" ] &&
    fakechroot -- fakeroot -- chroot "${BUILDDIR}" /usr/share/libalpm/scripts/cachyos-branding os-release
printf '%s\n' /usr/bin/fish /bin/fish >> "${BUILDDIR}/etc/shells"
fakechroot -- fakeroot -- chroot "${BUILDDIR}" /usr/bin/systemctl enable cachyos-rate-mirrors.timer
[ "$PROFILE" = dev ] || fakechroot -- fakeroot -- chroot "${BUILDDIR}" /usr/bin/systemctl enable ananicy-cpp

# Units known to break WSL, system and user scope (rootfs/etc/systemd/masked-wsl-units.list).
mkdir -p "${BUILDDIR}/etc/systemd/system" "${BUILDDIR}/etc/systemd/user"
grep -v '^#' rootfs/etc/systemd/masked-wsl-units.list | while read -r unit; do
    [ -n "$unit" ] || continue
    ln -sf /dev/null "${BUILDDIR}/etc/systemd/system/${unit}"
    case "$unit" in systemd-tmpfiles-*) ln -sf /dev/null "${BUILDDIR}/etc/systemd/user/${unit}" ;; esac
done
rm -f "${BUILDDIR}/etc/systemd/masked-wsl-units.list"

# Per-profile registration name; drop the shortcut icon line if no .ico is shipped.
sed -i "s/^defaultName = .*/defaultName = aphrody-${PROFILE}/" "${BUILDDIR}/etc/wsl-distribution.conf"
[ -f "${BUILDDIR}/usr/lib/wsl/aphrody-omarchy.ico" ] || sed -i "/^icon = /d" "${BUILDDIR}/etc/wsl-distribution.conf"

chmod 0644 "${BUILDDIR}/etc/wsl.conf" "${BUILDDIR}/etc/wsl-distribution.conf"
chmod 0755 "${BUILDDIR}/usr/lib/wsl/first-setup-aphrody-omarchy.sh"
chmod 0440 "${BUILDDIR}/etc/sudoers.d/10-wheel"
rm -rf "${BUILDDIR}/etc/pacman.d/gnupg/"* "${BUILDDIR}/etc/resolv.conf" "${BUILDDIR}/boot/"*
find "${BUILDDIR}" -exec touch --no-dereference --date="@${SOURCE_DATE_EPOCH}" {} +

declare -r NAME="aphrody-${PROFILE}-${IMAGE_VERSION}"
fakeroot -- tar --numeric-owner --xattrs --acls \
    --mtime="@${SOURCE_DATE_EPOCH}" --clamp-mtime --sort=name \
    --pax-option=delete=atime,delete=ctime \
    --exclude-from=scripts/exclude \
    -C "${BUILDDIR}" -c . -f "${OUTPUTDIR}/${NAME}.tar"
# Microsoft recommends gzip: other formats risk breaking older WSL versions.
gzip -n --best -f "${OUTPUTDIR}/${NAME}.tar"
mv -v "${OUTPUTDIR}/${NAME}.tar.gz" "${OUTPUTDIR}/${NAME}.wsl"
(cd "${OUTPUTDIR}" && sha256sum "${NAME}.wsl" > "${NAME}.wsl.SHA256" && cat "${NAME}.wsl.SHA256")
