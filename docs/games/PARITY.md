# Parity list (2026-11-13)

One row per feature replaced or introduced by the merged Aphrody app and the game (PLAN.md section 6). State values: `not started`, `partial` (code exists, check not green), `done` (check green and recorded below). Nothing is deleted from `apps/aphrody` or `apps/aphrody-app` until its row is `done`.

## Checks (real files)

| Check                                                             | File                                              | Where it runs                                            |
| ----------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| Rust tests, wasm32 release build, wasm-bindgen, `/play` bundle    | `.github/workflows/game.yml`                      | fr1 runner                                               |
| Frame rate: median fps, p95 frame time (Chrome DevTools protocol) | `scripts/game-fps.ts`, `scripts/game-fps.test.ts` | any host with a WebGPU Chrome; exit 2 means not measured |
| Deterministic generated assets (`gen-assets --check`)             | `crates/game/src/bin/gen-assets.rs`               | `game.yml`                                               |
| `/play` page and CSP                                              | `apps/aphrody/tests/play.test.ts`                 | `bun test`                                               |

## Game (crates/game, served at /play)

| Feature                                                                                       | Replaced / target | State                     | Check                                               |
| --------------------------------------------------------------------------------------------- | ----------------- | ------------------------- | --------------------------------------------------- |
| Streamed procedural terrain chunks (noise, vertex-color biomes, nearest-first budget)         | new               | partial                   | `cargo test -p game`                                |
| Third-person controller: keyboard, mouse look, gamepad (Gamepad API through gilrs on the web) | new               | partial                   | `cargo test -p game` (input paths need a browser)   |
| Day/night: sun, sky, fog, ambient                                                             | new               | partial                   | `cargo test -p game`                                |
| Procedural audio: wind, pad, footsteps (WAV from formulas)                                    | new               | partial                   | `cargo test -p game`; audible check needs a browser |
| Deterministic GLB character and SVG icons                                                     | new               | partial                   | `gen-assets --check`                                |
| wasm32 + WebGPU build                                                                         | new               | partial                   | `game.yml`                                          |
| WebGPU required, message when absent                                                          | new               | partial                   | `play.test.ts`, manual                              |
| 120 fps at 1080p                                                                              | PLAN.md target    | not measured              | `scripts/game-fps.ts --min-fps 120`                 |
| Open-world multiplayer                                                                        | PLAN.md target    | not started (design note) | `MULTIPLAYER.md`                                    |
| Video playback                                                                                | PLAN.md target    | not started               | `MEDIA-STACK.md`                                    |
| Craft Apps and ArtCraft hosting                                                               | PLAN.md target    | not started               | `ARTCRAFT.md`                                       |
| Feature matrix against Unreal Engine                                                          | PLAN.md target    | partial                   | `FEATURE-MATRIX.md`                                 |

## Merge of the two Aphrody apps

The per-route table is in `MERGE-APHRODY.md`. Summary by state:

| Group                                                                         | State                                                                  |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `/play` served by `apps/aphrody` (own CSP, `_headers`, build step)            | partial (code and tests in place, wasm artifact comes from `game.yml`) |
| aphrody.com routes, SEO documents, edge worker                                | kept in `apps/aphrody`                                                 |
| aphrody.app shell, wasm client, host endpoints, WebMCP, Fluid sync, packaging | kept in `apps/aphrody-app`, not merged                                 |
| One Worker for both hostnames, one WebMCP registry, crates moved to `crates/` | not started                                                            |
