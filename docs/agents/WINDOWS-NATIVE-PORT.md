# OpenClaw and Hermes Agent native on Windows

Measured on 2026-11-12 on the PC (Windows 11 Insider 28120, no WSL, no MSYS runtime for the agent's tools). The unified package packages/ai-os (merge of aphrody-labs/agent) carries this list forward.

Forks: aphrody-labs/openclaw and aphrody-labs/hermes-agent, branch `windows-native`, cloned in C:\src\third_party\ (ignored by src). Each fork has a CI job `windows-native.yml` on windows-latest.

## Starting point

Both upstreams already support native Windows: named pipes for IPC (Hermes `\\.\pipe\hermes-gateway-<hash>`), ConPTY and locks guarded by `sys.platform` or `process.platform`, `windows-footgun` lint on the Hermes side. The remaining gaps come from the choice of shell and a few `/bin/sh` probes.

## Hermes Agent (v0.22.7, commit 62ecf4d2)

| Windows failure                                                                                         | Patch                                                                                                                                  | Status                                       |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| Shell: `pm.shell.bash()` forces the staged bash of Git for Windows (MSYS). No way to force another bash | `HERMES_BASH` takes precedence over the staged bash; niubash candidate added (`%LOCALAPPDATA%\Programs\Niubash\winuxcmd\bin\bash.exe`) | OK, `bash()` returns niubash                 |
| Cron `.sh`: `shutil.which("bash")` can land on the System32 WSL stub                                    | goes through `pm.shell.bash()`                                                                                                         | OK, cron script run by bash 5.3.20 (niubash) |
| Elevated client: `client_elevated` refuses to launch the gateway from an admin session (agents, CI)     | opt-in `HERMES_ALLOW_ELEVATED_GATEWAY=1`, to be used with a dedicated `HERMES_HOME`                                                    | OK                                           |
| `uv sync --all-extras`: the `silk` extra (pilk) fails to compile natively                               | not patched; heavy native build, to be done on prd                                                                                     | open                                         |
| Race on lazy dependency installation (`anthropic`: "another Hermes process is installing")              | not patched; workaround: `hermes pm install` or `uv pip install anthropic`                                                             | open                                         |
| Test `test_run_job_no_agent_uses_configured_interpreter` failing, already present upstream              | none                                                                                                                                   | open (upstream)                              |
| AF_UNIX absent from CPython 3.14 on Windows                                                             | already handled upstream (named pipe)                                                                                                  | OK                                           |
| fcntl, killpg, pty                                                                                      | already guarded upstream (POSIX, msvcrt and ConPTY branches)                                                                           | OK                                           |

e2e verification (isolated HERMES_HOME, HERMES_BASH=niubash): terminal tool (file written), memory written then read back in a new session, skill `port-check` created by `skill_manage`, cron job `--script tick.sh --no-agent` launched with `cron run`: success.

## OpenClaw (2026.11.3, commit f75dc5e65)

| Windows failure                                                                                                                                                                                               | Patch                                                                                                                            | Status                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| The exec tool forces PowerShell (`getShellConfig`), while the machine forbids pwsh                                                                                                                            | `OPENCLAW_EXEC_SHELL=bash` selects a native bash; `OPENCLAW_BASH` forces its path (niubash); `detectRuntimeShell` reports `bash` | OK, unit tests (41/41 on Windows) |
| meeting-bot: the `command -v` probes go through `/bin/sh -lc`, so every command is seen as missing                                                                                                            | `where.exe /q` on win32 (runtime-setup, configured-node-host)                                                                    | OK, 362 meeting-bot tests pass    |
| `bun install` rewrites package.json (workspaces/overrides from pnpm-workspace.yaml) and resolves other versions than pnpm-lock, hence the tsdown failure (`getDefaultSocketTimeout` missing in @aws-sdk/core) | not patched; the source build is done with pnpm (CI); on the PC, the npm release is installed with `bun add openclaw`            | open (bun vs pnpm lockfile)       |
| launchd and systemd (`/bin/sh` in launchd-*.ts, hosted-stop-executor)                                                                                                                                         | none; macOS- and Linux-specific code                                                                                             | not applicable                    |
| `.sock` sockets (exec-approvals, mac-control)                                                                                                                                                                 | none; macOS-specific, Windows goes through the WebSocket gateway                                                                 | not applicable                    |
| Symlinks: only in test-support, with a junction on Windows                                                                                                                                                    | none                                                                                                                             | OK                                |

e2e verification (release 2026.11.3 via bun, isolated OPENCLAW_STATE_DIR): `onboard --non-interactive`. The unscoped API key requires `models.providers.anthropic.headers.anthropic-workspace-id`, which is a configuration matter, not a Windows one. `agent --local`: exec then writing MEMORY.md, read back in a new session (VALUE=ok). `gateway run`, then `cron add --every` and `cron run`: the file is written by the scheduled agent.

## Remaining work

- Build OpenClaw from source on the PC without pnpm: open.
- Propose the patches upstream (PR from `windows-native`).
- Run the forks' CI jobs and check that they pass.
