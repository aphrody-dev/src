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

# Chaîne unixwin (niubash, rubash, WinuxCmd) : recettes unixwin-*
import "scripts/unixwin/unixwin.just"

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

# Browser, automation and crawl engines (packages/chromium-bun/src/engines): idempotent install, Windows and Linux
# (usage: just browsers, just browsers chrome@beta lightpanda; other subcommands: bun run --cwd packages/chromium-bun src/cli.ts engines)
browsers *ids:
    bun run --cwd "{{root}}/packages/chromium-bun" src/cli.ts engines install {{ids}}

# Byte-level Git and Scalar optimization across all repos
slim-all:
    ay git slim --all --root "{{root}}"

# Lock every repository of the checkout in src.lock.json (pin-001), then derive DEPS and .gitmodules
lock:
    ay lock --root "{{root}}" --out "{{root}}/src.lock.json"

# Supply-chain policy gate (docs/deps/POLICY.md): manifests, locks, catalog, containers, tools.toml
deps *flags:
    ay doctor --deps --root "{{root}}" {{flags}}

# Refresh Cargo.lock, bun.lock and uv.lock without upgrading (--hoist moves inline crate requirements to the workspace)
deps-lock *flags:
    ay lock --deps --root "{{root}}" {{flags}}

# Upgrade within declared requirements, report Cargo duplicates before/after (--breaking: majors too); then run on prd
deps-bump *flags:
    ay lock --deps --bump --root "{{root}}" {{flags}}

# Derive DEPS, .gitmodules and patch series from src.lock.json (pin-001)
manifests:
    ay manifests --root "{{root}}"

# Gate: derived manifests and gitlinks match src.lock.json
manifests-check:
    ay manifests --check --root "{{root}}"

# identity.toml gate / rewrite / lookup (check | apply | get <key>)
identity cmd="check" *args:
    bun "{{root}}/scripts/identity.ts" {{cmd}} {{args}} --root "{{root}}"

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

# @aphrody/ai-os CLI: agent (init, run, tui, gateway, research, ...) or relay (`just ai-os relay serve`)
ai-os *args:
    bun run --cwd "{{root}}/packages/ai-os" src/cli.ts {{args}}

# @aphrody/ai-os tests (inside the package, never `bun test` from the root)
ai-os-test:
    bun --cwd "{{root}}/packages/ai-os" test

# ai-os orchestrator (packages/ai-os/docs/ORCHESTRATOR.md): hosts, engines, health, run <workflow.json>, plan "<goal>", design, market
orch *args:
    bun run --cwd "{{root}}/packages/ai-os" src/cli.ts orch {{args}}

# Unattended lifecycle: code, fmt, check, tests, judges, fix, docker on prd, deploy (dry-run unless --apply), monitor, optimize
lifecycle *args:
    bun run --cwd "{{root}}/packages/ai-os" src/cli.ts orch lifecycle {{args}}

# Windows service AphrodyRelay (elevated): exe = published artefact relay-service of .github/workflows/ai-os.yml
[windows]
relay-install exe:
    pwsh -NoProfile -File "{{root}}/packages/ai-os/native/relay-windows/install.ps1" -ServiceExe "{{exe}}"

# Linux user unit of the relay (prd and Linux hosts; source in infra/fleet/prd/systemd)
[unix]
relay-install:
    install -Dm644 "{{root}}/infra/fleet/prd/systemd/aphrody-relay.service" "$HOME/.config/systemd/user/aphrody-relay.service"
    systemctl --user daemon-reload
    systemctl --user enable --now aphrody-relay
    systemctl --user restart aphrody-relay

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
    gh workflow run claude.yml -f prompt="{{prompt}}"

# Format entire Bun workspace
fmt:
    bun fmt

# Run architecture gate, toolchain doctor, and Bun + Cargo + Go suites
verify-all:
    ay arch check --strict --root "{{root}}"
    ay doctor
    bun test "{{root}}/packages/env-kit" "{{root}}/packages/pi-opencode" "{{root}}/packages/ai-triad"
    bun test "{{root}}/.agents/scripts/pre-tool-guard.test.ts"
    bun --cwd "{{root}}/packages/ai-os" test
    cargo test --manifest-path "{{root}}/crates/rust-stack/Cargo.toml"
    cargo test --workspace --manifest-path "{{root}}/Cargo.toml"
    go -C "{{root}}/infra" test ./...

# --- Containers (infra/docker: Dockerfile, docker-bake.hcl, compose.yaml; docs/infra/DEPLOY.md) ---
# The PC has no local engine (no WSL): `docker context use prd` sends every docker command to prd over ssh.
docker := if os() == "windows" { "docker.exe" } else { "docker" }
docker_tag := env("SRC_TAG", `git rev-parse --short=12 HEAD`)
docker_compose := docker + " compose -f " + root + "/infra/docker/compose.yaml"

# Build + push src images (amd64+arm64) to ghcr.io/aphrody-dev on the prd engine (usage: just docker-build, just docker-build bun)
docker-build targets="default":
    {{docker}} buildx inspect aphrody >/dev/null 2>&1 || {{docker}} buildx create --name aphrody --driver docker-container --bootstrap
    cd "{{root}}" && TAG={{docker_tag}} {{docker}} buildx bake --builder aphrody -f infra/docker/docker-bake.hcl --push {{targets}}

# amd64 build of a pushed commit ON prd (git context, no upload from the PC), loaded there, then health-checked
# (usage: just docker-smoke, just docker-smoke bun main iteration)
docker-smoke targets="smoke" ref="main" profile="release":
    timeout 900 ssh prd 'cat > /usr/local/bin/aphrody-heavy && chmod 755 /usr/local/bin/aphrody-heavy' < "{{root}}/infra/fleet/bin/heavy.sh"
    timeout 7200 ssh prd 'TAG=smoke CARGO_PROFILE={{profile}} CARGO_BUILD_JOBS=2 aphrody-heavy docker buildx bake --builder aphrody "https://github.com/aphrody-dev/src.git#{{ref}}" -f infra/docker/docker-bake.hcl --set "*.platform=linux/amd64" --set "*.attest=" --set "*.cache-from=" --load --progress quiet {{targets}}'
    timeout 900 ssh prd 'SRC_TAG=smoke sh -s' < "{{root}}/infra/docker/smoke.sh"

# Deploy the compose stack: profile core on prd, edge on fr2 (usage: just docker-up, just docker-up edge fr2, SRC_TAG=<sha> to roll back)
docker-up profile="core" ctx="prd":
    SRC_TAG={{docker_tag}} {{docker}} --context {{ctx}} compose -f "{{root}}/infra/docker/compose.yaml" --profile {{profile}} pull
    SRC_TAG={{docker_tag}} {{docker}} --context {{ctx}} compose -f "{{root}}/infra/docker/compose.yaml" --profile {{profile}} up -d --wait --remove-orphans

# Stack status on a host
docker-ps profile="core" ctx="prd":
    {{docker}} --context {{ctx}} compose -f "{{root}}/infra/docker/compose.yaml" --profile {{profile}} ps

# Products with their own container flows (sources untouched): shenron lanes + runtime, rosegriffon compose build
docker-products:
    cd "{{root}}/apps/shenron" && {{docker}} buildx bake -f docker-bake.hcl lanes
    cd "{{root}}" && TAG={{docker_tag}} {{docker}} buildx bake -f infra/docker/docker-bake.hcl --push products
    RG_REGISTRY=ghcr.io/aphrody-dev/rosegriffon RG_TAG={{docker_tag}} {{docker}} compose -f "{{root}}/apps/rosegriffon/compose.yaml" build

# Arch Linux workstation shell with the monorepo mounted at /src
docker-shell:
    {{docker_compose}} --profile dev run --rm dev

# Alpine runtime shell (ay + Bun only)
docker-runtime:
    {{docker_compose}} --profile dev run --rm runtime

# Run any recipe inside the Arch dev container (usage: just docker-run verify-all)
docker-run recipe="verify-all":
    {{docker_compose}} --profile dev run --rm dev just {{recipe}}

# Toolchain bootstrap of a fleet host from packages/machine/toolchains.lock.toml (usage: just fleet-bootstrap prd|fr1|fr2)
fleet-bootstrap role:
    tar -cf - -C "{{root}}/infra/fleet/bootstrap" common.sh {{role}}.sh -C "{{root}}/infra/fleet/bin" heavy.sh -C "{{root}}/packages/machine" toolchains.lock.toml | timeout 120 ssh {{ if role == "fr1" { "vps" } else if role == "fr2" { "cdn" } else { "prd" } }} 'rm -rf /tmp/aphrody-bootstrap && mkdir -p /tmp/aphrody-bootstrap && tar -xf - -C /tmp/aphrody-bootstrap'
    timeout 1800 ssh {{ if role == "fr1" { "vps" } else if role == "fr2" { "cdn" } else { "prd" } }} 'cd /tmp/aphrody-bootstrap && LOCK=$PWD/toolchains.lock.toml sh {{role}}.sh'

# Regenerate the pinned toolchain manifest (versions + upstream checksums)
toolchains-lock:
    bun "{{root}}/scripts/toolchains-lock.ts"

# Nix alternative to containers: dev shell from infra/nix/flake.nix
nix-shell:
    nix develop "{{root}}/infra/nix"

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
# --- Labs (merged from C:\labs): conformance (ay conformance), Lore, Chromium factory ---

# ay + conformance harness build.
lab-build:
    cargo build -p aphrody -p aphrody-conformance

# Distribution build of ay: fat LTO, 1 CGU, stripped.
lab-dist:
    cargo build --release -p aphrody

# Fast local optimized build with debug assertions.
lab-iter:
    cargo build --profile iteration -p aphrody

# Run ay from source.
lab-dev *args:
    cargo run -p aphrody -- {{args}}

# Conformance suites (writes conformance/results/).
lab-conformance *suites:
    cargo run -p aphrody -- conformance --fetch {{suites}}

# Refresh Chrome Stable/Beta/Dev/Canary pins (ay conformance channels).
lab-channels:
    cargo run -q -p aphrody -- conformance channels

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

# Smallest ay binary: profile min + rebuilt std with immediate-abort.
lab-min:
    cargo build --profile min -p aphrody -Zbuild-std=std,panic_abort --target x86_64-pc-windows-msvc

# Central terminal stack (docs/terminal/ARCHITECTURE.md): Linux validation of the forks on prd at the src.lock.json pins (cpp | rust | all)
terminal-prd step="all" jobs="4":
    bun -e "if (!/^(cpp|rust|all)$/.test(process.argv[1]) || !/^[1-8]$/.test(process.argv[2])) process.exit(2)" "{{step}}" "{{jobs}}"
    ay ssh cp "{{root}}/infra/fleet/bin/terminal-prd-build.sh" prd:terminal-prd-build.sh
    ay ssh exec prd -- "JOBS={{jobs}} PINS='$(bun -e "const l = await Bun.file(process.argv[1]).json(); console.log(process.argv.slice(2).map((n) => n + '=' + l.repositories['third_party/' + n].commit).join(' '))" "{{root}}/src.lock.json" fmt GSL jsoncpp CLI11 cmark ratatui crossterm tui-markdown acp-rust-sdk terminal-control)' sh terminal-prd-build.sh {{step}}"

# Windows build of intelligent-terminal (WindowsTerminal.exe, wta.exe, installer, C++ and Rust tests): PR CI of the fork, workflow_dispatch on main
terminal-ci:
    gh workflow run "PR CI" -R aphrody-labs/intelligent-terminal --ref main

# Last fork CI runs of intelligent-terminal (a dispatched run appears a few seconds after terminal-ci)
terminal-ci-status:
    gh run list -R aphrody-labs/intelligent-terminal -w "PR CI" -L 3

# Advance the intelligent-terminal fork to upstream main, refresh every third_party fork (forks.ts), then re-pin src.lock.json
terminal-sync:
    gh repo sync aphrody-labs/intelligent-terminal --branch main
    bun "{{root}}/packages/machine/src/forks.ts"
    ay lock --lock-only

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
    pyp=$(printf '%s\n' "$out" | awk -F'\t' '$1=="uv" {printf "%s/%s ", "{{root}}", $3}')
    [ -z "$pyp" ] || uv run pytest $pyp

# Pre-push gate: format, layered deps, architecture rules
check:
    bun fmt --check
    cargo fmt --all --check
    bun check -b
    just checkdeps
    just identity check
    ay arch check --root "{{root}}"

# --- Agent fleet (docs/agents/AGENT-FIRST.md). `just <recipe>` is the single agent interface. ---

# Lint: Bun typecheck + clippy (compiles: run on prd, never on the PC)
lint:
    bun check -b
    cargo clippy --workspace --quiet

# Tests of the units changed since ref (alias of test-affected)
test ref="origin/main":
    just test-affected {{ref}}

# Runner on this host: up | health | status | work <role> | enqueue --role R --prompt P [--host H] ...
agents cmd="status" *args:
    bun "{{root}}/infra/agents/runner.ts" {{cmd}} {{args}}

# Install/refresh the runner on a Linux host (fr1, fr2 as ubuntu; prd as the non-root user agent)
agents-install host:
    if [ "{{host}}" = prd ]; then ssh prd 'sh -s' < "{{root}}/infra/agents/bootstrap-user.sh" && ssh agent@prd 'sh -s' < "{{root}}/infra/agents/install.sh"; else ssh {{host}} 'sh -s' < "{{root}}/infra/agents/install.sh"; fi

# Install the runner on this Windows PC (scheduled tasks + psmux session)
agents-install-pc:
    sh "{{root}}/infra/agents/install-pc.sh"

# Attach to a host's agent tmux session (WireGuard or public ssh; see AGENT-FIRST.md, Tunnels)
agents-attach host="prd":
    ssh -t {{host}} tmux attach -t agents
