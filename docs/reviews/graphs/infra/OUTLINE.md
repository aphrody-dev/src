# Codebase Digest: infra

- Files analyzed: 392
- Total lines: 13178
- Total size: 522.0 KB
- Git branch: `main`
- Git HEAD commit: `272c544f (docker: ship vendor icons, wallpaper thumbs and crates/game/assets to the bun-build stage (aphrody, r2-site, api-gateway images))`
- Digest mode: `AST-Smart Outline`

## Directory Structure

```text
infra/
├── DEPS.rules (2 lines, 91 B, ~23 tokens)
├── README.md (23 lines, 2.4 KB, ~655 tokens)
├── agents/
│   ├── bootstrap-user.sh (1 lines, 35 B, ~11 tokens)
│   ├── fleet.toml (112 lines, 2.9 KB, ~884 tokens)
│   ├── gh-token.test.ts (5 lines, 110 B, ~34 tokens)
│   ├── gh-token.ts (8 lines, 364 B, ~107 tokens)
│   ├── github-events.test.ts (3 lines, 84 B, ~26 tokens)
│   ├── github-events.ts (12 lines, 473 B, ~138 tokens)
│   ├── install-pc.sh (1 lines, 35 B, ~11 tokens)
│   ├── install.sh (2 lines, 50 B, ~17 tokens)
│   ├── pre-push (9 lines, 447 B, ~131 tokens)
│   ├── runner.test.ts (7 lines, 189 B, ~58 tokens)
│   ├── runner.ts (60 lines, 2.6 KB, ~791 tokens)
│   ├── systemd/
│   │   ├── aphrody-agents-health.service (10 lines, 350 B, ~103 tokens)
│   │   ├── aphrody-agents-health.timer (9 lines, 144 B, ~38 tokens)
│   │   ├── aphrody-agents-pull.service (9 lines, 410 B, ~115 tokens)
│   │   ├── aphrody-agents-pull.timer (9 lines, 148 B, ~39 tokens)
│   │   └── aphrody-agents.service (29 lines, 986 B, ~276 tokens)
│   ├── tasks/
│   │   ├── deps-update.json (8 lines, 751 B, ~214 tokens)
│   │   ├── product-page-rosegriffon.json (5 lines, 482 B, ~135 tokens)
│   │   ├── product-page-shenron.json (5 lines, 498 B, ~144 tokens)
│   │   ├── release-notes.json (5 lines, 635 B, ~182 tokens)
│   │   └── seo-check.json (5 lines, 804 B, ~220 tokens)
│   └── toolchain.toml (250 lines, 7.7 KB, ~2.3k tokens)
├── ai/
│   ├── ai.toml (324 lines, 10.3 KB, ~3.3k tokens)
│   ├── fabric/
│   │   └── node.sh (16 lines, 341 B, ~119 tokens)
│   ├── fabric.toml (122 lines, 5.0 KB, ~1.5k tokens)
│   ├── litellm-overlay.toml (32 lines, 1.2 KB, ~336 tokens)
│   ├── litellm-serve.ts (5 lines, 112 B, ~35 tokens)
│   └── systemd/
│       ├── ay-ai-litellm.service.d/
│       │   └── 10-creds.conf (15 lines, 877 B, ~219 tokens)
│       └── install-prd.sh (1 lines, 35 B, ~11 tokens)
├── chromium-factory/
│   ├── args/
│   │   └── labs_agent.gn (36 lines, 1.8 KB, ~463 tokens)
│   ├── chromium-factory.sh (5 lines, 110 B, ~39 tokens)
│   ├── cros-factory.sh (6 lines, 130 B, ~47 tokens)
│   ├── factory.toml (62 lines, 1.6 KB, ~481 tokens)
│   ├── nativelink/
│   │   ├── deploy.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── server.json5 (68 lines, 1.9 KB, ~510 tokens)
│   │   └── worker.json5 (56 lines, 1.5 KB, ~411 tokens)
│   └── systemd/
│       ├── chromium-factory.service (22 lines, 1.1 KB, ~290 tokens)
│       ├── chromium-factory.timer (7 lines, 150 B, ~40 tokens)
│       └── cros-factory.service (17 lines, 710 B, ~193 tokens)
├── cloudflare/
│   ├── aop.ts (4 lines, 92 B, ~29 tokens)
│   ├── cf.ts (4 lines, 158 B, ~45 tokens)
│   ├── cloudflare.toml (291 lines, 19.3 KB, ~5.7k tokens)
│   ├── expected-status.json (148 lines, 8.0 KB, ~2.5k tokens)
│   ├── fleet-token.ts (3 lines, 92 B, ~30 tokens)
│   ├── lib.ts (12 lines, 473 B, ~142 tokens)
│   ├── proof.ts (10 lines, 401 B, ~123 tokens)
│   ├── recon.ts (4 lines, 90 B, ~28 tokens)
│   ├── ssh-ca.ts (2 lines, 51 B, ~16 tokens)
│   ├── tunnel-token.ts (2 lines, 54 B, ~18 tokens)
│   └── workers/
│       ├── aphrody-email-worker/
│       │   ├── index.js (3 lines, 116 B, ~37 tokens)
│       │   ├── index.js.map (1 lines, 4.3 KB, ~1.3k tokens)
│       │   └── wrangler.jsonc (16 lines, 569 B, ~181 tokens)
│       ├── aphrody-webos/
│       │   ├── index.js (4 lines, 167 B, ~48 tokens)
│       │   └── wrangler.jsonc (11 lines, 348 B, ~117 tokens)
│       ├── api-gateway/
│       │   ├── api.aphrody.com.toml (11 lines, 380 B, ~112 tokens)
│       │   ├── selfhost.ts (6 lines, 188 B, ~58 tokens)
│       │   └── worker.js (3 lines, 125 B, ~39 tokens)
│       ├── bun-video-showcase/
│       │   ├── worker.js (9 lines, 465 B, ~123 tokens)
│       │   └── wrangler.jsonc (13 lines, 435 B, ~145 tokens)
│       ├── creator-aphrody-com/
│       │   ├── worker.js (3 lines, 114 B, ~35 tokens)
│       │   └── wrangler.jsonc (11 lines, 342 B, ~118 tokens)
│       ├── github-app/
│       │   ├── cloudflare.config.ts (4 lines, 105 B, ~34 tokens)
│       │   ├── package.json (12 lines, 392 B, ~136 tokens)
│       │   ├── src/
│       │   │   ├── index.test.ts (3 lines, 76 B, ~24 tokens)
│       │   │   └── index.ts (6 lines, 228 B, ~67 tokens)
│       │   ├── tsconfig.json (10 lines, 355 B, ~116 tokens)
│       │   └── vite.config.ts (3 lines, 83 B, ~24 tokens)
│       ├── rosegriffon-maintenance/
│       │   ├── worker.js (2 lines, 72 B, ~22 tokens)
│       │   └── wrangler.jsonc (6 lines, 188 B, ~63 tokens)
│       └── shenron-cdn/
│           ├── worker.mjs (13 lines, 656 B, ~180 tokens)
│           └── wrangler.jsonc (13 lines, 399 B, ~136 tokens)
├── cluster/
│   ├── cluster.just (21 lines, 880 B, ~253 tokens)
│   ├── compose.capped.yaml (29 lines, 1.1 KB, ~292 tokens)
│   ├── dedup.ts (1 lines, 35 B, ~11 tokens)
│   ├── deploy.sh (2 lines, 48 B, ~16 tokens)
│   ├── gen.ts (13 lines, 464 B, ~141 tokens)
│   ├── generated/
│   │   ├── fr1/
│   │   │   ├── aphrody-cluster.slice (6 lines, 152 B, ~42 tokens)
│   │   │   ├── haproxy.cfg (288 lines, 12.4 KB, ~3.3k tokens)
│   │   │   └── nginx-cluster.conf (191 lines, 8.6 KB, ~2.0k tokens)
│   │   ├── fr2/
│   │   │   ├── aphrody-cluster.slice (2 lines, 100 B, ~27 tokens)
│   │   │   ├── haproxy.cfg (278 lines, 12.5 KB, ~3.4k tokens)
│   │   │   └── nginx-cluster.conf (191 lines, 8.6 KB, ~2.0k tokens)
│   │   ├── prd/
│   │   │   ├── aphrody-cluster.slice (2 lines, 100 B, ~27 tokens)
│   │   │   ├── haproxy.cfg (310 lines, 12.2 KB, ~3.3k tokens)
│   │   │   └── nginx-cluster.conf (233 lines, 10.4 KB, ~2.4k tokens)
│   │   └── ssh/
│   │       ├── aphrody-ssh-mesh (13 lines, 638 B, ~196 tokens)
│   │       └── ssh_config.host (25 lines, 868 B, ~207 tokens)
│   ├── pki.sh (1 lines, 35 B, ~11 tokens)
│   ├── proof.sh (2 lines, 48 B, ~16 tokens)
│   ├── standby.sh (1 lines, 35 B, ~11 tokens)
│   └── systemd/
│       ├── aphrody-cluster-haproxy.service (23 lines, 821 B, ~231 tokens)
│       ├── cloudflared-mig-prd.service (18 lines, 844 B, ~226 tokens)
│       └── nginx-restart.conf (4 lines, 132 B, ~33 tokens)
├── deploy.toml (427 lines, 16.3 KB, ~5.2k tokens)
├── docker/
│   ├── Dockerfile (1 lines, 36 B, ~11 tokens)
│   ├── Dockerfile.dockerignore (36 lines, 757 B, ~240 tokens)
│   ├── compose.yaml (200 lines, 6.5 KB, ~2.0k tokens)
│   ├── docker-bake.hcl (113 lines, 4.2 KB, ~1.3k tokens)
│   └── smoke.sh (1 lines, 35 B, ~11 tokens)
├── fleet/
│   ├── ACME.md (32 lines, 2.3 KB, ~686 tokens)
│   ├── RUNBOOK.md (78 lines, 10.5 KB, ~3.0k tokens)
│   ├── backup-age.pub (1 lines, 63 B, ~9 tokens)
│   ├── bin/
│   │   ├── agents-sync.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── build-all.sh (3 lines, 64 B, ~22 tokens)
│   │   ├── deploy-images.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── fleet-backup.sh (4 lines, 97 B, ~33 tokens)
│   │   ├── fleet-dns-failover-test.sh (4 lines, 75 B, ~28 tokens)
│   │   ├── fleet-dns-failover.sh (6 lines, 124 B, ~44 tokens)
│   │   ├── fleet-health.sh (4 lines, 88 B, ~30 tokens)
│   │   ├── fleet-host-idle.sh (2 lines, 48 B, ~16 tokens)
│   │   ├── fleet-kill-test.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── fleet-notify.sh (4 lines, 91 B, ~33 tokens)
│   │   ├── fleet-ping.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── fleet-reboot-precheck.sh (2 lines, 55 B, ~18 tokens)
│   │   ├── fleet-rebuild.sh (3 lines, 74 B, ~24 tokens)
│   │   ├── fleet-resilience-proof.sh (8 lines, 153 B, ~56 tokens)
│   │   ├── fleet-resilience-remote.sh (3 lines, 73 B, ~25 tokens)
│   │   ├── fleet-resilience.sh (13 lines, 268 B, ~95 tokens)
│   │   ├── fleet-setup.sh (3 lines, 60 B, ~22 tokens)
│   │   ├── fleet-tune.sh (18 lines, 420 B, ~140 tokens)
│   │   ├── fleet-wg-failover.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── fork-sync.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── gh-runners.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── heavy.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── orphans-install.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── rg-steam-fill.sh (7 lines, 146 B, ~54 tokens)
│   │   ├── src-checkout-update.sh (7 lines, 140 B, ~51 tokens)
│   │   ├── ssh22-probe-install.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── ssh22-probe.sh (2 lines, 49 B, ~16 tokens)
│   │   ├── terminal-prd-build.sh (5 lines, 116 B, ~41 tokens)
│   │   └── third-party-sync.sh (2 lines, 53 B, ~18 tokens)
│   ├── bootstrap/
│   │   ├── common.sh (23 lines, 605 B, ~193 tokens)
│   │   ├── fr1.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── fr2.sh (1 lines, 35 B, ~11 tokens)
│   │   └── prd.sh (1 lines, 35 B, ~11 tokens)
│   ├── cache.toml (68 lines, 2.9 KB, ~931 tokens)
│   ├── ffmpeg-lgpl/
│   │   └── build.sh (1 lines, 35 B, ~11 tokens)
│   ├── fr1/
│   │   ├── limits/
│   │   │   └── 90-chromium-build.conf (5 lines, 201 B, ~46 tokens)
│   │   ├── orphans/
│   │   │   ├── bin/
│   │   │   │   ├── fr1-r2.sh (1 lines, 35 B, ~11 tokens)
│   │   │   │   └── retire-vps-systemd.sh (2 lines, 49 B, ~16 tokens)
│   │   │   └── systemd/
│   │   │       ├── fr1-archive-r2.service (12 lines, 274 B, ~78 tokens)
│   │   │       ├── nativelink-server.service (17 lines, 445 B, ~117 tokens)
│   │   │       ├── rg-retire-systemd.service (10 lines, 342 B, ~94 tokens)
│   │   │       └── rg-retire-systemd.timer (11 lines, 294 B, ~82 tokens)
│   │   ├── resilience.conf (22 lines, 2.0 KB, ~598 tokens)
│   │   ├── sysctl/
│   │   │   └── 90-fr1-chromium-host.conf (74 lines, 2.7 KB, ~738 tokens)
│   │   ├── systemd/
│   │   │   ├── fleet-fwd-commons.service (8 lines, 230 B, ~68 tokens)
│   │   │   ├── fleet-fwd-commons.socket (7 lines, 196 B, ~61 tokens)
│   │   │   ├── fleet-fwd-gpu-depot.service (8 lines, 234 B, ~71 tokens)
│   │   │   ├── fleet-fwd-gpu-depot.socket (7 lines, 198 B, ~63 tokens)
│   │   │   ├── fork-sync.service (9 lines, 235 B, ~68 tokens)
│   │   │   └── fork-sync.timer (10 lines, 188 B, ~55 tokens)
│   │   └── tune.conf (17 lines, 753 B, ~201 tokens)
│   ├── fr1-orig/
│   │   └── nginx/
│   │       ├── conf.d/
│   │       │   ├── 00-nie-zones.conf (2 lines, 122 B, ~29 tokens)
│   │       │   ├── 01-tuning.conf (53 lines, 1.8 KB, ~432 tokens)
│   │       │   ├── 02-compression.conf (13 lines, 676 B, ~175 tokens)
│   │       │   ├── 03-zstd.conf (13 lines, 634 B, ~163 tokens)
│   │       │   ├── 04-proxy-cache.conf (5 lines, 398 B, ~90 tokens)
│   │       │   ├── achillea.rosegriffon.fr.conf (40 lines, 1.2 KB, ~309 tokens)
│   │       │   ├── aphrody.conf (47 lines, 1.4 KB, ~366 tokens)
│   │       │   ├── azalee.rosegriffon.fr.conf (40 lines, 1.2 KB, ~308 tokens)
│   │       │   ├── cdn.aphrody.com.conf (131 lines, 4.5 KB, ~1.2k tokens)
│   │       │   ├── cloudflare-realip.conf (28 lines, 1.1 KB, ~336 tokens)
│   │       │   ├── creator.aphrody.com.conf (39 lines, 923 B, ~248 tokens)
│   │       │   ├── downloads.aphrody.com.conf (87 lines, 3.1 KB, ~793 tokens)
│   │       │   ├── fleet-api.conf (357 lines, 16.7 KB, ~4.0k tokens)
│   │       │   ├── rg-core.conf (185 lines, 6.3 KB, ~1.6k tokens)
│   │       │   ├── rosegriffon.fr.conf (48 lines, 1.5 KB, ~391 tokens)
│   │       │   └── rpbey.fr.conf (35 lines, 733 B, ~207 tokens)
│   │       ├── nginx.conf (89 lines, 1.8 KB, ~492 tokens)
│   │       ├── sites-available/
│   │       │   ├── default (91 lines, 2.4 KB, ~668 tokens)
│   │       │   └── omar.aphrody.com (34 lines, 880 B, ~229 tokens)
│   │       └── snippets/
│   │           ├── aphrody-android.inc (9 lines, 617 B, ~155 tokens)
│   │           ├── aphrody-cdn-static.inc (44 lines, 2.6 KB, ~725 tokens)
│   │           ├── aphrody-chat.inc (7 lines, 529 B, ~137 tokens)
│   │           ├── aphrody-craft.inc (5 lines, 355 B, ~95 tokens)
│   │           ├── aphrody-google.inc (9 lines, 639 B, ~170 tokens)
│   │           ├── aphrody-security.inc (4 lines, 309 B, ~79 tokens)
│   │           ├── aphrody-status.inc (14 lines, 1.0 KB, ~288 tokens)
│   │           ├── aphrody-status.inc.bak-20261105 (19 lines, 940 B, ~246 tokens)
│   │           ├── aphrody-store-api.inc (5 lines, 369 B, ~103 tokens)
│   │           ├── aphrody-store.inc (48 lines, 2.7 KB, ~729 tokens)
│   │           ├── fastcgi-php.conf (13 lines, 423 B, ~109 tokens)
│   │           ├── nie-assets.inc (29 lines, 2.0 KB, ~558 tokens)
│   │           ├── proxy-client-ip.inc (3 lines, 161 B, ~41 tokens)
│   │           └── snakeoil.conf (5 lines, 217 B, ~58 tokens)
│   ├── fr2/
│   │   ├── bin/
│   │   │   ├── fleet-standby-sync.sh (1 lines, 35 B, ~11 tokens)
│   │   │   └── fr2-edge-fw.sh (1 lines, 35 B, ~11 tokens)
│   │   ├── nftables/
│   │   │   └── firewall.nft (22 lines, 1.2 KB, ~323 tokens)
│   │   ├── nginx/
│   │   │   ├── conf.d/
│   │   │   │   └── aop.conf (19 lines, 1.1 KB, ~318 tokens)
│   │   │   ├── sites/
│   │   │   │   ├── aphrody.com.conf (91 lines, 3.0 KB, ~776 tokens)
│   │   │   │   ├── api.aphrody.com.conf (354 lines, 16.7 KB, ~4.0k tokens)
│   │   │   │   ├── cdn.aphrody.com.conf (134 lines, 4.7 KB, ~1.2k tokens)
│   │   │   │   ├── creator.aphrody.com.conf (42 lines, 1.0 KB, ~287 tokens)
│   │   │   │   ├── downloads.aphrody.com.conf (90 lines, 3.3 KB, ~860 tokens)
│   │   │   │   ├── omar.aphrody.com.conf (35 lines, 944 B, ~249 tokens)
│   │   │   │   └── rpbey.fr.conf (36 lines, 797 B, ~227 tokens)
│   │   │   └── snippets/
│   │   │       ├── aphrody-security.inc (4 lines, 309 B, ~79 tokens)
│   │   │       ├── fleet-only.inc (5 lines, 320 B, ~86 tokens)
│   │   │       ├── fleet-peers.geo (12 lines, 466 B, ~154 tokens)
│   │   │       └── proxy-client-ip.inc (3 lines, 161 B, ~41 tokens)
│   │   ├── resilience.conf (22 lines, 1.9 KB, ~553 tokens)
│   │   ├── systemd/
│   │   │   ├── cloudflared-fr2.service (25 lines, 1.2 KB, ~340 tokens)
│   │   │   ├── fleet-firewall.service (15 lines, 402 B, ~112 tokens)
│   │   │   ├── fleet-standby-sync.service (9 lines, 268 B, ~74 tokens)
│   │   │   ├── fleet-standby-sync.timer (8 lines, 159 B, ~46 tokens)
│   │   │   ├── fr2-edge-fw.service (15 lines, 498 B, ~144 tokens)
│   │   │   └── fr2-edge-fw.timer (11 lines, 185 B, ~48 tokens)
│   │   └── tune.conf (14 lines, 479 B, ~134 tokens)
│   ├── fr2-orig/
│   │   └── nginx/
│   │       ├── conf.d/
│   │       │   ├── fleet-api.conf (208 lines, 8.6 KB, ~2.2k tokens)
│   │       │   └── rosegriffon-cdn.conf (51 lines, 1.8 KB, ~516 tokens)
│   │       ├── nginx.conf (85 lines, 1.5 KB, ~438 tokens)
│   │       ├── sites/
│   │       │   └── rosegriffon.fr.conf (44 lines, 1.4 KB, ~367 tokens)
│   │       └── snippets/
│   │           ├── fastcgi-php.conf (13 lines, 423 B, ~109 tokens)
│   │           ├── rosegriffon-cdn-edge.inc (24 lines, 1.7 KB, ~424 tokens)
│   │           └── snakeoil.conf (5 lines, 217 B, ~58 tokens)
│   ├── nix/
│   │   ├── flake.lock (48 lines, 1.1 KB, ~309 tokens)
│   │   ├── flake.nix (39 lines, 1.3 KB, ~357 tokens)
│   │   └── home.nix (52 lines, 1.5 KB, ~426 tokens)
│   ├── pc/
│   │   └── resilience.ps1 (44 lines, 2.9 KB, ~860 tokens)
│   ├── prd/
│   │   ├── 00-fleet-sshd.conf (4 lines, 133 B, ~29 tokens)
│   │   ├── nginx/
│   │   │   ├── conf.d/
│   │   │   │   ├── aphrody-cluster.conf (233 lines, 10.4 KB, ~2.4k tokens)
│   │   │   │   ├── cloudflare-realip.conf (28 lines, 1.1 KB, ~336 tokens)
│   │   │   │   ├── rosegriffon-stack.conf (65 lines, 2.7 KB, ~744 tokens)
│   │   │   │   └── zz-fleet-standby.conf (226 lines, 9.6 KB, ~2.5k tokens)
│   │   │   ├── nginx.conf (13 lines, 455 B, ~116 tokens)
│   │   │   └── snippets/
│   │   │       └── rosegriffon-stack-proxy.inc (21 lines, 898 B, ~211 tokens)
│   │   ├── orphans/
│   │   │   ├── bin/
│   │   │   │   ├── backup-shenron-container.py (20 lines, 433 B, ~132 tokens)
│   │   │   │   ├── sauvegarde.sh (1 lines, 35 B, ~11 tokens)
│   │   │   │   ├── shenron-dbfr-backup.ts (2 lines, 71 B, ~22 tokens)
│   │   │   │   └── sync-cdn.sh (2 lines, 50 B, ~17 tokens)
│   │   │   └── systemd/
│   │   │       ├── auto-sauvegarde.service (8 lines, 184 B, ~50 tokens)
│   │   │       ├── auto-sauvegarde.timer (9 lines, 146 B, ~45 tokens)
│   │   │       ├── lore-r2-backup.service (5 lines, 176 B, ~53 tokens)
│   │   │       ├── lore-r2-backup.timer (7 lines, 125 B, ~34 tokens)
│   │   │       ├── rg-cdn-sync.service (11 lines, 352 B, ~98 tokens)
│   │   │       ├── rg-cdn-sync.timer (9 lines, 137 B, ~37 tokens)
│   │   │       ├── rg-steam-depot.service (21 lines, 978 B, ~263 tokens)
│   │   │       ├── rg-steam-depot.timer (9 lines, 134 B, ~36 tokens)
│   │   │       ├── shenron-cdn-origin.service (15 lines, 401 B, ~117 tokens)
│   │   │       ├── shenron-cloudflare-audit.service (24 lines, 852 B, ~226 tokens)
│   │   │       ├── shenron-cloudflare-audit.timer (11 lines, 247 B, ~69 tokens)
│   │   │       ├── shenron-cloudflare-s3-renew.service (14 lines, 741 B, ~204 tokens)
│   │   │       ├── shenron-cloudflare-s3-renew.timer (12 lines, 225 B, ~59 tokens)
│   │   │       ├── shenron-container-backup.service (16 lines, 517 B, ~134 tokens)
│   │   │       ├── shenron-container-backup.timer (11 lines, 220 B, ~61 tokens)
│   │   │       ├── shenron-dbfr-backup.service (19 lines, 470 B, ~122 tokens)
│   │   │       └── shenron-dbfr-backup.timer (11 lines, 207 B, ~59 tokens)
│   │   ├── resilience.conf (24 lines, 2.9 KB, ~878 tokens)
│   │   ├── systemd/
│   │   │   ├── agent-relay-broker.service (14 lines, 543 B, ~149 tokens)
│   │   │   ├── aphrody-gpu-depot.service (16 lines, 631 B, ~175 tokens)
│   │   │   ├── aphrody-relay.service (32 lines, 1.2 KB, ~334 tokens)
│   │   │   ├── aphrody-relay.service.d/
│   │   │   │   └── 10-litellm.conf (9 lines, 826 B, ~226 tokens)
│   │   │   ├── commons-relay.service (20 lines, 1.1 KB, ~330 tokens)
│   │   │   ├── fleet-apps.slice (10 lines, 219 B, ~56 tokens)
│   │   │   ├── fleet-tunnel-nativelink.service (10 lines, 477 B, ~140 tokens)
│   │   │   ├── nativelink-worker.service.d/
│   │   │   │   └── 10-tunnel.conf (5 lines, 126 B, ~37 tokens)
│   │   │   └── rg-steam-fill.service (28 lines, 920 B, ~258 tokens)
│   │   └── tune.conf (16 lines, 700 B, ~190 tokens)
│   ├── sysctl/
│   │   └── 90-aphrody-serve.conf (51 lines, 1.8 KB, ~500 tokens)
│   ├── systemd/
│   │   ├── aphrody-agents-sync.service (10 lines, 298 B, ~81 tokens)
│   │   ├── aphrody-agents-sync.timer (8 lines, 177 B, ~44 tokens)
│   │   ├── aphrody-auth-daemon.service (21 lines, 956 B, ~265 tokens)
│   │   ├── fleet-backup.service (10 lines, 259 B, ~73 tokens)
│   │   ├── fleet-backup.timer (8 lines, 173 B, ~52 tokens)
│   │   ├── fleet-clean.service (9 lines, 263 B, ~72 tokens)
│   │   ├── fleet-clean.timer (8 lines, 152 B, ~43 tokens)
│   │   ├── fleet-fwd-standby@.service (6 lines, 213 B, ~71 tokens)
│   │   ├── fleet-fwd-standby@.socket (8 lines, 353 B, ~106 tokens)
│   │   ├── fleet-health.service (10 lines, 352 B, ~95 tokens)
│   │   ├── fleet-health.timer (8 lines, 142 B, ~38 tokens)
│   │   ├── fleet-notify.service (8 lines, 248 B, ~70 tokens)
│   │   ├── fleet-notify.timer (8 lines, 141 B, ~38 tokens)
│   │   ├── fleet-reboot-when-idle.service (6 lines, 442 B, ~132 tokens)
│   │   ├── fleet-reboot-when-idle.timer (7 lines, 212 B, ~58 tokens)
│   │   ├── fleet-ssh22-probe.service (15 lines, 408 B, ~112 tokens)
│   │   ├── fleet-ssh22-probe.timer (11 lines, 172 B, ~45 tokens)
│   │   ├── fleet-tune.service (10 lines, 333 B, ~95 tokens)
│   │   ├── fleet-wg-failover@.service (6 lines, 190 B, ~58 tokens)
│   │   ├── fleet-wg-failover@.timer (8 lines, 149 B, ~41 tokens)
│   │   ├── src-checkout-update.service (11 lines, 319 B, ~86 tokens)
│   │   ├── src-checkout-update.timer (9 lines, 166 B, ~43 tokens)
│   │   ├── third-party-sync.service (12 lines, 354 B, ~99 tokens)
│   │   ├── third-party-sync.timer (8 lines, 161 B, ~46 tokens)
│   │   ├── yolo-clean.service (9 lines, 247 B, ~72 tokens)
│   │   └── yolo-clean.timer (9 lines, 133 B, ~40 tokens)
│   └── wg/
│       └── rotate-wg-win.sh (3 lines, 73 B, ~25 tokens)
├── gamescope-web/
│   ├── index.html (1 lines, 36 B, ~11 tokens)
│   ├── llms.txt (9 lines, 321 B, ~86 tokens)
│   ├── robots.txt (3 lines, 74 B, ~23 tokens)
│   ├── shaders/
│   │   ├── composite_hdr.wgsl (108 lines, 3.6 KB, ~1.0k tokens)
│   │   ├── easu.wgsl (141 lines, 4.7 KB, ~1.5k tokens)
│   │   └── rcas.wgsl (81 lines, 2.7 KB, ~803 tokens)
│   └── sitemap.xml (9 lines, 271 B, ~90 tokens)
├── gaming/
│   └── images.toml (27 lines, 1.7 KB, ~465 tokens)
├── gcloud/
│   ├── README.md (89 lines, 6.1 KB, ~1.7k tokens)
│   ├── share-aphrody-project-iam.ps1 (149 lines, 6.1 KB, ~1.7k tokens)
│   └── share-aphrody-project-iam.sh (4 lines, 113 B, ~36 tokens)
├── gcp/
│   └── billing-agent/
│       └── cap-function/
│           ├── index.js (3 lines, 122 B, ~36 tokens)
│           └── package.json (6 lines, 155 B, ~58 tokens)
├── generated/
│   ├── aphrody-app.service (17 lines, 373 B, ~105 tokens)
│   ├── aphrody-web.service (17 lines, 368 B, ~102 tokens)
│   ├── aphrody.nginx.conf (46 lines, 1.4 KB, ~365 tokens)
│   └── systemd/
│       ├── ay-up.service (20 lines, 822 B, ~223 tokens)
│       └── ay-up.timer (12 lines, 250 B, ~69 tokens)
├── gitlab/
│   ├── README.md (65 lines, 3.3 KB, ~966 tokens)
│   ├── arch-ci/
│   │   └── Dockerfile.arch-builder (94 lines, 4.4 KB, ~1.3k tokens)
│   ├── docker-compose.gitlab.yml (100 lines, 2.8 KB, ~746 tokens)
│   ├── gitlab-ci.yml (139 lines, 3.6 KB, ~1.1k tokens)
│   ├── gitlab.rb (89 lines, 3.2 KB, ~844 tokens)
│   ├── setup-triforge.ps1 (104 lines, 3.5 KB, ~997 tokens)
│   └── setup-triforge.sh (1 lines, 35 B, ~11 tokens)
├── linux/
│   ├── android/
│   │   ├── local_manifests/
│   │   │   └── aphrody-gki.xml (12 lines, 765 B, ~216 tokens)
│   │   └── mirror.sh (3 lines, 67 B, ~23 tokens)
│   ├── cross-windows/
│   │   ├── Dockerfile (1 lines, 35 B, ~11 tokens)
│   │   └── msvc.cmake (22 lines, 1.0 KB, ~308 tokens)
│   ├── gpu/
│   │   ├── amd.sh (2 lines, 49 B, ~16 tokens)
│   │   ├── manifest.toml (39 lines, 2.0 KB, ~607 tokens)
│   │   └── nvidia.sh (2 lines, 49 B, ~16 tokens)
│   ├── images/
│   │   ├── alpine/
│   │   │   └── Dockerfile (1 lines, 34 B, ~10 tokens)
│   │   ├── arch/
│   │   │   ├── Dockerfile (1 lines, 34 B, ~10 tokens)
│   │   │   └── makepkg-aphrody.conf (14 lines, 841 B, ~262 tokens)
│   │   ├── debian/
│   │   │   ├── Dockerfile (1 lines, 35 B, ~11 tokens)
│   │   │   ├── apt-norecommends.conf (2 lines, 64 B, ~19 tokens)
│   │   │   └── dpkg-nodoc.conf (6 lines, 208 B, ~68 tokens)
│   │   └── nix/
│   │       └── Dockerfile (1 lines, 34 B, ~10 tokens)
│   ├── kernels.toml (49 lines, 2.8 KB, ~789 tokens)
│   ├── patchsets.toml (155 lines, 4.2 KB, ~1.3k tokens)
│   └── systemd/
│       ├── fr1/
│       │   ├── aphrody-linux-mirror.service (12 lines, 428 B, ~115 tokens)
│       │   └── aphrody-linux-mirror.timer (10 lines, 179 B, ~50 tokens)
│       └── prd/
│           ├── aphrody-linux-watch.service (13 lines, 470 B, ~128 tokens)
│           └── aphrody-linux-watch.timer (10 lines, 169 B, ~47 tokens)
├── mail/
│   ├── README.md (86 lines, 7.5 KB, ~2.2k tokens)
│   ├── config/
│   │   └── stalwart.toml (235 lines, 5.8 KB, ~1.9k tokens)
│   ├── dns/
│   │   ├── cloudflare-mail-records.json (75 lines, 2.9 KB, ~986 tokens)
│   │   └── cloudflare-mail-records.zone (40 lines, 2.0 KB, ~543 tokens)
│   ├── docker-compose.mail.yml (68 lines, 2.2 KB, ~586 tokens)
│   └── mta-sts.txt (5 lines, 83 B, ~25 tokens)
├── nix/
│   └── flake.nix (50 lines, 1.3 KB, ~325 tokens)
├── pkg/
│   ├── distros.toml (52 lines, 1.9 KB, ~504 tokens)
│   └── recipes/
│       ├── aphrody-gpu-setup.toml (38 lines, 1.1 KB, ~336 tokens)
│       └── aphrody-sysctl.toml (29 lines, 894 B, ~277 tokens)
├── scripts/
│   ├── vendor.sh (1 lines, 35 B, ~11 tokens)
│   ├── zcc.cmd (1 lines, 70 B, ~23 tokens)
│   └── zcxx.cmd (1 lines, 71 B, ~24 tokens)
├── unixwin/
│   ├── fr1-test.sh (1 lines, 35 B, ~11 tokens)
│   └── prd-build.sh (2 lines, 53 B, ~18 tokens)
├── upstream/
│   ├── chromium-verify.sh (2 lines, 49 B, ~16 tokens)
│   ├── install.sh (1 lines, 35 B, ~11 tokens)
│   ├── patches/
│   │   └── linux-cachyos/
│   │       └── linux-cachyos_build_with_an_llvm_toolchain_directory_llvm_prefix.patch (58 lines, 2.1 KB, ~584 tokens)
│   ├── stacks.d/
│   │   ├── gaming.toml (256 lines, 6.6 KB, ~2.0k tokens)
│   │   └── google-labs.toml (133 lines, 3.9 KB, ~1.2k tokens)
│   ├── stacks.toml (116 lines, 3.9 KB, ~1.1k tokens)
│   ├── status/
│   │   ├── bun.toml (109 lines, 4.4 KB, ~1.2k tokens)
│   │   └── jules-action.toml (9 lines, 510 B, ~135 tokens)
│   └── systemd/
│       ├── aphrody-upstream.service (16 lines, 626 B, ~176 tokens)
│       └── aphrody-upstream.timer (11 lines, 285 B, ~80 tokens)
├── vault/
│   ├── hosts.toml (30 lines, 1.2 KB, ~352 tokens)
│   ├── policy.toml (20 lines, 867 B, ~249 tokens)
│   ├── profiles.toml (51 lines, 1.3 KB, ~405 tokens)
│   ├── systemd/
│   │   ├── aphrody-vault-apply.service (10 lines, 410 B, ~112 tokens)
│   │   └── aphrody-vault-apply.timer (12 lines, 265 B, ~69 tokens)
│   ├── test-host.sh (4 lines, 74 B, ~28 tokens)
│   └── vault-host.sh (4 lines, 84 B, ~29 tokens)
├── vcpkg/
│   ├── toolchains/
│   │   ├── linux-llvm.cmake (38 lines, 1.7 KB, ~450 tokens)
│   │   └── windows-llvm.cmake (38 lines, 1.7 KB, ~463 tokens)
│   └── triplets/
│       ├── x64-linux-llvm.cmake (10 lines, 615 B, ~154 tokens)
│       └── x64-windows-llvm.cmake (8 lines, 474 B, ~117 tokens)
└── wsl-distro/
    ├── arch-gitlab-manifest.json (133 lines, 7.4 KB, ~2.2k tokens)
    ├── kernel/
    │   ├── build-kernel.sh (1 lines, 35 B, ~11 tokens)
    │   └── wsl2-cachyos-omarchy-7.4.config (70 lines, 2.2 KB, ~545 tokens)
    ├── rootfs/
    │   ├── etc/
    │   │   ├── locale.conf (1 lines, 13 B, ~6 tokens)
    │   │   ├── makepkg.conf (23 lines, 899 B, ~266 tokens)
    │   │   ├── pacman.conf (41 lines, 1.0 KB, ~280 tokens)
    │   │   ├── sudoers.d/
    │   │   │   └── 10-wheel (1 lines, 35 B, ~11 tokens)
    │   │   ├── systemd/
    │   │   │   ├── masked-wsl-units.list (17 lines, 669 B, ~179 tokens)
    │   │   │   └── zram-generator.conf (2 lines, 206 B, ~52 tokens)
    │   │   ├── wsl-distribution.conf (13 lines, 420 B, ~118 tokens)
    │   │   └── wsl.conf (28 lines, 642 B, ~184 tokens)
    │   └── usr/
    │       └── lib/
    │           └── wsl/
    │               └── first-setup-aphrody-omarchy.sh (1 lines, 35 B, ~11 tokens)
    ├── scripts/
    │   ├── build-image.sh (1 lines, 35 B, ~11 tokens)
    │   ├── build-on-fr1.sh (1 lines, 35 B, ~11 tokens)
    │   └── exclude (16 lines, 300 B, ~115 tokens)
    ├── theme-tokyo-night/
    │   ├── aether-theme.lua (1 lines, 35 B, ~11 tokens)
    │   ├── bar.css (1 lines, 35 B, ~11 tokens)
    │   ├── cosmic-theme.ron (12 lines, 556 B, ~178 tokens)
    │   ├── hyprland-colors.conf (26 lines, 586 B, ~147 tokens)
    │   ├── terminal.toml (32 lines, 579 B, ~181 tokens)
    │   └── theme.css (1 lines, 35 B, ~11 tokens)
    └── wslc-settings.yaml (11 lines, 520 B, ~134 tokens)
```

## Source Files

================================================
FILE: README.md
================================================

# infra/

Infrastructure de src, assemblée à partir d'outils upstream (aucun moteur de déploiement maison). Correspondance
brique → outil, versions et commits sources : [docs/infra/UPSTREAM-STACK.md](../docs/infra/UPSTREAM-STACK.md).

| Dossier       | Contenu                                                                                              | Outil upstream                                                                |
| ------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `deploy.toml` | flotte, placement des services, hébergement, auth, images                                            | lu par `scripts/deploy-target.ts`, `infra/cluster/gen.ts`, `packages/env-kit` |
| `docker/`     | `Dockerfile`, `docker-bake.hcl`, `compose.yaml`, `smoke.sh`                                          | docker buildx bake, docker compose                                            |
| `cluster/`    | LB, failover, mesh mTLS 7444 ([CLUSTER.md](../docs/infra/CLUSTER.md))                                | HAProxy, nginx                                                                |
| `cloudflare/` | zone, tunnels, WAF, Access ([FR2-CLOUDFLARE.md](../docs/infra/FR2-CLOUDFLARE.md))                    | API Cloudflare, `cf`, wrangler                                                |
| `fleet/`      | bootstrap idempotent des hôtes (`just fleet-bootstrap <fr1, prd ou fr2>`), unités systemd, nginx fr2 | systemd, nginx, WireGuard, cloudflared                                        |
| `agents/`     | runner d'agents de la flotte                                                                         | systemd                                                                       |

Rôles : fr1 (`ssh vps`) = usine (builds, CI, training, agents lourds) ; prd (`ssh prd`) = backends de prod sans
compilateur ; fr2 (`ssh cdn`) = edge. Procédure de déploiement et retour arrière : [docs/infra/DEPLOY.md](../docs/infra/DEPLOY.md).

```sh
just docker-build            # images amd64+arm64 -> ghcr.io/aphrody-labs (CI images.yml)
just docker-smoke            # build + healthcheck de chaque image (CI)
just deploy core prd         # compose pull + up --wait ; retour : SRC_TAG=<sha> just docker-up core prd
just fleet-bootstrap fr1     # toolchains épinglées (tools.toml)
```

================================================
FILE: gcloud/README.md
================================================

# Aphrody Multi-Google Cloud (`gcloud`) 3-Principal Sharing & IAM Architecture

Canonical multi-account Google Cloud identity and IAM sharing reference for GCP project `aphrody` (`#468000409790`).

## 1. Three-Principal + Automation Matrix (`aphrody` `#468000409790`)

| Alias   | Principal Email                                   | `gcloud` Config | Regions (`compute` / `ai`)     | Scope & IAM Roles                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :------ | :------------------------------------------------ | :-------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai`    | `<ai-google>`                                     | `ai-agent`      | `europe-west1` / `us-central1` | Dedicated autonomous AI account for `ai-os`, `triad`, `pi-opencode`, Gemini, Spark, Hermes, OpenClaw, Google Drive (`rclone` remote `gdrive-ai`), NotebookLM, Vertex AI, and Cloud Build sandboxes. Bound to `roles/aiplatform.user`, `roles/serviceusage.serviceUsageConsumer`, `roles/artifactregistry.writer`, `roles/cloudbuild.builds.editor`, `roles/developerconnect.user`, `roles/storage.objectAdmin`, `roles/logging.logWriter`. |
| `owner` | `<owner-google>`                                  | `owner`         | `europe-west1`                 | Personal developer and root owner of GCP project `aphrody` (`#468000409790`). Bound to `roles/owner`.                                                                                                                                                                                                                                                                                                                                      |
| `org`   | `contact@aphrody.com`                             | `org-contact`   | `europe-west1`                 | Organization and production infrastructure master identity across Google Workspace, Cloudflare, GitHub (`aphrody-dev`), GitLab (`aphrody-dev` / `git.aphrody.com`), OVH (`fr1`, `fr2`), Hostinger (`usa`), Vercel, Supabase, and `mail.aphrody.com`. Bound to `roles/editor`, `roles/run.admin`, `roles/dns.admin`, `roles/secretmanager.admin`.                                                                                           |
| `sa`    | `yolo-automation@aphrody.iam.gserviceaccount.com` | `sa-automation` | `europe-west1`                 | Headless NHITL CI/CD service account in GCP project `aphrody`. Bound to `roles/editor`, `roles/developerconnect.admin`, `roles/artifactregistry.admin`.                                                                                                                                                                                                                                                                                    |

## 2. Non-Clobbering Process Isolation for Autonomous Agents

Autonomous daemons and agent harnesses (`ai-os`, `triad`, `pi-opencode`, Spark, Hermes, OpenClaw) must never mutate the global active `gcloud` configuration file (`~/.config/gcloud/active_config`) used in human interactive terminals.

Use `getIsolatedGcloudEnv('ai')` from `@aphrody/env-kit`:

```ts
import { getIsolatedGcloudEnv } from "@aphrody/env-kit";

const childEnv = getIsolatedGcloudEnv("ai");
// Sets CLOUDSDK_ACTIVE_CONFIG_NAME="ai-agent", CLOUDSDK_CORE_PROJECT="aphrody",
// CLOUDSDK_CORE_ACCOUNT="<ai-google>", CLOUDSDK_AI_REGION="us-central1",
// APHRODY_RCLONE_REMOTE="gdrive-ai", without touching global active_config.
```

## 3. CLI Operations via `env-kit accounts`

```powershell
# Inspect all 4 gcloud configurations, OAuth token status, rclone gdrive-ai, and 10 org surfaces:
env-kit accounts status
env-kit accounts status --json

# Idempotently create/update ai-agent, owner, org-contact, and sa-automation:
env-kit accounts init-gcloud

# Switch interactive shell configuration:
env-kit accounts switch ai
env-kit accounts switch owner
env-kit accounts switch org
env-kit accounts switch sa

# Print exact idempotent IAM policy binding commands:
env-kit accounts iam-bindings
```

## 4. Onboarding & IAM Policy Provisioning

Run as root owner (`<owner-google>` via `--configuration=owner`):

### Windows PowerShell

```powershell
# Preview all API enablements and IAM bindings without mutating GCP:
pwsh -NoProfile -File C:\src\infra\gcloud\share-aphrody-project-iam.ps1 -DryRun

# Execute live against project aphrody (#468000409790):
pwsh -NoProfile -File C:\src\infra\gcloud\share-aphrody-project-iam.ps1
```

### Linux / WSL2 Bash

```bash
# Dry-run preview:
bash /mnt/c/src/infra/gcloud/share-aphrody-project-iam.sh --dry-run

# Live execution:
bash /mnt/c/src/infra/gcloud/share-aphrody-project-iam.sh
```

## 5. Interactive One-Time OAuth & ADC Token Caching

```powershell
# Autonomous AI principal (Gemini, Spark, Hermes, OpenClaw):
gcloud auth login <ai-google> --configuration=ai-agent
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "ai-agent"
gcloud auth application-default login --project=aphrody

# Organization principal (Google Workspace / Production Infra):
gcloud auth login contact@aphrody.com --configuration=org-contact
$env:CLOUDSDK_ACTIVE_CONFIG_NAME = "org-contact"
gcloud auth application-default login --project=aphrody
```

## Cloud Build

Supprimé le 2026-11-13 (doublon Debian de `.github/workflows/images.yml` vers Artifact Registry ; registre unique `ghcr.io/aphrody-labs`, docs/infra/UPSTREAM-STACK.md). Retour arrière : `git checkout <sha>~ -- infra/gcloud/cloudbuild.yaml`.

================================================
FILE: gitlab/README.md
================================================

# Sovereign GitLab & Tri-Forge Infrastructure (`infra/gitlab`)

Production deployment manifests, Omnibus configuration, Arch Linux / CachyOS / Omarchy CI builder image, and Tri-Forge bootstrap scripts uniting **GitHub**, **GitLab**, and **Google Cloud Git** across all 26 `C:\src` repositories.

## 1. Tri-Forge Topology

Every repository in `C:\src` (root `src` + 25 submodules = 26 repositories) maintains synchronized Git remotes managed via `@aphrody/forge` (`frg`):

- `origin` (**GitHub**): `https://github.com/aphrody-dev/<repo>.git`
- `gitlab` (**GitLab SaaS**): `https://gitlab.com/aphrody-dev/<repo>.git`
- `gitlab-self` (**Sovereign GitLab CE on OVH `fr2`**): `https://git.aphrody.com/aphrody/<repo>.git` (owner `contact@aphrody.com`, SSH `:2224`, OCI Registry `registry.aphrody.com`)
- `google` (**Google Cloud Git — GCP `aphrody` `#468000409790`**): `https://source.developers.google.com/p/aphrody/r/<repo>` + Developer Connect (`projects/aphrody/locations/europe-west1/connections/aphrody-triforge`)
- `all` (**Multi-Forge Push Fanout**): pushes simultaneously to `origin`, `gitlab`, and `google`.

## 2. Directory Layout

- `docker-compose.gitlab.yml` — Sovereign GitLab CE Omnibus (`git.aphrody.com`) + Docker CI Runner + `archlinux-pkgctl` Runner.
- `gitlab.rb` — Memory-tuned Omnibus configuration for OVH `fr2` (< 3.2 GB RSS), Puma (2 workers), Sidekiq (concurrency 8), Prometheus disabled, Container & Package Registries enabled, and SMTP wired to Stalwart (`mail.aphrody.com` / `contact@aphrody.com`).
- `arch-ci/Dockerfile.arch-builder` — Arch Linux + CachyOS `x86-64-v3` repo + `devtools` (`pkgctl`) + `mkinitcpio` + Rust + Bun + Go CI container for building `.pkg.tar.zst` packages and WSL2 `.wsl` rootfs images.
- `setup-triforge.ps1` / `setup-triforge.sh` — Cross-platform bootstrap scripts for `gh`, `glab`, `gcloud`, and `frg` without exposing secrets.

## 3. CLI Operations (`frg`)

```powershell
# Audit or apply remotes across all 26 C:\src repositories
frg remotes
frg remotes --apply

# Provision GitLab group, projects, branch protections (main + dev), and registries
frg gitlab-init --dry-run
frg gitlab-init

# Configure GCP 'aphrody' Developer Connect, Cloud Source Repositories & credential helper
frg google-git-init --dry-run
frg google-git-init

# Synchronize main & dev across GitHub, GitLab, and Google Git
frg tri-sync --dry-run --forge all
frg tri-sync --forge all

# Audit & fetch Arch Linux GitLab, CachyOS, and Omacom/Omarchy upstream repositories
frg arch-upstreams
frg arch-upstreams --sync
```

## 4. Deploying Sovereign GitLab on OVH `fr2`

```bash
export GITLAB_ROOT_PASSWORD="<from-sovereign-vault>"
export STALWART_SMTP_PASSWORD="<from-sovereign-vault>"

docker compose -f docker-compose.gitlab.yml build gitlab-runner-arch-pkgctl
docker compose -f docker-compose.gitlab.yml up -d
```

Reverse-proxy `git.aphrody.com` to `127.0.0.1:8929` and `registry.aphrody.com` to `127.0.0.1:5050` via Caddy or Cloudflare Tunnel (`infra/mesh-vn`). SSH Git traffic listens on TCP `:2224`.

## Pipeline file

The pipeline is `infra/gitlab/gitlab-ci.yml` (moved out of the repository root on 2026-11-13). GitLab only reads it once the project's CI configuration path points to it:

```sh
glab api -X PUT projects/aphrody-dev%2Fsrc -f ci_config_path=infra/gitlab/gitlab-ci.yml
# rollback: glab api -X PUT projects/aphrody-dev%2Fsrc -f ci_config_path=
```

================================================
FILE: mail/README.md
================================================

# Sovereign `contact@aphrody.com` Mailing Infrastructure (`C:\src\infra\mail`)

Production-ready sovereign mail infrastructure for `aphrody.com` powered by **Stalwart Mail Server** (`stalwartlabs/mail-server:latest`) — a 100% pure-Rust all-in-one JMAP, IMAP4rev2, SMTP, ManageSieve, and built-in SPF/DKIM/DMARC/ARC/MTA-STS/TLS-RPT/ACME engine with zero Java, PHP, or Python runtime bloat.

## 1. Canonical Domain Identities & Routing (`aphrody.com`)

| Address                | Role                                                                                                                                                                                               | Delivery / Alias Target                                                                                   |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `contact@aphrody.com`  | Master organization identity across Google Workspace, Cloudflare, GitHub (`aphrody-dev`), GitLab (`aphrody-dev` & `git.aphrody.com`), OVH (`fr1`, `fr2`), Hostinger (`usa`), Vercel, and Supabase. | Primary mailbox + Google Workspace split-delivery (`workspace-copy@aphrody.com` -> `aspmx.l.google.com`). |
| `noreply@aphrody.com`  | Outbound transactional sender (Supabase Auth, GitLab CI notifications, `aphrody.com` transactional JMAP/SMTP).                                                                                     | Outbound DKIM-signed (`s1-ed25519` + `s2-rsa`); inbound auto-rejected or routed to postmaster sink.       |
| `security@aphrody.com` | Security disclosure (`/.well-known/security.txt`), Let's Encrypt ACME expiry notices, GitHub/Cloudflare security alerts.                                                                           | Rewritten cleanly to `contact@aphrody.com`.                                                               |
| `ai@aphrody.com`       | Autonomous NHITL notifications (`ai-os`, `triad`, `pi-opencode`) and bridge to `<ai-google>`.                                                                                                      | Rewritten cleanly to `contact@aphrody.com` (with Sieve forward option to `<ai-google>`).                  |
| `dmarc@aphrody.com`    | DMARC aggregate/forensic (`rua`/`ruf`) + RFC 8460 SMTP TLS-RPT (`_smtp._tls`) report sink.                                                                                                         | Dedicated report mailbox in Stalwart RocksDB store.                                                       |

## 2. OVH `fr1` / `fr2` Reverse PTR & Network Prerequisites

Outbound deliverability to Gmail, Outlook, and corporate MX relays requires matching forward (`A`) and reverse (`PTR`) DNS records on OVHcloud:

1. **OVH `fr1` (`51.77.147.152`)**:
   - Forward DNS (Cloudflare, unproxied DNS-only): `mail.aphrody.com. IN A 51.77.147.152`
   - OVH Manager / API Reverse PTR: Set reverse DNS of `51.77.147.152` (and its IPv6 `/128` host address) to `mail.aphrody.com.`
   - Verify outbound TCP port `25` is unblocked in OVHcloud Anti-Spam / Edge Firewall.
2. **OVH `fr2` (`51.255.162.6`)**:
   - Forward DNS (Cloudflare, unproxied DNS-only): `mx2.aphrody.com. IN A 51.255.162.6`
   - OVH Manager / API Reverse PTR: Set reverse DNS of `51.255.162.6` to `mx2.aphrody.com.`

## 3. Dual DKIM Key Generation & Stalwart Deployment

On `fr1` (`51.77.147.152`):

```bash
# 1. Generate Ed25519 primary key + RSA-2048 compatibility key inside restricted volume:
mkdir -p /opt/aphrody-mail/dkim
chmod 700 /opt/aphrody-mail/dkim

openssl genpkey -algorithm ed25519 -out /opt/aphrody-mail/dkim/aphrody.ed25519.key
openssl pkey -in /opt/aphrody-mail/dkim/aphrody.ed25519.key -pubout -outform DER | tail -c 32 | base64

openssl genrsa -out /opt/aphrody-mail/dkim/aphrody.rsa2048.key 2048
openssl rsa -in /opt/aphrody-mail/dkim/aphrody.rsa2048.key -pubout -outform PEM | grep -v '^--' | tr -d '\n'

# 2. Launch Stalwart Mail Server:
docker compose -f /opt/aphrody-mail/docker-compose.mail.yml up -d
```

## 4. Cloudflare DNS & MTA-STS Provisioning

Generate deterministic BIND `.zone` and JSON records (or push live via Cloudflare REST API v4 when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are set):

```powershell
# Dry-run export (writes cloudflare-mail-records.json and cloudflare-mail-records.zone):
bun run C:\src\infra\mesh-vn\src\cloudflare-mail-dns.ts

# Live Cloudflare DNS upsert via env-kit:
env-kit exec -- bun run C:\src\infra\mesh-vn\src\cloudflare-mail-dns.ts --apply
```

Serve `C:\src\infra\mail\mta-sts.txt` at `https://mta-sts.aphrody.com/.well-known/mta-sts.txt` with `Content-Type: text/plain; charset=utf-8` (enforces TLS 1.2/1.3 MX transport across `mail.aphrody.com` and `*.google.com`).

BIMI (`default._bimi.aphrody.com`) references `https://aphrody.com/assets/brand/aphrody-monogram-bimi.svg`.

## 5. Google Workspace Split-Delivery Compatibility (`contact@aphrody.com`)

To allow `contact@aphrody.com` to operate seamlessly across both Google Workspace (Calendar, Meet, Docs, Google Cloud Org Identity) and Sovereign Stalwart JMAP/IMAP:

1. **Google Workspace Admin Console (`admin.google.com` -> Apps -> Google Workspace -> Gmail -> Routing)**:
   - Add `mail.aphrody.com` (`51.77.147.152`) to **Inbound Gateway** IPs so forwarded messages preserve original SPF alignment.
   - Configure **Split Delivery** rule routing non-Workspace mailboxes (`noreply@`, `dmarc@`, `ai@`, programmatic JMAP mailboxes) to `mail.aphrody.com:25` over mandatory TLS, or keep `mail.aphrody.com` as priority `10` MX forwarding a copy of `contact@aphrody.com` (`workspace-copy@aphrody.com`) via the `google-workspace-split` route in `config/stalwart.toml`.
2. **Unified SPF**:
   - `v=spf1 mx a:mail.aphrody.com ip4:51.77.147.152 ip4:51.255.162.6 include:_spf.google.com ~all` authorizes both OVH Stalwart nodes and Google Workspace outbound relays.

## 6. Transactional & Org Provider SMTP / JMAP Wiring (`contact@aphrody.com`)

Use these exact coordinates across external org platforms:

| Parameter                    | Value                                                                     |
| :--------------------------- | :------------------------------------------------------------------------ |
| **SMTP Host**                | `mail.aphrody.com`                                                        |
| **SMTP Port (Implicit TLS)** | `465` (recommended) or `587` (STARTTLS)                                   |
| **SMTP Username**            | `contact@aphrody.com` (or dedicated app credential `noreply@aphrody.com`) |
| **SMTP Password**            | Stored exclusively in `C:\src\.env` (`SMTP_PASSWORD`)                     |
| **JMAP Endpoint**            | `https://mail.aphrody.com/jmap` (`Authorization: Bearer $JMAP_API_TOKEN`) |

- **Supabase (`Authentication -> Emails -> SMTP Settings`)**: Enable Custom SMTP -> Sender email `noreply@aphrody.com`, Sender name `Aphrody`, Host `mail.aphrody.com`, Port `465`, Username `noreply@aphrody.com`, Password `$SMTP_PASSWORD`.
- **GitLab (`git.aphrody.com` `gitlab.rb`)**: `gitlab_rails['smtp_address'] = "mail.aphrody.com"`, `gitlab_rails['smtp_port'] = 465`, `gitlab_rails['smtp_tls'] = true`, `gitlab_rails['gitlab_email_from'] = 'noreply@aphrody.com'`, `gitlab_rails['gitlab_email_reply_to'] = 'contact@aphrody.com'`.
- **Vercel / GitHub / Cloudflare / OVH / Hostinger**: Primary organization owner email set to `contact@aphrody.com` with hardware Passkey / TOTP 2FA enabled.

================================================
FILE: cloudflare/workers/github-app/package.json
================================================

// [OUTLINE - 11 symbols, 15 lines]
// L2: "name": "@aphrody/github-app"
// L3: "private": true
// L4: "type": "module"
// L5-L9: "scripts":
// L6: "check": "bun test"
// L7: "deploy:dry": "cf deploy --dry-run"
// L8: "deploy": "cf deploy"
// L10-L14: "devDependencies":
// L11: "@cloudflare/vite-plugin": "catalog:"
// L12: "@cloudflare/workers-types": "catalog:"
// L13: "vite": "catalog:"

================================================
FILE: gcp/billing-agent/cap-function/package.json
================================================

// [OUTLINE - 5 symbols, 8 lines]
// L2: "name": "billing-cap"
// L3: "private": true
// L4: "main": "index.js"
// L5-L7: "engines":
// L6: "node": ">=24"

================================================
FILE: cloudflare/workers/github-app/src/index.ts
================================================

// [OUTLINE - 5 symbols, 202 lines]
// L8-L23: type GithubEvent =
// L25-L28: interface Env
// L32-L52: async function verify(
// L77-L167: function classify(
// L170-L201: async fetch(req: Request, env: Env): Promise<Response>

================================================
FILE: DEPS.rules
================================================

# checkdeps layer rules (see docs/ARCHITECTURE.md). Inherited by subdirectories.

layer = 2

================================================
FILE: agents/bootstrap-user.sh
================================================

// [OUTLINE - 0 symbols, 28 lines]

================================================
FILE: agents/fleet.toml
================================================

# Agent fleet: which roles run on which host, with per-role timeout and budget.

# No provider list here: ai-os (packages/ai-os) names the CLI/model in each task (`providers`),

# otherwise the runner asks the relay (llm_models). growth tasks are drafts only (approval = owner).

# heavy = true: builds/tests/training, fr1 only (enforced by runner.ts at enqueue and claim; prd and fr2

# never run them, tasks landing there are forwarded to fr1 by health). prd keeps light prod roles only.

# Read by infra/agents/runner.ts. Doc: docs/agents/AGENT-FIRST.md.

[roles.coder]
heavy = true
timeout_s = 3600
budget_usd = 5

[roles.reviewer]
timeout_s = 1200
budget_usd = 2

[roles.tester]
heavy = true
timeout_s = 2400
budget_usd = 3

[roles.linter]
heavy = true
timeout_s = 1200
budget_usd = 1

[roles.designer]
timeout_s = 2400
budget_usd = 3

[roles.deployer]
timeout_s = 1800
budget_usd = 2

[roles.sre]
timeout_s = 1200
budget_usd = 2

[roles.chromium]

# Chromium/LLVM factory tasks (docs/CHROMIUM-FACTORY.md).

heavy = true
timeout_s = 21600
budget_usd = 5

[roles.build]

# Images, release artefacts, toolchains (aphrody-heavy).

heavy = true
timeout_s = 21600
budget_usd = 5

[roles.training]
heavy = true
timeout_s = 43200
budget_usd = 10

[roles.growth]
timeout_s = 1800
budget_usd = 2

# Hosts. `src` = git checkout (main) the runner works in; `ssh` = targets tried in order

# (<host>-mesh = sshd through the cluster mTLS mesh, TCP 7444, fleet IPs only (infra/cluster, docs/infra/CLUSTER.md);

# then PC aliases, WireGuard 10.200.77.0/24, public IP). `ship` = where every host sends log.jsonl.

[hosts.prd]

# Production backends only: light prod roles (deploy, health, text-only growth drafts).

roles = ["deployer", "sre", "growth"]

# Every host: user `agent` (systemd --user + linger, sudo NOPASSWD, docker), never uid 0.

src = "/home/agent/agents/src"
ssh = ["agent@prd-mesh", "agent@prd", "agent@10.200.77.5", "agent@72.60.186.43"]

[hosts.fr1]

# Factory (12 cores / 45 GB): every heavy role, plus review/design/sre.

roles = [
"coder",
"reviewer",
"tester",
"linter",
"designer",
"build",
"chromium",
"training",
"sre",
]
src = "/home/agent/agents/src"
ssh = [
"agent@fr1-mesh",
"agent@fr1",
"agent@10.200.77.1",
"agent@51.77.147.152",
]

[hosts.fr2]

# Edge/proxy/CDN host, 11 GB RAM: minimal, sre only.

roles = ["sre"]
src = "/home/agent/agents/src"
ssh = ["agent@fr2-mesh", "agent@fr2", "agent@10.200.77.3", "agent@51.255.162.6"]

[hosts.pc]

# No heavy builds on the PC.

roles = ["reviewer", "designer", "growth"]
src = "C:/src"

[schedule]

# template (infra/agents/tasks/<name>.json) = period in hours; enqueued by the ship host (prd).

# growth templates end as drafts in var/agents/publish/<id>/ (approval = owner): nothing is published.

deps-update = 168
release-notes = 168
seo-check = 168

[ship]

# Every host appends its log.jsonl lines to prd over ssh (WireGuard or public ssh).

host = "prd"
dir = "/var/lib/aphrody-agents/logs"

================================================
FILE: agents/gh-token.test.ts
================================================

// [OUTLINE - 0 symbols, 59 lines]
// import bun:test
// import node:fs
// import node:os
// import node:path

================================================
FILE: agents/gh-token.ts
================================================

// [OUTLINE - 3 symbols, 127 lines]
// import node:child_process
// import node:fs
// import node:path
// import ../../packages/env-kit/src/github-app.ts
// L40-L55: function cred(name: string): string | undefined
// L58-L83: async function token(now = Date.now()): Promise<string | undefined>
// L86-L101: function installWrapper(dir: string): string | undefined

================================================
FILE: agents/github-events.test.ts
================================================

// [OUTLINE - 0 symbols, 136 lines]
// import bun:test
// import ./github-events.ts

================================================
FILE: agents/github-events.ts
================================================

// [OUTLINE - 9 symbols, 327 lines]
// import node:fs
// import node:path
// L17-L31: type GithubEvent =
// L33-L43: type QueueTask =
// L62-L69: function valid(e: GithubEvent): boolean
// L72-L130: function eventTask(
// L132-L135: type PushState = Record<
// L139-L178: function coalesce(
// L184-L199: async function cf(path: string, token: string, body?: unknown): Promise<any>
// L201-L210: function accountId(src: string): string
// L212-L307: async function pull(o:

================================================
FILE: agents/install-pc.sh
================================================

// [OUTLINE - 0 symbols, 22 lines]

================================================
FILE: agents/install.sh
================================================

// [OUTLINE - 1 symbols, 79 lines]
// L13: need()

================================================
FILE: agents/pre-push
================================================

#!/bin/sh

# Runner checkouts: refuse history rewrites (force push, branch deletion). Installed by install.sh.

z=0000000000000000000000000000000000000000
while read -r lref lsha rref rsha; do
[ "$lsha" = "$z" ] && { echo "pre-push: deleting $rref is not allowed" >&2; exit 1; }
[ "$rsha" = "$z" ] && continue
git merge-base --is-ancestor "$rsha" "$lsha" || { echo "pre-push: non fast-forward push to $rref refused" >&2; exit 1; }
done
exit 0

================================================
FILE: agents/runner.test.ts
================================================

// [OUTLINE - 1 symbols, 172 lines]
// import bun:test
// import node:fs
// import node:os
// import node:path
// import ./runner.ts
// L26-L41: function inChild(dir: string, code: string)

================================================
FILE: agents/runner.ts
================================================

// [OUTLINE - 55 symbols, 1281 lines]
// import node:fs
// import node:os
// import node:path
// import ../../packages/ai-os/src/llm/agents.ts
// L31: type Role =
// L32: type Host =
// L33-L38: type Fleet =
// L39-L57: type Task =
// L58-L65: type Attempt =
// L98-L106: function hostAlias(h: string): string
// L111-L115: function accepts(fleet: Fleet, host: string, role: string): boolean
// L117-L128: function place(fleet: Fleet, role: string, host?: string): string
// L129-L132: function ensureDirs()
// L133-L138: function log(event: string, data: Record<string, unknown> =
// L142-L153: function childEnv(extra: Record<string, string> =
// L174-L211: function ghEnv(): Record<string, string>
// L213-L228: function credEnv(): Record<string, string>
// L229-L251: function sh(
// L255-L262: function argv0(name: string, args: string[]): string[]
// L263-L265: function shellCmd(cmd: string): string[]
// L275-L377: function providerCmd(
// L379-L417: async function rpc(
// L418-L424: async function relayChain(): Promise<string[]>
// L425-L428: function cooling(p: string): boolean
// L429-L431: function coolDown(p: string)
// L434-L442: function dirty(cwd: string): Set<string>
// L443-L480: function commit(
// L484-L516: function stageDraft(
// L519-L521: function newId(role: string)
// L522-L526: function writeTask(dir: string, t: Task)
// L528-L550: function claim(role: string):
// L560-L579: async function lockCheckout(): Promise<() => void>
// L582-L592: function restore(cwd: string, files: string[])
// L593-L600: function inScope(t: Task, f: string): boolean
// L605-L620: function defaultClis(
// L621-L635: async function runTask(t: Task, claimedPath: string)
// L636-L808: async function runTaskLocked(t: Task, claimedPath: string, named: string[])
// L810-L828: async function work(role: string)
// L831-L833: function tmux(args: string[])
// L834-L841: function workerCmd(role: string): string
// L842-L856: function up()
// L857-L916: function upLocked()
// L919-L934: function requeueOrphans()
// L936-L959: function probe(): Record<string, string>
// L962-L972: function sshRun(host: string, remote: string, stdin: string)
// L975-L989: function ship()
// L994-L1044: function ciWatch()
// L1047-L1072: function githubEvents()
// L1074-L1086: function health()
// L1089-L1118: function route()
// L1120-L1130: function routeTarget(
// L1131-L1139: function counts()
// L1141-L1144: function arg(name: string): string | undefined
// L1146-L1148: function template(name: string): Partial<Task>
// L1149-L1184: function buildTask(
// L1185-L1199: function submit(t: Task)
// L1200-L1220: function enqueue()
// L1222-L1240: function schedule()
// L1241-L1257: function status()

================================================
FILE: agents/systemd/aphrody-agents-health.service
================================================

# Repairs the tmux session/windows, requeues orphan tasks, probes CLIs, ships logs to prd.

[Unit]
Description=Aphrody agent runner health check

[Service]
Type=oneshot
KillMode=process
Environment=PATH=%h/.bun/bin:%h/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=SRC_ROOT=@SRC@
ExecStart=@BUN@ --no-env-file @SRC@/infra/agents/runner.ts health

================================================
FILE: agents/systemd/aphrody-agents-health.timer
================================================

[Unit]
Description=Aphrody agent runner health check every 2 min

[Timer]
OnBootSec=1min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target

================================================
FILE: agents/systemd/aphrody-agents-pull.service
================================================

# Keeps the runner checkout on origin/main (fast-forward only; never touches local changes).

[Unit]
Description=Aphrody agent checkout fast-forward

[Service]
Type=oneshot

# Stale index.lock (> 10 min, left by a killed git) blocks every later pull.

ExecStartPre=-/usr/bin/env find @SRC@/.git -maxdepth 1 -name index.lock -mmin +10 -delete
ExecStart=/usr/bin/env git -C @SRC@ pull --ff-only --quiet origin main

================================================
FILE: agents/systemd/aphrody-agents-pull.timer
================================================

[Unit]
Description=Aphrody agent checkout fast-forward every 10 min

[Timer]
OnBootSec=2min
OnUnitActiveSec=10min

[Install]
WantedBy=timers.target

================================================
FILE: agents/systemd/aphrody-agents.service
================================================

# User unit: tmux session "agents", one window per role of this host (infra/agents/fleet.toml).

# Installed by infra/agents/install.sh (@SRC@ / @BUN@ substituted). Doc: docs/agents/AGENT-FIRST.md.

[Unit]
Description=Aphrody agent runner (tmux session "agents")
After=network-online.target
StartLimitIntervalSec=600
StartLimitBurst=10

[Service]
Type=oneshot
RemainAfterExit=yes

# tmux server must outlive ExecStart.

KillMode=process

# A worker killed by the OOM killer must not fail the unit (tmux session stays; health timer repairs windows).

OOMPolicy=continue
Restart=on-failure
RestartSec=30s

# Workers (tmux server children) stay in this cgroup: bounded so builds cannot OOM the host.

MemoryHigh=45%
MemoryMax=60%
CPUWeight=50
Nice=10
Environment=PATH=%h/.bun/bin:%h/.local/bin:/usr/local/bin:/usr/bin:/bin
Environment=SRC_ROOT=@SRC@
ExecStart=@BUN@ --no-env-file @SRC@/infra/agents/runner.ts up
ExecStop=/usr/bin/env tmux kill-session -t agents

[Install]
WantedBy=default.target

================================================
FILE: agents/tasks/deps-update.json
================================================

// [OUTLINE - 7 symbols, 21 lines]
// L2: "role": "coder"
// L3: "host": "fr1"
// L4: "prompt": "Weekly dependency update (upstream tools only: `just deps-bump` = ay lock --deps --bump, then `just deps-lock`; if those recipes are missing use `bun update` at the root and `cargo update -w`). Keep within declared requirements, no major bumps. Then run `just checkdeps`, `cargo check --workspace` and `just test`; if a bump breaks them, revert that single bump and retry. Stop when the gates pass. Do not commit: the runner commits."
// L5: "check": "just checkdeps && cargo check --workspace --quiet"
// L6-L20: "commit":
// L7-L18: "paths": [
// L19: "message": "deps : mise à jour hebdomadaire dans les bornes déclarées (tâche agent coder, fr1)"

================================================
FILE: agents/tasks/product-page-rosegriffon.json
================================================

// [OUTLINE - 4 symbols, 6 lines]
// L2: "role": "growth"
// L3: "host": "prd"
// L4: "approval": "owner"
// L5: "prompt": "Draft the rosegriffon product page. Inputs: apps/rosegriffon (run `git submodule update --init --depth 1 apps/rosegriffon` if empty), its plugins/steam docs, identity.toml. Output: drafts/growth/rosegriffon/page.md (hero, feature blocks backed by facts found in the code, pricing placeholder marked TODO-OWNER, FAQ) and drafts/growth/rosegriffon/meta.json (

================================================
FILE: agents/tasks/product-page-shenron.json
================================================

// [OUTLINE - 4 symbols, 6 lines]
// L2: "role": "growth"
// L3: "host": "prd"
// L4: "approval": "owner"
// L5: "prompt": "Draft the shenron product page. Inputs: apps/shenron (run `git submodule update --init --depth 1 apps/shenron` if empty), its README/docs, identity.toml, docs/infra/HOSTING-POLICY.md. Output: write drafts/growth/shenron/page.md (hero, 3 to 5 feature blocks backed by facts found in the code, pricing placeholder marked TODO-OWNER, FAQ) and drafts/growth/shenron/meta.json (

================================================
FILE: agents/tasks/release-notes.json
================================================

// [OUTLINE - 4 symbols, 6 lines]
// L2: "role": "growth"
// L3: "host": "prd"
// L4: "approval": "owner"
// L5: "prompt": "Draft release notes for main since the last tag (`git describe --tags --abbrev=0`, or the last 7 days if there is no tag). Inputs: `git log --no-merges`, commit trailers Agent-Task/Agent-Role, CHANGELOG files if any. Output: drafts/growth/release-notes.md grouped by unit (apps/_, packages/_, crates/_, infra/_), one line per user-visible change, breaking changes first, reverted commits omitted. Also drafts/growth/changelog-entry.md in Keep a Changelog format. Do not tag, release, publish or send anything."

================================================
FILE: agents/tasks/seo-check.json
================================================

// [OUTLINE - 4 symbols, 6 lines]
// L2: "role": "growth"
// L3: "host": "prd"
// L4: "approval": "owner"
// L5: "prompt": "SEO and web-quality check of the public sites listed in identity.toml (aphrody.com, aphrody.app, shenron and rosegriffon domains). For each origin: fetch / and the sitemap with curl (status, redirects, <title>, meta description, canonical, hreflang, robots.txt, sitemap.xml validity, structured data, Cache-Control, compression), and run `bunx lighthouse <url> --output=json --quiet --chrome-flags=--headless` when Chromium is available. Output: drafts/growth/seo-report.md (table per origin, findings ordered by impact, each with the exact file in src to change) and drafts/growth/seo-fixes.patch when a fix is a pure content/meta change. Read-only on the sites; do not deploy."

================================================
FILE: agents/toolchain.toml
================================================

# Manifeste versionné de l'outillage agent (Claude Code, Codex, agy, Gemini CLI ; PC et flotte). Toute installation passe ici ;

# applier : packages/machine/src/toolchain.ts (via apply-user.ts sur le PC, aphrody-agents-sync.timer sur Linux). Aucun secret : seulement le nom de la variable d'env

# (valeur dans le coffre env-kit, `env-kit secret set NOM` sur stdin, et l'env utilisateur Windows).

# --- Audit Google / DeepMind / Chrome / Gemini / catalogues de skills (2026-11-13, docs/tooling/AI-TOOLING-AUDIT.md)

[[claude.marketplace]]
name = "anthropic-agent-skills"
repo = "anthropics/skills"
commit = "2c5958ecac7c"

[[claude.marketplace]]
name = "google-plugins"
repo = "google/skills"
commit = "85f227ea6a8f"

[[claude.marketplace]]
name = "googlechrome"
repo = "GoogleChrome/modern-web-guidance"
commit = "4dd968349e54"

[[claude.marketplace]]
name = "gemini-skills"
repo = "google-gemini/gemini-skills"
commit = "87fb0173d36f"

[[claude.marketplace]]
name = "android-skills"
repo = "android/skills"
commit = "5815d27fda56"

[[claude.plugin]]
id = "document-skills@anthropic-agent-skills"
scope = "user"

[[claude.plugin]]
id = "google-cloud-developer@google-plugins" # skills gcloud + MCP HTTP developer-knowledge
scope = "user"
env = ["DEVELOPERKNOWLEDGE_API_KEY"]

[[claude.plugin]]
id = "modern-web-guidance@googlechrome"
scope = "user"

[[claude.plugin]]
id = "gemini-skills@gemini-skills"
scope = "user"

[[claude.plugin]]
id = "android-skills@android-skills"
scope = "user"

# Serveurs MCP stdio lancés par bun x (les plugins upstream utilisent npx : non installés).

[[claude.mcp]]
name = "chrome-devtools"
hosts = ["pc"] # navigateur local / connexion Firebase du PC
scope = "user"
command = ["bun", "x", "chrome-devtools-mcp@1.13.0", "--headless", "--isolated"] # aucune fenêtre (demande du propriétaire 2026-11-13)
source = "ChromeDevTools/chrome-devtools-mcp@1417f93ee3f8"

[[claude.mcp]]
name = "firebase"
hosts = ["pc"] # navigateur local / connexion Firebase du PC
scope = "user"
command = ["bun", "x", "firebase-tools@15.36.0", "mcp"]
env = { IS_FIREBASE_MCP = "true" }
source = "firebase/firebase-tools@450bcf337418"

# Clé API GCP projet aphrody, restreinte à developerknowledge.googleapis.com (uid 334a6698-4c5b-41b9-b896-7f8f1494fa5b).

[[secret]]
name = "DEVELOPERKNOWLEDGE_API_KEY"
store = "env-kit"
user_env = false # coffre seul : retirée de HKCU\\Environment, lue par mcp-headers.ts
mint = "gcloud services api-keys get-key-string 334a6698-4c5b-41b9-b896-7f8f1494fa5b --project aphrody --account yolo-automation@aphrody.iam.gserviceaccount.com"

# --- Audit design / UI (2026-11-13, docs/ui/ECOSYSTEM-AUDIT.md) ---

# Figma officiel (MCP https://mcp.figma.com/mcp + skills figma-use, design-to-code, code-connect, generate-library).

[[claude.plugin]]
id = "figma@claude-plugins-official"
scope = "user"

# Doublon tiers du précédent (skill figma-to-code + second serveur MCP "figma") : retiré.

[[claude.plugin]]
id = "figma-to-code-design-to-react-vue-and-html@anthropic-plugin-directory"
scope = "user"
state = "absent"

# Skills upstream copiées depuis un commit épinglé (~/.claude/skills/<name>, témoin .source).

[[claude.skill]]
name = "gpui-kit"
repo = "longbridge/gpui-kit" # ex-longbridge/gpui-component, crate gpui-kit 0.9.1
commit = "6f7f4d96982c476fc0cb3491c6c4d775371554f1"
path = "skills/gpui-kit"
license = "Apache-2.0"

[[claude.skill]]
name = "gpui-kit-design-guides"
repo = "longbridge/gpui-kit"
commit = "6f7f4d96982c476fc0cb3491c6c4d775371554f1"
path = "skills/gpui-kit-design-guides"
license = "Apache-2.0"

[[claude.skill]]
name = "webui-reference"
repo = "microsoft/webui" # v3.1.1
commit = "30ca60aa4bdc1beab040dae32e1c10e195ec9113"
path = "ai"
license = "MIT"

# --- Socle cross-agent (2026-11-13, docs/infra/AGENT-TOOLCHAIN.md) ---

# Hôtes : pc, prd, fr1, fr2 (`hosts` absent = tous). Racine src : C:/src (pc), /srv/src (Linux).

# Placeholders : {src} racine du checkout, {home} HOME, {bin} ~/.local/bin.

# Marketplace racine de src (.claude-plugin/marketplace.json, lue aussi par Codex et agy) :

# aphrody-skills = .agents/skills (source unique), plus les forks aphrody-labs épinglés par sha.

[[claude.marketplace]]
name = "aphrody"
path = "."

[[claude.marketplace]]
name = "claude-plugins-official"
repo = "anthropics/claude-plugins-official"

[[claude.marketplace]]
name = "rosegriffon-plugins"
path = "apps/rosegriffon"
hosts = ["pc"]

[[claude.plugin]]
id = "aphrody-skills@aphrody"
refresh = true # copie du cache Claude rafraîchie quand le HEAD de src change

[[claude.plugin]]
id = "aphrody-nhitl@aphrody"
refresh = true

[[claude.plugin]]
id = "vercel-agent-skills@aphrody" # fork aphrody-labs/agent-skills@1a2c79d4e6c4

[[claude.plugin]]
id = "web-quality-skills@aphrody" # fork aphrody-labs/web-quality-skills@afa8da942115 (Lighthouse, Web Vitals)

[[claude.plugin]]
id = "unreal-engine-skills-for-claude-code@aphrody"
hosts = ["pc"]

[[claude.plugin]]
id = "github@claude-plugins-official"

[[claude.plugin]]
id = "clangd-lsp@claude-plugins-official"

[[claude.plugin]]
id = "rust-analyzer-lsp@claude-plugins-official"

[[claude.plugin]]
id = "typescript-lsp@claude-plugins-official"

[[claude.plugin]]
id = "math-proof@claude-plugins-official"
state = "disabled"

[[claude.plugin]]
id = "cloudflare@anthropic-plugin-directory"

[[claude.plugin]]
id = "microsoft-docs@anthropic-plugin-directory"

[[claude.plugin]]
id = "context7@anthropic-plugin-directory"

[[claude.plugin]]
id = "resend@anthropic-plugin-directory"
hosts = ["pc"]

# MCP utilisateur. `secrets` : noms du coffre env-kit injectés au lancement par

# `env-kit secret exec` (jamais dans settings ni argv) ; sans coffre sur l'hôte, l'entrée est ignorée.

[[claude.mcp]]
name = "relay"
url = "http://127.0.0.1:8790/mcp"
hosts = ["pc"]

[[claude.mcp]]
name = "figma"
url = "https://mcp.figma.com/mcp"
hosts = ["pc"]

[[claude.mcp]]
name = "agent-desktop"
command = ["{bin}/agent-desktop.exe", "mcp"] # headless sémantique par défaut : pas de focus ni curseur physique
hosts = ["pc"]

[[claude.mcp]]
name = "agent-browser"
command = ["{bin}/agent-browser.exe", "mcp"]
hosts = ["pc"]

# Serveur Developer Knowledge du plugin google-cloud-developer, clé lue dans le coffre par headersHelper

# (le serveur du plugin, qui attend la variable d'env, reste en échec sans elle).

[[claude.mcp]]
name = "developer-knowledge"
url = "https://developerknowledge.googleapis.com/mcp"
headers = { "X-Goog-Api-Key" = "DEVELOPERKNOWLEDGE_API_KEY" }
hosts = ["pc"]

[[claude.mcp]]
name = "hostinger-api"
command = ["bun", "x", "--bun", "@hostinger/mcp@3.38.3"]
secrets = ["HOSTINGER_API_TOKEN"]
hosts = ["pc"]

# Skills propres à une machine (hors dépôt public) : contrôle de présence seul.

[[skill.private]]
name = "windows-machine"
hosts = ["pc"]

[[skill.private]]
name = "chrome"
hosts = ["pc"]

[[skill.private]]
name = "shell"
hosts = ["pc"]

# Autres agents : mêmes plugins depuis la marketplace racine (copie dans leur propre cache, aucun lien).

[codex]
marketplace = "aphrody"
plugins = ["aphrody-skills@aphrody"]
mcp = ["relay", "figma"] # serveurs HTTP de [[claude.mcp]] (relay sert stitch__* et gemini_*)

[agy]
plugins = ["aphrody-skills@aphrody", "web-quality-skills@aphrody"] # vercel-agent-skills : sans manifeste, refusé par agy
mcp = ["relay", "figma"]

[gemini]
extensions = [".agents"] # gemini extensions link {src}/.agents (CLI absent à ce jour)

# Liens interdits : tout lien (symlink, jonction) vers une skill de src dans ces dossiers est retiré,

# le plugin aphrody-skills la fournit déjà.

[cleanup]
link_dirs = [
"{home}/.claude/skills",
"{home}/.gemini/skills",
"{home}/.agents/skills",
"{home}/.codex/skills",
]

# Copies posées par [[claude.skill]] devenues doublons d'un plugin (web-design-guidelines : vercel-agent-skills).

drop_skills = ["web-design-guidelines"]

================================================
FILE: ai/ai.toml
================================================

# Fournisseurs d'inférence pour `ay ai` (crates/ay/src/ai.rs), passerelle unique LiteLLM.

# Rien n'est figé dans le code : un fournisseur est actif si sa clé est dans le coffre (`--env-file`,

# `$AY_ENV_FILE` ou `<repo>/.env`, puis l'environnement) ou si son serveur local répond ; ses modèles

# viennent de l'API du fournisseur, via les routes joker de LiteLLM (`<id>/*`, check_provider_endpoint).

#

# [settings] proxy LiteLLM (host, port), config générée (`config`), prompt de vérification,

# master_key (variable de la clé maîtresse du proxy, créée et rangée si absente)

# [[runtime]] serveur : os (défaut : tous), bin (présent = installé), install.<windows|linux> (argv),

# serve (argv au premier plan), env, health (URL), pull (argv avec {model}), models

# path (dossiers ajoutés au PATH). Gabarits : {config} {host} {port} {prompt} {model}

# {env:X} {ollama_gguf:<modèle>} (GGUF téléchargé par Ollama, lien dur en .gguf)

# [[provider]] (complète ou ajoute au registre) `route` (fournisseur LiteLLM), `key`, `requires`,

# `api_base`, `health` (chemin sous api_base, fournisseur local), `params` (litellm_params ;

# "env:X" -> os.environ/X), `credentials` (Vertex : "env:VAR" JSON ou "file:~/..."), `probe`

# (regex facultative du modèle d'essai), `auth_url` + `key_pattern` + `validate` (`ay ai auth`),

# `cli` (hors LiteLLM : argv `models` et `ask` avec {model} {prompt}).

[settings]
host = "127.0.0.1"
port = 4000
config = "~/.config/ay/litellm.yaml"
prompt = "Reply with the single word: ok"
master_key = "LITELLM_MASTER_KEY"
registry = "https://models.dev/api.json"

# --- Serveurs ---------------------------------------------------------------------------------

# Passerelle : roue construite depuis le fork aphrody-labs/litellm (extension Rust, maturin) et

# publiée en release du fork avec litellm-proxy-extras et litellm-enterprise du même commit (absents de

# PyPI à ces versions) ; aucune compilation sur le poste.

[[runtime]]
id = "litellm"
bin = "litellm"
install.windows = [
[
"uv",
"tool",
"install",
"--no-build",
"--force",
"--python",
"3.13",
"--with",
"litellm-proxy-extras @ https://github.com/aphrody-labs/litellm/releases/download/ay-a7052ea8a802/litellm_proxy_extras-0.4.115-py3-none-any.whl",
"--with",
"litellm-enterprise @ https://github.com/aphrody-labs/litellm/releases/download/ay-a7052ea8a802/litellm_enterprise-0.1.84-py3-none-any.whl",
"litellm[proxy,google] @ https://github.com/aphrody-labs/litellm/releases/download/ay-a7052ea8a802/litellm-1.111.0-cp310-abi3-win_amd64.whl",
],
]
install.linux = [
[
"uv",
"tool",
"install",
"--no-build",
"--force",
"--python",
"3.13",
"--with",
"litellm-proxy-extras @ https://github.com/aphrody-labs/litellm/releases/download/ay-a7052ea8a802/litellm_proxy_extras-0.4.115-py3-none-any.whl",
"--with",
"litellm-enterprise @ https://github.com/aphrody-labs/litellm/releases/download/ay-a7052ea8a802/litellm_enterprise-0.1.84-py3-none-any.whl",
"litellm[proxy,google] @ https://github.com/aphrody-labs/litellm/releases/download/ay-a7052ea8a802/litellm-1.111.0-cp310-abi3-manylinux_2_39_x86_64.whl",
],
]
serve = [
"litellm",
"--config",
"{config}",
"--host",
"{host}",
"--port",
"{port}",
"--num_workers",
"1",
]
env = { LITELLM_LOG = "ERROR", PYTHONUTF8 = "1" }
health = "http://{host}:{port}/health/liveliness"

[[runtime]]
id = "ollama"
os = ["windows"]
bin = "ollama"
install.windows = [["ay", "up", "ollama"]]
serve = ["ollama", "serve"]
env = { OLLAMA_HOST = "127.0.0.1:11434", OLLAMA_MAX_LOADED_MODELS = "1", OLLAMA_NUM_PARALLEL = "1" }
health = "http://127.0.0.1:11434/api/version"
pull = ["ollama", "pull", "{model}"]

# Bibliothèque Ollama relevée le 2026-11-13 : gemma4:e2b = 4,6 Go (tient dans 12 Go de VRAM).

models = ["gemma4:e2b"]

# llama.cpp sert le GGUF déjà téléchargé par Ollama (pas de second téléchargement).

[[runtime]]
id = "llamacpp"
os = ["windows"]
bin = "llama-server"
install.windows = [["ay", "up", "llama.cpp"]]
serve = [
"llama-server",
"--host",
"127.0.0.1",
"--port",
"8080",
"-m",
"{ollama_gguf:gemma4:e2b}",
"--alias",
"gemma4-e2b",
"-ngl",
"99",
"-c",
"8192",
"-t",
"4",
"--jinja",
]
health = "http://127.0.0.1:8080/health"

# LM Studio sans interface : démon llmster + CLI lms (installateur officiel lmstudio.ai).

[[runtime]]
id = "lmstudio"
os = ["windows"]
bin = "lms"
path = ["~/.lmstudio/bin"]
install.windows = [
[
"pwsh",
"-NoProfile",
"-Command",
"irm https://lmstudio.ai/install.ps1 | iex",
],
]
install.linux = [
["sh", "-c", "curl -fsSL https://lmstudio.ai/install.sh | bash"],
]
serve = ["lms", "server", "start", "--port", "1234", "--bind", "127.0.0.1"]
oneshot = true
health = "http://127.0.0.1:1234/v1/models"

# Lien dur du GGUF d'Ollama (aucun second téléchargement) ; un ré-import est signalé « déjà présent ».

pull = [
"lms",
"import",
"-y",
"--hard-link",
"--user-repo",
"ollama/gemma4-e2b",
"{ollama_gguf:gemma4:e2b}",
]

[[runtime]]
id = "jan"
os = ["windows"]

# Application de bureau : son serveur API (port 1337) ne tourne que dans l'application ouverte.

bin = "~/AppData/Local/Programs/Jan/Jan-Desktop.exe"
install.windows = [
[
"winget",
"install",
"--id",
"Jan.Jan",
"--exact",
"--source",
"winget",
"--silent",
"--accept-package-agreements",
"--accept-source-agreements",
"--disable-interactivity",
],
]
health = "http://127.0.0.1:1337/v1/models"

# prd (sans GPU) : roue CPU officielle de vLLM et binaire CPU de mistral.rs, installables, jamais servis :

# pas de serveur d'inférence CPU sur l'hôte de production (consigne du 2026-11-13, charge à 306).

# Ligne `serve` en commentaire : sans elle, `ay ai service` et `ay ai up` les ignorent.

[[runtime]]
id = "vllm"
os = ["linux"]
bin = "vllm"
install.linux = [
[
"uv",
"tool",
"install",
"--python",
"3.12",
"--torch-backend",
"cpu",
"vllm @ https://github.com/vllm-project/vllm/releases/download/v0.32.0/vllm-0.32.0+cpu-cp38-abi3-manylinux_2_39_x86_64.whl",
],
]

# serve = ["vllm", "serve", "Qwen/Qwen3-0.6B", "--host", "127.0.0.1", "--port", "8000", "--max-model-len", "4096", "--served-model-name", "qwen3-0.6b"]

env = { VLLM_CPU_KVCACHE_SPACE = "2", VLLM_CPU_OMP_THREADS_BIND = "0-3", OMP_NUM_THREADS = "4" }
health = "http://127.0.0.1:8000/health"

[[runtime]]
id = "mistralrs"
os = ["linux"]
bin = "mistralrs"
install.linux = [["ay", "up", "mistral.rs"]]

# serve = ["mistralrs", "serve", "--cpu", "--host", "127.0.0.1", "-p", "8001", "-m", "Qwen/Qwen3-0.6B"]

env = { RAYON_NUM_THREADS = "4", OMP_NUM_THREADS = "4" }
health = "http://127.0.0.1:8001/v1/models"

# --- Fournisseurs -------------------------------------------------------------------------------

# Découverts dans le registre models.dev (format d'opencode : `env`, `api`, `npm`, `models` avec prix) :

# un fournisseur du registre est actif dès que sa clé est présente ; ses modèles viennent de son API

# via LiteLLM, sinon du catalogue du registre ; le modèle d'essai est le moins cher (prix du registre).

# Les entrées [[provider]] ci-dessous n'ajoutent que ce que le registre ignore : serveurs locaux,

# comptes de service Vertex, Mammouth (absent du registre), pages de clés pour `ay ai auth`.

# Vocabulaire du registre -> LiteLLM : paquet AI SDK d'un point d'accès, puis identifiant.

[litellm.npm]
"@ai-sdk/openai-compatible" = "openai"
[litellm.providers]
google = "gemini"
google-vertex = "vertex_ai"
vercel = "vercel_ai_gateway"

# Noms du registre -> noms du coffre de src.

[env]
CLOUDFLARE_API_KEY = "CLOUDFLARE_API_TOKEN"

# Serveurs locaux (sans clé, actifs s'ils répondent).

[[provider]]
id = "ollama"
route = "ollama_chat"
api_base = "http://127.0.0.1:11434"
health = "/api/version"

[[provider]]
id = "llamacpp"
route = "hosted_vllm"
api_base = "http://127.0.0.1:8080/v1"
health = "/models"

[[provider]]
id = "lmstudio"
route = "hosted_vllm"
api_base = "http://127.0.0.1:1234/v1"
health = "/models"

[[provider]]
id = "jan"
route = "hosted_vllm"
api_base = "http://127.0.0.1:1337/v1"
health = "/models"

[[provider]]
id = "vllm"
route = "hosted_vllm"
api_base = "http://127.0.0.1:8000/v1"
health = "/models"

[[provider]]
id = "mistralrs"
route = "hosted_vllm"
api_base = "http://127.0.0.1:8001/v1"
health = "/models"

# Pages de clés (`ay ai auth`) : ouvertes dans le navigateur, clé lue au presse-papiers.

[[provider]]
id = "openai"
auth_url = "https://platform.openai.com/api-keys"
key_pattern = "^sk-[A-Za-z0-9_-]{20,}$"
validate = "https://api.openai.com/v1/models"

[[provider]]
id = "openrouter"
auth_url = "https://openrouter.ai/settings/keys"
key_pattern = "^sk-or-v1-[0-9a-f]{64}$"
validate = "https://openrouter.ai/api/v1/key"

[[provider]]
id = "huggingface"
auth_url = "https://huggingface.co/settings/tokens/new?tokenType=fineGrained"
key_pattern = "^hf_[A-Za-z0-9]{30,}$"
validate = "https://huggingface.co/api/whoami-v2"

[[provider]]
id = "vercel"
auth_url = "https://vercel.com/d?to=%2F%5Bteam%5D%2F%7E%2Fai%2Fapi-keys"
key_pattern = "^[A-Za-z0-9_-]{24,}$"
validate = "https://ai-gateway.vercel.sh/v1/credits"

# Absent du registre models.dev au 2026-11-13 ; API OpenAI-compatible (info.mammouth.ai/docs).

[[provider]]
id = "mammouth"
route = "openai"
api_base = "https://api.mammouth.ai/v1"
key = "MAMMOUTH_API_KEY"
auth_url = "https://mammouth.ai/app/account/settings/api"
key_pattern = "^sk-[A-Za-z0-9_-]{16,}$"
validate = "https://api.mammouth.ai/v1/models"

# Une route par compte de service lisible (projet lu dans le JSON) au lieu des variables

# GOOGLE_VERTEX_* du registre.

[[provider]]
id = "google-vertex"
route = "vertex_ai"
credentials = [
"env:VERTEX_APHRODY_SA_KEY",
"env:GCP_ADMIN_SA_KEY",
"file:~/.aphrody/secrets/yolo-automation.json",
]
params = { vertex_location = "env:GOOGLE_CLOUD_LOCATION" }

# Anthropic (clé payante, rattachée à un espace de travail) : en-tête anthropic-workspace-id et plafond de

# dépense ajoutés par infra/ai/litellm-overlay.toml (ay ne sait pas encore écrire extra_headers ni max_budget).

[[provider]]
id = "anthropic"
route = "anthropic"
key = "ANTHROPIC_API_KEY"

# Hors LiteLLM : CLI Antigravity authentifiée (modèles listés par la CLI).

[[provider]]
id = "antigravity"
cli = { models = ["agy", "models"], ask = [
"agy",
"-p",
"{prompt}",
"--mode",
"plan",
"--model",
"{model}",
] }

================================================
FILE: ai/fabric/node.sh
================================================

// [OUTLINE - 15 symbols, 162 lines]
// L20: load1()
// L22-L25: load_ok()
// L26: mem_avail_mb()
// L27: mem_need_mb()
// L29: building()
// L32-L56: gate()
// L58: rpc_bin()
// L60-L69: install_bin()
// L71-L82: nft_on()
// L83: nft_off()
// L86-L104: watch()
// L106-L123: up()
// L126-L140: warm()
// L142: down()
// L144-L152: status()

================================================
FILE: ai/fabric.toml
================================================

# Tissu d'inférence distribué (llama.cpp RPC) : un llama-server coordinateur sur le GPU du PC, des

# ggml-rpc-server sur les autres hôtes, joints uniquement par WireGuard. Lu par packages/ai-os/src/fabric

# (`ai-os fabric up|status|down`, `ay ai fabric ...`). Doc : docs/ai/DISTRIBUTED-INFERENCE.md.

#

# [release] binaires officiels ggml-org/llama.cpp, empreintes = `digest` de l'API GitHub des assets

# (gh api repos/ggml-org/llama.cpp/releases/tags/b<tag>), relevées le 2026-11-13. Jamais de

# compilation sur le PC ; sur prd seulement via infra/fleet/bin/heavy.sh.

# [model.*] GGUF servis par le coordinateur ; `path` relatif au cache de modèles (dédupliqué, liens durs).

# [[node]] hôte de calcul : `bind` = adresse WireGuard d'écoute (jamais 0.0.0.0), `reach` = adresse vue

# du coordinateur, `gate` = condition d'admission (vérifiée au démarrage puis toutes les

# `watch_s` secondes par le chien de garde : le nœud se retire seul), plafonds systemd.

[coordinator]
node = "pc"
host = "127.0.0.1"
port = 8090
model = "gemma4-e2b"
ctx = 8192
cache = "~/.local/share/ay/ai"

# Adresses WireGuard du coordinateur : seules sources admises sur le port RPC des nœuds (nft).

mesh = ["10.200.77.2", "10.200.78.2"]

# Admission opportuniste (`ai-os fabric ensure`, tâche planifiée `ai-os fabric timer`) : dès qu'un nœud listé passe sa

# condition, essai court réparti (une couche distante, `tokens` jetons) puis retour à l'état précédent ; résultat dans

# ~/.local/share/ay/ai/fabric-trials.jsonl (`ai-os fabric trials`). Un nœud déjà essayé avec succès n'est plus sondé.

[trial]
nodes = ["prd"]
model = "qwen3-0.6b"
split = [1, 27]
tokens = 16

[release]
tag = "b12340"
commit = "8954f194837d2ec4d5f67f20c81b84abe63883ba"
windows-x86_64 = { asset = "llama-b12340-bin-win-cuda-13.5-x64.zip", sha256 = "31013c2a0d7ed93489862613a08f34658861996741b310ee3fa9e27ec139642b" }
windows-x86_64-cudart = { asset = "cudart-llama-bin-win-cuda-13.5-x64.zip", sha256 = "c2bf4cc202bfbaaa7a0b75f5082457c3811326947bb216059b72839d844e9cba" }
linux-x86_64 = { asset = "llama-b12340-bin-ubuntu-x64.tar.gz", sha256 = "5bc0276548147e56aa03f97b201b1cb3b43cbda6e388f1f2f4c8d82b56313856" }

[model.gemma4-e2b]

# unsloth/gemma-4-E2B-it-GGUF, Q4_K_M : sha256 = oid LFS de l'API Hugging Face (relevé 2026-11-13), identique

# sur le PC et sur chaque nœud (`warm`) pour que le cache de tenseurs de rpc-server serve les mêmes empreintes.

path = "gemma-4-E2B-it-Q4_K_M.gguf"
bytes = 3106738272
sha256 = "740185b21d22ceb83a11c3aa62ad5842ef32c70f6096d756bbee85a1e4ec34b8"
url = "https://huggingface.co/unsloth/gemma-4-E2B-it-GGUF/resolve/main/gemma-4-E2B-it-Q4_K_M.gguf"

[model."qwen3-0.6b"]

# unsloth/Qwen3-0.6B-GGUF, Q4_K_M (oid LFS, 2026-11-13). Architecture sans partage de KV entre couches : modèle de

# mesure du tissu (9,5 Mio par couche, une couche distante se charge en quelques minutes sur le lien montant du PC).

path = "Qwen3-0.6B-Q4_K_M.gguf"
bytes = 396705472
sha256 = "ac2d97712095a558e31573f62f466a3f9d93990898b0ec79d7c974c1780d524a"
url = "https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q4_K_M.gguf"

# --- Nœuds ------------------------------------------------------------------------------------

[[node]]
id = "pc"
os = "windows"
role = "coordinator"

# Parts relatives des couches (-ts, ordre llama.cpp : nœuds RPC puis CUDA0). Sans part sur chaque nœud admis,

# llama.cpp répartit selon la mémoire libre et donnerait l'essentiel au CPU d'un VPS (47 Gio libres sur fr1).

share = 7

# Moteur principal : RTX 4070 12 Go (CUDA 13.5, pilote 621.14, relevé nvidia-smi 2026-11-13).

[[node]]
id = "fr1"
ssh = "vps"
os = "linux"
bind = "10.200.77.1"
reach = "10.200.77.1"
port = 50052
threads = 8
share = 1
cpu_quota = "800%"
memory_max = "24G"

# Hôte Chromium/LLVM : admis seulement sans build en cours (ni ninja/siso/clang/rustc, ni build.slice chargé).

gate = "no-build"
watch_s = 15

[[node]]
id = "prd"
ssh = "prd"
os = "linux"

# Lien direct PC <-> prd (interface `prod`, 10.200.78.0/30) : seul le PC peut joindre ce port.

bind = "10.200.78.1"
reach = "10.200.78.1"
port = 50052
threads = 2
share = 1
cpu_quota = "200%"
memory_max = "6G"

# Production : charge < nproc/2, verrou lourd libre (flock -n), shenron-chat-v2 sain, mémoire disponible.

gate = "prd"
heavy_lock = "/var/lock/aphrody-heavy.lock"
priority_url = "http://127.0.0.1:8799/health"
watch_s = 10

[[node]]
id = "fr2"
ssh = "cdn"
os = "linux"
bind = "10.200.77.3"
reach = "10.200.77.3"
port = 50052
threads = 2
cpu_quota = "100%"
memory_max = "2G"

# Proxy prioritaire : nginx actif et charge < nproc/2 ; 11 Go de RAM, contribution marginale.

gate = "proxy"
watch_s = 10
enabled = false

[[node]]

# Second hôte Windows à GPU NVIDIA : absent de l'inventaire au 2026-11-13 (deploy.toml, fleet.toml,

# docs/infra, ~/.ssh/config, pairs WireGuard). Il rejoint le tissu dès que `reach` répond sur `port`

# (voir « Intégrer le second hôte GPU » dans docs/ai/DISTRIBUTED-INFERENCE.md).

id = "gpu2"
os = "windows"
reach = ""
port = 50052
gate = "reachable"

================================================
FILE: ai/litellm-overlay.toml
================================================

# Retouches de la config LiteLLM écrite par `ay ai config`, appliquées par infra/ai/litellm-serve.ts avant le

# démarrage du proxy (unité ay-ai-litellm, drop-in infra/ai/systemd/ay-ai-litellm.service.d/10-creds.conf).

# Sert ce que ai.toml ne sait pas encore exprimer : en-têtes, plafonds de dépense, routes à retirer par hôte.

# Valeurs "env:X" : lues dans l'environnement du proxy (identifiants systemd-creds), jamais écrites ici.

# Routes retirées (model_name), par hôte (`hostname` ou AY_AI_HOST).

[drop]
prd = ["vllm/_", "mistralrs/_"]

# En-têtes ajoutés à litellm_params.extra_headers d'une route.

[headers."anthropic/*"]
anthropic-workspace-id = "env:ANTHROPIC_WORKSPACE_ID"

# Plafond par route payante (USD par période) : la route est écartée par le routeur une fois le plafond atteint.

[budget."anthropic/*"]
max_budget = 2.0
budget_duration = "1d"

# Plafond global du proxy (toutes routes).

[litellm_settings]
max_budget = 5.0
budget_duration = "1d"

# Ordre de préférence publié à côté de la config (lu par le relais) : gratuits ou locaux d'abord.

[prefer]
order = [
"ollama/_",
"llamacpp/_",
"cloudflare-workers-ai/_",
"google-vertex-aphrody/_",
"anthropic/*",
]

================================================
FILE: ai/litellm-serve.ts
================================================

// [OUTLINE - 0 symbols, 161 lines]
// import node:fs
// import node:os
// import node:path
// import node:util

================================================
FILE: ai/systemd/ay-ai-litellm.service.d/10-creds.conf
================================================

# Drop-in de ay-ai-litellm (prd) : identifiants systemd-creds au lieu de /etc/aphrody/secrets.env, routes et

# plafonds retouchés par infra/ai/litellm-serve.ts. Installation : infra/ai/systemd/install-prd.sh.

[Service]
LoadCredentialEncrypted=CLOUDFLARE_API_TOKEN
LoadCredentialEncrypted=LITELLM_MASTER_KEY
LoadCredentialEncrypted=ANTHROPIC_API_KEY
LoadCredentialEncrypted=ANTHROPIC_WORKSPACE_ID
LoadCredentialEncrypted=VERTEX_APHRODY_SA_KEY
Environment=CLOUDFLARE_ACCOUNT_ID=ca22c1a51a145f919b54afa18d936516
Environment=GOOGLE_CLOUD_LOCATION=us-central1
Environment=AY_AI_HOST=prd
RuntimeDirectory=ay-ai
RuntimeDirectoryMode=0700
ExecStart=
ExecStart=/root/.bun/bin/bun /usr/local/lib/aphrody-ai/litellm-serve.ts --manifest /usr/local/lib/aphrody-ai/ai.toml --overlay /usr/local/lib/aphrody-ai/litellm-overlay.toml --ay /root/.local/bin/ay --litellm /root/.local/bin/litellm

================================================
FILE: ai/systemd/install-prd.sh
================================================

// [OUTLINE - 0 symbols, 15 lines]

================================================
FILE: chromium-factory/args/labs_agent.gn
================================================

# labs_agent: optimized headless Chromium for agents (headless_shell lineage), Chrome 157.

# Every arg below was checked with `gn args out/labs_agent-157.0.8103.78 --list --short` on fr1

# (2026-11-12). aphrody-factory appends `use_siso` / `use_remoteexec` after its generated marker;

# do not set them here.

#

# Kept on purpose (product, not build cost):

# is_official_build -> ThinLTO + CFI (is_cfi, use_cfi_icall default true) + PGO.

# chrome_pgo_phase = 2 -> needs custom_vars checkout_pgo_profiles (set by `sync`); profile fetch is

# part of sync, not of the build.

# thin_lto_enable_cache defaults to true: cache in $root_out_dir/thinlto-cache

# (build/config/compiler/BUILD.gn:784-789), hence the stable out dir `out/labs_agent`.

# Not applicable in 157 (absent from `gn args --list`): enable_nacl, use_jumbo_build.

# Measured as negligible (F0 metrics, core-seconds): printing 44, pdf 10, device/vr 64,

# screen_ai 14, on_device_translation 32 -> left at default (Page.printToPDF needs printing).

# perfetto trace_processor (279 objects, 3790 s) comes from base -> libperfetto (JSON trace export

# used by CDP Tracing), kept.

is_official_build = true
is_debug = false
dcheck_always_on = false
symbol_level = 0
blink_symbol_level = 0
v8_symbol_level = 0
use_thin_lto = true
chrome_pgo_phase = 2
enable_remoting = false
enable_widevine = false
use_cups = false
use_pulseaudio = false
use_vaapi = false
headless_use_prefs = false

# headless_enable_commands (default true) asserts !headless_use_embedded_resources

# (headless/BUILD.gn:23): never set headless_use_embedded_resources = true.

treat_warnings_as_errors = false

# Vulkan validation layers are a data dep of headless_shell only (gn path: no non-data path) and a

# debug tool: 248 objects, 1580 core-s in F0. Default true on Linux (dawn_features.gni:177).

dawn_enable_vulkan_validation_layers = false

================================================
FILE: chromium-factory/chromium-factory.sh
================================================

// [OUTLINE - 4 symbols, 43 lines]
// L13: log()
// L14-L27: sync()
// L28-L35: build()
// L36-L42: publish()

================================================
FILE: chromium-factory/cros-factory.sh
================================================

// [OUTLINE - 5 symbols, 40 lines]
// L11: log()
// L12-L21: sync()
// L22-L27: build()
// L28-L32: image()
// L33-L39: publish()

================================================
FILE: chromium-factory/factory.toml
================================================

# aphrody-factory config on fr1 (deployed to /srv/chromium/factory/factory.toml). Values = built-in

# defaults, written out so the sizing is visible. Sizing from F0 (2026-11-12): max cxx RSS 2.97 GB,

# build peak 19.8 GiB with 12 local jobs.

root = "/srv/chromium"
factory = "/srv/chromium/factory"
out_name = "labs_agent" # stable: keeps thinlto-cache and siso state across versions
target = "headless_shell"
args = "args/labs_agent.gn"
ay = "/home/ubuntu/bin/ay"
sync_with_ay = false # true once `ay gclient sync --apply --populate-cache --cipd` is validated (F3)
depot_tools = "/home/ubuntu/depot_tools"
state = "/srv/chromium/factory-state.json"

[reapi]
enabled = true
address = "10.200.77.1:50051"
worker_api = "10.200.77.1:50061"
instance = "main"
project = "aphrody"
local_jobs = 4 # fr1 also runs a 10-slot worker
remote_jobs = 26 # ~1.5 x (10 + 4 + 3) worker slots

[[workers]]
addr = "10.200.77.1"
local = true
name = "fr1" # deploy after the F0 stop: deploy.sh worker 10.200.77.1 100000000000 10
jobs = 10
min_mem_gb = 26

[[workers]]
name = "prd"
addr = "10.200.77.5" # liveness = connection to worker_api (ss on fr1)
jobs = 4 # 8 cores but ~5 GiB MemAvailable next to its services
min_mem_gb = 10

[[workers]]
name = "fr2"
addr = "10.200.77.3"
jobs = 3 # 6 cores / 11 GiB
min_mem_gb = 8

[publish]
remote = "r2-chromium"
bucket = "aphrody-chromium"
prefix = "labs_agent"
zstd_level = 19
staging = "/srv/chromium/publish"

[doctor]
min_free_gb_src = 40
min_free_gb_cas = 160
cas_path = "/home"
min_mem_avail_gb = 16
conflicting = [
"siso",
"ninja",
"autoninja",
"cros_sdk",
"repo",
"emerge",
"gclient",
]

================================================
FILE: chromium-factory/nativelink/deploy.sh
================================================

// [OUTLINE - 0 symbols, 42 lines]

================================================
FILE: chromium-factory/nativelink/server.json5
================================================

// NativeLink 1.8.5 scheduler + CAS + AC on fr1 (mesh 10.200.77.x only). Chromium siso: -reapi_instance=main.
{
stores: [
{
name: "CAS",
compression: {
compression_algorithm: { lz4: {} },
backend: {
filesystem: {
content_path: "/home/nativelink/cas",
temp_path: "/home/nativelink/cas-tmp",
eviction_policy: { max_bytes: 150000000000 },
},
},
},
},
{
name: "AC",
filesystem: {
content_path: "/home/nativelink/ac",
temp_path: "/home/nativelink/ac-tmp",
eviction_policy: { max_bytes: 5000000000 },
},
},
],
schedulers: [
{
name: "MAIN",
simple: {
worker_timeout_s: 60,
supported_platform_properties: {
OSFamily: "priority",
"container-image": "priority",
"label:action_default": "priority",
"label:action_large": "priority",
cpu_count: "minimum",
ISA: "exact",
},
},
},
],
servers: [
{
listener: {
http: {
socket_address: "10.200.77.1:50051",
advanced_http: { http2_keep_alive_interval: 10 },
},
},
services: {
cas: [{ instance_name: "main", cas_store: "CAS" }],
ac: [{ instance_name: "main", ac_store: "AC" }],
execution: [
{ instance_name: "main", cas_store: "CAS", scheduler: "MAIN" },
],
capabilities: [
{ instance_name: "main", remote_execution: { scheduler: "MAIN" } },
],
// Array format (1.8.5 warned "deprecated map format" for `cas_stores: { main: ... }`).
bytestream: [{ instance_name: "main", cas_store: "CAS" }],
},
},
{
listener: { http: { socket_address: "10.200.77.1:50061" } },
services: { worker_api: { scheduler: "MAIN" }, health: {} },
},
],
}

================================================
FILE: chromium-factory/nativelink/worker.json5
================================================

// NativeLink worker; env: NL_SCHED (fr1 mesh IP), NL_CACHE_BYTES.
{
stores: [
{
name: "GRPC_CAS",
grpc: {
instance_name: "main",
store_type: "cas",
endpoints: [{ address: "grpc://${NL_SCHED}:50051" }],
connections_per_endpoint: 4,
},
},
{
name: "GRPC_AC",
grpc: {
instance_name: "main",
store_type: "ac",
endpoints: [{ address: "grpc://${NL_SCHED}:50051" }],
},
},
{
name: "FAST_SLOW",
fast_slow: {
fast: {
filesystem: {
content_path: "/var/lib/nativelink/cas",
temp_path: "/var/lib/nativelink/cas-tmp",
eviction_policy: { max_bytes: "${NL_CACHE_BYTES}" },
},
},
slow: { ref_store: { name: "GRPC_CAS" } },
},
},
],
workers: [
{
local: {
worker_api_endpoint: { uri: "grpc://${NL_SCHED}:50061" },
cas_fast_slow_store: "FAST_SLOW",
upload_action_result: { ac_store: "GRPC_AC" },
work_directory: "/var/lib/nativelink/work",
max_inflight_tasks: "${NL_JOBS}",
max_action_timeout_s: 1800,
platform_properties: {
cpu_count: { query_cmd: "nproc" },
OSFamily: { values: ["Linux"] },
"container-image": { values: [""] },
"label:action_default": { values: ["1"] },
"label:action_large": { values: ["1"] },
ISA: { values: ["x86-64"] },
},
},
},
],
servers: [],
}

================================================
FILE: chromium-factory/systemd/chromium-factory.service
================================================

[Unit]
Description=Chromium factory (labs_agent headless_shell, Chrome Stable) via aphrody-factory
Wants=network-online.target
After=network-online.target nativelink-server.service
[Service]
Type=oneshot
User=ubuntu

# systemd-run without User= left HOME unset (`HOME: unbound variable`, 2026-11-12 16:21:05).

Environment=HOME=/home/ubuntu
Environment=PATH=/home/ubuntu/bin:/home/ubuntu/depot_tools:/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin
WorkingDirectory=/srv/chromium

# Never next to the ChromiumOS factory (its repo sync overlapped the F0 build for 69 min).

ExecCondition=/bin/sh -c '! systemctl is-active --quiet cros-factory.service'

# Resumable: `all` skips steps already recorded in /srv/chromium/factory-state.json; doctor gates build.

ExecStart=/srv/chromium/factory/bin/aphrody-factory all --refresh-channels --channel stable --config /srv/chromium/factory/factory.toml
Nice=10
IOSchedulingClass=best-effort
IOSchedulingPriority=7
TimeoutStartSec=infinity

# siso gets SIGTERM first and flushes siso_metrics.json / .siso_fs_state.

KillMode=mixed
TimeoutStopSec=120

================================================
FILE: chromium-factory/systemd/chromium-factory.timer
================================================

[Unit]
Description=Rebuild labs_agent when Chrome Stable moves (weekly)
[Timer]
OnCalendar=Sun 03:00
Persistent=true
[Install]
WantedBy=timers.target

================================================
FILE: chromium-factory/systemd/cros-factory.service
================================================

[Unit]
Description=ChromiumOS factory (amd64-generic, release branch of Chrome Stable)
Wants=network-online.target
After=network-online.target
[Service]
Type=oneshot
User=ubuntu
Environment=HOME=/home/ubuntu
Environment=PATH=/home/ubuntu/bin:/home/ubuntu/depot_tools:/home/ubuntu/.local/bin:/usr/local/bin:/usr/bin:/bin
WorkingDirectory=/home/ubuntu

# Serialized behind the Chromium factory (F6 queued after F0/F1).

ExecCondition=/bin/sh -c '! systemctl is-active --quiet chromium-factory.service'

# chromite stays Python; only orchestration moves to Rust later (`aphrody-factory cros`).

ExecStart=/srv/chromium/factory/cros-factory.sh all amd64-generic
Nice=15
IOSchedulingClass=idle
TimeoutStartSec=infinity

================================================
FILE: cloudflare/aop.ts
================================================

// [OUTLINE - 0 symbols, 239 lines]
// import node:fs
// import node:os
// import node:path

================================================
FILE: cloudflare/cf.ts
================================================

// [OUTLINE - 2 symbols, 545 lines]
// import ./lib.ts
// L306-L328: function storeAccess(
// L331-L346: function storedClientId(host: string): string | null

================================================
FILE: cloudflare/cloudflare.toml
================================================

# Cloudflare edge of the fleet, declarative (docs/infra/FR2-CLOUDFLARE.md).

# bun infra/cloudflare/cf.ts plan diff live vs this file (read-only, default)

# bun infra/cloudflare/cf.ts apply <section> apply one section: dns | tunnels | rules | access

# bun infra/cloudflare/proof.ts re-run every check, exit 1 on regression (just cf-proof)

# Only objects listed here are managed; everything else on the account is left untouched

# (rosegriffon.fr, dragonballfr.com, nie.aphrody.app, cdn.rosegriffon.fr: rosegriffon-52 / shenron).

# Content "tunnel:<name>" expands to <tunnel id>.cfargotunnel.com. No secrets in this file.

account = "ca22c1a51a145f919b54afa18d936516"

[zones]
"aphrody.com" = "963461271f885bc3f3c2bfd586f2b7ba"
"aphrody.app" = "f4dab237b9811435da6fee0b5b3438d4"

# Product zones: only the [[rules]] refs below are managed here (content and DNS stay with shenron / rosegriffon).

"dragonballfr.com" = "255ff360c8d411f03086741b50539641"
"rosegriffon.fr" = "3eaec2aa7c611a728fe1b514af6603e3"

# Remote-managed tunnels. Connector: systemd unit + token in an encrypted systemd credential on the host.

[tunnels.mig-prd]
id = "72153924-6650-4dd4-bced-f8b6731edcd8"
host = "prd"
ingress = [

# Cluster LB ports (HAProxy on fr1/fr2/prd, infra/cluster, docs/infra/CLUSTER.md): same answer on every host, so

# mig-prd connector replicas can run anywhere. Rollback: the old origins 127.0.0.1:8780 / :8797, 10.200.77.5:8182 / :8766.

{ hostname = "mig-test.aphrody.com", service = "http://127.0.0.1:19780" },
{ hostname = "mig-downloads.aphrody.com", service = "http://127.0.0.1:19797" },
{ hostname = "mig-depot.aphrody.com", service = "http://127.0.0.1:19182" },
{ hostname = "mig-commons.aphrody.com", service = "http://127.0.0.1:19766" },
{ hostname = "ssh-prd.aphrody.com", service = "ssh://127.0.0.1:19022" }, # cluster LB -> prd sshd from any replica

# Standby of the names whose DNS still points to fr2 (infra/fleet/fr2/bin/fleet-standby-sync.sh, prd loopback):

# unused until fleet-dns-failover.sh turns their A/AAAA into a CNAME to this tunnel when fr2 is down.

{ hostname = "dbfr.aphrody.com", service = "http://127.0.0.1:29401" },
{ hostname = "nie.aphrody.app", service = "http://127.0.0.1:29402" },
{ hostname = "fleet-failover-test.aphrody.com", service = "http://127.0.0.1:29401" }, # fleet-dns-failover-test.sh only

# aphrody service: cluster LB pool aphrody (prd:23000, blue/green switched in deploy.toml only).

{ hostname = "aphrody.com", service = "http://127.0.0.1:19300" },
{ hostname = "*.aphrody.com", service = "http://127.0.0.1:19300" },

# aphrody-app VPS port (deploy.toml hosting.aphrody-app.port): same target fr2 used, nothing listens yet (502 parity).

# *.aphrody.app is the Worker aphrody-deploy (packages/deploy); names it passes through without a backend answer 404, not 502.

{ hostname = "*.aphrody.app", service = "http_status:404" },
{ service = "http_status:404" },
]

[tunnels.fr2]
id = "88aa6a53-0a9a-4a5b-a9b6-3d3394dd978d"
host = "fr2"
ingress = [
{ hostname = "ssh-fr2.aphrody.com", service = "ssh://127.0.0.1:22" },
{ service = "http_status:404" },
]

# DNS: name -> desired single record. rollback = the record before migration (one line, also in the doc).

[dns."aphrody.com"]
"aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"ssh-prd.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "delete" }
"ssh-fr2.aphrody.com" = { type = "CNAME", content = "tunnel:fr2", rollback = "delete" }
"os.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"admin.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"ai.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"art.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"auth.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"bot.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"bxc.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"cad.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"calendar.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"chat.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"console.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"control.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"design.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"docs.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"drive.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"fig.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"inacord.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"mail.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"maps.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"mcp.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"meet.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"n2b.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"nie.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"pdf.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"photos.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"play.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"search.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"sheets.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"slides.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"sound.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"status.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"store.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }
"translate.aphrody.com" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "CNAME aphrody.com" }

# shenron community gateway, still served by fr2 (static JSON) until shenron moves it to usa: proxied so fr2 can

# refuse non-Cloudflare clients on 80/443 (cert *.aphrody.com, SSL Full strict).

"dbfr.aphrody.com" = { type = "A", content = "51.255.162.6", rollback = "A 51.255.162.6 proxied=false" }

[dns."aphrody.app"]

# Previews <project>-<sha7>.aphrody.app and project domains: Worker aphrody-deploy on route _.aphrody.app/_ (explicit records win).

"*.aphrody.app" = { type = "AAAA", content = "100::", proxied = true, rollback = "delete" }
"api.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"auth.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"craft.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"deploy.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"git.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"play.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"source.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-audio.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-cad.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-compositing.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-documents.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-generation.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-images.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-interface-layouts.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-layout.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-pdf.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-photo-processing.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-slides.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-tables.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-vectors.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }
"app-video.aphrody.app" = { type = "CNAME", content = "tunnel:mig-prd", rollback = "A 51.255.162.6" }

# Zone rules managed by ref (other rules in the same phase are kept as they are).

[[rules]]
zone = "aphrody.com"
phase = "http_request_firewall_custom"
ref = "fr2-block-probes"
description = "Block scanner probes (replaces fr2 nginx deny rules; /.env, /.git, wp-_, php)"
expression = '(http.request.uri.path wildcard r"/.env_" or starts_with(http.request.uri.path, "/.git/") or starts_with(http.request.uri.path, "/wp-") or http.request.uri.path.extension eq "php")'
action = "block"

[[rules]]
zone = "aphrody.app"
phase = "http_request_firewall_custom"
ref = "fr2-block-probes"
description = "Block scanner probes (replaces fr2 nginx deny rules; /.env, /.git, wp-_, php)"
expression = '(http.request.uri.path wildcard r"/.env_" or starts_with(http.request.uri.path, "/.git/") or starts_with(http.request.uri.path, "/wp-") or http.request.uri.path.extension eq "php")'
action = "block"

# Replaces nginx limit_req (aphrody_downloads burst 40, aphrody_cdn_css burst 60) now that these hosts are Workers.

# Free plan: one rule per zone, period 10 s, mitigation 10 s.

[[rules]]
zone = "aphrody.com"
phase = "http_ratelimit"
ref = "fr2-rl-edge"
description = "Per-IP rate limit on api/downloads/cdn (replaces fr2 nginx limit_req)"
expression = '(http.host in {"api.aphrody.com" "downloads.aphrody.com" "cdn.aphrody.com"})'
action = "block"
ratelimit = { characteristics = ["ip.src", "cf.colo.id"], period = 10, requests_per_period = 400, mitigation_timeout = 10 }

# Sites whose only origin is prd (A record on prd, stateful backends): HTML eligible for the edge cache, TTL taken from

# the origin Cache-Control only (bypass when absent, so private/no-store pages are never stored). Cloudflare then

# serves the cached copy stale when the origin returns 5xx or is unreachable (prd reboot/crash), and serves it at once

# while revalidating (origin stale-while-revalidate). Next.js RSC payloads (rsc header, _rsc query) stay uncached.

# Rollback: cf.ts never deletes, so delete the rule by ref (dashboard or API DELETE .../rulesets/<id>/rules/<rule id>), then drop the block.

[[rules]]
zone = "dragonballfr.com"
phase = "http_request_cache_settings"
ref = "aphrody-origin-stale"
description = "prd-only site: cache HTML per origin Cache-Control, served stale when prd is down"
expression = '(http.host in {"dragonballfr.com" "www.dragonballfr.com"} and http.request.method in {"GET" "HEAD"} and not any(lower(http.request.headers.names[_])[_] in {"rsc" "next-router-prefetch" "next-router-state-tree" "authorization"}) and not http.request.uri.query contains "_rsc")'
action = "set_cache_settings"
action_parameters = { cache = true, edge_ttl = { mode = "bypass_by_default" }, browser_ttl = { mode = "respect_origin" }, serve_stale = { disable_stale_while_updating = false } }

# Cloudflare never caches when the origin port is 8443 (fundamentals/reference/network-ports: "caching disabled"),

# which is where the zone rule "rosegriffon prd origin port" sends every rosegriffon name. The site names go to 9443

# instead (same prd host nginx server block, extra listen; prd /etc/fleet/firewall.nft opens 9443 to Cloudflare

# with 8443). This rule comes after the rosegriffon one, so its port wins. Rollback: delete the rule by ref, then drop the block.

[[rules]]
zone = "rosegriffon.fr"
phase = "http_request_origin"
ref = "aphrody-origin-cacheable-port"
description = "rosegriffon.fr/www: origin port 9443 (cacheable) instead of 8443"
expression = '(http.host in {"rosegriffon.fr" "www.rosegriffon.fr"})'
action = "route"
action_parameters = { origin = { port = 9443 } }

[[rules]]
zone = "rosegriffon.fr"
phase = "http_request_cache_settings"
ref = "aphrody-origin-stale"
description = "prd-only site: cache HTML per origin Cache-Control, served stale when prd is down"
expression = '(http.host in {"rosegriffon.fr" "www.rosegriffon.fr"} and http.request.method in {"GET" "HEAD"} and not any(lower(http.request.headers.names[_])[_] in {"rsc" "next-router-prefetch" "next-router-state-tree" "authorization"}) and not http.request.uri.query contains "_rsc")'
action = "set_cache_settings"
action_parameters = { cache = true, edge_ttl = { mode = "bypass_by_default" }, browser_ttl = { mode = "respect_origin" }, serve_stale = { disable_stale_while_updating = false } }

# aphrody.app R2 CDN host, 30 days at the edge. cdn.aphrody.app and dragonballfr.aphrody.app (no DNS record) removed

# from the live expression. Rollback: restore the three hosts in the expression, then apply rules.

[[rules]]
zone = "aphrody.app"
phase = "http_request_cache_settings"
ref = "aphrody-r2-cdn"
description = "R2 CDN hosts: cache everything for 30 days at the edge"
expression = '(http.host in {"assets.aphrody.app"})'
action = "set_cache_settings"
action_parameters = { cache = true, edge_ttl = { default = 2592000, mode = "override_origin" }, browser_ttl = { mode = "respect_origin" }, serve_stale = { disable_stale_while_updating = false } }

# Immutable CDN prefix /_static/* (docs/replica/ARCHITECTURE.md §3): eligible for the edge cache, TTL from the origin

# Cache-Control (public, max-age=31536000, immutable). Rollback: delete the rule by ref, then drop the block.

[[rules]]
zone = "aphrody.com"
phase = "http_request_cache_settings"
ref = "aphrody-static"
description = "/_static/*: edge cache following the origin Cache-Control"
expression = '(starts_with(http.request.uri.path, "/_static/"))'
action = "set_cache_settings"
action_parameters = { cache = true, edge_ttl = { mode = "respect_origin" }, browser_ttl = { mode = "respect_origin" } }

[[rules]]
zone = "aphrody.app"
phase = "http_request_cache_settings"
ref = "aphrody-static"
description = "/_static/*: edge cache following the origin Cache-Control"
expression = '(starts_with(http.request.uri.path, "/_static/"))'
action = "set_cache_settings"
action_parameters = { cache = true, edge_ttl = { mode = "respect_origin" }, browser_ttl = { mode = "respect_origin" } }

# The 2 legacy page rules of aphrody.com imported as cache rules (same effect: cache everything, browser 1 year,

# edge 30 days). They come last in the phase, so they win over aphrody-origin-cdn as the page rule does today.

# The page rules themselves stay live until the owner removes them (cf.ts never deletes).

[[rules]]
zone = "aphrody.com"
phase = "http_request_cache_settings"
ref = "aphrody-pagerule-cdn"
description = "Imported page rule cdn.aphrody.com/*: cache everything, browser 1 year, edge 30 days"
expression = '(http.host eq "cdn.aphrody.com")'
action = "set_cache_settings"
action_parameters = { cache = true, edge_ttl = { default = 2592000, mode = "override_origin" }, browser_ttl = { default = 31536000, mode = "override_origin" } }

[[rules]]
zone = "aphrody.com"
phase = "http_request_cache_settings"
ref = "aphrody-pagerule-assets"
description = "Imported page rule _aphrody.com/assets/_: cache everything, browser 1 year, edge 30 days"
expression = '((http.host eq "aphrody.com" or ends_with(http.host, ".aphrody.com")) and starts_with(http.request.uri.path, "/assets/"))'
action = "set_cache_settings"
action_parameters = { cache = true, edge_ttl = { default = 2592000, mode = "override_origin" }, browser_ttl = { default = 31536000, mode = "override_origin" } }

# Access: browser-rendered SSH (type ssh) + a service token for agents (cloudflared access ssh --service-token-*).

[access]
owner_policy = "f3931268-9a0c-417c-b133-807ec2ca93e8" # mig-owner-only (contact@aphrody.com)

# One token per host, secret only on that host (CF_ACCESS_CLIENT_ID/SECRET in /etc/aphrody/secrets.env); an app lists the

# tokens it accepts. fr2 -> prd ssh uses fleet-agents-fr2, prd -> fr2 uses fleet-agents-prd. Admin UIs: owner only.

service_tokens = [
{ name = "fleet-agents-fr2", host = "fr2" },
{ name = "fleet-agents-prd", host = "prd" },
]
retire_tokens = ["fleet-agents"] # shared bidirectional token (Gemini review 2026-11-13)
apps = [
{ name = "fr2-ssh", type = "ssh", domain = "ssh-fr2.aphrody.com", tokens = [
"fleet-agents-prd",
] },
{ name = "prd-ssh", type = "ssh", domain = "ssh-prd.aphrody.com", tokens = [
"fleet-agents-fr2",
] },

# 502 before the migration, now served by prd: owner-only until the app has its own auth.

{ name = "aphrody-admin", type = "self_hosted", domain = "admin.aphrody.com" },
{ name = "aphrody-control", type = "self_hosted", domain = "control.aphrody.com" },
{ name = "aphrody-console", type = "self_hosted", domain = "console.aphrody.com" },

# aphrody.app dashboard (packages/deploy): owner only, the Worker re-verifies the JWT (ACCESS_AUD in its wrangler.toml).

{ name = "aphrody-app-dashboard", type = "self_hosted", domain = "aphrody.app/dashboard" },
]

# Mail of aphrody.com. Inbound today: OVH MX Plan (mailbox contact@aphrody.com). Email Routing forwards the public

# addresses to the owner's private mailbox, named only by an env/vault key (never written here: anonymous identity,

# docs/IDENTITY.md). `enabled = false`: rules are kept in place but Cloudflare MX are not installed, OVH keeps

# receiving; flipping it to true replaces the OVH MX with Cloudflare's (owner decision, destination verified first).

# bun infra/cloudflare/cf.ts plan email | apply email

[email_routing."aphrody.com"]
enabled = false
destination_env = "APHRODY_OWNER_GOOGLE_ACCOUNT"
addresses = ["contact", "security", "noreply"]

# Outbound: Resend (DKIM resend._domainkey, return path send._) and OVH (DKIM ovhmo-selector-_). Read-only check

# (plan and apply report a missing or changed record, never write it: keys come from the provider). Content = prefix.

[[mail."aphrody.com"]]
type = "TXT"
name = "aphrody.com"
content = "v=spf1 include:mx.ovh.com include:_spf.google.com include:resend.com"
[[mail."aphrody.com"]]
type = "TXT"
name = "_dmarc.aphrody.com"
content = "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@aphrody.com"
[[mail."aphrody.com"]]
type = "TXT"
name = "resend._domainkey.aphrody.com"
content = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDYpYTrAwdzYxp"
[[mail."aphrody.com"]]
type = "CNAME"
name = "send.aphrody.com"
content = "send.forge.rmta.net"
[[mail."aphrody.com"]]
type = "CNAME"
name = "ovhmo-selector-1._domainkey.aphrody.com"
content = "ovhmo-selector-1._domainkey.4861041.dp.dkim.mail.ovh.net"

================================================
FILE: cloudflare/expected-status.json
================================================

// [OUTLINE - 147 symbols, 188 lines]
// L2: "admin.aphrody.com": 302
// L3: "ai.aphrody.com": 200
// L4: "aphrody.app": 200
// L5: "aphrody.com": 200
// L6-L9: "api.aphrody.app":
// L7: "status": 302
// L8: "why": "API d'aphrody.app (Worker aphrody-deploy) ; / redirige vers /api/projects"
// L10: "api.aphrody.com": 200
// L11-L14: "app-audio.aphrody.app":
// L12: "status": 404
// L13: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L15-L18: "app-cad.aphrody.app":
// L16: "status": 404
// L17: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L19-L22: "app-compositing.aphrody.app":
// L20: "status": 404
// L21: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L23-L26: "app-documents.aphrody.app":
// L24: "status": 404
// L25: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L27-L30: "app-generation.aphrody.app":
// L28: "status": 404
// L29: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L31-L34: "app-images.aphrody.app":
// L32: "status": 404
// L33: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L35-L38: "app-interface-layouts.aphrody.app":
// L36: "status": 404
// L37: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L39-L42: "app-layout.aphrody.app":
// L40: "status": 404
// L41: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L43-L46: "app-pdf.aphrody.app":
// L44: "status": 404
// L45: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L47-L50: "app-photo-processing.aphrody.app":
// L48: "status": 404
// L49: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L51-L54: "app-slides.aphrody.app":
// L52: "status": 404
// L53: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L55-L58: "app-tables.aphrody.app":
// L56: "status": 404
// L57: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L59-L62: "app-vectors.aphrody.app":
// L60: "status": 404
// L61: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L63-L66: "app-video.aphrody.app":
// L64: "status": 404
// L65: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L67-L70: "art.aphrody.com":
// L68: "status": 404
// L69: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L71-L74: "auth.aphrody.app":
// L72: "status": 404
// L73: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L75: "auth.aphrody.com": 200
// L76: "bot.aphrody.com": 200
// L77: "bxc.aphrody.com": 200
// L78-L81: "cad.aphrody.com":
// L79: "status": 404
// L80: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L82-L85: "calendar.aphrody.com":
// L83: "status": 404
// L84: "why": "404 du Worker ou du conteneur (pas de page racine)"
// L86: "cdn.aphrody.com": 200
// L87: "chat.aphrody.com": 200
// L88: "console.aphrody.com": 302
// L89: "control.aphrody.com": 302
// L90-L93: "craft.aphrody.app":
// L91: "status": 404
// L92: "why": "aucun backend sur ce nom : ingress *.aphrody.app -> http_status:404 (la plateforme est le Worker aphrody-deploy, packages/deploy)"
// L94: "creator.aphrody.com": 200
// L95: "dbfr.aphrody.com": 200
// L96-L99: "deploy.aphrody.app":
// L97: "status": 302
// L98: "why": "redirection vers https://aphrody.app/dashboard (Worker aphrody-deploy)"
// L100-L103: "design.aphrody.com":
// L101: "status": 404
// L102: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L104-L107: "docs.aphrody.com":
// L105: "status": 404
// L106: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L108-L111: "downloads.aphrody.com":
// L109: "status": 404
// L110: "why": "404 du Worker ou du conteneur (pas de page racine)"
// L112: "drive.aphrody.com": 200
// L113-L116: "fig.aphrody.com":
// L114: "status": 404
// L115: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L117-L120: "git.aphrody.app":
// L118: "status": 302
// L119: "why": "redirection vers https://github.com/aphrody-labs/src (Worker aphrody-deploy)"
// L121-L124: "https://aphrody.com/api/health":
// L122: "status": 503
// L123: "why": "/api rendu par le Worker aphrody (pas d appel origine)"
// L125: "inacord.aphrody.com": 200
// L126: "mail.aphrody.com": 200
// L127-L130: "maps.aphrody.com":
// L128: "status": 404
// L129: "why": "404 du Worker ou du conteneur (pas de page racine)"
// L131: "mcp.aphrody.com": 200
// L132: "meet.aphrody.com": 200
// L133: "mig-commons.aphrody.com": 302
// L134: "mig-depot.aphrody.com": 302
// L135: "mig-test.aphrody.com": 200
// L136: "n2b.aphrody.com": 200
// L137: "nie.aphrody.com": 200
// L138-L141: "os.aphrody.com":
// L139: "status": 404
// L140: "why": "404 du Worker ou du conteneur (pas de page racine)"
// L142-L145: "pdf.aphrody.com":
// L143: "status": 404
// L144: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L146-L149: "photos.aphrody.com":
// L147: "status": 404
// L148: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L150-L153: "play.aphrody.app":
// L151: "status": 404
// L152: "why": "404 du Worker ou du conteneur (pas de page racine)"
// L154-L157: "play.aphrody.com":
// L155: "status": 404
// L156: "why": "404 du Worker ou du conteneur (pas de page racine)"
// L158: "search.aphrody.com": 200
// L159-L162: "sheets.aphrody.com":
// L160: "status": 404
// L161: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L163-L166: "slides.aphrody.com":
// L164: "status": 404
// L165: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L167-L170: "sound.aphrody.com":
// L168: "status": 404
// L169: "why": "route du Worker aphrody-webos, qui répond désormais 404 (502 avant le déploiement du 2026-11-13 vers 04:15) ; relu le 2026-11-13"
// L171-L174: "source.aphrody.app":
// L172: "status": 302
// L173: "why": "redirection vers https://github.com/aphrody-labs/src (Worker aphrody-deploy)"
// L175: "ssh-fr2.aphrody.com": 302
// L176: "ssh-prd.aphrody.com": 302
// L177: "status.aphrody.com": 200
// L178: "store.aphrody.com": 200
// L179: "translate.aphrody.com": 200
// L180-L183: "www.aphrody.app":
// L181: "status": 301
// L182: "why": "redirection www -> apex (Location https://aphrody.app/), constatée et relue le 2026-11-13"
// L184-L187: "www.aphrody.com":
// L185: "status": 301
// L186: "why": "redirection vers l'apex aphrody.com (Worker aphrody, apps/aphrody/edge)"

================================================
FILE: cloudflare/fleet-token.ts
================================================

// [OUTLINE - 1 symbols, 112 lines]
// import ./lib
// L18-L41: async function cf<T = any>(

================================================
FILE: cloudflare/lib.ts
================================================

// [OUTLINE - 10 symbols, 130 lines]
// import node:path
// L4: type Ingress =
// L5: type Tunnel =
// L6-L11: type Rec =
// L12-L26: type Rule =
// L27-L44: type Cfg =
// L54-L65: async function oauthToken(): Promise<string>
// L67-L88: async function auth(): Promise<string>
// L90-L109: async function api<T = any>(
// L111-L119: async function tunnelId(name: string): Promise<string>
// L121-L130: async function expand(content: string, strict = true): Promise<string>

================================================
FILE: cloudflare/proof.ts
================================================

// [OUTLINE - 6 symbols, 803 lines]
// import node:tls
// import node:path
// import ./lib.ts
// L30: type Row =
// L35-L56: async function doh(name: string, type = "A"): Promise<string[]>
// L57-L70: function issuer(host: string): Promise<string>
// L71-L80: async function head(url: string, init: RequestInit =
// L81-L95: function tcpOpen(ip: string, port: number): Promise<boolean>
// L88: data()

================================================
FILE: cloudflare/recon.ts
================================================

// [OUTLINE - 0 symbols, 105 lines]
// import node:path
// import node:fs
// import ./lib

================================================
FILE: cloudflare/ssh-ca.ts
================================================

// [OUTLINE - 0 symbols, 84 lines]
// import ./lib

================================================
FILE: cloudflare/tunnel-token.ts
================================================

// [OUTLINE - 0 symbols, 15 lines]
// import ./lib.ts

================================================
FILE: cloudflare/workers/aphrody-email-worker/index.js
================================================

// [OUTLINE - 2 symbols, 68 lines]
// L3-L37: async email(message, env, ctx)
// L38-L63: async fetch(req, env, ctx)

================================================
FILE: cloudflare/workers/aphrody-email-worker/index.js.map
================================================

{"version":3,"file":"index.js","sources":["src\\index.ts"],"sourcesContent":["/**\n * Aphrody Cloudflare Edge Email Worker (2026 Edition)\n * Inbound Email Handler \u0026 Forwarding Relay.\n * Logs all inbound communications to Cloudflare D1 aphrody-app and forwards to verified destination.\n */\n\nexport interface Env {\n DB?: any;\n CACHE?: any;\n FORWARD_DESTINATION?: string;\n}\n\nexport default {\n async email(message: any, env: Env, ctx: any): Promise\u003cvoid\u003e {\n const id = `in_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;\n const from = message.from || \"unknown\";\n const to = message.to || \"unknown\";\n const subject = message.headers?.get(\"subject\") || \"(No Subject)\";\n const messageId = message.headers?.get(\"message-id\") || id;\n const spfStatus = message.headers?.get(\"received-spf\") || \"unknown\";\n const dkimStatus = message.headers?.get(\"dkim-signature\") ? \"signed\" : \"unsigned\";\n\n // 1. Persist inbound event to Cloudflare D1\n if (env.DB) {\n try {\n await env.DB.prepare(\n \"INSERT INTO inbound_emails (id, messageId, fromAddress, toAddress, subject, spfStatus, dkimStatus, rawHeaders, bodySnippet, receivedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\"\n )\n .bind(\n id,\n messageId,\n from,\n to,\n subject,\n spfStatus,\n dkimStatus,\n \"\",\n \"\",\n Date.now()\n )\n .run();\n } catch (err) {\n console.error(\"Failed to insert inbound email into D1:\", err);\n }\n }\n\n // 2. Forward to destination (e.g. contact@aphrody.com)\n const destination = env.FORWARD_DESTINATION || \"contact@aphrody.com\";\n try {\n await message.forward(destination);\n } catch (fwdErr) {\n console.error(`Failed to forward email to ${destination}:`, fwdErr);\n }\n },\n\n async fetch(req: Request, env: Env, ctx: any): Promise\u003cResponse\u003e {\n const url = new URL(req.url);\n\n if (url.pathname === \"/health\") {\n return Response.json({\n status: \"healthy\",\n worker: \"aphrody-email-worker\",\n edge: \"cloudflare\",\n d1_connected: !!env.DB,\n time: new Date().toISOString(),\n });\n }\n\n if (url.pathname === \"/api/inbound/latest\" \u0026\u0026 env.DB) {\n try {\n const rows = await env.DB.prepare(\n \"SELECT * FROM inbound_emails ORDER BY receivedAt DESC LIMIT 20\"\n ).all();\n return Response.json({ emails: rows.results });\n } catch (err: any) {\n return Response.json({ error: err.message }, { status: 500 });\n }\n }\n\n return new Response(\"Aphrody Cloudflare Edge Email Worker (2026)\", {\n status: 200,\n headers: { \"Content-Type\": \"text/plain\" },\n });\n },\n};\n"],"names":[],"mappings":";AAYA,IAAO,gBAAQ;AAAA,EACb,MAAM,MAAM,SAAc,KAAU,KAAyB;AAC3D,UAAM,KAAK,MAAM,KAAK,IAAI,CAAC,IAAI,KAAK,OAAO,EAAE,SAAS,EAAE,EAAE,UAAU,GAAG,CAAC,CAAC;AACzE,UAAM,OAAO,QAAQ,QAAQ;AAC7B,UAAM,KAAK,QAAQ,MAAM;AACzB,UAAM,UAAU,QAAQ,SAAS,IAAI,SAAS,KAAK;AACnD,UAAM,YAAY,QAAQ,SAAS,IAAI,YAAY,KAAK;AACxD,UAAM,YAAY,QAAQ,SAAS,IAAI,cAAc,KAAK;AAC1D,UAAM,aAAa,QAAQ,SAAS,IAAI,gBAAgB,IAAI,WAAW;AAGvE,QAAI,IAAI,IAAI;AACV,UAAI;AACF,cAAM,IAAI,GAAG;AAAA,UACX;AAAA,QACF,EACG;AAAA,UACC;AAAA,UACA;AAAA,UACA;AAAA,UACA;AAAA,UACA;AAAA,UACA;AAAA,UACA;AAAA,UACA;AAAA,UACA;AAAA,UACA,KAAK,IAAI;AAAA,QACX,EACC,IAAI;AAAA,MACT,SAAS,KAAK;AACZ,gBAAQ,MAAM,2CAA2C,GAAG;AAAA,MAC9D;AAAA,IACF;AAGA,UAAM,cAAc,IAAI,uBAAuB;AAC/C,QAAI;AACF,YAAM,QAAQ,QAAQ,WAAW;AAAA,IACnC,SAAS,QAAQ;AACf,cAAQ,MAAM,8BAA8B,WAAW,KAAK,MAAM;AAAA,IACpE;AAAA,EACF;AAAA,EAEA,MAAM,MAAM,KAAc,KAAU,KAA6B;AAC/D,UAAM,MAAM,IAAI,IAAI,IAAI,GAAG;AAE3B,QAAI,IAAI,aAAa,WAAW;AAC9B,aAAO,SAAS,KAAK;AAAA,QACnB,QAAQ;AAAA,QACR,QAAQ;AAAA,QACR,MAAM;AAAA,QACN,cAAc,CAAC,CAAC,IAAI;AAAA,QACpB,OAAM,oBAAI,KAAK,GAAE,YAAY;AAAA,MAC/B,CAAC;AAAA,IACH;AAEA,QAAI,IAAI,aAAa,yBAAyB,IAAI,IAAI;AACpD,UAAI;AACF,cAAM,OAAO,MAAM,IAAI,GAAG;AAAA,UACxB;AAAA,QACF,EAAE,IAAI;AACN,eAAO,SAAS,KAAK,EAAE,QAAQ,KAAK,QAAQ,CAAC;AAAA,MAC/C,SAAS,KAAU;AACjB,eAAO,SAAS,KAAK,EAAE,OAAO,IAAI,QAAQ,GAAG,EAAE,QAAQ,IAAI,CAAC;AAAA,MAC9D;AAAA,IACF;AAEA,WAAO,IAAI,SAAS,+CAA+C;AAAA,MACjE,QAAQ;AAAA,MACR,SAAS,EAAE,gBAAgB,aAAa;AAAA,IAC1C,CAAC;AAAA,EACH;AACF;"}

================================================
FILE: cloudflare/workers/aphrody-email-worker/wrangler.jsonc
================================================

// [OUTLINE - 15 symbols, 9 lines]
// L2: "name": "aphrody-email-worker"
// L3: "main": "index.js"
// L4: "compatibility_date": "2026-11-01"
// L5: "compatibility_flags": ["nodejs_compat"]
// L6: "kv_namespaces": [
// L6: "binding": "CACHE"
// L6: "id": "ab11db38b3ea4ea190fac14bf2ee6739"
// L7: "d1_databases": [
// L7: "binding": "DB"
// L7: "database_name": "aphrody-app"
// L7: "database_id": "6875cbdc-449d-45fc-a01e-1c0c98e2c4df"
// L8: "vars":
// L8: "DOMAIN": "aphrody.app"
// L8: "ENVIRONMENT": "production"
// L8: "FORWARD_DESTINATION": "contact@aphrody.com"

================================================
FILE: cloudflare/workers/aphrody-webos/index.js
================================================

// [OUTLINE - 3 symbols, 249 lines]
// L64-L81: async function serveIso(request, env)
// L83-L143: function handleConsole(url)
// L146-L248: async fetch(request, env)

================================================
FILE: cloudflare/workers/aphrody-webos/wrangler.jsonc
================================================

// [OUTLINE - 10 symbols, 11 lines]
// L3: "name": "aphrody-webos"
// L4: "main": "index.js"
// L5: "compatibility_date": "2026-10-11"
// L6: "compatibility_flags": ["nodejs_compat"]
// L7: "services": [
// L7: "binding": "LEGACY"
// L7: "service": "aphrody-app"
// L8: "r2_buckets": [
// L8: "binding": "VM"
// L8: "bucket_name": "aphrody-assets"

================================================
FILE: cloudflare/workers/api-gateway/api.aphrody.com.toml
================================================

# Worker "api-aphrody-com" (script = ./worker.js). Deployed via Cloudflare API (MCP), no secrets.

name = "api-aphrody-com"
main = "worker.js"
compatibility_date = "2026-11-01"
routes = [{ pattern = "api.aphrody.com", custom_domain = true }]
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "aphrody-dist"
[vars]
CATALOGUE = "sites/api.aphrody.com/v1/openapi"
DOWNLOADS = "aphrody"

================================================
FILE: cloudflare/workers/api-gateway/selfhost.ts
================================================

// [OUTLINE - 4 symbols, 78 lines]
// import node:path
// L9-L13: type Cfg =
// L21-L60: function r2(bucket: string)
// L28-L58: async get(key: string, o:
// L67: passThroughOnException()

================================================
FILE: cloudflare/workers/api-gateway/worker.js
================================================

// [OUTLINE - 2 symbols, 110 lines]
// L28-L54: async function serve(env, key, req, type)
// L56-L109: async fetch(req, env)

================================================
FILE: cloudflare/workers/bun-video-showcase/worker.js
================================================

// [OUTLINE - 8 symbols, 198 lines]
// L20-L22: function isBunVideoPath(path)
// L24-L29: function unavailable()
// L31-L36: function accessDenied()
// L38-L40: function isPublicBunVideoPath(method, path)
// L42-L48: function decodeBase64Url(value)
// L50-L61: async function accessJwks(issuer, fetchBackend)
// L63-L107: async function verifyAccessIdentity(request, env, fetchBackend)
// L109-L191: async function serveShowcase(request, env, fetchBackend = fetch)

================================================
FILE: cloudflare/workers/bun-video-showcase/wrangler.jsonc
================================================

// [OUTLINE - 12 symbols, 9 lines]
// L2: "name": "bun-video-showcase"
// L3: "main": "worker.js"
// L4: "compatibility_date": "2026-10-20"
// L5: "compatibility_flags": ["nodejs_compat"]
// L6: "r2_buckets": [
// L6: "binding": "SHOWCASE"
// L6: "bucket_name": "aphrody-video"
// L7: "vars":
// L7: "SHOWCASE_PREFIX": "showcase/20261022-v3"
// L8: "routes": [
// L8: "pattern": "video.aphrody.com/*"
// L8: "zone_name": "aphrody.com"

================================================
FILE: cloudflare/workers/creator-aphrody-com/worker.js
================================================

// [OUTLINE - 2 symbols, 25 lines]
// L2: async function fetchKey(env, key, req)
// L4-L24: async fetch(req, env)

================================================
FILE: cloudflare/workers/creator-aphrody-com/wrangler.jsonc
================================================

// [OUTLINE - 10 symbols, 7 lines]
// L2: "name": "creator-aphrody-com"
// L3: "main": "worker.js"
// L4: "compatibility_date": "2026-11-01"
// L5: "r2_buckets": [
// L5: "binding": "BUCKET"
// L5: "bucket_name": "aphrody-dist"
// L6: "vars":
// L6: "PREFIX": "sites/creator.aphrody.com"
// L6: "SERVICE": "aphrody-creator"
// L6: "SPA": "1"

================================================
FILE: cloudflare/workers/github-app/cloudflare.config.ts
================================================

// [OUTLINE - 0 symbols, 20 lines]
// import cf/config
// import ./src/index.ts
// import ./src/index.ts

================================================
FILE: cloudflare/workers/github-app/src/index.test.ts
================================================

// [OUTLINE - 0 symbols, 158 lines]
// import bun:test
// import ./index.ts

================================================
FILE: cloudflare/workers/github-app/tsconfig.json
================================================

// [OUTLINE - 9 symbols, 12 lines]
// L2-L10: "compilerOptions":
// L3: "target": "ES2024"
// L4: "module": "ESNext"
// L5: "moduleResolution": "Bundler"
// L6: "strict": true
// L7: "noEmit": true
// L8: "allowImportingTsExtensions": true
// L9: "types": ["@cloudflare/workers-types"]
// L11: "include": ["src", "cloudflare.config.ts", "vite.config.ts"]

================================================
FILE: cloudflare/workers/github-app/vite.config.ts
================================================

// [OUTLINE - 0 symbols, 5 lines]
// import @cloudflare/vite-plugin
// import vite

================================================
FILE: cloudflare/workers/rosegriffon-maintenance/worker.js
================================================

// [OUTLINE - 1 symbols, 26 lines]
// L3-L21: async fetch(request, env)

================================================
FILE: cloudflare/workers/rosegriffon-maintenance/wrangler.jsonc
================================================

// [OUTLINE - 5 symbols, 6 lines]
// L2: "name": "rosegriffon-maintenance"
// L3: "main": "worker.js"
// L4: "compatibility_date": "2026-10-12"
// L5: "assets":
// L5: "binding": "ASSETS"

================================================
FILE: cloudflare/workers/shenron-cdn/worker.mjs
================================================

// [OUTLINE - 12 symbols, 330 lines]
// L6-L70: async function bootstrapManifest(key, env, fetchOrigin)
// L71-L75: async function manifestKey(path, prefix = "_migration/manifests/")
// L76-L89: function publicPath(url)
// L90-L95: function validEntry(entry)
// L96-L109: function responseHeaders(entry)
// L110-L121: function imageSource(value)
// L122-L210: async function dynamicRoute(request, env, fetchOrigin)
// L211-L213: function failure(status)
// L214-L216: function verified(object, entry)
// L217-L233: function byteRange(header, size)
// L234-L319: async function handleCdn(request, env, fetchOrigin = fetch)
// L321-L323: fetch(request, env)

================================================
FILE: cloudflare/workers/shenron-cdn/wrangler.jsonc
================================================

// [OUTLINE - 12 symbols, 9 lines]
// L2: "name": "shenron-cdn"
// L3: "main": "worker.mjs"
// L4: "compatibility_date": "2026-10-11"
// L5: "r2_buckets": [
// L5: "binding": "CDN"
// L5: "bucket_name": "shenron-cdn"
// L6: "vars":
// L6: "IMPORT_ENABLED": "false"
// L6: "VERIFY_UPLOADS": "false"
// L8: "routes": [
// L8: "pattern": "cdn.dragonballfr.com/*"
// L8: "zone_name": "dragonballfr.com"

================================================
FILE: cluster/cluster.just
================================================

# Cluster layer (docs/infra/CLUSTER.md): LB + failover + dedup across fr1/fr2/prd, generated from infra/deploy.toml.

# Regenerate infra/cluster/generated/* from infra/deploy.toml [cluster]

cluster-gen:
bun "{{root}}/infra/cluster/gen.ts"

# Push + validate + reload one member (rollback: just cluster-down <member>)

cluster-deploy member: cluster-gen
bash "{{root}}/infra/cluster/deploy.sh" {{member}}

# Stop the cluster data plane on one member (HAProxy off, nginx shard conf removed)

cluster-down member:
bash "{{root}}/infra/cluster/deploy.sh" {{member}} down

# Issue/renew a member certificate (CA key stays in ~/.local/share/aphrody/cluster-ca)

cluster-pki member:
bash "{{root}}/infra/cluster/pki.sh" {{member}}

# Health, mesh matrix vs WireGuard, kill-test, coalescing, idempotency, dedup ratio

cluster-proof:
bash "{{root}}/infra/cluster/proof.sh"

================================================
FILE: cluster/compose.capped.yaml
================================================

# Override for low-priority members (fr1): edge replicas inside aphrody-cluster.slice (CPUQuota/MemoryMax from

# deploy.toml [cluster.members.fr1].slice), so Chromium/LLVM builds keep priority.

# docker compose -f compose.yaml -f compose.capped.yaml --profile edge up -d (rollback: ... --profile edge down)

services:
downloads:
{
cgroup_parent: aphrody-cluster.slice,
cpu_shares: 128,
deploy: { resources: { limits: { cpus: "1.0", memory: 1g } } },
}
cdn:
{
cgroup_parent: aphrody-cluster.slice,
cpu_shares: 128,
deploy: { resources: { limits: { cpus: "1.0", memory: 1g } } },
}
api-gateway:
{
cgroup_parent: aphrody-cluster.slice,
cpu_shares: 128,
deploy: { resources: { limits: { cpus: "1.0", memory: 1g } } },
}

# aphrody standby (deploy.toml [cluster.services.aphrody] standby): HAProxy backup, serves only while prd is down.

aphrody:
{
cgroup_parent: aphrody-cluster.slice,
cpu_shares: 128,
deploy: { resources: { limits: { cpus: "1.0", memory: 1g } } },
}

================================================
FILE: cluster/dedup.ts
================================================

// [OUTLINE - 0 symbols, 77 lines]

================================================
FILE: cluster/deploy.sh
================================================

// [OUTLINE - 1 symbols, 50 lines]
// L7: run()

================================================
FILE: cluster/gen.ts
================================================

// [OUTLINE - 10 symbols, 336 lines]
// import node:fs
// import node:path
// L6: type Check =
// L7-L16: type Svc =
// L17-L22: type Member =
// L23-L33: type Cluster =
// L50-L63: function addrs(s: Svc, m: string): string[]
// L78-L180: function haproxy(self: string): string
// L182-L267: function nginx(self: string): string
// L269-L277: function slice(self: string): string
// L281-L301: function sshConfig(): string
// L303-L317: function sshMesh(): string

================================================
FILE: cluster/generated/fr1/aphrody-cluster.slice
================================================

# GENERATED by infra/cluster/gen.ts. Cluster workloads (HAProxy, edge containers) run here.

[Slice]
CPUQuota=200%
MemoryMax=6G
CPUWeight=10
IOWeight=10

================================================
FILE: cluster/generated/fr1/haproxy.cfg
================================================

# GENERATED by infra/cluster/gen.ts from infra/deploy.toml [cluster]; member fr1. Do not edit.

global
log stderr format short local0 notice
user haproxy
group haproxy
maxconn 20000
stats socket /run/aphrody-cluster/haproxy.sock mode 600 level admin
ssl-default-bind-options ssl-min-ver TLSv1.3
ssl-default-server-options ssl-min-ver TLSv1.3

defaults
log global
mode http
option dontlognull
timeout connect 3s
timeout client 120s
timeout server 120s
timeout tunnel 1h
timeout http-keep-alive 10s
timeout check 2s
retries 2
option redispatch 1
default-server inter 1000ms fastinter 500ms downinter 3s fall 2 rise 3

frontend stats
bind 127.0.0.1:19900
http-request use-service prometheus-exporter if { path /metrics }
stats enable
stats uri /stats
stats refresh 5s

# Inbound from other members: TLS 1.3, client cert signed by the cluster CA, routed by SNI.

frontend mesh_in
mode tcp
bind 51.77.147.152:7444 ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required
tcp-request content reject unless { ssl_fc_sni -m end .fr1.cluster.internal }
use_backend in_downloads if { ssl_fc_sni -i downloads.fr1.cluster.internal }
use_backend in_cdn if { ssl_fc_sni -i cdn.fr1.cluster.internal }
use_backend in_api-gateway if { ssl_fc_sni -i api-gateway.fr1.cluster.internal }
use_backend in_aphrody if { ssl_fc_sni -i aphrody.fr1.cluster.internal }
use_backend in_nativelink if { ssl_fc_sni -i nativelink.fr1.cluster.internal }
use_backend in_nativelink-cas if { ssl_fc_sni -i nativelink-cas.fr1.cluster.internal }
use_backend in_ssh if { ssl_fc_sni -i ssh.fr1.cluster.internal }
use_backend in_bench if { ssl_fc_sni -i bench.fr1.cluster.internal }

backend in_downloads
mode tcp
server local 127.0.0.1:29797

backend in_cdn
mode tcp
server local 127.0.0.1:29796

backend in_api-gateway
mode tcp
server local 127.0.0.1:29081

backend in_aphrody
mode tcp
server local 127.0.0.1:29300

backend in_nativelink
mode tcp
server local 10.200.77.1:50051 check

backend in_nativelink-cas
mode tcp
server local 10.200.77.1:50061 check

backend in_ssh
mode tcp
server local 127.0.0.1:22 check

backend in_bench
mode tcp
server local 127.0.0.1:29990 check

frontend lb_downloads
bind 127.0.0.1:19797
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_downloads

backend pool_downloads
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host downloads.aphrody.com hdr X-Cluster-Check 1
http-check expect ! rstatus ^5
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server fr1 127.0.0.1:29797 id 1 weight 20 check
server fr2 51.255.162.6:7444 id 2 weight 60 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost downloads.fr2.cluster.internal sni str(downloads.fr2.cluster.internal) check-sni downloads.fr2.cluster.internal
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost downloads.prd.cluster.internal sni str(downloads.prd.cluster.internal) check-sni downloads.prd.cluster.internal

frontend lb_cdn
bind 127.0.0.1:19796
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_cdn

backend pool_cdn
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host cdn.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server fr1 127.0.0.1:29796 id 1 weight 20 check
server fr2 51.255.162.6:7444 id 2 weight 60 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost cdn.fr2.cluster.internal sni str(cdn.fr2.cluster.internal) check-sni cdn.fr2.cluster.internal
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost cdn.prd.cluster.internal sni str(cdn.prd.cluster.internal) check-sni cdn.prd.cluster.internal

frontend lb_api-gateway
bind 127.0.0.1:19081
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_api-gateway

backend pool_api-gateway
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host api.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server fr1 127.0.0.1:29081 id 1 weight 20 check
server fr2 51.255.162.6:7444 id 2 weight 60 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost api-gateway.fr2.cluster.internal sni str(api-gateway.fr2.cluster.internal) check-sni api-gateway.fr2.cluster.internal
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost api-gateway.prd.cluster.internal sni str(api-gateway.prd.cluster.internal) check-sni api-gateway.prd.cluster.internal

frontend lb_mig-test
bind 127.0.0.1:19780
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_mig-test

backend pool_mig-test
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host mig-test.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost mig-test.prd.cluster.internal sni str(mig-test.prd.cluster.internal) check-sni mig-test.prd.cluster.internal

frontend lb_aphrody
bind 127.0.0.1:19300
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_aphrody

backend pool_aphrody
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host aphrody.com hdr X-Cluster-Check 1
http-check expect rstatus ^[23]
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
option allbackups
server fr1 127.0.0.1:29300 id 1 weight 20 backup check
server fr2 51.255.162.6:7444 id 2 weight 60 backup check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost aphrody.fr2.cluster.internal sni str(aphrody.fr2.cluster.internal) check-sni aphrody.fr2.cluster.internal
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost aphrody.prd.cluster.internal sni str(aphrody.prd.cluster.internal) check-sni aphrody.prd.cluster.internal

frontend lb_ai-os
bind 127.0.0.1:19400
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_ai-os

backend pool_ai-os
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /health ver HTTP/1.1 hdr Host ai.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost ai-os.prd.cluster.internal sni str(ai-os.prd.cluster.internal) check-sni ai-os.prd.cluster.internal

frontend lb_ssh-prd
bind 127.0.0.1:19022
mode tcp
default_backend pool_ssh-prd

backend pool_ssh-prd
mode tcp
balance roundrobin
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost ssh-prd.prd.cluster.internal sni str(ssh-prd.prd.cluster.internal) check-sni ssh-prd.prd.cluster.internal

frontend lb_depot
bind 127.0.0.1:19182
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_depot

backend pool_depot
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /health ver HTTP/1.1 hdr Host mig-depot.aphrody.com hdr X-Cluster-Check 1
http-check expect rstatus ^[24]
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost depot.prd.cluster.internal sni str(depot.prd.cluster.internal) check-sni depot.prd.cluster.internal

frontend lb_commons
bind 127.0.0.1:19766
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_commons

backend pool_commons
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /health ver HTTP/1.1 hdr Host mig-commons.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost commons.prd.cluster.internal sni str(commons.prd.cluster.internal) check-sni commons.prd.cluster.internal

frontend lb_relay
bind 127.0.0.1:19889
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_relay

backend pool_relay
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /health ver HTTP/1.1 hdr Host relay.cluster.internal hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost relay.prd.cluster.internal sni str(relay.prd.cluster.internal) check-sni relay.prd.cluster.internal

frontend lb_nativelink
bind 127.0.0.1:19051
mode tcp
default_backend pool_nativelink

backend pool_nativelink
mode tcp
balance roundrobin
server fr1 10.200.77.1:50051 id 1 weight 20 check

frontend lb_nativelink-cas
bind 127.0.0.1:19061
mode tcp
default_backend pool_nativelink-cas

backend pool_nativelink-cas
mode tcp
balance roundrobin
server fr1 10.200.77.1:50061 id 1 weight 20 check

frontend lb_bench
bind 127.0.0.1:19990
mode http
http-request set-header X-Cluster-Entry fr1
default_backend pool_bench

backend pool_bench
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /bench/health ver HTTP/1.1 hdr Host bench.cluster.internal hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server fr1 127.0.0.1:29990 id 1 weight 20 check
server fr2 51.255.162.6:7444 id 2 weight 60 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost bench.fr2.cluster.internal sni str(bench.fr2.cluster.internal) check-sni bench.fr2.cluster.internal
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost bench.prd.cluster.internal sni str(bench.prd.cluster.internal) check-sni bench.prd.cluster.internal

================================================
FILE: cluster/generated/fr1/nginx-cluster.conf
================================================

# GENERATED by infra/cluster/gen.ts from infra/deploy.toml [cluster]; member fr1. Do not edit.

# Cache shards: HAProxy hashes each URI to one member cluster-wide, so proxy_cache_lock on that member

# collapses concurrent duplicates of the whole cluster into one origin fetch.

proxy_cache_path /var/cache/nginx/aphrody-cluster levels=1:2 keys_zone=acl_cache:64m max_size=2g inactive=1h use_temp_path=off;
proxy_cache_path /var/cache/nginx/aphrody-cluster-idem levels=1:2 keys_zone=acl_idem:16m max_size=256m inactive=24h use_temp_path=off;
log_format acl_log '$time_iso8601 $server_port $request_method $host $uri $status $upstream_cache_status $request_time $http_x_cluster_entry';
map "$http_authorization$http_cookie" $acl_private { "" 0; default 1; }
map $http_x_cluster_check $acl_check { "" 0; default 1; }
map $http_x_cluster_check $acl_logit { "" 1; default 0; }
map "$request_method:$http_idempotency_key" $acl_idem { "~^POST:.+" 1; default 0; }

upstream acl_downloads { server 127.0.0.1:28797 max_fails=1 fail_timeout=3s; keepalive 16; }
server {
listen 127.0.0.1:29797;
access_log /var/log/nginx/aphrody-cluster.log acl_log if=$acl_logit;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $http_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
location / {
error_page 418 = @idem;
if ($acl_idem) { return 418; }
proxy_pass http://acl_downloads;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_cache acl_cache;
proxy_cache_key "downloads|$host$request_uri";
proxy_cache_lock on;
proxy_cache_lock_timeout 15s;
proxy_cache_lock_age 15s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_revalidate on;
proxy_cache_bypass $acl_private $acl_check;
proxy_no_cache $acl_private $acl_check;
proxy_cache_valid 200 301 302 404 1s;
add_header X-Cluster-Cache $upstream_cache_status always;
add_header X-Cluster-Shard fr1 always;
} # POST + Idempotency-Key: first response replayed for 24 h, concurrent duplicates coalesced.
location @idem {
proxy_pass http://acl_downloads;
proxy_cache acl_idem;
proxy_cache_methods POST;
proxy_cache_key "downloads|$request_method|$host$request_uri|$http_idempotency_key|$http_authorization|$http_cookie";
proxy_cache_lock on;
proxy_cache_lock_timeout 30s;
proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
proxy_cache_valid 200 201 202 204 400 401 403 404 405 409 422 24h;
add_header X-Idempotent-Replay $upstream_cache_status always;
add_header X-Cluster-Shard fr1 always;
}
}

upstream acl_cdn { server 127.0.0.1:28796 max_fails=1 fail_timeout=3s; keepalive 16; }
server {
listen 127.0.0.1:29796;
access_log /var/log/nginx/aphrody-cluster.log acl_log if=$acl_logit;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $http_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
location / {
error_page 418 = @idem;
if ($acl_idem) { return 418; }
proxy_pass http://acl_cdn;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_cache acl_cache;
proxy_cache_key "cdn|$host$request_uri";
proxy_cache_lock on;
proxy_cache_lock_timeout 15s;
proxy_cache_lock_age 15s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_revalidate on;
proxy_cache_bypass $acl_private $acl_check;
proxy_no_cache $acl_private $acl_check;
proxy_cache_valid 200 301 302 404 1s;
add_header X-Cluster-Cache $upstream_cache_status always;
add_header X-Cluster-Shard fr1 always;
} # POST + Idempotency-Key: first response replayed for 24 h, concurrent duplicates coalesced.
location @idem {
proxy_pass http://acl_cdn;
proxy_cache acl_idem;
proxy_cache_methods POST;
proxy_cache_key "cdn|$request_method|$host$request_uri|$http_idempotency_key|$http_authorization|$http_cookie";
proxy_cache_lock on;
proxy_cache_lock_timeout 30s;
proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
proxy_cache_valid 200 201 202 204 400 401 403 404 405 409 422 24h;
add_header X-Idempotent-Replay $upstream_cache_status always;
add_header X-Cluster-Shard fr1 always;
}
}

upstream acl_api-gateway { server 127.0.0.1:28081 max_fails=1 fail_timeout=3s; keepalive 16; }
server {
listen 127.0.0.1:29081;
access_log /var/log/nginx/aphrody-cluster.log acl_log if=$acl_logit;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $http_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
location / {
error_page 418 = @idem;
if ($acl_idem) { return 418; }
proxy_pass http://acl_api-gateway;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_cache acl_cache;
proxy_cache_key "api-gateway|$host$request_uri";
proxy_cache_lock on;
proxy_cache_lock_timeout 15s;
proxy_cache_lock_age 15s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_revalidate on;
proxy_cache_bypass $acl_private $acl_check;
proxy_no_cache $acl_private $acl_check;
proxy_cache_valid 200 301 302 404 1s;
add_header X-Cluster-Cache $upstream_cache_status always;
add_header X-Cluster-Shard fr1 always;
} # POST + Idempotency-Key: first response replayed for 24 h, concurrent duplicates coalesced.
location @idem {
proxy_pass http://acl_api-gateway;
proxy_cache acl_idem;
proxy_cache_methods POST;
proxy_cache_key "api-gateway|$request_method|$host$request_uri|$http_idempotency_key|$http_authorization|$http_cookie";
proxy_cache_lock on;
proxy_cache_lock_timeout 30s;
proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
proxy_cache_valid 200 201 202 204 400 401 403 404 405 409 422 24h;
add_header X-Idempotent-Replay $upstream_cache_status always;
add_header X-Cluster-Shard fr1 always;
}
}

upstream acl_aphrody { server 127.0.0.1:23000 max_fails=1 fail_timeout=3s; server 127.0.0.1:13000 backup; keepalive 16; }
server {
listen 127.0.0.1:29300;
access_log /var/log/nginx/aphrody-cluster.log acl_log if=$acl_logit;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $http_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
location / {
error_page 418 = @idem;
if ($acl_idem) { return 418; }
proxy_pass http://acl_aphrody;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_cache acl_cache;
proxy_cache_key "aphrody|$host$request_uri";
proxy_cache_lock on;
proxy_cache_lock_timeout 15s;
proxy_cache_lock_age 15s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_revalidate on;
proxy_cache_bypass $acl_private $acl_check;
proxy_no_cache $acl_private $acl_check;
add_header X-Cluster-Cache $upstream_cache_status always;
add_header X-Cluster-Shard fr1 always;
} # POST + Idempotency-Key: first response replayed for 24 h, concurrent duplicates coalesced.
location @idem {
proxy_pass http://acl_aphrody;
proxy_cache acl_idem;
proxy_cache_methods POST;
proxy_cache_key "aphrody|$request_method|$host$request_uri|$http_idempotency_key|$http_authorization|$http_cookie";
proxy_cache_lock on;
proxy_cache_lock_timeout 30s;
proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
proxy_cache_valid 200 201 202 204 400 401 403 404 405 409 422 24h;
add_header X-Idempotent-Replay $upstream_cache_status always;
add_header X-Cluster-Shard fr1 always;
}
}

server {
listen 29990; # loopback + WireGuard subnet (comparison only), no bind on the wg interface
allow 127.0.0.1;
allow 10.200.77.0/24;
deny all;
access_log off;
root /var/lib/aphrody-cluster;
location /bench/ { }
}

================================================
FILE: cluster/generated/fr2/aphrody-cluster.slice
================================================

# GENERATED by infra/cluster/gen.ts. Cluster workloads (HAProxy, edge containers) run here.

[Slice]

================================================
FILE: cluster/generated/fr2/haproxy.cfg
================================================

# GENERATED by infra/cluster/gen.ts from infra/deploy.toml [cluster]; member fr2. Do not edit.

global
log stderr format short local0 notice
user haproxy
group haproxy
maxconn 20000
stats socket /run/aphrody-cluster/haproxy.sock mode 600 level admin
ssl-default-bind-options ssl-min-ver TLSv1.3
ssl-default-server-options ssl-min-ver TLSv1.3

defaults
log global
mode http
option dontlognull
timeout connect 3s
timeout client 120s
timeout server 120s
timeout tunnel 1h
timeout http-keep-alive 10s
timeout check 2s
retries 2
option redispatch 1
default-server inter 1000ms fastinter 500ms downinter 3s fall 2 rise 3

frontend stats
bind 127.0.0.1:19900
http-request use-service prometheus-exporter if { path /metrics }
stats enable
stats uri /stats
stats refresh 5s

# Inbound from other members: TLS 1.3, client cert signed by the cluster CA, routed by SNI.

frontend mesh_in
mode tcp
bind 51.255.162.6:7444 ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required
tcp-request content reject unless { ssl_fc_sni -m end .fr2.cluster.internal }
use_backend in_downloads if { ssl_fc_sni -i downloads.fr2.cluster.internal }
use_backend in_cdn if { ssl_fc_sni -i cdn.fr2.cluster.internal }
use_backend in_api-gateway if { ssl_fc_sni -i api-gateway.fr2.cluster.internal }
use_backend in_aphrody if { ssl_fc_sni -i aphrody.fr2.cluster.internal }
use_backend in_ssh if { ssl_fc_sni -i ssh.fr2.cluster.internal }
use_backend in_bench if { ssl_fc_sni -i bench.fr2.cluster.internal }

backend in_downloads
mode tcp
server local 127.0.0.1:29797

backend in_cdn
mode tcp
server local 127.0.0.1:29796

backend in_api-gateway
mode tcp
server local 127.0.0.1:29081

backend in_aphrody
mode tcp
server local 127.0.0.1:29300

backend in_ssh
mode tcp
server local 127.0.0.1:22 check

backend in_bench
mode tcp
server local 127.0.0.1:29990 check

frontend lb_downloads
bind 127.0.0.1:19797
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_downloads

backend pool_downloads
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host downloads.aphrody.com hdr X-Cluster-Check 1
http-check expect ! rstatus ^5
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server fr1 51.77.147.152:7444 id 1 weight 20 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost downloads.fr1.cluster.internal sni str(downloads.fr1.cluster.internal) check-sni downloads.fr1.cluster.internal
server fr2 127.0.0.1:29797 id 2 weight 60 check
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost downloads.prd.cluster.internal sni str(downloads.prd.cluster.internal) check-sni downloads.prd.cluster.internal

frontend lb_cdn
bind 127.0.0.1:19796
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_cdn

backend pool_cdn
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host cdn.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server fr1 51.77.147.152:7444 id 1 weight 20 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost cdn.fr1.cluster.internal sni str(cdn.fr1.cluster.internal) check-sni cdn.fr1.cluster.internal
server fr2 127.0.0.1:29796 id 2 weight 60 check
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost cdn.prd.cluster.internal sni str(cdn.prd.cluster.internal) check-sni cdn.prd.cluster.internal

frontend lb_api-gateway
bind 127.0.0.1:19081
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_api-gateway

backend pool_api-gateway
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host api.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server fr1 51.77.147.152:7444 id 1 weight 20 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost api-gateway.fr1.cluster.internal sni str(api-gateway.fr1.cluster.internal) check-sni api-gateway.fr1.cluster.internal
server fr2 127.0.0.1:29081 id 2 weight 60 check
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost api-gateway.prd.cluster.internal sni str(api-gateway.prd.cluster.internal) check-sni api-gateway.prd.cluster.internal

frontend lb_mig-test
bind 127.0.0.1:19780
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_mig-test

backend pool_mig-test
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host mig-test.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost mig-test.prd.cluster.internal sni str(mig-test.prd.cluster.internal) check-sni mig-test.prd.cluster.internal

frontend lb_aphrody
bind 127.0.0.1:19300
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_aphrody

backend pool_aphrody
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri / ver HTTP/1.1 hdr Host aphrody.com hdr X-Cluster-Check 1
http-check expect rstatus ^[23]
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
option allbackups
server fr1 51.77.147.152:7444 id 1 weight 20 backup check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost aphrody.fr1.cluster.internal sni str(aphrody.fr1.cluster.internal) check-sni aphrody.fr1.cluster.internal
server fr2 127.0.0.1:29300 id 2 weight 60 backup check
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost aphrody.prd.cluster.internal sni str(aphrody.prd.cluster.internal) check-sni aphrody.prd.cluster.internal

frontend lb_ai-os
bind 127.0.0.1:19400
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_ai-os

backend pool_ai-os
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /health ver HTTP/1.1 hdr Host ai.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost ai-os.prd.cluster.internal sni str(ai-os.prd.cluster.internal) check-sni ai-os.prd.cluster.internal

frontend lb_ssh-prd
bind 127.0.0.1:19022
mode tcp
default_backend pool_ssh-prd

backend pool_ssh-prd
mode tcp
balance roundrobin
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost ssh-prd.prd.cluster.internal sni str(ssh-prd.prd.cluster.internal) check-sni ssh-prd.prd.cluster.internal

frontend lb_depot
bind 127.0.0.1:19182
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_depot

backend pool_depot
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /health ver HTTP/1.1 hdr Host mig-depot.aphrody.com hdr X-Cluster-Check 1
http-check expect rstatus ^[24]
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost depot.prd.cluster.internal sni str(depot.prd.cluster.internal) check-sni depot.prd.cluster.internal

frontend lb_commons
bind 127.0.0.1:19766
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_commons

backend pool_commons
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /health ver HTTP/1.1 hdr Host mig-commons.aphrody.com hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost commons.prd.cluster.internal sni str(commons.prd.cluster.internal) check-sni commons.prd.cluster.internal

frontend lb_relay
bind 127.0.0.1:19889
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_relay

backend pool_relay
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /health ver HTTP/1.1 hdr Host relay.cluster.internal hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost relay.prd.cluster.internal sni str(relay.prd.cluster.internal) check-sni relay.prd.cluster.internal

frontend lb_nativelink
bind 127.0.0.1:19051
mode tcp
default_backend pool_nativelink

backend pool_nativelink
mode tcp
balance roundrobin
server fr1 51.77.147.152:7444 id 1 weight 20 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost nativelink.fr1.cluster.internal sni str(nativelink.fr1.cluster.internal) check-sni nativelink.fr1.cluster.internal

frontend lb_nativelink-cas
bind 127.0.0.1:19061
mode tcp
default_backend pool_nativelink-cas

backend pool_nativelink-cas
mode tcp
balance roundrobin
server fr1 51.77.147.152:7444 id 1 weight 20 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost nativelink-cas.fr1.cluster.internal sni str(nativelink-cas.fr1.cluster.internal) check-sni nativelink-cas.fr1.cluster.internal

frontend lb_bench
bind 127.0.0.1:19990
mode http
http-request set-header X-Cluster-Entry fr2
default_backend pool_bench

backend pool_bench
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth GET uri /bench/health ver HTTP/1.1 hdr Host bench.cluster.internal hdr X-Cluster-Check 1
http-check expect status 200
retry-on conn-failure empty-response response-timeout 500 502 503 504
http-request disable-l7-retry if !METH_GET !METH_HEAD
server fr1 51.77.147.152:7444 id 1 weight 20 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost bench.fr1.cluster.internal sni str(bench.fr1.cluster.internal) check-sni bench.fr1.cluster.internal
server fr2 127.0.0.1:29990 id 2 weight 60 check
server prd 72.60.186.43:7444 id 3 weight 100 check ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required verifyhost bench.prd.cluster.internal sni str(bench.prd.cluster.internal) check-sni bench.prd.cluster.internal

================================================
FILE: cluster/generated/fr2/nginx-cluster.conf
================================================

# GENERATED by infra/cluster/gen.ts from infra/deploy.toml [cluster]; member fr2. Do not edit.

# Cache shards: HAProxy hashes each URI to one member cluster-wide, so proxy_cache_lock on that member

# collapses concurrent duplicates of the whole cluster into one origin fetch.

proxy_cache_path /var/cache/nginx/aphrody-cluster levels=1:2 keys_zone=acl_cache:64m max_size=2g inactive=1h use_temp_path=off;
proxy_cache_path /var/cache/nginx/aphrody-cluster-idem levels=1:2 keys_zone=acl_idem:16m max_size=256m inactive=24h use_temp_path=off;
log_format acl_log '$time_iso8601 $server_port $request_method $host $uri $status $upstream_cache_status $request_time $http_x_cluster_entry';
map "$http_authorization$http_cookie" $acl_private { "" 0; default 1; }
map $http_x_cluster_check $acl_check { "" 0; default 1; }
map $http_x_cluster_check $acl_logit { "" 1; default 0; }
map "$request_method:$http_idempotency_key" $acl_idem { "~^POST:.+" 1; default 0; }

upstream acl_downloads { server 127.0.0.1:28797 max_fails=1 fail_timeout=3s; keepalive 16; }
server {
listen 127.0.0.1:29797;
access_log /var/log/nginx/aphrody-cluster.log acl_log if=$acl_logit;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $http_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
location / {
error_page 418 = @idem;
if ($acl_idem) { return 418; }
proxy_pass http://acl_downloads;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_cache acl_cache;
proxy_cache_key "downloads|$host$request_uri";
proxy_cache_lock on;
proxy_cache_lock_timeout 15s;
proxy_cache_lock_age 15s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_revalidate on;
proxy_cache_bypass $acl_private $acl_check;
proxy_no_cache $acl_private $acl_check;
proxy_cache_valid 200 301 302 404 1s;
add_header X-Cluster-Cache $upstream_cache_status always;
add_header X-Cluster-Shard fr2 always;
} # POST + Idempotency-Key: first response replayed for 24 h, concurrent duplicates coalesced.
location @idem {
proxy_pass http://acl_downloads;
proxy_cache acl_idem;
proxy_cache_methods POST;
proxy_cache_key "downloads|$request_method|$host$request_uri|$http_idempotency_key|$http_authorization|$http_cookie";
proxy_cache_lock on;
proxy_cache_lock_timeout 30s;
proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
proxy_cache_valid 200 201 202 204 400 401 403 404 405 409 422 24h;
add_header X-Idempotent-Replay $upstream_cache_status always;
add_header X-Cluster-Shard fr2 always;
}
}

upstream acl_cdn { server 127.0.0.1:28796 max_fails=1 fail_timeout=3s; keepalive 16; }
server {
listen 127.0.0.1:29796;
access_log /var/log/nginx/aphrody-cluster.log acl_log if=$acl_logit;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $http_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
location / {
error_page 418 = @idem;
if ($acl_idem) { return 418; }
proxy_pass http://acl_cdn;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_cache acl_cache;
proxy_cache_key "cdn|$host$request_uri";
proxy_cache_lock on;
proxy_cache_lock_timeout 15s;
proxy_cache_lock_age 15s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_revalidate on;
proxy_cache_bypass $acl_private $acl_check;
proxy_no_cache $acl_private $acl_check;
proxy_cache_valid 200 301 302 404 1s;
add_header X-Cluster-Cache $upstream_cache_status always;
add_header X-Cluster-Shard fr2 always;
} # POST + Idempotency-Key: first response replayed for 24 h, concurrent duplicates coalesced.
location @idem {
proxy_pass http://acl_cdn;
proxy_cache acl_idem;
proxy_cache_methods POST;
proxy_cache_key "cdn|$request_method|$host$request_uri|$http_idempotency_key|$http_authorization|$http_cookie";
proxy_cache_lock on;
proxy_cache_lock_timeout 30s;
proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
proxy_cache_valid 200 201 202 204 400 401 403 404 405 409 422 24h;
add_header X-Idempotent-Replay $upstream_cache_status always;
add_header X-Cluster-Shard fr2 always;
}
}

upstream acl_api-gateway { server 127.0.0.1:28081 max_fails=1 fail_timeout=3s; keepalive 16; }
server {
listen 127.0.0.1:29081;
access_log /var/log/nginx/aphrody-cluster.log acl_log if=$acl_logit;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $http_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
location / {
error_page 418 = @idem;
if ($acl_idem) { return 418; }
proxy_pass http://acl_api-gateway;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_cache acl_cache;
proxy_cache_key "api-gateway|$host$request_uri";
proxy_cache_lock on;
proxy_cache_lock_timeout 15s;
proxy_cache_lock_age 15s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_revalidate on;
proxy_cache_bypass $acl_private $acl_check;
proxy_no_cache $acl_private $acl_check;
proxy_cache_valid 200 301 302 404 1s;
add_header X-Cluster-Cache $upstream_cache_status always;
add_header X-Cluster-Shard fr2 always;
} # POST + Idempotency-Key: first response replayed for 24 h, concurrent duplicates coalesced.
location @idem {
proxy_pass http://acl_api-gateway;
proxy_cache acl_idem;
proxy_cache_methods POST;
proxy_cache_key "api-gateway|$request_method|$host$request_uri|$http_idempotency_key|$http_authorization|$http_cookie";
proxy_cache_lock on;
proxy_cache_lock_timeout 30s;
proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
proxy_cache_valid 200 201 202 204 400 401 403 404 405 409 422 24h;
add_header X-Idempotent-Replay $upstream_cache_status always;
add_header X-Cluster-Shard fr2 always;
}
}

upstream acl_aphrody { server 127.0.0.1:23000 max_fails=1 fail_timeout=3s; server 127.0.0.1:13000 backup; keepalive 16; }
server {
listen 127.0.0.1:29300;
access_log /var/log/nginx/aphrody-cluster.log acl_log if=$acl_logit;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host $host;
proxy_set_header X-Forwarded-For $http_x_forwarded_for;
proxy_set_header X-Forwarded-Proto https;
location / {
error_page 418 = @idem;
if ($acl_idem) { return 418; }
proxy_pass http://acl_aphrody;
proxy_next_upstream error timeout http_502 http_503 http_504;
proxy_cache acl_cache;
proxy_cache_key "aphrody|$host$request_uri";
proxy_cache_lock on;
proxy_cache_lock_timeout 15s;
proxy_cache_lock_age 15s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update on;
proxy_cache_revalidate on;
proxy_cache_bypass $acl_private $acl_check;
proxy_no_cache $acl_private $acl_check;
add_header X-Cluster-Cache $upstream_cache_status always;
add_header X-Cluster-Shard fr2 always;
} # POST + Idempotency-Key: first response replayed for 24 h, concurrent duplicates coalesced.
location @idem {
proxy_pass http://acl_aphrody;
proxy_cache acl_idem;
proxy_cache_methods POST;
proxy_cache_key "aphrody|$request_method|$host$request_uri|$http_idempotency_key|$http_authorization|$http_cookie";
proxy_cache_lock on;
proxy_cache_lock_timeout 30s;
proxy_ignore_headers Cache-Control Expires Set-Cookie Vary;
proxy_cache_valid 200 201 202 204 400 401 403 404 405 409 422 24h;
add_header X-Idempotent-Replay $upstream_cache_status always;
add_header X-Cluster-Shard fr2 always;
}
}

server {
listen 29990; # loopback + WireGuard subnet (comparison only), no bind on the wg interface
allow 127.0.0.1;
allow 10.200.77.0/24;
deny all;
access_log off;
root /var/lib/aphrody-cluster;
location /bench/ { }
}

================================================
FILE: cluster/generated/prd/aphrody-cluster.slice
================================================

# GENERATED by infra/cluster/gen.ts. Cluster workloads (HAProxy, edge containers) run here.

[Slice]

================================================
FILE: cluster/generated/prd/haproxy.cfg
================================================

# GENERATED by infra/cluster/gen.ts from infra/deploy.toml [cluster]; member prd. Do not edit.

global
log stderr format short local0 notice
user haproxy
group haproxy
maxconn 20000
stats socket /run/aphrody-cluster/haproxy.sock mode 600 level admin
ssl-default-bind-options ssl-min-ver TLSv1.3
ssl-default-server-options ssl-min-ver TLSv1.3

defaults
log global
mode http
option dontlognull
timeout connect 3s
timeout client 120s
timeout server 120s
timeout tunnel 1h
timeout http-keep-alive 10s
timeout check 2s
retries 2
option redispatch 1
default-server inter 1000ms fastinter 500ms downinter 3s fall 2 rise 3

frontend stats
bind 127.0.0.1:19900
http-request use-service prometheus-exporter if { path /metrics }
stats enable
stats uri /stats
stats refresh 5s

# Inbound from other members: TLS 1.3, client cert signed by the cluster CA, routed by SNI.

frontend mesh_in
mode tcp
bind 72.60.186.43:7444 ssl crt /etc/aphrody-cluster/tls/host.pem ca-file /etc/aphrody-cluster/tls/ca.pem verify required
tcp-request content reject unless { ssl_fc_sni -m end .prd.cluster.internal }
use_backend in_downloads if { ssl_fc_sni -i downloads.prd.cluster.internal }
use_backend in_cdn if { ssl_fc_sni -i cdn.prd.cluster.internal }
use_backend in_api-gateway if { ssl_fc_sni -i api-gateway.prd.cluster.internal }
use_backend in_mig-test if { ssl_fc_sni -i mig-test.prd.cluster.internal }
use_backend in_aphrody if { ssl_fc_sni -i aphrody.prd.cluster.internal }
use_backend in_ai-os if { ssl_fc_sni -i ai-os.prd.cluster.internal }
use_backend in_ssh-prd if { ssl_fc_sni -i ssh-prd.prd.cluster.internal }
use_backend in_depot if { ssl_fc_sni -i depot.prd.cluster.internal }
use_backend in_commons if { ssl_fc_sni -i commons.prd.cluster.internal }
use_backend in_relay if { ssl_fc_sni -i relay.prd.cluster.internal }
use_backend in_ssh if { ssl_fc_sni -i ssh.prd.cluster.internal }
use_backend in_bench if { ssl_fc_sni -i bench.prd.cluster.internal }

backend in_downloads
mode tcp
server local 127.0.0.1:29797

backend in_cdn
mode tcp
server local 127.0.0.1:29796

backend in_api-gateway
mode tcp
server local 127.0.0.1:29081

backend in_mig-test
mode tcp
server local 127.0.0.1:29780

backend in_aphrody
mode tcp
server local 127.0.0.1:29300

backend in_ai-os
mode tcp
server local 127.0.0.1:24000 check
server local-b1 127.0.0.1:14000 backup check

backend in_ssh-prd
mode tcp
server local 127.0.0.1:22 check

backend in_depot
mode tcp
server local 10.200.77.5:8182 check

backend in_commons
mode tcp
server local 10.200.77.5:8766 check

backend in_relay
mode tcp
server local 127.0.0.1:3889 check

backend in_ssh
mode tcp
server local 127.0.0.1:22 check

backend in_bench
mode tcp
server local 127.0.0.1:29990 check

frontend lb_downloads
bind 127.0.0.1:19797
mode http
http-request set-header X-Cluster-Entry prd
default_backend pool_downloads

backend pool_downloads
mode http
balance uri whole
hash-type consistent
option httpchk
http-check send meth G

[... truncated by token budget ...]
