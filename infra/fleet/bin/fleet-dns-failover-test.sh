#!/bin/bash
# Live proof of the edge DNS failover without touching fr2 (run as root on prd):
# a temporary proxied name on fr2 (A + AAAA) goes through `down` (A -> CNAME tunnel mig-prd, AAAA removed),
# is fetched publicly through the tunnel, goes through `up` (exact old A + AAAA back), then is deleted.
set -uo pipefail
N=${1:-fleet-failover-test.aphrody.com}; Z=${2:-963461271f885bc3f3c2bfd586f2b7ba}
T=$(sed -n 's/^CF_API_TOKEN=//p' /etc/aphrody/secrets.env | tr -d '\r\n')
API=https://api.cloudflare.com/client/v4
cf() { printf 'Authorization: Bearer %s\n' "$T" | curl -s -m 20 -H @- -H 'Content-Type: application/json' "$@"; }
live() { cf "$API/zones/$Z/dns_records?name=$N" | jq -r '.result[] | "  live \(.type) \(.content) proxied=\(.proxied)"'; }
mk() { jq -n --arg t "$1" --arg n "$N" --arg c "$2" '{type:$t,name:$n,content:$c,proxied:true,comment:"fleet failover test, temporary"}'; }
cf -X POST "$API/zones/$Z/dns_records" -d "$(mk A 51.255.162.6)" | jq -e .success >/dev/null || { echo "create A failed"; exit 1; }
cf -X POST "$API/zones/$Z/dns_records" -d "$(mk AAAA 2001:41d0:305:2100::a461)" | jq -e .success >/dev/null || { echo "create AAAA failed"; exit 1; }
echo "1. created on fr2:"; live
export FLEET_DNS_STATE=/var/lib/fleet-health/dns-failover-test.state FLEET_STANDBY="$N=29401"
echo "2. plan: $(/usr/local/bin/fleet-dns-failover.sh plan | grep "$N" | paste -sd';')"
/usr/local/bin/fleet-dns-failover.sh down "$N"
echo "3. after down:"; live
sleep 20
echo "4. public fetch through the tunnel: $(curl -s -o /dev/null -m 15 -w '%{http_code}' "https://$N/")"
/usr/local/bin/fleet-dns-failover.sh up
echo "5. after up:"; live
for id in $(cf "$API/zones/$Z/dns_records?name=$N" | jq -r '.result[].id'); do cf -X DELETE "$API/zones/$Z/dns_records/$id" >/dev/null; done
echo "6. cleaned: $(cf "$API/zones/$Z/dns_records?name=$N" | jq '.result | length') record(s) left"
