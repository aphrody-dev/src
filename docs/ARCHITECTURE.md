# Architecture

One repo for the agent stack, from GPU runtime to the user-facing surfaces. Names come from `identity.toml`.
Workspaces: bun (`packages/*`), cargo (`crates/*`), uv (`python/*`). Native code builds on the shared Chromium LLVM
toolchain (see `C:\src\docs\llvm\UNIFIED-TOOLCHAIN.md`); native CI runs on the `prd` self-hosted runner, never on the dev PC.

## Layers

```
 L7 surfaces   cli (agent) | tui | desktop | web | mobile | HTTP API | MCP server | A2A/ACP/AG-UI endpoints
 L6 gateway    channels (Chat SDK adapters), auth, sessions, routing     <- OpenClaw gateway, ai-triad gateway
 L5 core       loop (AI SDK) | tools | memory | skills | learning loop | scheduler/heartbeat | sandbox | hooks/plugins
 L4 providers  AI SDK providers (anthropic, openai-compatible, AI Gateway, Workers AI) | local endpoint
 L3 weights    HF hub fetch -> content-addressed store (blake3) -> R2 cache
 L2 inference  llama.cpp server | ONNX Runtime (DirectML/CUDA) | candle/burn | vLLM (Linux, prd)
 L1 runtime    wgpu/Dawn (WebGPU) | CUDA | Vulkan | DirectML | CPU (AVX2/AVX-512)
 L0 platform   Windows 11 native (windows-rs) | Linux 7.x | Cloudflare Workers/DO | Vercel Functions (runtime-adapter)
```

## Modules

| Module | Path | Status |
|---|---|---|
| core loop, tools, memory, skills | `packages/core` | done: `agent run`, e2e test green on Windows |
| scheduler / heartbeat | `packages/scheduler` | planned |
| gateway + channels | `packages/gateway` | planned |
| tui | `packages/tui` | planned |
| mcp server/client | `packages/mcp` | planned |
| inference / weights | `crates/infer`, `crates/weights` | planned |
| python bridge | `python/agent_py` (pyo3) | planned |
| legacy (migrated as-is, to be dissolved) | `legacy/*` | imported |

## Feature mapping

Source: OC = OpenClaw (fork aphrody-labs/openclaw), HA = Hermes Agent (fork aphrody-labs/hermes-agent), pi, OCd = opencode,
L = legacy src packages. Approach: SDK = native vendor SDK, FORK = code from our fork, OWN = our own code.

| Feature | From | Module | Approach |
|---|---|---|---|
| agent loop, multi-step tool calls | pi, OCd, HA | core/agent.ts | SDK: Vercel AI SDK `generateText` + `isStepCount` |
| model providers, fallback | HA (anthropic_adapter, auxiliary_client), L ai-os/providers, pi-opencode/lu-provider | core/model.ts | SDK: `@ai-sdk/*`, AI Gateway |
| read/write/edit/bash tools | pi (4 tools), OCd | core/tools.ts | OWN (small) |
| persistent memory, FTS recall | HA memory_tool, memory_manager; L brain, ai-os/nexus/brain-memory | core/memory.ts | OWN on bun:sqlite FTS5, semantics from HA |
| skill creation (SKILL.md), self-learning | HA skill_manager_tool, learning_graph | core/skills.ts | OWN, Agent Skills format, semantics from HA |
| skill lint/provenance/lock | HA skill_linter, skill_provenance, skill_lock | core/skills | FORK port (planned) |
| scheduler, heartbeat, cron | OC heartbeat, HA cron/ | scheduler | SDK: Workflow (durable) + Cloudflare Agents schedule; local timer |
| multi-channel gateway | OC gateway/channels | gateway | SDK: Chat SDK adapters |
| sessions, compaction | HA compression, OCd sessions | core/session | OWN (planned) |
| sandbox | OC sandbox, HA docker | core/sandbox | Windows AppContainer (windows-rs), Vercel Sandbox, CF Sandbox |
| hooks, plugins | OC plugins, OCd plugins | core/hooks | OWN (Claude Code hook format) |
| MCP client/server | L ai-os/protocols/mcp, knowledge-engine/mcp, ai-triad/server | mcp | SDK: `@modelcontextprotocol/sdk`, AI SDK MCP client |
| A2A | L ai-os/protocols/a2a | protocols | SDK: A2A (Google, fork adk-python for reference) |
| ACP | HA acp_adapter, L ai-os/protocols/acp, ai-triad | protocols | SDK: ACP |
| AG-UI | - | web | SDK: AG-UI |
| TUI | pi, OCd | tui | FORK (pi tui) |
| web UI | OC apps, L ai-triad WebGUI, agy web-app | web | SDK: AI SDK UI |
| desktop | OC apps, L agy rust-desktop | desktop | OWN (windows-rs / webview) |
| deep research, fact-check, context7 | L knowledge-engine | tools/research | OWN (migrate) |
| cross-CLI council (codex/gemini/claude) | L ai-triad, ai-os/triad (duplicate) | tools/council | OWN (dedupe into one) |
| standards sentinel, extractor | L ai-os/sentinel, extractor | tools/sentinel | OWN (migrate or drop) |
| bun:ffi computer-use bus | L ai-os/ffi | crates/desktop-use | windows-rs (replace FFI) |
| session merge | L brain | core/session | OWN (fold into memory) |
| gemma lab, notebook, finops | L agy | tools/* | evaluate, likely drop |
| local inference | L ai-os/native, zig | crates/infer | FORK llama.cpp / ONNX Runtime (fork onnxruntime) |
| WebGPU | L ai-os/wasm-webgpu | crates/gpu | FORK wgpu / dawn |
| deploy targets | - | adapters | `packages/runtime-adapter` (src branch hosting/portable) |
| parsing / code graph | - | tools/code | crates/core (src branch core/common-lib), tree-sitter |

## ADR

| # | Decision |
|---|---|
| 0001 | Agent loop on Vercel AI SDK 7 (installed 7.0.170); no hand-written provider clients. |
| 0002 | Memory on bun:sqlite + FTS5, one file per home (`AGENT_HOME`). Embeddings later via local ONNX model. |
| 0003 | Skills use the Agent Skills format (SKILL.md + YAML front matter), compatible with Claude Code. |
| 0004 | Legacy src AI packages imported verbatim into `legacy/` then dissolved module by module; src history is the archive. |
| 0005 | OpenClaw/Hermes/pi/opencode code is MIT; ported code keeps notices in `NOTICE` + `licenses/`. |
| 0006 | Native builds on the prd runner with the Chromium LLVM toolchain; GitHub-hosted CI runs bun tests only. |
| 0007 | Windows native first (no WSL); Linux second; Cloudflare/Vercel through runtime-adapter. |
| 0008 | Product name only in `identity.toml`. |
