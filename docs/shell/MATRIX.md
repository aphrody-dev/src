# Matrice des shells (2026-11-12, configuration partagée 2026-11-13)

Scores 0-1 (détail : `vectors.json`). Démarrage : moyennes `-c exit` mesurées sous Linux (prd, 2026-11-12, table ci-dessous, `startup-linux.json`) et Windows (`startup.json`) ; les autres valeurs restent [NV], ordre de grandeur. Sources : `gh api` du 2026-11-12, fichiers de recherche listés dans INDEX.md.

| Shell | Win natif | Compat bash | POSIX | Structuré | Script | UX interactive | Démarrage ms (L = Linux prd mesuré, W = Windows mesuré, sinon [NV]) | Maturité | Licence | Langage | Dernière release |
|---|---|---|---|---|---|---|---|---|---|---|---|
| brush | 0.7 (Preview) | 0.8 | 0.8 | 0 | 0.8 | 0.6 | 8,2 (L) / 9,3 (W) | 0.5 | MIT | Rust | v0.4.0, 2026-05-03 |
| busybox-w32 ash | 1.0 | 0.4 | 0.85 | 0 | 0.6 | 0.5 | ~5 | 0.85 | GPL-2 | C | tag TIG_1_23_0, commit 2026-11-12 [V gh] |
| GNU bash (MSYS, exclu) | 0.2 | 1.0 | 0.9 | 0 | 0.9 | 0.8 | 3,3 (L) ; ~50-150 MSYS [NV] (nécessite Windows propre) | 1.0 | GPL-3 | C | 5.3 |
| Oils OSH/YSH | 0 | 0.9 | 0.85 | 0.6 | 0.9 | 0.5 | 9,2 (L) / 8,8 (W) | 0.6 | Apache-2 | C++ | 0.38.0, tarball oils.pub [V, build Windows réussi] |
| dash | 0 | 0.2 | 0.9 | 0 | 0.5 | 0.2 | 1,9 (L) | 0.95 | BSD-3 | C | v0.5.13.6 |
| ksh93u+m | 0 | 0.5 | 0.9 | 0.2 | 0.8 | 0.5 | 4,0 (L) | 0.85 | EPL-2 | C | v1.0.10, 2024-08-01 |
| zsh | 0 | 0.5 | 0.7 | 0.1 | 0.8 | 0.95 | 4,0 (L, sans rc) | 0.95 | MIT-like | C | 5.9.2 |
| yash | 0 | 0.2 | 1.0 | 0 | 0.5 | 0.6 | 3,4 (L) | 0.8 | GPL-2 | C | 2.61, 2026-03-03 |
| oksh | 0 | 0.3 | 0.8 | 0 | 0.5 | 0.5 | 3,9 (L) | 0.85 | ISC-like | C | 7.9, 2026-06-10 |
| mksh | 0 | 0.4 | 0.85 | 0 | 0.6 | 0.5 | 2,7 (L) | 0.85 | MirOS | C | mksh-R59c, tag du miroir [V gh] |
| toybox sh | 0 | 0.3 | 0.6 | 0 | 0.4 | 0.3 | ~1 | 0.4 | 0BSD | C | 0.8.15 |
| nushell | 1.0 | 0 | 0 | 1.0 | 0.85 | 0.9 | 26,3 (L) / 28,5 (W) ; config du dépôt 38,7 (W, SETUP.md) | 0.75 | MIT | Rust | 0.117.0, 2026-11-10 |
| fish 4 | 0 | 0.1 | 0.1 | 0.1 | 0.6 | 1.0 | 52,9 (L) ; 12,8 nu / 17,8 avec config.fish (L, 2026-11-13) | 0.95 | GPL-2 | Rust | 4.9.3, 2026-09-08 |
| xonsh | 0.8 | 0.2 | 0.1 | 0.7 | 0.8 | 0.7 | ~200+ (Python) | 0.7 | BSD-2 | Python | 0.25.0, 2026-10-22 |
| elvish | 0.9 | 0 | 0 | 0.9 | 0.8 | 0.8 | 30,2 (L) | 0.6 | BSD-2 | Go | v0.21.0, 2024-08-14 |
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

### Démarrage, Linux prd, 2026-11-12

Plateforme : prd, Arch Linux, 8 cœurs, hyperfine 2.0.0 `-N`. `-c exit` : `-w 5 -r 50` ; boucle POSIX `for i in $(seq 1 20000); do :; done` : `-w 3 -r 20`. Charge machine ~10 pendant la mesure (autres jobs) : écarts-types élevés, comparer plutôt min et instructions. Données : `startup-linux.json`. Mesure Linux, pas Windows.

| Shell (version) | exit moy ± σ ms | exit min ms | instructions exit | RSS Ko | boucle 20k moy ms | boucle min ms |
|---|---:|---:|---:|---:|---:|---:|
| busybox ash 1.36.1 | 1,53 ± 0,95 | 0,53 | 49k | 3 504 | 20,2 | 15,5 |
| dash 0.5.13.5 | 1,88 ± 0,54 | 1,48 | 721k | 3 484 | 24,7 | 15,9 |
| mksh R59c | 2,65 ± 1,11 | 1,33 | 463k | 3 500 | 26,1 | 18,6 |
| bash 5.3.20 | 3,26 ± 2,07 | 1,85 | 1 619k | 3 672 | 39,9 | 30,0 |
| yash 2.61 | 3,41 ± 1,62 | 1,73 | 691k | 3 600 | 62,2 | 49,6 |
| oksh 7.9 | 3,91 ± 2,73 | 1,72 | 665k | 3 548 | 24,2 | 18,7 |
| zsh 5.9.2 | 4,00 ± 1,43 | 2,17 | 1 402k | 3 756 | 77,4 | 65,8 |
| ksh93u+m 1.0.10 | 4,01 ± 1,28 | 2,28 | 701k | 3 504 | 20,5 | 15,0 |
| brush 0.4.0 | 8,18 ± 2,33 | 4,50 | 1 376k | 7 382 | 103,6 | 61,2 |
| osh 0.38.0 | 9,16 ± 4,64 | 4,88 | 5 583k | 7 668 | 57,3 | 47,7 |
| nushell 0.117.0 | 26,3 ± 6,8 | 22,0 | 24 895k | 31 828 | — | — |
| elvish 0.21.0 | 30,2 ± 4,9 | 20,9 | 6 602k | 10 878 | — | — |
| fish 4.9.3 | 52,9 ± 12,2 | 32,6 | 50 715k | 18 048 | — | — |

Instructions : médiane du compteur hyperfine (perf) ; busybox très bas, à vérifier (compteur possiblement limité au processus initial). La boucle inclut le coût de `seq`.

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
| — | fish 4 | meilleure UX mais pas de Windows natif : README 4.9.3 = WSL, Cygwin ou MSYS2 ; #4212 et #10155 fermées [V gh 2026-11-13] ; flotte Linux seulement (SETUP.md) |

## Décision bash.exe de Claude (2026-11-12, mesures nt-03)

| | brush 0.4.0 | niubash 1.5.0 | Git Bash (réf.) |
|---|---|---|---|
| `-c exit` (hyperfine -N, 30 runs) | 8,4 ± 0,5 ms | 16,3 ± 0,5 ms | 19,2 ± 0,6 ms |
| shell-matrix (34 cas, C:\src\packages\shell-matrix) | 30/34 (claude-c-l, procsub, cd /c, cd C:/) | 34/34 | 34/34 |
| dépendance msys/cygwin (dumpbin) | non | non | oui |
| taille | — | niu.exe 14,5 Mo, install 103 Mo | — |

Retenu : **niubash 1.5.0** (autorité et dédoublonnage : docs/unixwin/DEDUP.md ; binaire construit depuis les forks et installé par `just unixwin-install, docs/unixwin/BUILD.md), `C:\Users\aphro\AppData\Local\Programs\Niubash\winuxcmd\bin\bash.exe` (CLAUDE_CODE_GIT_BASH_PATH ; CLAUDE_CODE_USE_POWERSHELL_TOOL=0). brush reste candidat dès que le fix `-c -l` (#1398, d220c79d, main) est publié et #1359/#1317/#1295 corrigés. Snapshot niubash non mesuré ; ~/.bashrc actuel ≈ 6,5 Ko (NV).
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
- **brush main (aphrody-labs/brush e9d45efe, sync upstream 2026-11-12, contient le fix #1398 d220c79d)** : cross-compilé sur prd avec cargo-xwin 0.23.1 (clang-cl/lld, sans MinGW), installé dans `C:\Users\aphro\.local\share\brush-main\brush.exe`. `brush.exe -c -l 'echo ok'` → `ok` : l'invocation de Claude passe. shell-matrix : **31/34** (claude 9/9, posix 9/9, bash 11/12, windows 2/4), contre niubash 1.5.0 34/34. Échecs : `bash-procsub`, `win-cd-drive`, `win-cd-native`. Médiane 12,7 ms par cas, niubash 25,6 ms.

## Configuration partagée (2026-11-13)

Source unique `packages/machine/shells/env.toml` -> env.sh (bash, niubash, Git Bash, brush), env.ps1 (pwsh 7.7 / 5.1), env.nu, env.fish ; configs, manifeste, lock (`shells.lock.toml` : version, URL, sha256 amont, b3sum installé) ; `bun packages/machine/src/shells.ts --check` (inclus dans apply-user.ts). Flake home-manager `infra/fleet/nix` construit dans nixos/nix sur prd. Détails, valeurs bas niveau et démarrages : [SETUP.md](SETUP.md), [bash-setup.md](bash-setup.md), [pwsh-setup.md](pwsh-setup.md).

| Shell | Version (lock) | Source | Hôtes | Coût de l'env partagé |
|---|---|---|---|---|
| niubash | 1.5.0 (bash 5.3.20) | github unixwin/niubash | pc | +11 ms (22,0 -> 33,2) |
| Git Bash | 2.56.0.windows.4 (bash 5.3.15) | git-for-windows | pc (repli) | voir bash-setup.md |
| brush | 0.4.0 (+ main fork) | reubeno/brush, cargo | pc, prd | voir bash-setup.md |
| pwsh | 7.7.0 | PowerShell/PowerShell, MSIX | pc, fr1 (7.6.6) | voir pwsh-setup.md |
| nushell | 0.117.0 | nushell/nushell, MSI | pc, prd, fr1 ; fr2 0.116.1 | ~0 ms (env.nu + config.nu) |
| fish | 4.9.3 | fish-shell/fish-shell | prd | +5 ms (non interactif) |
| carapace | 1.8.2 | carapace-sh/carapace-bin, winget | pc | complétion ay/git/cargo/bun/just |
