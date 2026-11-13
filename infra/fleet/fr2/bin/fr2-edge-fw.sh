#!/bin/bash
# fr2 origin lock-down: TCP 80/443 accepted only from Cloudflare (proxied hostnames), the fleet (fleet-health
# --resolve checks from fr1/prd, self-host fallback) and the WireGuard mesh. Everything else on 80/443 is dropped.
# Untouched: ssh 22 (break-glass until Access SSH is proven), WireGuard UDP, FORWARD (wg forwarding, docker).
# Cloudflare ranges: https://api.cloudflare.com/client/v4/ips (refreshed by fr2-edge-fw.timer, last good copy kept).
# Rollback (one line): systemctl disable --now fr2-edge-fw.timer; nft delete table inet fr2_edge
set -euo pipefail
out=/etc/nftables.d/fr2-edge.nft; cache=/var/lib/fr2-edge-fw/ips.json
mkdir -p "${out%/*}" "${cache%/*}"
if curl -fsS -m 20 https://api.cloudflare.com/client/v4/ips -o "$cache.new" && jq -e '.success and (.result.ipv4_cidrs|length>10)' "$cache.new" >/dev/null; then
  mv "$cache.new" "$cache"
fi
[ -s "$cache" ] || { echo "no Cloudflare range list (fetch failed, no cache): leaving rules as they are" >&2; exit 1; }
v4=$(jq -r '.result.ipv4_cidrs|join(", ")' "$cache"); v6=$(jq -r '.result.ipv6_cidrs|join(", ")' "$cache")
# fr1, prd, fr2 itself (deploy.toml [nodes.*] + AAAA of the hosts).
fleet4="51.77.147.152, 72.60.186.43, 51.255.162.6"
fleet6="2001:41d0:404:200::4d8e, 2a02:4780:28:8e1e::1, 2001:41d0:305:2100::a461"
cat > "$out.new" <<EOF
add table inet fr2_edge
delete table inet fr2_edge
table inet fr2_edge {
  set cf4 { type ipv4_addr; flags interval; elements = { $v4 } }
  set cf6 { type ipv6_addr; flags interval; elements = { $v6 } }
  set fleet4 { type ipv4_addr; elements = { $fleet4 } }
  set fleet6 { type ipv6_addr; elements = { $fleet6 } }
  chain input {
    type filter hook input priority -5; policy accept;
    tcp dport != { 80, 443 } accept
    ct state established,related accept
    iifname { "lo", "wg1" } accept
    ip saddr @cf4 accept
    ip6 saddr @cf6 accept
    ip saddr @fleet4 accept
    ip6 saddr @fleet6 accept
    counter drop comment "origin: not Cloudflare, not fleet"
  }
}
EOF
nft -c -f "$out.new"
mv "$out.new" "$out"
nft -f "$out"
echo "fr2_edge loaded: $(jq '.result.ipv4_cidrs|length' "$cache") v4 + $(jq '.result.ipv6_cidrs|length' "$cache") v6 Cloudflare ranges"
