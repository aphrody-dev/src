#!/usr/bin/env bash
# ChromiumOS factory on fr1: repo checkout of chromiumos (release branch matching Chrome Stable's
# milestone), cros_sdk chroot, build_packages + build_image for a board, publish the image to R2.
# Usage: cros-factory.sh [sync|build|image|publish|all] [board]   (default board: amd64-generic)
set -euo pipefail
step="${1:-all}"; board="${2:-amd64-generic}"
root=/home/ubuntu/chromiumos; here="$(cd "$(dirname "$0")" && pwd)"
export PATH="$HOME/depot_tools:$PATH"
milestone="$(awk '/^\[channel.stable\]/{f=1;next} /^\[/{f=0} f&&/^chromium =/{gsub(/"/,"",$3);split($3,v,".");print v[1]}' "$here/third_party/chrome-channels.toml")"
branch="release-R${milestone}"
log() { echo "[$(date -u +%FT%TZ)] $*"; }
sync() {
  mkdir -p "$root"; cd "$root"
  # Resolve the exact release branch name (release-R157-xxxxx.B) from the manifest repo.
  b="$(git ls-remote --heads https://chromium.googlesource.com/chromiumos/manifest "refs/heads/${branch}-*" | awk -F/ '{print $3}' | sort -V | tail -1)"
  [ -n "$b" ] || b=stable
  log "repo init $b"
  repo init -u https://chromium.googlesource.com/chromiumos/manifest -b "$b" --depth=1 --no-clone-bundle
  log "repo sync"
  repo sync -j"$(nproc)" -c --no-tags --no-clone-bundle --optimized-fetch
}
build() {
  cd "$root"
  log "cros build-packages $board"
  # Current guide: chromite entry points run from outside the chroot and enter the SDK themselves.
  cros build-packages --board="$board"
}
image() {
  cd "$root"
  log "cros build-image $board"
  cros build-image --board="$board" --no-enable-rootfs-verification test
}
publish() {
  img="$root/src/build/images/$board/latest/chromiumos_test_image.bin"
  [ -f "$img" ] || { echo "no image at $img"; exit 1; }
  zstd -T0 -19 -f "$img" -o "/home/ubuntu/chromiumos-$board-R$milestone.bin.zst"
  rclone copyto "/home/ubuntu/chromiumos-$board-R$milestone.bin.zst" "r2-chromium:aphrody-chromium/chromiumos/R$milestone/$board.bin.zst"
  log "published R$milestone $board"
}
case "$step" in sync) sync;; build) build;; image) image;; publish) publish;; all) sync; build; image; publish;; *) exit 2;; esac
