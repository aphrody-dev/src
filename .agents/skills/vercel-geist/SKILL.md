---
name: vercel-geist
description: Geist reference (Vercel's design system) and Vercel's front-end performance best practices, rewritten as specs in docs/design/specs. Use to evaluate or design a dense, typographic web interface (color scales with fixed roles, text classes, materials, grid, component states and accessibility), to set Core Web Vitals, caching or image targets, or for a src product that explicitly adopts Geist. Does not replace ui-system: the web target of src remains Material 3.
---

# vercel-geist

## Status in src

- Web UI target: Material 3 via the `ui-system` skill (`@aphrody/design`, Material Web, Material Symbols). Geist is not a dependency there.
- Geist serves as a **quality reference** (density, typography, states, grid, accessibility) and as a target **only** for a product that explicitly adopts it (decision recorded in its README).
- The specs record facts (token names, scales, values) read from vercel.com, not its text or assets.
- Geist font: `vercel/geist-font`; load it from its official distribution (check the latest release with `gh api repos/vercel/geist-font/releases/latest`) and do not version its files.

## Specs (source of truth in src)

| Domain                                                | Human-readable                              | Machine                     |
| ----------------------------------------------------- | ------------------------------------------- | --------------------------- |
| Tokens: colors, type, materials, grid, spacing        | `docs/design/specs/tokens/geist.md`         | `tokens/geist.json`         |
| Components: 75 sheets (variants, sizes, states, a11y) | `docs/design/specs/components/geist.md`     | `components/geist.json`     |
| Front-end perf: CWV, images, fonts, cache, rendering  | `docs/design/specs/perf/vercel-frontend.md` | `perf/vercel-frontend.json` |

Schema: `docs/design/specs/spec.schema.json`. Index of pages read: `docs/design/index/vercel.com.json`.

## Essential rules

1. Color: the step number sets the role (100-300 backgrounds, 400-600 borders, 700-800 strong backgrounds, 900-1000 text). Map to M3: roles `surface*`, `outline*`, `on-surface*`, never a hard-coded Geist value (`geist.color.scale-steps`).
2. Opaque gray by default; transparency only for shadows and overlays; a single border per edge (`geist.color.gray-vs-alpha`).
3. Type: named styles grouping size, line height, tracking and weight; Label for one line, Copy for multiline; no arbitrary size (`geist.type.classes`).
4. Radii limited to 6/12/16 px depending on elevation (`geist.material.*`).
5. Components: loading inside the control, disabling explained, icon-only named, focus trapped then returned, aria-live polite, color never alone (`geist.comp.*`).
6. Perf: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at field P75; explicit CDN cache with stale-while-revalidate; AVIF/WebP images under an allowlist (`vercel.*`).

## Links

- Cross-cutting interface rules: skill `web-design-guidelines`; do not duplicate.
- Generic web perf: skill `web-quality`.
- Sources: https://vercel.com/geist/introduction, https://vercel.com/design/guidelines, https://vercel.com/docs/speed-insights/metrics, https://github.com/vercel/geist-font.
- Reread live (`xh -b <url> Accept:text/markdown`, ~1 request/1.5 s) before citing a value; update `verified` in the JSON files.
