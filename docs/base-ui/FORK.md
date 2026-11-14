# Maintenance du fork aphrody-labs/base-ui

Même modèle que `docs/nextjs/FORK.md`.

## Modèle

- Branche `master` du fork = `upstream/master` + commits `aphrody:` linéaires (pas de merge). Remotes de `third_party/base-ui` : `origin` (aphrody-labs), `upstream`.
- Commit `0cb0f9cc0` : pnpm remplacé par Bun (`bun.lock` migré, `bunfig.toml`, workspaces/overrides/patchedDependencies dans `package.json`, scripts `pnpm`/`npx`/`node` vers `bun`/`bunx`, `bun run --filter`), réécritures `--fullbun` (rimraf, dotenv, glob, node-fetch quand la forme est entièrement comprise). Outillage d'origine non converti : vitest, eslint, prettier, stylelint, lerna/nx.
- Preuve (vps, Bun 1.4.4 canary) : `bun install` sans erreur ; build : packages/utils et packages/react passent ; le build docs (link-check) exige le réseau ; un pnpm-workspace.yaml minimal est conservé car @mui/internal-code-infra détecte le workspace par ce fichier ; devDependency @mui/internal-babel-plugin-minify-errors ajoutée (le hoisting pnpm n'existe pas sous Bun).
- Sources : versions lues dans les `package.json` du fork et sorties `bun`/`gh api` de la session ; Context7 non consulté.

## Synchronisation

```sh
git -C third_party/base-ui fetch upstream
git -C third_party/base-ui rebase upstream/master      # conflits attendus : package.json, bun.lock
bunify third_party/base-ui --fullbun && bun install   # @aphrody/bunify (packages/bunify), idempotent
bunify third_party/base-ui --check --fullbun
git -C third_party/base-ui push --no-verify --force-with-lease origin master
bun scripts/upstream-scan.ts base-ui
```

Builds lourds sur vps (fr1), jamais sur le PC.

## Conversion tests / lint / format (commit `0bef63e5`, rebase sur upstream `315eba7a`, fr2)

- prettier -> `bun fmt` : scripts `prettier` et `prettier:all` utilisent `bun fmt --no-script --ignore-path .lintignore` (config `prettier.config.mjs` lue telle quelle; `pretty-quick` remplace par `--changed=master`).
- globby -> `Bun.Glob` : `scripts/inlineScripts.mts` et `docs/scripts/generateLlmTxt/index.mjs` (`new Bun.Glob(p).scan({cwd, absolute})`, resultat trie).
- vitest -> `bun test` (partiel) : `test/setupBun.ts` (precharge via `packages/utils/bunfig.toml`) enregistre jsdom sur globalThis, les globaux vitest (`globals: true`) et un `mock.module('vitest')` qui redirige vers `bun:test`; script `test:bun:utils`. Resultat `packages/utils` (hors `*.spec.ts`, types seuls) : 89 pass, 83 fail.
- Graphe : `docs/base-ui/graph/` (ay graph build sur fr2).

### Blocages precis

- 83 echecs utils et les 383 fichiers de `packages/react` : `@mui/internal-test-utils` (createRenderer, setupVitest) depend du contexte vitest par test (`beforeEach(({ expect }))`, `expect.getState().currentTestName`, `task`, `onTestFinished` fourni au hook, `vi.isFakeTimers`, chai/chai-dom, `vitest-fail-on-console`) que bun:test ne fournit pas. Il faut un fork/patch de ce paquet ou un renderer maison.
- Modes navigateur `@vitest/browser-playwright` (chromium/firefox/webkit), e2e et regressions (vite + vitest) : non convertis; Bun.WebView est Chrome seul (Context7 `/oven-sh/bun`, docs/runtime/webview.mdx). Playwright screen-reader (guidepup) conserve.
- `bun lint` : echec au chargement de `eslint.config.mjs` (`Cannot find module 'zod-validation-error/v4'` depuis eslint-plugin-react-hooks 7.1.1, peer non lie par le linker isole); eslint 10 et ses regles MUI custom (`test:lint-rules`) restent la reference. `bun lint` n'a donc pas ete valide ici.
- `docs` build/link-check et build complet : non relances (fr2 limite, builds lourds sur fr1).
