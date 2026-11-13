# Preuve : la flotte survit au reboot, au crash et au kill (2026-11-13)

Ordre du propriétaire : « tout src doit survivre au reboot, au down ou au crash des VPS ». Code : `infra/fleet/bin/fleet-resilience.sh` et `infra/fleet/<hôte>/resilience.conf`, recettes `just fleet-resilience apply|check`, `just fleet-restore-test`, `just fleet-rebuild` et `just fleet-resilience-proof` ; procédures dans `infra/fleet/RUNBOOK.md` ; inventaire par hôte dans `docs/infra/RESILIENCE.md`. Journaux bruts des reboots : `docs/infra/resilience/`.

## Inventaire : ce qui ne revenait pas seul (avant)

| Hôte | Constat | Correction |
|---|---|---|
| fr1 | runner CI `actions.runner.aphrody-dev-src.fr1` sans `Restart=` | drop-in Restart=always ; runner `fr1` en ligne dans aphrody-labs/src (`gh api .../actions/runners`), revenu tout seul après kill -9 |
| fr1 | `srv-yolo_build_cache.{automount,mount}` en échec : la source sshfs a disparu de fr2 | désactivées |
| fr1 | unités utilisateur `bunos-auto-*`, `yolo-worker` en échec : sources supprimées | désactivées |
| fr1 | `/home` (btrfs) sans `nofail` | `nofail,x-systemd.device-timeout=30s`, validé par `findmnt --verify` |
| fr2 | nginx `Restart=no` ; cloudflared et fail2ban en on-failure ; fail2ban arrêté depuis 20 h (start-limit-hit) | Restart=always partout, fail2ban relancé |
| fr2 | `yolo-worker` en boucle de redémarrage (Redis 127.0.0.1:16379 absent ; fr2 est réservé à l'edge) | désactivé |
| fr2, prd | docker sans `live-restore` : un kill -9 de dockerd sur fr2 a tué les 3 conteneurs, qui ne sont pas revenus | `live-restore: true`, rechargé par SIGHUP sans relancer les conteneurs ; heal qui relance les conteneurs compose tués par un redémarrage du daemon |
| prd | `aphrody-agents` (tmux du runner, utilisateur agent) en échec après un OOM ; pull bloqué par un `index.lock` périmé | `OOMPolicy=continue`, Restart=on-failure, purge du verrou de plus de 10 min (`infra/agents/systemd`) |
| prd | `user@1000` en échec (OOM), cloudflared, litellm, loreserver et relais en on-failure | reset, Restart=always |
| prd | relais ai-os lancé depuis `/root/src`, copie `git archive` sans git | checkout git partiel et sparse `/srv/src`, `src-checkout-update.timer` (`--ff-only`, restart si `packages/ai-os` change, rollback si l'unité ne démarre pas) ; `/root/src/{packages,infra,third_party}` supprimés. `rosegriffon*` et `rg-e2e` (checkouts git en cours d'usage) sont conservés |
| prd | `lore-r2-backup` : rclone en nice 0, 16 transferts (charge à 113) | drop-in BATCH : Nice 19, I/O idle, CPUWeight 10, 2 transferts, 4 checkers, 10 MB/s, `flock /var/lock/aphrody-heavy.lock` ; même régime pour fleet-backup, shenron-*-backup, rg-cdn-sync, auto-sauvegarde |
| les 3 | sauvegarde seulement depuis fr1, préemptible, en clair | chaque hôte se sauvegarde lui-même, 4 fois par jour, en tar.zst chiffré age vers R2, copies SQLite cohérentes |
| les 3 | arrêt non borné | `DefaultTimeoutStopSec=30s`, docker 60 s, watchdog `reboot.target` (`JobTimeoutSec=5min`, `reboot-force`) |
| PC | AphrodyRelay et tunnel WireGuard sans Delayed Start ; WireGuard sans recovery ; tâches `Aphrody\Agents*` non relançables | `infra/fleet/pc/resilience.ps1` : Automatic (Delayed), `sc failure` restart 5/10/30 s, tâches à 999 relances, StartWhenAvailable |

Restent hors périmètre ou ouverts :
- `rg-steam-depot` échoue toutes les heures sur fr1 avec « Aucun depot téléchargeable ». Chaîne Steam de rosegriffon, non modifiée.
- Écoutes lancées à la main sur prd, dans un scope de session : `rg-e2e` (`next start -p 3100`) et `nie-e2e` (8099), des tests e2e d'un autre agent. Elles sont signalées en WARN.
- Failover DNS de l'edge : aucun token `Zone.DNS:Edit` (les tokens de prd et du PC n'ont pas le droit DNS, et `cf accounts tokens` renvoie 403).
- Canal d'alerte `FLEET_ALERT_URL` : non choisi.

## Crash : kill -9 (`infra/fleet/bin/fleet-kill-test.sh`)

| Hôte | Cible | Retour |
|---|---|---|
| fr2 | nginx, cloudflared-fr2, aphrody-cluster-haproxy | 6 s, 7 s, 6 s |
| fr2 | docker, puis containerd (avec live-restore) | 8 s, 6 s ; les conteneurs restent Up |
| fr2 | wg1 supprimé (`ip link del`) | 1 s (fleet-resilience heal) |
| prd | cloudflared-prod, commons-relay, ay-ai-litellm, relais ai-os (root:aphrody-relay) | 5 s, 6 s, 6 s, 6 s |
| fr1 | runner GitHub Actions | 5 s, `fr1 online` |

## Reboot réel, un hôte à la fois

- **fr2**, 03:12:20 UTC. Le reboot a été lancé par la session flotte parallèle avec ce même outillage. ssh est revenu en 40 s, noyau 7.3.0-10. `fleet-resilience check` : 27 OK, 0 FAIL. Le tmux agents est recréé, 3 conteneurs sur 3 tournent, les URL publiques ont gardé leurs codes. Résultat : PASS (`docs/infra/resilience/2026-11-13T0311Z-fr2.txt`).
- **prd**, 03:32:50 UTC. Reboot lancé par la même session (`docs/infra/resilience/2026-11-13T0331Z-prd.txt`), et compté comme preuve : pas de second reboot.
  - Panne pendant l'arrêt : un `dd` (pid 335080) tournait dans une session ssh root ouverte avant le 2026-11-12 18:27, hors de ce chantier. Il était bloqué en état D sur un `fuse_flush`. Il a tenu `session-7094.scope` pendant 90 s de SIGTERM puis 90 s de SIGKILL (« Still around after SIGKILL »). L'arrêt n'a fini qu'à 03:37:22. Le site était en 522 et ssh fermé. L'agent rosegriffon a relancé la VM par l'API Hostinger à 03:41, ce qui a coupé sa chaîne Steam.
  - Corrections : arrêt borné (30 s par unité ou scope, watchdog reboot-force à 5 min), et `infra/fleet/bin/fleet-reboot-precheck.sh` appelé par `fleet-resilience-proof.sh` avant tout reboot. Ce script refuse si le verrou heavy est détenu, si une unité `rg-steam-*` ou `rg-steam-initial` est active, si un build tourne (cargo, ninja, siso, clang…) ou s'il existe des processus en état D. Il annonce la fenêtre dans l'index NHITL (`var/agents/nhitl.sqlite`, `maintenance_window`) et la referme à la fin.
  - Reprise mesurée : boot à 03:41:47, userspace prêt en 1 min 48. Ensuite, sans aucune intervention :
    - `fleet-resilience check` : 39 OK, 0 FAIL, `systemctl --failed` vide (le `rg-steam-post` de la chaîne coupée a été réinitialisé) ;
    - 28 conteneurs sur 28 en marche. Le 29e d'avant le reboot était le conteneur ponctuel `rg-steam-verify` (`compose run`), exclu désormais du contrôle des politiques de restart ;
    - tunnels cloudflared-prod et mig-prd, wg-quick@prod et @vps, relais ai-os sur `/srv/src`, tmux agents (8 fenêtres) ;
    - `rg-steam-depot.timer` armé (prochain passage 04:00), `rg-steam-fill.service` reprenable en place.
  - Santé publique : aphrody.com, aphrody.app, api.aphrody.com/v1/health, dragonballfr.com, rosegriffon.fr, ai.aphrody.com et cdn.aphrody.com répondent tous 200.
- **fr1** : non redémarré (hôte des builds Chromium, hors de la demande).

## Sauvegardes et restauration (`just fleet-restore-test <hôte>`)

| Hôte | Archive | Fichiers | SQLite intègres |
|---|---|---|---|
| fr2 | `20261113T0316Z.tar.zst.age` (152 MB) | 1585 | 1/1 |
| prd | `20261113T0331Z.tar.zst.age` | 11738 | 6/6 |
| fr1 | `20261113T0304Z.tar.zst.age` (1,3 MB) | 1964 | aucune base listée |

Chaque archive est déchiffrée sur l'hôte avec l'identité age du PC (fichier tmpfs 0600, effacé ensuite). Les trois chemins témoins sont présents : `etc/fstab`, `resilience.conf` et la clé credstore. Reconstruction : `just fleet-rebuild fr2 --dry-run` déroule le plan complet (sshd, bootstrap, archive `20261113T0259Z` via prd, couche flotte, cluster, runner, contrôles).

## Revue

Gemini : 12/20 (`docs/reviews/gemini-2026-11-13-fleet-resilience.md`). Défauts 1, 3, 4 et 7 corrigés ; 5 et 6 sont couverts par le canal d'alerte ci-dessous.

## Suite (04:00 à 04:30 UTC)

- **Alertes** : `infra/fleet/bin/fleet-notify.sh` sert de notifier unique. `fleet-notify.timer` (5 min, sur les trois hôtes) prend les erreurs journald des tags flotte et les unités en échec. Chaque cause est normalisée (nombres et SHA retirés), puis envoyée par mail via Resend : clé d'envoi seule, limitée à aphrody.com, `FLEET_RESEND_KEY` poussée par le coffre vers prd, fr2 et fr1. Destinataire : contact@aphrody.com. Une alerte par cause et par 24 h, comme `ay auth daemon`. Test d'envoi réussi depuis prd ; le second envoi de la même cause a été supprimé.
- **Bascule DNS de l'edge** : `fleet-dns-failover.sh` est appelé par fleet-health sur prd (`FLEET_DNS_FAILOVER=1`, jeton `fleet-prd-dns`). Il se déclenche quand l'edge est hors service 3 passages de suite et que fr2 ne répond plus en ssh ; le retour sur fr2 se fait après 3 passages sains. Avant de basculer un enregistrement, il vérifie que l'origine de repli sert ce nom avec un certificat valide. `plan` du 2026-11-13 : seuls dbfr.aphrody.com (A et AAAA) et nie.aphrody.app pointent encore sur fr2. Ni prd (443 = conteneur `shenron-gateway`, réseau hôte) ni fr1 ne servent ces noms avec un certificat valide : en cas de panne de fr2, ils resteraient sur fr2 et une alerte « no valid standby » partirait. Le reste du trafic passe par les tunnels Cloudflare répliqués et les Workers, sans dépendre de fr2.
- **Reboot de fr1** : `fleet-reboot-precheck.sh fr1` a refusé à 04:18 (verrou heavy pris, cargo et rustc en cours). Le reboot est armé pour le prochain créneau libre : `fleet-reboot-when-idle.timer` (contrôle toutes les 10 min par `fleet-host-idle.sh`, puis reboot et désarmement), fenêtre annoncée dans l'index NHITL.
- **Checkout `/srv/src`** : fr1 et fr2 sont à jour (`SRC_RESTART` absent toléré). Sur prd, le relais ai-os de `main` ne démarre pas : `packages/vault` lève une erreur sur `systemd-creds encrypt` dans l'unité du relais. Le garde-fou est revenu au commit précédent (b1a7f43) et le relais reste actif. L'unité `src-checkout-update` reste en échec, ce qui déclenche une alerte par 24 h, jusqu'à la correction de `packages/vault`.
