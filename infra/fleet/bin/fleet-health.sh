#!/bin/bash
# Cross-node health (timer fleet-health, 2 min, on fr1, fr2 and prd: each host checks the others).
#  1. local self-heal: fleet-resilience.sh heal (units, user units, HTTP probes -> restart);
#  2. peers over ssh on public IPs (TCP, independent of the WireGuard mesh): HEAL_PEERS="name=localuser:user@ip".
#     Peer degraded (systemctl is-system-running != running) or its fleet-health.timer stopped -> remote heal;
#     peer unreachable -> counted in /var/lib/fleet-health/down.<peer> and alerted;
#  3. mesh ping, FLEET_TCP ports, edge fr2 (curl --resolve).
# Service failover between hosts is the cluster LB (infra/cluster, HAProxy pools fr1/fr2/prd with health checks).
# Alerts: journald (tag fleet-health, priority err), mailed by fleet-notify.sh (one per cause per 24 h).
# DNS failover: FLEET_DNS_FAILOVER=1 (prd) -> fleet-dns-failover.sh down/up (token fleet-<host>-dns).
set -uo pipefail
[ -f /etc/fleet/resilience.conf ] && . /etc/fleet/resilience.conf
[ -f /etc/fleet/health.env ] && . /etc/fleet/health.env
st=/var/lib/fleet-health; mkdir -p "$st"
fail=()
ping_ok() { ping -c2 -W2 "$1" >/dev/null 2>&1; }
tcp_ok()  { timeout 4 bash -c "</dev/tcp/$1/$2" 2>/dev/null; }
http_ok() { c=$(curl -s -o /dev/null -m 10 -w '%{http_code}' "$@"); [[ "$c" =~ ^(2|3|401|404) ]]; }

[ -x /usr/local/bin/fleet-resilience.sh ] && /usr/local/bin/fleet-resilience.sh heal >/dev/null 2>&1

REMOTE='S=; [ "$(id -u)" = 0 ] || S="sudo -n"; s=$(systemctl is-system-running 2>/dev/null); t=$(systemctl is-active fleet-health.timer 2>/dev/null)
if [ "$s" != running ] || [ "$t" != active ]; then $S /usr/local/bin/fleet-resilience.sh heal >/dev/null 2>&1; $S systemctl start fleet-health.timer 2>/dev/null; echo "healed state=$s timer=$t failed=$(systemctl --failed --no-legend --plain | cut -d" " -f1 | paste -sd,)"; else echo ok; fi'
for p in ${HEAL_PEERS:-}; do
  name=${p%%=*}; rest=${p#*=}; lu=${rest%%:*}; tgt=${rest#*:}
  as=(); [ "$lu" = "$(id -un)" ] || as=(sudo -u "$lu")
  out=$(timeout 60 "${as[@]}" ssh -o BatchMode=yes -o ConnectTimeout=10 -o ServerAliveInterval=5 "$tgt" "$REMOTE" 2>/dev/null); s=$?
  n=$(cat "$st/down.$name" 2>/dev/null || echo 0)
  if [ $s -ne 0 ] || [ -z "$out" ]; then n=$((n+1)); fail+=("peer-down:$name(x$n)"); else n=0; [ "$out" = ok ] || { fail+=("peer-$name:$out"); logger -t fleet-health "peer $name: $out"; }; fi
  echo $n > "$st/down.$name"
done

for ip in ${FLEET_PEERS:-10.200.77.1 10.200.77.3 10.200.77.5}; do ping_ok "$ip" || fail+=("mesh:$ip"); done
for hp in ${FLEET_TCP:-10.200.77.1:50051 10.200.77.1:50061 10.200.77.5:8766 10.200.77.5:8182}; do tcp_ok "${hp%:*}" "${hp#*:}" || fail+=("tcp:$hp"); done
# Edge = fr2: down only when every edge URL fails (one broken vhost is not an edge outage).
edge_ok=0; edge_n=0
for u in ${FLEET_URLS:-https://api.aphrody.com/v1/health https://creator.aphrody.com/health https://cdn.aphrody.com/}; do
  h=${u#https://}; h=${h%%/*}; edge_n=$((edge_n+1))
  if http_ok --resolve "$h:443:${FLEET_EDGE_IP:-51.255.162.6}" "$u"; then edge_ok=$((edge_ok+1)); else fail+=("edge:$u"); fi
done
n=$(cat "$st/edge_fail" 2>/dev/null || echo 0); [ $edge_ok = 0 ] && n=$((n+1)) || n=0; echo $n > "$st/edge_fail"
up=$(cat "$st/edge_up" 2>/dev/null || echo 0); [ $edge_ok = "$edge_n" ] && up=$((up+1)) || up=0; echo $up > "$st/edge_up"
# DNS failover (FLEET_DNS_FAILOVER=1, prd): edge down 3 runs in a row (6 min) and fr2 unreachable over ssh;
# failback after 3 healthy runs. Records, standby choice (strict TLS) and state: fleet-dns-failover.sh.
if [ "${FLEET_DNS_FAILOVER:-0}" = 1 ] && [ -x /usr/local/bin/fleet-dns-failover.sh ]; then
  if [ "$n" -ge 3 ] && [ "$(cat "$st/down.fr2" 2>/dev/null || echo 0)" -ge 3 ]; then /usr/local/bin/fleet-dns-failover.sh down
  elif [ "$up" -ge 3 ]; then /usr/local/bin/fleet-dns-failover.sh up; fi
fi
if [ ${#fail[@]} -gt 0 ]; then
  # journald err = alert source: fleet-notify.timer turns it into one mail per cause and per 24 h.
  msg="fleet-health $(hostname): ${fail[*]}"
  logger -t fleet-health -p daemon.err "$msg"; echo "$msg"
  exit 1
fi
echo "fleet-health $(hostname): OK"
