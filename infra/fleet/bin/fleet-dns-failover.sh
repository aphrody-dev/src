#!/bin/bash
# Edge DNS failover (called by fleet-health.sh on the host with FLEET_DNS_FAILOVER=1, prd).
#   fleet-dns-failover.sh plan            read-only: records on fr2 and the standby each one would get
#   fleet-dns-failover.sh down [name..]   fr2 down: switch every A/AAAA of FLEET_DNS_ZONES that points to fr2
#   fleet-dns-failover.sh up              fr2 back: restore every switched record (state file), exact old values
# Standby per name, first valid wins:
#   1. tunnel: FLEET_STANDBY="name=port ..." served on this host's loopback (infra/fleet/fr2/bin/fleet-standby-sync.sh)
#      and published by the tunnel FLEET_DNS_TUNNEL (ingress in infra/cloudflare/cloudflare.toml); valid when the
#      port answers and the connector reports /ready. The A record becomes a proxied CNAME <tunnel>.cfargotunnel.com,
#      the AAAA of the same name is removed (a CNAME cannot coexist), both kept in the state file for `up`.
#   2. IP: FLEET_DNS_FALLBACK hosts serving the name on 443 with a valid certificate (strict TLS checked first).
# Records without a valid standby stay on fr2 and are alerted. Token: CF_API_TOKEN of /etc/aphrody/secrets.env
# (fleet-<host>-dns: Zone Read + DNS Write on aphrody.com and aphrody.app). State: /var/lib/fleet-health/dns-failover.state.
set -uo pipefail
[ -f /etc/fleet/resilience.conf ] && . /etc/fleet/resilience.conf
[ -f /etc/fleet/health.env ] && . /etc/fleet/health.env
T=$(sed -n 's/^CF_API_TOKEN=//p' /etc/aphrody/secrets.env 2>/dev/null | tr -d '\r\n')
[ -n "$T" ] || { echo "dns-failover: no CF_API_TOKEN in /etc/aphrody/secrets.env"; exit 2; }
ZONES=${FLEET_DNS_ZONES:-"963461271f885bc3f3c2bfd586f2b7ba f4dab237b9811435da6fee0b5b3438d4"}
E4=${FLEET_EDGE_IP:-51.255.162.6}; E6=${FLEET_EDGE_IP6:-2001:41d0:305:2100::a461}
FB=${FLEET_DNS_FALLBACK:-"prd=72.60.186.43,2a02:4780:28:8e1e::1 fr1=51.77.147.152,2001:41d0:404:200::4d8e"}
TUN=${FLEET_DNS_TUNNEL:-72153924-6650-4dd4-bced-f8b6731edcd8.cfargotunnel.com}; TREADY=${FLEET_DNS_TUNNEL_READY:-http://127.0.0.1:20244/ready}
STANDBY=${FLEET_STANDBY:-"dbfr.aphrody.com=29401 nie.aphrody.app=29402"}
S=${FLEET_DNS_STATE:-/var/lib/fleet-health/dns-failover.state}; mkdir -p "${S%/*}"
API=https://api.cloudflare.com/client/v4
cf() { printf 'Authorization: Bearer %s\n' "$T" | curl -s -m 20 -H @- -H 'Content-Type: application/json' "$@"; }
notify() { if [ -x /usr/local/bin/fleet-notify.sh ]; then /usr/local/bin/fleet-notify.sh send "$1" "$2"; else logger -t fleet-health -p daemon.err "$1: $2"; fi; }
standby() { # $1 name, $2 type -> "CNAME <tunnel>" | "<type> <ip>" | nothing
  local p f ip4 ip6 ip
  for p in $STANDBY; do
    [ "${p%%=*}" = "$1" ] || continue
    curl -s -o /dev/null -m 5 "http://127.0.0.1:${p#*=}/" && [ "$(curl -s -o /dev/null -m 5 -w '%{http_code}' "$TREADY")" = 200 ] && { echo "CNAME $TUN"; return; }
  done
  for f in $FB; do
    ip4=${f#*=}; ip6=${ip4#*,}; ip4=${ip4%%,*}; ip=$ip4; [ "$2" = AAAA ] && ip=$ip6
    curl -s -o /dev/null -m 10 --resolve "$1:443:$ip4" "https://$1/" && { echo "$2 $ip"; return; }
  done
}
records() { # zone id type name content proxied
  local z c
  for z in $ZONES; do for c in $E4 $E6; do
    cf "$API/zones/$z/dns_records?content=$c&per_page=100" | jq -r --arg z "$z" '.result[]? | "\($z) \(.id) \(.type) \(.name) \(.content) \(.proxied)"'
  done; done | sort -k4,4 -k3,3   # A before AAAA for a name
}
only() { local n=$1; shift; [ $# -eq 0 ] && return 0; for x in "$@"; do [ "$x" = "$n" ] && return 0; done; return 1; }
case ${1:-plan} in
  plan) records | while read -r z id ty name c px; do echo "$ty $name ($c) -> $(standby "$name" "$ty" || true)"; done ;;
  down)
    shift; [ -s "$S" ] && exit 0
    : > "$S.new"; miss=()
    records > "$S.rec"
    for name in $(awk '{print $4}' "$S.rec" | sort -u); do
      only "$name" "$@" || continue
      read -r z id ty _ c px < <(awk -v n="$name" '$4==n' "$S.rec" | head -1)   # A first when there is one
      read -r nty nc < <(standby "$name" "$ty")
      [ -n "${nty:-}" ] || { miss+=("$name"); continue; }
      if [ "$nty" = CNAME ]; then # a CNAME cannot coexist with other records: remove the others first (kept for `up`)
        while read -r z2 id2 ty2 _ c2 px2; do
          [ "$id2" = "$id" ] && continue
          cf -X DELETE "$API/zones/$z2/dns_records/$id2" | jq -e .success >/dev/null && echo "$z2 $id2 $ty2 $name $c2 $px2 DELETED -" >> "$S.new"
        done < <(awk -v n="$name" '$4==n' "$S.rec")
      fi
      if cf -X PATCH "$API/zones/$z/dns_records/$id" -d "{\"type\":\"$nty\",\"content\":\"$nc\",\"proxied\":true}" | jq -e .success >/dev/null; then
        echo "$z $id $ty $name $c $px $nty $nc" >> "$S.new"; logger -t fleet-health -p daemon.crit "dns failover $ty $name $c -> $nty $nc"
      else miss+=("$name"); fi
      if [ "$nty" != CNAME ]; then # IP standby: switch the other family too
        while read -r z2 id2 ty2 _ c2 px2; do
          [ "$id2" = "$id" ] && continue
          read -r t3 c3 < <(standby "$name" "$ty2"); [ -n "${c3:-}" ] || continue
          cf -X PATCH "$API/zones/$z2/dns_records/$id2" -d "{\"content\":\"$c3\"}" | jq -e .success >/dev/null && echo "$z2 $id2 $ty2 $name $c2 $px2 $t3 $c3" >> "$S.new"
        done < <(awk -v n="$name" '$4==n' "$S.rec")
      fi
    done
    rm -f "$S.rec"
    mv "$S.new" "$S"
    [ -s "$S" ] && notify "dns failover executed" "fr2 down: $(awk '{print $4" "$7}' "$S" | paste -sd' ')"
    [ ${#miss[@]} -gt 0 ] && notify "dns failover: no valid standby" "fr2 down, left on fr2: ${miss[*]}"
    exit 0 ;;
  up)
    [ -s "$S" ] || exit 0
    rc=0
    while read -r z id ty name c px nty nc; do
      if [ "$nty" = DELETED ]; then
        cf -X POST "$API/zones/$z/dns_records" -d "{\"type\":\"$ty\",\"name\":\"$name\",\"content\":\"$c\",\"proxied\":$px}" | jq -e .success >/dev/null || rc=1
      else
        cf -X PATCH "$API/zones/$z/dns_records/$id" -d "{\"type\":\"$ty\",\"content\":\"$c\",\"proxied\":$px}" | jq -e .success >/dev/null || rc=1
      fi
    done < <(grep -v ' DELETED ' "$S"; grep ' DELETED ' "$S")   # A back first, then the AAAA
    if [ $rc = 0 ]; then notify "dns failback executed" "fr2 back: $(awk '{print $4}' "$S" | sort -u | paste -sd' ')"; rm -f "$S"
    else notify "dns failback failed" "see $S"; exit 1; fi ;;
  *) echo "usage: $0 plan | down [name..] | up" >&2; exit 2 ;;
esac
