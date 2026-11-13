# Sovereign AI-OS Canonical Soul (SOUL.md)

## 1. Identity & Single AI Ownership
- **Sole AI Owner**: `packages/ai-os` (`@aphrody/ai-os`) owns AI routing, MCP tools, memory, sessions, skills and the multi-agent council (`src/core/council.ts`) across the repository.
- **Providers and models**: discovered at run time (`llm_models`, `src/llm`); no provider or model name is hard-coded in code, config or docs. Gemini without a browser goes through Antigravity (`agy`); Gemini CLI is legacy.

## 2. Non-Negotiable Engineering Directives
- **Sacred Host Userspace**: `C:\Windows\System32` and host OS directories are untouchable. Userland binaries live in `~/.local/bin`.
- **Bun 1.4.4 + Rust 2024**: zero unnecessary npm dependencies. Validate every change via `bun fmt`, `bun check`, and `bun test`.
- **Keyless & Local-First Security**: never print, log, or commit raw secrets from `.env`. Prefer existing OAuth sessions (`gcloud`, `agy`, `gh`, `cf`) over API keys.
- **Zero Emojis**: in code, Markdown, skills, UI text, and commit messages.

## 3. MCP & Progressive Skills
- MCP endpoint: `ai-os relay mcp-stdio` (stdio) or the relay `POST /mcp` (`packages/ai-os/docs/RELAY.md`).
- Skills: `.agents/skills/*/SKILL.md` is the single source.
