# Matrice de fonctionnalités : Vercel, Cloudflare, Google contre src

État au 2026-11-13 (recons `docs/replica/recon/*.md`, preuves dans `docs/replica/recon/shots/`). Cible : `docs/replica/ARCHITECTURE.md`.

Statut : **ok** = couvert ; **partiel** ; **absent** ; **hors cible** = écarté par décision (`docs/ui/STACK.md` ou ARCHITECTURE). Priorité : P0 = tranche en cours, P1 = suivant, P2 = plus tard, — = rien à faire. Tranche : T1 edge/CDN, T2 framework/design, T3 build/exploitation.

## Framework (Next.js, vinext)

| Fonctionnalité                                         | Source                         | Chez nous                                                               | Statut                      | Prio | Tranche |
| ------------------------------------------------------ | ------------------------------ | ----------------------------------------------------------------------- | --------------------------- | ---- | ------- |
| Routage par fichiers (page, layout, route, dynamiques) | next.js file conventions       | pages assemblées à la main dans `apps/*/build.ts`                       | absent                      | P0   | T2      |
| not-found / error                                      | next.js                        | 404 statique par site                                                   | partiel                     | P0   | T2      |
| Routes parallèles / interceptées                       | next.js                        | —                                                                       | hors cible                  | —    | —       |
| RSC, Server Actions, streaming SSR                     | next.js, vinext                | — (pas de React)                                                        | hors cible                  | —    | —       |
| SSG / export statique                                  | next.js `output: export`       | `apps/aphrody/build.ts`, `apps/yolo/build.ts`                           | ok (dupliqué)               | P0   | T2      |
| ISR, revalidation par tag                              | next.js, vinext cache adapters | redéploiement par sha                                                   | absent                      | P2   | —       |
| Cache Components / PPR                                 | next.js 16                     | —                                                                       | hors cible                  | —    | —       |
| Metadata API, sitemap, robots, manifest                | next.js                        | `apps/aphrody/src/seo/documents.ts`, `packages/deploy/src/pages.ts`     | partiel (2 copies)          | P0   | T2      |
| llms.txt                                               | —                              | aphrody.com et aphrody.app                                              | ok (2 copies)               | P0   | T2      |
| i18n, hreflang                                         | next.js                        | `apps/aphrody/src/seo/site.ts`                                          | partiel                     | P0   | T2      |
| `next/image` (srcset, AVIF/WebP)                       | next.js, vinext                | `/_aphrody/image` (binding Images)                                      | ok côté edge, helper absent | P0   | T2      |
| `ImageResponse` / OG dynamique (satori)                | vercel/satori                  | OG statiques `ay brand build`                                           | hors cible (agent assets)   | —    | —       |
| `next/font` (subset, preload, fallback métrique)       | next.js                        | sous-ensembles de l'agent assets ; `fonts.googleapis.com` encore chargé | partiel                     | P0   | T2      |
| Police Geist                                           | vercel/geist-font              | WOFF2 dans `assets/brand/gen/fonts`                                     | ok                          | —    | —       |
| headers / redirects déclaratifs                        | next.js                        | `_headers`, `_redirects` écrits à la main                               | partiel                     | P0   | T2      |
| Middleware / multi-zones                               | next.js `proxy`, vinext        | `apps/aphrody/edge/worker.ts` (`/api/*`, `/g/*` vers prd)               | partiel                     | P1   | T1      |
| View Transitions                                       | next.js                        | aphrody.com                                                             | ok                          | —    | —       |
| Binaire unique                                         | vinext `bun build --compile`   | `apps/aphrody` `build:aot`                                              | ok                          | —    | —       |
| Bundler                                                | Turbopack, Vite                | `Bun.build`                                                             | ok                          | —    | —       |
| Traçage de dépendances (nft)                           | vercel/nft                     | inutile (`--compile`)                                                   | hors cible                  | —    | —       |

## Plateforme (Vercel)

| Fonctionnalité                                 | Source                         | Chez nous                                                          | Statut    | Prio | Tranche                     |
| ---------------------------------------------- | ------------------------------ | ------------------------------------------------------------------ | --------- | ---- | --------------------------- |
| Déploiements immuables par commit              | Vercel                         | `deploys/<p>/<sha>/`                                               | ok        | —    | —                           |
| Preview par commit                             | Vercel Previews                | `<p>-<sha7>.aphrody.app`                                           | ok        | —    | —                           |
| Promote / instant rollback                     | Vercel                         | pointeur `_state.json`                                             | ok        | —    | —                           |
| Logs de build                                  | Vercel                         | `deploys/<p>/<sha>.log`                                            | ok        | —    | —                           |
| Cache de build distant                         | Turborepo Remote Cache         | —                                                                  | absent    | P0   | T3                          |
| Upload dédupliqué par contenu                  | Vercel CLI (hash des fichiers) | upload complet à chaque déploiement                                | absent    | P0   | T3                          |
| Build seulement des projets touchés            | turbo `--affected`             | `watch` de `projects.toml`                                         | ok        | —    | —                           |
| Edge Config                                    | Vercel                         | `/_aphrody/config`                                                 | ok        | —    | —                           |
| Web Analytics sans cookie                      | vercel/analytics               | DO `Insights`                                                      | ok        | —    | —                           |
| Speed Insights                                 | vercel/speed-insights          | beacon `/_aphrody/v`, INP approché                                 | ok        | —    | —                           |
| Métriques par route + alertes                  | Vercel Observability           | —                                                                  | absent    | P0   | T1 (données) / T3 (alertes) |
| Événements analytics custom                    | vercel/analytics               | —                                                                  | absent    | P2   | —                           |
| OpenTelemetry                                  | next.js instrumentation        | —                                                                  | absent    | P2   | —                           |
| Deployment Protection                          | Vercel                         | Access sur le dashboard seulement                                  | partiel   | P1   | T3                          |
| Toolbar / commentaires de preview              | Vercel Toolbar                 | —                                                                  | absent    | P2   | —                           |
| Skew protection                                | Vercel                         | assets hashés par contenu (anciens fichiers restent dans leur sha) | absent    | P0   | T2                          |
| Variables par environnement                    | Vercel                         | `projects.toml` `env` + vault                                      | ok        | —    | —                           |
| Feature flags                                  | vercel/flags                   | edge config sans SDK                                               | partiel   | P2   | —                           |
| Cron                                           | Vercel Cron                    | job CI planifié                                                    | absent    | P1   | T3                          |
| API de plateforme sans détail technique public | —                              | `GET /api/projects` publie chemins, commandes, variables, commits  | **écart** | P0   | T1                          |
| Workflow durable, Sandbox                      | vercel/workflow, Sandbox       | —                                                                  | absent    | P2   | —                           |
| AI SDK, AI Gateway                             | vercel/ai                      | `packages/ai-os`                                                   | ok        | —    | —                           |

## Edge et CDN (Cloudflare)

| Fonctionnalité                                           | Source                         | Chez nous                                                   | Statut                        | Prio | Tranche                    |
| -------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------- | ----------------------------- | ---- | -------------------------- |
| Serveur statique R2 unique (Range, SPA, `_headers`, 304) | Workers static assets          | 3 implémentations                                           | partiel (dupliqué)            | P0   | T1                         |
| Assets hashés immuables en même origine                  | `_next/static`, Vite `assets/` | noms fixes servis `max-age=3600`                            | absent                        | P0   | T2 (sortie) / T1 (service) |
| `cdn.aphrody.com/brand/v<N>` immuable                    | R2 + Worker                    | annoncé immuable, servi `max-age=3600` en live              | **écart**                     | P0   | T1 (déploiement du Worker) |
| 404 jamais mises en cache longtemps                      | —                              | `cdn.rosegriffon.fr` (sous-module) 1 an                     | écart hors src                | P1   | —                          |
| Sources de tous les Workers live                         | Workers                        | 5 orphelins                                                 | **écart**                     | P0   | T3                         |
| Collision de nom `aphrody-app`                           | wrangler                       | `apps/aphrody-app/wrangler.toml` écraserait bun.aphrody.app | **écart**                     | P0   | T1                         |
| DNS en IaC                                               | Cloudflare DNS                 | `cloudflare.toml` (aphrody.com/app)                         | partiel                       | P1   | —                          |
| Cache rules / page rules                                 | Rulesets                       | 2 page rules hors IaC, hôtes fantômes dans une règle        | partiel                       | P1   | T3                         |
| WAF custom + rate limit                                  | Rulesets                       | `cloudflare.toml`                                           | ok                            | —    | —                          |
| Turnstile                                                | Cloudflare                     | widget créé, non câblé dans les sites                       | partiel                       | P2   | —                          |
| Tunnels                                                  | cloudflared                    | 5 tunnels, 3 connecteurs hors IaC, versions en retard       | partiel                       | P1   | —                          |
| Access                                                   | Zero Trust                     | dashboard, SSH                                              | ok                            | —    | —                          |
| DNSSEC                                                   | Cloudflare                     | aphrody.app actif ; aphrody.com en attente                  | partiel                       | P1   | — (registrar)              |
| Workers Logs                                             | Observability                  | activé                                                      | ok                            | —    | —                          |
| Traces, Logpush                                          | Observability                  | —                                                           | absent                        | P2   | —                          |
| Next.js sur Workers                                      | vinext                         | sous-modules Next sur prd                                   | hors cible src (sous-modules) | P2   | —                          |
| Agents SDK, kumo, capnweb, workers-rs                    | cloudflare/*                   | —                                                           | hors cible                    | —    | —                          |
| Pages                                                    | Cloudflare Pages               | 0 projet, tout sur Workers                                  | hors cible                    | —    | —                          |

## Google (web, Workspace)

| Fonctionnalité                         | Source                         | Chez nous                                     | Statut             | Prio | Tranche                              |
| -------------------------------------- | ------------------------------ | --------------------------------------------- | ------------------ | ---- | ------------------------------------ |
| Material 3 tokens et couleur dynamique | material-color-utilities 0.4.0 | `packages/design`                             | ok                 | —    | —                                    |
| Material Web                           | `@material/web` 2.5.0          | bundle construit 2 fois                       | partiel (dupliqué) | P0   | T2                                   |
| Material Symbols                       | google/material-design-icons   | sous-ensemble `ay brand build`                | ok                 | —    | —                                    |
| Google Sans Flex auto-hébergée         | google/fonts (OFL)             | encore `fonts.googleapis.com` sur aphrody.com | partiel            | P0   | T2 (helper) / agents sites (bascule) |
| Lighthouse au build                    | lighthouse                     | `wck`                                         | ok                 | —    | —                                    |
| Lighthouse CI terrain                  | lighthouse-ci                  | captures manuelles                            | absent             | P1   | T3                                   |
| web-vitals RUM                         | GoogleChrome/web-vitals        | runtime maison                                | ok                 | —    | —                                    |
| CrUX / PageSpeed API                   | Google APIs                    | API activées, clé absente                     | absent             | P2   | —                                    |
| Service worker / hors-ligne            | workbox                        | —                                             | absent             | P2   | —                                    |
| Préchargement des liens                | quicklink                      | Speculation Rules Cloudflare                  | ok                 | —    | —                                    |
| JSON-LD typé                           | schema-dts                     | JSON-LD manuel testé                          | partiel            | P0   | T2 (helper)                          |
| robots.txt conforme                    | google/robotstxt               | généré + testé                                | ok                 | —    | —                                    |
| Search Console, vérification           | Google                         | aucune vérification                           | absent             | P1   | — (agent SEO)                        |
| GTM / GA4 + Consent Mode v2            | Google                         | code prêt, inactif                            | partiel            | —    | agent SEO                            |
| Workspace (mail, identité)             | Workspace                      | OVH + Email Routing, comptes gmail.com        | hors cible         | —    | —                                    |
