# Matrice des shells (2026-11-12)

Scores 0-1 (détail : `vectors.json`). Démarrage : aucun benchmark publié trouvé, toutes les valeurs sont [NV], ordre de grandeur. Sources : `gh api` du 2026-11-12, fichiers de recherche listés dans INDEX.md.

| Shell | Win natif | Compat bash | POSIX | Structuré | Script | UX interactive | Démarrage ms [NV] | Maturité | Licence | Langage | Dernière release |
|---|---|---|---|---|---|---|---|---|---|---|---|
| brush | 0.7 (Preview) | 0.8 | 0.8 | 0 | 0.8 | 0.6 | ~10-30 | 0.5 | MIT | Rust | v0.4.0, 2026-05-03 |
| busybox-w32 ash | 1.0 | 0.4 | 0.85 | 0 | 0.6 | 0.5 | ~5 | 0.85 | GPL-2 | C | tag TIG_1_23_0, commit 2026-11-12 [V gh] |
| GNU bash (MSYS, exclu) | 0.2 | 1.0 | 0.9 | 0 | 0.9 | 0.8 | ~50-150 (fork Cygwin) | 1.0 | GPL-3 | C | 5.3 |
| Oils OSH/YSH | 0 | 0.9 | 0.85 | 0.6 | 0.9 | 0.5 | ~5 | 0.6 | Apache-2 | C++ | 0.38.0, tarball oils.pub [V, build Windows réussi] |
| dash | 0 | 0.2 | 0.9 | 0 | 0.5 | 0.2 | ~1 | 0.95 | BSD-3 | C | v0.5.13.6 |
| ksh93u+m | 0 | 0.5 | 0.9 | 0.2 | 0.8 | 0.5 | ~3 | 0.85 | EPL-2 | C | v1.0.10, 2024-08-01 |
| zsh | 0 | 0.5 | 0.7 | 0.1 | 0.8 | 0.95 | ~10 | 0.95 | MIT-like | C | 5.9.2 |
| yash | 0 | 0.2 | 1.0 | 0 | 0.5 | 0.6 | ~3 | 0.8 | GPL-2 | C | 2.61, 2026-03-03 |
| oksh | 0 | 0.3 | 0.8 | 0 | 0.5 | 0.5 | ~2 | 0.85 | ISC-like | C | 7.9, 2026-06-10 |
| mksh | 0 | 0.4 | 0.85 | 0 | 0.6 | 0.5 | ~2 | 0.85 | MirOS | C | mksh-R59c, tag du miroir [V gh] |
| toybox sh | 0 | 0.3 | 0.6 | 0 | 0.4 | 0.3 | ~1 | 0.4 | 0BSD | C | 0.8.15 |
| nushell | 1.0 | 0 | 0 | 1.0 | 0.85 | 0.9 | ~30-80 | 0.75 | MIT | Rust | 0.117.0, 2026-11-10 |
| fish 4 | 0.1 | 0.1 | 0.1 | 0.1 | 0.6 | 1.0 | ~20 | 0.95 | GPL-2 | Rust | 4.9.3, 2026-09-08 |
| xonsh | 0.8 | 0.2 | 0.1 | 0.7 | 0.8 | 0.7 | ~200+ (Python) | 0.7 | BSD-2 | Python | 0.25.0, 2026-10-22 |
| elvish | 0.9 | 0 | 0 | 0.9 | 0.8 | 0.8 | ~10 | 0.6 | BSD-2 | Go | v0.21.0, 2024-08-14 |
| murex | 0.8 | 0.1 | 0 | 0.85 | 0.7 | 0.8 | ~20 | 0.6 | GPL-2 | Go | v7.4.2002, 2026-11-10 |
| ion | 0 | 0.1 | 0.1 | 0.3 | 0.5 | 0.4 | ~5 | 0.3 | MIT | Rust | aucune |
| NGS | 0 | 0 | 0 | 0.8 | 0.7 | 0.3 | NV | 0.4 | GPL-3 | C | v0.2.17, 2025-04-05 |
| Marcel | 0 | 0 | 0 | 0.8 | 0.6 | 0.5 | NV | 0.4 | GPL-3 | Python | v0.38.0, 2026-10-18 |
| Rash | 0.3 | 0 | 0 | 0.4 | 0.5 | 0 | NV | 0.4 | GPL-3 | Rust | v3.0.0, 2026-10-08 |
| Amber (compilateur) | 0.5 | 0 | 0 | 0.2 | 0.6 | 0 | n/a | 0.3 | LGPL-3 | Rust | 0.6.0-alpha |
| ABS | 0.8 | 0 | 0 | 0.5 | 0.6 | 0.3 | NV | 0.3 | MIT | Go | 2.7.2, 2025-04-27 |
| es / rc | 0 | 0 | 0.1 | 0.2 | 0.6 | 0.3 | ~2 | 0.5 | PD / zlib | C | v0.10.0 / aucune |
| Hush, closh, Oh | 0 | ≤0.2 | 0 | 0.3-0.5 | 0.5 | ≤0.3 | NV | ≤0.2 | MIT/EPL/MIT | Rust/Clojure/Go | dormants |
| PowerShell (réf., exclu) | 1.0 | 0 | 0 | 1.0 | 0.9 | 0.8 | ~300+ | 1.0 | MIT | C# | v7.7.0, 2026-11-10 |

## Classement : remplaçant de Git Bash sous Claude Code (Windows)

Critère éliminatoire : un exécutable nommé `bash.exe`/`sh.exe` qui source le snapshot bash (fonctions, alias, `shopt`, `export -p`) sans MSYS.

| Rang | Shell | Raison |
|---|---|---|
| 1 | brush (fork aphrody-labs) | seul bash natif Win32 ; snapshot sourcé (87 fonctions) ; bloqueurs connus et ciblés : #1359, #1317, #1295, #1251, #1086, #1580 (ouvertes, vérifié 2026-11-12) |
| 2 | busybox-w32 `sh.exe` | natif mature, actif (commit 2026-11-12) ; `shopt` et `declare` absents de shell/ash.c [V, source master 2026-11-12] : il ne peut pas rejouer le snapshot Claude tel quel ; repli d'urgence |
| 3 | Oils OSH | compat bash la plus haute après bash, mais pas de Windows natif ; port = projet lourd |
| — | bash MSYS / Git Bash | référence fonctionnelle, interdit par contrainte |
| — | nushell, elvish, murex, xonsh, fish | ne peuvent pas exécuter le snapshot bash |

## Classement : shell interactif quotidien (Windows natif, sans pwsh)

| Rang | Shell | Raison |
|---|---|---|
| 1 | nushell | natif 1re classe, données structurées, très actif (0.117.0, 2026-11-10), LSP intégré (crate nu-lsp, `nu --lsp`) [V gh] |
| 2 | brush + starship/atuin/carapace | même shell que Claude, compat bash ; UX moins riche, compat outils [NV] |
| 3 | elvish | natif, structuré, mais release 2024 |
| 4 | murex | natif, typé, petite équipe (~22 contributeurs) |
| 5 | xonsh | natif via Python, démarrage lent |
| — | fish 4 | meilleure UX mais pas de Windows natif : le README indique WSL, Cygwin ou MSYS2 [V gh README.rst] |

## Décision bash.exe de Claude (2026-11-12, mesures nt-03)

| | brush 0.4.0 | niubash 1.5.0 | Git Bash (réf.) |
|---|---|---|---|
| `-c exit` (hyperfine -N, 30 runs) | 8,4 ± 0,5 ms | 16,3 ± 0,5 ms | 19,2 ± 0,6 ms |
| shell-matrix (34 cas, C:\src\packages\shell-matrix) | 30/34 (claude-c-l, procsub, cd /c, cd C:/) | 34/34 | 34/34 |
| dépendance msys/cygwin (dumpbin) | non | non | oui |
| taille | — | niu.exe 14,5 Mo, install 103 Mo | — |

Retenu : **niubash 1.5.0**, `C:\Users\aphro\AppData\Local\Programs\Niubash\winuxcmd\bin\bash.exe` (CLAUDE_CODE_GIT_BASH_PATH ; CLAUDE_CODE_USE_POWERSHELL_TOOL=0). brush reste candidat dès que le fix `-c -l` (#1398, d220c79d, main) est publié et #1359/#1317/#1295 corrigés. Snapshot niubash non mesuré ; ~/.bashrc actuel ≈ 6,5 Ko (NV).
Partage : nt-03 = bas niveau (binaires, PATH, settings, WT, DSC, patchs Win32, port Oils) ; cette session = haut niveau (docs, candidats, forks, conformité fr1, Lore).
Doublons de forks à trancher par le propriétaire : coreutils-2/uutils-coreutils, coreutils-3/coreutils, fx-1, wterm-1, skills-3, vcpkg-1.

## Vérification reproductible (2026-11-12, cette session)
- `bun C:\src\packages\machine\src\apply-user.ts --check` : tout est ok. Points contrôlés : CLAUDE_CODE_GIT_BASH_PATH, CLAUDE_CODE_USE_POWERSHELL_TOOL=0, MCP agent-desktop et agent-browser, PATH (niubash présent, Git Bash absent), profil par défaut de WT = niubash élevé.
- `niubash -c -l` (invocation de Claude) : BASH_VERSION 5.3.20, 59 options `shopt -p`, git et rg venant de niubash (sans MSYS).
- Limite : cette session tourne encore sous l'ancien Git Bash (5.3.15, /usr/bin/bash), lancé avant la bascule. Le contrôle de bout en bout (Bash tool sous niubash, avec context7, GitHub MCP et Microsoft Learn MCP) se fait dans une **nouvelle session** Claude Code : `echo $BASH_VERSION` doit afficher 5.3.20, puis on appelle un outil de chacun des trois MCP.
- pwsh : remplacé pour Claude, puisque l'outil PowerShell est désactivé et que niubash prend la place. Les usages restants (CIM, registre, Authenticode) passent par windows-rs ou les binaires Rust de src.
- **Contrôle de bout en bout fait** (nouvelle session `claude -p`, 2026-11-12) : l'outil Bash répond `5.3.20(1)-release` avec git venant de niubash ; context7 resolve « bun » → `/oven-sh/bun` ; GitHub MCP get_me → `aphrody-dev` ; Microsoft Learn search « CreateProcessW » → « CreateProcessW function (processthreadsapi.h) ». La chaîne Claude Code → niubash → MCP fonctionne sans Git Bash, pwsh, MSYS ni WSL.
- **Démarrage mesuré** (hyperfine -N, 20 runs, `-c exit`, ce PC, 2026-11-12 ; données dans startup.json) : osh Windows 8,8 ± 0,8 ms ; brush 0.4.0 9,3 ± 0,8 ms ; niubash 1.5.0 18,4 ± 0,6 ms ; nushell 28,5 ± 0,8 ms. Ces mesures remplacent la colonne [NV] pour ces quatre shells.
- **Cas d'usage pwsh sans pwsh** : sous niubash, `reg.exe query … /v CurrentBuild` renvoie bien 28120. `sudo.exe` en mode Inline répond. Le registre et l'élévation n'ont donc pas besoin de pwsh. La syntaxe `sudo reg query HKU\…` a échoué (clé invalide, mauvais échappement), donc la vérification de l'élévation reste à refaire.
- **Remplacement de pwsh testé de bout en bout** (session neuve `claude -p`, uniquement l'outil Bash, 2026-11-12) : l'outil PowerShell est absent ; Bash 5.3.20 ; registre lu (CurrentBuild 28120, i7-13700F) ; tasklist (346 processus) ; écriture puis suppression élevées dans HKLM via `sudo.exe reg.exe add/delete` réussies, la clé de test a disparu ensuite. Note : l'agent a posé `MSYS_NO_PATHCONV=1` pour les options `/v` `/f`, alors que niubash appelé directement passe `/v` sans conversion. Comportement à figer dans shell-matrix.
