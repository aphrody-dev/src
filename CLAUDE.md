# C:\src Sovereign Monorepo — Claude Code Contract (`CLAUDE.md`)

See [`AGENTS.md`](./AGENTS.md) and [`.agents/SOUL.md`](./.agents/SOUL.md) for the canonical cross-agent operating contract.

## Canonical Workspace Layout & Ownership
- `packages/ai-os`: **Sole Public AI Product & Sovereign AI Owner** (`@aphrody/ai-os`). All other `C:\src` units are generalist systems, web, desktop, Linux/WSL2, and design platforms aligned with Torvalds, Sumner, and Page (100% autonomous NHITL internally, zero AI-slop externally).
- `apps/`: Generalist production platforms (`apps/aphrody`, `apps/aphrody-app`, `apps/shenron`, `apps/rosegriffon`).
- `packages/`: Pure Bun v1.4.4 Full-Rust packages (`ai-os`, `agy`, `ai-triad`, `brain`, `knowledge-engine`, `env-kit`, `forge`, `google-design`, `pi-opencode`, `wck`, `bun-parity`, `chromium-bun`, `bun-plugins`).
- `crates/`: Rust 2024 systems, Omarchy+CachyOS+Arch WSL2 (`crates/unix`), and Rust WSLg Wayland (`crates/wayland`) crates (`rust-stack`, `ring3-agent`, `depot`, `gamescope-rs`, `bench`, `xtask`).
- `infra/`: Go 1.27 deploy engine, Multi-Google 3-account IAM (`yoyo.aphrody@gmail.com`, `yohanpierre15@gmail.com`, `contact@aphrody.com`), GitLab, Mail (`mail.aphrody.com`), and WireGuard/MASQUE mesh (`infra/mesh-vn`).

## Mandatory Verification & Rules
- Design-First Gate: Every UI requires a PRD (*Cahier des charges*) + `DESIGN.md` maquette before code, verified by `gds verify` (anti-slop `impeccable` + `humanizer`) and `wck` 100/100.
- Format with `bun fmt`, typecheck with `bun check`, and test with `bun test`.
- Never touch `C:\Windows\System32`. Install userland binaries in `C:\Users\aphro\.local\bin`.
- Never print, log, or commit raw secrets from `C:\src\.env`. Zero emojis anywhere.
