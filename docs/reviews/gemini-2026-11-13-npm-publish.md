# Revue Gemini : .github/workflows/npm-publish.yml (2026-11-13)

Moteur : relais gemini_review (antigravity). Note : **11/20**. Remarques vérifiées avant correction.

| # | Remarque | Statut |
|---|---|---|
| 1 | `NODE_AUTH_TOKEN` vide ou défini court-circuite l'OIDC | réfuté : npm/cli v12.2.2 `lib/utils/oidc.js` remplace le jeton après un échange réussi (`setOidcToken`), le jeton ne sert qu'en cas d'échec |
| 2 | `bun install` sans `--frozen-lockfile` | corrigé |
| 3 | actions par tag mobile, appel `@main` | TODO : épinglage SHA pour tous les workflows de src (même convention partout aujourd'hui) |
| 4 | npm de bun pas forcément devant celui de setup-node | `$GITHUB_PATH` préfixe ; assertion `npm --version = 12.2.2` ajoutée |
| 5 | chemins `PACKAGES` non validés | corrigé (absolu, `..`, `package.json` absent refusés) |
| 6 | `npm view` : toute erreur lue comme « non publié » | corrigé (seul E404 continue) |
| 7 | `basename` du tarball | conservé (`--quiet` rend le nom, dry-run vérifié) |
| 8 | `&&` sous `set -e` | corrigé (`if`) |
| 9 | dry-run ne prouve ni OIDC ni provenance | exact, documenté en tête du workflow et dans docs/infra/NPM.md |
| 11 | dist-tag non validé | corrigé (`^[a-z][a-z0-9._-]*$`) |
| 12 | permissions au niveau job | réfuté : l'appelant accorde `id-token: write` (fait dans rosegriffon/shenron) |
| 14 | environnement protégé, tests avant publish | TODO hors périmètre (l'approbation humaine contredit NHITL ; `npm stage` couvrira l'après janvier 2027) |
| 15 | `jq -r` laisse passer `null` | corrigé (`jq -er`) |
