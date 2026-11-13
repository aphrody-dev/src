# ay on Bun, without JSC and without the JS/TS engine

Owner decision 2026-11-12: `ay` is Bun minus JavaScriptCore and minus its JavaScript/TypeScript
engine. `ay` reuses the Rust crates of our Bun fork (`third_party/bun`, `aphrody-labs/bun`, a Cargo
workspace of 136 crates under `src/`) for everything that is not JS execution: package manager,
HTTP, shell, spawn, archives, compression, S3, SQL, Valkey, glob, semver, watcher, CSS, Markdown.

## 1. Evidence (measured 2026-11-12, `cargo metadata` on `third_party/bun` at 3d03a0a9e0)

Dependency walk over normal (non-dev, non-build) workspace edges; proc-macro crates are compile-time
only and do not link anything.

- **70 of 136 crates are free of both JSC and the JS/TS engine**: alloc, analytics, archive,
  base64, boringssl(+sys), brotli(+sys), cares_sys, clap, collections, core, crash_handler, csrf,
  dispatch, dns, dotenv, errno, exe_format, glob, hash, highway, histogram, http_types, io,
  libdeflate_sys, libuv_sys, lsquic_sys, md, mimalloc_sys, node_path, output, paths, perf,
  picohttp, platform, png, ptr, s3_signing, safety, semver, sha_hmac, shell_parser, spawn_sys, sql,
  sys, tar, tcc_sys, text_diff, threading, url, uws_sys, valkey, watcher, which, windows_sys,
  wyhash, zlib(+sys), zstd, and others.
- **Also free of JSC and of the JS/TS engine**: `bun_http`, `bun_ini`, `bun_event_loop`,
  `bun_spawn`, `bun_patch`, `bun_uws`, `bun_css`, `bun_sourcemap`, `bun_format`, `bun_parsers`,
  `bun_options_types`, `bun_install_types`. They depend on `bun_jsc_macros`, which is a proc-macro
  with no dependencies (no JSC linked), and on `bun_ast`, a plain Rust AST used for JSON/TOML/YAML
  (deps: alloc, collections, core, dispatch, paths, perf, ptr, sys, wyhash).
- **Only `bun_executable` reaches JSC** (`bun_executable > bun_runtime > bun_sys_jsc`). ay never
  links it.
- **Exactly two edges pull the JS/TS engine into otherwise reusable crates**:
  1. `bun_install > bun_transpiler`: used only in `RunCommand::configure_env_for_run`
     (`src/install/lib.rs:796`) to build a resolver and env loader for lifecycle scripts, plus the
     `Error::Transpiler` variant (`src/install/error.rs:231`).
  2. `bun_resolver > bun_resolve_builtins`: a table of Node builtin aliases
     (`src/resolver/resolver.rs:55`, `:1439`).
  Through `bun_resolver` these edges also reach `bun_bunfig`, `bun_router` and
  `bun_standalone_graph`.
- **Build prerequisites**: the fork pins `nightly-2026-09-15` (`rust-toolchain.toml`) and needs its
  vendored C deps checked out (`cargo check` fails with `no matching package named lol_html`
  until `vendor/lolhtml` exists; fetched by `scripts/vendor-checkout.ts` /
  `scripts/prefetch-deps.ts`). Release builds rely on `scripts/build/rust.ts` for cross-language
  ThinLTO.

## 2. Design

- **Two features in the fork, upstream-compatible**: `bun_install` gets feature `scripts-runtime`
  (default on for Bun) that owns the transpiler path; with it off, `configure_env_for_run` builds a
  `bun_resolver` + `bun_dotenv::Loader` directly. `bun_resolver` gets feature `node-builtins`
  (default on) gating `bun_resolve_builtins`; with it off the alias table is empty. Bun itself
  builds unchanged; ay builds with both off. Proof required: `cargo tree -p bun_install
  --no-default-features -e normal` shows no `bun_transpiler`, `bun_js_parser`, `bun_jsc`.
- **Linking**: `crates/ay` depends on the fork crates by path (`../../third_party/bun/src/<crate>`)
  behind an `ay` feature `bun`, so the root workspace stays buildable without the fork checked
  out. The root toolchain must match the fork's nightly or be newer (root is nightly 1.101).
- **Commands** (names follow docs/NAMING.md; each is a thin route to a fork crate):

  | ay command | Fork crate | Replaces |
  |---|---|---|
  | `ay install`, `ay add`, `ay remove`, `ay update`, `ay pm` | `bun_install` (scripts-runtime off) | `bun install` for repos, no JS needed to resolve or link |
  | `ay sh <script>` | `bun_shell_parser` + `bun_spawn` | Bun Shell; cross-platform scripts with no bash or pwsh |
  | `ay x <bin>` | `bun_spawn`, `bun_which` | `bunx` for native binaries |
  | `ay fetch`, `ay serve` | `bun_http`, `bun_uws` | curl, static file server |
  | `ay s3`, `ay sql`, `ay kv` | `bun_s3_signing`, `bun_sql`, `bun_valkey` | aws cli for R2, psql, redis-cli |
  | `ay tar`, `ay zstd`, `ay brotli` | `bun_archive`, `bun_tar`, `bun_zstd`, `bun_brotli`, `bun_zlib` | tar, zstd |
  | `ay glob`, `ay semver`, `ay patch`, `ay watch` | `bun_glob`, `bun_semver`, `bun_patch`, `bun_watcher` | fd globs, semver tools, `bun patch`, watchexec |
  | `ay css`, `ay md` | `bun_css`, `bun_md` | CSS minify/transform, Markdown render |
  | `ay env` | `bun_dotenv` | dotenv loading for env-kit flows |

  Existing ay commands (arch, build, doctor, lock, git, ingest, graph, deploy, bench, sys, ssh, up,
  self-update) stay as they are.

## 3. Phases (each ends with its proof)

1. **Fork checkout and baseline.** Run the fork's vendor checkout, then `cargo check` on the 70
   free crates plus the 12 listed above. Proof: clean check log committed to the fork's PR notes.
2. **Cut the two edges** in `aphrody-labs/bun` behind the default-on features. Proof: `cargo tree`
   as above; Bun's own `bun bd` and its install/resolver test suites still pass.
3. **First routes**: `ay sh`, `ay x`, `ay fetch`, `ay tar`/`zstd`, `ay glob`, `ay semver`
   (no install yet). Proof: `cargo test -p aphrody` routing tests; `ay sh` runs the justfile's
   cross-platform recipes on Windows and Linux (musl via `cargo zigbuild`).
4. **`ay install`** on `bun_install` with `scripts-runtime` off. Proof: on `packages/env-kit` and
   one app, `ay install --frozen-lockfile` produces the same `node_modules` tree and `bun.lock` as
   `bun install --frozen-lockfile` (diff of `bun pm ls --all`).
5. **Size and speed budget**: record `ay` binary size and cold-start time before and after; target
   no regression on `ay --version` start time. Proof: `hyperfine` numbers in this file.
6. **Retire duplicates** in ay that the fork crates replace (ad hoc HTTP, tar, glob code in
   `crates/depot-*`, `crates/up`). Proof: `rg` shows no remaining users; all suites green.

## 4. Constraints

- Never link `bun_jsc`, `bun_runtime`, `bun_executable`, `bun_js_parser`, `bun_transpiler`,
  `bun_bundler`. Enforce with an archguard rule that fails if `cargo tree -p aphrody` contains any
  of them.
- Fork changes stay upstream-shaped (features default on, no behavior change for Bun) so they can
  be proposed to oven-sh/bun.
- Work starts after the in-flight `ay up` / `ay self-update` work lands in `crates/ay`, to avoid
  concurrent edits of `crates/ay/src/lib.rs`.
