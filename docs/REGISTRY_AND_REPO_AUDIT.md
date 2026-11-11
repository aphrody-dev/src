# Audit Complet des Registres (`npm`, `crates.io`), Depots GitHub (`aphrody-dev`, `aphrody-labs`, `yolo-rs`) et Prefixes (`C:\src`)

Date de l'audit : `2026-11-11`  
Périmètre : `C:\src` (25 sous-unités + racine), `aphrody-dev` (66 dépôts), `aphrody-labs` (11 dépôts), `yolo-rs` (77 dépôts), `npm` (`696` paquets), `crates.io` (`370` crates).

---

## 1. Normalisation des Depots GitHub (`aphrody-dev` & `aphrody-labs`)

### 1.1 Renommage des prefixes `src-*` vers des identifiants naturels (20 depots)

Conformément au principe d'identifiants clairs et naturels sans préfixes artificiels, les 20 dépôts privés `aphrody-dev/src-*` ont été renommés vers leurs noms canoniques (GitHub assure la redirection HTTP/Git transparente, et tous les `origin` locaux + `.gitmodules` ont été mis à jour) :

| Ancien dépôt                    | Nouveau dépôt canonique     | Unité locale (`C:\src`)  | Branches synchronisées |
| :------------------------------ | :-------------------------- | :----------------------- | :--------------------- |
| `aphrody-dev/src-ai-os`         | `aphrody-dev/ai-os`         | `packages/ai-os`         | `main`, `dev`          |
| `aphrody-dev/src-ai-triad`      | `aphrody-dev/ai-triad`      | `packages/ai-triad`      | `main`, `dev`          |
| `aphrody-dev/src-brain`         | `aphrody-dev/brain`         | `packages/brain`         | `main`, `dev`          |
| `aphrody-dev/src-bun-parity`    | `aphrody-dev/bun-parity`    | `packages/bun-parity`    | `main`, `dev`          |
| `aphrody-dev/src-bun-plugins`   | `aphrody-dev/bun-plugins`   | `packages/bun-plugins`   | `main`, `dev`          |
| `aphrody-dev/src-chromium-bun`  | `aphrody-dev/chromium-bun`  | `packages/chromium-bun`  | `main`, `dev`          |
| `aphrody-dev/src-env-kit`       | `aphrody-dev/env-kit`       | `packages/env-kit`       | `main`, `dev`          |
| `aphrody-dev/src-forge`         | `aphrody-dev/forge`         | `packages/forge`         | `main`, `dev`          |
| `aphrody-dev/src-google-design` | `aphrody-dev/google-design` | `packages/google-design` | `main`, `dev`          |
| `aphrody-dev/src-pi-opencode`   | `aphrody-dev/pi-opencode`   | `packages/pi-opencode`   | `main`, `dev`          |
| `aphrody-dev/src-bench`         | `aphrody-dev/bench`         | `crates/bench`           | `main`, `dev`          |
| `aphrody-dev/src-depot`         | `aphrody-dev/depot`         | `crates/depot`           | `main`, `dev`          |
| `aphrody-dev/src-gamescope-rs`  | `aphrody-dev/gamescope-rs`  | `crates/gamescope-rs`    | `main`, `dev`          |
| `aphrody-dev/src-ring3-agent`   | `aphrody-dev/ring3-agent`   | `crates/ring3-agent`     | `main`, `dev`          |
| `aphrody-dev/src-rust-stack`    | `aphrody-dev/rust-stack`    | `crates/rust-stack`      | `main`, `dev`          |
| `aphrody-dev/src-unix`          | `aphrody-dev/unix`          | `crates/unix`            | `main`, `dev`          |
| `aphrody-dev/src-wayland`       | `aphrody-dev/wayland`       | `crates/wayland`         | `main`, `dev`          |
| `aphrody-dev/src-xtask`         | `aphrody-dev/xtask`         | `crates/xtask`           | `main`, `dev`          |
| `aphrody-dev/src-infra`         | `aphrody-dev/infra`         | `infra`                  | `main`, `dev`          |
| `aphrody-dev/src-mesh-vn`       | `aphrody-dev/mesh-vn`       | `infra/mesh-vn`          | `main`, `dev`          |

### 1.2 Nouveaux depots crees et synchronises (5 depots)

- `aphrody-dev/src` (`C:\src` — manifeste racine du monorepo souverain)
- `aphrody-dev/aphrody` (`C:\src\apps\aphrody` — `aphrody.com` Bun v1.4.4 Full-Rust + M3 + SEO/GEO/Gemini + WebMCP, WCK 100/100)
- `aphrody-dev/aphrody-app` (`C:\src\apps\aphrody-app` — `aphrody.app` 100 % Rust 2024 WASM/WebGPU/Wayland/Fluid/OPFS/WebMCP, WCK 100/100)
- `aphrody-dev/knowledge-engine` (`C:\src\packages\knowledge-engine` — `ske` Context7, Deep Research, Fact-Checker, Continuous Session Reviewer)
- `aphrody-dev/wck` (`C:\src\packages\wck` — `wck` Compile-Time Web, SEO, GEO, WASM & WebGPU Gate)

### 1.3 Archivage des forks inutilises (`ahead = 0`) sur `aphrody-dev`

- **30 forks non modifiés (`ahead = 0`) et non référencés dans `C:\src\third_party` ont été archivés proprement** via `gh repo archive` (`agents-cli`, `alacritty`, `asterinas`, `Boxedwine64`, `brush`, `burn`, `cosmic-epoch`, `cubecl`, `desktop`, `EAC-Extractor-Utility`, `Exo`, `fish-shell`, `gpui-shell`, `helix`, `hex`, `jan`, `lapce`, `litebox`, `lore`, `maki`, `mistral.rs`, `models.dev`, `niri`, `NixOS-WSL`, `opentunnel`, `rio`, `rune`, `sst`, `strobe`, `transcribe.cpp`).
- **9 forks actifs ont été préservés** car référencés par `third_party/` ou porteurs de commits locaux : `bun`, `zed`, `opentui`, `agent-browser`, `agent-desktop`, `chwd`, `coreutils`, `tree-sitter`, `mochi-desktop`.

---

## 2. Normalisation des Scopes `npm` (`@aphrody/*`) et Crates Rust (`aphrody-*`)

### 2.1 Packages Bun / TypeScript dans `C:\src` (100 % `@aphrody/*`)

Tous les `package.json` first-party ont été unifiés sous le scope `@aphrody/*` (élimination complète des scopes mixtes `@sovereign/*`, `@yolo-rs/*` et non-scopés, ainsi que suppression du dossier stub mort `packages/sovereign-nexus`) :

- Racine : `@aphrody/monorepo`
- Applications : `@aphrody/web` (`apps/aphrody`), `@shenron/monorepo` (`apps/shenron`), `@rosegriffon/monorepo` (`apps/rosegriffon`)
- Packages (`packages/*`) : `@aphrody/ai-os`, `@aphrody/ai-triad`, `@aphrody/brain`, `@aphrody/bun-parity`, `@aphrody/bun-plugins`, `@aphrody/chromium-bun`, `@aphrody/env-kit`, `@aphrody/forge`, `@aphrody/google-design`, `@aphrody/knowledge-engine`, `@aphrody/pi-opencode`, `@aphrody/wck`
- Infra (`infra/*`) : `@aphrody/mesh-vn`, `@aphrody/infra-ffi-bridge`

### 2.2 Crates Rust 2024 dans `C:\src`

- `apps/aphrody-app` : `aphrody-core`, `aphrody-wasm`, `aphrody-host` (binaire `aphrody-app`), `aphrody-android`
- `packages/env-kit/loaders/rust` : renommé de `sovereign-env` vers `aphrody-env`
- `packages/pi-opencode/rust-core` : `pi_opencode_native`
- `crates/*` : `xtk`, `depot-cli` (`depot`), `depot-core`, `depot-graph`, `depot-ingest` (`gitingest`), `ring3-agent` (`r3d`), `rust-stack`, `gamescope-cli`, `gamescope-core`, `gamescope-wgsl`, `gamescope-web-wasm`, `wslg-cli`, `cosmic-compat`, `dx12-winui-core`, `hypr-tiler`, `smithay-wayland-wire`, `unix-distro`, `unix-cachyos`, `unix-uutils`, `stack-bench`

### 2.3 Inventaire Public `npm` & `crates.io` et Script d'Assainissement

Les inventaires exhaustifs sont archivés dans `C:\src\var\reports\npm-inventory.json` (`696` paquets : `645` `@aphrody/*`, `30` `@rosegriffon/*`, `12` `@yohan971/*`, `1` `@yolo-rs/*`, `8` non-scopés) et `C:\src\var\reports\crates-inventory.json` (`370` crates dont `178` `aphrody-*` et `3` `yolo-*`).

- **Constat d'authentification live** : `NPM_TOKEN` renvoie actuellement `401 Unauthorized` sur `registry.npmjs.org/-/whoami` et `CARGO_REGISTRY_TOKEN` renvoie `403 Forbidden` sur `crates.io/api/v1/me`.
- **Script prêt à l'emploi** : `packages/env-kit/scripts/registry-cleanup.ts` identifie déterministiquement les `75` stubs Windows API-set (`@aphrody/bun-windows-api-ms-win-*`, `@yolo-rs/*`) à déprécier sur `npm` et les crates obsolètes (`yolo-core`, `yolo-runtime`, `yolo-zig-ffi`) à yanker sur `crates.io` dès rafraîchissement des tokens (`env-kit set NPM_TOKEN ...` puis `bun run packages/env-kit/scripts/registry-cleanup.ts --execute`).

---

## 3. Purge du "AI Slop", des Conflits et des Reliquats `yolo`

1. **Suppression des stubs et placeholders vides** :
   - Remplacement du `fn main() {}` dans `apps/aphrody-app/crates/aphrody-host/src/main.rs` par la CLI complète (`serve`, `tui`, `build-dist`, `doctor`, `bench`).
   - Remplacement du commentaire vide dans `apps/aphrody-app/crates/aphrody-android/src/lib.rs` par le pont C-ABI/JNI NDK complet avec test unitaire.
   - Suppression du package mort non suivi `packages/sovereign-nexus`.
   - Suppression des scripts temporaires de travail dans `C:\src\var\*.ts` et `C:\src\var\*.ps1`.
2. **Suppression des UTF-8 BOMs (`EF BB BF`) et des emojis** :
   - Suppression du BOM UTF-8 sur `~/.npmrc` et sur les 11 fichiers affectés dans `C:\src`.
   - Purge intégrale des emojis dans `apps/aphrody`, `packages/chromium-bun`, `packages/google-design`, `packages/brain` et `packages/knowledge-engine`.
3. **Purge des hooks et configurations `yolo` obsoletes** :
   - Suppression des hooks bloquants `.git/hooks/pre-push` et `.git/hooks/post-commit` dans `apps/rosegriffon`.
   - Renommage de `yolo-loop.ts` vers `nhitl-loop.ts` (`pi-opencode nhitl`) dans `packages/pi-opencode`.
   - Nettoyage de `~/.npmrc`, `~/.config/opencode/opencode.jsonc`, `~/.claude/CLAUDE.md`, `~/.local/bin/net.ps1` et `~/.local/bin/vn.ps1`.
