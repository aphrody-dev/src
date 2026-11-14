# better-auth (aphrody-labs/better-auth)

Fork Bun-only. Base amont : `2039e7303` (v1.7.24). Commits : `dcb9f0843` (Bun de bout en bout), `9e858d07f` (tests, lint, format).

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
