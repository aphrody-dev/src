# unixwin dans src

L'écosystème unixwin (org GitHub `unixwin`, site https://unixwin.dev) est intégré à src comme projet maison.
On y trouve un bash natif Windows en Rust, ses coreutils, son git MSVC, son gestionnaire de paquets et son
cadre de plugins. Inventaire relevé en direct le 2026-11-13 (`gh api "orgs/unixwin/repos?per_page=100"`,
WebFetch du site).

| Document | Contenu |
|---|---|
| [SITE.md](SITE.md) | index structuré du site unixwin.dev (produits, docs, agents, benchmarks, changelog), avec les sources |
| [DEDUP.md](DEDUP.md) | décisions de déduplication avec ce que src possède déjà : quel composant fait autorité |
| [DEPS.md](DEPS.md) | dépendances des dépôts unixwin, alignées sur [docs/deps/POLICY.md](../deps/POLICY.md) |
| [BUILD.md](BUILD.md) | chaîne de build et d'installation depuis les forks (prd ou CI du fork), recettes `just unixwin-*` |
| [LEARNINGS.md](LEARNINGS.md) | défauts trouvés par la suite de bout en bout, correctifs et contournements |

## Dépôts (2026-11-13)

Taille en Kio (`size` de l'API GitHub), date du dernier push. Aucun dépôt n'est archivé.

| Dépôt amont | Langage, licence | Push | Taille | Fork aphrody-labs | Emplacement dans src | Rôle |
|---|---|---|---|---|---|---|
| niubash | Rust, MIT | 2026-11-12 | 30362 | niubash (repli `/src`, build croisé, CI `aphrody build`) | `third_party/niubash` | shell `niu` : REPL, plugins, installateur, Windows Terminal |
| rubash | Rust, MIT | 2026-11-13 | 35807 | rubash (correctifs : repli `/src`, `pwd -W`, glob à préfixe Windows) | `third_party/rubash` | moteur bash 5.3 embarquable, translation des chemins |
| WinuxCmd | C++23, MIT | 2026-11-13 | 58336 | WinuxCmd (à jour) | `third_party/WinuxCmd` | 176 commandes Unix multicall, wpm intégré, pilote Rust `rust2/` |
| niu-git | Python (build), GPL-2.0 | 2026-10-28 | 211 | niu-git | `third_party/niu-git` | git for Windows construit MSVC + CMake + schannel, 6 patchs |
| ruline | Rust, MIT | 2026-11-11 | 3561 | ruline | `third_party/ruline` | éditeur de ligne compatible readline (dérivé de reedline) |
| oh-my-niu | Python, aucune | 2026-11-02 | 556 | oh-my-niu | `third_party/oh-my-niu` | cadre de plugins et thèmes de niubash |
| shellbench | Python, aucune | 2026-11-10 | 304 | shellbench | `third_party/shellbench` | banc de performance des shells bash |
| diffcorpus | Python, MIT | 2026-11-05 | 94 | diffcorpus | `third_party/diffcorpus` | 306 cas différentiels contre GNU bash 5.3.20 |
| wpm-source | PowerShell, aucune | 2026-11-08 | 402 | wpm-source | `third_party/wpm-source` | index wpm (`index.json` schéma 1, 289 paquets au 2026-11-08) |
| wpm-artifacts | Shell, aucune | 2026-10-19 | 22 | wpm-artifacts | `third_party/wpm-artifacts` | miroirs et rempaquetage d'artefacts portables (sha256) |
| winuxcmd-i18n | PowerShell, aucune | 2026-11-09 | 270 | winuxcmd-i18n | `third_party/winuxcmd-i18n` | catalogues de langue de WinuxCmd |
| winuxsh-profiles | Shell, aucune | 2026-08-12 | 7 | winuxsh-profiles | `third_party/winuxsh-profiles` | profils d'exemple et préréglages wpm |
| .github | aucune | 2026-10-25 | 12 | unixwin-github (nom réservé) | `third_party/unixwin-github` | profil de l'org |
| apt | Go Template, aucune | 2026-11-06 | 36316 | unixwin-apt (« apt » trop générique) | `third_party/unixwin-apt` (sparse : `.github`, `conf`, `meta`) | archive APT signée, hors chaîne (POLICY : jamais apt) |
| unixwin.dev | Astro, MIT | 2026-11-04 | 3391 | unixwin.dev | `apps/unixwin/upstream/unixwin.dev` | site du portail (sources des docs indexées) |
| wpm-gui | Svelte + Tauri, MIT | 2026-10-10 | 76 | wpm-gui | `apps/unixwin/upstream/wpm-gui` | GUI de wpm, expérience abandonnée en amont |
| codex | Rust, Apache-2.0 (fork d'openai/codex) | 2026-10-25 | 693685 | réseau déjà forké (`aphrody-dev/codex`) | remote `unixwin` de `third_party/codex` | branches `niu-latest`, `niu-first-class-shell` : `ShellType::Niu` |

Rangement : code et données dans `third_party/<nom>` (non versionnés, épinglés dans `src.lock.json`,
liste dans `packages/machine/src/forks.ts`) ; site et GUI dans `apps/unixwin/upstream/` (même régime, ignorés
par `apps/unixwin/.gitignore`) ; suite de tests dans `apps/unixwin/tests/` ; pilote dans `scripts/unixwin/` ;
scripts de build distants dans `infra/unixwin/` ; documentation ici.
