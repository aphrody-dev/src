# crates.io: readiness status (2026-11-12)

Everything was run on fr2 (`nice`, cargo nightly 1.102.0 of 2026-11-06), on copies: a `git archive` of `C:\src-merge` (merge/labs, 06ebcae) and the tracked or non-ignored files of `C:\labs` (without third_party/). Nothing was compiled on the PC and nothing was published. In the copies, the `[source.crates-io] replace-with = "vendored-sources"` of `.cargo/config.toml` is removed, because `third_party/crates` is not copied.

## Results

| Tree | Crates | As is (`cargo package --no-verify`) | With the patch | `publish --dry-run` (with verify) |
|---|---|---|---|---|
| C:\labs | 25 | 4 OK, 21 KO (path dependencies without version) | **25/25 OK** | 13 verified OK, then **failure on `aphrody-lore-transport`** (see B2) |
| C:\src-merge | 69 | majority KO (path dependencies without version) | **66/66 OK** (3 excluded, see B1) | not run (69 crates; to be done in CI once B2 and B3 are resolved) |

Generated patches (applied and tested on fr2, `git apply --check` OK locally):
- `docs/publish/src-publish-fields.patch`: to apply on the src merge branch (`git apply`, then `cargo update -w` for the lock, which is excluded from the patch). 103 files;
- `docs/publish/labs-publish-fields.patch`: same transformation for C:\labs. 47 files. Not applied, pending the labs-to-src merge (the lore* crates exist in both trees and must be published only once, from src).

Patch contents:
1. `version = "<x>"` on every internal path dependency (workspace.dependencies and members).
2. Renames forced by already-taken names and the rule of `docs/IDENTITY.md` (`aphrody-<dir>`): `lore` becomes `aphrody-lore` (taken: 0.1.0, maintained by a third party), `ffi` becomes `aphrody-ffi`, `sys` becomes `aphrody-sys`, and for consistency `lore-*` becomes `aphrody-lore-*` (20 crates). The dependency key stays unchanged (`lore = { …, package = "aphrody-lore" }`), so the code is not touched.
3. Internal dev-dependencies inherited from the workspace become path-only, which cargo strips when packaging. Without this, the cycle `lore-base` → `lore-io` → (dev) `lore-base` blocks.
4. `publish = false` and `publish.workspace` are removed, except for the blocked crates (B1) and `lore-integration-tests`.
5. Metadata: `license` (lore*: `MIT` + a copy of `licenses/lore/LICENSE` in each crate, Epic notice kept; `xtk`, `stack-bench`: `license.workspace`), `description` when missing, `repository.workspace`. In src, `repository` is fixed: `aphrody-labs/src` does not exist, the right repository is `aphrody-dev/src`. LICENSE-MIT and LICENSE-APACHE are added at the root of src. For labs, both files are already added at the root.
6. npm (src/packages): see NPM.md.

## Names

The 70 final names (after renaming) are **free** on crates.io (API, 2026-11-12), including `aphrody`. The 191 existing `aphrody-*` crates belong to `aphrody-dev`, so the crates.io account is the right one.
Recommendation, not included in the patch: also prefix the generic names, in line with IDENTITY.md. `archguard`, `depot-*` (12), `gamescope-*` (4), `unix-*` (3), `cosmic-compat`, `hypr-tiler`, `smithay-wayland-wire`, `dx12-hal`, `wslg-cli`, `ring3-agent`, `rust-stack`, `sovereign-corelib`, `stack-bench`, `xtk`, `steam-depot` would become `aphrody-<name>`; these 31 prefixed names are all free.

## Remaining blockers

- **B1. Crates not publishable as they are**
  - `aphrody-remote` depends on `russh` via a git `[patch.crates-io]` (fork `aphrody-dev/russh`, sntrup761). On crates.io it resolves `russh 0.65` and fails (`pkcs1` conflict). The fork must be published under another name (for example `aphrody-russh`) or upstream must be waited for.
  - `aphrody` (crates/ay) depends on `aphrody-remote`.
  - `steam-depot` depends on `steamroom` (path to third_party, without version) and touches the Steam SDK: it stays internal (audit).
  - In addition, `aphrody` (crates/ay in src) and `aphrody` (crates/cli in labs) carry the same package name. This must be decided during the merge.
- **B2. `[patch.crates-io]` patches lost on publication.** `vendor/quinn-proto` (`LORE:` additions: `max_rtt`, `is_crypto`, `BbrConfig::max_window`) does not exist on crates.io, hence `E0599` in `aphrody-lore-transport` at verify. Same for `vendor/glob-match` (`**` fix). These forks must be published under their own name (`aphrody-quinn-proto`, `aphrody-glob-match`) and referenced with `package = …`, or the changes must be accepted upstream.
- **B3. Build configuration missing on the user side.** `.cargo/config.toml` forces `--cfg tokio_unstable` and `--cfg uuid_unstable`, as well as `cargo-features = ["codegen-backend", "panic-immediate-abort"]` (nightly). A published crate that requires these cfgs does not compile with an ordinary `cargo install`. These uses must be isolated behind a feature, or `RUSTFLAGS` documented. `rust-version` is 1.85 in src and 1.97 in labs, while the code requires nightly.
- **B4.** No explicit `readme`: cargo takes `README.md` when it exists in the crate, and most do not have one. This is a warning, not an error.

## Publication order (topological, the one computed by `cargo package --workspace`)

src (after patch, without B1):
aphrody-apm, aphrody-conformance, aphrody-design-shared, aphrody-design-tokens, aphrody-design-emit, aphrody-design-icons, aphrody-design-sprite-sheet, aphrody-design-identity, aphrody-design-layout, depot-core, depot-forge, depot-treesitter, depot-graph, depot-ingest, depot-migrate, depot-re, sovereign-corelib, aphrody-ffi, aphrody-labs-cli, aphrody-lore-error-set-macro, aphrody-lore-error-set, aphrody-lore-macro, aphrody-lore-io, aphrody-lore-base, aphrody-lore-credential, aphrody-lore-proto, aphrody-lore-fuse, aphrody-lore-telemetry, aphrody-lore-transport (B2), aphrody-lore-storage, aphrody-lore-revision, aphrody-lore-notification, aphrody-lore, aphrody-lore-aws, aphrody-lore-capi, aphrody-lore-chaos-client, aphrody-lore-client, aphrody-lore-hashicorp, aphrody-lore-server, unix-cachyos, aphrody-omarchy, aphrody-up, aphrody-rt, aphrody-sys, archguard, hypr-tiler, dx12-hal, smithay-wayland-wire, cosmic-compat, depot-cas, depot-cipd, depot-cli, depot-gclient, depot-vpython, gamescope-core, gamescope-wgsl, gamescope-cli, gamescope-web-wasm, ring3-agent, rust-stack, stack-bench, unix-distro, wslg-cli, xtk.
The B2 forks (aphrody-quinn-proto, aphrody-glob-match) go before aphrody-lore-transport.

labs, specific to labs (the rest is already in src): aphrody-conformance, aphrody (cli), aphrody-apm, aphrody-factory.

Check command, to run on fr2 or in CI once the patch is applied: `cargo publish --dry-run --workspace --exclude aphrody --exclude aphrody-remote --exclude steam-depot --exclude aphrody-lore-integration-tests`.
