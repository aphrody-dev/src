# shadcn-ui/ui (fork aphrody-labs/ui)

- Source : `third_party/shadcn-ui` (clone partiel `blob:none`, branche `main`, remotes `origin` = aphrody-labs, `upstream` = shadcn-ui/ui), entrée `shadcn` de `third_party/ECOSYSTEM.toml`.
- Rafraîchir : `gh repo sync aphrody-labs/ui -b main`, `git -C third_party/shadcn-ui pull`, puis `bun scripts/upstream-scan.ts shadcn --days 30`.

| Fichier | Source |
|---|---|
| `PRS.md`, `data/prs.json` | PR fusionnées sur main (30 j) et PR ouvertes, `gh pr list` |
| `COMMITS.md` | `git log` main sur 30 j |
| `RELEASES.md` | 60 dernières releases GitHub |
| `BLOG.md` | flux du projet quand il existe |
| `WORKSPACE.md` | paquets npm du dépôt |

Outillage d'origine converti : vitest, prettier, turbo. Voir `FORK.md`.
