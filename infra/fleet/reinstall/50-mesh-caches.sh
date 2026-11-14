#!/bin/sh
# Post-install of the shared services. Usage: HOST=fr1|fr2|usa CONFIRM=REINSTALL-<host> sh 50-mesh-caches.sh
# Restores /etc/wireguard (from usa backup/R2), cloudflared, then cache clients/servers.
. "$(dirname "$0")/lib.sh"; need_root; : "${HOST:?}"; need_confirm "$HOST"
HUB=10.200.77.1
cat > /etc/profile.d/fleet-cache.sh <<E
export SCCACHE_ENDPOINT=http://$HUB:9000 SCCACHE_BUCKET=sccache SCCACHE_REGION=auto SCCACHE_S3_USE_SSL=off SCCACHE_S3_KEY_PREFIX=cargo
export TURBO_API=http://$HUB:3030 TURBO_TEAM=aphrody
export BUN_INSTALL_CACHE_DIR=\${BUN_INSTALL_CACHE_DIR:-/var/cache/bun}
export NIX_CONFIG="extra-substituters = http://$HUB:5000
experimental-features = nix-command flakes"
E
mkdir -p /var/cache/bun
if [ "$HOST" = fr1 ]; then
  # hub: S3-compatible store for sccache (Garage or MinIO, to pick: see doc), turbo remote cache, nix-serve, nativelink (existing units)
  sh "$(dirname "$0")/../../chromium-factory/nativelink/deploy.sh" server
  sh "$(dirname "$0")/../../chromium-factory/nativelink/deploy.sh" worker 10.200.77.1 100000000000 10
fi
# Chrome: CDP on loopback only, exposed to the mesh through a socat/nginx stream bound to the wg address (never the public IP)
systemctl enable --now wg-quick@wg1 2>/dev/null || true
