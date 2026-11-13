# Aphrody design system (state 2026-11-13)

- Tokens: `packages/design` (`DESIGN.md`, `tokens/tokens.json`, `tokens.css`, `tokens.rs`, `tokens.zig`, `ansi.json`, Figma variable files), Material 3 through Material Color Utilities. Sources and versions: `docs/ui/STACK.md`; surfaces: `docs/ui/INVENTORY.md`.
- Rust core: `crates/aphrody-ui`, one crate with the modules `color` (HCT, CAM16, palettes, schemes, contrast, checked against `@material/material-color-utilities` 0.4.0 fixtures), `components` (Material 3 contracts: states, variants, ARIA, focus, measures), `layout` (CSS and Tailwind utilities lowered to `taffy`), `shared`, `react`, `next` and `brand` (binary `aphrody-brand`, `ay brand build`). `crates/aphrody-brand-gpu` holds the geometry shared with the wasm renderer.
- Features of `aphrody-ui`: default `std`, `serde`, `layout`, `react`, `next`, `brand`; optional `image`, `embedded-fonts`, `bevy` (`layout::css_to_bevy_node`) and `egui` (`layout::to_egui`). A renderer can depend on it with `default-features = false`.
- UI frameworks: free since the owner amendment of 2026-11-13 (`docs/ui/STACK.md`); the criteria are rendering quality, performance and function. Tokens stay the single source whatever the framework.
- Removed: the crates `aphrody-design-shared`, `-tokens`, `-layout`, `-icons` and `-emit` no longer exist; their code was merged into `aphrody-ui`.
- Reference specifications (not targets): `docs/design` (441 rewritten rules, sources and licenses in `sources.toml`) and the skills `material-3`, `google-design`, `vercel-geist`, `web-a11y-seo-cwv`, `webgpu-wasm-ui`.
- Gate: Design-First Gate of `AGENTS.md` section 2 (`gds verify`, `wck`).
- External system read for comparison: the Craft Apps have no shared token file, `craft-ui` takes application-supplied styles (`docs/games/ARTCRAFT.md`).
