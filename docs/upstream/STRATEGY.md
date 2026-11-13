# Forks bun et Chromium : rester compatibles avec l'amont

Date : 2026-11-13. Commande : `ay upstream` (`packages/upstream`, lancé par bun). Configuration : `infra/upstream/stacks.toml`. Statuts : `infra/upstream/status/<pile>.toml`.

## 1. Modèle retenu, d'après les forks qui durent

| Projet | Mécanisme relevé (source lue le 2026-11-13) | Ce qu'on en garde |
|---|---|---|
| Electron | `patches/config.json` (dossier de patchs -> dépôt), un `.patch` par commit, ordre dans `.patches` ; `git-import-patches` (`git am`) et `git-export-patches` (`format-patch --keep-subject --no-stat --no-signature --zero-commit --full-index`) ; chaque patch justifie sa raison : temporaire (lien vers la revue amont), compilation, ou fonctionnel incompatible (`electron/electron` `docs/development/patches.md`, `script/lib/git.py` au 2026-10-15) | modèle « série » pour Chromium ; mêmes options d'export (`ay upstream export`) ; noms de fichiers par la même règle (`munge_subject_to_filename`) |
| ungoogled-chromium | `patches/series` (quilt), dossier `upstream-fixes/` pour les correctifs destinés à l'amont, `devutils/validate_patches.py` contre l'arbre réel | vérification d'application sur l'amont à chaque passage, séparation explicite de ce qui va en amont |
| Brave | un `.patch` par fichier modifié de Chromium, `npm run update_patches`, `build/commands/lib/applyPatches.js` | écarté : un patch par fichier ne correspond pas à une PR, or l'unité ici est la PR |
| Yocto | trailer `Upstream-Status: Pending | Submitted [où] | Backport [où] | Denied | Inappropriate [raison]` (docs.yoctoproject.org, contributor guide, Patch Upstream Status) | vocabulaire des statuts, tel quel |

Deux modèles, un par forge :

- **bun, modèle « branche »** : la branche par défaut du fork (`aphrody-labs/bun` `main`) = `oven-sh/bun` `main` (le canal canary) + une série linéaire de commits, un commit = un patch = une PR potentielle. Plusieurs agents poussent sur cette branche ; la pile reste lisible par `git log upstream/main..origin/main`.
- **Chromium, modèle « série »** : fichiers `.patch` dans `infra/upstream/chromium/patches/` (ordre `.patches`), appliqués sur la pointe de `chromium/src` `main` dans un index temporaire (rien n'est écrit dans le checkout). Le fork GitHub `aphrody-labs/chromium` reste un miroir avancé en avance rapide (API « merge-upstream ») : les contributions passent par Gerrit, pas par GitHub.

## 2. Statuts

| Statut (`Upstream-Status`) | Sens | Action automatique |
|---|---|---|
| `Pending` | à proposer | `ay upstream check` puis `ay upstream pr` |
| `Submitted [url]` + `Upstream-PR` | proposé (PR ou CL) | état lu en direct (gh api, REST Gerrit) |
| `Backport [url]` | présent en amont | retiré au prochain `sync` |
| `Denied [raison]` | refusé | à retravailler ou à passer en `Inappropriate` |
| `Inappropriate [raison]` | propre à Aphrody | gardé ; `check` refuse d'en faire une PR |

Le statut s'écrit dans `infra/upstream/status/<pile>.toml` (clé = nom du patch), par `ay upstream mark`. Il peut aussi vivre dans le message du commit (`--trailer`), mais réécrire la branche partagée pour un statut fait rebaser tous les agents : le registre est la voie par défaut. Une PR fusionnée est détectée en direct ; un patch devenu vide sur la nouvelle base (changement déjà en amont) est retiré, comme un patch au statut `Backport`.

## 3. Commandes

```sh
ay upstream status [bun|bunx|chromium] [--json|--markdown] [--no-fetch]
ay upstream sync bun,bunx --push        # rejoue la pile sur l'amont ; code 3 au premier conflit, fork inchangé
ay upstream check bun [patch]           # règles de contribution de l'amont
ay upstream pr bun <patch> --lint       # tête éphémère up/<nom> = amont + ce patch seul, CI amont dessus
ay upstream pr bun <patch> --open       # ouvre la PR (refusé si check échoue ou si une PR existe déjà)
ay upstream mark bun <patch> submitted <url> --pr <url> --owner <porteur>
ay upstream gc bun                      # supprime les têtes up/* et pr/* dont la PR est fusionnée ou fermée
ay upstream export bun <dossier>        # .patch + .patches au format d'Electron
```

La pile est reconstruite par plomberie (`git merge-tree --write-tree --merge-base`, `git commit-tree`, `update-ref`, `push --force-with-lease`) : aucune extraction, aucun worktree, aucune branche locale. Le bail (`--force-with-lease`) fait échouer le push si un agent a poussé entre-temps ; le passage suivant reprend. Après un `sync`, un agent qui travaille dans un clone fait `git pull --rebase` : git écarte ses commits déjà présents (même patch-id).

`ay bun watch` (veille de l'amont : commits, PR, issues, versions) reste distinct : il dit ce que fait l'amont, `ay upstream` garde nos patchs dessus.

## 4. Exception aux branches

Règle du propriétaire : aucune branche dans nos dépôts, tout sur la branche par défaut. GitHub exige une branche de tête pour ouvrir une PR depuis un fork. Exception, limitée à cela :

- refs `up/<nom>` (celles d'`ay upstream pr`) et `pr/<nom>` (poussées à la main par d'autres agents) sur le fork seulement, jamais dans `src` ;
- chacune est générée depuis un patch de la pile, = `amont` + ce seul patch (message sans nos trailers) ;
- `ay upstream gc` (lancé après chaque `sync`) la supprime dès que la PR est fusionnée ou fermée.

Côté Chromium, `git cl upload` demande une branche locale avec un amont : branche locale éphémère `up-<nom>` dans le checkout de fr1, jamais poussée vers un fork, supprimée après fusion ou abandon.

## 5. CI et calendrier

| Quoi | Où | Quand | Charge |
|---|---|---|---|
| `sync bun,bunx --push` puis `gc bun` | prd, utilisateur `agent`, `~/agents/src` (`infra/upstream/install.sh`, unité `aphrody-upstream.timer`) | chaque jour 05:30 UTC (+ 0 à 20 min) | git seul, `Nice=19`, E/S idle |
| `sync chromium --push` (vérification de la série + miroir GitHub) | fr1, utilisateur `ubuntu`, checkout `/srv/chromium/src` | même timer | fetch + index temporaire |
| build et tests du sous-ensemble Chromium | fr1, `infra/upstream/chromium-verify.sh`, checkout dédié `/srv/chromium/upstream` (jamais celui de l'usine) | après chaque changement de la série ; ne fait rien tant qu'elle est vide | `nice -n 19 ionice -c3`, pool NativeLink ; cibles = exécutables de test qui dépendent des fichiers touchés (`gn refs --testonly`), au plus 8, puis `git cl presubmit` |
| CI amont de bun sur la tête éphémère | GitHub Actions du fork : `format.yml`, `lint.yml`, `rust-lints.yml`, `source-lints.yml` d'oven-sh/bun, activés sur `aphrody-labs/bun` le 2026-11-13 et lancés par `ay upstream pr --lint` | avant chaque PR | runners GitHub |
| build et tests complets de bun | Buildkite d'oven-sh une fois la PR ouverte ; côté fork, les workflows `native` et `aphrody windows` (agents build natif et bun Windows) | à la PR | — |
| tests d'`ay upstream` | `.github/workflows/ci.yml` (`bun test packages/upstream`) | chaque push sur `src` | — |

Rien ne compile sur le poste.

## 6. Règles de contribution vérifiées par `check`

- **bun** (`oven-sh/bun` `9ea3c693a2`) : pas de CLA ni de DCO. Gabarit de PR : « What does this PR do? », « How did you verify your code works? » (`.github/pull_request_template.md`) ; le corps est tiré du message, le paragraphe `Tested:` remplit la seconde section. `on-slop.yml` ferme les PR qui ne vérifient pas que le problème existe ou ne testent pas le correctif : `check` exige un paragraphe `Tested:` et un test sous `test/` dès que `src/` change. Format et lints : les workflows de l'amont, lancés sur la tête.
- **Chromium** (`docs/contributing.md`, `agents/ai_policy.md` au 2026-11-11) : CLA individuel Google, entrée dans `AUTHORS` dans la première CL (aucune entrée `aphrody.com` aujourd'hui), description à 72 colonnes, pied `Bug:` ou `Fixed:`, `git cl format`, `git cl presubmit`, `git cl upload` vers chromium-review.googlesource.com. La politique IA impose que l'humain derrière le compte relise, comprenne et réponde lui-même aux relecteurs ; elle recommande de signaler les parties écrites avec un outil IA.
- **commun** (`AGENTS.md`) : pas d'emoji, pas d'attribution IA, pas de secret, sujet de 72 caractères au plus.

Conflit à trancher par le propriétaire : `AGENTS.md` interdit toute attribution IA dans les PR, `agents/ai_policy.md` de Chromium demande de signaler les zones produites avec un outil IA et exige un relecteur humain qui répond. Pour Chromium, la règle de l'amont s'applique : le propriétaire relit chaque CL, l'envoie lui-même et répond aux relecteurs.

## 7. État des piles (2026-11-13 03:30 UTC, `ay upstream status --markdown`)

bun : `aphrody-labs/bun` = `oven-sh/bun` `9ea3c693a2` (« Bump to 1.4.5 ») + 15 patchs.

| # | Patch | Statut | Revue | Porteur |
|---|---|---|---|---|
| 1 | child_process: expose the parent-end pipe fd through stream._handle | proposé (portage) | oven-sh/bun#39760 (robobun), ouverte | amont |
| 2 | build: pass the .bind.ts schema list to the codegen scripts in a file | proposé | voir section 8 | upstream |
| 3 | docs: minifier page frontmatter uses title like every other page | propre à Aphrody, à retirer : la page publiée a déjà son titre | - | - |
| 4, 5, 15 | ci: native release build ; ci(native): sysroot ; ci(native): dispatch only | propre à Aphrody (CI du fork) | - | build natif |
| 6 | upgrade: unpack the Windows release in-process and check canary downloads against the API digest | à proposer | - | bun Windows |
| 7 | completions: print the script for bash, zsh and fish on Windows (Fixes #25042) | à proposer | - | bun Windows |
| 8 | sys(windows): report ENOENT for an empty path | proposé (portage) | oven-sh/bun#38052, ouverte | amont |
| 9 | node:fs: resolve a relative path that normalizes to nothing to the cwd on Windows | proposé (portage) | oven-sh/bun#45410, ouverte | amont |
| 10 | import.meta.main: compare the main module's key as a URL in every executable | proposé (portage) | oven-sh/bun#48698, ouverte | amont |
| 11 | shell: skip a dead bin link for the script words bun, bunx and node (Windows) | proposé (portage) | oven-sh/bun#45742, ouverte | amont |
| 12 | ci(aphrody): cross-compile bun.exe for Windows x64 and run the fork's Windows regression tests | propre à Aphrody | - | bun Windows |
| 13 | build: xwin 0.10.0, which reads the current Visual Studio manifest | proposé | oven-sh/bun#48784, ouverte | bun Windows |
| 14 | docs: sizes Bun.gzipSync and Bun.deflateSync give for the utils examples | proposé | oven-sh/bun#48786, ouverte | audit bun |

bunx : `bunx-sh/bun` n'existe pas encore (`gh api repos/bunx-sh/bun` -> 404) ; la pile est déclarée `optional` et entre dans le timer de prd dès sa création.

Chromium : série vide ; `aphrody-labs/chromium` `main` était à 908 commits de retard, avancé en avance rapide le 2026-11-13 (0/0 depuis).

## 8. Correctifs proposés par cette pile

**bun, liste des schémas `.bind.ts` dans un fichier.** Sur un hôte Windows, les règles codegen de `scripts/build/codegen.ts` passent par `cmd /c`, limité à 8191 caractères (Microsoft Learn, « Command prompt (Cmd.exe) command-line string limitation » ; mesuré ici : 8 100 acceptés, 8 200 refusés, « La ligne de commande est trop longue. »). `bun scripts/build.ts --configure-only --profile=release` sous Windows 11 build 28120, checkout `C:\src\third_party\bun`, 150 schémas : commandes développées de l'arête bindgen et de la table des built-ins = 11 602 et 11 537 caractères sur `main` de l'amont ; 8 152 et 8 087 avec l'ancien patch du fork (chemins relatifs, marge de 39 caractères) ; 686 et 621 avec la liste dans un fichier (`--sources=@<fichier>`, lu par `argParse`), quel que soit le nombre de schémas. Nouveau test dans `test/internal/build-codegen-declared-outputs.test.ts`. Le patch relatif du fork a été remplacé par celui-ci, à la même place.

Écartés (pas de PR) : le patch docs du minifier (aucun effet visible) ; aucune CL Chromium tant qu'aucun défaut n'est reproduit et mesuré sur la pointe.

## 9. Conflit pendant `sync`

`sync` s'arrête au premier patch qui ne s'applique plus, écrit `var/upstream/<pile>/last-sync.json` (patch, fichiers en conflit, nombre de patchs rejoués) et laisse le fork tel quel ; l'unité systemd passe en échec. Résolution, par le porteur du patch : rejouer le patch à la main sur `upstream/main` dans un clone, le pousser à sa place sur la branche par défaut, ou le retirer si l'amont a résolu le problème autrement ; puis `ay upstream sync <pile> --push`.

## 10. Communication

Brouillons dans `var/agents/outbox/upstream-2026-11-13/` (billet, post X, page wiki, page du site). `.agents/owner-rules.json` n'existe pas : rien n'est publié sur X, le blog ou le site. Les messages de PR et d'issue accompagnent la contribution et partent avec elle.
