# Flotte aphrody : rôles, état, procédures

État au 2026-11-12, rédigé pendant la migration. Les sources versionnées sont dans `C:\src-merge\infra\fleet\` (branche merge/labs).

## Rôles

| Nœud | Mesh | Public | Fournisseur | Rôle |
|---|---|---|---|---|
| fr1 (`vps-203bea89`) | 10.200.77.1 (hub wg1) | 51.77.147.152, 2001:41d0:404:200::4d8e | OVH VPS (KVM) | Google, Chromium et LLVM uniquement |
| fr2 (`bunos`, alias cdn) | 10.200.77.3 | 51.255.162.6, 2001:41d0:305:2100::a461 | OVH Public Cloud (DMI `OpenStack Nova`, IPv6 OVH) | vhosts, reverse-proxy, CDN, synchro, ACME |
| prd (`srv2116886`, USA) | 10.200.77.5 | 72.60.186.43 | Hostinger | backends applicatifs |
| PC Windows | 10.200.77.2, 10.200.78.2 | – | – | poste |

## Fait

### Frontal web aphrody : fr1 → fr2

- vhosts : `/etc/nginx/sites/{aphrody.com,api.aphrody.com,cdn.aphrody.com,creator.aphrody.com,downloads.aphrody.com,rpbey.fr,omar.aphrody.com}.conf`. Source : `infra/fleet/fr2/nginx/`. Les originaux de fr1 et fr2 sont conservés dans `infra/fleet/fr1-orig/` et `fr2-orig/`.
- backends : les `127.0.0.1:<port>` deviennent `10.200.77.5:<port>` (prd). omar reste sur `127.0.0.1:8793` sur fr2 : c'est un relais vers un tunnel `ssh -R`, le client doit maintenant viser fr2 (`ssh -R 8793:… root@51.255.162.6`).
- un catch-all `*.aphrody.com` → prd:3000 et `*.aphrody.app` → prd:3010 reproduit le serveur par défaut de fr1.
- contenu statique copié dans `/srv/www/` : creator (132M), downloads/files, aphrody-api, aphrody-status, rpbey.fr.
- `conf.d/fleet-api.conf` de fr2 : `api.aphrody.com` est retiré de son `server_name`. Le reste (dbfr, mcp/db.rosegriffon.fr) n'a pas été touché. Sauvegarde : `/root/fleet-api.conf.bak-20261112`.
- test avant bascule, `curl --resolve` vers fr1 puis vers fr2 : mêmes codes HTTP et mêmes tailles sur les 12 URL testées. Avant la migration déjà, aucun port backend n'écoutait sur fr1 : aphrody.com, aphrody.app, downloads, omar et cdn/health répondaient 502 et répondent toujours 502. api /v1/, cdn /, creator et rpbey répondaient 200 et répondent toujours 200.
- vhosts rosegriffon : non touchés, migration gérée par rosegriffon-52. Ceux de fr1 restent en place comme rollback.

### Bascule DNS (Cloudflare, 2026-11-12 ~18:12 UTC)

Valeurs remplacées : `51.77.147.152` → `51.255.162.6` et `2001:41d0:404:200::4d8e` → `2001:41d0:305:2100::a461`. Le proxy Cloudflare reste dans le même état qu'avant.

- zone aphrody.com `963461271f885bc3f3c2bfd586f2b7ba` : `aphrody.com` A (`30ddf6bf…`), `api` A (`1900939c…`), `api` AAAA (`cbaa3d9d…`), `os` A (`a274bd16…`). Tous les CNAME vers `aphrody.com` suivent (cdn, creator, downloads, omar, www…). `vps.aphrody.com` reste sur fr1.
- zone aphrody.app `f4dab237b9811435da6fee0b5b3438d4` : 21 enregistrements A (api, app-*, auth, craft, deploy, git, play, source).
- **rollback** : remettre `content` à l'ancienne valeur (PATCH `/zones/<zone>/dns_records/<id>`). Les vhosts de fr1 sont intacts, le retour est immédiat.
- à faire : rpbey.fr (DNS chez OVH, pas chez Cloudflare) reste servi par fr1 tant qu'on n'a pas d'accès à l'API OVH ou au Manager. Ensuite, passer son certificat en webroot sur fr2.
- dragonballfr.com pointe déjà sur prd : rien à faire.

### ACME

Voir `infra/fleet/ACME.md` : certbot unique sur fr2, DNS-01 Cloudflare, convention `/etc/nginx/sites/<domaine>.conf` et `/etc/nginx/certs/<domaine>`.

### Clé WireGuard du PC (fuite dans aphrody-dev/mesh-vn)

- nouvelle paire générée : `~/.ssh/fleet/wg/wg-win.{key,pub}` (0600, hors dépôt). Clé publique : `08E2m1ElKRNMO2qigTgRoE2X1H8tuwy28LeQqtfpxWc=`.
- l'ancienne clé est encore active. La bascule a été essayée côté serveurs, mais l'installation du tunnel Windows exige une invite UAC (`sudo`) que l'agent ne peut pas valider. Les serveurs sont revenus à l'ancienne clé pour ne pas couper le mesh.
- pour finir, lancer `infra/fleet/wg/rotate-wg-win.sh` dans un terminal interactif. Il installe le client, échange la clé sur fr1 (`wg1`) et prd (`prod`), pinge .1, .5 et .3, et revient en arrière automatiquement en cas d'échec. fr2 n'a pas ce pair.
- mesh-vn : commit `1757fcd`, la clé est retirée du HEAD et `generator.ts` lit `MESH_WG_WIN_PRIVATE_KEY`. `generated/wg-win.conf` n'est plus suivi par git et passe dans `.gitignore`. Le dépôt a été réarchivé. L'historique n'a pas été réécrit : le `filter-repo` décrit dans `docs/publish/BLOCKED.md` attend l'accord du propriétaire.

### fr1 : arrêts déjà faits

- VM Android cuttlefish arrêtée, config dans `~/fr1-archive/cuttlefish/`.
- cron `yolo-clean` désactivé.
- stack nie-sre purgée : son archive est dans `r2:aphrody-archive/fr1/configs/nie-sre-service.tgz` (md5 `43217c59c735dac774906fca9664b95d`, sha256 `20161bbb…ba61`), et l'image docker a été supprimée.
- swarm docker dissous : il n'avait aucun service, et le worker `bunos` était Down.
- archive R2 en cours : `r2:aphrody-archive/fr1/<dossier>` (`~/fr1-r2.sh`, journal `~/fr1-r2.log`), à environ 5 MB/s en ionice idle. Pour 274G, compter de l'ordre de 15 h. Aucune suppression avant une ligne `CHECK <dossier> rc=0`.

### Durcissement ssh

- prd acceptait `PermitRootLogin yes` et `PasswordAuthentication yes`. Ajout de `/etc/ssh/sshd_config.d/00-fleet.conf` (clés uniquement, root en `prohibit-password`), vérification `sshd -t`, reload, puis test d'une nouvelle connexion : OK.
- fr1 et fr2 étaient déjà en clés uniquement (`sshd -T`).
- inventaire des clés autorisées : fr1 root (1), fr1 ubuntu (11 distinctes, dont `aphrody-owner-pc`, `prod-to-vps`, `root@srv2116886`, `bunos-worker`, `achillea-docs-deploy`, `aphrody-cloud`, plus une clé sans commentaire `u13O5I5n…`) ; prd root (6, dont `omara@hostinger…` et `yolo-prod@aphrody`).
- rotation proposée : supprimer la clé sans commentaire et les doublons, puis remplacer `aphrody-owner-pc-unrestricted` (même empreinte que `aphrody-owner-pc`) par une clé par usage.

### INCIDENT 2026-11-12 18:19 UTC : écrasement partiel de prd:~/.aphrody

- en portant aphrody-gpu-depot, `rsync -a` (sans `--delete`) de `fr1:~/.aphrody` vers `prd:/home/ubuntu/.aphrody` a été lancé sans vérifier que prd possédait déjà son propre `~/.aphrody` (1.9G). Il a été interrompu après environ 2 min.
- environ 620 fichiers ont été écrits (ctime 18:19–18:21) : profiles (502), private (64), a2a (14), backup (12), lib (10), config (6), deploy (4), `memory.sqlite`, `db/steam.sqlite`, `google-cookies.json`, `x-session.json`, cookies, data, host, ocr. Une partie était nouvelle, une autre a pu remplacer des versions propres à prd par celles de fr1 (mtime de fr1 conservée).
- aucun snapshot btrfs ni aucune sauvegarde de prd:~/.aphrody n'a été trouvé.
- aucun autre chemin de prd n'a été touché, et le chown final n'a pas tourné. Les répertoires créés par root (protected-backups, qualifications, reports, run, runtimes, secrets, var, workspace) sont vides.
- liste exacte (623 fichiers, tous identiques à fr1 au sha256) : `INCIDENT-2026-11-12-prd-aphrody.md`. Décision : pas de restauration ni de suppression, car aucun service connu n'utilise ce dossier.

### Backends portés sur prd

Détail et checksums dans `FR1-CHROMIUM-HOST.md`.

- commons-relay : `/srv/commons-relay`, sur 10.200.77.5:8766.
- aphrody-gpu-depot : `/srv/aphrody-gpu-depot`, sur 10.200.77.5:8182.
- agent-relay-broker : sur 127.0.0.1:3889.
- les trois tournent dans `fleet-apps.slice` (CPUWeight 50, MemoryMax 8G, oomd).
- compatibilité : `fleet-fwd-{commons,gpu-depot}.socket` sur fr1 (systemd-socket-proxyd). `10.200.77.1:8766` et `:8182` restent valides en attendant que les clients visent 10.200.77.5.
- runner GitHub : non réinstallé (charge de prd ~10 pour 8 cœurs). Il est arrêté sur fr1, sa config est dans R2.

### INCIDENT réseau 2026-11-12 : UDP OVH → prd filtré en amont

- constat : à partir de 18:19:24, le handshake WireGuard prd↔fr1 échoue. fr1 émet bien ses réponses (vu au tcpdump), mais un compteur nft placé en tête de l'input de prd reste à 0 paquet UDP venant de 51.77.147.152. L'ICMP passe toujours. Même chose ensuite depuis fr2. PC→prd (non-OVH) fonctionne.
- déclencheur probable : les gros volumes UDP entrants (rsync à 40 MB/s, puis CAS NativeLink, ~3 GB de fr1 et 1,6 GB de fr2). Le blocage se lève après ~15–20 min. Le pare-feu Hostinger de l'API est vide (`firewall_group_id: null`) : le filtrage est donc probablement l'anti-DDoS du fournisseur. À confirmer avec un ticket Hostinger.
- conséquence : c'est la cause du 000 sur rosegriffon.fr via fr2. fr2 ne joignait plus prd:18080 (upstream `rg_prod_stack`). L'edge fr2 lui-même était sain : depuis prd par l'IP publique, 200 en IPv4 et IPv6 avec `--resolve`.
- corrections :
  1. mesh complet fr1/fr2/prd : prd a un pair direct fr2 (`10.200.77.3/32`) en plus du hub fr1 (`/24`), et fr2 un pair direct prd (`10.200.77.5/32`).
  2. `fleet-wg-failover@` (timer 30 s, sur prd et fr2) : quand le handshake direct a plus de 150 s, la route directe est retirée et le trafic repasse par le hub. Sauvegardes : `*.conf.bak-20261112-{rot,hub,mesh}`.
  3. NativeLink prd → `fleet-tunnel-nativelink` : ssh `-L` en TCP vers l'IP publique de fr1, `NL_SCHED=127.0.0.1`, `BindsTo`.
  4. règle : transferts vers prd en TCP (ssh sur l'IP publique) à 10 MB/s maximum, jamais en vrac sur le mesh.
- constats pour rosegriffon-52 :
  - (a) fr2 : `inet fleet` accepte `tcp dport {22,80,443}` de toutes sources, en IPv4 et IPv6. ufw et nftables.service y sont inactifs.
  - (b) nginx écoute sur `[::]:443` (testé depuis prd en IPv6 : 200).
  - (c) aucun AAAA aphrody ne pointe encore vers fr1, sauf `vps.aphrody.com`, voulu. `api` AAAA a été basculé sur fr2.
  - (d) les plages Cloudflare sont couvertes par la règle 443 ouverte à tous sur fr2.
  - la cause du 000 était fr2 → prd:18080 par le mesh, pas l'edge. L'upstream gagnerait à passer par l'IP publique de prd avec TLS, ou par un tunnel TCP, plutôt que par le mesh UDP.

### Composants flotte (dans `infra/fleet/`)

- `bin/fleet-backup.sh` + `systemd/fleet-backup.{service,timer}` : sur fr1, chaque jour à 03:30 UTC, vers `r2:aphrody-archive/fleet/<hôte>/`, rétention 30 j. Premier passage : fr1 1,2 MB, fr2 139 MB, prd 34 MB.
- `bin/fleet-health.sh` + `systemd/fleet-health.{service,timer}` : sur fr1 et prd, toutes les 2 min. Couvre le mesh, NativeLink, commons, gpu-depot et l'edge fr2. Failover DNS prêt mais désactivé : il faut un token Cloudflare `DNS:Edit` dans `/etc/fleet/health.env`, que l'OAuth MCP ne peut pas créer.
- `bin/fleet-wg-failover.sh` + `systemd/fleet-wg-failover@.{service,timer}`.
- `fr1/` (sysctl, limits, forwards), `prd/` (unités, tunnel, `00-fleet-sshd.conf`), `fr2/nginx/`, `wg/rotate-wg-win.sh`, `ACME.md`, `RUNBOOK.md` (consoles OVH et Hostinger, reboot sécurisé, réinstallation).
- slices : fr1 `build.slice` (MemoryMax 38G, oomd) ; prd `fleet-apps.slice`.

## Reste à faire

- rotation de la clé WireGuard du PC : à lancer par le propriétaire (`wg/rotate-wg-win.sh`, nécessite UAC).
- rpbey.fr : bascule DNS chez OVH, à faire par le propriétaire (Manager OVH, ou token d'API OVH).
- token Cloudflare `Zone.DNS:Edit` et token R2 limité au bucket, à créer par le propriétaire (impossible via l'OAuth MCP). Ensuite : activer le failover DNS et déplacer `fleet-backup` sur fr2.
- ticket Hostinger au sujet du filtrage UDP depuis les IP OVH.
- clés ssh : supprimer la clé sans commentaire `u13O5I5n…` et les doublons dans `fr1:~ubuntu/.ssh/authorized_keys`.
- alertes : choisir un canal (`FLEET_ALERT_URL`).
- fr1 : supprimer les données archivées au fil des `CHECK rc=0` (voir `FR1-CHROMIUM-HOST.md`).
