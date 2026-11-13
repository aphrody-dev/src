#!/bin/sh
# Tests Rust propres de rubash (cargo test) sur prd, au commit épinglé dans src.lock.json, priorité minimale.
# Usage : JOBS=4 sh prd-test.sh <commit rubash> [filtre cargo test]
# Sortie : journal complet dans $UNIXWIN_WORK/logs/rubash-test-<commit>.log ; dernière ligne « RESULT <code> ».
set -u
[ $# -ge 1 ] || { echo "usage: prd-test.sh <rubash> [filtre]" >&2; exit 2; }
RUB=$1
FILTER=${2-}
JOBS=${JOBS:-4}
W=${UNIXWIN_WORK:-$HOME/unixwin}
export PATH="$HOME/.cargo/bin:$PATH" CARGO_TARGET_DIR="$W/target-test"
mkdir -p "$W/logs"
d="$W/rubash"
[ -d "$d/.git" ] || git clone -q --filter=blob:none --no-checkout https://github.com/aphrody-labs/rubash.git "$d"
git -C "$d" fetch -q --filter=blob:none origin "$RUB" 2>/dev/null || git -C "$d" fetch -q --filter=blob:none origin
git -C "$d" -c advice.detachedHead=false checkout -q --force "$RUB" || exit 1
log="$W/logs/rubash-test-$(git -C "$d" rev-parse --short=12 HEAD).log"
cd "$d" || exit 1
# shellcheck disable=SC2086
nice -n 19 cargo test --locked -j "$JOBS" $FILTER -- --test-threads "$JOBS" >"$log" 2>&1
code=$?
grep -E '^test result:|^failures:|FAILED|panicked' "$log" | tail -40
echo "LOG $log"
echo "RESULT $code"
exit "$code"
