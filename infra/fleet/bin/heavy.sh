#!/bin/sh
# Run one heavy job (build, test suite, image bake, training) on fr1, the factory; prd accepts light builds
# under the load rule (-j 2, load < nproc/2), fr2 never builds. HEAVY_SLOTS jobs at a time (fr1 default 2 for the
# parallel CI runners, prd 1) under flock /var/lock/aphrody-heavy[.N].lock, started when load < 2x nproc (fr1: shared with agents, nice 19 yields to Chromium) or
# nproc/2 (prd), at nice 19 / ionice idle, so Chromium/LLVM builds and production keep priority.
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
  fr1) limit=$(( n * 2 )); slots=${HEAVY_SLOTS:-2}; jobs=$(( n / (slots + 1) )) ;;
  # prd (owner order 2026-11-13): light builds only (wasm/web bundles, CLI packaging), production first:
  # same lock, -j 2, started only while load < nproc/2, nice 19 / ionice idle.
  prd) limit=$(( n / 2 )); jobs=2; slots=1 ;;
  *) echo "aphrody-heavy: builds run on fr1 (light ones also on prd), not on $role. Use: ssh vps aphrody-heavy $*" >&2
     exit 64 ;;
esac
limit=${HEAVY_LIMIT:-$limit} # HEAVY_LIMIT: load below which a job may start (nice 19 and idle I/O already yield to Chromium)
[ "$jobs" -ge 1 ] || jobs=1
export CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS:-$jobs} MAKEFLAGS=${MAKEFLAGS:--j$jobs} CMAKE_BUILD_PARALLEL_LEVEL=${CMAKE_BUILD_PARALLEL_LEVEL:-$jobs}
# Build caches (docs/infra/CACHE.md): one cargo target dir per user on the btrfs /home (zstd, noatime, reflink),
# one sccache dir capped like fleet-tune.sh clean (SCCACHE_MAX_MB of tune.conf). RUSTC_WRAPPER only when unset:
# an explicit value wins, including the empty one of ci.yml and of .cargo/config.toml readers.
export CARGO_TARGET_DIR=${CARGO_TARGET_DIR:-$HOME/build/target}
export SCCACHE_DIR=${SCCACHE_DIR:-$HOME/.cache/sccache} SCCACHE_CACHE_SIZE=${SCCACHE_CACHE_SIZE:-40G}
command -v sccache >/dev/null 2>&1 && export RUSTC_WRAPPER=${RUSTC_WRAPPER-sccache}
# Shared by every user (agent, ubuntu, root): created 0666, then opened read-only (flock(2) needs no write access).
# Slot k = lock file $lock (k=1) or $lock.k: the first free one is taken, else poll every 2 s until one frees up.
slot=1
while :; do
  f=$lock; [ "$slot" -gt 1 ] && f=$lock.$slot
  [ -e "$f" ] || (umask 0; : > "$f") 2>/dev/null
  if exec 9<"$f" && flock -n 9; then break; fi
  slot=$(( slot % slots + 1 )); [ "$slot" -eq 1 ] && sleep 2
done
waited=0
while :; do
  load=$(cut -d' ' -f1 /proc/loadavg | cut -d. -f1)
  [ "$load" -lt "$limit" ] && break
  [ "$waited" -ge "$max" ] && { echo "aphrody-heavy: load $load >= $limit after ${max}s, giving up" >&2; exit 75; }
  sleep 30; waited=$((waited + 30))
done
exec nice -n 19 ionice -c3 "$@"
