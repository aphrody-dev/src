# src: agent operating contract (`AGENTS.md`)

Read by every agent CLI (Claude Code, Codex, Antigravity, OpenCode, Pi, Zed). Rewritten on 2026-11-13 around [`docs/games/PLAN.md`](docs/games/PLAN.md); earlier "sovereign" wording and its rules are withdrawn.

## 1. What src is

src is the public monorepo of Aphrody. Its direction is a game engine and creative suite built in the open: Bevy as engine, the Craft Apps and ArtCraft as creative tools, `crates/tv-*` and FFmpeg for media, Unreal Engine by interop only (private fork, never published), on top of the existing platform work (Bun and Rust tooling, deploy, Linux and Windows layers). State and work order: `docs/games/PLAN.md`. Nothing of that refactor is built yet; say so when asked.

## 2. Layout (`ls` of each directory, 2026-11-14)

- [`apps/`](apps): `aphrody` (SEO, static assets and Wayland WASM; `aphrody-app` merged), `auto`, `l2l`, `nt`, `r2b`, `rosegriffon`, `shenron`, `unixwin`; `rosegriffon` and `shenron` are the only git submodules and are community sites Aphrody maintains, not Aphrody products. (`r2-site` and `yolo` were merged/purged into `infra/cloudflare` and `packages/deploy`).
- [`packages/`](packages): Bun `@aphrody/*` packages (`ai-os`, `assets`, `browser`, `chromium-bun`, `core`, `deploy`, `design`, `env-kit`, `ffi-bridge`, `gaming`, `i18n`, `machine`, `native`, `net`, `release`, `shell-matrix`, `upstream`, `vault`, `wck`).
- [`crates/`](crates): Rust 2024 crates in one flat workspace (`ay`, `archguard`, `xtask`, `depot-*`, `lore*`, `taffy`, `aphrody-ui`, `aphrody-env`, `aphrody-vault`, `aphrody-v8`, `aphrody-cef`, `hypr-tiler`, `cosmic-compat`, `corelib`, `core`, `core-capi`, `ffi`, `rust-stack`, `gamescope-*`, `steam-depot`, `unix-omarchy`, `tv-*`, `bench`, ...).
- [`infra/`](infra): fleet and deploy configuration assembled from upstream tools (`docs/infra/UPSTREAM-STACK.md`).
- [`third_party/`](third_party): upstream checkouts and aphrody-labs forks, flat, pinned in `src.lock.json`, listed in `third_party/forks.txt`.

## 3. How agents work here

- Agents are free: no approval step, no confirmation, no human in the loop. Decide, execute, verify, report what is and is not done.
- Everything is committed and pushed directly on `main`; no branches, no worktrees, never push to an upstream.
- Single interface: `just` and the `ay` CLI (`docs/NAMING.md`). Rust compiles in CI or on fr1, never on the workstation; prd runs production backends only, fr2 the edge.
- UI framework is free (Dioxus 0.8 + Blitz + AnyRender + Vello, GPUI + gpui-kit + `embedded_gpui` + Longbridge `nsh`, `taffy`, Ratatui TUI, Bevy UI, WinUI 3, WebUI, fused in `crates/aphrody-ui` `fusion` and exposed via `ay ui`): the criteria are rendering quality, performance and function. Tokens come from `packages/design` and `crates/aphrody-ui` (`docs/DESIGN_SYSTEM.md`, `docs/ui/STACK.md`).
- AI features live in `packages/ai-os` only; providers and models are discovered at run time, none is hard-coded.
- Publish in the open: public repositories, GitHub releases and tags, crates.io and npm, once a secret scan of the repository is clean (`docs/publish/STATUS.md`).

## 4. Limits that stay

These are facts about other people's rights and about damage that cannot be undone, not process rules.

- Secrets: never print, log or commit values from `.env`; only `.env.example` is committed. The repository is public.
- Licenses: the owner accepted all licenses on 2026-11-13 and declared every source free to take verbatim, without compromise (`docs/legal/LICENSE-QUEUE.md`). Agents do not gate, skip, replace or rewrite anything for license or trademark reasons; they download, extract, absorb, build and deploy from the source. Unreal Engine stays an interop-only private fork by the owner's plan (`docs/games/PLAN.md`).
- Host system directories (`C:\Windows\System32`) are not modified; userland binaries go to `~/.local/bin`.
- No emoji and no AI attribution in code, documents, UI text or commits. Upstream contributions follow the upstream policy (`docs/upstream/STRATEGY.md`).
- Domain purity checked by `ay arch check --strict`: `crates/*` is Rust only, `packages/*` is Bun only, upstream code stays in `third_party/`.

## 5. Gaming and Steam

Ownership map: [`docs/gaming/OWNERSHIP.md`](docs/gaming/OWNERSHIP.md). Rust: `crates/steam-depot` (`ay steam`). Bun: `packages/gaming` (`ay gaming`). Plugin and MCP: `apps/rosegriffon/plugins/steam`; its skills are edited there and mirrored by `ay gaming skills sync`.
