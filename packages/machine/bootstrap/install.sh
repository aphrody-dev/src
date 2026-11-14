#!/usr/bin/env sh
# Fresh-machine bootstrap: build `ay` once, then `ay up --bootstrap` applies tools.toml
# (tools, config files, links, clones from src.lock.json, ay doctor). docs/infra/INSTALL_UPDATE.md §4.
set -eu
SRC_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../../.." && pwd)"
export SRC_ROOT PATH="$HOME/.local/bin:$PATH"
command -v ay >/dev/null 2>&1 ||
  RUSTC_WRAPPER= cargo install --path "$SRC_ROOT/crates/ay" --root "$HOME/.local" --locked --no-track
ay up --bootstrap
