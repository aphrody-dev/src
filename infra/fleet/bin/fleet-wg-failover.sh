#!/bin/sh
# Direct WireGuard peer with hub fallback.
# Usage: fleet-wg-failover.sh <iface> <direct-peer-pubkey> <ip/32>
# If the direct peer's handshake is fresh (< 150 s; PersistentKeepalive keeps handshaking even without
# AllowedIPs), <ip/32> is routed through it; otherwise AllowedIPs is cleared so the hub's /24 takes over.
# Reason: the provider path OVH->prd intermittently drops UDP from a given source (2026-11-12).
set -eu
ifc=$1 key=$2 ip=$3
now=$(date +%s)
hs=$(wg show "$ifc" latest-handshakes | awk -v k="$key" '$1==k{print $2}')
cur=$(wg show "$ifc" allowed-ips | awk -v k="$key" '$1==k{print $2}')
if [ -n "$hs" ] && [ "$hs" -gt 0 ] && [ $((now - hs)) -lt 150 ]; then
  [ "$cur" = "$ip" ] || { wg set "$ifc" peer "$key" allowed-ips "$ip"; ip route replace "$ip" dev "$ifc" 2>/dev/null || true; logger -t fleet-wg-failover "$ifc $ip -> direct"; }
else
  [ "$cur" = "(none)" ] || { wg set "$ifc" peer "$key" allowed-ips ""; logger -t fleet-wg-failover "$ifc $ip -> hub (direct handshake stale)"; }
fi
