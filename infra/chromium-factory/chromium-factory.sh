#!/usr/bin/env bash
# Chromium factory on fr1: sync Chromium to the tag of a Chrome channel (default Stable, read from
# chrome-channels.toml), build //headless:headless_shell with args/labs_agent.gn, publish to R2.
# Usage: chromium-factory.sh [sync|build|publish|all] [channel]
set -euo pipefail
step="${1:-all}"; channel="${2:-stable}"
root=/srv/chromium; here="$(cd "$(dirname "$0")" && pwd)"
export PATH="$HOME/depot_tools:$PATH" DEPOT_TOOLS_UPDATE=1
[ "$step" = build ] || [ "$step" = publish ] || sh "$here/scripts/chrome-channels.sh" >/dev/null
ver="$(awk -v c="[channel.$channel]" '$0==c{f=1;next} /^\[/{f=0} f&&/^chromium =/{gsub(/"/,"",$3);print $3}' "$here/third_party/chrome-channels.toml")"
[ -n "$ver" ] || { echo "no version for channel $channel"; exit 1; }
out="$root/src/out/labs_agent-$ver"
log() { echo "[$(date -u +%FT%TZ)] $*"; }
sync() {
  mkdir -p "$root"; cd "$root"
  if [ ! -d src/.git ]; then log "fetch (no history)"; fetch --nohooks --no-history chromium; fi
  cd src
  log "checkout $ver"
  git fetch --depth 1 origin "refs/tags/$ver:refs/tags/$ver"
  git -c advice.detachedHead=false checkout -f "tags/$ver"
  cd "$root"
  grep -q checkout_pgo_profiles .gclient || sed -i 's/"custom_vars": {},/"custom_vars": {"checkout_pgo_profiles": True},/' .gclient
  log "gclient sync"
  gclient sync -D --force --nohooks --no-history --with_tags
  [ -f "$root/.build-deps-done" ] || { sudo "$root/src/build/install-build-deps.sh" --no-prompt --no-chromeos-fonts && touch "$root/.build-deps-done"; }
  log "runhooks"; gclient runhooks
}
build() {
  cd "$root/src"
  mkdir -p "$out"; cp "$here/args/labs_agent.gn" "$out/args.gn"
  gn gen "$out"
  log "build headless_shell $ver"
  autoninja -C "$out" headless_shell
  ls -la "$out/headless_shell"
}
publish() {
  cd "$out"
  tarball="/srv/chromium/labs_agent-$ver-linux-x64.tar.zst"
  tar --zstd -cf "$tarball" headless_shell *.pak *.bin *.so* locales 2>/dev/null || tar --zstd -cf "$tarball" headless_shell
  rclone copyto "$tarball" "r2-chromium:aphrody-chromium/labs_agent/$ver/linux-x64.tar.zst"
  log "published $ver ($(du -h "$tarball" | cut -f1))"
}
case "$step" in sync) sync;; build) build;; publish) publish;; all) sync; build; publish;; *) exit 2;; esac
