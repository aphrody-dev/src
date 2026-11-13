#!/bin/sh
# Tests Rust ciblés de rubash sur prd (filtre obligatoire), au commit épinglé dans src.lock.json.
# La suite complète tourne dans la CI du fork (aphrody-labs/rubash, workflow « aphrody tests ») : jamais sur prd.
# Ménagement de prd : verrou partagé des tâches lourdes, nice 19, ionice idle, 2 tâches, 2 threads de test,
# TMPDIR sous le dossier de travail (pas /tmp en tmpfs).
# Usage : sh prd-test.sh <commit rubash> <filtre cargo test>
# Sortie : journal dans $UNIXWIN_WORK/logs/rubash-test-<commit>.log ; dernière ligne « RESULT <code> ».
set -u
[ $# -eq 2 ] && [ -n "$2" ] || { echo "usage: prd-test.sh <rubash> <filtre> (suite complète : CI du fork)" >&2; exit 2; }
RUB=$1
FILTER=$2
W=${UNIXWIN_WORK:-$HOME/unixwin}
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
flock /var/lock/aphrody-heavy.lock nice -n 19 ionice -c3 \
  cargo test --locked -j 2 "$FILTER" -- --test-threads=2 >"$log" 2>&1
code=$?
grep -E '^test result:|^failures:|FAILED|panicked' "$log" | tail -40
echo "LOG $log"
echo "RESULT $code"
exit "$code"
