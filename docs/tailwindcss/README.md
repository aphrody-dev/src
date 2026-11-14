# tailwindlabs/tailwindcss (fork aphrody-labs/tailwindcss)

- Source : `third_party/tailwindcss` (clone partiel `blob:none`, branche `main`, remotes `origin` = aphrody-labs, `upstream` = tailwindlabs/tailwindcss), entrée `tailwindcss` de `third_party/ECOSYSTEM.toml`.
- Rafraîchir : `gh repo sync aphrody-labs/tailwindcss -b main`, `git -C third_party/tailwindcss pull`, puis `bun packages/upstream/src/upstream-scan.ts tailwindcss --days 30`.

| Fichier | Source |
|---|---|
| `PRS.md`, `data/prs.json` | PR fusionnées sur main (30 j) et PR ouvertes, `gh pr list` |
| `COMMITS.md` | `git log` main sur 30 j |
| `RELEASES.md` | 60 dernières releases GitHub |
| `BLOG.md` | flux du projet quand il existe |
| `WORKSPACE.md` | paquets npm du dépôt |

Outillage d'origine converti : vitest, prettier, cargo, turbo. Voir `FORK.md`.
