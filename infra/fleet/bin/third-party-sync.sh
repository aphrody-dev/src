#!/bin/bash
# third_party forks of /srv/src, pinned in src.lock.json (engine git). fr1 only (the factory); prd and fr2 carry no
# third_party. Shallow blobless clone of each fork at the pinned commit (falls back to the branch tip when the pin is not
# fetchable). Huge upstreams stay out of this checkout: Chromium lives in /srv/chromium (gclient, chromium-factory),
# the others are listed in SKIP and fetched on demand with `ay git`.
#   third-party-sync.sh [name ...]      default: every entry not in SKIP; JOBS=3 parallel clones, nice 19
# Output: /var/lib/src-sync/third-party.tsv (name, state, commit). Idempotent: present repos only get the pin checked.
set -uo pipefail
ROOT=${SRC_CHECKOUT:-/srv/src}; LOCK=$ROOT/src.lock.json; JOBS=${JOBS:-3}
SKIP='^(chromium/src|chromium|linux|llvm-project|llvm-test-suite|aosp-manifest|webkit|unreal.*|UnrealEngine)$'
OUT=${THIRD_PARTY_OUT:-$HOME/.cache/src-sync/third-party.tsv}; mkdir -p "$(dirname "$OUT")"
[ -f "$LOCK" ] || { echo "no $LOCK" >&2; exit 1; }
want=$(printf '%s\n' "$@")
list=$(python3 - "$LOCK" <<'PY'
import json, sys
for k, v in json.load(open(sys.argv[1]))["repositories"].items():
    if k.startswith("third_party/") and v.get("engine") == "git" and v.get("url"):
        print("\t".join([k[len("third_party/"):], v["url"], v.get("commit") or "", v.get("branch") or "main"]))
PY
)
one() { # name url commit branch
  local n=$1 url=$2 pin=$3 br=$4 d=$ROOT/third_party/$1
  export GIT_TERMINAL_PROMPT=0
  if [ ! -d "$d/.git" ]; then
    mkdir -p "$(dirname "$d")"
    git clone -q --depth 1 --filter=blob:none --branch "$br" "$url" "$d" 2>/dev/null \
      || git clone -q --depth 1 --filter=blob:none "$url" "$d" 2>/dev/null \
      || { printf '%s\tclone-failed\t\n' "$n"; return; }
  fi
  local head; head=$(git -C "$d" rev-parse HEAD 2>/dev/null)
  if [ -n "$pin" ] && [ "$head" != "$pin" ]; then
    if git -C "$d" fetch -q --depth 1 origin "$pin" 2>/dev/null && git -C "$d" checkout -q --detach "$pin" 2>/dev/null; then head=$pin; fi
  fi
  printf '%s\t%s\t%s\n' "$n" "$([ "$head" = "$pin" ] && echo pinned || echo tip)" "${head:0:12}"
}
export -f one; export ROOT
echo "$list" | while IFS=$'\t' read -r n url pin br; do
  [ -n "$n" ] || continue
  if [ -n "$want" ]; then printf '%s\n' "$want" | grep -qx "$n" || continue; else [[ $n =~ $SKIP ]] && continue; fi
  printf '%s\t%s\t%s\t%s\0' "$n" "$url" "$pin" "$br"
done | nice -n 19 xargs -0 -P "$JOBS" -I{} bash -c 'IFS=$'"'"'\t'"'"' read -r n u p b <<< "$1"; one "$n" "$u" "$p" "$b"' _ {} | tee "$OUT" | awk -F'\t' '{c[$2]++} END {for (k in c) printf "%s=%d ", k, c[k]; print ""}'
