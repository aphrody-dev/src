# ArtCraft and the Craft Apps (storytold): what was read (2026-11-13)

Sources: getartcraft.com and storyteller-docs.netlify.app (read in a browser), `gh api repos/storytold/*` (README, `Cargo.toml`, trees, license files). Nothing was built or run, and no request was sent to the hosted API. What src does with this is in [PLAN.md](PLAN.md).

## Products

- getartcraft.com announces 17 native Craft Apps and ArtCraft Studio, free and open source, on macOS, Windows and Linux, with most apps also running in a browser through WebAssembly (FilmCraft excepted), a launcher that installs and updates them, and automation through a CLI, a JSON control channel or an MCP server.
- Status on the site: early alpha for PhotoCraft, PdfCraft, AniCraft, FigCraft and Craft Anything; in development for VectorCraft, FilmCraft, LightCraft, EffectCraft, DesignCraft, TextureCraft, MaterialCraft, SoundCraft, WordCraft, DeckCraft, CADCraft and GridCraft.
- The site says the apps are native Rust, "not Electron or web views". That holds for the Craft Apps (egui). ArtCraft Studio (`storytold/artcraft`) is a Tauri 2.11.2 application, which uses a web view.

## Repositories and licenses

| Group | Repositories | License | State in aphrody-labs |
| :--- | :--- | :--- | :--- |
| Studio | `artcraft` | `LICENSE-APACHE` and `LICENSE-MIT` at the root | forked; also checked out in `third_party/artcraft` at `83aad5eb` |
| Craft Apps | `photocraft`, `pdfcraft`, `filmcraft`, `vectorcraft`, `lightcraft`, `designcraft`, `effectcraft`, `gridcraft`, `cadcraft`, `deckcraft`, `soundcraft`, `wordcraft`, `figcraft`, `anicraft`, `texturecraft`, `materialcraft`, `craft-anything` | Apache-2.0 | forked |
| Shared | `craft-libs`, `craft-launcher`, `craft-fonts`, `craft-i18n`, `craft-extensions`, `craft-ai-integrations`, `indd-utils`, three `*-corpus` repositories | Apache-2.0 | forked |
| Other | `k4a-sys-temp`, `vits-finetuning`, `FineTrainers-Conditioning`, `discord-github-ticket-relay` | MIT or Apache-2.0 | forked |
| Pinned UI forks | `egui`, `winit`, `wgpu` (storytold forks of the upstream projects) | Apache-2.0 | `aphrody-labs/egui`, `aphrody-labs/storytold-winit`, `aphrody-labs/storytold-wgpu` |
| Backend | `artcraft-services` | "ArtCraft License (WIP)": fair source, private personal use | not forked (non-OSI, refused by `docs/ARCHITECTURE.md`) |
| No license | `storyteller-bevy`, `bevy-mocap`, `storyteller-ml`, the Unreal plugins (`CloudCamPlugin`, `EventCenterPlugin`, `ActorSpawningPlugin`), `crafthub`, `craft-contrib`, `craft-skills`, `craft-wiki`, `craft-launcher-assets`, `font-preview-service`, `craft-pr-review-tool` | none | not forked; `storyteller-bevy` is nevertheless pinned in `src.lock.json` (see PLAN.md, conflict 2) |

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

## Captures

- One screenshot of the home page was taken and left in the temporary directory of the browser tool; it is not in git. The home page shows a logo, a navigation bar and a Discord call to action.
- No screenshot or video of the applications themselves was captured. The demo media are linked from the `artcraft` README (GitHub attachments, `storytold/github-media`, one YouTube video); media files stored inside the forked repositories are preserved by the forks.
