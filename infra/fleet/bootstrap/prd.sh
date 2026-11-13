#!/bin/sh
# prd (USA, Arch Linux, root): general builds + backends. Idempotent; never restarts running app containers.
#   LOCK=/root/src/packages/machine/toolchains.lock.toml sh infra/fleet/bootstrap/prd.sh
# Run from the PC: just fleet-bootstrap prd
LOCK=${LOCK:-$(cd "$(dirname "$0")/../../.." && pwd)/packages/machine/toolchains.lock.toml}
. "$(dirname "$0")/common.sh"

# System packages (pacman -S --needed: no -Syu, a full upgrade of prd is a separate, planned operation).
# rust comes from rustup; clang/lld/llvm stay the distro build (23.1.x, same major as rustc's LLVM).
pkgs="base-devel clang llvm lld cmake ninja protobuf python uv git git-lfs ffmpeg just sccache
  docker docker-buildx docker-compose nginx wireguard-tools rustup pkgconf nasm openssl zstd unzip"
missing=$(for p in $pkgs; do pacman -Qq "$p" >/dev/null 2>&1 || echo "$p"; done)
[ -z "$missing" ] || { log "pacman: $missing"; pacman -S --needed --noconfirm $missing >/dev/null; }
git lfs install --system --skip-repo >/dev/null

rust_pinned root
bun_pinned
dotnet_pinned
go_pinned
zig_pinned
has_version "$(lock_get cargo-zigbuild version)" cargo-zigbuild --version || install_archive_bin cargo-zigbuild cargo-zigbuild
has_version "$(lock_get cargo-nextest version)" cargo-nextest nextest --version || install_archive_bin cargo-nextest cargo-nextest
has_version "$(lock_get b3sum version)" b3sum --version || install_archive_bin b3sum b3sum_linux_x64_bin b3sum
has_version "$(lock_get cbindgen version)" cbindgen --version || RUSTC_WRAPPER= CARGO_BUILD_JOBS=2 nice -n 19 ionice -c3 cargo install --locked cbindgen --version "$(lock_get cbindgen version)" --root /usr/local >/dev/null
has_version "$(lock_get cloudflared version)" cloudflared --version || install_archive_bin cloudflared cloudflared-linux-amd64 cloudflared

# Cloudflare CLIs through bun (global, pinned).
for t in wrangler cf; do
  has_version "$(lock_get $t version)" $t --version || bun add -g "$t@$(lock_get $t version)" >/dev/null 2>&1
done

docker_multiarch
agents_cli
log "prd versions:"
report rustc cargo clang ld.lld cmake ninja protoc bun uv python3 go zig dotnet just sccache cargo-zigbuild cargo-nextest cbindgen b3sum ffmpeg docker gh cloudflared wrangler

# --- Backends only (owner decision 2026-11-13). Build workers, BuildKit, caches and toolchains go (fr1 owns them);
# llama-server inference (shenron-chat) stays. Skipped while a build runs.
# Rollback: git revert + just fleet-bootstrap fr1 (builds) ; prd services are untouched by this block.
role_mark prd
if ! pgrep -x cargo >/dev/null 2>&1 && ! pgrep -f 'buildx (bake|build)' >/dev/null 2>&1; then
  for u in nativelink-worker.service fleet-tunnel-nativelink.service; do
    systemctl cat "$u" >/dev/null 2>&1 || continue
    systemctl disable --now "$u" >/dev/null 2>&1 || true
    rm -rf "/etc/systemd/system/$u" "/etc/systemd/system/$u.d"; log "purged $u (REAPI workers on fr1)"
  done
  rm -rf /etc/nativelink /var/lib/private/nativelink /usr/local/bin/nativelink; systemctl daemon-reload
  docker ps -aq --filter name=buildx_buildkit | xargs -r docker rm -f >/dev/null
  docker ps -aq --filter status=paused --filter status=exited --filter status=created | xargs -r docker rm -f >/dev/null
  docker builder prune -af >/dev/null 2>&1 || true
  # Unused images older than 7 days (recent tags stay for rollbacks), dangling volumes.
  docker image prune -af --filter until=168h >/dev/null; docker volume prune -f >/dev/null
  # Toolchains and caches (bun stays: services run on it; uv/python stay for litellm).
  for d in /root/.rustup /root/.cargo /home/*/.rustup /home/*/.cargo/registry /root/.cache/zig /root/.cache/cargo-xwin \
    /root/.cache/ms-playwright /root/.cache/node-gyp /root/.cache/sccache /root/.bun/install/cache /srv/build /srv/bunlfs /opt/ghidra; do
    [ -e "$d" ] && rm -rf "$d" && log "purged $d"
  done
  for f in sccache cargo-zigbuild cargo-nextest cbindgen b3sum protoc; do [ -e "$BIN/$f" ] && rm -f "$BIN/$f"; done
  build_pkgs=$(for p in base-devel clang llvm lld cmake ninja protobuf nasm rustup sccache; do pacman -Qq "$p" 2>/dev/null; done)
  [ -z "$build_pkgs" ] || pacman -Rns --noconfirm $build_pkgs >/dev/null 2>&1 || pacman -Rn --noconfirm $build_pkgs >/dev/null 2>&1 || log "pacman: some build packages kept (required by a runtime package)"
  orphans=$(pacman -Qdtq 2>/dev/null || true); [ -z "$orphans" ] || pacman -Rns --noconfirm $orphans >/dev/null 2>&1 || true
  paccache -rk1 >/dev/null 2>&1 || rm -f /var/cache/pacman/pkg/*.pkg.tar.* 2>/dev/null || true
fi
agents_cli
resilience
sysctl_serve
