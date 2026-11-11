---
name: context7-deep-research
description: "Mandatory upstream API grounding via Context7 v2 SQLite cache, 5-channel parallel deep research (ske research), and deterministic multi-evidence fact checking (ske factcheck) before writing or reviewing code."
---

# Context7, Deep Research & Deterministic Fact-Checker (`ske`)

Activate this skill before implementing unfamiliar upstream APIs, auditing architectural Markdown plans, or citing external library behavior in `C:\src`.

## Core Workflow

1. **Resolve & Query Official Docs via Context7**:
   - Prefer MCP tools `ctx7_query_docs` (from `knowledge-engine`) or `resolve-library-id` / `query-docs` (from `context7`).
   - CLI equivalent:
     ```powershell
     ske research "Bun v1.4.4 bun:ffi dlopen and Context7 MCP"
     ```
2. **Multi-Hop Deep Research (`ske research`)**:
   - Fans out in parallel across Context7 v2, Exa Neural Search, GitHub Live API, Kernel.org/Freedesktop GitLab, and local `C:\src` lockfiles/manifests.
   - Emits Blake3-deduplicated dossiers into `C:\src\docs\research\<slug>.md`.
3. **Deterministic Fact-Checking (`ske factcheck`)**:
   - Verifies `file:///C:/...` links, `~/.local/bin` binaries, `src.lock.json` versions, GitHub repo liveness, Context7 symbols, secret hygiene, `C:\Windows\System32` non-mutation, and zero-emoji compliance:
     ```powershell
     ske factcheck C:/src/README.md
     ```

## Progressive Disclosure Reference
- Detailed MCP JSON-RPC schemas, SQLite WAL cache tables, and authority tier ranking rules: see [`references/protocol-and-tiers.md`](./references/protocol-and-tiers.md).
