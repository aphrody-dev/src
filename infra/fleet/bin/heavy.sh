#!/bin/sh
# Run one heavy job on a shared host (prd rule, 2026-11-13): a single heavy job at a time under
# flock /var/lock/aphrody-heavy.lock, started only when load < nproc/2, at nice 19 / ionice idle, 2 jobs.
#   heavy.sh <cmd...>          e.g. heavy.sh cargo build --release ; heavy.sh docker buildx bake ...
# Env: HEAVY_WAIT_MAX (s, default 3600) max wait for the load to drop; CARGO_BUILD_JOBS defaults to 2.
set -eu
lock=/var/lock/aphrody-heavy.lock
max=${HEAVY_WAIT_MAX:-3600}
half=$(( $(nproc) / 2 ))
export CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS:-2} MAKEFLAGS=${MAKEFLAGS:--j2} CMAKE_BUILD_PARALLEL_LEVEL=${CMAKE_BUILD_PARALLEL_LEVEL:-2}
exec 9>"$lock"
flock 9
waited=0
while :; do
  load=$(cut -d' ' -f1 /proc/loadavg | cut -d. -f1)
  [ "$load" -lt "$half" ] && break
  [ "$waited" -ge "$max" ] && { echo "heavy.sh: load $load >= $half after ${max}s, giving up" >&2; exit 75; }
  sleep 30; waited=$((waited + 30))
done
exec nice -n 19 ionice -c3 "$@"
