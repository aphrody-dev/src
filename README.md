<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/gen/logo/aphrody-labs-wordmark-dark.svg">
  <img alt="Aphrody Labs" src="assets/brand/gen/logo/aphrody-labs-wordmark-light.svg" height="56">
</picture>

<img alt="license: MIT OR Apache-2.0" src="assets/brand/gen/badges/license.svg"> <img alt="rust toolchain" src="assets/brand/gen/badges/rust.svg"> <img alt="runtime: bun" src="assets/brand/gen/badges/bun.svg"> <img alt="workflow: main only" src="assets/brand/gen/badges/main-only.svg">

Brand, tokens and icons: [assets/brand](assets/brand) (`ay brand build`, design system in [packages/design](packages/design/DESIGN.md)).

# src

Monorepo of Aphrody. The contract for contributors and agents is [AGENTS.md](AGENTS.md) and [CLAUDE.md](CLAUDE.md); the target architecture is [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the roadmap [docs/STACK-ROADMAP.md](docs/STACK-ROADMAP.md).

## Layout

| Directory | Content |
| :--- | :--- |
| [`apps/`](apps) | `aphrody`, `aphrody-app`, `auto`, `l2l`, `nt`, `r2-site`, `r2b`, `unixwin`, `yolo`, and two community sites maintained by Aphrody, `rosegriffon` and `shenron`. `auto`, `r2b`, `rosegriffon` and `shenron` are git submodules. |
| [`packages/`](packages) | Bun `@aphrody/*` packages: `ai-os` (the only AI product), `bun-parity`, `bun-plugins`, `chromium-bun`, `core`, `deploy`, `design`, `env-kit`, `ffi-bridge`, `forge`, `gaming`, `google-design`, `linux`, `machine`, `net`, `release`, `runtime-adapter`, `shell-matrix`, `upstream`, `vault`, `wck`. |
| [`crates/`](crates) | Rust 2024 crates in one flat Cargo workspace: `ay` (the repository CLI), `archguard`, `xtask`, `depot-*`, `lore*`, `aphrody-ui`, `core`, `core-capi`, `ffi`, `rust-stack`, `tv-*`, `gamescope-*`, `steam-depot`, `conformance`, `apm` and others. |
| [`infra/`](infra) | Fleet and deploy configuration assembled from upstream tools (`docker`, `cluster`, `cloudflare`, `fleet`, `mesh-vn`, `chromium-factory` and others). |
| [`third_party/`](third_party) | Upstream checkouts and aphrody-labs forks, pinned in [`src.lock.json`](src.lock.json); fork list in [`third_party/forks.txt`](third_party/forks.txt). No local modification. |
| [`docs/`](docs), [`assets/`](assets), [`conformance/`](conformance), [`licenses/`](licenses), [`plugins/`](plugins), [`scripts/`](scripts), [`tools/`](tools) | Documentation, brand assets, conformance suites, license texts, Claude Code plugins (`labs`, `aphrody-nhitl`), scripts and tooling. |

## Pins and licenses

- `src.lock.json` is the only pin; [`DEPS`](DEPS) and [`.gitmodules`](.gitmodules) are derived from it by `ay manifests`. [`MAINTAINERS`](MAINTAINERS) is maintained by hand.
- First-party code is MIT OR Apache-2.0 ([LICENSE-MIT](LICENSE-MIT), [LICENSE-APACHE](LICENSE-APACHE)). The dependency policy is in `deny.toml` and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Commands

Rust compiles in CI or on the build host, not on the workstation.

```sh
just doctor          # toolchain doctor
just arch-check      # architecture gate (ay arch check --strict for the strict form)
just lock            # lock the checkout in src.lock.json, then derive DEPS and .gitmodules
just manifests-check # derived manifests and gitlinks match src.lock.json
just env-doctor      # check the masked .env vault and editor auth wiring
just graph <path> <name>   # tree-sitter code graph into graphify-out/<name>
just deploy          # docker compose pull + up --wait on a host
just verify-all      # architecture gate, doctor, Bun suites, then ci.yml for Rust
```

## Where to read

| Topic | Document |
| :--- | :--- |
| Design system and UI | [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), [docs/ui/STACK.md](docs/ui/STACK.md), [packages/design/DESIGN.md](packages/design/DESIGN.md) |
| Media (`crates/tv-*`) | [docs/tv](docs/tv) |
| Gaming and Steam | [docs/gaming/OWNERSHIP.md](docs/gaming/OWNERSHIP.md) |
| Epic Games and Unreal Engine resources | [docs/epic/RESOURCES.md](docs/epic/RESOURCES.md), [docs/epic/TRACKING.md](docs/epic/TRACKING.md) |
| Games and creative suite (plan, not started) | [docs/games/PLAN.md](docs/games/PLAN.md) |
| Deploy | [docs/infra/DEPLOY.md](docs/infra/DEPLOY.md) |
| Session ledgers | [docs/SESSION-LEDGER-2026-11-13.md](docs/SESSION-LEDGER-2026-11-13.md) |

## Labs (merged 2026-11-12)

Aphrody Labs: self-hosted platform work; its former binary is now `ay conformance`.

| Path | Content |
| :--- | :--- |
| `crates/conformance`, `conformance/` | pinned conformance suites, CLI `ay conformance` |
| `crates/lore*`, `licenses/lore`, `tools/lore` | Lore VCS, absorbed (MIT) |
| `crates/apm` | APM crate |
| `[patch.crates-io]` | patched crates as aphrody-labs forks pinned by `rev` (quinn-proto, glob-match) |
| `third_party/oils`, `third_party/{vendor.lock,chrome-channels.toml,forks.txt}` | oils fork and pins |
| `infra/chromium-factory` | Chromium build factory |
| `plugins/labs` | Claude Code plugin `labs` ([docs/PLUGIN.md](docs/PLUGIN.md)) |

Recipes: `just lab-build`, `just lab-dev`, `just lab-conformance`.
