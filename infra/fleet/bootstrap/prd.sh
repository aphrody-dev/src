#!/bin/sh
# prd (USA, Arch Linux, root): production backends ONLY (owner decision 2026-11-13). No compiler is installed
# here: images are built in CI (images.yml) or on fr1 (`just docker-smoke`) and pulled from ghcr.io/aphrody-labs.
# Idempotent; never restarts running app containers.
#   LOCK=/root/src/packages/machine/toolchains.lock.toml sh infra/fleet/bootstrap/prd.sh
# Run from the PC: just fleet-bootstrap prd
LOCK=${LOCK:-$(cd "$(dirname "$0")/../../.." && pwd)/packages/machine/toolchains.lock.toml}
. "$(dirname "$0")/common.sh"

# Runtime packages only (pacman -S --needed: no -Syu, a full upgrade of prd is a separate, planned operation).
pkgs="docker docker-compose docker-buildx nginx wireguard-tools git git-lfs curl openssl zstd"
missing=$(for p in $pkgs; do pacman -Qq "$p" >/dev/null 2>&1 || echo "$p"; done)
[ -z "$missing" ] || { log "pacman: $missing"; pacman -S --needed --noconfirm $missing >/dev/null; }

bun_pinned
has_version "$(lock_get cloudflared version)" cloudflared --version || install_archive_bin cloudflared cloudflared-linux-amd64 cloudflared
docker_runtime

log "prd versions:"
report bun docker nginx cloudflared git
docker compose version

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
    /root/.cache/ms-playwright /root/.cache/node-gyp /root/.cache/sccache /root/.bun/install/cache /srv/build /srv/bunlfs /opt/ghidra \
    /usr/local/go /opt/dotnet /opt/zig-* /etc/profile.d/dotnet.sh; do
    [ -e "$d" ] && rm -rf "$d" && log "purged $d"
  done
  for f in sccache cargo-zigbuild cargo-nextest cbindgen b3sum protoc go gofmt zig dotnet; do if [ -e "$BIN/$f" ] || [ -L "$BIN/$f" ]; then rm -f "$BIN/$f"; fi; done
  build_pkgs=$(for p in base-devel clang llvm lld cmake ninja protobuf nasm rustup sccache; do pacman -Qq "$p" 2>/dev/null; done)
  [ -z "$build_pkgs" ] || pacman -Rns --noconfirm $build_pkgs >/dev/null 2>&1 || pacman -Rn --noconfirm $build_pkgs >/dev/null 2>&1 || log "pacman: some build packages kept (required by a runtime package)"
  orphans=$(pacman -Qdtq 2>/dev/null || true); [ -z "$orphans" ] || pacman -Rns --noconfirm $orphans >/dev/null 2>&1 || true
  paccache -rk1 >/dev/null 2>&1 || rm -f /var/cache/pacman/pkg/*.pkg.tar.* 2>/dev/null || true
fi
agents_cli
resilience
sysctl_serve
