# Monorepo AI Agent Architecture & Surface Map

## 1. Executive Law: Single Ownership & Fused Triad

In accordance with Late 2026 Sovereign Directives:

1. **Single Public AI Product**: `@aphrody/ai-os` (`packages/ai-os` / `ai-os.exe`) is the sole public AI agent runtime and MCP owner across the entire `C:\src` monorepo.
2. **Triad Orchestration**: `@aphrody/ai-triad` (`packages/ai-triad` / `triad.exe`) orchestrates multi-agent CLI workflows across OpenAI Codex, Google Antigravity (AGY/Gemini), and Anthropic Claude Code.
3. **Domain Agent Plugins**: Domain-specific products (`apps/shenron`, `apps/rosegriffon`) define their own localized plugins (`plugin/` in Shenron) without fragmenting root monorepo toolchains.

---

## 2. Shenron AI Surface Topology (`C:\src\apps\shenron`)

```
apps/shenron/
├── AGENTS.md                  # Canonical Agent Rules & Runbook (English)
├── GEMINI.md                  # Antigravity Operating Directives
├── CLAUDE.md                  # Symlink / mirror to AGENTS.md
├── .agents/
│   ├── plugins.json           # Plugin registration: points to "plugin"
│   └── skills/                # Local operational skills (shenron-bun-mastery, base-ui, etc.)
└── plugin/                    # Canonical Shenron Multi-Ecosystem Plugin
    ├── plugin.json            # Antigravity / Gemini CLI plugin manifest
    ├── .claude-plugin/        # Anthropic Claude Code plugin manifest
    │   └── plugin.json
    ├── openai/                # OpenAI Codex / ChatGPT plugin bundle
    │   ├── plugin.json
    │   ├── mcp.json
    │   └── agents/openai.yaml
    ├── mcp_config.json        # Remote MCP gateway (https://dragonballfr.com/mcp)
    ├── .mcp.json              # Local stdio MCP gateway (shenron-mcp)
    ├── GEMINI.md              # Domain rulebook (facts, canonicity, French/Japanese terms)
    ├── agents/                # Domain specialized subagents (OCR, translator, wiki)
    └── skills/                # 10 verified offline Dragon Ball & platform skills
```

---

## 3. Monorepo AI Surface Topology (`C:\src`)

```
C:\src/
├── AGENTS.md                  # Canonical cross-agent contract (section 5: portability & autonomy)
├── CLAUDE.md                  # Claude Code: commands, architecture, NHITL loop
├── GEMINI.md                  # Antigravity & Triad Operating Directives
├── .agents/
│   ├── hooks.json             # agy PreToolUse -> scripts/pre-tool-guard.ts
│   ├── scripts/
│   │   ├── pre-tool-guard.ts  # Shared guard for agy + Claude Code, AGENT_GUARD=off|warn|enforce
│   │   └── pre-tool-guard.test.ts
│   └── skills/                # Single source of truth for all agent skills (17)
├── .claude/
│   ├── settings.json          # bypassPermissions, allow-all, PreToolUse -> shared guard
│   └── skills -> ../.agents/skills   # junction/symlink, created by ay up --bootstrap
├── .gemini/settings.json      # graphify hook-guard for Gemini CLI
├── packages/
│   ├── ai-os/                 # Core AI & Unified Context-Optimized MCP Server
│   ├── ai-triad/              # Triad Gateway (:4319), Council Consensus & Sync
│   └── knowledge-engine/      # Context7 v2 SQLite WAL & Deep Research
```

---

## 4. Inconsistency Resolution & Cleanups Completed

1. **Elimination of Artificial Duplicates**:
   - Removed `.agents/plugins/shenron` duplicate scaffold in favor of the canonical, rich [`plugin/`](file:///C:/src/apps/shenron/plugin).
   - Removed temporary non-versioned `.local-agents/` stubs.
   - Cleared empty legacy `.claude-plugin` directory at Shenron root.
2. **Plugin Registration & Discovery Alignment**:
   - Configured [`.agents/plugins.json`](file:///C:/src/apps/shenron/.agents/plugins.json) to reference `"path": "plugin"`.
3. **Verification Integrity**:
   - Ensured zero broken links across `bun/docs` and Shenron documentation.
   - Preserved `bun check` zero-error state across all 7,222 files in the repository.
