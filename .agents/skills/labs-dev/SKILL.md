---
name: labs-dev
description: Work in the Aphrody Labs monorepo C:\labs (Rust workspace, Lore VCS, fr1 Chromium factory). Use for "build labs", "just ci", "profil cargo", "cranelift", "rust-lld", "just save", "versionner", "factory", "fr1", "prd", "vendor", "deps-latest", or any change in C:\labs.
---

# labs-dev

Sources (read 2026-11-12): `C:\labs\justfile`, `Cargo.toml` (profiles l.256-305), `.cargo/config.toml`, `docs/ARCHITECTURE.md`, `docs/ENGINE-DECISION.md`. These files are authoritative: reread them before acting.

## just recipes

| Recipe                      | Effect                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `just build`                | `cargo build` (default-members cli + conformance)                                   |
| `just iter`                 | `iteration` profile (release without LTO, 16 CGU, incremental, debug-assertions)    |
| `just dist`                 | `cargo build --release -p aphrody` (fat LTO, 1 CGU, abort, strip)                   |
| `just check-all`            | `cargo check --workspace --all-targets` (Lore included)                             |
| `just dev <args>`           | `cargo run -p aphrody -- <args>`                                                    |
| `just ci`                   | fmt --check, clippy `-D warnings`, test, `cargo deny check`                         |
| `just conformance <suites>` | pinned suites -> `conformance/results/`                                             |
| `just channels`             | `scripts/chrome-channels.sh` -> `third_party/chrome-channels.toml`                  |
| `just lore-sync`            | re-absorbs Lore from `aphrody-labs/lore`                                            |
| `just deps-latest`          | `cargo upgrade --incompatible allow --exclude bitcode,quinn-proto` + update + check |
| `just save "msg"`           | `lore stage --scan .`; `lore commit`; `lore push`                                   |
| `just deploy-loreserver`    | linux build, scp to `prd`, restart `loreserver`, health `10.200.77.5:41339`         |

## Cargo profiles

- `dev`: `codegen-backend = "cranelift"`, `debug = "line-tables-only"`. Measured (lore-client, local workstation): cold 237 s -> 165 s, incremental 3.05 s -> 2.06 s.
- `dev.package."*"`: LLVM opt-level 1 (fast deps, cached).
- `release`: fat LTO, 1 CGU, `panic = "abort"`, strip, O3; tokio and quinn without debug-assertions.
- `iteration`: see table. `min`: `opt-level = "z"` (inherits release). The comment cites `just min` (build-std) but **no `min` recipe** exists in the justfile.
- `.cargo/config.toml`: nightly `-Zthreads=16`, `--cfg tokio_unstable`, `--cfg uuid_unstable`, frame pointers. Windows: `linker = "rust-lld"` ("measured faster than link.exe", figure not recorded), `+crt-static`, `/Brepro`. sccache disabled for Rust (0.05 % hit rate). A `[target.*].rustflags` table REPLACES `[build]`: duplicate the `--cfg` there.

## Policy

- Deps pinned at the workspace (`=x.y.z`). Crates patched in `vendor/` via `[patch.crates-io]` (quinn-proto, glob-match); do not patch an upstream elsewhere.
- VCS = Lore (`crates/lore*`, absorbed). Version with `just save`, not git (ARCHITECTURE.md:11; a `.git` exists nonetheless).
- Product JS toolchain: oxc + rolldown + lightningcss, not swc. Local JS tooling: bun (skill `bun`).
- Engine: ENGINE-DECISION.md "Décision mesurée" is authoritative (oracle chs-stable 157, Lightpanda light agent). See skill `browser-engines`.
- Docs in French, short, zero emoji. Upstream licenses copied (`licenses/`).

## Machines

| Host | ssh alias | Role                                                                                       |
| ---- | --------- | ------------------------------------------------------------------------------------------ |
| fr1  | `vps`     | Chromium factory `/srv/chromium` (`chromium-factory.sh`, `cros-factory.sh`), browser bench |
| prd  | `prd`     | Lore server (`/opt/lore/bin/loreserver`, unit `loreserver`)                                |

## Chromium factory (fr1)

- `just factory-deploy`: scripts, args, systemd units to fr1.
- `just factory <sync|build|publish|all> <stable|beta|dev|canary>`: systemd-run `chromium-factory-<step>`.
- `just factory-status`: units, journalctl -n 15, df.
- `just factory-fetch <version>`: R2 `aphrody-chromium/labs_agent/<v>/linux-x64.tar.zst`.
- Args: `browser/factory/args/labs_agent.gn`. Details: skill `chromium`, agent `chromium-builder`.
