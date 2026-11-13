#!/bin/bash
# Outillage agent (infra/agents/toolchain.toml) appliqué pour root et agent depuis le checkout /srv/src.
# Lancé par aphrody-agents-sync.timer (horaire) ; idempotent. Doc : docs/infra/AGENT-TOOLCHAIN.md.
#   agents-sync.sh [sync|check]
set -uo pipefail
. /etc/fleet/resilience.conf
D=${SRC_CHECKOUT:-/srv/src}; verb=${1:-sync}; rc=0
T=$D/packages/machine/src/toolchain.ts
[ -f "$T" ] || { logger -t agents-sync -p daemon.err "$T absent (SRC_SPARSE)"; exit 1; }
for u in ${AGENTS_SYNC_USERS:-root agent}; do
  home=$(getent passwd "$u" | cut -d: -f6) || continue
  [ -n "$home" ] || continue
  p="$home/.bun/bin:$home/.local/bin:/usr/local/bin:/usr/bin:/bin"
  bun=$(PATH=$p command -v bun) || { logger -t agents-sync "$u : bun absent, ignoré"; continue; }
  PATH=$p command -v claude >/dev/null || PATH=$p command -v codex >/dev/null || PATH=$p command -v agy >/dev/null \
    || { logger -t agents-sync "$u : aucun agent installé, ignoré"; continue; }
  out=$(cd "$home" && runuser -u "$u" -- env HOME="$home" USER="$u" PATH="$p" XDG_RUNTIME_DIR="/run/user/$(id -u "$u")" \
        "$bun" "$T" "$verb" 2>&1); r=$?
  printf '%s\n' "$out" | sed "s/^/[$u] /"
  printf '%s\n' "$out" | grep -E '^(ERR|DIFF|set )' | logger -t "agents-sync[$u]"
  [ $r = 0 ] || rc=1
done
exit $rc
