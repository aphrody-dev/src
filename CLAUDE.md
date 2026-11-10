# C:\src Sovereign Monorepo — Claude Code Contract (`CLAUDE.md`)

See [`AGENTS.md`](./AGENTS.md) for the canonical cross-agent operating contract.

## Canonical Workspace Layout

- `apps/`: Production applications (`apps/aphrody`, `apps/shenron`, `apps/rosegriffon`).
- `packages/`: Pure Bun v1.4.4 TypeScript packages (`packages/ai-os`, `packages/ai-triad`, `packages/env-kit`, `packages/forge`, `packages/google-design`, `packages/pi-opencode`, `packages/wck`).
- `crates/`: Systems Rust crates (`crates/ring3-agent`, `crates/bench`, `crates/depot`, `crates/gamescope-rs`, `crates/unix`, `crates/wayland`, `crates/xtask`).
- `infra/`: Mesh networking and sovereign infrastructure (`infra/mesh-vn`).
- `third_party/`: Upstream forks and shallow ecosystem mirrors (`third_party/bun`, `third_party/ai-ecosystem/*`).

## Mandatory Verification & Rules

- Format with `bun fmt`, typecheck with `bun check`, and test with `bun test`.
- Never touch `C:\Windows\System32`. Install userland binaries in `C:\Users\aphro\.local\bin`.
- Never print, log, or commit raw secrets from `C:\src\.env`. Zero emojis anywhere.
- Cross-AI delegation is available via MCP server `ai-triad` (`triad_ask_codex`, `triad_ask_agy`, `triad_council_review`).
