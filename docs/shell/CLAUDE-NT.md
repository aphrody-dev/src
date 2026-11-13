# Claude Code → NT kernel: layers, latencies, "human" interaction (2026-11-12)

Sources: code.claude.com/docs (computer-use, setup, env-vars), Microsoft Learn (UI Automation caching/threading, MCP on Windows / ODR), `gh api` (cited repositories). [NV] = not verified.

## 1. What keeps Claude Code away from NT today

| Layer | Cost / problem | Source |
|---|---|---|
| Claude Code (Bun/JS binary) → Bash tool | one shell process per command + snapshot replay | setup docs [V], observed snapshot |
| bash.exe (Git Bash = MSYS2) | POSIX emulation (emulated fork, cygpath) | replaced by niubash 1.5.0: 16.3 ms vs 19.2 ms (nt-03) |
| PowerShell tool | heavy pwsh startup | disabled (CLAUDE_CODE_USE_POWERSHELL_TOOL=0) |
| CreateProcessW per command | Windows process creation cost + Defender scan | Defender exclusions already set; per-command measurement [NV] (requires a clean Windows) |
| output through pipes, not ConPTY | no TTY; output truncated at BASH_MAX_OUTPUT_LENGTH (30000 by default, max 150000) | env-vars docs [V] |
| GUI | CLI `computer-use` = **macOS only**; on Windows only in Claude Desktop | computer-use docs [V] |
| screenshots | downscale + model round trip: slowest method, used as a last resort (MCP > Bash > Chrome > computer use) | computer-use docs [V] |

## 2. Most direct path to "all of Windows like a human"

Precision order imposed by Claude Code itself: MCP > Bash > Claude in Chrome > computer use. So the target is a **persistent native MCP server** that talks to Win32/UIA, not screenshots.

| Need | NT/Win32 API (Learn) | Latency note |
|---|---|---|
| read the UI | UI Automation `IUIAutomation` + **CacheRequest** (bulk fetch, 1 cross-process call for N properties) | without cache: 1 cross-process call per property [V] |
| react to changes | UIA events (`AddAutomationEventHandler`) with cache request, on a non-UI thread | avoids polling [V] |
| text | `TextRange::GetText(-1)` in chunks | no cache for TextPattern [V] |
| act | UIA patterns (Invoke, Value, Toggle); fallback `SendInput` | Invoke without mouse [V learn.microsoft.com uiauto-implementinginvoke]; without focus [NV] (source not found: Learn does not guarantee it) |
| see | Windows.Graphics.Capture / DXGI Desktop Duplication, only if UIA is not enough | [NV] (source not found: not searched, outside light network scope) |
| tool discovery | MCP on Windows: ODR `odr.exe mcp list/add`, File Explorer and Settings connectors; build ≥ 26220.7262 (this PC: 28120) | servers contained by default; unpackaged = "Reduce protections for agent connectors" [V] |

## 3. Existing (gh api, aphrody-labs forks)

| Repository | Language | State | Use |
|---|---|---|---|
| CursorTouch/Windows-MCP (11.5k ★, push 2026-11-12) | Python | active | functional UIA + input reference; Python = startup latency, to be rewritten |
| microsoft/UFO (10.2k ★) | Python | active | Microsoft UIA + vision agent, control tree model |
| microsoft/mcp-on-windows-samples | JS/C# | 2026-06 | ODR registration, MCP host |
| microsoft/winappCli (+ skill `winappcli:winapp-ui-automation` installed) | — | active | UI inspection/click already available in this session |
| microsoft/windows-rs | Rust | active | UIA/Win32 bindings for the rewrite |
| microsoft/WinAppDriver | — | frozen 2025-04 | to ignore |

## 4. Plan (high level; low-level implementation = session nt-03)

1. `crates/winmcp` (Rust, windows-rs from the repository, stdio MCP, single persistent process): `tree` (UIA cache, TreeScope_Subtree, control view filter), `find`, `invoke`, `set_value`, `type`, `key`, `focus`, `windows`, `capture` (WGC), `watch` (UIA events → MCP notifications).
2. Register in Claude Code (`claude mcp add winmcp -- winmcp.exe`) and in the ODR (`odr mcp add manifest.json`).
3. Bench: round-trip latency of `tree` + `invoke` vs Windows-MCP (Python) vs screenshots; goal < 50 ms per action [goal, not measured].
4. Shell: keep niubash as bash.exe; measure the per-command cost (snapshot + CreateProcess) and test `CLAUDE_CODE_SHELL_PREFIX` / `CLAUDE_ENV_FILE` to reduce it.
5. Pure GUI (games, canvas): only there, screenshots + SendInput.

## 5. Decision: agent-desktop (vercel-labs) instead of winmcp (2026-11-12)

nt-03 wired `agent-desktop mcp --headed` 1.2.0 (Rust, 67 tools, UIA cache + Windows.Graphics.Capture in the source) and `agent-browser mcp` 0.42.0 into Claude Code (user scope). `crates/winmcp` is abandoned: we assemble and patch the aphrody-labs/agent-desktop fork.

MCP `tools/call` round-trip bench (tools/bench-mcp/bench.ts, bun, persistent stdio, median, this PC):

| Tool | median | p90 | response |
|---|---|---|---|
| initialize | 7.3 ms | — | — |
| desktop_version | 9.7 ms | 10.3 ms | 463 B |
| desktop_clipboard_get | 10.0 ms | 10.3 ms | 1 KB |
| desktop_list_windows | 25.5 ms | 27.7 ms | 1.6 KB |
| desktop_snapshot (WindowsTerminal, interactive_only) | 90.6 ms | 95.6 ms | 13 KB |
| desktop_screenshot (2560x1440 screen) | 313 ms | 333 ms | 368 KB |

Findings: a floor of about 10 ms even for `desktop_version`, which does nothing, so a server-side overhead per call (unknown cause); MCP mode saves no time compared with the CLI (list_windows 25.5 vs 25.7 ms); a screenshot costs 30 times more than a UIA snapshot. Patch priorities: per-call floor, capture (format/scale, reuse the frame pool), targeted snapshot. ODR blocked: `odr mcp list` → "MCP surface is not enabled".

## 6. Low-level state (nt-03, 2026-11-12)
Claude Code runs as admin (integrity S-1-16-12288); Sudo for Windows Inline, ConsentPromptBehaviorAdmin=0 (elevation without prompt); WT Niubash profile elevate=true by default. Reproducible via C:\src\configuration (README, shell.dsc.winget, machine.export.dsc.winget 161 packages, apply-user.ts --check, forks-aphrody-labs.sh). Windows MCP surface / agentic features: not enabled, owner decision.
