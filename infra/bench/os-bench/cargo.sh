#!/bin/sh
# Workload 2: cargo build --release, lto=thin, of src/archguard (vendored deps, offline), no sccache, no incremental.
case $1 in
prep) rm -rf /work/archguard; mkdir -p /work; cp -r /src-ro/archguard /work/archguard ;;
run) cd /work/archguard && CARGO_INCREMENTAL=0 RUSTC_WRAPPER= cargo build --release --offline --locked -j8 >/dev/null 2>&1 ;;
esac
