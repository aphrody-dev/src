# Maintenance du fork aphrody-labs/tailwindcss

Même modèle que `docs/nextjs/FORK.md`.

## Modèle

- Branche `main` du fork = `upstream/main` + commits `aphrody:` linéaires (pas de merge). Remotes de `third_party/tailwindcss` : `origin` (aphrody-labs), `upstream`.
- Commit `1ad5572d` : pnpm remplacé par Bun (`bun.lock` migré, `bunfig.toml`, workspaces/overrides/patchedDependencies dans `package.json`, scripts `pnpm`/`npx`/`node` vers `bun`/`bunx`, `bun run --filter`), réécritures `--fullbun` (rimraf, dotenv, glob, node-fetch quand la forme est entièrement comprise). Outillage d'origine non converti : vitest, prettier, cargo, turbo.
- Preuve (vps, Bun 1.4.4 canary) : `bun install` sans erreur ; build : turbo build passe sauf @tailwindcss/standalone (demande bun install --os=* --cpu=* pour les binaires cross-plateforme) ; .cargo/config.toml avec rustc-wrapper vide ; cible rustup wasm32-wasip1-threads requise.
- Sources : versions lues dans les `package.json` du fork et sorties `bun`/`gh api` de la session ; Context7 non consulté.

## Synchronisation

```sh
git -C third_party/tailwindcss fetch upstream
git -C third_party/tailwindcss rebase upstream/main      # conflits attendus : package.json, bun.lock
bunify third_party/tailwindcss --fullbun && bun install   # @aphrody/bunify (packages/bunify), idempotent
bunify third_party/tailwindcss --check --fullbun
git -C third_party/tailwindcss push --no-verify --force-with-lease origin main
bun scripts/upstream-scan.ts tailwindcss
```

Builds lourds sur vps (fr1), jamais sur le PC.
