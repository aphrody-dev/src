# aphrody fleet: roles, state, procedures

State as of 2026-11-12, written during the migration. The versioned sources are in `C:\src-merge\infra\fleet\` (branch merge/labs).

## Roles

| Node | Mesh | Public | Provider | Role |
|---|---|---|---|---|
| fr1 (`vps-203bea89`) | 10.200.77.1 (hub wg1) | 51.77.147.152, 2001:41d0:404:200::4d8e | OVH VPS (KVM) | Google, Chromium and LLVM only |
| fr2 (`bunos`, alias cdn) | 10.200.77.3 | 51.255.162.6, 2001:41d0:305:2100::a461 | OVH Public Cloud (DMI `OpenStack Nova`, OVH IPv6) | vhosts, reverse proxy, CDN, sync, ACME |
| prd (`srv2116886`, USA) | 10.200.77.5 | 72.60.186.43 | Hostinger | application backends |
| Windows PC | 10.200.77.2, 10.200.78.2 | – | – | workstation |

## Done

### aphrody web frontend: fr1 → fr2

- vhosts: `/etc/nginx/sites/{aphrody.com,api.aphrody.com,cdn.aphrody.com,creator.aphrody.com,downloads.aphrody.com,rpbey.fr,omar.aphrody.com}.conf`. Source: `infra/fleet/fr2/nginx/`. The originals of fr1 and fr2 are kept in `infra/fleet/fr1-orig/` and `fr2-orig/`.
- backends: the `127.0.0.1:<port>` become `10.200.77.5:<port>` (prd). omar stays on `127.0.0.1:8793` on fr2: it is a relay to an `ssh -R` tunnel, the client must now target fr2 (`ssh -R 8793:… root@51.255.162.6`).
- a catch-all `*.aphrody.com` → prd:3000 and `*.aphrody.app` → prd:3010 reproduces fr1's default server.
- static content copied to `/srv/www/`: creator (132M), downloads/files, aphrody-api, aphrody-status, rpbey.fr.
- fr2's `conf.d/fleet-api.conf`: `api.aphrody.com` is removed from its `server_name`. The rest (dbfr, mcp/db.rosegriffon.fr) was not touched. Backup: `/root/fleet-api.conf.bak-20261112`.
- test before switching, `curl --resolve` to fr1 then to fr2: same HTTP codes and same sizes on the 12 URLs tested. Even before the migration, no backend port was listening on fr1: aphrody.com, aphrody.app, downloads, omar and cdn/health answered 502 and still answer 502. api /v1/, cdn /, creator and rpbey answered 200 and still answer 200.
- rosegriffon vhosts: not touched, migration handled by rosegriffon-52. Those of fr1 stay in place as rollback.

### DNS switch (Cloudflare, 2026-11-12 ~18:12 UTC)

Values replaced: `51.77.147.152` → `51.255.162.6` and `2001:41d0:404:200::4d8e` → `2001:41d0:305:2100::a461`. The Cloudflare proxy stays in the same state as before.

- zone aphrody.com `963461271f885bc3f3c2bfd586f2b7ba`: `aphrody.com` A (`30ddf6bf…`), `api` A (`1900939c…`), `api` AAAA (`cbaa3d9d…`), `os` A (`a274bd16…`). All CNAMEs to `aphrody.com` follow (cdn, creator, downloads, omar, www…). `vps.aphrody.com` stays on fr1.
- zone aphrody.app `f4dab237b9811435da6fee0b5b3438d4`: 21 A records (api, app-*, auth, craft, deploy, git, play, source).
- **rollback**: put `content` back to the old value (PATCH `/zones/<zone>/dns_records/<id>`). fr1's vhosts are intact, the rollback is immediate.
- to do: rpbey.fr (DNS at OVH, not at Cloudflare) stays served by fr1 until we have access to the OVH API or the Manager. Then move its certificate to webroot on fr2.
- dragonballfr.com already points to prd: nothing to do.

### ACME

See `infra/fleet/ACME.md`: a single certbot on fr2, Cloudflare DNS-01, convention `/etc/nginx/sites/<domain>.conf` and `/etc/nginx/certs/<domain>`.

### PC WireGuard key (leaked in aphrody-dev/mesh-vn)

- new pair generated: `~/.ssh/fleet/wg/wg-win.{key,pub}` (0600, outside the repository). Public key: `08E2m1ElKRNMO2qigTgRoE2X1H8tuwy28LeQqtfpxWc=`.
- the old key is still active. The switch was tried on the server side, but installing the Windows tunnel requires a UAC prompt (`sudo`) that the agent cannot validate. The servers went back to the old key so as not to cut the mesh.
- to finish, run `infra/fleet/wg/rotate-wg-win.sh` in an interactive terminal. It installs the client, swaps the key on fr1 (`wg1`) and prd (`prod`), pings .1, .5 and .3, and rolls back automatically on failure. fr2 does not have this peer.
- mesh-vn: commit `1757fcd`, the key is removed from HEAD and `generator.ts` reads `MESH_WG_WIN_PRIVATE_KEY`. `generated/wg-win.conf` is no longer tracked by git and goes into `.gitignore`. The repository was re-archived. History was not rewritten: the `filter-repo` described in `docs/publish/BLOCKED.md` awaits the owner's approval.

### fr1: shutdowns already done

- cuttlefish Android VM stopped, config in `~/fr1-archive/cuttlefish/`.
- cron `yolo-clean` disabled.
- nie-sre stack purged: its archive is in `r2:aphrody-archive/fr1/configs/nie-sre-service.tgz` (md5 `43217c59c735dac774906fca9664b95d`, sha256 `20161bbb…ba61`), and the docker image was deleted.
- docker swarm dissolved: it had no service, and the `bunos` worker was Down.
- R2 archive in progress: `r2:aphrody-archive/fr1/<folder>` (`~/fr1-r2.sh`, log `~/fr1-r2.log`), at about 5 MB/s in ionice idle. For 274G, expect around 15 h. No deletion before a `CHECK <folder> rc=0` line.

### ssh hardening

- prd accepted `PermitRootLogin yes` and `PasswordAuthentication yes`. Added `/etc/ssh/sshd_config.d/00-fleet.conf` (keys only, root as `prohibit-password`), checked with `sshd -t`, reload, then tested a new connection: OK.
- fr1 and fr2 were already keys only (`sshd -T`).
- inventory of authorized keys: fr1 root (1), fr1 ubuntu (11 distinct, including `aphrody-owner-pc`, `prod-to-vps`, `root@srv2116886`, `bunos-worker`, `achillea-docs-deploy`, `aphrody-cloud`, plus a key without comment `u13O5I5n…`); prd root (6, including `omara@hostinger…` and `yolo-prod@aphrody`).
- proposed rotation: delete the key without comment and the duplicates, then replace `aphrody-owner-pc-unrestricted` (same fingerprint as `aphrody-owner-pc`) with one key per use.

### INCIDENT 2026-11-12 18:19 UTC: partial overwrite of prd:~/.aphrody

- while porting aphrody-gpu-depot, `rsync -a` (without `--delete`) from `fr1:~/.aphrody` to `prd:/home/ubuntu/.aphrody` was launched without checking that prd already had its own `~/.aphrody` (1.9G). It was interrupted after about 2 min.
- about 620 files were written (ctime 18:19–18:21): profiles (502), private (64), a2a (14), backup (12), lib (10), config (6), deploy (4), `memory.sqlite`, `db/steam.sqlite`, `google-cookies.json`, `x-session.json`, cookies, data, host, ocr. Some were new, others may have replaced prd-specific versions with fr1's (fr1 mtime preserved).
- no btrfs snapshot and no backup of prd:~/.aphrody was found.
- no other prd path was touched, and the final chown did not run. The directories created by root (protected-backups, qualifications, reports, run, runtimes, secrets, var, workspace) are empty.
- exact list (623 files, all identical to fr1 by sha256): `INCIDENT-2026-11-12-prd-aphrody.md`. Decision: no restoration or deletion, since no known service uses this folder.

### Backends ported to prd

Details and checksums in `FR1-CHROMIUM-HOST.md`.

- commons-relay: `/srv/commons-relay`, on 10.200.77.5:8766.
- aphrody-gpu-depot: `/srv/aphrody-gpu-depot`, on 10.200.77.5:8182.
- agent-relay-broker: on 127.0.0.1:3889.
- all three run in `fleet-apps.slice` (CPUWeight 50, MemoryMax 8G, oomd).
- compatibility: `fleet-fwd-{commons,gpu-depot}.socket` on fr1 (systemd-socket-proxyd). `10.200.77.1:8766` and `:8182` remain valid until clients target 10.200.77.5.
- GitHub runner: not reinstalled (prd load ~10 for 8 cores). It is stopped on fr1, its config is in R2.

### Network INCIDENT 2026-11-12: OVH → prd UDP filtered upstream

- finding: from 18:19:24, the prd↔fr1 WireGuard handshake fails. fr1 does send its replies (seen in tcpdump), but an nft counter placed at the head of prd's input stays at 0 UDP packets from 51.77.147.152. ICMP still passes. Same thing afterwards from fr2. PC→prd (non-OVH) works.
- likely trigger: the large incoming UDP volumes (rsync at 40 MB/s, then NativeLink CAS, ~3 GB from fr1 and 1.6 GB from fr2). The block lifts after ~15–20 min. The Hostinger API firewall is empty (`firewall_group_id: null`): the filtering is therefore probably the provider's anti-DDoS. To be confirmed with a Hostinger ticket.
- consequence: this is the cause of the 000 on rosegriffon.fr via fr2. fr2 could no longer reach prd:18080 (upstream `rg_prod_stack`). The fr2 edge itself was healthy: from prd via the public IP, 200 over IPv4 and IPv6 with `--resolve`.
- fixes:
  1. full fr1/fr2/prd mesh: prd has a direct fr2 peer (`10.200.77.3/32`) in addition to the fr1 hub (`/24`), and fr2 a direct prd peer (`10.200.77.5/32`).
  2. `fleet-wg-failover@` (30 s timer, on prd and fr2): when the direct handshake is older than 150 s, the direct route is removed and traffic goes back through the hub. Backups: `*.conf.bak-20261112-{rot,hub,mesh}`.
  3. NativeLink prd → `fleet-tunnel-nativelink`: ssh `-L` over TCP to fr1's public IP, `NL_SCHED=127.0.0.1`, `BindsTo`.
  4. rule: transfers to prd over TCP (ssh on the public IP) at 10 MB/s maximum, never in bulk over the mesh.
- findings for rosegriffon-52:
  - (a) fr2: `inet fleet` accepts `tcp dport {22,80,443}` from all sources, over IPv4 and IPv6. ufw and nftables.service are inactive there.
  - (b) nginx listens on `[::]:443` (tested from prd over IPv6: 200).
  - (c) no aphrody AAAA points to fr1 any more, except `vps.aphrody.com`, on purpose. `api` AAAA was switched to fr2.
  - (d) the Cloudflare ranges are covered by the 443 rule open to all on fr2.
  - the cause of the 000 was fr2 → prd:18080 over the mesh, not the edge. The upstream would be better off going through prd's public IP with TLS, or through a TCP tunnel, rather than through the UDP mesh.

### Fleet components (in `infra/fleet/`)

- `bin/fleet-backup.sh` + `systemd/fleet-backup.{service,timer}`: on fr1, every day at 03:30 UTC, to `r2:aphrody-archive/fleet/<host>/`, 30-day retention. First run: fr1 1.2 MB, fr2 139 MB, prd 34 MB.
- `bin/fleet-health.sh` + `systemd/fleet-health.{service,timer}`: on fr1 and prd, every 2 min. Covers the mesh, NativeLink, commons, gpu-depot and the fr2 edge. DNS failover ready but disabled: it needs a Cloudflare `DNS:Edit` token in `/etc/fleet/health.env`, which the MCP OAuth cannot create.
- `bin/fleet-wg-failover.sh` + `systemd/fleet-wg-failover@.{service,timer}`.
- `fr1/` (sysctl, limits, forwards), `prd/` (units, tunnel, `00-fleet-sshd.conf`), `fr2/nginx/`, `wg/rotate-wg-win.sh`, `ACME.md`, `RUNBOOK.md` (OVH and Hostinger consoles, safe reboot, reinstallation).
- slices: fr1 `build.slice` (MemoryMax 38G, oomd); prd `fleet-apps.slice`.

## Remaining work

- rotation of the PC WireGuard key: to be run by the owner (`wg/rotate-wg-win.sh`, requires UAC).
- rpbey.fr: DNS switch at OVH, to be done by the owner (OVH Manager, or OVH API token).
- Cloudflare `Zone.DNS:Edit` token and R2 token limited to the bucket, to be created by the owner (impossible via the MCP OAuth). Then: enable DNS failover and move `fleet-backup` to fr2.
- Hostinger ticket about UDP filtering from OVH IPs.
- ssh keys: delete the key without comment `u13O5I5n…` and the duplicates in `fr1:~ubuntu/.ssh/authorized_keys`.
- alerts: choose a channel (`FLEET_ALERT_URL`).
- fr1: delete the archived data as `CHECK rc=0` lines come in (see `FR1-CHROMIUM-HOST.md`).
