# unixwin.dev : index structuré

Relevé par WebFetch le 2026-11-13. Le site est un portail Astro (MIT) ; ses sources sont dans
`apps/unixwin/upstream/unixwin.dev` (fork `aphrody-labs/unixwin.dev` @ bfacdea). Ce qui suit résume le contenu
publié, sans le recopier. Les chiffres sont ceux que le projet publie lui-même ; ceux que src a vérifiés sur ce
poste sont dans [LEARNINGS.md](LEARNINGS.md). Selon le site, les notes de version sont traduites du chinois.

## Pages

| Page                                                       | Source dans le dépôt du site                                                   | Contenu                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------- |
| https://unixwin.dev/en/                                    | `src/pages/en/index.astro`                                                     | six produits, installation, actualités       |
| /en/docs/                                                  | `src/pages/en/docs/index.astro`                                                | entrée de la doc                             |
| /en/docs/cli/                                              | `src/pages/en/docs/cli/index.astro`                                            | référence de la CLI `niu` et de `wpm`        |
| /en/docs/execution-model/                                  | `src/pages/en/docs/execution-model/index.astro`                                | modèle d'exécution sans `fork()`             |
| /en/docs/paths-and-msys/                                   | `src/pages/en/docs/paths-and-msys/index.astro`                                 | dialectes de chemins, persona MSYS           |
| /en/docs/performance-model/                                | `src/pages/en/docs/performance-model/index.astro`                              | modèle de coût, mesures                      |
| /en/docs/compatibility/                                    | `src/pages/en/docs/compatibility/index.astro`                                  | compatibilité GNU bash 5.3, plateformes      |
| /en/benchmarks/                                            | `src/pages/en/benchmarks/index.astro`, `data/bench/` (16 fichiers)             | méthodologie et tableaux                     |
| /en/ai/, /en/agents/                                       | `src/pages/en/ai/`, `src/data/agents.json`                                     | branchement des agents IA                    |
| /en/changelog/                                             | `src/data/changelogs.json` (tiré de GitHub par `scripts/fetch-changelogs.mjs`) | versions                                     |
| /products/{niubash,winuxcmd,rubash,niu-git,wpm,oh-my-niu}/ | `src/pages/en/products/*`                                                      | fiches produit                               |
| /llms.txt, /agents.md                                      | `src/pages/llms.txt.ts`, `src/pages/agents.md.ts`                              | index pour machines                          |
| /install.ps1                                               | `public/install.ps1`                                                           | installateur PowerShell (`irm ... \| iex`)   |
| https://unixwin.github.io/niubash/                         | `third_party/niubash/docs`                                                     | doc de niubash (contrat des chemins, agents) |

## Produits (versions au 2026-11-13)

| Produit   | Dernière version   | Ce que publie le site                                                                                                                                                                                                                                                                   |
| --------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| niubash   | 1.5.0 (2026-11-03) | bash réel pour Windows, Linux, macOS, Android ; 83/83 suites GNU bash 5.3, dont 82 identiques à l'octet ; `( )` et `$( )` sans processus ; installation par winget (`Unixwin.Niubash`) ou `install.ps1` ; 1.5.0 apporte un débogueur (`niu --debug`, `--dap`) et supprime `config.toml` |
| rubash    | 1.5.0 (2026-11-03) | moteur bash 5.3 embarquable (`cargo add rubash`), bêta ; profileur `--profile`                                                                                                                                                                                                          |
| WinuxCmd  | 1.2.1 (2026-11-02) | binaire Win32 unique d'environ 3,79 Mo ; 176 commandes et 1 924 options ; démarrage à froid d'environ 19 ms ; C++23, VS 2022 + CMake + Ninja, PGO ; 165 cas différentiels sur 178 identiques à GNU coreutils 9.7                                                                        |
| niu-git   | v2.56.0.3          | git for Windows (2.56.0.windows.4) compilé MSVC + CMake + vcpkg, TLS schannel ; `git --version` en 13,7 ms contre 45 à 103 ms pour Git Bash ; sans send-email, svn, cvs, git-gui, gitk ni `grep -P`                                                                                     |
| wpm       | intégré à WinuxCmd | `winuxcmd wpm`, 16 sous-commandes ; index `official-2026.11.02` de 282 paquets (289 dans le clone du 2026-11-08) ; sha256 obligatoire, cache `<pkg>-<version>-<sha8>`, liens durs ; 4 miroirs par priorité                                                                              |
| oh-my-niu | 2.1.0 (2026-11-02) | cadre façon Oh My Zsh au corps bash ; 27 thèmes, 23 plugins, 174 complétions TOML ; `prompt-core` ; installation par clone dans `~/.niubash/oh-my-niu`                                                                                                                                  |

## Documentation technique (résumé)

- **Exécution** (`execution-model`) : trois niveaux. (1) Les sous-shells `( )` et `$( )` clonent l'état du
  shell (`ShellState::clone`), sans processus. (2) Une table de descripteurs garde des `HANDLE` Windows
  (`DuplicateHandle`, offsets partagés). (3) Les vrais processus n'apparaissent qu'aux frontières :
  `CreateProcess`, tubes, jobs en arrière-plan, Job Objects pour le contrôle des jobs. 62 builtins en
  processus, des chemins rapides (`sleep`, `dirname`, `basename`, `uname`), 12 commandes de fichiers inlinées,
  et des bras de pipeline inline (`head`, `cat`, `sed`, `grep`, `wc`, `tr`, etc.) ; `echo | cat` ne crée aucun
  processus.
- **Chemins** (`paths-and-msys`) : quatre dialectes (`C:\`, `/d/...`, `/mnt/d/...`, `/cygdrive/d/...`)
  ramenés au chemin Windows natif par une table, sans heuristique (rubash#600). Les données (motifs grep/sed,
  messages de commit, opérandes entre guillemets) passent telles quelles. `$PWD` reste en forme POSIX.
  Persona MSYS (`uname -s` = `MSYS_NT-...`, `OSTYPE=msys`) sans runtime MSYS. Réglages :
  `__RUBASH_ARGV_DIALECT=legacy`, `RUBASH_IDENTITY=native`. Pas de `MSYS_NO_PATHCONV`.
- **Performance** (`performance-model`, `benchmarks`) : niubash est plus rapide là où bash doit créer un
  processus et pas lui, à égalité ailleurs. Windows, 2026-10-18 (Xeon w5-3435, 750 itérations) : 8 charges
  sur 8 plus rapides que Git Bash (spawn ×750 : 1 696 ms contre 2 119 ms). Linux, 2026-10-28 :
  `niu -c true` en 4,14 ms contre 2,67 ms pour GNU bash, donc bash est plus rapide. Android : démarrage
  2,5 fois plus lent. Installation d'environ 16 Mo sans DLL, contre 440 Mo pour Git Bash.
- **Compatibilité** (`compatibility`) : 83 suites GNU, 9 écarts liés à l'environnement ramenés à zéro par
  audit, modernish 166/166, bash-completion 452/452, git-completion 140/140, `t/test-lib.sh` de git.
  Plateformes officielles : Windows x64/arm64, Linux x86_64/aarch64, macOS, Android. musl et OpenHarmony
  sont seulement vérifiés à la compilation.
- **CLI** (`docs/cli`) : `niu -c` (sans rc), `niu -C` (avec rc et hooks), `--encoded-command`, `--cwd-state`,
  `niu setup`, `niu doctor`, `niu font`, `--install-wt-profile [--set-default]`, `--self-update [--check]`,
  `niu plugin add|list|enable|disable|update|sync|restore|rollback|clean|discover|source|recipe|distro|mirror|ui`,
  `niu skill install --target claude|zcode|cursor|all|<dir>`. Variables : `NIU_ENV`, `BASH_ENV`, `NIU_LANG`.
  Fichiers : `~/.niubashrc` (bloc géré `# >>> niu source`), `~/.niubash/sources/<id>`.
- **Agents** (`ai`, `agents`) : quatre mécanismes de détection du shell (`$SHELL`, configuration propre de
  l'agent, sonde `C:\Program Files\Git\bin\bash.exe`, recherche par nom). 24 agents catalogués, dont 15
  fonctionnent sans réglage. Claude Code passe par la sonde ou `CLAUDE_CODE_GIT_BASH_PATH`. Le fork Codex
  d'unixwin détecte `ShellType::Niu`. Zed : `terminal.shell.program`. Goose : `GOOSE_SHELL`. Cursor CLI,
  Gemini CLI et Aider sont bloqués (PowerShell en dur). Vérification : `echo "SHELL=$SHELL"; uname -s`,
  qui doit commencer par `MSYS_NT`.

## Changelog (15 dernières entrées, /en/changelog/)

niubash 1.5.0 (2026-11-03), rubash 1.5.0 (2026-11-03), oh-my-niu 2.1.0 (2026-11-02), WinuxCmd 1.2.1
(2026-11-02), WinuxCmd 1.2.0 (2026-11-01 : plus de liens d'entrée pour `[`, `env`, `false`, `kill`, `test`,
`time`, `true`), niubash 1.4.4, rubash 1.4.3, WinuxCmd 1.1.20 (2026-10-22), niubash 1.4.3, rubash 1.4.2
(2026-10-21), oh-my-niu 1.0.1 et 1.0.0 (2026-07/08), niu-git v2.56.0.3 à .1 (sans notes).

## Données et recherches publiées

- `data/bench/` du site : TSV bruts (`results*.tsv`, `startup.tsv`, `gnu.tsv`, `rubash.tsv`), `run_bench.sh`,
  et trois enquêtes (`bgwait-investigation-20261018.md`, `nvm-hang-verify-20261012.md`,
  `unix-spawn-cost-20261012.md`).
- `third_party/shellbench` : corpus et méthode du banc (`bench.py`, `DESIGN.md`, `results/` : référence GNU
  et rubash du 2026-10-25, `gap-v1.md`, `FFI-ROUND1-2026-10-29.md`).
- `third_party/diffcorpus` : 306 cas sur 29 domaines, oracle GNU bash 5.3.20, `REPORT.md` (en chinois) ;
  `results-rubash.json` : 306/306.
- `third_party/WinuxCmd/rust2` : pilote 2.0 qui transforme les commandes en bibliothèque (15 applets en Rust
  std seul, ABI C `winuxcmd_run`, porte différentielle à trois voies).
