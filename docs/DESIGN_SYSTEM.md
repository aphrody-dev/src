# Aphrody Design System (`crates/aphrody-design-*`)

> 2026-11-13 : le cœur Rust du design system est le crate unique `crates/aphrody-ui` (modules `color` = HCT/CAM16/palettes/schémas/contraste vérifiés contre les fixtures de `@material/material-color-utilities` 0.4.0 avec typo, forme, élévation, mouvement et state layers ; `components` = contrats M3 (états, variantes, ARIA, focus, mesures) ; `layout`, `shared`, `react`, `next`, `brand` avec le binaire `aphrody-brand`). Les tokens de marque viennent de `packages/design` (tokens.rs, tokens.css). Les anciens crates `aphrody-design-*`, `ui`, `react`, `next` et `aphrody-brand` y sont fusionnés. La suite décrit l ancien ensemble.

> 2026-11-13 : le système de design unique est `packages/design` (tokens Material 3 via Material Color Utilities, Material Web, Material Symbols), voir `docs/ui/STACK.md` et `docs/ui/INVENTORY.md`. `aphrody-design-emit` est supprimé ; les autres crates sont en cours de retrait (plan dans INVENTORY).

The remaining design crates are members of the root Cargo workspace (`C:/src/Cargo.toml`); the asset catalog lives in `crates/aphrody-design-icons/catalog/`.

Pure-Rust (Edition 2024, `#![forbid(unsafe_code)]`) multi-surface design token, layout, theme-emitter, and vector icon workspace consolidated into `C:\src\crates\design-system`.

## Workspace Crates

- `aphrody-design-shared` — Zero-overhead foundation types (`RgbaColor`, 8 built-in theme presets including Neutral, Material Design 3, Fluent UI 2, Apple HIG Liquid Glass, Omarchy, Hyprland, Aphrody (marque originale d'assets/brand), and Chromium).
- `aphrody-design-tokens` — `no_std`-capable Material Design 3 HCT/CAM16/Wu/WSMeans dynamic color engine, typography, elevation, motion, and variable font axes (`GoogleSansFlex`, `GoogleSansCode`).
- `aphrody-design-layout` — LightningCSS + Tailwind v3/v4 utility parser lowered directly to `taffy` 0.15 flexbox/grid layout trees.
- `aphrody-design-icons` — SVG and Chromium `.icon` DSL vector parser, normalized path IR, SVGO-equivalent optimizer, zstd icon bundle builder, multi-size ICO/PNG/PWA favicon renderer, and `catalog/assets.lock.toml` license verifier.
