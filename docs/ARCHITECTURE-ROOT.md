# Single root — target architecture (2026-11-12)

Merge of three trees — the `src` monorepo, `labs` and `nt` (public: github.com/aphrody-labs/nt) — into one. Owner constraints: **zero duplicates, zero regressions**. From the start, the root must be at the same time an **OS for agents**, a **browser**, a **shell** and a **flat bun + cargo monorepo**, and everything in it must be **renamable, movable and cross-platform**.

Common target with the labs session (reference: `labs/docs/ROOT-ARCHITECTURE.md`). The coordination decisions are restated here.

## 1. Invariants (checked by `ay arch check --strict` and `just ci`)

1. **One of each.** One Cargo workspace (`crates/*`), one bun workspace (`packages/*`), one Rust toolchain (`rust-toolchain.toml`, one pinned nightly). A single `Cargo.lock`, `bun.lock`, `src.lock.json` (repositories) and `justfile`. `[workspace.dependencies]` gives one version per crate.
2. **Flat.** `crates/<layer>-<name>`, `packages/<name>`, `third_party/<name>`, on a single level, without a category folder (Chromium model). The category becomes metadata. A folder move never renames a package (no broken dependent); a rename only goes through invariant 5. The two rules do not overlap: 2 governs the path, 5 the name.
3. **One upstream project = one folder.** Forks of the same GitHub network are merged:
   - `origin` = `aphrody-labs` fork, `upstream` = upstream project;
   - a third-party fork that carries commits becomes an additional remote of the same clone (example: `reactos` in `third_party/LiberNT`), not a second copy;
   - patches live in the forks, pinned by commit, never in a vendored copy.
4. **Nothing regenerable is versioned.** `third_party/` (materialized from `src.lock.json`, except its tracked pin files: `third_party/*.toml` such as `chrome-channels*.toml` and `ECOSYSTEM.toml`, `forks.txt`), `third_party/crates` (`cargo vendor` via `just vendor`: `Cargo.lock` and the source-replace of `.cargo/config.toml` stay versioned, the build runs offline), `target/`, `node_modules/`, `var/`.
5. **Single identity.** `identity.toml` at the root contains: product and repository, CLI (binary `ay`, package `aphrody`), npm scope, prefixes (`crate_prefix`, `env_prefix`, `symbol_prefix`), orgs (`aphrody-dev`, `aphrody-labs`), domains, sub-products.
   - `just identity apply` (`bun scripts/identity.ts apply`) rewrites the copied fields: `[workspace.package]` (authors, repository, homepage), name and `[[bin]]` of crates/ay, `package.json#name` and `@scope/` keys;
   - `just identity check` guards `just check` and CI (step "Identity gate");
   - crate prefix: only names that would collide on crates.io carry it (docs/NAMING.md); it is not reapplied to existing names, which would break invariant 2;
   - code hard-codes no product name: `env!("CARGO_PKG_NAME")` everywhere, `env!("CARGO_BIN_NAME")` only in a `[[bin]]` target (Cargo does not define it for a lib), otherwise reading identity.toml (Rust: crates/xtask; TS: Bun TOML import);
   - renaming fits in one PR: identity.toml, then `apply`, then `just ci`.
6. **No absolute path, link or junction versioned.**
   - The rule targets the tree tracked by git: no link or junction is committed there, no folder alias at the root. Links created by tools in ignored folders remain allowed: `node_modules/` (bun install), gclient cache, `.claude/skills` (`ay up --bootstrap`). `ay git audit` only reports root junctions.
   - Paths are relative to the root: the nearest ancestor that contains `identity.toml` (a unique file, absent from sub-crates, unlike `Cargo.toml`), otherwise `SRC_ROOT`, otherwise `.lore`.
   - Otherwise they come from environment variables (`XDG_*`, `%LOCALAPPDATA%`, `SystemRoot`).
7. **Cross-platform.** Every binary compiles and tests on windows-msvc and linux-gnu. `just` calls Rust or bun binaries: no `.sh` or `.ps1` required. OS-specific recipes are marked `[windows]` or `[unix]`.
8. **No regression.** After each phase, test counts must be equal to or greater than the baseline. A phase that breaks is cancelled. Execution on prd or fr2 only: owner instruction, no compilation on the PC or on fr1.

## 2. Target tree

```
<root>/
├── identity.toml                                   single identity (name, CLI, scope, domain, remotes)
├── Cargo.toml  Cargo.lock  rust-toolchain.toml  .cargo/config.toml
├── package.json  bun.lock  bunfig.toml  tsconfig.json
├── justfile  src.lock.json  README.md  AGENTS.md  CLAUDE.md  LICENSE-*
├── crates/<layer>-<name>   Rust: sys-, shell-, browser-, desktop-, agent-, vcs-, depot-, design-, nt-
├── packages/<name>         bun: machine, shell-matrix, nt, env-kit, forge…
├── apps/<name>             deployable binaries and sites
├── third_party/<name>      flat upstreams, locked (src.lock.json), not versioned
├── infra/                  Go, fleet, chromium-factory (scripts → crates/browser-factory)
└── docs/<layer>/           one tree, one file per topic; history → docs/archive/
```

## 3. Roles

| Role                   | Layers                              | Pieces                                                                                                                                                                                                                              |
| ---------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OS for agents          | `sys-`, `nt-`, `desktop-`, `agent-` | model of the workstation's real NT (ntdll, NTFS, PE, UI Automation) rendered on GPU (WebGPU, D3D12), `agent-desktop` (UIA, SendInput, capture, MCP), `ring3-agent`, `apm`, `packages/machine` (reproducible workstation, elevation) |
| NT/Linux compatibility | `third_party`                       | `LiberNT` (+ remote `reactos`), `linux` (kernel.org), `wine` (gitlab.winehq.org), `mingw-w64` (SourceForge), `windows-rs`, `windows-drivers-rs`, `litebox`, `openvmm`                                                               |
| Browser                | `browser-`                          | `chromium` (indivisible gclient unit), `infra/chromium-factory`, channels, conformance, `webui`, `blitz`, `agent-browser` (labs session)                                                                                            |
| Shell                  | `shell-`                            | `niubash`, `rubash`, `brush`, `oils` (Windows port), Coreutils, `packages/shell-matrix`, `packages/machine/shell.dsc.winget`                                                                                                        |
| Monorepo               | `depot-`, `vcs-`                    | `ay` (lock, forks, up, identity, arch), Lore, `just`                                                                                                                                                                                |

## 4. Merge: origin → destination

| Origin                                                          | Destination                                                                           | Note                                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `nt` (aphrody-labs/nt, still active on GitHub as of 2026-11-13) | `apps/nt` (WinUI 3 shell, web scene, bun host tools)                                  | Rust core = windows-rs monorepo (aphrody-labs fork, single branch `master`) → `third_party/windows-rs` |
| `nt/docs`                                                       | `docs/nt`, `docs/ms`, `docs/bun`, `docs/research`                                     | deduplicated against the existing                                                                      |
| `nt/vendor` (35 clones)                                         | deleted on 2026-11-12 (without local changes); LiberNT moved to `third_party/LiberNT` | duplicates of `third_party`                                                                            |
| `labs/crates/*`                                                 | `crates/*`                                                                            | merge by the labs session (worktree `merge/labs`): dependencies, profiles, cargo-features, `[patch]`   |
| `labs/vendor/{glob-match,quinn-proto}`                          | forks + `[patch.crates-io]`                                                           |                                                                                                        |
| `labs/infra/chromium-factory`                                   | `infra/chromium-factory`                                                              |                                                                                                        |
| `labs/forks/oils`                                               | `third_party/oils`                                                                    | windows-native branch                                                                                  |
| `third_party/<cat>/<repo>`                                      | `third_party/<name>`                                                                  | `packages/machine/src/flatten-third-party.ts` (see §5)                                                 |
| `configuration/` (root, ARCH-005)                               | `packages/machine`                                                                    | ARCH-006 forbids TS in `infra/`                                                                        |

## 5. Flat third_party — verified plan (simulation 2026-11-12)

- 320 repositories → 309 upstream projects: 277 moves, 10 duplicates deleted, 1 empty folder removed (320 − 10 − 1 = 309). Limit: the GitHub comparison only covers the default branch; also check branches, tags and non-GitHub upstreams before deletion.
  - Duplicates detected through the GitHub API, following the fork network and the number of commits ahead ("ahead"). Examples: `cachyos/WSL` (fork of microsoft/WSL, 0 commits ahead, 67 behind) and `build/wild` (aphrody-dev, 0 ahead).
  - Other operations: 3 junctions removed, 1 empty folder, 2 isolated files moved to `var/`, 26 tracked references rewritten.
- Naming. The name is the last segment of the current path, without the `owner_` prefix. A generic name keeps its owner (`lightpanda-io-browser`, `modelcontextprotocol-rust-sdk`). Exceptions are listed and justified in the script.
- Safety. The plan is refused in four cases: collision, unlocked folder, local work in a duplicate, divergent fork.
- Application. The move goes through a `third_party/.flatten` transit. Category folders are removed by `rmdir`, which fails if they are not empty.
- Schedule: after the labs merge, then `ay lock --lock-only`.

## 6. Phases

1. Baseline (done on 2026-11-12, before the "no build on the PC" instruction): 9/9 green steps, cargo 805 tests OK, bun 45 OK (`var/baseline-verify-all.log`).
2. labs merge (labs session) → verification on prd/fr2.
3. Flat third_party + dedup → `ay lock`.
4. nt → `apps/nt` (done on 2026-11-13); Rust core via the windows-rs monorepo (`third_party/windows-rs`, aphrody-labs fork, master branch; no nt/* branch) → verification, real display measurement (?report=1).
5. `identity.toml` + `ay identity`; remaining `.sh`/`.ps1` → `just` recipes to Rust/bun (`forks-aphrody-labs.sh` already replaced by `packages/machine/src/forks.ts`).
