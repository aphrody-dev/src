# Maintenance du fork aphrody-labs/ui

Même modèle que `docs/nextjs/FORK.md`.

## Modèle

- Branche `main` du fork = `upstream/main` + commits `aphrody:` linéaires (pas de merge). Remotes de `third_party/shadcn-ui` : `origin` (aphrody-labs), `upstream`.
- Commit `d35c84f9` : pnpm remplacé par Bun (`bun.lock` migré, `bunfig.toml`, workspaces/overrides/patchedDependencies dans `package.json`, scripts `pnpm`/`npx`/`node` vers `bun`/`bunx`, `bun run --filter`), réécritures `--fullbun` (rimraf, dotenv, glob, node-fetch quand la forme est entièrement comprise). Outillage d'origine non converti : vitest, prettier, turbo.
- Preuve (vps, Bun 1.4.4 canary) : `bun install` sans erreur ; build : bun run build passe (apps/v4 et @shadcn/react, 11m27 sur vps).
- Sources : versions lues dans les `package.json` du fork et sorties `bun`/`gh api` de la session ; Context7 non consulté.

## Synchronisation

```sh
git -C third_party/shadcn-ui fetch upstream
git -C third_party/shadcn-ui rebase upstream/main      # conflits attendus : package.json, bun.lock
bunify third_party/shadcn-ui --fullbun && bun install   # @aphrody/bunify (packages/bunify), idempotent
bunify third_party/shadcn-ui --check --fullbun
git -C third_party/shadcn-ui push --no-verify --force-with-lease origin main
bun scripts/upstream-scan.ts shadcn
```

Builds lourds sur vps (fr1), jamais sur le PC.
