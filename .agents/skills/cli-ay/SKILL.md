---
name: cli-ay
description: Use `ay` (ay 0.2.0): Aphrody monorepo CLI
---

# ay 0.2.0

Binary: `ay`. Declared in `tools.toml`; install or update with `ay up ay`.
Generated from the tool manual; do not edit. Regenerate with `just cli-skills`.

Subcommands: `arch`, `doctor`, `lock`, `manifests`, `git`, `ingest`, `graph`, `deploy`, `bench`, `scope`, `gaming`, `upstream`, `linux`, `pkg`, `lfs`, `ssh`, `brand`, `rt`, `gclient`, `fetch`, `vpy`, `cl`, `cipd`, `ninja`. Details: `ay <subcommand> --help`.

## `ay --help`

```text
Aphrody monorepo CLI

Usage: ay <COMMAND>

Commands:
  arch         Architecture gate ARCH-001..017: check, rules, graph
  doctor       Toolchain doctor
  lock         Regenerate src.lock.json, DEPS, .repo manifest and MAINTAINERS
  manifests    Generate governance manifests; `ay manifests verify` checks them
  git          VCS tooling: worktree, fork, slim [--all], clone, gix, forge, audit, depot_tools shims, ...
  ingest       Repository digest for LLM context
  graph        Tree-sitter code graph: `ay graph <path>` builds; build, query, path, explain, mcp
  deploy       aphrody.app: `ay deploy <project>|ls|logs|rollback|promote` (packages/deploy); containers: `...
  bench        Hardware and compiler benchmarks (Windows)
  scope        Gamescope mode (runs the `gamescope-rs` binary)
  gaming       Gaming stack (packages/gaming): status, apps, proton, layers, dx, steamcmd, run, skills
  upstream     Patch stacks of the bun and Chromium forks: status, sync, check, pr, mark, gc, export (packa...
  linux        Linux system layer: patchset versions, sync, patch stacks, kernel builds on fr1 or CI (packa...
  pkg          Package recipes for every distro: list, matrix, gen, build, check (packages/linux, infra/pkg)
  lfs          bun-LFS (third_party/lfs/bun, GitHub CI): build, logs, wsl (runs `just lfs-<sub>`)
  ssh          Pure-Rust SSH (russh): exec <host|all|a,b> -- cmd, cp, hosts, check
  brand        Brand assets (assets/brand): build [--deploy], banner <id>, check-ico (runs `aphrody-brand`)
  rt           Runtimes: Python engines (uv, RustPython), Bun versions, package managers, PyTorch
  gclient      gclient in Rust: revinfo, getdep, setdep, sync (gitoxide), hooks, root
  fetch        Write .gclient for a depot_tools fetch config (chromium, v8, webrtc, ...) and sync it
  vpy          vpython on uv: run Python in a vpython.toml / PEP 723 environment
  cl           git cl on jj and Gerrit REST: upload, status, issue
  cipd         Official CIPD client from depot_tools
  ninja        autoninja logic: n2 or ninja locally, upstream autoninja for Siso output directories
  gn           The checkout's gn binary (buildtools/<platform>/gn)
  auth         Every authentication of the fleet (env-kit): status, repair [--browser], gh-secrets, tunnels...
  secret       OS secret store (DPAPI on Windows, systemd-creds on Linux): info, list, set, exec, pipe, import
  vault        Vault (docs/infra/VAULT.md): init, add, import-chrome-csv, export-chrome-csv, sync, status, ...
  conformance  Conformance suites: [--fetch] [suite...] writes conformance/results/; `channels [platform]` ...
  build        Build the workspace for a cross-compilation preset (--list shows toolchain status)
  sys          Machine profile: OS, firmware/SMBIOS, CPUID, PCI, GPUs, disks, virtualization, toolchains
  up           Install and update the toolchain from tools.toml: --check, --list, --setup
  self-update  Update `ay` itself from the dist GitHub Releases (axoupdater)
  bun          Upstream watch of oven-sh/bun for the fork: watch [--json] [--apply] [--install-schedule], b...
  ai           Inference providers behind LiteLLM (infra/ai/ai.toml): ls, install, service, pull, config, c...
  docs         Bun docs in ay: sync (fork md/mdx, bun.com llms-full.txt, skills), bun <query> [--json], sho...
  flat         Rust crates of the bun fork flattened into crates/bun-flat: list, sync, check
  hash         wyhash (bun's hash) of files or stdin
  time         Run a command N times and print p50/p90/p99 wall time (bun's HdrHistogram)
  chromium     Chromium build chain on fr1: status, sync, gn, build, autoninja, toolchain (delegated over a...
  engines      Engines facade (V8, JavaScriptCore, Dawn, wgpu, browsers): list, matrix, js, path, install, ...
  agents       ai-os orchestrator (packages/ai-os, `orch`): run <workflow.json>, plan "<goal>", lifecycle -...
  steam        Steam data as JSON (crates/steam-depot): root, libraries, apps, vdf, compat, host, env

Options:
  -h, --help     Print help
  -V, --version  Print version

Areas:
  repo       arch, lock, manifests, git, ingest, graph, conformance, brand
  toolchain  up, doctor, sys, build, self-update, rt
  bun        bun (upstream watch), docs (Bun docs index), flat (fork crates in crates/bun-flat), hash, time
  chromium   chromium (fr1 build chain), gclient, fetch, gn, ninja, cipd, cl, vpy, engines (V8, JSC, Dawn, ...
  fleet      ssh, deploy, auth, secret, vault, ai, agents
  measure    bench, time
  gaming     gaming (Steam, Proton, Vulkan, DirectX via packages/gaming), steam (Steam data as JSON)
  gaming     gaming (Steam, Proton, Vulkan, DirectX via packages/gaming), steam (Steam data as JSON)

Every command takes --help; machine output is --json where offered.
Plan: docs/ay/MIGRATION.md; command table: docs/NAMING.md
```
