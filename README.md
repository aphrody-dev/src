<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/gen/logo/aphrody-labs-wordmark-dark.svg">
  <img alt="Aphrody Labs" src="assets/brand/gen/logo/aphrody-labs-wordmark-light.svg" height="56">
</picture>

<img alt="license: MIT OR Apache-2.0" src="assets/brand/gen/badges/license.svg"> <img alt="rust toolchain" src="assets/brand/gen/badges/rust.svg"> <img alt="runtime: bun" src="assets/brand/gen/badges/bun.svg"> <img alt="workflow: main only" src="assets/brand/gen/badges/main-only.svg">

Brand, tokens and icons: [assets/brand](assets/brand) (`ay brand build`, design system in [packages/design](packages/design/DESIGN.md)).

# src

Monorepo of Aphrody. Contract: [AGENTS.md](AGENTS.md) and [GEMINI.md](GEMINI.md). Master plan: [docs/PLAN.mdx](docs/PLAN.mdx).

## Stack Overview

- **Pure C23 LLVM ABI Core**: [crates/core-capi](crates/core-capi) (`aphrody_core.h` exporting `core_*` and unified `ai_os_*`, `aphrody_zig.h`, `aphrody_mwg.h`) compiled with `clang` ThinLTO and `-Wall -Wextra -Wpedantic -Werror`. See [docs/llvm/PURE-C-LLVM.mdx](docs/llvm/PURE-C-LLVM.mdx).
- **Agent OS (`@aphrody/ai-os`)**: cross-platform sandboxed Unix/GNU-like OS distribution for agents unifying FHS VFS (`/etc/ai-os`, `/var/lib/ai-os`, `/proc/agent`, `/dev/{llm,rag,world,sys1}`), LLM, RAG, World Model, and System 1 decision under one C ABI (`aphrody_core_capi`).
- **Bun v1.4.5+ Runtime**: pure Bun TypeScript packages with zero third-party npm dependencies (`bun:ffi`, `bun:sqlite`, `Bun.Glob`, `Bun.serve`).
- **Rust 2024 Workspace**: 81 crates in `crates/*` (edition 2024, rust-version 1.85, 278 workspace dependencies) including `ay` CLI, `archguard`, `core`, `core-capi`, `ffi`, `bun-flat`, `tv-*`, `steam-depot`, `lore*`.
- **Zig 0.17.1 Native Cores**: `packages/native/native` and browser cores exporting stable C ABI symbols via `aphrody_zig.h`.
- **Modern Web Guidance (`@aphrody/wck`)**: pure Bun + `mwg_capi` (`packages/wck/native`) hybrid RAG search, Baseline gates, and MCP tools. See [docs/web/MODERN-WEB-GUIDANCE.mdx](docs/web/MODERN-WEB-GUIDANCE.mdx).
- **`ay` Multicall CLI**: unified repository interface (`ay arch check --strict`, `ay manifests`, `ay flat check`, `ay gaming`, `ay steam`).

## Layout

| Directory                     | Count / Content                                                                                                                                                                                                                      |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/`](apps)               | 8 apps: `aphrody`, `auto`, `l2l`, `nt`, `r2b`, `rosegriffon` (submodule), `shenron` (submodule), `unixwin`                                                                                                                           |
| [`packages/`](packages)       | 19 Bun `@aphrody/*` packages: `ai-os`, `assets`, `browser`, `chromium-bun`, `core`, `deploy`, `design`, `env-kit`, `ffi-bridge`, `gaming`, `i18n`, `machine`, `native`, `net`, `release`, `shell-matrix`, `upstream`, `vault`, `wck` |
| [`crates/`](crates)           | 81 Rust 2024 crates (`ay`, `archguard`, `core-capi`, `bun-flat`, `ffi`, `rust-stack`, `tv-*`, `steam-depot`, `lore*`)                                                                                                                |
| [`infra/`](infra)             | Fleet, Docker, Cloudflare, and Chromium factory configuration                                                                                                                                                                        |
| [`third_party/`](third_party) | Pinned upstream checkouts and forks in `src.lock.json` (`DEPS`, `.gitmodules`)                                                                                                                                                       |
| [`docs/`](docs)               | Architecture MDX plans, LLVM/C ABI docs, Modern Web Guidance, and generated [`docs/reference/`](docs/reference)                                                                                                                      |

## Live Graph and Index

- SQLite index (`var/index/core.db`): 8000 files, 164631 symbols, 62394 imports, 1181320 call refs.
- Code graph (`graphify-out/GRAPH_REPORT.md`): 695105 nodes, 1371565 edges, 25459 communities.

## Commands

Rust compiles in CI or on the build host (`fr1`), never on the workstation.

```sh
just doctor                            # toolchain doctor
just arch-check                        # architecture gate (ay arch check --strict)
bun scripts/checkdeps.ts               # Chromium-style DEPS.rules layer gate
bun packages/core/src/cli.ts gen-docs  # regenerate README.md, MDX plans, and docs/reference/*.md
bun packages/core/src/cli.ts search <q> # fuzzy symbol and doc search
bun test packages/wck                  # @aphrody/wck Modern Web Guidance suite
```

## Key Documents

| Topic                       | Document                                                                                                                                                                                     |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Master Architectural Plan   | [docs/PLAN.mdx](docs/PLAN.mdx)                                                                                                                                                               |
| Pure C23 LLVM Core & C ABI  | [docs/llvm/PURE-C-LLVM.mdx](docs/llvm/PURE-C-LLVM.mdx)                                                                                                                                       |
| Modern Web Guidance & RAG   | [docs/web/MODERN-WEB-GUIDANCE.mdx](docs/web/MODERN-WEB-GUIDANCE.mdx)                                                                                                                         |
| Reference Pillars           | [docs/reference/tree-sitter.md](docs/reference/tree-sitter.md), [docs/reference/llvm-toolchain.md](docs/reference/llvm-toolchain.md), [docs/reference/bun-ffi.md](docs/reference/bun-ffi.md) |
| Games & Creative Suite Plan | [docs/games/PLAN.md](docs/games/PLAN.md)                                                                                                                                                     |
