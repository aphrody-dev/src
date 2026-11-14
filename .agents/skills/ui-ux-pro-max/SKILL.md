---
name: ui-ux-pro-max
description: Searchable UI/UX knowledge base (BM25, bun) - 120 UX and accessibility rules, app/native interface rules, styles, product types, landing page structures, chart choices, filterable OFL Google Fonts families, three.js and WinUI rules. Use after ui-system to decide a structure, a style or an interaction state, and for the pre-delivery checklist. Absorbs nextlevelbuilder/ui-ux-pro-max-skill (MIT) rewritten for bun and the src stack.
license: MIT
metadata:
  upstream: "nextlevelbuilder/ui-ux-pro-max-skill@6ae86f61f520 (fork aphrody-labs/ui-ux-pro-max-skill)"
---

# ui-ux-pro-max

Advice, never authority: `ui-system` (M3 tokens, Material Web, GPUI, WebUI, Zig) wins in case of conflict. No color, font or Tailwind class from the results is copied; a style or palette suggestion is translated into an M3 variant (`brand.toml`) or a composition, not into homemade CSS.

## Search

```bash
S=.agents/skills/ui-ux-pro-max/scripts/search.ts
bun $S "developer tool dashboard dark" --brief          # product + style + landing + ux + chart (1 result each)
bun $S "keyboard focus modal" --domain ux               # one concern = one domain
bun $S "geometric sans variable" --domain google-fonts --ofl
bun $S "dispose memory" --stack threejs                 # stacks: threejs, winui
bun $S "<query>" --json -n 5
```

Domains: `ux` (UX/a11y rules, default), `web` (app and native interface: safe areas, touch targets), `style`, `product`, `landing`, `chart`, `google-fonts`. Short query (2 to 5 terms, one intent). Zero results: a single rephrasing or an explicit `--domain`, then state that no data matches; invent nothing.

## Mapping to the stack

| Upstream result                     | src translation                                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Palette, hex color, "Primary"       | M3 role `--md-sys-color-*`; brand hue = `assets/brand/brand.toml`                                             |
| Font pair, Tailwind config          | Google Sans Flex (brand); `google-fonts --ofl` only for a secondary family, shipped as woff2 from an OFL fork |
| Icons (Lucide, Heroicons, Phosphor) | Material Symbols Rounded (`<md-icon>`)                                                                        |
| React/Next/shadcn/Tailwind code     | Material Web (`<md-*>`) served by bun, GPUI or WebUI; keep the rule, rewrite the example                      |
| GSAP, Framer Motion                 | `--md-sys-motion-*`, View Transitions, `prefers-reduced-motion`                                               |
| `--stack threejs`                   | complements the skill `threejs-webgpu`                                                                        |
| `--stack winui`                     | Windows desktop only if the surface belongs to nt (WinUI 3)                                                   |

## Priorities (verification order)

1. Accessibility: contrast 4.5:1 (AA verified by `bun test --cwd packages/design`), visible focus, labels, keyboard.
2. Interaction: 44x44 px minimum targets (48 dp in M3), loading feedback, no hover-only state.
3. Performance: src internal targets CLS 0, LCP < 1.2 s, INP < 50 ms ("good" Core Web Vitals thresholds: LCP 2.5 s, INP 200 ms, CLS 0.1); space reserved for media.

BM25 scores are not comparable across domains: `--brief` juxtaposes, it does not rank. 4. Style: one visual language per surface, consistent with the product type (`--domain product`). 5. Layout: mobile first, no horizontal scrolling, zoom never blocked. 6. Typography and color: 16 px base, 1.5 line height, semantic tokens only. 7. Motion: the animation carries meaning, exit faster than entry, reduced motion respected. 8. Forms: visible label, error at the field, inline help. 9. Navigation: predictable back, deep links, 5 entries maximum in the bottom bar. 10. Charts: legend, tooltips, meaning never carried by color alone (skill `dataviz` for rendering).

Full text of the rules: `references/quick-reference.md`; app rules and pre-delivery checklist: `references/pro-rules.md` (upstream, English).

## Before delivery

Go through the checklist of `references/pro-rules.md`, then `gds audit-slop <path>` and the skill `humanizer` on the interface text, then Gemini review (`mcp__relay__gemini_review`), verdict in `docs/reviews/`.

## Data

`data/`: upstream subset (MIT, `LICENSE`) - `ux-guidelines`, `app-interface`, `styles`, `products`, `landing`, `charts`, `google-fonts` (+ `google-font-licenses.json`, google/fonts revision `038b637d`), `stacks/threejs`, `stacks/winui`, `data-provenance.json`. Removed because they are outside the stack: hex palettes, Tailwind pairs, third-party icons, GSAP, React performance, JS web stacks. Update: compare with `nextlevelbuilder/ui-ux-pro-max-skill` (no local clone), then copy the same files again.
