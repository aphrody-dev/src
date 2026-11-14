---
name: containers-alpine-arch-k8s
description: Build, run, and ship containers and Kubernetes workloads for src. Use when writing or reviewing a Dockerfile, compose.yaml, Kubernetes manifest, Helm chart, kustomization, or Nix dev shell, when picking a base image, or when answering Docker/Kubernetes/Nix questions offline from the local docs mirrors. Policy: never Debian or Ubuntu; Alpine for light images, Arch Linux for heavy toolchain images, Nix as the non-container alternative.
---

# Containers: Alpine, Arch Linux, Nix, Kubernetes

## Base image policy (hard rule)

| Need                                                                          | Base                   | Notes                                                                                                              |
| :---------------------------------------------------------------------------- | :--------------------- | :----------------------------------------------------------------------------------------------------------------- |
| Runtime, CI job, deployable service                                           | `alpine:3.23`          | musl. Build Rust as static musl, Go with `CGO_ENABLED=0`, Bun via `oven/bun:<ver>-alpine`.                         |
| Toolchain or workstation image (Rust + Go + Bun + C++, Chromium-style builds) | `archlinux:base-devel` | amd64 only. Pin a dated tag `base-devel-YYYYMMDD.0.N` for reproducible rebuilds (see `archlinux-docker/REPRO.md`). |
| Reproducible shell without containers                                         | `infra/nix/flake.nix`  | `nix develop ./infra/nix` / `just nix-shell`. Images from Nix: `dockerTools` (see nix.dev tutorial below).         |
| Final stage for a single static binary                                        | `scratch` or `alpine`  | Prefer `alpine` when a shell or CA bundle is needed.                                                               |

Never use `debian`, `ubuntu`, `*-slim`, `*-bookworm`, `*-trixie`, `*-jammy`, or `*-noble` tags, including in builder stages. Official language images have Alpine variants: `golang:<ver>-alpine3.23`, `rust:<ver>-alpine3.23`, `oven/bun:<ver>-alpine`, `node:<ver>-alpine3.23`, `python:<ver>-alpine3.23`.

## Monorepo wiring

- `infra/docker/Dockerfile`: Rust stages (`rust-base` -> `rust-build` -> `rust-runtime`, Alpine, static musl, cargo-chef), Bun stages (`bun-alpine` -> `bun-deps` -> `bun-build` -> `bun-runtime`), product targets (`loreserver`, `r3d`, `rust-stack`, `ai-os`, `api-gateway`), `runtime` (Alpine) and `dev` (Arch).
- `infra/docker/compose.yaml` services include `dev` (Arch shell), `verify` (`just verify-all` in Arch), `runtime` (Alpine) and the deployable products. Repo bind-mounted at `/src`; `node_modules` and `target` live in named volumes so Linux outputs never mix with Windows ones. Recipes: `infra/docker/docker.just`.
- Every version is an `ARG` at the top of the Dockerfile, overridable from the environment (`.env.example` section 0); read the current values there instead of copying them.
- Recipes: `just docker-build`, `just docker-shell`, `just docker-runtime`, `just docker-run <recipe>`, `just nix-shell`, `just docs-sync`.

## Dockerfile checklist

1. Multi-stage; builder stages never ship. Order layers from least to most frequently changed.
2. `RUN --mount=type=cache` for cargo registry, Go module cache, Bun cache.
3. `apk add --no-cache` (Alpine) / `pacman -Syu --noconfirm --needed ... && pacman -Scc --noconfirm` (Arch); sort package lists alphabetically.
4. Non-root `USER` in runtime images; `ENTRYPOINT` exec form; no secrets in `ARG`/`ENV` (use `--mount=type=secret`).
5. Pin: version tags at minimum, `@sha256:` digests for release images. Rebuild with `--pull` on a schedule.
6. Keep `infra/docker/Dockerfile.dockerignore` excluding `.git`, `third_party/`, `target/`, `node_modules/`, `.env`.
7. Multi-arch: `docker buildx build --platform linux/amd64,linux/arm64` (Alpine targets only; Arch is amd64 only).
8. Lint with `hadolint Dockerfile`; check provenance/SBOM with `docker buildx build --provenance=true --sbom=true`.

## Kubernetes checklist

1. Every container sets `resources.requests` and `resources.limits` (memory limit always; CPU limit only when throttling is acceptable).
2. `readinessProbe` and `livenessProbe` (plus `startupProbe` for slow starts); never point liveness at a dependency.
3. Pod security: `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`, `capabilities.drop: [ALL]`, `seccompProfile: RuntimeDefault` (restricted Pod Security Standard).
4. Config in `ConfigMap`, secrets in `Secret` (or an external secrets operator); never baked into images.
5. Kustomize for environment overlays (`kubectl apply -k`), Helm only when a chart is consumed or published.
6. Local clusters: `kind` (Docker Desktop also ships `kubectl` and a single-node cluster).
7. Validate before apply: `kubectl apply --dry-run=server -f ...` and `kubectl diff -f ...`.

## Local offline docs (clones in `third_party/`)

Search these (paths relative to `third_party/`) with Grep before going to the web; refresh with `just docs-sync`. Context7 remains the fallback for anything newer.

- Docker (`docker-docs/content/`): `manuals/build/building/best-practices.md`, `manuals/build/building/multi-stage.md`, `manuals/build/cache/optimize.md`, `manuals/build/building/multi-platform.md`, `manuals/build/metadata/attestations/`, `manuals/compose/how-tos/environment-variables/`, `reference/compose-file/`, `manuals/build/concepts/dockerfile.md` (the full Dockerfile reference is generated upstream; use Context7 for it).
- Kubernetes (`kubernetes-website/content/en/docs/`): `concepts/configuration/manage-resources-containers.md`, `concepts/workloads/pods/probes.md`, `concepts/security/pod-security-standards.md`, `concepts/configuration/secret.md`, `tasks/manage-kubernetes-objects/kustomization.md`, `reference/kubectl/quick-reference.md`.
- Nix (`nix-dev/source/`): `tutorials/first-steps/declarative-shell.md`, `tutorials/first-steps/towards-reproducibility-pinning-nixpkgs.md`, `tutorials/nixos/building-and-running-docker-images.md`.
- Arch image (`archlinux-docker/`): `README.md` (tags, cosign verification), `REPRO.md` (reproducible builds).
- Alpine image (`docker-alpine/`): `README.adoc`, `Dockerfile`.
