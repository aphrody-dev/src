# Master Workspace Justfile for C:\src
# Anchored on Linux Kernel, Git, GNU/POSIX, Chromium depot_tools, Bun v1.4.4 Workspaces, Cargo, and Go 1.27
set shell := ["powershell", "-NoProfile", "-Command"]

# Default recipe: list available commands
default:
    just --list

# Verify all 17 sovereign compiler, VCS, cloud, architecture, and AI CLI toolchains
doctor:
    xtk doctor

# Run deterministic monorepo architecture, domain-purity, boundary & hygiene gate
archguard:
    archguard check --strict --root "C:\src"

# Check masked C:\src\.env vault, NTFS ACLs, and multi-editor auth wiring
env-doctor:
    bun run --cwd "C:\src\packages\env-kit" src/cli.ts doctor

# System and depot_tools ecosystem overview
info:
    depot info

# Ingest any codebase under C:\src (usage: just ingest crates/depot, just ingest third_party/chromium)
ingest target="crates/depot" format="markdown" max_tokens="20000":
    depot ingest "C:\src\{{target}}" --format "{{format}}" --max-tokens {{max_tokens}}

# Build AST knowledge graph for any repo (usage: just graph crates/depot)
graph target="crates/depot":
    depot graph build "C:\src\{{target}}" --out-dir "C:\src\{{target}}\graphify-out"

# Query AST graph symbols across codebases
graph-query term target="crates/depot":
    depot graph query "{{term}}" "C:\src\{{target}}"

# Optimize repository with Git Scalar / blobless optimizations
slim target="crates/depot":
    depot slim "C:\src\{{target}}"

# List active worktrees for a repo
worktrees target="crates/depot":
    depot worktree list "C:\src\{{target}}"

# Verify content-addressed Blake3 binary artifacts
artifacts-verify:
    depot artifacts verify "C:\src\crates\depot\depot-artifacts.toml"

# Build all depot release binaries
build-depot:
    just -f "C:\src\crates\depot\justfile" build

# Reinstall depot shims into C:\src\third_party\depot_tools
install-shims:
    just -f "C:\src\crates\depot\justfile" install-shims

# Byte-level Git and Scalar optimization across all C:\src repos
slim-all:
    xtk slim-all

# Generate deterministic C:\src\src.lock.json + Chromium DEPS + AOSP default.xml + Kernel MAINTAINERS
lock:
    xtk lock

# Synchronize 4-pillar governance manifests (DEPS, .repo/manifests/default.xml, MAINTAINERS, docs/patches/series)
manifests:
    xtk manifests

# Run full 4-pillar VCS governance audit (Git + Chromium + Kernel + AOSP + NTFS junctions)
vcs-audit:
    xtk audit-vcs
    depot manifests
    frg pillars

# Run Sovereign Monorepo Architecture & Domain-Purity Gate
arch-check:
    archguard check

# Lookup Linux Kernel style MAINTAINERS ownership for a path (usage: just maintainer third_party/linux/Makefile)
maintainer target="third_party/linux":
    depot maintainer "{{target}}"

# Run Sovereign Local Forge CLI (usage: just forge status, just forge slim)
forge cmd="status":
    frg {{cmd}}

# Launch Sovereign Local Forge web dashboard on port 4000
serve-forge port="4000":
    frg serve --port {{port}}

# Run Vercel & Vercel-Labs submodule sync and head-to-head benchmark arena
labs cmd="bench":
    bun run --cwd "C:\src\third_party\labs" src/cli.ts {{cmd}}

# Run Unified AI Control Plane & Real-Time Standards Sentinel
ai-os cmd="watch":
    bun run --cwd "C:\src\packages\ai-os" src/cli.ts {{cmd}}

# Run Minimalist Pi + OpenCode + Locally Uncensored + Symphony/Ralph harness
pi-opencode cmd="tui":
    bun run --cwd "C:\src\packages\pi-opencode" src/cli.ts {{cmd}}

# Run Unified Codex + AGY + Claude Cross-Auth & Cross-CLI Hub (doctor, tui, serve, sync-configs, council)
triad cmd="doctor":
    bun run --cwd "C:\src\packages\ai-triad" src/cli.ts {{cmd}}

# Run Pure-Rust Sovereign Stack (Better-Auth + shadcn-rs + Open-WebUI + OpenCode + OpenAI Gateway)
rust-stack cmd="serve":
    rust-stack {{cmd}}

# One-Click Vercel-Style Self-Hosted & Multi-Cloud Deploy (git clone -> live production)
deploy target="--all" flags="--dry-run":
    src-deploy up {{target}} {{flags}}

# Generate production HTTP/3 Caddyfile & systemd fleet manifests for fr1, fr2, usa
deploy-plan:
    src-deploy plan --all
    src-deploy caddyfile

# Format entire Bun v1.4.4 workspace
fmt:
    bun fmt

# Run three-way Rust <-> Bun <-> Go FFI, architecture gate & workspace verification tests
verify-all:
    archguard check --strict --root "C:\src"
    xtk doctor
    bun test "C:\src\packages\env-kit" "C:\src\packages\pi-opencode" "C:\src\packages\ai-triad"
    cargo test --manifest-path "C:\src\crates\rust-stack\Cargo.toml"
    Push-Location "C:\src\infra"; go test ./...; Pop-Location
