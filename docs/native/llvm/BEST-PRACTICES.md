# LLVM practices transposable to src (Rust + bun) — 2026-11-12

LLVM sources: see ECOSYSTEM.md ([GH], [DP], [CS], [TG], [C7]). src state: read on 2026-11-12 from `C:\src\README.md`, `AGENTS.md`, `Cargo.toml`, `crates/*/Cargo.toml`, `crates/ay/src/*`, `docs/core/ARCHITECTURE-ROOT.md`, `C:\labs\docs\ARCHITECTURE.md` [SRC]. Nothing was compiled or tested.

## Measured src state [SRC]

- 49 flat crates in `crates/`, heterogeneous prefixes (`depot-`, `aphrody-design-`, `gamescope-`, `unix-`, no prefix: `sys`, `rt`, `up`, `remote`, `ffi`, `corelib`, `xtask`).
- `ay` = package `aphrody`, `[[bin]] ay` + `[lib] ay`; 1076 lines; clap `enum Cmd` with 24 variants, almost all `Rest` (args passed through as is) then `Route` to the owning lib. Already a "thin driver over libraries".
- `up::shim`: `ay` is already launched under other names (hard link `<tool>.exe` + `<tool>.shim`) — an existing base for argv[0] dispatch.
- No depot crate has a `[[bin]]`: everything goes through `ay`.
- `depot-cli` aggregates 18 `commands/*` modules and depends on 7 libs: it is a "tools" layer separate from the driver.
- `ffi` depends on 7 `depot-*` crates (bindings layer on top, like `llvm-c`).
- `depot-core` (17 modules: path, style, ignore, sys, gix_engine, just_engine, vault, magika…) plays the role of Support but mixes in heavy engines.
- Tests: `tests/` in only 9 crates; no CLI golden test.
- Duplicated command table: clap doc-comments + `docs/ay/NAMING.md` + hard-coded `GRAPH_SUBCOMMANDS`.

## Transposition

| LLVM practice                            | LLVM fact                                                                      | src today                                                                            | Action                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Library-first                            | each tool = `<tool>_main(argc, argv, ToolContext)` over libs [GH]              | yes in practice (Route → lib)                                                        | formalize: `pub fn tool_main(args, &ToolContext) -> i32` in each tool lib                                |
| Strict layers, no upward dependency      | explicit `LINK_COMPONENTS`, no cycle [CS][GH]                                  | cycles impossible (cargo) but no declared layers; `xtk → depot-core`, `ffi → 7 libs` | layer as metadata `[package.metadata.layer]` + archguard rule (ARCH-0xx) "depends only on layer ≤"       |
| A single Support                         | `llvm/lib/Support`                                                             | `depot-core` + `sys` + `corelib` overlap [NV on the exact overlap]                   | `depot-core` = Support; heavy engines (gix, just, magika, vault) move down one notch into dedicated libs |
| Few includes                             | "#include hurts compile time" [CS]                                             | broad default features [NV]                                                          | `default-features = false` in `[workspace.dependencies]`, features per tool                              |
| lit/FileCheck tests                      | `RUN:`, `%s`, `CHECK:`, `lit.local.cfg`, `REQUIRES/XFAIL` [TG]                 | absent                                                                               | `tests/lit/<tool>/*.test` + Rust harness (see AY-AS-LLVM.md)                                             |
| Auto-regenerated goldens                 | `update_test_checks.py` [TG]                                                   | absent                                                                               | `ay lit --update` rewrites the `CHECK:` lines                                                            |
| Separate unittests                       | `llvm/unittests` gtest [TG]                                                    | `#[cfg(test)]` + `tests/`                                                            | keep `#[test]` for the libs, lit for the CLIs                                                            |
| TableGen                                 | `.td` → `.inc`; options `-gen-opt-parser-defs` [C7]                            | hand-written clap derive                                                             | `tools.toml` → build.rs → clap table + dispatch + doc                                                    |
| Stable options, `--help`/`--help-hidden` | `OptParser.td`: `HelpText`, `Flags<[HelpHidden]>`, `Alias` [GH ObjdumpOpts.td] | help per sub-crate, heterogeneous                                                    | `hidden`, `alias` fields in the spec; CI guard "no option removed without an alias"                      |
| Multicall                                | `LLVM_TOOL_LLVM_DRIVER_BUILD`, argv[0] stem, generated `.def` [GH]             | `ay <cmd>` + `up` shims                                                              | single `ay` binary + generated links `ay-gclient`, `gclient`…                                            |
| Monorepo with top-level subprojects      | `clang/ lld/ mlir/ …` [GH]                                                     | `crates/ packages/ apps/ third_party/`                                               | keep the flat Chromium model (ROOT-ARCHITECTURE): the layer = prefix, not a folder                       |
| Incremental + revert to green            | [DP]                                                                           | phases "cancelled if it breaks"                                                      | one PR = one crate moved; immediate revert if the test count drops                                       |
| RFC before a big change                  | Discourse [DP]                                                                 | ad hoc docs/                                                                         | `docs/rfc/NNNN-title.md`, status in the header [NV: no existing equivalent verified]                     |
| CODEOWNERS = assignment only             | [GH]                                                                           | `MAINTAINERS` generated by `ay lock`                                                 | keep; add `Maintainers.md` per layer rather than per crate                                               |
| Mandatory test per fix                   | [DP]                                                                           | not enforced                                                                         | CI gate: PR touching a tool's `src/` without a modified `tests/` → warning                               |

## What does not transpose

- CMake/`LLVM_ENABLE_PROJECTS`: cargo features + `-p` are enough; an equivalent is `ay build --tools gclient,vpy`, which enables the driver features.
- No exceptions/RTTI: not applicable in Rust; the equivalent is "no `anyhow` in libs" (typed errors, `anyhow` reserved for drivers) [NV: current usage not audited].
- Python (lit, update scripts): forbidden for in-house tooling (bun/Rust only) → minimal rewrite in Rust.
