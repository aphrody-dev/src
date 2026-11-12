# Sovereign Monorepo (`C:\src`) — Architecture & Operating Topology (Late 2026)

Engineered around the foundational standards of **Linus Torvalds** (`Linux`, `Git`, POSIX/GNU clean flat hierarchy, sacred `C:\Windows\System32` userspace integrity, strict C-ABI boundaries), **Jarred Sumner** (`oven-sh/bun` v1.4.4 100% Full-Rust runtime, `bun fmt`, `bun check`, `bun:sqlite`, `bun:ffi`, AOT `--compile`), **Chromium `depot_tools`** (strict `third_party/` vendor isolation + `src.lock.json`), and **Larry Page** (instant sub-100ms `www.google.com` visual clarity, autonomous NHITL execution, and Vercel-style 1-click self-hosted + multi-cloud deployment).

---

## 1. Canonical Directory Hierarchy (`C:\src`)

| Top-Level Directory                                 | Role & Architectural Discipline                                              | Key Subsystems                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| :-------------------------------------------------- | :--------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`C:\src\apps\`](file:///C:/src/apps)               | Production Web, Streaming & Desktop Platforms                                | [`aphrody`](file:///C:/src/apps/aphrody) (`aphrody.com`), [`shenron`](file:///C:/src/apps/shenron) (`dragonballfr.com`), [`rosegriffon`](file:///C:/src/apps/rosegriffon) (`rosegriffon.fr`)                                                                                                                                                                                                                                                                                                             |
| [`C:\src\packages\`](file:///C:/src/packages)       | First-Party Bun v1.4.4 Full-Rust Workspace Packages                          | [`ai-triad`](file:///C:/src/packages/ai-triad), [`ai-os`](file:///C:/src/packages/ai-os), [`pi-opencode`](file:///C:/src/packages/pi-opencode), [`env-kit`](file:///C:/src/packages/env-kit), [`google-design`](file:///C:/src/packages/google-design), [`wck`](file:///C:/src/packages/wck), [`bun-parity`](file:///C:/src/packages/bun-parity), [`forge`](file:///C:/src/packages/forge), [`bun-plugins`](file:///C:/src/packages/bun-plugins), [`chromium-bun`](file:///C:/src/packages/chromium-bun) |
| [`C:\src\crates\`](file:///C:/src/crates)           | First-Party Rust 2024 Systems, Kernel & FFI Crates                           | [`rust-stack`](file:///C:/src/crates/rust-stack), [`ring3-agent`](file:///C:/src/crates/ring3-agent), [`depot`](file:///C:/src/crates/depot), [`xtask`](file:///C:/src/crates/xtask), [`wayland`](file:///C:/src/crates/wayland), [`gamescope-rs`](file:///C:/src/crates/gamescope-rs), [`unix`](file:///C:/src/crates/unix), [`bench`](file:///C:/src/crates/bench)                                                                                                                                     |
| [`C:\src\infra\`](file:///C:/src/infra)             | Go 1.27 One-Click Self-Hosted & Multi-Cloud Deploy Engine + Three-Way FFI    | [`cmd/src-deploy`](file:///C:/src/infra/cmd/src-deploy/main.go), [`cshared`](file:///C:/src/infra/cshared/infra_go.go) (`infra_go.dll`), [`ffi-bridge`](file:///C:/src/infra/ffi-bridge/index.ts), [`mesh-vn`](file:///C:/src/infra/mesh-vn), [`generated/Caddyfile`](file:///C:/src/infra/generated/Caddyfile)                                                                                                                                                                                          |
| [`C:\src\third_party\`](file:///C:/src/third_party) | Unified 4-Pillar Upstream Vendor Tree (`133` locked repos) | [`linux`](file:///C:/src/third_party/linux) (`torvalds`/`stable`/`next`/`gki`), [`chromium`](file:///C:/src/third_party/chromium), [`aosp`](file:///C:/src/third_party/aosp) (`platform/manifest` + `build/kleaf`), [`bun`](file:///C:/src/third_party/bun), [`depot_tools`](file:///C:/src/third_party/depot_tools), [`archlinux`](file:///C:/src/third_party/archlinux), [`cachyos`](file:///C:/src/third_party/cachyos), [`omacom`](file:///C:/src/third_party/omacom) |
| [`C:\src\tools\`](file:///C:/src/tools)             | Reproducible Monorepo Architecture & Boundary Auditors                       | [`archguard`](file:///C:/src/tools/archguard) (12-rule domain-purity, zero-npm, zero-emoji & host safety gate)                                                                                                                                                                                                                                                                                                                                                                        |
| [`C:\src\docs\`](file:///C:/src/docs)               | Deep-Think Architectural Specifications, Kernel MDX & Patch Series           | [`MONOREPO_ATLAS.md`](file:///C:/src/docs/MONOREPO_ATLAS.md), [`linux-kernel-story`](file:///C:/src/docs/linux-kernel-story), [`patches/series`](file:///C:/src/docs/patches/series)                                                                                                                                                                                                                                                                                                  |

---

## 1b. Unified 4-Pillar VCS Governance (`Git + Chromium + Kernel + AOSP`)

| Pillar | Root Manifest | Orchestrators & Commands | Scope |
| :--- | :--- | :--- | :--- |
| **1. Git Superproject** | [`.gitmodules`](file:///C:/src/.gitmodules), [`.gitattributes`](file:///C:/src/.gitattributes), [`src.lock.json`](file:///C:/src/src.lock.json) | `xtk lock`, `xtk slim-all`, `frg status`, `frg remotes` | 25 first-party submodules + Git Scalar (`protocol.version=2`, `core.fsmonitor`, `index.version=4`, `commit-graph`, `multi-pack-index`) + Tri-Forge (`GitHub`, `GitLab`, `Google Git`) |
| **2. Chromium (`depot_tools`)** | [`DEPS`](file:///C:/src/DEPS), [`third_party/chromium/.gclient`](file:///C:/src/third_party/chromium/.gclient) | `depot gclient`, `depot siso`, `depot gn`, `depot manifests` | Deterministic `gclient` `DEPS` pins (`git_dependencies = 'SYNC'`, `vars`, `deps`, `recursedeps`, `hooks`) generated directly from `src.lock.json` |
| **3. Linux Kernel (`7.4+`)** | [`MAINTAINERS`](file:///C:/src/MAINTAINERS), [`docs/patches/series`](file:///C:/src/docs/patches/series) | `depot maintainer <path>`, `xtk audit-vcs` | Standard Linux Kernel `MAINTAINERS` (`M:`, `S:`, `T:`, `F:`), 5-remote kernel topology (`origin`, `torvalds`, `stable`, `next`, `gki`), and declarative Quilt/`b4` patch series |
| **4. Android AOSP & GKI** | [`.repo/manifests/default.xml`](file:///C:/src/.repo/manifests/default.xml) | `depot repo`, `xtk manifests`, `frg pillars` | Google `repo` XML manifest pinning `android.googlesource.com` (`platform/manifest`, `kernel/build` Kleaf), `chromium.googlesource.com`, `git.kernel.org`, and `aphrody-dev` |

---

## 2. Cross-AI Triad (`Codex + AGY + Claude`) & Pure-Rust Sovereign Stack

| Subsystem                                               | Scope & Capabilities                                                                                                                                                                                                                                                                                                                                                                                                                                   | Binaries (`C:\Users\aphro\.local\bin`)                                                              |
| :------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------- |
| [`packages/ai-triad`](file:///C:/src/packages/ai-triad) | Bidirectional integration of **OpenAI Codex** (`codex 0.162.0`), **Google Antigravity** (`agy 1.5.5` + `gemini 0.66.0`), and **Claude Code** (`claude 2.1.318`), plus `OpenCode`, `Pi`, and `Zed`. Includes full live `--help` corpus, OAuth 2.1 PKCE + Device Grant broker, MCP `2025-03-26` cross-calling, OpenAI `/v1/chat/completions` + `/v1/responses` + Anthropic `/v1/messages` proxy (`:4319`), Council consensus runner, and CI/CD templates | `triad.exe`, `triad.cmd`, `codex.cmd`, `agy.cmd`, `claude.exe`                                      |
| [`crates/rust-stack`](file:///C:/src/crates/rust-stack) | 100% Pure-Rust replacements for **Better Auth** (Argon2id, OAuth2.1/PKCE, Ed25519 JWKS, Passkey challenges, SQLite WAL), **shadcn/ui** (`shadcn_rs` compiling 1 Rust AST -> Zero-JS HTML/CSS, Dioxus RSX, and Zed `gpui-component`), **Open WebUI** (`2.71 MB` RAM native WebGPU/SSE workspace), **OpenCode** (5-tool Rust coding loop), and **OpenAI Gateway** (`:4320`, `5.45M ops/s` Blake3 cache)                                                  | `rust-stack.exe` (`4.80 MB` Fat-LTO), `rust_stack_ffi.dll` (`2.08 MB`, `228 ns` Bun FFI), `rsk.cmd` |
| [`infra`](file:///C:/src/infra)                         | Vercel-style zero-config `git clone -> live deploy` in Go 1.27: daemonless OCI v1.1 image builder, Docker Engine Named-Pipe/SSH client, Cloudflare DNS + R2 S3v4 + Workers, Caddy HTTP/3 Blue/Green across `fr1`/`fr2` + Google-only `usa` egress, OVH, GCP Cloud Run, Vercel v13, Ollama fleet sync, and zero-copy `Rust <-> Bun <-> Go` FFI                                                                                                          | `src-deploy.exe`, `dpl.cmd`, `infra_go.dll`                                                         |

---

## 3. One-Click Reproducible Commands ([`justfile`](file:///C:/src/justfile))

```powershell
just doctor          # Verify all 17 compiler, VCS, depot_tools, cloud, and AI CLI toolchains (xtk)
just vcs-audit       # Audit all 4 VCS pillars (Git + Chromium DEPS + Kernel MAINTAINERS + AOSP repo)
just arch-check      # Enforce 12-rule domain-purity, zero-npm, zero-emoji & host safety gate (archguard)
just lock            # Regenerate C:\src\src.lock.json + DEPS + .repo/manifests/default.xml + MAINTAINERS
just env-doctor      # Audit masked C:\src\.env vault, NTFS ACLs, and editor auth sync
just triad doctor    # Verify Codex, AGY, Claude, Gemini, Cross-Auth, and MCP wiring
just rust-stack serve # Launch 4.80 MB Pure-Rust Auth + UI + WebUI + OpenAI Gateway (:4320)
just deploy          # One-click Vercel-style build + OCI + R2 + VPS/Cloud deployment
just verify-all      # Run Bun, Cargo, and Go + 3-way FFI test suites end-to-end
```

## Labs (merged from `C:\labs`, 2026-11-12)

Aphrody Labs (`aphrody-labs/labs`): self-hosted Vercel-like platform and `aphrody` single binary (V8 JS runtime, Next.js/Tailwind/shadcn compatibility, native renderer). Target architecture: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Path | Content |
|---|---|
| `crates/aphrody-cli` | package `aphrody-labs-cli`, binary `aphrody` (labs `crates/cli`; becomes `ay` subcommands later) |
| `crates/conformance`, `conformance/` | pinned conformance suites (`upstreams.toml`, `expected/`) |
| `crates/lore*`, `licenses/lore`, `tools/lore` | Lore VCS, absorbed (MIT) |
| `crates/apm` | APM crate |
| `third_party/patches/{quinn-proto,glob-match}` | patched crates (`[patch.crates-io]`) |
| `third_party/oils` | oils fork (aphrody-labs) |
| `third_party/{vendor.lock,chrome-channels.toml,forks.txt}` | pins |
| `tools/labs-scripts` | vendor.sh, absorb-lore.sh, chrome-channels.sh |
| `infra/chromium-factory` | Chromium build factory (fr1) |
| `plugins/labs` | Claude Code plugin `labs` (docs/PLUGIN.md) |

Recipes: `just lab-build`, `just lab-dev`, `just lab-conformance`, `just lab-factory*`.
