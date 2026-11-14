# Maintenance du fork aphrody-labs/better-auth

Même modèle que `docs/nextjs/FORK.md`.

## Modèle

- Branche `main` du fork = `upstream/main` + commits `aphrody:` linéaires (pas de merge). Remotes de `third_party/better-auth` : `origin` (aphrody-labs), `upstream`.
- Commit `dcb9f0843` : pnpm remplacé par Bun (`bun.lock` migré, `bunfig.toml`, workspaces/overrides/patchedDependencies dans `package.json`, scripts `pnpm`/`npx`/`node` vers `bun`/`bunx`, `bun run --filter`), réécritures `--fullbun` (rimraf, dotenv, glob, node-fetch quand la forme est entièrement comprise). Outillage d'origine non converti : vitest, biome, knip, turbo.
- Preuve (vps, Bun 1.4.4 canary) : `bun install` sans erreur ; build : bun run build passe (turbo).
- Sources : versions lues dans les `package.json` du fork et sorties `bun`/`gh api` de la session ; Context7 non consulté.

## Synchronisation

```sh
git -C third_party/better-auth fetch upstream
git -C third_party/better-auth rebase upstream/main      # conflits attendus : package.json, bun.lock
bunify third_party/better-auth --fullbun && bun install   # @aphrody/bunify (packages/bunify), idempotent
bunify third_party/better-auth --check --fullbun
git -C third_party/better-auth push --no-verify --force-with-lease origin main
bun scripts/upstream-scan.ts better-auth
```

Builds lourds sur vps (fr1), jamais sur le PC.
