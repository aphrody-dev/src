# Philosophy of src

What src takes from each model, what it refuses, and why. Marking: [V] verified in the cited source on 2026-11-12, [NV] not verified (to be sourced before depending on it). The resulting structure is in [ARCHITECTURE.md](ARCHITECTURE.md).

## 1. Chromium (gn, DEPS/gclient, //base, components, checkdeps, Mojo)

| Principle | Source | Adopted | Rejected / adapted |
|---|---|---|---|
| DEPS files per directory: `+` allows, `-` forbids, `!` allowed but to be removed (presubmit warning) | `third_party/chromium/src/buildtools/checkdeps/README.md` @ef68a767 [V] | Adapted: in-house `DEPS.rules` format (not the Python DEPS), same `+`/`-`/`!` prefixes and same downward inheritance, plus two additions absent from Chromium: `layer = N` and `sub/folder: directive` lines; gate `scripts/checkdeps.ts` | Granularity is the unit (crate or package), not the `#include` file: Cargo and bun already declare the edges in their manifests |
| Components do not depend on high layers (`//chrome`, `//content/shell`…), may depend on low ones (`//base`, `//net`, `//mojo`, `//ui`), and on each other only if explicit in DEPS | `components/README.md` [V] | Yes: layers L0 to L5, downward dependency free, lateral free but without cycles, upward forbidden (only `!` + ticket tolerates it, `+` only lifts a `-`) | Chromium allows edges between components through `+`; here `+` never crosses a layer upward |
| `//base`: small common library, code outside src.git does not use it; in Rust, "very small crates, split up by function" | `base/README.md` [V] | Yes: L1 base = small crates, without OS-specific code (no `cfg(target_os)` nor windows-rs) and without dependency on a service; generic domain primitives (CAS, errors, tokens) are admitted there | No copy of the C++ base API: we take std + pinned crates.io |
| gclient DEPS: every external dependency pinned by a 40-character commit | root `DEPS`, archguard gate ARCH-014 [V] | Yes (existing root DEPS, `src.lock.json`) | No arbitrary Python `hooks`: hooks go through `just` |
| Mojo: typed interfaces (`.mojom`) between processes/services | `docs/mojo_and_services.md` [V] | The idea: every process boundary has a versioned schema (proto for Lore, JSON Schema/MCP for the agent, versioned C ABI `core_abi_version()`) | Mojo itself: too tied to //base and the Chromium sandbox |
| gn + siso/ninja for the build | `crates/factory` (F4) | Only to build Chromium (factory) | No gn for the rest: cargo and bun are enough, a second build system would duplicate the graph |

## 2. bun

| Principle | Source | Adopted | Rejected |
|---|---|---|---|
| Single binary: `bun build --compile` produces a standalone executable | `third_party/bun/docs/compiler/executables.mdx` @9dda375 [V] | Yes: multicall `ay` (one binary, subcommands), single `aphrody` CLI | — |
| Everything built in (test, fmt, bundler, sqlite, ffi, shell) | bun 1.4.4 docs (skill `bun`) [V] | Yes: no third-party JS tool if bun does it; checkdeps gate written in bun, no npm dependency | turbo, eslint, prettier, vitest: refused as long as bun covers the need |
| Fast startup, measured cost | — | Yes: the gates (checkdeps < 1 s) run without compilation | — |
| Implementation language (bun is written in Zig and C++; no Rust port is attributed to it) | — | Choice specific to src, not taken from bun: first-party native code is Rust (cargo + LLVM unification): first-party native code is Rust; C++ only through the shared LLVM toolchain | No first-party Zig |

## 3. Linux kernel (upstream)

| Principle | Source | Adopted | Rejected |
|---|---|---|---|
| "We don't cause regressions", first rule | docs.kernel.org/admin-guide/reporting-regressions.html [V] | Yes: a merge never lowers the number of green tests; a regression is fixed or reverted | — |
| One logical change per patch, and the tree compiles and runs after each patch (bisect) | docs.kernel.org/process/submitting-patches.html [V] | Yes: small commits on main, each passes `just check`; no force-push | No patch series by mail |
| MAINTAINERS + `get_maintainer.pl`: copy the subsystem maintainers | same [V], `third_party/linux/MAINTAINERS` | Yes: root `MAINTAINERS` (kernel format, M/S/F/X fields), `just maintainer <path>`; M: may name an agent or a skill | — |
| Review on a mailing list | same | The spirit: every change to an architecture doc goes through an archived external review (`docs/reviews/`) | The mail channel: replaced by agent review + versioned archive |
| Coding style | `Documentation/process/coding-style.rst` [NV, not reread] | rustfmt / `bun fmt` as the only style, no debate | The kernel C style |

## 4. Windows NT

| Principle | Source | Adopted | Rejected |
|---|---|---|---|
| Executive layer (objects, memory, processes, I/O, configuration) in ntoskrnl; drivers and the HAL are not part of it | learn.microsoft.com/windows-hardware/drivers/kernel/windows-kernel-mode-executive-support-library [V] | Yes: L2 "platform" = our HAL (Windows, Linux, Cloudflare, Vercel behind an interface); L3 "services" = our Executive | — |
| Layered I/O: the I/O manager turns a request into an IRP routed through a driver stack, each one processes it then passes it to the next | learn.microsoft.com/…/overview-of-the-windows-i-o-model [V] | The request model: a call goes through the layers from top to bottom, never the reverse; platform adapters are stackable (runtime-adapter) | The IRPs themselves |
| Object manager + handles + access control by the security reference monitor at open time | learn.microsoft.com/…/example-i-o-request---an-overview [V] | The idea for the agent: a resource is obtained through a handle with rights checked at open time (MCP tools, env-kit secrets) | No NT ACL implementation outside Windows |
| Stability of the exposed ABI | [NV] | Yes for our C ABIs (`core_abi_version`): we add, we do not break | — |

## 5. cargo / crates.io

| Principle | Source | Adopted | Rejected |
|---|---|---|---|
| Single workspace, `[workspace.dependencies]` | root `Cargo.toml` [V] | Yes: one version per dependency | — |
| Additive features: enabling a feature must not remove functionality nor introduce a SemVer-incompatible change; unification by union | doc.rust-lang.org/cargo/reference/features.html [V] | Yes: no feature that disables; platform choices go through `cfg(target_os)` in L2 | — |
| SemVer and crates.io publication | cargo doc `semver.md` [NV, not reread] | SemVer for publishable crates; `publish = false` by default | Publishing unstabilized internal crates |

## 6. Modern monorepo (Turborepo, just, bun workspaces, uv)

| Principle | Source | Adopted | Rejected |
|---|---|---|---|
| Task graph + filter by change + remote cache; the remote cache can be implemented by any HTTP server following the Remote Cache API (v8 endpoints) | turborepo.dev/docs/core-concepts/remote-caching [V] | The graph: `checkdeps --affected REF` computes touched units + transitive dependents; `just test-affected` tests only those | turbo: refused. It can cache any declared task, but at package granularity: the Cargo graph would have to be redeclared in turbo.json/package.json, while sccache already caches at the granularity of the rustc compilation unit. It would add a binary, a config and a second graph. The R2 remote cache applies to cargo/sccache (TICKET taskgraph-001), not to turbo |
| just as the entry point | `justfile` [V] | Yes: `just check`, `just checkdeps`, `just affected` | Makefiles, .sh/.ps1 scripts |
| bun workspaces, uv for Python | root `package.json`, `pyproject.toml` (uv workspace, a single `uv.lock`) [V] | Yes | npm/pnpm/yarn, pip |

## 7. FFI / interop and LLVM toolchain

| Principle | Source | Adopted | Rejected |
|---|---|---|---|
| C ABI generated by cbindgen | `crates/core-capi` (cbindgen.toml) [V] | Yes: a single native boundary, versioned | Hand-written bindings |
| bun:ffi to consume the C ABI | `packages/core` [V] | Yes | napi as long as bun:ffi is enough (napi = Node, heavier ABI) |
| pyo3 for Python | `crates/agent-py` [V] | Yes, on the agent side only | — |
| windows-rs from the repository (not crates.io) + windows-bindgen | owner instruction | Yes, in L2 only | `winapi`, ad hoc bindings |
| Shared LLVM toolchain (clang, lld, rustc on the same LLVM) for cross-language LTO | `docs/llvm/` | Yes as the L0 target | Open conflict MSVC vs LLVM for nt (not decided here) |

## Resulting rules

1. A dependency goes to a lower or lateral layer, never upward; cycles are forbidden. Checked by `just checkdeps` (CI).
2. Every exception is written in a `DEPS.rules` with `!` and a ticket; it shows as a warning until it is removed.
3. No regression, bisectable commits, archived review.
4. A process or language boundary has a versioned schema (C ABI, proto, MCP).
5. No tool added if bun, cargo or just already do it.
