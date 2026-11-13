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
| prd | `cargo test --no-fail-fast` de rubash (Linux, rubash@ae43f3e5, 2026-11-13) : `just unixwin-test-prd` | 11 849 tests passés, 433 échoués ; 122 binaires de test sur 1 471 en échec, dont 2 tués après blocage (`executor_tests` boucle sur « true: command not found », `multi_session_isolation` plus de 10 min). Run sous root, sans TTY, charge prd > 200, ENOSPC transitoire sur /tmp ; la lib passe isolément (4 échecs EMFILE/pdeathsig résolus par `ulimit -n 65536`). Le tri entre défauts réels et effets d'environnement reste à faire, sur un hôte au repos |
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
