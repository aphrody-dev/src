# ay as the low-level CLI for Bun and Chromium: migration plan

Owner request (2026-11-13): `ay` (`crates/ay`) becomes the one low-level binary for Bun and
Chromium. Bun's documentation moves into `ay` continuously, the Rust of the Bun fork is extracted
into the core of `ay` in flattened form, the Chromium chain (depot_tools, gclient, gn, ninja,
autoninja) and the cross JS engines (V8, JavaScriptCore, Dawn, wgpu) are driven from `ay`, and the
whole CLI is reworked on the model of Bun's CLI. This file is versioned with the code it plans; each
lot below ends with its proof.

It extends and does not repeat:

- `docs/AY_ON_BUN.md`: `ay` is Bun minus JavaScriptCore and minus the JS/TS engine; crate
  evidence of 2026-11-12, the two edges that pull the engine in, and the `bun` feature design.
- `docs/AY_LOW_LEVEL.md`: targets, LTO/AOT, wasm and micro-VMs.
- `docs/DEPOT_TOOLS_RUST.md`: depot_tools rewritten in Rust (`ay gclient`, `ay fetch`, `ay vpy`,
  `ay cipd`, `ay cl`, `ay gn`, `ay ninja`).
- `docs/CHROMIUM-FACTORY.md`, `infra/chromium-factory/`: the fr1 factory (sync, gn, siso over
  NativeLink, R2 publish).
- `docs/llvm/UNIFIED-TOOLCHAIN.md`: one LLVM for Chromium, Rust and bun.

## 1. What is really Rust in the fork

Measured on `third_party/bun` (aphrody-labs/bun) at `c7b36732e0` (origin/main, 2026-11-13):

- 4338 `.rs` files, **no `.zig` file left**, 616 `.c`/`.cpp` files (JavaScriptCore bindings and
  small shims such as `src/simdutf_sys/bun-simdutf.cpp`).
- The Cargo workspace has about 130 members under `src/` (nightly `nightly-2026-09-15`,
  `rust-toolchain.toml`; root src is on `nightly-2026-11-12`).
- **The `*_sys` crates have no `build.rs`**: mimalloc, simdutf, highway, libuv, c-ares,
  BoringSSL, zlib, brotli, libdeflate, zstd, uSockets and lsquic objects come from Bun's own
  ninja build (`scripts/build/`). Any crate that reaches a `*_sys` crate cannot be linked by `ay`
  until `ay` builds that C/C++ itself. This is the main cost driver below.
- `bun_highway` has no `_sys` suffix but declares `extern "C"` Highway stubs
  (`src/highway/lib.rs:4`); it needs the C++ objects too, and so does `bun_hash` through it.

## 2. Inventory

Columns: lines of the crate; bun crates in its transitive closure; lines of crate plus closure; the
C/C++ it needs; reuse in `ay`. Computed from the fork's `Cargo.toml` files (normal dependencies,
all targets). Licenses: Bun is MIT (`LICENSE.md`); the C/C++ licenses are those of the fork's
`LICENSE.md` table. All are compatible with src (`MIT OR Apache-2.0`); none is copyleft except
JavaScriptCore/WebKit (LGPL-2) and tinycc (LGPL-2.1), which `ay` never links.

| Crate                                                                                        |                    Lines |  Closure |    Closure lines | C/C++ needed                                     | Reuse in ay                                                  | Mode                      | Lot      |
| -------------------------------------------------------------------------------------------- | -----------------------: | -------: | ---------------: | ------------------------------------------------ | ------------------------------------------------------------ | ------------------------- | -------- |
| `bun_wyhash`                                                                                 |                     1153 |        0 |             1153 | none                                             | content hashes (`ay hash`, `ay docs sync`)                   | flatten                   | 1 (done) |
| `bun_histogram`                                                                              |                      347 |        0 |              347 | none                                             | percentiles (`ay time`)                                      | flatten                   | 1 (done) |
| `bun_sort_by_number`                                                                         |                      262 |        0 |              262 | none                                             | result ranking (`ay docs`)                                   | flatten                   | 1 (done) |
| `bun_highway`, `bun_hash`                                                                    |               1416, 1041 |     0, 1 |             2457 | Highway (Apache-2.0), xxhash3 shim               | SIMD search, xxhash, rapidhash                               | path dep + cc             | 2        |
| `bun_alloc`, `bun_core`, `bun_collections`, `bun_ptr`                                        | 5088, 33462, 10792, 3204 |  3 to 14 |            61493 | mimalloc (MIT), simdutf (Apache-2.0)             | allocator, strings, hash maps: the base of everything below  | path dep + cc             | 2        |
| `bun_semver`                                                                                 |                     4216 |       15 |            65709 | as lot 2                                         | `ay rt`, `ay up`, `ay bun bump` version ranges               | path dep                  | 2        |
| `bun_picohttp`, `bun_text_diff`, `bun_base64`, `bun_zstd`, `bun_valkey`                      |              565 to 2305 |       13 |      about 48000 | as lot 2 (+ zstd BSD)                            | HTTP/1 parser, diffs, base64, zstd, Redis protocol           | path dep                  | 2        |
| `bun_sys`, `bun_paths`, `bun_errno`                                                          |        17747, 7284, 2006 | 14 to 16 |            77976 | + libuv (MIT, Windows)                           | syscalls, paths                                              | path dep + cc             | 3        |
| `bun_glob`, `bun_url`, `bun_which`, `bun_dotenv`, `bun_md`                                   |             518 to 12935 | 17 to 21 |  76000 to 107000 | as lot 3                                         | `ay glob`, URL parsing, PATH lookup, `.env`, Markdown render | path dep                  | 3        |
| `bun_shell_parser`                                                                           |                     5878 |       13 |            53367 | as lot 2                                         | `ay sh` parser (Bun Shell syntax)                            | path dep                  | 3        |
| `bun_tar`, `bun_zlib`, `bun_brotli`, `bun_archive`                                           |              314 to 4739 | 14 to 23 |  48000 to 100000 | zlib-ng (zlib), brotli (MIT), libdeflate (MIT)   | `ay tar`, compression                                        | path dep + cc             | 4        |
| `bun_spawn`, `bun_patch`, `bun_watcher`                                                      |             1773 to 4701 | 21 to 38 | 100000 to 150000 | + uSockets (Apache-2.0), c-ares (MIT), BoringSSL | `ay sh` execution, `ay patch`, `ay watch`                    | path dep + cc             | 4        |
| `bun_http`, `bun_uws`, `bun_dns`                                                             |         18777, 1702, 527 | 18 to 48 |           187245 | + BoringSSL, lsquic (MIT)                        | `ay fetch`, `ay serve`                                       | path dep + cc             | 4        |
| `bun_s3_signing`, `bun_sql`, `bun_sha_hmac`, `bun_csrf`                                      |              256 to 5067 | 20 to 27 |  80000 to 105000 | + BoringSSL                                      | `ay s3` (R2), `ay sql`                                       | path dep                  | 4        |
| `bun_sourcemap`                                                                              |                     4719 |       34 |           177725 | + uSockets, BoringSSL                            | source map decode for crash reports                          | path dep                  | 4        |
| `bun_css`, `bun_format`, `bun_lint`                                                          |    61283, 116031, 107735 | 30 to 34 | 214000 to 719000 | as lot 3                                         | `ay css`, `ay fmt`, `ay lint` without JS                     | path dep                  | 5        |
| `bun_install`                                                                                |                   104087 |       88 |          1347055 | all of the above                                 | `ay install`                                                 | path dep, engine edge cut | 5        |
| `bun_jsc`, `bun_runtime`, `bun_js_parser`, `bun_transpiler`, `bun_bundler`, `bun_executable` |                        - |        - |                - | JavaScriptCore (LGPL-2)                          | never linked by ay                                           | none                      | -        |

## 3. Two modes, never both for one crate

The same upstream code is never present twice in src. Each fork crate is in exactly one mode:

1. **Flatten** (`crates/bun-flat`, package `aphrody-bun-flat`). For crates with no bun
   dependency and no C/C++. One module per upstream crate, verbatim, generated by `ay flat sync`
   from the fork's HEAD; the fork commit is recorded in `crates/bun-flat/flat.toml` and in a header
   on every file. The transform is fixed: `#![feature(..)]` lines move to the generated `lib.rs`,
   `bun_<crate>::` paths to another flattened crate become `crate::<module>::`. `ay flat check`
   regenerates from the fork at the recorded commit (`git show <commit>:<path>`) and fails on any
   difference (hand edit), and lists files the fork changed since (resync needed); the crate's own
   test `sync::tests::generated_files_match_the_fork` does the same inside `cargo test`. Fixes go to
   the fork first, then `ay flat sync`. CI builds without the fork checked out.
2. **Path dependency on the fork** behind the `ay` feature `bun` (design in `AY_ON_BUN.md` section
   2), for everything that reaches `bun_core` or a `*_sys` crate. `ay` then needs the fork checked
   out and builds the C/C++ the `*_sys` crates expect. That is one new crate, `crates/bun-sys`,
   whose `build.rs` compiles the pinned sources of the fork's `vendor/` (mimalloc, simdutf,
   Highway, and later libuv, c-ares, zlib-ng, brotli, libdeflate, zstd, BoringSSL, uSockets) with
   the `cc` crate and the shared clang. The pins stay the fork's (`scripts/build/deps/*.ts`), read
   at build time, never copied.

A crate moves from mode 1 to mode 2 when its first bun dependency appears: `ay flat sync` fails if
a flattened crate gains a `bun_*` dependency that is not itself flattened, and the module is then
dropped from `flat.toml` in the same commit that adds the path dependency.

## 4. Lots

| Lot                 | Content                                                                                                                                                    | Commands                                                                                     | Proof                                                                                                                            | Cost                                                                                              | Risks                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1 (done 2026-11-13) | wyhash, histogram, sort_by_number flattened                                                                                                                | `ay flat list/sync/check`, `ay hash`, `ay time`, used by `ay docs`                           | `cargo test -p aphrody-bun-flat -p aphrody-docs -p aphrody` on prd; benchmark below                                              | 1762 lines, no new crates.io dependency                                                           | `#![feature(hasher_prefixfree_extras)]` needs nightly (root is nightly)                        |
| 2                   | `crates/bun-sys` (mimalloc, simdutf, Highway via cc), path deps on core, alloc, collections, ptr, hash, highway, semver, picohttp, text_diff, base64, zstd | `ay semver`, `ay diff`, `ay zstd`, xxhash/rapidhash in `ay hash --algo`                      | `cargo tree -p aphrody --features bun` shows no `bun_jsc`; `ay --version` start time unchanged (`ay time -n 50 -- ay --version`) | C++ build of simdutf and Highway in ay; LTO between them and Rust needs the same LLVM (section 8) | the fork's pinned nightly vs root nightly; `bun_core` assumes mimalloc as the global allocator |
| 3                   | sys, paths, errno, libuv (Windows), glob, url, which, dotenv, md, shell_parser                                                                             | `ay glob`, `ay which`, `ay env`, `ay md`, `ay sh --parse`                                    | routing tests; `ay glob` against `fd` on the monorepo                                                                            | libuv build on Windows                                                                            | Windows paths code is the largest untested surface outside Bun's suite                         |
| 4                   | tar/archive/compression, spawn, patch, watcher, http, uws, dns, s3_signing, sql, sourcemap                                                                 | `ay sh`, `ay x`, `ay fetch`, `ay serve`, `ay tar`, `ay s3`, `ay sql`, `ay watch`, `ay patch` | AY_ON_BUN.md phase 3 proofs; `ay fetch` vs curl on R2                                                                            | BoringSSL and uSockets in ay (largest C build)                                                    | binary size; TLS stack duplication with rustls (ureq): pick one per binary                     |
| 5                   | css, format, lint, install (engine edge cut in the fork)                                                                                                   | `ay css`, `ay fmt`, `ay lint`, `ay install`                                                  | AY_ON_BUN.md phase 4 (`node_modules` and `bun.lock` identical to `bun install`)                                                  | 1.3M lines in the install closure                                                                 | the `bun_install > bun_transpiler` edge must be cut upstream-shaped                            |

Lot 2 entry criteria (review of 2026-11-13, docs/reviews/gemini-2026-11-13-ay-migration.md): the C/C++ flags of `crates/bun-sys` come from the fork's `build.ninja`, exported symbols are compared with `nm` against Bun's build, and budgets for binary size and cold build time are set before the lot lands.

Rule for every lot: the commands keep `--help` and `--json`, the routing tests cover the new
commands, and the existing commands keep their syntax (section 9).

## 5. Bun's documentation in ay, continuously

Crate `crates/docs` (package `aphrody-docs`), commands `ay docs ...`:

- **Sources** (tagged in the index): `fork` = every `.md`/`.mdx` under `third_party/bun/docs`
  (1405 pages at `c7b36732e0`), title and description from the frontmatter, URL
  `https://bun.com/docs/<path>`, fork commit recorded; `upstream` = `https://bun.com/llms-full.txt`
  split into its pages (`# Title` then `Source: <url>`, outside fenced code blocks; 319 pages, 2.1 MB on 2026-11-13) plus the
  page count of `https://bun.com/llms.txt`; `skills` = every `bun*` skill directory under
  `~/.claude/skills` and `<repo>/.agents/skills` (today `bun`).
- **Index**: SQLite with FTS5 (rusqlite 0.42 bundled, the version crates/agent-context already
  uses; the bundled build sets `SQLITE_ENABLE_FTS5`), `porter unicode61` tokenizer, at
  `<repo>/var/index/docs.db` next to `var/index/core.db` (`$AY_DOCS_DB` overrides). Sync is
  incremental: a page is rewritten only when its wyhash (lot 1) changes; pages that left a source
  are deleted.
- **Search**: bm25 with weights title 10, description 4, body 1; all words first, any word when
  nothing matches; one hit per URL (the fork's copy before bun.com's); final order by one u64 key
  per hit sorted with bun's sort_by_number.
- **Commands**: `ay docs sync [--source fork|upstream|skills] [--offline] [--json] [--quiet]`,
  `ay docs bun <words> [-n N] [--source S] [--json]` (alias `ay docs search`),
  `ay docs show <path|suffix|url|source:path> [--json]`, `ay docs stats [--json]`,
  `ay docs schedule [--every H] [--remove]`.
- **Machine output** for agents: schemas `ay-docs-search/1` (`results[]` with source, path, url,
  file, title, snippet, score; plus fork commit and last sync), `ay-docs-sync/1` (per source:
  documents, added, updated, unchanged, removed, ms, error), `ay-docs-stats/1`.
- **Shared command**: `ay docs sync --json` is the one entry point for both the schedule
  (`ay docs schedule`, Task Scheduler `ay-docs-sync` or systemd user timer `ay-docs-sync.timer`)
  and the upstream watch (`ay bun watch`, built in parallel): when the watch sees the fork or
  bun.com docs move, it runs `ay docs sync --source fork --source upstream --json` (or calls
  `aphrody_docs::sync` in process) and keeps the report next to its own. Exit 0 when every source
  succeeded, 1 otherwise.

## 6. Chromium chain

`ay chromium status|sync|gn|build|autoninja|toolchain` (module `crates/ay/src/low/chromium_chain.rs`):

- Settings are read from `infra/chromium-factory/factory.toml` (`root = /srv/chromium`,
  `depot_tools`, `out_name = labs_agent`, `target = headless_shell`, `args`), the file the fr1
  factory reads; `--out` overrides the output directory.
- On the build host (the machine holding `<root>/.gclient`, that is fr1) the steps run locally in
  bash; everywhere else the same script goes to fr1 over `ay ssh` (aphrody-remote, russh). The PC
  never syncs nor builds Chromium. `--dry-run` prints the host and the script; `--detach` runs it
  with `nohup setsid` and a log in `<root>/ay-chromium-<cmd>.log` so a long build survives the SSH
  session.
- `sync` = `gclient sync -D --force --nohooks --no-history --with_tags` then `gclient runhooks`
  (the factory's flags); `gn` = `gn gen out/<out>` with the factory's `args/<out_name>.gn` when the
  directory has none, or `gn <args>`; `build` = gn gen when `build.ninja` is missing, then
  `nice -n 10 autoninja -C out/<out> <targets>`; `autoninja` passes its arguments through.
- Toolchain: Chromium builds with its own clang, lld and rustc, which share one LLVM revision
  (`tools/clang/scripts/update.py`, `tools/rust/update_rust.py`). `ay chromium toolchain` prints
  them next to the host rustc. Open conflict, reported and not hidden: Chromium 157 is LLVM 24,
  the root toolchain (`rust-toolchain.toml`, nightly-2026-11-12) is LLVM 23.1.5, and the fork pins
  LLVM 23 too. Cross-language LTO between ay and Chromium objects needs one of them to move.
- The local depot_tools tools of the PC checkout `third_party/chromium` keep their commands:
  `ay gclient`, `ay fetch`, `ay gn`, `ay ninja`, `ay cipd`, `ay cl`, `ay vpy`.

## 7. Cross JS engines

`ay engines` runs the existing facade `packages/chromium-bun/src/engines/cli.ts` (one registry for
browsers, automation, JS engines and WebGPU) and keeps no list of its own: `list`, `matrix`,
`channels`, `path`, `install`, `launch` pass through. On top of it: `ay engines js [--json]` shows
the rows whose registry role is `js-engine` or `gpu` (V8 of the Chromium checkout, JavaScriptCore
of bun's WebKit, Dawn, wgpu), and `ay engines build v8|dawn` builds them on fr1 from the Chromium
checkout through `ay chromium build` (targets `d8` and `dawn_end2end_tests`, both verified with
`gn ls` on fr1 on 2026-11-13). `ay rt matrix` and `ay rt switch` keep combining runtimes with these
engines (crates/rt). JavaScriptCore is built by bun's own build on prd; wgpu is a crates.io
dependency, not a build.

## 8. One binary: ergonomics, AOT and LTO

- **Command table**: the new commands sit in `crates/ay/src/low/` and enter the top-level table
  through one `#[command(flatten)]` variant, so `lib.rs` (edited by several agents) changes by a
  few lines per lot. `ay --help` ends with an overview by area (repo, toolchain, bun, chromium,
  fleet, measure), as `bun --help` groups its commands.
- **Outputs**: text for people, `--json` with a versioned schema for agents, `NO_COLOR` and no
  color when stdout is not a terminal, exit codes 0/1/2 (docs/ay/NAMING.md conventions).
- **Start time**: measured with `ay time -n 50 -- ay --version` (HdrHistogram p50/p90/p99); a lot
  may not regress it.
- **AOT and LTO**: release is fat LTO, one codegen unit, `panic = "abort"`, stripped (root
  `Cargo.toml`). Windows binaries are cross-compiled on prd with `cargo xwin` (clang, lld-link of
  prd) or built by the CI; nothing compiles on the PC. Next step, tied to lot 2: build the C/C++ of
  `crates/bun-sys` and ay's Rust with one LLVM and `-Clinker-plugin-lto`, once the LLVM conflict of
  section 6 is settled.
- **`ay bun`** (upstream watch, built in parallel) is a sibling group: `ay bun` follows upstream,
  `ay docs` serves the docs, `ay flat` holds the extracted code. The watch triggers
  `ay docs sync` and `ay flat check` when the fork moves.

## 9. Compatibility

Every existing command keeps its syntax and route: `ay arch`, `ay doctor`, `ay lock`,
`ay manifests`, `ay git`, `ay ingest`, `ay graph`, `ay deploy`, `ay bench`, `ay scope`, `ay ssh`,
`ay rt`, `ay gclient`, `ay fetch`, `ay vpy`, `ay cl`, `ay cipd`, `ay ninja`, `ay gn`, `ay auth`,
`ay secret`, `ay conformance`, `ay build`, `ay sys`, `ay up`, `ay self-update`, `ay ai`. The routing
tests of `crates/ay/src/lib.rs` cover them and the new ones (`low_level_commands`).

## 10. Benchmark of lot 1

`BENCH_CORPUS=third_party/bun/docs cargo bench -p aphrody-bun-flat` (benches/flat.rs, median of
10 to 30 runs, release profile), fr1, 2026-11-13 03:00 UTC, `nice -n 19` with the host loaded
(load average about 45 on 12 cores, so absolute times are pessimistic; ratios are what counts).
"Before" is what ay used (std SipHash, blake3 as in crates/factory, `slice::sort_by_key`, a sort
for percentiles); "after" is the bun crate now linked.

| Case                                        |                        Before |            After (bun) | Speedup |
| ------------------------------------------- | ----------------------------: | ---------------------: | ------: |
| change detection, 1406 docs pages, 4.72 MiB |          std SipHash 2.575 ms |        wyhash 0.276 ms |    9.3x |
| same                                        |               blake3 7.131 ms |        wyhash 0.276 ms |   25.9x |
| ranking sort, 200k hits of 64 bytes         | `slice::sort_by_key` 50.96 ms | `sort_by_u64` 37.60 ms |   1.36x |
| p50/p90/p99 of 1M samples                   |      `sort_unstable` 42.94 ms |   HdrHistogram 7.36 ms |    5.8x |

wyhash is not a cryptographic hash: it detects changes in the docs index and in `ay hash`; supply-chain
checks keep blake3 and sha256.
