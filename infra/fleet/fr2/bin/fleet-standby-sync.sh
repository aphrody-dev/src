#!/bin/bash
# Standby origin on prd for the names that still resolve to fr2 (DNS failover target, fleet-dns-failover.sh).
# Run as root on fr2 (fleet-standby-sync.timer, daily). From fr2's nginx confs it keeps the http-level blocks (map,
# upstream, proxy_cache_path) and only the HTTPS server blocks of STANDBY_NAMES, rewritten to plain HTTP on prd
# loopback ports (TLS ends at Cloudflare: the standby is reached through the prd tunnel mig-prd, ingress in
# infra/cloudflare/cloudflare.toml). Snippets are copied. prd: `nginx -t`, reload, otherwise previous state kept.
set -euo pipefail
PRD=${STANDBY_TARGET:-root@72.60.186.43}
CONFS=${STANDBY_CONFS:-"/etc/nginx/conf.d/fleet-api.conf /etc/nginx/conf.d/rosegriffon-cdn.conf"}
NAMES=${STANDBY_NAMES:-"dbfr.aphrody.com=29401 nie.aphrody.app=29402"}
t=$(mktemp -d); trap 'rm -rf "$t"' EXIT
mkdir -p "$t/snippets"
# shellcheck disable=SC2086
awk -v names="$NAMES" '
  BEGIN { n = split(names, a, " "); for (i = 1; i <= n; i++) { split(a[i], kv, "="); port[kv[1]] = kv[2] } }
  function flush(   p, k, line, i) {
    p = ""; for (k in port) if (index(sname, " " k " ") || index(sname, " " k ";")) p = port[k]
    if (p == "" || !tls) return
    print "server {"; print "    listen 127.0.0.1:" p ";"; print "    listen 10.200.77.5:" p ";  # mig-prd replicas on fr1/fr2 reach it via fleet-fwd-standby@" p
    for (i = 1; i <= nb; i++) { line = buf[i]
      if (line ~ /^[ \t]*(listen|ssl_[a-z_]+|http2)[ \t;]/) continue
      if (line ~ /\$aop_deny/) continue
      print line }
    print "}"
  }
  depth == 0 && /^[ \t]*server[ \t]*\{/ { insrv = 1; depth = 1; nb = 0; sname = ""; tls = 0; next }
  insrv {
    o = gsub(/\{/, "{"); c = gsub(/\}/, "}"); depth += o - c
    if (depth == 0) { insrv = 0; flush(); next }
    if ($0 ~ /listen[ \t]+(\[::\]:)?443/) tls = 1
    if ($0 ~ /server_name/) sname = sname " " $0 " "
    buf[++nb] = $0; next
  }
  { print }
' $CONFS | sed -e 's#/etc/nginx/snippets/#/etc/fleet-standby/snippets/#g' \
  -e 's#server 72.60.186.43:8443#server 10.200.77.5:8443#' > "$t/zz-fleet-standby.conf"  # rosegriffon origin allow-lists the mesh, not prd's public IP
for i in $(grep -hoE 'include /etc/fleet-standby/snippets/[^;]+' "$t/zz-fleet-standby.conf" | cut -d' ' -f2); do
  f=/etc/nginx/snippets/${i##*/}; grep -vE '^[ \t]*(ssl_[a-z_]+|http2)[ \t]' "$f" > "$t/snippets/${i##*/}"
done
sed -i '1i # managed by infra/fleet/fr2/bin/fleet-standby-sync.sh: fr2 vhosts as prd loopback standby (tunnel mig-prd)' "$t/zz-fleet-standby.conf"
tar -C "$t" -cf - snippets zz-fleet-standby.conf | ssh -o BatchMode=yes -o ConnectTimeout=15 "$PRD" 'set -e
  n=$(mktemp -d); tar -xf - -C "$n"; old=$(mktemp)
  cp -a /etc/nginx/conf.d/zz-fleet-standby.conf "$old" 2>/dev/null || : > "$old"
  rm -rf /etc/fleet-standby.prev; [ -d /etc/fleet-standby ] && mv /etc/fleet-standby /etc/fleet-standby.prev
  mkdir -p /etc/fleet-standby /var/cache/nginx/rg-cdn; mv "$n/snippets" /etc/fleet-standby/
  install -m 0644 "$n/zz-fleet-standby.conf" /etc/nginx/conf.d/zz-fleet-standby.conf
  if nginx -t -q 2>"$n/err" && systemctl reload nginx; then rm -rf /etc/fleet-standby.prev; echo "standby ok"
  else
    if [ -s "$old" ]; then install -m 0644 "$old" /etc/nginx/conf.d/zz-fleet-standby.conf; else rm -f /etc/nginx/conf.d/zz-fleet-standby.conf; fi
    rm -rf /etc/fleet-standby; [ -d /etc/fleet-standby.prev ] && mv /etc/fleet-standby.prev /etc/fleet-standby
    echo "standby rejected:"; cat "$n/err"; exit 1
  fi
  rm -rf "$n" "$old"'
logger -t fleet-standby "standby origin synced to $PRD ($NAMES)"
