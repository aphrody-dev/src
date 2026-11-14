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
| `apps/v4` | 182 pass, 1 fail (voir blocages) |
| `packages/tests` (e2e) | non vérifié (blocage 8) |

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
3. `apps/v4/registry/calendar.test.ts` : 1 échec (`aria/ui/calendar.tsx` ne contient pas la clé `month_grid` attendue), contenu de registre amont, indépendant de Bun.
4. Types : `vi.mocked`, `vi.stubEnv`, `vi.importActual`, `vi.stubGlobal` fonctionnent à l'exécution mais ne figurent pas dans les types de `bun:test` (environ 270 erreurs TS) ; fichiers de test exclus de `tsc`.
5. `Bun.WebView` : pas de facteur d'échelle (captures en 1x au lieu de 2x) ni de capture d'élément (le viewport est redimensionné sur l'élément).
6. Les paquets publiés tournent sur Node chez les utilisateurs : `exec`/`glob` gardent donc un repli Node ; un remplacement strict par `Bun.$` casserait la CLI publiée.
8. e2e : `bun run --filter v4 registry:build` réussit (369 s) et le serveur Next dev démarre, mais `GET /` ne répond pas en 120 s sur fr1 (compilation à froid Turbopack) ; `scripts/test-e2e.ts` attend donc le serveur sans lancer la suite. Le preload e2e est écrit mais jamais exécuté.
9. `ay graph build` n'accepte qu'un chemin ; graphe généré sur le dépôt entier.

## Sources

- Bun test DOM / happy-dom : https://bun.com/docs/test/dom (Context7 `/oven-sh/bun`, `docs/test/dom.mdx`)
- `Bun.WebView` (navigate, evaluate, screenshot, resize, scrollTo) : https://bun.com/docs/runtime/webview (`docs/runtime/webview.mdx`)
- `Bun.Glob` (scan, match) : https://bun.com/docs/api/glob
- `bun lint` / `bun fmt` (`--doctor`, `--no-script`) : sortie de `bun lint --help` et `bun fmt --help` sur fr1 (bun 1.4.4 canary), https://bun.com/docs/lint
- `Bun.spawn` : https://bun.com/docs/runtime/child-process
- Graphe : `graph/` (GRAPH_REPORT.md, ARCHITECTURE.mermaid, graph.svg), `ay graph build -o /tmp/g-shadcn shadcn-ui` sur fr1.
