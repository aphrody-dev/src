# Migration vers l'architecture web cible

Cible : `docs/replica/ARCHITECTURE.md`. Matrice : `docs/replica/FEATURE-MATRIX.md`. Règles : tout sur `main`, `git pull --rebase` puis `git commit -- <chemins>` ; bun seul ; builds natifs sur fr1 ; Cloudflare par `cf` ou wrangler (projets avec config), toujours `--dry-run` d'abord ; aucune suppression d'enregistrement DNS ni de ressource live ; preuves par capture de notre Chromium.

## Phase 1 : trois tranches parallèles (chemins disjoints)

| Tranche                    | Chemins possédés                                                                                                                                                                                                                                                                                                                                                                                                     | Ne touche pas                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| T1 edge et CDN             | `packages/deploy/src/{serve,runtime,worker,access}.ts`, `packages/deploy/wrangler.toml`, `packages/deploy/tests/{serve,runtime,worker}.test.ts`, `apps/r2-site/**`, `infra/fleet/workers/**`, `infra/cloudflare/workers/api-gateway/**`, `apps/aphrody/edge/**`, `apps/aphrody/wrangler.toml`, `apps/aphrody-app/wrangler.toml`, `infra/docker/{Dockerfile,Dockerfile.dockerignore}`, `.github/workflows/images.yml` | `pages.ts`, `m3.ts`, `cli.ts`, `registry.ts`, `state.ts`     |
| T2 framework et design web | `packages/site/**` (nouveau), `packages/design/src/web.ts`, `packages/design/package.json`, `packages/design/tests/web.test.ts`, `apps/yolo/**`, `packages/bun-plugins/**`, `bun.lock`                                                                                                                                                                                                                               | contenu d'`apps/aphrody`, `apps/aphrody-app`, `assets/brand` |
| T3 build et exploitation   | `packages/deploy/src/{cli,registry,state}.ts`, `packages/deploy/projects.toml`, `packages/deploy/tests/deploy.test.ts`, `packages/deploy/README.md`, `.github/workflows/{deploy,observe}.yml`, `infra/cloudflare/cloudflare.toml`, `infra/cloudflare/workers/{aphrody-webos,aphrody-email-worker,bun-video-showcase,yolo-aphrody-com,aphrody-app}/**`                                                                | fichiers de T1                                               |

Seule T2 modifie `bun.lock` ; T1 et T3 n'ajoutent aucune dépendance.

## Phase 2 : bascule des sites (agents des sites, après T2)

1. aphrody.com (`apps/aphrody`) : `build.ts` remplacé par `site.config.ts` + `app/` sur `@aphrody/site` ; `src/seo/html.ts`, `page-css.ts`, `m3.css`, `design/material-tokens.ts` supprimés ; `fonts.googleapis.com` retiré ; captures avant/après identiques.
2. aphrody.app (`packages/deploy/src/pages.ts`, `m3.ts`) : mise en page et CSS via `@aphrody/design/web` ; `m3.ts` et `client/md.ts` supprimés.
3. Suppression de `packages/google-design` après déplacement de `src/design-md` dans `packages/design` (`ay design lint` repointé).

## Phase 3 : un seul Worker de sites (après T1 et T3)

1. `aphrody-deploy` sert tout domaine de projet (hôte -> projet par le registre) avec `origin` déclaratif (`/api/*`, `/g/*` vers prd).
2. Projets ajoutés : `shell` (wasm construit sur fr1), `creator`, `downloads`.
3. Routes basculées une à une (`wrangler deploy --dry-run`, puis déploiement, capture) : `creator.aphrody.com`, `shell.aphrody.app`, puis `aphrody.com/*`. Retour arrière : réattacher la route au Worker précédent (laissé en place).
4. Les Workers devenus sans route restent live, listés dans `cloudflare.md` comme inactifs ; leur retrait est une décision du propriétaire.

## Phase 4 : hors src

rosegriffon et shenron (sous-modules) : évaluation `vinext check`, puis migration vers Workers dans leurs dépôts ; correction du cache des 404 de `cdn.rosegriffon.fr`.

## Vérification par phase

`bun fmt --check`, `bun check`, `bun test --cwd <paquet>`, `ay arch check --strict` (CI), `wck` vert, preview `https://<p>-<sha7>.aphrody.app` capturée par notre Chromium (en-têtes `cache-control` visibles dans DevTools), revue Gemini archivée dans `docs/reviews/`.
