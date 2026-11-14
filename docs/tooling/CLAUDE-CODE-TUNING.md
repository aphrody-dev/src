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
- Status line (50 ms) and PostToolUse hook (62 ms, async) measured and left unchanged: neither blocks a turn.
- Skills: 141 -> 129 by merging overlaps; 36 `android-*` skills carry `disable-model-invocation: true` (about 30 000 characters of descriptions out of every session; `android-cli` lists them).
- 5 marketplaces without an installed plugin removed; 8 project-scope plugins removed.
- `MEMORY.md`: 6.7 KB, 47 lines (limit loaded per session: 200 lines or 25 KB).
- `BASH_MAX_OUTPUT_LENGTH=12000` (default 30000), `MAX_MCP_OUTPUT_TOKENS=8000` (default 25000).

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
