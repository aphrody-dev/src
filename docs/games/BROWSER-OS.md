# Browser OS (apps/aphrody, route /os)

State 2026-11-13. Code: `apps/aphrody/src/os/` (page.ts, build.ts, server.ts, vendor.ts, client/*). Texts: `packages/i18n` keys `os.*` (en, fr, zh-CN, ja, es). Pages: `/os` (en), `/os/fr`, `/os/zh-CN`, `/os/ja`, `/os/es`.

## What runs (verified in Chrome 157, workstation, local server)

| App       | Implementation                                                                                                                                                                                                                                                 | Checked                                                                                                                                              |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Launcher  | tiles on the WebGPU stage of `src/immersive` (a new `active()` option hands keys and gamepad to windows)                                                                                                                                                       | rendered, 140.7 fps                                                                                                                                  |
| Windows   | DOM window manager (drag, maximize, close, Esc), gamepad: d-pad or stick moves focus by position, A activates, B or Start closes                                                                                                                               | pointer and keyboard; gamepad code path not run with hardware                                                                                        |
| Library   | files in OPFS (File System Access picker, input fallback, drag and drop); type by extension routes to Linux, Flash or Emulator                                                                                                                                 | OPFS write and list, open to Flash                                                                                                                   |
| Linux     | v86 (x86 32-bit, WebAssembly) booting the Alpine 3.24.2 x86 ISO of the webos Worker through `/os/vm/alpine.iso`, or a user ISO                                                                                                                                 | SeaBIOS, ISOLINUX, OpenRC services started in the window                                                                                             |
| Flash     | Ruffle self-hosted, user SWF only                                                                                                                                                                                                                              | a Gnash test SWF (14 of 14 checks passed) rendered; test file not committed                                                                          |
| Emulator  | EmulatorJS loaded from `cdn.emulatorjs.org` after a click; core chosen from the ROM extension                                                                                                                                                                  | loader, UI, gambatte core and ROM blob fetched; no real game frame seen (no licensed test ROM available)                                             |
| Game      | existing `/play` page (Bevy wasm) in a same-origin frame                                                                                                                                                                                                       | launcher shown                                                                                                                                       |
| Store     | included components with licenses, Steam and Epic official links, open catalog `/os/catalog.json` (bun, winget, aur, nix, flatpak, wasm-hub; the Play Store driver is excluded)                                                                                | listing rendered, catalog JSON returns                                                                                                               |
| Settings  | language (5), sound, wallpaper (owner assets `assets/generated/wallpapers`), input mode                                                                                                                                                                        | rendered                                                                                                                                             |
| Console   | port of the `console.aphrody.com` data (status, fleet, registries, arena, orgs) at `/os/api/console/*`; static snapshot as in the Worker                                                                                                                       | rendered                                                                                                                                             |
| Gamescope | WebGPU pipeline: EASU then RCAS compute passes loaded from `crates/gamescope-wgsl/src/shaders` (same files as the Rust crate), scaling modes of `crates/gamescope-core` (fit, integer, stretch, fill, center), linear or nearest filter, frame cap, per window | FSR path presented a Ruffle surface at 145 fps (1:1 size: Ruffle resizes its own canvas, so no upscale was exercised); integer, fill and cap not run |

Frames are read from the source canvas through `captureStream()` (a WebGL canvas drops its buffer after compositing, direct copy gave black), so the overlay adds about one frame of latency.

## Components and licenses

Pinned by SHA-256 in `src/os/vendor.lock.json`, downloaded at build into `apps/aphrody/var/os-vendor` (gitignored), copied to `dist/os/vendor`, skipped by the WCK gate (`vendor/` directories). Nothing below is committed.

| Component                   | Source                                                                                    | License                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| v86 `libv86.js`, `v86.wasm` | copy/v86 release `latest` (rolling)                                                       | BSD-2-Clause                                                   |
| SeaBIOS, VGABIOS            | copy/v86 `bios/` at 315b2b0b                                                              | LGPL-3.0 (COPYING.LESSER shipped beside them)                  |
| Ruffle web-selfhosted       | ruffle-rs/ruffle `nightly-2026-11-13`                                                     | MIT OR Apache-2.0 (both license files shipped)                 |
| EmulatorJS and cores        | fetched by the user's browser at run time, never bundled                                  | GPL-3.0 (cores vary, several are non-commercial)               |
| Alpine ISO                  | R2 `aphrody-assets/webos/vm/alpine-virt-3.24.2-x86.iso`                                   | Alpine package licenses (mostly GPL); served as the Worker did |
| FSR EASU, RCAS (WGSL)       | `crates/gamescope-wgsl`; the EASU there is an approximation of AMD FSR 1.0, not bit exact | repo license (MIT OR Apache-2.0)                               |

No ROM, BIOS, firmware or commercial game is in the repository. Steam and Epic are links to their official sites only.

## aphrody-webos Worker merge

Kept in the Worker (unchanged, nothing lost): host routing of the Craft studios (14 `*craft.aphrody.app`, 14 `app-*`, 10 `*.aphrody.com`), R2 custom-domain root pages, `apt.aphrody.app`, legacy `/api/*` forwarding. Moved into the route: `/vm/alpine.iso` to `/os/vm/alpine.iso` (range requests, upstream `OS_VM_URL`, default the public R2 object), the console dashboard and its five JSON endpoints to the Console app and `/os/api/console/*`, and the `os.aphrody.com` hub target `/os`. The Worker can drop those two handlers once `os.aphrody.com` points at the app (outbox action, not done).

## Measured (2026-11-13, Chrome 157, RTX 4070, 144 Hz, viewport 1440x900, dpr 1)

- Launcher, no window open: 140.7 fps over 300 frames, frame time p50 7.0 ms, p95 7.4 ms, max 34.8 ms (one hitch).
- Lighthouse desktop, local, `/os`: accessibility 100, best practices 100, SEO 100 (45 audits passed). Performance not run.
- `os.js` 37 kB minified (includes both gamescope WGSL passes).
- v86 Alpine: SeaBIOS to ISOLINUX prompt within 25 s of Start (ISO streamed in chunks from the public R2 object); init services still starting at 40 s. No login prompt reached or timed.

## Gaps (not done)

- Bazzite and CachyOS: they are 64-bit distros; v86 is 32-bit x86 only. The 64-bit path is container2wasm (see the next section); it is not wired into `/os`.
- Smithay (Wayland compositor library) and the gamescope binary need Linux DRM, libinput and a GPU stack; they do not compile to WebAssembly. The in-browser equivalent here is the DOM window manager plus the gamescope WGSL pipeline; no Wayland protocol is implemented, `apps/unixwin` (a Windows layer) is not used.
- Steam Gaming Mode, Proton, ujust and Bazzite or CachyOS tooling do not exist in the browser; Steam is a link, not a client.
- Real emulator frames (needs a user ROM), gamepad hardware, Firefox and Safari, mobile and 4K are not tested. Game wasm presence depends on `target/game-web` at build time.
- EASU is an approximation; compare against AMD FidelityFX before calling it FSR 1.0 output.
- Gemini review of the deliverable (repo rule) is not done.

## Production check (aphrody.com, 2026-11-13)

`aphrody.com` serves `dist/` from R2 through `apps/aphrody/edge/worker.ts`; headers come from `dist/_headers`, and only paths the Worker lists as dynamic reach the Bun origin. Found on the live site: `/os` and the vendor files were served, but the CSP was the site-wide one (it blocks the font and would block wasm), and `/os/catalog.json` returned the HTML 404 page because it was not routed to the origin. Fixed in the repo: `_headers` rules for `/os` and `/os/*` (same CSP as `server.ts`), and `/os/catalog.json`, `/os/api/*`, `/os/vm/*` added to the Worker's dynamic paths. Not yet verified on prod: it needs the next `ay deploy aphrody` and the Worker deploy, and the prd origin image must contain the new routes.

## 64-bit distro in a tab: container2wasm test (fr1, headless Chrome 157, not integrated)

- Tool: ktock/container2wasm (Apache-2.0), built from `main` at 3f0f9be4 (no releases or tags; the stock `c2w` fails because its Dockerfile pins a missing `v0.8.4`, worked around with `--assets` on the local clone). Command: `nice ./c2w --to-js --assets <clone> cachyos/cachyos:latest <out>/`, about 23 min on the loaded fr1.
- Result: CachyOS (x86_64, kernel 6.1.0 from c2w) reached a bash prompt 16.4 to 17 s after navigation (3 runs, bundle served locally); `echo`, `/etc/os-release` (CachyOS Linux) and `uname` worked.
- Cost: bundle 1.1 GB (rootfs `.data` 1.1 GB, QEMU wasm 41 MB; about 395 MB and 16 MB gzipped), tab JS heap about 1.1 GB, renderer RSS about 2.1 GB (approximate). Needs `COOP: same-origin` and `COEP: require-corp` (`SharedArrayBuffer`); without them the page dies without a prompt. Networking was not tested.
- Bazzite: image manifest 256 layers, 4.45 GB compressed, not pulled. c2w boots its own kernel and init, so the image's systemd session, Steam, gamescope and Vulkan would not run (no GPU in the guest). Not run; do not read this as measured.
- Bundle stays on fr1 in `/srv/webos-c2w/`; serving it from `/os` would need the COOP/COEP headers on that route, which conflicts with the frame and CDN loads of the current CSP, and an R2 upload of the 1.1 GB file.
