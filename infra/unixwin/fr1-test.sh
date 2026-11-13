#!/bin/sh
# Tests Rust ciblés de rubash sur fr1, l'usine (filtre obligatoire), au commit épinglé dans src.lock.json.
# prd (production) et fr2 (edge) ne compilent jamais. La suite complète tourne dans la CI du fork (aphrody-labs/rubash).
# aphrody-heavy : une tâche lourde à la fois, nice 19, ionice idle, attente de charge ; JOBS tâches (4), autant de
# threads de test, TMPDIR sous le dossier de travail (pas /tmp en tmpfs).
# Usage : JOBS=4 sh fr1-test.sh <commit rubash> <filtre cargo test>
# Sortie : journal dans $UNIXWIN_WORK/logs/rubash-test-<commit>.log ; dernière ligne « RESULT <code> ».
set -u
[ $# -eq 2 ] && [ -n "$2" ] || { echo "usage: fr1-test.sh <rubash> <filtre> (suite complète : CI du fork)" >&2; exit 2; }
RUB=$1
FILTER=$2
W=${UNIXWIN_WORK:-$HOME/unixwin}
JOBS=${JOBS:-4}
export PATH="$HOME/.cargo/bin:$PATH" CARGO_TARGET_DIR="$W/target-test" TMPDIR="$W/tmp"
mkdir -p "$W/logs" "$TMPDIR"
# Les tests ouvrent beaucoup de descripteurs : la limite par défaut (1024) donne EMFILE.
ulimit -n 65536 2>/dev/null || ulimit -n 4096 2>/dev/null || true
d="$W/rubash"
[ -d "$d/.git" ] || git clone -q --filter=blob:none --no-checkout https://github.com/aphrody-labs/rubash.git "$d"
git -C "$d" fetch -q --filter=blob:none origin "$RUB" 2>/dev/null || git -C "$d" fetch -q --filter=blob:none origin
git -C "$d" -c advice.detachedHead=false checkout -q --force "$RUB" || exit 1
log="$W/logs/rubash-test-$(git -C "$d" rev-parse --short=12 HEAD).log"
cd "$d" || exit 1
aphrody-heavy cargo test --locked -j "$JOBS" "$FILTER" -- --test-threads="$JOBS" >"$log" 2>&1
code=$?
grep -E '^test result:|^failures:|FAILED|panicked' "$log" | tail -40
echo "LOG $log"
echo "RESULT $code"
exit "$code"
