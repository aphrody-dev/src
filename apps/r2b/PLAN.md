# r2b extraction plan

r2b is the single home for all reverse-engineering (RE) and product-replica code. This plan was
written on 2026-11-12 from measurements of the tree; execution happens in a dedicated session
working directly in `apps/r2b` (submodule `aphrody-labs/r2b`).

## 1. Evidence: where RE code lives today

Measured with `tokei` (code lines), `dust` (disk), `git remote`, and sha1 fingerprints of file trees.

| Source                                                                                                  | Size                 | Repo                                     | Content (code lines)                                                                                                                                                                | Verdict                                                                     |
| ------------------------------------------------------------------------------------------------------- | -------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `apps/r2b/src/rea`                                                                                      | 91 MiB total for r2b | aphrody-labs/r2b @ 567b34d               | REA engine, TypeScript 1.75M incl. vendored, Python 19.6k, Java 10.3k                                                                                                               | keep, canonical                                                             |
| `apps/r2b/src/replica`                                                                                  | (in r2b)             | same                                     | replica-skill 35 files, upstream 77c9436                                                                                                                                            | keep, canonical                                                             |
| `third_party/n2b/vendor/rea`                                                                            | 122 MiB              | morluto/rea @ fe41051 (2026-11-10)       | 7,988 files vs 7,555 in r2b                                                                                                                                                         | duplicate; diff against r2b, port missing commits, then delete              |
| `third_party/n2b/vendor/replica-skill`                                                                  | 280 KiB              | Jakeschincariol/replica-skill            | tree hash differs from r2b (36 vs 35 files)                                                                                                                                         | duplicate; diff, keep r2b                                                   |
| `apps/shenron/replica`                                                                                  | 235 KiB              | aphrody-labs/shenron                     | third copy, different tree hash                                                                                                                                                     | duplicate inside a community product; replace with dependency on r2b        |
| `.agents/skills/replica-*` (12 skills)                                                                  | small                | aphrody-dev/src                          | `replica-recon`, `replica-build` identical to r2b (same hash)                                                                                                                       | keep as thin skill pointers generated from r2b                              |
| `.agents/skills/rea-ghidra-sre`, `reverse-engineer-anything`                                            | small                | aphrody-dev/src                          | skills                                                                                                                                                                              | move content to r2b, keep pointer                                           |
| `third_party/n2b/rea-ghidra`, `crates/n2b-ghidra`, `crates/n2b-mingw-rea`, `forks/mingw-w64-rea`        | 146 MiB (fork)       | local-only `third_party/n2b` (no remote) | Rust                                                                                                                                                                                | RE part of n2b, move to r2b                                                 |
| `third_party/n2b/vendor/ghidra`                                                                         | 403 MiB              | NationalSecurityAgency/ghidra            | upstream                                                                                                                                                                            | do not vendor; pin in `src.lock.json` as `third_party/ghidra`               |
| `third_party/n2b/vendor/magika`                                                                         | 165 MiB              | google/magika                            | upstream                                                                                                                                                                            | pin in `third_party/`, r2b uses the crate                                   |
| GitHub `yolo-rs/yolo-re`                                                                                | 145 MB               | yolo-rs                                  | `crates/yolo-re-core` (bunre CLI), `aphrody-nie-*` (IE/IEVR, CRIWARE, PE, tracing), `bun-steam` (VDF, SteamStub), `packages/yolo-rea`, `packages/yolo-re-mcp`, `apps/iecode-dotnet` | absorb; this was the previous consolidation attempt                         |
| `apps/rosegriffon/crates/yolo-re-core`                                                                  | 2.0 MiB              | aphrody-labs/rosegriffon                 | Rust 44.8k                                                                                                                                                                          | copy of yolo-re core inside a community product; diff with yolo-rs/yolo-re  |
| `apps/rosegriffon/crates/re`, `crates/yolo-re-bin-format`, `tools/ie/re`, `packages/bun-engine-formats` | 0.9 MiB              | rosegriffon                              | Rust 12.1k, Python 744, TS 3.4k                                                                                                                                                     | generic format/RE code to r2b; game-specific glue stays in rosegriffon      |
| `apps/shenron/crates/shenron-re`, `crates/shenron-engine`, `packages/engine`                            | 3.4 MiB              | aphrody-labs/shenron                     | Rust 23.6k, TS 9.9k                                                                                                                                                                 | generic parts (archive formats, DBFZ/DBXV2 readers) to r2b; site code stays |
| `crates/depot-re`                                                                                       | 50 KiB               | aphrody-dev/src                          | Rust 1.3k                                                                                                                                                                           | move to r2b, `ay re` routes to it through a crate dependency                |
| `crates/corelib/src/re`                                                                                 | 8.5 KiB              | aphrody-dev/src                          | Rust                                                                                                                                                                                | move or delete if unused (`rg corelib::re`)                                 |

Boundaries: shenron (dragonballfr.com) and rosegriffon (rosegriffon.fr) are community products
maintained by Aphrody, not Aphrody products. Extraction copies generic RE code out and makes them
depend on r2b; it never moves their product code or rebrands them.

## 2. Target layout

```
apps/r2b/
  Cargo.toml          # workspace: crates/*
  package.json        # Bun workspace: packages/*, src/rea
  pyproject.toml      # uv project for the Python that must remain (ruff, pyo3 bindings)
  crates/
    r2b-core/         # from yolo-re-core (bunre), depot-re, corelib/re: pipeline, stages, yara
    r2b-formats/      # bin-format, CRIWARE, IE/IEVR (aphrody-nie-*), DBFZ/DBXV2, PE
    r2b-steam/        # bun-steam: VDF, manifests, SteamStub
    r2b-ghidra/       # n2b-ghidra + rea-ghidra bridge
    r2b-mingw/        # n2b-mingw-rea, patches for forks/mingw-w64-rea
    r2b-cli/          # binary `r2b` (also routed as `ay re`)
  packages/
    r2b-mcp/          # yolo-re-mcp, the single MCP server for RE and replica
    engine-formats/   # rosegriffon bun-engine-formats (generic part)
  src/rea/            # upstream REA (kept, already imported)
  src/replica/        # upstream replica-skill (kept, already imported)
  apps/iecode-dotnet/ # only if a .NET editor is still needed; else archive
  third_party/        # notices only; upstream sources are pinned in C:\src\third_party
```

## 3. Phases (each ends with its proof)

1. **Diff and decide.** For every duplicate pair in section 1, run a directory diff
   (`git diff --no-index --stat`) and list unique files and commits. Proof: a table committed in
   `docs/DEDUP.md` with unique-file counts; nothing deleted yet.
2. **Import yolo-rs/yolo-re** with history (`git subtree add` or `git filter-repo` into
   `crates/`), then fold in the rosegriffon and shenron generic code. Proof:
   `cargo test --workspace` and `bun test` green in `apps/r2b`; `tokei` totals match the sum of the
   sources minus the documented duplicates.
3. **Rewire consumers.** shenron and rosegriffon depend on r2b crates (git dependency on
   aphrody-labs/r2b, pinned rev); `crates/ay` routes `ay re` to `r2b-cli` as a library. Proof: the
   shenron and rosegriffon suites still pass; `ay re --help` works; `ay arch check --strict` passes.
4. **Delete duplicates** (`third_party/n2b/vendor/rea`, `vendor/replica-skill`,
   `apps/shenron/replica`, the rosegriffon `yolo-re-core` copy, `crates/depot-re`) only after
   phase 3 is green. Proof: `rg` finds no remaining path references; all suites green.
5. **Upstreams out of vendor.** ghidra, magika, mingw-w64 pinned in `src.lock.json` under
   `third_party/`; r2b references them by path. Proof: `ay lock` and `ay manifests verify` clean.
6. **Archive** `yolo-rs/yolo-re` with a pointer description to `aphrody-labs/r2b`.

## 4. Rules for the executing session

- Work only in `apps/r2b` plus the consumer edits listed in phase 3; commit inside the submodule,
  then bump the pointer in `C:\src` and run `just lock`.
- Rust 2024; Python only under uv with ruff; Bun for TypeScript; C/C++ only for the mingw fork.
- Never delete before the proof of the previous phase is green. No secrets, zero emojis, no AI
  attribution in commits.
