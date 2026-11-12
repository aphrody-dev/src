# Plateforme shell native Windows

Date : 2026-11-12. Légende : **[V]** vérifié sur la source citée ce jour ; **[NV]** non vérifié (connaissance antérieure, à confirmer).

## 1. Claude Code et les shells sous Windows

| Fait | Statut | Source |
|---|---|---|
| Bash tool sous Windows natif = Git Bash ; sans Git Bash, Claude utilise le PowerShell tool | V | code.claude.com/docs/en/setup (#set-up-on-windows) |
| `CLAUDE_CODE_GIT_BASH_PATH` : Windows seulement ; fichier ignoré s'il n'existe pas ou ne s'appelle pas `bash.exe`, `sh.exe`, `bash`, `sh` (auto-détection + warning `--debug`) ; avant v2.1.219, sortie au démarrage | V | code.claude.com/docs/en/env-vars |
| `CLAUDE_CODE_SHELL` : chemin vers un binaire `bash` ou `zsh` ; sinon ignoré, auto-détection via `$SHELL` puis premier zsh/bash fonctionnel | V | env-vars |
| `CLAUDE_CODE_SHELL_PREFIX` : préfixe enveloppant Bash tool, hooks, statusline, MCP stdio (pas les hooks PowerShell) | V | env-vars |
| `CLAUDE_ENV_FILE` : script exécuté avant chaque commande Bash dans le même processus shell | V | env-vars |
| Snapshot : au démarrage, Claude source `~/.zshrc`/`~/.bashrc`/`~/.profile`, capture alias, fonctions, options, et les applique à chaque commande | V | code.claude.com/docs/en/tools-reference (#what-persists-between-commands) |
| Variables d'env non persistées entre commandes ; `cd` persistant seulement dans les répertoires de travail (`CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR=1` pour désactiver) | V | tools-reference |
| Troncature du snapshot à ~70927 octets | NV (constat de l'owner, absent de la doc) | — |
| PowerShell tool : auto si pas de Git Bash ; avec Git Bash, actif par défaut (claude.ai/Console), `CLAUDE_CODE_USE_POWERSHELL_TOOL=0/1` | V | tools-reference |
| Détection `pwsh.exe` puis repli `powershell.exe` 5.1 ; lancé avec `-ExecutionPolicy Bypass` (scope processus) ; profils non chargés | V | tools-reference |
| `"defaultShell": "powershell"` : route les commandes `!` interactives via PowerShell (exige le PowerShell tool) ; `"shell": "powershell"` par hook | V | tools-reference |
| Monitor tool exige Git Bash sous Windows | V | tools-reference, setup |
| Sandboxing non supporté sous Windows natif | V | setup, tools-reference |
| Sortie lue : `BASH_MAX_OUTPUT_LENGTH` défaut 30000, max 150000 | V | env-vars |

Conséquence : brush peut être déclaré via `CLAUDE_CODE_GIT_BASH_PATH` à condition que le fichier s'appelle `bash.exe`/`sh.exe` (cas actuel : lien `C:\Users\aphro\.local\share\brush\bash.exe`). Claude présume un bash « Git Bash-like » (syntaxe POSIX, `/dev/null`, chemins `/c/...` acceptés) [NV pour les détails de traduction de chemin].

## 2. cmd.exe

| Point | Statut | Source |
|---|---|---|
| Pas de vrai parseur grammatical : expansion `%VAR%` à la lecture de ligne, `!VAR!` différée (`setlocal enabledelayedexpansion`), échappement `^` | NV | learn.microsoft.com/windows-server/administration/windows-commands/cmd |
| Résolution de commande : répertoire courant d'abord, puis `PATH`, extensions dans l'ordre `PATHEXT` (défaut `.COM;.EXE;.BAT;.CMD;.VBS;.VBE;.JS;.JSE;.WSF;.WSH;.MSC`) | NV | même page / doc `set` |
| `.bat`/`.cmd` lancés par `CreateProcess` passent implicitement par `cmd.exe /c` (piège d'échappement d'arguments, cf. CVE-2024-24576 « BatBadBut » Rust std) | NV | blog.rust-lang.org 2024-04-09 |
| Ligne de commande = une chaîne UTF-16 unique (max 32767 car.), découpage en argv laissé au CRT du programme cible | NV | learn.microsoft.com CreateProcessW, « Parsing C command-line arguments » |

## 3. Console, ConPTY, Windows Terminal

| Fait | Statut | Source |
|---|---|---|
| ConPTY = pseudo-console : l'hôte crée 2 canaux synchrones, `CreatePseudoConsole`, puis `CreateProcess` avec `STARTUPINFOEX` + `PROC_THREAD_ATTRIBUTE_PSEUDOCONSOLE` + `EXTENDED_STARTUPINFO_PRESENT` | V | learn.microsoft.com/windows/console/creating-a-pseudoconsole-session |
| Flux toujours UTF-8 + séquences VT ; traduction de code page interne | V | learn.microsoft.com/windows/console/pseudoconsoles |
| Disponible depuis Windows 10 1809 / Server 2019 ; `ReleasePseudoConsole` depuis Win 11 24H2 (build 26100) | V | createpseudoconsole, releasepseudoconsole |
| Un canal par thread recommandé (risque d'interblocage) ; flag `PSEUDOCONSOLE_INHERIT_CURSOR` impose de répondre aux requêtes de curseur | V | creating-a-pseudoconsole-session, createpseudoconsole |
| Pas de `isatty` POSIX : un programme détecte la console via `GetConsoleMode` ; sous ConPTY, l'enfant voit une vraie console | V (principe) / NV (détail) | pseudoconsoles |
| Windows Terminal est un hôte ConPTY ; exemples EchoCon/MiniTerm dans microsoft/terminal/samples | V | learn.microsoft.com/windows/terminal/samples |

## 4. Git for Windows, MSYS2, Cygwin

| Point | Statut | Source |
|---|---|---|
| Cygwin `fork` sans copy-on-write : enfant créé suspendu (`CreateProcess`), `setjmp`, copie `.data/.bss`, puis pile et tas, recréation des mmap | V | cygwin.com/cygwin-ug-net/highlights.html |
| Lenteur : nombreux changements de contexte, pas de clonage d'espace d'adressage natif ; collisions de base DLL, ASLR, DLL injectées (antivirus) font échouer fork ; `spawn` recommandé (+20-30 % en compilation) | V | idem |
| MSYS2 = fork de Cygwin (msys-2.0.dll) ; Git for Windows embarque MSYS2 | NV | msys2.org/docs/what-is-msys2 |
| Conversion automatique d'arguments POSIX→Windows au lancement d'un exe non-MSYS (`/c/x` → `C:\x`), désactivable `MSYS_NO_PATHCONV=1` / `MSYS2_ARG_CONV_EXCL` | NV | msys2.org/docs/filesystem-paths |
| Les pty Cygwin/MSYS étaient des pipes nommés : programmes natifs voyaient « pas un terminal » (d'où `winpty`) ; Cygwin 3.1+ peut utiliser ConPTY | NV | cygwin.com announce 3.1.0 (2019-12) |
| Symlinks Cygwin : par défaut fichiers spéciaux (`!<symlink>`) ou natifs via `CYGWIN=winsymlinks:native` | NV | cygwin-ug-net/using.html#pathnames-symlinks |
| Signaux POSIX émulés par thread de signal + pipe par processus | NV | cygwin-ug-net/highlights.html (section signaux) |

## 5. Processus Windows

| Fait | Statut | Source |
|---|---|---|
| Pas de `fork`/`exec` ; seul `CreateProcessW` (nouvel espace, chargement image, DLL, init loader). Coût typique ~ms vs ~0,1 ms pour fork+exec Linux, aggravé par Defender | NV (ordre de grandeur) | — à mesurer (hyperfine) |
| `CREATE_NEW_PROCESS_GROUP` : nouveau groupe dont le PID = id de groupe ; Ctrl+C désactivé dans ce groupe ; ignoré avec `CREATE_NEW_CONSOLE` | V | learn.microsoft.com/windows/win32/procthread/process-creation-flags |
| Job objects : gérer un groupe de processus comme unité (limites, terminaison) ; enfants créés par `CreateProcess` héritent du job par défaut ; jobs imbriqués depuis Win 8 | V | learn.microsoft.com/windows/win32/procthread/job-objects, nested-jobs |
| `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` : tue tout l'arbre à la fermeture du handle (équivalent pratique de `kill -- -pgid`) | NV (flag non relu) | JOBOBJECT_BASIC_LIMIT_INFORMATION |
| Pas de code de sortie par signal : exit code 32 bits ; Ctrl+C non géré → `STATUS_CONTROL_C_EXIT` 0xC000013A | NV | — |

## 6. Signaux console

| Fait | Statut | Source |
|---|---|---|
| Ctrl+C / Ctrl+Break = signaux (SIGINT / SIGBREAK) envoyés à tous les processus attachés à la console ; un thread est créé dans chaque client | V | learn.microsoft.com/windows/console/ctrl-c-and-ctrl-break-signals |
| Ctrl+Break toujours un signal ; Ctrl+C désactivable via `ENABLE_PROCESSED_INPUT` off ou `SetConsoleCtrlHandler(NULL, TRUE)` (hérité) | V | idem |
| `GenerateConsoleCtrlEvent` : `CTRL_C_EVENT` ne peut pas cibler un groupe (groupe≠0 → non reçu) ; `CTRL_BREAK_EVENT` ciblable ; seulement même console | V | learn.microsoft.com/windows/console/generateconsolectrlevent |
| Handlers LIFO jusqu'à `TRUE`, défaut = `ExitProcess` ; `AttachConsole/AllocConsole/FreeConsole` réinitialisent la table | V | console-control-handlers |
| `CTRL_CLOSE_EVENT`, logoff, shutdown ; pas de SIGTERM/SIGKILL/SIGTSTP/SIGCHLD natifs (`TerminateProcess` = SIGKILL) | V (événements) / NV (mapping) | handlerroutine |

## 7. Chemins, liens, exécution

| Fait | Statut | Source |
|---|---|---|
| `MAX_PATH` = 260 ; chemins étendus `\\?\` (≈32767, pas de `/`, `.`, `..`, pas de relatif) ; `\\?\UNC\server\share` | V | learn.microsoft.com/windows/win32/fileio/maximum-file-path-limitation |
| Long paths hors `\\?\` : registre `LongPathsEnabled=1` **et** manifeste `longPathAware` (Rust std n'ajoute pas ce manifeste par défaut : dans rust-lang/rust seul rustc.exe embarque longPathAware [V compiler/rustc/Windows Manifest.xml], mais préfixe `\\?\` en interne via `maybe_verbatim` [V library/std/src/sys/path/windows.rs]) | V | idem |
| API Win32 convertit `/` en `\` sauf avec `\\?\` | V | idem |
| Casse : NTFS insensible par défaut ; sensibilité par répertoire `fsutil file setCaseSensitiveInfo <path> enable` | V | learn.microsoft.com/windows/wsl/case-sensitivity |
| Lettres de lecteur + cwd par lecteur (`=C:` variables cachées), `C:foo` relatif au cwd du lecteur | NV | learn.microsoft.com/dotnet/standard/io/file-path-formats |
| Symlinks : `CreateSymbolicLinkW` exige SeCreateSymbolicLinkPrivilege ou Developer Mode + `SYMBOLIC_LINK_FLAG_ALLOW_UNPRIVILEGED_CREATE` ; distinction fichier/répertoire | NV | learn.microsoft.com CreateSymbolicLinkW |
| Hardlinks (`CreateHardLinkW`) sans privilège, même volume ; adaptés aux binaires multicall (uutils `coreutils.exe` → `ls.exe`) : `argv[0]`/`GetModuleFileName` donne le nom du lien | NV | Hard Links and Junctions |
| Pas de shebang dans le noyau : `CreateProcess` n'exécute que les PE (et .bat/.cmd via cmd) ; un bash natif doit lire `#!` lui-même, mapper `/usr/bin/env X` → recherche PATH+PATHEXT | V (absence) / NV (forme) | — |
| Association de fichiers (`assoc`/`ftype`, ShellExecute) ≠ CreateProcess | NV | — |

## 8. Ce qu'un bash natif Windows doit implémenter (drop-in Claude Code)

| Exigence | Raison | Priorité |
|---|---|---|
| Nom de fichier `bash.exe` ou `sh.exe` | filtre `CLAUDE_CODE_GIT_BASH_PATH` | bloquant |
| Sourcer un snapshot complet (fonctions, alias quotés, `shopt`, `export -p`) sans réécrire les fonctions | Claude l'injecte avant chaque commande ; brush #1086, #1580 | bloquant |
| `-c`, `-l`, codes de sortie exacts, `set -e/-o pipefail`, heredocs, `$(...)`, `trap`, `wait`, `&` | usage quotidien du Bash tool | bloquant |
| Spawn sans fork (CreateProcessW direct, sous-shells in-process) | éviter le coût Cygwin | perf |
| Quoting argv conforme aux règles CRT MSVC, refus/échappement sûr vers `.bat/.cmd` | BatBadBut | sécurité |
| Recherche commande PATH + PATHEXT, insensible à la casse ; shebang émulé | scripts `#!/usr/bin/env bash` | bloquant |
| Chemins : accepter `C:\x`, `C:/x`, `/c/x` ; `/dev/null`→`NUL`, `/tmp`→`%TEMP%` ; `pwd` cohérent ; `\\?\` en interne | Claude écrit des chemins POSIX | bloquant |
| Pas de conversion d'arguments implicite à la MSYS (ou opt-in) | éviter les surprises `MSYS_NO_PATHCONV` | qualité |
| Job object KILL_ON_JOB_CLOSE par pipeline/arrière-plan ; `kill` → `TerminateProcess`/`CTRL_BREAK` sur groupe | timeouts et `/tasks` de Claude | bloquant |
| Ctrl+C : handler console, propagation au job au premier plan, exit 130 | interruption utilisateur | haute |
| `isatty` via `GetConsoleMode` ; fonctionnement sous ConPTY et sous pipes | sortie redirigée par Claude | haute |
| UTF-8 partout (code page 65001, WTF-8 pour noms invalides) | sorties lues par Claude | haute |
| Coreutils multicall en hardlinks (uutils), pas de dépendance MSYS | contrainte owner | moyenne |
| Démarrage < 20 ms, snapshot < ~70 KB recommandé | une instance par commande | perf |
