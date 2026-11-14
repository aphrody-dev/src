#!/bin/sh
# prd pre-window backup (run ON usa, read-only on prod data). Destination: fr1 over the mesh (NOT the pool being reformatted).
# Per apps/shenron AGENTS.md section 6: dry-run, verified backup (pg_restore -f /dev/null), never delete /srv/shenron/models.
. "$(dirname "$0")/lib.sh"; need_root
DEST=${DEST:-root@10.200.77.1:/srv/stage/usa}; D=$(date -u +%Y%m%d)
OUT=/var/tmp/reinstall-$D; mkdir -p "$OUT"
for c in $(docker ps --format '{{.Names}}' | grep -E 'postgres|-pg-'); do
  log "dump $c"; docker exec "$c" sh -c 'pg_dumpall --globals-only -U "${POSTGRES_USER:-postgres}"' > "$OUT/$c.globals.sql"
  for db in $(docker exec "$c" psql -U "${POSTGRES_USER:-postgres}" -Atc "select datname from pg_database where not datistemplate"); do
    docker exec "$c" pg_dump -Fc -U "${POSTGRES_USER:-postgres}" "$db" > "$OUT/$c.$db.dump"
    docker exec -i "$c" pg_restore -f /dev/null < "$OUT/$c.$db.dump" && log "verified $c/$db"   # fails the script on a bad dump
  done
done
b3sum "$OUT"/* > "$OUT/B3SUMS" 2>/dev/null || sha256sum "$OUT"/* > "$OUT/SHA256SUMS"
nice -n 19 ionice -c3 rsync -a --partial --bwlimit=10m --dry-run --itemize-changes "$OUT/" "$DEST/db/" | head -20
[ "${GO:-}" = 1 ] || { log "dry-run only; GO=1 to copy"; exit 0; }
nice -n 19 ionice -c3 rsync -a --partial --bwlimit=10m "$OUT/" "$DEST/db/"
nice -n 19 ionice -c3 rsync -a --partial --bwlimit=10m /srv/shenron/ "$DEST/shenron/"   # includes models (14G total)
for d in /srv/rosegriffon /srv/auto /srv/sccache /etc/nginx /etc/cloudflared /etc/wireguard /etc/fleet; do
  [ -e "$d" ] && rsync -aR "$d" "$DEST/etc-srv/"; done
log "done; verify with: rsync -a --checksum --dry-run /srv/shenron/ $DEST/shenron/"
