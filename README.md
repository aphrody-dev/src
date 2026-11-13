<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/brand/gen/logo/aphrody-labs-wordmark-dark.svg">
  <img alt="Aphrody Labs" src="assets/brand/gen/logo/aphrody-labs-wordmark-light.svg" height="56">
</picture>

<img alt="license: MIT OR Apache-2.0" src="assets/brand/gen/badges/license.svg"> <img alt="rust toolchain" src="assets/brand/gen/badges/rust.svg"> <img alt="runtime: bun" src="assets/brand/gen/badges/bun.svg"> <img alt="workflow: main only" src="assets/brand/gen/badges/main-only.svg">

Brand, tokens and icons: [assets/brand](assets/brand) (`ay brand build`, design system in [packages/design](packages/design/DESIGN.md)).

# Sovereign Monorepo (`C:\src`) — Architecture & Operating Topology (Late 2026)

Engineered around the foundational standards of **Linus Torvalds** (`Linux`, `Git`, POSIX/GNU clean flat hierarchy, sacred `C:\Windows\System32` userspace integrity, strict C-ABI boundaries), **Jarred Sumner** (`oven-sh/bun` v1.4.4 100% Full-Rust runtime, `bun fmt`, `bun check`, `bun:sqlite`, `bun:ffi`, AOT `--compile`), **Chromium `depot_tools`** (strict `third_party/` vendor isolation + `src.lock.json`), and **Larry Page** (instant sub-100ms `www.google.com` visual clarity, autonomous NHITL execution, and Vercel-style 1-click self-hosted + multi-cloud deployment).

---

## 1. Canonical Directory Hierarchy (`C:\src`)

| Top-Level Directory                                 | Role & Architectural Discipline                                              | Key Subsystems                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :-------------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`apps/`](apps)               | Production Web, Streaming & Desktop Platforms                                | [`aphrody`](apps/aphrody) (`aphrody.com`), [`shenron`](apps/shenron) (`dragonballfr.com`), [`rosegriffon`](apps/rosegriffon) (`rosegriffon.fr`)                                                                                                                                                                                                                                                                                                             |
| [`packages/`](packages)       | First-Party Bun v1.4.4 Full-Rust Workspace Packages                          | [`ai-triad`](packages/ai-triad), [`ai-os`](packages/ai-os), [`pi-opencode`](packages/pi-opencode), [`env-kit`](packages/env-kit), [`google-design`](packages/google-design), [`wck`](packages/wck), [`bun-parity`](packages/bun-parity), [`forge`](packages/forge), [`bun-plugins`](packages/bun-plugins), [`chromium-bun`](packages/chromium-bun) |
| [`crates/`](crates)           | First-Party Rust 2024 Systems, Kernel & FFI Crates                           | [`rust-stack`](crates/rust-stack), [`ring3-agent`](crates/ring3-agent), [`depot`](crates/depot), [`xtask`](crates/xtask), [`wayland`](crates/wayland), [`gamescope-rs`](crates/gamescope-rs), [`unix`](crates/unix), [`bench`](crates/bench)                                                                                                                                     |
| [`infra/`](infra)             | Go 1.27 One-Click Self-Hosted & Multi-Cloud Deploy Engine + Three-Way FFI    | [`cmd/src-deploy`](infra/cmd/src-deploy/main.go), [`cshared`](infra/cshared/infra_go.go) (`infra_go.dll`), [`ffi-bridge`](infra/ffi-bridge/index.ts), [`mesh-vn`](infra/mesh-vn), [`generated/Caddyfile`](infra/generated/Caddyfile)                                                                                                                                                                                          |
| [`third_party/`](third_party) | Unified 4-Pillar Upstream Vendor Tree (`133` locked repos) | [`linux`](third_party/linux) (`torvalds`/`stable`/`next`/`gki`), [`chromium`](third_party/chromium), [`aosp`](third_party/aosp) (`platform/manifest` + `build/kleaf`), [`bun`](third_party/bun), [`depot_tools`](third_party/depot_tools), [`archlinux`](third_party/archlinux), [`cachyos`](third_party/cachyos), [`omacom`](third_party/omacom) |
| [`tools/`](tools)             | Reproducible Monorepo Architecture & Boundary Auditors                       | [`archguard`](tools/archguard) (12-rule domain-purity, zero-npm, zero-emoji & host safety gate)                                                                                                                                                                                                                                                                                                                                                                        |
| [`docs/`](docs)               | Deep-Think Architectural Specifications, Kernel MDX & Patch Series           | [`MONOREPO_ATLAS.md`](docs/MONOREPO_ATLAS.md), [`linux-kernel-story`](docs/linux-kernel-story), [`patches/series`](docs/patches/series)                                                                                                                                                                                                                                                                                                  |

---

## 1b. Unified 4-Pillar VCS Governance (`Git + Chromium + Kernel + AOSP`)

| Pillar | Root Manifest | Orchestrators & Commands | Scope |
| :--- | :--- | :--- | :--- |
| **1. Git Superproject** | [`.gitmodules`](.gitmodules), [`.gitattributes`](.gitattributes), [`src.lock.json`](src.lock.json) | `xtk lock`, `xtk slim-all`, `frg status`, `frg remotes` | 25 first-party submodules + Git Scalar (`protocol.version=2`, `core.fsmonitor`, `index.version=4`, `commit-graph`, `multi-pack-index`) + Tri-Forge (`GitHub`, `GitLab`, `Google Git`) |
| **2. Chromium (`depot_tools`)** | [`DEPS`](DEPS), [`third_party/chromium/.gclient`](third_party/chromium/.gclient) | `depot gclient`, `depot siso`, `depot gn`, `depot manifests` | Deterministic `gclient` `DEPS` pins (`git_dependencies = 'SYNC'`, `vars`, `deps`, `recursedeps`, `hooks`) derived from `src.lock.json` by `ay manifests` (`--check` gate) |
| **3. Linux Kernel (`7.4+`)** | [`MAINTAINERS`](MAINTAINERS), [`docs/patches/series`](docs/patches/series) | `depot maintainer <path>`, `xtk audit-vcs` | Standard Linux Kernel `MAINTAINERS` (`M:`, `S:`, `T:`, `F:`), 5-remote kernel topology (`origin`, `torvalds`, `stable`, `next`, `gki`), and declarative Quilt/`b4` patch series |
| **4. Android AOSP & GKI** | `third_party/aosp` (when checked out) | `xtk audit-vcs` | audited only; no generated `repo` manifest (pin-001: one pin, `src.lock.json`) |

---

## 2. AI (`packages/ai-os`) & Pure-Rust Sovereign Stack

| Subsystem                                               | Scope & Capabilities                                                                                                                                                                                                                                                                                                                                                                                                                                   | Binaries (`C:\Users\aphro\.local\bin`)                                                              |
| :------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| [`packages/ai-os`](packages/ai-os) | Sole AI product: council over discovered models and agent CLIs (`claude`, `codex`, `agy`), relay (MCP, A2A, ACP), memory, skills; providers and models discovered at run time (`packages/ai-os/README.md`). |
| [`crates/rust-stack`](crates/rust-stack) | 100% Pure-Rust replacements for **Better Auth** (Argon2id, OAuth2.1/PKCE, Ed25519 JWKS, Passkey challenges, SQLite WAL), **shadcn/ui** (`shadcn_rs` compiling 1 Rust AST -> Zero-JS HTML/CSS, Dioxus RSX, and Zed `gpui-component`), **Open WebUI** (`2.71 MB` RAM native WebGPU/SSE workspace), **OpenCode** (5-tool Rust coding loop), and **OpenAI Gateway** (`:4320`, `5.45M ops/s` Blake3 cache)                                                  | `rust-stack.exe` (`4.80 MB` Fat-LTO), `rust_stack_ffi.dll` (`2.08 MB`, `228 ns` Bun FFI), `rsk.cmd` |
| [`infra`](infra)                         | Vercel-style zero-config `git clone -> live deploy` in Go 1.27: daemonless OCI v1.1 image builder, Docker Engine Named-Pipe/SSH client, Cloudflare DNS + R2 S3v4 + Workers, Caddy HTTP/3 Blue/Green across `fr1`/`fr2` + Google-only `usa` egress, OVH, GCP Cloud Run, Vercel v13, Ollama fleet sync, and zero-copy `Rust <-> Bun <-> Go` FFI                                                                                                          | `src-deploy.exe`, `dpl.cmd`, `infra_go.dll`                                                         |

---

## 3. One-Click Reproducible Commands ([`justfile`](justfile))

```powershell
just doctor          # Verify all 17 compiler, VCS, depot_tools, cloud, and AI CLI toolchains (xtk)
just vcs-audit       # Audit all 4 VCS pillars (Git + Chromium DEPS + Kernel MAINTAINERS + AOSP repo)
just arch-check      # Enforce 12-rule domain-purity, zero-npm, zero-emoji & host safety gate (archguard)
just lock            # Lock the checkout in src.lock.json, then derive DEPS + .gitmodules (just manifests-check verifies)
just env-doctor      # Audit masked C:\src\.env vault, NTFS ACLs, and editor auth sync
just rust-stack serve # Launch 4.80 MB Pure-Rust Auth + UI + WebUI + OpenAI Gateway (:4320)
just deploy          # One-click Vercel-style build + OCI + R2 + VPS/Cloud deployment
just verify-all      # Run Bun, Cargo, and Go + 3-way FFI test suites end-to-end
```

## Labs (merged from `C:\labs`, 2026-11-12)

Aphrody Labs (`aphrody-labs/labs`): self-hosted Vercel-like platform; its former `aphrody` binary is now `ay conformance` (V8 JS runtime, Next.js/Tailwind/shadcn compatibility, native renderer). Target architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Path | Content |
|---|---|
| `crates/conformance`, `conformance/` | pinned conformance suites (`upstreams.toml`, `expected/`), CLI `ay conformance` (ex-`crates/aphrody-cli`) |
| `crates/lore*`, `licenses/lore`, `tools/lore` | Lore VCS, absorbed (MIT) |
| `crates/apm` | APM crate |
| `third_party/patches/{quinn-proto,glob-match}` | patched crates (`[patch.crates-io]`) |
| `third_party/oils` | oils fork (aphrody-labs) |
| `third_party/{vendor.lock,chrome-channels.toml,forks.txt}` | pins |
| `tools/labs-scripts` | vendor.sh, absorb-lore.sh, chrome-channels.sh |
| `infra/chromium-factory` | Chromium build factory (fr1) |
| `plugins/labs` | Claude Code plugin `labs` (docs/PLUGIN.md) |

Recipes: `just lab-build`, `just lab-dev`, `just lab-conformance`, `just lab-factory*`.
