#!/bin/bash
# Gate before any planned reboot of a fleet host, run from the PC (fleet-resilience-proof.sh calls it).
#   fleet-reboot-precheck.sh <fr1|fr2|prd> [--announce <minutes>] [--done]
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

out=$(timeout 60 ssh -o ConnectTimeout=15 -o BatchMode=yes "$a" 'S=; [ "$(id -u)" = 0 ] || S="sudo -n"; $S bash -s' <<'EOS'
busy=0
say() { echo "BUSY $*"; busy=1; }
if [ -e /var/lock/aphrody-heavy.lock ] && ! flock -n /var/lock/aphrody-heavy.lock true; then
  say "heavy lock held by: $(fuser /var/lock/aphrody-heavy.lock 2>/dev/null | xargs -r ps -o comm= -p | sort -u | paste -sd,)"
fi
s=$(systemctl list-units --type=service --state=active,activating,reloading --no-legend --plain 'rg-steam-*' | awk '{print $1}' | paste -sd,)
[ -n "$s" ] && say "steam units: $s"
pgrep -f rg-steam-initial >/dev/null && say "rg-steam-initial running"
b=$(pgrep -x 'cargo|rustc|ninja|siso|autoninja|cc1plus|clang|clang\+\+|ld.lld|bazel|reproxy' | xargs -r ps -o comm= -p | sort -u | paste -sd,)
[ -n "$b" ] && say "build running: $b"
d=$(ps -eo stat=,pid=,comm= | awk '$1 ~ /^D/ {print $2"/"$3}' | paste -sd,)
[ -n "$d" ] && say "D-state processes: $d"
[ $busy = 0 ] && echo "IDLE load=$(cut -d' ' -f1 /proc/loadavg) nproc=$(nproc)"
EOS
)
echo "$out"
echo "$out" | grep -q '^BUSY' && { echo "precheck $h: refused, no reboot"; exit 75; }
echo "$out" | grep -q '^IDLE' || { echo "precheck $h: host did not answer"; exit 75; }
[ "$act" = --announce ] && nhitl open "reboot window on $h $(date -u +%FT%TZ) for ${mins} min" && echo "window announced (${mins} min)"
exit 0
