#!/usr/bin/env sh
# Absorb Lore into the monorepo: vendor the synced fork, then move its crates to
# crates/, its docs/tools under lore-named dirs.
# The root Cargo.toml merge ([workspace.dependencies], lints, [patch.crates-io]) is manual.
# Usage: scripts/absorb-lore.sh
set -eu
root="$(cd "$(dirname "$0")/../.." && pwd)"
sh "$root/tools/labs-scripts/vendor.sh" aphrody-labs/lore lore main
src="$root/third_party/lore"
for d in "$src"/lore "$src"/lore-*; do
  n="$(basename "$d")"
  rm -rf "$root/crates/$n"; mv "$d" "$root/crates/$n"
done
cp "$src/build-helper.rs" "$root/src/build-helper.rs"
mkdir -p "$root/docs/lore" "$root/tools/lore" "$root/licenses/lore" "$root/.cargo"
rm -rf "$root/docs/lore" "$root/tools/lore" "$root/licenses/lore"; mkdir -p "$root/licenses/lore"
mv "$src/docs" "$root/docs/lore"
mkdir -p "$root/tools/lore"
for t in scripts contrib notices mkdocs.yml pyproject.toml pyrightconfig.json uv.lock about.toml .pre-commit-clippy.py .vale.ini .markdownlint-cli2.jsonc; do
  [ -e "$src/$t" ] && mv "$src/$t" "$root/tools/lore/"
done
cp "$src/LICENSE" "$root/licenses/lore/LICENSE"
for f in AGENTS.md CONTRIBUTING.md GOVERNANCE.md MAINTAINERS.md SECURITY.md README.md DCO CODE_OF_CONDUCT.md; do
  [ -e "$src/$f" ] && cp "$src/$f" "$root/licenses/lore/$f"
done
cp "$src/.cargo/config.toml" "$root/.cargo/config.toml"
cp "$src/.cargo/neoverse-512tvb.toml" "$root/.cargo/neoverse-512tvb.toml"
cp "$src/.rustfmt.toml" "$root/.rustfmt.toml"
cp "$src/clippy.toml" "$root/clippy.toml"
cp "$src/.loreignore" "$root/.loreignore"
cp "$src/Cargo.toml" "$root/third_party/lore.Cargo.toml.upstream"
lv="$(sed -n 's/^version = "\(.*\)"/\1/p' "$src/Cargo.toml" | head -1)"
for f in "$root"/src/lore*/Cargo.toml; do
  sed -i "s/^version.workspace = true/version = \"$lv\"/" "$f"
done
rm -rf "$src"
echo "absorbed lore $(grep '^lore ' "$root/third_party/vendor.lock" | cut -d' ' -f4)"
