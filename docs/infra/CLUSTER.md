# Cluster fr1 / fr2 / prd: load balancing, failover, mesh, deduplication

Status 2026-11-13: in production on all three members, `just cluster-proof` green. Single source:
`infra/deploy.toml` `[cluster]`. Generator: `infra/cluster/gen.ts` -> `infra/cluster/generated/`.
Boundary: the Cloudflare edge (DNS, Workers, Cache Rules, Tunnel ingress, Access) belongs to
`infra/cloudflare/` and `docs/infra/FR2-CLOUDFLARE.md`. This document covers the origin side only.

## Architecture

```
Cloudflare edge (cache, Tunnel mig-prd; connectors can run on all 3 members)
        |
127.0.0.1:<lb_port> on EVERY member   HAProxy 3.4 (aphrody-cluster-haproxy.service, Restart=always)
        |  balance uri + consistent hash (identical server ids => same ring everywhere), weights fr1 20 / fr2 60 / prd 100
        |  active checks every 1 s (fall 2, rise 3), L7 retries for GET/HEAD (conn-failure, 500/502/503/504), redispatch
        v
owner member of the URI ---- local: 127.0.0.1:<lb_port+10000> nginx shard (cache + proxy_cache_lock) -> origin
                        \--- remote: <public IP>:7444 TLS 1.3 mTLS (private CA, verify required, SNI <svc>.<member>.cluster.internal)
                              -> mesh_in on the owner -> its nginx shard -> origin
```

- **Mesh/transport**: HAProxy backend mTLS over TCP 7444, full mesh, no single point of failure (no hub, no
  controller), no ssh, WireGuard, git or API calls on the data path. TCP only, so the UDP filtering
  OVH -> prd (Hostinger) doesn't apply. Reconnection: stateless connections, pooled and reused, retried on the next member.
  The firewall only lets fleet IPs reach 7444 (nft `inet fleet` table): **the PC isn't on the mesh** and keeps direct ssh.
- **ssh over the mesh**: `ssh <user>@<member>-mesh` (`/etc/ssh/ssh_config.d/50-aphrody-mesh.conf`, ProxyCommand
  `/usr/local/bin/aphrody-ssh-mesh` = `openssl s_client` with a client cert). `infra/agents/fleet.toml` and
  `packages/ai-os/src/orch/fleet.ts` try `<member>-mesh` first, then direct ssh (fallback on exit 255).
- **Cloudflare Load Balancing**: paid ($5/month for 2 origins, then $5 per origin, per the Cloudflare pricing quoted by
  costbench / blazingcdn, checked 2026-11-13). Not used: the free failover is Tunnel connector replicas
  (several cloudflared on the same tunnel) pointing at the local LB port, which answers on every member.
- **fr1** (Chromium/LLVM): low weight 20. HAProxy and the edge replicas run in `aphrody-cluster.slice`
  (`CPUQuota=200%`, `MemoryMax=6G`, `CPUWeight=10`, `IOWeight=10`), plus 1 CPU per container (`infra/cluster/compose.capped.yaml`).
- **prd**: nothing heavy added (HAProxy 3.4.7-1 from the Arch archive: the 3.4.7-2 repo build requires openssl 4,
  and a partial upgrade would break pacman/sudo). `aphrody-heavy` is not affected.

## Placement (deploy.toml)

| service | members | lb_port | cache | check |
|---|---|---|---|---|
| downloads (r2-site) | fr1, fr2, prd | 19797 | micro | `/` not 5xx |
| cdn (r2-site) | fr1, fr2, prd | 19796 | micro | `/` 200 |
| api-gateway | fr1, fr2, prd | 19081 | micro | `/` 200 |
| mig-test | prd | 19780 | honor | `/` 200 |
| aphrody (aphrody.com, *.aphrody.com) | prd green 23000, blue 13000 as backup | 19300 | honor | `/` 2xx/3xx |
| ai-os (gateway) | prd green 24000, blue 14000 as backup | 19400 | off | `/health` 200 |
| ssh-prd (tcp, Tunnel ingress) | prd:22 | 19022 | n/a | connect |
| depot | prd | 19182 | off | `/health` 2xx/4xx |
| commons | prd | 19766 | off | `/health` 200 |
| relay (agent-relay broker) | prd | 19889 | off | `/health` 200 |
| nativelink / nativelink-cas (tcp) | fr1 | 19051 / 19061 | n/a | connect |
| ssh (tcp, pinned) | fr1, fr2, prd | `<member>-mesh` | n/a | n/a |
| bench | fr1, fr2, prd | 19990 | off | `/bench/health` |
| postgres, redis (stateful) | prd primary, no standby | not exposed | n/a | n/a |

The replicas on fr1/fr2 use `/etc/aphrody/cluster-edge.env` (only the 4 `S3_*` keys, copied from prd without being displayed).
Without it, fr2 answered 500. The health checks kept it out of the pool, which is the intended behaviour.

## Blue/green

`bluegreen = { service = "<deploy.toml service>", active = "green" }` + `targets = { prd = "127.0.0.1" }`: gen.ts derives the
origins from `[services.<x>].green_port/blue_port`. The active colour is the primary, the other one is `backup` (HAProxy: `backup check`;
nginx shard: `backup` + `proxy_next_upstream error timeout 502/503/504`). A switch = change `active`, then `just cluster-deploy prd`.
Applied to aphrody and ai-os, the only deploy.toml blue/green services that have a cluster pool. shenron and rosegriffon have their
own ingress (shenron-dbfr tunnel) and rust-stack/ring3-agent/yolo/ai-triad have no live origin, so none of them get a pool.

## Tunnel mig-prd replicas

Connector `cloudflared-mig-prd` (unit `infra/cluster/systemd/cloudflared-mig-prd.service`) on prd, fr1 (slice capped) and fr2: 3 x 4
connections. Token = systemd-creds credential re-encrypted on each host (`/etc/credstore.encrypted/cloudflared-mig-prd`).
Every ingress points at an lb_port (edge commits c46afd4, 9c6c7d9), including `ssh-prd` -> 19022, so a request that lands on any
connector reaches the right origin.

## Deduplication

1. Edge: Cloudflare cache (edge agent).
2. Cluster: every URI has **one owner member** (consistent hash). Its nginx shard has `proxy_cache_lock`, so
   concurrent duplicates from all three members trigger a single origin fetch. `micro` = origin headers honoured,
   otherwise 1 s for anonymous GET/HEAD (anything with Cookie or Authorization bypasses the cache).
   `proxy_cache_use_stale updating|error|5xx` + `background_update`.
3. Writes: `POST` + `Idempotency-Key` -> shard `@idem`, key = method|host|uri|Idempotency-Key|Authorization|Cookie. The first response
   (2xx/4xx) is replayed for 24 h and concurrent duplicates are coalesced.
4. Outbound agent / ai-os calls: proposal sent to nt-d6 (relay singleflight + cache keyed by sha256(method, url, body, model)).
   Not implemented here.

## Proof (`just cluster-proof`, 2026-11-13)

- Health: 3 x 13 pools UP (`L7OK`/`L4OK`/`L6OK`). An occasional `L4TOUT` towards prd (absorbed by fall=2).
- Kill-test: `cdn` replica on fr2 stopped from the prd entry, URI owned by fr2, 10 req/s for 40 s: **273 requests, 0 client errors**,
  traffic rerouted **3.5 s** after `docker stop` (L7 retries cover the gap), owner back **5.0 s** after `docker start`.
- Blue/green: temporary blue (same image and env, private tmpfs /app/var) on 13000, green `aphrody-src-aphrody-1` stopped for 12 s,
  fr2 entry at 5 req/s: **118 requests, 0 errors**. Green restarted (200), blue removed.
  Incident during the first attempt (2026-11-13 ~03:05 UTC): the blue would not start (SQLite on a root tmpfs) and the script
  stopped green anyway, so **aphrody.com returned errors for ~15 s** (75/112). Fix: `mode=1777` + the proof aborts without
  touching green if blue doesn't answer 2xx/3xx (`SKIP_BLUEGREEN=1` skips it).
- Coalescing: 90 identical concurrent GETs (30 per member) -> **1 MISS + 89 HIT, a single origin fetch**.
- Idempotency: 10 concurrent POSTs with the same key -> **1 MISS + 9 HIT**.
- Mesh vs WireGuard (new connection, 1 KiB object; throughput on 64 MiB):

| pair | mesh total (TCP / TLS) | mesh MB/s | WG total | WG MB/s |
|---|---|---|---|---|
| fr1->fr2 | 42 ms (11 / 28) | 163 | 23 ms | 116 |
| fr1->prd | 28 ms (7 / 20) | 87 | 241 ms (outlier) | 91 |
| fr2->fr1 | 43 ms (11 / 31) | 178 | 22 ms | 136 |
| fr2->prd | 62 ms (9 / 52) | 90 | 14 ms | 102 |
| prd->fr1 | 52 ms (14 / 33) | 80 | 20 ms | 74 |
| prd->fr2 | 23 ms (6 / 16) | 92 | 17 ms | 62 |

  Throughput is equal or better than WireGuard. A cold connection costs the TLS 1.3 handshake (+1 RTT + crypto), which the HAProxy
  pools then amortise (keep-alive, `http-reuse`). ssh over the mesh: the 6 pairs are OK, 250-550 ms per full ssh session.
- Duplicate-request ratio. **Before** (prd `access.log`, 278,507 requests, 12/11 06:56 -> 13/11 02:32): **28.6 %** of requests
  repeat the same method+path within 1 s (37.9 % within 10 s). Each of them reached the origin.
  **After** (shards, second run 2026-11-13 ~03:25 UTC): fr1 98.9 %, fr2 98.7 %, prd **50.7 %** (1,285 requests, real aphrody.com traffic
  included: `honor`, so it only caches what the origin declares cacheable, and aphrody declares little) served without an origin fetch. The `mig-prd` ingress has
  pointed at the lb_ports since c46afd4 (mig-test 19780, mig-downloads 19797, mig-depot 19182, mig-commons 19766). Re-measure with
  `ssh <m> cat /var/log/nginx/aphrody-cluster.log | bun infra/cluster/dedup.ts cluster`.

## Operations

`just cluster-gen` | `just cluster-deploy <m>` (validates `haproxy -c` and `nginx -t` before reload, restores on failure) |
`just cluster-proof` | `just cluster-pki <m>` (CA in `~/.local/share/aphrody/cluster-ca` on the PC, member key generated on the
member) | `infra/cluster/pki.sh client <host> <user>` (ssh client cert) | stats: `curl 127.0.0.1:19900/stats`, `/metrics`.

## Rollback (one line per change)

| change | rollback |
|---|---|
| HAProxy + nginx shards + ssh mesh + nginx Restart drop-in on a member | `just cluster-down <member>` |
| mig-prd replica on fr1/fr2 | `ssh <m> sudo systemctl disable --now cloudflared-mig-prd` |
| blue/green pools | set `active` back, or drop `bluegreen` from deploy.toml + `just cluster-deploy prd` |
| edge replicas on fr1 | `ssh fr1 'cd /srv/aphrody-src && sudo docker compose -f compose.yaml -f compose.capped.yaml --profile edge down'` |
| fr2 replicas with R2 env | `ssh fr2 'cd /srv/aphrody-src && sudo env SRC_TAG=smoke docker compose --profile edge up -d'` |
| HAProxy package | `ssh prd pacman -R --noconfirm haproxy`; `ssh fr1 sudo apt-get purge -y haproxy` (same on fr2) |
| R2 env on fr1/fr2 | `ssh <m> sudo rm /etc/aphrody/cluster-edge.env` |
| mesh certificates | `ssh <m> 'sudo rm -rf /etc/aphrody-cluster/tls ~/.config/aphrody-cluster'` |
| fleet.toml / orch/fleet.ts (`-mesh` targets) | `git revert <commit>` |
| mig-prd ingress to lb_ports (edge agent) | point the ingress back at the old origins (`docs/infra/FR2-CLOUDFLARE.md`) |

## Limits

- mig-test, depot, commons, relay, aphrody, ai-os and nativelink have one origin host (prd or fr1): the LB gives access from every member, not redundancy.
  depot/commons on prd and nativelink on fr1 listen on the WireGuard IP: if that interface disappears, these origins go down (the mesh does not).
- No postgres standby: a standby would stream WAL over a `mode = "tcp"` service of the mesh.
- Gemini Carbon validation not obtained (2026-11-13): prompt sent in Carbon High, conversation lost (Chrome tab closed by another
  session during the generation, Gemini at ~3 min per turn today). To redo.
