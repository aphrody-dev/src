# Master Workspace Justfile for the monorepo root: settings, shared variables and imports only.
# Recipes live in `.just` files next to the code they drive (`import`, so every recipe name stays global: `just <recipe>`).
# Cross-platform: POSIX sh on Linux/macOS/WSL2/containers, niubash (native Rust bash, no MSYS) on Windows.
# Paths use forward slashes, which every supported shell and toolchain accepts.
# Every value below can be overridden from the environment or `just var=value <recipe>`.
# Windows shell: niubash 1.5.0 (configuration/shell.dsc.winget); `just doctor` output identical to pwsh (2026-11-12).

set shell := ["sh", "-cu"]
set windows-shell := ["niu", "-cu"]
set dotenv-load := false

root := env("SRC_ROOT", justfile_directory())
image := env("SRC_IMAGE", "aphrody/monorepo-dev:local")

import "crates/ay/ay.just"
import "scripts/scripts.just"
import "packages/ai-os/ai-os.just"
import "packages/core/core.just"
import "packages/chromium-bun/chromium-bun.just"
import "packages/env-kit/env-kit.just"
import "packages/machine/machine.just"
import "packages/release/release.just"
import "packages/upstream/upstream.just"
import "assets/brand/brand.just"
import "infra/agents/agents.just"
import "infra/chromium-factory/labs.just"
import "infra/cloudflare/cloudflare.just"
import "infra/cluster/cluster.just"
import "infra/docker/docker.just"
import "infra/fleet/fleet.just"
import "infra/lfs/lfs.just"
import "infra/nix/nix.just"
# unixwin chain (niubash, rubash, WinuxCmd): unixwin-* recipes
import "infra/unixwin/unixwin.just"

# Default recipe: list available commands
default:
    just --list

# Verify all sovereign compiler, VCS, cloud, architecture, and AI CLI toolchains
[group('dev')]
doctor:
    ay doctor

# Format entire Bun workspace
[group('dev')]
fmt:
    bun fmt

# Run architecture gate, toolchain doctor, and Bun + Cargo suites
[group('dev')]
verify-all:
    ay arch check --strict --root "{{root}}"
    ay doctor
    bun test "{{root}}/packages/env-kit"
    bun test "{{root}}/.agents/scripts/pre-tool-guard.test.ts"
    bun --cwd "{{root}}/packages/ai-os" test
    # Rust compiles in CI only (never on the workstation): run ci.yml on this commit and wait for it.
    gh workflow run ci.yml --ref main && sleep 5 && gh run watch "$(gh run list --workflow ci.yml -L 1 --json databaseId --jq '.[0].databaseId')" --exit-status

# Pre-push gate: format, layered deps, architecture rules
[group('dev')]
check:
    bun fmt --check
    cargo fmt --all --check
    bun check -b
    just checkdeps
    just js-deps
    just deny
    just identity check
    ay arch check --root "{{root}}"

# Lint: Bun typecheck + clippy (compiles: run on fr1, never on the PC nor prd)
[group('dev')]
lint:
    bun check -b
    cargo clippy --workspace --quiet

# Tests of the units changed since ref (alias of test-affected)
[group('dev')]
test ref="origin/main":
    just test-affected {{ref}}
