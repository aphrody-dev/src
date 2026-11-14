#!/bin/sh
# Kernel policy: Arch stable `linux` (7.3.x) stays installed as the GRUB fallback; 7.4-rc is added as a second entry.
# 7.4-rc is BUILT on fr1/CI (ay linux build, never on usa/fr2), packaged as a pacman package, installed with its own
# /boot/vmlinuz-linux-rc + initramfs. Usage on target: sh 40-kernel.sh <pkg.tar.zst>
. "$(dirname "$0")/lib.sh"; need_root
pacman -U --noconfirm "$1"
grub-mkconfig -o /boot/grub/grub.cfg
# 7.4-rc is tried ONCE: next boot only, a hang or panic falls back to the saved default (stable).
grub-set-default "$(awk -F\' '/^menuentry .*[Ll]inux$/{print $2; exit}' /boot/grub/grub.cfg)"   # stable stays default
RC=$(awk -F\' '/^menuentry .*rc/{print $2; exit}' /boot/grub/grub.cfg)
[ -n "$RC" ] || { echo "no rc entry" >&2; exit 1; }
grub-reboot "$RC"
echo "armed one-shot boot of: $RC (reboot is the operator's act, with fleet-reboot-precheck.sh)"
# panic=30 so a crashed rc returns to the stable default by itself: add 'panic=30' to GRUB_CMDLINE_LINUX of the rc entry.
