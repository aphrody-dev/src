# fr2 et Cloudflare : inventaire, cible, migration, preuves (2026-11-13)

Périmètre : fr2 (`ssh fr2`, OVH, 51.255.162.6 / 2001:41d0:305:2100::a461, wg1 10.200.77.3). Relevé live le 2026-11-13 entre 02:10 et 02:40 UTC (ssh, API Cloudflare, `cf` 1.0.0-beta.31). Configuration : `infra/cloudflare/cloudflare.toml`, appliquée par `bun infra/cloudflare/cf.ts`. Preuves : `just cf-proof`. Précédents : `CLOUDFLARE-ONE.md` (pilote `mig-`), `MIGRATION-VERCEL-CF.md` (Workers), `HOSTING-POLICY.md`.

## 1. Inventaire de fr2 (avant migration, lecture seule)

| Élément | État relevé |
|---|---|
| Ports (`ss -ltnup`) | publics : tcp 22 (sshd), 80/443 (nginx), udp 45667 (wg1). Loopback : 18797 (relais nginx vers mig-downloads), 28081/28796/28797 (docker), 64859 (bun, runner d'agents nt-d6), 53 (resolved), 33697 (containerd) |
| Pare-feu | `table inet fleet` (priorité -10, source inconnue dans le dépôt) : 22/80/443 ouverts à tous, udp 443/45667, fleet IP acceptées, reste jeté. ufw inactif (chaînes vides), `inet f2b-table` (fail2ban inactif) |
| WireGuard | wg1 :45667, pair hub fr1 (10.200.77.0/24) + pair prd (10.200.77.5/32), `net.ipv4.ip_forward=1`, `fleet-wg-failover@prd.timer` |
| Docker (`/srv/aphrody-src/compose.yaml`, profil edge) | `downloads` (r2-site, 127.0.0.1:28797), `api-gateway` (127.0.0.1:28081), `cdn` (r2-site, 127.0.0.1:28796), tous healthy : repli self-host des Workers (HOSTING-POLICY) |
| Unités systemd actives | nginx, docker, containerd, nativelink-worker, earlyoom, cron, ssh, qemu-guest-agent, systemd-* ; binaire `/usr/local/bin/cloudflared` 2026.10.7 sans unité |
| Timers / cron | certbot, upki-fetch, fleet-wg-failover@prd, apt/logrotate/fstrim/dpkg/tmpfiles ; crontabs root/ubuntu vides ; `/etc/cron.d` : certbot, e2scrub_all |
| Certificats `/etc/letsencrypt/live` | 19 certificats Let's Encrypt (16 en dns-cloudflare, 1 en webroot) : aphrody.com (`*.aphrody.com`), aphrody.app, api/cdn/creator/downloads/bot.aphrody.com, nie.aphrody.app, dragonballfr.com (+bot, cdn, mcp), rosegriffon.fr (+api, achillea, azalee, cdn, mcp, ranked). achillea.rosegriffon.fr expiré le 2026-11-10 |

### Vhosts nginx (`/etc/nginx/sites`, `conf.d`)

| Fichier | server_name | Upstream / contenu | Trafic réel avant migration |
|---|---|---|---|
| sites/aphrody.com.conf | aphrody.com, www | proxy 10.200.77.5:3000 (rien n'écoute) | aucun : Worker `aphrody` (route `aphrody.com/*`) et domaine perso www |
| idem | aphrody.app, www | proxy 10.200.77.5:3010 (rien n'écoute) | aucun : Worker `aphrody-app-site` |
| idem | `*.aphrody.com` | proxy :3000 → **502** | ~30 CNAME proxifiés → aphrody.com + A os → fr2 |
| idem | `*.aphrody.app` | proxy :3010 → **502** | 22 A proxifiés → fr2 (api, auth, craft, deploy, git, play, source, app-*) |
| sites/api.aphrody.com.conf | api.aphrody.com | JSON statique + 8 proxys prd (8788, 29030, 8794, 8797, 8796, 8083, 8791, 8790) | fleet-health uniquement (public = Worker `api-aphrody-com`) |
| sites/cdn.aphrody.com.conf | cdn.aphrody.com | fonts prd:8796, limit_req | fleet-health uniquement (public = Worker `cdn-aphrody-com`) |
| sites/creator.aphrody.com.conf | creator.aphrody.com | statique `/srv/www/creator.aphrody.com` | fleet-health uniquement (public = Worker) |
| sites/downloads.aphrody.com.conf | downloads.aphrody.com | `127.0.0.1:18797` → relais `conf.d/mig-tunnel.conf` → mig-downloads → tunnel → prd:8797 | aucun (public = Worker) |
| sites/rpbey.fr.conf | rpbey.fr, www | statique | aucun : DNS chez OVH, A = fr1 (action propriétaire) |
| sites/rosegriffon.fr.conf | rosegriffon.fr, `*.rosegriffon.fr` | proxy https 72.60.186.43:443 | aucun : DNS rosegriffon.fr → prd en direct (sauf cdn) |
| conf.d/rosegriffon-cdn.conf | cdn.rosegriffon.fr, nie.aphrody.app | proxy 72.60.186.43:8443 | oui (proxifié CF) : **rosegriffon-52, non touché** |
| conf.d/fleet-api.conf | dbfr.aphrody.com, mcp/db.rosegriffon.fr | JSON statique, `/v1/*` → 10.200.77.1:8080 (mort) | dbfr.aphrody.com en **DNS-only** vers fr2 (A + AAAA) |
| conf.d/mig-tunnel.conf | 127.0.0.1:18797 | https://mig-downloads.aphrody.com (SNI, vérif TLS) | relais du pilote |

### DNS du compte pointant vers fr2 (avant)

| Zone | Enregistrements | Proxifié |
|---|---|---|
| aphrody.com | A `aphrody.com`, A `os` ; 31 CNAME → `aphrody.com` (admin, ai, art, auth, bot, bxc, cad, calendar, chat, console, control, design, docs, drive, fig, inacord, mail, maps, mcp, meet, n2b, nie, pdf, photos, play, search, sheets, slides, sound, status, store, translate, yohan) | oui |
| aphrody.com | A + AAAA `dbfr` | **non** (IP de fr2 publique) |
| aphrody.app | A api, auth, craft, deploy, git, nie, play, source, app-{audio, cad, compositing, documents, generation, images, interface-layouts, layout, pdf, photo-processing, slides, tables, vectors, video} | oui |
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
| Origine publique 80/443 | ouverte seulement aux plages Cloudflare + flotte + wg1 (`fr2-edge-fw`) ; Authenticated Origin Pulls non retenu tant que la conf rosegriffon-cdn est hors périmètre | **fait** |
| SSH d'administration | Access : apps `fr2-ssh` / `prd-ssh` (type ssh, rendu navigateur) via tunnels `fr2` et `mig-prd` ; jeton de service `fleet-agents` pour les agents (`cloudflared access ssh`) ; 22 public gardé en secours | **fait** (22 fermé après 7 jours sans incident) |
| UI admin prd (gpu-depot, commons-relay) | Access `mig-prd-admin` | fait (pilote) |
| Hub WireGuard + forwarding | reste sur VPS (pas d'équivalent sans WARP sur le PC) | conservé intact |
| Repli self-host (conteneurs edge, vhosts api/cdn/creator/downloads) | reste sur fr2, joignable par la flotte et Cloudflare (bascule DNS de fleet-health) | conservé |
| Répartition / basculement entre hôtes | couche cluster (agent `adc9aa05cb92c46bc`, `infra/cluster/`) : répliques du même tunnel avec ingress → port LB local | à faire par cet agent |

Le double saut CF → fr2 → prd est supprimé : plus aucun nom aphrody ne résout vers fr2, sauf `dbfr.aphrody.com` (passerelle shenron statique, désormais proxifiée).

## 3. Implémentation (code)

- `infra/cloudflare/cloudflare.toml` : tunnels (ingress), DNS, règles de zone (par `ref`), Access. Seuls les objets listés sont gérés, rien d'autre n'est touché.
- `infra/cloudflare/cf.ts` : `plan` (diff en lecture seule, par défaut) / `apply <dns|tunnels|rules|access> [--only <nom>]`. DNS : réécriture sur place (PUT, pas de trou), jamais de suppression avant ajout. Auth : `CLOUDFLARE_API_TOKEN` s'il est valide, sinon le login OAuth de `cf`.
- `infra/cloudflare/tunnel-token.ts` : jeton de connecteur vers stdin de `systemd-creds encrypt` (refuse un terminal).
- `infra/cloudflare/proof.ts` + `just cf-proof` : 88 vérifications, code de sortie 1 en cas de régression. `just cf-plan` : diff.
- fr2 : `infra/fleet/fr2/systemd/cloudflared-fr2.service` (jeton en credential chiffré `/etc/credstore.encrypted/cloudflared-fr2`), `infra/fleet/fr2/bin/fr2-edge-fw.sh` + `fr2-edge-fw.{service,timer}` (plages CF rafraîchies chaque jour, dernière copie valide gardée).

Objets créés : tunnel `fr2` `88aa6a53-0a9a-4a5b-a9b6-3d3394dd978d` (4 connexions cdg) ; ingress `mig-prd` + `ssh-prd`, `aphrody.com`, `*.aphrody.com` → 127.0.0.1:23000 (conteneur aphrody, deploy.toml green_port), `*.aphrody.app` → 127.0.0.1:3010 ; CNAME `ssh-fr2`, `ssh-prd` ; règles `fr2-block-probes` (aphrody.com, aphrody.app), `fr2-rl-edge` ; jeton de service `fleet-agents` (secret uniquement dans `/etc/aphrody/secrets.env` de fr2 et prd, 600), politique `fleet-agents-token` (non_identity), apps `fr2-ssh`, `prd-ssh`.

## 4. Migration service par service (testée avant chaque bascule)

Ordre : ingress ajoutée → noms de test temporaires `fr2mig-check.aphrody.{com,app}` → tunnel (200 côté .com depuis prd:23000, 502 côté .app comme avant) → supprimés → `admin.aphrody.com` seul (200) → tout le reste → pare-feu (garde `systemd-run` de 180 s qui supprimait la table en cas d'échec, annulée après vérification) → règles → Access.

| Service | Avant | Après | Retour arrière (une ligne) |
|---|---|---|---|
| 31 CNAME `*.aphrody.com` | CF → fr2 → prd:3000 mort : 502 | CF → tunnel mig-prd → prd:23000 : 200 (ou 404/502 rendu par le Worker `aphrody-webos` sur ses routes) | `cf dns records update <id> -z 963461271f885bc3f3c2bfd586f2b7ba --body '{"type":"CNAME","name":"<h>","content":"aphrody.com","proxied":true}'` |
| apex `aphrody.com` | A fr2 proxifié (origine des CNAME), Worker devant | CNAME tunnel (aplati), Worker devant ; `/api` passe par l'ingress prd | `cf dns records update 30ddf6bf26060e3685b6fe9e904a8589 -z 963461271f885bc3f3c2bfd586f2b7ba --body '{"type":"A","name":"aphrody.com","content":"51.255.162.6","proxied":true}'` |
| `os.aphrody.com`, 22 A `*.aphrody.app` | A fr2 → 502 | CNAME tunnel → prd (os 404 Worker, .app 502 : rien sur :3010) | `cf dns records update <id> -z <zone id> --body '{"type":"A","name":"<h>","content":"51.255.162.6","proxied":true}'` |
| `dbfr.aphrody.com` | DNS-only, IP de fr2 exposée | proxifié (Full strict, cert `*.aphrody.com`), 200 | `cf dns records edit <id A/AAAA> -z 963461271f885bc3f3c2bfd586f2b7ba --body '{"proxied":false}'` (x2) |
| Pare-feu origine fr2 | 80/443 ouverts à tous | Cloudflare + flotte + wg1 ; 251 paquets jetés dans les 10 premières minutes | `ssh fr2 'sudo systemctl disable --now fr2-edge-fw.timer; sudo nft delete table inet fr2_edge'` |
| SSH Access | public :22 seulement | + `ssh-fr2`/`ssh-prd` (navigateur, jeton de service) | `cf.ts` : supprimer les apps + `systemctl disable --now cloudflared-fr2` |
| WAF / rate limit | nginx `limit_req` sur fr2 (contourné : public = Workers) | règles de zone | supprimer la règle `fr2-*` du ruleset de la phase (dashboard ou `cf`) |

Identifiants : `cf dns records list -z <zone id>` (inchangés par la migration : réécriture sur place). Syntaxe vérifiée par `--dry-run` (cf 1.0.0-beta.31 : `update` = PUT, champs en `--body`). `cf.ts apply dns` remet l'état déclaré.

## 5. Preuves (`bun infra/cloudflare/proof.ts --md`, depuis le PC = internet, hors liste blanche)

dig depuis fr1 (`@1.1.1.1`) : aphrody.com, admin.aphrody.com, dbfr.aphrody.com, ssh-prd.aphrody.com → 172.67.143.120 / 104.21.27.192, 2606:4700:3037::6815:1bc0 / 2606:4700:3033::ac43:8f78 ; api.aphrody.app → 104.21.39.148 / 172.67.170.209 ; aucune IP de fr2. Scan depuis fr1 (flotte, autorisée) : 22/80/443 ouverts ; depuis le PC : 22 ouvert, 80/443 filtrés. Tunnels via API (`cloudflared tunnel info` exige un cert.pem de compte, absent).

Run 2026-11-13T02:38:42.762Z from 81.64.138.x

| Check | Target | OK | Evidence |
|---|---|---|---|
| access | mig-commons.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/mig-commons.aphrody.com |
| access | mig-depot.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/mig-depot.aphrody.com |
| access | ssh-fr2.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/ssh-fr2.aphrody.com |
| access | ssh-prd.aphrody.com | yes | 302 -> https://aphrody-labs.cloudflareaccess.com/cdn-cgi/access/login/ssh-prd.aphrody.com |
| access-ssh | fr2 -> ssh-prd.aphrody.com (service token) | yes | hostname=srv2116886 |
| access-ssh | prd -> ssh-fr2.aphrody.com (service token) | yes | hostname=bunos |
| cache | https://aphrody.com/ (2nd request) | yes | cf-cache-status HIT |
| edge | admin.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | ai.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 200 / server cloudflare / cf-ray MRS / cache - |
| edge | aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache HIT |
| edge | api.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | api.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache - |
| edge | app-audio.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-cad.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-compositing.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-documents.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-generation.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-images.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-interface-layouts.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-layout.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-pdf.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-photo-processing.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-slides.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-tables.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-vectors.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | app-video.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | art.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | auth.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | auth.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | bot.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | bxc.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | cad.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | calendar.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | cdn.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache - |
| edge | chat.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | console.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache - |
| edge | control.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | craft.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | creator.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache - |
| edge | dbfr.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | deploy.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | design.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | docs.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | downloads.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 404 / server cloudflare / cf-ray MRS / cache - |
| edge | drive.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | fig.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | git.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | inacord.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | mail.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | maps.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | mcp.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | meet.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | mig-test.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | n2b.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | nie.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | os.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | pdf.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | photos.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | play.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | play.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 404 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | search.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | sheets.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | slides.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | sound.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | source.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 502 / server cloudflare / cf-ray MRS / cache - |
| edge | ssh-fr2.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 302 / server cloudflare / cf-ray MRS / cache - / Access 302 |
| edge | ssh-prd.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 302 / server cloudflare / cf-ray MRS / cache - / Access 302 |
| edge | status.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | store.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | translate.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| edge | www.aphrody.app | yes | A 104.21.39.148,172.67.170.209 / 200 / server cloudflare / cf-ray MRS / cache - |
| edge | www.aphrody.com | yes | A 172.67.143.120,104.21.27.192 / 200 / server cloudflare / cf-ray MRS / cache HIT |
| edge | yohan.aphrody.com | yes | A 104.21.27.192,172.67.143.120 / 200 / server cloudflare / cf-ray MRS / cache DYNAMIC |
| origin-closed | fr2 51.255.162.6:443 from internet | yes | filtered (timeout) |
| origin-closed | fr2 51.255.162.6:80 from internet | yes | filtered (timeout) |
| origin-fleet | prd -> fr2:443 (fleet-health) | yes | HTTP 200 |
| origin-ssh | fr2 51.255.162.6:22 from internet | yes | open (break-glass, keys only) |
| tls | admin.aphrody.com | yes | Let's Encrypt YE2 |
| tls | aphrody.com | yes | Google Trust Services WE1 |
| tls | api.aphrody.app | yes | Google Trust Services WE1 |
| tls | dbfr.aphrody.com | yes | Let's Encrypt YE2 |
| tls | ssh-prd.aphrody.com | yes | Let's Encrypt YE2 |
| tunnel | fr2 (fr2) | yes | healthy, 4 conns, cdg07,cdg14,cdg01,cdg16, cloudflared 2026.10.7 |
| tunnel | mig-prd (prd) | yes | healthy, 4 conns, cdg01,cdg14,cdg13, cloudflared 2026.10.7 |
| waf | https://aphrody.app/wp-login.php | yes | 403 cf-ray MRS |
| waf | https://aphrody.com/.env | yes | 403 cf-ray MRS |
| wireguard | fr2 wg1 (hub forwarding kept) | yes | latest handshake 51s ago, ip_forward 1 |

88/88 checks ok

## 6. Non migré, limites, permissions

- **Jeton API** : `CLOUDFLARE_API_TOKEN` (env PC et `/etc/aphrody/secrets.env` de fr2/prd) est un jeton d'accès OAuth `cfat_` expiré : `Invalid API Token` (code 1000/9109) sur `/user/tokens/verify`, `/accounts/<id>/tokens/verify` et `/zones`. Tout a été fait avec le login OAuth de `cf` (portées zone, dns, waf, rulesets, argotunnel, access, ssl, cache : rien ne manque). À remplacer par un vrai jeton de compte : sans lui, la bascule DNS de `fleet-health` (`CF_API_TOKEN`) et l'automatisation sur VPS ne marchent pas.
- **ssh 22 public** gardé sur fr2 (secours, clés uniquement). Fermeture après 7 jours d'Access SSH sans incident : ajouter `tcp dport 22` au même filtre.
- **rosegriffon-52** (`cdn.rosegriffon.fr`, `nie.aphrody.app`, `rosegriffon*.conf`) : non touché, 404 via CF avant comme après. Session injoignable pour le message (SendMessage : aucun agent `rosegriffon-52`). Proposition : ingress tunnel `https://127.0.0.1:8443` sur prd.
- **dbfr.aphrody.com** (shenron) : reste sur fr2 (statique) ; cible AY_MIGRATION : servi depuis usa.
- **`*.aphrody.app`** : 502 (rien sur prd:3010), comme avant. Les routes `aphrody-webos` (fig, play, docs…) répondent 502 depuis le Worker lui-même.
- **rpbey.fr** : DNS chez OVH vers fr1 (action propriétaire). Vhost fr2 inutilisé.
- Vhosts nginx de fr2 et relais `mig-tunnel.conf` gardés comme repli (fleet-health, HOSTING-POLICY). Plus aucun trafic public.
- WARP absent du PC : l'app `mig-prd-ssh` (infrastructure) reste inutilisable ; les apps ssh navigateur + le jeton de service n'en ont pas besoin.
- Couche cluster : répliques du tunnel et LB d'origine sont confiés à l'agent cluster (inventaire des tunnels envoyé). Pas de cache ni de LB d'origine ajouté sur fr2.

## 7. Validation Gemini

Voir `docs/reviews/gemini-2026-11-13-fr2-cloudflare.md`.
