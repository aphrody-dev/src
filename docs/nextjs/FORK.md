# Maintenance du fork aphrody-labs/next.js

Même modèle que `aphrody-labs/bun` (25 patchs linéaires au-dessus d'`upstream/main`, CI propre au fork `aphrody-windows.yml` / `native.yml`, veille `ay bun watch|bump|install`).

## Modèle

- Branche `canary` du fork = `upstream/canary` + commits `aphrody:` linéaires (pas de merge). Remotes de `third_party/next.js` : `origin` (aphrody-labs), `upstream` (vercel).
- Patchs actuels (commit `aphrody: Bun from end to end`) :
  - pnpm remplacé par Bun : `bun.lock` (migré depuis `pnpm-lock.yaml`), `bunfig.toml` (exact, linkWorkspacePackages, minimumReleaseAge 48 h), `workspaces`/`overrides`/`patchedDependencies`/`packageExtensions`/`trustedDependencies` dans `package.json`, `packageManager: bun@1.4.4` ;
  - scripts et outillage : `pnpm`/`npx`/`node`/`cross-env` remplacés par `bun`/`bunx` (67 fichiers, `scripts/aphrody/bunify.ts`, idempotent, `--check`) ;
  - `patches/taskr@1.1.0.patch` : `find` par `fs.existsSync` ; `patches/@taskr%2Fesnext@1.1.0.patch` : `module.createRequire` au lieu de `require-like`, qui rend `undefined` sous Bun ;
  - Rust : `turbopack_core::environment::js_runtime()` (Bun par défaut, `TURBOPACK_JS_RUNTIME` pour surcharger), utilisé par le pool de processus `turbopack-node` (loaders webpack, PostCSS) et la détection de version (`-p process.version`) ; `TURBO_PNPM_WORKSPACE_DIR` renommé `TURBO_WORKSPACE_DIR` ;
  - `.cargo/config.toml` : `rustc-wrapper = ""` (sccache 0.19 casse sous Windows, os error 206, mozilla/sccache#2397).
- Preuve : `bun scripts/aphrody/e2e.ts`, sans `node` dans le PATH, donne `postcss pool: bun-1.4.4, render: bun` ; `bun run build` passe 17/17 tâches turbo ; `next-swc` compilé depuis le fork (`bun run build-native`).
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

## État (2026-11-14)

- Construit et vérifié sur fr1 (`ssh vps`), commit `aphrody: tooling shebangs to bun, bench-db uses bun:sqlite` au-dessus de `4905a63ff6` : `bunify --check` à 0 fichier, `bun run build` 17/17 tâches (9 min 52), `build-native` compilé (profil dev, 6 min 11), `e2e.ts` sans `node` dans le PATH : `postcss pool: bun-1.4.4, render: bun`.
- Shebangs d'outillage (bench, evals, `.agents`, `scripts/wasi-test-host`) en `#!/usr/bin/env bun` ; `bench-db.mjs` utilise `bun:sqlite`. Les binaires livrés aux utilisateurs (`packages/next`, `create-next-app`, `next-codemod`) restent en `node`. Aucun usage `v8` trouvé dans l'outillage. Les 1516 spécificateurs de modules Node nus ne sont pas réécrits (coût de rebase).
- Profils Cargo : `release` en `lto = "thin"` et `release-xlto` hérité (LTO inter-langages via `scripts/aphrody/build-native-xlto.ts`).

## Sources consultées (2026-11-14)

- Cargo, profils et `lto = "thin"` : https://doc.rust-lang.org/cargo/reference/profiles.html ; LTO par l'éditeur de liens : https://doc.rust-lang.org/rustc/linker-plugin-lto.html
- Bun.WebView (expérimental, introduit en 1.3.12, Chrome via CDP sous Linux/Windows) : https://bun.com/docs/runtime/webview , https://bun.com/blog/bun-v1.3.12
- wasm-bindgen 0.2.130 (30 oct. 2026, dépôt `wasm-bindgen/wasm-bindgen`) : https://github.com/wasm-bindgen/wasm-bindgen/releases
- Non traité : conversion du parsing junit vers l'objet de forme jest du pilote WebView (`test/lib`), à valider par la CI.
