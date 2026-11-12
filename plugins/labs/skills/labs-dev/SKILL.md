---
name: labs-dev
description: Travailler dans le monorepo Aphrody Labs C:\labs (workspace Rust, Lore VCS, usine Chromium fr1). Utiliser pour "build labs", "just ci", "profil cargo", "cranelift", "rust-lld", "just save", "versionner", "factory", "fr1", "prd", "vendor", "deps-latest", ou toute modif dans C:\labs.
---
# labs-dev

Sources (lues 2026-11-12) : `C:\labs\justfile`, `Cargo.toml` (profils l.256-305), `.cargo/config.toml`, `docs/ARCHITECTURE.md`, `docs/ENGINE-DECISION.md`. Ces fichiers font foi : les relire avant d'agir.

## Recettes just
| Recette | Effet |
|-|-|
| `just build` | `cargo build` (default-members cli + conformance) |
| `just iter` | profil `iteration` (release sans LTO, 16 CGU, incremental, debug-assertions) |
| `just dist` | `cargo build --release -p aphrody` (fat LTO, 1 CGU, abort, strip) |
| `just check-all` | `cargo check --workspace --all-targets` (Lore inclus) |
| `just dev <args>` | `cargo run -p aphrody -- <args>` |
| `just ci` | fmt --check, clippy `-D warnings`, test, `cargo deny check` |
| `just conformance <suites>` | suites épinglées -> `conformance/results/` |
| `just channels` | `scripts/chrome-channels.sh` -> `third_party/chrome-channels.toml` |
| `just lore-sync` | ré-absorbe Lore depuis `aphrody-labs/lore` |
| `just deps-latest` | `cargo upgrade --incompatible allow --exclude bitcode,quinn-proto` + update + check |
| `just save "msg"` | `lore stage --scan .` ; `lore commit` ; `lore push` |
| `just deploy-loreserver` | build linux, scp vers `prd`, restart `loreserver`, health `10.200.77.5:41339` |

## Profils cargo
- `dev` : `codegen-backend = "cranelift"`, `debug = "line-tables-only"`. Mesuré (lore-client, poste local) : à froid 237 s -> 165 s, incrémental 3.05 s -> 2.06 s.
- `dev.package."*"` : LLVM opt-level 1 (deps rapides, en cache).
- `release` : fat LTO, 1 CGU, `panic = "abort"`, strip, O3 ; tokio et quinn sans debug-assertions.
- `iteration` : voir table. `min` : `opt-level = "z"` (hérite release). Le commentaire cite `just min` (build-std) mais **aucune recette `min`** n'existe dans le justfile.
- `.cargo/config.toml` : nightly `-Zthreads=16`, `--cfg tokio_unstable`, `--cfg uuid_unstable`, frame pointers. Windows : `linker = "rust-lld"` ("measured faster than link.exe", chiffre non consigné), `+crt-static`, `/Brepro`. sccache désactivé pour Rust (0.05 % de hit). Une table `[target.*].rustflags` REMPLACE `[build]` : y dupliquer les `--cfg`.

## Politique
- Deps épinglées au workspace (`=x.y.z`). Crates patchées dans `vendor/` via `[patch.crates-io]` (quinn-proto, glob-match) ; ne pas patcher un upstream ailleurs.
- VCS = Lore (`crates/lore*`, absorbé). Versionner avec `just save`, pas git (ARCHITECTURE.md:11 ; un `.git` existe pourtant).
- Toolchain JS produit : oxc + rolldown + lightningcss, pas swc. Outillage JS local : bun (skill `bun`).
- Moteur : ENGINE-DECISION.md « Décision mesurée » fait foi (oracle chs-stable 157, Lightpanda agent léger). Voir skill `browser-engines`.
- Docs en français, courtes, zéro emoji. Licences upstream copiées (`licenses/`).

## Machines
| Hôte | Alias ssh | Rôle |
|-|-|-|
| fr1 | `vps` | usine Chromium `/srv/chromium` (`chromium-factory.sh`, `cros-factory.sh`), bench navigateurs |
| prd | `prd` | serveur Lore (`/opt/lore/bin/loreserver`, unit `loreserver`) |

## Usine Chromium (fr1)
- `just factory-deploy` : scripts, args, units systemd vers fr1.
- `just factory <sync|build|publish|all> <stable|beta|dev|canary>` : systemd-run `chromium-factory-<step>`.
- `just factory-status` : units, journalctl -n 15, df.
- `just factory-fetch <version>` : R2 `aphrody-chromium/labs_agent/<v>/linux-x64.tar.zst`.
- Args : `browser/factory/args/labs_agent.gn`. Détail : skill `chromium`, agent `chromium-builder`.
