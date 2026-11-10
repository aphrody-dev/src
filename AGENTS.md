# C:\src Sovereign Monorepo — Agent Operating Contract (`AGENTS.md`)

Compatible with **Google Antigravity (`agy`)**, **OpenAI Codex (`codex`)**, **Anthropic Claude Code (`claude`)**, **Vercel-Labs (`skills` / `agent-skills`)**, **OpenCode**, **Pi**, and **Zed**.

## 1. Canonical Monorepo Architecture (Linux / Git / GNU / Chromium `depot_tools` / Bun v1.4.4 / Go 1.27)

`C:\src` enforces a strict POSIX/Chromium/Kernel hierarchy separating sovereign first-party code from upstream vendor trees:

- [`C:\src\apps\`](file:///C:/src/apps) — Production platforms (`aphrody`, `shenron`, `rosegriffon`).
- [`C:\src\packages\`](file:///C:/src/packages) — Bun v1.4.4 Full-Rust Workspace packages (`ai-os`, `ai-triad`, `pi-opencode`, `env-kit`, `google-design`, `wck`, `bun-parity`, `chromium-bun`, `forge`, `bun-plugins`).
- [`C:\src\crates\`](file:///C:/src/crates) — Rust 2024 Systems & Kernel crates (`rust-stack`, `ring3-agent`, `depot`, `xtask`, `wayland`, `gamescope-rs`, `unix`, `bench`).
- [`C:\src\infra\`](file:///C:/src/infra) — Go 1.27 + Cloudflare + Docker/OCI + Caddy + OVH/GCP/Vercel One-Click Deploy Engine (`src-deploy`, `infra_go.dll`, `mesh-vn`, `ffi-bridge`).
- [`C:\src\third_party\`](file:///C:/src/third_party) — Chromium `depot_tools`-style upstream vendor checkouts (`linux`, `chromium`, `bun`, `depot_tools`, `labs`, `ai-ecosystem`, `rust-ecosystem`, `go-ecosystem`, `pi`, `opencode`, `opentui`, `locally-uncensored`, `heretic`, `ralph`, `symphony`, `agent-browser`, `agent-desktop`, `dioxus`, `taffy`, `wgpu`, `winit`, `zed`, `longbridge`, `vcs`).

## 2. Core Engineering Rules (Torvalds / Sumner / Page)

- **Sacred Host Userspace**: Never modify `C:\Windows\System32` or host OS directories. Install userland CLIs and shared libraries (`.exe`, `.dll`, `.cmd`) exclusively in `C:\Users\aphro\.local\bin`.
- **Bun v1.4.4 Full-Rust Native First**: Use `bun fmt`, `bun check`, `bun test`, `bun:sqlite`, `Bun.SQL`, `bun:ffi`, and `bun build --compile` with zero unnecessary npm dependencies.
- **Three-Way Native Interop (`Rust <-> Bun <-> Go`)**: High-throughput compute/auth/UI runs in Rust (`rust_stack_ffi.dll`, `agent_desktop_ffi.dll`, `pi_opencode_native.dll`), container/cloud/OCI orchestration runs in Go (`infra_go.dll`, `src-deploy.exe`), and control planes run in Bun v1.4.4 via zero-copy `bun:ffi`.
- **Secret Hygiene (`C:\src\.env`)**: Never print, log, or commit raw secret values from `C:\src\.env`. Load secrets via `C:\src\packages\env-kit` or `bun --env-file=C:/src/.env`. Only `.env.example` may be committed.
- **Cross-AI Triad (`Codex + AGY + Claude`)**: Unified MCP/ACP/OpenAI/Anthropic/OAuth2-PKCE orchestration via `triad` (`C:\src\packages\ai-triad`), `ai-os` (`:4318`), `triad` (`:4319`), and `rust-stack` (`:4320`).
- **Empirical Verification & Gates**: Validate performance against `C:\src\third_party\labs` (`just labs bench`), web surfaces via `wck` (`C:\src\packages\wck`), design tokens via `gds` (`C:\src\packages\google-design`), and one-click deployment via `just deploy` (`src-deploy`).
