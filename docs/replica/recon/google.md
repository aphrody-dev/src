# Recon Google — dépôts web et Google Workspace

Lu le 2026-11-13. Sources : `gh api repos/<repo>` et `releases/latest` (étoiles, archivage, dernier push, licence), pages publiques
capturées par notre Chromium (chrome-devtools MCP, contexte isolé `recon-google`), DNS public (DoH), API Google via `gcloud`
(configuration `owner`, jeton jamais affiché). Captures : [`shots/google/`](shots/google/).

## 1. Dépôts GitHub utiles au web (vérifiés par gh api)

| Dépôt                                        |   Étoiles | Dernière version (date)      | Licence          | État                | Usage chez nous                                                                                             |
| -------------------------------------------- | --------: | ---------------------------- | ---------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| GoogleChrome/lighthouse                      |    31 058 | v13.6.0 (2026-10-27)         | Apache-2.0       | actif               | `packages/wck` (gate « Lighthouse 100 » statique, pas le moteur LH) ; audits shenron                        |
| GoogleChrome/lighthouse-ci                   |     7 140 | v0.16.1 (2026-11-11)         | Apache-2.0       | actif               | absent (CI sans LHCI)                                                                                       |
| GoogleChrome/web-vitals                      |     8 675 | tag v6.2.3                   | Apache-2.0       | actif               | équivalent maison : `packages/deploy/src/runtime.ts` (RUM LCP/INP/CLS/FCP/TTFB, beacon `/_aphrody/v`)       |
| GoogleChrome/workbox                         |    13 044 | v7.4.1 (2026-05-05)          | MIT              | actif               | absent (aucun service worker enregistré sur aphrody.com / .app)                                             |
| GoogleChrome/chrome-launcher                 |     1 369 | —                            | Apache-2.0       | actif               | absent ; Chromium piloté par CDP (chrome-devtools MCP, infra/chromium-factory)                              |
| puppeteer/puppeteer                          |    95 828 | browsers-v3.2.7 (2026-11-10) | Apache-2.0       | actif               | absent dans les sites ; CDP direct                                                                          |
| GoogleChrome/rendertron                      |     5 949 | —                            | Apache-2.0       | archivé 2022        | sans objet (rendu statique par build)                                                                       |
| GoogleChrome/web.dev, developer.chrome.com   |         — | —                            | —                | archivés 2024       | contenu repris dans `docs/design/specs/{perf,seo,a11y}` (agent design)                                      |
| GoogleChrome/dialog-polyfill                 |     2 458 | —                            | BSD-3            | actif               | inutile (`<dialog>` natif)                                                                                  |
| google/zx                                    |    45 844 | 8.8.5 (2025-10-19)           | Apache-2.0       | actif               | remplacé par Bun Shell (`$` de bun) — règle bun uniquement                                                  |
| google/wireit                                |     6 435 | —                            | Apache-2.0       | actif               | remplacé par justfile + `ay` + bun workspaces                                                               |
| google/gts                                   |     5 295 | —                            | Apache-2.0       | actif, push 2026-01 | absent (lint/format via bun + biome/oxlint selon dépôt)                                                     |
| google/closure-compiler                      |     7 704 | —                            | Apache-2.0       | actif               | remplacé par `Bun.build` (minify)                                                                           |
| google/schema-dts                            |     1 263 | v2.1.0 (2026-10-02)          | Apache-2.0       | actif               | utilisé par shenron, rosegriffon ; aphrody : JSON-LD écrit à la main                                        |
| google/robotstxt                             |     3 479 | —                            | Apache-2.0       | actif               | absent ; `robots.txt` généré, testé dans `apps/aphrody/tests/seo.test.ts`                                   |
| google/brotli                                |    15 117 | v1.2.1 (2026-10-21)          | MIT              | actif               | compression assurée par Cloudflare (edge)                                                                   |
| google/zopfli                                |     3 607 | —                            | Apache-2.0       | actif               | absent                                                                                                      |
| google/woff2                                 |     1 828 | —                            | MIT              | actif               | absent (polices servies par Google Fonts, voir §3)                                                          |
| google/jpegli                                |       423 | —                            | BSD-3            | actif               | absent                                                                                                      |
| libjxl/libjxl                                |     3 848 | v0.13.0 (2026-11-11)         | BSD-3            | actif               | absent                                                                                                      |
| AOMediaCodec/libavif                         |     2 228 | —                            | NOASSERTION (gh) | actif               | AVIF/WebP via binding `IMAGES` Cloudflare (`apps/aphrody/wrangler.toml`)                                    |
| GoogleChromeLabs/squoosh                     |    26 188 | tag v1.12.0                  | Apache-2.0       | actif               | équivalent : optimiseur d'images Cloudflare + `ay brand build` (agent assets)                               |
| GoogleChromeLabs/quicklink                   |    11 305 | 3.0.2 (2026-08-04)           | Apache-2.0       | actif               | absent ; Speculation Rules à évaluer (spec perf de l'agent design)                                          |
| GoogleChromeLabs/critters                    |     3 422 | —                            | Apache-2.0       | archivé 2024        | sans objet (CSS inline au build)                                                                            |
| GoogleChromeLabs/comlink                     |    12 810 | —                            | Apache-2.0       | actif               | absent                                                                                                      |
| GoogleChromeLabs/container-query-polyfill    |     1 149 | —                            | Apache-2.0       | actif               | inutile (container queries natives, utilisées par aphrody.com)                                              |
| GoogleChromeLabs/browser-fs-access           |     1 591 | —                            | Apache-2.0       | actif               | absent                                                                                                      |
| GoogleChromeLabs/web-vitals-report           |       501 | —                            | Apache-2.0       | archivé 2025        | sans objet                                                                                                  |
| material-components/material-web             |    11 442 | v2.5.0 (2026-07-15)          | Apache-2.0       | actif               | `@material/web` 2.5.0 (catalog racine, `packages/design`)                                                   |
| material-components/material-components-web  |    17 030 | —                            | MIT              | archivé 2025-01     | ne pas utiliser                                                                                             |
| material-foundation/material-color-utilities |     2 304 | —                            | Apache-2.0       | actif               | `@material/material-color-utilities` 0.4.0 (`packages/design`) ; cœur Rust `aphrody-design-*` (autre agent) |
| material-foundation/material-tokens          |       285 | —                            | Apache-2.0       | archivé 2023        | sans objet                                                                                                  |
| google/material-design-icons                 |    54 296 | —                            | Apache-2.0       | actif               | Material Symbols cités dans `packages/design`                                                               |
| google/fonts                                 |    20 757 | —                            | OFL par famille  | actif               | Google Sans Flex (`ofl/googlesansflex`, OFL.txt + TRADEMARKS.md, commit 2026-10-09)                         |
| googlefonts/fontations, fontc                | 854 / 195 | —                            | Apache-2.0       | actifs              | absent (pile Rust police, candidat au sous-ensemble auto-hébergé)                                           |
| google/model-viewer                          |     8 333 | v4.4.0 (2026-10-09)          | Apache-2.0       | actif               | absent                                                                                                      |
| lit/lit                                      |    21 894 | —                            | BSD-3            | actif               | dépendance transitive de `@material/web`                                                                    |
| google/osv-scanner                           |    11 505 | —                            | Apache-2.0       | actif               | absent (audit deps via `just checkdeps`)                                                                    |
| googleapis/release-please                    |     7 769 | —                            | Apache-2.0       | actif               | absent (`packages/release`)                                                                                 |
| googleapis/google-api-nodejs-client          |    12 288 | —                            | Apache-2.0       | actif               | `googleapis` ^182 dans rosegriffon ; aphrody : `src/google/relay.ts`                                        |
| google/oss-fuzz                              |    12 950 | —                            | Apache-2.0       | actif               | absent                                                                                                      |

Introuvables (404 gh api) : google/ngx-charts, google/tsickle, google/webp, GoogleChromeLabs/idb-keyval,
GoogleChromeLabs/speculation-rules-improvements. RaspberryPiFoundation/blockly = ex-google/blockly (transféré).

Captures : `gh-lighthouse.webp`, `gh-web-vitals.webp`, `gh-workbox.webp`, `gh-zx.webp`, `gh-material-web.webp`.

## 2. Google Workspace et outils du site (pages publiques)

Catalogue lu sur workspace.google.com (FR) : Gmail, Drive, Meet, Chat, Agenda, Tasks, Console d'administration, Docs, Sheets,
Slides, Forms, Google Sites, Keep, Gemini Notebook, Vids, Pics, Voice (forfait séparé), Apps Script, Vault, Work Insights.
Tarifs affichés (EUR, par utilisateur et par mois, engagement annuel) : Starter 6,80 € (30 Go, e-mail personnalisé,
Gemini dans Gmail), Standard 13,60 € (2 To), Plus 21,10 € (5 To, eDiscovery), Entreprise sur devis (S/MIME) ; promotion
−50 % sur 3 mois au moment de la capture. Google Sites : sites d'équipe sans code, modèles, versions, autorisations.
Hors Workspace : Search Console (performances, sitemaps, inspection d'URL, alertes), Tag Manager, Analytics (Marketing Platform).

Captures : `workspace-home.webp`, `workspace-pricing.webp`, `workspace-sites.webp`, `search-console.webp`, `tag-manager.webp`,
`analytics.webp`.

## 3. État réel côté Aphrody

| Point                                                  | Constat (2026-11-13)                                                                                                                                                                                                                                                 | Preuve                                               |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Domaine Workspace                                      | aucun : MX aphrody.com = OVH (mx0..3.mail.ovh.net), MX aphrody.app = Cloudflare Email Routing ; pas de `google._domainkey`                                                                                                                                           | DoH ; `infra/cloudflare/cloudflare.toml`             |
| SPF                                                    | les deux domaines incluent `_spf.google.com` (+ OVH ou Cloudflare, Resend, IP fr1/prd) alors qu'aucun envoi Google n'est configuré                                                                                                                                   | DoH, `cloudflare.toml:219`                           |
| DMARC                                                  | `p=quarantine`, rua dmarc-reports@aphrody.com                                                                                                                                                                                                                        | DoH                                                  |
| Vérification de site                                   | aucun TXT `google-site-verification` sur les deux apex, aucune balise meta                                                                                                                                                                                           | DoH, DOM live                                        |
| Comptes gcloud                                         | deux comptes gmail.com + comptes de service `aphrody`, `rgfr-8927d` ; pas d'identité Workspace                                                                                                                                                                       | `mcp__relay__gcloud_accounts`                        |
| API activées (projet `aphrody`)                        | searchconsole, siteverification, tagmanager, analytics(admin/data), indexing, pagespeedonline, chromeuxreport, webfonts, recaptchaenterprise, safebrowsing, webrisk, gmail, admin, cloudidentity, domains, dns, firebase*                                            | `gcloud services list --enabled`                     |
| Lecture Search Console / GA4 / GTM / Site Verification | refusée : `ACCESS_TOKEN_SCOPE_INSUFFICIENT` (jeton gcloud sans scopes webmasters/analytics/tagmanager) ; `gws` ne connaît que les services Workspace ; Gmail API non activée sur le projet OAuth de `gws`                                                            | réponses API                                         |
| CrUX                                                   | `queryRecord` répond 400 avec jeton OAuth (clé API requise) — non concluant                                                                                                                                                                                          | réponse API                                          |
| Balises Google live                                    | aucune : `dataLayer` et `gtag` indéfinis sur aphrody.com et aphrody.app ; code prêt mais inerte sans `PUBLIC_GTM_ID` / `PUBLIC_GA4_MEASUREMENT_ID` (`apps/aphrody/src/google/config.ts`, Consent Mode v2 refusé par défaut, chargement différé `src/client/boot.ts`) | DOM live, `aphrody-com.webp`, `aphrody-app.webp`     |
| Hôtes Google chargés                                   | `fonts.googleapis.com` (+ gstatic) sur les deux sites : Google Sans Flex `wght@100..1000&display=optional`                                                                                                                                                           | Resource Timing live, `apps/aphrody/dist/index.html` |
| robots / sitemap                                       | 200 sur les deux ; groupes explicites Googlebot, Google-Extended, OAI-SearchBot, ClaudeBot                                                                                                                                                                           | fetch live                                           |
| JSON-LD                                                | aphrody.com : Organization, WebSite, ItemList, BreadcrumbList ; aphrody.app : Organization, WebSite, Product, BreadcrumbList                                                                                                                                         | DOM live                                             |
| Service worker / PWA                                   | `site.webmanifest` présent, 0 service worker                                                                                                                                                                                                                         | DOM live                                             |

## 4. Matrice de fonctionnalités

| Fonctionnalité                         | Source Google                                        | Notre équivalent                                                                             |
| -------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Audit Lighthouse                       | GoogleChrome/lighthouse v13.6.0                      | `packages/wck` (gate statique au build) ; Lighthouse réel via chrome-devtools MCP, pas en CI |
| Lighthouse en CI (budgets, historique) | GoogleChrome/lighthouse-ci v0.16.1                   | absent                                                                                       |
| RUM Core Web Vitals                    | GoogleChrome/web-vitals v6.2.3                       | `packages/deploy/src/runtime.ts` (beacon maison ; INP approché)                              |
| Données terrain CrUX                   | Chrome UX Report API                                 | absent (API activée, clé non provisionnée)                                                   |
| PageSpeed Insights API                 | pagespeedonline                                      | absent (API activée)                                                                         |
| Service worker / hors-ligne            | GoogleChrome/workbox v7.4.1                          | absent                                                                                       |
| Préchargement des liens                | GoogleChromeLabs/quicklink 3.0.2 / Speculation Rules | absent                                                                                       |
| Scripts shell JS                       | google/zx 8.8.5                                      | Bun Shell                                                                                    |
| Orchestration de scripts               | google/wireit                                        | justfile + `ay`                                                                              |
| Minification JS                        | google/closure-compiler                              | `Bun.build`                                                                                  |
| Types JSON-LD                          | google/schema-dts v2.1.0                             | shenron/rosegriffon ; aphrody : JSON-LD manuel testé                                         |
| robots.txt conforme                    | google/robotstxt                                     | généré + `tests/seo.test.ts`                                                                 |
| Compression Brotli                     | google/brotli v1.2.1                                 | Cloudflare edge                                                                              |
| Images AVIF/WebP/JXL                   | libavif, libjxl v0.13.0, jpegli, squoosh             | Cloudflare Images (binding `IMAGES`) + `ay brand build`                                      |
| Composants Material 3 web              | material-components/material-web v2.5.0              | `@material/web` 2.5.0 dans `packages/design`                                                 |
| Couleur dynamique M3                   | material-color-utilities                             | `@material/material-color-utilities` 0.4.0 + crates `aphrody-design-*`                       |
| Icônes                                 | google/material-design-icons                         | Material Symbols (`packages/design`)                                                         |
| Police de marque                       | google/fonts (Google Sans Flex, OFL)                 | chargée depuis fonts.googleapis.com ; auto-hébergement absent                                |
| Outils police (sous-ensemble)          | googlefonts/fontations, fontc, google/woff2          | absent                                                                                       |
| 3D / AR                                | google/model-viewer v4.4.0                           | absent                                                                                       |
| Web components                         | lit/lit                                              | via `@material/web` uniquement                                                               |
| Pilotage navigateur                    | puppeteer, chrome-launcher                           | CDP direct (chrome-devtools MCP, `infra/chromium-factory`)                                   |
| Scan de vulnérabilités                 | google/osv-scanner                                   | `just checkdeps`                                                                             |
| Releases                               | googleapis/release-please                            | `packages/release`                                                                           |
| E-mail sur domaine                     | Gmail (Workspace Starter 6,80 €)                     | OVH MX Plan (aphrody.com), Cloudflare Email Routing (aphrody.app), Resend en sortie          |
| Identité / SSO domaine                 | Workspace Admin + Cloud Identity                     | absent (comptes gmail.com) ; `docs/infra/IDENTITY.md`                                              |
| Site sans code                         | Google Sites                                         | absent (sites codés, `apps/aphrody`, `apps/aphrody-app`)                                     |
| Formulaires                            | Google Forms                                         | absent                                                                                       |
| Vérification de propriété              | Site Verification / Search Console                   | absent (aucun TXT ni meta)                                                                   |
| Suivi d'indexation                     | Search Console + Indexing API                        | absent (API activées, propriété non vérifiée)                                                |
| Gestion de balises                     | Tag Manager (+ server-side GTM)                      | code prêt `src/google/config.ts` (GTM, sGTM), inactif                                        |
| Analytics                              | GA4                                                  | code prêt (Consent Mode v2), inactif ; RUM maison actif                                      |
| Consentement                           | Consent Mode v2                                      | `src/client/boot.ts` (refus par défaut)                                                      |
| Anti-bot                               | reCAPTCHA Enterprise                                 | Cloudflare Turnstile (skill `cloudflare:turnstile-spin`)                                     |
| Réputation d'URL                       | Safe Browsing / Web Risk                             | absent (API activées)                                                                        |
| Hébergement                            | Firebase Hosting / App Hosting                       | Cloudflare Workers (`wrangler.toml`)                                                         |
