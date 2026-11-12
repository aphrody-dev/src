# C:\src Sovereign Monorepo — Agent Operating Contract (`AGENTS.md`)

Compatible with **Google Antigravity (`agy`)**, **OpenAI Codex (`codex`)**, **Anthropic Claude Code (`claude`)**, **Vercel-Labs (`skills` / `agent-skills`)**, **OpenCode**, **Pi**, and **Zed**.

## 1. Canonical Monorepo Architecture (Linux / Git / GNU / Chromium `depot_tools` / Bun v1.4.4 / Go 1.27)

`C:\src` enforces a strict POSIX/Chromium/Kernel hierarchy separating sovereign first-party code from upstream vendor trees:

- [`C:\src\apps\`](file:///C:/src/apps) — Generalist production platforms (`aphrody`, `aphrody-app`, `yolo`, `shenron`, `rosegriffon`).
- [`C:\src\packages\`](file:///C:/src/packages) — Bun v1.4.4 Full-Rust Workspace packages (`ai-os`, `agy`, `ai-triad`, `brain`, `knowledge-engine`, `pi-opencode`, `env-kit`, `google-design`, `wck`, `bun-parity`, `chromium-bun`, `forge`, `bun-plugins`, `epic-games`).
- [`C:\src\crates\`](file:///C:/src/crates) — Rust 2024 Systems, Desktop & WSLg/Kernel crates (`aphrody-design-*`, `corelib`, `rust-stack`, `ring3-agent`, `depot`, `xtask`, `wayland`, `gamescope-rs`, `unix`, `bench`).
- [`C:\src\infra\`](file:///C:/src/infra) — Go 1.27 + Cloudflare + Docker/OCI + GitLab + Google Cloud + Stalwart Mail + WireGuard/MASQUE One-Click Deploy Engine (`src-deploy`, `infra_go.dll`, `mesh-vn`, `gcloud`, `gitlab`, `mail`, `ffi-bridge`).
- [`C:\src\third_party\`](file:///C:/src/third_party) — Upstream vendor checkouts (`linux`, `chromium`, `bun`, `omacom`, `cachyos`, `archlinux`, `design-ecosystem`, `google-ecosystem`, `depot_tools`, `labs`, `ai-ecosystem`, `rust-ecosystem`, `go-ecosystem`, `dioxus`, `taffy`, `wgpu`, `winit`, `zed`).

## 2. Single AI Product Ownership & Anti-AI-Slop Design-First Gate

- **Single Public AI Product (`packages/ai-os`)**: `@aphrody/ai-os` is our **sole** public AI product and internal AI owner. All other `C:\src` surfaces (`aphrody.com`, `aphrody.app`, `crates/*`, `packages/*`, `infra/*`) are **generalist systems, web, desktop, Linux/WSL2 distro, and creative software** aligned with **Linus Torvalds, Jarred Sumner (Bun), and Larry Page**. Internally, 100% of `C:\src` workflows run NHITL (no human in the loop); externally, zero AI-hype or AI-slop is tolerated.
- **Mandatory Design-First Gate (`Plan -> PRD -> DESIGN.md -> Assets -> Code -> WCK 100`)**: Before building or modifying any UI, agents MUST generate or update a _Cahier des charges_ (PRD), wireframe layout spec, and `DESIGN.md` maquette using `@aphrody/google-design` (`gds`), verified against Modern Web Guidelines, Lighthouse/`wck` 100/100, Material Design 3, Fluent UI 2, `ui-ux-pro-max`, `3d-pro-max`, `impeccable`, `humanizer`, and Figma tokens.

## 3. Three-Principal Multi-Google & Cloud Identity Matrix (`aphrody` #468000409790)

Managed via `env-kit accounts` with isolated `gcloud` named configurations sharing GCP project `aphrody`:

1. **`yoyo.aphrody@gmail.com` (`ai-yoyo`)**: Dedicated autonomous AI account (Gemini, Spark, Hermes, OpenClaw, Drive `gdrive-yoyo`, NotebookLM).
2. **`yohanpierre15@gmail.com` (`owner-yohan`)**: Yoyo personal developer & GCP/Git owner account.
3. **`contact@aphrody.com` (`org-contact`)**: Organization & infrastructure identity across Google Workspace, Cloudflare, GitHub, GitLab, Google Git, OVH, Hostinger, Vercel, Supabase, and `mail.aphrody.com`.

## 4. Core Engineering Rules

- **Sacred Host Userspace**: Never modify `C:\Windows\System32` or host OS directories. Install userland CLIs and shared libraries (`.exe`, `.dll`, `.cmd`) exclusively in `C:\Users\aphro\.local\bin`.
- **Bun v1.4.4 Full-Rust Native First**: Use `bun fmt`, `bun check`, `bun test`, `bun:sqlite`, `Bun.SQL`, `bun:ffi`, and `bun build --compile` with zero unnecessary npm dependencies.
- **Tri-Forge Synchronization (`frg`)**: Keep repositories synchronized across **GitHub** (`aphrody-dev`), **GitLab** (`gitlab.com/aphrody-dev` & `git.aphrody.com`), and **Google Git** (GCP `aphrody` Developer Connect / Source Repos).
- **Domain Purity (`ay arch check --strict`)**: `C:\src\crates\*` is strictly pure Rust 2024 / native code (zero `.ts`/`.js`/npm files); `C:\src\packages\*` is strictly `@aphrody/*` Bun v1.4.4 packages (zero root `Cargo.toml`/`go.mod`); enforced deterministically by [`C:\src\crates\archguard`](file:///C:/src/crates/archguard).
- **Secret Hygiene (`C:\src\.env`) & Zero Emojis**: Never print, log, or commit raw secret values from `C:\src\.env` (only `.env.example` may be committed). Strictly zero emojis in code, assets, Markdown, or commits.

## 5. Portability, Containers & Agent Autonomy

- **Cross-platform**: the same `justfile` runs under POSIX `sh` (Linux, macOS, WSL2, containers) and PowerShell 7 (Windows). Recipes use forward-slash paths rooted at `SRC_ROOT` (default: the justfile directory). `archguard` resolves its root from `--root`, then `$SRC_ROOT`, then the nearest ancestor holding `src.lock.json`.
- **Containers (never Debian/Ubuntu)**: Alpine for light images, Arch Linux for heavy toolchain images, Nix (`flake.nix`) as the non-container alternative. `Dockerfile` (stages `builder` Alpine, `runtime` Alpine, `dev` Arch) + `compose.yaml` (`dev`, `verify`, `runtime`). Versions are build args overridable from the environment (`.env.example` section 0). `just docker-build`, `just docker-shell`, `just docker-runtime`, `just docker-run <recipe>`, `just nix-shell`. Policy and checklists: `.agents/skills/containers-alpine-arch-k8s/SKILL.md`.
- **Offline docs**: `third_party/docs-ecosystem/` (Docker, Kubernetes, nix.dev, Arch/Alpine image repos), pinned in `src.lock.json`, refreshed by `just docs-sync`.
- **Agent autonomy**: agents run unrestricted by default. The shared PreToolUse guard `.agents/scripts/pre-tool-guard.ts` serves both `agy` (`.agents/hooks.json`) and Claude Code (`.claude/settings.json`) and is controlled by `AGENT_GUARD=off|warn|enforce` (default `off`).
- **Skills**: `.agents/skills/` is the single source of truth. Claude Code reads it through the `.claude/skills` junction created by `install.ps1` (on Unix: `ln -s ../.agents/skills .claude/skills`).

## 6. Steam Ecosystem Knowledge (`steam` plugin)

- **Source**: `apps/rosegriffon/plugins/steam` (Claude Code plugin, local marketplace `apps/rosegriffon/.claude-plugin/marketplace.json`, enabled as `steam@rosegriffon-plugins`).
- **Skills for every agent**: mirrored as `.agents/skills/steam-*` (steam-web-api, steam-auth, steam-ids-and-urls, steam-content-cdn, steam-client-windows, steam-linux-proton, steam-community-tools, steam-local-inspect). Edit them in the plugin, then re-copy the `skills/*` directories here (paths `${CLAUDE_PLUGIN_ROOT}` become `apps/rosegriffon/plugins/steam`).
- **MCP for any client**: `bun run apps/rosegriffon/plugins/steam/servers/steam-mcp.ts` (stdio, no dependencies). Tools: `web_api_call` (uses `STEAM_WEB_API_KEY` when set), `store_appdetails`, `resolve_steamid`, `local_apps`, `read_vdf`, `app_paths`, `steamdb_link` (links only).
- **Local CLI**: `bun run apps/rosegriffon/plugins/steam/scripts/steam-inspect.ts apps|app|paths|appinfo|vdf`.
