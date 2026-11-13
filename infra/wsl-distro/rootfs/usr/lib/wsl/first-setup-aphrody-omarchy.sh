#!/usr/bin/env bash
# /usr/lib/wsl/first-setup-aphrody-omarchy.sh - WSL OOBE (oobe.command), run once as root.
# Non-zero exit = WSL runs it again on next launch (learn.microsoft.com/windows/wsl/build-custom-distro).
# Flow follows CachyOS/cachyos-wsl@2cedd88a rootfs/usr/lib/wsl/first-setup.sh.
set -u

declare -r DEFAULT_UID=1000
declare -r DEFAULT_USER="aphrody"
declare -r DEFAULT_GROUPS="wheel,video,render"

echo "Generating pacman keys..." && pacman-key --init &>/dev/null && echo "Done"
echo "Populating keyring..." && pacman-key --populate archlinux cachyos &>/dev/null && echo "Done"

# Not fatal: the default mirrorlists and generic packages work anywhere.
command -v cachyos-rate-mirrors >/dev/null && { cachyos-rate-mirrors &>/dev/null || echo "Mirror ranking failed, keeping defaults"; }
[ -x /usr/lib/wsl/optimize-repos ] && { /usr/lib/wsl/optimize-repos || echo "optimize-repos failed, keeping generic packages"; }

shell=/usr/bin/fish
[ -x "$shell" ] || shell=/usr/bin/bash

username=$(getent passwd "$DEFAULT_UID" | cut -d: -f1)
if [ -z "$username" ]; then
    useradd --create-home --uid "$DEFAULT_UID" --groups "$DEFAULT_GROUPS" --shell "$shell" -- "$DEFAULT_USER" || exit 1
    username=$DEFAULT_USER
    # Passwordless account; sudo comes from /etc/sudoers.d/10-wheel.
    passwd -d -- "$username" >/dev/null
fi

home=$(getent passwd "$DEFAULT_UID" | cut -d: -f6)
install -d -m 0700 -o "$DEFAULT_UID" -g "$DEFAULT_UID" "$home/.config" "$home/.config/omarchy" "$home/.config/omarchy/current"
exit 0
