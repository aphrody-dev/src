# Recon map: console-style shells (living-room UI, handheld dual-screen UI)

Scope: the shell layer only (profile picker, home, nav, store blocks, library, app hub, settings, overlays, input hints). No games, no store backend, no network service.
For: the gamescope console shell (`crates/gamescope-*`, `crates/aphrody-ui`, Bevy and WebGPU wasm) and the companion app (`apps/aphrody-app`).
Date: 2026-11-13
Method: clean-room. Structure read from the owner-supplied files (frame, component and variant names, text layers, thumbnails, exported PNGs). No third-party bytes enter the repository; reference captures stay in a local temp directory outside the repo (`%TEMP%/recon`), never committed or shipped.

## Sources

| #   | source                                        | URL / path                                                                                | notes                                                                                                                                                                                      |
| --- | --------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | PlayStation-style shell, 1920x1080            | `assets/Gamescope.fig`; Figma `xcwISv6VTGVRgso60oAGIb` node `6:449`                       | 220 embedded images, about 1400 named layers, 2021-12 design study; pages "Home Page", "Login page", "Components"                                                                          |
| 2   | Switch 2 style home, 1920x1080                | `assets/consolde.fig`; Figma `QVSaOL3QEiUIByuhsUT0zp`                                     | "Nintendo Switch 2 UI Design" community kit: Home Screen, Colors, UI Kit, Components, Guide; fonts Instrument Sans and Karla (OFL, Google Fonts)                                           |
| 3   | Switch 2 marketing composite                  | `assets/Nintendo Switch 2 UI Design.png`                                                  | cover of source 2: tile row, circular menu row, profile avatar, controller and battery indicator                                                                                           |
| 4   | Dual-screen handheld design system ("mobile") | `assets/mobile.fig`, `assets/mobile.zip`; Figma `lyBuLydYgYXfo3j8GqKeOL` node `13:2095`   | NOT a phone UI: a "DS Design System" v1.3.3 (pixel font NDS12, Inter, tokens.json). The Figma tab was not opened: the local .fig carries the same file, and the Figma seat is rate limited |
| 5   | Existing gamescope design capture             | `docs/design/gamescope/components-overview.png`                                           | overview of source 1 components, 9860x3704                                                                                                                                                 |
| 6   | Existing code                                 | `crates/gamescope-core/src/ui.rs`, `crates/aphrody-ui/src/components`, `apps/aphrody-app` | Rect, Dir, Input, spatial_next, Smooth, row_xs, Painter already exist                                                                                                                      |

Terms: sources 1 to 4 are community fan studies of trademarked products; they are reference for layout and interaction only.

## Core loop

Pick profile, land on a home row of game tiles, move a focus cursor with d-pad or stick, press A to launch or open a store or app page, press B to go back.

## Screens

Source tag: P = source 1 (PlayStation-style), N = source 2/3 (Switch 2 style), D = source 4 (DS).

| ID  | screen                       | how to reach            | purpose                                  | key components                                                                                                              | states seen                       |
| --- | ---------------------------- | ----------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| S01 | Login / profile picker (P)   | boot                    | who is playing                           | wallpaper light cone, avatar x N, add-user tile, clock, power, controller hint                                              | default, focused avatar, add user |
| S02 | Profile overlay (P)          | avatar from nav         | "Welcome back", who uses this controller | overlay card, avatar, controller prompt                                                                                     | default                           |
| S03 | Home, game row (P)           | S01 confirm             | launch last played, hero art             | nav bar, hero splash, game tile row, "Must see" menu block                                                                  | tile default / selected           |
| S04 | Home, tile row (N)           | boot                    | launch games                             | status bar, game tile row (default/selected with border stroke), title label, profile avatar, battery, controller indicator | game=yes/no x selected=yes/no     |
| S05 | Round menu row (N)           | down from S04           | system shortcuts                         | 8 round icons: Online, News, eShop, Album, GameChat, Controllers, GameShare, Settings, Power, Virtual Game Cards            | selected yes/no, online badge     |
| S06 | Store home (P)               | nav "PlayStation Store" | discover                                 | store nav (Latest, Deals, Collections, Subscriptions, Browse), store blocks (discover, editor, deals, game blocks)          | block default / selected          |
| S07 | Store collection page (P)    | S06 block               | curated list                             | hero splash, tile grid, "See all"                                                                                           | default                           |
| S08 | Product page (P)             | S06/S07 tile            | buy or play                              | splash, title, blurb, price, Subscribe / Play Now / Play Game, release, size, publisher, rating                             | free, paid, subscription          |
| S09 | Game hub page (P)            | S03 tile                | per-game info                            | hero, Play Game, news cards, trophy progress, platform labels                                                               | owned                             |
| S10 | Trophies (P)                 | S09                     | progress                                 | bronze, silver, gold, platinum medals, progress bar, earned state                                                           | earned / locked                   |
| S11 | Game library (P)             | nav "library"           | owned games                              | grid, sort selector, console storage figure                                                                                 | sort by name                      |
| S12 | Explore / news (P)           | nav "Explore"           | official news                            | news card, relative time, Learn more                                                                                        | default                           |
| S13 | Media / app library (P)      | nav "Media"             | streaming and music apps                 | app tiles (all apps, TV and video, music), app page, Start / Read more                                                      | tile selected                     |
| S14 | Streaming app page (P)       | S13 tile                | provider hero                            | splash, featured row, Watch on                                                                                              | default                           |
| S15 | Search (P)                   | nav search              | find content                             | text field, results                                                                                                         | empty, results                    |
| S16 | Settings (P)                 | nav gear                | system                                   | list rows                                                                                                                   | default                           |
| S17 | Quick menu / more (P)        | button                  | cart, heart, more                        | icon buttons                                                                                                                | default / highlighted / selected  |
| S18 | Software settings dialog (N) | + button on tile        | options                                  | options menu, A / + button hints                                                                                            | open                              |
| S19 | DS home, top screen (D)      | boot                    | clock and calendar                       | username bar, date/time, battery, analog clock, month calendar                                                              | default                           |
| S20 | DS home, bottom screen (D)   | boot                    | launcher                                 | profile card, Pictochat, Download Play, start game cards, brightness, clock                                                 | selected card (corner brackets)   |
| S21 | Chat room (D)                | S20 Pictochat           | local chat                               | room tabs A-D, theme (Sky, Forest), scroller, whiteboard                                                                    | whiteboard open                   |
| S22 | Download Play (D)            | S20                     | pick a nearby host                       | list, confirm dialog                                                                                                        | default                           |
| S23 | Settings menu (D)            | S20 gear                | Options: GBA mode, Language, Start-Up    | menu grid (small/large/XL), dialogue, bottom screen choices, confirm                                                        | select, confirm                   |

Total 23 screens (10 P+N core, rest secondary).

## Flows

```
F01 Boot to launch
    S01 -> S03 or S04 (focus last game) -> A
    happy path clicks: 2 (profile confirm, A)
    edge: no profile (add user), no games (empty row), controller disconnected
F02 Switch profile
    S03 -> S02 -> S01
    edge: PIN lock, guest
F03 Browse and open a product
    S03 -> S06 -> S07 -> S08
    clicks: 4
    edge: owned (Play), subscription-only, region price
F04 Library to hub to trophies
    S03 -> S11 -> S09 -> S10
F05 Round menu action
    S04 -> S05 -> (Album | Controllers | Settings | Power)
F06 Media app
    S03 -> S13 -> S14 -> launch
F07 Search
    any -> S15 -> S08
F08 Settings change (DS)
    S20 -> S23 -> select option -> confirm -> back
F09 Local chat (DS)
    S20 -> S21 -> pick room -> write -> send
F10 Back / home from anywhere
    any -> B (back) / home button -> S03
```

## Components

| component              | variants                                       | states                                         | used on       |
| ---------------------- | ---------------------------------------------- | ---------------------------------------------- | ------------- |
| Nav bar item           | Media, Games, Explore, Search, Settings, Store | unselected, selected, box, no box              | S03-S17       |
| Game tile              | 16:9 art                                       | default, selected (stroke, scale), game yes/no | S03, S04, S11 |
| Store block            | discover, editor, deals, game                  | default, selected                              | S06           |
| Menu item (round)      | 10 types                                       | selected, badge (online)                       | S05           |
| Avatar                 | 6+ styles                                      | default, selected                              | S01, S04, S19 |
| Button                 | primary, secondary, icon                       | default, focus, pressed, disabled              | all           |
| Button hint            | A, B, X, Y, +, -                               | static                                         | footer        |
| Trophy                 | bronze, silver, gold, platinum                 | earned, locked                                 | S10           |
| Status bar             | clock, battery, controller number, online      | static                                         | S04, S19      |
| Progress bar           | trophies, download                             | n%                                             | S10           |
| Text field             | search, chat                                   | empty, focused                                 | S15, S21      |
| Dialogue               | confirm, option list                           | open                                           | S18, S23      |
| Splash hero            | game, app                                      | default                                        | S06-S14       |
| Menu grid              | small, large, XL                               | cell selected (corner brackets), press         | S20, S23      |
| Calendar, analog clock | month view                                     | today highlight                                | S19           |
| Scroller               | vertical                                       | thumb                                          | S21, S11      |
| Focus cursor           | glow border / bracket corners                  | moving                                         | all           |

## Inferred data model

```
User        id, name, avatar_id, pin?, last_profile_at          evidence: S01, S02, S19   confidence: high
Game        id, title, cover_ref, hero_ref, platform, size      evidence: S04, S09, S11   confidence: high
Library     user_id, game_id, last_played_at, playtime          evidence: S03, S11        confidence: high
Product     id, game_id, price, currency, sale, kind (game|sub) evidence: S08             confidence: medium
Collection  id, title, product_ids[]                            evidence: S06, S07        confidence: medium
Trophy      id, game_id, tier, title, earned_at?                evidence: S10             confidence: high
NewsItem    id, game_id?, title, body, published_at             evidence: S12             confidence: medium
App         id, name, kind (video|music), launch_ref            evidence: S13, S14        confidence: medium
Setting     key, value                                          evidence: S16, S23        confidence: medium
Controller  slot, user_id, battery, kind                        evidence: S04 indicator   confidence: medium
```

Relationships: User 1-n Library, Game 1-n Trophy, Game 1-n Product, Collection n-n Product, User 1-n Controller.

## Mapping to the gamescope console shell (Bevy / WebGPU wasm)

| recon item                                 | target                                                                                            |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Focus cursor, d-pad nav (all)              | `gamescope-core::ui` `spatial_next`, `Dir`, `Input`; add focus-scale spring via `Smooth`          |
| Tile row, round menu row (S04, S05)        | `row_xs` + `Painter` quads; `aphrody-ui` focus/motion modules                                     |
| Nav bar, store blocks, hero (S03, S06-S14) | new shell screens in `gamescope-web-wasm`, tokens from `packages/design`                          |
| Profile picker (S01, S02)                  | shell screen plus `User` store (OPFS in wasm, sqlite native)                                      |
| Status bar, hints (S04)                    | shared overlay in `gamescope-core::composition`                                                   |
| HDR and pacing                             | existing `hdr.rs`, `pacing.rs` (no reference counterpart)                                         |
| Library, trophies, search (S10, S11, S15)  | data layer in `aphrody-ui` or a `gamescope-shell` crate; trophies need our own achievement schema |

## Mapping to the mobile companion (`apps/aphrody-app`)

The supplied "mobile" source is a DS dual-screen kit, so it informs patterns, not a phone layout: top screen = status/clock/calendar becomes the companion Home header; bottom screen launcher cards = companion actions (library, remote, friends); F08 settings flow = companion settings; S21 local chat = companion party chat; D-pad hints = on-screen controller pad. Phone-specific layout (safe areas, bottom tab bar) has no source and must be designed from `docs/design/DESIGN_SYSTEM.md`.

## Feature matrix

See `features.csv`. Counts are in that file (must / should / could / skip).

## Out of scope (cannot or should not be cloned)

- Sony and Nintendo trademarks, logos, wordmarks, "PlayStation", "Switch", "Joy-Con", DS silhouettes, the two-tone console shapes, controller glyph sets (use original glyphs), "Nintendo eShop", "Online" badge.
- Key art, game covers, splash images (Call of Duty, Apex, NBA 2K, Fortnite, Astro, Ratchet, Mario Kart, Metroid, Cyberpunk, Spider-Man), screenshots embedded in the .fig files.
- Third-party service logos and marks (Netflix, Disney+, Peacock, Prime, Apple Music, Spotify, Hulu) and licensed catalogues.
- Fonts: NDS12 and Open Sans use are fine only if licensed; Instrument Sans, Karla, Inter are OFL and usable; do not copy the DS pixel font without checking its license.
- Sounds, themes, character avatars (Mario family), Pictochat and DS firmware assets.
- Network services: store, accounts, trophies sync, online play, parties, cloud saves, purchases and payments.
- Nothing from the Unreal side or any private source.

## Size

Screens 23, flows 10, entities 10. Hard parts: (1) 10-foot focus navigation with spring scaling, glow borders and consistent gamepad, keyboard and touch input across native and wasm; (2) text, image and vector rendering at 4K and HDR with GPU atlas streaming for hundreds of tiles and 60 to 144 fps pacing; (3) original art, icon, avatar and glyph set to replace every trademarked asset plus a content and store backend. Size: L for the shell with mock data (about a quarter), XL with store, trophies and accounts; companion app M on top.
