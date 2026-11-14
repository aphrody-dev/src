# Figma file "Aphrody"

- File: https://www.figma.com/design/brAWl2aN1IfR9N7MpmIioq/Aphrody (file key `brAWl2aN1IfR9N7MpmIioq`, created 2026-11-13).
- Source of tokens: `packages/design/tokens/figma-variables.json` and `packages/design/DESIGN.md`. Mockup text: written for this file (the `packages/i18n` catalogs hold no home, catalog, play or Craft Apps keys); to move into `packages/i18n/locales/*.json` when the merged app is built.
- Status: design mockups only. The merged app, the /play game and the Craft Apps hub are not built (`docs/games/PLAN.md`). All art is original geometric vector shapes; no generated images, no third-party characters.

## Pages and node ids

| Page    | Page id | Content                                                                                                   |
| ------- | ------- | --------------------------------------------------------------------------------------------------------- |
| Tokens  | `0:1`   | Specimen frame `1:134`: color swatches bound to variables (light and dark), 15 type roles, spacing, shape |
| Mockups | `1:133` | One section per locale, four frames each (1280x800): Home, Catalog, Play, Craft Apps                      |

| Locale | Section | Home    | Catalog | Play    | Craft Apps |
| ------ | ------- | ------- | ------- | ------- | ---------- |
| en     | `2:248` | `2:2`   | `2:54`  | `2:124` | `2:171`    |
| fr     | `3:248` | `3:2`   | `3:54`  | `3:124` | `3:171`    |
| zh-CN  | `3:495` | `3:249` | `3:301` | `3:371` | `3:418`    |
| ja     | `3:742` | `3:496` | `3:548` | `3:618` | `3:665`    |
| es     | `3:989` | `3:743` | `3:795` | `3:865` | `3:912`    |

## Variables

- Collections: `Color Light` `VariableCollectionId:1:3` and `Color Dark` `1:53` (49 M3 scheme roles each, `Schemes/<Role>`, WEB code syntax `var(--md-sys-color-*)`), `M3 Shape` `1:103` (7 corners), `Spacing` `1:111` (xs 4, sm 8, md 16, lg 24, xl 32, xxl 48).
- Text styles (15, Google Sans Flex, M3 roles such as `title/medium`) follow `DESIGN.md`. zh-CN uses Noto Sans SC and ja Noto Sans JP, set directly (no style).
- Limits: the starter plan allows one mode per collection, so Light and Dark are separate collections and the medium and high contrast schemes plus the 144 tonal palette values of the JSON are not imported. Mockups are bound to `Color Light` and `M3 Shape`.

## Figma file "Aphrody UI" (`1T0gwiYcxRJdENK7lsOvxk`)

- File: https://www.figma.com/design/1T0gwiYcxRJdENK7lsOvxk/Aphrody-UI (file key `1T0gwiYcxRJdENK7lsOvxk`, populated 2026-11-14 via official Figma MCP `use_figma`).
- Component library: official [Material 3 Design Kit](https://www.figma.com/community/file/1035203688168086460/material-3-design-kit) (`M3` `Blue LT` `57298:14` and `Blue DT` `57298:15` variable modes, M3 text styles, `Navigation Rail`, `Search bar`, `Button`, `Assistive chip`, `Stacked card`, `Horizontal card`, `Switch`).
- Stitch parity: aligned with Google Stitch project `7027971799774493367` / design system `assets/8fa82e41c01247a8b97e684e661d0567` / screen `036d96efbf994849a040fbebfec120b3`.

| Page                            | Page id | Frames / Content                                                                                                                                                                                        |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aphrody Workspace — M3          | `0:1`   | `Aphrody UI — Light Desktop (M3 Blue)` (`7:485`, 1440x900) and `Aphrody UI — Dark Desktop (M3 Blue)` (`7:986`, 1440x900)                                                                                |
| M3 Foundations & Aphrody Tokens | `9:439` | `Aphrody Material 3 Foundations` (`9:879`), local `Aphrody M3 Schemes` collection (10 variables with `Light` and `Dark` modes matching `packages/design/DESIGN.md`), M3 type scale, component inventory |
