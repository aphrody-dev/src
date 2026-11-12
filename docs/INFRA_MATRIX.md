# Infrastructure matrix

Single map of everything the monorepo runs on. Sources of truth are cited per section; this file
summarizes them and must be updated in the same change when they move. Secrets are referenced by
environment variable name only (values live in `C:\src\.env`, managed by `packages/env-kit`).

Owner decision 2026-11-12: **usa = all production, fr1 = builds and heavy storage, fr2 = assets,
CDN, cron jobs and cloud/VPS sync.**

## 1. Machines

| Node | SSH | Provider | Public IP | Mesh IP | Role | Source |
|---|---|---|---|---|---|---|
| `usa` | `ssh prd` (root, key `hostinger_us_ed25519`) | Hostinger VPS | 72.60.186.43 | 10.200.77.5 | **production**: every public service | `deploy.toml` `[nodes.usa]`, `~/.ssh/config` |
| `fr1` | `ssh vps` (ubuntu) | OVHcloud VPS | 51.77.147.152 | 10.200.77.1 | **builds and heavy storage**: CI runners, cargo/bun/Chromium builds, artifact and backup storage | `[nodes.fr1]` |
| `fr2` | `ssh cdn` (ubuntu) | OVHcloud VPS | 51.255.162.6 | 10.200.77.3 | **assets and CDN origin, cron jobs, sync** between R2, GCS and the VPS | `[nodes.fr2]` |
| workstation | local | ASUS ROG Strix G35CA | LAN 192.168.0.24 | - | development; i7-13700F (8P+8E, 24T, x86-64-v3), 32 GiB DDR5-5800, RTX 4070 12 GiB, Micron 2400 NVMe 1 TB, Windows 11 Pro 26H1 build 28120, UEFI + Secure Boot, Hyper-V root | `ay sys` |

Hardware of the three VPS: run `ay sys` on each (`ay build --target linux-musl`, copy the binary,
`ay sys --no-tools`; `sudo` adds DIMMs and sockets) and paste the summary here.

Mesh: WireGuard + MASQUE overlay `10.200.77.0/24`, config generated in `infra/mesh-vn/generated`.

## 2. Services (all on `usa`, blue/green ports)

| Service | Runtime | Domains | Port (blue/green) | R2 bucket |
|---|---|---|---|---|
| aphrody | Bun fullstack | aphrody.com, www | 3000 (13000/23000) | aphrody-assets |
| shenron (community, maintained) | Bun fullstack | dragonballfr.com, www, tv | 3100 | shenron-cdn |
| rosegriffon (community, maintained) | Bun fullstack | rosegriffon.fr, www | 3320 | rosegriffon-media |
| ai-os | Bun fullstack | ai.aphrody.com | 4000 | - |
| rust-stack / depot daemon | Rust | depot.internal.aphrody.com | 4100 | - |
| ai-triad | Bun fullstack | triad.aphrody.com, gemini-egress.internal | 4200 | - |
| ring3-agent | Rust | r3d.internal.aphrody.com | 8080 | - |
| yolo | Bun fullstack | yolo.aphrody.com, yolo.aphrody.app | 3092 | - |

Reverse proxy: Caddy, generated `infra/generated/Caddyfile`; systemd units in
`infra/generated/systemd/`. Deploy engine: `ay deploy` (Go `src-deploy`, `infra/cmd/src-deploy`).

## 3. Cloud providers and accounts

| Provider | Use | Access | Env keys |
|---|---|---|---|
| Cloudflare | DNS for all zones, R2 buckets, CDN, Workers | Claude plugin `cloudflare` (OAuth, `mcp.cloudflare.com`), `wrangler` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN` |
| Google Cloud | project `aphrody` (europe-west1): Cloud Run, Gemini | `gcloud` (env-kit `accounts` principals ai/owner/org/sa) | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION` |
| OVHcloud | fr1, fr2 | official `ovhcloud` CLI (`~/.local/bin`) | `OVH_ENDPOINT`, `OVH_APPLICATION_KEY`, `OVH_APPLICATION_SECRET`, `OVH_CONSUMER_KEY` |
| Hostinger | usa | MCP server `hostinger` (`.mcp.json`, `hostinger-api-mcp`, 409 operations) | `HOSTINGER_API_TOKEN` |
| GitHub | org `aphrody-dev`, repos, Actions, secrets | `gh` (scopes admin:org, repo, workflow, delete_repo), Claude plugin `github` | `GH_TOKEN` = `GITHUB_TOKEN` = `GITHUB_PERSONAL_ACCESS_TOKEN` (coupled by env-kit) |
| Vercel | preview deployments | Claude plugin `vercel`, `vercel` CLI | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` |
| Neon / Supabase | managed Postgres | MCP connectors | `NEON_API_KEY`, `SUPABASE_*`, `DATABASE_URL` |
| crates.io / npm | `aphrody*` crates, `@aphrody/*` packages | cargo, bun | `CARGO_REGISTRY_TOKEN` (move out of the plain user environment) |

Setting a credential everywhere it is needed: `bun run --cwd packages/env-kit src/cli.ts set <KEY> <VALUE>`
writes `.env`, the Windows user environment and the editor configs; `env-kit doctor` audits them
masked.

## 4. Data

| Store | Where | Notes |
|---|---|---|
| Postgres | Neon/Supabase (managed); historical replica on fr2 | `DATABASE_URL` |
| SQLite (`bun:sqlite`) | per app on `usa` | app data dirs, backed up to fr1 |
| Object storage | Cloudflare R2 (`aphrody-assets`, `shenron-cdn`, `rosegriffon-media`) | origin cache on fr2 |
| Build artifacts, backups | fr1 | heavy storage |

## 5. Software and system dependencies

| Layer | Versions | Source |
|---|---|---|
| Rust | nightly 1.101 (edition 2024), targets msvc, gnu, musl, wasm32, android | `rustup`, `ay build --list` |
| Bun / Node | 1.4.4 / 26.13 | `src.lock.json` |
| Go | 1.27 | `infra/go.mod` |
| C/C++ | MSVC 19.51, clang 23.1.4, zig 0.17 (musl cross C compiler) | `ay sys` |
| Containers | Docker 29.9 (Alpine runtime, Arch dev images) | `Dockerfile`, `compose.yaml` |
| WASM | `gamescope-web-wasm`, wasm32 presets of `ay build` | `crates/` |
| Linux VPS | static musl binaries from `ay build --target linux-musl` (zig as C compiler) | `docs/WINDOWS_UNIX_TOOLCHAIN.md` |

## 6. Products

Aphrody products: aphrody.com (`apps/aphrody`), aphrody.app (`apps/aphrody-app`), `packages/ai-os`.
Community products maintained by Aphrody (not Aphrody products): dragonballfr.com (`apps/shenron`),
rosegriffon.fr (`apps/rosegriffon`). Separate project: Aphrody Labs (`C:\labs`, labs.aphrody.com).
