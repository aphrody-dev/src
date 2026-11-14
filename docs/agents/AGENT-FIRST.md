# Agent-first: operating model of src

State as of 2026-11-13. src is coded, reviewed, tested, fixed, deployed and maintained by agents, with no human in the loop. The owner steps in only to publish commercial drafts (queue `publish/`) and for actions that require their identity (UAC, OAuth).

## 1. Division of responsibilities

| Layer                                         | Owner                                                    | Content                                                                                                        |
| --------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Orchestration, routing, provider/model choice | `packages/ai-os` (session nt-d6)                         | dynamic workflows, automatic failover, model registry (relay `llm_models` / `llm_ask`, MCP `/mcp`, A2A `/a2a`) |
| Execution on hosts                            | `infra/agents/` (this document)                          | tmux sessions, systemd user units, Windows scheduled task, task queue, health, restart, logs                   |
| Judge                                         | `.github/workflows/judge.yml`, `ci.yml`, `ci-revert.yml` | verdict on every push to main, automatic revert                                                                |
| Single agent interface                        | `justfile`                                               | `check`, `fmt`, `lint`, `test`, `affected`, `test-affected`, `deploy`, `docker-*`, `agents*`                   |

The runner never chooses a provider: it runs what the task names, in the given order. With no name, it takes the answer of the relay `llm_models` (first model of each available provider, in relay order). No static chain exists in `infra/agents`.

## 2. Roles

| Role       | Inputs                                                   | Outputs                              | Judge                                                           | Hosts         |
| ---------- | -------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------- | ------------- |
| `coder`    | prompt, `cwd`, `commit.paths`                            | commit on main                       | the task's `check`, then `judge`/`ci`                           | fr1           |
| `reviewer` | sha or path                                              | report `results/<id>/`               | no human: LLM verdict (relay) or Gemini Carbon for deliverables | fr1, pc       |
| `tester`   | unit, `just test-affected`                               | tests + commit                       | `check` = `just` recipe                                         | fr1           |
| `linter`   | targeted `fmt`/`lint` recipe                             | formatting commit                    | `bun fmt --check <dir>`, `cargo clippy`                         | fr1           |
| `designer` | PRD, `DESIGN.md` (design-first gate of AGENTS.md)        | mockups, tokens                      | `wck` / Lighthouse                                              | fr1, pc       |
| `deployer` | `just deploy <target>`                                   | deployment                           | target health                                                   | prd           |
| `sre`      | health, logs, restarts; `ci-watch` creates `coder` tasks | light fix                            | green `judge`                                                   | prd, fr1, fr2 |
| `chromium` | Chromium/LLVM tasks                                      | builds                               | factory (`docs/native/CHROMIUM-FACTORY.md`)                            | fr1           |
| `build`    | images, artifacts, toolchains (`aphrody-heavy`)          | artifacts                            | `just` recipe                                                   | fr1           |
| `training` | training                                                 | models                               | evaluation                                                      | fr1           |
| `growth`   | templates `infra/agents/tasks/*`                         | drafts in `var/agents/publish/<id>/` | owner review                                                    | prd, pc       |

`growth` has `approval = "owner"` by default: the task ends `done`, its files are moved to `publish/<id>/` (`changes.patch`, `files/`, logs, `README.txt`) and the checkout is restored. Nothing is published, posted, sent or deployed; the owner publishes from that queue.

## 3. CLIs and SDKs (verified in the session)

context7, GitHub MCP and Microsoft Learn were unreachable (ENOTFOUND): versions come from the registries (`registry.npmjs.org/<pkg>/latest`, `pypi.org/pypi/<pkg>/json`, read from prd), from `--help` of the installed binaries and from `gh api`.

| Tool                                                 | Latest version (registry)                                                             | Installed                                                                            | Headless mode used by the runner                                                                                                                                                                              |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code `@anthropic-ai/claude-code`              | 2.1.323                                                                               | pc 2.1.322, fr1 2.1.322, prd 2.1.318, fr2 2.1.302                                    | `claude -p --permission-mode bypassPermissions --output-format json --max-turns 200 --max-budget-usd B [--model M]`, prompt on stdin; NHITL launcher `plugins/aphrody-nhitl/bin/claude-nhitl.ts` when present |
| Claude Agent SDK TS `@anthropic-ai/claude-agent-sdk` | 0.3.323                                                                               | consumed by ai-os                                                                    | –                                                                                                                                                                                                             |
| Claude Agent SDK Python `claude-agent-sdk`           | 0.2.181                                                                               | consumed by ai-os                                                                    | –                                                                                                                                                                                                             |
| Codex CLI `@openai/codex`                            | 0.167.2                                                                               | fr2 0.167.2, prd 0.166.0, fr1 0.162.1, pc 0.162.0-alpha.17.2                         | `codex exec --json --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox [-m M] -`                                                                                                                 |
| OpenCode `opencode-ai`                               | 1.19.5                                                                                | prd/fr1/fr2 1.19.5; pc `opencode v2.2.7` (another distribution, unresolved conflict) | `opencode run --format json [-m provider/model] <prompt>`                                                                                                                                                     |
| pi `@earendil-works/pi-coding-agent`                 | 1.5.2 (the former `@mariozechner/pi-coding-agent` 0.73.1 is marked deprecated by npm) | prd/fr1/fr2 1.5.2; absent from the pc                                                | `pi -p [--model M] <prompt>`                                                                                                                                                                                  |
| Antigravity `agy`                                    | –                                                                                     | pc 1.5.7, prd 1.4.12                                                                 | `agy -p <prompt> --output-format json --dangerously-skip-permissions [--model M]`; replaces Gemini CLI (`@google/gemini-cli` 0.68.0 exists but is legacy for ai-os)                                           |
| litellm (PyPI)                                       | 1.109.1                                                                               | not installed: routing lives in ai-os                                                | –                                                                                                                                                                                                             |
| tmux                                                 | –                                                                                     | prd 3.8, fr1/fr2 3.7b, pc psmux 3.4.0 (winget `arndawg.tmux-windows`)                | session `agents`                                                                                                                                                                                              |
| cloudflared                                          | –                                                                                     | fr1 2026.11.0, prd/fr2/pc 2026.10.7                                                  | tunnel `mig-prd`                                                                                                                                                                                              |
| Renovate `renovate`                                  | 44.236.5                                                                              | not used (see 7)                                                                     | –                                                                                                                                                                                                             |

Pitfalls found:

- Claude Code refuses `bypassPermissions` as root, and this safeguard is not bypassed: no runner runs as root (`runner.ts work` refuses uid 0, so does `install.sh`). On prd, the runner runs under the dedicated user `agent` (no sudo), created by `bootstrap-user.sh`. `install.sh` marks the checkout as trusted (`hasTrustDialogAccepted`) in `~/.claude.json`.
- Bun automatically loads the `.env` of the current directory: `C:\src\.env` contains an `ANTHROPIC_API_KEY` key not attached to a workspace, which took precedence over the claude.ai login (error 400). The runner, its units and the scheduled task run with `bun --no-env-file`, and the `ANTHROPIC_*`, `CLAUDECODE`, `CLAUDE_CODE_*` variables of the parent session are removed from the children's environment (`AGENTS_KEEP_ENV=1` to keep them).
- No shell between the runner and a CLI: on Windows, `.cmd` shims are resolved to their `.exe` by `resolveExe` (`packages/ai-os/src/llm/agents.ts`) and launched directly; an unresolvable shim is refused (the PC's `codex.cmd`, whose target cannot be found). Test: `bun test infra/agents` (prompt with `& | ^ % " < >`).
- psmux breaks double quotes in the window command: unquoted paths on Windows when they have no space.
- `~/.local/bin/codex` on fr2 was a link to another binary: the install checks `~/.bun/bin/<cli>`, and the runner puts `~/.bun/bin` at the front of PATH.
- Codex on the PC answers 401 (`codex login` to be redone by the owner, OAuth): the runner failed over to the next provider on its own.

## 4. Task queue (format v1)

One queue per host, in the runner's checkout: `var/agents/` (ignored by git). No server: JSON files and atomic `rename`, like maildir.

```
var/agents/queue/{tmp,new,claimed,done,failed}/<id>.json
var/agents/results/<id>/{result.json,<n>-<provider>.log,<n>-check.log}
var/agents/publish/<id>/            brouillons approval=owner
var/agents/state/{health.json,heartbeat-<role>,cooldown-<provider>,schedule-<name>}
var/agents/log.jsonl                expédié vers prd:/var/lib/aphrody-agents/logs/<hôte>.jsonl
```

Checkouts: prd `/home/agent/agents/src` (user `agent`), fr1 and fr2 `/home/ubuntu/agents/src`, PC `C:/src`.

```json
{
  "v": 1,
  "id": "...",
  "role": "coder",
  "host": "prd|fr1|fr2|pc|any",
  "prompt": "...",
  "providers": [
    "claude",
    "claude:<model>",
    "codex[:m]",
    "opencode[:provider/model]",
    "pi[:m]",
    "agy[:m]",
    "<fournisseur relais>/<modèle>"
  ],
  "cwd": "chemin relatif",
  "check": "commande, exit 0 = accepté",
  "commit": { "paths": ["préfixes"], "message": "..." },
  "approval": "none|owner",
  "timeout_s": 0,
  "budget_usd": 0,
  "max_attempts": 3,
  "created_by": "...",
  "created_at": "...",
  "attempts": [
    {
      "provider": "",
      "exit": 0,
      "reason": "ok|agent_error|provider_unavailable|check_failed",
      "started": "",
      "ended": "",
      "check_exit": 0
    }
  ]
}
```

Submission: write `queue/tmp/<id>.json` then rename it to `queue/new/<id>.json`, or `just agents enqueue --role R --prompt P [--host H] [--providers a,b] [--check C] [--paths p1,p2] [--message M] [--template NAME]` (remote host: ssh, see 6).

Transitions: `new` -> `claimed/<id>@<host>.<pid>.json` (the rename designates a single winner) -> `done` | `failed` | back to `new` when every attempt failed for unavailability. A provider that answers 429, quota, credit, 401/403/5xx or "not logged in" goes into a 15 min cooldown and the task continues on the next one. Each provider gets one self-correction round: the output of the failing `check` is sent back to it. Tasks claimed by a dead worker are put back in `new` by the health check.

Commit: only the files modified by the task (`git status` difference before/after) under `commit.paths` (`""` = everything), trailers `Agent-Task`, `Agent-Role`, `Agent-Provider`, `Agent-Host`, `git push origin HEAD:main` with `--autostash` rebase and three attempts.

Budgets: `budget_usd` per role (`fleet.toml`) passed to Claude's `--max-budget-usd`; the other CLIs are bounded by `timeout_s`. Per-provider caps (quotas, global cost) belong to ai-os.

## 5. Runner per host

- `infra/agents/runner.ts` (Bun, no dependency): `up`, `work <role>`, `health`, `enqueue`, `status`.
- `infra/agents/fleet.toml`: roles per host, timeouts, budgets, ssh targets, scheduling, collection host.
- Linux (`just agents-install <host>` = `ssh <host> 'sh -s' < infra/agents/install.sh`; for prd, first `bootstrap-user.sh` as root then `install.sh` as `agent@prd`; idempotent, also called by `infra/fleet/bootstrap/*.sh`): blobless clone of main, `pre-push` hook that refuses force-push and deletion, CLIs via `bun add -g`, user units `aphrody-agents.service` (tmux session `agents`, one window per role, restart loop), `aphrody-agents-health.timer` (2 min: repairs windows, revives workers without a heartbeat for 120 s, requeues orphans, probes CLIs, ships logs, `ci-watch`, scheduling), `aphrody-agents-pull.timer` (10 min, fast-forward). Linger enabled.
- PC (`just agents-install-pc`): scheduled tasks `\Aphrody\AgentsHealth` (5 min) and `\Aphrody\AgentsLogon`, `conhost.exe --headless bun --no-env-file runner.ts health`, psmux session `agents`. No admin rights.
- Logs: a single destination, `prd:/var/lib/aphrody-agents/logs/<host>.jsonl` (offset per host in `state/ship-offset`).
- Scheduling (`[schedule]`, enqueued by prd): `deps-update`, `release-notes`, `seo-check` every week. The product pages (`product-page-shenron`, `product-page-rosegriffon`) run on demand: `just agents enqueue --template product-page-shenron`.

Placement (2026-11-13, owner decision): the `heavy = true` roles of `fleet.toml` (`coder tester linter build chromium training`) run only on fr1, enforced by `runner.ts` at enqueue and at claim; prd keeps only `deployer sre growth`, fr2 `sre`, pc `reviewer designer growth`. A task submitted on a host that does not take it (red CI, alerts, reviews received by prd) is forwarded by `health` (`route()`), local copy in `done/<id>@fwd-<host>.json`. `ci-fix-*` and security alerts are `coder` tasks.

## 6. Host access (tunnels)

| Path                                                                  | Use                                                                           | Test of 2026-11-13                                                                                                               |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| public ssh, aliases `prd`/`fr1`/`fr2` from the PC (keys only)         | PC -> runners: `just agents-attach prd`, `just agents status`, remote enqueue | OK (installs, enqueue PC -> prd)                                                                                                 |
| WireGuard 10.200.77.0/24 (fr1 .1, fr2 .3, prd .5)                     | VPS -> VPS: log shipping, enqueue                                             | OK: fr1 and fr2 -> `root@10.200.77.5`; ping PC -> .1/.5 OK, but mesh port 22 is closed from the PC (timeout), as per the RUNBOOK |
| Cloudflare tunnel `mig-prd` + Access for Infrastructure `mig-prd-ssh` | ssh prd without public IP                                                     | tunnel ready (`/ready`: 4 connections); unusable until WARP is installed on the PC (UAC, owner)                                  |

Each host declares its targets in `fleet.toml` (`ssh = [alias, WireGuard IP, public IP]`), tried in order. Nothing is exposed publicly: neither tmux nor the queue listens on the network.

## 7. CI judge, main without PRs, rollback

- Direct push to main. GitHub ruleset `main-no-rewrite` (id 27169448): forbids force-push and deletion of main, allows direct pushes.
- `judge.yml` (GitHub-hosted runner): fast verdict on every push (checkdeps, identity, runner, `go test` of infra). `ci.yml` keeps the heavy builds on the `fr1` runner, stopped on purpose (`docs/infra/FLEET.md`): its runs stay cancelled until it is reinstalled.
- `ci-revert.yml`: when `judge` or `ci` fails on a commit whose parent was green, the commit is reverted on main (one-line equivalent: `git revert --no-edit <sha> && git push origin HEAD:main`). Ignored: reverts and commits marked `[no-revert]`.
- `ci-watch` (prd): a red CI that cannot be attributed yields an `sre` task `ci-fix-<sha>` (only one open at a time).
- Dependencies: no Renovate, which needs branches and PRs (excluded). The weekly task `deps-update` applies `just deps-bump` / `just deps-lock` (ay lock) within the bounds, verifies, commits on main; the judge and the revert do the rest.

## 8. End-to-end tests (2026-11-13)

| Host | Task                                                                                            | Run                                                                                                                       | Result            |
| ---- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| prd  | `smoke-prd-lint-epic-fmt` (linter, `bun fmt` of `packages/epic-games`, check `bun fmt --check`) | claude refused (root) -> failover to codex -> green check -> commit. The prd runner was then moved under the user `agent` | `0c8f6e4` on main |
| pc   | `smoke-pc-lint-gds-fmt` (coder, `bun fmt` of `packages/google-design`)                          | 1st attempt: 400 (`.env` key) -> cooldown + requeue; after `--no-env-file`: claude -> green check -> commit               | `82215ad` on main |

## 9. Runner credentials (no human, except the final click)

Rule: no value in the repository, the logs, argv or the units. On Linux, each long-lived credential is encrypted by `systemd-creds --user` in `~/.config/credstore.encrypted/<NAME>` of the runner's user (same storage as `ay secret`, docs/infra/AUTH.md). `runner.ts` decrypts it and puts it only in the environment of the CLIs it launches. Names read: `CLAUDE_CODE_OAUTH_TOKEN`, `GH_TOKEN`.

| Credential                | prd state (`agent`)                                                                   | How                                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GH_TOKEN` (push to main) | done, verified: `gh auth status` OK (GH_TOKEN), `git push --dry-run` OK               | `gh auth token` (root, prd) passed on stdin to `systemd-creds --user encrypt`; the git helper is `gh auth git-credential`                                   |
| Claude Code               | done (2026-11-13): `claude -p` OK                                                     | `claude setup-token` token from the PC (DPAPI vault `CLAUDE_CODE_OAUTH_TOKEN`) on stdin of `systemd-creds --user encrypt`; flow: `ai-os nhitl login claude` |
| Codex                     | done (2026-11-13): `codex login status` = ChatGPT                                     | `ai-os nhitl login codex --hosts prd`: `codex login --device-auth` in tmux, device code written to `<RELAY_HOME>/device-code.txt`, validated by the owner   |
| fr2 (`ubuntu`)            | Claude done (same token, `claude -p` OK); the installed `codex` is not the OpenAI CLI | install `@openai/codex`, then `ai-os nhitl login codex --hosts fr2`                                                                                         |
| PC                        | `codex.cmd` points to a `codex.exe` that cannot be found, Codex answers 401           | `codex login` on the PC (and reinstall Codex if the binary is missing)                                                                                      |

## 10. Remaining work (out of the agents' reach)

- Points still open: `just nhitl list --status open` (NHITL index, `var/agents/nhitl.sqlite`).
- WARP on the PC (UAC) for the Cloudflare path; `codex login` on the PC.
- Reinstall a GitHub runner for `ci.yml` (prd too loaded according to FLEET.md) or port its steps to `judge.yml`.
- Scheduled templates without `providers`: `deps-update` ends in `no_cli_provider` as long as ai-os does not name a coding CLI (or does not take over scheduling); `release-notes` and `seo-check` go through the relay.
