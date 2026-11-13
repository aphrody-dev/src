#!/bin/sh
# Partial mirror of the Android GKI and ChromiumOS kernel trees on fr1 (never on the PC, never a full
# AOSP or ChromiumOS checkout). Blobless bare clones of the branches we follow only, refreshed by fetch.
#   ssh vps 'sh ~/agents/src/infra/linux/android/mirror.sh'      (or MIRROR=/srv/build/mirror sh mirror.sh)
# Guard: stops when less than MIN_FREE_GB stays free on the mirror filesystem (Chromium factory first).
set -eu
MIRROR=${MIRROR:-/srv/build/mirror}
MIN_FREE_GB=${MIN_FREE_GB:-60}
mkdir -p "$MIRROR"
free_gb() { df -Pk "$MIRROR" | awk 'NR==2 {print int($4/1048576)}'; }
run() { nice -n 19 ionice -c3 "$@"; }

# name|url|branches (space separated)
REPOS="android/platform/manifest|https://android.googlesource.com/platform/manifest|main android-latest-release
android/kernel/manifest|https://android.googlesource.com/kernel/manifest|common-android-mainline common-android17-6.18 common-android18-7.3
android/kernel/build|https://android.googlesource.com/kernel/build|main-kernel
android/kernel/common|https://android.googlesource.com/kernel/common|android-mainline android17-6.18 android18-7.3
chromiumos/manifest|https://chromium.googlesource.com/chromiumos/manifest|main stable
chromiumos/third_party/kernel|https://chromium.googlesource.com/chromiumos/third_party/kernel|chromeos-6.12"

echo "$REPOS" | while IFS='|' read -r name url branches; do
  [ "$(free_gb)" -ge "$MIN_FREE_GB" ] || { echo "mirror: $(free_gb) GB free < $MIN_FREE_GB, stop before $name" >&2; exit 4; }
  dir="$MIRROR/$name.git"
  if [ ! -d "$dir" ]; then
    run git init -q --bare "$dir"
    git -C "$dir" remote add origin "$url"
    git -C "$dir" config remote.origin.promisor true
    git -C "$dir" config remote.origin.partialclonefilter blob:none
  fi
  refs=""
  for b in $branches; do refs="$refs +refs/heads/$b:refs/heads/$b"; done
  # shellcheck disable=SC2086
  run git -C "$dir" fetch --quiet --filter=blob:none --no-tags origin $refs
  echo "mirror: $name $(du -sh "$dir" | cut -f1) $(git -C "$dir" for-each-ref --format='%(refname:short)=%(objectname:short)' refs/heads | tr '\n' ' ')"
done
echo "mirror: ok, $(free_gb) GB free on $MIRROR"
