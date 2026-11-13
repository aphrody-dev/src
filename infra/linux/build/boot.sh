#!/bin/sh
# Boot proof of a kernel package built by kernel.sh: extract vmlinuz, boot it in QEMU (KVM when /dev/kvm
# is usable, else TCG) on a one-file initramfs whose PID 1 (boot/init.c) prints the running uname and
# APHRODY-BOOT-OK, then powers off. Passes when the uname release equals the package's module directory.
#   boot.sh <linux-*.pkg.tar.zst> [log]      (GitHub runner or fr1; needs qemu-system-x86_64, clang, lld, cpio, zstd)
set -eu
PKG=$1
LOG=${2:-boot.log}
HERE=$(cd "$(dirname "$0")" && pwd)
T=$(mktemp -d)
trap 'rm -rf "$T"' EXIT
tar --zstd -xf "$PKG" -C "$T" --wildcards 'usr/lib/modules/*/vmlinuz'
kver=$(basename "$(dirname "$(ls "$T"/usr/lib/modules/*/vmlinuz | head -1)")")
mkdir -p "$T/root"
clang -static -nostdlib -ffreestanding -fno-stack-protector -fno-pic -O2 -fuse-ld=lld \
  -o "$T/root/init" "$HERE/boot/init.c"
(cd "$T/root" && echo init | cpio -o -H newc --quiet) > "$T/initramfs.cpio"
if [ -w /dev/kvm ]; then accel=kvm cpu=${CPU:-host}; else accel=tcg cpu=${CPU:-max}; fi
echo "boot: kernel $kver, accel $accel, cpu $cpu"
timeout "${TIMEOUT:-300}" qemu-system-x86_64 -machine q35 -accel "$accel" -cpu "$cpu" -smp 2 -m 1024 \
  -kernel "$T/usr/lib/modules/$kver/vmlinuz" -initrd "$T/initramfs.cpio" \
  -append "console=ttyS0 rdinit=/init panic=-1" \
  -nographic -no-reboot -serial mon:stdio </dev/null > "$LOG" 2>&1 || true
grep -E 'APHRODY-|Kernel panic|Linux version' "$LOG" || true
grep -q '^APHRODY-BOOT-OK' "$LOG" || { echo "boot: no boot marker" >&2; tail -n 30 "$LOG" >&2; exit 1; }
release=$(sed -n 's/^APHRODY-UNAME Linux \([^ ]*\) .*/\1/p' "$LOG" | tr -d '\r' | head -1)
[ "$release" = "$kver" ] || { echo "boot: uname release '$release' != package '$kver'" >&2; exit 1; }
echo "boot: ok, uname -r = $release"
