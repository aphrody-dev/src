# ArtCraft (storytold): features, API, dependencies (read 2026-11-13)

Sources: getartcraft.com (browser capture), `gh api repos/storytold/{artcraft,artcraft-services}` (README, Cargo.toml, tree). Forks of 32 permissive repos live in aphrody-labs (`third_party/forks.txt`, owner `storytold`).

## What it is

- `storytold/artcraft` (Apache-2.0 and MIT license files at the root): "the IDE for artists", interactive AI image and video creation; desktop app built with Tauri 2.11.2 (workspace `Cargo.toml`), frontend in `frontend/`, Rust crates in `crates/` (`api_clients`, `desktop`, `lib`, `schema`, `testing`, `vendor`), docs in `_docs/` (`dev_setup.md`, `artcraft_omni_api.md`).
- getartcraft.com describes 17 native Craft Apps (pure Rust per the site; separate repos `photocraft`, `filmcraft`, `soundcraft`, ...) plus ArtCraft Studio. Conflict to keep in mind: the Studio uses Tauri (web view), the site's "not Electron or web views" applies to the Craft Apps.
- Home page capture: dark canvas-rendered page with a logo, navigation (Home, Studio, Resources, Wiki, Support, Craft Apps, Pricing, Launch App) and a Discord call to action. It exposes almost no DOM text and made no network request that the tool could read, so no design tokens or endpoints could be taken from it. One screenshot was saved: `C:\Users\aphro\AppData\Local\Temp\claude-chrome-screenshots-PFLJe9\screenshot-1794550474329-0.jpg` (temporary, not committed).

## Feature list (from the artcraft README)

Image to Location, 3D and 2D image compositing, Image to 3D mesh, character posing, scene blocking with kitbashing, character identity transfer, background removal, mixed asset crafting; text to image, prompted and canvas image editing, image to video. Demo media: user-attachments assets linked in the README, `storytold/github-media` (webp/gif), and the YouTube demo `kzvQMdg66Go`. Providers listed include Grok and Midjourney besides ArtCraft's own catalog.

## Public API

- Hosted API base named in `artcraft-services` README: `https://api.storyteller.ai` (service `storyteller-web`: Rust, Actix Web, Tokio; auth, accounts, media, generation requests, job status, credits, Stripe).
- API description: `artcraft/_docs/artcraft_omni_api.md` (not yet read in this session). `artcraft-services` license is NOASSERTION: not forked.
- No endpoint was called; nothing here is verified against the live service.

## Low-level dependencies seen

From the root `Cargo.toml` of artcraft (79 top-level entries; only the matched ones listed): tauri 2.11.2 (+ plugins dialog, fs, log, upload), tokio 1.50, reqwest 0.12.23 (rustls, http2), serde 1.0.228, serde_json 1.0.149. No wgpu, bevy or ffmpeg entry matched at the root workspace level; per-crate dependencies (media codecs, GPU) are not read yet.

## Absorption plan into src (ordered)

1. Read `_docs/artcraft_omni_api.md` and each Craft App's `Cargo.toml` (wgpu/winit/codec crates) with `gh api`; complete this file.
2. Run `just graph third_party/artcraft artcraft` on fr1 (graph recipe at justfile line 75) before choosing what to absorb.
3. Map overlaps with `crates/aphrody-design-*` and the Bevy fork set before any refactor; no code is moved yet.
4. Capture design-system tokens from the apps themselves (not the marketing site) once built on fr1.

## Update (read from the Cargo.toml of photocraft, filmcraft, soundcraft, craft-libs, craft-launcher)

- UI/GPU stack of the Craft Apps: egui 0.37 (+ egui_kittest for UI tests), pinned to `storytold/egui` rev `6d518fc7...` (egui, egui-winit, egui-wgpu, egui_glow, egui_extras, egui_system_font_provider, egui_inspection) and `storytold/winit` rev `a517b384...`; wgpu comes through egui-wgpu. Other crates: image 0.25, cpal 0.18 (soundcraft), kurbo 0.13 (craft-libs). Not the Bevy stack.
- Forks kept so the pinned revisions stay reachable: `aphrody-labs/egui` (registered in forks.txt), `aphrody-labs/storytold-winit` and `aphrody-labs/storytold-wgpu` (renamed because `winit` and `wgpu` already exist in aphrody-labs as upstream forks; not registered in forks.txt, because `fork-sync` derives the target name from the upstream basename and would sync the wrong repo).
- Omni API (`artcraft/_docs/artcraft_omni_api.md`): API-key auth (`artcraft_api_` prefix, key created at app.getartcraft.com, gated per account by staff), production base `https://api.storyteller.ai`, example path `POST /v1/omni_api/generate/video`; full reference at storyteller-docs.netlify.app (not read). No call was made.
- Not forked, no license: `crafthub`, `craft-contrib`, `craft-skills`, `craft-wiki`, `craft-launcher-assets`, `font-preview-service`, `craft-pr-review-tool`; `harfbuzz` is NOASSERTION; `winprint.rs` is a BSD-3-Clause fork of a third party.
- Consequence for the goal "flatten Storyteller + Craft + Bevy": the Craft Apps (egui/winit/wgpu) and Bevy (its own ECS and renderer on wgpu) share only wgpu and winit. A merge into one engine means choosing the UI layer (egui vs Bevy UI) and one pinned wgpu/winit pair; that decision is not made here.

## Omni API endpoint read (artcraft-services/_docs/omni_api/artcraft_omni_api.md)

- `POST /v1/omni_api/generate/video`, header `Authorization` with an `artcraft_api_` key, no cookies. Required body fields: `model` (e.g. `seedance_2p0`), `idempotency_token` (UUID). Optional: `prompt`, `duration_seconds`, `aspect_ratio` (`wide_sixteen_by_nine`, `tall_nine_by_sixteen`, `square`), `negative_prompt`, `resolution` (`seven_twenty_p`, `ten_eighty_p`), `generate_audio`, URL inputs (`start_frame_image_url`, `end_frame_image_url`, `reference_image_urls`, `reference_video_urls` mp4, `reference_audio_urls`) or the `*_media_token` equivalents.
- storyteller-docs.netlify.app is rendered client-side: a text fetch returned only the title, so the other endpoints are not captured. Not called live.
- Hygiene finding: the file tree of `artcraft-services` lists `.env` and `secrets` at the root of a public repository. Not opened; the owner of that repository should check them.

## Full public API reference (storyteller-docs.netlify.app, read in the browser 2026-11-13)

- Spec: `storyteller-web` 0.0.1, OpenAPI 3.1.0, served as `/api.json` on that site; 258 paths, 268 operations. Not copied into this repository.
- Largest tag groups (operation counts): Moderation 37, Media Files 20, Omni Gen 15, Tags 13, Users 10, Media Files (Upload) 10, Generate Video (Multi-Function) 10, Generate Videos 9, Folders 8, Media Files (Projects) 8, Omni API 7, Generate Images (Multi-Function) 7, Generate Images 6, Jobs 6. The tag list returned by the page was truncated after "Web Referrals", so later tags are not listed here.
- Omni API (7): `POST /v1/omni_api/generate/image`, `POST /v1/omni_api/generate/video`, `GET /v1/omni_api/job_status/batch`, `GET /v1/omni_api/job_status/job/{token}`, `POST /v1/omni_api/upload/{audio,image,video}`.
- MCP sessions (5): `POST /v1/mcp/session/create`, `GET /v1/mcp/session/list`, `POST /v1/mcp/session/refresh`, `POST /v1/mcp/session/revoke`, `POST /v1/mcp/session/{token}/delete`.
- 3D: `POST /v1/conversion/enqueue_fbx_to_gltf`, `POST /v1/generate/object/hunyuan_2.0_image_to_3d`, `POST /v1/generate/object/hunyuan_2.1_image_to_3d`, `POST /v1/generate/splat/worldlabs_marble_0p1_mini`, `POST /v1/generate/splat/worldlabs_marble_0p1_plus`.
- API keys: `POST /v1/api_keys/create`, `GET /v1/api_keys/list`, `GET /v1/api_keys/{api_key_token}` (the secret is returned once at creation).
- Only the documentation site was read; no request was sent to `api.storyteller.ai`.
