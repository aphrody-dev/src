# Roadmap

Done (2026-11-12)
- P0 architecture, mapping, ADR, legacy inventory (`docs/ARCHITECTURE.md`, `docs/LEGACY-INVENTORY.md`).
- P1 flat bun + cargo + uv workspace, identity.toml, MIT/Apache, CI windows-latest + ubuntu, native job on prd; submodule `agent/` in src.
- P2 legacy packages agy, ai-os, ai-triad, brain, knowledge-engine, pi-opencode moved to `legacy/`, deleted from src, src references fixed.
- P3 `packages/core`: AI SDK loop, tools (fs, shell, memory, skill), SQLite FTS memory, SKILL.md creation; e2e test green on Windows.

Next
1. Dedupe legacy: one MCP server (`packages/mcp`, official SDK), one council (from ai-triad), one secret redactor; delete the rest.
2. Port Hermes skill lint/provenance/usage and learning graph; session compaction.
3. Scheduler/heartbeat (OpenClaw) on Workflow + Cloudflare Agents schedule, local timer on Windows.
4. Gateway + channels via Chat SDK; port OpenClaw channel config.
5. TUI from pi; web UI with AI SDK UI + AG-UI; A2A and ACP endpoints.
6. Sandbox: AppContainer via windows-rs, Vercel/CF Sandbox remote.
7. Inference: llama.cpp + ONNX Runtime/DirectML crates (forks), weights store (HF hub -> blake3 CAS -> R2).
8. pyo3 bridge with our cpython/uv fork; tree-sitter tools via src crates/core (branch core/common-lib).
9. Remaining src AI code: apps/aphrody, apps/yolo, bunos AI parts.
10. Desktop and mobile surfaces; Linux 7.x packaging; runtime-adapter deploy (branch hosting/portable).
