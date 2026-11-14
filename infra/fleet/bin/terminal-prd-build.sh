#!/bin/sh
# Central terminal stack (docs/native/terminal/ARCHITECTURE.md): standalone Linux validation on prd of the
# third_party forks around intelligent-terminal. Nothing built here is consumed by the Windows build:
# WindowsTerminal.exe, wta.exe and installer/bootstrap build in the aphrody-labs/intelligent-terminal
# GitHub CI (`just terminal-ci`), because their C/Rust dependencies need the MSVC CRT and Windows SDK.
#   cpp  : C++ libraries of vcpkg.json compiled with clang/lld in C++23 (GSL is header-only: configured only)
#   rust : TUI/ACP crates of tools/wta/Cargo.toml (ratatui, crossterm, tui-markdown, agent-client-protocol)
#          and terminal-control (links libghostty-vt, needs Zig 0.15.2)
# Usage on prd: sh terminal-prd-build.sh [cpp|rust|all]
# Environment: JOBS (default 4), TERMINAL_WORK (default ~/terminal-stack), PINS ("name=sha ..." from
# src.lock.json, passed by `just terminal-prd`; a repository without a pin follows origin HEAD).
set -eu
step=${1:-all}
case $step in cpp | rust | all) ;; *) echo "usage: $0 [cpp|rust|all]" >&2; exit 2 ;; esac
work=${TERMINAL_WORK:-$HOME/terminal-stack}
jobs=${JOBS:-4}
pins=${PINS:-}
org=https://github.com/aphrody-labs

# Whole process tree: lowest CPU and I/O priority, at most $jobs CPUs (zig build ignores cargo's jobserver).
if [ -z "${TERMINAL_PRD_CONFINED:-}" ]; then
  TERMINAL_PRD_CONFINED=1
  export TERMINAL_PRD_CONFINED
  exec taskset -c "0-$((jobs - 1))" nice -n 19 ionice -c 3 sh "$0" "$@"
fi

PATH="$HOME/.cargo/bin:$PATH"
RUSTUP_TOOLCHAIN=stable
mkdir -p "$work"
cd "$work"
ZIG_GLOBAL_CACHE_DIR="$work/build/zig-cache"
export PATH RUSTUP_TOOLCHAIN ZIG_GLOBAL_CACHE_DIR
exec 9>"$work/.lock"
flock -n 9 || { echo "error: a build already runs in $work" >&2; exit 1; }

sync() {
  rev=HEAD
  for p in $pins; do [ "${p%%=*}" = "$1" ] && rev=${p#*=}; done
  if [ ! -d "$1/.git" ]; then
    rm -rf "$1"
    git init -q "$1"
    git -C "$1" remote add origin "$org/$1.git"
  fi
  git -C "$1" fetch -q --depth 1 --filter=blob:none origin "$rev"
  git -C "$1" reset -q --hard FETCH_HEAD
  git -C "$1" clean -fdxq
  printf '%s %s\n' "$1" "$(git -C "$1" rev-parse --short=12 HEAD)"
}

cpp() {
  # name|cmake options (tests off: upstream suites fetch googletest at configure time)
  for spec in \
    "fmt|-DFMT_TEST=OFF -DFMT_DOC=OFF" \
    "GSL|-DGSL_TEST=OFF" \
    "jsoncpp|-DJSONCPP_WITH_TESTS=OFF -DJSONCPP_WITH_POST_BUILD_UNITTEST=OFF" \
    "CLI11|-DCLI11_PRECOMPILED=ON -DCLI11_BUILD_TESTS=OFF -DCLI11_BUILD_EXAMPLES=OFF -DCLI11_BUILD_DOCS=OFF" \
    "cmark|-DBUILD_TESTING=OFF"; do
    name=${spec%%|*}
    sync "$name"
    # shellcheck disable=SC2086
    cmake --fresh -S "$name" -B "build/$name" -G Ninja -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ -DCMAKE_CXX_STANDARD=23 \
      -DCMAKE_LINKER_TYPE=LLD ${spec#*|} >/dev/null
    cmake --build "build/$name" -j "$jobs"
  done
}

setup_zig() {
  # libghostty-vt: build.zig.zon minimum_zig_version 0.15.2; checksum from ziglang.org/download/index.json.
  v=0.15.2
  sum=02aa270f183da276e5b5920b1dac44a63f1a49e55050ebde3aecc9eb82f93239
  if [ ! -x "zig-$v/zig" ]; then
    rm -rf "zig-$v.tmp" "zig-$v" zig.tar.xz
    curl -fsSLo zig.tar.xz "https://ziglang.org/download/$v/zig-x86_64-linux-$v.tar.xz"
    printf '%s  zig.tar.xz\n' "$sum" | sha256sum -c - >/dev/null
    mkdir "zig-$v.tmp"
    tar -xJf zig.tar.xz -C "zig-$v.tmp" --strip-components=1
    mv "zig-$v.tmp" "zig-$v"
    rm -f zig.tar.xz
  fi
  PATH="$work/zig-$v:$PATH"
}

rust() {
  # name|cargo selection; one target dir per workspace (no cross-workspace feature invalidation)
  for spec in "ratatui|-p ratatui" "crossterm|--lib" "tui-markdown|-p tui-markdown" \
    "acp-rust-sdk|-p agent-client-protocol" "terminal-control|"; do
    name=${spec%%|*}
    sync "$name"
    [ "$name" = terminal-control ] && setup_zig
    # shellcheck disable=SC2086
    cargo build --release -j "$jobs" --target-dir "build/cargo/$name" --manifest-path "$name/Cargo.toml" ${spec#*|}
  done
}

case $step in
  cpp) cpp ;;
  rust) rust ;;
  all) cpp; rust ;;
esac
