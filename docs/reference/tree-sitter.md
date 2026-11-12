# tree-sitter dans src

Parsing multi-langage, extraction symboles/appels/imports et requêtes S-expression via crates/core (aphrody-core) ; C ABI core_parse_json/core_query_json ; TS @aphrody/core parse()/query().

Sources :
- [V] https://tree-sitter.github.io/tree-sitter/
- [NV] https://tree-sitter.github.io/tree-sitter/using-parsers/queries/
- clone local : third_party/tree-sitter (13046 fichiers indexés)
- clone local : third_party/tree-sitter-* (13046 fichiers indexés)

Code testé qui l'utilise (17, généré par `bun packages/core/src/cli.ts gen`) :
- `apps/aphrody-app/crates/aphrody-android/src/lib.rs` — tests : `apps/aphrody-app/crates/aphrody-android/src/lib.rs`
- `apps/aphrody-app/crates/aphrody-host/src/dist.rs` — tests : `apps/aphrody-app/crates/aphrody-host/src/dist.rs`
- `apps/aphrody-app/crates/aphrody-host/src/http.rs` — tests : `apps/aphrody-app/crates/aphrody-host/src/http.rs`
- `apps/aphrody-app/crates/aphrody-host/src/tui.rs` — tests : `apps/aphrody-app/crates/aphrody-host/src/tui.rs`
- `apps/aphrody-app/crates/aphrody-wasm/src/scene.rs` — tests : `apps/aphrody-app/crates/aphrody-wasm/src/scene.rs`
- `crates/core-capi/src/lib.rs` — tests : `crates/core-capi/src/lib.rs`
- `crates/core/src/grammars.rs` — tests : `crates/core/src/grammars.rs`
- `crates/core/src/index.rs` — tests : `crates/core/src/index.rs`
- `crates/core/src/lib.rs` — tests : `crates/core/src/lib.rs`
- `crates/depot-migrate/src/lib.rs` — tests : `crates/depot-migrate/src/lib.rs`
- `crates/depot-migrate/src/transformer.rs` — tests : `crates/depot-migrate/src/transformer.rs`
- `crates/ffi/src/depot.rs` — tests : `crates/ffi/src/depot.rs`
- `packages/ai-os/native/sovereign-polyglot-ffi/src/lib.rs` — tests : `packages/ai-os/tests/ai-os.test.ts`, `packages/ai-os/tests/full-design-mode.test.ts`, `packages/ai-os/tests/rosegriffon.test.ts`
- `packages/core/src/ffi.ts` — tests : `packages/core/test/ffi.test.ts`
- `packages/forge/src/depot-bridge.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/forge/src/depot_ffi.ts` — tests : `packages/forge/tests/bundle.test.ts`, `packages/forge/tests/crypto.test.ts`, `packages/forge/tests/db.test.ts`
- `packages/knowledge-engine/src/hash.ts` — tests : `packages/knowledge-engine/test/kernel-crawler.test.ts`, `packages/knowledge-engine/tests/knowledge-engine.test.ts`

Scripts :
- `bun packages/core/src/cli.ts index C:/src --all` : réindexe (sqlite var/index/core.db + JSON).
- `bun packages/core/src/cli.ts users tree_sitter` : liste les fichiers qui l'importent/l'appellent.
- `bun test packages/core` : round-trip bun:ffi <-> core-capi.
