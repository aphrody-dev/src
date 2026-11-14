# Chromium stack alignment (2026-11-14)

## Pins (live data, fetched 2026-11-14 through fr1)

Source: `https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Windows&num=1[&milestone=N]`, `git ls-remote` on chromium.googlesource.com and github.com.

| Item | Pinned in DEPS / src.lock.json | Current | Source | Verdict |
|---|---|---|---|---|
| Chromium stable | `ef68a767` = main 160.0.8158.0 (canary, `fetch_commit`) | stable M158 = 158.0.8127.37 `b8c2be85`; M157 = 157.0.8103.80 `5cb0fce6` | fetch_releases (milestone=158, 157) | conflict: owner says 157, stable is already 158, pin is ToT 160; left as is, owner decision (downgrade of the local checkout) |
| V8 at 157 | not pinned separately (inside chromium/src) | `307108153d1e` (157), `b601a2347f00` (158) | fetch_releases hashes.v8 | informational |
| Skia at 157 | not pinned separately | `fef60e46c522` (157), `3279352fdf1f` (158) | fetch_releases hashes.skia | informational |
| Dawn at 157 | `third_party/dawn` `022096b3` | `106245fa2b9e` (157), `6e24542436a3` (158) | fetch_releases hashes.dawn | migrate: bump together with chromium pin |
| depot_tools | `1afcf075` | `ec77017fb3e090ff02bffb9c6980ebcdd3006ddc` (main) | `git ls-remote https://chromium.googlesource.com/chromium/tools/depot_tools.git refs/heads/main` | bumped (DEPS x2, src.lock.json x1) |
| rusty_v8 | `55ca54ea` (main) | latest tag v152.2.0 `2768994f` | `git ls-remote --tags https://github.com/denoland/rusty_v8` | migrate: lags Chromium V8 (15.7/15.8); no consumer of `third_party/rusty_v8` outside DEPS and lock |

## Inventory

| Item | Kind | Consumers | Chromium replacement | Verdict |
|---|---|---|---|---|
| wgpu (Cargo.lock wgpu, wgpu-core) | crate | 9 manifests: root, apps/shenron (3), aphrody-ui, gamescope-cli, corelib, gamescope-wgsl, gamescope-web-wasm | Dawn | migrate (live Bevy/shenron path) |
| third_party/wgpu | fork checkout | MAINTAINERS, chromium-bun engines registry | Dawn | migrate |
| vello | crate | 6 manifests (aphrody-ui, shenron koharu-*, shenron-gpu, root) | Skia (Graphite) | migrate |
| third_party/vello | checkout | 0 outside DEPS/lock | Skia | purge candidate, not removed (submodule removal in the shared dirty index) |
| resvg, tiny-skia | crate | resvg: root, asset-test, aphrody-ui; tiny-skia: transitive of resvg only | Skia | migrate |
| mlua | crate | apps/rosegriffon aphrody-nie-lua | none (Lua is not in the Chromium stack) | keep |
| boa_engine, rquickjs, deno_core, skia-safe | crate | 0 manifests | V8 / Skia | none present |
| third_party/servo | checkout | chromium-bun engines registry only | Chromium | migrate (engine comparison only) |
| third_party/rusty_v8 | checkout | 0 | V8 | purge candidate, not removed (see wgpu note) |
| tree-sitter-gn, tree-sitter-ninja | checkout | parsers for GN/ninja files, not fetchers | depot_tools gn/ninja | keep |
| vite 8.3.8 | package | root package.json | none | keep (outside scope) |

Existing owner of the matrix: `packages/chromium-bun/src/audit/purge-matrix.ts` (PURGE_FOR_BUN / KEEP_CHROMIUM_NATIVE verdicts).

## Not done

- Removing submodule checkouts (vello, rusty_v8): the shared index holds 1536 staged deletions from other sessions; a gitlink removal there is not isolable.
- `cargo metadata` / `cargo tree -i` on fr1 not run: only the depot_tools pin changed.
