#!/bin/bash
# Daily config/app-state backup of the fleet to R2 (r2:aphrody-archive/fleet/<host>/<date>.tar.zst).
# Runs on fr1 (holds the R2 remote and ssh keys to fr2/prd). prd is reached by its public IP (TCP),
# not the mesh (UDP from OVH to prd is intermittently filtered upstream).
# Move to fr2 once a bucket-scoped R2 token exists (the Cloudflare OAuth scope cannot mint one).
set -uo pipefail
R=${FLEET_R2:-r2:aphrody-archive/fleet}
d=$(date -u +%Y%m%dT%H%MZ)
rc=0
declare -A SRC=(
  [fr1]="local|/etc /srv/chromium/factory/factory.toml /home/ubuntu/.config/systemd/user"
  [fr2]="root@10.200.77.3|/etc /srv/www"
  [prd]="root@72.60.186.43|/etc /srv/commons-relay/state /srv/aphrody-gpu-depot/private /home/ubuntu/tools/agent-coordination/state"
)
for h in "${!SRC[@]}"; do
  IFS='|' read -r tgt paths <<<"${SRC[$h]}"
  cmd="tar --ignore-failed-read -cf - $paths 2>/dev/null | zstd -q -T2 -10"
  if [ "$tgt" = local ]; then out=$(sudo sh -c "$cmd" | rclone rcat "$R/$h/$d.tar.zst" 2>&1); s=$?
  else out=$(ssh -o BatchMode=yes -o ConnectTimeout=15 "$tgt" "nice -n 19 sh -c '$cmd'" | rclone rcat "$R/$h/$d.tar.zst" 2>&1); s=$?; fi
  sz=$(rclone size --json "$R/$h/$d.tar.zst" 2>/dev/null | sed -n 's/.*"bytes":\([0-9]*\).*/\1/p')
  if [ $s -ne 0 ] || [ "${sz:-0}" -lt 10000 ]; then echo "BACKUP $h FAIL rc=$s size=${sz:-0} $out"; rc=1; else echo "BACKUP $h OK $d size=$sz"; fi
  rclone delete --min-age 30d "$R/$h/" 2>/dev/null
done
exit $rc
