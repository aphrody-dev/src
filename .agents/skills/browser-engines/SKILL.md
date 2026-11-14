---
name: browser-engines
description: Use when choosing, driving, building or comparing a browser engine for Aphrody — render oracle, agent browser, embedded browser, cross-engine diff, conformance runs, CDP/WebDriver or Playwright/Puppeteer compatibility, building Servo/Obscura/Blitz/rusty_v8/cef-rs/agent-browser from source. Triggers: "quel moteur", "headless", "oracle de rendu", "agent browser", "Servo", "Obscura", "Helium", "Brave", "chrome-headless-shell", "CEF", "Electron", "CDP", "Playwright", "Puppeteer", "build from source".
---

# browser-engines

Measurements below are a snapshot of the fr1 run of 2026-11-12; versions in the tables are what that run used, not the current pins (Chromium pins: `third_party/chrome-channels.toml`; clone commits: `git -C third_party/<name> log -1`). Authoritative, in order: `docs/native/bench/REPORT.md` (+ `docs/native/bench/*.json`), then owner amendments (V8 follows the Chromium of cef-rs 156; oracle = Chrome Stable 157; checkout 160 = extraction only). Do not cite a figure outside these files without a source. The harness that produced REPORT.md lives on fr1 (`~/browser-bench/harness`, TypeScript on Bun), not in the repository.

Removed engines: Lightpanda and Firefox (Nightly, Zen, Playwright firefox) are no longer engines of the stack; their REPORT.md rows are history only. The Brave and Helium clones are gone too.

## Roles

| role              | engine                                                                    | evidence (REPORT)                                                       | limits                                                  |
| ----------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------- |
| Render oracle     | chrome-headless-shell Stable 157.0.8103.78; Canary 160.0.8156.0 = early warning | 12/12 sites, B 6/6, Turnstile 9/9, 45/45 features, Lighthouse OK, ~142 ms cold, ~620 MB | -                                                       |
| JSC oracle        | WebKit (Playwright webkit-2388)                                           | B 6/6, 45/45 features, 11/12 sites (Amazon "Page Not Found")            | no CDP; Playwright only                                 |
| Full agent        | chs-stable over direct CDP (Puppeteer/Playwright)                         | same as oracle                                                          | agent-browser 0.42 adds 30-90 ms/cmd, +~400 ms cold     |
| Light agent       | Obscura 0.2.6 (watchlist)                                                 | 12/12 sites, ~142 MB, 42 ms cold, Turnstile correct                     | client nav `<Link>` KO (B fails 6/6), Lighthouse KO     |
| Embedded VPS      | Electron 43.8.9 (Chromium 150)                                            | 12/12, 581 MB, best LCP                                                 | `Target.createTarget` not supported                     |
| Embedded (alt.)   | CEF 156.0.26                                                              | works                                                                   | Xvfb required, no new CDP target: Lighthouse/newPage KO |
| Watch             | Servo 0.8.0 nightly                                                       | 6/12, 36/45, WebDriver only                                             | rerun the fr1 harness                                   |
| Rejected headless | Brave Nightly 1.102.1 (Chromium 158), Helium 0.21.2.1 (157)               | Brave ~1.1 GB; Helium ~11 s/page, 2.2 GB                                | -                                                       |
| JS server         | Node 24 ref., Bun option                                            | identical client results                                                | `next start` slower under Bun (1 sample)                |

## Driver matrix (goto+evaluate+click+screenshot, REPORT § Driver compatibility)

| engine                                        | protocol                          | Puppeteer 25.17 | Playwright 1.65 |
| --------------------------------------------- | --------------------------------- | --------------- | --------------- |
| chs-stable/canary, pw-chromium, Brave, Helium | CDP                               | ok              | ok              |
| Obscura                                       | CDP (subset)                      | ok              | ok              |
| pw-webkit                                     | Playwright WebKit protocol        | n/a             | ok              |
| Servo                                         | WebDriver classic only            | n/a             | n/a             |
| CEF 156, Electron 43                          | CDP without `Target.createTarget` | KO newPage      | KO newPage      |

Rule: drive the existing page for CEF/Electron; direct CDP otherwise.

## Build from source (clones in `third_party/`)

| project       | clone                       | command                                                                                                              |
| ------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Chromium      | `third_party/chromium`      | `fetch chromium` + `gn gen out/X` + `autoninja -C out/X chrome` (upstream docs); see the `chromium` skill            |
| servo         | `third_party/servo`                           | `./mach bootstrap` then `./mach build` (Windows `.\mach`)                                                            |
| obscura       | `third_party/obscura`                           | `cargo build --release -p obscura-cli --bins --features render[,stealth]`; CDP protected by `OBSCURA_CDP_TOKEN`      |
| blitz         | `third_party/blitz`                           | `cargo run -rp browser` / `rdme` / `todomvc`                                                                         |
| cef-rs        | `third_party/cef-rs`                           | Cargo workspace (CEF 156 bindings)                                                                                   |
| rusty_v8      | `third_party/rusty_v8`                           | `cargo build` (prebuilt binary); `RUSTY_V8_ARCHIVE`, `RUSTY_V8_MIRROR`; source: `V8_FROM_SOURCE=1` + `LIBCLANG_PATH` |
| agent-browser | `third_party/agent-browser`                           | `bun add -g agent-browser`; dev (upstream, needs Node and pnpm): `pnpm install && pnpm build:source`; `cargo test e2e -- --ignored --test-threads=1`   |

Servo, Obscura, Blitz, rusty_v8 and agent-browser commands were rechecked against the clones' READMEs on 2026-11-14; Chromium commands were not.

## Workflow

1. Need for pixel/Lighthouse truth: chs-stable; cross-engine diff: add WebKit.
2. New version of an engine: rerun the fr1 harness, update REPORT.md, then this table.
3. Inventory of the orgs (Chrome, Chromium, Brave, imputnet, Servo, h4ckf0r0day, vercel-labs): `references/org-inventory.md`.

## Links

- https://googlechromelabs.github.io/chrome-for-testing/ · https://chromium.googlesource.com/chromium/src · https://github.com/servo/servo · https://github.com/h4ckf0r0day/obscura · https://github.com/vercel-labs/agent-browser · https://github.com/DioxusLabs/blitz · https://github.com/denoland/rusty_v8

## Not verified

Chromium commands (not reread in the clone); causes of Helium slowness (not investigated, REPORT).
