---
name: modern-web-ui-ux-pro
description: Modern Web Guidelines, UI/UX Pro Aesthetics, Core Web Vitals, Playwright, and Lighthouse Visual Verification
---

# Modern Web UI/UX Pro & Visual Verification Reference

Canonical guidelines for engineering high-performance, aesthetically exceptional web applications across the Sovereign Monorepo (`aphrody.com`, `dragonballfr.com`, `rosegriffon.fr`, `yolo`).

## 1. Aesthetic Trinity: Google M3 + Apple macOS + Microsoft Fluent 2

1. **Google Material Design 3 (M3)**:
   - Dynamic tonal surface containers: `--surface-container-lowest`, `--surface-container-low`, `--surface-container`, `--surface-container-high`, `--surface-container-highest`.
   - WCAG AAA accessible color contrast ratios.
2. **Apple macOS Interface Rigor**:
   - 12px/16px rounded window borders, subtle backdrop filters (`backdrop-filter: blur(20px)`), and titlebars.
   - Clean typographic hierarchy using system font stacks (`-apple-system`, `BlinkMacSystemFont`, `Inter`, `Roboto`, `system-ui`).
   - Tabular figures (`font-variant-numeric: tabular-nums`) for numeric data.
3. **Microsoft Fluent 2**:
   - Acrylic depth, micro-interactions, smooth cubic-bezier transitions (`transition: all 120ms cubic-bezier(0.16, 1, 0.3, 1)`).

## 2. Anti-AI-Slop & Impeccable Quality Directives

- **Strictly Zero Emojis (`ARCH-009`)**: Use vector SVGs exclusively. Never insert astral pictographic emojis in UI, buttons, copy, or configs.
- **Strictly Zero Marketing Puffery (`ARCH-010`)**: Ban empty AI adjectives ("revolutionary", "unleash", "delve", "seamless", "game-changer", "AI-powered magic"). Every claim must correspond to a verifiable API or behavior.
- **Strictly Zero Unrequested SaaS Decoration**: No decorative purple/neon mesh gradients, no fabricated reviews.

## 3. Core Web Vitals Targets

- **LCP (Largest Contentful Paint)**: `< 1.2s`
- **INP (Interaction to Next Paint)**: `< 50ms`
- **CLS (Cumulative Layout Shift)**: `0.00`
- **FCP (First Contentful Paint)**: `< 200ms`

## 4. Headless Visual Verification Pipeline

1. **Start Server**: Spin up the local application using Bun (`bun run server.ts` or `bun run dev`).
2. **Playwright Execution**:
   - Run tests covering all routes, interactive elements, viewport resizes, and error states.
3. **Lighthouse Audit**:
   - Verify Performance >= 95, Accessibility = 100, Best Practices = 100, SEO = 100.
4. **Agent-Browser Inspection**:
   - Inspect visual rendering and accessibility tree using `agent-browser` / `browser_navigate` before marking tasks complete.

## 5. `@aphrody/wck` + Modern Web Guidance RAG + Pure-C23 FFI

- **CLI (`wck`)**:
  - `wck <path> [--spec=seo|aiseo|mwg|cwv|lh|wasm|webgpu] [--json] [--quiet]` — compile-time web & Lighthouse 100 gate.
  - `wck search "<query>"` — hybrid RAG search (Okapi BM25 + Int8 quantized 256d static embeddings + RRF) over 252 Modern Web Guidance guides.
  - `wck retrieve <guide-id>` — retrieve full guide prose, gated by `.mwgrc` (`baseline`, `allowOriginTrials`, `allowVolatileFeatures`).
  - `wck baselinestatus <feature> [--json]` — offline Baseline support lookup.
  - `wck legacy-scan <path> [--json]` — scan HTML/CSS/JS for legacy patterns mapped to MWG guides.
  - `wck mdx <file>` — parse MDX frontmatter, headings, and code blocks via `mwg_capi.dll`.
- **MCP Tools (`packages/ai-os/src/relay/agent-tools.ts`)**:
  - `mwg_audit` (`mode: "validate" | "legacy-scan"`, `path`, `spec`)
  - `web_guidance` (`action: "search" | "retrieve" | "baseline"`, `query`)
- **Native Core**: `crates/core-capi/c/mwg_core.c` (`aphrody_mwg.h` -> `packages/wck/native/mwg_capi.dll`) with deterministic Bun fallback in `packages/wck/src/mwg-ffi.ts`.
