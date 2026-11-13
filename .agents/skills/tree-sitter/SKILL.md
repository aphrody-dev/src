---
name: tree-sitter
description: tree-sitter dans src. Parsing multi-langage, extraction symboles/appels/imports et requêtes S-expression via crates/core (aphrody-core) ; C ABI core_parse_json/core_query_json ; TS @aphrody/core parse()/query(). Utiliser avant d'écrire ou modifier du code tree-sitter dans C:\src.
---

# tree-sitter dans src

Parsing multi-langage, extraction symboles/appels/imports et requêtes S-expression via crates/core (aphrody-core) ; C ABI core_parse_json/core_query_json ; TS @aphrody/core parse()/query().

Sources :
- [V] https://tree-sitter.github.io/tree-sitter/
- [NV] https://tree-sitter.github.io/tree-sitter/using-parsers/queries/
- clone local : third_party/tree-sitter (0 fichiers indexés)
- clone local : third_party/tree-sitter-* (0 fichiers indexés)

Code testé qui l'utilise (22, généré par `bun packages/core/src/cli.ts gen`) :
- `apps/aphrody-app/crates/aphrody-android/src/lib.rs` — tests : `apps/aphrody-app/crates/aphrody-android/src/lib.rs`
- `apps/aphrody-app/crates/aphrody-host/src/dist.rs` — tests : `apps/aphrody-app/crates/aphrody-host/src/dist.rs`
- `apps/aphrody-app/crates/aphrody-host/src/http.rs` — tests : `apps/aphrody-app/crates/aphrody-host/src/http.rs`
- `apps/aphrody-app/crates/aphrody-host/src/tui.rs` — tests : `apps/aphrody-app/crates/aphrody-host/src/tui.rs`
- `apps/aphrody-app/crates/aphrody-wasm/src/scene.rs` — tests : `apps/aphrody-app/crates/aphrody-wasm/src/scene.rs`
- `apps/rosegriffon/crates/aphrody-nie-lua/src/static_analysis.rs` — tests : `apps/rosegriffon/crates/aphrody-nie-lua/src/static_analysis.rs`, `apps/rosegriffon/apps/cli/src/index.test.ts`, `apps/rosegriffon/apps/iecode-dotnet/Cli/Commands/TestG4sk.cs`
- `crates/core-capi/src/lib.rs` — tests : `crates/core-capi/src/lib.rs`
- `crates/core/src/extractor.rs` — tests : `crates/core/tests/registry.rs`
- `crates/core/src/grammars.rs` — tests : `crates/core/src/grammars.rs`, `crates/core/tests/registry.rs`
- `crates/core/src/index.rs` — tests : `crates/core/src/index.rs`, `crates/core/tests/registry.rs`
- `crates/core/src/languages.rs` — tests : `crates/core/tests/registry.rs`
- `crates/core/src/lib.rs` — tests : `crates/core/src/lib.rs`, `crates/core/tests/registry.rs`
- `crates/core/src/query.rs` — tests : `crates/core/tests/registry.rs`
- `crates/core/src/registry_build.rs` — tests : `crates/core/tests/registry.rs`
- `crates/core/tests/registry.rs` — tests : `crates/core/tests/registry.rs`
- `crates/depot-migrate/src/lib.rs` — tests : `crates/depot-migrate/src/lib.rs`
- `crates/depot-migrate/src/transformer.rs` — tests : `crates/depot-migrate/src/transformer.rs`
- `crates/ffi/src/depot.rs` — tests : `crates/ffi/src/depot.rs`
- `packages/core/src/ffi.ts` — tests : `packages/core/test/ffi.test.ts`
- `packages/forge/src/depot-bridge.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/forge/src/depot_ffi.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/forge/tests/depot_ffi.test.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`

Scripts :
- `bun packages/core/src/cli.ts index C:/src --all` : réindexe (sqlite var/index/core.db + JSON).
- `bun packages/core/src/cli.ts users tree_sitter` : liste les fichiers qui l'importent/l'appellent.
- `bun test packages/core` : round-trip bun:ffi <-> core-capi.
