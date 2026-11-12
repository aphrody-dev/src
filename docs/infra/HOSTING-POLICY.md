# Hosting policy: Cloudflare Free + VPS (Vercel Hobby on hold)

Date 2026-11-12. Source of truth: `deploy.toml` (`[nodes.*]`, `[services.*]`, `[hosting.*]`). Renderer: `bun scripts/deploy-target.ts <app> <cf|vercel|vps> [--preview]`. Portable runtime: `packages/runtime-adapter`.

## Free-tier limits (read from the official docs on 2026-11-12)

| Product | Free limit | Source |
|---|---|---|
| Workers requests | 100,000/day, reset 00:00 UTC, then error 1027 | developers.cloudflare.com/workers/platform/limits |
| Workers CPU | 10 ms per HTTP request, 10 ms per Cron Trigger | same |
| Cron Triggers | 5 per account | same |
| Static Assets | requests free and unlimited; 20,000 files per Worker version | workers/platform/pricing, limits |
| D1 | 5 M rows read/day, 100,000 rows written/day, 10 databases; enforced (queries fail) since 2026-09-01 | d1/platform/pricing, changelog 2026-09-01 |
| KV | 100,000 reads/day, 1,000 writes/deletes/lists per day, 1 GB stored | kv/platform/pricing |
| R2 | 10 GB-month, 1 M Class A/month, 10 M Class B/month, free egress | r2/pricing |
| Vercel Hobby | 1 M function invocations, 4 h Active CPU, 360 GB-h memory, 100 GB Fast Data Transfer, 1 M CDN requests, 300 s max duration, cron at most once per day | vercel.com/docs/plans/hobby, cron-jobs/usage-and-pricing |
| Vercel Hobby use | non-commercial personal use only | vercel.com/docs/limits/fair-use-guidelines#commercial-usage |

Source conflict: the `cloudflare.config.ts` docs name the Worker field `bindings`, but the schema in cf 1.0.0-beta.31 / wrangler 4.161.0 accepts `env`. The generator emits `env`.

## Placement rules

1. Static content goes to Workers Static Assets (free, unlimited requests). Files over 25 MiB, or more than 20,000 files, go to R2 behind the `r2-site` app.
2. Dynamic code on Workers only if it stays under 10 ms CPU and 100k req/day for the whole account. Otherwise it runs on the VPS (prd) and the Worker proxies to it.
3. State goes to the VPS when it exceeds D1/KV quotas (KV allows only 1,000 writes/day). Small read-mostly data can go to D1/KV.
4. Vercel: **no target while the team's softBlock lasts (since 2026-06)**. Once it is lifted, only non-commercial apps (`commercial = false`) may go there; the generator refuses commercial apps and any cron that runs more than once a day.
5. Every app renders for all 3 targets. Nothing is hardcoded: IPs, ports, buckets and domains come from deploy.toml, and secrets from Workers secrets, Vercel env or `/etc/aphrody/<app>.env` (0600).

## App matrix

| App / service | Placement | Reason (limit) | Commercial |
|---|---|---|---|
| aphrody.com (`apps/aphrody`) | CF Worker `aphrody` (Static Assets) + `/api /g /search` -> prd origin (`ORIGIN_URL`) | assets free/unlimited; Bun search origin > 10 ms CPU | **yes** (ads.txt, sellers.json): Vercel forbidden |
| aphrody.app (`apps/aphrody-app`) | CF Static Assets (wrangler) | static WebGPU shell | yes (product) |
| downloads.aphrody.com | CF `r2-site` + R2 `aphrody-dist` | large files, R2 egress free, 10 M Class B/month | no |
| cdn.aphrody.com | CF `r2-site` + R2 `aphrody-assets` | same | no |
| creator.aphrody.com | CF Worker + R2 (done) | static 132 MB > 20k-file / 25 MiB risk | no |
| api.aphrody.com | CF Worker (static OpenAPI) + prd backends | backends > 10 ms | yes |
| dragonballfr.com (`shenron/apps/site`, Next) | prd (`shenron-site` container) behind CF; optional second target: vinext on workers.dev, preview only | SSR + Postgres + i18n, way above 10 ms CPU | yes (shop): Vercel forbidden |
| shenron bot/gateway/chat/compute/embed | prd | long-running, websocket, GPU | — |
| shenron-cdn (`shenron/deploy/cloudflare/wrangler.jsonc`) | CF Worker + R2 `shenron-cdn` | static media | — |
| yolo, auto, r2b, l2l, shenron activity/server | prd (Bun services) | stateful or long-running; move to CF only if stateless and < 10 ms | — |
| ai-os, ai-triad, ring3-agent, depot | prd | daemons, Google egress | — |
| loreserver, backups, fleet-health | prd | disk, mesh | — |
| Chromium/LLVM builds | fr1 only | builds | — |
| fr2 | nginx edge for the remaining VPS vhosts + test machine | — | — |
| rosegriffon | out of scope | — | — |

## Paid services -> self-hosted

| Paid | Replacement | Adapter |
|---|---|---|
| Neon / Vercel Postgres | Postgres on prd (Hyperdrive in front for Workers if needed: free on Workers Free per workers/platform/pricing) | `SQL=url` + `DATABASE_URL` |
| Vercel Blob / S3 | R2 (free tier) or MinIO on prd | `STORAGE=r2:<B>` / `STORAGE=s3` (+`S3_ENDPOINT`) |
| Upstash Redis / Vercel KV | Redis/Valkey on prd | `KV=redis` + `REDIS_URL` |
| Vercel Cron / CF Cron beyond 5 per account | systemd timer on prd (`<app>-<cron>.timer`) | `crons` in `[hosting.<app>]` |
| AI APIs (OpenAI, AI Gateway) | `llama-server` on prd (OpenAI-compatible) | `OPENAI_BASE_URL` per env |
| Vercel Analytics / Speed Insights | CF Web Analytics (free) | — |

## Operation

- Render: `bun scripts/deploy-target.ts downloads cf --preview --out apps/r2-site`, then `cf deploy --dry-run && cf deploy` (projects with a wrangler config: `bunx wrangler deploy --dry-run` then `bunx wrangler deploy`).
- VPS: `bun scripts/deploy-target.ts downloads vps` produces `downloads.service` (prd) and `downloads.conf` (fr2 nginx -> prd mesh_ip:port).
- Before any switch: `curl` the preview (/, /health, 404, `Range` -> 206 + same ETag as prod).

## Status 2026-11-12

| Item | Status | One-line rollback |
|---|---|---|
| `downloads-portable.aphrody-labs.workers.dev` (r2-site on runtime-adapter) | preview OK: health, 206 `bytes 0-9/90`, same ETag as prod. Production domain still on `downloads-aphrody-com` | — (no switch) |
| aphrody.com + www -> Worker `aphrody` (Static Assets, dist built on prd) | **switched**; /, /en, robots, 404 identical byte for byte to the old one; `/api/*` now 503 "Origin not configured" (prd:3000 is down, it was 404 before) | route `01bf0381…` script=`aphrody-com` + custom domain www -> `aphrody-com` (old Worker kept) |
| aphrody.app | not switched: `apps/aphrody-app/dist` missing, and `web/index.html` differs from prod by 39 bytes | — |
| React/Next (`shenron/apps/site`) | audit: `optimizePackageImports` already set, `Promise.all` on the wiki pages, 7 `next/dynamic`; no change and no build measured (separate repo, other agent) | — |

## Note for the 502 agent (coordination through files)

- `aphrody.com`/`www` now point to Worker `aphrody` (wrangler, `apps/aphrody`). When prd:3000 is back, set `ORIGIN_URL` (Worker var) to the public origin; `aphrody-com` (r2-site) is no longer used, delete it once the backend is validated.
- Do not touch `downloads-aphrody-com` or `downloads-portable`: the cutover to the portable app is just moving the custom domain, after your validation.
