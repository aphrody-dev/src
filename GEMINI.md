# C:\src Sovereign Monorepo — Google Antigravity & Gemini Contract (`GEMINI.md`)

See [`AGENTS.md`](./AGENTS.md) and [`.agents/SOUL.md`](./.agents/SOUL.md) for the canonical operating contract.

## Canonical Workspace Layout & Single AI Ownership

- `packages/ai-os`: **Sole AI & MCP Owner** of the monorepo (`ai-os.exe mcp-stdio`), unifying AI-Triad, Skills, Brain, Memory, Sessions, Soul, Google Cloud (`gcloud`), Workspace (`gws`), Grounded Search, Context7, GitHub, Figma, CUDA `sm_89`, and `n2b` REA/Replica.
- `packages/agy`: Keyless Google AI Ecosystem hub (5-Org Depot + Gitingest, Gemma 4 JAX/CUDA/Torch lab, DeepMind Notebooks, Open NotebookLM, Google AI Ultra FinOps rentabilisation, Web App, and Dual Mode `minimal` vs `fullstack`).
- `apps/`: Production platforms (`apps/aphrody`, `apps/shenron`, `apps/rosegriffon`).
- `crates/`: Native Rust systems crates (`crates/ring3-agent`, `crates/bench`, `crates/depot`, `crates/xtask`).
- `infra/`: Go 1.27 + Cloudflare/OVH/GCP deployment & WireGuard/MASQUE mesh (`infra/mesh-vn`).

## Mandatory Verification & Rules

- Always run `bun fmt`, `bun check`, and `bun test`.
- Never modify `C:\Windows\System32`; userland binaries belong in `C:\Users\aphro\.local\bin`.
- Never print, log, or commit raw secrets from `C:\src\.env`. Zero emojis anywhere.
- Use `graphify` first when `graphify-out/` exists for architectural graph queries.
- Portability, containers, and agent autonomy (`SRC_ROOT`, `compose.yaml`, `AGENT_GUARD`): see `AGENTS.md` section 5.
