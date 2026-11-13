#!/bin/bash
# Measures the criteria for closing public ssh 22 on fr2 (docs/infra/FR2-CLOUDFLARE.md, section 6, 2026-11-20):
# every hour, ssh through Cloudflare Access with this host's service token (if ACCESS_TARGET is set), and ssh over the
# WireGuard mesh. One JSON line per run in /var/lib/fleet-ssh22/probes.jsonl (last 2000 kept), read by `just cf-proof`.
# Installed by infra/fleet/bin/ssh22-probe-install.sh as /usr/local/bin/ssh22-probe.sh + fleet-ssh22-probe.{service,timer};
# config /etc/fleet/ssh22-probe.conf: ACCESS_TARGET=user@ssh-<peer>.aphrody.com (empty on fr1)  MESH_TARGET=user@10.200.77.x
# Host keys are pinned (StrictHostKeyChecking=yes, known_hosts provisioned at install). secrets.env is never sourced:
# only the two Access variables are read, and handed to cloudflared through its environment.
set -u
val() { sed -n "s/^$1=//p" "$2" | head -1; }
cfgf=/etc/fleet/ssh22-probe.conf
sec=/etc/aphrody/secrets.env
ACCESS_TARGET=$(val ACCESS_TARGET $cfgf)
MESH_TARGET=$(val MESH_TARGET $cfgf)
o="-o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=yes"
a=""
access=null
if [ -n "$ACCESS_TARGET" ]; then
  TUNNEL_SERVICE_TOKEN_ID=$(val CF_ACCESS_CLIENT_ID $sec)
  TUNNEL_SERVICE_TOKEN_SECRET=$(val CF_ACCESS_CLIENT_SECRET $sec)
  export TUNNEL_SERVICE_TOKEN_ID TUNNEL_SERVICE_TOKEN_SECRET
  a=$(timeout 60 ssh $o -o UserKnownHostsFile=/root/.ssh/known_hosts_access -o ProxyCommand="/usr/bin/cloudflared access ssh --hostname %h" "$ACCESS_TARGET" hostname 2>/dev/null)
  if [ -n "$a" ]; then access=true; else access=false; fi
fi
m=$(timeout 40 ssh $o "$MESH_TARGET" hostname 2>/dev/null)
if [ -n "$m" ]; then mesh=true; else mesh=false; fi
f=/var/lib/fleet-ssh22/probes.jsonl
printf '{"ts":%s,"access":%s,"mesh":%s,"access_host":"%s","mesh_host":"%s"}\n' "$(date +%s)" "$access" "$mesh" "$a" "$m" >> $f
tail -n 2000 $f > $f.new && mv $f.new $f
