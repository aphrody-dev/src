# Infrastructure matrix

Single map of everything the monorepo runs on. Sources of truth are cited per section; this file
summarizes them and must be updated in the same change when they move. Secrets are referenced by
environment variable name only (values live in `C:\src\.env`, managed by `packages/env-kit`).

Owner decision 2026-11-13: **usa (prd) = production backends only, minimal, no compilers. fr1 = the
factory (builds, CI runner, training, heavy agents). fr2 = edge only, minimal.** Upstream tool per
infrastructure brick (versions, source commits, rollback): `docs/infra/UPSTREAM-STACK.md`.
Agents run as user `agent` on every host (sudo NOPASSWD, docker, linger); heavy jobs only on fr1
(`aphrody-heavy`, exit 64 elsewhere). Reboot/crash survival and the reboot proofs: `docs/infra/RESILIENCE.md`.

## 1. Machines

| Node        | SSH                                          | Provider             | Public IP        | Mesh IP     | Role                                                                                                                                                                        | Source                                             |
| ----------- | -------------------------------------------- | -------------------- | ---------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `usa`       | `ssh prd` (root, key `hostinger_us_ed25519`) | Hostinger VPS        | 72.60.186.43     | 10.200.77.5 | **production backends only**: compose `core`, products, no compilers                                                                                                        | `infra/deploy.toml` `[nodes.usa]`, `~/.ssh/config` |
| `fr1`       | `ssh vps` (ubuntu)                           | OVHcloud VPS         | 51.77.147.152    | 10.200.77.1 | **factory**: Chromium/LLVM, image builds (buildx `aphrody`), CI runner `fr1`, training, heavy agents                                                                        | `[nodes.fr1]`                                      |
| `fr2`       | `ssh cdn` (ubuntu)                           | OVHcloud VPS         | 51.255.162.6     | 10.200.77.3 | **edge only**: nginx/HAProxy cache shard, cloudflared, self-host edge containers                                                                                            | `[nodes.fr2]`                                      |
| workstation | local                                        | ASUS ROG Strix G35CA | LAN 192.168.0.24 | -           | development; i7-13700F (8P+8E, 24T, x86-64-v3), 32 GiB DDR5-5800, RTX 4070 12 GiB, Micron 2400 NVMe 1 TB, Windows 11 Pro 26H1 build 28120, UEFI + Secure Boot, Hyper-V root | `ay sys`                                           |

Hardware and software of the three VPS, surveyed read-only over SSH on 2026-11-12. Running `ay sys`
on each node will add CPU, DIMM and firmware detail.

| Node  | Platform               | CPU                   | RAM                                  | Disk                                       | OS / kernel                | Containers                                                                                                                                                       | Notes                                                                                                                                                                                        |
| ----- | ---------------------- | --------------------- | ------------------------------------ | ------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `usa` | Hostinger KVM 8        | 8 vCPU AMD EPYC 9354P | 32 GiB                               | 400 GB `/` (18% used)                      | Arch Linux, kernel 7.2.11  | Docker: 10 in the briefing; 13 running of 18 defined during the survey, while the rosegriffon compose stack restarted. Compose projects `shenron`, `rosegriffon` | `/dev/shm` is 18 GB, 12 GB of it held by the `yolo-ram-cache` slab; build cache 18.0 GB (12.0 GB reclaimable)                                                                                |
| `fr1` | OVH OpenStack instance | 12 vCPU Intel Haswell | 45 GiB                               | 290 GB `/` (76-77%) + 805 GB `/home` (85%) | Ubuntu 26.10, kernel 7.3.0 | Docker: 14 running of 17 defined. Compose projects `aphrody`, `komodo`, `nie-sre-service`                                                                        | Waydroid (Android 17 session); load average 52 during the survey; build cache 30.8 GB (18 GB reclaimable); 25 volumes, 18.2 GB (18 GB unused); mounts fr2 `/srv/yolo_build_cache` over sshfs |
| `fr2` | OVH OpenStack instance | 6 vCPU Intel Haswell  | 11 GiB (+1 GB swapfile, 2.8 GB zram) | 96 GB `/` (89-90%)                         | Ubuntu 26.10, kernel 7.3.0 | Docker installed, no daemon running                                                                                                                              | exports `/srv/yolo_build_cache` to fr1 over sshfs (user `yolo-build`). `nfs-server` is installed but there is no `/etc/exports`. `/home/ubuntu` holds 59 GB, mostly duplicate clones         |

Mesh: WireGuard + MASQUE overlay `10.200.77.0/24`, config generated in `infra/mesh-vn/generated`.

## 2. Services (target: all on `usa`, blue/green ports)

As of 2026-11-12, aphrody.com, aphrody.app and their subdomains are still served from fr1. The
per-domain cutover table is in `docs/AY_MIGRATION.md`.

| Service                             | Runtime        | Domains                                   | Port (blue/green)  | R2 bucket          |
| ----------------------------------- | -------------- | ----------------------------------------- | ------------------ | ------------------ |
| aphrody                             | Bun fullstack  | aphrody.com, www                          | 3000 (13000/23000) | aphrody-assets     |
| shenron (community, maintained)     | Bun fullstack  | dragonballfr.com, www, tv                 | 3100               | shenron-cdn        |
| rosegriffon (community, maintained) | Bun fullstack  | rosegriffon.fr, www                       | 3320               | rosegriffon-media  |
| ai-os                               | Bun fullstack  | ai.aphrody.com                            | 4000               | -                  |
| rust-stack / depot daemon           | Rust           | depot.internal.aphrody.com                | 4100               | -                  |
| ai-triad                            | Bun fullstack  | triad.aphrody.com, gemini-egress.internal | 4200               | -                  |
| ring3-agent                         | Rust           | r3d.internal.aphrody.com                  | 8080               | -                  |
| yolo                                | Bun fullstack  | yolo.aphrody.com, yolo.aphrody.app        | 3092               | -                  |
| auto (on usa since 2026-11-12)      | Bun + Rust FFI | auto.aphrody.com (tunnel `auto-usa`)      | none (auto-prod)   | - (RustFS auto-s3) |

Reverse proxy: nginx vhosts + HAProxy cluster layer (`infra/cluster`, `docs/infra/CLUSTER.md`) behind Cloudflare.
Deploy: upstream only, `docker buildx bake` (CI `images.yml`) + `docker compose up --wait` (`just deploy`, `ay deploy <sub>`
= `just docker-<sub>`); the Go `src-deploy` engine and its Caddyfile/systemd generator were removed on 2026-11-13.

## 3. Cloud providers and accounts

| Provider        | Use                                                                                                                             | Access                                                                                                     | Env keys                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Cloudflare      | DNS for aphrody.com, aphrody.app, dragonballfr.com, rosegriffon.fr (active) and 3dland.tech (pending); R2 buckets, CDN, Workers | Claude plugin `cloudflare` (OAuth, `mcp.cloudflare.com`), `wrangler`, REST API with `CLOUDFLARE_API_TOKEN` | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`               |
| Google Cloud    | project `aphrody` (europe-west1): Cloud Run, Gemini                                                                             | `gcloud` (env-kit `accounts` principals ai/owner/org/sa)                                                   | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION`                                       |
| OVHcloud        | fr1, fr2                                                                                                                        | official `ovhcloud` CLI (`~/.local/bin`)                                                                   | `OVH_ENDPOINT`, `OVH_APPLICATION_KEY`, `OVH_APPLICATION_SECRET`, `OVH_CONSUMER_KEY` |
| Hostinger       | usa                                                                                                                             | MCP server `hostinger` (`.mcp.json`, `hostinger-api-mcp`, 409 operations)                                  | `HOSTINGER_API_TOKEN`                                                               |
| GitHub          | org `aphrody-dev`, repos, Actions, secrets                                                                                      | `gh` (scopes admin:org, repo, workflow, delete_repo), Claude plugin `github`                               | `GH_TOKEN` = `GITHUB_TOKEN` = `GITHUB_PERSONAL_ACCESS_TOKEN` (coupled by env-kit)   |
| Vercel          | preview deployments                                                                                                             | Claude plugin `vercel`, `vercel` CLI                                                                       | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`                                |
| Neon / Supabase | managed Postgres                                                                                                                | MCP connectors                                                                                             | `NEON_API_KEY`, `SUPABASE_*`, `DATABASE_URL`                                        |
| crates.io / npm | `aphrody*` crates, `@aphrody/*` packages                                                                                        | cargo, bun                                                                                                 | `CARGO_REGISTRY_TOKEN` (move out of the plain user environment)                     |

Setting a credential everywhere it is needed: `bun run --cwd packages/env-kit src/cli.ts set <KEY> <VALUE>`
writes `.env`, the Windows user environment and the editor configs; `env-kit doctor` audits them
masked.

Account notes (2026-11-12):

- OVH: the API keys in `~/.ovh.conf` are identical on the workstation, fr1 and fr2. They belong to
  account `ka1038251-ovh`, which owns only the domain `rosegriffon.fr` and no VPS. fr1 and fr2
  belong to other OVH accounts, whose API keys are not configured yet. Until they are, the OVH API
  cannot manage either VPS.
- Cloudflare: `CLOUDFLARE_API_TOKEN` is set and verified active. It reads the DNS of all five
  zones.
- Host credentials from usa, fr1 and fr2 were merged into `C:\src\.env` with `env-kit merge`. When
  hosts had different values for a key, each was stored as `KEY__USA`, `KEY__FR1` or `KEY__FR2`.
  Today that covers `GH_TOKEN__{USA,FR1,FR2}` and `GOOGLE_APPLICATION_CREDENTIALS__FR1`.

## 4. Data

| Store                 | Where                                                                                                       | Notes                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Postgres              | Neon/Supabase (managed); containers on usa (shenron, rosegriffon) and fr1 (`rg-inagle-pg`, `yolo-crawl-pg`) | `DATABASE_URL`. fr2 keeps only `/etc/postgresql/18`, with no data and no unit: the old replica is gone |
| SQLite (`bun:sqlite`) | per app on `usa`                                                                                            | app data dirs; backups go off-host to R2 (fr1 is the factory, fr2 is edge only)                        |
| Object storage        | Cloudflare R2 (`aphrody-assets`, `shenron-cdn`, `rosegriffon-media`)                                        | caching edge on fr2 (`cdn.rosegriffon.fr`)                                                             |
| Build artifacts       | fr1                                                                                                         | build caches only, no production data                                                                  |

## 5. Software and system dependencies

| Layer      | Versions                                                                     | Source                           |
| ---------- | ---------------------------------------------------------------------------- | -------------------------------- |
| Rust       | nightly 1.101 (edition 2024), targets msvc, gnu, musl, wasm32, android       | `rustup`, `ay build --list`      |
| Bun / Node | 1.4.4 / 26.13                                                                | `src.lock.json`                  |
| Go         | 1.27                                                                         | `infra/go.mod`                   |
| C/C++      | MSVC 19.51, clang 23.1.4, zig 0.17 (musl cross C compiler)                   | `ay sys`                         |
| Containers | Docker 29.9 (Alpine runtime, Arch dev images)                                | `Dockerfile`, `compose.yaml`     |
| WASM       | `gamescope-web-wasm`, wasm32 presets of `ay build`                           | `crates/`                        |
| Linux VPS  | static musl binaries from `ay build --target linux-musl` (zig as C compiler) | `docs/WINDOWS_UNIX_TOOLCHAIN.md` |

## 6. Products

Aphrody products: aphrody.com (`apps/aphrody`), aphrody.app (`apps/aphrody-app`), `packages/ai-os`.
Community products maintained by Aphrody (not Aphrody products): dragonballfr.com (`apps/shenron`),
rosegriffon.fr (`apps/rosegriffon`). Aphrody Labs (labs.aphrody.com) is merged into this repository since 2026-11-12 (README, section Labs).
