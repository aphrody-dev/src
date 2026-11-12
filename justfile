# Master Workspace Justfile for the monorepo root
# Cross-platform: POSIX sh on Linux/macOS/WSL2/containers, PowerShell 7 on Windows.
# Paths use forward slashes, which every supported shell and toolchain accepts.
# Every value below can be overridden from the environment or `just var=value <recipe>`.

set shell := ["sh", "-cu"]
set windows-shell := ["pwsh", "-NoLogo", "-NoProfile", "-Command"]
set dotenv-load := false

root := env("SRC_ROOT", justfile_directory())
image := env("SRC_IMAGE", "aphrody/monorepo-dev:local")

# Default recipe: list available commands
default:
    just --list

# Verify all sovereign compiler, VCS, cloud, architecture, and AI CLI toolchains
doctor:
    xtk doctor

# Run deterministic monorepo architecture, domain-purity, boundary & hygiene gate
archguard:
    archguard check --strict --root "{{root}}"

# Check masked .env vault and multi-editor auth wiring
env-doctor:
    bun run --cwd "{{root}}/packages/env-kit" src/cli.ts doctor

# System and depot_tools ecosystem overview
info:
    depot info

# Ingest any codebase (usage: just ingest crates/depot-core, just ingest third_party/chromium)
ingest target="crates/depot-core" format="markdown" max_tokens="20000":
    depot ingest "{{root}}/{{target}}" --format "{{format}}" --max-tokens {{max_tokens}}

# Build AST knowledge graph for any repo into graphify-out/<name> (usage: just graph third_party/bun/src bun)
graph target="crates/depot-core" name="":
    depot graph build "{{root}}/{{target}}" --out-dir "{{root}}/graphify-out/{{ if name == "" { file_name(target) } else { name } }}"

# Query AST graph symbols across codebases
graph-query term target="crates/depot-core":
    depot graph query "{{term}}" "{{root}}/{{target}}"

# Optimize repository with Git Scalar / blobless optimizations
slim target="crates/depot-core":
    depot slim "{{root}}/{{target}}"

# List active worktrees for a repo
worktrees target="crates/depot-core":
    depot worktree list "{{root}}/{{target}}"

# Verify content-addressed Blake3 binary artifacts
artifacts-verify:
    depot artifacts verify "{{root}}/crates/depot-core/depot-artifacts.toml"

# Build all depot release binaries
build-depot:
    just -f "{{root}}/crates/depot-core/justfile" build

# Reinstall depot shims into third_party/depot_tools
install-shims:
    just -f "{{root}}/crates/depot-core/justfile" install-shims

# Byte-level Git and Scalar optimization across all repos
slim-all:
    xtk slim-all

# Generate deterministic src.lock.json + Chromium DEPS + AOSP default.xml + Kernel MAINTAINERS
lock:
    xtk lock

# Synchronize governance manifests (DEPS, .repo/manifests/default.xml, MAINTAINERS, docs/patches/series)
manifests:
    xtk manifests

# Run full 4-pillar VCS governance audit (Git + Chromium + Kernel + AOSP)
vcs-audit:
    xtk audit-vcs
    depot manifests
    frg pillars

# Run architecture gate without --strict
arch-check:
    archguard check --root "{{root}}"

# Lookup Linux Kernel style MAINTAINERS ownership for a path (usage: just maintainer third_party/linux/Makefile)
maintainer target="third_party/linux":
    depot maintainer "{{target}}"

# Run Sovereign Local Forge CLI (usage: just forge status, just forge slim)
forge cmd="status":
    frg {{cmd}}

# Launch Sovereign Local Forge web dashboard
serve-forge port="4000":
    frg serve --port {{port}}

# Run Vercel & Vercel-Labs submodule sync and benchmark arena
labs cmd="bench":
    bun run --cwd "{{root}}/third_party/labs" src/cli.ts {{cmd}}

# Run Unified AI Control Plane & Real-Time Standards Sentinel
ai-os cmd="watch":
    bun run --cwd "{{root}}/packages/ai-os" src/cli.ts {{cmd}}

# Run Pi + OpenCode + Locally Uncensored + Symphony/Ralph harness
pi-opencode cmd="tui":
    bun run --cwd "{{root}}/packages/pi-opencode" src/cli.ts {{cmd}}

# Run Codex + AGY + Claude Cross-Auth & Cross-CLI Hub (doctor, tui, serve, sync-configs, council)
triad cmd="doctor":
    bun run --cwd "{{root}}/packages/ai-triad" src/cli.ts {{cmd}}

# Run Pure-Rust Sovereign Stack
rust-stack cmd="serve":
    rust-stack {{cmd}}

# One-click self-hosted & multi-cloud deploy (git clone -> live production)
deploy target="--all" flags="--dry-run":
    src-deploy up {{target}} {{flags}}

# Generate production HTTP/3 Caddyfile & systemd fleet manifests
deploy-plan:
    src-deploy plan --all
    src-deploy caddyfile

# Format entire Bun workspace
fmt:
    bun fmt

# Run architecture gate, toolchain doctor, and Bun + Cargo + Go suites
verify-all:
    archguard check --strict --root "{{root}}"
    xtk doctor
    bun test "{{root}}/packages/env-kit" "{{root}}/packages/pi-opencode" "{{root}}/packages/ai-triad"
    bun test "{{root}}/.agents/scripts/pre-tool-guard.test.ts"
    cargo test --manifest-path "{{root}}/crates/rust-stack/Cargo.toml"
    cargo test --workspace --manifest-path "{{root}}/Cargo.toml"
    go -C "{{root}}/infra" test ./...

# Build all container images (Arch dev + Alpine runtime); versions come from build args, see compose.yaml
docker-build:
    docker compose -f "{{root}}/compose.yaml" build

# Arch Linux workstation shell with the monorepo mounted at /src
docker-shell:
    docker compose -f "{{root}}/compose.yaml" run --rm dev

# Alpine runtime shell (first-party CLIs + Bun only)
docker-runtime:
    docker compose -f "{{root}}/compose.yaml" run --rm runtime

# Run any recipe inside the Arch dev container (usage: just docker-run verify-all)
docker-run recipe="verify-all":
    docker compose -f "{{root}}/compose.yaml" run --rm dev just {{recipe}}

# Nix alternative to containers: dev shell from flake.nix
nix-shell:
    nix develop "{{root}}"

# Refresh the local offline docs mirrors (Docker, Kubernetes, Nix, Arch/Alpine images)
docs-sync:
    git -C "{{root}}/third_party/docs-ecosystem/docker-docs" pull --depth 1
    git -C "{{root}}/third_party/docs-ecosystem/kubernetes-website" pull --depth 1
    git -C "{{root}}/third_party/docs-ecosystem/nix-dev" pull --depth 1
    git -C "{{root}}/third_party/docs-ecosystem/archlinux-docker" pull --depth 1
    git -C "{{root}}/third_party/docs-ecosystem/docker-alpine" pull --depth 1
