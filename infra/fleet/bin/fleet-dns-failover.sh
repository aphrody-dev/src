#!/bin/bash
# Edge DNS failover (called by fleet-health.sh on the host with FLEET_DNS_FAILOVER=1, prd).
#   fleet-dns-failover.sh down   fr2 is down: every A/AAAA record of FLEET_DNS_ZONES whose content is fr2
#                                (FLEET_EDGE_IP / FLEET_EDGE_IP6) is switched to the first fallback of
#                                FLEET_DNS_FALLBACK that serves that name with a valid certificate (strict TLS,
#                                checked before the switch); records without a valid standby are left and alerted.
#   fleet-dns-failover.sh up     fr2 is back: every switched record goes back to fr2 (state file).
#   fleet-dns-failover.sh plan   read-only: records on fr2 and the standby each one would get.
# Token: CF_API_TOKEN of /etc/aphrody/secrets.env (fleet-<host>-dns: Zone Read + DNS Write on aphrody.com and
# aphrody.app only, infra/cloudflare/fleet-token.ts). State: /var/lib/fleet-health/dns-failover.state.
set -uo pipefail
[ -f /etc/fleet/resilience.conf ] && . /etc/fleet/resilience.conf
[ -f /etc/fleet/health.env ] && . /etc/fleet/health.env
T=$(sed -n 's/^CF_API_TOKEN=//p' /etc/aphrody/secrets.env 2>/dev/null | tr -d '\r\n')
[ -n "$T" ] || { echo "dns-failover: no CF_API_TOKEN in /etc/aphrody/secrets.env"; exit 2; }
ZONES=${FLEET_DNS_ZONES:-"963461271f885bc3f3c2bfd586f2b7ba f4dab237b9811435da6fee0b5b3438d4"}
E4=${FLEET_EDGE_IP:-51.255.162.6}; E6=${FLEET_EDGE_IP6:-2001:41d0:305:2100::a461}
FB=${FLEET_DNS_FALLBACK:-"prd=72.60.186.43,2a02:4780:28:8e1e::1 fr1=51.77.147.152,2001:41d0:404:200::4d8e"}
S=/var/lib/fleet-health/dns-failover.state; mkdir -p "${S%/*}"
cf() { printf 'Authorization: Bearer %s\n' "$T" | curl -s -m 20 -H @- -H 'Content-Type: application/json' "$@"; }
notify() { if [ -x /usr/local/bin/fleet-notify.sh ]; then /usr/local/bin/fleet-notify.sh send "$1" "$2"; else logger -t fleet-health -p daemon.err "$1: $2"; fi; }
standby() { # $1 name, $2 type -> fallback IP serving $1 with a valid certificate, or nothing
  local f ip4 ip6 ip
  for f in $FB; do
    ip4=${f#*=}; ip6=${ip4#*,}; ip4=${ip4%%,*}; ip=$ip4; [ "$2" = AAAA ] && ip=$ip6
    [ "$2" = AAAA ] && { curl -s -o /dev/null -m 10 --resolve "$1:443:$ip4" "https://$1/" && echo "$ip"; return; }
    curl -s -o /dev/null -m 10 --resolve "$1:443:$ip" "https://$1/" && { echo "$ip"; return; }
  done
}
records() { # zone id type name content, for records on fr2
  local z
  for z in $ZONES; do for c in $E4 $E6; do
    cf "https://api.cloudflare.com/client/v4/zones/$z/dns_records?content=$c&per_page=100" | jq -r --arg z "$z" '.result[]? | "\($z) \(.id) \(.type) \(.name) \(.content)"'
  done; done
}
case ${1:-plan} in
  plan) records | while read -r z id ty name c; do echo "$ty $name -> $(standby "$name" "$ty" || true)"; done ;;
  down)
    [ -s "$S" ] && exit 0
    : > "$S.new"; miss=()
    while read -r z id ty name c; do
      ip=$(standby "$name" "$ty")
      if [ -z "$ip" ]; then miss+=("$name"); continue; fi
      cf -X PATCH "https://api.cloudflare.com/client/v4/zones/$z/dns_records/$id" -d "{\"content\":\"$ip\"}" | jq -e .success >/dev/null \
        && echo "$z $id $c $name $ip" >> "$S.new" && logger -t fleet-health -p daemon.crit "dns failover $ty $name $c -> $ip"
    done < <(records)
    mv "$S.new" "$S"
    [ -s "$S" ] && notify "dns failover executed" "fr2 down: $(awk '{print $4"->"$5}' "$S" | paste -sd' ')"
    [ ${#miss[@]} -gt 0 ] && notify "dns failover: no valid standby" "fr2 down, left on fr2 (no fallback with a valid certificate): ${miss[*]}"
    exit 0 ;;
  up)
    [ -s "$S" ] || exit 0
    while read -r z id c name ip; do
      cf -X PATCH "https://api.cloudflare.com/client/v4/zones/$z/dns_records/$id" -d "{\"content\":\"$c\"}" | jq -e .success >/dev/null \
        && logger -t fleet-health "dns failback $name -> $c" || { notify "dns failback failed" "$name stays on $ip"; exit 1; }
    done < "$S"
    notify "dns failback executed" "fr2 back: $(awk '{print $4"->"$3}' "$S" | paste -sd' ')"; rm -f "$S" ;;
  *) echo "usage: $0 plan|down|up" >&2; exit 2 ;;
esac
