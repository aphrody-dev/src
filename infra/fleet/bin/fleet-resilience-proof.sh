#!/bin/sh
# Reboot proof (owner decision 2026-11-13, docs/infra/RESILIENCE.md): reboot one host for real and show that
# everything comes back by itself, while the other hosts keep serving. Run from the PC, one host at a time:
#   sh infra/fleet/bin/fleet-resilience-proof.sh fr2      (just fleet-resilience-proof fr2)
# Before/after: boot id, fleet-resilience.sh check, running containers, agent tmux session, vhosts on every host
# (curl --resolve <vhost>:443:127.0.0.1 on the host), public URLs (Cloudflare) incl. api.aphrody.com/v1/health.
# During the reboot the public URLs are polled every 10 s (availability ratio). The report is printed and
# archived in docs/infra/resilience/<UTC date>-<host>.txt. Exit 1 when a check got worse after the reboot.
set -u
h=${1:?usage: fleet-resilience-proof.sh fr1|fr2|prd}
root=$(cd "$(dirname "$0")/../../.." && pwd)
alias_of() { case $1 in fr1) echo vps;; fr2) echo cdn;; prd) echo prd;; *) return 1;; esac; }
a=$(alias_of "$h") || { echo "unknown host $h" >&2; exit 2; }
# Never two reboots at once, never twice the same host: one proof at a time on this PC (atomic mkdir lock,
# shared by every session), and refuse a host or a peer that booted less than 15 min ago.
L=${TMPDIR:-/tmp}/fleet-reboot-proof.lock
mkdir "$L" 2>/dev/null || { echo "another reboot proof is running ($(cat "$L/owner" 2>/dev/null)); retry later" >&2; exit 75; }
echo "$h $$ $(date -u +%T)" > "$L/owner"; trap 'rm -rf "$L"' EXIT
for p in vps cdn prd; do
  up=$(timeout 20 ssh -o ConnectTimeout=10 -o BatchMode=yes "$p" "cut -d. -f1 /proc/uptime" 2>/dev/null)
  [ -n "$up" ] && [ "$up" -lt 900 ] && { echo "$p booted ${up}s ago: wait until every host is up 15 min" >&2; exit 75; }
done
VHOSTS=${PROOF_VHOSTS:-"aphrody.com/ aphrody.app/ api.aphrody.com/v1/health cdn.aphrody.com/ downloads.aphrody.com/ creator.aphrody.com/health dragonballfr.com/ rosegriffon.fr/ ai.aphrody.com/ rpbey.fr/"}
out=$root/docs/infra/resilience/$(date -u +%Y-%m-%dT%H%MZ)-$h.txt
mkdir -p "$(dirname "$out")"
S='S=; [ "$(id -u)" = 0 ] || S="sudo -n";'
rs() { timeout "${2:-60}" ssh -o ConnectTimeout=10 -o BatchMode=yes "$a" "$S $1" 2>/dev/null; }
say() { echo "$*" | tee -a "$out"; }
vh_host() { # $1 alias: vhost=code on that host through loopback (one ssh)
  timeout 120 ssh -o ConnectTimeout=10 -o BatchMode=yes "$1" "for u in $VHOSTS; do d=\${u%%/*}; printf '%s=%s ' \$d \$(curl -sk -o /dev/null -m 10 -w '%{http_code}' --resolve \$d:443:127.0.0.1 https://\$u); done" 2>/dev/null || echo unreachable
}
pub() { for u in $VHOSTS; do printf '%s=%s ' "${u%%/*}" "$(curl -s -o /dev/null -m 10 -w '%{http_code}' "https://$u")"; done; }
state() { # snapshot of host $h
  say "boot_id: $(rs 'cat /proc/sys/kernel/random/boot_id') uptime: $(rs 'uptime -p')"
  say "system: $(rs 'systemctl is-system-running')"
  chk=$(rs '$S /usr/local/bin/fleet-resilience.sh check' 120)
  say "resilience check: $(echo "$chk" | grep -c '^OK') OK, $(echo "$chk" | grep -c '^FAIL') FAIL"
  echo "$chk" | grep '^FAIL' | sed 's/^/  /' | tee -a "$out"
  say "containers running: $(rs '$S docker ps -q | wc -l') / all: $(rs '$S docker ps -aq | wc -l')"
  say "agent tmux: $(rs 'sudo -n -u agent tmux ls 2>&1 | head -1')"
  say "journald: $(rs 'journalctl --header 2>/dev/null | grep -m1 "File path" | sed "s/.*: //"')"
  for p in vps cdn prd; do say "vhosts on $p: $(vh_host $p)"; done
  say "public: $(pub)"
}
fails() { grep -c "=000\|=5[0-9][0-9]" ; }

say "# Reboot proof $h ($a) $(date -u +%FT%TZ)"
say "## before"; state
before_boot=$(rs 'cat /proc/sys/kernel/random/boot_id')
before_chk=$(rs '$S /usr/local/bin/fleet-resilience.sh check' 120 | grep -c '^FAIL')
before_pub=$(pub | tr ' ' '\n' | fails); before_ct=$(rs '$S docker ps -q | wc -l')
# Gate: no heavy job, Steam chain, build or D-state process on the host; window announced in the NHITL index.
pre=$(bash "$root/infra/fleet/bin/fleet-reboot-precheck.sh" "$h" --announce 15)
say "precheck: $(echo "$pre" | paste -sd" " -)"
case $pre in *refused*|*"did not answer"*) say "result: NOT RUN (precheck refused)"; exit 75;; esac
say "## reboot $(date -u +%T)"
rs '$S systemd-run --on-active=2 systemctl reboot >/dev/null && echo scheduled' 20 | grep -q scheduled || { say "reboot order refused"; exit 1; }
t0=$(date +%s); ok=0; tot=0; back=""
while [ $(( $(date +%s) - t0 )) -lt 900 ]; do
  r=$(pub); tot=$((tot + 1)); [ "$(echo "$r" | tr ' ' '\n' | fails)" -le "$before_pub" ] && ok=$((ok + 1))
  b=$(rs 'cat /proc/sys/kernel/random/boot_id' 15)
  if [ -n "$b" ] && [ "$b" != "$before_boot" ]; then back=$(( $(date +%s) - t0 )); break; fi
  sleep 10
done
[ -n "$back" ] || { say "host did not come back within 900 s"; exit 1; }
say "ssh back after ${back}s; public availability during the reboot: $ok/$tot polls with no new failure"
# Let the units, containers and timers settle (max 5 min), then measure again.
i=0; while [ $i -lt 30 ]; do s=$(rs 'systemctl is-system-running'); case $s in running|degraded) break;; esac; sleep 10; i=$((i + 1)); done
sleep "${PROOF_SETTLE:-90}"
say "## after ($(( $(date +%s) - t0 ))s after the reboot order)"; state
after_chk=$(rs '$S /usr/local/bin/fleet-resilience.sh check' 120 | grep -c '^FAIL')
after_pub=$(pub | tr ' ' '\n' | fails); after_ct=$(rs '$S docker ps -q | wc -l')
rc=0
[ "$after_chk" -le "$before_chk" ] || { say "WORSE: resilience FAIL $before_chk -> $after_chk"; rc=1; }
[ "$after_pub" -le "$before_pub" ] || { say "WORSE: public failures $before_pub -> $after_pub"; rc=1; }
[ "$after_ct" -ge "$before_ct" ] || { say "WORSE: running containers $before_ct -> $after_ct"; rc=1; }
bash "$root/infra/fleet/bin/fleet-reboot-precheck.sh" "$h" --done >/dev/null 2>&1
say "result: $([ $rc = 0 ] && echo PASS || echo FAIL) (archived: docs/infra/resilience/$(basename "$out"))"
exit $rc
