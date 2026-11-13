#!/bin/bash
# Crash test from the PC: kill -9 the main process of critical units on one host and check that each comes
# back by itself (systemd Restart=), or for a WireGuard link deleted by hand, that the self-heal brings it back.
#   fleet-kill-test.sh <fr1|fr2|prd> <unit|user:unit|wg:<iface>> ...
# Output: one line per target, "PASS|FAIL <target> old_pid -> new_pid in <s>s". Exit 1 on any FAIL.
set -uo pipefail
h=${1:?host}; shift
case $h in fr1) a=vps;; fr2) a=cdn;; prd) a=prd;; *) echo "unknown host $h" >&2; exit 2;; esac
timeout 600 ssh "$a" 'S=; [ "$(id -u)" = 0 ] || S="sudo -n"; $S bash -s '"$*" <<'EOS'
rc=0
for t in "$@"; do
  case $t in
    wg:*) i=${t#wg:}; ip link del "$i"; s=$(date +%s); /usr/local/bin/fleet-resilience.sh heal >/dev/null 2>&1
          n=0; while ! ip link show "$i" >/dev/null 2>&1 && [ $n -lt 30 ]; do sleep 1; n=$((n+1)); done
          if ip link show "$i" >/dev/null 2>&1; then echo "PASS $t link deleted -> back in $(( $(date +%s) - s ))s (fleet-resilience heal)"; else echo "FAIL $t"; rc=1; fi; continue;;
    *:*) u=${t#*:}; ctl="systemctl --user -M ${t%%:*}@";;
    *) u=$t; ctl=systemctl;;
  esac
  old=$($ctl show -p MainPID --value "$u"); [ -n "$old" ] && [ "$old" != 0 ] || { echo "FAIL $t no main pid"; rc=1; continue; }
  kill -9 "$old"; s=$(date +%s); new=0
  for n in $(seq 1 60); do
    sleep 1; new=$($ctl show -p MainPID --value "$u")
    [ -n "$new" ] && [ "$new" != 0 ] && [ "$new" != "$old" ] && $ctl is-active -q "$u" && break
  done
  if [ "$new" != 0 ] && [ "$new" != "$old" ] && $ctl is-active -q "$u"; then echo "PASS $t kill -9 $old -> $new active in $(( $(date +%s) - s ))s (NRestarts=$($ctl show -p NRestarts --value "$u"))"
  else echo "FAIL $t old=$old new=$new state=$($ctl is-active "$u")"; rc=1; fi
done
exit $rc
EOS
