#!/bin/sh
# fr1 (Ubuntu, user ubuntu + sudo): Chromium/LLVM builds ONLY. Lean on purpose: no .NET, no FFmpeg dev,
# no app runtimes. Docker stays installed (cuttlefish/LLVM tooling images) but no app container runs here.
#   sh infra/fleet/bootstrap/fr1.sh        (just fleet-bootstrap fr1)
LOCK=${LOCK:-$(cd "$(dirname "$0")/../../.." && pwd)/packages/machine/toolchains.lock.toml}
. "$(dirname "$0")/common.sh"

llvm_major=$(lock_get llvm version | cut -d. -f1)
pkgs="clang-$llvm_major lld-$llvm_major llvm-$llvm_major llvm-$llvm_major-dev libclang-$llvm_major-dev
  cmake ninja-build python3 python3-venv git git-lfs pkg-config curl xz-utils zstd unzip build-essential"
missing=$(for p in $pkgs; do dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q "ok installed" || echo "$p"; done)
[ -z "$missing" ] || { log "apt: $missing"; $SUDO apt-get install -y --no-install-recommends $missing >/dev/null; }
# clang/lld on PATH = the LLVM major rustc uses (cross-language LTO with Chromium's toolchain).
for t in clang clang++ ld.lld llvm-ar llvm-nm llvm-objcopy; do $SUDO ln -sf "/usr/bin/$t-$llvm_major" "$BIN/$t"; done

command -v rustup >/dev/null 2>&1 || [ -x "$HOME/.cargo/bin/rustup" ] || { tmp=$(mktemp); fetch rustup "$tmp"; chmod +x "$tmp"; "$tmp" -y --no-modify-path --default-toolchain none >/dev/null; rm -f "$tmp"; }
export PATH="$HOME/.cargo/bin:$PATH"
rust_pinned "$(id -un)"
has_version "$(lock_get sccache version)" sccache --version || install_archive_bin sccache sccache
has_version "$(lock_get just version)" just --version || install_archive_bin just just
bun_pinned
agents_cli
log "fr1 versions:"
report rustc clang ld.lld cmake ninja python3 git-lfs sccache just bun

# --- Factory (owner decision 2026-11-13): heavy jobs, CI runner of aphrody-labs/src, REAPI. ---
role_mark fr1
for u in /etc/systemd/system/actions.runner.*.service; do
  [ -f "$u" ] && $SUDO systemctl enable --now "$(basename "$u")" >/dev/null 2>&1 && log "CI runner $(basename "$u") enabled"
done
resilience
