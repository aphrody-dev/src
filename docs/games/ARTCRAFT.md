# ArtCraft and the Craft Apps (storytold): what was read (2026-11-13)

Sources: getartcraft.com and storyteller-docs.netlify.app (read in a browser), `gh api repos/storytold/*` (README, `Cargo.toml`, trees, license files). No request was sent to the hosted API. Four Craft Apps were built and run on fr1 on 2026-11-13 (section Captures). What src does with this is in [PLAN.md](PLAN.md).

## Products

- getartcraft.com announces 17 native Craft Apps and ArtCraft Studio, free and open source, on macOS, Windows and Linux, with most apps also running in a browser through WebAssembly (FilmCraft excepted), a launcher that installs and updates them, and automation through a CLI, a JSON control channel or an MCP server.
- Status on the site: early alpha for PhotoCraft, PdfCraft, AniCraft, FigCraft and Craft Anything; in development for VectorCraft, FilmCraft, LightCraft, EffectCraft, DesignCraft, TextureCraft, MaterialCraft, SoundCraft, WordCraft, DeckCraft, CADCraft and GridCraft.
- The site says the apps are native Rust, "not Electron or web views". That holds for the Craft Apps (egui). ArtCraft Studio (`storytold/artcraft`) is a Tauri 2.11.2 application, which uses a web view.

## Repositories and licenses

| Group           | Repositories                                                                                                                                                                                                                                                              | License                                                     | State in aphrody-labs                                                                              |
| :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| Studio          | `artcraft`                                                                                                                                                                                                                                                                | `LICENSE-APACHE` and `LICENSE-MIT` at the root              | forked; also checked out in `third_party/artcraft` at `83aad5eb`                                   |
| Craft Apps      | `photocraft`, `pdfcraft`, `filmcraft`, `vectorcraft`, `lightcraft`, `designcraft`, `effectcraft`, `gridcraft`, `cadcraft`, `deckcraft`, `soundcraft`, `wordcraft`, `figcraft`, `anicraft`, `texturecraft`, `materialcraft`, `craft-anything`                              | Apache-2.0                                                  | forked                                                                                             |
| Shared          | `craft-libs`, `craft-launcher`, `craft-fonts`, `craft-i18n`, `craft-extensions`, `craft-ai-integrations`, `indd-utils`, three `*-corpus` repositories                                                                                                                     | Apache-2.0                                                  | forked                                                                                             |
| Other           | `k4a-sys-temp`, `vits-finetuning`, `FineTrainers-Conditioning`, `discord-github-ticket-relay`                                                                                                                                                                             | MIT or Apache-2.0                                           | forked                                                                                             |
| Pinned UI forks | `egui`, `winit`, `wgpu` (storytold forks of the upstream projects)                                                                                                                                                                                                        | Apache-2.0                                                  | `aphrody-labs/egui`, `aphrody-labs/storytold-winit`, `aphrody-labs/storytold-wgpu`                 |
| Backend         | `artcraft-services`                                                                                                                                                                                                                                                       | "ArtCraft License (WIP)": fair source, private personal use | not forked (non-OSI, refused by `docs/ARCHITECTURE.md`)                                            |
| No license      | `storyteller-bevy`, `bevy-mocap`, `storyteller-ml`, the Unreal plugins (`CloudCamPlugin`, `EventCenterPlugin`, `ActorSpawningPlugin`), `crafthub`, `craft-contrib`, `craft-skills`, `craft-wiki`, `craft-launcher-assets`, `font-preview-service`, `craft-pr-review-tool` | none                                                        | not forked; `storyteller-bevy` is nevertheless pinned in `src.lock.json` (see PLAN.md, conflict 2) |

`third_party/forks.txt` holds 33 `storytold/` entries (32 repositories under Apache-2.0 or MIT, plus `egui`). `storytold-winit` and `storytold-wgpu` are not listed there: `fork-sync` derives the fork name from the upstream basename and would sync the upstream `winit` and `wgpu` forks instead.

## Stack of the Craft Apps (from `Cargo.toml` of photocraft, filmcraft, soundcraft, craft-libs, craft-launcher)

- egui 0.37.0 from `storytold/egui` at `6d518fc799681571963842f95b55a6b68431b15a` (egui, egui-winit, egui-wgpu, egui_glow, egui_extras, egui_kittest for UI tests), which depends on wgpu 30.0 and winit 0.30.13; winit comes from `storytold/winit` at `a517b3846ee8457d84ee4975110bfda6797c44dc`. Rust 1.95 or later.
- Other crates seen: image 0.25, cpal 0.18 (soundcraft), kurbo 0.13 (craft-libs).
- `craft-libs` is a Cargo workspace (edition 2024, resolver 3) of 114 crates named `craft-<name>`: file formats (psd, pdf, exr, heif, jpeg, tiff, webp, svg, raw, gif, tga, dpx, docx, xlsx, pptx, idml, dxf, epub, midi and others), media (`audio`, `video`, `captions`, `timeline`, `raster-codecs`, `stream-codecs`), and application plumbing (`ui`, `window`, `menu`, `keymap`, `settings`, `platform`, `font-catalog`, `font-manager`, `i18n`, `print`). Its README names one coordinated release, v0.1.0, as git tags, with crates.io publication deferred.
- ArtCraft Studio root workspace: tauri 2.11.2 with the dialog, fs, log and upload plugins, tokio 1.50, reqwest 0.12.23 (rustls, http2), serde 1.0.228. Per-crate dependencies of the Studio were not read.

## Design system

- There is no shared token file. `craft-ui` (in `craft-libs/crates/ui`) describes itself as small egui components "with application-supplied styles": `icons` (embedded SVG catalogs), `buttons`, `tabs`, `layout` (toolbar fitting, split geometry, resize handles, `Section` frames), `theme` (widget-state styling), `docking` (transactional panel moves and a docking surface), `printing`, `fonts` (one UI font stack and fallback order for every app) and `localized` number fields.
- Its README states that assets, complete themes, localization and command handling stay in each application, and that it covers nine apps (DesignCraft, VectorCraft, PhotoCraft, FilmCraft, EffectCraft, CADCraft, PDFCraft, LightCraft, SoundCraft).
- Its README also records an accessibility limit: stock resize bands are 4 pt thick and corners at most 12 pt, which does not meet a 24 by 24 logical-pixel target.
- The marketing site is drawn on a canvas and exposes almost no DOM text, so no colors, type scale or spacing could be read from it. Per-app themes were not read.

## Public API

- Reference: `storyteller-web` 0.0.1, OpenAPI 3.1.0, served as `/api.json` by storyteller-docs.netlify.app; 258 paths, 268 operations. The specification is not copied here.
- Hosts named by `artcraft/_docs/artcraft_omni_api.md`: production `https://api.storyteller.ai`, development `http://localhost:12345`.
- Largest groups by operation count: Moderation 37, Media Files 20, Omni Gen 15, Tags 13, Users 10, Media Files (Upload) 10, Generate Video (Multi-Function) 10, Generate Videos 9, Folders 8, Media Files (Projects) 8, Omni API 7, Generate Images (Multi-Function) 7, Generate Images 6, Jobs 6. The list returned by the page was cut after "Web Referrals".
- Omni API (API-key authentication, key prefix `artcraft_api_`, created in the web app and enabled per account by the vendor): `POST /v1/omni_api/generate/image`, `POST /v1/omni_api/generate/video`, `GET /v1/omni_api/job_status/batch`, `GET /v1/omni_api/job_status/job/{token}`, `POST /v1/omni_api/upload/{audio,image,video}`.
- `POST /v1/omni_api/generate/video`: required `model` and `idempotency_token` (UUID); optional `prompt`, `duration_seconds`, `aspect_ratio`, `negative_prompt`, `resolution`, `generate_audio`, and either URL inputs (`start_frame_image_url`, `end_frame_image_url`, `reference_image_urls`, `reference_video_urls`, `reference_audio_urls`) or the matching `*_media_token` fields.
- MCP sessions: `POST /v1/mcp/session/create`, `GET /v1/mcp/session/list`, `POST /v1/mcp/session/refresh`, `POST /v1/mcp/session/revoke`, `POST /v1/mcp/session/{token}/delete`.
- 3D: `POST /v1/conversion/enqueue_fbx_to_gltf`, `POST /v1/generate/object/hunyuan_2.0_image_to_3d`, `POST /v1/generate/object/hunyuan_2.1_image_to_3d`, `POST /v1/generate/splat/worldlabs_marble_0p1_mini`, `POST /v1/generate/splat/worldlabs_marble_0p1_plus`.
- API keys: `POST /v1/api_keys/create`, `GET /v1/api_keys/list`, `GET /v1/api_keys/{api_key_token}`.

## Features of the Studio (from the `artcraft` README)

Image to location, 3D and 2D image compositing, image to 3D mesh, character posing, scene blocking with kitbashing, character identity transfer, background removal, mixed asset crafting, text to image, prompted and canvas image editing, image to video. Providers named besides ArtCraft's own catalog include Grok and Midjourney.

## Captures (2026-11-13, fr1)

Release builds on fr1 (`cargo build --release -p <app>`, Rust 1.99.1, thin LTO and one codegen unit as set by each repository, target dir `/srv/build/craft/target`), run under Xvfb 1600x900x24 with Mesa llvmpipe through Vulkan (`WGPU_BACKEND=vulkan`, lavapipe ICD; the apps report "Software rasterizer detected", device `llvmpipe (LLVM 22.1.8)`). Files stay outside git in `/srv/artifacts/craft-captures/2026-11-13/` on fr1; the PNG files are also in R2, `r2:aphrody-assets/craft-captures/2026-11-13/` (listed with `rclone lsl`).

| App | Commit built | Binary (bytes) | Result |
| :--- | :--- | :--- | :--- |
| photocraft 0.23.1 | `e052eabf` | `photocraft` (120400936) | builds in 29 min 24 s, runs; GPU path falls back to CPU compositing and shows a "Switched to CPU rendering" dialog |
| filmcraft 0.20.1 | `a216b6e4` | `filmcraft` (83018672) | runs with its demo project; first build at `c504ddae` failed with `error: couldn't find file crates/vp8/src/lib.rs` (`filmcraft-vp8`), because a sync on fr1 merged `origin/main` into the checkout mid-build; rebuild at `a216b6e4` took 9 min 27 s |
| soundcraft 0.20.1 | `2bde8b9d` plus one local line | `soundcraft` (55669664) | upstream does not compile at `2bde8b9d`: `error[E0433]: cannot find type FileFormat in this scope` at `apps/soundcraft/src/main.rs:160:57` (`FileFormat::readable_extensions()`; line 156 already uses `craft_audio::DECODE_EXTENSIONS`). Built with that one call replaced by `craft_audio::DECODE_EXTENSIONS` in the fr1 checkout only (not pushed); runs, logs `no audio output: ALSA ... Host is down (112); using a silent clock` |
| craft-launcher (`artcraft-launcher`) | `66beafa5` | `artcraft-launcher` (37358488) | builds in 2 min 57 s, runs; fetches the app list from the ArtCraft API and GitHub |

Not captured: `craft-libs` alone (library), the `*-web` WebAssembly targets, any second screen of filmcraft, soundcraft and the launcher. The only input sent was in photocraft (click "Keep Using CPU", click "New file").

| File | Bytes | sha256 |
| :--- | ---: | :--- |
| `photocraft-home.png` | 57127 | `4b3b8fd9c5c653e1a178df75399661a500ee0cfb73fdeb9be1d7ff3bddef0200` |
| `photocraft-new-document-dialog.png` | 74563 | `047e4c71629036b08c274821c6081116e726fe3006c957b0ffb191fdf29f8408` |
| `filmcraft-home.png` | 194889 | `71369756915f72a6e85a0adf90451837a8325a80dd0f27da981ca23493d0034a` |
| `soundcraft-home.png` | 76808 | `f8b19ee532dceb30f8eabe01df28f1ca7e0097ecd420e545f33abade0453a73e` |
| `craft-launcher-home.png` | 159621 | `9d0f3dbb8ebe49b9b44e85389a603416da4cea298f54f2a64870075c6c1db223` |
| `photocraft.run.log` | 1887 | `2418d1d90fcad125bdba204862c80bcaf50be1479c5ff81dd69eeed09b0cf05b` |
| `filmcraft.run.log` | 5479 | `9b61dfdf2ef45bc6c358bea46364a5f63f42b91a7724ad8243a284c9497ec750` |
| `soundcraft.run.log` | 931 | `65da706f9bd019ada0fa3e2e1040fbba0c6f53ebc8ae885a8f2ca2df7b2e7738` |
| `craft-launcher.run.log` | 3855 | `8cb0f7ab93c49c7542afd18c8323e3598d0e92426f20dbcbb9b7c98cf50a20d6` |


## Theme tokens (read from source, default dark theme of each app)

Files: `crates/ui-egui/src/theme.rs` of each repository (soundcraft also `palette.rs`). There is no shared token file: each app defines its own `Tokens` struct, and the values are not synchronised. Colors are sRGB hex.

| Role | photocraft `ProMedium` (default; unlisted fields inherit `Pro`) | filmcraft `Dark` | soundcraft dark | craft-launcher `DARK` |
| :--- | :--- | :--- | :--- | :--- |
| App background | canvas `#282828` (inherited) | `#000000` | window `#1e1e1e` | bg `#121316` |
| Panel | chrome `#535353`, dock `#424242`, tab strip `#4a4a4a` | `#1d1d1d` | panel `#252526`, panel 2 `#2c2c2d` | sunken `#060607` |
| Field | `#454545`, border `#686868` | `#0e0e0e`, border `#303030` | button `#3a3a3c`, border `#141414` | line `#f2f1ee` at 15% |
| Text | `#eeeeee`, dim `#d4d4d4`, faint `#a0a0a0` | `#d1d1d1`, dim `#b0b0b0`, faint `#6e6e6e` | `#d6d6d6`, dim `#969698` | ink `#f2f1ee`, strong `#ffffff`, muted 60%, faint 38% |
| Accent | `#378ef0` (inherited, also primary) | `#2f6bdf`, hover `#3f7ce8`, focus `#5794ec` | `#4084c4`, dark `#285c92` | `#2d81ff`, text `#74aaff` |
| Separator | `#3e3e3e` | `#303030` | border light `#404042` | line 15%, strong 40% |
| Selected row | `#6b6b6b` | `#333333` | `#344660` | n/a |
| Danger / warning / success | `#ec5b62` / `#e8b046` (inherited) / n/a | `#dc513d` / n/a / `#2d9d78` | rec `#d6342e` / solo `#dec434` / on `#5cc46c` | bad `#ff6259` / warn `#ffc14d` / good `#3fd6b8` |
| Playhead | n/a | `#5895ec` | `#e83c32` | n/a |

Light counterpart of the launcher: bg `#f2f1ee`, sunken `#e9e8e4`, ink `#101014`, accent `#2d81ff`, accent text `#1659c4`, good `#0a7563`, warn `#8a5800`, bad `#b3261e`. photocraft ships 14 themes (`ThemeKind::ALL`: Pro, ProMedium, ProLightGray, ProLight, Studio, StudioLight, Classic, SolarizedDark, Adwaita, AdwaitaDark, BreezeLight, BreezeDark, SoftDark, SoftLight); filmcraft 3 (Dark, Medium, Light); soundcraft dark and light; the launcher system, dark, light.

| Metric | photocraft | filmcraft | soundcraft | craft-launcher |
| :--- | :--- | :--- | :--- | :--- |
| Body / button font size | 12.0 (Pro) or 12.5 | 12.0 (menus 13.0) | not set in `theme.rs` (egui defaults) | 14.0 / 13.5 medium |
| Small | 10.5 | 11.0 | n/a | 12.0 |
| Heading | 15.0 semibold | 15.0 semibold | n/a | 24.0 display (Archivo) |
| Monospace | 12.0 | 12.0 (timecode 16.0) | helper `mono(size)` | 13.0 (Geist Mono) |
| Item spacing | 8 x 6 | 6 x 4 (y 0 on the menu style) | 6 x 4 | 8 x 6 |
| Button padding | 10 x 4 | 8 x 3 | 6 x 2 | 12 x 6 |
| Control height | interact size 24 x 24 | 24 | n/a | 34 |
| Corner radius | sm 3, base 4, lg 6 | window 6, menu 6, sm 4, panels 0 | window 6, menu 4 | 0 everywhere |
| Gap / tab height | n/a | 4 / 32 | n/a | n/a |
| Fonts | Inter family (medium, semibold) | Inter and JetBrains Mono | proportional, bold, mono | Archivo, Inter, Geist Mono |

Source revisions: photocraft `e052eabf`, filmcraft `a216b6e4`, soundcraft `2bde8b9d`, craft-launcher `66beafa5`. Font names for photocraft and soundcraft were not confirmed in source beyond the family keys above.
