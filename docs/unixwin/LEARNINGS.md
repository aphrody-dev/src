# unixwin : apprentissages de la suite de bout en bout (2026-11-13)

Suite : `apps/unixwin/tests` (`bun test ./apps/unixwin/tests` ou `just unixwin-test`). Elle lance les vrais
binaires du poste par `Bun.spawn` (octets bruts, stdin depuis `Response`, `timeout`, `windowsHide`) et par Bun
Shell (`$` avec interpolation échappée, `.env()`, `.text()`), d'après `third_party/bun/docs/runtime/shell.mdx`,
`third_party/bun/docs/runtime/child-process.mdx` et https://bun.com/llms.txt (vérifié en 200 le 2026-11-13).
Oracles : GNU bash 5.3.15 de Git for Windows (`--norc --noprofile`) et uutils coreutils 0.12.0 (multicall
`coreutils.exe`). Environnement identique pour les deux côtés : `LC_ALL=C.UTF-8`, pas de `BASH_ENV`/`NIU_ENV`,
pas de repli.

| Fichier | Couverture | Résultat |
|---|---|---|
| `niubash.test.ts` | lancement (`--version`, Bun Shell, pipeline Bun -> niu -> Bun, 256 octets par stdin, pas de CR), 62 scripts en parité octet pour octet + code de sortie avec GNU bash : codes de sortie, `set -e`, `pipefail`, `PIPESTATUS`, redirections (fd 3, here-string, heredocs, noclobber), pipelines, expansions, tableaux, `getopts`, `trap`, `mapfile`, UTF-8, persona MSYS (`pwd -W`, `cygpath`), glob avec préfixe Windows | 65/65 avec le niu de la chaîne des forks (2 échecs avec niubash 1.5.0 amont + repli) |
| `paths.test.ts` | dialectes `/c/`, `/mnt/c/`, `/cygdrive/c/`, `C:\`, `C:/` ; argv d'un enfant natif (bun) ; données non-chemin intactes ; `/dev/null`, `/tmp`, persona ; repli `/src` (`NIU_ROOT_FALLBACK` : sans, avec, `0`, membres réservés) ; noms UTF-8 et CRLF | 16/16 |
| `winuxcmd.test.ts` | inventaire (`--list-all`), 36 applets en parité avec uutils, `rev` et `expr` contre la valeur GNU, applets appelés depuis niubash | 42/42 |
| prd | `cargo test --no-fail-fast` complet (rubash@ae43f3e5) : 11 849 passés, 433 échoués, sous charge > 200 | remplacé : plus de suite complète sur prd ; cibles ponctuelles seulement (`infra/unixwin`, flock `aphrody-heavy`) |
| CI aphrody-labs/rubash, workflow `aphrody tests` | 10 parts ubuntu-latest : lib et `cargo` (cargo test, série), `pins-0..5` (tests/issue*.rs moins les exclusions amont, nextest profil `aphrody` : arrêt à 2 min, 2 relances), `other` (cli_tests, marker_leak_golden), `legacy` (reste, non bloquant comme en amont) | run 2fb9bc21 en cours à la clôture ; run précédent 673fd6e2 : lib, pins-0/1/2/3/5, other verts ; `cargo` rouge sur un golden corrigé ensuite ; pins-4 dépasse 20 min (cible lente non identifiée) ; `.config/aphrody-known-red.txt` : 3 défauts réels exclus |
| CI du fork | `cargo test --lib` de rubash sous Windows (`builtins::pwd`, `executor::path::`, `executor::glob::`), build croisé `cross-xwin` | run 43348343134 (niubash@1acf7953, rubash@ae43f3e5) : 3 jobs verts |

Total : 124/124 avec `niu.exe` installé par `just unixwin-install ci` (sha256 39650627…, rubash 19b784a41b50) ; le binaire construit sur prd par cargo xwin passe aussi la suite (121/121 au premier tour).

## Défauts trouvés et corrigés dans les forks

| # | Défaut | Preuve | Correctif (branche par défaut du fork) | Test |
|---|---|---|---|---|
| 1 | `pwd -W` (forme Windows de l'MSYS de Git for Windows) refusé : « pwd: -W: invalid option » | parité `msys-pwd-W` | `aphrody-labs/rubash@4e4782ef` : `-W` accepté sous Windows, sortie `C:/dir` (préfixe `\\?\` retiré) ; la ligne d'usage GNU `[-LP]` est gardée pour la parité du corpus d'aide | unitaire `msys_w_option_prints_windows_form_of_physical_cwd` (Windows) et `w_option_is_invalid_outside_windows` (Unix) ; e2e `msys-pwd-W` |
| 2 | glob littéral quand le préfixe vient d'une variable Windows : `echo "$LOCALAPPDATA"/Programs/Niubash/*.exe` ou `"$SYSTEMROOT"/win*.ini` ne se développaient pas (Git Bash les développe) | parité `glob-backslash-prefix`, `glob-env-prefix` | `aphrody-labs/rubash@ae43f3e5` : sous Windows, dans la partie répertoire du motif, une barre oblique inverse brute (le lexer a déjà résolu les échappements non cités) est un séparateur ; seule une barre devant `*?[]` échappe encore ; les paires UNC restent intactes | unitaire `windows_backslash_directory_prefix_globs` ; e2e des deux cas |
| 3 | build croisé Linux -> Windows impossible : `build.rs` cherchait seulement `rc.exe`/`llvm-rc.exe` (panique dans `embed_windows_icon`) | `just unixwin-build` sur prd | `aphrody-labs/niubash@4e562259` : `$RC`, puis `llvm-rc` sans extension (accepte `/nologo /fo`) | job CI `cross-xwin` (ubuntu -> x86_64-pc-windows-msvc, vert au premier passage) ; build prd |
| 5 | noms Windows : `$SYSTEMROOT`, `$WINDIR`, `$COMSPEC` vides (niubash gardait `SystemRoot`, `windir`, `ComSpec` ; Git for Windows les expose en majuscules, pas `ProgramData` ni `OneDrive`) | parité `win-env-upper` | `aphrody-labs/rubash@19b784a4` : à l'import, alias majuscule pour COMMONPROGRAMFILES, COMSPEC, PROGRAMFILES, SYSTEMDRIVE, SYSTEMROOT, WINDIR (le nom d'origine reste lié ; une entrée majuscule explicite gagne) | unitaire `upper_case_aliases_follow_git_for_windows` (CI Windows, run 43351709401 vert) ; e2e `win-env-upper` |
| 4 | YAML du workflow invalide : `run: cargo test -- a::b c::` contient « `: ` » | run sans job, « workflow file issue » | `aphrody-labs/niubash@1acf7953` : ligne entre guillemets | `Bun.YAML.parse` du fichier avant chaque push |

## Tri de la suite rubash en CI (2026-11-13)

Environnement (pas des défauts du moteur) : TMPDIR sous `$HOME` (`dirs` abrège en `~`), locale UTF-8 (guillemets courbes de coreutils), `/usr/bin/time` présent sur ubuntu-latest, `compgen -f` dans l'ordre de readdir, test de minutage du contrôle de jobs (issue2340, relancé).

Défauts réels corrigés dans `aphrody-labs/rubash` :
- `f27458c4` : les tests cherchaient `target/<profil>/rubash` via `deps/` seulement ; le cargo récent range les exécutables de test dans `build/<pkg>/<hash>/out/` (issue2875 relançait le binaire de test, 2043/2046 : ENOENT), test unitaire de la disposition ajouté ;
- `6099b634` : `LC_ALL=C` épinglé dans les tests qui comparent les diagnostics GNU ;
- `15cf1d12` : attentes alignées sur GNU bash 5.3.15 (`dirs -l -v` en chemins complets, `coproc NOM` seulement devant une commande composée, `time -p` en mode posix suit le `time` externe de l'hôte) ;
- `2fb9bc21` : golden `eco-completion-register` trié.

Restent rouges (`.config/aphrody-known-red.txt`) : `golden_issue2908_ruby_build_exec` (installation interrompue après le téléchargement), `golden_nvm_load` (5,1 s contre 1,5 s de budget), `issue1584_named_coproc_pid_is_the_program` (`exec` dans un coproc composé ne fait pas un vrai execve).

## Divergence assumée

- Après le correctif 2, `d='C:\Windows'; echo $d/win*.ini` (expansion **non citée**) donne `C:\Windows/win.ini` sous niubash. GNU et Git Bash retirent la barre (`C:Windows`), ne trouvent rien et laissent le mot littéral. Sous Windows, un séparateur `\\` issu d'une variable est plus utile qu'un échappement. Relevé par la revue Gemini du 2026-11-13 (`docs/reviews/gemini-2026-11-13-unixwin.md`).

## Écarts constatés hors unixwin (contournements)

- **uutils `coreutils.exe` (multicall) re-développe `*` dans argv sous Windows** : `coreutils expr 6 '*' 7`
  échoue (« unexpected argument '.agents' »). Les binaires séparés de `C:\Program Files\coreutils\bin` ne le
  font pas, WinuxCmd non plus. Contournement : ne pas appeler le multicall avec des opérandes `*` ; la matrice
  compare `expr` à la valeur GNU.
- uutils n'a pas `rev` (`coreutils: unknown program 'rev'`) ; WinuxCmd l'a.
- `awk` n'est pas un applet de `winuxcmd.exe` : `awk.exe`/`gawk.exe` de `usr/bin` sont un paquet séparé.
- `$PWD` reste logique après un repli (`cd /src` donne `PWD=/src`, `pwd -P` donne `/c/src`), comme pour
  `/mnt/c/...` : c'est le comportement voulu, pas un défaut.
- Sous la session interactive de src, `env.toml` met Microsoft Coreutils devant WinuxCmd ; `niu -c` sans rc
  garde WinuxCmd en tête. Les tests figent l'environnement pour ne pas dépendre de l'ordre du PATH.
- `ay lock --lock-only` (ay installé) réécrit tout `src.lock.json` dans un ancien format à chemins absolus ;
  les pins unixwin passent par `bun scripts/unixwin/unixwin.ts lock`.
- La CI de `aphrody-labs/rubash` ne se déclenche pas sur push (workflows hérités du fork sans run). Les tests
  Windows de rubash passent donc par le workflow `aphrody build` de niubash, et les tests Linux par prd.
- `NIU_ROOT_FALLBACK` est opt-in : sans lui, `cd /src` échoue (blocked), ce que la suite vérifie.
