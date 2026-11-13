#!/bin/sh
# Build one kernel flavor of infra/linux/kernels.toml from aphrody-labs/linux-cachyos + our series, in a
# CachyOS container. Started by `ay linux build <flavor> --run` (env below), on fr1 or in CI only.
#   FLAVOR=prd IMAGE=<ref@sha256> KNOBS="_processor_opt=zen4 ..." LLVM_DIR=<dir with bin/> HOST=fr1 sh kernel.sh
# fr1 is the Chromium/LLVM factory: the build is preemptible. It refuses to start while a Chromium or LLVM
# build runs (ninja, siso, reclient), and a watchdog stops the container as soon as one starts (exit 75).
set -eu
: "${FLAVOR:?}" "${IMAGE:?}" "${KNOBS:=}" "${LLVM_DIR:=}" "${HOST:=ci}"
WORK=${WORK:-/srv/build/kernel/$FLAVOR}
SRC=${SRC:-$HOME/agents/src}
NAME=aphrody-kernel-$FLAVOR
JOBS=${JOBS:-$(( $(nproc) / 2 > 0 ? $(nproc) / 2 : 1 ))}

# Knobs reach a shell inside the container: same rule as packages/linux/src/kernel.ts, checked again here.
for kv in $KNOBS; do
  case $kv in _*=*) ;; *) echo "kernel: bad knob $kv" >&2; exit 2 ;; esac
  case ${kv#*=} in *[!A-Za-z0-9_./:-]*) echo "kernel: bad knob value $kv" >&2; exit 2 ;; esac
done
[ -z "$LLVM_DIR" ] || [ -x "$LLVM_DIR/bin/clang" ] || { echo "kernel: no clang in $LLVM_DIR/bin" >&2; exit 2; }
if [ "$HOST" = prd ]; then echo "kernel: no heavy build on prd" >&2; exit 2; fi

busy() { [ "$HOST" = fr1 ] && pgrep -x 'ninja|autoninja|siso|reproxy|rewrapper' >/dev/null 2>&1; }
if busy; then echo "kernel: Chromium/LLVM build running on fr1, retry later" >&2; exit 75; fi

mkdir -p "$WORK/out"
cd "$WORK"
if [ -d linux-cachyos/.git ]; then
  git -C linux-cachyos fetch -q --depth 1 origin master && git -C linux-cachyos reset -q --hard FETCH_HEAD
else
  git clone -q --depth 1 https://github.com/aphrody-labs/linux-cachyos.git linux-cachyos
fi
# Our series, in .patches order, from the src checkout only (a pinned commit, never a mutable URL).
series=$SRC/infra/upstream/patches/linux-cachyos
[ -f "$series/.patches" ] || { echo "kernel: no series in $SRC (git -C $SRC pull)" >&2; exit 2; }
while read -r p; do [ -z "$p" ] || git -C linux-cachyos apply --check "$series/$p"; done < "$series/.patches"
while read -r p; do [ -z "$p" ] || git -C linux-cachyos apply --index "$series/$p"; done < "$series/.patches"

mount_llvm=""
if [ -n "$LLVM_DIR" ]; then
  mount_llvm="-v $LLVM_DIR:/opt/llvm:ro"
  KNOBS="$KNOBS _llvm_prefix=/opt/llvm/bin"
fi

# Lowest CPU and I/O weight, half the cores, bounded memory; nice 19 inside (dockerd parents the
# container, so the nice of the calling unit does not reach it). Chromium and LLVM keep the machine.
docker rm -f "$NAME" >/dev/null 2>&1 || true
trap 'docker rm -f "$NAME" >/dev/null 2>&1 || true' EXIT
trap 'exit 130' INT TERM
# shellcheck disable=SC2086
docker run -d --name "$NAME" --cpu-shares 2 --blkio-weight 10 --cpus "$JOBS" --memory "${MEMORY:-16g}" \
  --pids-limit 8192 $mount_llvm -v "$WORK:/w" -e KNOBS="$KNOBS" -e JOBS="$JOBS" "$IMAGE" sh -c '
  set -eu
  pacman -Syu --noconfirm --needed base-devel git >/dev/null
  id build >/dev/null 2>&1 || useradd -m build
  chown -R build /w
  cd /w/linux-cachyos/linux-cachyos
  env $KNOBS bash -c "source ./PKGBUILD && pacman -S --noconfirm --needed \"\${makedepends[@]}\"" >/dev/null
  # makepkg checks the .asc against validpgpkeys: a failed key fetch fails the build there.
  su build -c "cd /w/linux-cachyos/linux-cachyos && \
    (gpg --keyserver hkps://keys.openpgp.org --recv-keys E18447AC260021D31F3FF6C4C8A2A4774B8B63C4 E8B9AA39F054E30E8290D492C3C4820857F654FE || true) && \
    env $KNOBS PKGDEST=/w/out MAKEFLAGS=-j$JOBS nice -n 19 makepkg -f --noconfirm"
' >/dev/null

# Watchdog: stop the build when the factory needs fr1.
while [ "$(docker inspect -f '{{.State.Running}}' "$NAME" 2>/dev/null)" = true ]; do
  if busy; then
    docker stop -t 30 "$NAME" >/dev/null
    echo "kernel: preempted by a Chromium/LLVM build" >&2; exit 75
  fi
  sleep 20
done
code=$(docker inspect -f '{{.State.ExitCode}}' "$NAME")
docker logs --tail 40 "$NAME"
[ "$code" = 0 ] || { echo "kernel: build failed ($code)" >&2; exit 1; }
ls -l "$WORK/out"
# Boot proof (boot.sh): uname of the running kernel + APHRODY-BOOT-OK, KVM when available.
pkg=$(ls "$WORK"/out/linux-*.pkg.tar.zst | grep -v -e '-headers-' -e '-dbg-' -e '-nvidia' -e '-zfs-' | head -1)
sh "$SRC/infra/linux/build/boot.sh" "$pkg" "$WORK/out/boot.log"
