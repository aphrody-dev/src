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
