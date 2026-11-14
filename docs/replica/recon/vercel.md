# Recon Vercel (2026-11-13)

Sources lues ce jour : `gh api` (dépôts, releases, arbre `docs/` de vercel/next.js sur `canary`), README de cloudflare/vinext, pages vercel.com lues avec `agent-browser read`, docs Vercel lues avec `vercel docs inspect` (CLI 65.15.0), équipe `aphrody-dev` lue avec la CLI vercel en lecture seule. Captures : `shots/vercel/` (agent-browser 0.42.0, notre Chromium piloté par CDP).

## 1. Ce qui existe côté Vercel / Cloudflare (vérifié)

### Dépôts (gh api, étoiles et dernier push du jour)

| Dépôt                                                                | ★                             | Dernier push                | Dernière release                               | Rôle                                              |
| -------------------------------------------------------------------- | ----------------------------- | --------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| vercel/next.js                                                       | 143 497                       | 2026-11-13                  | v16.4.6 (2026-11-09)                           | framework React (App/Pages Router, RSC)           |
| cloudflare/vinext                                                    | 9 360                         | 2026-11-13                  | @vinext/cloudflare@1.3.4 (2026-11-10)          | API Next.js réimplémentée sur Vite, cible Workers |
| vercel/turborepo                                                     | 31 333                        | 2026-11-13                  | v2.11.11 (2026-11-11)                          | orchestrateur de tâches monorepo + cache distant  |
| vercel/ai                                                            | 27 905                        | 2026-11-13                  | paquets @ai-sdk/* (dernier @ai-sdk/zai@3.0.54) | AI SDK                                            |
| vercel/swr                                                           | 32 490                        | 2026-10-16                  | —                                              | data fetching client                              |
| vercel/vercel                                                        | 16 583                        | 2026-11-12                  | —                                              | CLI + builders                                    |
| vercel/satori                                                        | 14 185                        | 2026-11-12                  | —                                              | HTML/CSS → SVG (base de `ImageResponse`)          |
| vercel/og-image                                                      | 4 034                         | 2023-01-20                  | —                                              | ancien service OG, figé                           |
| vercel/geist-font                                                    | 3 757                         | 2026-11-06                  | —                                              | police Geist (OFL)                                |
| vercel/edge-runtime                                                  | 915                           | 2026-11-02                  | —                                              | API Web du runtime edge                           |
| vercel/streamdown                                                    | 5 759                         | 2026-11-13                  | —                                              | markdown en streaming pour l'IA                   |
| vercel/chatbot                                                       | 21 047                        | 2026-11-03                  | —                                              | gabarit chatbot (ex ai-chatbot)                   |
| vercel/workflow                                                      | 2 508                         | 2026-11-13                  | —                                              | Workflow SDK (durable)                            |
| vercel/flags                                                         | 629                           | 2026-11-13                  | —                                              | Flags SDK                                         |
| vercel/analytics, vercel/speed-insights                              | 521 / 117                     | 2026-10-22 / 2026-11-11     | —                                              | clients Web Analytics / Speed Insights            |
| vercel/nft, vercel/ncc, vercel/serve                                 | 1 683 / 9 844 / 9 915         | 2026-11 / 2026-08 / 2026-11 | —                                              | traçage deps, bundle Node, serveur statique       |
| vercel/next-forge, vercel/platforms, vercel/ai-elements, vercel/chat | 7 766 / 6 728 / 2 522 / 2 474 | —                           | —                                              | gabarits et composants                            |
| vercel-labs/agent-browser                                            | 50 411                        | 2026-11-13                  | 0.42.0 installé                                | pilote navigateur (utilisé ici)                   |

`vercel/geist` n'existe pas (404) : le design system Geist est publié sur vercel.com/geist, la police dans vercel/geist-font.

### vinext (README, 2026-11-13)

- Supporte : App Router et Pages Router, RSC, Server Actions, route handlers, middleware, SSG, ISR, `output: "export"`, sortie standalone Node, `next/link`, `next/image`, `next/navigation`, `next/headers`, `next/cache`, Metadata API, déploiement Workers (bindings, adaptateurs de cache, optimisation d'images à la requête).
- Lacunes déclarées : Cache Components / PPR partiels (`"use cache"` incomplet), pas de pipeline d'images ni de polices au build, modules natifs (sharp, resvg, satori) fragiles en dev RSC, `preferredRegion` ignoré, `runtime` ne choisit pas l'emplacement.
- CLI : `vite dev|build`, `vinext start|init|check|lint`, `@vinext/cloudflare deploy` (`--preview`, `--dry-run`, `--warm-cache`) ; `vinext init` utilise `cf` et `cloudflare.config.ts` par défaut ; binaire `bun build --compile` documenté via `startProdServer`.

### Équipe vercel.com/aphrody-dev (CLI vercel, lecture seule)

- `vercel teams ls` : `aphrody-dev`, plan hobby.
- `vercel projects ls` : `rg-api`, `rg-website`, `rg-discord` (aucune URL de production, mis à jour il y a 27 j, Node 24.x).
- `vercel domains ls` : 0 domaine.
- Conclusion inchangée par rapport à `packages/deploy/README.md` : rien de src n'est servi par Vercel ; Vercel = référence fonctionnelle, aphrody.app = notre plateforme.

## 2. Matrice par famille

Légende « notre équivalent » : chemin dans src, ou « absent ».

### Routing

| Fonctionnalité                                                                           | Source                                                       | Notre équivalent                                                                |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Routage fichiers App Router (`page`, `layout`, `template`, `route`, groupes, dynamiques) | next.js `docs/01-app/03-api-reference/03-file-conventions/*` | absent (pages générées par `apps/aphrody/build.ts`, pas de convention fichiers) |
| Routes parallèles et interceptées                                                        | next.js `parallel-routes.mdx`, `intercepting-routes.mdx`     | absent                                                                          |
| `proxy` / middleware                                                                     | next.js `proxy.mdx`, `middleware.mdx` ; vinext README        | `apps/aphrody/edge/worker.ts`, `packages/deploy/src/worker.ts`                  |
| Redirects / rewrites / headers déclaratifs                                               | next.js `redirecting.mdx` ; vercel.com/docs/cdn              | `_redirects` / `_headers` lus par `packages/deploy/src/serve.ts`                |
| `not-found`, `forbidden`, `unauthorized`, `error`                                        | next.js file conventions                                     | 404 holding (`apps/aphrody/src/holding`) ; reste absent                         |
| Multi-zones / microfrontends                                                             | next.js `multi-zones.mdx` ; vercel.com/docs/microfrontends   | partiel : `/api/*`, `/g/*` routés vers prd par le Worker aphrody                |
| Multi-tenant (domaines par client)                                                       | next.js `multi-tenant.mdx` ; vercel/platforms                | partiel : `projects.toml` domaines par projet, wildcard `*.aphrody.app`         |

### Rendu RSC / SSR / ISR

| Fonctionnalité                                                       | Source                                                                       | Notre équivalent                                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| React Server Components, Server Actions                              | next.js `server-actions.mdx` ; vinext README                                 | absent (pas de React dans src web public)                      |
| Streaming SSR                                                        | next.js `streaming.mdx` ; vercel.com/fluid                                   | absent côté pages ; `Bun.serve` streame les API                |
| SSG / `generateStaticParams` / export statique                       | next.js `static-exports.mdx`                                                 | `apps/aphrody/build.ts` (tout est pré-rendu, déployé immuable) |
| ISR, revalidation par tag (`cacheTag`, `cacheLife`, `revalidateTag`) | next.js `incremental-static-regeneration*.mdx`, `how-revalidation-works.mdx` | absent (redéploiement complet par sha)                         |
| Cache Components / PPR / shell statique                              | next.js `migrating-to-cache-components.mdx`, `ppr-platform-guide.mdx`        | absent                                                         |
| `after()` (tâches post-réponse)                                      | next.js `functions/after.mdx` ; vercel.com/fluid                             | `ctx.waitUntil` dans `packages/deploy/src/runtime.ts`          |
| Draft mode                                                           | next.js `draft-mode.mdx`                                                     | absent                                                         |
| View Transitions                                                     | next.js `view-transitions.mdx`                                               | `apps/aphrody` (View Transitions CSS, commit 7f09620e)         |

### Images

| Fonctionnalité                                  | Source                                                              | Notre équivalent                                                                                                         |
| ----------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `next/image` (srcset, tailles, lazy, AVIF/WebP) | next.js `components/image.mdx`                                      | `GET /_aphrody/image?url=&w=&q=` (`packages/deploy/src/runtime.ts`, binding Images, largeurs 64..3840 identiques à Next) |
| Optimiseur à la requête sur l'edge              | vercel.com/docs/image-optimization ; vinext README                  | idem, cache par sha dans `deploy-cache.aphrody.app/_img/`                                                                |
| `ImageResponse` / `opengraph-image` (satori)    | next.js `image-response.mdx`, `opengraph-image.mdx` ; vercel/satori | absent en dynamique ; OG statique `apps/aphrody/src/og-image.png` (pipeline `ay brand build`, autre agent)               |
| Icônes / manifest générés                       | next.js `app-icons.mdx`, `manifest.mdx`                             | statiques : `favicon.svg`, `icon-*.png`, `site.webmanifest`                                                              |

### Fonts

| Fonctionnalité                                                 | Source                        | Notre équivalent                                                                                                                              |
| -------------------------------------------------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `next/font` (auto-hébergement, subset, `size-adjust`, preload) | next.js `components/font.mdx` | partiel : woff2 auto-hébergé préchargé (`apps/aphrody/build.ts`, `/atkinson-next.woff2`) ; pas de subset ni de fallback métrique automatiques |
| Geist (OFL)                                                    | vercel/geist-font             | absent (marque : `assets/brand`)                                                                                                              |

### Edge / compute

| Fonctionnalité                                                              | Source                                      | Notre équivalent                                                                             |
| --------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Edge runtime (API Web)                                                      | vercel/edge-runtime ; next.js `runtime.mdx` | Workers Cloudflare (`apps/aphrody/edge/worker.ts`)                                           |
| Fluid compute (concurrence intra-instance, préchauffage, failover régional) | vercel.com/fluid                            | Workers (isolats) + backend Bun sur prd via tunnel `mig-prd`                                 |
| `preferredRegion`, `maxDuration`                                            | next.js route segment config                | absent (vinext les ignore aussi)                                                             |
| Adaptateurs multi-cibles                                                    | next.js `deploying-to-platforms.mdx`        | `packages/runtime-adapter` (`bun.ts`, `cf.ts`) ; `apps/r2-site/src/entry.{cf,vercel,vps}.ts` |
| Binaire unique                                                              | vinext (`bun build --compile`)              | `apps/aphrody` `build:aot` (`bun build --compile`)                                           |

### Cache / CDN

| Fonctionnalité                                  | Source                                            | Notre équivalent                                                                                         |
| ----------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| CDN global, cache immuable des assets           | vercel.com/docs/cdn                               | `packages/deploy/src/serve.ts` : assets `max-age=31536000, immutable`, HTML `max-age=0, must-revalidate` |
| Purge / invalidation                            | vercel.com/docs/cdn                               | non nécessaire : clés par sha, promote/rollback changent la clé                                          |
| Cache de données (`fetch` cache, `use cache`)   | next.js `caching-without-cache-components.mdx`    | absent                                                                                                   |
| Cache de build distant (Turborepo Remote Cache) | vercel/turborepo ; next.js `ci-build-caching.mdx` | `src/depot/cas` (CAS) + CI fr1 ; pas d'API compatible Turborepo                                       |
| Edge Config (lecture à faible latence)          | vercel.com/docs (Global Config)                   | `GET /_aphrody/config[/<key>]` (R2 `deploys/<p>/_config.json`)                                           |

### Previews / déploiements

| Fonctionnalité                                  | Source                                          | Notre équivalent                                                        |
| ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------- |
| Déploiement par push, URL de preview par commit | vercel.com/products/previews, /docs/deployments | `https://<project>-<sha7>.aphrody.app`, `.github/workflows/deploy.yml`  |
| Promote / instant rollback                      | vercel.com/docs/deployments                     | `ay deploy promote                                                      | rollback`(pointeur`_state.json`) |
| Deployment Protection                           | vercel.com/docs/deployment-protection           | Cloudflare Access sur `aphrody.app/dashboard` ; previews publiques      |
| Toolbar / commentaires sur preview              | vercel.com/docs/vercel-toolbar                  | absent                                                                  |
| Environnements et variables                     | vercel.com/docs/deployments/environments        | `projects.toml` `env = [...]` + vault (`env-kit`)                       |
| Feature flags                                   | vercel/flags ; vercel.com/docs/flags            | partiel : edge config ; pas de SDK flags                                |
| Firewall, Bot Management, BotID                 | vercel.com/products                             | WAF/Turnstile Cloudflare disponibles, non câblés dans `packages/deploy` |

### Analytics

| Fonctionnalité                                    | Source                | Notre équivalent                                                                          |
| ------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------- |
| Web Analytics sans cookie                         | vercel/analytics      | `/_aphrody/insights.js` + beacon `/_aphrody/v` → Durable Object `Insights`                |
| Speed Insights (LCP, INP, CLS, FCP, TTFB terrain) | vercel/speed-insights | même client (`METRICS` dans `runtime.ts`) ; INP approché par l'interaction la plus longue |
| Événements custom                                 | vercel/analytics      | absent                                                                                    |

### Observabilité

| Fonctionnalité                                     | Source                                              | Notre équivalent                                                                  |
| -------------------------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Logs runtime recherchables                         | vercel.com/products/observability                   | `[observability] enabled = true` (Workers Logs) dans `apps/aphrody/wrangler.toml` |
| Requêtes / métriques par route, alertes d'anomalie | vercel.com/products/observability                   | absent (pas de tableau par route ni d'alerte)                                     |
| Logs de build                                      | vercel.com/docs/deployments                         | `deploys/<p>/<sha>.log`, `ay deploy logs`                                         |
| OpenTelemetry / `instrumentation.ts`               | next.js `open-telemetry.mdx`, `instrumentation.mdx` | absent                                                                            |

### AI SDK / agents

| Fonctionnalité                                  | Source                                                        | Notre équivalent                                       |
| ----------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------ |
| AI SDK (génération, streaming, tools, agents)   | vercel/ai                                                     | `packages/ai-os/src` (`llm`, `core`, `agent-cli.ts`)   |
| AI Gateway (400+ modèles, routage fournisseurs) | vercel.com/ai-gateway, /docs/ai-gateway                       | `packages/ai-os/src/gateway` + relais MCP AphrodyRelay |
| Workflow durable                                | vercel/workflow                                               | absent en bun (Durable Objects disponibles)            |
| Sandbox                                         | vercel.com/docs/sandbox                                       | absent (évalué : `docs/ECOSYSTEM-VERCEL-MICROSOFT.md`) |
| Streaming markdown, éléments UI IA              | vercel/streamdown, vercel/ai-elements                         | absent                                                 |
| MCP / agents dans Next.js                       | next.js `mcp.mdx`, `ai-agents.mdx` ; vercel/next-devtools-mcp | relais MCP hors web ; rien côté sites publics          |

### Build / monorepo

| Fonctionnalité                                    | Source           | Notre équivalent                                                                     |
| ------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------ |
| Turborepo (graphe de tâches, cache, `--affected`) | vercel/turborepo | `justfile` + `ay` + `watch` de `projects.toml` (build seulement des projets touchés) |
| Bundler (Turbopack / Vite chez vinext)            | next.js, vinext  | `Bun.build`                                                                          |
| Traçage de dépendances serveur                    | vercel/nft       | absent (inutile : `bun build --compile`)                                             |

## 3. Écarts prioritaires (ordre proposé pour replica-architect)

1. Rendu : pas de SSR/streaming ni d'ISR par tag ; la plateforme sert du statique immuable plus un Worker. Option vinext pour un projet React futur ; pour les sites actuels, ISR minimal = régénération d'une page dans R2 sous la clé du sha courant.
2. OG dynamique (satori/`ImageResponse`) : absent ; à rattacher à `ay brand build` (agent assets) plutôt qu'au runtime.
3. Fonts : subset et fallback métrique automatiques à ajouter au build (équivalent `next/font`).
4. Observabilité : tableau par route et alertes absents ; les données existent (Workers Logs, Insights).
5. Previews : protection optionnelle par Access et commentaires/toolbar absents.
6. Cache de build : `depot-cas` sans protocole Turborepo Remote Cache.

## 4. Captures (`shots/vercel/`)

| Fichier                                         | URL                                                                         |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| vercel-home.png                                 | https://vercel.com/                                                         |
| vercel-products.png                             | https://vercel.com/products                                                 |
| vercel-fluid.png                                | https://vercel.com/fluid                                                    |
| vercel-previews.png                             | https://vercel.com/products/previews                                        |
| vercel-ai-gateway.png                           | https://vercel.com/ai-gateway                                               |
| vercel-observability.png                        | https://vercel.com/products/observability (vercel.com/analytics y redirige) |
| vercel-cdn.png                                  | https://vercel.com/cdn                                                      |
| vercel-docs-features.png                        | https://vercel.com/docs                                                     |
| geist.png                                       | https://vercel.com/geist/introduction                                       |
| nextjs-home.png                                 | https://nextjs.org/                                                         |
| vinext-home.png, vinext-docs.png                | https://vinext.dev/, https://vinext.dev/docs                                |
| aisdk-home.png                                  | https://ai-sdk.dev/                                                         |
| turborepo-home.png                              | https://turborepo.com/ (redirige vers turborepo.dev)                        |
| gh-vercel-org.png, gh-nextjs.png, gh-vinext.png | pages GitHub correspondantes                                                |

Les captures sont des preuves de recon internes (fair use documentaire), non publiées sur aphrody.com ni aphrody.app.
