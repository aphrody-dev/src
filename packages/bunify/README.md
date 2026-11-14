# @aphrody/bunify

Legacy Node/TS/JS -> Bun -> Rust migrator (bins `bunify` and `n2r`). Idempotent stages: `bun`, `fullbun`, `rust`; run again after each upstream sync. Run again after each upstream sync; `--check` exits 1 when anything is not bunified yet.

```sh
bunify [root] [--stage bun|fullbun|rust|all] [--check] [--no-lock] [--fullbun] [--rules id ...] [--json] [--plan out]
bunify --list-rules
```

Base pass: lock migration, workspaces/overrides/patchedDependencies/trustedDependencies/bunfig, package.json scripts and tooling spawn calls rewritten to Bun.

## --fullbun

Replaces Node-era dependencies by Bun built-ins. Rules are a table (`RULES` in `src/fullbun.ts`): packages, Bun replacement, mode, codemod.

| rule | package | replacement | mode |
| --- | --- | --- | --- |
| execa | execa | `Bun.$` (statement `await execa('lit', ['lit'])`, optional `{stdio:'inherit'}`) | rewrite |
| glob | glob, fast-glob | `Bun.Glob` (string pattern, options cwd/dot/absolute/nodir) | rewrite |
| rimraf | rimraf | `fs.rm` / `fs.rmSync` (one path; rimraf < 4 only for glob-free literals) | rewrite |
| require-like | require-like | `module.createRequire` (absolute file argument) | rewrite |
| dotenv | dotenv | built-in `.env` loading (`dotenv/config`, zero-argument `config()`) | rewrite |
| node-fetch | node-fetch, undici | global `fetch`/`Headers`/`Request`/`Response`/`FormData` | rewrite |
| ws | ws | global `WebSocket` (client only) | rewrite |
| del | del | globs: reported | report |
| jest | jest, ts-jest, babel-jest, @swc/jest | `bun:test`: reported per package, never forced | report |
| taskr | taskr, @taskr/esnext | known `bun patch` (`src/patches.ts`) applied when the pinned version matches | patch |
| chalk | chalk, picocolors | kept: `Bun.color` converts colors, it does not style text | keep |

ts-node, tsx and cross-env are handled by the base pass.

Safety contract: a file is rewritten by a rule only when every use of the dependency has a call shape the rule fully understands (all-or-nothing per file and rule). Anything else (dynamic import, aliases, unsupported options, result used) is listed in `manual` and the file is left unchanged. The dependency is removed from a package.json only when its last reference under that package is gone and no script mentions it. Only files owned by the root or a declared workspace package are scanned; examples and fixtures with their own manifest are skipped. Rerunning produces no change. Run `bun install` afterwards to refresh `bun.lock`.

Sources are parsed with the tree-sitter core (`@aphrody/core` `query`, loaded from `APHRODY_CORE_LIB` or `target/release`); without the library a string-aware balanced-paren scanner is used (`engine` in the report).

## Report (`--json`)

`changed`, `lock`, `manual[]` (`rule`, `file`, `line`, `reason`), `fullbun.engine`, `fullbun.rules{id: {files, rewritten, manual, kept}}`, `fullbun.jest[]`.

## Known differences

Bun.Glob returns native separators on Windows; `glob@7` callback forms, `ignore` and array patterns are manual.

## Stages

| stage | does |
|---|---|
| `bun` (default) | lock, workspaces, scripts, tooling spawns |
| `fullbun` (= `--fullbun`) | `bun` + Node-era dependencies -> Bun built-ins |
| `rust` | plan toward Rust, mechanical rewrites only; no lock work |
| `all` | `fullbun` then `rust` |

## --stage rust

Scans package.json files and JS/TS sources (tree-sitter via @aphrody/core when its library is built, regex otherwise; `examples`, tests, e2e and fixtures are skipped) and emits `<out>.json` + `<out>.md` with `--plan <out>` (`--check --plan` changes nothing).

- Native addons (binding.gyp, node-gyp/nan/node-addon-api/bindings, `*.node`, `process.dlopen`): planned as a Rust cdylib behind a C ABI, loaded with `bun:ffi`. Always `plan`.
- CPU-hot pure modules (hashing, parsing, compression, image, glob/walk, crypto): mapped to a Rust crate; the pin is an aphrody-labs fork when one exists (oxc, swc), else the upstream GitHub repo (names checked with `gh api`). Always `plan`.
- JS CLIs run from scripts or `child_process`/execa calls: prettier -> `bun fmt`, eslint -> oxlint, tsc --noEmit -> `bun check`, babel -> swc, webpack -> rspack, postcss/autoprefixer -> lightningcss. Rewritten when every flag maps (`rewritten`), otherwise `manual` with the reason.

## Relationship with n2b and depot-migrate

- `n2b` (~/.local/bin/n2b.exe, `n2b migrate`) and `crates/depot-migrate` (skill ay-monorepo-migrator) are the Rust engines: whole-tree transform, rule tables in `rules.rs` (Node builtin scheme, fetch, bun:sqlite, Bun.password) and `manifest.rs` (`OBSOLETE_NODE_PACKAGES`).
- bunify stays the TS, idempotent, CI-friendly migrator (rerun after upstream syncs, standalone single file for forks). Rule tables are not duplicated: its `fullbun` rules cover the same packages per call site; the rust-stage addon dependency list (node-gyp, nan, node-addon-api) is checked against `manifest.rs` by `test/rust.test.ts`.
- Split: depot-migrate/n2b = Rust-side repo surgery and AOT; bunify = Node -> Bun, plus the Rust plan that n2b can consume (`--json`).
