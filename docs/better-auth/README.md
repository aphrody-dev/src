# better-auth/better-auth (fork aphrody-labs/better-auth)

- Source : `third_party/better-auth` (clone partiel `blob:none`, branche `main`, remotes `origin` = aphrody-labs, `upstream` = better-auth/better-auth), entrée `better-auth` de `third_party/ECOSYSTEM.toml`.
- Rafraîchir : `gh repo sync aphrody-labs/better-auth -b main`, `git -C third_party/better-auth pull`, puis `bun scripts/upstream-scan.ts better-auth --days 30`.

| Fichier | Source |
|---|---|
| `PRS.md`, `data/prs.json` | PR fusionnées sur main (30 j) et PR ouvertes, `gh pr list` |
| `COMMITS.md` | `git log` main sur 30 j |
| `RELEASES.md` | 60 dernières releases GitHub |
| `BLOG.md` | flux du projet quand il existe |
| `WORKSPACE.md` | paquets npm du dépôt |

Outillage d'origine converti : vitest, biome, knip, turbo. Voir `FORK.md`.
