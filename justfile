# Master Workspace Justfile for the monorepo root
# Cross-platform: POSIX sh on Linux/macOS/WSL2/containers, niubash (native Rust bash, no MSYS) on Windows.
# Paths use forward slashes, which every supported shell and toolchain accepts.
# Every value below can be overridden from the environment or `just var=value <recipe>`.
# Windows shell: niubash 1.5.0 (configuration/shell.dsc.winget); `just doctor` output identical to pwsh (2026-11-12).

set shell := ["sh", "-cu"]
set windows-shell := ["niu", "-cu"]
set dotenv-load := false

root := env("SRC_ROOT", justfile_directory())
image := env("SRC_IMAGE", "aphrody/monorepo-dev:local")

# Default recipe: list available commands
default:
    just --list

# Verify all sovereign compiler, VCS, cloud, architecture, and AI CLI toolchains
doctor:
    ay doctor

# Run deterministic monorepo architecture, domain-purity, boundary & hygiene gate
archguard:
    ay arch check --strict --root "{{root}}"

# Check masked .env vault and multi-editor auth wiring
env-doctor:
    bun run --cwd "{{root}}/packages/env-kit" src/cli.ts doctor

# System and depot_tools ecosystem overview
info:
    ay git info

# Ingest any codebase (usage: just ingest crates/depot-core, just ingest third_party/chromium)
ingest target="crates/depot-core" format="markdown" max_tokens="20000":
    ay ingest "{{root}}/{{target}}" --format "{{format}}" --max-tokens {{max_tokens}}

# Build AST knowledge graph for any repo into graphify-out/<name> (usage: just graph third_party/bun/src bun)
graph target="crates/depot-core" name="":
    ay graph build "{{root}}/{{target}}" --out-dir "{{root}}/graphify-out/{{ if name == "" { file_name(target) } else { name } }}"

# Query AST graph symbols across codebases
graph-query term target="crates/depot-core":
    ay graph query "{{term}}" "{{root}}/{{target}}"

# Optimize repository with Git Scalar / blobless optimizations
slim target="crates/depot-core":
    ay git slim "{{root}}/{{target}}"

# List active worktrees for a repo
worktrees target="crates/depot-core":
    ay git worktree list "{{root}}/{{target}}"

# Verify content-addressed Blake3 binary artifacts against a manifest (usage: just artifacts-verify path/to/depot-artifacts.toml)
artifacts-verify manifest="depot-artifacts.toml":
    ay git artifacts verify "{{manifest}}"

# Build the workspace for a cross-compilation preset (usage: just build target=wasm32, just build linux-musl; `ay build --list` shows presets and missing toolchains)
build target="":
    ay build {{ if trim_start_match(target, "target=") == "" { "" } else { "--target " + trim_start_match(target, "target=") } }}

# Build the ay CLI (fat LTO release) and install it into ~/.local/bin
install-ay:
    cargo install --path "{{root}}/crates/ay" --root "{{home_directory()}}/.local" --force --locked --no-track

# Byte-level Git and Scalar optimization across all repos
slim-all:
    ay git slim --all --root "{{root}}"

# Generate deterministic src.lock.json + Chromium DEPS + AOSP default.xml + Kernel MAINTAINERS
lock:
    ay lock --root "{{root}}" --out "{{root}}/src.lock.json"

# Synchronize governance manifests (DEPS, .repo/manifests/default.xml, MAINTAINERS, docs/patches/series)
manifests:
    ay manifests --root "{{root}}"

# Run full 4-pillar VCS governance audit (Git + Chromium + Kernel + AOSP)
vcs-audit:
    ay git audit --root "{{root}}"
    ay manifests verify "{{root}}"
    frg pillars

# Run architecture gate without --strict
arch-check:
    ay arch check --root "{{root}}"

# Lookup Linux Kernel style MAINTAINERS ownership for a path (usage: just maintainer third_party/linux/Makefile)
maintainer target="third_party/linux":
    ay git maintainer "{{target}}" --root "{{root}}"

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
    ay deploy up {{target}} {{flags}}

# Generate production HTTP/3 Caddyfile & systemd fleet manifests
deploy-plan:
    ay deploy plan --all
    ay deploy caddyfile

# Headless Claude Code, no human in the loop (JSON result on stdout)
agent prompt turns="100":
    claude -p "{{prompt}}" --permission-mode bypassPermissions --output-format json --max-turns {{turns}}

# Same, on the fr1 build runner through GitHub Actions (.github/workflows/claude.yml)
agent-ci prompt:
    gh workflow run claude.yml -R aphrody-dev/src -f prompt="{{prompt}}"

# Format entire Bun workspace
fmt:
    bun fmt

# Run architecture gate, toolchain doctor, and Bun + Cargo + Go suites
verify-all:
    ay arch check --strict --root "{{root}}"
    ay doctor
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
    git -C "{{root}}/third_party/docker-docs" pull --depth 1
    git -C "{{root}}/third_party/kubernetes-website" pull --depth 1
    git -C "{{root}}/third_party/nix-dev" pull --depth 1
    git -C "{{root}}/third_party/archlinux-docker" pull --depth 1
    git -C "{{root}}/third_party/docker-alpine" pull --depth 1

# Index src (+ third_party/vendor with --all) via @aphrody/core into var/index/core.db
index *args:
    bun packages/core/src/cli.ts index "{{root}}" {{args}}

# Generate skills + docs/reference from the index
index-gen:
    bun packages/core/src/cli.ts gen "{{root}}"

# Regenerate the core C header (cbindgen)
core-header:
    cbindgen --config crates/core-capi/cbindgen.toml crates/core-capi -o crates/core-capi/include/aphrody_core.h
# --- Labs (merged from C:\labs): aphrody CLI, Lore, Chromium factory ---

# Aphrody CLI + conformance harness build.
lab-build:
    cargo build -p aphrody-labs-cli -p aphrody-conformance

# Distribution build of the aphrody binary: fat LTO, 1 CGU, stripped.
lab-dist:
    cargo build --release -p aphrody-labs-cli

# Fast local optimized build with debug assertions.
lab-iter:
    cargo build --profile iteration -p aphrody-labs-cli

# Run the aphrody CLI.
lab-dev *args:
    cargo run -p aphrody-labs-cli -- {{args}}

# Conformance suites (writes conformance/results/).
lab-conformance *suites:
    cargo run -p aphrody-labs-cli -- x conformance --fetch {{suites}}

# Refresh Chrome Stable/Beta/Dev/Canary pins (native: aphrody x channels).
lab-channels:
    cargo run -q -p aphrody-labs-cli -- x channels

# Re-absorb Lore from aphrody-labs/lore.
lab-lore-sync:
    sh tools/labs-scripts/absorb-lore.sh

# Deploy the Lore server binary to prd (systemd unit loreserver).
lab-deploy-loreserver:
    cargo build --release -p lore-server --target x86_64-unknown-linux-gnu
    scp target/x86_64-unknown-linux-gnu/release/loreserver prd:/opt/lore/bin/loreserver.new
    ssh prd 'mv /opt/lore/bin/loreserver.new /opt/lore/bin/loreserver && systemctl restart loreserver && sleep 3 && curl -fsS -o /dev/null -w "health %{http_code}\n" http://10.200.77.5:41339/health_check'

# Deploy Chromium factory scripts, args and units to fr1.
lab-factory-deploy:
    ssh vps 'mkdir -p /srv/chromium/factory/scripts /srv/chromium/factory/third_party /srv/chromium/factory/args'
    scp -q infra/chromium-factory/chromium-factory.sh infra/chromium-factory/cros-factory.sh vps:/srv/chromium/factory/
    scp -q infra/chromium-factory/args/*.gn vps:/srv/chromium/factory/args/
    scp -q tools/labs-scripts/chrome-channels.sh vps:/srv/chromium/factory/scripts/
    scp -q third_party/chrome-channels.toml vps:/srv/chromium/factory/third_party/
    scp -q infra/chromium-factory/systemd/chromium-factory.* vps:/tmp/
    ssh vps 'sudo mv /tmp/chromium-factory.service /tmp/chromium-factory.timer /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable chromium-factory.timer'

# Run a factory step on fr1 as a managed unit: sync | build | publish | all.
lab-factory step="all" channel="stable":
    ssh vps 'sudo systemd-run --unit=chromium-factory-{{step}} --uid=ubuntu --gid=ubuntu -p Nice=10 -p WorkingDirectory=/srv/chromium -E HOME=/home/ubuntu /srv/chromium/factory/chromium-factory.sh {{step}} {{channel}}'

# Factory status and last log lines.
lab-factory-status:
    ssh vps 'systemctl list-units "chromium-factory*" --all --no-pager; journalctl -u "chromium-factory*" -n 15 --no-pager; df -h /srv | tail -1'

# Download the latest published labs_agent build from R2.
lab-factory-fetch version:
    rclone copyto r2-chromium:aphrody-chromium/labs_agent/{{version}}/linux-x64.tar.zst target/labs_agent-{{version}}-linux-x64.tar.zst

# Smallest aphrody binary: profile min + rebuilt std with immediate-abort.
lab-min:
    cargo build --profile min -p aphrody-labs-cli -Zbuild-std=std,panic_abort --target x86_64-pc-windows-msvc

# Layered dependency gate (Chromium checkdeps analogue): DEPS.rules per directory, see docs/ARCHITECTURE.md
checkdeps *flags:
    bun "{{root}}/scripts/checkdeps.ts" --root "{{root}}" {{flags}}

# Units changed since ref plus transitive dependents (task graph filter, turbo `--filter=...[ref]` analogue)
affected ref="origin/main":
    bun "{{root}}/scripts/checkdeps.ts" --root "{{root}}" --affected "{{ref}}"

# Test only affected units: cargo -p for crates, bun test for packages. Cargo cache: local sccache (R2 remote cache: TICKET taskgraph-001)
test-affected ref="origin/main":
    #!/usr/bin/env sh
    set -eu
    out=$(bun "{{root}}/scripts/checkdeps.ts" --root "{{root}}" --affected "{{ref}}")
    pkgs=$(printf '%s\n' "$out" | awk -F'\t' '$1=="cargo" && $3 ~ /^crates\// {printf "-p %s ", $2}')
    bunp=$(printf '%s\n' "$out" | awk -F'\t' '$1=="bun" && $3 ~ /^packages\// {printf "%s/%s ", "{{root}}", $3}')
    [ -z "$pkgs" ] || cargo test $pkgs
    [ -z "$bunp" ] || bun test $bunp

# Pre-push gate: format, layered deps, architecture rules
check:
    bun fmt --check
    just checkdeps
    ay arch check --root "{{root}}"
