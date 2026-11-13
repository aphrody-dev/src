#!/bin/bash
# Self-backup of one fleet host to R2: $BACKUP_REMOTE/<host>/<UTC>.tar.zst.age (root, timer fleet-backup).
# Content: BACKUP_PATHS of /etc/fleet/resilience.conf (configs, /etc, systemd-creds credstores + the host key
# /var/lib/systemd/credential.secret that decrypts them) and consistent online copies of BACKUP_SQLITE
# (sqlite3 .backup, under /.fleet-sqlite/<path> in the archive; the live files are excluded).
# Encryption: age to infra/fleet/backup-age.pub (/etc/fleet/backup-age.pub); the identity stays on the PC
# (~/.ssh/fleet/backup-age.key). Retention 30 days. Restore test: just fleet-restore-test <host>.
#   fleet-backup.sh            run a backup
#   fleet-backup.sh restore-test <identity-file>   fetch latest, decrypt, list, sqlite integrity_check (prints, no writes outside a temp dir)
set -uo pipefail
. /etc/fleet/resilience.conf
R=${BACKUP_REMOTE:-r2:aphrody-archive/fleet}/$HOST
RU=${BACKUP_RCLONE_USER:-root}
rcl() { if [ "$RU" = root ]; then rclone "$@"; else sudo -u "$RU" rclone "$@"; fi; }

restore_test() {
  local id=$1 last n ok=0 bad=0
  t=$(mktemp -d /var/tmp/fleet-restore-test.XXXX); trap 'rm -rf "${t:-}"' EXIT
  last=$(rcl lsf "$R/" --files-only | grep '\.tar\.zst\.age$' | sort | tail -1)
  [ -n "$last" ] || { echo "RESTORE $HOST FAIL no encrypted backup in $R"; return 1; }
  rcl cat "$R/$last" | age -d -i "$id" | zstd -dq | tar -x -C "$t" || { echo "RESTORE $HOST FAIL decrypt/extract $last"; return 1; }
  n=$(find "$t" -type f | wc -l)
  for db in $BACKUP_SQLITE; do
    f="$t/.fleet-sqlite$db"
    if [ -f "$f" ] && [ "$(sqlite3 "$f" 'PRAGMA integrity_check;' 2>&1)" = ok ]; then ok=$((ok+1)); else bad=$((bad+1)); echo "RESTORE sqlite FAIL $db"; fi
  done
  for p in etc/fstab etc/fleet/resilience.conf var/lib/systemd/credential.secret; do [ -e "$t/$p" ] || { echo "RESTORE missing $p"; bad=$((bad+1)); }; done
  echo "RESTORE $HOST $last files=$n sqlite_ok=$ok sqlite_bad=$bad"
  [ $bad = 0 ]
}

backup() {
  local d paths excl=() db out sz s
  d=$(date -u +%Y%m%dT%H%MZ)
  stage=$(mktemp -d /var/tmp/fleet-backup.XXXX); trap 'rm -rf "${stage:-}"' EXIT
  mkdir -p "$stage/.fleet-sqlite"
  for db in $BACKUP_SQLITE; do
    [ -f "$db" ] || continue
    mkdir -p "$stage/.fleet-sqlite$(dirname "$db")"
    sqlite3 "$db" ".timeout 10000" ".backup '$stage/.fleet-sqlite$db'" || echo "sqlite backup failed: $db"
    excl+=(--exclude="${db#/}" --exclude="${db#/}-wal" --exclude="${db#/}-shm")
  done
  paths=$(for p in $BACKUP_PATHS; do [ -e "$p" ] && echo "${p#/}"; done)
  # shellcheck disable=SC2086
  tar --ignore-failed-read -C / --anchored "${excl[@]}" --exclude='etc/fleet/*.bak*' -cf - $paths -C "$stage" .fleet-sqlite 2>/dev/null \
    | zstd -q -T1 -8 | age -R /etc/fleet/backup-age.pub | rcl rcat "$R/$d.tar.zst.age"; s=$?
  sz=$(rcl size --json "$R/$d.tar.zst.age" 2>/dev/null | sed -n 's/.*"bytes":\([0-9]*\).*/\1/p')
  if [ $s -ne 0 ] || [ "${sz:-0}" -lt 10000 ]; then out="BACKUP $HOST FAIL rc=$s size=${sz:-0}"; logger -t fleet-backup -p daemon.err "$out"; echo "$out"; return 1; fi
  # Retention only after a good backup, only our archives, and never below the 8 newest.
  rcl lsf "$R/" --files-only --include "*.tar.zst*" | sort | head -n -8 > "$stage/old"
  [ -s "$stage/old" ] && rcl delete --min-age 30d --files-from "$stage/old" "$R/" 2>/dev/null
  echo "BACKUP $HOST OK $d size=$sz"; logger -t fleet-backup "BACKUP $HOST OK $d size=$sz"
}

case ${1:-run} in
  run) mkdir -p /var/tmp; if [ -n "${BACKUP_LOCK:-}" ]; then exec 9>"$BACKUP_LOCK"; flock -w 3600 9 || exit 75; fi; backup ;;
  restore-test) restore_test "${2:?identity file}" ;;
  *) echo "usage: $0 [run|restore-test <identity>]" >&2; exit 2 ;;
esac
