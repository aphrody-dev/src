# Maintenance du fork aphrody-labs/next.js

Même modèle que `aphrody-labs/bun` (25 patchs linéaires au-dessus d'`upstream/main`, CI propre au fork `aphrody-windows.yml` / `native.yml`, veille `ay bun watch|bump|install`).

## Modèle

- Branche `canary` du fork = `upstream/canary` + commits `aphrody:` linéaires (pas de merge). Remotes de `third_party/next.js` : `origin` (aphrody-labs), `upstream` (vercel).
- Patchs actuels (commit `aphrody: Bun from end to end`) :
  - pnpm remplacé par Bun : `bun.lock` (migré depuis `pnpm-lock.yaml`), `bunfig.toml` (exact, linkWorkspacePackages, minimumReleaseAge 48 h), `workspaces`/`overrides`/`patchedDependencies`/`packageExtensions`/`trustedDependencies` dans `package.json`, `packageManager: bun@1.4.5` ;
  - scripts et outillage : `pnpm`/`npx`/`node`/`cross-env` remplacés par `bun`/`bunx` (67 fichiers, `scripts/aphrody/bunify.ts`, idempotent, `--check`) ;
  - `patches/taskr@1.1.0.patch` : `find` par `fs.existsSync` ; `patches/@taskr%2Fesnext@1.1.0.patch` : `module.createRequire` au lieu de `require-like`, qui rend `undefined` sous Bun ;
  - Rust : `turbopack_core::environment::js_runtime()` (Bun par défaut, `TURBOPACK_JS_RUNTIME` pour surcharger), utilisé par le pool de processus `turbopack-node` (loaders webpack, PostCSS) et la détection de version (`-p process.version`) ; `TURBO_PNPM_WORKSPACE_DIR` renommé `TURBO_WORKSPACE_DIR` ;
  - `.cargo/config.toml` : `rustc-wrapper = ""` (sccache 0.19 casse sous Windows, os error 206, mozilla/sccache#2397).
- Preuve : `bun scripts/aphrody/e2e.ts`, sans `node` dans le PATH, donne `postcss pool: bun-1.4.5, render: bun` ; `bun run build` passe 17/17 tâches turbo ; `next-swc` compilé depuis le fork (`bun run build-native`).
- CI du fork : `.github/workflows/aphrody-bun.yml` (Linux, Node supprimé du runner).

## Synchronisation

```sh
gh repo sync aphrody-labs/next.js -b canary   # refuse tant que le fork a ses patchs : rebase ci-dessous
git -C third_party/next.js fetch upstream
git -C third_party/next.js rebase upstream/canary   # conflits attendus : package.json, bun.lock, scripts
bun scripts/aphrody/bunify.ts && bun install         # réapplique la conversion, régénère bun.lock
bun scripts/aphrody/bunify.ts --check && bun run build && bun scripts/aphrody/e2e.ts
git push --no-verify --force-with-lease origin canary   # hooks husky : sh non exécutable sous Windows
bun scripts/upstream-scan.ts nextjs                     # instantané docs/nextjs
```

Le convertisseur générique est `@aphrody/bunify` (`packages/bunify`), applicable à tout monorepo pnpm/yarn/npm/lerna ; la copie du fork reste autonome pour la CI du fork.

Forks des dépendances à remplacer par du Bun natif (`bunify --fullbun`) : `third_party/webpack`, `swc`, `postcss`, `taskr`, `node-require-like`.
