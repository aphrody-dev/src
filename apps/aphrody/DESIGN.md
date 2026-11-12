# DESIGN.md — aphrody.com

Design specification for the aphrody.com brand homepage. Requirements and content live in `PRD.md`; this file defines the visual system. The tokens are implemented in `src/seo/home-css.ts`.

## 1. Idea

Aphrody's flagship idea is the tiling desktop (aphrody.app). The homepage borrows that vernacular instead of a generic card grid: the products form one tiled composition, partitioned like the "dwindle" layout of `aphrody-core`, separated by uniform gaps, and the tile under the pointer or keyboard focus takes the "active border", exactly as a focused window does in a tiling window manager. That is the one bold element. Everything else is quiet: left-aligned prose, generous margins, no decoration.

## 2. Color

| Token      | Light     | Dark      | Use                                              |
| :--------- | :-------- | :-------- | :----------------------------------------------- |
| `--paper`  | `#F2F4F1` | `#151B21` | Page background                                  |
| `--tile`   | `#FFFFFF` | `#1C242C` | Tile surface                                     |
| `--ink`    | `#17202A` | `#E6EAEE` | Text, brand mark                                 |
| `--muted`  | `#55606B` | `#A3ADB7` | Secondary text                                   |
| `--rule`   | `#848E96` | `#647381` | Tile borders (3:1 against the page, WCAG 1.4.11) |
| `--active` | `#0B7A75` | `#3FC1B9` | Active tile border, focus ring, links            |
| `--live`   | `#2E6B3A` | `#7CC98A` | "En ligne" status                                |
| `--dev`    | `#8A5A00` | `#E3B35C` | "En développement" status                        |

Contrast (WCAG 2.2, computed): light ink/paper 14.87, muted/tile 6.42, active/paper 4.68, active/tile 5.18, live/tile 6.40, dev/tile 5.93, rule/paper 3.02; dark ink/paper 14.35, muted/tile 6.89, active/tile 7.13, live/tile 7.91, dev/tile 8.12, rule/paper 3.56. Theme follows `prefers-color-scheme`; no toggle is needed without JavaScript.

## 3. Type

- One family: **Atkinson Hyperlegible Next** (OFL, variable weight), self-hosted as `/atkinson-next.woff2` (license: `/atkinson-next-OFL.txt`), preloaded, `font-display: optional` so a late font never swaps in and shifts the layout (CLS 0).
- Scale (1.25 ratio, 18 px body): h1 `clamp(2.25rem, 1.6rem + 2.6vw, 3.6rem)` / 1.08, weight 700, tracking -0.015em; h2 1.6rem / 1.2, weight 700; tile name 1.4rem / 1.2, weight 700; body 1.125rem / 1.6; small 0.95rem / 1.5.
- Sentence case everywhere. No all-caps labels, no single-word accents in headlines, no monospace labels.
- Measure: prose capped at 64ch.

## 4. Layout

- Container: `max-width: 76rem`, side padding `clamp(1.25rem, 4vw, 3rem)`.
- Mosaic: CSS grid `2fr 1fr 1fr` x 2 rows at >= 720 px (dwindle: the main tile takes half, the rest splits recursively). The aphrody.app tile spans both rows of column 1 and lists verified facts from its repository; Recherche spans columns 2-3 on row 1; Paquets and Benchmarks split row 2. Gap `0.75rem` (the "gaps_in" of a tiling WM). Tiles have a 1 px `--rule` border and a 6 px radius, the same on every tile because they are siblings of equal rank.
- Below 720 px: single column, aphrody.app first.
- Section rhythm: `clamp(3rem, 6vw, 6rem)` between sections; sections are separated by space, not by rules.

## 5. Interaction and motion

- Tile hover and `:focus-visible`: border becomes `--active` and an inset 1 px ring doubles it to 2 px, so nothing moves, transition 120 ms. This is the only motion on the page, and it answers the user's pointer or keyboard.
- `prefers-reduced-motion: reduce` removes the transition.
- Focus ring for every other link: 2 px `--active` outline, 3 px offset.
- Touch targets >= 44 x 44 px.

## 6. Anti-slop rules

- No emoji, no gradients, no shadows, no stock imagery, no fake metrics or testimonials.
- No eyebrow labels above headings, no middle-dot meta strings, no arrows appended to link text.
- Product status is plain text with a colored text label, never a fake "live" pulse animation.
- Copy names things by what people use ("le catalogue de paquets"), not by how they are built.
