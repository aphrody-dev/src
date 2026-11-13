#!/bin/bash
# SPDX-License-Identifier: Apache-2.0
# Rose Griffon game fill on prd, resumable after a reboot (rg-steam-fill.service).
# Steps run in order; each one writes /var/lib/rg-steam-fill/<step>.done when it succeeds, so a
# restart skips the steps already done. Heavy steps take /var/lock/aphrody-heavy.lock one at a time
# and wait for load < nproc/2 (prd load rule); cdn-sync takes the lock itself (rg-cdn-sync.service).
#   update   steam-depot update (stored refresh token) into /srv/rosegriffon/game/ievr
#   verify   steam-depot verify (hash every file against the manifests)
#   boot     derive-nie-boot.ts -> /srv/rosegriffon/cdn/static/nie/boot
#   cdn      rg-cdn-sync.service (prod -> cdn -> R2)
#   reload   restart model-serve so it reads the new install
# Env: RG_STACK_DIR (/root/src/rosegriffon-stack), RG_SRV_ROOT (/srv/rosegriffon),
#      STEAM_MAX_DOWNLOADS (8). `rm /var/lib/rg-steam-fill/*.done` forces a full run.
set -euo pipefail

STATE=${STATE_DIRECTORY:-/var/lib/rg-steam-fill}
STACK=${RG_STACK_DIR:-/root/src/rosegriffon-stack}
SRV=${RG_SRV_ROOT:-/srv/rosegriffon}
LOCK=/var/lock/aphrody-heavy.lock
mkdir -p "$STATE"
cd "$STACK"

log() { echo "rg-steam-fill: $*"; }

# Runs "$@" under the heavy lock once the load is below nproc/2.
heavy() {
  (
    flock 9
    while [ "$(cut -d' ' -f1 /proc/loadavg | cut -d. -f1)" -ge "$(($(nproc) / 2))" ]; do sleep 30; done
    "$@"
  ) 9>"$LOCK"
}

# steam-depot in the foreground; its container processes get nice 19 / idle I/O / low CPU weight.
depot() {
  local name="rg-steam-$1"
  docker rm -f "$name" >/dev/null 2>&1 || true
  (
    for _ in $(seq 1 60); do
      docker top "$name" -o pid >/dev/null 2>&1 && break
      sleep 2
    done
    docker update --cpu-shares 2 "$name" >/dev/null 2>&1 || true
    for p in $(docker top "$name" -o pid 2>/dev/null | tail -n +2); do
      renice -n 19 -p "$p" >/dev/null 2>&1 || true
      ionice -c3 -p "$p" 2>/dev/null || true
    done
  ) &
  local rc
  set +e
  docker compose --profile tools run --rm -T --name "$name" \
    -e STEAM_MAX_DOWNLOADS="${STEAM_MAX_DOWNLOADS:-8}" steam-depot "$1" 2>&1 |
    grep --line-buffered -v -i -E 'token=|eyJ|progression'
  rc=${PIPESTATUS[0]}
  set -e
  wait
  return "$rc"
}

boot() {
  nice -n 19 ionice -c3 bun "$STACK/infra/scripts/derive-nie-boot.ts" \
    --game "$SRV/game/ievr" --static "$SRV/cdn/static"
  chown -R 1000:1000 "$SRV/cdn/static/nie"
}

step() {
  local s=$1
  shift
  if [ -e "$STATE/$s.done" ]; then
    log "$s: already done"
    return 0
  fi
  log "$s: start"
  "$@"
  date -u +%FT%TZ >"$STATE/$s.done"
  log "$s: ok"
}

step update heavy depot update
step verify heavy depot verify
step boot heavy boot
step cdn systemctl start rg-cdn-sync.service
step reload docker compose restart model-serve
log "all steps done"
