# Fork tailwindcss (aphrody-labs/tailwindcss, branche main)

Conversion Bun, etat au commit `8ed754c0` (base `1ad5572d`). Hote de travail : fr2 (~/work/tailwindcss), bun 1.4.4 (canary).

## Fait

- vitest -> `bun test` : imports `vitest` remplaces par `bun:test` dans 88 fichiers (hors `integrations/` et `*.bench.ts`), configs `vitest.config.mts` supprimees (racine, `packages/tailwindcss`, `@tailwindcss-browser`). Le `snapshotSerializers` vitest devient `expect.addSnapshotSerializer` dans `packages/tailwindcss/src/test-utils/bun-preload.ts`, charge par `[test] preload` de `bunfig.toml`. Les contextes de test `({ expect })` (propres a vitest) sont remplaces par l'import de `expect`; `assert` vient de `node:assert`. Script `test` : `cargo test && bun test packages/*/src scripts` (les `*.spec.ts` Playwright sont exclus en ciblant `src`).
- prettier -> `bun fmt` : `bun fmt` lit la cle `prettier` de `package.json`; scripts `format` et `lint` utilisent `bun fmt --no-script [--check] --ignore-pattern 'integrations/**'` (le plugin `prettier-plugin-embed` n'existe pas dans bun fmt, `organize-imports` non plus). `bun lint` n'ajoute rien : le lint du depot est `tsc --noEmit` + prettier, pas eslint/biome.
- Graphe : `docs/tailwindcss/graph/` (GRAPH_REPORT.md, ARCHITECTURE.mermaid, graph.svg), genere avec `ay graph build` sur fr2.

## Resultats

`bun test packages/tailwindcss/src` : 5400 pass, 0 fail, 1 todo (2112 snapshots). Les autres paquets JS passent (cli, node, upgrade, vite, browser) sauf ceux qui chargent `@tailwindcss/oxide`.

## Mesures oxide (fr2, 2026-11-14)

rustup minimal + rustc 1.100.0 stable installes sur fr2 (user ubuntu). `bun run build:platform` (napi, release) dans `crates/node` : 1m24s, produit `tailwindcss-oxide.linux-x64-gnu.node`. Tests (hyperfine --runs 3) :

| Suite | Avant (sans oxide) | Apres | Temps apres |
|---|---|---|---|
| `@tailwindcss-postcss/src` | 5 pass / 1 fail / 1 error | 23 pass / 0 fail | 0.69 s |
| `@tailwindcss-upgrade/src` | 258 pass / 6 fail / 6 errors | 415 pass / 0 fail | 12.0 s |

Aucun correctif de code requis : seul le binaire natif manquait. `cargo test`, `integrations/` et Playwright restent non executes.

## Blocages restants

- `compiler-lifetime.test.ts` : le test de liberation par GC utilise `v8.setFlagsFromString('--expose-gc')`; sous JavaScriptCore `Bun.gc(true)` ne libere pas les `WeakRef` (references conservatrices de pile). Passe en `test.todo`.
- `*.bench.ts` : bun:test n'a pas de `bench`; `vitest bench` reste (dependance vitest conservee). `integrations/**` (vitest, `--root=./integrations`) non converti : necessite oxide + builds + navigateurs.
- Playwright (`tests/ui.spec.ts`, 2596 lignes + 176) : non converti vers `Bun.WebView` (API Chrome seul sous Linux, perte de la couverture firefox/webkit; depend aussi d'oxide).
- execa/glob : aucun usage hors tests. `globby.isGitIgnored` (`@tailwindcss-upgrade`) n'a pas d'equivalent `Bun.Glob`; `execSync` du CLI upgrade conserve (CLI publie aussi pour Node).
- Resultats `oklab(...)` : precision geree par le serializer (identique a vitest).

## Sources

- bun test, `expect.addSnapshotSerializer`, `onTestFinished`, preload : Context7 `/oven-sh/bun` (docs/test/snapshots.mdx, docs/test/lifecycle.mdx).
- `Bun.WebView` : Context7 `/oven-sh/bun` (docs/runtime/webview.mdx).
- `bun fmt --help --all` (bun 1.4.4 canary.1 sur fr2) pour `--ignore-pattern`, `--no-script`, config prettier.
