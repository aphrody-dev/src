# Fleet runbook (fr1, fr2, prd)

## Emergency access

| Node | Provider | Console / rescue |
|---|---|---|
| fr1 `vps-203bea89` 51.77.147.152 | OVH VPS (KVM) | OVH Manager > Bare Metal Cloud > VPS > `vps-203bea89.vps.ovh.net` > "Reboot in rescue mode" (credentials sent by e-mail), or web KVM console (serial `ttyS0` and `tty1` active in the cmdline). In rescue: `mount /dev/sda1 /mnt` (ext4 root); `/home` = btrfs `sdb1+sdc1`, subvol `@home`. |
| fr2 `bunos` 51.255.162.6 | OVH Public Cloud (OpenStack Nova) | OVH Manager > Public Cloud > Instances > "VNC console" or "Rescue" (rescue-pro image). API: `openstack server rescue`. |
| prd `srv2116886` 72.60.186.43 | Hostinger VPS (id 2116886) | hPanel > VPS > Browser console / Recovery mode. API: `https://developers.hostinger.com/api/vps/v1/virtual-machines/2116886` (`HOSTINGER_API_TOKEN` on the PC): `POST .../recovery`, `POST .../restart`. |

ssh: keys only on all three nodes (`PasswordAuthentication no`, root `prohibit-password`). The PC goes through the public IPs (`~/.ssh/config`), never through the mesh. Cutting the mesh therefore does not cut access.

## Safe reboot (kernel)

1. Check what starts at boot: `systemctl is-enabled ssh.socket wg-quick@wg1 fleet-firewall fleet-mesh-forward fail2ban` (fr1). Never enable ufw or nftables.service: filtering goes through fleet-firewall, firewalld and netavark.
2. `GRUB_DEFAULT=saved`, default = proven kernel (`grub-set-default '<submenu>><entry>'`), new kernel as a one-shot: `grub-reboot '<submenu>><new entry>'`.
3. `systemd-run --on-active=5 systemctl reboot`, then wait for ssh (`until ssh ...`).
4. Checks: `uname -r`, ping 10.200.77.{1,3,5}, `fleet-health.sh`, NativeLink (:50051/:50061, 3 workers on :50061), `aphrody-factory doctor`.
5. Make it permanent only if everything is green: `grub-set-default '<submenu>><new entry>'`. Keep the old kernel as `apt-mark manual`.
6. If there is no ssh after about 5 min: reboot from the Manager. GRUB falls back to the proven default, since `next_entry` applies only once. If that is not enough, go to rescue (table above).

## WireGuard

- Topology: fr1 hub `wg1` 10.200.77.0/24 (port 51821). fr2 (45667) and prd (`vps`, 52245) have a direct peer between them, and `fleet-wg-failover@` (30 s timer) removes the direct route when the handshake is older than 150 s: the hub then takes over. The PC goes through the hub, plus a direct link with prd (`prod`, 10.200.78.0/30).
- Known issue (2026-11-12): UDP from OVH (fr1 and fr2) to prd is intermittently filtered upstream after large volumes, for about 15 to 20 min. ICMP still passes. Large transfers to prd therefore go over TCP: NativeLink via `fleet-tunnel-nativelink` (ssh -L), rsync via `ssh root@72.60.186.43`.
- Configs: `/etc/wireguard/*.conf` (0600), backed up every day to `r2:aphrody-archive/fleet/<host>/` (tar of `/etc`).
- Rotation of the PC key: `wg/rotate-wg-win.sh`.

## Backups

- Each host backs itself up: `fleet-backup.timer` (03:30, 09:30, 15:30, 21:30 UTC, `Persistent`). The unit runs at Nice 19, idle I/O, CPUWeight 10, rclone limited to 2 transfers and 10 MB/s; on prd, under `flock /var/lock/aphrody-heavy.lock`. Content: `BACKUP_PATHS` of `infra/fleet/<host>/resilience.conf` (`/etc` with the systemd-creds credstores, the host key `/var/lib/systemd/credential.secret`, user units and credstores, application state), plus a consistent copy (`sqlite3 .backup`) of each database in `BACKUP_SQLITE`, stored under `.fleet-sqlite/<path>` in the archive.
- age encryption to `infra/fleet/backup-age.pub`. The identity stays on the PC (`~/.ssh/fleet/backup-age.key`, 0600, outside the repository). Destination: `r2:aphrody-archive/fleet/<host>/<UTC>.tar.zst.age`, 30-day retention.
- Restore test: `just fleet-restore-test <host>`. The latest archive is decrypted on the host (identity passed over ssh into a 0600 tmpfs file, erased afterwards), then `PRAGMA integrity_check` of each database and check of `/etc/fstab`, `resilience.conf` and the credstore key.
- Manual restore: `rclone cat r2:aphrody-archive/fleet/<host>/<f>.tar.zst.age | age -d -i backup-age.key | zstd -d | tar -x -C /restore`.
- Lore: hourly backup `lore-r2-backup` to `r2-lore:aphrody-lore`, same priority regime (drop-in `BATCH`).

## Resilience (reboot, crash, kill)

- `just fleet-resilience apply|check [pc fr2 prd fr1]` pushes `infra/fleet/bin`, the timers and `<host>/resilience.conf`, then runs `fleet-resilience.sh apply`:
  - drop-in `50-fleet-resilience.conf` on `SERVICES`: Restart=always (on-failure for a oneshot), RestartSec 5 s, StartLimit 20/600 s, network-online;
  - `enable --now` of the `TIMERS`, `wg-quick@` enabled with Restart=on-failure, linger and user units (`USER_UNITS`);
  - docker `live-restore`: without it, a dockerd crash killed the containers without restarting them (observed on fr2); `unless-stopped` policy for compose containers;
  - `nofail` on secondary mounts (`NOFAIL`), dead units disabled (`DISABLE`, `DISABLE_USER`), low priority for backups and syncs (`BATCH`).
  Filtering stays `fleet-firewall` (`/etc/fleet/firewall.nft`); `check` verifies that ufw and nftables.service stay inactive.
- No `WatchdogSec`: none of these services emits `WATCHDOG=1`. The HTTP `PROBES` of `fleet-resilience.sh heal` (3 failures: restart) take its place.
- prd: the ai-os relay runs from the read-only git checkout `/srv/src` (partial and sparse clone), kept up to date by `src-checkout-update.timer` (10 min, `--ff-only`, relay restarted if `packages/ai-os` changes).
- PC: `infra/fleet/pc/resilience.ps1`. AphrodyRelay and WireGuard as Automatic (Delayed Start) with recovery restart 5/10/30 s; `Aphrody\Agents*` and `ay-ai-*` tasks restartable, StartWhenAvailable.
- Crash: `bash infra/fleet/bin/fleet-kill-test.sh <host> <unit|user:unit|wg:iface>...`. Real reboot: `just fleet-resilience-proof <host>` (only one at a time, lock on the PC, refused if a host booted less than 15 min ago).

## Health and alerts

- `fleet-health.timer` (2 min) on fr1, fr2 and prd. It first runs the local self-heal, then checks each peer over ssh on the public IP (`HEAL_PEERS`): a degraded peer or one whose timer is stopped is repaired remotely; an unreachable peer is counted and alerted. It then checks the mesh, the `FLEET_TCP` ports and the fr2 edge (`curl --resolve`). Failures go to journald, tag `fleet-health`, and to `FLEET_ALERT_URL` if this variable is set in `/etc/fleet/health.env`. Service failover between hosts is that of the cluster LB (`infra/cluster`, HAProxy pools fr1/fr2/prd).
- Authentication and network access (ssh, WireGuard, cloudflared, renewal units, CI secrets): `ay auth status` from the PC, `ay auth repair` to repair without a password, `ay auth tunnels` for cloudflared tokens (systemd-creds). Details: `docs/infra/AUTH.md`.
- DNS failover: disabled (`FLEET_DNS_FAILOVER=0`). Enabling it requires a Cloudflare `Zone.DNS:Edit` token (`CF_API_TOKEN`) and `/etc/fleet/dns-failover.tsv` (zone, record, fallback IP). The valid fallback today is fr1, which keeps its nginx vhosts as rollback until rosegriffon-52 has confirmed.

## Reinstalling a node

1. Reinstall the provider image (Ubuntu 26.10 for fr1 and fr2, Arch for prd) with the PC's ssh key.
2. `just fleet-rebuild <host>` (`--dry-run` to see the plan):
   - sshd with keys only, then `just fleet-bootstrap`;
   - restore of the latest R2 archive, fetched by a peer and decrypted on the PC. Kept from the fresh image: machine-id, ssh host keys, fstab, grub and network. SQLite databases are put back in place;
   - `just fleet-resilience apply`, `just cluster-deploy`, `just agents-install`;
   - finally check, fleet-health, backup and restore test.
3. fr1 only: `infra/fleet/fr1/sysctl` and `limits`, `install-build-deps.py --no-prompt --unsupported --no-syms --no-arm --no-chromeos-fonts`, NativeLink `deploy.sh server` then `deploy.sh worker 10.200.77.1 100000000000 10` (cache on the btrfs subvol `/home/nativelink-worker`).

## Load limits

- fr1: `build.slice` (MemoryHigh 34G, MemoryMax 38G, oomd kill at 80 % pressure). NativeLink worker at Nice=5.
- prd: `fleet-apps.slice` (CPUWeight 50, MemoryHigh 6G, MemoryMax 8G, oomd) for commons-relay, aphrody-gpu-depot and agent-relay-broker.
- Transfers: `nice -n 19 ionice -c3`, `--bwlimit` ≤ 10 MB/s to prd. Before writing to a target that already exists: `rsync --dry-run --itemize-changes`, then `--backup --backup-dir=<target>.rsync-backup-<date>`.

## Disk, swap, FS and sysctl (fleet-tune)

- `infra/fleet/bin/fleet-tune.sh apply|check|clean` (installed in `/usr/local/bin`), per-host configuration `infra/fleet/<host>/tune.conf` copied to `/etc/fleet/tune.conf`. `fleet-tune.service` reapplies it at every boot, `fleet-clean.timer` (05:23) cleans up every day.
- Memory: zram at priority 100 (zram-generator on fr2 and prd, in-house `zram-swap.service` on fr1), swapfile at priority 10 (fr1 8 GiB ext4, fr2 2 GiB ext4, prd 8 GiB btrfs nocow created by `btrfs filesystem mkswapfile` in the `/swap` subvolume). `vm.swappiness` 150 on fr2 and prd, 100 on fr1; `vm.page-cluster` 0; `dirty_bytes` sized per host in `/etc/sysctl.d/95-fleet-tune.conf`.
- FS: `noatime` everywhere. prd's root has no fstab line (mounted by the kernel cmdline): it is remounted `noatime` at boot by `fleet-tune.service`. btrfs keeps `compress=zstd:1,space_cache=v2,discard=async`. `fstrim.timer` active on all three hosts.
- Cleanup (quotas in `tune.conf`): cargo targets (`CACHEDIR.TAG`) inactive for N days, never while the heavy lock is held; bun and sccache caches above their cap; `docker builder prune --keep-storage`, unused images older than 14 days; `journalctl --vacuum-size`.
- Kernel: no change applied here. Any kernel change goes through docs/linux and `fleet-reboot-precheck.sh`; never a reboot from fleet-tune.
