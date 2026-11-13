#!/bin/sh
# Construit niu (niubash + moteur rubash) sur prd depuis les forks aphrody-labs, aux commits de src.lock.json.
# Cible Windows : cargo xwin (CRT MSVC et SDK Windows en cache dans ~/.cache/cargo-xwin, lld-link) ; cible Linux :
# cargo build. Priorité minimale (nice -n 19), JOBS tâches (4 par défaut). Lancé par scripts/unixwin/unixwin.ts build.
# Usage : JOBS=4 sh prd-build.sh <triple> <commit niubash> <commit rubash>
# Sortie : une ligne « ARTIFACT <chemin> <sha256> » ; le binaire et SHA256SUMS dans $UNIXWIN_WORK/out/<triple>/.
set -eu
[ $# -eq 3 ] || { echo "usage: prd-build.sh <triple> <niubash> <rubash>" >&2; exit 2; }
TARGET=$1 NIU=$2 RUB=$3
JOBS=${JOBS:-4}
W=${UNIXWIN_WORK:-$HOME/unixwin}
export PATH="$HOME/.cargo/bin:$PATH" CARGO_TARGET_DIR="$W/target"
mkdir -p "$W"

# Clone partiel, puis exactement le commit demandé ; niubash et rubash côte à côte : le [patch] de niubash
# (rubash = { path = "../rubash" }) prend ce rubash-là.
pin() {
  d="$W/$1"
  [ -d "$d/.git" ] || git clone -q --filter=blob:none --no-checkout "https://github.com/aphrody-labs/$1.git" "$d"
  git -C "$d" fetch -q --filter=blob:none origin "$2" 2>/dev/null || git -C "$d" fetch -q --filter=blob:none origin
  git -C "$d" -c advice.detachedHead=false checkout -q --force "$2"
  [ "$(git -C "$d" rev-parse HEAD)" = "$(git -C "$d" rev-parse "$2^{commit}")" ]
  [ -z "$(git -C "$d" status --porcelain --untracked-files=no)" ]
}
pin rubash "$RUB"
pin niubash "$NIU"

case $TARGET in
  *-windows-msvc) build="xwin build" exe=niu.exe ;;
  *) build="build" exe=niu ;;
esac
cd "$W/niubash"
# shellcheck disable=SC2086
nice -n 19 cargo $build --release --locked -j "$JOBS" --target "$TARGET" --bin niu

out="$W/out/$TARGET"
mkdir -p "$out"
cp "$CARGO_TARGET_DIR/$TARGET/release/$exe" "$out/$exe"
printf 'niubash %s\nrubash %s\n' "$NIU" "$RUB" > "$out/SOURCES"
(cd "$out" && sha256sum "$exe" > SHA256SUMS)
echo "ARTIFACT $out/$exe $(cut -d' ' -f1 "$out/SHA256SUMS")"
