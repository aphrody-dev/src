#!/bin/sh
# fr2 (Ubuntu, user ubuntu + sudo): edge runtime ONLY (nginx vhosts/CDN, cloudflared, docker compose for
# self-hosted images pulled from GHCR). No compilers are added here; existing ones are left alone.
#   sh infra/fleet/bootstrap/fr2.sh        (just fleet-bootstrap fr2)
LOCK=${LOCK:-$(cd "$(dirname "$0")/../../.." && pwd)/tools.toml}
. "$(dirname "$0")/common.sh"

pkgs="docker.io docker-buildx docker-compose-v2 nginx wireguard-tools curl"
if command -v pacman >/dev/null 2>&1; then  # Arch/CachyOS (after reinstall): same set, Arch package names
  pkgs="docker docker-buildx docker-compose nginx wireguard-tools curl"
  missing=$(for p in $pkgs; do pacman -Qq "$p" >/dev/null 2>&1 || echo "$p"; done)
  [ -z "$missing" ] || { log "pacman: $missing"; $SUDO pacman -S --needed --noconfirm $missing >/dev/null; }
else
missing=$(for p in $pkgs; do dpkg-query -W -f='${Status}' "$p" 2>/dev/null | grep -q "ok installed" || echo "$p"; done)
[ -z "$missing" ] || { log "apt: $missing"; $SUDO apt-get install -y --no-install-recommends $missing >/dev/null; }
fi

# Docker must not flip the FORWARD policy to DROP (WireGuard mesh forwarding goes through this host).
if [ ! -f /etc/docker/daemon.json ]; then
  $SUDO mkdir -p /etc/docker
  printf '{\n  "ip-forward-no-drop": true,\n  "log-driver": "local",\n  "live-restore": true\n}\n' | $SUDO tee /etc/docker/daemon.json >/dev/null
fi
docker_runtime
$SUDO usermod -aG docker "$(id -un)" 2>/dev/null || true
has_version "$(lock_get cloudflared version)" cloudflared --version || install_archive_bin cloudflared cloudflared-linux-amd64 cloudflared
$SUDO nginx -t >/dev/null 2>&1 && log "nginx config ok"
log "fr2 versions:"
report docker nginx cloudflared
$SUDO docker compose version

# --- Edge only (owner decision 2026-11-13): nginx, cloudflared, ACME, cluster LB.
# Build workers (REAPI) run on fr1. Rollback: git revert + just fleet-bootstrap fr2 (unit files come back from git).
role_mark fr2
if systemctl cat nativelink-worker.service >/dev/null 2>&1; then
  $SUDO systemctl disable --now nativelink-worker.service >/dev/null 2>&1 || true
  $SUDO rm -rf /etc/systemd/system/nativelink-worker.service /etc/systemd/system/nativelink-worker.service.d /var/lib/private/nativelink /etc/nativelink
  $SUDO systemctl daemon-reload; log "purged nativelink-worker (REAPI workers live on fr1)"
fi
agents_cli
JOURNAL_MAX=1G resilience
sysctl_serve
