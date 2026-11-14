# Supply and dependencies: policy (2026-11-13)

One version per component, one channel per component, one lock per ecosystem, all verified by
`ay doctor --deps` and updated by `ay lock --deps --bump`. Models: Chromium (DEPS + gclient,
flat `third_party/`, CIPD binaries pinned by hash) and intelligent-terminal
(`third_party/intelligent-terminal` @ 5a4876d, 2026-11-13: `vcpkg.json` with `builtin-baseline` and
`overrides`, ports and triplets in `dep/vcpkg-overlay-*`, third-party sources in `oss/<name>/` with one
`cgmanifest.json` per component, workstation described in `.config/configuration.winget`).

Source studies: `docs/packaging/PACKAGE-MANAGERS.md`, `docs/packaging/RECOMMENDATION.md`,
`docs/native/llvm/UNIFIED-TOOLCHAIN.md`, `docs/native/compat/TARGETS.md`, `docs/infra/INSTALL_UPDATE.md`. This document
settles them. Only deviation: the `distroless/*-debian13` images cited in `RECOMMENDATION.md` are
rejected, because src never uses Debian or Ubuntu.

## 1. Rules

1. **One channel per component** (table §2). Order of preference:
   1. the project manifest (`Cargo.toml`, `package.json`, `pyproject.toml`, `go.mod`) with its lock;
   2. the official prebuilt release, pinned in `tools.toml` with sha256 or signature, installed by `ay up` in `~/.local/bin`;
   3. an `aphrody-labs` fork pinned by commit (`src.lock.json` then DEPS), only when it carries a patch or an optimization;
   4. the system manager, as a last resort: winget on Windows; in containers, apk (Alpine), pacman (Arch) or nix.
      Never apt, snap or a Debian/Ubuntu image. flatpak/Flathub is used only for Linux desktop applications, outside the build chain.
      Bounded exception (2026-11-13, owner request): Debian and Ubuntu are **output targets** of `ay pkg` (`infra/pkg`, `docs/native/linux/OWNERSHIP.md`); their digest-pinned containers are used only to build and test our `.deb` in CI, and the `base-debian` image for that test. No src tool depends on them, apt remains forbidden on the PC.
2. **One lock per ecosystem, at the root**: `Cargo.lock`, `bun.lock`, `uv.lock`, `infra/go.sum` and `src.lock.json` (git repositories). DEPS, `.repo/manifests/default.xml` and MAINTAINERS are generated from it by `ay lock`. An `apps/*` submodule keeps the lock of its own repository.
3. **One version per package.**
   - Rust: each crates.io dependency is declared only once in `[workspace.dependencies]`; members write `{ workspace = true }` and may only add `features` or `optional`.
   - bun: every external dependency goes through `"catalog:"` (root catalog, exact versions).
   - Python: a single uv workspace, declared in the root `pyproject.toml`.
4. **Requirements follow semver, the lock gives exactness.** On the Rust side, a caret requirement (`"1.0.104"`), except in two cases where the exact `=` pin is kept: a prerelease, or a line preceded by `# Pinned:` with its reason. CI builds with `--locked` and installs with `bun install --frozen-lockfile` and `uv sync --locked`.
5. **Supply chain.**
   - `deny.toml` (cargo-deny) allows only crates.io and the git forks listed in `allow-git`.
   - No `preinstall`/`postinstall` script, no third-party registry, no floating version (`latest`, `*`).
   - Prebuilt binaries are verified by sha256 or by signature. No tool is `source = "ubi"`: sha256 per platform in `tools.toml`.
6. **Pinned Rust toolchain**: `rust-toolchain.toml` contains a dated nightly (`nightly-YYYY-MM-DD`). The date matches the rustc commit of `src.lock.json`. The correspondence is checked in `static.rust-lang.org/dist/<date>/channel-rust-nightly-git-commit-hash.txt`.
7. **node to bun.** No script runs node, npx, npm, pnpm, yarn, tsc, prettier, eslint, jest, vitest or esbuild: bun replaces them (`bun test`, `bun fmt`, `bun check`, `bun build`, `bun x`). A Node upstream that we absorb becomes an `aphrody-labs` fork ported to bun (lock `bun.lock`, bun scripts). This is already done for openclaw: pnpm to bun migration.
8. **third_party the Chromium way.**
   - One upstream = one `third_party/<name>` directory, pinned by commit in `src.lock.json` and DEPS, and not versioned in src.
   - The clone is partial (`--filter=blob:none`), possibly sparse; `ay git slim --all` compacts it (commit-graph, multi-pack-index, repack).
   - Patches live in the forks, never in a vendored copy.
   - Updating goes through `ay lock`, then through the commit of `src.lock.json` and DEPS.
9. **FFI, IR, ABI.** A single C ABI at the center (`crates/core-capi`, `crates/ffi`, `infra/cshared`, `bun:ffi`). A single LLVM: clang, lld and rustc on the same major version. Cross-language LTO goes through `-Clinker-plugin-lto` (`docs/native/llvm/UNIFIED-TOOLCHAIN.md`).
   - Third-party C/C++ libraries come from vcpkg in manifest mode. Each `vcpkg.json` declares `builtin-baseline` and `overrides`, on the `aphrody-labs/vcpkg` fork and the chained LLVM triplet: outputs are LLVM bitcode, measured on fr2 on 2026-11-12.
   - Large upstreams (Chromium, LLVM, kernel, WebKit) remain `third_party/` units built by their own system, on fr1.

## 2. Components

| Component                                       | Chosen channel                                                                                    | Reason                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| rustc, cargo, clippy, rustfmt                   | rustup + `rust-toolchain.toml` (dated nightly)                                                    | same LLVM as clang; reproducible by date; `cargo-features` require nightly |
| Rust crates                                     | `Cargo.toml` `[workspace.dependencies]` + `Cargo.lock` + cargo-deny                               | one version per crate, single lock, licenses and sources controlled        |
| patched crates (russh, sntrup761)               | `aphrody-dev` fork in `[patch.crates-io]`, commit in `Cargo.lock`                                 | PQ-kex patch not published upstream                                        |
| cargo tools (nextest, binstall, dist, zigbuild) | GitHub release + checksum (`tools.toml`); `cargo binstall` otherwise; `cargo install` only on prd | no compilation on the workstation; binstall verifies published signatures  |
| bun                                             | GitHub release `oven-sh/bun` + `SHASUMS256.txt` (`tools.toml`, lock `toolchains.bun`)             | single binary, musl on Linux; Node replaced                                |
| JS packages                                     | `package.json` (root catalog) + `bun.lock`                                                        | native bun; zero external dependency today (only `@types/bun`)             |
| JS CLIs (wrangler, MCP)                         | `source = "bun"` in `tools.toml`, exact version                                                   | installed by bun, without npm                                              |
| Python (src projects)                           | root uv workspace (`pyproject.toml`, `uv.lock`)                                                   | a single resolver and a single lock; CPython managed by uv                 |
| uv                                              | GitHub release `astral-sh/uv` + `.sha256`                                                         | uv publishes a sha256 sum per archive                                      |
| Go (infra)                                      | `infra/go.mod` + `go.sum`, `go 1.27.0`                                                            | MVS + sum.golang.org                                                       |
| zig                                             | ziglang.org archive (`tools.toml`, `source = "url"`); minisign signature to be added              | no up-to-date system package                                               |
| clang, lld, llvm-*                              | `third_party/llvm-project` built on fr1, shared with Chromium                                     | cross-language LTO, a single LLVM                                          |
| third-party C/C++                               | vcpkg manifest + baseline (fork `aphrody-labs/vcpkg`) + LLVM triplet                              | intelligent-terminal model; binary = bitcode                               |
| Chromium                                        | gclient (`third_party/chromium`, upstream DEPS, CIPD); build on fr1                               | indivisible unit, Google tooling                                           |
| .NET 11 / 10                                    | official Microsoft archives (dotnet-install); NuGet + `packages.lock.json`                        | NativeAOT; no Mono or VSTest                                               |
| MSVC, Windows SDK                               | Windows: winget (Build Tools); Linux: `xwin` (`tools.toml`)                                       | only redistributable Microsoft channel                                     |
| Windows system tools (Docker Desktop, drivers)  | winget, declared in DSC (`packages/machine/*.dsc.winget`)                                         | intelligent-terminal's `.config/configuration.winget` model                |
| generic CLIs (rg, fd, bat, just, gh…)           | GitHub release (`tools.toml`), sha256 per platform                                                | static binary, same version on Windows and Linux                           |
| OCI images                                      | Alpine (light), Arch (heavy), `cgr.dev/chainguard/static` (Rust musl), pinned by digest           | never Debian/Ubuntu                                                        |
| Linux hosts                                     | Arch/CachyOS (prd): pacman; nix (`flake.nix`) outside containers                                  | no apt in the src chain                                                    |
| Linux desktop applications                      | flatpak/Flathub                                                                                   | isolated, outside the build                                                |
| git upstreams (third_party)                     | `aphrody-labs` fork if patched, otherwise upstream; `src.lock.json` to DEPS                       | Chromium DEPS model                                                        |

## 3. Commands

| Command                                         | Effect                                                                                                                                                                                                                                                     |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ay doctor --deps`                              | compliance of the whole repository (rules below); exit code 1 on any error                                                                                                                                                                                 |
| `ay doctor --deps --dups`                       | also lists crates resolved in several versions                                                                                                                                                                                                             |
| `ay doctor --deps --json`                       | JSON report (CI, dashboards)                                                                                                                                                                                                                               |
| `ay lock --deps`                                | refreshes `Cargo.lock` (`cargo update --workspace`), `bun.lock` (`bun install --lockfile-only`) and `uv.lock` (`uv lock`) without bumping anything                                                                                                         |
| `ay lock --deps --hoist`                        | first hoists members' inline requirements into `[workspace.dependencies]` and relaxes the `=`                                                                                                                                                              |
| `ay lock --deps --bump`                         | in-range bump: `cargo update`, `bun update --recursive`, `uv lock --upgrade`; shows duplicates before and after                                                                                                                                            |
| `ay lock --deps --dedupe`                       | like `bun dedupe`: each duplicated crate is brought down to a lower version already resolved (`cargo update -p name@high --precise low`) if all its dependents accept it and the total number of copies drops                                              |
| `ay lock --deps --breaking`                     | raises the `[workspace.dependencies]` requirements whose latest stable version (crates.io sparse index) falls outside the caret range, then `cargo update`; cargo 1.102-nightly no longer has `update --breaking`; to be validated by `cargo check` on prd |
| `ay lock`                                       | `src.lock.json` (relative paths) then DEPS, `.repo`, MAINTAINERS                                                                                                                                                                                           |
| `just deps`, `just deps-lock`, `just deps-bump` | the same, via just (`deps-bump` chains `--bump --dedupe`)                                                                                                                                                                                                  |

Rules checked:

- Rust: `CARGO-INLINE`, `CARGO-PATH`, `CARGO-GIT`, `CARGO-REGISTRY`, `CARGO-WILDCARD`, `CARGO-PRERELEASE` (warning), `CARGO-DUP` (warning), `CARGO-DENY`, `RUST-PIN`;
- bun: `JS-CATALOG`, `JS-CATALOG-PIN`, `JS-FLOAT`, `JS-NODE`, `JS-INSTALL-SCRIPT`, `JS-ABS-PATH`, `JS-LOCK`;
- Python: `PY-WORKSPACE`, `PY-LOCK`, `PY-MANIFEST`;
- containers and tools: `OCI-DISTRO`, `TOOLS-PIN`, `TOOLS-UNVERIFIED`;
- `src.lock.json`: `LOCK-ABS`, `LOCK-UNPINNED`, `LOCK-MISSING` (warning).

## 4. Automatic updates

CI, on fr1 or prd, runs `ay lock --deps --bump --dedupe` every week, then `cargo check --workspace --locked`, `cargo test`, `bun test` per package and `ay doctor --deps`. It commits the locks on main when everything is green. On prd, only one heavy job at a time: `flock /var/lock/aphrody-heavy.lock`, `nice -n 19`, `ionice -c 3`, `-j 2`, and only when the load is under half the cores. Otherwise, GitHub CI takes over.

Major bumps (`--breaking`) and the nightly date are changed by hand, in a dedicated commit. The remaining duplicate of each bump is recorded in `docs/native/deps/DEDUP.md`.

## 5. A single source of tools

`tools.toml` declares the CLIs installed by `ay up` (`[[tool]]`, all pinned and verified by sha256: GitHub release digests, or a measured sum when the release does not publish one). It also carries, at the end of the file, the `[toolchain."<name>"]` block generated by `packages/machine/src/toolchains-lock.ts` (`just toolchains-lock`): toolchains per host with `{ url, sha256 | sha512 }` per platform. This block is read by `infra/fleet/bootstrap`, `infra/docker` and `ay bun bump`. `packages/machine/toolchains.lock.toml` is deleted.

Complements:

- `docs/native/deps/DEPS-MINIMIZE.md`: no versioned third-party code, Cargo git sources pinned by `rev`;
- `deny.toml` `[sources.allow-org]`, recognized by `CARGO-GIT`;
- `packages/machine/src/js-deps-check.ts`, run in `just check` and in CI: `bun.lock` duplicates, bun built-ins.

## 6. Additions from other workstreams

Every new path must pass `ay doctor --deps` without error:

- a crate under `crates/` inherits from the workspace;
- a package under `packages/` goes through the catalog;
- a Python project becomes a member of the uv workspace;
- an upstream is cloned in `third_party/<name>`, then `ay lock`.
