---
version: "1.0"
name: "Yolo Fullstack Framework"
description: "Reproducible fullstack Aphrody Bun v1.4.4 framework exploiting Bun.serve, HTMLRewriter SSR CSP nonces, bun:sqlite AST module graph, virtual M3 icon and HCT token plugins, Aphrody Pets WebGPU/Canvas2D companion, and 3-VPS datacenter search telemetry."
colors:
  primary: "#435e91"
  on-primary: "#ffffff"
  primary-container: "#d8e2ff"
  on-primary-container: "#2a4678"
  secondary: "#565e71"
  on-secondary: "#ffffff"
  tertiary: "#715574"
  surface: "#f9f9ff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f3f3fa"
  surface-container: "#ededf4"
  surface-container-high: "#e8e7ee"
  on-surface: "#1a1b20"
  on-surface-variant: "#44474f"
  outline: "#74777f"
  outline-variant: "#c4c6d0"
  error: "#ba1a1a"
  dark-primary: "#adc7ff"
  dark-surface: "#111318"
  dark-surface-container: "#1e1f25"
  dark-on-surface: "#e2e2e9"
  fluent-mica-light: "rgba(248, 249, 250, 0.86)"
  fluent-mica-dark: "rgba(18, 20, 24, 0.84)"
typography:
  display-lg:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 600
    lineHeight: "3.5rem"
    letterSpacing: "-0.025em"
  headline-md:
    fontFamily: "Space Grotesk, Inter, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: "2.25rem"
    letterSpacing: "-0.015em"
  title-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
    letterSpacing: "-0.005em"
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.5rem"
  code-sm:
    fontFamily: "JetBrains Mono, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: "1.25rem"
rounded:
  none: "0px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  2xs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.title-md}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.title-md}"
    rounded: "{rounded.sm}"
    padding: "10px 20px"
    height: "40px"
  panel-surface:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: "24px"
  input-field:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    height: "40px"
---

## Overview

Yolo Fullstack Framework operates in `operate` mode with generalist architectural clarity. Every visual decision serves legibility, low cognitive load, and deterministic responsiveness. Material Design 3 CAM16/HCT tonal surfaces provide accessible contrast across light and dark modes, while Fluent UI 2 Mica translucency is reserved strictly for persistent top-level chrome.

## Colors

```yaml
colors:
  seed: '#1a73e8'
  primary: '#435e91'
  onPrimary: '#ffffff'
  primaryContainer: '#d8e2ff'
  surface: '#f9f9ff'
  surfaceContainer: '#ededf4'
  onSurface: '#1a1b20'
  outlineVariant: '#c4c6d0'
  darkPrimary: '#adc7ff'
  darkSurface: '#111318'
  darkOnSurface: '#e2e2e9'
```

- **Primary (#435e91)**: Reserved for the single highest-priority action per viewport and active selection indicators.
- **Tonal Surface Hierarchy (#ffffff -> #e8e7ee)**: Grouping is achieved by stepping surface luminance rather than nesting bordered cards.
- **Browser Surfaces**: Style `::selection` with `#d8e2ff`, `caret-color` with `#435e91`, and focus rings with a `2px` solid offset outline.

## Typography

```yaml
typography:
  display: 'Space Grotesk, 48px/56px, weight 600, tracking -0.025em'
  headline: 'Space Grotesk, 28px/36px, weight 600, tracking -0.015em'
  body: 'Inter, 15px/24px, weight 400, measure 65ch-72ch'
  mono: 'JetBrains Mono, 13px/20px, weight 500, tabular-nums'
```

- Keep long-form reading measure between `65ch` and `75ch`.
- Enable `font-variant-numeric: tabular-nums` on all counters, timestamps, prices, latencies, and data tables.
- Load Open Font License (OFL) variable fonts with metric-matched `size-adjust` fallback stacks so layout shift remains `0.00`.

## Layout

- Enforce the harmonic `4dp / 8dp` spatial grid across all margins, paddings, and flex/grid gaps.
- Provide more vertical space above section headings (`32px`) than below them (`12px`) so heading-to-content grouping is unambiguous.
- Maintain responsive parity at `375px`, `768px`, `1024px`, and `1440px` without horizontal overflow.

## Elevation & Depth

- Declare elevation once: either a subtle `1px` `outline-variant` border OR a stepped tonal container fill — never combine a visible border with a wide diffuse drop shadow ("ghost card").
- Shadows use physical vertical offset (`0 2px 6px rgba(0, 0, 0, 0.12)`); zero-offset neon glow halos are prohibited.

## Shapes

- Structural panels and workspaces use `12px` (`rounded.md`); inputs and buttons use `8px` (`rounded.sm`); compact status chips and toggles may use `9999px` (`rounded.pill`).
- Avoid mixing sharp `0px` brutalist corners and `28px` bubble cards on the same screen.

## Components

- `AppScaffold`: Top bar + adaptive navigation rail + main content stage.
- `PrimaryButton` / `SecondaryButton`: Explicit hover, active, disabled, and keyboard focus states.
- `DataGrid`: Right-aligned tabular numerals, sticky header, 1px horizontal hairline dividers, zero zebra-stripe clutter unless density exceeds 12 columns.
- `WebGpuStage`: Hardware-accelerated Three.js r186 `WebGPURenderer` / WGSL canvas with automatic static hero fallback under `prefers-reduced-motion: reduce`.

## Do's and Don'ts

- **Do** use crisp 24x24 geometric SVG icons (`1.75px` stroke) from `@aphrody/google-design`.
- **Do** write direct, factual UI labels where buttons name the exact verb ("Export Tokens", "Compile Binary").
- **Don't** use emojis anywhere in headings, badges, buttons, empty states, or documentation.
- **Don't** use generic purple-to-pink gradients (`#8b5cf6 -> #ec4899`), gradient-clipped text, or 3-column icon-badge marketing card grids.
- **Don't** place uppercase kicker/eyebrow labels above every heading or `border-left: 4px solid` stripes on rounded cards.
