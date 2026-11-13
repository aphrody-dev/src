#!/bin/bash
# Rebuild a fleet host from zero (`just fleet-rebuild <host>`), run from the PC once the provider has
# reinstalled the image (RUNBOOK.md: Ubuntu 26.10 fr1/fr2, Arch prd) with the PC ssh key in authorized_keys.
#   fleet-rebuild.sh <fr1|fr2|prd> [--dry-run]
# Steps (each idempotent, rerunnable after a failure):
#   1. sshd: keys only (prd/00-fleet-sshd.conf);
#   2. toolchains and runtime: just fleet-bootstrap <host> (packages, docker, nginx, wireguard, cloudflared, agents user);
#   3. state: latest age-encrypted backup r2:aphrody-archive/fleet/<host>/ fetched through a peer that holds the R2
#      remote, decrypted on the PC (~/.ssh/fleet/backup-age.key), restored on the host: /etc (wireguard, fleet,
#      nginx, letsencrypt, credstore, systemd units and drop-ins), the systemd-creds host key, user units and
#      credstores, SQLite copies back in place, app state paths of BACKUP_PATHS;
#   4. fleet layer: fleet-resilience-remote.sh apply <host> (bin, timers, drop-ins, linger, checkout);
#   5. cluster LB: just cluster-deploy <host>; agent runner: just agents-install <alias>;
#   6. checks: fleet-resilience.sh check, fleet-health.sh, restore test of the next backup.
set -uo pipefail
h=${1:?usage: fleet-rebuild.sh fr1|fr2|prd [--dry-run]}; dry=${2:-}
root=$(cd "$(dirname "$0")/../../.." && pwd)
case $h in fr1) a=vps; peer=prd; peer_r2=r2;; fr2) a=cdn; peer=prd; peer_r2=r2;; prd) a=prd; peer=cdn; peer_r2=r2;; *) echo "unknown host $h" >&2; exit 2;; esac
id=${FLEET_BACKUP_IDENTITY:-$HOME/.ssh/fleet/backup-age.key}
export PATH="$PATH:$HOME/AppData/Local/Microsoft/WinGet/Links"
run() { echo "+ $*"; [ "$dry" = --dry-run ] || "$@"; }
S='S=; [ "$(id -u)" = 0 ] || S="sudo -n";'

echo "== 1. ssh $a"
timeout 30 ssh -o BatchMode=yes -o ConnectTimeout=10 "$a" true || { echo "ssh $a unreachable: reinstall the image with the PC key first (RUNBOOK.md)"; exit 1; }
sshd_keys_only() { timeout 60 ssh "$a" "$S \$S install -d /etc/ssh/sshd_config.d && \$S tee /etc/ssh/sshd_config.d/00-fleet.conf >/dev/null && \$S sshd -t && { \$S systemctl reload sshd 2>/dev/null || \$S systemctl reload ssh; }" < "$root/infra/fleet/prd/00-fleet-sshd.conf"; }
run sshd_keys_only

echo "== 2. bootstrap"
run just --justfile "$root/justfile" fleet-bootstrap "$h"

echo "== 3. restore state from R2"
last=$(timeout 60 ssh "$peer" "$S \$S rclone lsf $peer_r2:aphrody-archive/fleet/$h/ --files-only 2>/dev/null || rclone lsf $peer_r2:aphrody-archive/fleet/$h/ --files-only" | grep '\.tar\.zst\.age$' | sort | tail -1)
[ -n "$last" ] || { echo "no encrypted backup for $h"; exit 1; }
echo "backup: $last (via $peer)"
if [ "$dry" != --dry-run ]; then
  tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
  timeout 900 ssh "$peer" "$S \$S rclone cat $peer_r2:aphrody-archive/fleet/$h/$last 2>/dev/null || rclone cat $peer_r2:aphrody-archive/fleet/$h/$last" > "$tmp/b.age" || exit 1
  age -d -i "$id" -o "$tmp/b.tar.zst" "$tmp/b.age" || { echo "decrypt failed"; exit 1; }
  rm -f "$tmp/b.age"
  # The archive is extracted on the host into /var/tmp/fleet-restore, then copied over / except live mounts.
  timeout 900 ssh "$a" "$S rm -rf /var/tmp/fleet-restore && mkdir -p /var/tmp/fleet-restore && cat > /var/tmp/fleet-restore.tar.zst" < "$tmp/b.tar.zst" || exit 1
  timeout 1800 ssh "$a" "$S \$S sh -s" <<'EOS' || exit 1
set -e; r=/var/tmp/fleet-restore
zstd -dq < /var/tmp/fleet-restore.tar.zst | tar -x -C "$r"
# Never overwrite the fresh image's identity of the machine nor its boot/disk layout.
# Accounts, package manager state and binaries come from the new image and the bootstrap, not from the backup.
for p in etc/fstab etc/hostname etc/machine-id etc/ssh/ssh_host_* etc/default/grub etc/kernel etc/mkinitcpio* etc/netplan etc/cloud \
         etc/passwd* etc/shadow* etc/group* etc/gshadow* etc/subuid* etc/subgid* etc/apt etc/dpkg etc/pacman* etc/ld.so* etc/alternatives usr; do rm -rf "$r"/$p; done
cp -a "$r"/etc/. /etc/
for d in var srv home root; do [ -d "$r/$d" ] && cp -a "$r/$d/." "/$d/"; done
# SQLite consistent copies back to their live paths.
[ -d "$r/.fleet-sqlite" ] && (cd "$r/.fleet-sqlite" && find . -type f | while read -r f; do install -D -m 0640 "$f" "/${f#./}"; done)
systemctl daemon-reload
rm -rf "$r" /var/tmp/fleet-restore.tar.zst
echo "restore ok"
EOS
fi

echo "== 4. fleet layer"
run bash "$root/infra/fleet/bin/fleet-resilience-remote.sh" apply "$h"

echo "== 5. cluster LB and agent runner"
run just --justfile "$root/justfile" cluster-deploy "$h"
run just --justfile "$root/justfile" agents-install "$a"

echo "== 6. checks"
run bash "$root/infra/fleet/bin/fleet-resilience-remote.sh" check "$h"
run timeout 300 ssh "$a" "$S \$S systemctl start fleet-health.service; \$S journalctl -u fleet-health -n 3 -o cat --no-pager"
run timeout 900 ssh "$a" "$S \$S systemctl start fleet-backup.service"
run bash "$root/infra/fleet/bin/fleet-resilience-remote.sh" restore-test "$h"
