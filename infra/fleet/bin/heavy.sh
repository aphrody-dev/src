#!/bin/sh
# Run one heavy job (build, test suite, image bake, training) on fr1, the factory (owner decision 2026-11-13:
# prd and fr2 serve production only and never compile). One heavy job at a time under
# flock /var/lock/aphrody-heavy.lock, started when load < 2/3 nproc, at nice 19 / ionice idle, so
# Chromium/LLVM builds keep priority.
#   aphrody-heavy <cmd...>      e.g. aphrody-heavy cargo build --release ; aphrody-heavy docker buildx bake ...
#   from another host or the PC: ssh vps aphrody-heavy <cmd...>
# Env: HEAVY_WAIT_MAX (s, default 3600) max wait for the load to drop; CARGO_BUILD_JOBS defaults to nproc/3.
# The host role comes from /etc/aphrody/role (written by infra/fleet/bootstrap/<role>.sh).
set -eu
role=$(cat /etc/aphrody/role 2>/dev/null || echo unknown)
if [ "$role" != fr1 ]; then
  echo "aphrody-heavy: heavy jobs run on fr1 only (this host: $role). Use: ssh vps aphrody-heavy $*" >&2
  exit 64
fi
lock=/var/lock/aphrody-heavy.lock
max=${HEAVY_WAIT_MAX:-3600}
n=$(nproc)
limit=$(( n * 2 / 3 ))
jobs=$(( n / 3 )); [ "$jobs" -ge 1 ] || jobs=1
export CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS:-$jobs} MAKEFLAGS=${MAKEFLAGS:--j$jobs} CMAKE_BUILD_PARALLEL_LEVEL=${CMAKE_BUILD_PARALLEL_LEVEL:-$jobs}
# Shared by every user (agent, ubuntu, root): created 0666, then opened read-only (flock(2) needs no write access).
[ -e "$lock" ] || (umask 0; : > "$lock") 2>/dev/null
exec 9<"$lock"
flock 9
waited=0
while :; do
  load=$(cut -d' ' -f1 /proc/loadavg | cut -d. -f1)
  [ "$load" -lt "$limit" ] && break
  [ "$waited" -ge "$max" ] && { echo "aphrody-heavy: load $load >= $limit after ${max}s, giving up" >&2; exit 75; }
  sleep 30; waited=$((waited + 30))
done
exec nice -n 19 ionice -c3 "$@"
