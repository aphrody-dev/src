# Images de base conteneurs (2026-11-12)

Tailles = somme des couches compressées linux/amd64, lues sans pull : Docker Hub API (`hub.docker.com/v2/repositories/.../tags`) ou `docker manifest inspect -v` sur prd (Docker 29.9.2), le 2026-11-12.

| Image | Taille compressée | libc | Shell/PM | Source mesure |
|---|---|---|---|---|
| scratch | 0 | aucune | non | par définition |
| cgr.dev/chainguard/static | 459 889 o (0,46 Mo) | aucune (tzdata, certs) | non | manifest prd |
| gcr.io/distroless/static-debian13 | 860 442 o (0,86 Mo) | aucune | non | manifest prd |
| busybox:1.38.0-musl | 886 230 o | musl | busybox | Hub API |
| alpine:3.24.4 | 3 853 673 o (3,85 Mo) | musl | apk 3.0.9 | Hub API ; apk-tools-3.0.9-r0 dans v3.24/main |
| cgr.dev/chainguard/glibc-dynamic | 4 834 020 o | glibc | non | manifest prd |
| cgr.dev/chainguard/wolfi-base | 8 168 286 o | glibc | apk | manifest prd |
| gcr.io/distroless/base-debian13 | 9 487 444 o | glibc | non | manifest prd |
| gcr.io/distroless/cc-debian13 | 10 682 931 o | glibc + libgcc/libstdc++ | non | manifest prd |
| debian:trixie-slim | 29 856 132 o | glibc | apt | manifest prd |
| ubuntu:26.04 (resolute) | 42 166 968 o | glibc | apt | Hub API |
| ubuntu:26.10 (stonking) | 43 034 913 o | glibc | apt | Hub API |
| ubuntu/chiselled-base | non lu (manifest vide/timeout) [NV] | glibc | non | — |
| archlinux:base | 134 305 420 o | glibc | pacman | Hub API |
| nixos/nix:2.35.6 | 162 930 652 o | glibc | nix | Hub API |
| cachyos/cachyos | 333 022 987 o | glibc | pacman | Hub API |
| cachyos/cachyos-v3 | 425 822 376 o | glibc v3 | pacman | Hub API |
| nix dockerTools (buildLayeredImage) | ferme de dépendances exacte, variable | au choix | non | — |

## musl vs glibc

- Allocateur : malloc de musl (mallocng) plus lent sous forte concurrence que glibc ; contournement standard en Rust = `mimalloc`/`jemalloc` en global allocator [NV, pas de bench consulté en session].
- DNS : résolveur musl sans `single-request`/`options rotate` historiques, TCP fallback ajouté en musl 1.2.4 [NV].
- bun : publie `bun-linux-x64-musl.zip` (tools.toml de src, 2026-11-12) ; tourne donc sur Alpine.
- Rust : cible `x86_64-unknown-linux-musl` statique -> `scratch`/`static` ; `ay` est déjà publié en musl (tools.toml).

## CVE

Chainguard et distroless revendiquent ~0 CVE connue sur les images minimales ; Debian/Ubuntu complètes en portent des dizaines (majorité low/negligible) [NV : aucun scan exécuté, pas de pull]. Mesure à faire : `grype`/`trivy` en CI sur les digests épinglés.

## Recommandation par usage

| Usage | Image |
|---|---|
| Binaire Rust statique (musl) | `cgr.dev/chainguard/static` ou `scratch` (+ certs) |
| Binaire Rust glibc / bun compilé (`bun build --compile`) | `gcr.io/distroless/cc-debian13` ou `chainguard/glibc-dynamic` |
| Image de build / CI avec PM | `wolfi-base` (apk, glibc) ou `debian:trixie-slim` |
| Debug rapide | `alpine:3.24` |
| Build x86-64-v3 optimisé | `cachyos/cachyos-v3` (lourd : 426 Mo) uniquement comme builder multi-stage |
| Reproductibilité bit à bit | nix `dockerTools.buildLayeredImage` (infra/nix/flake.nix existe déjà dans src) |

Épingler par digest (`@sha256:`), jamais par tag.
