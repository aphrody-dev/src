#!/bin/sh
# Kernel policy: Arch stable `linux` (7.3.x) stays installed and default (GRUB fallback); 7.4-rc is a second entry, tried once.
# 7.4-rc source: CachyOS repo package `linux-cachyos-rc` (PKGBUILD tracks 7.4-rc2, CachyOS/linux-cachyos, read 2026-11-14).
# If the repo lacks it, pass a locally built pacman package (ay linux build, flavor rc-v3 of infra/linux/kernels.toml; built on fr1/CI only).
# Usage on target: sh 40-kernel.sh [pkg.tar.zst ...]
. "$(dirname "$0")/lib.sh"; need_root
if [ $# -gt 0 ]; then pacman -U --noconfirm "$@"; else pacman -S --needed --noconfirm linux-cachyos-rc linux-cachyos-rc-headers; fi
grub-mkconfig -o /boot/grub/grub.cfg
# 7.4-rc is tried ONCE: next boot only, a hang or panic falls back to the saved default (stable).
STABLE=$(awk -F\' '/^menuentry .*[Ll]inux$/{print $2; exit}' /boot/grub/grub.cfg)
[ -n "$STABLE" ] || { echo "no stable entry" >&2; exit 1; }
grub-set-default "$STABLE"
RC=$(awk -F\' '/^menuentry .*(cachyos|rc)/{print $2; exit}' /boot/grub/grub.cfg)
[ -n "$RC" ] || { echo "no rc entry" >&2; exit 1; }
# panic=30 on the rc entry so a crashed rc returns to the stable default by itself.
sed -i "/menuentry '$RC'/,/initrd/ s|\(linux .*vmlinuz-linux-cachyos-rc.*\)|\1 panic=30|" /boot/grub/grub.cfg
grub-reboot "$RC"
echo "armed one-shot boot of: $RC (reboot is the operator's act, with fleet-reboot-precheck.sh)"
