#!/bin/sh
# Read-only. Run from the PC: for h in usa fr1 fr2; do ay ssh exec $h -- 'sh -s' < 00-preflight.sh; done
echo "host=$(hostname) kernel=$(uname -r)"; lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT
[ -e /dev/kvm ] && echo kvm=yes || echo kvm=NO
df -h / /srv /home 2>/dev/null; systemctl is-active wg-quick@wg1 wg-quick@vps wg-quick@prod docker nginx 2>/dev/null
command -v btrfs >/dev/null && btrfs filesystem usage -T / 2>/dev/null | head -12
