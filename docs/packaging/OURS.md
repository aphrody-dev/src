# Ce que C:\src possède déjà (inspecté le 2026-11-12, lecture seule)

| Pièce                      | Emplacement                                                                       | Ce qu'elle fait                                                                                                                                                 | Correspondance           |
| -------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| `ay up`                    | crates/up (lib.rs 455 l., manifest.rs, fetch.rs, install.rs, archive.rs, shim.rs) | installe/MAJ outils de `tools.toml` dans ~/.local/bin ; sources `github`, `url`, `bun`, `installer`, `ubi` ; sha256 ; zip/tar/xz/zstd                           | ≈ mise/aqua (backends)   |
| tools.toml                 | racine                                                                            | 42 outils : 22 `ubi`, 15 `github`, 2 `url`, 2 `bun`, 1 `installer` ; plateformes win/linux/macos x86_64/aarch64                                                 | registre local type aqua |
| src.lock.json              | racine (180 Ko)                                                                   | clés `toolchains` (agy, bun, cargo, cl.exe, claude, dotnet, gix, go, jj, just, nvcc, rustc, sccache, wck, xwin, zig), 322 `repositories`, `hardware`, `pillars` | lock unifié embryonnaire |
| packages/machine           | winget DSC v3                                                                     | `shell.dsc.winget`, export de 161 paquets épinglés (2026-11-12), apply-user.ts                                                                                  | couche Windows (winget)  |
| depot-cipd                 | crates/depot-cipd                                                                 | client CIPD compatible luci-go (ensure-file, iid, deploy)                                                                                                       | CIPD                     |
| depot-cas                  | crates/depot-cas                                                                  | store content-addressed, FastCDC à paramètres Lore                                                                                                              | cache binaire            |
| depot-vpython              | crates/depot-vpython                                                              | `ay vpy` : specs vpython sur `uv run` avec lock haché                                                                                                           | PyPI/uv                  |
| steam-depot                | crates/steam-depot                                                                | VDF, découverte Steam, Proton                                                                                                                                   | jeux (hors PM générique) |
| unix-cachyos / unix-distro | crates/                                                                           | génère pacman.conf v3, makepkg.conf (`-march=raptorlake` en dur), profils scx_lavd/BORE                                                                         | pacman/CachyOS           |
| infra/nix/flake.nix        | infra/nix                                                                         | devShell nix (nixos-unstable, 4 systèmes)                                                                                                                       | nix                      |
| vcpkg                      | apps/rosegriffon/tools/iecode-cpp (vcpkg.json + overlay-ports)                    | dépendances C++ d'une app                                                                                                                                       | vcpkg                    |
| bun                        | bun.lock, `source = "bun"`                                                        | outils JS (wrangler, hostinger-api-mcp)                                                                                                                         | npm                      |
| cargo-binstall             | tools.toml (ubi)                                                                  | binaires de crates                                                                                                                                              | crates.io                |

## Lacunes

- `ubi` ne vérifie pas de checksum (commentaire tools.toml l.215) : 22 outils sans intégrité.
- Aucune vérification de signature/attestation (sigstore, cosign, GitHub attestations).
- Pas de solveur : versions toutes épinglées à la main ; pas de contraintes ni de dépendances.
- Pas d'identifiant canonique (purl) ni de lien OSV pour les vulnérabilités.
- Aucun backend paquets système Linux (pacman/apt/apk) ni OCI ; images conteneurs non épinglées par digest dans un lock commun.
- `unix-cachyos` code en dur Raptor Lake ; ne correspond à aucun hôte (prd = EPYC Zen 4, fr1/fr2 = Haswell v3).
- Deux locks parallèles (tools.toml versions + src.lock.json toolchains via `lock = …`).
