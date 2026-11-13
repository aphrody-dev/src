# Global production stack (plan, 2026-11-13)

Facts from `infra/deploy.toml`, `docs/infra/HOSTING-POLICY.md`, `docs/infra/GCP-BILLING.md`, `docs/infra/MIGRATION-VERCEL-CF.md`, `docs/ARCHITECTURE.md`, `docs/AY_MIGRATION.md` and package manifests read today. Spend or account changes go to `var/agents/outbox/`, never executed.

## Providers

| Provider | Role | Evidence |
|---|---|---|
| Cloudflare (Free) | DNS, Workers (aphrody, aphrody-app, downloads/cdn via r2-site, api), R2 (`aphrody-dist`, `aphrody-assets`, `shenron-cdn`, `rosegriffon-media`), D1/KV for small state, Tunnel to prd | `[hosting.*] target = "cf"`; limits in HOSTING-POLICY.md |
| Vercel | No target: team softBlocked since 2026-06; once lifted, only `commercial = false` apps | HOSTING-POLICY.md rule 4 |
| OVHcloud | fr1 (51.77.147.152, factory/CI) and fr2 (51.255.162.6, edge/nginx) VPS | `[nodes.fr1]`, `[nodes.fr2]` |
| Hostinger | prd/usa (72.60.186.43): production backends, shenron and rosegriffon stacks | `[nodes.usa]` |
| GCloud | Credits-bound project, billing capped by `billing-agent`; use only within credits (not transferable between billing accounts) | GCP-BILLING.md |

Placement: static to Workers Static Assets or R2; dynamic under 10 ms CPU and 100k req/day account-wide on Workers, else on prd behind a Worker proxy; heavy state on prd (HOSTING-POLICY rules 1-3).

## SQL and auth (already in the repo)

- SQL: PostgreSQL on prd for shenron (`postgres` driver in `apps/shenron/package.json`, `shenron-postgres` container) and rosegriffon (`DATABASE_URL`, `SUPABASE_*` in `.env.example`); `bun:sqlite` for local stores (`packages/core`); D1/KV for small read-mostly Worker data. Pick: Postgres on prd as primary, D1 only for edge reads.
- Auth: Better Auth (`better-auth` 1.7.14 in shenron, 1.7.16 in `apps/auto/packages/tenancy`, plus oauth-provider, passkey, mcp plugins; `@better-auth/agent-auth` in rosegriffon). Pure-Rust variant in `crates/rust-stack/src/auth.rs`. The ai-os relay serves OAuth 2.1. Pick: Better Auth on Postgres.

## Sub-app inventory

| Sub-app | Exists in the repo | Detail |
|---|---|---|
| yolo (hub/legacy) | Yes | `apps/yolo` (server, PRD, tests); `yolo.aphrody.com` answers; image `yolo` port 23092. It is a hub site, not a game: no legacy game code was found. |
| Wii OS | No | Only `docs/AY_MIGRATION.md` mentions `wii-os` (feeds `wii-os-shenron`, port 8780, community; code lived at `/srv/yolo-fleet/wii-os`, to move to `apps/shenron` or delete). Not in `apps/` or `crates/`. |
| Bun OS | No | `bun-os` repo is 404 per AY_MIGRATION.md (3.2 GB under `/root/src/bun-os` on hosts, step 0 then delete). `crates/bun-flat` and `third_party/bun` exist but are the Bun runtime, not an OS. |
| Emulator | No | Switch/3DS/NDS/Wii emulator crates (`ruzu-*`, `aphrody-wii-*`) are listed in RUST_6_ORGS_FUSION_INVENTORY.md as in another org; none under `crates/`. |
| Android | Partial | `apps/aphrody-app/crates/aphrody-android`; `third_party/android-skills` (agent skills only). No Android runtime/Waydroid in the repo (waydroid appears only in the bun-os backup). |
| Unix | Yes | `crates/unix-cachyos`, `unix-distro`, `unix-omarchy`, `unix-uutils`; `apps/unixwin`; `third_party/omarchy*`, `uutils-coreutils`. |
| Wayland in browser | Partial | `crates/smithay-wayland-wire`, `cosmic-compat`, `gamescope-web-wasm`, `infra/gamescope-web`; compiles on Linux only for the wire part (ARCHITECTURE.md). No end-to-end browser compositor verified here. |
