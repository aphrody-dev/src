#!/bin/bash
# Usage on fr1 (clones in /srv/build/craft): bash scripts/craft-web-build.sh photocraft filmcraft ... ; needs trunk 0.21.14 (the version the Craft Dockerfiles pin: trunk 0.22 names the wasm and js with different hashes and package.sh fails).
# Builds the upstream web package of each Craft app (packaging/web/package.sh: trunk, wasm32, wasm-opt) on fr1.
export PATH=$HOME/.cargo/bin:$PATH RUSTUP_TOOLCHAIN=stable RUSTC_WRAPPER= CARGO_BUILD_JOBS=6 CARGO_PROFILE_WASM_RELEASE_LTO=thin
OUT=/srv/build/craft/web-out; mkdir -p $OUT
rustup target add wasm32-unknown-unknown >/dev/null 2>&1
for r in "$@"; do
  s=$(date +%s); d=/srv/build/craft/$r
  echo "=== $r start $(date +%T)" >> $OUT/status.log
  ( cd $d && export CARGO_TARGET_DIR=/srv/build/craft/target-wasm-$r DIST=$OUT/$r-dist && nice -n 10 timeout 10800 bash packaging/web/package.sh ) > $OUT/$r.log 2>&1
  rc=$?
  echo "=== $r rc=$rc secs=$(( $(date +%s)-s )) $(ls $OUT/$r-dist 2>/dev/null | tr '\n' ' ')" >> $OUT/status.log
  rm -rf /srv/build/craft/target-wasm-$r
done
echo "=== done" >> $OUT/status.log
