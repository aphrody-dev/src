#!/usr/bin/env sh
# Vendor a fork without git: sync fork with upstream via gh, download the tarball
# of the synced commit into third_party/<name>/, record the pin in third_party/vendor.lock.
# Usage: scripts/vendor.sh <fork owner/repo> <name> [branch]
set -eu
fork="$1"; name="$2"; branch="${3:-main}"
root="$(cd "$(dirname "$0")/../.." && pwd)"
gh repo sync "$fork" --branch "$branch" >/dev/null
sha="$(gh api "repos/$fork/commits/$branch" --jq .sha)"
upstream="$(gh api "repos/$fork" --jq .parent.full_name)"
dest="$root/third_party/$name"
tmp="$(mktemp -d)"
gh api "repos/$fork/tarball/$sha" > "$tmp/src.tgz"
rm -rf "$dest"; mkdir -p "$dest"
tar -xzf "$tmp/src.tgz" -C "$dest" --strip-components=1
rm -rf "$tmp"
lock="$root/third_party/vendor.lock"
touch "$lock"
grep -v "^$name " "$lock" > "$lock.new" || true
printf '%s %s %s %s %s\n' "$name" "$fork" "$upstream" "$sha" "$(date -u +%Y-%m-%d)" >> "$lock.new"
sort "$lock.new" > "$lock"; rm "$lock.new"
echo "$name $sha"
