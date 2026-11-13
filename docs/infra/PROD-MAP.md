# Production map (2026-11-13)

Read-only inventory of live state, mapped to src. Statuses: SRC (served from src), BROUGHT (captured into src on this date), ORPHAN (live, source not in src), LEGACY (old vision or dead), DUPLICATE (same service served twice). Nothing was stopped or deleted; every decommission is a held command in `var/agents/outbox/decommission.md` (local, untracked). Raw lists: `var/inv/` (untracked). HTTP codes measured from the PC with `curl`.

Providers read: Cloudflare (account `ca22c1a5...`, 5 zones, 17 Workers, 11 R2 buckets, 1 D1, 1 KV, 5 tunnels), Hostinger (1 VPS = prd, KVM 8, Arch), OVH (fr1, fr2 by ssh; CLI lists no VPS or domain), Vercel (0 deployments, 0 domains), GCloud (project list and Cloud Run and Compute empty or unauthenticated). The `cf` token lacks DNS scope; DNS was read through the Cloudflare MCP.

## Hostnames

| Hostname | Provider path | Source in src | Status | Action | Parity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| aphrody.com, www | CF Worker `aphrody` + tunnel mig-prd to HAProxy to `aphrody-src-aphrody-1` (200, www 301) | `apps/aphrody`, `apps/aphrody/wrangler.toml`, `infra/docker`, `just deploy` | SRC | merge into the Aphrody app | |
| aphrody.app, www | CF Worker `aphrody-deploy` (200) | `packages/deploy/wrangler.toml` | SRC | merge with aphrody.com | `apps/aphrody-app/wrangler.toml` removal is staged by another session; `bun.aphrody.*` uses Worker `aphrody-app` |
| bun.aphrody.com, bun.aphrody.app | Worker `aphrody-app` (200) | `apps/aphrody-app` | SRC | verify config survives the staged deletion | |
| api.aphrody.com | Worker `api-aphrody-com` (200) | `infra/cloudflare/workers/api-gateway` | SRC | | |
| cdn.aphrody.com | Worker `cdn-aphrody-com` + origin container (200) | `apps/r2-site` (`worker_name = cdn-portable`, not deployed) | DUPLICATE | adopt `cdn-portable`, then retire stub | stub script is 3278 bytes, same as 3 others |
| downloads.aphrody.com | Worker `downloads-aphrody-com` (404) | `apps/r2-site` (`downloads-portable` exists, unbound) | DUPLICATE, BROKEN | bind `downloads-portable` (account change, outbox) | |
| creator.aphrody.com | Worker `creator-aphrody-com` (200) | `infra/cloudflare/workers/creator-aphrody-com`, `infra/fleet/fr2/nginx/sites/creator.aphrody.com.conf` | BROUGHT | | |
| yolo.aphrody.com, yolo.aphrody.app | Worker `yolo-aphrody-com` (script empty, 200) | `apps/yolo` | SRC | verify origin path | |
| video.aphrody.com | Worker `bun-video-showcase` (200) | `infra/cloudflare/workers/bun-video-showcase` | BROUGHT | | |
| auto.aphrody.com | tunnel auto-usa to `auto-web` (200) | `apps/auto` (submodule) | SRC | | |
| ai.aphrody.com, triad | mig-prd to `ai-os` containers (200) | `packages/ai-os`, `deploy.toml` | SRC | | |
| mig-test, mig-depot, mig-commons, mig-downloads, ssh-prd, ssh-fr2, fleet-failover-test, dbfr | tunnels mig-prd, fr2 | `infra/cloudflare/cloudflare.toml`, `infra/cluster` | SRC | | |
| admin, console, control (Access, 302) | mig-prd + Access | `infra/cloudflare/cloudflare.toml` `[access]` | SRC | | |
| mail, drive, meet, search, translate, status, store, chat, bxc, inacord, n2b, nie, bot, mcp, auth (.aphrody.com) | proxied CNAME to mig-prd wildcard; all serve the Aphrody home page (200) | none (alias of apex) | DUPLICATE | delete 15 DNS records (outbox) | no distinct feature: same HTML as apex |
| art, cad, calendar, design, docs, fig, maps, os, pdf, photos, play, sheets, slides, sound (.aphrody.com) | Worker routes to `aphrody-webos` (404) | `infra/cloudflare/workers/aphrody-webos` | LEGACY | delete 14 records and routes (outbox) | worker returns 404 for these hosts, nothing to preserve |
| *craft.aphrody.app (14), apt, app-*.aphrody.app (14), assets, dist, video, bun-lib (.aphrody.app) | Worker `aphrody-webos`: craft hosts 404, `apt`, assets, dist, video, bun-lib 200 | `infra/cloudflare/workers/aphrody-webos` | BROUGHT | the Craft Apps move into the merged app (`docs/games/PLAN.md` section 6); keep until then | `app-*` and `*craft` return 404 today |
| shell.aphrody.app | Worker `aphrody-app-site` (200) | `apps/aphrody-app` (stub 3278 bytes) | DUPLICATE | fold into merged app | |
| desktop.aphrody.app | tunnel prod to :8793 (502) | none | LEGACY | delete record (outbox) | dead origin |
| api, auth, craft, deploy, git, play, source, nie (.aphrody.app) | `*.aphrody.app` to mig-prd or worker (302 Access or 404) | `infra/cloudflare/cloudflare.toml` | SRC | | |
| recette-auto.aphrody.com | CNAME to deleted tunnel (530) | none | LEGACY | delete record (outbox) | |
| vps.aphrody.com | DNS only A and AAAA to fr1 | `deploy.toml [nodes.fr1]` | SRC | | |
| dbfr.aphrody.com, nie.aphrody.com/.app, cdn.rosegriffon.fr | A to fr2 or tunnel mig-prd (200 or 404) | `infra/fleet/fr2*/nginx` | SRC | | |
| dragonballfr.com, www, bot, mcp, origin-cdn | tunnel shenron-dbfr to prd nginx (200) | `apps/shenron` (submodule), `infra/deploy.toml [services.shenron]` | SRC | | |
| cdn.dragonballfr.com | Worker `shenron-cdn` (200) | `infra/cloudflare/workers/shenron-cdn` | BROUGHT | | live json vars `MANIFEST_*` must be read before redeploy |
| files, game-api, play .dragonballfr.com | A to prd, proxied (200) | `apps/shenron` | SRC | | |
| rosegriffon.fr, www, achillea, azalee, shop, api, db, mcp, ranked | A to prd, nginx to `rosegriffon-*` containers (200) | `apps/rosegriffon` (submodule), `infra/fleet/prd/nginx/conf.d/rosegriffon-stack.conf` | SRC | | |
| bot.rosegriffon.fr, cdn.rosegriffon.fr, r2.rosegriffon.fr | 404 | `apps/rosegriffon` | SRC | check parity of the Discord bot host | |
| rosegriffon-maintenance Worker | no route | `infra/cloudflare/workers/rosegriffon-maintenance` | BROUGHT | | |
| rpbey.fr | OVH nginx on fr1 and fr2, domain not in the CF account (200) | `infra/fleet/fr2/nginx/sites/rpbey.fr.conf` | SRC | | |
| 3dland.tech | CF zone pending, parked at Hostinger | none | ORPHAN | none | no records |
| aphrody-email-worker (Email Routing, D1, KV) | CF Worker | `infra/cloudflare/workers/aphrody-email-worker` | BROUGHT | | |
| aphrody-github Worker | CF Worker | `infra/cloudflare/workers/github-app` | SRC | | |
| aphrody-com Worker | no route or domain | none | DUPLICATE | delete (outbox) | |

## Units, containers, timers

| Unit or container | Host | Source in src | Status | Action |
| :--- | :--- | :--- | :--- | :--- |
| `aphrody-src-*` compose (aphrody, cdn, downloads, api-gateway, ai-os x2) | prd, fr1, fr2 | `infra/docker/compose.yaml`; images are tagged `:smoke`, pin by sha | SRC | pin tags in the next deploy |
| `rosegriffon-*` compose (website, core, model-serve, nginx, redis, pg) | prd, `/root/src/rosegriffon-stack` | `apps/rosegriffon` | SRC | path outside the src checkout |
| `shenron-*` compose (site, bot, gateway, postgres, redis, compute, embed, chat, cloudflared) | prd, `/srv/shenron` | `apps/shenron` | SRC | |
| `auto-*` compose (web, api, worker, llm, s3, postgres, tunnel) | prd, `/srv/auto` | `apps/auto` | SRC | |
| agent-relay-broker, aphrody-gpu-depot, commons-relay, aphrody-cluster-haproxy, cloudflared-*, fleet-*, src-checkout-update, aphrody-agents-sync | all | `infra/fleet`, `infra/cluster`, `infra/cloudflare` | SRC | |
| ay-ai-litellm | prd | `infra/ai` | SRC | |
| loreserver, lore-r2-backup | prd | `crates/lore-server`; backup unit now in `infra/fleet/prd/orphans/systemd` | BROUGHT | |
| shenron-cdn-origin, shenron-cloudflare-audit, shenron-cloudflare-s3-renew, shenron-dbfr-backup, shenron-container-backup, rg-cdn-sync, rg-steam-depot, auto-sauvegarde | prd | units and scripts in `infra/fleet/prd/orphans`; payload scripts under `/srv/shenron/config/cloudflare/cli` live in the shenron submodule | BROUGHT (units), ORPHAN (payload: move into `apps/shenron`) | install with `just fleet-orphans prd` |
| nginx vhosts | prd | `infra/fleet/prd/nginx`; fr1 and fr2 in `infra/fleet/fr1-orig`, `infra/fleet/fr2*` | BROUGHT | |
| fr1-archive-r2, nativelink-server, rg-retire-systemd | fr1 | `infra/fleet/fr1/orphans`; nativelink config in `infra/chromium-factory/nativelink` | BROUGHT | `just fleet-orphans fr1` |
| wii-os-shenron (port 8780, 31 MB tree with `main.dol`, not git) | prd | none | LEGACY | not imported (proprietary console content); stop command in outbox |
| lighttpd-maint, ua-timer, certbot, apt and distro timers | fr1, fr2 | distro | n/a | |
| `llama-server` :8799, tigervnc, lightpanda on fr1 | fr1 | `infra/ai`, none | ORPHAN | owner of each to be named |

## Storage

| Resource | Source in src | Status |
| :--- | :--- | :--- |
| R2 aphrody-assets, aphrody-dist | `deploy.toml [hosting.cdn, hosting.downloads]` | SRC |
| R2 aphrody-chromium, aphrody-lore, aphrody-archive | `infra/chromium-factory`, `lore-r2-backup`, `fr1-archive-r2` | BROUGHT |
| R2 aphrody-video | `bun-video-showcase` | BROUGHT |
| R2 shenron-cdn, dbfr-backups, rosegriffon-cdn | shenron, rosegriffon | SRC |
| R2 bun-lib, bun-os-private | none | ORPHAN (owner to name a source or retire) |
| D1 aphrody-app (0 tables), KV aphrody-app-cache | `aphrody-email-worker` bindings | BROUGHT; D1 has no tables: LEGACY candidate |

Counts: see the report of the session; tables above are the source.
