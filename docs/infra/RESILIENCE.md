# Résilience de la flotte (reboot, arrêt, crash)

Décision propriétaire 2026-11-13 : tout ce que src fait tourner sur fr1, fr2 et prd revient seul après un reboot,
un arrêt ou un crash du VPS, et les agents ont le root complet (NHITL). Preuve : reboots réels, un hôte à la fois,
archivés dans [resilience/](resilience/) (`just fleet-resilience-proof <fr1|fr2|prd>`).

## Mécanismes

| Exigence | Mise en œuvre | Source |
|---|---|---|
| Unités systemd `enable`, `Restart=always`, `RestartSec` | drop-in `50-fleet-resilience.conf` (Restart=always, 5 s, StartLimit 20/600 s, oneshot : on-failure) sur chaque unité listée | `infra/fleet/bin/fleet-resilience.sh`, `infra/fleet/<hôte>/resilience.conf` (`just fleet-resilience apply`) |
| `WatchdogSec` | non posé : aucun service listé n'émet `WATCHDOG=1` (cloudflared 2026.10.7 : chaîne `WATCHDOG_USEC` absente du binaire ; dockerd, bun, loreserver : pas de sd_notify watchdog). Remplacé par les sondes HTTP de `fleet-resilience.sh heal` (3 échecs → restart), appelé par `fleet-health.timer` | `PROBES=` des `resilience.conf` |
| Docker | `docker.service`, `docker.socket`, `containerd.service` activés ; tous les conteneurs en `restart: unless-stopped` (vérifié par `check`) | `common.sh resilience`, `fleet-resilience.sh` |
| Linger + systemd --user | linger `agent` (et `ubuntu`, `root` où ils ont des unités) ; unités utilisateur listées dans `USER_UNITS` | `common.sh agent_user`, `resilience.conf` |
| tmux `agents` recréé | `aphrody-agents.service` (oneshot, `Restart=on-failure`, `OOMPolicy=continue`) + `aphrody-agents-health.timer` (OnBootSec=1min, toutes les 2 min) qui répare la session et les fenêtres | `infra/agents/systemd/` |
| État hors `/tmp` | `check` refuse toute unité listée dont ExecStart/WorkingDirectory/EnvironmentFile est sous `/tmp` ; signale les écoutes lancées à la main (scope de session) | `fleet-resilience.sh check` |
| journald persistant | `/etc/systemd/journald.conf.d/10-aphrody.conf` `Storage=persistent` (+ `SystemMaxUse`), les autres drop-ins perdent leur `Storage=` (fr1 avait `zz-vps-limits.conf` en `volatile`), `journalctl --flush` | `common.sh resilience` |
| Montages | `nofail` (+ `x-systemd.device-timeout=30s`) sur les montages secondaires listés dans `NOFAIL=` ; `findmnt --verify` avant installation | `fleet-resilience.sh` |

Rollback en une ligne : `rm /etc/systemd/system/<unité>.d/50-fleet-resilience.conf && systemctl daemon-reload` ;
journald : `rm /etc/systemd/journald.conf.d/10-aphrody.conf && systemctl restart systemd-journald`.

## Agents : root complet

Claude Code refuse `bypassPermissions` en uid 0 sans sandbox : les agents tournent sous `agent` sur les trois hôtes,
`sudo NOPASSWD: ALL` par `/etc/sudoers.d/aphrody-agent` (validé `visudo -cf` puis `visudo -c`), membre de `docker`,
linger. fr1/fr2 : `agent` créé le 2026-11-13, logins CLI (`~/.claude/.credentials.json`, `~/.codex/auth.json`,
`~/.config/gh/hosts.yml`) et checkout copiés depuis `ubuntu`, runner d'`ubuntu` retiré (un runner par hôte).
CLI en accès complet, clés vérifiées sur les versions installées : Claude Code 2.1.323 `permissions.defaultMode =
"bypassPermissions"` + `skipDangerousModePermissionPrompt` ; codex 0.167.2 `approval_policy = "never"`,
`sandbox_mode = "danger-full-access"` (valeurs de `codex --help`) ; opencode 1.19.5 `"permission": "allow"`. pi 1.5.2
n'a pas de garde de permissions. gemini-cli 0.68.0 (non installé sur la flotte) ignore `defaultApprovalMode=yolo`
dans settings.json (code lu) : accès complet par `--approval-mode yolo` seulement. Le runner passe déjà les drapeaux
(`infra/agents/runner.ts`). Code : `infra/fleet/bootstrap/common.sh` (`agent_user`, `agent_runner`,
`agent_cli_fullaccess`), `infra/agents/bootstrap-user.sh`. Rollback : `sudo rm /etc/sudoers.d/aphrody-agent`.

## Inventaire (2026-11-13)

### prd (backends)

- systemd : nginx, docker, aphrody-cluster-haproxy (agent cluster, TCP 7444 mTLS), agent-relay-broker,
  aphrody-gpu-depot, commons-relay, ay-ai-litellm, cloudflared-prod, cloudflared-mig-prd, loreserver,
  shenron-cdn-origin, shenron-manga-publication, wii-os-shenron, shenron-compose (oneshot `compose up -d`),
  fleet-firewall ; timers fleet-health, fleet-backup, lore-r2-backup, certbot-renew, shenron-*-backup.
- utilisateur : root `aphrody-relay.service` ; agent `aphrody-agents*` (tmux `agents`), `aphrody-upstream.timer`.
- conteneurs (tous `unless-stopped`) : compose `aphrody-src` (aphrody, ai-os relay/gateway, api-gateway, cdn,
  downloads), compose `shenron` (`/srv/shenron` : chat = llama-server shenron-chat-v2, conteneur 16a08e08, embed,
  compute, gateway, site, bot, postgres, redis, cloudflared), compose `rosegriffon`, pile `auto-*` (docker run).
- retiré (2026-11-13) : nativelink-worker + fleet-tunnel-nativelink (REAPI sur fr1), builder BuildKit
  `buildx_buildkit_aphrody0`, conteneur bunlfs en pause, toolchains (rustup, cargo, go, zig, .NET, sccache, clang/llvm,
  cmake, ninja…), caches (`/srv/build`, `/srv/bunlfs`, cargo-xwin, zig, playwright, cache bun) ; `aphrody-heavy`
  refuse tout job (exit 64) hors fr1.

### fr2 (edge)

- systemd : nginx, cloudflared-fr2, aphrody-cluster-haproxy, docker, earlyoom, fail2ban, fleet-firewall,
  fr2-edge-fw ; timers fleet-health, fleet-backup, fleet-wg-failover@prd, certbot (ACME).
- utilisateur : agent `aphrody-agents*` (rôles linter, sre) ; ubuntu `yolo-worker` (crawler YOLO, à déplacer avec
  le produit yolo).
- conteneurs : compose `aphrody-src` profil edge (api-gateway, cdn, downloads), `unless-stopped`.
- retiré : nativelink-worker (REAPI sur fr1).

### fr1 (usine)

- systemd : nginx, docker, containerd, aphrody-cluster-haproxy, nativelink-server, nativelink-worker, fail2ban,
  runner CI `actions.runner.aphrody-dev-src.fr1` (dépôt aphrody-labs/src, en ligne depuis le 2026-11-13).
- utilisateur : agent `aphrody-agents*` (rôles lourds : coder, tester, linter, build, chromium, training, plus reviewer, designer, sre) ; ubuntu : outils Chromium/LLVM.
- jobs lourds : `aphrody-heavy` (flock unique, charge < 2/3 nproc, nice 19, ionice idle, `-j nproc/3`).

## Preuves de reboot (2026-11-13)

Ordre : fr2, puis prd (fr2 servait), puis fr1 ; garde du script : jamais deux reboots à la fois, aucun hôte ni pair
démarré depuis moins de 15 min. Santé avant/après : `curl --resolve <vhost>:443:127.0.0.1` sur chaque hôte, URL
publiques (Cloudflare) dont `https://api.aphrody.com/v1/health`.

| Hôte | Retour ssh | Avant → après | Public pendant le reboot | Verdict |
|---|---|---|---|---|
| fr2 | 40 s (prêt 131 s) | check 27 OK/0 FAIL → 27/0 ; 3/3 conteneurs ; tmux `agents` recréé (03:12:55) ; journald `/var/log/journal` ; vhosts et public identiques | 3/3 sondes sans nouvel échec (prd servait) | PASS ([log](resilience/2026-11-13T0311Z-fr2.txt)) |
| prd | 550 s (arrêt 4 min 30 : sessions root bloquées, `dd` en D, puis ~4 min hors noyau chez Hostinger ; sshd à +18 s du noyau 7.2.14) | check 37/2 FAIL → 38/1 FAIL (seul FAIL : `rg-steam-post.service`, rosegriffon) ; 28 conteneurs de prod revenus dont `shenron-chat` (llama-server) ; tmux `agents` recréé (03:41:51) ; vhosts et public identiques ; bbr+fq actifs (module absent avant reboot : noyau mis à jour sans reboot) | 0/13 : aucun basculement, tout le public dépend de prd | PASS fonctionnel ; le script dit FAIL car 29 → 28 conteneurs : le manquant est `rg-steam-verify`, job ponctuel rosegriffon sans politique de redémarrage ([log](resilience/2026-11-13T0331Z-prd.txt)) |
| fr1 | non lancé | check 30 OK/0 FAIL, 4/4 conteneurs, tmux `agents`, journald persistant (avant) | - | NOT RUN : `fleet-reboot-precheck.sh` refuse tant que des builds d'autres agents tournent (cargo/rustc, verrou heavy tenu) ; à relancer par `just fleet-resilience-proof fr1` à la première fenêtre libre ([log](resilience/2026-11-13T0357Z-fr1.txt)) |

Suites : `DefaultTimeoutStopSec=45s` posé sur prd et fr2 (`common.sh sysctl_serve`) pour raccourcir l'arrêt ;
pas de repli public pendant un reboot de prd (backends uniques) : relève du LB cluster (docs/infra/CLUSTER.md) et de
l'agent fr2 Cloudflare. Écoutes manuelles signalées et non persistantes par nature : tests e2e rosegriffon sur prd
(`/root/src/rg-e2e`, `/tmp/nie-e2e`), `craft-stage-serve.ts` sur fr2.

## Repli public sans prd (2026-11-13 04:45)

Sur les 10 URL sondées, 7 ne dépendent pas de prd (Workers + R2, rpbey.fr sur fr1) ; les 3 autres sont maintenant
couvertes : ai.aphrody.com par des conteneurs aphrody de secours sur fr1/fr2 (serveurs HAProxy `backup`,
`infra/cluster/standby.sh`) ; dragonballfr.com et rosegriffon.fr par la copie en cache que Cloudflare sert périmée
quand l'origine tombe (règle `aphrody-origin-stale` ; rosegriffon passe en origine 9443, le cache est désactivé sur 8443).
Postgres de secours et nouveau reboot de mesure : non faits. Détail, cause des 550 s de ssh et retours arrière :
[resilience/2026-11-13T0445Z-prd-failover.txt](resilience/2026-11-13T0445Z-prd-failover.txt).
