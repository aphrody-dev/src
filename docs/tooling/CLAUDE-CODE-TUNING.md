# Claude Code tuning (PC, 2026-11-14)

Reproducible through `just agents-sync` (`infra/agents/toolchain.toml`, applier `packages/machine/src/toolchain.ts`); `just agents-sync --check` reports drift. Documented facts come from https://code.claude.com/docs/en/ (skills, settings, env-vars, statusline, hooks, memory), read 2026-11-14.

## Versioned state

| What                                                                      | Source in src                                   | Applied to                                                                              |
| ------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------- |
| Global instructions                                                       | `infra/agents/claude/CLAUDE.md`                 | `~/.claude/CLAUDE.md` (copy)                                                            |
| Output style "Autonome"                                                   | `infra/agents/claude/output-styles/autonome.md` | `~/.claude/output-styles/` (copy)                                                       |
| Managed settings keys (env, hooks, status line, permissions, attribution) | `infra/agents/claude/settings.json`             | `~/.claude/settings.json` (deep merge; model, effort, fast mode and plugins stay local) |
| Plugins, marketplaces, MCP servers                                        | `infra/agents/toolchain.toml`                   | `claude plugin`, `claude mcp`                                                           |
| Claude Desktop MCP                                                        | `[[mcpfile]] claude-desktop`                    | relay over stdio only (no API key in the file)                                          |
| Claude Code version                                                       | `claude update` at every sync                   | auto-update is off because `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set            |

## Context

- MCP declared in Claude Code: `relay` (`/mcp/core`, 73 tools), `cloudflare`, `cloudflare-docs`. `rea` (255 tools), `agent-desktop` (67), `agent-browser` (33) are hub-only (`[[hub.mcp]]`, relay `hub.json`) and reached through `hub_tools` / `hub_call`; `vercel` (230 tools, team blocked) removed. About 585 tool names no longer enter each session.
- Workshop plugins (`plugin-dev`, `mcp-server-dev`, `skill-creator`) installed but disabled; `claude plugin enable <id>` when needed.
- Skills also hidden from the listing: 10 `replica-*` (entry `replica-recon`), 7 `steam-*` (entry `steam-web-api`).
- Output style: one style, `Autonome` (French, 3 lines, no questions, finish the task, parallel and native tools), for user and project; the project no longer overrides it with the built-in `Proactive`.
- Status line: 22 ms per run (average of 5; `bun -e 0` alone is 14 ms), left as is. PostToolUse hook: the shell now tests for `git commit` before starting bun, 38 ms -> 23 ms per Bash call (average of 5), and bun no longer loads the relay server module on every call.
- Skills: 141 -> 129 by merging overlaps; 36 `android-*` skills carry `disable-model-invocation: true` (about 30 000 characters of descriptions out of every session; `android-cli` lists them).
- 5 marketplaces without an installed plugin removed; 8 project-scope plugins removed.
- `MEMORY.md`: 6.7 KB, 47 lines (limit loaded per session: 200 lines or 25 KB).
- `BASH_MAX_OUTPUT_LENGTH=12000` (default 30000), `MAX_MCP_OUTPUT_TOKENS=8000` (default 25000).

## Effect on a fresh session

Measured with `claude -p "Reply with the single word: ok" --output-format json` in `C:\\src` (Claude Code 2.1.325), tokens = input + cache creation + cache read of the single turn.

| Configuration | Baseline context | Turn latency |
|---|---|---|
| Previous MCP servers (rea, vercel, agent-desktop, agent-browser) and the three workshop plugins restored by flags | 48 408 tokens | 1.1 to 1.3 s |
| Current | 39065 tokens | 1.3 to 1.4 s |
| Current, with the four unused built-in tools denied | 36 446 tokens | 1.3 s |

The "previous" row understates the old state: the 59 skills now hidden from the listing could not be restored by a flag. Latency of a turn did not change; the gain is context, not speed.

Where the current baseline goes (same command, flags as noted): 30 158 tokens with no MCP and outside the repo (built-in prompt, tools, global files: not reducible by configuration); skills listing about 6 000 (76 visible skills, 19 799 characters of descriptions before the last six were hidden); MCP about 1 250; project instruction files about 1 700.

Built-in tools are part of the 30 158-token floor, and a tool listed in `permissions.deny` leaves the context. Measured cost per tool (same command, `--disallowedTools <tool>`): `Workflow` 1 951 tokens, `ScheduleWakeup` 1 820, `ReportFindings` 821, `NotebookEdit` 8, `AskUserQuestion` 0 in print mode (it is only offered interactively). Denied in the managed settings: `AskUserQuestion` (no-question rule), `ScheduleWakeup` (self-paced `/loop` only), `ReportFindings`, `NotebookEdit`. `Workflow` is kept: `/gemini-review` runs through it.

Hiding the last six skills left the baseline unchanged (39 062 then 39 065 tokens): the skills listing fills a fixed budget, so hiding skills past that point frees room for the descriptions of the remaining ones instead of lowering the token count.

## Live settings checked against the documentation

| Fact (https://code.claude.com/docs/en/ settings, env-vars, hooks, statusline) | Value in `~/.claude/settings.json` |
|---|---|
| permissions.defaultMode in user settings (only place bypassPermissions applies) | `bypassPermissions` |
| skipDangerousModePermissionPrompt | `true` |
| attribution (replaces includeCoAuthoredBy) | `{"commit":"","pr":""} / deprecated key present: false` |
| BASH_MAX_OUTPUT_LENGTH (default 30000) | `12000` |
| MAX_MCP_OUTPUT_TOKENS (default 25000) | `8000` |
| CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC (auto-update off, done by sync) | `1` |
| ENABLE_TOOL_SEARCH (default on, must be unset) | `unset` |
| statusLine.refreshInterval (unset = event driven) | `unset` |
| PostToolUse hook async | `true` |
| spinnerTipsEnabled | `false` |
| outputStyle user / project | `Autonome / Autonome` |

## Left in place, on purpose

- `%APPDATA%/Claude/vm_bundles` (9.3 GB): the Cowork VM image of Claude Desktop, which is enabled on this PC; deleting it forces a new 9 GB download.
- Claude Desktop was not restarted (two of its Claude Code sessions were running); the relay stdio command written to its config was run by hand and lists 682 tools. Desktop reads it at its next start.

## Measurements

| Item                                         | Value                                                                                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `claude.exe` 2.1.325                         | 367 MB single file, Bun v1.4.4 runtime embedded                                                |
| One CLI session (this one, long)             | 862 MB working set; a second session 566 MB                                                    |
| Claude Desktop                               | 10 processes, about 1.7 GB working set; `vm_bundles` 9.3 GB on disk (Cowork VM, left in place) |
| `node.exe` (one `rea` MCP server per client) | 10 processes, 842 MB                                                                           |
| Status line script                           | 50 ms per run (runs on each assistant message, 300 ms debounce)                                |
| PostToolUse hook (async)                     | 62 ms, never blocks the tool                                                                   |
| `du -sh` vs `dua` on `~/.claude/plugins`     | 1994 ms vs 133 ms                                                                              |

## Disk reclaimed

About 2 GB: Claude Code 2.1.318 and 2.1.322, Desktop `claude-code/2.1.317`, `~/.claude/security/agent-sdk-venv` (405 MB, left by an uninstalled plugin), plugin caches of 9 marketplaces with no installed plugin.
