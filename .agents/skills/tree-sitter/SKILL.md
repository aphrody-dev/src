---
name: tree-sitter
description: tree-sitter in src. Multi-language parsing, symbol/call/import extraction and S-expression queries via src/core (aphrody-core); C ABI core_parse_json/core_query_json; TS @aphrody/core parse()/query(). Use before writing or modifying tree-sitter code.
---

# tree-sitter in src

- Rust: `src/core` (`extractor.rs`, `grammars.rs`, `index.rs`, `languages.rs`, `query.rs`, `registry_build.rs`; tests in `src/core/tests/registry.rs`).
- C ABI: `src/core/capi/src/lib.rs` (`core_parse_json`, `core_query_json`). Bun side: `packages/core/src/ffi.ts`, test `packages/core/test/ffi.test.ts`.
- Other users: `src/depot/migrate` (transformer), `src/ffi/src/depot.rs`, `apps/rosegriffon/crates/aphrody-nie-lua/src/static_analysis.rs`. List them with `bun packages/core/src/cli.ts users tree_sitter`.
- Grammars: clones `third_party/tree-sitter` and `third_party/tree-sitter-<lang>` (pinned in `src.lock.json`).
- Reindex: `bun packages/core/src/cli.ts index <root> --all` (sqlite `var/index/core.db` + JSON); `ay index` is the same CLI. Round trip: `bun test packages/core`.
- Docs: https://tree-sitter.github.io/tree-sitter/ (queries: `using-parsers/queries/`).
