---
name: os-minimal-computer-use
description: Minimal computer use on the PC with the fewest tools in context: desktop accessibility tree (agent-desktop) and browser (agent-browser). Use to drive native apps or web pages without loading larger tool sets.
---

# Minimal computer use

- Native desktop apps: MCP server `agent-desktop`. Load its guide first with `desktop_skills_get` (`name: "desktop"` for the observe-act loop, `name: "platform"` for OS differences), then `desktop_snapshot` to get element refs and the matching action tools. Refs go stale when the UI changes: snapshot again.
- Web pages: skill `agent-browser` (CLI `agent-browser`, MCP tools `agent_browser_*`): `agent-browser skills get core`, then snapshot, act with the `@eN` refs, snapshot again.
- Both servers sit behind the relay (`hub_tools` to list, `hub_call` with `<server>__<tool>`); declared in `infra/agents/toolchain.toml`.
- Files and commands: the dedicated Read, Grep, Glob, Edit and Bash tools, not a desktop session.
