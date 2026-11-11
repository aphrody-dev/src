---
name: ai-triad-orchestrator
description: "Orchestrate OpenAI Codex CLI, Google Antigravity CLI (agy/gemini), and Anthropic Claude Code via @aphrody/ai-triad (triad CLI, :4319 multi-protocol gateway, parallel Council consensus, OAuth 2.1 PKCE, and sync-configs)."
---

# Sovereign AI Triad Orchestrator (`Codex + AGY + Claude`)

Activate this skill when coordinating multi-agent tasks, running parallel code reviews across OpenAI/Google/Anthropic models, or synchronizing MCP/provider configurations across AI editors.

## Primary Commands (`C:\Users\aphro\.local\bin\triad.exe`)

1. **Verify Readiness & Auth Hygiene**:
   ```powershell
   triad doctor --no-color
   triad auth-status --fast
   ```
2. **Synchronize All Client Configs Idempotently**:
   Updates Antigravity CLI, Gemini CLI, Codex (`~/.codex/config.toml`), Claude Code (`~/.claude.json`, `mcp_sovereign.json`), OpenCode, and Zed with `ai-os`, `ai-triad`, `context7`, and `knowledge-engine`:
   ```powershell
   triad sync-configs
   ```
3. **Headless Delegation & Parallel Council Consensus**:
   ```powershell
   triad ask codex "Audit memory layout of FFI struct"
   triad council "Verify SQLite WAL concurrency and hook latency < 40ms"
   ```

## Progressive Disclosure Reference
- Gateway HTTP routes (`:4319`), quota-aware fallback chains, and MCP tool schemas: see [`references/gateway-and-council.md`](./references/gateway-and-council.md).
