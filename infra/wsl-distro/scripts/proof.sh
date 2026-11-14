#!/bin/sh
# proof.sh - measured proof inside the aphrody distro: docker run, buildx arm64, KVM boot to login, WSLg.
set -u
echo "== docker run --rm alpine true (20 runs, ms)"
s=$(date +%s%N); for i in $(seq 20); do docker run --rm alpine:3.23 true; done; e=$(date +%s%N); echo $(( (e-s)/20000000 ))
echo "== buildx arm64"; d=$(mktemp -d); printf 'FROM alpine:3.23\nRUN echo hi > /x\n' > $d/Dockerfile
s=$(date +%s%N); docker buildx build -q --no-cache --platform linux/arm64 -t proof:arm $d >/dev/null; e=$(date +%s%N); echo "$(( (e-s)/1000000 )) ms"; docker run --rm --platform linux/arm64 proof:arm uname -m
echo "== KVM boot"; mkdir -p /srv/vm; cd /srv/vm
iso=$(wget -qO- https://dl-cdn.alpinelinux.org/alpine/latest-stable/releases/x86_64/ | grep -o 'alpine-virt-[0-9.]*-x86_64.iso' | sort -u | tail -1)
[ -f "$iso" ] || wget -q "https://dl-cdn.alpinelinux.org/alpine/latest-stable/releases/x86_64/$iso"
rm -f /tmp/vm.log; s=$(date +%s%N)
timeout 120 qemu-system-x86_64 -enable-kvm -cpu host -smp 4 -m 1G -nographic -no-reboot -cdrom "$iso" -boot d >/tmp/vm.log 2>&1 &
q=$!; while ! grep -q "login:" /tmp/vm.log 2>/dev/null; do sleep 0.1; done; echo "boot-to-login $(( ($(date +%s%N)-s)/1000000 )) ms ($iso)"; kill $q
echo "== WSLg"; ls /mnt/wslg/.X11-unix 2>&1 | head -3; echo "WAYLAND_DISPLAY=${WAYLAND_DISPLAY:-}"; ls /dev/dxg
