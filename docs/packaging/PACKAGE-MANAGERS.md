# Gestionnaires de paquets : matrice (2026-11-12)

Versions lues le 2026-11-12 : pacman 7.1.0 (archlinux.org JSON), apk-tools 3.0.9 (Alpine 3.24 main), apt 3.3.3 (fr2), dnf5 5.4.8.0 (GitHub release 2026-11-11), uv 0.13.8 (GitHub 2026-11-12), bun 1.4.4 (GitHub 2026-10-22), cargo-binstall 1.27.0 (2026-11-11), mise 2026.11.7, aqua 2.66.1, pixi 0.84.2, pkgx 2.11.0. Le reste : [NV].

## Paquets système

| PM | Solveur | Vitesse | Reproductibilité | Signature | Cache binaire | Atomique/rollback | Multi-distro |
|---|---|---|---|---|---|---|---|
| pacman/makepkg (Arch) | résolution simple, pas de SAT | rapide (archives zstd) [NV chiffré] | faible (rolling ; Arch Archive pour dater) ; paquets reproductibles suivis par reproducible-builds | GPG (keyring) | dépôts | non (snapper/btrfs externe) | non |
| pacman + dépôts CachyOS v3/v4/znver4 | idem | idem | idem | GPG CachyOS | dépôts optimisés -march | non | non |
| apk 3 (Alpine) | solveur propre | très rapide, index petit [NV chiffré] | moyenne (branches figées) | RSA/ v3 : nouveaux formats d'index/paquet [NV] | dépôts | `/etc/apk/world` déclaratif, pas de snapshot | non |
| nix (NixOS, flakes) | évaluation fonctionnelle, pas de solveur | dépend du cache | forte (flake.lock, store hashé) | clés ed25519 cache | cache.nixos.org | oui (générations) | Linux + macOS |
| apt/dpkg | solveur 3.x (nouveau solveur APT 3.0 [NV]) | moyen | snapshot.debian.org, reproducible builds Debian | GPG InRelease | dépôts, PPA | non | non |
| dnf5/rpm (Fedora) | libsolv (SAT) | dnf5 annoncé nettement plus rapide que dnf4 [NV] | moyenne | GPG ; rpm 6 v6 signatures [NV] | dépôts, COPR | rpm-ostree (atomique) | non |
| flatpak/Flathub | OSTree | — | OSTree commits | GPG | Flathub | oui (OSTree) | oui (apps desktop) |
| snap | — | démarrage lent squashfs [NV] | révisions | assertions Canonical | Snap Store (centralisé) | oui (révisions) | oui |

## Registres de langages

| PM | Solveur | Vitesse | Lock | Signature/supply chain | Cache |
|---|---|---|---|---|---|
| cargo/crates.io | résolveur cargo (semver) | — | Cargo.lock | index sparse, checksums ; Trusted Publishing crates.io [NV] | sccache, binstall |
| npm / bun install | arborist / bun | bun annonce un ordre de grandeur plus rapide que npm [NV] | package-lock / bun.lock | npm provenance (sigstore), Trusted Publishing | cache global bun |
| PyPI uv / pip | uv : PubGrub ; pip : backtracking | uv annonce 10-100x pip [NV] | uv.lock | PEP 740 attestations (sigstore) [NV] | cache uv |
| Go modules | MVS (minimal version selection) | rapide | go.sum | sum.golang.org (log transparent) | GOPROXY |
| GitHub/GitLab releases | aucun | téléchargement direct | pin tag + sha256 | attestations GitHub (sigstore) | — |
| vcpkg | baseline git | build source | vcpkg.json + baseline | aucune signature native | binary caching (NuGet, GHA, fichiers) |
| CIPD | ref/tag -> instance id | rapide (CAS) | ensure-file + `.versions` | instance id = hash | CAS Google |

## Windows

| PM | Modèle | Signature | Déclaratif | Remarque |
|---|---|---|---|---|
| winget | manifestes YAML (winget-pkgs) | hash + Authenticode de l'installeur | `winget configure` DSC v3 | utilisé par packages/machine |
| scoop | buckets JSON, portable dans ~ | hash | non | sans admin |
| choco | nupkg + scripts PS | hash ; modération | non | scripts PowerShell |
| MSIX | paquet signé, conteneurisé | signature obligatoire | — | rollback/désinstall propre |

## Synthèse

- Rapidité : apk et pacman en tête côté système, uv et bun côté langages (sources éditeurs, non mesurées ici).
- Reproductibilité : nix > (cargo/uv/bun lockfiles) > apt snapshots > rolling.
- Supply chain : la convergence 2026 est sigstore/attestations (npm, PyPI, GitHub) ; TUF reste niche.
