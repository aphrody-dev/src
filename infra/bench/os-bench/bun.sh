#!/bin/sh
# Workload 3: bun install (warm cache, frozen lockfile) + bun build --compile of packages/bunify. Same bun binary (1.4.4) on every distro (musl build on Alpine).
export PATH=/bunbin:$PATH BUN_INSTALL_CACHE_DIR=/work/.bun-cache
case $1 in
prep) rm -rf /work/bunify; mkdir -p /work; cp -r /src-ro/bunify /work/bunify ;;
warm) $0 prep && cd /work/bunify && bun install --frozen-lockfile >/dev/null ;;
run) cd /work/bunify && bun install --frozen-lockfile >/dev/null 2>&1 && bun build --compile --outfile out/bunify src/cli.ts >/dev/null ;;
once) rm -rf /work/bunify; mkdir -p /work; cp -r /src-ro/bunify /work/bunify; $0 run ;;
esac
