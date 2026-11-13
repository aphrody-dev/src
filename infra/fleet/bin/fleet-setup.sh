#!/bin/bash
# Idempotent per-host setup of the src fleet layer (run as root on the host; shipped by `just fleet-setup <host>`
# together with infra/fleet): canonical checkout /srv/src, sync timer, role extras (fr1: actionlint, runners,
# third_party). Dependencies come first from infra/fleet/bootstrap/<role>.sh (just fleet-bootstrap).
#   fleet-setup.sh <fr1|fr2|prd> [runners=4]      payload dir = $PAYLOAD (default /tmp/aphrody-setup)
set -euo pipefail
ROLE=${1:?role fr1|fr2|prd}; RUNNERS=${2:-4}; P=${PAYLOAD:-/tmp/aphrody-setup}; F=$P/infra/fleet
case $ROLE in prd) U=root ;; *) U=ubuntu ;; esac
log() { printf '[fleet-setup %s] %s\n' "$ROLE" "$*"; }
echo "$ROLE" > /etc/aphrody/role 2>/dev/null || { mkdir -p /etc/aphrody; echo "$ROLE" > /etc/aphrody/role; }

# 1. sync script, units, config (SRC_* lines replaced from the committed resilience.conf of the role)
install -m 0755 "$F/bin/src-checkout-update.sh" /usr/local/bin/src-checkout-update.sh
[ "$ROLE" != fr1 ] || install -m 0755 "$F/bin/third-party-sync.sh" /usr/local/bin/third-party-sync.sh
install -m 0755 "$F/bin/heavy.sh" /usr/local/bin/aphrody-heavy
install -m 0644 "$F/systemd/src-checkout-update.service" "$F/systemd/src-checkout-update.timer" /etc/systemd/system/
install -d /etc/systemd/system/src-checkout-update.service.d
printf '[Service]\nUser=%s\nEnvironment=HOME=%s\n' "$U" "$(getent passwd "$U" | cut -d: -f6)" > /etc/systemd/system/src-checkout-update.service.d/10-user.conf
touch /etc/fleet/resilience.conf 2>/dev/null || { mkdir -p /etc/fleet; touch /etc/fleet/resilience.conf; }
sed -i -E '/^(SRC_CHECKOUT|SRC_SPARSE|SRC_POST|SRC_RESTART)=/d' /etc/fleet/resilience.conf
grep -E '^(SRC_CHECKOUT|SRC_SPARSE|SRC_POST|SRC_RESTART)=' "$F/$ROLE/resilience.conf" >> /etc/fleet/resilience.conf

# 2. checkout: /srv/src owned by the service user; an existing sparse clone is widened in place (no re-clone, units
#    that run from it keep their path), a missing one is cloned by the sync script itself
mkdir -p /srv/src; chown "$U:$U" /srv /srv/src 2>/dev/null || chown "$U:$U" /srv/src
if [ -d /srv/src/.git ]; then
  chown -R "$U:$U" /srv/src
  g() { sudo -u "$U" git -c safe.directory=/srv/src -C /srv/src "$@"; }
  g sparse-checkout disable 2>/dev/null || true
  g remote set-url origin https://github.com/aphrody-labs/src.git
  g checkout -q main 2>/dev/null || true
fi
systemctl daemon-reload
sudo -u "$U" env HOME="$(getent passwd "$U" | cut -d: -f6)" SRC_STATE=/tmp/src-sync-status.json /usr/local/bin/src-checkout-update.sh ensure
systemctl enable --now src-checkout-update.timer >/dev/null
systemctl start --no-block src-checkout-update.service || true

# 3. fr1 extras
if [ "$ROLE" = fr1 ]; then
  if ! command -v actionlint >/dev/null; then
    v=$(curl -fsSL https://api.github.com/repos/rhysd/actionlint/releases/latest | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p' | head -1)
    t=$(mktemp -d); curl -fsSL "https://github.com/rhysd/actionlint/releases/download/v$v/actionlint_${v}_linux_amd64.tar.gz" | tar -xz -C "$t" actionlint
    install -m 0755 "$t/actionlint" /usr/local/bin/actionlint; rm -rf "$t"; log "actionlint $v"
  fi
  install -m 0755 "$F/bin/gh-runners.sh" /usr/local/bin/gh-runners.sh
  install -m 0644 "$F/systemd/third-party-sync.service" "$F/systemd/third-party-sync.timer" /etc/systemd/system/; systemctl daemon-reload; systemctl enable --now third-party-sync.timer >/dev/null
  if ! command -v jaq >/dev/null; then # jq-compatible filter used by ci.yml, game.yml and build-all.sh (upstream release asset)
    curl -fsSL -o /usr/local/bin/jaq https://github.com/01mf02/jaq/releases/latest/download/jaq-x86_64-unknown-linux-gnu && chmod 0755 /usr/local/bin/jaq && log "jaq $(jaq --version)"
  fi
fi
log "checkout: $(sudo -u "$U" git -c safe.directory=/srv/src -C /srv/src log -1 --format='%h %cs' 2>/dev/null) owner=$(stat -c %U /srv/src); timer: $(systemctl is-active src-checkout-update.timer)/$(systemctl is-enabled src-checkout-update.timer)"
