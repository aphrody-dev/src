#!/bin/sh
# RAM tier + page-cache sysctl. Usage: HOST=fr1|fr2|usa CONFIRM=REINSTALL-<host> sh 60-hot-tier.sh
# Caps leave room for services (usa: 12G used by prod of 31G; fr1 build peak 19.8G; fr2 11G total).
. "$(dirname "$0")/lib.sh"; need_root; : "${HOST:?}"; need_confirm "$HOST"
case $HOST in
  fr1) HOT=12G; CHR=4G ;;   # hot caches 12G; Chrome profiles 4G (of 45G)
  fr2) HOT=3G;  CHR=0 ;;    # edge: nginx cache hot set 3G (of 11G)
  usa) HOT=2G;  CHR=0 ;;    # prod: minimal (of 31G, 12G used)
esac
mkdir -p /var/cache/hot
grep -q ' /var/cache/hot ' /etc/fstab || echo "tmpfs /var/cache/hot tmpfs size=$HOT,mode=1777,noswap,nosuid,nodev 0 0" >> /etc/fstab
[ "$CHR" = 0 ] || { mkdir -p /var/lib/chrome-profiles; echo "tmpfs /var/lib/chrome-profiles tmpfs size=$CHR,mode=0700,noswap 0 0" >> /etc/fstab; }
cat > /etc/sysctl.d/96-hot-tier.conf <<S
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=5
vm.dirty_ratio=20
vm.swappiness=100
S
mount -a && sysctl --system >/dev/null
# hot sets (sccache local layer, bun cache, turbo cache) live in /var/cache/hot; cold copies stay on XFS and are pulled at boot by fleet-cache-warm (see doc)
