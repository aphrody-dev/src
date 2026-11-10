# C:\src Sovereign Monorepo — Google Antigravity & Gemini Contract (`GEMINI.md`)

See [`AGENTS.md`](./AGENTS.md) for the canonical cross-agent operating contract.

## Canonical Workspace Layout

- `apps/`: Production platforms (`apps/aphrody`, `apps/shenron`, `apps/rosegriffon`).
- `packages/`: Pure Bun v1.4.4 Full-Rust packages (`packages/ai-os`, `packages/ai-triad`, `packages/env-kit`, `packages/forge`, `packages/google-design`, `packages/pi-opencode`, `packages/wck`).
- `crates/`: Native Rust systems crates (`crates/ring3-agent`, `crates/bench`, `crates/depot`, `crates/gamescope-rs`, `crates/unix`, `crates/wayland`, `crates/xtask`).
- `infra/`: Sovereign WireGuard/MASQUE mesh (`infra/mesh-vn`).
- `third_party/`: Upstream sources and AI ecosystem (`third_party/bun`, `third_party/ai-ecosystem/*`).

## Mandatory Verification & Rules

- Always run `bun fmt`, `bun check`, and `bun test`.
- Never modify `C:\Windows\System32`; userland binaries belong in `C:\Users\aphro\.local\bin`.
- Never print, log, or commit raw secrets from `C:\src\.env`. Zero emojis anywhere.
- Cross-AI delegation is wired via MCP server `ai-triad` (`triad_ask_claude`, `triad_ask_codex`, `triad_council_review`).

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
