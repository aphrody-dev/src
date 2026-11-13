#!/bin/sh
# fr1 (Ubuntu, user ubuntu + sudo): the factory (owner decision 2026-11-13): Chromium/LLVM, image builds
# (docker buildx bake, `just docker-smoke`), CI runner, training, heavy agents. prd and fr2 never compile.
# Chromium/LLVM keep priority: BuildKit is capped (BUILDKIT_CPUS/BUILDKIT_MEM) and heavy jobs go through aphrody-heavy.
#   sh infra/fleet/bootstrap/fr1.sh        (just fleet-bootstrap fr1)
LOCK=${LOCK:-$(cd "$(dirname "$0")/../../.." && pwd)/tools.toml}
. "$(dirname "$0")/common.sh"

llvm_major=$(lock_get llvm version | cut -d. -f1)
pkgs="clang-$llvm_major lld-$llvm_major llvm-$llvm_major llvm-$llvm_major-dev libclang-$llvm_major-dev
  cmake ninja-build python3 python3-venv git git-lfs pkg-config curl xz-utils zstd unzip build-essential
  docker.io docker-buildx docker-compose-v2"
missing=$(for p in $pkgs; do dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q "ok installed" || echo "$p"; done)
[ -z "$missing" ] || { log "apt: $missing"; $SUDO apt-get install -y --no-install-recommends $missing >/dev/null; }
# clang/lld on PATH = the LLVM major rustc uses (cross-language LTO with Chromium's toolchain).
for t in clang clang++ ld.lld llvm-ar llvm-nm llvm-objcopy; do $SUDO ln -sf "/usr/bin/$t-$llvm_major" "$BIN/$t"; done

command -v rustup >/dev/null 2>&1 || [ -x "$HOME/.cargo/bin/rustup" ] || { tmp=$(mktemp); fetch rustup "$tmp"; chmod +x "$tmp"; "$tmp" -y --no-modify-path --default-toolchain none >/dev/null; rm -f "$tmp"; }
export PATH="$HOME/.cargo/bin:$HOME/.bun/bin:$PATH"
rust_pinned "$(id -un)"
has_version "$(lock_get sccache version)" sccache --version || install_archive_bin sccache sccache
has_version "$(lock_get just version)" just --version || install_archive_bin just just
has_version "$(lock_get cargo-zigbuild version)" cargo-zigbuild --version || install_archive_bin cargo-zigbuild cargo-zigbuild
has_version "$(lock_get cargo-nextest version)" cargo-nextest nextest --version || install_archive_bin cargo-nextest cargo-nextest
has_version "$(lock_get b3sum version)" b3sum --version || install_archive_bin b3sum b3sum_linux_x64_bin b3sum
has_version "$(lock_get protoc version)" protoc --version || install_archive_bin protoc protoc
has_version "$(lock_get cbindgen version)" cbindgen --version || RUSTC_WRAPPER= CARGO_BUILD_JOBS=2 nice -n 19 ionice -c3 cargo install --locked cbindgen --version "$(lock_get cbindgen version)" >/dev/null
bun_pinned
go_pinned
zig_pinned
dotnet_pinned
# Cloudflare CLIs through bun (global, pinned): Worker deploys run here (CI runner) or on the PC, never on prd.
for t in wrangler cf; do
  has_version "$(lock_get $t version)" $t --version || bun add -g "$t@$(lock_get $t version)" >/dev/null 2>&1 || log "bun add -g $t failed"
done

$SUDO usermod -aG docker "$(id -un)" 2>/dev/null || true
BUILDKIT_CPUS=${BUILDKIT_CPUS:-4} BUILDKIT_MEM=${BUILDKIT_MEM:-12g} docker_multiarch
agents_cli
log "fr1 versions:"
report rustc clang ld.lld cmake ninja python3 git-lfs sccache just bun go zig dotnet cargo-zigbuild cargo-nextest protoc b3sum docker

# --- Factory (owner decision 2026-11-13): heavy jobs, CI runner of aphrody-labs/src, REAPI. ---
role_mark fr1
for u in /etc/systemd/system/actions.runner.*.service; do
  [ -f "$u" ] && $SUDO systemctl enable --now "$(basename "$u")" >/dev/null 2>&1 && log "CI runner $(basename "$u") enabled"
done
resilience
