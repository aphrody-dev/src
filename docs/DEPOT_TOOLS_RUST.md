# depot_tools in Rust

Status: 2026-11-12. Scope: `third_party/depot_tools` (Chromium's checkout and review tooling) and
the `third_party/chromium` gclient checkout. Rule applied throughout: reuse what exists (upstream
binaries, maintained crates, tools we already install) and write Rust only where nothing covers
the need. Every entry below says which of the two it is.

## Sync

| Unit | Before | After | How |
|---|---|---|---|
| `third_party/depot_tools` | `289a37bda` | `1afcf0756` (origin/main, 10 commits) | fast-forward, detached as before |
| `third_party/chromium/src` | `4c7244a405d3` | `ef68a767a544` (origin/main, 7,624 commits) | `git fetch origin main --no-tags` (1 m 50 s), detached checkout |

The chromium working tree held 91 uncommitted Markdown edits (an earlier emoji purge on upstream
files) that conflicted with upstream. They are kept on the local branch
`aphrody/local-md-edits-2026-11-12` (commit `1e2cc681a0d2`) in `third_party/chromium/src`, not
reapplied. No full `gclient sync` was run: the DEPS-pinned dependencies are still at their old
revisions, and `ay gclient sync` (below) reports what differs (247 deps: 100 up to date, 2 clone,
49 fetch, 5 checkout, 43 CIPD, 48 GCS). `ay lock` updated `src.lock.json`, `DEPS`,
`.repo/manifests/default.xml` and `MAINTAINERS`; `ay manifests verify` exits 0.

## Prior art checked before writing code

| Need | Exists already as | Decision |
|---|---|---|
| DEPS evaluation | [`teapot_tools`](https://codeberg.org/selfisekai/teapot_tools) 0.4.3 (crates.io): runs DEPS through embedded CPython (`pyo3`, `py.run`), no condition evaluator, no `revinfo`, last release 2023 | Not usable: executing DEPS as Python is what upstream deliberately avoids (`gclient_eval` whitelists AST nodes), and it needs a system Python. Written: `crates/depot-gclient` |
| Python parser | [`ruff_python_parser`](https://github.com/astral-sh/ruff) published as `rustpython-ruff_python_parser` 0.16.10; `rustpython-parser` 0.4.0 (older grammar, pulls `malachite` bigints) | Reused: Ruff's parser |
| vpython | Upstream `vpython3` (luci-go) is already uv-backed: specs are `vpython.toml` or PEP 723 blocks locked by `<spec>.uv.lock`; depot_tools ships `uv` in `.cipd_bin/uv` | Reused: `ay vpy` runs the same specs on the system `uv` and hands Chromium-index locks to upstream `vpython3` |
| CIPD client | Official Go client (`.cipd_client.exe`, `cipd_client_version` pinned); [`teapot_tools`](https://codeberg.org/selfisekai/teapot_tools) 0.4.3 `cipd/` (ResolveVersion + GetInstanceURL over protobuf pRPC, no ensure files, no site root layout) | Written: `crates/depot-cipd` ports luci-go `cipd/client/cipd` (ensure grammar, templates, instance ids, deployer layout) over pRPC JSON; the Go client stays the oracle and the fallback for other subcommands |
| Ninja | [`n2`](https://github.com/evmar/n2) (`aphrody-dev/n2`, `third_party/build/n2`, built into `~/.local/bin/n2.exe`); Kitware `ninja` (`aphrody-dev/ninja`, `third_party/build/ninja`) | Reused: `ay ninja` prefers `n2`, then `ninja`; Siso dirs go to upstream `autoninja` |
| gn, siso, clang | Upstream binaries from CIPD (`buildtools/<platform>/gn`, `third_party/siso`, `third_party/llvm-build`) | Kept upstream; `ay gn` finds the checkout's binary |
| git operations | `gix` 0.61 library (workspace), `gix`/`ein` CLI v0.61.0 and `jj` 0.46 (installed by `install.ps1`, jj configured there); gitoxide main is 0.90.0 (`third_party/vcs/gitoxide`) | Reused: gix for clone/fetch/checkout and read paths; jj for push/rebase/Gerrit upload |
| Gerrit REST | `gerrit-rust` 0.1.24, `libgerrit` 0.2.8 on crates.io; `jj gerrit upload` in jj 0.46 | Not written yet; `ay cl upload` should wrap `jj gerrit upload` (see Remaining) |

APIs were checked against the exact crate sources pinned in `Cargo.lock` (gix 0.61, gix-index
0.31, gix-worktree-state 0.9, gix-ref 0.43, Ruff parser 0.16.10) rather than current docs, since
those versions are older than what Context7 indexes.

## Entry points

LOC counts Python plus wrappers. The usage column counts calls from our own code (justfile,
`crates/`, `packages/`, `infra/`, install and deploy scripts); depot_tools is barely called today,
mostly detected (`ay git info`, `packages/forge/src/pillars.ts`) or probed for versions
(`packages/chromium-bun/src/benchmarks/category-d-build.ts` runs `ninja.bat --version`).

| Entry point | Lang | LOC | What Chromium developers use it for | Our calls | Replacement | State |
|---|---|---|---|---|---|---|
| `gclient` (`gclient.py`, `gclient_scm.py`, `gclient_utils.py`, `gclient_paths.py`) | Python | 6,393 + 2,952 + 1,734 + 252 | `sync`, `runhooks`, `revinfo`, `getdep`/`setdep` (rollers), `flatten`, `config` | `ay git gclient` passthrough; `xtk` writes a gclient-compatible root `DEPS` | `ay gclient` (`crates/depot-gclient`) | revinfo, getdep, setdep, sync, hooks listing, root: done |
| `gclient_eval.py` (DEPS / `.gclient`) | Python | 1,227 | Safe DEPS evaluation, conditions, setdep edits | none | `depot_gclient::{eval, condition, deps, edit}` on Ruff's parser | done, byte-identical to upstream |
| `fetch` (`fetch.py`, `fetch_configs/`) | Python | 370 + 1,740 | `fetch chromium`, `fetch v8`, `fetch --nohooks android` | none | `ay fetch` (`depot_gclient::fetch`, configs as data) | done for all 43 configs |
| `git cl` (`git_cl.py`) | Python | 9,254 | upload, status, land, try, issue, format, presubmit | none | `ay cl` (`depot_gclient::cl`): `upload` maps `-r`, `--cc`, `-t`, `-d`/`--cq-dry-run`, `-c`/`--use-commit-queue`, `--wip`, `--topic`, `--hashtag`, `-b` onto `jj gerrit upload`; `status`/`issue` query Gerrit REST with `.gitcookies` | upload, status, issue, land (CQ+2): Rust; every other subcommand (presubmit, try, try-results, format, owners) runs upstream `git_cl.py` on uv Python through `ay cl` |
| `git-map`, `git-map-branches`, `git-new-branch`, `git-rebase-update`, `git-squash-branch`, `git-reparent-branch`, `git-rename-branch`, `git-hyper-blame`, `git-number`, `git-upstream-diff`, `git-freeze`/`thaw`, `git-mark-merge-base`, `git-retry`, `git-footers` (`git_common.py`) | Python | 187, 112, 642, 291, 120, 69, 434, 323, 83, 47, 82, 213, 286 + 1,897 | Branch stacks on `origin/main`, rebasing stacks, blame across reverts | none | jj covers stacks natively (`jj log`, `jj rebase -d main`, `jj squash`, `jj bookmark rename`); `jj file annotate` for blame | use jj, nothing to write |
| `git_cache.py` | Python | 1,701 | Shared bare mirrors in `%LOCALAPPDATA%\depot_tools\git_cache` | read by `ay gclient sync` | `depot_gclient::sync::cache_dir_name` + `objects/info/alternates` | done: read side and `--populate-cache` |
| `cipd` (`cipd`, `cipd.bat`, `cipd_manifest.txt`) | bash/bat + Go binary | 295 + 98 | Binary packages: gn, clang, Siso, Python, test data | detection only | `ay cipd ensure` (`crates/depot-cipd`): luci-go site root (`.cipd/pkgs/<n>`, `_current.txt`, `.cipdpkg/manifest.json`, copy mode on Windows), instances and tag resolutions in depot-cas; Go client and ours each report the other's root up to date; other subcommands and `$ResolvedVersions` go to the Go client | ensure: done (public packages, SHA256 ids); rest upstream |
| `vpython3` | sh/bat + Go binary (uv inside) | 62 + 13 | Hermetic Python for hooks and scripts (`vpython.toml` + `.uv.lock`) | none | `ay vpy` (`crates/depot-vpython`) on system uv | done; Chromium-index locks delegate upstream |
| `gn.py` | Python | 145 | Locate the checkout's gn | none | `ay gn` (`depot_core::build_tools`) | done |
| `autoninja.py`, `ninja.py` | Python | 663 + 151 | Pick Siso or Ninja, `-j` and remote flags | `ninja.bat --version` probe | `ay ninja` (`depot_core::build_tools`): n2/ninja locally, upstream autoninja for Siso | done |
| `siso.py` | Python + Go binary | 747 | Siso build driver (remote execution) | `siso.bat` probe | stays upstream (`ay git siso` passthrough) | upstream |
| reclient wrappers | removed upstream | 0 | (replaced by Siso) | none | none | nothing to do |
| `presubmit_support.py`, `presubmit_canned_checks.py` | Python | 2,827 + 4,230 | `git cl presubmit`, CQ checks, `PRESUBMIT.py` API | archguard's 50 MB rule mirrors one check | stays Python, run through uv (`uv run --no-project`) | upstream |
| `gerrit_util.py`, `gerrit_client.py` | Python | 2,931 + 957 | Gerrit REST for `git cl` | none | ureq calls inside `ay cl` | not started |
| `gsutil.py`, `download_from_google_storage.py` | Python | 464 + 1,118 | GCS objects in DEPS (`dep_type: gcs`), sha1 downloads | none | `ay gclient sync` (`depot_gclient::gcs`): HTTPS GET of public buckets, sha256 and size check, tar.xz/gz and zip extraction with upstream safety rules, same marker files; objects go through the `depot-cas` store | done |
| `ensure_bootstrap`, `bootstrap/` | bash + Python | 72 + 842 | First-run Python and git bootstrap on Windows | none | not needed: `ay up` installs toolchains, uv provides Python | not ported |
| `win_toolchain/` | Python | 1,503 | Hermetic MSVC toolchain for Googlers (`DEPOT_TOOLS_WIN_TOOLCHAIN`) | none | stays upstream; outside Google, local VS is used | upstream |
| `update_depot_tools` | bash/bat | 132 + 72 | Self-update on every invocation | disabled by `ay` (`DEPOT_TOOLS_UPDATE=0`) | `ay lock` pins depot_tools in `src.lock.json` | replaced by pinning |
| `metrics.py`, `metrics_utils.py` | Python | 355 + 382 | Opt-in usage metrics | none | not ported (no telemetry in `ay`) | dropped |
| `recipes/` | Python | 13,751 | LUCI recipe modules for bots (`bot_update`, `gclient`) | none | stays upstream (bot infrastructure) | upstream |
| `roll_dep.py` | Python | 518 | Roll one DEPS entry with a log | none | `ay gclient setdep` + `ay git log` | partial |
| `split_cl.py`, `owners_client.py`, `my_activity.py` | Python | 1,345 + 267 + 1,161 | Split CLs by OWNERS, owners lookup, activity reports | none | not planned | upstream |

Total upstream Python: 96 top-level files, 69,905 lines, plus `recipes/` and `fetch_configs/`.

### What stays upstream and why

- gn, Siso, clang/LLVM prebuilts, the CIPD client: versioned binaries pinned by DEPS through CIPD;
  rebuilding them gains nothing and breaks hermeticity. `ay` only locates and runs them.
- presubmit: `PRESUBMIT.py` files across Chromium import `presubmit_support` as a Python API;
  they must run in Python. It runs on uv, never a system Python.
- recipes, win_toolchain, split_cl, owners: Google infrastructure workflows with no local use here.

## Implemented

All are libraries behind `ay` subcommands (`crates/ay/src/chromium.rs`, routes in
`crates/ay/src/lib.rs`, test `chromium_tools`).

### `ay gclient` (`crates/depot-gclient`)

- `eval`: `Exec` / `ParseLocalConfig` / `_gclient_eval` on Ruff's parser: literals, lists,
  tuples, dicts, `Str()`, `Var()`, `+`, `%`, `{var}` expansion with the `_SafeFormatter` rules
  (attribute and item access rejected), duplicate keys and code rejected.
- `condition`: `EvaluateCondition` (recursive string vars, `Str()` literals, cycle detection,
  `and`/`or` evaluating every operand like `any()`/`all()`).
- `deps`: `Parse` (standardized deps, `deps_os` into conditions, `hooks_os`).
- `tree`: `GClient`/`Dependency` semantics: `.gclient` (`target_os[_only]`, `target_cpu`,
  `cache_dir`, `custom_deps`, `custom_vars`, `custom_hooks`), built-in vars, variable precedence
  (DEPS, parents, built-ins, custom_vars), `recursedeps`, `use_relative_paths`, parent conditions
  ANDed into children, CIPD packages (`version_file` too), GCS objects with merged conditions,
  relative URLs, duplicate detection.
- `revinfo [--deps OS] [--filter X] [--ignore-dep-type T] [--output-json F]`.
- `getdep --var V -r path -r path:package`, `setdep --var k=v -r path@rev -r path:pkg@ver`
  (edits one string literal per change, keeps quotes; `AddVar` placement as upstream; gitlinks for
  `git_dependencies = 'SYNC'` updated through gix-index with the tree cache dropped).
- `sync [--apply] [-j N] [--only P] [--with-solutions] [--cipd]`: dry run by default. Plan: clone,
  fetch, checkout, up to date, unpinned, blocked (non-git directory or local changes), CIPD, GCS.
  Executor on gix: new checkouts are `gix init` + `objects/info/alternates` into the git cache
  mirror (`git clone --shared`), missing commits are fetched over HTTPS by id (Gerrit and GitHub
  serve reachable commits), existing checkouts refuse local changes, then the pinned tree is
  checked out and HEAD detached. Nested checkouts run after their parents, in parallel per level.
- `hooks`: every hook with its expanded action, cwd and whether its condition holds.
- `ay fetch <config> [--prop=value] [--apply]`: all 43 `fetch_configs` (including aliases such
  as `android`, `ios`, `webrtc_android`) as data, the `.gclient` text `fetch.py` writes, then a
  two-pass sync (solutions, then their deps).

Test evidence (`cargo test -p depot-gclient`; the upstream comparisons are `--ignored` because
they run depot_tools' bundled Python 3.11):

| Check | Result |
|---|---|
| `revinfo` vs `python gclient.py revinfo` on `third_party/chromium` | byte-identical for the host default and `--deps=all`, `unix,android`, `mac,ios`, `chromeos,fuchsia` (248, 355, 294, 243, 219 lines; SHA-256 `80c7d1e6...` for the default) |
| Speed, `revinfo` on chromium | 0.20 s (debug build) vs 5.9 s upstream |
| `setdep` vs upstream on a copy of chromium's DEPS | byte-identical for a git dep, a CIPD package, an existing var and a new var. Upstream crashes (`KeyError (3102, 75)`) when a new `--var` and `-r` are combined in one call; ours does not |
| `fetch_configs/*.py fetch` JSON vs ours | identical for all 43 configs, with no props, `--target_os=android,ios` and `--internal=True` |
| Real sync, scratch root with chromium pins | `ced`, `cld_3`, `colorama` from the cache in 0.28 s; `safeint` (not cached) fetched over HTTPS by id in 2.6 s; `git fsck` clean, `git status` empty, HEAD at the pin |
| Real sync in `third_party/chromium` | `src/third_party/snappy/src` and `src/third_party/openh264rs/src` moved to their new pins; `git status` empty and HEAD at the pin |
| Bug found and fixed on that run | gix 0.61 `overwrite_existing` does not truncate files, so shrunk files kept their old tail (21 files in openh264rs). The executor now deletes changed files first; regression test `sync::tests::checkout_replaces_existing_tree` |
| gix 0.61 loose refs and detached HEAD lack the trailing LF | normalized after each write (`git fsck` `refMissingNewline` warnings gone) |

### `ay vpy` (`crates/depot-vpython`)

Finds the spec like upstream (explicit `--vpy-spec`, the script's PEP 723 block, else the nearest
`vpython.toml`), then runs `uv run --no-project --python <requires-python> --with-requirements
<spec>.uv.lock python ...`. Locks that pin `+chromium.N` wheels (Chromium's own builds, served only
by its wheel index) go to upstream `vpython3` unless `--index-url` / `$AY_VPY_INDEX_URL` names that
index. Real run: `build/mcp_servers/vpython.toml` resolved and imported `mcp` on Python 3.11.18
(23 packages); the root `//vpython.toml` (11 `+chromium` pins) is routed upstream.

### `ay cipd`, `ay ninja`, `ay gn` (`crates/depot-core`)

`depot_core::DepotTools` now finds depot_tools from `$DEPOT_TOOLS_PATH`, `$SRC_ROOT` or the
repository root, `PATH`, then `C:\depot_tools` (the hard-coded duplicate `C:\src` path is gone),
runs wrappers by full path and sets `DEPOT_TOOLS_UPDATE=0`. `build_tools::use_siso` reproduces
autoninja's choice (`args.gn`, `.sisoenv` plus `.gn` / `gclient_args.gni` / `.siso_deps`, unless
`.ninja_deps`); `gn_path` follows gn.py's `FindGnTool` order.

## Lore: what we take

[EpicGames/lore](https://github.com/EpicGames/lore) (MIT, `aphrody-dev/lore`, `third_party/vcs/lore`) is a centralized, content-addressed VCS for code plus large binaries. Its client and server stay a separate tool; depot_tools takes its storage model, not its protocol, so Git and gclient stay the wire formats.

| Lore idea | Lore source | Here |
|---|---|---|
| FastCDC v2020 fragments, 32/64/256 KiB, normalization 1 | `lore-storage/src/chunker.rs`, `lore-base/src/types` | `crates/depot-cas`, same parameters, test asserts whole-buffer boundaries |
| blake3 fragment ids, immutable store, zstd level 6 | `lore-storage/src/{hash,compress,immutable_store}.rs` | `fragments/<2>/<64 hex>` zstd frames, atomic rename, never rewritten |
| Sparse, on-demand hydration | `lore-fuse`, `lore-revision` | GCS objects and CIPD instances hydrate from the store by sha256 with no network; next: `ay up` archives |
| Dedup across versions | fragment store | sysroot and clang pins share fragments between rolls and between checkouts |

Measured on `third_party/chromium` (Windows, debug `ay`): clang (53 MB) and the Rust toolchain (428 MB) downloaded and extracted in 3 m 33 s; removing `llvm-build/Release+Asserts` and syncing again hydrates it from the store in 17 s with no network. `_content_names` is byte-identical to Python `json.dumps(tarfile.getnames())` for both, so upstream `gclient sync` sees the objects as current. Store: `%LOCALAPPDATA%\depot_tools\cas`, override with `DEPOT_CAS`.

## LLVM and build toolchain forks

| Upstream | Fork | Rust counterpart | Use |
|---|---|---|---|
| llvm/llvm-project | `aphrody-dev/llvm-project` (`third_party/llvm-project`, origin = fork, upstream = llvm) | cranelift (`aphrody-dev/wasmtime`), rustc_codegen_cranelift | Chromium uses its own clang pin from GCS (`chromium-browser-clang`), synced by `ay gclient sync` |
| lld | same | wild (`aphrody-dev/wild`, `third_party/build/wild`, ELF only) | fast Linux links on fr1 |
| ninja-build/ninja | `aphrody-dev/ninja` | n2 (`aphrody-dev/n2`) | `ay ninja` |

## Replacing Git for Windows

Inventory of every git call in our own code (Rust `Command::new("git")`, TypeScript
`Bun.spawn`/`execSync`, just, PowerShell; the Go code in `infra/` never calls git). Coverage is
for gix 0.61 (workspace), gix 0.90 (gitoxide main) and jj 0.46.

| Subcommand | Our call sites | gix 0.61 | gix 0.90 | jj 0.46 | `ay` today |
|---|---|---|---|---|---|
| `rev-parse HEAD` / `<ref>` / `--abbrev-ref HEAD` / `--short=N` | 15 (worktree.rs, fork.rs, xtask, forge, vcs-meta-plugin) | yes | yes | `jj log -T` | `ay git rev-parse` on gix; `ForkManager`, `WorktreeManager::add` use gix |
| `branch --show-current` | 2 (xtask, vcs-meta-plugin) | yes | yes | n/a (no current branch) | `ay git branch --show-current` on gix |
| `remote -v` / `get-url` | 5 (fork.rs, xtask, pillars.ts, triforge.ts) | yes | yes | `jj git remote list` | `ay git remote [-v] / get-url` on gix; `ForkManager` uses gix |
| `remote add` / `set-url` / `config <k> <v>` / `--unset-all` | 9 (fork.rs, triforge.ts, git_slim.rs) | config write via `gix-config` file API | same | `jj git remote add/set-url` | still git |
| `config --get` | 2 | yes | yes | `jj config get` | `ay git config --get` on gix |
| `rev-list --left-right --count A...B` | 1 (fork.rs) | yes (rev walk) | yes | revsets | `ay git rev-list` on gix; `ForkManager` uses gix |
| `log -n`, `--pretty` | 5 | yes | yes | `jj log` | `ay git log [-n N] [rev]` on gix (short id + subject only) |
| `status --porcelain` | 3 | index-worktree only | full | `jj status` | `ay git status --porcelain` on gix (tracked changes; no untracked, no index-vs-HEAD) |
| `worktree list` | 1 (worktree.rs) | yes | yes | `jj workspace list` | `ay git worktree list` on gix |
| `worktree add` / `remove` / `prune` | 4 | no | no | `jj workspace add/forget` | still git |
| `fetch` (https) | 4 | yes | yes | `jj git fetch` | `ay gclient sync` fetches on gix; fork sync still git |
| `clone` full | in `ay gclient sync` / `ay fetch` | yes | yes | `jj git clone` | gix |
| `clone --filter=blob:none` / `tree:0`, `--sparse`, `sparse-checkout set` | 6 (git_slim.rs, install.ps1, depot-orgs.ts, sync-ecosystem-submodules.ts) | no partial clone | no partial clone | no | still git |
| `checkout <rev>` (detached) | gclient sync | yes (index from tree + worktree-state) | yes | `jj new <rev>` | gix |
| `checkout -- <file>` | 2 (bun-parity) | yes (blob write) | yes | `jj restore` | still git |
| `update-index --cacheinfo 160000,...` | 1 (sync-ecosystem-submodules.ts) | yes (gix-index) | yes | no | `ay gclient setdep` gitlinks on gix |
| `merge --ff-only` | 1 (fork.rs) | ref update + checkout | yes | `jj rebase`/`jj new` | still git |
| `merge` (true merge) | 1 | no | tree merge yes | yes | still git |
| `rebase` | 1 | no | no | `jj rebase` | still git; jj is the path |
| `push` (incl. multi-forge) | 1 (triforge.ts) | no | no | `jj git push` | still git; jj is the path |
| `submodule update --remote --merge` | 1 (sentinel) | read only | read only | no | still git |
| `diff`, `show --stat -p` | 6 | tree diff, no unified text | unified diff yes | `jj diff --git` | still git |
| `apply` | 2 | no | no | no | still git |
| `add .gitmodules` | 1 | index write (low level) | yes | `jj` auto-tracks | still git |
| `reflog expire`, `prune`, `commit-graph write`, `multi-pack-index write`, `scalar register` | 5 (git_slim.rs, vcs.ts) | no | no | `jj util gc` | still git |
| `show-ref --verify` | 1 | yes | yes | `jj bookmark list` | still git |

Other Git for Windows runtime dependencies: `ssh`/`scp` in `infra/internal/providers/vps.go`
(`ay ssh` on russh replaces them, `crates/remote`), `scalar.exe` (`git_slim.rs`), credential
helpers (`git-credential-luci`, gcloud helper in `triforge.ts`; plan: keyring-backed storage),
cargo's `net.git-fetch-with-cli = true` in `install.ps1`/`install.sh` (cargo can use its built-in
gitoxide/libgit2 fetch instead), and bash for `install.sh`/`deploy.sh` (their pwsh twins exist).
gix's own transports still spawn `ssh` for `ssh://` URLs and `git-upload-pack` for local `file://`
remotes; `ay gclient sync` avoids the latter by reading cache mirrors through alternates.

Path to zero Git for Windows: move the workspace to gix 0.90 (unified diff, tree merge, full
status), route push/rebase/worktrees through jj, drop partial clones from `git_slim` (or keep git
only for `ay git slim`), and replace `git_slim`'s maintenance commands with `jj util gc`.

## Python that remains

Upstream Python (presubmit, `git cl` until `ay cl` exists, hooks) runs through uv: `ay vpy` for
vpython specs, `uv run --no-project --with ruff ruff check <files>` for lint (ruff 0.17.4 reports
no findings on `gclient.py`, `git_cl.py`, `presubmit_support.py`, `presubmit_canned_checks.py`,
`gerrit_util.py`). There is no first-party Python. The only Python used for verification is
depot_tools' bundled 3.11 interpreter, for the upstream comparison tests.

## Remaining

1. Done: `ay cl upload|status|issue` (see the `git cl` row). `land` stays a CQ+2 upload; `try` and `presubmit` stay upstream.
2. Done: `ay gclient runhooks [--hook name] [-n]` runs enabled hooks in gclient order with the upstream header and exit code 2 on failure; `vpython3` goes to `ay vpy` (`--upstream-vpython` to keep vpython3), `python3` to `uv run --no-project python`. Checked on chromium: 17 hooks, `landmines`, `lastchange`, `vpython3_common` run clean.
3. Done: GCS downloads (`depot_gclient::gcs`) and `ay gclient sync --populate-cache` (pins fetched into the shared bare mirror with the `git_cache.Mirror` layout, kept by `refs/ay/pins/<id>`; checkouts borrow objects through alternates, jsoncpp: 80 KB `.git`). Existing mirrors can carry stale commit-graphs (jsoncpp did); delete and repopulate such a mirror.
4. `ay gclient flatten`, `--snapshot`/`--actual` revinfo.
5. Workspace gix 0.61 -> 0.90, then the remaining rows of the Git for Windows table.
6. A full `ay gclient sync --apply` of chromium (49 fetches, about an hour of transfer) once the
   git cache is refreshed.
