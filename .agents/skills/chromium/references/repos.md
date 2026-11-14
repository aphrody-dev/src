# Chromium / ChromiumOS repos (verified 2026-11-12)

## GitHub org `chromium` (gh api orgs/chromium/repos, sort=pushed)

| Repo                                          | Stars     | Last push               | Note                              |
| --------------------------------------------- | --------- | ----------------------- | --------------------------------- |
| chromium/chromium                             | 25317     | 2026-11-12              | read-only mirror of chromium/src  |
| chromium/openscreen                           | 15        | 2026-11-12              | Open Screen Protocol              |
| chromium/vs-chromium                          | 321       | 2026-11-10              | VS extension                      |
| chromium/crashpad                             | 613       | 2026-11-06              | crash reporting                   |
| chromium/permission.site                      | 1254      | 2026-10-21              | permissions test site             |
| chromium/mini_chromium                        | 314       | 2026-09-04              | base subset for crashpad          |
| chromium/hstspreload.org / hstspreload        | 882 / 126 | 2026-09-02 / 2026-07-03 | HSTS preload                      |
| chromium/content_analysis_sdk                 | 57        | 2026-08-11              | DLP agent SDK                     |
| chromium/badssl.com                           | 3059      | 2026-06-01              | TLS test site                     |
| chromium/subspace                             | 144       | 2026-03-09              | C++20 stdlib                      |
| chromium/pdfium                               | 541       | 2025-11-19              | mirror, canonical on googlesource |
| gyp, hterm, dom-distiller, -archived-chromium | -         | <=2024                  | archived/moved                    |

## googlesource (canonical, Gerrit)

- chromium/src, chromium/tools/depot_tools, v8/v8, skia, angle/angle, dawn (revisions pinned in chrome-channels.toml)
- chromiumos/manifest (used by cros-factory), chromiumos/docs (moved to chromium.org developer-library)
- chromiumos/chromite, platform2, overlays/board-overlays, third_party/kernel, platform/ec: standard CrOS repos, not individually checked this run
- Search https://source.chromium.org, review https://chromium-review.googlesource.com

## Trackers and V8 consumers (verified 2026-11-14: gh api, chromiumdash, crates.io; live data in `third_party/chromium-trackers.json`, regenerate with `just trackers`)

| Target | Code / issues | CLs or PRs | Note |
| --- | --- | --- | --- |
| Chromium, Blink | chromium.googlesource.com/chromium/src (mirror chromium/chromium); issues.chromium.org components 1456407 (Blink), 1456824 (V8) from `DIR_METADATA` | chromium-review.googlesource.com | news: chromereleases.googleblog.com feed |
| V8, ANGLE | chromium.googlesource.com/v8/v8, angle/angle (mirror v8/v8: GitHub issues disabled) | chromium-review.googlesource.com | news: v8.dev/blog.atom |
| Skia, Dawn | skia.googlesource.com/skia (mirror google/skia), dawn.googlesource.com/dawn | skia-review / dawn-review.googlesource.com | issues.skia.org; Dawn component 1570784 |
| CEF | github.com/chromiumembedded/cef (branch master) | GitHub pulls | builds index cef-builds.spotifycdn.com/index.json; the magpcss.org forum refused connections on 2026-11-14 |
| cef-rs | github.com/tauri-apps/cef-rs (branch dev); crate `cef` | GitHub pulls | binds one CEF/Chromium milestone per release |
| deno_core | github.com/denoland/deno `libs/core` (denoland/deno_core archived 2026-02-27, merged); V8 binding `deno_v8` -> `v8` crate (denoland/rusty_v8) | denoland/deno pulls | crates.io chain resolves the V8 of Obscura |
| Node, Electron | github.com/nodejs/node (`deps/v8`), github.com/electron/electron | GitHub pulls | electronjs.org/headers/index.json carries Chrome, V8 and Node of each release |
| Obscura, agent-browser | github.com/h4ckf0r0day/obscura, github.com/vercel-labs/agent-browser | GitHub pulls | agent-browser downloads Chrome for Testing (last-known-good) |
| Lightpanda zig-v8 | github.com/lightpanda-io/zig-v8-fork (branch fork) | GitHub pulls | V8 pinned by `V8_VERSION` in build.zig; tracked as V8 consumer only (engine removed in 768dd797) |
| Forks | brave/brave-browser (+ brave-core), ungoogled-software/ungoogled-chromium, Alex313031/thorium, imputnet/helium, uazo/cromite, win32ss/supermium | GitHub pulls | Edge (MSEdgeExplainers only), Vivaldi and Opera are closed: feeds only |
