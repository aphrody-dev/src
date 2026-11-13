#!/bin/sh
# Run one heavy job (build, test suite, image bake, training) on fr1, the factory; prd accepts light builds
# under the load rule (-j 2, load < nproc/2), fr2 never builds. One job at a time per host under
# flock /var/lock/aphrody-heavy.lock, started when load < 2/3 nproc (fr1) or nproc/2 (prd), at nice 19 /
# ionice idle, so Chromium/LLVM builds and production keep priority.
#   aphrody-heavy <cmd...>      e.g. aphrody-heavy cargo build --release ; aphrody-heavy docker buildx bake ...
#   from another host or the PC: ssh vps aphrody-heavy <cmd...>
# Env: HEAVY_WAIT_MAX (s, default 3600) max wait for the load to drop; CARGO_BUILD_JOBS defaults to nproc/3.
# The host role comes from /etc/aphrody/role (written by infra/fleet/bootstrap/<role>.sh).
set -eu
role=$(cat /etc/aphrody/role 2>/dev/null || echo unknown)
lock=/var/lock/aphrody-heavy.lock
max=${HEAVY_WAIT_MAX:-3600}
n=$(nproc)
case $role in
  fr1) limit=$(( n * 2 / 3 )); jobs=$(( n / 3 )) ;;
  # prd (owner order 2026-11-13): light builds only (wasm/web bundles, CLI packaging), production first:
  # same lock, -j 2, started only while load < nproc/2, nice 19 / ionice idle.
  prd) limit=$(( n / 2 )); jobs=2 ;;
  *) echo "aphrody-heavy: builds run on fr1 (light ones also on prd), not on $role. Use: ssh vps aphrody-heavy $*" >&2
     exit 64 ;;
esac
[ "$jobs" -ge 1 ] || jobs=1
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
