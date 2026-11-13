# Plan d'exécution : brush pour Claude Code (2026-11-12)

## 1. Écarts à combler pour Claude Code

| Domaine  | Construction / besoin                           | État brush                               | Action                                                              |
| -------- | ----------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| Snapshot | `alias x='...'` avec quotes                     | #1086 ouverte [V]                        | patch parser alias, PR upstream                                     |
| Snapshot | alias imbriqués                                 | #1397 [V selon rust-bash-reimpl.md]      | idem                                                                |
| Snapshot | `declare -f` / `eval` de fonctions avec heredoc | #1580 ouverte [V] : réindente            | conserver texte source de la fonction, PR                           |
| Snapshot | `shopt -s extglob globstar`                     | `globstar` sans récursion #1581          | implémenter `**`                                                    |
| Snapshot | `export -p`, `set -o`, `unalias -a`             | à tester [NV]                            | test de replay                                                      |
| Process  | pipes > 4096 octets                             | #1359 ouverte [V] : blocage              | pipes asynchrones / thread par canal                                |
| Process  | PATHEXT                                         | #1317 ouverte [V] : lance sans extension | lancer le chemin résolu                                             |
| Process  | quoting argv vers .exe                          | #1295 (PR)                               | règles `CommandLineToArgvW`, refus des `.bat` dangereux (BatBadBut) |
| Process  | `cd` puis chemin relatif                        | #1251                                    | résoudre contre le cwd du shell                                     |
| Process  | `<(...)`                                        | #1662, #1294                             | finir la PR                                                         |
| Chemins  | `/c/x`, `C:/x`, `C:\x`, `/dev/null`, `/tmp`     | partiel [NV]                             | couche de traduction + `cygpath.exe` Rust (multicall)               |
| Jobs     | kill d'arbre au timeout                         | NV                                       | job object `KILL_ON_JOB_CLOSE` par pipeline                         |
| Signaux  | Ctrl+C → exit 130                               | NV                                       | handler console + `CREATE_NEW_PROCESS_GROUP` pour les jobs de fond  |
| Traps    | trap EXIT en sous-shell, `trap -p`              | #1540, #1268                             | patch                                                               |
| Builtins | `select`, `wait -n`, `disown`                   | manquants (README)                       | basse priorité                                                      |

## 2. Snapshot sous la limite (~70927 octets, observé, non documenté [NV])

- Garder `~/.bashrc` minimal pour le mode non interactif : `[[ $- != *i* ]] && return` avant starship/atuin/carapace.
- Pas de `source <(carapace _carapace)` global : complétions chargées à la demande (`complete -D` / lazy).
- Fonctions longues → scripts dans `~/.local/bin` (hors snapshot).
- CI : générer le snapshot comme Claude (`declare -f; alias; shopt -p; export -p`) et échouer au-delà de 60 000 octets.

## 3. Installation reproductible

| Étape         | Commande / règle                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Toolchain     | nightly épinglée (`rust-toolchain.toml` du fork)                                                                                                                                       |
| brush         | `cargo install --locked --git https://github.com/aphrody-labs/brush --rev <sha> brush-shell`                                                                                           |
| userland Rust | `cargo binstall --locked` versions pinnées : coreutils 0.12.0, findutils 0.11.0, sed 0.3.0, ripgrep 15.2.0, fd 10.5.2, sd 1.1.0, jaq 3.1.2, xh 0.26.3 (versions issues de userland.md) |
| autres        | `gh release download <tag> -p '*windows*'` + vérif `b3sum` dans `tools/shell.lock`                                                                                                     |
| awk / grep    | goawk v1.32.0 ; `rg` + `busybox grep` (busybox-w32 frippery.org, hash pinné)                                                                                                           |
| multicall     | hardlinks NTFS `coreutils.exe` → `ls.exe`, `cat.exe`… dans `~/.local/share/brush/bin`, régénérés par `just shell-links`                                                                |
| bash.exe      | hardlink `~/.local/share/brush/bash.exe` → `brush.exe` (+ `sh.exe`)                                                                                                                    |
| Claude        | `CLAUDE_CODE_GIT_BASH_PATH=C:\Users\aphro\.local\share\brush\bash.exe` dans `settings.json` `env` ; vérifier `claude --debug`                                                          |

## 4. Plan de test

| Suite                           | Contenu                                                                                   | Oracle                                            |
| ------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------- |
| brush compat (>2 500 cas, YAML) | portée sous Windows, cas Unix-only marqués                                                | résultats bash Linux enregistrés                  |
| Oils spec tests                 | sous-ensemble bash                                                                        | sorties bash enregistrées                         |
| bash `tests/`                   | sélection (alias, arith, heredoc, func)                                                   | sorties de référence                              |
| Replay snapshot                 | snapshots Claude réels anonymisés + commandes typiques (git, cargo, bun, rg, pipes longs) | sortie Git Bash enregistrée une fois hors machine |
| Windows                         | PATHEXT, quoting, chemins, Ctrl+C, job kill, CRLF, UTF-8                                  | assertions fixes                                  |
| Perf                            | `hyperfine 'bash.exe -c true'`                                                            | < 20 ms                                           |

## 5. Issues upstream à envoyer (ordre)

#1359, #1317, #1295, #1251, #1086, #1580, #1581, #1540, #1268, #1662. Chaque correctif : test de régression + PR `reubeno/brush` ; le fork rebase chaque semaine.

## 6. Repli

busybox-w32 `sh.exe` si une régression brush bloque : inutilisable tel quel, car ash n'a ni `shopt` ni `declare` [V]. Repli réel : Oils OSH Windows (36/36 au smoke, rejeu du snapshot OK).
