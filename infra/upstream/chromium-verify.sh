#!/bin/sh
# fr1 only: build and test the Chromium series (infra/upstream/chromium/patches) on the upstream tip, in a
# gclient checkout of its own (/srv/chromium/upstream), never in the factory checkout (/srv/chromium/src,
# pinned to a release). Skipped while the series is empty. Doc: docs/upstream/STRATEGY.md.
#   ssh vps 'sh ~/agents/src/infra/upstream/chromium-verify.sh'
# Subset: the test executables that depend on the files the series touches (`gn refs --testonly`),
# not the whole tree. Builds through the NativeLink REAPI pool (docs/native/CHROMIUM-FACTORY.md, F1).
set -eu
SRC=${AGENTS_SRC:-$HOME/agents/src}
SERIES=$SRC/infra/upstream/chromium/patches
ROOT=${CHROMIUM_UPSTREAM_ROOT:-/srv/chromium/upstream}
OUT=out/upstream
export PATH="$HOME/depot_tools:$PATH"

if ! grep -qv '^\s*\(#\|$\)' "$SERIES/.patches" 2>/dev/null; then
  echo "chromium-verify: série vide, rien à construire"
  exit 0
fi
exec 9>"$ROOT.lock"
flock -n 9 || { echo "chromium-verify: déjà en cours"; exit 0; }
run() { nice -n 19 ionice -c3 "$@"; }

if [ ! -d "$ROOT/src/.git" ]; then
  mkdir -p "$ROOT"
  (cd "$ROOT" && run fetch --nohooks --no-history chromium)
fi
cd "$ROOT/src"
run git fetch --quiet origin main
git checkout --quiet --detach origin/main
run gclient sync -D --nohooks --no-history -j 8
run gclient runhooks
# The series as commits on a detached HEAD (Electron's git-import-patches does the same with git am).
grep -v '^\s*\(#\|$\)' "$SERIES/.patches" | sed "s|^|$SERIES/|" | xargs git am --3way --keep-cr --quiet
gn gen "$OUT" --args='is_debug=false dcheck_always_on=true is_component_build=true symbol_level=0 use_remoteexec=true'
FILES=$(git diff --name-only origin/main HEAD | sed 's|^|//|')
TESTS=$(gn refs "$OUT" --testonly=true --type=executable --as=output --all $FILES | sort -u | head -n 8)
[ -n "$TESTS" ] || TESTS=base_unittests
echo "chromium-verify: cibles $TESTS"
run autoninja -C "$OUT" $(echo "$TESTS" | sed 's|^\./||')
for t in $TESTS; do
  run "$OUT/$t" --test-launcher-jobs=4 --test-launcher-summary-output="$OUT/$(basename "$t").json"
done
run git cl presubmit --force --upload origin/main
echo "chromium-verify: ok $(git rev-parse --short origin/main) + $(git rev-list --count origin/main..HEAD) patch(s)"
