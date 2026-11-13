#!/bin/bash
# Gate before any planned reboot of a fleet host, run from the PC (fleet-resilience-proof.sh calls it).
#   fleet-reboot-precheck.sh <fr1|fr2|prd> [--announce <minutes>] [--done] [--when-idle]
# --when-idle: busy now -> arm fleet-reboot-when-idle.timer on the host (reboot at the next idle slot, 10 min checks).
# Refuses (exit 75) when the host is busy:
#   - /var/lock/aphrody-heavy.lock held (heavy jobs, prd/fr1 load rule);
#   - an rg-steam-* service active, or rg-steam-initial running (Steam depot chain);
#   - a build running (cargo, rustc, ninja, siso, autoninja, cc1plus, clang, ld.lld, bazel), Chromium on fr1;
#   - processes in D state (uninterruptible: a dd blocked on FUSE held the prd shutdown 4.5 min on 2026-11-13).
# --announce: records the maintenance window in the NHITL index (var/agents/nhitl.sqlite, category
# maintenance_window, status open) so the other agents see it; --done closes it.
set -uo pipefail
h=${1:?usage: fleet-reboot-precheck.sh fr1|fr2|prd [--announce <min>|--done]}; act=${2:-}; mins=${3:-15}
root=$(cd "$(dirname "$0")/../../.." && pwd)
case $h in fr1) a=vps;; fr2) a=cdn;; prd) a=prd;; *) echo "unknown host $h" >&2; exit 2;; esac

nhitl() { # $1 status, $2 excerpt
  bun -e '
    import { Database } from "bun:sqlite";
    const [db, host, status, excerpt] = process.argv.slice(1);
    const d = new Database(db); const now = new Date().toISOString(); const id = "maintenance:" + host;
    d.run(`CREATE TABLE IF NOT EXISTS violation(id TEXT PRIMARY KEY, source TEXT, location TEXT, category TEXT, severity TEXT, excerpt TEXT, fix TEXT, status TEXT, reason TEXT, unit TEXT, first_seen TEXT, last_seen TEXT)`);
    d.run(`INSERT INTO violation VALUES (?, "ledger", ?, "maintenance_window", "high", ?, "do not start heavy jobs, builds or Steam on this host until closed", ?, ?, NULL, ?, ?)
           ON CONFLICT(id) DO UPDATE SET status=excluded.status, excerpt=excluded.excerpt, reason=excluded.reason, last_seen=excluded.last_seen`,
      [id, host, excerpt, status, "fleet-reboot-precheck " + now, now, now]);
  ' "$root/var/agents/nhitl.sqlite" "$h" "$1" "$2"
}

if [ "$act" = --done ]; then nhitl fixed "reboot window on $h closed $(date -u +%FT%TZ)"; echo "window closed"; exit 0; fi

# Host-side check (fleet-host-idle.sh), same one the on-host timer fleet-reboot-when-idle uses.
out=$(timeout 60 ssh -o ConnectTimeout=15 -o BatchMode=yes "$a" 'S=; [ "$(id -u)" = 0 ] || S="sudo -n"; $S /usr/local/bin/fleet-host-idle.sh')
echo "$out"
if echo "$out" | grep -q '^BUSY'; then
  if [ "$act" = --when-idle ]; then
    timeout 30 ssh "$a" 'S=; [ "$(id -u)" = 0 ] || S="sudo -n"; $S install -d /var/lib/fleet-resilience && $S touch /var/lib/fleet-resilience/reboot-when-idle && $S systemctl enable --now fleet-reboot-when-idle.timer >/dev/null' \
      && nhitl open "reboot of $h armed for the next idle slot ($(date -u +%FT%TZ))" && echo "precheck $h: busy, reboot armed for the next idle slot"
  else echo "precheck $h: refused, no reboot"; fi
  exit 75
fi
echo "$out" | grep -q '^IDLE' || { echo "precheck $h: host did not answer"; exit 75; }
[ "$act" = --announce ] && nhitl open "reboot window on $h $(date -u +%FT%TZ) for ${mins} min" && echo "window announced (${mins} min)"
exit 0
