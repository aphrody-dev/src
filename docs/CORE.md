# Bibliothèque commune (core)

Trois piliers, une seule implémentation par fonction.

| Pilier | Où | Rôle |
|---|---|---|
| tree-sitter | `crates/core` (`aphrody-core`, lib `aphrody_core`) | parse multi-langage, symboles/appels/imports, requêtes S-expr, index récursif, BLAKE3 |
| LLVM | `crates/core-capi` (`aphrody_core_capi`, cdylib) | C ABI `core_*`, à construire avec la toolchain LLVM partagée (`docs/llvm/UNIFIED-TOOLCHAIN.md`, arrive avec la fusion labs) pour la LTO inter-langages |
| bun:ffi | `packages/core` (`@aphrody/core`) | `dlopen` typé, `CString` + `core_free`, `JSCallback` pour `core_index_each`, store `bun:sqlite` |

## Grammaires (data-driven)
- 13 grammaires avec extracteur dédié (`SupportedLanguage`, crates.io).
- Toute autre grammaire : `crates/core/build.rs` lit `third_party/ECOSYSTEM.toml` (entrées `path` + `kind` contenant `tree-sitter`/`grammar`), sinon `third_party/tree-sitter-*`, lit `tree-sitter.json` (nom, `file-types`, `tags`), compile `src/parser.c` (+`scanner.c`) avec `CC`, renomme les symboles `aphrody_grammar_<nom>*` et génère le registre `GRAMMARS`. Symboles/références via `tags.scm`. `APHRODY_GRAMMARS=0` désactive, `APHRODY_GRAMMARS_MANIFEST` remplace le manifeste.

## C ABI (`core_abi_version() == 1`)
`core_free`, `core_languages`, `core_parse_json(path, content)`, `core_query_json(path, content, query)`, `core_blake3_hex(data, len, out65)`, `core_index_json(root, includes, follow_ignore)`, `core_index_each(root, includes, follow_ignore, cb)`. Sorties JSON, erreurs `{"error": ...}`. En-tête : `cbindgen --config crates/core-capi/cbindgen.toml crates/core-capi -o crates/core-capi/include/aphrody_core.h`.

## Index
`bun packages/core/src/cli.ts index [root] [--all] [--include a,b]` -> `var/index/core.db` (tables `files`, `symbols`, `refs`, `imports`, `meta`) + `var/index/index.json`. `--all` descend aussi dans les clones ignorés (third_party, vendor). `gen` produit `~/.claude/skills/{tree-sitter,llvm-toolchain,bun-ffi}` et `docs/reference/*.md` (seul le code testé est cité). `users <motif>` liste les utilisateurs.

## Migré / supprimé
- `crates/depot-treesitter` -> `crates/core` (renommé, tous les dépendants repointés).
- `depot_treesitter_symbols_json` retiré de `crates/ffi` ; `packages/forge` passe par `@aphrody/core.parse`.
- `packages/knowledge-engine/src/ffi/blake3.ts` supprimé avec le paquet (déplacé dans `agent/`) ; note de migration vers `contentHash` dans `agent/docs/NOTE-core-hash.md`.
- Restent hors périmètre : `depot-graph` (graphe/MCP, dépend de `depot-core`), `crates/ffi` pour les autres `depot_*`, `rust_stack_ffi` (`rs_*`, Go/infra).
