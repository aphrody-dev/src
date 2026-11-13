#!/bin/bash
# Measures the criteria for closing public ssh 22 on fr2 (docs/infra/FR2-CLOUDFLARE.md, section 6, 2026-11-20):
# every hour, ssh through Cloudflare Access with this host's service token, and ssh over the WireGuard mesh.
# One JSON line per run in /var/lib/fleet-ssh22/probes.jsonl (last 2000 kept), read by `just cf-proof`.
# Config /etc/fleet/ssh22-probe.conf: ACCESS_TARGET=user@ssh-<peer>.aphrody.com  MESH_TARGET=user@10.200.77.x
# Secrets: CF_ACCESS_CLIENT_ID/SECRET from /etc/aphrody/secrets.env, passed to cloudflared by environment only.
set -u
. /etc/fleet/ssh22-probe.conf
set -a; . /etc/aphrody/secrets.env; set +a
export TUNNEL_SERVICE_TOKEN_ID=$CF_ACCESS_CLIENT_ID TUNNEL_SERVICE_TOKEN_SECRET=$CF_ACCESS_CLIENT_SECRET
unset CLOUDFLARE_API_TOKEN CF_API_TOKEN
o="-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new"
a=$(timeout 60 ssh $o -o UserKnownHostsFile=/root/.ssh/known_hosts_access -o ProxyCommand="/usr/bin/cloudflared access ssh --hostname %h" "$ACCESS_TARGET" hostname 2>/dev/null)
m=$(timeout 40 ssh $o "$MESH_TARGET" hostname 2>/dev/null)
d=/var/lib/fleet-ssh22; mkdir -p $d; f=$d/probes.jsonl
printf '{"ts":%s,"access":%s,"mesh":%s,"access_host":"%s","mesh_host":"%s"}\n' "$(date +%s)" "$([ -n "$a" ] && echo true || echo false)" "$([ -n "$m" ] && echo true || echo false)" "$a" "$m" >> $f
tail -n 2000 $f > $f.new && mv $f.new $f
