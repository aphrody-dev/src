---
name: vercel-labs-arena
description: Reference and workflow for C:\src\labs (auto-updated submodules of vercel and vercel-labs) and proving C:\src outperforms Vercel/Vercel-Labs bricks on latency, throughput, and binary size while maintaining 100% schema/protocol compatibility.
---

# Vercel & Vercel-Labs Submodule Arena (`C:\src\labs`)

Activate this skill whenever working with `vercel/*` or `vercel-labs/*` standards (`SKILL.md`, `json-render`, `portless`, `vercel/ai` streams, `turborepo`, `agent-browser`, `scriptc`) or benchmarking `C:\src` modules against upstream Vercel implementations.

## Key Commands
- Sync all shallow `vercel/*` and `vercel-labs/*` submodules to latest upstream HEAD:
  ```powershell
  bun run --cwd C:\src\labs src/cli.ts sync
  ```
- Run the full comparative benchmark & compatibility suite across `C:\src`:
  ```powershell
  bun run --cwd C:\src\labs src/cli.ts bench
  ```
- Validate `SKILL.md` progressive disclosure across `C:\src\.agents\skills`, `~/.gemini/skills`, and `vercel-labs/agent-skills`:
  ```powershell
  bun run --cwd C:\src\labs src/cli.ts verify-skills
  ```
