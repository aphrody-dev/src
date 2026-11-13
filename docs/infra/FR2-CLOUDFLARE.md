# fr2 et Cloudflare : inventaire, cible, migration, preuves (2026-11-13)

Périmètre : fr2 (`ssh fr2`, OVH, 51.255.162.6 / 2001:41d0:305:2100::a461, wg1 10.200.77.3). Inventaire (sections 1 et 4, état « avant ») relevé le 2026-11-13 entre 02:10 et 02:40 UTC ; état « après » et preuves (section 5) : un seul run horodaté, 03:15 UTC, après un vrai redémarrage de fr2 à 03:13 (agent résilience) (ssh, API Cloudflare, `cf` 1.0.0-beta.31). Configuration : `infra/cloudflare/cloudflare.toml`, appliquée par `bun infra/cloudflare/cf.ts`. Preuves : `just cf-proof`. Précédents : `CLOUDFLARE-ONE.md` (pilote `mig-`), `MIGRATION-VERCEL-CF.md` (Workers), `HOSTING-POLICY.md`.

## 1. Inventaire de fr2 (avant migration, lecture seule)

| Élément | État relevé |
|---|---|
| Ports (`ss -ltnup`) | publics : tcp 22 (sshd), 80/443 (nginx), udp 45667 (wg1). Loopback : 18797 (relais nginx vers mig-downloads), 28081/28796/28797 (docker), 64859 (bun, runner d'agents nt-d6), 53 (resolved), 33697 (containerd) |
| Pare-feu | `table inet fleet` (priorité -10, `/etc/fleet/firewall.nft` + `fleet-firewall.service`, générateur de l'ancien dépôt Bun OS disparu : copie versionnée dans `infra/fleet/fr2/nftables/firewall.nft`, désormais la source) : 22/80/443 ouverts à tous, udp 443/45667, fleet IP acceptées, reste jeté. ufw inactif (chaînes vides ; paquet purgé le 2026-11-13), `inet f2b-table` (fail2ban, jail sshd, actif au 2026-11-13 03:00) |
| WireGuard | wg1 :45667, pair hub fr1 (10.200.77.0/24) + pair prd (10.200.77.5/32), `net.ipv4.ip_forward=1`, `fleet-wg-failover@prd.timer` |
| Docker (`/srv/aphrody-src/compose.yaml`, profil edge) | `downloads` (r2-site, 127.0.0.1:28797), `api-gateway` (127.0.0.1:28081), `cdn` (r2-site, 127.0.0.1:28796), tous healthy : repli self-host des Workers (HOSTING-POLICY) |
| Unités systemd actives | nginx, docker, containerd, nativelink-worker, earlyoom, cron, ssh, qemu-guest-agent, systemd-* ; binaire `/usr/local/bin/cloudflared` 2026.10.7 sans unité |
| Timers / cron | certbot, upki-fetch, fleet-wg-failover@prd, apt/logrotate/fstrim/dpkg/tmpfiles ; crontabs root/ubuntu vides ; `/etc/cron.d` : certbot, e2scrub_all |
| Certificats `/etc/letsencrypt/live` | avant : 19 certificats Let's Encrypt, 17 configurations de renouvellement (15 dns-cloudflare, 2 webroot : api.aphrody.com, cdn.dragonballfr.com) et 2 sans configuration : achillea.rosegriffon.fr (expiré le 2026-11-10, utilisé par aucun vhost) et aphrody.app (lien `/etc/nginx/certs/aphrody.app`). Après (2026-11-13 03:10) : achillea purgé ; aphrody.app réémis (`aphrody.app` + `*.aphrody.app`, dns-cloudflare, avec configuration) ; api.aphrody.com réémis en dns-cloudflare (HTTP-01 impossible derrière `fr2-edge-fw` et le Worker) ; cdn.dragonballfr.com déjà dns-cloudflare. Total : 18 certificats, 18 configurations, tous en DNS-01 |

### Vhosts nginx (`/etc/nginx/sites`, `conf.d`)

| Fichier | server_name | Upstream / contenu | Trafic réel avant migration |
|---|---|---|---|
| sites/aphrody.com.conf | aphrody.com, www | proxy 10.200.77.5:3000 (rien n'écoute) | aucun : Worker `aphrody` (route `aphrody.com/*`) et domaine perso www |
| idem | aphrody.app, www | proxy 10.200.77.5:3010 (rien n'écoute) | aucun : Worker `aphrody-app-site` |
| idem | `*.aphrody.com` | proxy :3000 → **502** | ~30 CNAME proxifiés → aphrody.com + A os → fr2 |
| idem | `*.aphrody.app` | proxy :3010 → **502** | 21 A proxifiés → fr2 (api, auth, craft, deploy, git, play, source, 14 app-*) |
| sites/api.aphrody.com.conf | api.aphrody.com | JSON statique + 8 proxys prd (8788, 29030, 8794, 8797, 8796, 8083, 8791, 8790) | fleet-health uniquement (public = Worker `api-aphrody-com`) |
| sites/cdn.aphrody.com.conf | cdn.aphrody.com | avant : fonts prd:8796 ; après : LB cluster `127.0.0.1:19796` (conteneur local 28796 d'abord, puis fr1/prd), limit_req | fleet-health uniquement (public = Worker `cdn-aphrody-com`) |
| sites/creator.aphrody.com.conf | creator.aphrody.com | statique `/srv/www/creator.aphrody.com` | fleet-health uniquement (public = Worker) |
| sites/downloads.aphrody.com.conf | downloads.aphrody.com | avant : `127.0.0.1:18797` → relais `mig-tunnel.conf` → Cloudflare → prd:8797 (reboucle par Cloudflare) ; après : LB cluster `127.0.0.1:19797` (conteneur local 28797 d'abord) | aucun (public = Worker) |
| sites/rpbey.fr.conf | rpbey.fr, www | statique | aucun : DNS chez OVH, A = fr1 (action propriétaire) |
| sites/rosegriffon.fr.conf | rosegriffon.fr, `*.rosegriffon.fr` | proxy https 72.60.186.43:443 | aucun : DNS rosegriffon.fr → prd en direct (sauf cdn) |
| conf.d/rosegriffon-cdn.conf | cdn.rosegriffon.fr, nie.aphrody.app | proxy 72.60.186.43:8443 | oui (proxifié CF) : **rosegriffon-52, non touché** |
| conf.d/fleet-api.conf | dbfr.aphrody.com, mcp/db.rosegriffon.fr | JSON statique, `/v1/*` → 10.200.77.1:8080 (mort) | dbfr.aphrody.com en **DNS-only** vers fr2 (A + AAAA) |
| conf.d/mig-tunnel.conf | 127.0.0.1:18797 | https://mig-downloads.aphrody.com | supprimé le 2026-11-13 (plus aucun upstream ne l'utilisait) |

### DNS du compte pointant vers fr2 (avant)

| Zone | Enregistrements | Proxifié |
|---|---|---|
| aphrody.com | A `aphrody.com`, A `os` ; 33 CNAME → `aphrody.com` (admin, ai, art, auth, bot, bxc, cad, calendar, chat, console, control, design, docs, drive, fig, inacord, mail, maps, mcp, meet, n2b, nie, pdf, photos, play, search, sheets, slides, sound, status, store, translate, yohan) | oui |
| aphrody.com | A + AAAA `dbfr` | **non** (IP de fr2 publique) |
| aphrody.app | A api, auth, craft, deploy, git, nie (rosegriffon-52, non migré), play, source, app-{audio, cad, compositing, documents, generation, images, interface-layouts, layout, pdf, photo-processing, slides, tables, vectors, video} | oui |
| rosegriffon.fr | A `cdn` | oui (rosegriffon-52) |
| dragonballfr.com, 3dland.tech | rien vers fr2 (tunnel shenron-dbfr, prd) | – |

Clients directs de l'origine (access.log) : fleet-health de fr1 et prd (`--resolve` sur 51.255.162.6), le PC et des scanners (51.159.5.6 : `pearcmd`, `/containers/json`).

## 2. Cible : une fonction de fr2, un produit Cloudflare

| Fonction fr2 | Produit Cloudflare retenu | État |
|---|---|---|
| Sites statiques (aphrody.com, aphrody.app, creator, cdn, downloads) | Workers + Static Assets / R2 (`r2-site`), cache de zone (règles `aphrody-origin-cdn`, `aphrody-r2-*`) | fait avant (MIGRATION-VERCEL-CF) |
| api.aphrody.com (catalogue + passerelle) | Worker `api-aphrody-com` | fait avant |
| Reverse-proxy vers prd (`*.aphrody.com` :3000, `*.aphrody.app` :3010) | **Tunnel `mig-prd` en direct** (CF → cloudflared prd → 127.0.0.1), sans passer par fr2 | **fait** |
| Rewrites/limites nginx (`limit_req`, deny) | règles WAF custom `fr2-block-probes` + rate limiting `fr2-rl-edge` (400 req / 10 s / IP+colo) | **fait** |
| Origine publique 80/443 | ouverte seulement aux plages Cloudflare + flotte + wg1 (`fr2-edge-fw`) ; limite connue : toute zone Cloudflare tierce peut viser 51.255.162.6 ; seul Custom AOP (certificat client propre à la zone, `ssl_verify_client` par vhost) authentifierait la zone, à poser vhost par vhost (pas rosegriffon-cdn) | **fait** |
| SSH d'administration | Access : apps `fr2-ssh` / `prd-ssh` (type ssh, rendu navigateur) via tunnels `fr2` et `mig-prd` ; un jeton de service par hôte et par sens pour les agents (`fleet-agents-fr2` → ssh-prd, `fleet-agents-prd` → ssh-fr2 ; `cloudflared access ssh`, secret lu par `TUNNEL_SERVICE_TOKEN_*`, jamais en argv) ; 22 public gardé en secours | **fait** (22 public toujours ouvert ; fermeture planifiée à J+7, réservée à la flotte et wg1, jamais aux plages Cloudflare) |
| UI admin prd (gpu-depot, commons-relay) | Access `mig-prd-admin` | fait (pilote) |
| Hub WireGuard + forwarding | reste sur VPS (pas d'équivalent sans WARP sur le PC) | conservé intact |
| Repli self-host (conteneurs edge, vhosts api/cdn/creator/downloads) | reste sur fr2, servi via les LB cluster (conteneurs locaux d'abord) ; la bascule passe par les pools cluster, **pas** par le DNS (`proxied:false` serait jeté par `fr2-edge-fw` ; `FLEET_DNS_FAILOVER` reste à 0) | conservé |
| Répartition / basculement entre hôtes | couche cluster (agent `adc9aa05cb92c46bc`, `infra/cluster/`) : répliques du même tunnel avec ingress → port LB local | à faire par cet agent |

Le double saut CF → fr2 → prd est supprimé : plus aucun nom ne résout vers fr2 (tout est en anycast Cloudflare) ; fr2 ne reste origine que de `dbfr.aphrody.com` (passerelle shenron statique, proxifiée), `nie.aphrody.app` et `cdn.rosegriffon.fr` (rosegriffon-52).

## 3. Implémentation (code)

- `infra/cloudflare/cloudflare.toml` : tunnels (ingress), DNS, règles de zone (par `ref`), Access. Seuls les objets listés sont gérés, rien d'autre n'est touché.
- `infra/cloudflare/cf.ts` : `plan` (diff en lecture seule, par défaut) / `apply <dns|tunnels|rules|access> [--only <nom>]`. DNS : réécriture sur place (PUT, pas de trou), jamais de suppression avant ajout. Auth : `CLOUDFLARE_API_TOKEN` du coffre (`just cf-plan|cf-apply|cf-proof` passent par `env-kit secret exec`) ; un jeton présent mais refusé arrête tout (plus de repli silencieux vers le login super-admin) ; OAuth de `cf` seulement sans jeton ou avec `CF_AUTH=oauth`.
- `infra/cloudflare/fleet-token.ts` + `just cf-fleet-token` : un jeton de compte par hôte (`fleet-fr2-dns`, `fleet-prd-dns`), Zone Read + DNS Write sur aphrody.com et aphrody.app seulement, 1 an, posé dans `/etc/aphrody/secrets.env` (`CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN` de fleet-health) et vérifié (`/zones` 200) ; rotation idempotente.
- Access : un jeton de service par hôte (`fleet-agents-fr2` sur fr2, `fleet-agents-prd` sur prd) ; chaque app liste les jetons qu'elle accepte (`ssh-prd` ← fr2, `ssh-fr2` ← prd), les UI d'admin aucun. L'ancien jeton partagé `fleet-agents` est supprimé.
- `infra/cloudflare/tunnel-token.ts` : jeton de connecteur vers stdin de `systemd-creds encrypt` (refuse un terminal).
- `infra/cloudflare/proof.ts` + `just cf-proof` : 97 vérifications, code de sortie 1 en cas de régression ; codes HTTP attendus figés par nom (`expected-status.json`, réécrit seulement par `--record` après revue) ; `/api` de l'apex ; portée des jetons (usage inverse et admin refusés). `just cf-plan` : diff.
- fr2 : `infra/fleet/fr2/systemd/cloudflared-fr2.service` (jeton en credential chiffré `/etc/credstore.encrypted/cloudflared-fr2`), `infra/fleet/fr2/bin/fr2-edge-fw.sh` + `fr2-edge-fw.{service,timer}` (plages CF rafraîchies chaque jour, dernière copie valide gardée).

Après la revue Gemini : ingress `mig-*` repointées sur les ports LB de la couche cluster (19780, 19797, 19182, 19766 ; HAProxy sur fr1/fr2/prd, `docs/infra/CLUSTER.md`), apps Access `aphrody-admin`/`aphrody-control` (admin/control.aphrody.com, 502 avant, désormais servis par prd), pare-feu étendu à UDP 80/443 (QUIC), `Before=nginx.service`, `OnBootSec=2min`.

Objets créés : tunnel `fr2` `88aa6a53-0a9a-4a5b-a9b6-3d3394dd978d` (4 connexions cdg) ; ingress `mig-prd` + `ssh-prd`, `aphrody.com`, `*.aphrody.com` → 127.0.0.1:19300 (LB cluster aphrody ; à la création : 127.0.0.1:23000), `*.aphrody.app` → 127.0.0.1:3010 ; CNAME `ssh-fr2`, `ssh-prd` ; règles `fr2-block-probes` (aphrody.com, aphrody.app), `fr2-rl-edge` ; jetons de service `fleet-agents-fr2` / `fleet-agents-prd` (un par hôte, secret seulement sur cet hôte ; l ancien `fleet-agents` partagé est supprimé), politiques `fleet-agents-<hôte>-token` (non_identity), apps `fr2-ssh`, `prd-ssh`.

## 4. Migration service par service (testée avant chaque bascule)

Ordre : ingress ajoutée → noms de test temporaires `fr2mig-check.aphrody.{com,app}` → tunnel (200 côté .com depuis le conteneur aphrody, joint alors en direct sur prd:23000 ; 502 côté .app comme avant) → supprimés → `admin.aphrody.com` seul (200) → tout le reste → pare-feu (garde `systemd-run` de 180 s qui supprimait la table en cas d'échec, annulée après vérification) → règles → Access.

| Service | Avant | Après | Retour arrière (une ligne) |
|---|---|---|---|
| 33 CNAME `*.aphrody.com` (rétablir l'apex d'abord, sinon le CNAME suit le tunnel) | CF → fr2 → prd:3000 mort : 502 | CF → tunnel mig-prd → LB 127.0.0.1:19300 → conteneur aphrody : 200 (ou 404/502 rendu par le Worker `aphrody-webos` sur ses routes) | `cf dns records update <id> -z 963461271f885bc3f3c2bfd586f2b7ba --body '{"type":"CNAME","name":"<h>","content":"aphrody.com","proxied":true}'` |
| apex `aphrody.com` | A fr2 proxifié (origine des CNAME), Worker devant | CNAME tunnel (aplati), Worker devant (`/api/*` = 503 rendu par le Worker, pas d'appel origine constaté) | `cf dns records update 30ddf6bf26060e3685b6fe9e904a8589 -z 963461271f885bc3f3c2bfd586f2b7ba --body '{"type":"A","name":"aphrody.com","content":"51.255.162.6","proxied":true}'` |
| `os.aphrody.com`, 21 A `*.aphrody.app` | A fr2 → 502 | CNAME tunnel → prd (os 404 Worker, .app 502 : rien sur :3010) | `cf dns records update <id> -z <zone id> --body '{"type":"A","name":"<h>","content":"51.255.162.6","proxied":true}'` |
| `dbfr.aphrody.com` | DNS-only, IP de fr2 exposée | proxifié (Full strict, cert `*.aphrody.com`), 200 | `cf dns records update 2c516fd0569eaa8b9c5d226ff3e740bd -z 963461271f885bc3f3c2bfd586f2b7ba --body '{"type":"A","name":"dbfr.aphrody.com","content":"51.255.162.6","proxied":false}'` puis idem AAAA 4237ac589c90e889d7cf6f3a6371dd18 (`2001:41d0:305:2100::a461`) |
| Pare-feu origine fr2 | 80/443 ouverts à tous | Cloudflare + flotte + wg1 ; 251 paquets jetés dans les 10 premières minutes de l'activation (compteur remis à zéro à chaque rechargement, cf. section 5) | `ssh fr2 'sudo systemctl disable --now fr2-edge-fw.timer fr2-edge-fw.service; sudo nft delete table inet fr2_edge'` |
| SSH Access | public :22 seulement | + `ssh-fr2`/`ssh-prd` (navigateur, jeton de service) | `cf.ts` : supprimer les apps + `systemctl disable --now cloudflared-fr2` |
| WAF / rate limit | nginx `limit_req` sur fr2 (contourné : public = Workers) | règles de zone | retirer `ref = "fr2-*"` de `cloudflare.toml`, puis `just cf-apply rules` (le ruleset de la phase est réécrit sans la règle) |
| Ingress tunnels | origines directes | LB cluster 19xxx | remettre `service = "http://127.0.0.1:23000"` (aphrody) ou l'origine en commentaire de `cloudflare.toml`, puis `just cf-apply tunnels` |
| Apps / jetons Access | jeton `fleet-agents` partagé | un jeton par hôte | `cf.ts` recrée ce qui est déclaré : `just cf-apply access` ; une app : `cf access apps delete <id>` (ID : `cf access apps list`) |

Identifiants : `cf dns records list -z <zone id>` (inchangés par la migration : réécriture sur place). Syntaxe vérifiée par `--dry-run` (cf 1.0.0-beta.31 : `update` = PUT, champs en `--body`). `cf.ts apply dns` remet l'état déclaré.

## 5. Preuves (`bun infra/cloudflare/proof.ts --md`, depuis le PC = internet, hors liste blanche)

dig depuis fr1 (`@1.1.1.1`) : aphrody.com, admin.aphrody.com, dbfr.aphrody.com, ssh-prd.aphrody.com → 172.67.143.120 / 104.21.27.192, 2606:4700:3037::6815:1bc0 / 2606:4700:3033::ac43:8f78 ; api.aphrody.app → 104.21.39.148 / 172.67.170.209 ; aucune IP de fr2. Scan depuis fr1 (flotte, autorisée) : 22/80/443 ouverts ; depuis le PC : 22 ouvert, 80/443 filtrés. Tunnels via API (`cloudflared tunnel info` exige un cert.pem de compte, absent).

Run 2026-11-13T03:14:32.210Z from 81.64.138.x

| Check | Target | OK | Evidence |
|---|---|---|---|
| access | admin.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/admin.aphrody.com |
| access | console.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/console.aphrody.com |
| access | control.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/control.aphrody.com |
| access | mig-commons.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/mig-commons.aphrody.com |
| access | mig-depot.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/mig-depot.aphrody.com |
| access | ssh-fr2.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/ssh-fr2.aphrody.com |
| access | ssh-prd.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/ssh-prd.aphrody.com |
| access-scope | fr2 token -> admin.aphrody.com (owner only) | yes | HTTP 403 (token presented, refused) |
| access-scope | fr2 token -> ssh-fr2.aphrody.com (must be refused) | yes | HTTP 403 (token presented, refused) |
| access-scope | prd token -> admin.aphrody.com (owner only) | yes | HTTP 403 (token presented, refused) |
| access-scope | prd token -> ssh-prd.aphrody.com (must be refused) | yes | HTTP 403 (token presented, refused) |
| access-ssh | fr2 -> ssh-prd.aphrody.com (service token) | yes | hostname=srv2116886 |
| access-ssh | prd -> ssh-fr2.aphrody.com (service token) | yes | hostname=bunos |
| api-route | https://aphrody.com/api/health | yes | 503 server cloudflare cf-ray MRS / expected 503 |
| cache | https://aphrody.com/ (2nd request) | yes | cf-cache-status HIT |
| edge | admin.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 302 / server cloudflare / cf-ray MRS / cache - / Access 302 / expected 302 |
| edge | ai.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 200 / server cloudflare / cf-ray MRS / cache - / expected 200 |
| edge | aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache HIT / expected 200 |
| edge | api.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | api.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache - / expected 200 |
| edge | app-audio.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-cad.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-compositing.aphrody.app | yes | A 172.67.170.209,104.21.39.148 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-documents.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-generation.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-images.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-interface-layouts.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-layout.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-pdf.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-photo-processing.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-slides.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-tables.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-vectors.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | app-video.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | art.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | auth.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | auth.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | bot.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | bxc.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | cad.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | calendar.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 404 |
| edge | cdn.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache - / expected 200 |
| edge | chat.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | console.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 302 / server cloudflare / cf-ray MRS / cache - / Access 302 / expected 302 |
| edge | control.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 302 / server cloudflare / cf-ray MRS / cache - / Access 302 / expected 302 |
| edge | craft.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | creator.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache - / expected 200 |
| edge | dbfr.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | deploy.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | design.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | docs.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | downloads.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 404 / server cloudflare / cf-ray MRS / cache - / expected 404 |
| edge | drive.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | fig.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | git.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | inacord.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | mail.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | maps.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 404 |
| edge | mcp.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | meet.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | mig-test.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | n2b.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | nie.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | os.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 404 |
| edge | pdf.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | photos.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | play.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 404 |
| edge | play.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 404 |
| edge | search.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | sheets.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | slides.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | sound.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | source.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - / expected 502 |
| edge | ssh-fr2.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 302 / server cloudflare / cf-ray MRS / cache - / Access 302 / expected 302 |
| edge | ssh-prd.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 302 / server cloudflare / cf-ray MRS / cache - / Access 302 / expected 302 |
| edge | status.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | store.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | translate.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| edge | www.aphrody.app | yes | A 172.67.170.209,104.21.39.148 / 200 / server cloudflare / cf-ray MRS / cache - / expected 200 |
| edge | www.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache HIT / expected 200 |
| edge | yohan.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC / expected 200 |
| origin-closed | fr2 51.255.162.6:443 from internet | yes | filtered (timeout) |
| origin-closed | fr2 51.255.162.6:80 from internet | yes | filtered (timeout) |
| origin-fleet | prd -> fr2:443 (fleet-health) | yes | HTTP 200 |
| origin-ssh | fr2 51.255.162.6:22 from internet | yes | open (break-glass, keys only) |
| origin-v6 | fr2 nft inet fr2_edge (v4+v6, tcp+udp) | yes | counter packets 9 dropped |
| tls | admin.aphrody.com | yes | Let's Encrypt YE2 |
| tls | aphrody.com | yes | Google Trust Services WE1 |
| tls | api.aphrody.app | yes | Google Trust Services WE1 |
| tls | dbfr.aphrody.com | yes | Let's Encrypt YE2 |
| tls | ssh-prd.aphrody.com | yes | Let's Encrypt YE2 |
| tunnel | fr2 (fr2) | yes | healthy, 4 conns, lhr13,cdg14,cdg08, cloudflared 2026.10.7 |
| tunnel | mig-prd (prd) | yes | healthy, 12 conns, cdg01,cdg14,cdg13,fra20,fra10,fra03,fra18,cdg10,lhr13, cloudflared 2026.10.7 |
| waf | https://aphrody.app/wp-login.php | yes | 403 cf-ray MRS |
| waf | https://aphrody.com/.env | yes | 403 cf-ray MRS |
| wireguard | fr2 wg1 (hub forwarding kept) | yes | latest handshake 69s ago, ip_forward 1 |

97/97 checks ok

## 6. Non migré, limites, permissions

- **Jeton API** (corrigé le 2026-11-13 03:00) : fr2 et prd ont chacun leur jeton `fleet-<hôte>-dns` (privilèges minimaux, vérifié) ; le coffre du PC porte un jeton de compte valide ; seules les variables d'environnement Windows héritées par d'anciens processus gardent l'ancienne valeur, d'où l'usage forcé du coffre dans les recettes. Avant : `CLOUDFLARE_API_TOKEN` (env PC et `/etc/aphrody/secrets.env` de fr2/prd) était un jeton d'accès OAuth `cfat_` expiré : `Invalid API Token` (code 1000/9109) sur `/user/tokens/verify`, `/accounts/<id>/tokens/verify` et `/zones`. Tout a été fait avec le login OAuth de `cf` (portées zone, dns, waf, rulesets, argotunnel, access, ssl, cache : rien ne manque). À remplacer par un vrai jeton de compte : sans lui, la bascule DNS de `fleet-health` (`CF_API_TOKEN`) et l'automatisation sur VPS ne marchent pas.
- **ssh 22 public** gardé sur fr2 (secours, clés uniquement ; fail2ban actif, jail sshd). Fermeture le **2026-11-20** si les trois critères sont tenus : 7 jours de `access-ssh` vert dans `just cf-proof` (les deux sens), accès console KVM OVH testé par le propriétaire (seule action humaine, inscrite dans l'index NHITL), chemin ssh mesh (`<hôte>-mesh`) vert depuis fr1 et prd. Règle à poser : 22 réservé à la flotte et wg1, **jamais** aux plages Cloudflare (Workers `connect()` et WARP sortent de ces IP) ; cloudflared joint sshd en 127.0.0.1. Console KVM OVH à vérifier avant.
- **Rendu SSH navigateur** : sans CA Access (`TrustedUserCAKeys`) dans sshd, le terminal navigateur demande une clé ; le chemin agents (`cloudflared access ssh` + jeton) est prouvé. Jeton par sens fait : `fleet-agents-fr2` n'ouvre que `ssh-prd`, `fleet-agents-prd` que `ssh-fr2` (preuve `access-scope` : usage inverse et admin en 403). Restent : la CA SSH Access (`TrustedUserCAKeys`) pour le rendu navigateur.
- **Ingress `aphrody.com`, `*.aphrody.com` → 127.0.0.1:19300** (pool cluster aphrody = prd:23000 ; le blue/green ne touche que deploy.toml) et `ssh-prd` → `ssh://127.0.0.1:19022` (sshd de prd quel que soit le réplica). Retour arrière : 127.0.0.1:23000 / 127.0.0.1:22. `*.aphrody.app` reste sur :3010 (502 sur tout réplica). Reste : la cible du pool est figée sur 23000 et aucun script ne bascule blue/green ; demandé à l agent cluster (serveurs blue et green avec health check, dérivés de deploy.toml).
- **Repli fr2** : vhosts downloads/cdn sur les LB cluster locaux (19797/19796, conteneur local d'abord), `mig-tunnel.conf` supprimé (fait) ; une bascule DNS `proxied:false` vers fr2 serait refusée par `fr2-edge-fw`. Le repli passe donc par la couche cluster (pools fr2 w60), pas par le DNS.
- **Certificats fr2** : tous en DNS-01 (section 1) ; achillea purgé. Origin CA Cloudflare et Custom AOP par vhost (dbfr, api, cdn, creator, downloads) : non faits, la limite « zone tierce » de `fr2-edge-fw` reste ouverte.
- **IPv6** : pas de point de vue v6 hors flotte ici (PC sans v6) ; preuve par la règle `inet` (drop commun v4/v6) et son compteur.
- **rosegriffon-52** (`cdn.rosegriffon.fr`, `nie.aphrody.app`, `rosegriffon*.conf`) : non touché, 404 via CF avant comme après. Session injoignable pour le message (SendMessage : aucun agent `rosegriffon-52`). Proposition : ingress tunnel `https://127.0.0.1:8443` sur prd.
- **dbfr.aphrody.com** (shenron) : reste sur fr2 (statique) ; cible AY_MIGRATION : servi depuis usa.
- **`*.aphrody.app`** : 502 (rien sur prd:3010), comme avant. Les routes `aphrody-webos` (fig, play, docs…) répondent 502 depuis le Worker lui-même.
- **rpbey.fr** : DNS chez OVH vers fr1 (action propriétaire). Vhost fr2 inutilisé.
- Vhosts nginx de fr2 gardés comme repli (fleet-health, HOSTING-POLICY), via les LB cluster. Plus aucun trafic public.
- **console.aphrody.com** : répondait 200 en public (tableau de bord), derrière Access `aphrody-console` (propriétaire seul) depuis le 2026-11-13 02:53.
- **cloudflared** : jeton en credential (`--token-file %d/...`, vérifié dans `ps`). Binaire `/usr/local/bin/cloudflared` 2026.10.7 hors APT sur fr2 et prd : mise à jour = `cloudflared update` désactivé (`--no-autoupdate`), donc procédure manuelle : télécharger la release GitHub `cloudflare/cloudflared`, vérifier le sha256 publié, `install -m 755`, `systemctl restart cloudflared-*`, puis `just cf-proof` (tunnels). Passage au dépôt APT `pkg.cloudflare.com` : non fait.
- **Rotation des jetons** : `fleet-<hôte>-dns` expire le 2027-11-13 (`just cf-fleet-token` le renouvelle) ; jetons Access `fleet-agents-<hôte>` : 8760 h depuis le 2026-11-13 (renouvellement : `POST /access/service_tokens/<id>/rotate`, ce que `cf.ts` fait seul si le dépôt échoue). Échéance à surveiller : 2027-10-13.
- **21 A `*.aphrody.app` en 502** : gardés tels quels (parité avec l'avant, rien ne tourne sur :3010) ; `expected-status.json` fige le 502 contre toute dérive, sans attester d'un service. Retrait ou 404 de Worker : à décider avec le produit aphrody-app.
- **Zone tierce** : `fr2-edge-fw` accepte les plages Cloudflare, donc une zone d'un autre compte peut viser 51.255.162.6 ; impossible de fermer à Cloudflare tant que dbfr.aphrody.com, cdn.rosegriffon.fr et nie.aphrody.app ont fr2 pour origine proxifiée. Remède : Custom AOP par vhost (non fait).
- WARP absent du PC : l'app `mig-prd-ssh` (infrastructure) reste inutilisable ; les apps ssh navigateur + le jeton de service n'en ont pas besoin.
- Couche cluster : répliques du tunnel et LB d'origine sont confiés à l'agent cluster (inventaire des tunnels envoyé). Pas de cache ni de LB d'origine ajouté sur fr2.

## 7. Validation Gemini

Gemini 4 Carbon High, passe 1 : **10/20** (verdict intégral : `docs/reviews/gemini-2026-11-13-fr2-cloudflare.md`). Corrigé : décomptes (33 CNAME, 21 A, certificats), état réel de nie.aphrody.app et du port 22, affirmation `/api`, commandes de retour arrière (`update` + ID), filtre UDP 80/443, ordre au démarrage, Access sur admin/control, preuve v6 par ruleset. Restes documentés en section 6 (CA SSH, jeton par sens, green_port, repli fr2, jeton API, Custom AOP).
