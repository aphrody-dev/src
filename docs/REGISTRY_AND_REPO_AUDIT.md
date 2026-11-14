# Full Audit of Registries (`npm`, `crates.io`), GitHub Repositories (`aphrody-dev`, `aphrody-labs`, `yolo-rs`) and Prefixes (`C:\src`)

Audit date: `2026-11-11`  
Scope: `C:\src` (25 sub-units + root), `aphrody-dev` (66 repositories), `aphrody-labs` (11 repositories), `yolo-rs` (77 repositories), `npm` (`696` packages), `crates.io` (`370` crates).

---

## 1. Normalization of GitHub Repositories (`aphrody-dev` & `aphrody-labs`)

### 1.1 Renaming of `src-*` prefixes to natural identifiers (20 repositories)

In line with the principle of clear, natural identifiers without artificial prefixes, the 20 private `aphrody-dev/src-*` repositories were renamed to their canonical names (GitHub provides transparent HTTP/Git redirection, and all local `origin` remotes + `.gitmodules` were updated):

| Old repository                  | New canonical repository    | Local unit (`C:\src`)    | Synchronized branches |
| :------------------------------ | :-------------------------- | :----------------------- | :-------------------- |
| `aphrody-dev/src-ai-os`         | `aphrody-dev/ai-os`         | `packages/ai-os`         | `main`, `dev`         |
| `aphrody-dev/src-ai-triad`      | `aphrody-dev/ai-triad`      | `packages/ai-triad`      | `main`, `dev`         |
| `aphrody-dev/src-brain`         | `aphrody-dev/brain`         | `packages/brain`         | `main`, `dev`         |
| `aphrody-dev/src-bun-parity`    | `aphrody-dev/bun-parity`    | `packages/bun-parity`    | `main`, `dev`         |
| `aphrody-dev/src-bun-plugins`   | `aphrody-dev/bun-plugins`   | `packages/bun-plugins`   | `main`, `dev`         |
| `aphrody-dev/src-chromium-bun`  | `aphrody-dev/chromium-bun`  | `packages/chromium-bun`  | `main`, `dev`         |
| `aphrody-dev/src-env-kit`       | `aphrody-dev/env-kit`       | `packages/env-kit`       | `main`, `dev`         |
| `aphrody-dev/src-forge`         | `aphrody-dev/forge`         | `packages/forge`         | `main`, `dev`         |
| `aphrody-dev/src-google-design` | `aphrody-dev/google-design` | `packages/google-design` | `main`, `dev`         |
| `aphrody-dev/src-pi-opencode`   | `aphrody-dev/pi-opencode`   | `packages/pi-opencode`   | `main`, `dev`         |
| `aphrody-dev/src-bench`         | `aphrody-dev/bench`         | `crates/bench`           | `main`, `dev`         |
| `aphrody-dev/src-depot`         | `aphrody-dev/depot`         | `crates/depot`           | `main`, `dev`         |
| `aphrody-dev/src-gamescope-rs`  | `aphrody-dev/gamescope-rs`  | `crates/gamescope-rs`    | `main`, `dev`         |
| `aphrody-dev/src-ring3-agent`   | `aphrody-dev/ring3-agent`   | `crates/ring3-agent`     | `main`, `dev`         |
| `aphrody-dev/src-rust-stack`    | `aphrody-dev/rust-stack`    | `crates/rust-stack`      | `main`, `dev`         |
| `aphrody-dev/src-unix`          | `aphrody-dev/unix`          | `crates/unix`            | `main`, `dev`         |
| `aphrody-dev/src-wayland`       | `aphrody-dev/wayland`       | `crates/wayland`         | `main`, `dev`         |
| `aphrody-dev/src-xtask`         | `aphrody-dev/xtask`         | `crates/xtask`           | `main`, `dev`         |
| `aphrody-dev/src-infra`         | `aphrody-dev/infra`         | `infra`                  | `main`, `dev`         |
| `aphrody-dev/src-mesh-vn`       | `aphrody-dev/mesh-vn`       | `infra/mesh-vn`          | `main`, `dev`         |

### 1.2 New repositories created and synchronized (5 repositories)

- `aphrody-dev/src` (`C:\src` — root manifest of the sovereign monorepo)
- `aphrody-dev/aphrody` (`C:\src\apps\aphrody` — `aphrody.com` Bun v1.4.4 Full-Rust + M3 + SEO/GEO/Gemini + WebMCP, WCK 100/100)
- `aphrody-dev/aphrody-app` (`C:\src\apps\aphrody-app` — `aphrody.app` 100 % Rust 2024 WASM/WebGPU/Wayland/Fluid/OPFS/WebMCP, WCK 100/100)
- `aphrody-dev/knowledge-engine` (`C:\src\packages\knowledge-engine` — `ske` Context7, Deep Research, Fact-Checker, Continuous Session Reviewer)
- `aphrody-dev/wck` (`C:\src\packages\wck` — `wck` Compile-Time Web, SEO, GEO, WASM & WebGPU Gate)

### 1.3 Archiving of unused forks (`ahead = 0`) on `aphrody-dev`

- **30 unmodified forks (`ahead = 0`) not referenced in `C:\src\third_party` were cleanly archived** via `gh repo archive` (`agents-cli`, `alacritty`, `asterinas`, `Boxedwine64`, `brush`, `burn`, `cosmic-epoch`, `cubecl`, `desktop`, `EAC-Extractor-Utility`, `Exo`, `fish-shell`, `gpui-shell`, `helix`, `hex`, `jan`, `lapce`, `litebox`, `lore`, `maki`, `mistral.rs`, `models.dev`, `niri`, `NixOS-WSL`, `opentunnel`, `rio`, `rune`, `sst`, `strobe`, `transcribe.cpp`).
- **9 active forks were preserved** because they are referenced by `third_party/` or carry local commits: `bun`, `zed`, `opentui`, `agent-browser`, `agent-desktop`, `chwd`, `coreutils`, `tree-sitter`, `mochi-desktop`.

---

## 2. Normalization of `npm` Scopes (`@aphrody/*`) and Rust Crates (`aphrody-*`)

### 2.1 Bun / TypeScript packages in `C:\src` (100 % `@aphrody/*`)

All first-party `package.json` files were unified under the `@aphrody/*` scope (complete elimination of the mixed scopes `@sovereign/*`, `@yolo-rs/*` and unscoped names, and removal of the dead stub folder `packages/sovereign-nexus`):

- Root: `@aphrody/monorepo`
- Applications: `@aphrody/web` (`apps/aphrody`), `@shenron/monorepo` (`apps/shenron`), `@rosegriffon/monorepo` (`apps/rosegriffon`)
- Packages (`packages/*`): `@aphrody/ai-os`, `@aphrody/ai-triad`, `@aphrody/brain`, `@aphrody/bun-parity`, `@aphrody/bun-plugins`, `@aphrody/chromium-bun`, `@aphrody/env-kit`, `@aphrody/forge`, `@aphrody/google-design`, `@aphrody/knowledge-engine`, `@aphrody/pi-opencode`, `@aphrody/wck`
- Infra (`infra/*`): `@aphrody/mesh-vn` (`@aphrody/ffi-bridge` has lived in `packages/ffi-bridge` since 2026-11-13)

### 2.2 Rust 2024 crates in `C:\src`

- `apps/aphrody-app`: `aphrody-core`, `aphrody-wasm`, `aphrody-host` (binary `aphrody-app`), `aphrody-android`
- `packages/env-kit/loaders/rust`: renamed from `sovereign-env` to `aphrody-env`
- `packages/pi-opencode/rust-core`: `pi_opencode_native`
- `crates/*`: `xtk`, `depot-cli` (`depot`), `depot-core`, `depot-graph`, `depot-ingest` (`gitingest`), `ring3-agent` (`r3d`), `rust-stack`, `gamescope-cli`, `gamescope-core`, `gamescope-wgsl`, `gamescope-web-wasm`, `wslg-cli`, `cosmic-compat`, `dx12-hal`, `hypr-tiler`, `smithay-wayland-wire`, `unix-distro`, `unix-cachyos`, `unix-uutils`, `stack-bench`

### 2.3 Public `npm` & `crates.io` Inventory and Cleanup Script

The exhaustive inventories are archived in `C:\src\var\reports\npm-inventory.json` (`696` packages: `645` `@aphrody/*`, `30` `@rosegriffon/*`, `12` `@<npm-owner>/*`, `1` `@yolo-rs/*`, `8` unscoped) and `C:\src\var\reports\crates-inventory.json` (`370` crates including `178` `aphrody-*` and `3` `yolo-*`).

- **Live authentication finding**: `NPM_TOKEN` currently returns `401 Unauthorized` on `registry.npmjs.org/-/whoami` and `CARGO_REGISTRY_TOKEN` returns `403 Forbidden` on `crates.io/api/v1/me`.
- **Ready-to-use script**: `packages/env-kit/scripts/registry-cleanup.ts` deterministically identifies the `75` Windows API-set stubs (`@aphrody/bun-windows-api-ms-win-*`, `@yolo-rs/*`) to deprecate on `npm` and the obsolete crates (`yolo-core`, `yolo-runtime`, `yolo-zig-ffi`) to yank on `crates.io` once the tokens are refreshed (`env-kit set NPM_TOKEN ...` then `bun run packages/env-kit/scripts/registry-cleanup.ts --execute`).

---

## 3. Purge of "AI Slop", Conflicts and `yolo` Leftovers

1. **Removal of empty stubs and placeholders**:
   - Replacement of the `fn main() {}` in `apps/aphrody-app/crates/aphrody-host/src/main.rs` with the full CLI (`serve`, `tui`, `build-dist`, `doctor`, `bench`).
   - Replacement of the empty comment in `apps/aphrody-app/crates/aphrody-android/src/lib.rs` with the full C-ABI/JNI NDK bridge with a unit test.
   - Removal of the untracked dead package `packages/sovereign-nexus`.
   - Removal of temporary working scripts in `C:\src\var\*.ts` and `C:\src\var\*.ps1`.
2. **Removal of UTF-8 BOMs (`EF BB BF`) and emojis**:
   - Removal of the UTF-8 BOM from `~/.npmrc` and from the 11 affected files in `C:\src`.
   - Complete purge of emojis in `apps/aphrody`, `packages/chromium-bun`, `packages/google-design`, `packages/brain` and `packages/knowledge-engine`.
3. **Purge of obsolete `yolo` hooks and configurations**:
   - Removal of the blocking hooks `.git/hooks/pre-push` and `.git/hooks/post-commit` in `apps/rosegriffon`.
   - Renaming of `yolo-loop.ts` to `nhitl-loop.ts` (`pi-opencode nhitl`) in `packages/pi-opencode`.
   - Cleanup of `~/.npmrc`, `~/.config/opencode/opencode.jsonc`, `~/.claude/CLAUDE.md`, `~/.local/bin/net.ps1` and `~/.local/bin/vn.ps1`.
