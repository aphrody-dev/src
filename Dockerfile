# syntax=docker/dockerfile:1.7
# Reproducible container images for the monorepo. No Debian anywhere:
#   runtime  Alpine Linux, small: static musl CLIs + Bun. Default for CI jobs and deploys.
#   dev      Arch Linux base-devel, large: full Rust/Go/Bun/C++ toolchain for interactive work.
#   (Nix users: `nix develop` with the root flake.nix instead of containers.)
# Every version is a build arg; defaults mirror src.lock.json "toolchains" and .env.example section 0.
# Pin ARCH_TAG to a dated tag (e.g. base-devel-20261108.0.123456) and add @sha256 digests for
# bit-for-bit rebuilds. Arch images are published for linux/amd64 only.

ARG ALPINE_VERSION=3.23
ARG ARCH_TAG=base-devel
ARG BUN_VERSION=1.4.4
ARG GO_VERSION=1.27.0
ARG RUST_TOOLCHAIN=nightly
ARG JUST_VERSION=1.58.0
# Units compiled into the images. Units with path deps into third_party/ (crates/rust-stack -> wgpu)
# need the full checkout: build them inside `dev`, where the repo is mounted.
ARG CLI_UNITS="crates/ay"

FROM oven/bun:${BUN_VERSION}-alpine AS bun-alpine
FROM golang:${GO_VERSION}-alpine${ALPINE_VERSION} AS go-alpine

# ---------------------------------------------------------------------------
# builder: Alpine + rustup + Go, compiles first-party CLIs as static musl binaries.
FROM alpine:${ALPINE_VERSION} AS builder
ARG RUST_TOOLCHAIN
ARG JUST_VERSION
ARG CLI_UNITS
# Alpine drops superseded package versions, so pkg=ver pins break rebuilds; pin ALPINE_VERSION (+digest) instead.
# hadolint ignore=DL3018
RUN apk add --no-cache \
      bash build-base clang cmake curl git linux-headers musl-dev \
      openssl-dev openssl-libs-static perl pkgconf python3 rustup zlib-static
ENV PATH=/root/.cargo/bin:/usr/local/go/bin:${PATH} \
    OPENSSL_STATIC=1
RUN rustup-init -y --profile minimal --default-toolchain "${RUST_TOOLCHAIN}" --component rustfmt,clippy
COPY --from=go-alpine /usr/local/go /usr/local/go
RUN --mount=type=cache,target=/root/.cargo/registry \
    cargo install just --version "${JUST_VERSION}" --locked --root /opt
WORKDIR /build
# Root workspace manifest and lock: every crates/* directory is a member.
COPY Cargo.toml Cargo.lock ./
COPY crates/ crates/
COPY infra/ infra/
# Submodules are optional: build whichever units are checked out.
RUN --mount=type=cache,target=/root/.cargo/registry \
    --mount=type=cache,target=/build/target \
    set -eu; mkdir -p /opt/bin; \
    for unit in ${CLI_UNITS}; do \
      if [ -f "$unit/Cargo.toml" ]; then \
        echo "building $unit"; \
        cargo build --release --locked --manifest-path "$unit/Cargo.toml" --target-dir /build/target; \
      fi; \
    done; \
    find /build/target/release -maxdepth 1 -type f -perm -u+x -exec cp {} /opt/bin/ \; ; \
    if [ -f infra/go.mod ]; then CGO_ENABLED=0 go -C infra build -trimpath -o /opt/bin/src-deploy ./cmd/src-deploy; fi; \
    ls -l /opt/bin

# ---------------------------------------------------------------------------
# runtime: light Alpine image with the CLIs, Bun and git. Repo mounted at /src.
FROM alpine:${ALPINE_VERSION} AS runtime
# hadolint ignore=DL3018
RUN apk add --no-cache ca-certificates git libgcc libstdc++ \
 && adduser -D -u 1000 dev
COPY --from=bun-alpine /usr/local/bin/bun /usr/local/bin/bun
COPY --from=builder /opt/bin/ /usr/local/bin/
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx
ENV SRC_ROOT=/src \
    AGENT_GUARD=off
WORKDIR /src
USER 1000:1000
CMD ["sh"]

# ---------------------------------------------------------------------------
# dev: heavy Arch Linux workstation image (Rust, Go, Bun, clang, cmake, ninja, gn-friendly).
FROM archlinux:${ARCH_TAG} AS dev
ARG RUST_TOOLCHAIN
ARG GO_VERSION
ARG BUN_VERSION
ARG TARGETARCH=amd64
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN pacman -Syu --noconfirm --needed \
      base-devel clang cmake git git-lfs lld ninja openssl pkgconf python rustup unzip which zsh \
 && pacman -Scc --noconfirm
ENV PATH=/root/.cargo/bin:/root/.bun/bin:/usr/local/go/bin:/root/.local/bin:${PATH}
RUN rustup default "${RUST_TOOLCHAIN}" && rustup component add rustfmt clippy rust-analyzer
RUN curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${TARGETARCH}.tar.gz" | tar -C /usr/local -xz
RUN curl -fsSL https://bun.sh/install | bash -s "bun-v${BUN_VERSION}"
COPY --from=builder /opt/bin/ /usr/local/bin/
ENV SRC_ROOT=/src \
    AGENT_GUARD=off
WORKDIR /src
CMD ["zsh"]
