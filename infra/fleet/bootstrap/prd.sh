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
has_version "$(lock_get cbindgen version)" cbindgen --version || RUSTC_WRAPPER= cargo install --locked cbindgen --version "$(lock_get cbindgen version)" --root /usr/local >/dev/null
has_version "$(lock_get cloudflared version)" cloudflared --version || install_archive_bin cloudflared cloudflared-linux-amd64 cloudflared

# Cloudflare CLIs through bun (global, pinned).
for t in wrangler cf; do
  has_version "$(lock_get $t version)" $t --version || bun add -g "$t@$(lock_get $t version)" >/dev/null 2>&1
done

docker_multiarch
agents_cli
log "prd versions:"
report rustc cargo clang ld.lld cmake ninja protoc bun uv python3 go zig dotnet just sccache cargo-zigbuild cargo-nextest cbindgen b3sum ffmpeg docker gh cloudflared wrangler
