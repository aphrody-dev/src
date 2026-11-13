---
name: design-first-pro-max
description: >
  Sovereign Anti-AI-Slop Design-First Studio and Open Creative Asset Bank workflow for src.
  Enforces the mandatory Plan -> Cahier des Charges (PRD) -> DESIGN.md Maquette -> Asset Generation ->
  Implementation -> Anti-Slop Audit (impeccable + humanizer) -> Lighthouse/wck 100/100 gate across web,
  desktop, TUI, mobile, and 3D WebGPU surfaces using @aphrody/google-design (gds).
license: MIT
metadata:
  version: "2.0.0"
  owner: "@aphrody/google-design"
  cli: "gds"
---

# Sovereign Design-First Pro Max & Anti-AI-Slop Gate

Use this skill before creating, redesigning, or modifying any frontend, desktop, TUI, documentation, brand, or 3D scene in `src`.

## 1. Sovereign Product Boundary & Visual Philosophy

`src` enforces strict separation between internal autonomous execution and public generalist software craft:

1. **Single Public AI Product (`packages/ai-os`)**: `@aphrody/ai-os` is the sole public AI product and internal MCP/Triad owner.
2. **Generalist Public Surfaces (`apps/aphrody`, `apps/aphrody-app`, `apps/shenron`, `apps/rosegriffon`, `crates/unix`, `crates/wayland`)**: Built as pure systems, publishing, media, desktop, and creative platforms aligned with three engineering standards:
   - **Linus Torvalds**: Structural honesty, flat data models, crisp pixel-aligned geometry, zero visual ornament hiding weak mechanics.
   - **Jarred Sumner (Bun v1.4.4 Full-Rust)**: Sub-millisecond feedback loops, zero external npm bloat, self-contained binary asset encoders, zero Cumulative Layout Shift (`CLS = 0.00`).
   - **Larry Page (`www.google.com` 10x Clarity)**: Extreme surface simplicity backed by Material Design 3 (CAM16/HCT perceptual color science), Microsoft Fluent UI 2 (Mica/Acrylic depth), Omarchy/CachyOS workstation palettes, and hardware-accelerated WebGPU/WASM.
3. **Zero AI-Hype & Zero Emoji Policy**: Public copy, code comments, Markdown specs, SVG icons, CSS stylesheets, commit messages, and UI chrome contain zero emojis, zero chatbot residue, and zero generic SaaS slop gradients.

## 2. Mandatory 7-Stage Design-First Gate

Never jump straight from a prompt to UI markup. Execute all seven stages in sequence using `gds` (`C:\Users\aphro\.local\bin\gds.exe` or `bun packages/google-design/cli.ts`):

```text
[1. Plan] -> [2. PRD.md] -> [3. DESIGN.md] -> [4. Open Assets] -> [5. Code] -> [6. Anti-Slop Gate] -> [7. WCK 100/100]
```

### Stage 1: Surface Mode & Context Selection (`Plan`)
Classify the target surface using `impeccable` visitor modes before choosing tokens:
- **Operate** (dashboards, editors, terminals, OS compositors, settings): Scannability, keyboard focus, tabular numerals (`font-variant-numeric: tabular-nums`), predictable 4dp/8dp spacing, restrained chrome.
- **Read** (documentation, literature, encyclopedias, specs): 65-75ch measure, clear typographic scale, metric-matched fallback fonts, high-contrast ink on calm paper or obsidian surfaces.
- **Persuade** (product homepages, release showcases): One authored focal composition, authentic product artifacts or shader scenes, decisive typography, single high-contrast primary action.
- **Experience** (3D WebGPU stages, media players, interactive canvases): Full-viewport hardware canvas (`WebGPURenderer` / WGSL), minimal receding HUD.

### Stage 2: Cahier des Charges (`PRD.md`)
Generate or update the bilingual technical *Cahier des charges* (`PRD.md`) defining:
- Target users, primary workflows, and measurable latency/memory budgets (`LCP < 1.2s`, `INP < 50ms`, `CLS = 0`).
- Information architecture, state matrix (`default`, `hover`, `focus-visible`, `active`, `disabled`, `loading`, `empty`, `error`), responsive breakpoints (`375px`, `768px`, `1024px`, `1440px`), and accessibility (`WCAG 2.2 AA/AAA`).

Command:
```powershell
gds plan <surface-name> --seed "#1A73E8" --out <surface-dir>/spec
```

### Stage 3: Normative `DESIGN.md` Maquette (`google-labs-code/design.md`)
Maintain `DESIGN.md` alongside `PRD.md` combining machine-readable YAML design tokens and normative prose rationale in canonical section order:
1. `## Overview`
2. `## Colors` (HCT tonal roles + Fluent 2 Mica layers + Omarchy/CachyOS parity)
3. `## Typography` (Inter, Space Grotesk, JetBrains Mono with `size-adjust` zero-CLS fallbacks)
4. `## Layout` (4dp/8dp harmonic spatial grid, container widths, z-index layers)
5. `## Elevation & Depth` (tonal surface containers `surface-container-lowest` to `highest`, never nested bordered ghost cards)
6. `## Shapes` (0px sharp technical frames up to 16px container radii; pills reserved for compact interactive controls)
7. `## Components` (explicit state tokens and wireframe maquette tree)
8. `## Do's and Don'ts` (explicit anti-slop bans)

The monorepo design system is `packages/design/DESIGN.md` (never copied). Validate any DESIGN.md with the absorbed linter, then push it to Stitch:
```powershell
ay design lint [<file>] --format text     # default: packages/design/DESIGN.md
ay design export --format css-vars|dtcg|css-tailwind|json-tailwind
ay design push <stitchProjectId> [<file>]  # upload_design_md through the absorbed Stitch client
```

### Stage 4: Sovereign Open Creative Asset Generation (`gds assets`)
Source all icons, themes, fonts, sprites, companions, wallpapers, 3D meshes, and acoustic feedback from `@aphrody/google-design` instead of ad-hoc Unicode glyphs or unverified external CDNs:
```powershell
gds assets --out <target-public-assets-dir>
```
Available deterministic CC0-1.0 / SIL-OFL-1.1 / MIT asset families:
- **Brand & Legal**: `aphrody-mark.svg`, `aphrody-wordmark.svg`, Tiny-PS `aphrody-monogram-bimi.svg` (for `mail.aphrody.com` BIMI), `favicon.svg`, `BRAND.md`, `fonts/typography.css`, and bilingual RGPD/LCEN legal notices (`mentions-legales-fr.md`, `legal-notice-en.md`, `privacy-rgpd-fr.md`, `terms-cgu-fr.md`).
- **27 Workstation & Platform Stylesheets**: All 23 Omarchy palettes (`catppuccin`, `tokyo-night`, `kanagawa`, `nord`, `gruvbox`, `everforest`, `rose-pine`, `flexoki-light`, `jade-horse`, `lumon`, `starship`, etc.) + `cachyos-emerald` + `aphrody-m3-light` + `aphrody-m3-dark` + `fluent-2-mica` compiled to standalone `.css`, `all-themes.css`, and W3C `design-tokens.json`.
- **32 Architectural Icons & Sprite Sheet**: 24x24 pixel-grid-aligned 1.75px stroke vectors + `<symbol>` sprite (`aphrody-icons.sprite.svg`).
- **4 Animated Open Pets**: `aphrody-fox`, `cachy-lynx`, `omarchy-owl`, `bun-hare` with multi-frame LZW GIF89a binaries, SVG/PNG sprite sheets, CSS keyframes, and JSON state atlases (`idle`, `walk`, `work`, `sleep`).
- **8 Architectural 4K SVG + Compressed PNG Wallpapers**: `aphrody-m3-aurora`, `fluent-mica-slate`, `cachyos-bore-grid`, `omarchy-tokyo-horizon`, `wayland-prism`, `torvalds-monolith`, `raptorlake-silicon`, `arctic-topography`.
- **4 PBR 3D Models (`.glb`, `.gltf`, `.obj`)**: `aphrody-monolith`, `icosahedron-core`, `torus-knot-gpu`, `wayland-compositor-stage` ready for Three.js r186 `WebGPURenderer` and native `wgpu`.
- **5 Acoustic 16-bit/44.1kHz PCM `.wav` UI Sounds & 60fps WebGPU/Canvas Motion Scenes**: Harmonic zero-clipping envelopes and interactive shader loops respecting `prefers-reduced-motion`.

### Stage 5: Precision Implementation Rules
1. **Browser & OS Surfaces**: Always style `::selection`, `caret-color`, `:focus-visible` (`2px solid var(--md-sys-color-primary)` with `2px` offset), scrollbars, and `font-variant-numeric: tabular-nums` on metrics/tables.
2. **3D & Shaders (`threejs-skills` r186 + WebGPU)**:
   - Prefer `WebGPURenderer` + WGSL / TSL node materials or zero-dependency Canvas2D/WebGPU pipelines.
   - Use `Timer` instead of deprecated `Clock`, `HDRLoader` instead of `RGBELoader`, and `RenderPipeline` instead of legacy `PostProcessing`.
   - Dispose geometries, materials, and textures deterministically on unmount; honor `prefers-reduced-motion: reduce` by rendering a crisp static hero frame.
3. **Figma Code Connect Sync**: Keep W3C design tokens synchronized via `gds tokens --seed <hex> --out <dir>` and `gds figma`.

### Stage 6: Anti-AI-Slop Gate (`impeccable` + `humanizer`)
Every prose file, Markdown doc, HTML template, CSS sheet, and TSX/TS view MUST pass deterministic anti-slop verification:
```powershell
gds audit-slop <path>
gds humanize <markdown-or-copy-file>
gds verify <path>
```

#### Banned Copy Patterns (`humanizer`)
- **AI Cliché Lexicon**: `delve`, `tapestry`, `testament to`, `unleash`, `unlock the power`, `seamless`, `seamlessly`, `game-changer`, `elevate your`, `revolutionize`, `in today's fast-paced`, `cutting-edge`, `next-gen`, `supercharge`, `realm of`, `fostering`, `underscores`, `pivotal moment`, `indelible mark`.
- **Structural Tells**: "Not X, but Y" false contrasts; standalone dramatic closers ("Let that sink in.", "That is the real win."); staged run-ups ("Let's dive in", "Here's what you need to know"); chatbot residue ("Great question!", "I hope this helps!", "Certainly!"); em-dash overuse (`—`); decorative bold-colon bullet lists where plain prose is clearer.

#### Banned Visual Slop Patterns (`impeccable` + `ui-ux-pro-max`)
- **SaaS Slop Gradients**: Generic purple-to-pink/violet-to-fuchsia (`#8b5cf6` -> `#ec4899`, `#6366f1` -> `#a855f7`) hero backgrounds and gradient-clipped text (`background-clip: text` with `color: transparent`).
- **Scaffold Clichés**: 3-column identical cards with a rounded icon badge above every heading; nested cards inside cards; eyebrow/kicker labels above every section heading; arbitrary `border-left: 4px solid` accent stripes on rounded cards; zero-offset neon glow halos (`box-shadow: 0 0 20px ...`); unaligned spacing outside the 4dp/8dp grid (`padding: 13px`, `margin: 19px`).
- **Glyph Substitutes**: Unicode symbols or emojis used in place of geometric SVG icons.

### Stage 7: Universal Verification & Lighthouse / `wck` 100/100
Run the full verification loop before concluding any task:
```powershell
gds audit-slop <target>
gds verify <target>
bun fmt
bun check
bun test
```
All four scores — Performance, Accessibility, Best Practices, SEO — plus `gds verify` (`>= 90/100`, `0` errors) and `gds audit-slop` (`clean: true`) must pass before shipping.

## 3. Grounded Upstream References in `src`
- [`packages/google-design`](packages/google-design): `@aphrody/google-design` source, token compiler, binary encoders, UI gate, and `gds` CLI.
- [`third_party/impeccable`](third_party/impeccable): Deterministic UI anti-pattern rules and craft floor (`craft-floor.md`).
- [`third_party/humanizer`](third_party/humanizer): Empirical catalog of 26 AI prose tells and neutral rewriting rules.
- [`third_party/ui-ux-pro-max-skill`](third_party/ui-ux-pro-max-skill): Pre-delivery UX, contrast, touch-target, and responsive checklists.
- [`third_party/threejs-skills`](third_party/threejs-skills): Three.js r186, WebGPU, TSL shaders, PBR lighting, and glTF 2.0 pipelines.
- [`packages/google-design/src/design-md`](packages/google-design/src/design-md): absorbed `google-labs-code/design.md` linter and exporters (bun-native, fork `third_party/design-md`); [`third_party/awesome-design-md`](third_party/awesome-design-md): real-world design system analyses.
- [`packages/ai-os/src/google/stitch`](packages/ai-os/src/google/stitch): the single Stitch client of src (absorbed `stitch-sdk`), also served by the relay as `stitch__*` tools; Stitch skills mirrored as `.agents/skills/stitch-*`.
- [`third_party/omarchy/themes`](third_party/omarchy/themes): Canonical workstation color palettes integrated into `gds`.
