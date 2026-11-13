# Architecture web cible de src (replica-architect)

Rédigé le 2026-11-13 à partir des recons `docs/replica/recon/{vercel,cloudflare,google,estate}.md` et de l'arbre au commit `5cec548a`. Décisions déjà prises et conservées : `docs/ui/STACK.md` (HTML servi par bun ou WebUI, îlots Material Web, pas de React ni Tailwind dans les produits Aphrody), `docs/ALPHABET.md` (aphrody.com = holding, aphrody.app = plateforme). L'annexe A de `docs/ARCHITECTURE.md` (labs v0 : V8, Tailwind, shadcn, Build Output API v3) est remplacée par ce document pour le web.

Références lues en direct ce jour : next.js v16.4.6, `@vinext/cloudflare@1.3.4` (vinext `main` `ef897ed727`), wrangler 4.161.0, workerd v1.20261113.1, `@material/web` 2.5.0, `@material/material-color-utilities` 0.4.0, bun 1.4.4. API Cloudflare `GET /accounts/{account_id}/workers/scripts/{script_name}/content/v2` (« Get Worker Script Content ») vérifiée dans la spec OpenAPI.

## 1. Modèle : un framework, une plateforme, un edge

| Rôle                  | Chez Vercel / Cloudflare                       | Chez nous (cible)                                                                            | Chemin                                   |
| --------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Framework de site     | Next.js (`next`), vinext (`vinext` + Vite)     | `@aphrody/site` : conventions de fichiers à la Next, rendu statique et îlots, build Bun      | `packages/site` (nouveau)                |
| Système de design web | Geist, Kumo                                    | `@aphrody/design` : `tokens.css`, Material Web, Material Symbols, exports web                | `packages/design`                        |
| Cœur Rust du design   | —                                              | `aphrody-ui` (agent design Rust)                                                             | `crates/aphrody-ui`                      |
| Assets de marque      | —                                              | `ay brand build` (agent assets)                                                              | `assets/brand`                           |
| Plateforme            | Vercel (deploy, previews, rollback, analytics) | `@aphrody/deploy` : registre, déploiements immuables, pointeur de prod, API, tableau de bord | `packages/deploy`                        |
| Runtime edge          | Edge Functions, `@vinext/cloudflare`           | un seul module de service statique + runtime `/_aphrody/*`, sur Workers                      | `packages/deploy/src/{serve,runtime}.ts` |
| Portabilité           | adaptateurs Next                               | `@aphrody/runtime-adapter` (cf, bun, vercel)                                                 | `packages/runtime-adapter`               |
| Gate qualité          | Lighthouse CI                                  | `wck` au build                                                                               | `packages/wck`                           |

Pourquoi pas vinext pour les sites Aphrody : vinext impose Vite et React (RSC), contraires à `docs/ui/STACK.md`, et annonce lui-même PPR, images et polices au build comme incomplets. On en reprend le modèle (conventions Next, déploiement Workers, cache par adaptateur, binaire `bun build --compile`) sans la pile. vinext reste la voie de migration des deux sites Next.js communautaires (`apps/rosegriffon`, `apps/shenron`, sous-modules, hors périmètre des tranches).

## 2. Arborescence normalisée

```
apps/<site>/                 un site déployable = un projet de packages/deploy/projects.toml
  site.config.ts             defineSite(): nom, domaines, locales, en-têtes, redirections, budgets, origine dynamique
  app/                       routes : page.ts, layout.ts, not-found.ts, route.ts, [param]/, (groupe)/
  content/                   textes et données (agents contenu)
  client/                    entrées navigateur (îlots), bundlées en /_static/
  server.ts                  backend Bun optionnel (prd, tunnel), jamais sur l'edge
  wrangler.toml              seulement si le site a un Worker propre (cas transitoire)
packages/<lib>/              bibliothèques bun @aphrody/<lib>, exports déclarés dans package.json
crates/<crate>/              Rust (aphrody-ui, aphrody-brand-gpu, ...)
infra/cloudflare/            IaC (cloudflare.toml, cf.ts) + workers/<nom>/ pour tout Worker non-site
assets/brand/                source et sortie gen/ des assets (agent assets)
```

Règles :

- Un Worker vit dans l'unité qui le possède : site (`apps/<site>`), plateforme (`packages/deploy`), infra (`infra/cloudflare/workers/<nom>`). `infra/fleet/workers/` disparaît (fusion dans `apps/r2-site` et `infra/cloudflare/workers/api-gateway`).
- Aucun Worker live sans source versionnée : les orphelins (`aphrody-webos`, `aphrody-email-worker`, `bun-video-showcase`, `yolo-aphrody-com`, `aphrody-app`) sont récupérés par l'API ci-dessus dans `infra/cloudflare/workers/<nom>/`.
- Un nom de Worker n'apparaît que dans un seul fichier de config (fin de la collision `apps/aphrody-app/wrangler.toml` = `aphrody-app`).
- Imports entre unités par les `exports` du paquet, jamais par `../../../packages/x/src/y.ts`.

## 3. Schéma de préfixes CDN unique

Le cache HTTP des navigateurs est partitionné par site de premier niveau : un asset critique servi par `cdn.aphrody.com` n'est pas partagé entre aphrody.com et aphrody.app. Les assets critiques des pages sont donc servis en même origine ; le CDN partagé sert les consommateurs externes et les gros fichiers.

| Préfixe                                                                                                | Contenu                                                                              | Stockage                                     | Cache-Control                                              | Producteur                      |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------------- | ------------------------------- |
| `https://<site>/_static/<nom>-<hash>.<ext>`                                                            | JS, CSS, polices, icônes, images du build, hashés par contenu (`Bun.build` `[hash]`) | R2 `aphrody-dist/deploys/<p>/<sha>/_static/` | `public, max-age=31536000, immutable`                      | `@aphrody/site`                 |
| `https://<site>/<chemin>` (HTML, `robots.txt`, `sitemap.xml`, `llms.txt`, `favicon.ico`, manifest, OG) | pages et documents à URL fixe                                                        | idem, racine du déploiement                  | `public, max-age=0, must-revalidate` (edge : clé par sha)  | `@aphrody/site`                 |
| `https://<site>/_aphrody/{image,insights.js,v,config}`                                                 | runtime plateforme (optimiseur d'images, analytics, Speed Insights, edge config)     | Worker                                       | selon l'endpoint                                           | `@aphrody/deploy`               |
| `https://<p>-<sha7>.aphrody.app/`                                                                      | preview immuable par commit                                                          | même déploiement                             | idem                                                       | `@aphrody/deploy`               |
| `https://cdn.aphrody.com/brand/v<N>/...`                                                               | marque partagée (profils, README, e-mails, embeds)                                   | R2 `aphrody-assets`                          | immutable + CORS, CORP cross-origin, `Timing-Allow-Origin` | `ay brand build` (agent assets) |
| `https://dist.aphrody.app/packages/<nom>/<version>/<sha256>/package.tgz`                               | registre de paquets                                                                  | R2 `aphrody-dist`                            | immutable ; `latest.json` et canaux 60 s                   | release                         |
| `https://downloads.aphrody.com/<produit>/<version>/...`                                                | binaires                                                                             | R2 `aphrody-dist/aphrody/`                   | immutable ; pointeurs 60 s                                 | release                         |
| `https://video.aphrody.app/<collection>/<version>/...`                                                 | médias lourds, plages d'octets                                                       | R2 `aphrody-video`                           | immutable                                                  | médias                          |

Invariants : rien n'est `immutable` hors d'un segment versionné ou hashé ; une 404 n'est jamais mise en cache plus de 60 s ; les alias historiques (`assets.aphrody.app`, `sites/<host>/` dans R2) restent en place sans nouveaux usages ; aucune ressource tierce sur les pages (fin de `fonts.googleapis.com`).

## 4. Framework `@aphrody/site`

Inspiré des conventions App Router (file conventions de next.js) et du découpage vinext (cœur + adaptateur Workers), sur Bun uniquement.

| Brique                   | Équivalent Next                                                                  | Implémentation                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Routage                  | `app/**/page`, `layout`, `not-found`, `route`, `[param]`, `generateStaticParams` | scan `Bun.Glob` de `app/`, rendu SSG en chaînes HTML échappées (`html\`\`` tagué), arbre de layouts                                                                       |
| Métadonnées              | Metadata API, `sitemap.ts`, `robots.ts`, `manifest.ts`                           | `metadata` par page ; `robots.txt`, `sitemap.xml`, `llms.txt`, hreflang, canonical et JSON-LD générés depuis les routes `public`                                          |
| i18n                     | routage i18n                                                                     | `locales`, `defaultLocale`, `localizedPath()`, alternates hreflang ; pas de redirection par `Accept-Language`                                                             |
| Images                   | `next/image`                                                                     | `img()` : `srcset` sur `/_aphrody/image?url=&w=&q=` avec `WIDTHS` de `packages/deploy/src/runtime.ts`, `width`/`height` obligatoires (CLS 0), `fetchpriority` pour le LCP |
| Polices                  | `next/font`                                                                      | `@font-face` + `preload` depuis `assets/brand/gen/fonts/fonts.json` (sous-ensembles WOFF2 de l'agent assets), copiées en `/_static/`                                      |
| CSS                      | CSS global + modules                                                             | `tokens.css` de `@aphrody/design` + CSS de l'app, bundler CSS de Bun, minifié, une feuille par site                                                                       |
| Composants               | React                                                                            | îlots Material Web : `componentsBundle(elements)` de `@aphrody/design/web`, sous-ensemble par site, hashé                                                                 |
| En-têtes, redirections   | `headers()`, `redirects()`                                                       | `site.config.ts` -> `_headers`, `_redirects` (lus par `serve.ts`) ; CSP par site                                                                                          |
| Middleware / multi-zones | `proxy.ts`, rewrites externes                                                    | `origin` dans `site.config.ts` : préfixes (`/api/*`, `/g/*`) vers le backend Bun de prd par tunnel                                                                        |
| Rendu dynamique          | RSC/SSR, ISR                                                                     | hors cible pour les pages publiques (statique immuable par sha) ; pages dynamiques = backend Bun ou Worker de plateforme                                                  |
| Binaire                  | `output: standalone`                                                             | `bun build --compile` d'un `Bun.serve` qui sert `dist/` (cible bun, fichiers précompressés br/gz)                                                                         |
| Gate                     | Lighthouse CI                                                                    | `validateWeb()` de `wck` + budgets (`site.config.ts`), échec = build en échec                                                                                             |

Sortie : `dist/` = racine de déploiement (HTML, documents, `_static/`, `_headers`, `_redirects`, `site.json` = manifeste des routes et des hashes). Les fichiers `.br`/`.gz` ne sont produits que pour la cible bun (l'edge compresse lui-même ; `exclude` les retire de l'upload).

Remplace : `apps/aphrody/src/seo/{html,page-css}.ts` et la mécanique de `apps/aphrody/build.ts`, `apps/yolo/src/framework/*` et `apps/yolo/build.ts`, la mise en page de `packages/deploy/src/pages.ts` (le contenu reste aux agents des sites).

## 5. Design, CSS et UI

- Source unique : `packages/design/tokens/tokens.css` (`--md-sys-*`), généré par Material Color Utilities depuis `assets/brand/brand.toml`. Rust : `tokens.rs` et `crates/aphrody-ui`.
- `@aphrody/design/web` (nouvel export) : `tokensCss()`, `componentsBundle(elements)`, `typescale`. Remplace `tokensCss`, `componentsBundle`, `FONT_LINK` de `packages/deploy/src/m3.ts` et `packages/deploy/src/client/md.ts`.
- Retirés à la migration : `apps/aphrody/src/m3.css`, `apps/aphrody/src/design/material-tokens.ts` (`--m3-*`), `packages/google-design` (après déplacement de `src/design-md` dans `packages/design`), `packages/bun-plugins/m3-icons-plugin.ts`.
- Icônes : Material Symbols Rounded de `assets/brand/gen/symbols` (sprite et police sous-ensemble).

## 6. Pipeline de build unique

1. `deploy.yml` (push sur `main`) -> `bun packages/deploy/src/cli.ts ci` : projets touchés par `watch`.
2. Clé de cache de build = SHA-256 des fichiers suivis par `watch` + `bun.lock` + commande : si une clé identique existe déjà pour le projet, le déploiement réutilise ses fichiers sans rebuild (équivalent Turborepo Remote Cache, stocké dans R2 `deploys/<p>/_cache/<clé>.json`).
3. Upload adressé par contenu : `_static/*` et fichiers inchangés ne sont pas renvoyés (manifeste de hashes, l'API copie côté R2).
4. Builds natifs (wasm du shell, binaires `bun build --compile`, Rust en LTO) sur fr1 (`ci.yml`, runner `[self-hosted, fr1]`), jamais sur le PC.
5. `wck` bloque ; preview `https://<p>-<sha7>.aphrody.app` ; promotion auto si `production = "auto"`.

## 7. Exploitation

| Besoin             | Cible                                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Previews           | une URL par commit, publique ; protection Access optionnelle par projet (`protect = true`)                                          |
| Promote / rollback | pointeur `_state.json`, `ay deploy promote                                                                                          | rollback`, historique conservé |
| Logs               | Workers Logs (`[observability]`), logs de build `deploys/<p>/<sha>.log`                                                             |
| Analytics et CWV   | DO `Insights`, ventilation par route et par déploiement, `GET /api/projects/<p>/insights?by=route`                                  |
| Alertes            | job planifié CI : p75 LCP/INP/CLS par route au-dessus du budget du site -> échec visible et entrée NHITL                            |
| Sécurité edge      | WAF et rate limit dans `cloudflare.toml`, Turnstile pour les formulaires, API publique sans détail technique                        |
| IaC                | `infra/cloudflare/cloudflare.toml` + `cf.ts plan` ; page rules héritées importées en rulesets ; `--dry-run` avant toute application |

## 8. Doublons : fusionner ou supprimer

| Doublon                                                                                                                      | Cible                                                                                                         |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| 3 moteurs SSR maison (`apps/aphrody/src/seo/html.ts`, `apps/yolo/src/framework/ssr.ts`, `packages/deploy/src/pages.ts`)      | `@aphrody/site`                                                                                               |
| 2 scripts de build (`apps/aphrody/build.ts`, `apps/yolo/build.ts`) : minify CSS, précompression, `_headers`, wck             | `@aphrody/site` build                                                                                         |
| 3 serveurs statiques R2 (`packages/deploy/src/serve.ts`, `apps/r2-site/src/app.ts`, `infra/fleet/workers/r2-site/worker.js`) | `serve.ts` seul (`serveStatic`), `apps/r2-site` en entrée mince                                               |
| Material Web construit 2 fois (`packages/deploy/src/m3.ts`, `packages/design/src/components.ts`)                             | `@aphrody/design/web`                                                                                         |
| 9 implémentations M3 (27 définitions de `--md-sys-color-primary`)                                                            | `tokens.css`                                                                                                  |
| Workers en 4 arbres (`apps/*/edge`, `packages/deploy/src`, `infra/cloudflare/workers`, `infra/fleet/workers`)                | 3 propriétaires (§2)                                                                                          |
| `apps/aphrody-app/wrangler.toml` (`aphrody-app`) et `aphrody-app-site` (r2-site) pour le même shell                          | `aphrody-app-site` seul, puis projet `shell`                                                                  |
| Worker `aphrody-com` (sans exposition)                                                                                       | config retirée du dépôt, Worker live laissé en place                                                          |
| `fonts.googleapis.com` + woff2 locaux                                                                                        | polices auto-hébergées seules                                                                                 |
| Worker `aphrody` (aphrody.com) et `aphrody-deploy` (même code de service)                                                    | à terme `aphrody-deploy` sert tous les domaines de projet (hôte -> projet), `origin` déclaratif pour `/api/*` |

## 9. Risques

1. Bascule de routes Workers (aphrody.com, cdn, shell) : changement live ; toujours `--dry-run`, retour arrière = réattacher l'ancienne route (documenté par Worker).
2. Récupération des Workers orphelins : le contenu peut embarquer des valeurs sensibles ; scan avant commit, rien n'est committé s'il en contient.
3. Material Web en maintenance : on ne dépend que des éléments `md-*` stables et des tokens `--md-sys-*`.
