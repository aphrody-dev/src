---
name: browser-engines
description: Use when choosing, driving, building or comparing a browser engine for Aphrody Labs — render oracle, agent browser (light or full), embedded browser, cross-engine diff, conformance runs, CDP/BiDi/WebDriver or Playwright/Puppeteer compatibility, building Chromium/Brave/Helium/Servo/Lightpanda/Obscura/Firefox/Blitz/rusty_v8/workerd from source, or the Brave/Helium patch-over-Chromium model. Triggers: "quel moteur", "headless", "oracle de rendu", "agent browser", "Lightpanda", "Servo", "Obscura", "Helium", "Brave", "chrome-headless-shell", "CEF", "Electron", "BiDi", "CDP", "Playwright", "Puppeteer", "build from source".
---

# browser-engines (measured on fr1, 2026-11-12)

Authoritative, in order: `C:\labs\docs\bench\REPORT.md` (+ `*.json`), `C:\labs\docs\ENGINE-DECISION.md` § "Décision mesurée", then owner amendments (V8 follows the Chromium of cef-rs 156; oracle = Chrome Stable 157; checkout 160 = extraction only). Do not cite a figure outside these files without a source.

## labs roles

| role | engine | evidence (REPORT) | limits |
|---|---|---|---|
| Render oracle | chrome-headless-shell Stable 157.0.8103.78; Canary 160.0.8156.0 = early warning | 12/12 sites, B 6/6, Turnstile 9/9, 45/45 features, Lighthouse OK, ~142 ms cold, ~620 MB | — |
| Second oracle | Firefox Nightly 162.0a1 via BiDi; WebKit (Playwright webkit-2388) for JSC | FF 12/12, 44/45; WebKit B 6/6, 45/45 | FF ~1.1 GB, ~2 s cold |
| Light agent | Lightpanda 1.1.0-nightly.12036 | 12/12, B 6/6, ~72 MB, 44 ms cold, Puppeteer+Playwright ok | no real layout/paint/iframes/Wasm/Turnstile |
| Full agent | chs-stable over direct CDP (Puppeteer/Playwright); `labs_agent` (fr1 factory) = reduced build | same as oracle | agent-browser 0.42 adds 30-90 ms/cmd, +~400 ms cold |
| Embedded VPS | Electron 43.8.9 (Chromium 150) | 12/12, 581 MB, best LCP | `Target.createTarget` not supported |
| Embedded (alt.) | CEF 156.0.26 | works | Xvfb required, no new CDP target: Lighthouse/newPage KO |
| Watch | Servo 0.8.0 nightly, Obscura 0.2.6 | Servo 6/12, 36/45, WebDriver only; Obscura client nav `<Link>` KO | rerun `bun bench.ts` |
| Rejected headless | Brave Nightly 1.102.1 (Chromium 158), Helium 0.21.2.1 (157) | Brave ~1.1 GB; Helium ~11 s/page, 2.2 GB | — |
| JS server | Node 24 ref., Bun 1.4.4 option | identical client results | `next start` slower under Bun (1 sample) |

## Driver matrix (goto+evaluate+click+screenshot, REPORT § Driver compatibility)

| engine | protocol | Puppeteer 25.17 | Playwright 1.65 |
|---|---|---|---|
| chs-stable/canary, pw-chromium, Brave, Helium | CDP | ok | ok |
| Lightpanda, Obscura | CDP (subset) | ok | ok |
| Firefox Nightly, Zen | WebDriver BiDi | ok (BiDi) | KO (launch) |
| pw-firefox | BiDi / Juggler | ok (BiDi) | ok (Juggler) |
| pw-webkit | Playwright WebKit protocol | n/a | ok |
| Servo | WebDriver classic only | n/a | n/a |
| CEF 156, Electron 43 | CDP without `Target.createTarget` | KO newPage | KO newPage |

Rule: drive the existing page for CEF/Electron; BiDi for Gecko; direct CDP otherwise.

## Build from source (clones `C:\src\third_party\browsers\*`)

| project | clone (commit, date) | command |
|---|---|---|
| Chromium | gitiles chromium/src | `fetch chromium` + `gn gen out/X` + `autoninja -C out/X chrome` (upstream docs, not reread here) |
| brave-core | c299f814f 2026-11-12 (v1.102.1, tag Chromium 158.0.8127.22) | `pnpm run init` then `pnpm run build [Release]`; `--target_os=android --target_arch=arm` / `ios` |
| brave-browser | cbd0ce8 2026-11-12 | issues/releases/wiki only, no code |
| helium | 4697bd3 2026-11-12 (Chromium 157.0.8103.78, `patches/series` 371 lines) | via platform repository |
| helium-linux | c594074 2026-11-10 | `scripts/docker-build.sh` |
| servo | 85c78cb89 2026-11-12 | `./mach bootstrap` then `./mach build` (Windows `.\mach`) |
| stylo | 9d5623e 2026-11-11 | Cargo crate (Servo's CSS engine) |
| lightpanda | 16ff86b 2026-11-12 | Zig : `zig build snapshot_creator -- src/snapshot.bin`; `zig build -Dsnapshot_path=../../snapshot.bin`; `make test` |
| obscura | 3bae609 2026-11-11 | `cargo build --release -p obscura-cli --bins --features render[,stealth]`; CDP protected by `OBSCURA_CDP_TOKEN` |
| firefox | 2024e90df3 2026-11-12 | `./mach bootstrap && ./mach build` (Mozilla convention, not reread here) |
| blitz | e814eb0 2026-11-12 | `cargo run -rp browser` / `rdme` / `todomvc` |
| rusty_v8 | 55ca54e 2026-10-21 | `cargo build` (prebuilt binary); `RUSTY_V8_ARCHIVE`, `RUSTY_V8_MIRROR`; source: `V8_FROM_SOURCE=1` + `LIBCLANG_PATH` |
| deno | e7b39ebd 2026-10-26 | `cargo build` |
| workerd | 22a428d 2026-11-12 | `bazel build //src/workerd/server:workerd [--config=release|thin-lto]` |
| agent-browser | f88c40b 2026-11-11 | `npm i -g agent-browser`; dev: `pnpm install && pnpm build:source`; `cargo test e2e -- --ignored --test-threads=1` |

## Patch-over-Chromium model

- **Brave**: `brave-core` is a repository *inside* `src/brave` of a pinned Chromium checkout (`package.json` → `tag`). Two mechanisms: `patches/*.patch` (1327 files, direct Chromium changes, `DEPS.patch` included) and `chromium_src/` (overrides by mirrored path, preferred because fewer conflicts). Version bump: `docs/chromium_version_upgrade.md`.
- **Helium**: fork of the ungoogled-chromium method. Chromium tarball (`chromium_version.txt`), `pruning.list` (removed binaries), `domain_substitution.list` + `domain_regex.list`, `flags.gn`, then `patches/series` applied in order. Patches grouped by vendor: `ungoogled-chromium/`, `inox-patchset/`, `iridium-browser/`, `bromite/`, `brave/`, `debian/`, `upstream-fixes/`, `helium/`. Platform repositories (`helium-linux|windows|macos`) do build + packaging. Licenses: `LICENSE` + `LICENSE.ungoogled_chromium`.
- Consequence for labs: for an in-house Chromium (fr1 factory), copy the Helium model (ordered series + pruning) for reproducible builds; Brave-style `chromium_src` for durable overrides.

## Workflow

1. Need for pixel/Lighthouse truth → chs-stable; diff → + Firefox BiDi + WebKit.
2. Cheap massive reading/scraping → Lightpanda; fall back to chs-stable for layout/iframe/Turnstile.
3. New version of an engine → rerun the `docs/bench` harness (`bun bench.ts`), update REPORT.md then this table.
4. Inventory of the orgs (Chrome, Chromium, Brave, imputnet, Servo, Lightpanda, h4ckf0r0day, vercel-labs) → `references/org-inventory.md` (= `C:\labs\docs\WEB-ECOSYSTEM.md`).

## Links

- https://googlechromelabs.github.io/chrome-for-testing/ · https://chromium.googlesource.com/chromium/src · https://github.com/brave/brave-core · https://github.com/imputnet/helium · https://github.com/servo/servo · https://github.com/lightpanda-io/browser · https://github.com/h4ckf0r0day/obscura · https://github.com/vercel-labs/agent-browser · https://github.com/DioxusLabs/blitz · https://github.com/denoland/rusty_v8 · https://github.com/cloudflare/workerd · https://w3c.github.io/webdriver-bidi/

## Not verified

Chromium/Firefox commands (not reread in the clones); causes of Helium slowness (not investigated, REPORT).
