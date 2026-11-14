# Politique des forks aphrody-labs

Appliquee par `scripts/fork-pipeline.ts` (manifeste : tables `[sync.<nom>]` de `third_party/ECOSYSTEM.toml`, miroirs implicites : `third_party/forks.txt`). Etat : [STATUS.md](STATUS.md).

## Forks

- Branche par defaut = amont + pile lineaire de patchs `aphrody:`. Jamais de commit de fusion.
- Miroir (`kind = "mirror"`) : fast-forward seul (`gh repo sync`). Un miroir qui a des commits propres est signale `diverged`, jamais force.
- Patche (`kind = "patched"`) : les commits amont absents du fork (`git cherry`, patch-id) sont rejoues sur la branche du fork dans un clone de travail, les commandes `verify` du manifeste passent, puis branche courte `sync/<sha-amont-12>` + PR sur le fork, `gh pr merge --auto --rebase --delete-branch`, check requis = CI du fork. Pas de force-push de la branche par defaut (la reecriture complete par rebase reste le rituel manuel de `docs/nextjs/FORK.md`).
- Reglages des depots : fusion automatique et suppression des branches de tete activees via `gh api -X PATCH` (`allow_auto_merge`, `delete_branch_on_merge`). Sans protection de branche, la PR est fusionnee par la passe suivante quand ses checks sont termines et verts (ou absents).
- PR de bot depassees par un sha amont plus recent : fermees (`Superseded`), branche supprimee.

## Consommateurs (src, apps/shenron, apps/rosegriffon)

- Les pins du fork (Cargo.toml `rev`, package.json `#sha`, `src.lock.json`, `ECOSYSTEM.toml`) sont releves par PR `deps/<fork>-<sha7>` avec fusion automatique si la CI est verte : un bump casse n atteint pas la branche principale. La porte du consommateur (`gate`) tourne avant la PR. Le travail interactif des agents continue de committer sur main. Exception : `docs/forks/STATUS.md` (genere) est commite directement sur main de src.

## Issues

- Une issue ouverte par (depot, fork, nature) : titre `[sync] <fork>: <nature>`, label `upstream-sync` (forks) ou `deps-bump` (consommateurs), commentee a chaque recidive, fermee automatiquement quand la passe suivante reussit. Natures : `fetch`, `conflict`, `verify`, `ci`, `push`, `pr`, `bump`, `browser`.

## Hotes

fr1 execute le pipeline (`aphrody-heavy`, nice 19, timer 15 min). `--shard i/n` repartit les forks par hash du depot si un second hote est autorise ; usa/prd et fr2 ne sont pas utilises (roles de flotte : prd = production propre, fr2 = bord minimal).
