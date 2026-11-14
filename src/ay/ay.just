# ay CLI recipes: git, graph, lock, manifests, deps, build, arch gates (imported by the root justfile).

# bun docs index via ay docs (`ay docs <args>`)
[group('ay')]
bun-docs *args:
    ay docs {{args}}

# Run deterministic monorepo architecture, domain-purity, boundary & hygiene gate
[group('ay')]
archguard:
    ay arch check --strict --root "{{root}}"

# System and depot_tools ecosystem overview
[group('ay')]
info:
    ay git info

# Ingest any codebase (usage: just ingest src/depot/core, just ingest third_party/chromium)
[group('ay')]
ingest target="src/depot/core" format="markdown" max_tokens="20000":
    ay ingest "{{root}}/{{target}}" --format "{{format}}" --max-tokens {{max_tokens}}

# Build AST knowledge graph for any repo into graphify-out/<name> (usage: just graph third_party/bun/src bun)
[group('ay')]
graph target="src/depot/core" name="":
    ay graph build "{{root}}/{{target}}" --out-dir "{{root}}/graphify-out/{{ if name == "" { file_name(target) } else { name } }}"

# Query AST graph symbols across codebases
[group('ay')]
graph-query term target="src/depot/core":
    ay graph query "{{term}}" "{{root}}/{{target}}"

# Optimize repository with Git Scalar / blobless optimizations
[group('ay')]
slim target="src/depot/core":
    ay git slim "{{root}}/{{target}}"

# List active worktrees for a repo
[group('ay')]
worktrees target="src/depot/core":
    ay git worktree list "{{root}}/{{target}}"

# Verify content-addressed Blake3 binary artifacts against a manifest (usage: just artifacts-verify path/to/depot-artifacts.toml)
[group('ay')]
artifacts-verify manifest="depot-artifacts.toml":
    ay git artifacts verify "{{manifest}}"

# Build the workspace for a cross-compilation preset (usage: just build target=wasm32, just build linux-musl; `ay build --list` shows presets and missing toolchains)
[group('ay')]
build target="":
    ay build {{ if trim_start_match(target, "target=") == "" { "" } else { "--target " + trim_start_match(target, "target=") } }}

# Build the ay CLI (fat LTO release) and install it into ~/.local/bin
[group('ay')]
install-ay:
    cargo install --path "{{root}}/src/ay" --root "{{home_directory()}}/.local" --force --locked --no-track

# Byte-level Git and Scalar optimization across all repos
[group('ay')]
slim-all:
    ay git slim --all --root "{{root}}"

# Lock every repository of the checkout in src.lock.json (pin-001), then derive DEPS and .gitmodules
[group('ay')]
lock:
    ay lock --root "{{root}}" --out "{{root}}/src.lock.json"

# Supply-chain policy gate (docs/deps/POLICY.md): manifests, locks, catalog, containers, tools.toml
[group('ay')]
deps *flags:
    ay doctor --deps --root "{{root}}" {{flags}}

# Refresh Cargo.lock, bun.lock and uv.lock without upgrading (--hoist moves inline crate requirements to the workspace)
[group('ay')]
deps-lock *flags:
    ay lock --deps --root "{{root}}" {{flags}}

# Upgrade within declared requirements, report Cargo duplicates before/after (--breaking: majors too); then run on fr1
[group('ay')]
deps-bump *flags:
    ay lock --deps --bump --dedupe --root "{{root}}" {{flags}}

# Derive DEPS, .gitmodules and patch series from src.lock.json (pin-001)
[group('ay')]
manifests:
    ay manifests --root "{{root}}"

# Gate: derived manifests and gitlinks match src.lock.json
[group('ay')]
manifests-check:
    ay manifests --check --root "{{root}}"

# Run full 4-pillar VCS governance audit (Git + Chromium + Kernel + AOSP)
[group('ay')]
vcs-audit:
    ay git audit --root "{{root}}"
    ay manifests verify "{{root}}"
    frg pillars

# Run architecture gate without --strict
[group('ay')]
arch-check:
    ay arch check --root "{{root}}"

# Lookup Linux Kernel style MAINTAINERS ownership for a path (usage: just maintainer third_party/linux/Makefile)
[group('ay')]
maintainer target="third_party/linux":
    ay git maintainer "{{target}}" --root "{{root}}"

# Run Sovereign Local Forge CLI (usage: just forge status, just forge slim)
[group('ay')]
forge cmd="status":
    frg {{cmd}}

# Launch Sovereign Local Forge web dashboard
[group('ay')]
serve-forge port="4000":
    frg serve --port {{port}}

# Run Pure-Rust Sovereign Stack
[group('ay')]
rust-stack cmd="serve":
    rust-stack {{cmd}}

# Supply-chain gates (docs/DEPS-MINIMIZE.md): cargo-deny (licenses, advisories, bans, sources pinned by rev) and the bun workspace check
[group('ay')]
deny *flags:
    cargo deny --locked check {{flags}}
