#!/bin/sh
# Workload 1: clang ThinLTO build of zstd 1.5.7 (programs/zstd) with the distro clang + lld.
case $1 in
prep) rm -rf /work/zstd; mkdir -p /work; cp -r /src-ro/zstd /work/zstd ;;
run) cd /work/zstd/programs && make -j8 zstd CC=clang MOREFLAGS="-flto=thin -fuse-ld=lld" >/dev/null && test -x zstd ;;
esac
