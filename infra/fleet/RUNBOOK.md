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

- Chaque hôte se sauvegarde lui-même : `fleet-backup.timer` (03:30, 09:30, 15:30, 21:30 UTC, `Persistent`). L'unité tourne en Nice 19, I/O idle, CPUWeight 10, rclone limité à 2 transferts et 10 MB/s ; sur prd, sous `flock /var/lock/aphrody-heavy.lock`. Contenu : `BACKUP_PATHS` de `infra/fleet/<hôte>/resilience.conf` (`/etc` avec les credstores systemd-creds, la clé hôte `/var/lib/systemd/credential.secret`, unités et credstores utilisateur, état applicatif), plus une copie cohérente (`sqlite3 .backup`) de chaque base de `BACKUP_SQLITE`, rangée sous `.fleet-sqlite/<chemin>` dans l'archive.
- Chiffrement age vers `infra/fleet/backup-age.pub`. L'identité reste sur le PC (`~/.ssh/fleet/backup-age.key`, 0600, hors dépôt). Destination : `r2:aphrody-archive/fleet/<hôte>/<UTC>.tar.zst.age`, rétention 30 j.
- Test de restauration : `just fleet-restore-test <hôte>`. La dernière archive est déchiffrée sur l'hôte (identité passée par ssh dans un fichier tmpfs 0600, effacé ensuite), puis `PRAGMA integrity_check` de chaque base et contrôle de `/etc/fstab`, `resilience.conf` et de la clé credstore.
- Restauration manuelle : `rclone cat r2:aphrody-archive/fleet/<hôte>/<f>.tar.zst.age | age -d -i backup-age.key | zstd -d | tar -x -C /restore`.
- Lore : sauvegarde horaire `lore-r2-backup` vers `r2-lore:aphrody-lore`, même régime de priorité (drop-in `BATCH`).

## Résilience (reboot, crash, kill)

- `just fleet-resilience apply|check [pc fr2 prd fr1]` pousse `infra/fleet/bin`, les timers et `<hôte>/resilience.conf`, puis lance `fleet-resilience.sh apply` :
  - drop-in `50-fleet-resilience.conf` sur `SERVICES` : Restart=always (on-failure pour un oneshot), RestartSec 5 s, StartLimit 20/600 s, network-online ;
  - `enable --now` des `TIMERS`, `wg-quick@` enabled avec Restart=on-failure, linger et unités utilisateur (`USER_UNITS`) ;
  - docker `live-restore` : sans lui, un crash de dockerd tuait les conteneurs sans les relancer (constaté sur fr2) ; politique `unless-stopped` des conteneurs compose ;
  - `nofail` sur les montages secondaires (`NOFAIL`), unités mortes désactivées (`DISABLE`, `DISABLE_USER`), priorité basse des sauvegardes et synchros (`BATCH`).
  Le filtrage reste `fleet-firewall` (`/etc/fleet/firewall.nft`) ; `check` vérifie qu'ufw et nftables.service restent inactifs.
- Pas de `WatchdogSec` : aucun de ces services n'émet `WATCHDOG=1`. Les sondes HTTP `PROBES` de `fleet-resilience.sh heal` (3 échecs : restart) en tiennent lieu.
- prd : le relais ai-os tourne depuis le checkout git en lecture seule `/srv/src` (clone partiel et sparse), tenu à jour par `src-checkout-update.timer` (10 min, `--ff-only`, redémarrage du relais si `packages/ai-os` change).
- PC : `infra/fleet/pc/resilience.ps1`. AphrodyRelay et WireGuard en Automatic (Delayed Start) avec recovery restart 5/10/30 s ; tâches `Aphrody\Agents*` et `ay-ai-*` relançables, StartWhenAvailable.
- Crash : `bash infra/fleet/bin/fleet-kill-test.sh <hôte> <unité|user:unité|wg:iface>...`. Reboot réel : `just fleet-resilience-proof <hôte>` (un seul à la fois, verrou sur le PC, refus si un hôte a booté depuis moins de 15 min).

## Santé et alertes

- `fleet-health.timer` (2 min) sur fr1, fr2 et prd. Il lance d'abord le self-heal local, puis contrôle chaque pair par ssh sur IP publique (`HEAL_PEERS`) : un pair dégradé ou dont le timer est arrêté est réparé à distance ; un pair injoignable est compté et alerté. Il vérifie ensuite le mesh, les ports `FLEET_TCP` et l'edge fr2 (`curl --resolve`). Les échecs vont dans journald, tag `fleet-health`, et vers `FLEET_ALERT_URL` si cette variable est définie dans `/etc/fleet/health.env`. La bascule de service entre hôtes est celle du LB cluster (`infra/cluster`, pools HAProxy fr1/fr2/prd).
- Authentifications et accès réseau (ssh, WireGuard, cloudflared, unités de renouvellement, secrets CI) : `ay auth status` depuis le PC, `ay auth repair` pour réparer sans mot de passe, `ay auth tunnels` pour les jetons cloudflared (systemd-creds). Détail : `docs/infra/AUTH.md`.
- Failover DNS : désactivé (`FLEET_DNS_FAILOVER=0`). Pour l'activer, il faut un token Cloudflare `Zone.DNS:Edit` (`CF_API_TOKEN`) et `/etc/fleet/dns-failover.tsv` (zone, record, IP de repli). Le repli valable aujourd'hui est fr1, qui garde ses vhosts nginx en rollback tant que rosegriffon-52 n'a pas confirmé.

## Réinstallation d'un nœud

1. Réinstaller l'image du fournisseur (Ubuntu 26.10 pour fr1 et fr2, Arch pour prd) avec la clé ssh du PC.
2. `just fleet-rebuild <hôte>` (`--dry-run` pour voir le plan) :
   - sshd en clés seules, puis `just fleet-bootstrap` ;
   - restauration de la dernière archive R2, récupérée par un pair et déchiffrée sur le PC. Sont conservés de l'image neuve : machine-id, clés d'hôte ssh, fstab, grub et réseau. Les bases SQLite sont remises en place ;
   - `just fleet-resilience apply`, `just cluster-deploy`, `just agents-install` ;
   - enfin check, fleet-health, sauvegarde et test de restauration.
3. fr1 seulement : `infra/fleet/fr1/sysctl` et `limits`, `install-build-deps.py --no-prompt --unsupported --no-syms --no-arm --no-chromeos-fonts`, NativeLink `deploy.sh server` puis `deploy.sh worker 10.200.77.1 100000000000 10` (cache sur le subvol btrfs `/home/nativelink-worker`).

## Limites de charge

- fr1 : `build.slice` (MemoryHigh 34G, MemoryMax 38G, oomd kill à 80 % de pression). NativeLink worker en Nice=5.
- prd : `fleet-apps.slice` (CPUWeight 50, MemoryHigh 6G, MemoryMax 8G, oomd) pour commons-relay, aphrody-gpu-depot et agent-relay-broker.
- Transferts : `nice -n 19 ionice -c3`, `--bwlimit` ≤ 10 MB/s vers prd. Avant d'écrire sur une cible qui existe déjà : `rsync --dry-run --itemize-changes`, puis `--backup --backup-dir=<cible>.rsync-backup-<date>`.
