#!/bin/bash
# Cross-node health checks (run on fr1 and prd, each checks the others). Exit 1 on any failure.
# Alerts: journald (tag fleet-health) + optional webhook FLEET_ALERT_URL (ntfy/Discord-compatible POST).
# DNS failover (off by default): FLEET_DNS_FAILOVER=1 + CF_API_TOKEN + /etc/fleet/dns-failover.tsv
# ("zone_id record_id fallback_ip" per line) -> after 3 consecutive edge failures, PATCH records to fallback.
set -uo pipefail
[ -f /etc/fleet/health.env ] && . /etc/fleet/health.env
st=/var/lib/fleet-health; mkdir -p "$st"
fail=()
ping_ok() { ping -c2 -W2 "$1" >/dev/null 2>&1; }
tcp_ok()  { timeout 4 bash -c "</dev/tcp/$1/$2" 2>/dev/null; }
http_ok() { c=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$@"); [[ "$c" =~ ^(2|3|401|404) ]]; }
for ip in ${FLEET_PEERS:-10.200.77.1 10.200.77.3 10.200.77.5}; do ping_ok "$ip" || fail+=("mesh:$ip"); done
for hp in ${FLEET_TCP:-10.200.77.1:50051 10.200.77.1:50061 10.200.77.5:8766 10.200.77.5:8182}; do tcp_ok "${hp%:*}" "${hp#*:}" || fail+=("tcp:$hp"); done
edge_fail=0
for u in ${FLEET_URLS:-https://api.aphrody.com/v1/health https://creator.aphrody.com/health https://cdn.aphrody.com/}; do
  h=${u#https://}; h=${h%%/*}
  http_ok --resolve "$h:443:${FLEET_EDGE_IP:-51.255.162.6}" "$u" || { fail+=("edge:$u"); edge_fail=1; }
done
n=$(cat "$st/edge_fail" 2>/dev/null || echo 0); [ $edge_fail = 1 ] && n=$((n+1)) || n=0; echo $n > "$st/edge_fail"
if [ ${#fail[@]} -gt 0 ]; then
  msg="fleet-health $(hostname): ${fail[*]}"
  logger -t fleet-health -p daemon.err "$msg"; echo "$msg"
  [ -n "${FLEET_ALERT_URL:-}" ] && curl -s -m 10 -d "$msg" "$FLEET_ALERT_URL" >/dev/null
  if [ "${FLEET_DNS_FAILOVER:-0}" = 1 ] && [ "$n" -ge 3 ] && [ -n "${CF_API_TOKEN:-}" ] && [ ! -e "$st/failed_over" ]; then
    while read -r z r ip; do
      [ -z "$z" ] || [ "${z#\#}" != "$z" ] && continue
      curl -s -m 15 -X PATCH -H "Authorization: Bearer $CF_API_TOKEN" -H 'Content-Type: application/json' \
        "https://api.cloudflare.com/client/v4/zones/$z/dns_records/$r" -d "{\"content\":\"$ip\"}" >/dev/null
    done < /etc/fleet/dns-failover.tsv
    touch "$st/failed_over"; logger -t fleet-health -p daemon.crit "DNS failover executed (rollback: reset records, rm $st/failed_over)"
  fi
  exit 1
fi
echo "fleet-health $(hostname): OK"
