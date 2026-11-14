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

## Shim bun:test pour @mui/internal-test-utils (commit `6b3b5642`, fr2, bun 1.4.5-canary.1)

- `test/setupBun.ts` : `mock.module('vitest')` expose `beforeEach`/`afterEach` enveloppes sans parametre (bun traite un parametre declare comme callback `done`) qui passent le contexte vitest `{ expect, task, onTestFinished }`; `onTestFinished` execute dans un `afterEach`; `test/setupVitest.ts` (chai, chai-dom, RTL cleanup, fail-on-console) est importe par le preload. `packages/react/bunfig.toml` charge le preload. Scripts `test:bun:utils`, `test:bun:react` (un process bun par fichier, `-P4`).
- Mesures (hors `*.spec.*`) : packages/react avant 0 pass / tous fail (Button : 0 pass / 21 fail, 1.64 s) ; apres 9238 pass / 129 fail sur 352 fichiers (47 fichiers avec echecs, aucun timeout), 290 s en 4 process paralleles ; Button 21 pass / 0 fail, 1.57 s (hyperfine, 3 runs). packages/utils : 89 pass / 83 fail -> 151 pass / 21 fail.
- Restant : `bun test src` en un seul process se bloque apres `MenuPositioner.test.tsx` (fuite d'etat entre fichiers, d'ou un process par fichier) ; 129 echecs concentres dans select, toast viewport, autocomplete, context-menu, drawer, menu filter (timers factices `vi.*`, layout jsdom).

## Shim bun:test, tour 2 (commit `393c6a5`, fr2, bun 1.4.5-canary.1)

Causes regroupees puis corrigees dans `test/setupBun.ts` / `test/setupVitest.ts` :

- `AbortController`/`AbortSignal`/`FormData` natifs Bun melanges a jsdom (`addEventListener` signal, `new FormData(form)` vide) : globaux jsdom.
- `window === globalThis` mais `Event` jsdom : `addEventListener`/`dispatchEvent` relies a jsdom ; `document.defaultView` renvoie `globalThis` (donc `vi.stubGlobal`, `vi.spyOn(window, ...)`, `CloseWatcher` stub visibles pour `ownerWindow`).
- Contexte de test vitest (`{ skip, onTestFinished, expect, task }`) : `it`/`test` enveloppes (bun prend un parametre declare pour un callback `done`) ; `skip()` leve un sentinelle.
- Matchers chai de `@mui/internal-test-utils` (`toBeInaccessible`, `toErrorDev`, `toBeVisible`, `toHaveFocus`...) pontes vers `expect.extend` (sous vitest ils surchargent jest-dom).
- Avertissements `act()` tardifs (floating-ui `computePosition().then`) : demontage RTL des la fin de la fonction de test (vitest demonte avant l'arrivee de la mise a jour, bun execute `afterEach` plus tard).
- Erreurs jsdom `Not implemented` (navigation, `requestSubmit`) filtrees du `VirtualConsole`.
- Tests : `toContain(element)` (chai-dom) remplace par `.contains()` (AlertDialogRoot, DialogViewport).

Mesures (hors `*.spec.*`, 6 process paralleles) : packages/react 9238 pass / 129 fail (47 fichiers) -> 9364 pass / 3 fail (2 fichiers), 245 s ; packages/utils 151 / 21 -> 172 / 0.
Restant (3) : `MenuCheckboxItem` x2 (avertissement act dans `state management`), `NumberFieldInput` (blur NaN, corps vide apres le test precedent).
