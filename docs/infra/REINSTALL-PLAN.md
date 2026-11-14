# Plan de reinstallation complète de la flotte (usa/prd, fr1, fr2)

Statut : PLAN, rien n'est exécuté. Scripts prêts, non lancés : `infra/fleet/reinstall/` (garde `CONFIRM=REINSTALL-<hôte>`). Mesures du 2026-11-14 via `ay ssh exec all` (lecture seule). Tout ce qui est marqué "À VÉRIFIER" n'a pas de source vue dans la session.

## 1. État actuel

| | usa (prd) | fr1 (usine) | fr2 (edge) |
|---|---|---|---|
| Hébergeur | Hostinger VPS 2116886 | OVH VPS (disques QEMU) | OVH Public Cloud (Nova) |
| CPU / RAM | 8c / 31G (12G utilisés) | 12c / 45G | 6c / 11G |
| OS / noyau | Arch, 7.2.14-arch1-1 | Ubuntu 26.10, 7.3.0-10-generic | Ubuntu 26.10, 7.3.0-10-generic |
| Disques | sda 400G : 1M bios, 300M /efi, 399.7G btrfs `/` (209G utilisés) | sda 300G ext4 `/` (249G, 87 %), sdb 500G + sdc 305G btrfs `/home` (805G, 547G utilisés) | sda 100G ext4 `/` (72G, 75 %) |
| /dev/kvm | ABSENT (pas de virt imbriquée : pas de KVM natif sur usa) | présent | présent |
| WireGuard | `wg-quick@vps` + `wg-quick@prod` (10.200.77.5) | `wg-quick@wg1` (10.200.77.1/24, hub) | `wg-quick@wg1` (10.200.77.3) |
| Services | docker (32G), nginx, `cloudflared-prod`, `cloudflared-mig-prd`, ~20 conteneurs (shenron-postgres, shenron-chat, auto-*, rosegriffon-*, aphrody-src-*) | docker, nginx, `nativelink-server`, `nativelink-worker`, `cloudflared-mig-prd`; `/srv/chromium` 57G | docker, nginx, `cloudflared-fr2`, `cloudflared-mig-prd` |
| Données critiques | `/srv/shenron` 14G (dont models), PostgreSQL | rien d'irremplaçable hors git (caches, targets, checkout Chromium) | `/srv/*` (aphrody-cdn, dbfr, www, ...) |
| dd 1 GiB direct (écr. / lect.) | 1.0 GB/s / 697 MB/s | 1.4 GB/s / 1.2 GB/s | 1.0 GB/s / 1.4 GB/s |
| dd 1 GiB `/dev/shm` | 1.7 GB/s | 1.8 GB/s | 951 MB/s |
| fio | absent | présent | absent |

Notes de mesure : un seul échantillon `dd` de 1 GiB, `oflag/iflag=direct`, disques virtuels (cache hyperviseur possible). Le débit séquentiel du disque est déjà proche de tmpfs (dd monothread) : le gain de tmpfs est la latence et les IOPS, pas la bande passante. Mesure fio 4k/QD à refaire sur fr1 avant de dimensionner (fio absent sur usa/fr2 : `pacman -S fio` après installation).
Mesurés aussi : `vm.vfs_cache_pressure=50`, `vm.dirty_ratio=0` (valeur lue, à reprendre telle quelle ou fixer via `60-hot-tier.sh`), `/dev/shm` = 50 % de la RAM par défaut (23G / 5.7G / 16G).
Mesh réel : fr1 = wg1 10.200.77.1 (hub), fr2 = 10.200.77.3, usa = 10.200.77.5 (`infra/fleet/cache.toml`, `chromium-factory/factory.toml` : NativeLink 10.200.77.1:50051).

## 2. Cible

Distribution unique : Arch Linux (politique skill containers-alpine-arch-k8s : jamais Debian/Ubuntu, Arch pour les hôtes lourds). Noyau : paquet `linux` stable (7.3.x, sortie kernel.org 2026-11-14 : stable 7.3.4, mainline 7.4-rc2, longterm 6.18.63) en entrée GRUB par défaut, 7.4-rc en entrée secondaire (section 6).

Un seul XFS racine par hôte, pas de `/home` ni `/srv` séparés ; seules partitions annexes : bios_grub 1M et ESP 1G vfat montée sur `/boot` (noyaux dans l'ESP, lisible par GRUB BIOS et UEFI).

| Hôte | Disposition |
|---|---|
| fr2 | sda : 1M bios_grub, 1G ESP `/boot`, reste XFS `/` |
| usa | sda : idem (400G, XFS `/`) |
| fr1 | sda3 (~298G) + sdb (500G) + sdc (305G) = un mdraid0 (chunk 512K, metadata 1.2) sous un XFS `/` ; sda garde bios_grub + ESP. Tailles inégales : md en multi-zones, le dernier tiers de débit n'est pas égal sur toute la capacité (comportement md raid0 multi-zone, À VÉRIFIER avec `mdadm --detail` après création). LVM `lvcreate -i3` exigerait des PV égaux : écarté. |

mkfs/mount (non mesurés ici, à valider avec fio avant et après) :
- `mkfs.xfs` défauts conservés (crc, finobt, reflink) ; sur md : `-d su=512k,sw=3` (alignement bande/largeur), source : `man mkfs.xfs` (options `-d su=,sw=`).
- mount `noatime,logbufs=8,logbsize=256k` : `logbsize`/`logbufs` documentés dans `man 5 xfs` ; `inode64` est le défaut. Pas de `discard` en montage : `fstrim.timer` (déjà actif sur les 3 hôtes, RUNBOOK) évite le coût en ligne.
- XFS retenu sur la base de Phoronix 2026 (articles linux-70-filesystems et linux-73-filesystems : XFS meilleur geomean global, cités par le propriétaire, non relus ici) ; on perd compression zstd et snapshots btrfs, assumé (vitesse > snapshots).
- Limite connue : pas de rétrécissement XFS ; mdraid0 = aucune redondance (perte d'un disque = perte de la racine fr1). Acceptable car fr1 ne détient que du reconstructible ; sauvegardes git/R2 inchangées (`fleet-backup.sh`).

Couche chaude RAM (`60-hot-tier.sh`, tmpfs `noswap`) : plafonds par hôte : fr1 12G caches chauds + 4G profils Chrome (sur 45G, pic de build 19.8G mesuré, `factory.toml`) ; fr2 3G (cache nginx chaud) ; usa 2G (12G déjà utilisés par la prod). sysctl : `vfs_cache_pressure=50`, `dirty_background_ratio=5`, `dirty_ratio=20`, `swappiness=100` avec zram existant (RUNBOOK). Sources : `man 5 tmpfs` / doc noyau tmpfs (`size=`, `noswap`), doc noyau `vm.txt` (dirty_*, vfs_cache_pressure). Valeurs = point de départ, à mesurer.

Tier edge fr2 (type PoP Cloudflare) : nginx `proxy_cache` avec `keys_zone` en RAM (métadonnées) et `proxy_cache_path` sur tmpfs `/var/cache/hot` pour le jeu chaud, débordement sur XFS (`/var/cache/nginx-spill`, second `proxy_cache_path` via `split_clients`/`try_files` ou 2e niveau) ; amont à deux niveaux : fr2 -> fr1 (10.200.77.1, cache tiers) -> usa (origine 10.200.77.5) sur WireGuard. nginx est déjà installé sur les trois hôtes ; Pingora (`yolo-cf-gateway`) est l'alternative non retenue ici (À VÉRIFIER hors flotte actuelle). Cloudflare reste devant : `cloudflared` par hôte (unités existantes, jetons restaurés depuis la sauvegarde).

KVM natif : libvirt + qemu-base installés sur fr1 et fr2 (/dev/kvm présent). usa : pas de /dev/kvm, donc qemu en TCG seulement (inutile) : pas de cluster KVM sur usa, et la prod ne doit pas en dépendre. Activer la virtualisation imbriquée chez Hostinger : À VÉRIFIER auprès du support, non documenté dans les résultats vus.

Nix + Docker : paquets `nix` + `docker` + `docker-buildx` ; `/nix` et `/var/lib/docker` sur le même XFS racine (reflink actif : `cp --reflink` accélère les couches overlay2 ; le choix du driver Docker sur XFS : overlay2 exige `d_type` donc `ftype=1`, défaut crc, source doc Docker overlay2 À VÉRIFIER). Flake existant `infra/nix/flake.nix`. fr1 garde BuildKit plafonné (`bootstrap/fr1.sh`, `heavy.sh`).

## 3. Caches partagés (hub fr1, WireGuard)

| Cache | Serveur | Clients | Taille cible | Statut |
|---|---|---|---|---|
| NativeLink CAS + exécution distante | fr1 10.200.77.1:50051 (existant, unités `nativelink-server/worker`), workers fr1 (10), usa (4), fr2 (3) | Chromium, LLVM | 100 GB (arg `deploy.sh worker ... 100000000000 10`) | existant, redéployer avec `deploy.sh` |
| sccache (cargo, aujourd'hui 1.5G fr1) | backend S3 (Garage ou MinIO) sur fr1 :9000 ; sccache supporte S3/redis/webdav | tous, variables `SCCACHE_*` (`50-mesh-caches.sh`) | 30 G | choix du serveur S3 À VÉRIFIER ; couche chaude locale tmpfs |
| Turborepo remote cache | serveur compatible API Turbo (auto-hébergé) sur fr1 :3030 ; `TURBO_API`, `TURBO_TEAM` | tous | 10 G | À VÉRIFIER (impl. choisie ; skill turborepo pour `TURBO_*`) |
| bun install cache + node_modules | local par hôte `/var/cache/bun` ; même FS que `node_modules` pour hardlink/clonefile (bun, skill bun) ; `rsync` du cache depuis fr1 au bootstrap | tous | 3 G (cap de `cache.toml`) | local, pas de serveur |
| Toolchain LLVM/clang | checkout fr1 `/srv/chromium/src/third_party/llvm-build/...` (`kernels.toml`, clang 24.0.0git 86922d51) ; autres hôtes : paquet Arch `clang`/`lld` ou tarball synchronisé | usa/fr2 ne compilent pas (règle bootstrap) | 2 G | existant |
| Nix substituter | `nix-serve`/`harmonia` sur fr1 :5000 | tous | 20 G | À VÉRIFIER |

Aucun port exposé publiquement : tout écoute sur l'adresse wg (10.200.77.0/24). Tout cache est reconstructible : une perte d'hub ne bloque pas (retour au calcul local).

## 4. Chrome : proxy et CDP synchronisés

Constat : `infra/chromium-factory/` build Chromium sur fr1 (`headless_shell`, `out_name labs_agent`) ; aucun endpoint CDP déclaré dans le repo (grep `9222|cdp` : seule mention CDP Tracing dans `args/labs_agent.gn`). Skill `chrome` = Chrome du PC, non applicable aux VPS.
Conception : sur chaque hôte, `headless_shell --remote-debugging-address=127.0.0.1 --remote-debugging-port=9222` sous unité systemd, profil sous `/var/lib/chrome-profiles` (tmpfs 4G sur fr1). Exposition mesh uniquement par proxy TCP lié à l'adresse wg (nginx `stream` ou `systemd-socket-proxyd`, modèle déjà utilisé : `fleet-fwd-*.socket`) ; une entrée `chrome.<hôte>.mesh` listée dans `mesh-vn` (`topology.ts`). Binaire identique sur les hôtes : publié par fr1 (factory) et tiré par `rsync` vers fr2/usa (même révision, pas de build). Proxy sortant : fr2 est l'edge ; le trafic Chrome passe par le sortant de fr2 via un proxy HTTP (`proxy_pass`/squid, À VÉRIFIER) pour une IP stable. Un registre `/etc/fleet/cdp.json` (hôte, port, révision) est synchronisé par `agents-sync.sh`.

## 5. Ordre des opérations (roulant)

Principe : un hôte à la fois, mesh et prod toujours en vie ; chaque étape a un critère de passage et un retour arrière.

0. Préflight, lecture seule : `00-preflight.sh` sur les 3 hôtes ; `fleet-health.sh` ; `fleet-reboot-precheck.sh <hôte>`. Sauvegarde `fleet-backup.sh` vérifiée (restauration test).
1. fr2 (edge, premier) : bascule DNS/Cloudflare du trafic fr2 vers usa+fr1 (`fleet-dns-failover.sh`, test à blanc `fleet-dns-failover-test.sh`) ; copie `/srv/*` (72G) et `/etc/{nginx,cloudflared,wireguard}` vers R2 + fr1 ; réinstallation (section 7) ; `20-arch-install.sh` puis `50` et `60` ; `just fleet-rebuild fr2` (`--dry-run` d'abord) ; contrôle `wg show`, nginx, `cloudflared`, retour du trafic. Le mesh reste complet via fr1/usa ; `fleet-wg-failover@` assure le chemin.
2. fr1 (usine) : pause CI/builds (aucun ninja/siso, `heavy.sh` libre), suspension du worker NativeLink (usa/fr2 repliés sur le local). Inventaire de `/home` (531 G utilisés ; essentiel : sources/repos en git, `/srv/chromium` 57G re-synchronisable par gclient/`ay gclient sync`, targets reconstructibles) ; archive R2 de l'irremplaçable. fr1 est le hub WG (10.200.77.1) : conserver `/etc/wireguard/wg1.conf` et la clé privée hors hôte (R2 chiffré, `backup-age.pub`) ; pendant l'arrêt, fr2 et usa gardent le tunnel via `fleet-wg-failover` (À VÉRIFIER : doit tester la perte du hub avant de lancer). Réinstallation OVH (section 7), `20-arch-install.sh` (md racine sda3+sdb+sdc, XFS), `50`, `60`, `bootstrap/fr1.sh` à adapter à pacman (il utilise apt aujourd'hui : TÂCHE de portage, non faite), NativeLink `deploy.sh server`/`worker`, noyau 7.4-rc buildé ici (section 6).
3. usa (production, dernier) : fr1 et fr2 déjà sur Arch/XFS, hub opérationnel, staging disponible sur fr1. Voir section 8.
4. Après chaque hôte : `fleet-health.sh`, `fleet-resilience.sh`, test de restauration. Critère d'arrêt : un contrôle rouge stoppe la suite.

Durées indicatives (non mesurées) : fr2 ~1 h, fr1 ~3 à 5 h (rsync/restauration des caches), usa ~1 à 2 h de coupure planifiée.

## 6. Noyau 7.4-rc

Sources : kernel.org releases.json 2026-11-14 : mainline 7.4-rc2 (2026-11-09), stable 7.3.4, longterm 6.18.63 ; `infra/linux/patchsets.toml` (pins `mainline = 7.4-rc2`, `stable = 7.3.4`) ; outil `ay linux build <flavor> [--run]` (`infra/linux/kernels.toml`, `infra/linux/build/kernel.sh` : conteneur CachyOS, `nice 19`, fr1 ou CI, jamais usa ; s'arrête si un build Chromium tourne).
Écart : `kernels.toml` n'a pas de flavor "mainline-rc" (flavors : prd, desktop-v3/v4, kvm-v3, prd-autofdo, basés sur linux-cachyos) ; il faut ajouter un flavor ou confirmer que linux-cachyos suit 7.4-rc (À VÉRIFIER avant). `kernels.toml` note aussi que fr1/fr2 restaient sur le noyau Ubuntu : cette décision est remplacée par le présent plan.
Risques d'un rc : régressions FS/réseau/virtio, pas de correctifs de sécurité stabilisés, module out-of-tree (wireguard est in-tree, OK) ; un rc ne doit pas être le noyau par défaut de la prod.
Garde-fous (`40-kernel.sh`) : `linux` stable Arch reste installé et par défaut (`GRUB_DEFAULT=saved`) ; le rc est armé en `grub-reboot` (un seul essai, panne = retour sur le stable au redémarrage suivant) ; `panic=30` sur l'entrée rc ; console série `ttyS0` (OVH/Hostinger, RUNBOOK) ; rc d'abord sur fr2, puis fr1, usa seulement après des jours sans régression. Politique : usa ne démarre jamais sur un rc sans fenêtre dédiée.

## 7. Méthode de réinstallation par hébergeur

- OVH VPS (fr1) : mode rescue depuis le Manager (`RUNBOOK.md` ; identifiants par e-mail). Une réinstallation standard depuis le panel efface le disque système et conserve les disques additionnels (docs OVHcloud, relayé par la recherche web) mais Arch n'est plus proposé et l'upload d'image n'est pas disponible aux VPS (blog Dimoulis, https://www.dimoulis.net/posts/install-arch-linux-on-ovh-vps/ ; ArchWiki "Arch Linux on a VPS", https://wiki.archlinux.org/title/Arch_Linux_on_a_VPS). Méthode retenue : rescue (Debian), `20-arch-install.sh` (bootstrap Arch + pacstrap chroot) ; alternatives sourcées : kexec depuis le rescue (https://lochnair.net/2022/08/08/using-kexec-to-boot-into-another-distro-from-ovh-rescue-mode/), ISO sous QEMU (https://community.ovhcloud.com/t/installing-operating-system-from-custom-image-on-ovh-vps-centos-8-tutorial/35253). En rescue le disque système est `/dev/sda`, sdb/sdc les additionnels ; vérifier avec `lsblk` : la garde `not_mounted` refuse les disques montés. Réseau : l'hôte a une IPv4 en /32 avec route on-link (`ip -br a` : 51.77.147.152/32 sur ens3, metric 100) : après pacstrap, systemd-networkd en DHCP doit récupérer cette configuration ; À VÉRIFIER dans le rescue avant de sortir (sinon console KVM web).
- OVH Public Cloud (fr2) : instance Nova ; rescue (`openstack server rescue`, image rescue-pro, RUNBOOK) puis même script, ou rebuild avec une image Arch cloud si elle existe dans le catalogue (À VÉRIFIER). Disque unique sda 100G.
- Hostinger VPS (usa) : API `POST /api/vps/v1/virtual-machines/{id}/recreate` (template_id entier, `post_install_script_id` optionnel, irréversible, supprime les snapshots ; https://docs.hostinger.com/api-reference/endpoints/vps/virtual-machine/recreate-virtual-machine) ; mode recovery `POST .../recovery` (disque d'origine monté sur /mnt, `root_password` temporaire ; sortie par `DELETE` ; https://docs.hostinger.com/api-reference/endpoints/vps/recovery/start-recovery-mode). Aucun ISO personnalisé trouvé ; usa est déjà Arch, donc deux voies : (a) recreate avec le template Arch (liste des `template_id` À VÉRIFIER via l'API) puis `20-arch-install.sh` adapté (formatage XFS en recovery, sda3 remplacé), (b) recovery + `20-arch-install.sh` directement. Jeton `HOSTINGER_API_TOKEN` (PC, jamais affiché).

## 8. usa : sécurité de la production

Avant : staging sur fr1 (XFS neuf). `10-usa-backup.sh` : `pg_dumpall --globals-only` + `pg_dump -Fc` par base et par conteneur postgres (shenron-postgres, auto-postgres, rosegriffon-inagle-pg-1...), vérification `pg_restore -f /dev/null` de chaque dump (le script échoue sinon), somme de contrôle, `rsync --dry-run` puis copie `--bwlimit=10m` de `/srv/shenron` (14G, models inclus) et des configs (`/etc/{nginx,cloudflared,wireguard,fleet}`). Rien n'est supprimé sur usa ; `/srv/shenron/models` jamais touché (AGENTS shenron section 6). Contrôle final `rsync --checksum --dry-run` = 0 différence.
Bascule : restauration des dumps sur fr1 en standby chaud (`just cluster-deploy`/`infra/cluster/standby.sh`), puis `fleet-dns-failover.sh` vers fr1 (Cloudflare) ; test préalable `fleet-dns-failover-test.sh`. Le tunnel `cloudflared-prod` est répliqué par `cloudflared-mig-prd` (présent sur les 3 hôtes, état actif mesuré).
Fenêtre : annonce, gel des écritures (arrêt de shenron-bot/chat/gateway), dump final delta, vérification, bascule DNS, réinstallation, restauration (`pg_restore` réel), `just fleet-rebuild usa`, `cluster-deploy`, tests de santé, retour DNS.
Retour arrière : tant que le disque n'est pas reformaté, annuler = retour DNS (rien changé). Après reformatage : la production continue sur fr1 en standby ; si la nouvelle usa échoue, elle reste hors DNS et on la reconstruit (ou recreate Hostinger du template Arch) ; aucun point de non-retour pour les données car dumps vérifiés + copie checksum sur fr1 + R2.
Limite : usa a 12G de RAM déjà utilisés et pas de KVM ; fr1 en standby doit tenir la charge prod (45G RAM, 12c) : à valider par test de charge avant la fenêtre.

## 9. Risques et points ouverts

1. fr1 md raid0 sur 3 disques virtuels : tout disque perdu = racine perdue ; assumé.
2. Hub WG (fr1) en arrêt : valider le chemin fr2/usa avant (`fleet-wg-failover`).
3. `bootstrap/*.sh` (apt) à porter vers pacman : non fait ; `20-arch-install.sh` installe seulement la base.
4. Aucune des étapes d'installation n'a été testée : première exécution sur fr2, en `--dry-run` quand l'outil le permet.
5. Gemini 4 Carbon High : validation du livrable à soumettre (hors portée de cet agent) ; verdict à archiver dans `docs/infra/`.
