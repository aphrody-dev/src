# Unified stack

Snapshot 2026-11-13. Every row read live with `gh api repos/<repo>` (stars, license field, pushed_at, releases/latest, else newest tag) except forgejo (Codeberg API). Decisions: adopt = consume upstream (fork kept as mirror), fork+flatten = fork then flatten into shared code (`ay flat`), reference = read only, no fork. Nothing here is built yet; no stub is rewritten. Constraint: non-OSI or partly proprietary licenses are reference only (AGENTS.md section 4).

## (a) Rust and TypeScript app frameworks and UI

| Repo                                           | Role                                    | Decision     | Target                     | State   | Stars  | License                                      | Pushed     | Release                        |
| ---------------------------------------------- | --------------------------------------- | ------------ | -------------------------- | ------- | ------ | -------------------------------------------- | ---------- | ------------------------------ |
| emilk/egui                                     | Immediate-mode tools UI, editors        | adopt        | third_party/egui           | missing | 32258  | Apache-2.0                                   | 2026-11-12 | 0.37.0                         |
| iced-rs/iced                                   | Retained Elm-style UI, COSMIC base      | adopt        | third_party/iced           | missing | 32022  | MIT                                          | 2026-11-12 | 0.14.0                         |
| longbridge/gpui-kit                            | GPUI component set                      | fork+flatten | third_party/gpui-component | in repo | 20567  | Apache-2.0 (LICENSE-APACHE)                  | 2026-11-13 | v0.9.1                         |
| zed-industries/zed                             | GPUI source (UI runtime)                | adopt        | third_party/zed            | in repo | 94888  | Apache-2.0 (gpui crate) + GPL/AGPL elsewhere | 2026-11-13 | v1.28.1                        |
| bevyengine/bevy                                | Game engine, ECS, web via wgpu          | adopt        | third_party/bevy           | in repo | 49720  | Apache-2.0                                   | 2026-11-13 | v0.20.1                        |
| tauri-apps/tauri                               | Webview shell, desktop and mobile       | adopt        | third_party/tauri          | missing | 112871 | Apache-2.0                                   | 2026-11-12 | tauri-v3.0.0-alpha.6           |
| DioxusLabs/dioxus                              | Rust React-like, web+desktop+mobile     | adopt        | third_party/dioxus         | in repo | 39751  | Apache-2.0                                   | 2026-11-11 | v0.7.10                        |
| slint-ui/slint                                 | Declarative UI, embedded and desktop    | reference    | third_party/slint          | missing | 24577  | GPL-3.0 / royalty-free / commercial          | 2026-11-13 | v1.18.1                        |
| DioxusLabs/blitz                               | Native HTML/CSS renderer                | adopt        | third_party/blitz          | in repo | 4456   | Apache-2.0                                   | 2026-11-13 | v0.3.0-beta.4 (tag)            |
| webui-dev/webui                                | Use any browser as GUI                  | reference    | third_party/webui          | in repo | 4654   | MIT                                          | 2026-10-28 | nightly (tag)                  |
| leptos-rs/leptos                               | Rust full-stack web                     | reference    | third_party/leptos         | missing | 21511  | MIT                                          | 2026-11-12 | v0.8.23                        |
| linebender/xilem                               | Rust UI, Vello renderer                 | reference    | third_party/xilem          | missing | 5605   | Apache-2.0                                   | 2026-11-03 | v0.4.0                         |
| ratatui/ratatui                                | TUI                                     | adopt        | third_party/ratatui        | in repo | 23257  | MIT                                          | 2026-11-12 | ratatui-v0.30.2                |
| vercel-labs/native                             | Owner-named Vercel Labs native UI       | reference    | third_party/native         | in repo | 7844   | Apache-2.0                                   | 2026-11-11 | v0.11.1                        |
| microsoft/webui                                | Microsoft WebUI (owner-named)           | reference    | third_party/webui-ms       | in repo | 102    | MIT                                          | 2026-11-13 | v3.1.1                         |
| vercel/turborepo                               | Monorepo task runner (Rust)             | adopt        | third_party/turborepo      | in repo | 31333  | MIT                                          | 2026-11-13 | v2.11.11                       |
| vercel/next.js                                 | React web framework                     | adopt        | third_party/next.js        | missing | 143498 | MIT                                          | 2026-11-13 | v16.4.6                        |
| vercel/ai                                      | AI SDK (TypeScript)                     | adopt        | third_party/ai             | in repo | 27907  | Apache-2.0 (LICENSE)                         | 2026-11-13 | @ai-sdk/zai@3.0.54             |
| cloudflare/vinext                              | Next.js API on Vite, Workers target     | adopt        | third_party/vinext         | missing | 9361   | MIT                                          | 2026-11-13 | @vinext/cloudflare@1.3.4       |
| vercel-labs/ui                                 | Owner-named Vercel Labs UI              | reference    | third_party/vercel-labs-ui | missing | 2516   | Apache-2.0                                   | 2026-11-12 | @ui-sdk/web@0.1.0-beta.1 (tag) |
| mui/base-ui                                    | Unstyled React components (owner-named) | adopt        | third_party/base-ui        | missing | 11402  | MIT                                          | 2026-11-13 | v1.9.0                         |
| expo/expo                                      | React Native toolchain                  | reference    | third_party/expo           | missing | 53506  | MIT                                          | 2026-11-13 | expo-template-tabs@58.0.34     |
| shadcn-ui/ui                                   | Component distribution (owner-named)    | reference    | third_party/shadcn-ui      | missing | 128072 | MIT                                          | 2026-11-12 | shadcn@4.23.0                  |
| react/react-native (was facebook/react-native) | Native mobile via React                 | reference    | third_party/react-native   | missing | 126908 | MIT                                          | 2026-11-12 | v0.88.1                        |
| pop-os/cosmic-epoch                            | COSMIC desktop meta repo                | reference    | third_party/cosmic-epoch   | missing | 7011   | unverified (no LICENSE at root)              | 2026-10-20 | epoch-1.11.0                   |
| niri-wm/niri                                   | Scrollable-tiling Wayland compositor    | reference    | third_party/niri           | missing | 29038  | GPL-3.0                                      | 2026-11-13 | v26.04                         |
| tailwindlabs/tailwindcss                       | CSS engine (owner-named)                | adopt        | third_party/tailwindcss    | missing | 98587  | MIT                                          | 2026-11-11 | v4.3.5                         |

### Pick per surface

| Surface                          | Pick                                          | Fallback                      |
| -------------------------------- | --------------------------------------------- | ----------------------------- |
| Game, open world, WebGPU 120 fps | Bevy on wgpu                                  | none                          |
| Desktop apps                     | GPUI + gpui-kit (Rust, GPU)                   | iced (COSMIC), egui for tools |
| Web                              | Next.js + vinext (Workers), Base UI, Tailwind | Dioxus web, Leptos reference  |
| Mobile                           | Tauri mobile or Dioxus                        | React Native/Expo reference   |
| CLI/TUI                          | ratatui                                       | none                          |
| Agentic                          | ai (AI SDK) + packages/ai-os                  | none                          |
| Native HTML renderer             | Blitz                                         | Tauri webview                 |

## (b) wasm, wgpu, WebGPU tooling

| Repo                       | Role                                           | Decision  | Target                   | State   | Stars  | License           | Pushed     | Release                           |
| -------------------------- | ---------------------------------------------- | --------- | ------------------------ | ------- | ------ | ----------------- | ---------- | --------------------------------- |
| wasm-bindgen/wasm-bindgen  | Rust/JS bindings for wasm                      | adopt     | third_party/wasm-bindgen | missing | 9227   | Apache-2.0        | 2026-11-13 | 0.2.130                           |
| trunk-rs/trunk             | Rust wasm app bundler                          | adopt     | third_party/trunk        | missing | 4428   | Apache-2.0        | 2026-11-10 | v0.22.1                           |
| gfx-rs/wgpu                | Rust WebGPU implementation                     | adopt     | third_party/wgpu         | in repo | 18529  | Apache-2.0        | 2026-11-12 | v30.0.2                           |
| gfx-rs/naga                | Shader translator (now inside wgpu) (archived) | reference | third_party/wgpu         | in repo | 1566   | MIT OR Apache-2.0 | 2023-11-09 | v0.14.0                           |
| drager/wasm-pack           | Rust to npm wasm packaging                     | reference | third_party/wasm-pack    | missing | 0      | MIT (LICENSE-MIT) | 2026-05-11 | none                              |
| mrdoob/three.js            | WebGPU renderer (TSL)                          | adopt     | third_party/three.js     | in repo | 118271 | MIT               | 2026-11-12 | r187                              |
| BabylonJS/Babylon.js       | WebGPU engine                                  | reference | third_party/babylonjs    | missing | 26336  | Apache-2.0        | 2026-11-13 | 9.36.0                            |
| google/dawn                | Chromium WebGPU native impl                    | adopt     | third_party/dawn         | in repo | 1210   | BSD-3-Clause      | 2026-11-13 | v20261111.144539                  |
| playcanvas/engine          | WebGPU engine                                  | reference | third_party/playcanvas   | missing | 17281  | MIT               | 2026-11-13 | v2.24.1                           |
| WebAssembly/binaryen       | wasm-opt                                       | adopt     | third_party/binaryen     | missing | 8679   | Apache-2.0        | 2026-11-12 | version_133                       |
| WebAssembly/wabt           | wasm text/binary tools                         | reference | third_party/wabt         | missing | 8201   | Apache-2.0        | 2026-11-11 | 1.0.42                            |
| emscripten-core/emscripten | C/C++ to wasm                                  | adopt     | third_party/emscripten   | missing | 27772  | MIT + NCSA        | 2026-11-13 | 7.0.0                             |
| gpuweb/gpuweb              | WebGPU specification                           | adopt     | third_party/gpuweb       | in repo | 5531   | W3C Software      | 2026-11-10 | WGSLv1 (tag)                      |
| bytecodealliance/wasmtime  | wasm runtime (Rust)                            | adopt     | third_party/wasmtime     | missing | 18851  | Apache-2.0        | 2026-11-13 | v50.0.1                           |
| wasmerio/wasmer            | wasm runtime (Rust)                            | reference | third_party/wasmer       | missing | 21242  | MIT               | 2026-11-13 | v7.5.0                            |
| rolldown/rolldown          | Rolldown (Rust bundler, new org)               | adopt     | third_party/rolldown     | missing | 14036  | MIT               | 2026-11-13 | v1.3.2                            |
| bytecodealliance/jco       | JS component toolchain                         | reference | third_party/jco          | missing | 1017   | Apache-2.0        | 2026-11-13 | jco-v1.41.0                       |
| oxc-project/oxc            | Parser, linter, transformer (Rust)             | adopt     | third_party/oxc          | missing | 23448  | MIT               | 2026-11-13 | oxlint_v1.93.0                    |
| gfx-rs/wgpu-native         | wgpu C API                                     | reference | third_party/wgpu-native  | missing | 1434   | Apache-2.0        | 2026-10-26 | v29.0.1.1                         |
| web-infra-dev/rspack       | Rspack (Rust bundler)                          | reference | third_party/rspack       | missing | 12981  | MIT               | 2026-11-13 | v2.3.2                            |
| vitejs/vite                | Dev server and bundler                         | adopt     | third_party/vite         | missing | 83899  | MIT               | 2026-11-13 | v8.3.8                            |
| gpuweb/cts                 | WebGPU conformance                             | adopt     | third_party/gpuweb-cts   | in repo | 182    | BSD-3-Clause      | 2026-11-12 | keepalive-for-dawn-e3950cb9 (tag) |

## (c) Workspace, Office, creative suites

| Repo                      | Role                                 | Decision     | Target                  | State   | Stars  | License                  | Pushed     | Release                                      |
| ------------------------- | ------------------------------------ | ------------ | ----------------------- | ------- | ------ | ------------------------ | ---------- | -------------------------------------------- |
| nextcloud/server          | Files, groups, calendar, contacts    | adopt        | infra/docker (image)    | missing | 37502  | AGPL-3.0                 | 2026-11-13 | v33.0.11                                     |
| CollaboraOnline/online    | LibreOffice Online                   | adopt        | infra/docker (image)    | missing | 3397   | MPL-2.0                  | 2026-11-12 | 25.04.7-mobile                               |
| ONLYOFFICE/DocumentServer | OOXML collaborative editors          | adopt        | infra/docker (image)    | missing | 7123   | AGPL-3.0                 | 2026-10-26 | v10.0.0                                      |
| allotropia/zetajs         | LibreOffice in browser (WASM)        | reference    | third_party/zetajs      | missing | 230    | MIT                      | 2026-04-01 | v1.2.0                                       |
| opencloud-eu/opencloud    | File sync and share (Go)             | adopt        | infra/docker (image)    | missing | 6328   | Apache-2.0               | 2026-11-13 | v9.1.0                                       |
| excalidraw/excalidraw     | Whiteboard                           | adopt        | third_party/excalidraw  | missing | 135607 | MIT                      | 2026-11-12 | v0.18.1                                      |
| penpot/penpot             | Design and prototyping               | adopt        | infra/docker (image)    | missing | 62314  | MPL-2.0                  | 2026-11-13 | 2.19.1                                       |
| toeverything/AFFiNE       | Docs, whiteboard, DB                 | adopt        | infra/docker (image)    | missing | 74501  | MIT + non-OSS portions   | 2026-11-13 | v0.27.4                                      |
| LibreOffice/core          | LibreOffice core (wasm port)         | reference    | third_party/libreoffice | missing | 4632   | GPL-3.0                  | 2026-11-13 | windows_build_successful_2011_11_08 (tag)    |
| tldraw/tldraw             | Canvas SDK                           | reference    | third_party/tldraw      | missing | 51401  | tldraw license (non-OSI) | 2026-11-13 | v5.6.0                                       |
| stalwartlabs/stalwart     | Mail and collaboration server (Rust) | reference    | infra/docker (image)    | missing | 15893  | AGPL-3.0 + SEL (non-OSI) | 2026-11-10 | v1.1.0                                       |
| jitsi/jitsi-meet          | Video meetings                       | reference    | infra/docker (image)    | missing | 30228  | Apache-2.0               | 2026-11-13 | stable/jitsi-meet_11248                      |
| livekit/livekit           | WebRTC SFU (Go)                      | adopt        | infra/docker (image)    | missing | 22183  | Apache-2.0               | 2026-11-13 | v1.13.11                                     |
| immich-app/immich         | Photos and video                     | adopt        | infra/docker (image)    | missing | 119061 | AGPL-3.0                 | 2026-11-12 | v3.4.1                                       |
| KDE/krita                 | Painting                             | reference    | none (desktop app)      | missing | 10739  | GPL-3.0                  | 2026-11-13 | v42.0-beta2 (tag)                            |
| GNOME/gimp                | Raster editor                        | reference    | none (desktop app)      | missing | 6583   | GPL-3.0                  | 2026-11-13 | soc-2012-unified-transform-before-gsoc (tag) |
| inkscape/inkscape         | Vector editor                        | reference    | none (desktop app)      | missing | 4121   | GPL (COPYING)            | 2022-03-03 | none                                         |
| Ardour/ardour             | DAW                                  | reference    | none (desktop app)      | missing | 5425   | GPL-2.0                  | 2026-11-12 | sae-rc1 (tag)                                |
| audacity/audacity         | Audio editor                         | reference    | none (desktop app)      | missing | 19039  | GPL-3.0                  | 2026-11-12 | Audacity-4.0.2                               |
| OpenShot/openshot-qt      | Video editor                         | reference    | none (desktop app)      | missing | 6776   | GPL-3.0                  | 2026-11-13 | v4.1.1                                       |
| blender/blender           | 3D, video, sculpt                    | reference    | none (desktop app)      | missing | 21939  | GPL-3.0+                 | 2026-11-12 | v5.3.0 (tag)                                 |
| KDE/kdenlive              | Video editor                         | reference    | none (desktop app)      | missing | 6099   | GPL-3.0                  | 2026-11-13 | v26.08.3 (tag)                               |
| darktable-org/darktable   | RAW workflow                         | reference    | none (desktop app)      | missing | 13440  | GPL-3.0                  | 2026-11-13 | release-5.6.2                                |
| olive-editor/olive        | Video editor                         | reference    | none (desktop app)      | missing | 9156   | GPL-3.0                  | 2024-12-05 | continuous (tag)                             |
| viliusle/miniPaint        | Browser image editor (Photopea alt)  | fork+flatten | third_party/miniPaint   | missing | 3497   | MIT                      | 2026-11-09 | v4.14.3                                      |
| AppFlowy-IO/AppFlowy      | Notion alt (Flutter and Rust)        | reference    | none                    | missing | 78832  | AGPL-3.0                 | 2026-11-02 | 0.15.0                                       |

## (d) Games, emulation, stores, shell

| Repo                                      | Role                                | Decision     | Target                     | State   | Stars  | License                      | Pushed     | Release                   |
| ----------------------------------------- | ----------------------------------- | ------------ | -------------------------- | ------- | ------ | ---------------------------- | ---------- | ------------------------- |
| EmulatorJS/EmulatorJS                     | libretro cores in browser           | fork+flatten | third_party/EmulatorJS     | missing | 4334   | GPL-3.0                      | 2026-10-21 | v4.2.3                    |
| libretro/RetroArch                        | libretro frontend                   | reference    | third_party/RetroArch      | missing | 14603  | GPL-3.0                      | 2026-11-13 | v1.22.2                   |
| caiiiycuk/js-dos                          | DOSBox wasm                         | reference    | third_party/js-dos         | missing | 1347   | GPL-2.0 (package.json)       | 2026-11-12 | v8.5.4                    |
| ruffle-rs/ruffle                          | Flash emulator (Rust, wasm)         | adopt        | third_party/ruffle         | missing | 18855  | MIT OR Apache-2.0            | 2026-11-13 | v0.7.1                    |
| scummvm/scummvm                           | Adventure engines                   | reference    | third_party/scummvm        | missing | 2890   | GPL-3.0                      | 2026-11-13 | v2026.4.0                 |
| dosbox-staging/dosbox-staging             | DOS emulator                        | reference    | none                       | missing | 1839   | GPL-2.0+                     | 2026-11-03 | v0.83.0                   |
| copy/v86                                  | x86 PC emulator in wasm             | adopt        | third_party/v86            | missing | 23681  | BSD-2-Clause                 | 2026-10-30 | latest (tag)              |
| HeyPuter/puter                            | Web OS shell                        | reference    | third_party/puter          | missing | 44162  | AGPL-3.0                     | 2026-11-13 | 26.11                     |
| dolphin-emu/dolphin                       | GameCube/Wii (no official web port) | reference    | none                       | missing | 15815  | GPL-2.0+                     | 2026-11-13 | nJoy (tag)                |
| NetrisTV/ws-scrcpy                        | Android screen in browser           | reference    | third_party/ws-scrcpy      | missing | 2615   | MIT                          | 2026-10-31 | v0.8.1                    |
| Genymobile/scrcpy                         | Android mirror                      | reference    | none                       | missing | 154703 | Apache-2.0                   | 2026-11-12 | v5.0.1                    |
| container2wasm/container2wasm             | Containers as wasm                  | adopt        | third_party/container2wasm | missing | 2819   | Apache-2.0                   | 2026-11-10 | v0.8.5                    |
| waydroid/waydroid                         | Android container on Linux          | reference    | none                       | missing | 12517  | GPL-3.0                      | 2026-10-16 | 1.6.3                     |
| ValveSoftware/Proton                      | Official Windows-on-Linux layer     | adopt        | third_party/Proton         | in repo | 33272  | BSD-3-Clause + per-component | 2026-11-13 | proton-11.0-2             |
| pcsx-redux/pcsx-redux                     | PlayStation 1                       | reference    | none                       | missing | 1045   | GPL-2.0                      | 2026-11-13 | none                      |
| DustinBrett/daedalOS                      | Desktop in browser                  | reference    | third_party/daedalOS       | missing | 13102  | MIT                          | 2026-10-22 | none                      |
| udevbe/greenfield                         | Wayland compositor in browser       | fork+flatten | third_party/greenfield     | missing | 1287   | AGPL-3.0                     | 2026-11-12 | 1.0.0-rc1 (tag)           |
| Heroic-Games-Launcher/HeroicGamesLauncher | Epic/GOG launcher                   | reference    | third_party/heroic         | missing | 12621  | GPL-3.0                      | 2026-11-13 | v2.22.4                   |
| lutris/lutris                             | Game launcher                       | reference    | none                       | missing | 10381  | GPL-3.0                      | 2026-11-13 | v0.5.22                   |
| bottlesdevs/Bottles                       | Wine prefixes                       | reference    | none                       | missing | 9076   | GPL-3.0                      | 2026-11-12 | 67.6                      |
| flatpak/flatpak                           | Flatpak runtime                     | reference    | none                       | missing | 5110   | LGPL-2.1                     | 2026-11-12 | 1.18.4                    |
| Open-Wine-Components/umu-launcher         | Unified Proton launcher             | reference    | none                       | in repo | 3839   | GPL-3.0                      | 2026-11-07 | 1.4.4                     |
| ValveSoftware/gamescope                   | Game micro-compositor               | adopt        | third_party/gamescope      | in repo | 5218   | BSD-2-Clause                 | 2026-11-11 | dmemcg-experimental (tag) |
| f-droid/fdroidclient                      | F-Droid client                      | fork+flatten | third_party/fdroidclient   | missing | 3279   | GPL-3.0                      | 2026-11-09 | 1.18.0                    |
| AppImage/appimagetool                     | AppImage packaging                  | reference    | none                       | missing | 456    | MIT                          | 2026-11-06 | continuous                |
| flathub/flathub                           | Flathub                             | reference    | none                       | missing | 1558   | LGPL-2.1                     | 2026-11-12 | none                      |
| f-droid/fdroidserver                      | F-Droid server tools                | fork+flatten | third_party/fdroidserver   | missing | 826    | AGPL-3.0                     | 2026-11-12 | 2.4.5 (tag)               |
| ImranR98/Obtainium                        | Install apps from release pages     | reference    | none                       | missing | 21498  | GPL-3.0                      | 2026-11-01 | v1.7.4                    |
| fastlane/fastlane                         | Play Console API upload (supply)    | reference    | none                       | missing | 42387  | MIT                          | 2026-11-13 | 2.241.2                   |
| Smithay/smithay                           | Wayland compositor library (Rust)   | adopt        | third_party/smithay        | in repo | 3382   | MIT                          | 2026-11-12 | v0.7.0                    |
| omacom/omarchy (was basecamp/omarchy)     | Omarchy                             | reference    | third_party/omarchy        | in repo | 46915  | MIT                          | 2026-11-13 | v4.5.0                    |
| pop-os/cosmic-comp                        | COSMIC compositor                   | reference    | none                       | missing | 841    | GPL-3.0                      | 2026-11-12 | epoch-1.11.0 (tag)        |

## (e) Infra, runtime, CI, observability

| Repo                                   | Role                          | Decision  | Target                  | State   | Stars | License                               | Pushed     | Release                        |
| -------------------------------------- | ----------------------------- | --------- | ----------------------- | ------- | ----- | ------------------------------------- | ---------- | ------------------------------ |
| vercel/vercel                          | Vercel CLI                    | reference | third_party/vercel      | in repo | 16584 | Apache-2.0                            | 2026-11-13 | @vercel/static-build@2.11.13   |
| cloudflare/workers-sdk                 | wrangler                      | adopt     | third_party/workers-sdk | in repo | 4720  | Apache-2.0                            | 2026-11-13 | wrangler@4.161.0               |
| opennextjs/opennextjs-cloudflare       | Next.js on Workers            | reference | none                    | missing | 1916  | MIT                                   | 2026-11-12 | @opennextjs/cloudflare@1.20.17 |
| coollabsio/coolify                     | Self-hosted PaaS              | adopt     | infra/docker (image)    | missing | 66020 | Apache-2.0                            | 2026-11-13 | v4.7.5                         |
| Dokploy/dokploy                        | Self-hosted PaaS              | reference | infra/docker (image)    | missing | 38473 | Apache-2.0 + proprietary portions     | 2026-11-13 | v0.31.2                        |
| dokku/dokku                            | Self-hosted PaaS              | reference | none                    | missing | 32226 | MIT                                   | 2026-11-13 | v0.38.34                       |
| cloudflare/pingora                     | Proxy framework (Rust)        | adopt     | third_party/pingora     | missing | 27900 | Apache-2.0                            | 2026-11-09 | 0.9.1                          |
| caddyserver/caddy                      | HTTP/3 server (Go)            | adopt     | third_party/caddy       | in repo | 79031 | Apache-2.0                            | 2026-11-11 | v2.11.9                        |
| traefik/traefik                        | Proxy (Go)                    | reference | none                    | missing | 65547 | MIT                                   | 2026-11-12 | v3.7.18                        |
| nginx/nginx                            | HTTP server                   | reference | none                    | missing | 32114 | BSD-2-Clause                          | 2026-11-09 | release-1.31.8                 |
| moby/buildkit                          | BuildKit                      | adopt     | third_party/buildkit    | missing | 10416 | Apache-2.0                            | 2026-11-12 | v0.35.0                        |
| moby/moby                              | Docker engine                 | reference | none                    | missing | 72262 | Apache-2.0                            | 2026-11-12 | docker-v29.9.3                 |
| youki-dev/youki                        | OCI runtime (Rust)            | adopt     | third_party/youki       | missing | 7677  | Apache-2.0                            | 2026-11-12 | v0.7.0                         |
| containerd/containerd                  | Runtime                       | adopt     | third_party/containerd  | missing | 21478 | Apache-2.0                            | 2026-11-12 | v2.4.2                         |
| railwayapp/railpack                    | Zero-config image builds      | reference | none                    | missing | 1269  | MIT                                   | 2026-11-12 | v0.43.0                        |
| nektos/act                             | Run GitHub Actions locally    | adopt     | third_party/act         | missing | 72677 | MIT                                   | 2026-11-04 | v0.2.97                        |
| buildbarn/bb-storage                   | Remote cache/execution        | reference | none                    | missing | 200   | Apache-2.0                            | 2026-11-12 | 20261112T085002Z-8d2acac       |
| TraceMachina/nativelink                | Remote cache/execution (Rust) | reference | third_party/nativelink  | missing | 1640  | FSL-1.1 (non-OSI)                     | 2026-11-13 | v1.8.5                         |
| NixOS/nix                              | Nix                           | adopt     | third_party/nix         | missing | 18017 | LGPL-2.1                              | 2026-11-12 | 2.35.6 (tag)                   |
| bazelbuild/bazel                       | Build system                  | reference | none                    | missing | 26092 | Apache-2.0                            | 2026-11-13 | 9.3.2                          |
| dagger/dagger                          | Programmable CI               | reference | none                    | missing | 16609 | Apache-2.0                            | 2026-11-13 | v0.21.11                       |
| woodpecker-ci/woodpecker               | CI                            | adopt     | infra/docker (image)    | missing | 8185  | Apache-2.0                            | 2026-11-12 | v3.20.1                        |
| open-telemetry/opentelemetry-collector | Telemetry pipeline            | adopt     | infra/docker (image)    | missing | 7764  | Apache-2.0                            | 2026-11-13 | v0.165.0                       |
| grafana/grafana                        | Dashboards                    | adopt     | infra/docker (image)    | missing | 77873 | AGPL-3.0                              | 2026-11-13 | v13.3.1                        |
| prometheus/prometheus                  | Metrics                       | reference | infra/docker (image)    | missing | 67598 | Apache-2.0                            | 2026-11-13 | v3.16.0                        |
| VictoriaMetrics/VictoriaMetrics        | Metrics store                 | adopt     | infra/docker (image)    | missing | 18106 | Apache-2.0                            | 2026-11-13 | v1.156.0                       |
| openobserve/openobserve                | Logs, metrics, traces (Rust)  | reference | infra/docker (image)    | missing | 23045 | AGPL-3.0                              | 2026-11-13 | v1.2.0-rc2                     |
| meta/buck2 (was facebook/buck2)        | Build system (Rust)           | reference | third_party/buck2       | missing | 4528  | Apache-2.0                            | 2026-11-13 | latest (tag)                   |
| SigNoz/signoz                          | APM                           | reference | none                    | missing | 32619 | MIT + EE portions                     | 2026-11-13 | v0.149.0                       |
| vectordotdev/vector                    | Log pipeline (Rust)           | adopt     | infra/docker (image)    | missing | 22888 | MPL-2.0                               | 2026-11-12 | v0.61.0                        |
| forgejo/forgejo (codeberg.org)         | Git forge                     | adopt     | infra/docker (image)    | missing | 5820  | GPL-3.0-or-later (not exposed by API) | 2026-11-12 | v17.0.1                        |

## Registry versions (crates.io API, `bun pm view`)

| Package                    | Latest                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------- |
| crate gpui-component       | 0.9.1 (newest 0.9.1, upd 2026-11-09, dl 561428)                                                       |
| crate xilem                | 0.4.0 (newest 0.4.0, upd 2025-10-29, dl 12912)                                                        |
| crate wasm-pack            | 0.15.1 (newest 0.15.1, upd 2026-10-30, dl 6867876)                                                    |
| crate egui                 | 0.37.0 (newest 0.37.0, upd 2026-10-15, dl 31293225)                                                   |
| crate trunk                | 0.22.1 (newest 0.22.1, upd 2026-10-26, dl 1291715)                                                    |
| crate slint                | 1.18.1 (newest 1.18.1, upd 2026-09-21, dl 2502799)                                                    |
| crate wasmer               | 7.5.0 (newest 7.5.0, upd 2026-10-01, dl 8996484)                                                      |
| crate pingora              | 0.9.1 (newest 0.9.1, upd 2026-11-03, dl 10022580)                                                     |
| crate gpui                 | 0.2.2 (newest 0.2.2, upd 2026-10-30, dl 487385)                                                       |
| crate gpui-kit             | 0.9.1 (newest 0.9.1, upd 2026-11-09, dl 355143)                                                       |
| crate iced                 | 0.14.0 (newest 0.14.0, upd 2025-12-07, dl 3330494)                                                    |
| crate youki                | 0.7.0 (newest 0.7.0, upd 2026-07-25, dl 16542)                                                        |
| crate smithay              | 0.7.0 (newest 0.7.0, upd 2025-06-24, dl 303368)                                                       |
| crate dioxus               | 0.7.10 (newest 0.8.0-alpha.3, upd 2026-10-16, dl 3695352)                                             |
| crate bevy                 | 0.20.1 (newest 0.20.1, upd 2026-10-28, dl 8855433)                                                    |
| crate naga                 | 30.0.2 (newest 30.0.2, upd 2026-11-12, dl 55080857)                                                   |
| crate ratatui              | 0.30.2 (newest 0.30.2, upd 2026-06-19, dl 70749573)                                                   |
| crate wgpu                 | 30.0.2 (newest 30.0.2, upd 2026-11-12, dl 50034479)                                                   |
| crate leptos               | 0.8.23 (newest 0.8.23, upd 2026-10-31, dl 6067771)                                                    |
| crate wasm-bindgen         | 0.2.130 (newest 0.2.130, upd 2026-10-30, dl 655995160)                                                |
| crate tauri                | 2.12.5 (newest 3.0.0-alpha.6, upd 2026-11-06, dl 44220449)                                            |
| crate wasmtime             | 50.0.1 (newest 51.0.0-rc.1, upd 2026-11-05, dl 44656607)                                              |
| npm three                  | { "version": "0.187.0", "license": "MIT", "time.modified": "2026-10-30T08:09:24.667Z" }               |
| npm @base-ui/react         | { "version": "1.9.0", "license": "MIT", "time.modified": "2026-10-09T08:52:44.362Z" }                 |
| npm vinext                 | { "version": "1.4.5", "license": "MIT", "time.modified": "2026-11-10T18:53:51.192Z" }                 |
| npm turbo                  | { "version": "2.11.11", "license": "MIT", "time.modified": "2026-11-12T17:45:35.162Z" }               |
| npm v86                    | { "version": "0.5.473", "license": "BSD-2-Clause", "time.modified": "2026-10-30T21:51:11.045Z" }      |
| npm dioxus                 | 404                                                                                                   |
| npm @webui-dev/webui       | 404                                                                                                   |
| npm @excalidraw/excalidraw | { "version": "0.18.1", "license": "MIT", "time.modified": "2026-11-12T16:10:58.773Z" }                |
| npm ai                     | { "version": "7.0.172", "license": "Apache-2.0", "time.modified": "2026-11-13T05:59:51.034Z" }        |
| npm emulators              | { "version": "8.5.3", "license": "GPL-2.0", "time.modified": "2026-11-10T13:46:01.370Z" }             |
| npm @rspack/core           | { "version": "2.3.2", "license": "MIT", "time.modified": "2026-11-10T11:34:46.460Z" }                 |
| npm playcanvas             | { "version": "2.24.1", "license": "MIT", "time.modified": "2026-11-13T02:27:51.396Z" }                |
| npm @emulatorjs/emulatorjs | { "version": "4.2.3", "license": "GPL-3.0", "time.modified": "2025-07-05T19:42:20.201Z" }             |
| npm @ruffle-rs/ruffle      | { "version": "0.7.1", "license": "(MIT OR Apache-2.0)", "time.modified": "2026-11-13T00:25:07.727Z" } |
| npm rolldown               | { "version": "1.3.2", "license": "MIT", "time.modified": "2026-11-11T12:27:52.015Z" }                 |
| npm @tauri-apps/cli        | { "version": "2.12.4", "license": "Apache-2.0 OR MIT", "time.modified": "2026-11-06T12:26:07.002Z" }  |
| npm @babylonjs/core        | { "version": "9.36.0", "license": "Apache-2.0", "time.modified": "2026-11-12T15:41:16.149Z" }         |
| npm vercel                 | { "version": "65.15.0", "license": "Apache-2.0", "time.modified": "2026-11-12T16:28:58.777Z" }        |
| npm binaryen               | { "version": "132.0.0", "license": "Apache-2.0", "time.modified": "2026-09-18T03:29:15.023Z" }        |
| npm tailwindcss            | { "version": "4.3.5", "license": "MIT", "time.modified": "2026-11-11T00:16:49.806Z" }                 |
| npm wrangler               | { "version": "4.161.0", "license": "MIT OR Apache-2.0", "time.modified": "2026-11-12T13:40:35.847Z" } |
| npm vite                   | { "version": "8.3.8", "license": "MIT", "time.modified": "2026-11-11T02:49:46.745Z" }                 |
| npm next                   | { "version": "16.4.6", "license": "MIT", "time.modified": "2026-11-12T23:58:34.159Z" }                |

## Conflicts between sources (2026-11-13)

| Item                                                    | Source A                                                                                                                                     | Source B                                                                                                                    | Applied                                            |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| longbridge/gpui-component                               | repo renamed to longbridge/gpui-kit (gh api full_name)                                                                                       | crate `gpui-component` 0.9.1 and `gpui-kit` 0.9.1 both published; third_party/gpui-component and forks.txt use the old name | track gpui-kit; skill `gpui-kit` already covers it |
| Zed license                                             | API license field NOASSERTION                                                                                                                | gpui crate Apache-2.0, other crates GPL/AGPL                                                                                | depend on gpui only                                |
| Dioxus                                                  | crates.io stable 0.7.10                                                                                                                      | newest 0.8.0-alpha.3                                                                                                        | pin 0.7.10                                         |
| Tauri                                                   | crates.io stable 2.12.5                                                                                                                      | newest 3.0.0-alpha.6                                                                                                        | pin 2.x                                            |
| wasmtime                                                | stable 50.0.1                                                                                                                                | newest 51.0.0-rc.1                                                                                                          | pin 50.0.1                                         |
| EmulatorJS                                              | repo active                                                                                                                                  | npm `@emulatorjs/emulatorjs` 4.2.3 last modified 2025-07-05                                                                 | use repo, not npm                                  |
| Renamed upstreams                                       | YaLTeR/niri, basecamp/omarchy, facebook/react-native, facebook/buck2, gfx-rs/naga                                                            | niri-wm/niri, omacom/omarchy, react/react-native, meta/buck2, naga archived and merged into wgpu                            | use new paths; naga is reference                   |
| Non-OSI or partly proprietary                           | tldraw, nativelink (FSL-1.1), Dokploy (proprietary portions), SigNoz (EE), Stalwart (SEL), Slint (GPL/commercial), AFFiNE (non-OSS portions) | AGENTS.md section 4                                                                                                         | reference or image only, no fork                   |
| Forgejo                                                 | no GitHub repo (404)                                                                                                                         | Codeberg API                                                                                                                | Codeberg is canonical, fork not created            |
| docs/crates/bun-flat/flat.toml                          | path named in the brief                                                                                                                      | actual file is crates/bun-flat/flat.toml                                                                                    | used the latter                                    |
| Photopea, Figma, Adobe, Google Workspace, Microsoft 365 | closed source                                                                                                                                | no upstream to adopt                                                                                                        | alternatives only in (c)                           |
| Steam, Epic, Google Play                                | no open implementation to adopt                                                                                                              | official APIs, Proton, launchers as links, Play Console API (fastlane supply)                                               | integration by API only                            |

## Forks created 2026-11-13

43 forks in aphrody-labs (all adopt and fork+flatten rows missing from forks.txt, OSI licenses only), listed in third_party/forks.txt. emilk/egui forked as aphrody-labs/egui-1 because aphrody-labs/egui already is storytold/egui. src.lock.json untouched: `just lock` is left to the fr1 timer.
