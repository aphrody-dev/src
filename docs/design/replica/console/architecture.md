# Architecture: the Aphrody console shell (hybrid fullscreen launcher)

Inputs: `recon.md`, `features.csv` (commit 765af380), the code already in the tree on 2026-11-13, and the Android TV public guidance read in this session. Clean-room: layout and interaction only, no Sony, Nintendo or Google art, marks or glyphs. Nothing in this document is built beyond what section "What exists" lists.

## Owner decisions folded in

- aphrody.com is a showcase only: it links to the app. `/gamescope` on aphrody.com (today built by `apps/aphrody/src/gamescope`) stays a demo page and points to aphrody.app.
- `apps/aphrody-app` (aphrody.app) is the home of the launcher: full-Rust apps suite plus the fullscreen shell, shipped native (Windows 11 DX12, Linux Vulkan), as the Chromium WebGPU wasm build served at aphrody.app, and with a mobile layout (Android and iOS from the same Rust core).
- One shell, three layout variants driven by tokens: `Ps` (tab bar, scale-up rows), `Switch` (status bar, tile row, round menu row, hints) and `Tv` (Android TV language, new).

## License posture

`docs/legal/LICENSE-QUEUE.md` (commit b6aea61a) records an owner decision that all licenses are accepted and reference assets may be taken verbatim. `AGENTS.md` section 4 ("Limits that stay": no unlicensed or non-OSI code and no proprietary assets copied into the repository, no Unreal, Oodle or MSVC SDK) is the checked-in contract and an agent relay cannot amend it. This document therefore keeps the clean-room default for Sony, Nintendo and Google marks and art: layouts, states and metrics are implemented, shipped art is original or openly licensed, and the Android TV kit is consumed as numbers read from developer.android.com. Switching to verbatim assets is a one-line change per asset class once `AGENTS.md` section 4 is amended by the owner in the repository; every asset class is already listed in the queue file with its status. No work is blocked either way.

## What exists (read in the tree, not assumed)

| item | state |
| --- | --- |
| `crates/gamescope-core` | pure CPU lib: `pacing.rs` (RefreshRate, RollingFrameHistogram, LatencyBudgetCalculator), `hdr.rs` (PQ, scRGB, tonemap params), `scaling.rs`, `composition.rs`; uncommitted work by the gamescope agents: `ui.rs` (Rect, Dir, Input, `spatial_next`, Smooth, `row_xs`, Quad, Painter) and `console.rs` (Shell Ps/Switch, Theme, Tile, Item, Screen Login/Home, `App`) |
| `crates/gamescope-web-wasm` | wgpu `web` + `webgpu` cdylib; uncommitted `console.rs` + `console.wgsl`: one instanced-quad pipeline (kinds fill, glyph, icon, shadow), 2048x2048 RGBA atlas uploaded from JS (`set_atlas`), glyph advances measured on the JS side |
| `crates/gamescope-wgsl` | shaders `easu.wgsl`, `rcas.wgsl`, `composite_hdr.wgsl` |
| `crates/gamescope-cli` | native CLI |
| `crates/aphrody-ui` | tokens bridge, `bevy`, `web` (bevy + webgpu) and `egui` features, brand, color, components, layout |
| `crates/game` | Bevy demo: published at cdn.aphrody.com/game/ (game.js, game_bg.wasm), fps harness `scripts/game-fps.ts` |
| `apps/aphrody-app` | separate Cargo workspace (own Cargo.lock): `aphrody-core` (layout, wire, store, WAL, webmcp), `aphrody-wasm` (WebGPU mica, OPFS), `aphrody-host` (CLI, TUI, COOP/COEP server), `aphrody-android` (NDK cdylib); packaging alpine, arch, nix, wayland |
| `apps/aphrody/src/gamescope` | page and build of the /gamescope demo |
| `packages/design` | `tokens/themes.json`: 7 themes (aphrody, dawn, ember, frost, mono, night, workshop), light and dark, Material 3 roles; `tokens.rs` for Rust |
| `packages/i18n` | locales fr, en, zh-CN, ja, es |
| `packages/assets/data/games.sqlite` | table `games(store, ext_id, name, url, cover, platforms, genres, free, developer, release, desc, synced)` + FTS5 |
| `assets/library/icons/vendors` | 20 real vendor icons (steam, epic, gog, itch, xbox, googleplay, flathub, windows, ...) |
| Not found | any iOS crate, any native winit shell, any text rasteriser dependency in the workspace, any sqlite code for the shell, an audio crate, a gamepad layer wired to the shell (`gilrs 0.11.2` is only in the lockfile) |

Conflict to report: the baseline given in the brief (153.9 fps live, `crates/game`) is not in the repo. The only recorded figure is `docs/reviews/PROOF-2026-11-13.md` line 24: Chrome 157 headless, RTX 4070, 1920x1080, 3438 frames, median 243.9 fps, p95 4.9 ms, p99 9.4 ms, worst 16.1 ms. Until a live run is archived, the 153.9 value is unsourced. The 3D game scene is also a much heavier workload than a UI quad pass, so it is an upper bound on cost, not a shell measurement.

Version pins read in `Cargo.lock` (2026-11-13): bevy 0.20.1, wgpu 30.0.2 (workspace requirement `30.0.1`), winit 0.30.13, egui 0.37.0, rusqlite 0.42.0, taffy 0.15.1, wasm-bindgen 0.2.130, gilrs 0.11.2. The brief says "wgpu 30": consistent.

## Stack

| layer | choice | why |
| --- | --- | --- |
| language | Rust 2024, one core, many targets | repo rule; the same `gamescope-core` runs on wasm, desktop, Android and iOS |
| shell renderer | own wgpu 30 instanced-quad painter (existing design in `gamescope-web-wasm`), extracted into `gamescope-render` | one draw call for the whole UI, no ECS or layout overhead in the 8.33 ms budget, already implemented and shared by native and wasm; Bevy UI would add a frame schedule and a bigger wasm for no gain on a fixed 2D scene |
| Bevy 0.20.1 | kept for 3D and previews only (`crates/game`, hero scenes, optional in-shell 3D tile) behind the `bevy` feature of `aphrody-ui` | pinned in the workspace; used where a scene graph is worth it; the shell never depends on it |
| window and input native | winit 0.30.13 | pinned; Windows, Linux Wayland and X11, Android, iOS from one event loop |
| GPU API | wgpu 30: DX12 on Windows 11, Vulkan on Linux and Android, Metal on iOS, WebGPU in Chromium | one codepath, per-OS backend chosen by wgpu; the Windows machine has HDR 1440p144 (windows-machine profile) |
| immediate-mode tools | egui 0.37 only for the debug overlay (frame graph, focus tree inspector) and dev tools | fast to build, never in the shipped shell path |
| gpui-kit | not used by the shell; allowed for desktop-only apps in the suite | its widgets target pointer desktop UIs, not 10-foot focus UIs; rendering criteria fail the 10-foot case |
| layout | pure functions in `gamescope-core` (`row_xs`, grid rules) plus taffy 0.15.1 for flex panes in settings and store only | rows and grids are cheaper by hand; taffy only where nesting is real |
| focus | `spatial_next` evolved into a focus-tree engine (section below) | owned code, unit-testable without a GPU |
| text | JS canvas glyph atlas on the web (existing); native needs a rasteriser and shaper. Candidates cosmic-text, swash, parley, fontdue: none is in the workspace, so the pick is made at S06 after reading each crate on crates.io and its license, not from memory | Latin, CJK, RTL shaping; on-demand glyph cache, not a static grid |
| fonts | Atkinson Hyperlegible Next (OFL, already shipped by `assets/brand/gen/fonts`), Instrument Sans and Karla (OFL per recon), Noto Sans JP and SC (OFL, to be fetched and licence-verified at S06) | CJK strategy: Latin primary, per-locale CJK fallback subset by locale, glyphs rasterised on demand |
| icons | Material Symbols (verify licence text in its upstream repo at S01 before bundling), our own glyph set for controller prompts, real vendor favicons from `assets/library/icons/vendors` for stores | only public licences; no console button glyphs from third parties |
| tokens | `packages/design/tokens/themes.json` + `tokens.rs`; 7 themes x light/dark; layout variant is a token set (metrics, radii, motion, safe area), not a code fork | Material 3 roles as the single colour vocabulary |
| i18n | `packages/i18n` locales fr, en, zh-CN, ja, es compiled to a Rust table by `ay` at build time | same strings on web, native, mobile |
| local data | SQLite: `rusqlite 0.42.0` native and Android/iOS, SQLite compiled to wasm over OPFS on the web (`aphrody-wasm/opfs.rs` exists), `bun:sqlite` only on the server side (catalogue builds) | one schema (`schema.sql`); sqlx is rejected: async pool and compile-time macros add weight for a single-writer local file |
| catalogue | `packages/assets/data/games.sqlite` attached read-only, shipped to wasm as a range-fetched file | already built, FTS5 for S15 |
| audio | UI sound effects only (original, synthesised: `crates/game/src/synth.rs` exists). Backend crate chosen at S09 among those verified on crates.io | licensed system sounds are out of scope (features.csv) |
| gamepad | gilrs 0.11.2 native, Gamepad API in Chromium, Android `InputDevice`, iOS GameController framework | platform-native paths |
| companion link | `aphrody-core` wire + WebMCP (existing) | the app already speaks it |
| hosting | web build at aphrody.app (existing Worker `aphrody-app-site`, R2 `aphrody-dist`), assets on cdn.aphrody.com; aphrody.com links only | owner decision |
| CI | fr1 builds (ci.yml self-hosted), judge.yml fast gates | repo rule: nothing compiles on the PC |

## Crate map (17)

Existing (9): `gamescope-core`, `gamescope-wgsl`, `gamescope-web-wasm`, `gamescope-cli`, `aphrody-ui`, and in `apps/aphrody-app`: `aphrody-core`, `aphrody-wasm`, `aphrody-host`, `aphrody-android` (`crates/game` is a consumer and the perf reference, not part of the shell). 9 + 8 new = 17.

New (8), created only when the extraction is needed by a milestone and after the two gamescope agents commit their files:

| crate | role | depends on | milestone |
| --- | --- | --- | --- |
| `gamescope-shell` | screens, flows, `App` state machine, mock catalogue; moved out of `gamescope-core/console.rs` | core | S01 refactor |
| `gamescope-render` | wgpu painter, atlas, pipelines, render graph, HDR/upscale passes; native + wasm | core, wgsl, wgpu | S01 |
| `gamescope-text` | shaping, glyph cache, fallback chain per locale | render | S06 |
| `gamescope-input` | device abstraction to `Input` events, bindings, dead zones, repeat, touch gestures, remote keys | core | S02 |
| `gamescope-store` | SQLite access (`scoped(profile)`), migrations from `schema.sql`, OPFS driver | rusqlite / wasm | S07 |
| `gamescope-audio` | UI sounds, volume, ducking | core | S09 |
| `gamescope-native` | winit app: Windows, Linux (Wayland, X11, gamescope-session), fullscreen, HDR surface, cursor hiding | shell, render, input, store | S08 |
| `gamescope-mobile` | Android activity and iOS entry, safe areas, touch layout, haptics; consumed by `aphrody-android` and an iOS target | native | M5 |

Home and packaging: `apps/aphrody-app` hosts the launcher binary target (`aphrody-host` gains a `launcher` subcommand) and the web entry `web/index.html`; the shell crates live in the root workspace under `crates/` (purity rule) and are consumed by `apps/aphrody-app` by path. Root dir whitelist is untouched (no new root dirs). A perf harness lives in `crates/bench` (`ay bench`).

Ownership while the agents work: `console.rs`, `ui.rs`, `console.wgsl`, `web-wasm/console.rs` and `apps/aphrody/src/gamescope` belong to agents ac4ec7fee313141f4 and a0b8b5bd7f9097423 until committed. This plan adds no edits there; extraction follows their commit.

## Layout variants and the Android TV language

Facts read on developer.android.com/design/ui/tv/guides/styles/layouts (2026-11-13):

- design at 960 x 540 dp (MDPI, 1 px = 1 dp), assets aimed at 1080p, scaled to 4K proportionally;
- overscan: 5 % margin, stated as 48 dp left and right and 27 dp top and bottom; the same page also says 58 dp sides and 28 dp top and bottom further down. Conflict on the source itself; we expose `safe_area_pct` (default 5 %, 0 on modern TVs per the page note "most modern TVs no longer have overscan issues") and derive both numbers from it;
- 12 columns of 52 dp, 20 dp gutters, 58 dp side margin (12x52 + 11x20 = 844 dp card span, matching the page's 1-card width of 844 dp); card widths per row 412, 268, 196, 124 dp for 2 to 5 cards;
- templates: Browse, left, right, center and bottom overlay, Actions, Content details, Compilation, Grid, Alert; single-pane and two-pane;
- D-pad needs instant and distinct feedback; TV is a shared device (privacy: profile PIN, guest); backgrounds fill the screen and only content respects the safe area;
- Compose for TV: `androidx.tv:tv-material:1.0.0` with compose-bom 2026.09.00 per developer.android.com/training/tv/playback/compose; TV Material components have clear focus indicators and remote-friendly input; mixing mobile and TV Material themes is discouraged. We do not use Compose: these are references for behaviour.

Not obtained: the 10-foot type scale page and the design kit page returned 404 at the guessed URLs; the TV design landing page links the Figma community kit at figma.com/@tv and states no licence. Decision: the kit is reference only, never copied or redistributed; type scale is derived from the Material 3 typescale spec in `docs/design/specs` and checked on a real 1080p screen at 3 m equivalent (S03 proof). Open item: read the TV typography and color pages by their real URLs at /replica-design.

`Shell::Tv` is added beside `Ps` and `Switch`: browse template (vertical stack of horizontal rows), left-overlay navigation rail, focus = scale 1.05 plus 2 dp ring from `layout.focus-ring` token, no hover states, no pointer cursor.

Token mapping: colours from the Material 3 roles of the chosen theme; `Ps` default dark, `Switch` default light, `Tv` follows the scheme setting. Per-variant metrics (radius, gap, scale, motion spring, safe area) are one table in `gamescope-shell::theme`, generated from `packages/design`.

## Render pipeline and 120 fps budget

Target: 120 Hz means 8.33 ms per frame; 144 Hz panels (the PC is 1440p144) means 6.94 ms. All numbers below are allocations to be verified, not measurements.

| stage | budget (ms) | rule |
| --- | --- | --- |
| input drain and focus step | 0.2 | events batched per frame, no allocation |
| state update, springs (`Smooth`) | 0.3 | fixed-step integration, dirty flags |
| layout | 0.5 | cached per screen; recomputed only on resize, locale or content change |
| paint to instance buffer | 0.6 | persistent `Vec<Quad>`, only dirty rows rewritten |
| upload | 0.3 | one `write_buffer` of the dirty range, ring of 3 buffers |
| text and image atlas work | 0.5 amortised | glyph and tile uploads off the critical path, 1 upload per frame max |
| GPU shell pass | 2.5 | one instanced draw, premultiplied alpha, shadows as analytic SDF quads |
| upscale / HDR composite | 1.0 | existing EASU/RCAS and `composite_hdr` passes, only when the render scale is below 100 % or HDR is on |
| margin | about 2.4 | present, OS jitter; frame-time p99 gate is 8.33 ms |

Render graph (fixed, 4 nodes): `background` (gradient and light cone, cached to a texture, redrawn on theme change) -> `shell` (instanced quads with the atlas) -> `overlay` (hints, toast, status bar) -> `present` (optional upscale and HDR). Passes are skipped when nothing is dirty and the monitor is not animating; idle frames are not rendered (battery and fan noise).

GPU atlas: 2048 x 2048 pages in a texture array; page classes: glyphs (alpha), icons (alpha or RGBA), tile art (BC7 or ASTC where the adapter supports it, RGBA8 fallback, mip 3 levels). LRU eviction, 100 to 300 tiles resident, art streamed by decoded `image` 0.25.10 on a worker. 4K: UI laid out in dp and scaled; atlas rasterised at device pixel size, quantised to 1x, 1.5x, 2x, 3x.

Pacing: `RollingFrameHistogram` and `LatencyBudgetCalculator` already exist; the shell feeds them every frame; present mode Fifo-relaxed by default, `fps_cap` setting; on web `requestAnimationFrame` plus `performance.now`; high-refresh detection by `RefreshRate`.

HDR: scRGB surface where wgpu exposes it, `hdr.rs` PQ and tonemap with a paper-white setting (UI at about 203 nits reference, user adjustable); SDR is the default and the safe fallback; HDR proof only on the real HDR display of the PC.

## Input abstraction and focus engine

- Devices produce `Input` (existing codes 0 to 8: four directions, select, back, prev tab, next tab, options) plus `Home`, `Search`, `Pointer(x, y)` and `Scroll`. Bindings per device kind are rows of `input_binding`.
- Gamepad: left stick with 0.25 dead zone and repeat curve (400 ms first repeat, 90 ms next), D-pad, face buttons by position (south = select, east = back) with a setting to swap; keyboard: arrows, Enter, Esc, Tab; touch: tap = select, drag scrolls rows, long press = options, swipe from edge = back; TV remote: D-pad keycodes, Back, Home; mouse: hover moves focus, wheel scrolls.
- Focus engine: tree of focus scopes (screen, row, grid, overlay). Rules taken from the TV guidance: every direction has a clear purpose, no focus traps except modal overlays (which restore focus to their opener on close), each row remembers its last focused item, focus path follows reading order. Algorithm: scope-local `spatial_next`, fallback to the nearest item of the parent scope, edge behaviour per scope (stop, wrap or leave). Pointer and touch never steal focus from a gamepad session until the pointer moves.
- Accessibility: text scale 100 to 200 %, high contrast token set, reduce-motion switches springs to 80 ms fades, focus ring never colour-only (shape plus scale), minimum target 48 dp on touch, screen reader on native through AccessKit (to verify as a dependency at S08; not currently in the workspace), captions for audio cues, one-handed navigation (everything reachable with D-pad plus select plus back).

## Platform matrix

| target | window | GPU | input | proof |
| --- | --- | --- | --- | --- |
| Windows 11 | winit fullscreen borderless | DX12 | gilrs (XInput), keyboard, mouse | agent-desktop screenshots of the running exe on the PC (RTX 4070) |
| Linux | winit Wayland and X11; runs as a gamescope-session client or compositor-hosted; `packaging/wayland` desktop file exists | Vulkan | gilrs/evdev, libinput | run on fr1 under a virtual display only labelled as such; real GPU run needs a Linux box with a GPU, none is in the fleet description, so Linux proof stays "headless, labelled" until one is provided |
| Chromium | canvas fullscreen API, wasm | WebGPU | Gamepad API, keyboard, touch | real Chrome 157 with GPU on the PC through claude-in-chrome, at aphrody.app |
| Android and Android TV | NativeActivity via `aphrody-android` | Vulkan | touch, gamepad, TV remote keys | emulator screenshots (labelled) then a device; TV banner and `LEANBACK_LAUNCHER` intent filter declared in the manifest |
| iOS | UIKit entry | Metal | touch, GameController | simulator screenshots (labelled); device proof requires hardware not in the fleet |

Mobile layout: portrait uses the companion patterns from recon (header = status and clock, launcher cards = actions, bottom tab bar from `docs/DESIGN_SYSTEM.md`), landscape reuses the `Switch` variant with touch targets of 48 dp; same Rust core, native chrome only at the safe-area edges.

## Data and offline

Schema in `schema.sql` (17 tables, STRICT, UTC unix ms, per-profile ownership by data-layer scope). Everything works offline: catalogue and covers are bundled or cached, store pages use the mock catalogue, nothing requires a network call. Web: SQLite over OPFS (exists in `aphrody-wasm/opfs.rs`), service worker caches wasm, atlas and fonts. Companion sync uses `sync_op` as an append-only journal (last writer wins).

## Interfaces (instead of a web API)

| surface | direction | content |
| --- | --- | --- |
| wasm exports | JS to Rust | `App::new(shell, w, h)`, `input(code)`, `pointer(x, y, kind)`, `resize`, `frame(dt)`, `set_atlas`, `set_locale`, `set_theme` (names follow the existing `console.rs` once it is committed) |
| JS imports | Rust to JS | glyph raster request, OPFS read/write, gamepad poll, fullscreen toggle |
| native app | process | CLI flags `--shell ps|switch|tv`, `--fps-cap`, `--hdr`, `--profile`; session mode for gamescope |
| companion | wire | existing `aphrody-core` wire and WebMCP tools: `library.list`, `profile.current`, `launch`, `remote.input` |
| launch | shell to OS | `launch_uri` (steam://, file, URL) through a `Launcher` trait per OS; never executes without a user select |
| webhooks, jobs | none | no accounts, payments or sync backend in scope |

## Performance and proof strategy

- Gates (CI on fr1, ci.yml): `cargo test` of core (focus, springs, layout, pacing; no GPU), wasm32 build of `gamescope-web-wasm` and `aphrody-wasm`, native build for x86_64-pc-windows-msvc and linux, `ay arch check --strict`, `bun fmt`, `bun check`. Perf gate in `crates/bench`: 500-tile scene, p99 under 8.33 ms on the reference machine; a swiftshader run is allowed only as a smoke test and labelled "software GPU, not a performance result".
- Real-GPU proof (required for every milestone after S05): real Chrome with GPU on the PC for WebGPU (frame histogram exported by the page, screenshots read with the image tool); DX12 and Vulkan builds launched through agent-desktop, screenshots taken and inspected, then one exercised interaction (D-pad move, open overlay, back) captured before and after. HTTP 200 is never proof.
- Pixel fidelity: reference captures stay in a local temp directory and are never committed; the repo stores our own golden renders and per-screen layout numbers (rects in dp), compared with the reference by SSIM locally; the report quotes the score and shows both images to the reviewer.
- Gemini Carbon review of this document and of each milestone, verdict archived in `docs/reviews`.

## Milestones (vertical slice first)

M0 slice, from recon (screens S01 to S05, flows F01, F02, F05, F10), in this order:

| step | screens | work | tables | proof |
| --- | --- | --- | --- | --- |
| S01 | login and profile picker | profile cards, add user, clock, power; wallpaper pass | profile, avatar | Chrome screenshot, focus move and confirm |
| S02 | profile overlay | overlay scope with focus restore | profile | open, back, focus returns |
| S03 | home, game row (Ps) | tab bar, hero, scale-up tile row, must-see block | game, library | tile focus scale spring, row scroll |
| S04 | home, tile row (Switch) | status bar, tile row, hints footer | controller, library | same, plus layout switch by token |
| S05 | round menu row | 8 to 10 original round icons, selection, badge | setting | down from S04, select an item |

Then:

1. M1 `Tv` variant on S03 and S04 (safe area, 12 column grid, left overlay nav), 120 fps histogram at 1080p and 4K in Chrome.
2. M2 `gamescope-native` Windows DX12 fullscreen, gamepad, store with SQLite, S11 library, S09 hub, S10 achievements.
3. M3 Linux Vulkan, gamescope-session and Wayland desktop entry.
4. M4 S06 to S08 store (mock catalogue), S15 search over `games.sqlite` FTS, S16 settings and S23-style option dialogs, i18n in five locales with CJK fonts.
5. M5 mobile (touch layout, Android, Android TV, iOS), companion screens S19, S20 patterns, remote pad.
6. M6 could-haves: S12 to S14, S17, S18, S21, S22; HDR polish, accessibility audit, offline service worker.
7. M7 fixes from replica-entrepreneur and replica-diff.

Out of scope, from features.csv: accounts, payments, sync backends, licensed art and sound, third-party service logos.

## Risks (ranked)

1. 120 fps with text and large art on integrated GPUs and mobile: atlas thrash and upload stalls. Mitigation: dirty-range uploads, one atlas upload per frame, tile art compression, perf gate in CI from S01.
2. Native text for CJK, RTL and shaping: no rasteriser dependency exists; a wrong pick costs a rewrite. Mitigation: decide at S06 behind the `gamescope-text` trait, keep the JS canvas path on the web.
3. Real-GPU proof coverage: no GPU Linux or iOS device in the fleet; Android needs an emulator. Mitigation: label every software or emulated run, never claim parity; ask for hardware when M3 and M5 land.
4. Clean-room fidelity versus "pixel-perfect": the reference art cannot be committed, so exact comparison is local only. Mitigation: layout numbers in dp captured from the Figma geometry, original icons and art, SSIM reported per screen.
5. Two parallel agents editing the same files (`console.rs`, `ui.rs`): conflicts and duplicate extraction. Mitigation: extraction only after their commits, path-scoped commits.
6. HDR and wgpu surface formats vary per OS; DX12 HDR on the PC is the only verifiable case.
7. Android TV Figma kit licence unstated: reference only, nothing redistributed; type scale to verify.
8. Web build size and start time on aphrody.app (wasm plus fonts plus catalogue): range-fetched SQLite, split fonts per locale, streaming compile.
9. Licence checks pending: Material Symbols, Noto CJK, chosen text and audio crates.
