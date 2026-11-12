# Fusion des checkouts bun (2026-11-12)

Fork canonique : **aphrody-labs/bun**, branche **`aphrody/main`** (fork de oven-sh/bun, existait déjà, `main` à jour). Upstream de référence : oven-sh/bun main `ccb3611f2a` (2026-11-12).

## Inventaire

Recherche faite : `fd -H -I -t d '^bun'` sur C:\src et C:\labs (profondeur 4), puis tous les `.git/config` contenant `bun.git`/`oven-sh`, puis les dépôts GitHub des orgs. Le seul checkout git de bun trouvé est `C:\src\third_party\bun`. Les autres dossiers `bun*` sont des paquets, des `node_modules` ou des skills, pas des clones. `C:\src\var\backups\nested-git\chromium-bun.git` n'est pas un fork de bun.

| Dépôt | Avant | Après |
|---|---|---|
| `C:\src\third_party\bun` (partial clone `blob:none`, 1,2 Go, git-ignoré par src) | origin=aphrody-dev/bun, upstream=oven-sh/bun ; branche `feat/linux-kernel-7.4` `3d03a0a9e0` ; `main`=`89452d2ac1` (0 en avance, 5 en retard sur upstream) ; 2 modifs non commitées (`docs/design/web-vitals-lighthouse.mdx` M, `docs/sovereign/` ??) | origin=**aphrody-labs/bun** ; branche `aphrody/main` `4b8463ee11` (3 en avance, 0 en retard) ; `main`=upstream `ccb3611f2a` ; arbre propre |
| GitHub aphrody-labs/bun (fork) | `main` : 0 en avance, 1 en retard | `main` synchronisé (0/0) ; + `aphrody/main`, `feat/linux-kernel-7.4`, `wip/feat-linux-kernel-7.4-uncommitted-2026-11-12` |
| GitHub aphrody-dev/bun (fork) | `main` 5 en retard ; ~15 900 branches miroir d'upstream ; seule branche à nous : `feat/linux-kernel-7.4` | `main` synchronisé (0/0) ; inchangé sinon |
| aphrody-labs/google-bun, aphrody-dev/chromium-bun | pas des forks de bun (dépôts propres, ~100 Ko) | hors périmètre |

## Patchs

| Commit (avant → sur aphrody/main) | Sujet | Décision |
|---|---|---|
| `5e4a86397a` → `75fab05e8c` | feat(kernel): intégration accélérateur noyau Linux 7.4-rc2 en Rust | gardé (absent d'upstream) |
| `81831b992c` → `2842a5cd84` | docs(design): suite mdx du design system sovereign | gardé |
| `3d03a0a9e0` → `4b8463ee11` | docs: corrections frontmatter/navigation | gardé |
| non commité | `docs/sovereign/index.mdx`, une ligne dans `web-vitals-lighthouse.mdx` | sauvegardé dans le commit de la branche `wip/feat-linux-kernel-7.4-uncommitted-2026-11-12` (poussée), pas intégré à aphrody/main |
| branches `claude/*`, `robobun/*` présentes seulement sur aphrody-dev/bun | auteurs Jarred Sumner / robobun / Claude (oven), supprimées en amont | écartées : pas les nôtres |

Conflits : aucun (cherry-pick propre sur `upstream/main`). Aucun patch n'était déjà upstream. Rien n'a été compilé.

## Proposition (rien n'a été supprimé)

- **aphrody-dev/bun** est redondant avec aphrody-labs/bun (1,58 Go côté GitHub, ~15 900 branches miroir). À archiver ou supprimer après vérification que plus rien ne pousse dessus.
- `C:\src\third_party\bun` (1,2 Go) reste l'unique checkout local et pointe maintenant sur le canonique. Rien à supprimer.
- Le remote local `upstream` (oven-sh) est gardé pour les prochains rebase : `git fetch upstream && git rebase upstream/main aphrody/main && git push -f origin aphrody/main`.
