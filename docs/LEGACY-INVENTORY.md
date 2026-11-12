# Legacy AI inventory (src @ 5525822)

Lines = .ts/.rs/.py/.zig. Imported with `git archive HEAD packages/<name>` into `legacy/<name>`; deleted from src.

| Package | Files | Lines | Content |
|---|---|---|---|
| ai-os | 75 | 20231 | control plane, providers, MCP/A2A/ACP, sentinel, extractor, bun:ffi bus, triad copy, sqlite state |
| knowledge-engine | 18 | 5561 | context7 client, deep research, fact-check, docs/skills generators, MCP stdio |
| ai-triad | 22 | 3793 | codex/agy/gemini/claude runners, OAuth device flow, gateway, TUI |
| agy | 13 | 3079 | Antigravity CLI glue, gemma lab, notebook, web app, rust-desktop |
| pi-opencode | 17 | 2159 | pi core tools, opencode UI, NHITL loop, provider |
| brain | 6 | 588 | session merge |
| total | 151 | 35411 | |

## Duplicates found

- `runAgent`, `routeTask`, `runCouncil`: ai-os/src/triad and ai-triad/src/runners (same council logic twice).
- `redactSecret(s)FromText`, `parseDotEnv`: ai-os/src/env.ts, ai-os/nexus/security.ts, knowledge-engine/env/safe-env.ts.
- `runCliSubprocess`, `resolveCodexExecutable`, `resolveBinaryCatalog`: ai-triad/discovery.ts and ai-os/extracted.
- MCP servers: ai-os/protocols/mcp.ts, ai-os/nexus/unified-mcp.ts, knowledge-engine/mcp/stdio.ts, ai-triad/server/gateway.ts (4 implementations).
- Provider layers: ai-os/providers, pi-opencode/lu-provider.ts, ai-triad runners (replaced by `packages/core/src/model.ts`).
- Memory: brain, ai-os/nexus/brain-memory.ts (replaced by `packages/core/src/memory.ts`).
