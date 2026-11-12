# Oils OSH natif Windows (clang-cl/lld, sans MSYS)

Date : 2026-11-12. **[V]** mesuré/vérifié dans cette session ; **[NV]** non vérifié.

## Résultat

- Fork : https://github.com/aphrody-labs/oils, branche `windows-native`, commits `139776c` + `91bd47f` (HEAD `91bd47fe9de360dbe1918b97f463bfddb6ac4b8a`). Base : master `d114978` = 0.38.0. [V]
- Source C++ : tarball `oils-for-unix-0.38.0.tar.gz` (oils.pub/download, 882 903 o ; aucune release GitHub). `_gen/` du tarball + `cpp/` `mycpp/` du fork (identiques à 0.38.0). [V]
- Toolchain : clang-cl 23.1.5 + lld-link, MSVC 14.52 STL, SDK 10.0.26100.0 (le 28000 installé n'a pas d'`ucrt` → `-winsdkversion10.0.26100.0`). [V]
- Build : `cpp\win32\build.cmd <tarball>` (cmd.exe, ni bash ni pwsh). Build complet en 26 s, vérifié depuis un clone neuf. [V]
- Binaire : `_build\win32\oils-for-unix.exe` (+ copies `osh.exe`, `ysh.exe`), 2 513 408 o, -O2, `/opt:ref,icf`, manifeste UTF-8 + longPathAware. [V]

## Architecture du portage

| Fichier | Rôle |
|---|---|
| `cpp/win32/posix_compat.h` | force-inclus (`-FI`) : types, constantes, signaux, wait macros, stat/glob/fnmatch/regex/termios/pwd… ; macros `open/access/stat/chdir/getcwd/unlink/isatty/execve` vers versions qui traduisent les chemins |
| `cpp/win32/compat.cc` | implémentation Win32 (~1 800 lignes) |
| `cpp/win32/oils_win.cc` | TU qui `#include` `oils_for_unix.mycpp.cc` ; `#define fork() fork_win(this)` remplace l'unique appel (`Process::StartProcess`) |
| `cpp/win32/main_win.cc` | `main` : argv UTF-8 via `CommandLineToArgvW`, argv[0] normalisé (`C:/x/osh`) pour le dispatch d'applet |
| `cpp/win32/tools/asdl_empty_bases.cc` | ajoute `OILS_EMPTY_BASES` aux en-têtes ASDL pré-générés |
| `cpp/win32/tools/line_patch.cc` + `oils_for_unix.lpatch` | 3 correctifs ligne-à-ligne du C++ généré (chemins `C:/` absolus) |
| `asdl/gen_cpp.py`, `mycpp/common.h` | correctif amont : `__declspec(empty_bases)` sous `_MSC_VER` |
| `cpp/stdlib.h`, `cpp/core.cc` | `fork`/`_exit` sous `#ifdef _WIN32` ; `IsSameFile` via index de fichier NTFS |

Bug ABI trouvé : sous l'ABI MSVC, une classe à plusieurs bases vides (`Token : loc_t, word_t, …`) ne place que la première à l'offset 0 ; `tag()` lit alors l'`ObjHeader` au mauvais endroit (assertion `word_e`). Corrigé par `empty_bases`. [V]

## fork() : stratégie retenue

Pas de ré-exec avec état sérialisé. Selon le thunk :

- `ExternalThunk` → `CreateProcessW` asynchrone, vrai pid. stdin/out/err = fds CRT 0/1/2 du parent après redirections, ou extrémités de pipe des `ChildStateChange`. Liste de handles explicite (`PROC_THREAD_ATTRIBUTE_HANDLE_LIST`) : aucun bout de pipe ne fuit. Enfants dans un job object kill-on-close. [V]
- `_HereDocWriterThunk` (> 4 Ko) → écriture directe dans le pipe. [V]
- `SubProgramThunk` / `BuiltinThunk` (sous-shell `( )`, `$(…)`, builtins et fonctions dans un pipeline, `&`) → **dans le processus, synchrone** : `dup2` des fds std, sauvegarde/restauration de cwd, variables (copie des Cell de chaque frame), options, traps/hooks, fonctions, `$?`. `posix::_exit` lève `OilsInProcExit` ; pid factice enregistré pour `waitpid`. [V]
- `exec` (y compris l'exec implicite de la dernière commande) dans un enfant in-process → spawn asynchrone, le pid réel remplace le pid factice : `yes | head`, `a | ext | b` restent concurrents. [V]
- Le bout écriture du pipe d'entrée d'un enfant in-process est redirigé vers NUL (le fork l'aurait fermé) : EOF correct pour `… | while read …; done | …`. [V]
- `exec` au niveau principal : spawn + attente + sortie avec le code de l'enfant. [V]
- Shebang : `#!/bin/sh|bash|osh` relancent `osh.exe` lui-même ; `#!/usr/bin/env X` cherche X dans PATH ; `.bat/.cmd` via `cmd.exe /d /s /c`. [V pour code ; shebang non testé → NV]

## Chemins et environnement

- `$PATH` exposé au shell en forme POSIX (`/c/Windows:/c/x`), reconverti en `C:\…;…` pour les enfants. [V]
- `/c/x` → `C:/x`, `/dev/null` → `NUL`, `/tmp` → `%TEMP%` dans open/stat/access/opendir/chdir/spawn. `C:/x` et `\\srv\share` absolus (`os_path.join/isabs`, `$PWD`). [V]
- `foo` → `foo.exe` (PATHEXT) dans stat/access, comme Cygwin : `type`, `command -v`, recherche PATH. [V]
- `getcwd`/`pwd -P` renvoient `C:/…` ; `cd /c/x` donne `$PWD=/c/x` (logique). Mélange voulu pour les outils natifs. [V]
- `HOME` créé depuis `USERPROFILE` si absent ; uid/euid = 1000 ; `getpwuid` = utilisateur courant. [V]
- Console : CP UTF-8, VT activé ; fds en mode binaire ; handler CRT d'argument invalide neutralisé (EBADF au lieu de fast-fail). [V]

## Tests (`cpp/win32/smoke.sh`, 36 cas, chacun dans un `osh -c` neuf)

- osh.exe : **36/36 PASS** [V] : echo, arith, fonctions, tableaux, assoc, `$(…)` imbriqué et externe, backticks, pipelines builtin→ext / ext→builtin / 3 étages, PIPESTATUS, `>` `>>` `<` `2>&1` `/dev/null`, heredoc, here-string, isolation de sous-shell (variable, cd, exit), errexit, case, extglob, `=~`, glob, recherche PATH, code retour externe, 127, roundtrip `declare -f`, alias, `shopt -p`, export vers enfant, `&`+`wait`, `printf -v`.
- Même suite avec brush (`~/.local/share/brush/bash.exe`) : 34/36 (échecs `subshell-cd`, `shopt-p`). [V]
- Volumes : `seq 1 200000 | wc -l`, `printf '%s\n' {1..300000} | wc -l`, `x=$(seq 1 100000)` (588 894 o) OK. [V]
- Replay type snapshot Claude Code (fonctions + alias + `shopt -p` produits par brush, puis `osh -c -l "source snap && eval '…' < /dev/null && pwd -P >| f"`) : fonctions, alias (après `shopt -s expand_aliases`), pipelines, `>|` OK. [V]
  - 47 lignes `shopt -s/-u` inconnues d'OSH (`xpg_echo`, `promptvars`…) : erreur non fatale, `source` continue. Divergence OSH, pas Windows.
  - `export -p` de brush n'est **pas** rejouable : il émet `declare -x CommonProgramFiles(x86)=…` et ne protège pas un `\` final (`"…GDK\"`) ; bash comme osh rejettent. Bug brush.
  - `declare -f` d'OSH réimprime la source d'origine (`f() { echo x; }`), pas le format bash ; reste ré-évaluable.

## Mesures (hyperfine, -N, 20 runs) [V]

| Cas | osh.exe | brush |
|---|---|---|
| `-c true` | 8,1 ms | 8,8 ms |
| boucle `while` 20 000 itérations | 37,9 ms | 210,8 ms |
| 10 × `x=$(echo $i)` | 8,7 ms | 9,7 ms |
| `coreutils echo a \| coreutils wc -c` | 18,1 ms | 18,7 ms |

## Stubs et limites connues

- **Écrivain in-process infini** (`while true; do echo y; done | head -1`) : bloque (il tourne avant le lecteur). [V]
- **Sortie in-process > 16 Mo** (ex. 20 Mo de `printf` dans un pipe ou `$(…)`) : **levée** (commits 996dee3 + afe7c4c, branche windows-native). Un thread pompe la sortie de l'enfant in-process en mémoire (plafond 1 Gio), puis la recopie dans le vrai pipe ; si le lecteur ferme, la pompe ferme aussi, et un `yes` lancé par exec reçoit un broken pipe. Testé avec le binaire cross-compilé sur prd (clang-cl + lld-link, SDK xwin MSVC 14.44) : `f | wc -c` = 20000001, `${#x}` = 20000000, `2>&1 |` OK, shell-matrix 29/34 comme avant. L'ancien binaire bloque sur le même test (timeout). Désactivable avec `OILS_WIN_NO_PUMP=1`. [V]
- Isolation in-process partielle : mutation en place d'un tableau existant (`a[0]=x`), `set --`, alias, `umask`, `ulimit`, fds ≥ 3 ouverts dans le sous-shell fuient vers le parent. `$BASHPID`/`$$` = pid du shell. [NV pour chaque cas, déduit du code]
- fds ≥ 3 non transmis aux enfants (`cmd 3>f` : seul le shell les voit). [NV] (nécessite Windows propre)
- Pas de contrôle de jobs : `setpgid`/`tcsetpgrp` no-op, `fg/bg/jobs`, SIGTSTP absents. `kill` = `TerminateProcess(128+sig)` ; Ctrl-C via `SetConsoleCtrlHandler` → SIGINT (non testé interactivement [NV] (nécessite Windows propre, test interactif)). Codes NTSTATUS ≥ 0xC0000000 → SIGSEGV (0xC000013A → SIGINT).
- `getppid` = 1, `setrlimit` no-op, `getrlimit` = infini (NOFILE = 8192), `st_ino` = 0 (`-ef` passe par l'index NTFS), `S_ISLNK` = 0 (`[ -L ]` toujours faux).
- Pas de readline (`HAVE_READLINE` absent) : le mode interactif lit des lignes brutes. FANOS (`--headless`) : stub ENOSYS.
- Arguments non traduits : `cat /c/x` passe `/c/x` tel quel aux programmes natifs (pas d'heuristique MSYS).
- `.bat/.cmd` : arguments passés à travers le parseur de `cmd.exe` (classe BatBadBut) [V blog.rust-lang.org CVE-2024-24576].
- Regex `=~` : `std::regex::extended` (ERE POSIX de la STL MSVC [V learn.microsoft.com/cpp/standard-library/regular-expressions-cpp]), pas la libc ; classes et backrefs exotiques non testées [NV] (nécessite Windows propre).
- Un appel CRT « invalid parameter » survient à chaque pipeline (probablement un double `close`), désormais inoffensif ; cause non identifiée.

## Prochaines étapes

1. Régénérer `_gen` depuis le fork (mycpp/ASDL) pour supprimer `asdl_empty_bases` et `line_patch` ; porter les 3 correctifs `os_path`/`state` en Python (`pylib/os_path.py`, `core/state.py`).
2. ~~Enfants in-process : thread de drainage → lever la limite 16 Mo~~ fait (pompe, voir plus haut). Reste à faire : détecter l'écrivain infini (`f() { yes; }; f | head -1` bloque toujours ; avec la pompe, il bloque une fois le plafond de 1 Gio atteint).
3. Vrai sous-processus pour `( … )`/`&` : ré-exec `osh.exe` avec état sérialisé (`declare -p`, `declare -f`, alias, `shopt -p`, `set +o`) + source du nœud via les spans de l'arena.
4. Transmission des fds ≥ 3 (`lpReserved2` du CRT), `$$`/`$BASHPID`, `getppid` réel (NtQueryInformationProcess).
5. Ligne interactive : éditeur maison (console VT) à la place de readline.
6. Lancer la suite spec d'Oils (`spec/*.test.sh`) sous Windows et comparer à brush.
7. Proposer `OILS_EMPTY_BASES` et `#ifdef _WIN32` amont (oils-for-unix/oils).
