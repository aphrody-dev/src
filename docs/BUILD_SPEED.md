# Build speed of the root Cargo workspace

Goal: the shortest edit-compile loop for `cargo build --workspace` at `C:\src`,
without touching the fat-LTO release profile and without breaking Linux builds.
Applied settings live in `.cargo/config.toml` and in the `[profile.dev*]` tables
of the root `Cargo.toml`.

## Hardware and toolchain

| Item      | Value                                                                  |
| --------- | ---------------------------------------------------------------------- |
| CPU       | Intel Core i7-13700F, 16 cores (8P + 8E), 24 threads                   |
| RAM       | 32 GB                                                                  |
| Disk      | `C:` NTFS, no Dev Drive (no ReFS volume present)                       |
| OS        | Windows 11 Pro 10.0.28120, host `x86_64-pc-windows-msvc`               |
| Toolchain | rustc 1.101.0-nightly (708c94ef0 2026-11-03), LLVM 23.1.5, cargo 1.101 |
| Workspace | 34 members, 636 compilation units in a clean dev build                 |

## Method

- Clean: `cargo clean` then `cargo build --workspace`.
- No-op: `cargo build --workspace` with nothing changed.
- Leaf: edit `crates/xtask/src/main.rs` (append a `pub fn`), rebuild.
- Core: edit `crates/depot-core/src/lib.rs`, rebuild (recompiles depot-forge,
  depot-graph, depot-ingest, four depot-cli binaries and the depot-ffi cdylib).
- Touch variants (`mtime` only) were also measured; they behave like the edits.
- All runs used an isolated git worktree of `4a2e127` so that concurrent edits
  in `C:\src` did not leak in, one target dir per variant, and variants were
  interleaved run by run (A, B, A, B, ...).
- The machine was shared with other release builds during the whole session, so
  wall-clock numbers are noisy. The tables report the minimum of 6 to 8 runs
  (closest to an idle machine) and the median in parentheses.

## Baseline vs final

Baseline is the state found on the machine: `RUSTC_WRAPPER=sccache` and
`CARGO_BUILD_JOBS=8` in the user environment, link.exe, debuginfo for every
crate. Final is this repository's config with those two environment variables
removed (see "Owner actions").

| Scenario          | Baseline      | Final         | Delta |
| ----------------- | ------------- | ------------- | ----- |
| Clean             | 69.3 s        | 53.2 s        | -23%  |
| No-op             | 0.68 s (0.96) | 0.72 s (0.85) | noise |
| Leaf edit (xtask) | 1.26 s (1.61) | 1.10 s (1.28) | -13%  |
| Core edit (depot) | 3.81 s (5.23) | 2.93 s (3.66) | -23%  |
| Core touch        | 3.32 s (4.60) | 2.62 s (2.72) | -21%  |
| `target/` size    | 2.4 GB        | 2.0 GB        | -17%  |

An earlier hyperfine run on a quieter machine, same worktree, baseline env:
leaf 1.92 s +- 0.83, core 8.44 s +- 3.66 with sccache, against leaf 1.05 s,
core 3.19 s with sccache disabled. The sccache penalty on incremental builds is
the largest single item.

## Where the time goes

Clean build critical path (cargo `--timings`, 60 s run):
`ash` build script -> `ash` (10 s, frontend bound) -> `gpu-allocator` ->
`wgpu-hal` (7 s) -> `wgpu-core` (10 s) -> `sovereign-corelib` -> `rust-stack`
(11.6 s, 9 s of codegen at `opt-level = 1`) -> `rust-stack` binary.
Other heavy units off the critical path: `windows` 0.62 (13.6 s),
`lightningcss` (13.5 s), `naga` (13.5 s), `gix` (8.7 s), `iced-x86`, `rustls`.

Core edit (3.7 s in that run): 0.9 s of cargo start-up and fingerprinting before
the first rustc, depot-core 0.9 s, its three dependents 0.7 s in parallel, then
the four depot-cli binaries and the depot-ffi cdylib, 1.4 to 1.8 s each, mostly
link. The no-op floor (0.7 s) is cargo stat-ing 636 units on NTFS with Defender
real-time scanning.

## Levers

| Lever                                         | Measured effect                                                                                            | Decision                                                      |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Disable sccache (`build.rustc-wrapper = ""`)  | Clean 80 -> 67 s at jobs=8 on a fresh path; leaf 1.9 -> 1.05 s; core 8.4 -> 3.2 s. Fixes os error 206      | Kept (needs the env var removed too)                          |
| Jobs 8 -> 24 (default = ncpu)                 | Clean 67 -> 55 s; incremental unchanged                                                                    | Kept by default; needs `CARGO_BUILD_JOBS` removed             |
| `rust-lld` linker on windows-msvc             | Core edit min 3.24 -> 2.90 s (-10%), leaf unchanged, clean within noise                                    | Kept                                                          |
| No debuginfo for dependencies                 | `target/` 2.4 -> 2.0 GB; time within noise                                                                 | Kept (less I/O, workspace crates keep debug = 1)              |
| `debug = 0` for workspace crates too          | Core edit min 2.90 -> 2.69 s with rust-lld                                                                 | Rejected: loses breakpoints and backtrace lines for 0.2 s     |
| `debug = "line-tables-only"` everywhere       | No measurable change                                                                                       | Rejected                                                      |
| `-Zthreads=8`                                 | No change (leaf/core frontends are 0.3 s, the big crates are deps built once)                              | Rejected                                                      |
| Cranelift for workspace crates, LLVM for deps | Builds fine on windows-msvc; core/leaf within noise, clean +5%                                             | Rejected: no gain here, and the containers lack the component |
| `-Zfeature-unification`, `workspace` mode     | `cargo build -p depot-core` after a workspace build: 120 -> 0 recompiled units; `-p xtk`: 14 -> 0          | Kept                                                          |
| `split-debuginfo = "unpacked"`                | No effect on MSVC (always a PDB)                                                                           | Kept for Linux, where it skips the objcopy pass               |
| `-Zshare-generics`, metadata embedding        | Already the nightly dev defaults                                                                           | Nothing to do                                                 |
| `rust-stack` `opt-level = 1` -> 0             | rust-stack lib 11.6 -> about 3.8 s, about 8 s off the clean critical path; touch rebuild 2.2 -> 1.9 s      | Not applied: the override is deliberate for runtime speed     |
| Short `build.build-dir`                       | Not needed: the 206 error is sccache, see below                                                            | Not applied                                                   |
| Duplicate versions (`cargo tree -d`)          | All duplicates are transitive (gix 0.61 internals, syn 1/2/3, windows-sys 0.52/0.59/0.61, sha2, hashbrown) | Not applied: no trivial bump in our manifests                 |
| cargo-hakari                                  | Superseded by cargo's own workspace feature unification                                                    | Not applied                                                   |
| Dev Drive (ReFS) + Defender exclusion         | Not measurable without admin; it attacks the no-op floor and link I/O                                      | Owner action                                                  |

### os error 206 under sccache

Reproduced with `cargo build -p gamescope-web-wasm --target wasm32-unknown-unknown`.
web-sys passes one `--check-cfg cfg(feature, values(...))` argument listing
every web-sys feature, which pushes the rustc command line past the 32 767
character limit of `CreateProcess`. Cargo falls back to an `@argfile`, but
sccache expands it and spawns rustc with the full line, which fails. The same
build passes without the wrapper, in dev and release. A shorter build dir would
not help, since the long argument is not a path.

### Release

`[profile.release]` is unchanged: fat LTO, one codegen unit, `panic = "abort"`,
symbols stripped. `cargo build --release --workspace` and the release wasm32
build of gamescope-web-wasm both pass with rust-lld.

## Linux

- `x86_64-unknown-linux-gnu` (Arch `dev` image, nightly): the toolchain already
  links with its bundled `rust-lld`, so `.cargo/config.toml` sets nothing for
  Linux. `split-debuginfo = "unpacked"` applies there.
- mold or wild would be the next step for Linux links. Neither is installed in
  the `dev` image (it has `lld`). To try one, add a target table such as
  `[target.x86_64-unknown-linux-gnu] rustflags = ["-Clink-arg=-fuse-ld=mold"]`
  after installing mold in the image.
- `x86_64-unknown-linux-musl` (Alpine `builder`): keeps the default linker;
  it only builds release binaries, which this change does not touch.
- `[unstable]` is ignored by a stable cargo. The containers use nightly, so
  feature unification applies there too.

## Owner actions

1. Remove `RUSTC_WRAPPER` and `CARGO_BUILD_JOBS` from the Windows user
   environment (System Properties > Environment Variables). Cargo gives
   environment variables priority over every config file, so the repo config
   cannot override them. Until then, the sccache and 8-job settings stay in
   effect for every shell that inherits them.
2. Create a Dev Drive (Settings > System > Storage > Disks and volumes > Create
   Dev Drive, ReFS), point `CARGO_TARGET_DIR` (or `build.build-dir`) at it, and
   let Defender run in performance mode on it. Needs administrator rights.
3. Optional: keep sccache for other repos by moving `rustc-wrapper` out of the
   environment and into `~/.cargo/config.toml` only; this repo then turns it off.

## Reproduce

```sh
cargo build --workspace --timings          # report in target/cargo-timings/
cargo tree -d                              # duplicate versions
cargo build -v -p xtk 2>&1 | grep Running  # check that no wrapper is in front of rustc
```
