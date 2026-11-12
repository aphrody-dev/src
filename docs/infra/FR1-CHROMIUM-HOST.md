# fr1 : hôte dédié Chromium, ChromiumOS, LLVM et noyau

fr1 = `vps-203bea89`, OVH VPS KVM, 51.77.147.152, mesh 10.200.77.1. 12 vCPU Haswell (x86-64-v3), 45 Go de RAM, Ubuntu 26.10. Disques : `/dev/sda1` ext4 290G (`/`, `/srv`) et `/home` btrfs sur sdb1+sdc1 (805G). Fait le 2026-11-12.

Secours OVH : Manager OVH > VPS `vps-203bea89.vps.ovh.net` > redémarrage en mode rescue, ou console KVM (`ttyS0` et `tty1`). En rescue, `/` = `/dev/sda1`. Voir `infra/fleet/RUNBOOK.md`.

## Avant / après

| | Avant (17:46 UTC) | Après (19:05 UTC) |
|---|---|---|
| Noyau | 7.3.0-9-generic, uptime 13 j | 7.3.0-10-generic, défaut GRUB permanent. 7.3.0-9 conservé (`apt-mark manual`) comme secours |
| Services hors Chromium | runner GitHub, nginx (frontal de tous les domaines), smbd/nmbd, waydroid, lxc, seatd, accounts-daemon, cuttlefish (VM Android crosvm 8G/4 vCPU, 7 j), docker nie-* (3 conteneurs), swarm manager, commons-relay, aphrody-gpu-depot, upki-fetch, lancache nft, snapd, cron yolo-clean | Tout est arrêté et désactivé (accounts-daemon masqué). Reste nginx, gardé comme rollback des vhosts RG (rosegriffon-52) et pour rpbey.fr (DNS OVH) |
| Services Chromium | nativelink-server | nativelink-server, plus nativelink-worker (10 jobs, cache 100 GB sur le subvol btrfs `/home/nativelink-worker`), `aphrody-factory` installé |
| Services en exécution | 31 | 29 (fr1-archive-r2 et nativelink-worker ajoutés) |
| Disque `/` | 165G utilisés, 122G libres | idem (`/srv/chromium` reste sur `/`) |
| Disque `/home` | 448G utilisés, 326G libres | idem tant que l'archive R2 n'est pas vérifiée (aucune suppression faite) |
| RAM disponible | 37 Go | 43 Go (`doctor`) |
| sysctl | 13 drop-ins contradictoires (yolo, shenron, gaming, lxc…) | un seul : `/etc/sysctl.d/90-fr1-chromium-host.conf`. Les anciens sont dans `/etc/sysctl.d/.disabled-20261112/` |

## Migrations (destination et vérification)

| Élément | Destination | Vérification |
|---|---|---|
| vhosts aphrody (aphrody.com, api, cdn, creator, downloads, omar, catch-all `*.aphrody.{com,app}`) + statique | fr2 `/etc/nginx/sites/`, `/srv/www/` | `curl --resolve` fr1 vs fr2 : mêmes codes et tailles sur 12 URL ; puis test public après bascule DNS (FLEET.md) |
| rpbey.fr | reste sur fr1 (DNS OVH) | **Action du propriétaire** : basculer l'A vers 51.255.162.6 dans l'interface OVH, ou fournir un token d'API OVH. Le vhost et le certificat sont déjà prêts sur fr2 |
| commons-relay | prd `/srv/commons-relay` (uv tool agent-commons 0.4.0, unité système, `fleet-apps.slice`) | `relay.db` sha256 `d42904c3…a2bd` identique ; HTTP 401 (jeton requis) via prd et via le forward de compatibilité `fr1:10.200.77.1:8766` |
| aphrody-gpu-depot | prd `/srv/aphrody-gpu-depot` (lib + token, unité système) | écoute sur 10.200.77.5:8182 (401 sans jeton) et via le forward fr1:8182. Le bundle a été patché pour accepter 10.200.77.5 (original : `product.mjs.orig-20261112`). Le dossier de modèles épinglés était déjà absent sur fr1 |
| agent-relay-broker | prd (unité système, `127.0.0.1:3889`, état dans `~/tools/agent-coordination/state`) | actif. L'instance de fr1 vivait dans une session d'agent : elle a disparu au reboot |
| runner GitHub `fr1` (aphrody-dev/src) | non réinstallé, car prd est trop chargé (load ~10 pour 8 cœurs). Config dans `r2:aphrody-archive/fr1/configs/actions-runner-config.tgz` | md5 `d7f82694…0b7c24` identique local/R2 ; GitHub voit le runner `offline` |
| stack nie-sre (vide) | purgée après archivage `r2:aphrody-archive/fr1/configs/nie-sre-service.tgz` | md5 `43217c59…5d` identique |
| cuttlefish | arrêtée, config dans `~/fr1-archive/cuttlefish/`, `cuttlefish-host-resources` désactivé, limites `@cvdnetwork` retirées | les 40 interfaces cvd-* ont disparu au reboot |
| `/etc` complet | `r2:aphrody-archive/fr1/configs/fr1-etc-20261112.tgz` (3 535 entrées), puis chaque jour `r2:aphrody-archive/fleet/fr1/` | md5 `841f53c4…cbc04e` identique |
| unité runner | `r2:aphrody-archive/fr1/configs/fr1-units.tgz` | md5 `6e3a1206…29a` identique |
| Données lourdes (yolo-snapshots, yolo-work, yolo-jobs, yolo-current, `~/re`, `~/.aphrody`, `~/apps`, `/var/lib/yolo-cache`, ~274G) | `r2:aphrody-archive/fr1/<dossier>` via `fr1-archive-r2.service` (rclone `--checksum`, puis `rclone check --one-way`, reprise automatique au boot) | **en cours** (~5,6 MB/s en ionice idle, 17,8G faits à 18:51). Suppression sur fr1 uniquement après une ligne `CHECK <dossier> rc=0` dans `~/fr1-r2.log` |

## Réglages et sources

- Mises à jour : `apt-get full-upgrade` (APT-OK). Le candidat `linux-image-generic` est 7.3.0-10.10. La 7.3.0-11.12 vue sur Launchpad (KERNELS.md) n'est pas encore dans l'archive configurée, d'où un conflit de sources : Launchpad la montre, `apt-cache policy` ne la propose pas.
- Dépendances Chromium : `build/install-build-deps.py --no-prompt --unsupported --no-syms --no-arm --no-chromeos-fonts` depuis `/srv/chromium/src` (src@4b3d0dab). `--unsupported` est nécessaire parce que le script ne liste que les LTS (22.04, 24.04, 26.04) et Debian ≥ 11. Résultat : `--quick-check` sans paquet manquant (avant : lighttpd, xcompmgr, xserver-xorg-video-dummy). Le `lighttpd.service` installé au passage est désactivé.
- Noyau : CachyOS **pas compilé**, on reste sur Ubuntu generic. Raison (KERNELS.md, Phoronix 2026-06-02 et 06-04) : le gain CachyOS vient surtout de la compilation et compte peu pour une charge user-space comme clang ou siso. Sur un petit VPS KVM, un noyau maison « apporte peu, coût de maintenance élevé ». Reconstruire un noyau à chaque mise à jour de sécurité serait aussi en concurrence avec les builds Chromium pour 12 vCPU. Un noyau `aphrody-labs/linux` + CachyOS (clang ThinLTO, x86-64-v3) reste possible plus tard, en .deb construit hors des heures de build, avec la même procédure `grub-reboot`.
- sysctl (`infra/fleet/fr1/sysctl/90-fr1-chromium-host.conf`) :
  - inotify watches 2 097 152 et instances 8 192 ; `file-max`/`nr_open` 4 194 304 ; `vm.max_map_count` 2 147 483 642 ; `pid_max` 4 194 304 ;
  - `kernel.apparmor_restrict_unprivileged_userns = 0`, pour le sandbox Chromium et les tests lancés depuis `out/`, ainsi que `cros_sdk`. Ubuntu ≥ 24.04 restreint les userns via AppArmor ;
  - `vm.nr_hugepages` 512 → 0 : 1 Go épinglé sans aucun consommateur hugetlbfs ;
  - swappiness 100, adapté à zram 12G en priorité 100 plus le swapfile 8G en priorité 10 ;
  - `perf_event_paranoid = 1` pour le profilage ;
  - réglages réseau (bbr/fq) et durcissement repris des anciens fichiers.
- Limites : `/etc/security/limits.d/90-chromium-build.conf`, nofile 1 048 576 et nproc 262 144. `ulimit -n` vaut maintenant 1 048 576 pour ubuntu ; avant c'était 32 768 à cause de `@cvdnetwork`.
- THP : `madvise`, inchangé. I/O : `none` (virtio), correct. Gouverneur CPU : sans objet (KVM).
- Montages : `/` ext4 `noatime,commit=30` et `/home` btrfs `noatime,compress=zstd:1,discard=async,space_cache=v2` étaient déjà conformes. `fstrim.timer` est actif. Pas de tmpfs de build : le pic F0 de 19,8 GiB plus des actions de 3 GB demandent la RAM pour compiler.
- KVM : `/dev/kvm` est présent, `kvm_intel nested=Y`, 24 entrées `vmx` dans cpuinfo. `cros vm` est donc utilisable.
- Slices : `build.slice` (MemoryHigh 34G, MemoryMax 38G, oomd à 80 %) était déjà en place. Le worker NativeLink tourne en Nice=5.
- NativeLink : `deploy.sh worker 10.200.77.1 100000000000 10` (1.8.5). Le cache est sur le btrfs `/home`, avec un bind mount `/home/nativelink-worker` → `/var/lib/private/nativelink` dans fstab : `/` n'a que 122G libres et doit garder la place pour `src` et `out`.
- Factory : `aphrody-factory` compilé sur fr1 (`cargo build --release -p aphrody-factory`, sha256 `1242e26b…a85b`) dans `/srv/chromium/factory/bin/`. Configs `factory.toml`, `args/`, `systemd/` et `third_party/` déployées avec `rsync --dry-run --itemize-changes` puis `--backup-dir=/srv/chromium/factory.rsync-backup-20261112`. Deux fichiers ont été remplacés par les versions de labs et leurs anciennes versions y sont gardées : `args/labs_agent.gn` et `third_party/chrome-channels.toml`.

## Reboot (journal)

1. Vérifié avant : `ssh.socket`, `wg-quick@wg1`, `fleet-firewall`, `fleet-mesh-forward`, `fail2ban`, `nativelink-*` et `fstrim.timer` démarrent au boot. ufw et nftables.service ne sont pas activés.
2. `GRUB_DEFAULT=0` → `saved` (sauvegarde `/etc/default/grub.bak-20261112`). Défaut fixé sur 7.3.0-9, puis `grub-reboot` en coup unique vers 7.3.0-10.
3. 18:52:48 UTC : `systemd-run --on-active=5 systemctl reboot`. 18:53:41 : ssh OK, uptime 0 min, `uname -r` = 7.3.0-10-generic, `next_entry` vide.
4. Contrôles : les 9 unités critiques sont actives ; ping 10.200.77.1, .2, .3 et .5 OK ; 3 workers NativeLink connectés ; `fleet-health.sh` OK sur fr1 et sur prd ; une seule unité en échec, `lighttpd`, désactivée.
5. `aphrody-factory doctor` : tout est OK sauf un WARN, `worker prd connected=false`. C'est un artefact : le worker de prd passe désormais par un tunnel ssh TCP et apparaît donc sous l'adresse 10.200.77.1. On le voit dans `ss` sur :50061 (3 connexions). Le WARN disparaîtra quand `doctor` identifiera les workers par nom plutôt que par IP.
6. Défaut GRUB rendu permanent sur 7.3.0-10 après ces contrôles.

## Reste

- Supprimer de fr1 chaque dossier archivé dès que la ligne `CHECK <dossier> rc=0` apparaît, puis mettre à jour ce document avec la taille libérée.
- Retirer les vhosts aphrody de fr1 une fois rpbey.fr basculé, et les vhosts RG une fois que rosegriffon-52 a confirmé. Après ça, arrêter nginx sur fr1.
- `doctor` : identifier les workers par nom.
