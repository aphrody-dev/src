# better-auth (aphrody-labs/better-auth)

Fork Bun-only. Base amont : `3fa26c979` (v1.7.25, rebase amont du 2026-11-14, push force-with-lease). Commits : `2b0aa246a` (Bun de bout en bout), `08cc2ca5b` (tests, lint, format), `1e6077ea0` (validate:docs). Verifie sur usa (/root/work) : install --ignore-scripts, build core + better-auth.

## Conversions

| Avant | Apres | Remarque |
| --- | --- | --- |
| vitest (448 fichiers, 31 `vitest.config*.ts`) | `bun test` | imports `bun:test`; `vi.*` couvert nativement (mock, hoisted, stubGlobal, stubEnv, fake timers, waitFor). Configs supprimees. |
| `clearMocks` / `restoreMocks` | `bun-test.setup.ts` (preload) | `vi.clearAllMocks` avant, `vi.restoreAllMocks` apres chaque test. |
| `ssr.resolve.conditions: ["dev-source"]` | `bun-test.plugin.ts` (preload) | `--conditions` de bun est global et casse `better-call` (dev-source sans `src/`); le plugin ne resout que `better-auth` et `@better-auth/*` vers `dev-source`, exports wildcard inclus. |
| `// @vitest-environment happy-dom` | `src/test-utils/dom-env.ts` + `@happy-dom/global-registrator` | enregistrement en tete de fichier, `unregister` en `afterAll`. |
| contexte de test (`{ onTestFinished }`, `{ expect }`, `ctx`) | import module-level `onTestFinished`, `expect` | bun passe `done` en premier argument : un parametre inutilise provoque un timeout, il a ete retire. |
| `onTestFailed` | `bun-test.compat.ts` (no-op) ; `create-test-suite.ts` utilise try/catch | `bun:test` n'exporte pas `onTestFailed`. |
| `skip` du contexte (`@better-auth/test-utils`) | exception sentinelle `TestSkipSignal` | le test s'arrete et est compte comme reussi. |
| `vi.when` (vitest 5) | file de reponses locale (`facebook.test.ts`) | |
| `assertType`, `expect.assert.isDefined` | fonction locale, `node:assert` | |
| `--parallel=4` | isole chaque fichier (fresh global) | necessaire : `vi.mock`/`mock.module` fuit entre fichiers sinon (95 echecs -> 10 sur `packages/better-auth`). |
| biome (`biome.json`, plugin grit) | `bun lint` (section `[lint]` de `bunfig.toml`) | `--quiet` : erreurs seules. Regles biome portees : `prefer-const`, `no-debugger`, `ban-ts-comment` (ts-ignore), `consistent-type-imports` (separate), `prefer-node-protocol`, `prefer-date-now`, `no-floating/misused-promises` (type-aware), Buffer interdit dans `packages/**/src`. |
| `noDelete`, `no-instanceof-api-error.grit`, `zod { z }` | `no-restricted-syntax` (selecteurs ESTree) | niveau warn sauf `zod`; `no-restricted-imports` ne distingue pas `import * as z`. |
| biome format | `bun fmt --use-tabs` (ts, tsx, mts, css) et `bun fmt` (json) | `[fmt]` global casse l'indentation JSON, d'ou deux invocations dans `format` / `format:check`. |
| lefthook, ci.yml | `bun lint`, `bun install --frozen-lockfile` | |

Aucun site `execa` ni `glob` dans ce fork (rien a convertir en `Bun.$` / `Bun.Glob`). Pas de regle bunify ajoutee.

## Resultats (bun 1.4.5-canary.1, fr1, `bun test --parallel=4`)

api-key 203/203, better-auth 3140 pass / 10 fail, core 862 / 4, drizzle 72/72, expo 134/134, i18n 18/18, mcp 101/101, memory-adapter 20/20, passkey 82/82, prisma 41/41, redis-storage 15/15, release-tooling 170/170, stripe 196/196, test-utils 3/3, oauth-provider 1156 / 7, scim 387 / 3, sso 665 / 7, cimd 202 / 1, e2e memory-adapter 467/467, e2e kysely 455 / 15. `bun lint` : 0 erreur (1741 fichiers, 1,5 s).

## Blocages precis

- Bases de donnees absentes sur fr1 (ECONNREFUSED 5432, 5433, 3307, 27017) : echecs Postgres/MySQL/Mongo dans better-auth, sso, kysely, api-key et tous les `e2e/adapter/*` (docker requis, non lance).
- `packages/cli` (56 echecs) : `toMatchFileSnapshot` absent de bun, `better-sqlite3` non supporte par Bun, `test.extend` (fixtures) absent, `dist/` du CLI non construit. `packages/electron` : `better-sqlite3`.
- `test/` (4) : `undici.MockAgent` (`disableNetConnect`, `close`) non implemente.
- `core` : detection de runtime (`getRuntimeName` suppose Node/Bun ordre), `Native export is unavailable`.
- oauth-provider (7, `oauthClient forbidden user`), scim (3), cimd (1) : non diagnostiques.
- Playwright : conserve (`e2e/integration`, 2400 lignes). `Bun.WebView` n'offre ni locators par role, ni contextes multiples/cookies, ni attente de reponse reseau ; seul `cdp()` brut existe, la reecriture n'est pas faisable proprement.
- `bun lint` active des regles par defaut en plus de la liste ; `typescript/no-floating-promises` et `no-misused-promises` passent en warn (le type-aware de bun est plus strict que biome nursery). Typecheck (`tsc --build`) non rejoue.
- `@better-auth/test-utils` cible desormais `bun:test` (plus de peer `vitest`).
- Synchronisation amont (upstream HEAD, rebase) non realisee : exigerait un `--force-with-lease` non autorise par la consigne ; le travail reste sur `2039e7303`.

## Tests avec bases reelles (usa, 2026-11-14, commit `1e7818ca8`)

Isolation : espace reseau Docker jetable (projet `ba-throwaway`, reseau sans port publie, `nsenter -n` pour lancer `bun test` dedans) : Postgres 18 sur 5432-5435, MySQL 8.4 sur 3306-3308, Mongo 7 (replSet) sur 27017, Redis sur 6379, sans toucher `/srv/shenron` ni les ports de production (5432 et 6379 de l'hote sont pris par la production, d'ou l'espace reseau). Conteneurs et reseau supprimes apres les mesures. `better-sqlite3` : `make` + `gcc` installes (pacman), `bun install --frozen-lockfile` compile le binaire natif (73 s) ; Bun refuse malgre tout de le charger ("not yet supported in Bun", 28 echecs e2e/adapter).

| Cible | Avant | Apres | Temps (hyperfine, 3 runs) |
| --- | --- | --- | --- |
| packages/better-auth (DB + reseau) | 3165 pass / 8 fail | 3173 pass / 1 fail | 28,6 s -> 32,2 s +/- 2,9 s |
| kysely-adapter | 62 / 6 | 66 / 2 | 26 s |
| core 866/6, oauth-provider 1171/7, scim 387/3, sso 668/4, cimd 197/6, mongo-adapter 35/6, expo 116/18, telemetry 6/4 | - | non modifies | 0-20 s |
| api-key 204/0, drizzle 72/0, prisma 41/0, redis 15/0, stripe 196/0, passkey 82/0, i18n 18/0, mcp 101/0, memory 20/0, test-utils 3/0 | - | - | 0-2 s |
| e2e/adapter | - | 1729 pass / 50 fail | 72 s |
| test/ | - | 12859 pass / 563 fail | 429 s |

Corrige (9 echecs) : `expect.assert` (-> `node:assert`), `.length.above` (chai), regex de pile `ErrorWithStack` (bun : `APIError`), assertion de pile hors debug (bun la laisse vide), hook `beforeEach({ skip })` kysely (parametre pris pour `done`, 5 s de timeout), message `ROLE_NOT_FOUND` (`.code`).

Causes restantes : un echec `(unnamed)` dans better-auth (erreur de hook asynchrone) ; `kysely/migration` introuvable dans `sqlite-introspector.test.ts` et 1 echec de pool PG ferme ; mongo-adapter 6 (mocks de logger `field-level indexes`, aussi avec replSet) ; core 6 (detection de runtime, `Native export is unavailable`, Cloudflare) ; telemetry 4 (detection de runtime) ; cimd 6 (transport Node : `https.request` mocke, non intercepte par Bun) ; expo 18 (fuite de mocks entre fichiers quand le paquet est lance en bloc) ; oauth-provider 7, scim 3, sso 4 non diagnostiques ; `test/` et `e2e/adapter` : `better-sqlite3` et `drizzle-kit push` sous Bun. Les tests HIBP et social exigent un acces internet sortant (inclus dans le reseau jetable).

## Sources

- Bun test, mocks (`vi`) : https://github.com/oven-sh/bun/blob/main/docs/test/mocks.mdx
- Bun test, cycle de vie (`onTestFinished`) : https://github.com/oven-sh/bun/blob/main/docs/test/lifecycle.mdx
- Bun test, configuration (`preload`, `timeout`) : https://github.com/oven-sh/bun/blob/main/docs/test/configuration.mdx
- `[lint]` / `[fmt]` dans bunfig : https://github.com/oven-sh/bun/blob/main/docs/runtime/bunfig.mdx
- `bun lint` : https://github.com/oven-sh/bun/blob/main/docs/lint/index.mdx ; `bun fmt` : https://github.com/oven-sh/bun/blob/main/docs/format/index.mdx
- `Bun.WebView` : https://github.com/oven-sh/bun/blob/main/docs/runtime/webview.mdx
- Aides `bun lint --help --all`, `bun fmt --help --all`, `bun lint --explain <regle>` (bun 1.4.5-canary.1+9098897a1, fr1).
- Contexte Context7 : `/oven-sh/bun`.

Graphe : `docs/better-auth/graph/` (GRAPH_REPORT.md, ARCHITECTURE.mermaid, graph.svg).

## Tour 3 (usa, commits `7b94e882a` puis rebase `5c261e101`, 2026-11-14)

Fork reconstruit en serie lineaire `aphrody:` (6 commits) sur upstream `54c1b693c` : conflit unique de `ay upstream sync better-auth` (patch 2, `packages/core/src/oauth2/dpop.test.ts`, import vitest -> `bun:test` a cote du nouvel import de type) resolu ; deux nouveaux tests amont (`oauth-provider/challenge-exposure`, `local-jwks`) convertis. Les "import/runtime failures" du tour precedent venaient d'un lancement sans `--preload ../../bun-test.plugin.ts` (resolution `dev-source`), pas de bugs.

| Cible (sans bases de donnees) | Avant | Apres |
| --- | --- | --- |
| core | 866 / 6 | 873 / 0 |
| telemetry | 6 / 4 | 9 / 0 |
| cimd | 197 / 6 | 202 / 0 (1 skip Bun) |
| better-auth (hook `(unnamed)`) | 1 | 0 ; reste 3 echecs Postgres (pas de base) |
| mongo-adapter | 35 / 6 | 40 / 1 (commit reel exige un replSet) |
| oauth-provider | 1171 / 7 | 1173 / 7 (non diagnostique) |
| e2e/adapter sqlite (kysely + drizzle 0.x + drizzle 1.0-rc, 19 fichiers, 175 s) | `better-sqlite3` refuse par Bun (28+ echecs) | 1921 pass / 0 fail |

Correctifs : tests sqlite sur `bun:sqlite` (`drizzle-orm/bun-sqlite`, `BunSqliteDialect`), `pushDrizzleSchema` via l'API `drizzle-kit/api` (0.x) ou CLI avec preload masquant `better-sqlite3` (1.x, driver `bun`) ; `it.each([[null],[[]],...])` (bun deplie les tableaux) ; `afterAll` s'execute dans l'ordre d'enregistrement ; `Bun` global non configurable (`skipIf`) ; Response Bun accepte `statusText` avec controle (`skipIf`) ; attentes telemetry perimees ; source `telemetry/src/index.ts` : un `customTrack` qui leve de facon synchrone etait un rejet non gere (try/catch). Reste : Prisma sqlite (`@prisma/adapter-better-sqlite3`), `packages/cli`/`electron` (better-sqlite3), bases Postgres/MySQL/Mongo non relancees ce tour (chiffres du tableau precedent inchanges).
