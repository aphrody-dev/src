# Cloudflare One : migration du mesh WireGuard (pilote `mig-`)

État au 2026-11-12 ~19:25 UTC. Inventaire relevé en direct (ssh `wg show`, `ss -tlnp`, `nginx` sur fr1/fr2/prd) et via `cf` 1.0.0-beta.31. Contexte : `docs/infra/FLEET.md`, `infra/fleet/RUNBOOK.md`.

## Migration Assessment

**Source stack** : VPN legacy WireGuard, hub fr1 `wg1` 10.200.77.0/24 (fr1 .1, PC .2, fr2 .3, prd .5), pair direct fr2↔prd + `fleet-wg-failover@` ; ssh public (22, clés uniquement) ; nginx fr2 en reverse-proxy vers prd par le mesh. Défaut connu : l'anti-DDoS Hostinger filtre l'UDP OVH→prd, ce qui casse le mesh.

**Artifacts reviewed** : `wg show all dump` (fr1, fr2, prd) ; `ss -Htlnp` (3 hôtes) ; `/etc/nginx/{sites,conf.d}` de fr2 ; `/etc/cloudflared` et unités de prd ; tunnels, apps Access et organisation Zero Trust (`cf tunnels list`, `cf zero-trust ...`) ; docs Cloudflare [Account limits](https://developers.cloudflare.com/cloudflare-one/account-limits/) (mise à jour 2026-11-05) et [Infrastructure apps](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/non-http/infrastructure-apps/) (2026-10-14).

**Assumptions / missing exports** :
- pairs fr1 `.4` (81.64.138.142, jamais de handshake), `.10` (92.170.252.46, actif) et un pair sans AllowedIPs (81.64.138.142) : propriétaires non identifiés, aucun service ne leur est routé.
- aucun des backends prd visés par les vhosts aphrody de fr2 n'écoute (3000, 3010, 8788, 29030, 8790, 8791, 8794, 8796, 8797, 8083 → connexion refusée). Ces vhosts répondent déjà 502 en direct. La parité se mesure donc sur le code d'erreur et le chemin, pas sur le contenu.
- `downloads.aphrody.com` côté public est servi par Cloudflare en amont (`Server: cloudflare`, `/health` 200), pas par fr2 : la bascule fr2 ne touche que le trafic qui arrive vraiment sur fr2 (`--resolve`).
- `conf.d/fleet-api.conf` (dbfr, mcp/db.rosegriffon.fr) vise `10.200.77.1:8080`, qui n'écoute pas sur fr1.
- quota de sièges du plan Free : non vérifié dans la session (la page Account limits ne le donne pas). L'org existe déjà (`aphrody-labs.cloudflareaccess.com`) et on n'utilise qu'une identité.

**Recommended Cloudflare One target** : Cloudflare Tunnel (`cloudflared` sur prd, sortant vers Cloudflare en QUIC, repli HTTP/2 TCP 443, aucun UDP OVH→prd) + hostnames publics proxifiés, Access self-hosted pour les UI d'admin et Access for Infrastructure pour ssh (client WARP requis). Cloudflare WAN est inutile : le besoin n'est pas site-à-site.

**Mapping summary** : voir le tableau ci-dessous. Objets créés (tous préfixés `mig-`) :

| Objet | ID |
|---|---|
| Tunnel `mig-prd` (remote-managed, 4 connexions QUIC cdg/bru) | `72153924-6650-4dd4-bced-f8b6731edcd8` |
| Unité prd `cloudflared-mig-prd.service`, token `/etc/cloudflared-mig/mig-prd.tunnel-token` (root:root 0600, dossier 0700) | – |
| DNS CNAME proxifiés (zone aphrody.com) : mig-test / mig-downloads / mig-depot / mig-commons | `55f6b370…` / `48aa92a8…` / `58a419a0…` / `b64672bd…` |
| Politique Access réutilisable `mig-owner-only` (contact@aphrody.com, 24 h) | `f3931268-9a0c-417c-b133-807ec2ca93e8` |
| App Access `mig-prd-admin` (mig-depot, mig-commons) | `79f30d5f-8d38-4aaa-99fd-4b2ee21be3a4` |
| Route CIDR `10.200.77.5/32` → mig-prd | `39a6996f-dc75-4d48-8ea0-04aa8022a019` |
| Cible infra `mig-prd` (10.200.77.5) + app `mig-prd-ssh` (port 22, root, contact@aphrody.com) | `01a1d136-…` / `2b85b1f7-7e50-4d7d-9b03-db25e6b60808` |
| Règle WAF zone : `mig-downloads` bloqué sauf IP fr2 (v4+v6) | ruleset `ee6e2212…`, règle `93eb77a3…` |
| fr2 : `/etc/nginx/conf.d/mig-tunnel.conf` (relais `127.0.0.1:18797` → https://mig-downloads, SNI et vérif. TLS) | – |

### Tableau de comptabilité

| Source (pair / route / upstream / service) | Cible Cloudflare | Statut |
|---|---|---|
| WG fr1 `wg1` pair fr2 `.3/32` | – | Not Migrated : liaison OVH↔OVH sans filtrage UDP. Reste le repli. |
| WG fr1 pair prd `.5/32` ; prd `vps` pair hub `/24` | tunnel `mig-prd` (fr2→prd) | Partiel : seul l'upstream downloads est basculé, le WG est conservé |
| WG fr1 pair PC `.2/32` ; prd `prod` pair PC `10.200.78.2/32` | client WARP + route `10.200.77.5/32` (préparé) | Not Migrated : WARP absent sur le PC (installation sous UAC, à faire par le propriétaire) |
| WG fr2↔prd direct (prd : AllowedIPs `(none)`, route retirée par le failover) | tunnel `mig-prd` | Remplacé pour le pilote, le WG reste en place |
| WG fr1 `.4`, `.10`, pair sans IP | – | Not Migrated : propriétaires inconnus. Impact : accès mesh non audité, à identifier puis révoquer |
| fr2 `downloads` upstream `10.200.77.5:8797` | `127.0.0.1:18797` → `mig-downloads.aphrody.com` → tunnel → `127.0.0.1:8797` | **Migré (pilote)**. 502 avant comme après (origine éteinte), passage vérifié dans les journaux cloudflared |
| fr2 `aphrody.com` → `.5:3000`, `aphrody.app` → `.5:3010`, catch-all `*.aphrody.com/app` | ajouter une ingress au tunnel + un relais loopback | Not Migrated : backends éteints, rien à valider |
| fr2 `api.aphrody.com` → `.5:{8788,29030,8794,8797,8796,8083,8791,8790}` | même schéma | Not Migrated : backends éteints |
| fr2 `cdn.aphrody.com` fonts → `.5:8796` | même schéma | Not Migrated : backend éteint |
| fr2 `omar` → `127.0.0.1:8793` (ssh -R) | tunnel `prod` existant (aphrody.app → 8793 sur prd) | Not Migrated : relais ssh client, hors mesh |
| fr2 `conf.d/fleet-api.conf` → `10.200.77.1:8080` | – | Not Migrated : la cible n'écoute pas (mort). Concerne rosegriffon-52 pour mcp/db.rosegriffon.fr |
| fr2 `rosegriffon.fr` `rg_prod_stack` → `72.60.186.43:443` ; `rosegriffon-cdn` `rg_origin` → `:8443` | option : ingress `https://127.0.0.1:443` / `:8443` sur un tunnel dédié (même modèle que `shenron-dbfr`) | Not Migrated : périmètre de rosegriffon-52. Déjà en TCP public, pas d'exposition au filtrage UDP |
| prd `10.200.77.5:8182` gpu-depot (UI admin, 401) | `mig-depot.aphrody.com` + Access `mig-prd-admin` | **Migré (pilote)**. 302 vers la connexion Access |
| prd `10.200.77.5:8766` commons-relay (401) | `mig-commons.aphrody.com` + Access `mig-prd-admin` | **Migré (pilote)**. 302 vers la connexion Access |
| prd `0.0.0.0:8780` wii-os (déjà public) | `mig-test.aphrody.com` (hostname de test) | **Migré (test)**. 200 |
| prd `10.200.77.5:41337/41339` loreserver, `:15433` / `:18080` docker | private network via route CIDR + WARP | Not Migrated : clients mesh internes. 18080 relève de rosegriffon |
| fr1 `10.200.77.1:50051/50061` NativeLink, `:8766/:8182` socket-proxyd | – | Not Migrated : déjà en TCP via `fleet-tunnel-nativelink` (ssh -L). Les forwards fr1 sont des aliases de compatibilité |
| ssh public :22 (fr1, fr2, prd) | `mig-prd-ssh` (Access for Infrastructure, plan Free selon la doc) pour prd | Partiel : la cible est prête, ssh public conservé. Inutilisable tant que WARP n'est pas sur le PC |
| tunnels existants `prod`, `auto-usa`, `shenron-dbfr` | inchangés | hors périmètre |

**Risks / partial mappings** :
- QUIC est de l'UDP sortant prd→Cloudflare. S'il est filtré, cloudflared repasse en HTTP/2 sur TCP 443 (`--protocol auto`).
- `mig-downloads` est un hostname public : le WAF limite l'accès aux IP de fr2 (vérifié : PC 403, fr2 passe), mais les limites nginx de fr2 ne s'appliquent qu'à l'entrée downloads.
- l'IP client vue par prd devient celle de Cloudflare. `X-Forwarded-For` est propagé depuis fr2.
- `mig-test` expose wii-os, qui écoutait déjà publiquement sur 0.0.0.0:8780.

**Not migrated** : voir le tableau (backends éteints, pairs inconnus, PC sans WARP, rosegriffon, NativeLink).

**Pilot plan** : (1) fait : downloads sur fr2 passe par le tunnel. (2) remettre les backends aphrody en marche sur prd, puis répéter le schéma « ingress + relais loopback `127.0.0.1:<port relais>` (le préfixe « 1 » déborde 65535 pour 29030, 41337 : utiliser une plage dédiée hors `ip_local_port_range`, ex. 18000-18999) + règle WAF » upstream par upstream. (3) installer WARP sur le PC (UAC), enrôler l'appareil, tester `ssh root@10.200.77.5` via `mig-prd-ssh`. (4) après 7 jours sans incident, faire passer les UI d'admin à `127.0.0.1`.

**Validation** : `curl https://mig-test.aphrody.com/` 200 ; mig-depot et mig-commons 302 vers `aphrody-labs.cloudflareaccess.com` ; mig-downloads 403 depuis le PC et 502 (origine) depuis fr2 ; tunnel `mig-prd` healthy avec 4 connexions ; ssh public vers prd OK après déploiement ; `nginx -t` OK sur fr2.

**Rollback** :
- upstream downloads, en une ligne (fr2) : `sudo sed -i 's|^    server 127.0.0.1:18797;.*|    server 10.200.77.5:8797;|' /etc/nginx/sites/downloads.aphrody.com.conf && sudo nginx -t && sudo systemctl reload nginx` (copie : `/root/downloads.aphrody.com.conf.pre-mig`).
- tout le pilote : `systemctl disable --now cloudflared-mig-prd` (prd), puis supprimer les objets `mig-*` listés ci-dessus (DNS, apps, politique, route, cible, règle WAF, tunnel) et `conf.d/mig-tunnel.conf`.
- WireGuard n'est pas modifié : c'est le repli.
