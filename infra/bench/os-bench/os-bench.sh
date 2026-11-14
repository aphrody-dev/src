#!/bin/sh
# OS userland benchmark on fr1: one container per distro on the same host kernel, pinned to CPUs 0-7, wrk on CPUs 8-11.
# Usage: os-bench.sh [distro...]   (default: all). Layout: ~/osbench/{src,bin,w,results}. Run via aphrody-heavy.
set -u
B=$HOME/osbench; R=${OSB_RESULTS:-$B/results}; mkdir -p "$R"
DISTROS=${*:-"cachyos cachyos-v3 cachyos-v4 arch fedora ubuntu alpine azurelinux"}
APT="DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq --no-install-recommends ca-certificates clang lld llvm rustc cargo gcc libc6-dev make nginx"
PAC="pacman -Syu --noconfirm --needed clang lld llvm rust gcc make nginx"
for d in $DISTROS; do
  bunsub=bun/bun-linux-x64
  case $d in
    cachyos) base=cachyos/cachyos; run=$PAC ;;
    cachyos-v3) base=cachyos/cachyos-v3; run=$PAC ;;
    cachyos-v4) base=cachyos/cachyos-v4; run=$PAC ;;
    arch) base=archlinux:latest; run=$PAC ;;
    fedora) base=fedora:45; run="dnf -y -q install --setopt=install_weak_deps=False clang lld llvm rust cargo gcc make nginx findutils" ;;
    ubuntu) base=ubuntu:26.10; run=$APT ;;
    azurelinux) base=aphrody/azurelinux:4; run="dnf -y -q install --setopt=install_weak_deps=False clang lld llvm rust cargo gcc make nginx findutils" ;;
    alpine) base=alpine:edge; run="apk add --no-cache clang lld llvm rust cargo gcc musl-dev make nginx libgcc libstdc++ bash"; bunsub=bun-musl/bun-linux-x64-musl ;;
  esac
  echo "=== $d ($base) $(date -u +%FT%TZ) load $(cut -d' ' -f1-3 /proc/loadavg)"
  docker rm -f osb >/dev/null 2>&1
  if ! printf 'FROM %s\nRUN %s\n' "$base" "$run" | docker build -q -t osb-$d - >"$R/$d.build.log" 2>&1; then echo "SKIP $d: image build failed"; echo "image build failed" >"$R/$d.skip"; continue; fi
  docker run -d --name osb --cpuset-cpus 0-7 --network host -v $B/src:/src-ro:ro -v $B/w:/w:ro -v $B/bin/$bunsub:/bunbin:ro osb-$d sleep infinity >/dev/null
  if ! docker exec osb sh -c 'clang --version && rustc --version' >/dev/null 2>&1; then echo "SKIP $d: toolchain does not run on this CPU"; echo "toolchain does not run on this host CPU" >"$R/$d.skip"; docker rm -f osb >/dev/null; continue; fi
  docker exec osb sh -c '. /etc/os-release; echo "os: $PRETTY_NAME"; echo "clang: $(clang --version | head -1)"; echo "lld: $(ld.lld --version)"; echo "rustc: $(rustc --version)"; echo "cargo: $(cargo --version)"; echo "gcc: $(gcc --version | head -1)"; echo "make: $(make --version | head -1)"; echo "nginx: $(nginx -v 2>&1)"; echo "libc: $( (ldd --version 2>&1 || true) | head -1)"; echo "bun: $(/bunbin/bun --version)"; echo "kernel: $(uname -r)"' >"$R/$d.versions" 2>&1
  docker exec osb /w/bun.sh warm >>"$R/$d.build.log" 2>&1
  for w in zstd cargo bun; do
    hyperfine --warmup 1 --runs 5 --style basic --command-name "$d/$w" \
      --prepare "docker exec osb /w/$w.sh prep" --export-markdown "$R/$d.$w.md" --export-json "$R/$d.$w.json" \
      "docker exec osb /w/$w.sh run" >"$R/$d.$w.log" 2>&1 || echo "FAIL $d $w"
  done
  docker exec osb sh -c 'cd /work/zstd/programs && ./zstd --version; ls -l /work/archguard/target/release/libarchguard.rlib /work/bunify/out/bunify | cut -c1-80' >"$R/$d.artifacts" 2>&1
  # ay time (p50/p90/p99) on the bun workload, cleanup inline
  ay time -n 10 --json -- docker exec osb /w/bun.sh once >"$R/$d.aytime.json" 2>&1
  # serving: nginx on CPUs 0-7 (4 workers), wrk from the host on CPUs 8-11, 16 KiB static file
  docker exec osb sh -c 'mkdir -p /work/www && head -c 16384 /dev/urandom >/work/www/a.bin'
  docker exec -d osb nginx -c /w/nginx.conf
  sleep 2
  : >"$R/$d.wrk"
  for i in 0 1 2 3 4 5; do
    taskset -c 8-11 wrk -t4 -c128 -d10s --latency http://127.0.0.1:18080/a.bin >"$R/$d.wrk.$i" 2>&1
    [ $i -gt 0 ] && echo "$(awk '/Requests\/sec/{print $2}' "$R/$d.wrk.$i") $(awk '/ 99%/{print $2}' "$R/$d.wrk.$i")" >>"$R/$d.wrk"
  done
  docker exec osb nginx -c /w/nginx.conf -s stop >/dev/null 2>&1
  docker rm -f osb >/dev/null; docker image rm osb-$d >/dev/null 2>&1
  echo "done $d $(date -u +%FT%TZ)"
done
