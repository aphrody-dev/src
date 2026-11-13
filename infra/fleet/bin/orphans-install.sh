#!/bin/sh
# Install the units and scripts captured from live hosts (infra/fleet/<host>/orphans) on that host.
# Usage: just fleet-orphans prd|fr1. Idempotent; scripts go where the units expect them (see each unit ExecStart).
set -eu
root=${SRC_ROOT:-$(cd "$(dirname "$0")/../../.." && pwd)}
role=$1
case "$role" in prd) alias=prd ;; fr1) alias=vps ;; *) echo "role: prd|fr1" >&2; exit 2 ;; esac
tar -cf - -C "$root/infra/fleet/$role/orphans" systemd | timeout 120 ssh "$alias" '
  d=$(mktemp -d) && tar -xf - -C "$d" && ch=0
  for f in "$d"/systemd/*; do
    n=$(basename "$f"); cmp -s "$f" "/etc/systemd/system/$n" || { install -D -m 0644 "$f" "/etc/systemd/system/$n"; ch=1; }
  done
  [ "$ch" = 1 ] && systemctl daemon-reload
  rm -rf "$d"'
