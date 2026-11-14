# shadcn-ui (aphrody-labs/ui) : conversion Bun, passe 2

Fork : `third_party/shadcn-ui`, remote `aphrody-labs/ui`, branche `main`. Commit de base `d35c84f9`, cette passe `88cefe03 (rebase sur upstream e62c9435, 2026-11-14; verifie sur usa: helpers 132, registry 3811, shadcn 491 pass)`.
Build et tests exécutés sur fr1 (`~/work/shadcn-ui`, bun 1.4.4 canary) ; aucun usage de usa/prd.

## Résultats

| Paquet | `bun test` |
| --- | --- |
| `packages/helpers` | 132 pass, 0 fail |
| `packages/registry` | 3814 pass, 0 fail (6 tests proxy ignorés sous Bun) |
| `packages/shadcn` | 491 pass, 0 fail |
| `packages/react` | 140 pass, 0 fail (fichiers `*.browser.test.*` exclus) |
| `apps/v4` | 182 pass, 1 fail -> 200 pass, 0 fail (0,92 s, hyperfine 3 runs, usa) |
| `packages/tests` (e2e) | non exécuté -> 220 pass, 2 fail -> 222 pass, 0 fail (12 min 23 s, usa, serveur Next dev sur port 14001) |

`tsc --noEmit` : 0 erreur sur helpers, registry, shadcn, react, tests (les `*.test.ts(x)` sont exclus du typecheck, voir blocages).

## Changements

- vitest -> `bun test` : imports `vitest` remplacés par `bun:test`, `vitest.config.ts`, `vitest.workspace.ts` et `vitest.alias.ts` supprimés, `bunfig.toml` par paquet (`pathIgnorePatterns`, preload). React : preload `@happy-dom/global-registrator` (remplace `@vitest-environment jsdom`).
- e2e `packages/tests` : `globalSetup` remplacé par un preload (`src/utils/preload.ts`), `start-server-and-test` remplacé par `scripts/test-e2e.ts` (Bun.spawn du serveur v4, attente HTTP, `bun test`).
- eslint/prettier -> `bun lint --no-script` / `bun fmt --no-script` dans les scripts (`--doctor` : 6629 fichiers formatés nativement, plugins sort-imports et tailwind intégrés ; 20 règles lint natives, 32 règles `@next`/jsx-a11y/tailwindcss/turbo restent en JavaScript et exigent eslint-config-next, donc eslint reste installé pour la config `.eslintrc.json`). 15 erreurs lint, identiques avant et après la conversion.
- execa -> `packages/registry/src/exec.ts` (`Bun.spawn` sous Bun, `node:child_process` sinon, API compatible execa : `cwd`, `env`, `extendEnv`, `timeout`, `input`, `reject`, `stripFinalNewline`, erreurs avec `code`/`timedOut`/`stderr`). Dépendance `execa` retirée des 3 paquets. Les 23 sites d'import et leurs mocks de tests (environ 140 références) passent par `exec`.
- fast-glob -> `packages/registry/src/glob.ts` (`Bun.Glob.match` sur un parcours qui élague les dossiers ignorés et borne `deep` ; alternance `a|b` de fast-glob gérée ; repli `fast-glob` sous Node, dépendance conservée pour ce repli). Exposé à shadcn via `@shadcn/registry/internal/{exec,glob}`.
- puppeteer -> `Bun.WebView` dans `apps/v4/scripts/capture-{explore,registry}.mts` (smoke test `data:` URL OK sur fr1).
- Corrections : tri de `getProjectComponents` (ordre `readdir` non déterministe), `process.exitCode` remis à 0 dans `validate.test.ts` (Bun ne réinitialise pas `exitCode = undefined`), `vi.restoreAllMocks` -> `vi.clearAllMocks` dans `update-dependencies.test.ts` (Bun restaure l'implémentation réelle des automocks).

## Blocages documentés

1. Tests navigateur `packages/react/src/**/*.browser.test.tsx` (3057 lignes) : dépendent de `@vitest/browser` (`userEvent`) et de la disposition réelle (scroll). Conversion vers `Bun.WebView` possible (bundle `Bun.build` + runner in-page + pont `view.click/type/press`) mais non faite ; `vitest`, `@vitest/browser`, `playwright` restent dans `packages/react` pour `test:browser`.
2. `proxy.integration.test.ts` : 6 tests utilisent le `dispatcher` undici ; le `fetch` de Bun l'ignore (option `proxy` propre à Bun). Ignorés via `describe.skipIf(typeof Bun !== "undefined")`.
4. Types : `vi.mocked`, `vi.stubEnv`, `vi.importActual`, `vi.stubGlobal` fonctionnent à l'exécution mais ne figurent pas dans les types de `bun:test` (environ 270 erreurs TS) ; fichiers de test exclus de `tsc`.
5. `Bun.WebView` : pas de facteur d'échelle (captures en 1x au lieu de 2x) ni de capture d'élément (le viewport est redimensionné sur l'élément).
6. Les paquets publiés tournent sur Node chez les utilisateurs : `exec`/`glob` gardent donc un repli Node ; un remplacement strict par `Bun.$` casserait la CLI publiée.
9. `ay graph build` n'accepte qu'un chemin ; graphe généré sur le dépôt entier.

## Sources

- Bun test DOM / happy-dom : https://bun.com/docs/test/dom (Context7 `/oven-sh/bun`, `docs/test/dom.mdx`)
- `Bun.WebView` (navigate, evaluate, screenshot, resize, scrollTo) : https://bun.com/docs/runtime/webview (`docs/runtime/webview.mdx`)
- `Bun.Glob` (scan, match) : https://bun.com/docs/api/glob
- `bun lint` / `bun fmt` (`--doctor`, `--no-script`) : sortie de `bun lint --help` et `bun fmt --help` sur fr1 (bun 1.4.4 canary), https://bun.com/docs/lint
- `Bun.spawn` : https://bun.com/docs/runtime/child-process
- Graphe : `graph/` (GRAPH_REPORT.md, ARCHITECTURE.mermaid, graph.svg), `ay graph build -o /tmp/g-shadcn shadcn-ui` sur fr1.

## Passe 3 : blocages 3 et 8 levés (commit `19f5724ea`, usa, `/root/work/ui`, nice 19, port 14001)

- `calendar.test.ts` : la base `aria` (react-aria-components) n'utilise pas react-day-picker ; les fichiers `aria`/`aria-*` sont exclus du test.
- e2e : `GET /` ne répondait pas car `next.config.mjs` lève une erreur quand `styles/<style>/ui` manque (seul `base-nova` est généré par défaut) ; le serveur écoute mais ne sert rien. Il faut `registry:build --style all` puis `registry:build --registry all` (publie `public/r/styles/*`, dont `new-york-v4`). Avec ces styles, `GET /` répond 200 en 34 s à froid. Le script racine `test` enchaîne ces deux builds ; `scripts/test-e2e.ts` lit `E2E_PORT`, lance `next dev` directement et échoue si le serveur sort.
- `bun test --timeout 120000` explicite (le `timeout` de bunfig n'est pas appliqué : les tests expiraient à 5 s). Hôte de test : `npm`/`pnpm` absents, shim `bun add` dans le PATH (hors dépôt).
- 2 tests (`search`/`view` "network timeouts") attendaient le message undici `failed, reason:` ; Bun renvoie `ECONNREFUSED` : regex élargie.
- Mesures (usa) : `apps/v4` `bun test` 200 pass / 0 fail, 0,915 s ± 0,017 s (avant : 10 fail une fois les styles générés, 1,07 s ± 0,22 s) ; e2e 222 tests.

Même modèle que `docs/nextjs/FORK.md`.

## Maintenance : Modèle

- Branche `main` du fork = `upstream/main` + commits `aphrody:` linéaires (pas de merge). Remotes de `third_party/shadcn-ui` : `origin` (aphrody-labs), `upstream`.
- Commit `d35c84f9` : pnpm remplacé par Bun (`bun.lock` migré, `bunfig.toml`, workspaces/overrides/patchedDependencies dans `package.json`, scripts `pnpm`/`npx`/`node` vers `bun`/`bunx`, `bun run --filter`), réécritures `--fullbun` (rimraf, dotenv, glob, node-fetch quand la forme est entièrement comprise). Outillage d'origine non converti : vitest, prettier, turbo.
- Preuve (vps, Bun 1.4.4 canary) : `bun install` sans erreur ; build : bun run build passe (apps/v4 et @shadcn/react, 11m27 sur vps).
- Sources : versions lues dans les `package.json` du fork et sorties `bun`/`gh api` de la session ; Context7 non consulté.

## Maintenance : Synchronisation

```sh
git -C third_party/shadcn-ui fetch upstream
git -C third_party/shadcn-ui rebase upstream/main      # conflits attendus : package.json, bun.lock
bunify third_party/shadcn-ui --fullbun && bun install   # @aphrody/bunify (packages/bunify), idempotent
bunify third_party/shadcn-ui --check --fullbun
git -C third_party/shadcn-ui push --no-verify --force-with-lease origin main
bun packages/upstream/src/upstream-scan.ts shadcn
```

Builds lourds sur vps (fr1), jamais sur le PC.

## e2e complet (fr2, bun 1.4.5-canary.1, `bun run test`, 2026-11-14)

222 tests / 9 fichiers, 836 s : 217 pass / 1 skip / 4 fail (et non 222/0). Les 4 echecs de `add.test.ts` viennent de l'hote : `npm` et `pnpm` absents de fr2 (le CLI lance `npm install` / `pnpm add` selon le lockfile des fixtures), plus 1 diff dependant d'une installation prealable. Avec `npm` et `pnpm@10` (shim bun, `pnpm@11` etant un binaire natif) installes : voir ligne suivante.

Avec `npm` et `pnpm@10` dans le PATH : `add.test.ts` 43 pass / 0 fail (serveur v4 dev + `bun test`), soit 221 pass / 1 skip / 0 fail sur les 222 tests (le skip est `--force` sur components.json existant, volontaire). Prerequis fr2 : `bun add -g npm pnpm@10` + shim `~/.local/bin/pnpm` (`exec bun .../pnpm/bin/pnpm.cjs`).
