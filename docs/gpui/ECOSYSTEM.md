# Ecosysteme GPUI

Releve du 2026-11-14 via `gh api`, crates.io API et fichiers locaux `third_party/{zed,gpui-kit,embedded_gpui}`. Les etoiles et dates `pushed_at` viennent de `gh api repos/<repo>` / `search/repositories` (2026-11-14).

Règle : GPUI se consomme depuis GitHub, jamais depuis crates.io. Dépendances `git = "https://github.com/aphrody-labs/<repo>"` + `rev` épinglé (zed, gpui-kit, gpui-fast, gpui-ce), sync par `upstream` ; les versions crates.io ci-dessous sont indicatives.

## 1. GPUI dans zed-industries/zed

- Repo: https://github.com/zed-industries/zed, HEAD vu `56a157e5b01b` (2026-11-14); checkout local `3def8bad0b62` (2026-11-10).
- Crates siblings (liste `gh api repos/zed-industries/zed/contents/crates`): `gpui`, `gpui_macros`, `gpui_platform`, `gpui_apple`, `gpui_macos`, `gpui_ios`, `gpui_linux`, `gpui_windows`, `gpui_wgpu`, `gpui_web`, `gpui_tokio`, `gpui_util`, `gpui_shared_string`, `refineable`, `sum_tree`, `collections`, `scheduler`, `ztracing`, `ztracing_macro`, `windows_resources`. Le checkout local ne contient que `gpui`, `gpui_macros`, `sum_tree`, `collections`: il est en retard sur HEAD (refactor en plusieurs crates plateforme).
- Cargo.toml `crates/gpui` (HEAD): `version = "0.2.2"`, `license = "Apache-2.0"`, `publish = true`, homepage https://gpui.rs.
- Backends (Cargo.toml de `gpui_windows`, `gpui_wgpu`, `gpui_linux` sur HEAD):
  - Windows: Direct3D 11 + DirectComposition + DirectWrite (features `windows` Win32_Graphics_*; fichiers `directx_renderer.rs`, `direct_write.rs`, `shaders.hlsl`), AccessKit via `accesskit_windows`.
  - Linux: `gpui_wgpu` (wgpu, features metal/gles/vulkan/wgsl/webgpu), Wayland/X11, `accesskit_unix`. Blade n'apparait plus dans les Cargo.toml lus (remplace par wgpu).
  - macOS/iOS: Metal (`objc2-metal` dans `crates/gpui/Cargo.toml` local; `gpui_macos`, `gpui_ios`).
  - Web: `gpui_web` 0.1.0 (Apache-2.0) + `gpui_wgpu` features `webgpu`/`webgl`.
  - wgpu epingle sur `gfx-rs/wgpu` rev `cddb2f5d80dc` (workspace Cargo.toml HEAD).
- Texte: `gpui_wgpu/src/cosmic_text_system.rs`, `cosmic-text = "0.19.0"` + `swash 0.2.6` (Linux/web); font-kit fork zed (macOS/Windows `font-kit`, workspace Cargo.toml). Layout: `taffy =0.15.0`; SVG: `resvg 0.46.0`. Parley absent du Zed upstream (present dans gpui-ce, voir 4).
- Accessibilite: AccessKit integre dans gpui (`crates/gpui/src/_accessibility.rs` "GPUI integrates with AccessKit", module `window/a11y`); deps `accesskit 0.24.0`, `accesskit_macos 0.26.0`, `accesskit_unix 0.22`, `accesskit_windows 0.34` (workspace Cargo.toml HEAD).
- crates.io (API crates.io, 2026-11-14):
  - `gpui` 0.2.2 (maj 2026-10-30), repo zed-industries/zed.
  - `gpui-pre` 0.3.12 et `gpui-pre-platform` 0.3.12 (2026-11-09), snapshots plus recents du meme repo; `gpui-kit` les epingle (`=0.3.12`, Cargo.toml gpui-kit).
  - `gpui_macros` 0.2.2 (2025-10-22), `zed-collections` 0.2.0, `zed-sum-tree` 0.2.0 (2025-10-09).
- Usage hors Zed: oui via crates.io ou git; exemples `hello_world`, `input`, `image` dans `crates/gpui/Cargo.toml`. Pas de garantie de stabilite d'API (embedded_gpui README: "Expect sharp edges" pour son propre spike).

## 2. Licences

- Repo Zed: `LICENSE-APACHE` + `LICENSE-GPL` a la racine (gh contents); GitHub renvoie `NOASSERTION`. Crates gpui/gpui_wgpu/gpui_web/gpui_linux: `license = "Apache-2.0"` (Cargo.toml). Les crates de l'editeur restent sous GPL (fichier `LICENSE-GPL`); je n'ai pas audite crate par crate: verifier `license` avant toute dependance hors `gpui*`.
- gpui-kit/gpui-fast/gpui-ce: Apache-2.0 selon `gh api` (gpui-kit: NOASSERTION cote GitHub, `LICENSE-DOCS.md` present).

## 3. Bibliotheques de composants

- longbridge/gpui-kit (ex gpui-component; la crate `gpuix` pointe encore vers longbridge/gpui-component): 20679 etoiles, push 2026-11-14, HEAD local `6808964c3a5e` (2026-11-10). Crates.io `gpui-kit`, `gpui-base`, `gpui-component` 0.9.1 (2026-11-09). README: 75+ composants, WebAssembly (`wasm32-unknown-unknown`), AccessKit, tests d'integration headless, editeur de code 200K lignes + Tree-sitter + LSP, dock, tables virtuelles, Markdown/HTML, graphes, runtime d'extensions JS `gpui-shell`; base la plus "framework" (https://github.com/longbridge/gpui-kit).
- zeronsh, Ely-GPUI-Components (MIT, 563 etoiles, https://github.com/ZacharyZhang-NY/Ely-GPUI-Components): composants en navigateur; usage marginal.
- remorses/gpuix (Apache-2.0, 2950 etoiles, push 2026-11-01): bindings Node.js/Bun de GPUI, React ou Solid.js (https://github.com/remorses/gpuix). Crates.io `gpuix` 0.1.0 (2026-08-11).
- Liste curatee: https://github.com/zed-industries/awesome-gpui (CC0-1.0).

## 4. Templates, forks, variantes

- zed-industries/create-gpui-app: MIT, 397 etoiles, dernier push 2025-04-13 (stagnant), https://github.com/zed-industries/create-gpui-app.
- longbridge/gpui-fast: Apache-2.0, 613 etoiles, HEAD `80be50164adaf` (2026-11-13), crates.io `gpui-fast` 0.1.15. Extraction standalone de GPUI avec mode retenu, scroll layers, composition de fenetres natives (WebView). Chiffres README: -73 a -88 % CPU main-thread vs gpui-pre 0.3.7 sur leur galerie (mesures internes, Linux, release; non reproduites ici). Base: https://github.com/longbridge/gpui-fast.
- gpui-ce/gpui-ce ("Community Edition"): Apache-2.0, 1612 etoiles, HEAD `f388375d03e6` (2026-11-14), crates.io `gpui-ce` 0.3.0 (2026-10-20). Crates incl. `gpui_ce_parley`, `gpui_ce_fonts`, `gpui_web`, `gpui_wgpu`, `gpui_render`; ajoute `backdrop_blur`, `transitions`, `rounded_smoothing`; "mostly API compatible with upstream, but that is changing" (README). https://github.com/gpui-ce/gpui-ce
- zed-industries/embedded_gpui (spike experimental): GPUI dans un composant Wasm `wasm32-wasip2`, hote wasmtime, rendu par display lists; README "Experimental", pas d'API supportee; checkout local `28bc6d3d559b` (2026-09-05).
- Moteur de jeu sur GPUI: Far-Beyond-Pulsar/Pulsar-Native (MIT, 430 etoiles), https://github.com/Far-Beyond-Pulsar/Pulsar-Native.
- BUI (ppmpreetham/BUI, GPL-3.0) = UI Blender, sans rapport technique avec GPUI malgre le topic.

## 5. Applications notables (topic `gpui`, `gh search`, 2026-11-14)

Zed (95031 etoiles); Longbridge Pro (app commerciale, README gpui-kit); OpenLogi (Apache-2.0); Zeron (MIT); Loungy (MIT, archive, dernier push 2025-10-05); sonora (GPL-3.0); OxideTerm (GPL-3.0); zedis (Apache-2.0); hummingbird (Apache-2.0); ibis-office (AGPL-3.0; DOCX/XLSX/PPTX, Wasm); Rovar (editeur de design type Figma, desktop + web, liste awesome-gpui); Pulsar-Native (moteur de jeu). Beaucoup d'apps sont GPL/AGPL: la licence de l'app ne contamine pas gpui (Apache-2.0).

## 6. Windows

Backend natif D3D11/DirectComposition/DirectWrite dans `gpui_windows` (Cargo.toml + liste de fichiers HEAD); AccessKit Windows branche. gpui-fast et gpui-kit declarent macOS/Windows/Linux (README). Pas de test local (PC sature).

## 7. Comparaison avec Dioxus/Blitz

- Dioxus: derniere release vue `v0.8.0-alpha.3` (prerelease, 2026-10-16), pas de 0.8 stable (https://github.com/DioxusLabs/dioxus). Blitz (Apache-2.0, 4467 etoiles): Stylo (CSS), Taffy, Parley, Vello, winit, AccessKit, muda; "Dioxus Native" depend de 0.8.0-alpha.3 sur git (README Blitz).
- GPUI: retenu/immediat Rust pur, widgets maison, pas de CSS ni DOM; dock/editeur/tables prets via gpui-kit; Wasm possible; API instable; rendu wgpu/D3D11.
- Blitz: HTML/CSS reel (reutilise Stylo), ecosysteme web et RSX Dioxus, cible alignee avec Shenron (Leptos/Dioxus); moins de composants "application" pret-a-l'emploi, statut CSS partiel (page https://blitz.is/status/css).

Recommandation (jugement, pas une source): Shenron Studio (editeur manga, panneaux, canvas, code-first) = GPUI + gpui-kit (docking, tables, editeur de texte, AccessKit) ou gpui-fast si le CPU de scroll compte; Dioxus/Blitz pour les surfaces proches du site (HTML/CSS partage). Suite creative src: GPUI pour outils denses, Blitz pour contenu documentaire. Epingler un rev git precis: aucune des API n'est stable.

## 8. Forks aphrody-labs

Presents (`gh api orgs/aphrody-labs/repos?type=forks`): zed, gpui-kit, gpui-fast, embedded_gpui, create-gpui-app, blitz, dioxus, dioxus-components, accesskit, taffy, wgpu.
Manquants constates puis forkes le 2026-11-14 (`gh repo fork --org aphrody-labs --clone=false`): gpui-ce/gpui-ce, remorses/gpuix, zed-industries/awesome-gpui, Far-Beyond-Pulsar/Pulsar-Native. Lignes ajoutees a `third_party/forks.txt` (dont gpui-fast et create-gpui-app, deja forkes mais absents du fichier).
Non forkes volontairement: ibis-office, Argus, oxideterm et autres apps GPL/AGPL; parley/vello/cosmic-text non verifies dans ce releve.
