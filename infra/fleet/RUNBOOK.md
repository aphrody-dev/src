# Runbook flotte (fr1, fr2, prd)

## Accès de secours

| Nœud | Fournisseur | Console / secours |
|---|---|---|
| fr1 `vps-203bea89` 51.77.147.152 | OVH VPS (KVM) | Manager OVH > Bare Metal Cloud > VPS > `vps-203bea89.vps.ovh.net` > « Redémarrer en mode rescue » (identifiants envoyés par e-mail), ou console KVM web (série `ttyS0` et `tty1` actifs dans la cmdline). En rescue : `mount /dev/sda1 /mnt` (ext4 root) ; `/home` = btrfs `sdb1+sdc1`, subvol `@home`. |
| fr2 `bunos` 51.255.162.6 | OVH Public Cloud (OpenStack Nova) | Manager OVH > Public Cloud > Instances > « Console VNC » ou « Rescue » (image rescue-pro). API : `openstack server rescue`. |
| prd `srv2116886` 72.60.186.43 | Hostinger VPS (id 2116886) | hPanel > VPS > Console navigateur / Recovery mode. API : `https://developers.hostinger.com/api/vps/v1/virtual-machines/2116886` (`HOSTINGER_API_TOKEN` sur le PC) : `POST .../recovery`, `POST .../restart`. |

ssh : clés uniquement sur les trois nœuds (`PasswordAuthentication no`, root `prohibit-password`). Le PC passe par les IP publiques (`~/.ssh/config`), jamais par le mesh. Couper le mesh ne coupe donc pas l'accès.

## Reboot sécurisé (noyau)

1. Vérifier ce qui démarre au boot : `systemctl is-enabled ssh.socket wg-quick@wg1 fleet-firewall fleet-mesh-forward fail2ban` (fr1). Ne jamais activer ufw ni nftables.service : le filtrage passe par fleet-firewall, firewalld et netavark.
2. `GRUB_DEFAULT=saved`, défaut = noyau éprouvé (`grub-set-default '<submenu>><entry>'`), nouveau noyau en coup unique : `grub-reboot '<submenu>><nouvelle entry>'`.
3. `systemd-run --on-active=5 systemctl reboot`, puis attendre ssh (`until ssh ...`).
4. Vérifications : `uname -r`, ping 10.200.77.{1,3,5}, `fleet-health.sh`, NativeLink (:50051/:50061, 3 workers sur :50061), `aphrody-factory doctor`.
5. Rendre permanent seulement si tout est vert : `grub-set-default '<submenu>><nouvelle entry>'`. Garder l'ancien noyau en `apt-mark manual`.
6. Si pas de ssh après environ 5 min : reboot depuis le Manager. GRUB repart sur le défaut éprouvé, puisque `next_entry` ne vaut qu'une fois. Si ça ne suffit pas, passer en rescue (tableau ci-dessus).

## WireGuard

- Topologie : hub fr1 `wg1` 10.200.77.0/24 (port 51821). fr2 (45667) et prd (`vps`, 52245) ont un pair direct entre eux, et `fleet-wg-failover@` (timer 30 s) retire la route directe quand le handshake a plus de 150 s : le hub prend alors le relais. Le PC passe par le hub, plus un lien direct avec prd (`prod`, 10.200.78.0/30).
- Problème connu (2026-11-12) : l'UDP depuis OVH (fr1 et fr2) vers prd est filtré en amont par intermittence après de gros volumes, pendant environ 15 à 20 min. L'ICMP passe toujours. Les gros transferts vers prd passent donc en TCP : NativeLink via `fleet-tunnel-nativelink` (ssh -L), rsync via `ssh root@72.60.186.43`.
- Configs : `/etc/wireguard/*.conf` (0600), sauvegardées chaque jour dans `r2:aphrody-archive/fleet/<hôte>/` (tar de `/etc`).
- Rotation de la clé du PC : `wg/rotate-wg-win.sh`.

## Sauvegardes

- `fleet-backup.timer` sur fr1, chaque jour à 03:30 UTC. Contenu : `/etc` des trois nœuds, plus `/srv/www` (fr2), plus l'état commons, gpu-depot et agent-relay (prd). Destination : `r2:aphrody-archive/fleet/<hôte>/<date>.tar.zst`, rétention 30 j.
- Lore : sauvegarde horaire déjà en place, `r2:aphrody-lore`.
- Restauration : `rclone cat r2:aphrody-archive/fleet/<hôte>/<date>.tar.zst | zstd -d | tar -x -C /restore`.

## Santé et alertes

- `fleet-health.timer` (2 min) sur fr1 et prd. Il vérifie le mesh, les ports NativeLink, commons et gpu-depot, et l'edge fr2 (`curl --resolve`). Les échecs vont dans journald, tag `fleet-health`, et vers `FLEET_ALERT_URL` si cette variable est définie dans `/etc/fleet/health.env`.
- Failover DNS : désactivé (`FLEET_DNS_FAILOVER=0`). Pour l'activer, il faut un token Cloudflare `Zone.DNS:Edit` (`CF_API_TOKEN`) et `/etc/fleet/dns-failover.tsv` (zone, record, IP de repli). Le repli valable aujourd'hui est fr1, qui garde ses vhosts nginx en rollback tant que rosegriffon-52 n'a pas confirmé.

## Réinstallation d'un nœud

1. Réinstaller l'image du fournisseur : Ubuntu 26.10 pour fr1 et fr2, Arch pour prd. Poser `authorized_keys`, et `00-fleet.conf` pour sshd.
2. Restaurer `/etc/wireguard`, `/etc/nginx` (fr2), `/etc/letsencrypt` (fr2) et `/etc/systemd/system/fleet-*` depuis la dernière sauvegarde R2.
3. Déployer `infra/fleet/bin/*` vers `/usr/local/bin`, `infra/fleet/systemd/*` vers `/etc/systemd/system`, puis `systemctl enable --now` des timers.
4. fr1 : `infra/fleet/fr1/sysctl` et `limits`, puis `install-build-deps.py --no-prompt --unsupported --no-syms --no-arm --no-chromeos-fonts`, NativeLink `deploy.sh server` puis `deploy.sh worker 10.200.77.1 100000000000 10` (cache sur le subvol btrfs `/home/nativelink-worker`).
5. Lancer `fleet-health.sh` et vérifier qu'il est vert.

## Limites de charge

- fr1 : `build.slice` (MemoryHigh 34G, MemoryMax 38G, oomd kill à 80 % de pression). NativeLink worker en Nice=5.
- prd : `fleet-apps.slice` (CPUWeight 50, MemoryHigh 6G, MemoryMax 8G, oomd) pour commons-relay, aphrody-gpu-depot et agent-relay-broker.
- Transferts : `nice -n 19 ionice -c3`, `--bwlimit` ≤ 10 MB/s vers prd. Avant d'écrire sur une cible qui existe déjà : `rsync --dry-run --itemize-changes`, puis `--backup --backup-dir=<cible>.rsync-backup-<date>`.
