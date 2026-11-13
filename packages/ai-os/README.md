# @aphrody/ai-os

The single AI unit of `src`: agent core, model bridge, relay, gateway, research and TUI in one Bun package, with no
npm dependency (Bun built-ins only: `bun:sqlite`, `Bun.serve`, `Bun.listen`, `Bun.spawn`, `node:readline`, `fetch`).
Merged flat from `aphrody-labs/agent@83c2c8b` with `git subtree` (history kept: `git log -- packages/ai-os`).

| Path                   | Export       | Role                                                                                         |
| ---------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `src/core`             | `./core`     | agent loop, tools, memory, Context selection, skills, hub, scheduler, council, secrets       |
| `src/llm`              | `./llm`      | single model bridge: providers and models discovered at run time, tool loop, JSON Schema     |
| `src/relay`            | `./relay`    | the only MCP server (HTTP 2025-11-25 and 2026-07-28, stdio) and A2A 1.0.1 `SendMessage`      |
| `src/gateway`          | `./gateway`  | WebSocket sessions, OpenAI-compatible chat, channel webhooks                                 |
| `src/research`         | `./research` | outline-driven research, fact-check, Context7 docs                                           |
| `src/tui`              | `./tui`      | terminal UI                                                                                  |
| `bench`, `fixtures`    |              | retrieval bench and research reference pack                                                  |
| `python`               |              | uv workspace: pyo3 `agent_core` (`crates/agent-py`), Hermes memory provider, reference check |
| `native/relay-windows` |              | Windows service `AphrodyRelay` (.NET 11 NativeAOT) and `install.ps1`                         |

Rust crates: `crates/agent-context`, `crates/agent-py` (root workspace). Linux unit of the relay:
`infra/fleet/prd/systemd/aphrody-relay.service`.

No provider or model is hardcoded. `AGENT_MODEL=provider/model` takes any id listed by `llm_models`
(`ai-os relay` tool, `listModels()`); without it the first model of the first active provider is used (Ollama,
`RELAY_OPENAI_ENDPOINTS`, OpenRouter, Hugging Face, Vercel AI Gateway, Cloudflare Workers AI, Antigravity CLI, Claude
Code CLI). `AGENT_EMBEDDER=hash|provider/model`.

```sh
bun test test                                   # from packages/ai-os (never from the src root)
bun src/cli.ts run "summarize README.md into notes.md"
bun src/cli.ts relay serve                      # relay: /rpc /mcp /a2a /ws, TCP, TLS
```

Former npm dependencies, all replaced: `ai`, `@ai-sdk/anthropic`, `@ai-sdk/openai-compatible`, `workers-ai-provider`
(-> `src/llm`, OpenAI-compatible chat/completions and embeddings over `fetch`), `zod` (-> `src/llm/schema.ts`),
`@modelcontextprotocol/sdk` (-> relay MCP server, `relay mcp-stdio`), `@earendil-works/pi-tui` (-> `node:readline`).
None remains.

License: MIT OR Apache-2.0. Third-party notices in `NOTICE` and `licenses/`.
