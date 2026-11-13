#!/bin/sh
# build-on-fr1.sh - build the WSL image on fr1 (never on the PC): Arch Linux container, one heavy job via aphrody-heavy.
#   ssh vps 'cd <checkout>/infra/wsl-distro && PROFILE=dev aphrody-heavy sh scripts/build-on-fr1.sh [version]'
# Output: work/output/aphrody-<profile>-<version>.wsl (+ .SHA256). CachyOS signing key as in CachyOS/cachyos-wsl CI.
set -eu
cd "$(dirname "$0")/.."
version=${1:-$(date -u +%Y.%m.%d)}
profile=${PROFILE:-desktop}
exec docker run --rm --network host -e PROFILE="$profile" -v "$PWD:/w" -w /w archlinux:latest sh -euc "
pacman -Syu --needed --noconfirm fakechroot fakeroot curl >/dev/null
pacman-key --init >/dev/null
pacman-key --recv-keys F3B607488DB35A47 --keyserver hkps://keyserver.ubuntu.com
pacman-key --lsign-key F3B607488DB35A47
bash scripts/build-image.sh /w/work '$version'
chown -R $(id -u):$(id -g) /w/work"
