# mui/base-ui (fork aphrody-labs/base-ui)

- Source : `third_party/base-ui` (clone partiel `blob:none`, branche `master`, remotes `origin` = aphrody-labs, `upstream` = mui/base-ui), entrée `base-ui` de `third_party/ECOSYSTEM.toml`.
- Rafraîchir : `gh repo sync aphrody-labs/base-ui -b master`, `git -C third_party/base-ui pull`, puis `bun scripts/upstream-scan.ts base-ui --days 30`.

| Fichier                   | Source                                                       |
| ------------------------- | ------------------------------------------------------------ |
| `PRS.md`, `data/prs.json` | PR fusionnées sur master (30 j) et PR ouvertes, `gh pr list` |
| `COMMITS.md`              | `git log` master sur 30 j                                    |
| `RELEASES.md`             | 60 dernières releases GitHub                                 |
| `BLOG.md`                 | flux du projet quand il existe                               |
| `WORKSPACE.md`            | paquets npm du dépôt                                         |

Outillage d'origine converti : vitest, eslint, prettier, stylelint, nx. Voir `FORK.md`.
