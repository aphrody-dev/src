# l2l extraction plan

l2l is the single home for migration tooling: the polyglot, poly-stack migrator (any language or
stack to Rust + Bun), Node-to-Bun conversion, AST/IR tooling on oxc, tree-sitter and LLVM, and the
Bun plugins and loaders it needs. Written on 2026-11-12 from measurements of the tree; execution
happens in a dedicated session working directly in `apps/l2l`.

## 1. Evidence: where migration code lives today

Measured with `tokei` (code lines), `dust` (disk) and `git remote`.

| Source                                                                                                                                             | Size                                                                       | Repo                                 | Content                                                                                                                                                     | Verdict                                                                                                     |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `third_party/n2b`                                                                                                                                  | 10 GiB (vendor 6.8 GiB, target 2.5 GiB, migrations 611 MiB, forks 146 MiB) | local-only git, 3 commits, no remote | Rust 5.1k, TS 2.7k: `n2b-core`, `n2b-cli`, `n2b-migrate`, `n2b-polyglot`, `n2b-llvm`, `n2b-dotnet` (node-api-dotnet rewrite), `n2b-ghidra`, `n2b-mingw-rea` | first-party code wrongly under `third_party/`; core of l2l (ghidra/mingw parts go to r2b)                   |
| `third_party/n2b/migrations/vscode-zed`, `ue58-sovereign`                                                                                          | 611 MiB                                                                    | same                                 | migration proofs                                                                                                                                            | keep as l2l fixtures only if they are reproducible; outputs are not committed                               |
| `third_party/n2b/vendor/oxc/*` (oxc, oxc-resolver, oxc-node, oxc-sourcemap, oxc-browserslist, oxc-zed, oxlint-migrate, eslint-plugin-oxlint, tsrs) | 184 MiB                                                                    | upstream oxc-project repos           | upstream                                                                                                                                                    | pin under `third_party/oxc` in `src.lock.json`; l2l depends on the published crates, forks only for patches |
| `third_party/n2b/vendor/llvm-project`                                                                                                              | 2.7 GiB                                                                    | llvm/llvm-project                    | duplicate of `third_party/llvm-project`                                                                                                                     | delete after pointing to `third_party/llvm-project`                                                         |
| `third_party/n2b/vendor/tree-sitter`, `microsoft`, `helix`, `ripgrep`                                                                              | 870 MiB                                                                    | upstream                             | duplicates of `third_party/tree-sitter`, `third_party/microsoft`, forks under aphrody-dev                                                                   | delete after repointing                                                                                     |
| `third_party/n2b/vendor/nodejs`, `typescript`, `typescript-go`, `vscode`, `electron`, `vercel-typescript*`                                         | 2.2 GiB                                                                    | upstream                             | reference sources for migrations                                                                                                                            | pin read-only in `third_party/` (sparse), never vendored in l2l                                             |
| `crates/depot-migrate`                                                                                                                             | 16 KiB                                                                     | aphrody-dev/src                      | Rust                                                                                                                                                        | move to l2l                                                                                                 |
| `packages/bun-plugins`                                                                                                                             | 128 KiB                                                                    | aphrody-dev/src                      | TS 2.5k                                                                                                                                                     | move to `apps/l2l/packages/bun-plugins`                                                                     |
| `packages/bun-parity`                                                                                                                              | 226 KiB                                                                    | aphrody-dev/src                      | TS 3.5k, Node/Bun parity checks                                                                                                                             | move; it is the conversion test oracle                                                                      |
| GitHub `yolo-rs/yolo-bun`                                                                                                                          | 40 MB                                                                      | yolo-rs                              | `packages/package-converter`, `bun-loaders`, `bun-workspace`, `yolo-bun-plugin`, Bun patch queue                                                            | absorb converter, loaders and plugin; the patch queue belongs with the `aphrody-dev/bun` fork               |
| GitHub `yolo-rs/yolo-plugins`                                                                                                                      | 12 MB                                                                      | yolo-rs                              | Claude/Codex/Gemini plugin marketplace and skills                                                                                                           | only the Bun plugin part comes here; agent plugins go to `packages/ai-os`                                   |
| `.agents/skills/n2b-monorepo-migrator`                                                                                                             | small                                                                      | aphrody-dev/src                      | skill                                                                                                                                                       | content to l2l, keep a pointer skill                                                                        |
| bun re (`bunre` CLI in yolo-rs/yolo-re `crates/yolo-re-core`)                                                                                      | -                                                                          | yolo-rs                              | Bun binary RE                                                                                                                                               | goes to r2b (see `apps/r2b/PLAN.md`), l2l consumes it for Bun-compiled inputs                               |

Not migration code, dependency only: `yolo-rs/yolo-engine` (3D engine, Python 85 MB),
`yolo-rs/yolo-stack` (Leptos/Dioxus framework). l2l may target them as output stacks; it does not
absorb them.

## 2. Target layout

```
apps/l2l/
  Cargo.toml            # workspace: crates/*
  package.json          # Bun workspace: packages/*
  pyproject.toml        # uv + ruff; pyo3 only where a Python parser must be embedded
  crates/
    l2l-core/           # n2b-core: project model, plan, apply, verify
    l2l-polyglot/       # n2b-polyglot: tree-sitter grammars, unified AST
    l2l-js/             # oxc-based JS/TS analysis and rewrite (Node to Bun, CJS to ESM)
    l2l-llvm/           # n2b-llvm: IR-level paths for C/C++ inputs
    l2l-dotnet/         # n2b-dotnet: node-api-dotnet rewrite
    l2l-cli/            # binary `l2l` (also routed as `ay migrate`)
  packages/
    bun-plugins/        # from packages/bun-plugins
    bun-parity/         # from packages/bun-parity (test oracle)
    package-converter/  # from yolo-bun
    bun-loaders/        # from yolo-bun
  fixtures/             # small, reproducible migration inputs and expected outputs
```

## 3. Phases (each ends with its proof)

0. **Repository.** Create `aphrody-labs/l2l`, register `apps/l2l` as a submodule like `apps/r2b`,
   move this plan in. Proof: `git submodule status apps/l2l`, `ay lock` clean.
1. **Rescue n2b first-party code** (`crates/`, `src/`, `tests/`, `scripts/`, `dotnet/`,
   `forks/mingw-w64-rea` patches) with its 3 commits into l2l (ghidra/mingw parts to r2b). Proof:
   `cargo test --workspace` in `apps/l2l` green; n2b history visible in `git log`.
2. **Repoint vendors.** Replace every `vendor/*` path dependency with crates.io versions or
   `third_party/<name>` pins; verify each n2b vendor commit against the existing `third_party` copy.
   Proof: `cargo metadata` shows no path into `vendor/`; `ay manifests verify` clean.
3. **Absorb Bun side**: `packages/bun-plugins`, `packages/bun-parity`, yolo-bun converter and
   loaders. Proof: `bun test` for each package from `apps/l2l` (explicit paths, never bare
   `bun test` at the root).
4. **Rewire consumers**: `ay migrate` routes to `l2l-cli`; root `package.json` workspaces drop the
   moved packages. Proof: `ay arch check --strict`, `just verify-all` green.
5. **Delete** `third_party/n2b` (frees about 10 GiB including its 2.5 GiB `target/`),
   `crates/depot-migrate`, the old package dirs. Proof: `rg n2b` returns only historical docs.
6. **Archive** the absorbed yolo-rs repos with pointer descriptions.

## 4. Rules for the executing session

- Work only in `apps/l2l` and the consumer edits of phase 4; commit inside the submodule, bump
  the pointer, run `just lock`.
- Rust 2024 first; uv + ruff (+ pyo3 when needed) for Python; Bun for TS; C/C++ only when an
  upstream requires it.
- Never delete before the previous phase's proof is green. No secrets, zero emojis, no AI
  attribution in commits.
