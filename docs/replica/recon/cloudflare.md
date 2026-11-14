# Recon Cloudflare — compte aphrody (lecture seule)

Relevé du 2026-11-13, compte `ca22c1a51a145f919b54afa18d936516`, plan Free sur les 5 zones.
Sources : API v4 via `cf` 1.0.0-beta.31 (connexion OAuth `cf auth login`, toutes portées) et `infra/cloudflare/recon.ts`
(GET seulement, `CF_AUTH=oauth bun infra/cloudflare/recon.ts <dir>`), `bun infra/cloudflare/cf.ts plan` (aucune dérive :
`no changes`), captures du dashboard par Chrome via Claude in Chrome (session existante), dépôts GitHub via `gh api`.
Aucune écriture, aucune suppression. Aucun secret ni contenu TXT recopié (seule la nature de l'enregistrement est notée).

Le jeton `CLOUDFLARE_API_TOKEN` de l'environnement ne lit pas les enregistrements DNS (403, code 10000) : le relevé
utilise la connexion OAuth (`env -u CLOUDFLARE_API_TOKEN cf ...` ou `CF_AUTH=oauth`).

## 1. Synthèse

| Ressource                      | Nombre                      | Détail                                                                                                                                |
| ------------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Zones                          | 5                           | aphrody.com, aphrody.app, dragonballfr.com, rosegriffon.fr (actives) ; 3dland.tech **pending** (NS encore chez Hostinger dns-parking) |
| Enregistrements DNS            | 189                         | aphrody.com 73, aphrody.app 60, rosegriffon.fr 35, dragonballfr.com 19, 3dland.tech 2                                                 |
| Workers                        | 17                          | 26 custom domains, 38 routes (aphrody.app 20, aphrody.com 17, dragonballfr.com 1) ; sous-domaine workers.dev `aphrody-labs`           |
| R2                             | 13 buckets                  | 11 en juridiction par défaut + 2 en **EU** (`iecode-vfs`, `rg-assets`) ; 136,43 Go stockés (dashboard)                                |
| KV / D1 / DO                   | 1 / 1 / 2                   | `aphrody-app-cache` ; D1 `aphrody-app` (172 Kio) ; DO `aphrody-app_Room`, `aphrody-deploy_Insights` (SQLite)                          |
| Queues / Workflows / Vectorize | 2 / 1 / 1                   | `aphrody-app-jobs`, `github-events` ; `aphrody-app-ingest` ; `bun-native` (1024 dim., cosine)                                         |
| AI Gateway                     | 2                           | `aphrody`, `default`                                                                                                                  |
| Pages                          | 0                           | aucun projet                                                                                                                          |
| Tunnels                        | 5                           | `mig-prd`, `prod`, `fr2`, `auto-usa`, `shenron-dbfr` (tous healthy)                                                                   |
| Access                         | 9 apps, 2 jetons de service | console, control, admin, aphrody.app/dashboard, SSH prd/fr2, mig-prd ; jetons `fleet-agents-fr2`, `fleet-agents-prd`                  |
| Turnstile                      | 1                           | `aphrody-auth-turnstile` (managed ; aphrody.app, aphrody.com, localhost)                                                              |
| Email Routing                  | aphrody.app seulement       | 7 règles (6 forward, `inbound@` → Worker `aphrody-email-worker`)                                                                      |
| Secrets Store                  | 1                           | `default-secrets-store`                                                                                                               |
| Images / Stream                | —                           | non lisibles avec la connexion OAuth (403) ; binding Images actif sur `aphrody` et `aphrody-deploy`                                   |

## 2. Zones et réglages edge

| Zone             | Statut  | SSL    | TLS min | HTTPS forcé | DNSSEC      | Certificats                                                                                 |
| ---------------- | ------- | ------ | ------- | ----------- | ----------- | ------------------------------------------------------------------------------------------- |
| aphrody.com      | active  | strict | 1.2     | oui         | **pending** | universel Let's Encrypt + 7 avancés Google (www, api, cdn, downloads, creator, yolo, bun)   |
| aphrody.app      | active  | strict | 1.2     | oui         | active      | universel Let's Encrypt + 19 avancés Google (www, wildcard, shell, bun, apt, 14 « *craft ») |
| dragonballfr.com | active  | strict | 1.2     | oui         | **pending** | universel Let's Encrypt                                                                     |
| rosegriffon.fr   | active  | strict | 1.2     | oui         | désactivé   | universel Let's Encrypt                                                                     |
| 3dland.tech      | pending | full   | **1.0** | **non**     | désactivé   | aucun                                                                                       |

Réglages communs aux 4 zones actives : HTTP/3, 0-RTT, TLS 1.3 + 0-RTT, ECH, Early Hints, Brotli, IPv6, WebSockets,
`cache_level=aggressive`, `browser_cache_ttl=0` (respecte l'origine), Polish/WebP/Rocket Loader/Always Online désactivés,
`security_level=medium`. Name servers : `duke` / `veda.ns.cloudflare.com`.

## 3. Workers

| Worker                  | Handlers                               | Liaisons (bindings)                                                                             | Exposition                                                                           | Source dans src                                    |
| ----------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- |
| aphrody                 | fetch                                  | R2 `aphrody-dist`, Images, DO `INSIGHTS`                                                        | www.aphrody.com (domaine), route `aphrody.com/*`                                     | `apps/aphrody` (wrangler.toml)                     |
| aphrody-deploy          | fetch                                  | R2 `aphrody-dist`, Images, DO `Insights`, Access (AUD/team)                                     | aphrody.app, www.aphrody.app (domaines), route `*.aphrody.app/*`                     | `packages/deploy`                                  |
| aphrody-app             | fetch, queue, scheduled (`17 3 * * *`) | AI, R2 `aphrody-assets`, assets, Vectorize, KV, D1, Workflow, Queue, DO `Room`, 3 rate limiters | bun.aphrody.app, bun.aphrody.com                                                     | `apps/aphrody-app`                                 |
| aphrody-app-site        | fetch                                  | R2 `aphrody-dist` (`sites/aphrody.app`, SPA)                                                    | shell.aphrody.app                                                                    | `infra/fleet/workers/r2-site/aphrody.app.toml`     |
| aphrody-com             | fetch                                  | R2 `aphrody-dist` (`sites/aphrody.com`)                                                         | **aucune** (remplacé par `aphrody`)                                                  | `infra/fleet/workers/r2-site/aphrody.com.toml`     |
| cdn-aphrody-com         | fetch                                  | R2 `aphrody-assets` (racine)                                                                    | cdn.aphrody.com                                                                      | `infra/fleet/workers/r2-site/cdn.aphrody.com.toml` |
| creator-aphrody-com     | fetch                                  | R2 `aphrody-dist` (`sites/creator.aphrody.com`, SPA)                                            | creator.aphrody.com                                                                  | r2-site                                            |
| downloads-aphrody-com   | fetch                                  | R2 `aphrody-dist` (`aphrody/`)                                                                  | downloads.aphrody.com                                                                | r2-site                                            |
| downloads-portable      | fetch, scheduled (sans cron)           | R2 `aphrody-dist`                                                                               | workers.dev seulement                                                                | `infra/deploy.toml`                                |
| api-aphrody-com         | fetch                                  | R2 `aphrody-dist` (`sites/api.aphrody.com/v1/openapi`)                                          | api.aphrody.com                                                                      | `infra/cloudflare/workers/api-gateway`                  |
| aphrody-github          | fetch                                  | Queue `github-events`, secret webhook                                                           | workers.dev seulement                                                                | `infra/cloudflare/workers/github-app`              |
| aphrody-email-worker    | email, fetch                           | KV, D1                                                                                          | Email Routing `inbound@aphrody.app`                                                  | non localisée                                      |
| aphrody-webos           | fetch                                  | service `aphrody-app`, R2 `aphrody-assets`                                                      | 15 domaines `*craft.aphrody.app` + apt, 19 routes aphrody.app, 15 routes aphrody.com | non localisée                                      |
| yolo-aphrody-com        | fetch                                  | —                                                                                               | yolo.aphrody.com                                                                     | `apps/yolo` (probable)                             |
| bun-video-showcase      | fetch                                  | R2 `aphrody-video` (`showcase/20261022-v3`)                                                     | route `video.aphrody.com/*` (masquée par la redirection vers bun.aphrody.com)        | non localisée                                      |
| shenron-cdn             | fetch                                  | R2 `shenron-cdn`, manifestes JSON                                                               | route `cdn.dragonballfr.com/*`                                                       | `apps/shenron/deploy/cloudflare`                   |
| rosegriffon-maintenance | fetch                                  | assets                                                                                          | **aucune**                                                                           | `apps/rosegriffon/infra/cloudflare/maintenance`    |

Observabilité : logs persistés activés (échantillonnage 1), traces désactivées, Logpush désactivé.

## 4. R2 et préfixes CDN

| Bucket           | Domaine public                                | Préfixes de premier niveau                                                                                                                                                                                                 | CORS | Taille (dashboard)     |
| ---------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------------------- |
| aphrody-assets   | assets.aphrody.app (+ Worker cdn.aphrody.com) | `brand/v1/`, `m3/`, `manifests/`, `objects/`, `pet/`, `sha256/`, `webos/`, `index.html`, `manifest.json`                                                                                                                   | oui  | 105 Mo, 414 objets     |
| aphrody-dist     | dist.aphrody.app                              | `aphrody/`, `bun/`, `bun-v1/`, `bun-video/`, `datasets/`, `deploys/{_platform,aphrody,yolo}/`, `objects/`, `packages/bun-video/`, `qualification/`, `sites/{aphrody.app,aphrody.com,api.aphrody.com,creator.aphrody.com}/` | oui  | 17,4 Go, 37,6 k objets |
| aphrody-video    | video.aphrody.app, video.aphrody.com          | `showcase/`                                                                                                                                                                                                                | oui  | 19,9 Mo                |
| bun-lib          | bun-lib.aphrody.app                           | `media/`                                                                                                                                                                                                                   | non  | 283 Mo                 |
| aphrody-archive  | —                                             | `fleet/`, `fr1/`                                                                                                                                                                                                           | non  | 81,3 Go, 1,67 M objets |
| aphrody-chromium | —                                             | `toolchain/`                                                                                                                                                                                                               | non  | 1,01 Go                |
| aphrody-lore     | —                                             | `prd/`                                                                                                                                                                                                                     | non  | 236 Mo                 |
| bun-os-private   | —                                             | vide                                                                                                                                                                                                                       | non  | 0                      |
| dbfr-backups     | —                                             | `encrypted/`                                                                                                                                                                                                               | non  | 1,01 Go                |
| rosegriffon-cdn  | r2.rosegriffon.fr                             | `static/`                                                                                                                                                                                                                  | non  | —                      |
| shenron-cdn      | **r2.dev public activé**                      | `_migration/`, `_objects/`                                                                                                                                                                                                 | oui  | —                      |
| iecode-vfs (EU)  | —                                             | vide                                                                                                                                                                                                                       | —    | 0                      |
| rg-assets (EU)   | —                                             | non listé                                                                                                                                                                                                                  | —    | —                      |

`recon.ts` ne voit pas les buckets EU (en-tête `cf-r2-jurisdiction: eu` requis) : `cf r2 buckets list --cf-r2-jurisdiction eu`.

## 5. Tunnels (ingress)

| Tunnel       | Connecteurs (version)                                       | Ingress                                                                                                                                                                                                                                                |
| ------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| mig-prd      | 12 sur fr1, fr2, prd (2026.10.7, 2026.11.0)                 | mig-test/-downloads/-depot/-commons → LB cluster 127.0.0.1:19780/19797/19182/19766 ; ssh-prd → ssh 19022 ; dbfr.aphrody.com, nie.aphrody.app, fleet-failover-test → veille 29401/29402 ; aphrody.com et *.aphrody.com → LB 19300 ; *.aphrody.app → 404 |
| prod         | 4 sur prd (2026.10.7)                                       | aphrody.app, desktop.aphrody.app → 127.0.0.1:8793                                                                                                                                                                                                      |
| fr2          | 4 sur fr2 (2026.11.0)                                       | ssh-fr2 → ssh 127.0.0.1:22                                                                                                                                                                                                                             |
| auto-usa     | 4 sur prd (2026.10.6)                                       | auto.aphrody.com → http://auto-web:3001                                                                                                                                                                                                                |
| shenron-dbfr | 8 sur prd + 1 connecteur hors flotte (2026.10.0, 2026.10.6) | dragonballfr.com, www, bot, mcp, origin-cdn → https://127.0.0.1:443                                                                                                                                                                                    |

Dernière version publiée de cloudflared : 2026.11.0 (2026-11-12, `gh api repos/cloudflare/cloudflared/releases/latest`) ;
`auto-usa`, `prod` et `shenron-dbfr` sont en retard.

## 6. Règles (cache, WAF, redirections, origine)

| Zone             | Phase                 | Action             | Règle                                                                                       |
| ---------------- | --------------------- | ------------------ | ------------------------------------------------------------------------------------------- |
| aphrody.app      | cache                 | set_cache_settings | R2 CDN hosts (cdn, dragonballfr, assets.aphrody.app) : 30 jours en edge                     |
| aphrody.app      | cache                 | set_cache_settings | dist.aphrody.app : objets versionnés 1 an                                                   |
| aphrody.app      | cache                 | set_cache_settings | dist.aphrody.app `latest.json` et canaux : 1 minute                                         |
| aphrody.app      | cache                 | set_cache_settings | craft.aphrody.app : wasm/js/css/otf/ttf éligibles, Cache-Control de l'origine               |
| aphrody.app      | redirect              | redirect           | www.aphrody.app → aphrody.app                                                               |
| aphrody.app      | redirect              | redirect           | chemins Bun (install, docs, api) → bun.aphrody.app                                          |
| aphrody.app      | WAF custom            | block              | sondes de scanners (/.env, /.git, wp-*, php)                                                |
| aphrody.com      | rate limit            | block              | limite par IP sur api, downloads, cdn                                                       |
| aphrody.com      | cache                 | set_cache_settings | cdn.aphrody.com : Cache-Control de l'origine                                                |
| aphrody.com      | cache                 | set_cache_settings | auto : contournement pour sessions, auth, routes privées                                    |
| aphrody.com      | redirect              | redirect           | video.aphrody.com → bun.aphrody.com                                                         |
| aphrody.com      | WAF custom            | block              | mig-downloads réservé à fr2                                                                 |
| aphrody.com      | WAF custom            | block              | sondes de scanners                                                                          |
| aphrody.com      | page rules (héritées) | cache everything   | `cdn.aphrody.com/*` et `*aphrody.com/assets/*` : navigateur 1 an, edge 30 jours             |
| dragonballfr.com | cache                 | set_cache_settings | 4 règles : CDN, médias natifs (plages d'octets), MP4 source, HTML servi périmé si prd tombe |
| rosegriffon.fr   | cache                 | set_cache_settings | cdn.rosegriffon.fr ; HTML servi périmé si prd tombe                                         |
| rosegriffon.fr   | origin                | route              | ports d'origine prd (8443, 9443 pour apex et www)                                           |

WAF géré : seul le « Cloudflare Managed Free Ruleset » (version 84) est disponible sur le plan Free.
`cdn.aphrody.app` et `dragonballfr.aphrody.app`, cités par la première règle de cache d'aphrody.app, n'ont aucun
enregistrement DNS.

## 7. Index DNS → service → origine

Lecture : « Service (edge) » est ce qui répond en premier (custom domain Worker > route Worker > tunnel/proxy) ;
« Origine » est la cible réseau si le Worker ou le proxy va jusqu'à l'origine. `100::` est un placeholder (Worker seul).
« LB cluster » = HAProxy présent sur fr1, fr2 et prd (`infra/cluster`). Hôtes : fr1 = OVH VPS, fr2 = OVH Public Cloud,
prd = Hostinger (`infra/fleet/RUNBOOK.md`). Une route sans `*` (ex. `assets.aphrody.app/`) ne capte que la racine.

### 3dland.tech (2 enregistrements, zone pending)

| Nom             | Type  | Cible DNS    | Proxy | Service (edge) | Origine          |
| --------------- | ----- | ------------ | ----- | -------------- | ---------------- |
| 3dland.tech     | A     | 72.60.186.43 | oui   | proxy CDN      | prd 72.60.186.43 |
| www.3dland.tech | CNAME | 3dland.tech  | oui   | proxy CDN      | 3dland.tech      |

### aphrody.app (60 enregistrements, zone active)

| Nom                               | Type  | Cible DNS                                        | Proxy | Service (edge)                                                                     | Origine                                            |
| --------------------------------- | ----- | ------------------------------------------------ | ----- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| _dmarc.aphrody.app                | TXT   | (DMARC)                                          | non   | —                                                                                  |                                                    |
| *.aphrody.app                     | AAAA  | 100::                                            | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | placeholder (Worker seul)                          |
| aphrody.app                       | AAAA  | 100::                                            | oui   | Worker aphrody-deploy (custom domain)                                              | placeholder (Worker seul)                          |
| aphrody.app                       | CAA   | 0 iodef "mailto:contact@aphrody.com"             | non   | CAA                                                                                |                                                    |
| aphrody.app                       | CAA   | 0 issuewild "ssl.com"                            | non   | CAA                                                                                |                                                    |
| aphrody.app                       | CAA   | 0 issue "ssl.com"                                | non   | CAA                                                                                |                                                    |
| aphrody.app                       | CAA   | 0 issuewild "pki.goog; cansignhttpexchanges=yes" | non   | CAA                                                                                |                                                    |
| aphrody.app                       | CAA   | 0 issue "pki.goog; cansignhttpexchanges=yes"     | non   | CAA                                                                                |                                                    |
| aphrody.app                       | CAA   | 0 issuewild "letsencrypt.org"                    | non   | CAA                                                                                |                                                    |
| aphrody.app                       | CAA   | 0 issue "letsencrypt.org"                        | non   | CAA                                                                                |                                                    |
| aphrody.app                       | MX    | 80 route3.mx.cloudflare.net                      | non   | mail entrant                                                                       | Email Routing                                      |
| aphrody.app                       | MX    | 94 route2.mx.cloudflare.net                      | non   | mail entrant                                                                       | Email Routing                                      |
| aphrody.app                       | MX    | 72 route1.mx.cloudflare.net                      | non   | mail entrant                                                                       | Email Routing                                      |
| aphrody.app                       | TXT   | (SPF)                                            | non   | —                                                                                  |                                                    |
| api.aphrody.app                   | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-audio.aphrody.app             | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-audio.aphrody.app/*)                               | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-cad.aphrody.app               | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-cad.aphrody.app/*)                                 | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-compositing.aphrody.app       | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-compositing.aphrody.app/*)                         | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-documents.aphrody.app         | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-documents.aphrody.app/*)                           | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-generation.aphrody.app        | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-generation.aphrody.app/*)                          | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-images.aphrody.app            | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-images.aphrody.app/*)                              | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-interface-layouts.aphrody.app | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-interface-layouts.aphrody.app/*)                   | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-layout.aphrody.app            | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-layout.aphrody.app/*)                              | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-pdf.aphrody.app               | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-pdf.aphrody.app/*)                                 | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-photo-processing.aphrody.app  | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-photo-processing.aphrody.app/*)                    | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-slides.aphrody.app            | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-slides.aphrody.app/*)                              | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-tables.aphrody.app            | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-tables.aphrody.app/*)                              | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-vectors.aphrody.app           | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-vectors.aphrody.app/*)                             | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| app-video.aphrody.app             | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route app-video.aphrody.app/*)                               | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| apt.aphrody.app                   | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| artcraft.aphrody.app              | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| assets.aphrody.app                | CNAME | public.r2.dev                                    | oui   | R2 aphrody-assets + Worker aphrody-webos (route assets.aphrody.app/, racine seule) | R2                                                 |
| auth.aphrody.app                  | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| bun-lib.aphrody.app               | CNAME | public.r2.dev                                    | oui   | R2 bun-lib + Worker aphrody-webos (route bun-lib.aphrody.app/, racine seule)       | R2                                                 |
| bun.aphrody.app                   | AAAA  | 100::                                            | oui   | Worker aphrody-app (custom domain)                                                 | placeholder (Worker seul)                          |
| cadcraft.aphrody.app              | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| cf2024-1._domainkey.aphrody.app   | TXT   | (DKIM)                                           | non   | —                                                                                  |                                                    |
| craft.aphrody.app                 | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| deckcraft.aphrody.app             | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| deploy.aphrody.app                | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| designcraft.aphrody.app           | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| desktop.aphrody.app               | CNAME | tunnel prod                                      | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | http://127.0.0.1:8793 (prd)                        |
| dist.aphrody.app                  | CNAME | public.r2.dev                                    | oui   | R2 aphrody-dist + Worker aphrody-webos (route dist.aphrody.app/, racine seule)     | R2                                                 |
| effectcraft.aphrody.app           | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| figcraft.aphrody.app              | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| filmcraft.aphrody.app             | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| git.aphrody.app                   | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| gridcraft.aphrody.app             | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| lightcraft.aphrody.app            | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| nie.aphrody.app                   | A     | 51.255.162.6                                     | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | fr2 51.255.162.6                                   |
| pdfcraft.aphrody.app              | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| photocraft.aphrody.app            | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| play.aphrody.app                  | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-webos (route play.aphrody.app/, racine seule)                       | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| shell.aphrody.app                 | AAAA  | 100::                                            | oui   | Worker aphrody-app-site (custom domain)                                            | placeholder (Worker seul)                          |
| soundcraft.aphrody.app            | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| source.aphrody.app                | CNAME | tunnel mig-prd                                   | oui   | Worker aphrody-deploy (route _.aphrody.app/_)                                      | http_status:404 (LB cluster, réplicas fr1/fr2/prd) |
| vectorcraft.aphrody.app           | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| video.aphrody.app                 | CNAME | public.r2.dev                                    | oui   | R2 aphrody-video + Worker aphrody-webos (route video.aphrody.app/, racine seule)   | R2                                                 |
| wordcraft.aphrody.app             | AAAA  | 100::                                            | oui   | Worker aphrody-webos (custom domain)                                               | placeholder (Worker seul)                          |
| www.aphrody.app                   | AAAA  | 100::                                            | oui   | Worker aphrody-deploy (custom domain)                                              | placeholder (Worker seul)                          |

### aphrody.com (73 enregistrements, zone active)

| Nom                                         | Type  | Cible DNS                                                | Proxy | Service (edge)                                                           | Origine                                                   |
| ------------------------------------------- | ----- | -------------------------------------------------------- | ----- | ------------------------------------------------------------------------ | --------------------------------------------------------- |
| _autodiscover._tcp.aphrody.com              | SRV   | 0 443 zimbra1.mail.ovh.net                               | non   | SRV                                                                      |                                                           |
| _dmarc.aphrody.com                          | TXT   | (DMARC)                                                  | non   | —                                                                        |                                                           |
| admin.aphrody.com                           | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| ai.aphrody.com                              | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| aphrody.com                                 | CAA   | 0 issuewild "pki.goog; cansignhttpexchanges=yes"         | non   | CAA                                                                      |                                                           |
| aphrody.com                                 | CAA   | 0 issue "pki.goog; cansignhttpexchanges=yes"             | non   | CAA                                                                      |                                                           |
| aphrody.com                                 | CAA   | 0 issuewild "letsencrypt.org"                            | non   | CAA                                                                      |                                                           |
| aphrody.com                                 | CAA   | 0 issue "letsencrypt.org"                                | non   | CAA                                                                      |                                                           |
| aphrody.com                                 | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody (route aphrody.com/*)                                     | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| aphrody.com                                 | MX    | 1 mx0.mail.ovh.net                                       | non   | mail entrant                                                             | mx0.mail.ovh.net                                          |
| aphrody.com                                 | MX    | 50 mx2.mail.ovh.net                                      | non   | mail entrant                                                             | mx2.mail.ovh.net                                          |
| aphrody.com                                 | MX    | 100 mx3.mail.ovh.net                                     | non   | mail entrant                                                             | mx3.mail.ovh.net                                          |
| aphrody.com                                 | MX    | 5 mx1.mail.ovh.net                                       | non   | mail entrant                                                             | mx1.mail.ovh.net                                          |
| aphrody.com                                 | TXT   | (SPF)                                                    | non   | —                                                                        |                                                           |
| api.aphrody.com                             | AAAA  | 100::                                                    | oui   | Worker api-aphrody-com (custom domain)                                   | placeholder (Worker seul)                                 |
| art.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route art.aphrody.com/*)                           | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| auth.aphrody.com                            | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| auto.aphrody.com                            | CNAME | tunnel auto-usa                                          | oui   | Tunnel                                                                   | http://auto-web:3001 (prd, conteneur)                     |
| bot.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| bun.aphrody.com                             | AAAA  | 100::                                                    | oui   | Worker aphrody-app (custom domain)                                       | placeholder (Worker seul)                                 |
| bxc.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| cad.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route cad.aphrody.com/*)                           | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| calendar.aphrody.com                        | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route calendar.aphrody.com/*)                      | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| cdn.aphrody.com                             | AAAA  | 100::                                                    | oui   | Worker cdn-aphrody-com (custom domain)                                   | placeholder (Worker seul)                                 |
| chat.aphrody.com                            | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| console.aphrody.com                         | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route console.aphrody.com/*)                       | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| control.aphrody.com                         | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| creator.aphrody.com                         | AAAA  | 100::                                                    | oui   | Worker creator-aphrody-com (custom domain)                               | placeholder (Worker seul)                                 |
| dbfr.aphrody.com                            | A     | 51.255.162.6                                             | oui   | proxy CDN                                                                | fr2 51.255.162.6                                          |
| dbfr.aphrody.com                            | AAAA  | 2001:41d0:305:2100::a461                                 | oui   | proxy CDN                                                                | fr2 2001:41d0:305:2100::a461                              |
| design.aphrody.com                          | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route design.aphrody.com/*)                        | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| docs.aphrody.com                            | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route docs.aphrody.com/*)                          | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| downloads.aphrody.com                       | AAAA  | 100::                                                    | oui   | Worker downloads-aphrody-com (custom domain)                             | placeholder (Worker seul)                                 |
| drive.aphrody.com                           | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| fig.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route fig.aphrody.com/*)                           | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| inacord.aphrody.com                         | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| mail.aphrody.com                            | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| maps.aphrody.com                            | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route maps.aphrody.com/*)                          | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| mcp.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| meet.aphrody.com                            | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| mig-commons.aphrody.com                     | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19766 (LB cluster, réplicas fr1/fr2/prd) |
| mig-depot.aphrody.com                       | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19182 (LB cluster, réplicas fr1/fr2/prd) |
| mig-downloads.aphrody.com                   | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19797 (LB cluster, réplicas fr1/fr2/prd) |
| mig-test.aphrody.com                        | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19780 (LB cluster, réplicas fr1/fr2/prd) |
| n2b.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| nie.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| os.aphrody.com                              | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route os.aphrody.com/*)                            | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| ovhmo-selector-1._domainkey.aphrody.com     | CNAME | ovhmo-selector-1._domainkey.4861041.dp.dkim.mail.ovh.net | non   | DNS seul                                                                 | ovhmo-selector-1._domainkey.4861041.dp.dkim.mail.ovh.net  |
| ovhmo-selector-2._domainkey.aphrody.com     | CNAME | ovhmo-selector-2._domainkey.4861042.dp.dkim.mail.ovh.net | non   | DNS seul                                                                 | ovhmo-selector-2._domainkey.4861042.dp.dkim.mail.ovh.net  |
| pdf.aphrody.com                             | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route pdf.aphrody.com/*)                           | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| photos.aphrody.com                          | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route photos.aphrody.com/*)                        | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| play.aphrody.com                            | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route play.aphrody.com/*)                          | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| recette-auto.aphrody.com                    | CNAME | tunnel ?                                                 | oui   | Tunnel                                                                   | ?                                                         |
| resend._domainkey.aphrody.com               | TXT   | (texte)                                                  | non   | —                                                                        |                                                           |
| resend._domainkey.notifications.aphrody.com | TXT   | (texte)                                                  | non   | —                                                                        |                                                           |
| rsend.aphrody.com                           | CNAME | rsend-euw1.forge.rmta.net                                | non   | DNS seul                                                                 | rsend-euw1.forge.rmta.net                                 |
| rsend.notifications.aphrody.com             | CNAME | rsend-euw1.forge.rmta.net                                | non   | DNS seul                                                                 | rsend-euw1.forge.rmta.net                                 |
| search.aphrody.com                          | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| send.aphrody.com                            | CNAME | send.forge.rmta.net                                      | non   | DNS seul                                                                 | send.forge.rmta.net                                       |
| send.notifications.aphrody.com              | CNAME | send.forge.rmta.net                                      | non   | DNS seul                                                                 | send.forge.rmta.net                                       |
| sheets.aphrody.com                          | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route sheets.aphrody.com/*)                        | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| slides.aphrody.com                          | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route slides.aphrody.com/*)                        | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| sound.aphrody.com                           | CNAME | tunnel mig-prd                                           | oui   | Worker aphrody-webos (route sound.aphrody.com/*)                         | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| ssh-fr2.aphrody.com                         | CNAME | tunnel fr2                                               | oui   | Tunnel                                                                   | ssh://127.0.0.1:22 (fr2)                                  |
| ssh-prd.aphrody.com                         | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | ssh://127.0.0.1:19022 (LB cluster, réplicas fr1/fr2/prd)  |
| status.aphrody.com                          | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| store.aphrody.com                           | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| translate.aphrody.com                       | CNAME | tunnel mig-prd                                           | oui   | Tunnel                                                                   | http://127.0.0.1:19300 (LB cluster, réplicas fr1/fr2/prd) |
| video.aphrody.com                           | CNAME | public.r2.dev                                            | oui   | R2 aphrody-video + Worker bun-video-showcase (route video.aphrody.com/*) | R2                                                        |
| vps.aphrody.com                             | A     | 51.77.147.152                                            | non   | DNS seul                                                                 | fr1 51.77.147.152                                         |
| vps.aphrody.com                             | AAAA  | 2001:41d0:404:200::4d8e                                  | non   | DNS seul                                                                 | fr1 2001:41d0:404:200::4d8e                               |
| www.aphrody.com                             | AAAA  | 100::                                                    | oui   | Worker aphrody (custom domain)                                           | placeholder (Worker seul)                                 |
| yolo.aphrody.com                            | AAAA  | 100::                                                    | oui   | Worker yolo-aphrody-com (custom domain)                                  | placeholder (Worker seul)                                 |

### dragonballfr.com (19 enregistrements, zone active)

| Nom                         | Type  | Cible DNS                                        | Proxy | Service (edge)                                    | Origine          |
| --------------------------- | ----- | ------------------------------------------------ | ----- | ------------------------------------------------- | ---------------- |
| _dmarc.dragonballfr.com     | TXT   | (DMARC)                                          | non   | —                                                 |                  |
| bot.dragonballfr.com        | A     | 72.60.186.43                                     | oui   | proxy CDN                                         | prd 72.60.186.43 |
| cdn.dragonballfr.com        | A     | 72.60.186.43                                     | oui   | Worker shenron-cdn (route cdn.dragonballfr.com/*) | prd 72.60.186.43 |
| dragonballfr.com            | A     | 72.60.186.43                                     | oui   | proxy CDN                                         | prd 72.60.186.43 |
| dragonballfr.com            | CAA   | 0 issuewild "pki.goog; cansignhttpexchanges=yes" | non   | CAA                                               |                  |
| dragonballfr.com            | CAA   | 0 issue "pki.goog; cansignhttpexchanges=yes"     | non   | CAA                                               |                  |
| dragonballfr.com            | CAA   | 0 issuewild "letsencrypt.org"                    | non   | CAA                                               |                  |
| dragonballfr.com            | CAA   | 0 issue "letsencrypt.org"                        | non   | CAA                                               |                  |
| dragonballfr.com            | MX    | 100 mx3.mail.ovh.net                             | non   | mail entrant                                      | mx3.mail.ovh.net |
| dragonballfr.com            | MX    | 5 mx2.mail.ovh.net                               | non   | mail entrant                                      | mx2.mail.ovh.net |
| dragonballfr.com            | MX    | 1 mx1.mail.ovh.net                               | non   | mail entrant                                      | mx1.mail.ovh.net |
| dragonballfr.com            | TXT   | (SPF)                                            | non   | —                                                 |                  |
| files.dragonballfr.com      | A     | 72.60.186.43                                     | oui   | proxy CDN                                         | prd 72.60.186.43 |
| ftp.dragonballfr.com        | CNAME | dragonballfr.com                                 | non   | DNS seul                                          | dragonballfr.com |
| game-api.dragonballfr.com   | A     | 72.60.186.43                                     | oui   | proxy CDN                                         | prd 72.60.186.43 |
| mcp.dragonballfr.com        | A     | 72.60.186.43                                     | oui   | proxy CDN                                         | prd 72.60.186.43 |
| origin-cdn.dragonballfr.com | A     | 72.60.186.43                                     | oui   | proxy CDN                                         | prd 72.60.186.43 |
| play.dragonballfr.com       | A     | 72.60.186.43                                     | oui   | proxy CDN                                         | prd 72.60.186.43 |
| www.dragonballfr.com        | A     | 72.60.186.43                                     | oui   | proxy CDN                                         | prd 72.60.186.43 |

### rosegriffon.fr (35 enregistrements, zone active)

| Nom                                                 | Type  | Cible DNS                                                      | Proxy | Service (edge)     | Origine                                                        |
| --------------------------------------------------- | ----- | -------------------------------------------------------------- | ----- | ------------------ | -------------------------------------------------------------- |
| _autodiscover._tcp.rosegriffon.fr                   | SRV   | 0 443 mailconfig.ovh.net                                       | non   | SRV                |                                                                |
| _gh-rose-griffon-o.rosegriffon.fr                   | TXT   | (jeton de service)                                             | non   | —                  |                                                                |
| _github-pages-challenge-rose-griffon.rosegriffon.fr | TXT   | (jeton de service)                                             | non   | —                  |                                                                |
| _imaps._tcp.rosegriffon.fr                          | SRV   | 0 993 ssl0.ovh.net                                             | non   | SRV                |                                                                |
| _submission._tcp.rosegriffon.fr                     | SRV   | 0 465 ssl0.ovh.net                                             | non   | SRV                |                                                                |
| _vercel.rosegriffon.fr                              | TXT   | (vérification de domaine)                                      | non   | —                  |                                                                |
| _vercel.rosegriffon.fr                              | TXT   | (vérification de domaine)                                      | non   | —                  |                                                                |
| _vercel.rosegriffon.fr                              | TXT   | (vérification de domaine)                                      | non   | —                  |                                                                |
| _vercel.rosegriffon.fr                              | TXT   | (vérification de domaine)                                      | non   | —                  |                                                                |
| achillea.rosegriffon.fr                             | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| api.rosegriffon.fr                                  | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| autoconfig.rosegriffon.fr                           | CNAME | mailconfig.ovh.net                                             | non   | DNS seul           | mailconfig.ovh.net                                             |
| autodiscover.rosegriffon.fr                         | CNAME | mailconfig.ovh.net                                             | non   | DNS seul           | mailconfig.ovh.net                                             |
| azalee.rosegriffon.fr                               | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| bot.rosegriffon.fr                                  | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| cdn.rosegriffon.fr                                  | A     | 51.255.162.6                                                   | oui   | proxy CDN          | fr2 51.255.162.6                                               |
| db.rosegriffon.fr                                   | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| ftp.rosegriffon.fr                                  | CNAME | rosegriffon.fr                                                 | non   | DNS seul           | rosegriffon.fr                                                 |
| google._domainkey.rosegriffon.fr                    | TXT   | (DKIM)                                                         | non   | —                  |                                                                |
| imap.rosegriffon.fr                                 | CNAME | ssl0.ovh.net                                                   | non   | DNS seul           | ssl0.ovh.net                                                   |
| mail.rosegriffon.fr                                 | CNAME | ssl0.ovh.net                                                   | non   | DNS seul           | ssl0.ovh.net                                                   |
| mcp.rosegriffon.fr                                  | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| ovhmo5380100-selector1._domainkey.rosegriffon.fr    | CNAME | ovhmo5380100-selector1._domainkey.4076964.oh.dkim.mail.ovh.net | non   | DNS seul           | ovhmo5380100-selector1._domainkey.4076964.oh.dkim.mail.ovh.net |
| ovhmo5380100-selector2._domainkey.rosegriffon.fr    | CNAME | ovhmo5380100-selector2._domainkey.4076963.oh.dkim.mail.ovh.net | non   | DNS seul           | ovhmo5380100-selector2._domainkey.4076963.oh.dkim.mail.ovh.net |
| pop3.rosegriffon.fr                                 | CNAME | ssl0.ovh.net                                                   | non   | DNS seul           | ssl0.ovh.net                                                   |
| r2.rosegriffon.fr                                   | CNAME | public.r2.dev                                                  | oui   | R2 rosegriffon-cdn | R2                                                             |
| ranked.rosegriffon.fr                               | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| rosegriffon.fr                                      | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| rosegriffon.fr                                      | MX    | 1 ssl0.ovh.net                                                 | non   | mail entrant       | ssl0.ovh.net                                                   |
| rosegriffon.fr                                      | TXT   | (vérification de domaine)                                      | non   | —                  |                                                                |
| rosegriffon.fr                                      | TXT   | (vérification de domaine)                                      | non   | —                  |                                                                |
| rosegriffon.fr                                      | TXT   | (SPF)                                                          | non   | —                  |                                                                |
| shop.rosegriffon.fr                                 | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |
| smtp.rosegriffon.fr                                 | CNAME | ssl0.ovh.net                                                   | non   | DNS seul           | ssl0.ovh.net                                                   |
| www.rosegriffon.fr                                  | A     | 72.60.186.43                                                   | oui   | proxy CDN          | prd 72.60.186.43                                               |

## 8. Dépôts github.com/cloudflare utiles au web

Vérifiés par `gh api` le 2026-11-13 (étoiles, dernier push, licence, dernière release, commit de tête).

| Dépôt                              | Rôle                                                                                                          | Release                               | Tête       | Licence            | Usage chez nous                                  |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ---------- | ------------------ | ------------------------------------------------ |
| cloudflare/vinext                  | plugin Vite qui réimplémente l'API Next.js 16 (App/Pages Router, RSC, ISR, `next/image`), déploiement Workers | @vinext/cloudflare@1.3.4 (2026-11-10) | ef897ed727 | MIT                | absent                                           |
| cloudflare/workers-sdk             | Wrangler, Miniflare, plugin Vite                                                                              | wrangler@4.161.0 (2026-11-12)         | 61eacca214 | Apache-2.0         | wrangler 4.161.0 installé (à jour)               |
| cloudflare/cf                      | CLI agentique de toute l'API                                                                                  | —                                     | —          | Apache-2.0         | cf 1.0.0-beta.31 installé                        |
| cloudflare/workerd                 | runtime JS/Wasm des Workers                                                                                   | v1.20261113.1 (2026-11-13)            | d89edf661a | Apache-2.0         | indirect (wrangler dev)                          |
| cloudflare/agents                  | SDK Agents (DO, état, MCP)                                                                                    | agents@0.33.0 (2026-11-03)            | 46daba47a5 | MIT                | absent                                           |
| cloudflare/cloudflared             | client Tunnel                                                                                                 | 2026.11.0 (2026-11-12)                | b0297f0b24 | Apache-2.0         | 5 tunnels, 3 en retard                           |
| cloudflare/kumo                    | bibliothèque de composants web                                                                                | @cloudflare/kumo@2.18.1 (2026-11-12)  | eaa9e173b2 | MIT                | absent (design system maison `aphrody-design-*`) |
| cloudflare/cloudflare-os           | espace de travail agent sur Workers                                                                           | —                                     | —          | Apache-2.0         | absent                                           |
| cloudflare/capnweb                 | RPC objet-capacité JS/TS                                                                                      | —                                     | —          | MIT                | absent                                           |
| cloudflare/workers-oauth-provider  | fournisseur OAuth pour Workers                                                                                | —                                     | —          | MIT                | absent (Access + Turnstile)                      |
| cloudflare/workers-rs              | Workers en Rust/Wasm                                                                                          | —                                     | —          | Apache-2.0         | absent                                           |
| cloudflare/sandbox-sdk, containers | bacs à sable et conteneurs                                                                                    | —                                     | —          | —                  | absent                                           |
| cloudflare/lol-html                | réécriture HTML en flux (HTMLRewriter)                                                                        | —                                     | —          | BSD-3-Clause       | `apps/yolo` (HTMLRewriter)                       |
| cloudflare/templates               | gabarits Workers                                                                                              | —                                     | —          | MIT                | non utilisé                                      |
| cloudflare/skills                  | skills d'agents Cloudflare                                                                                    | —                                     | —          | Apache-2.0         | plugin `cloudflare:*` installé                   |
| cloudflare/mcp-server-cloudflare   | serveurs MCP produit                                                                                          | —                                     | —          | Apache-2.0         | MCP `plugin_cloudflare`                          |
| cloudflare/pingora, quiche         | proxy Rust, QUIC/HTTP3                                                                                        | —                                     | —          | Apache-2.0 / BSD-2 | absent                                           |
| cloudflare/cloudflare-docs         | documentation                                                                                                 | —                                     | —          | CC-BY-4.0          | lue via `cf docs search`                         |

## 9. Matrice de fonctionnalités Cloudflare → notre équivalent

| Fonctionnalité                               | Source                       | Notre équivalent                                                                                                               |
| -------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| DNS autoritaire + IaC                        | Cloudflare DNS (189 enr.)    | `infra/cloudflare/cloudflare.toml` [dns] + `cf.ts plan/apply` (aphrody.com/app seulement ; zones produit hors IaC)             |
| Workers (custom domains, routes)             | 17 Workers                   | `apps/aphrody`, `packages/deploy`, `apps/aphrody-app`, `infra/fleet/workers/*`, `infra/deploy.toml` ; 3 sources non localisées |
| Framework Next.js sur Workers                | vinext                       | absent (sites = Workers bun maison)                                                                                            |
| CDN objets                                   | R2 + custom domains          | `aphrody-assets` (ay brand build → `brand/v1/`), `aphrody-dist` (`sites/`, `deploys/`)                                         |
| Cache rules / page rules                     | Rulesets cache               | `cloudflare.toml` [[rules]] ; 2 page rules héritées hors IaC                                                                   |
| WAF custom + rate limit                      | Rulesets                     | `cloudflare.toml` [[rules]] (remplace nginx fr2)                                                                               |
| WAF géré                                     | Managed Free Ruleset         | Cloudflare seul                                                                                                                |
| Redirections                                 | Dynamic redirects            | `cloudflare.toml` [[rules]]                                                                                                    |
| Origin rules                                 | http_request_origin          | rosegriffon.fr seulement                                                                                                       |
| Tunnels                                      | cloudflared                  | `cloudflare.toml` [tunnels] + LB cluster HAProxy                                                                               |
| Zero Trust Access                            | Access apps + jetons         | `cloudflare.toml` [access]                                                                                                     |
| Email entrant                                | Email Routing + Email Worker | `aphrody-email-worker` (source non localisée)                                                                                  |
| Anti-bot                                     | Turnstile                    | `aphrody-auth-turnstile`                                                                                                       |
| Stockage KV/D1/DO/Queues/Workflows/Vectorize | Developer Platform           | `apps/aphrody-app`                                                                                                             |
| IA                                           | Workers AI + AI Gateway      | `apps/aphrody-app` (AI, AI_GATEWAY)                                                                                            |
| Images                                       | Images binding               | `/_aphrody/image` (`packages/deploy`, `apps/aphrody`)                                                                          |
| Pages                                        | Cloudflare Pages             | absent (0 projet, tout sur Workers)                                                                                            |
| DNSSEC                                       | DNSSEC                       | actif sur aphrody.app ; pending aphrody.com et dragonballfr.com                                                                |
| Certificats avancés                          | ACM (Google Trust Services)  | 26 certificats avancés aphrody.com/app                                                                                         |
| Observabilité                                | Workers Logs                 | logs persistés activés ; traces et Logpush absents                                                                             |
| Agents                                       | agents SDK                   | absent                                                                                                                         |
| Composants UI                                | kumo                         | absent (crates `aphrody-design-*`)                                                                                             |

## 10. Écarts relevés (aucune correction appliquée)

1. 3dland.tech : zone pending, NS encore chez Hostinger ; TLS min 1.0, HTTPS non forcé.
2. DNSSEC pending sur aphrody.com et dragonballfr.com (DS non publiés chez le registrar).
3. Workers sans exposition : `aphrody-com`, `rosegriffon-maintenance` ; `downloads-portable` a un handler scheduled sans cron.
4. Sources absentes de src : `aphrody-webos`, `aphrody-email-worker`, `bun-video-showcase`.
5. `bun-video-showcase` (route `video.aphrody.com/*`) est masqué par la redirection dynamique vers bun.aphrody.com.
6. `shenron-cdn` a le domaine public r2.dev activé.
7. Règle de cache aphrody.app citant `cdn.aphrody.app` et `dragonballfr.aphrody.app`, sans DNS.
8. 2 page rules héritées sur aphrody.com, hors `cloudflare.toml`.
9. Connecteurs cloudflared en retard (`auto-usa`, `prod`, `shenron-dbfr`).
10. Le jeton `CLOUDFLARE_API_TOKEN` ne lit pas le DNS ; Images et Stream illisibles en OAuth.

## 11. Captures (Chrome, session du propriétaire, 2026-11-13)

| Fichier                                              | Page                                         |
| ---------------------------------------------------- | -------------------------------------------- |
| `shots/cloudflare/01-account-home.jpg`               | accueil du compte (zones, Workers)           |
| `shots/cloudflare/02-dns-aphrody-com.jpg`            | DNS aphrody.com (73/200)                     |
| `shots/cloudflare/03-dns-aphrody-app.jpg`            | DNS aphrody.app (60/200)                     |
| `shots/cloudflare/04-workers.jpg`                    | Workers et Pages                             |
| `shots/cloudflare/05-r2-overview.jpg`                | R2, vue d'ensemble (136,43 Go)               |
| `shots/cloudflare/06-r2-buckets.jpg`                 | R2, liste des buckets (dont `iecode-vfs` EU) |
| `shots/cloudflare/07-cache-rules-aphrody-app.jpg`    | Cache Rules aphrody.app                      |
| `shots/cloudflare/08-security-rules-aphrody-com.jpg` | règles de sécurité aphrody.com               |
| `shots/cloudflare/09-worker-routes-aphrody-app.jpg`  | routes Workers aphrody.app                   |

La page Tunnels (déplacée sous Networking) n'a pas pu être capturée : le rendu de l'onglet ne répondait plus (CDP
`Page.captureScreenshot` en délai dépassé, 3 essais). Les tunnels sont relevés par l'API (section 5).
