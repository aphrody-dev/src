# Aphrody Design System (`crates/aphrody-design-*`)

The seven design crates are members of the root Cargo workspace (`C:/src/Cargo.toml`); the asset catalog lives in `crates/aphrody-design-icons/catalog/`.

Pure-Rust (Edition 2024, `#![forbid(unsafe_code)]`) multi-surface design token, layout, theme-emitter, and vector icon workspace consolidated into `C:\src\crates\design-system`.

## Workspace Crates

- `aphrody-design-shared` — Zero-overhead foundation types (`RgbaColor`, 8 built-in theme presets including Neutral, Material Design 3, Fluent UI 2, Apple HIG Liquid Glass, Omarchy, Hyprland, Aphrody Byron Love, and Chromium).
- `aphrody-design-tokens` — `no_std`-capable Material Design 3 HCT/CAM16/Wu/WSMeans dynamic color engine, typography, elevation, motion, and variable font axes (`GoogleSansFlex`, `GoogleSansCode`).
- `aphrody-design-emit` — Deterministic multi-target theme emitter (Web CSS, Tailwind v4, GPUI `gpui_theme`, WinUI 3 XAML, Fluent 2, GTK4/libadwaita, COSMIC RON, Omarchy, SwiftUI, Jetpack Compose, Chrome themes, and WCAG contrast verification).
- `aphrody-design-layout` — LightningCSS + Tailwind v3/v4 utility parser lowered directly to `taffy` 0.15 flexbox/grid layout trees.
- `aphrody-design-icons` — SVG and Chromium `.icon` DSL vector parser, normalized path IR, SVGO-equivalent optimizer, zstd icon bundle builder, multi-size ICO/PNG/PWA favicon renderer, and `catalog/assets.lock.toml` license verifier.
