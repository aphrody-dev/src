#!/bin/sh
# Fast-forward the default branch of every aphrody-labs fork tracked for the Epic Games and Bevy
# surface (docs/epic/RESOURCES.md) with its upstream. Runs on fr1 under the existing gh login
# (fork-sync.timer, every 6 h); no token is stored by this script.
# Usage: fork-sync.sh [forks.txt]   (default: fetched from aphrody-labs/src main)
set -eu
list=${1:-}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
if [ -z "$list" ]; then
  gh api repos/aphrody-labs/src/contents/third_party/forks.txt --jq .content | base64 -d > "$tmp/forks.txt"
  list="$tmp/forks.txt"
fi
grep -E '^(EpicGames|bevyengine|trumank|FabianFG|UE4SS-RE|legendary-gl|3ddelano)/' "$list" | cut -d' ' -f1 | sort -u > "$tmp/up"
ok=0
fail=0
while read -r up; do
  if gh repo sync "aphrody-labs/${up#*/}" --source "$up" >/dev/null 2>"$tmp/log"; then
    ok=$((ok + 1))
  else
    fail=$((fail + 1))
    echo "fork-sync: $up: $(tail -1 "$tmp/log")" >&2
  fi
done < "$tmp/up"
echo "fork-sync: ok=$ok failed=$fail"
[ "$fail" -eq 0 ]
