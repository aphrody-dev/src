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
