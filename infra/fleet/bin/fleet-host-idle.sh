#!/bin/bash
# Is this host idle enough to reboot? Prints BUSY <reason> lines or one IDLE line; exit 0 idle, 75 busy.
# Busy: heavy lock held, rg-steam-* active, build running (Chromium/LLVM/Rust), user processes in D state.
# Used by fleet-reboot-precheck.sh (from the PC) and fleet-reboot-when-idle.service (on the host).
busy=0
say() { echo "BUSY $*"; busy=1; }
L=/var/lock/aphrody-heavy.lock
# Open without O_CREAT (fs.protected_regular refuses root opening another user's file in sticky /run/lock).
held=0
if [ -e $L ]; then exec 9<"$L"; flock -n 9 || held=1; exec 9<&-; fi
[ $held = 1 ] && say "heavy lock held by: $(fuser $L 2>/dev/null | xargs -r ps -o comm= -p | sort -u | paste -sd,)"
s=$(systemctl list-units --type=service --state=active,activating,reloading --no-legend --plain 'rg-steam-*' | awk '{print $1}' | paste -sd,)
[ -n "$s" ] && say "steam units: $s"
pgrep -f rg-steam-initial >/dev/null && say "rg-steam-initial running"
b=$(pgrep -x 'cargo|rustc|ninja|siso|autoninja|cc1plus|clang|clang\+\+|ld.lld|bazel|reproxy' | xargs -r ps -o comm= -p | sort -u | paste -sd,)
[ -n "$b" ] && say "build running: $b"
# D state of user processes only (kernel threads such as btrfs-transaction or flush workers are transient).
d=$(ps -eo stat=,pid=,ppid=,comm= | awk '$1 ~ /^D/ && $3 != 2 && $2 != 2 {print $2"/"$4}' | paste -sd,)
[ -n "$d" ] && say "D-state processes: $d"
[ $busy = 0 ] && { echo "IDLE load=$(cut -d' ' -f1 /proc/loadavg) nproc=$(nproc)"; exit 0; }
exit 75
