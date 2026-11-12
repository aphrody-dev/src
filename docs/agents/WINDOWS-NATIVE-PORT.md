# OpenClaw et Hermes Agent en natif Windows

Mesuré le 2026-11-12 sur le PC (Windows 11 Insider 28120, sans WSL, sans runtime MSYS pour les outils de l'agent). Le dépôt unifié aphrody-labs/agent reprend cette liste.

Forks : aphrody-labs/openclaw et aphrody-labs/hermes-agent, branche `windows-native`, clonés dans C:\src\third_party\ (ignorés par src). Chaque fork a un job CI `windows-native.yml` sur windows-latest.

## Constat de départ

Les deux upstreams supportent déjà Windows natif : named pipes pour les IPC (Hermes `\\.\pipe\hermes-gateway-<hash>`), ConPTY et verrous gardés par `sys.platform` ou `process.platform`, lint `windows-footgun` côté Hermes. Les écarts restants viennent du choix du shell et de quelques sondes `/bin/sh`.

## Hermes Agent (v0.22.7, commit 62ecf4d2)

| Échec Windows | Patch | Statut |
|---|---|---|
| Shell : `pm.shell.bash()` impose le bash staged de Git for Windows (MSYS). Aucun moyen d'imposer un autre bash | `HERMES_BASH` passe avant le bash staged ; candidat niubash ajouté (`%LOCALAPPDATA%\Programs\Niubash\winuxcmd\bin\bash.exe`) | OK, `bash()` renvoie niubash |
| Cron `.sh` : `shutil.which("bash")` peut tomber sur le stub WSL de System32 | passe par `pm.shell.bash()` | OK, script cron exécuté par bash 5.3.20 (niubash) |
| Client élevé : `client_elevated` refuse de lancer le gateway depuis une session admin (agents, CI) | opt-in `HERMES_ALLOW_ELEVATED_GATEWAY=1`, à utiliser avec un `HERMES_HOME` dédié | OK |
| `uv sync --all-extras` : l'extra `silk` (pilk) échoue à la compilation native | non patché ; build natif lourd, à faire sur prd | ouvert |
| Course sur l'installation paresseuse des dépendances (`anthropic` : « another Hermes process is installing ») | non patché ; contournement : `hermes pm install` ou `uv pip install anthropic` | ouvert |
| Test `test_run_job_no_agent_uses_configured_interpreter` en échec, déjà présent sur upstream | aucun | ouvert (upstream) |
| AF_UNIX absent de CPython 3.14 sous Windows | déjà géré upstream (named pipe) | OK |
| fcntl, killpg, pty | déjà gardés upstream (branches POSIX, msvcrt et ConPTY) | OK |

Vérification e2e (HERMES_HOME isolé, HERMES_BASH=niubash) : outil terminal (fichier écrit), mémoire écrite puis relue dans une nouvelle session, skill `port-check` créée par `skill_manage`, job cron `--script tick.sh --no-agent` lancé avec `cron run` : succès.

## OpenClaw (2026.11.3, commit f75dc5e65)

| Échec Windows | Patch | Statut |
|---|---|---|
| L'outil exec impose PowerShell (`getShellConfig`), alors que la machine interdit pwsh | `OPENCLAW_EXEC_SHELL=bash` sélectionne un bash natif ; `OPENCLAW_BASH` force son chemin (niubash) ; `detectRuntimeShell` annonce `bash` | OK, tests unitaires (41/41 sous Windows) |
| meeting-bot : les sondes `command -v` passent par `/bin/sh -lc`, donc toute commande est vue absente | `where.exe /q` sous win32 (runtime-setup, configured-node-host) | OK, 362 tests meeting-bot passent |
| `bun install` réécrit package.json (workspaces/overrides depuis pnpm-workspace.yaml) et résout d'autres versions que pnpm-lock, d'où l'échec de tsdown (`getDefaultSocketTimeout` manquant dans @aws-sdk/core) | non patché ; le build source se fait avec pnpm (CI) ; sur le PC, la release npm s'installe avec `bun add openclaw` | ouvert (bun vs lockfile pnpm) |
| launchd et systemd (`/bin/sh` dans launchd-*.ts, hosted-stop-executor) | aucun ; code propre à macOS et Linux | sans objet |
| Sockets `.sock` (exec-approvals, mac-control) | aucun ; propres à macOS, Windows passe par le gateway WebSocket | sans objet |
| Symlinks : seulement dans des test-support, avec junction sous Windows | aucun | OK |

Vérification e2e (release 2026.11.3 via bun, OPENCLAW_STATE_DIR isolé) : `onboard --non-interactive`. La clé API non scopée exige `models.providers.anthropic.headers.anthropic-workspace-id`, ce qui relève de la configuration et non de Windows. `agent --local` : exec puis écriture de MEMORY.md, relu dans une nouvelle session (VALUE=ok). `gateway run`, puis `cron add --every` et `cron run` : le fichier est écrit par l'agent planifié.

## Reste à faire

- Build OpenClaw depuis la source sur le PC sans pnpm : ouvert.
- Proposer les patchs upstream (PR depuis `windows-native`).
- Lancer les jobs CI des forks et contrôler qu'ils passent.
