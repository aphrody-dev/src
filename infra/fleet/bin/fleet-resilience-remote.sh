#!/bin/bash
# PC driver of `just fleet-resilience` and `just fleet-restore-test`.
#   fleet-resilience-remote.sh apply|check [fr1|fr2|prd|pc ...]   (default: pc fr2 prd fr1)
#   fleet-resilience-remote.sh restore-test <host>                  decrypt latest R2 backup on the host
# apply pushes infra/fleet/{bin,systemd,<host>/resilience.conf,backup-age.pub} and the agent runner units
# (infra/agents/systemd, re-rendered with the host's @SRC@/@BUN@), then runs fleet-resilience.sh apply on the host.
set -uo pipefail
root=$(cd "$(dirname "$0")/../../.." && pwd)
F=$root/infra/fleet
mode=${1:?apply|check|restore-test}; shift
hosts=${*:-pc fr2 prd fr1}
alias_of() { case $1 in fr1) echo vps;; fr2) echo cdn;; prd) echo prd;; *) return 1;; esac; }
rc=0

push() { # $1 host
  local a; a=$(alias_of "$1")
  tar -cf - -C "$F" bin/fleet-resilience.sh bin/fleet-health.sh bin/fleet-backup.sh bin/fleet-wg-failover.sh bin/src-checkout-update.sh bin/fleet-notify.sh bin/fleet-dns-failover.sh \
      systemd/src-checkout-update.service systemd/src-checkout-update.timer systemd/fleet-notify.service systemd/fleet-notify.timer systemd/fleet-health.service systemd/fleet-health.timer systemd/fleet-backup.service systemd/fleet-backup.timer \
      "$1/resilience.conf" backup-age.pub $([ "$1" = prd ] && echo prd/systemd/aphrody-relay.service prd/systemd/aphrody-relay.service.d) -C "$root/infra/agents" systemd \
    | timeout 120 ssh "$a" 'rm -rf /tmp/fleet-resilience-push && mkdir -p /tmp/fleet-resilience-push && tar -xf - -C /tmp/fleet-resilience-push' || return 1
  timeout 120 ssh "$a" "S=; [ \"\$(id -u)\" = 0 ] || S='sudo -n'; \$S sh -s /tmp/fleet-resilience-push $1" <<'EOS'
set -e; d=$1; h=$2
install -m 0755 "$d"/bin/fleet-resilience.sh "$d"/bin/fleet-health.sh "$d"/bin/fleet-backup.sh "$d"/bin/fleet-wg-failover.sh "$d"/bin/src-checkout-update.sh "$d"/bin/fleet-notify.sh "$d"/bin/fleet-dns-failover.sh /usr/local/bin/
install -m 0644 "$d"/systemd/fleet-health.* "$d"/systemd/fleet-backup.* "$d"/systemd/src-checkout-update.* "$d"/systemd/fleet-notify.* /etc/systemd/system/
# prd: ai-os relay (root user unit) from the read-only checkout /srv/src.
if [ -f "$d/prd/systemd/aphrody-relay.service" ]; then
  . "$d/$h/resilience.conf"; [ -n "${SRC_CHECKOUT:-}" ] && SRC_CHECKOUT=$SRC_CHECKOUT SRC_SPARSE="$SRC_SPARSE" "$d"/bin/src-checkout-update.sh ensure 2>/dev/null || true
  rd=/root/.config/systemd/user; ch=0
  for f in aphrody-relay.service aphrody-relay.service.d/10-litellm.conf; do cmp -s "$d/prd/systemd/$f" "$rd/$f" || { install -D -m 0644 "$d/prd/systemd/$f" "$rd/$f"; ch=1; }; done
  [ $ch = 1 ] && [ -f "${SRC_CHECKOUT:-/srv/src}/packages/ai-os/src/relay/cli.ts" ] && systemctl --user -M root@ daemon-reload && systemctl --user -M root@ restart aphrody-relay.service && echo "relay switched to ${SRC_CHECKOUT:-/srv/src}"
fi
install -d -m 0755 /etc/fleet
install -m 0644 "$d/$h/resilience.conf" /etc/fleet/resilience.conf
install -m 0644 "$d"/backup-age.pub /etc/fleet/backup-age.pub
systemctl daemon-reload
systemctl enable --now fleet-health.timer fleet-backup.timer >/dev/null 2>&1
# Agent runner units: re-render for every linger user that already has them installed.
for l in /var/lib/systemd/linger/*; do
  u=$(basename "$l"); home=$(getent passwd "$u" | cut -d: -f6); ud=$home/.config/systemd/user
  [ -f "$ud/aphrody-agents.service" ] || continue
  src=$(sed -n 's/^Environment=SRC_ROOT=//p' "$ud/aphrody-agents.service"); bun=$(sed -n 's/^ExecStart=\([^ ]*\) .*/\1/p' "$ud/aphrody-agents.service" | head -1)
  [ -n "$src" ] && [ -n "$bun" ] || continue
  ch=0
  for f in "$d"/systemd/aphrody-agents*; do
    t=$ud/$(basename "$f"); sed -e "s|@SRC@|$src|g" -e "s|@BUN@|$bun|g" "$f" > "$t.new"
    if cmp -s "$t.new" "$t"; then rm -f "$t.new"; else mv "$t.new" "$t"; chown "$u:" "$t"; ch=1; fi
  done
  [ $ch = 1 ] && systemctl --user -M "$u@" daemon-reload && echo "agents units updated for $u"
done
rm -rf "$d"
EOS
}

for h in $hosts; do
  echo "== $h $mode"
  case $mode:$h in
    apply:pc|check:pc) pwsh -NoProfile -File "$F/pc/resilience.ps1" "$mode" || rc=1 ;;
    apply:*) push "$h" || { echo "push $h failed"; rc=1; continue; }
             timeout 300 ssh "$(alias_of "$h")" 'S=; [ "$(id -u)" = 0 ] || S="sudo -n"; $S /usr/local/bin/fleet-resilience.sh apply' || rc=1 ;;
    check:*) timeout 120 ssh "$(alias_of "$h")" 'S=; [ "$(id -u)" = 0 ] || S="sudo -n"; $S /usr/local/bin/fleet-resilience.sh check' || rc=1 ;;
    restore-test:*)
      id=${FLEET_BACKUP_IDENTITY:-$HOME/.ssh/fleet/backup-age.key}
      # Identity goes through ssh stdin into a 0600 tmpfs file, removed right after the test.
      timeout 900 ssh "$(alias_of "$h")" 'S=; [ "$(id -u)" = 0 ] || S="sudo -n"; $S sh -c '"'"'umask 077; f=$(mktemp -p /run); cat > "$f"; /usr/local/bin/fleet-backup.sh restore-test "$f"; r=$?; rm -f "$f"; exit $r'"'" < "$id" || rc=1 ;;
    *) echo "unknown $mode $h"; rc=2 ;;
  esac
done
exit $rc
