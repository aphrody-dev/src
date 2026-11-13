# syntax=docker/dockerfile:1
# Every deployable service of src as one multi-target Dockerfile (context = repo root).
#   docker buildx bake -f infra/docker/docker-bake.hcl            (all images, see `just docker-build`)
#   docker buildx build -f infra/docker/Dockerfile --target ai-os .
# No Debian anywhere (repo policy): Alpine runtimes, Arch for the heavy dev image.
# Pins: build args below = tools.toml (scripts/toolchains-lock.ts); bake passes them.
# Rust: cargo-chef dependency layer + cargo-zigbuild cross-compile on $BUILDPLATFORM to static musl
# (amd64 and arm64 from one native builder, no qemu). Bun: frozen lockfile, bundled server per app.
# Runtime images run as non-root, carry a HEALTHCHECK, never contain secrets (env at run time only).

ARG ALPINE_VERSION=3.23
ARG ARCH_TAG=base-devel
ARG BUN_VERSION=1.4.4
ARG GO_VERSION=1.27.4
ARG JUST_VERSION=1.59.0
ARG RUST_TOOLCHAIN=nightly-2026-11-12
ARG ZIG_VERSION=0.17.1
ARG ZIG_SHA256_AMD64=3581863e3cbcfd0fce0efc682ce7e9e93da96668a977791d356a26d2a7e9b17a
ARG ZIG_SHA256_ARM64=a1546d5646eb184437918d6635ca6b762a0e889eac09cef720ee7a1ed3fe7795
ARG CARGO_CHEF_VERSION=0.1.77
ARG CARGO_ZIGBUILD_VERSION=0.24.1
# release = fat LTO (production). iteration = no LTO, for quick smoke builds.
ARG CARGO_PROFILE=release
ARG RUST_PACKAGES="-p aphrody -p aphrody-lore-server -p ring3-agent -p rust-stack"
# Parallel rustc jobs (each runs -Zthreads=16 from .cargo/config.toml): keep low on a shared host (prd: 2).
ARG CARGO_BUILD_JOBS=4

FROM oven/bun:${BUN_VERSION}-alpine AS bun-alpine
FROM golang:${GO_VERSION}-alpine${ALPINE_VERSION} AS go-alpine

# =============================================================================================
# Rust toolchain (native to the build host).
FROM --platform=$BUILDPLATFORM alpine:${ALPINE_VERSION} AS rust-base
ARG RUST_TOOLCHAIN
ARG ZIG_VERSION
ARG ZIG_SHA256_AMD64
ARG ZIG_SHA256_ARM64
ARG CARGO_CHEF_VERSION
ARG CARGO_ZIGBUILD_VERSION
ARG BUILDARCH
# hadolint ignore=DL3018
RUN apk add --no-cache bash build-base clang cmake curl git linux-headers perl pkgconf protobuf-dev protoc python3 rustup xz
# RUSTUP_TOOLCHAIN overrides rust-toolchain.toml (chromium-157): Chromium ships no musl std, so the
# Alpine musl images keep the pinned nightly (docs/llvm/CHROMIUM-157-TOOLCHAIN.md, exceptions).
ENV RUSTUP_HOME=/opt/rustup CARGO_HOME=/opt/cargo PATH=/opt/cargo/bin:/opt/zig:$PATH \
    CARGO_NET_GIT_FETCH_WITH_CLI=true CARGO_TERM_COLOR=never RUSTC_WRAPPER= RUSTUP_TOOLCHAIN=${RUST_TOOLCHAIN}
RUN rustup-init -y --no-modify-path --profile minimal --default-toolchain "${RUST_TOOLCHAIN}" \
      --target x86_64-unknown-linux-musl,aarch64-unknown-linux-musl
RUN set -eu; case "${BUILDARCH}" in arm64) a=aarch64 s="${ZIG_SHA256_ARM64}";; *) a=x86_64 s="${ZIG_SHA256_AMD64}";; esac; \
    curl -fsSL -o /tmp/zig.tar.xz "https://ziglang.org/download/${ZIG_VERSION}/zig-${a}-linux-${ZIG_VERSION}.tar.xz"; \
    echo "${s}  /tmp/zig.tar.xz" | sha256sum -c -; mkdir -p /opt/zig; tar -xJf /tmp/zig.tar.xz -C /opt/zig --strip-components=1; rm /tmp/zig.tar.xz
RUN --mount=type=cache,id=cargo-registry,target=/opt/cargo/registry,sharing=locked \
    cargo install --locked "cargo-chef@${CARGO_CHEF_VERSION}" "cargo-zigbuild@${CARGO_ZIGBUILD_VERSION}" && rm -rf /opt/cargo/.package-cache
WORKDIR /build

# Recipe = every workspace manifest + lock: changes only when dependencies change.
FROM rust-base AS rust-plan
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY .cargo/config.toml .cargo/config.toml
COPY crates/ crates/
RUN cargo chef prepare --recipe-path /recipe.json

FROM rust-base AS rust-build
ARG TARGETARCH
ARG CARGO_PROFILE
ARG RUST_PACKAGES
ARG CARGO_BUILD_JOBS
ENV CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS}
COPY rust-toolchain.toml ./
COPY .cargo/config.toml .cargo/config.toml
COPY --from=rust-plan /recipe.json /recipe.json
# Dependencies only: this layer is reused (and exported to the registry cache) until Cargo.lock changes.
RUN --mount=type=cache,id=cargo-registry,target=/opt/cargo/registry,sharing=locked \
    --mount=type=cache,id=cargo-git,target=/opt/cargo/git,sharing=locked \
    t=$([ "$TARGETARCH" = arm64 ] && echo aarch64-unknown-linux-musl || echo x86_64-unknown-linux-musl); \
    cargo chef cook --zigbuild --profile "${CARGO_PROFILE}" --target "$t" ${RUST_PACKAGES} --recipe-path /recipe.json
COPY Cargo.toml Cargo.lock ./
COPY crates/ crates/
RUN --mount=type=cache,id=cargo-registry,target=/opt/cargo/registry,sharing=locked \
    --mount=type=cache,id=cargo-git,target=/opt/cargo/git,sharing=locked \
    set -eu; t=$([ "$TARGETARCH" = arm64 ] && echo aarch64-unknown-linux-musl || echo x86_64-unknown-linux-musl); \
    cargo zigbuild --locked --profile "${CARGO_PROFILE}" --target "$t" ${RUST_PACKAGES} --bins; \
    d=target/$t/$([ "${CARGO_PROFILE}" = dev ] && echo debug || echo "${CARGO_PROFILE}"); mkdir -p /out; \
    for b in ay loreserver r3d rust-stack; do cp "$d/$b" /out/; done; ls -l /out

# Static musl binaries on a minimal Alpine (busybox wget for the healthcheck, CA bundle, tzdata).
FROM alpine:${ALPINE_VERSION} AS rust-runtime
# hadolint ignore=DL3018
RUN apk add --no-cache ca-certificates tzdata && adduser -D -H -u 10001 -s /sbin/nologin app \
 && mkdir -p /data && chown app:app /data
WORKDIR /data
USER 10001:10001

# Lore server: QUIC/gRPC 41337, HTTP 41339 (/health_check). State in /data.
FROM rust-runtime AS loreserver
COPY --from=rust-build /out/loreserver /usr/local/bin/loreserver
COPY crates/lore-server/config/default.toml /etc/lore/config/default.toml
COPY --chmod=0644 <<'EOF' /etc/lore/config/docker.toml
[immutable_store.local]
path = "/data"

[mutable_store.local]
path = "/data"
EOF
ENV LORE_CONFIG_PATH=/etc/lore/config LORE_ENV=docker RUST_LOG=info
VOLUME /data
EXPOSE 41337/udp 41337 41339
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD wget -qO /dev/null http://127.0.0.1:41339/health_check || exit 1
ENTRYPOINT ["loreserver"]

# ring3-agent daemon (r3d): HTTP /ok on 8080.
FROM rust-runtime AS r3d
COPY --from=rust-build /out/r3d /usr/local/bin/r3d
COPY crates/ring3-agent/ring3-agent.toml /etc/r3d/ring3-agent.toml
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO /dev/null http://127.0.0.1:8080/ok || exit 1
ENTRYPOINT ["r3d", "-c", "/etc/r3d/ring3-agent.toml", "-b", "0.0.0.0:8080"]
CMD ["serve"]

# rust-stack gateway: HTTP /health on 4100, SQLite in /data.
FROM rust-runtime AS rust-stack
COPY --from=rust-build /out/rust-stack /usr/local/bin/rust-stack
EXPOSE 4100
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO /dev/null http://127.0.0.1:4100/health || exit 1
ENTRYPOINT ["rust-stack", "serve", "--host", "0.0.0.0", "--port", "4100", "--db", "/data/sovereign.sqlite3"]

# =============================================================================================
# Bun: workspace install (frozen lockfile), then per-app bundles.
FROM bun-alpine AS bun-deps
WORKDIR /src
COPY package.json bun.lock bunfig.toml ./
COPY --parents packages/*/package.json ./
RUN --mount=type=cache,id=bun-cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile --production --ignore-scripts

FROM bun-deps AS bun-build
COPY packages/ packages/
COPY apps/aphrody/ apps/aphrody/
# apps/aphrody/build.ts (page holding) lit l'organisation et des métriques mesurées sur l'arbre.
COPY docs/ALPHABET.md docs/ALPHABET.md
COPY docs/reviews/ docs/reviews/
COPY third_party/forks.txt third_party/forks.txt
COPY assets/brand/gen/ assets/brand/gen/
# apps/aphrody/src/os/client/gamescope.ts imports the WGSL shaders of the crate as text.
COPY crates/gamescope-wgsl/src/shaders/ crates/gamescope-wgsl/src/shaders/
COPY --parents crates/*/Cargo.toml ./
COPY apps/r2-site/ apps/r2-site/
COPY infra/cloudflare/workers/api-gateway/ infra/cloudflare/workers/api-gateway/
# Each app: its own build step (static dist/), then the server bundled into one file next to dist/.
RUN set -eu; mkdir -p /out; \
    for app in aphrody; do \
      (cd "apps/$app" && bun run build.ts) && mkdir -p "/out/$app" && \
      bun build "apps/$app/server.ts" --target=bun --minify --outfile "/out/$app/server.js" && \
      cp -r "apps/$app/dist" "/out/$app/dist" && mkdir -p "/out/$app/var" && { [ ! -d "apps/$app/public" ] || cp -r "apps/$app/public" "/out/$app/public"; }; \
    done; \
    bun build apps/r2-site/src/entry.vps.ts --target=bun --minify --outfile /out/r2-site/server.js; \
    mkdir -p /out/api-gateway && bun build infra/cloudflare/workers/api-gateway/selfhost.ts --target=bun --outfile /out/api-gateway/selfhost.js && \
    cp infra/cloudflare/workers/api-gateway/worker.js infra/cloudflare/workers/api-gateway/api.aphrody.com.toml /out/api-gateway/

FROM bun-alpine AS bun-runtime
ENV NODE_ENV=production HOST=0.0.0.0
WORKDIR /app
USER bun
# PORT/HEALTH_PATH come from each target; the probe is bun itself (no curl/wget needed).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD ["bun", "-e", "fetch(`http://127.0.0.1:${process.env.PORT}${process.env.HEALTH_PATH}`).then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"]

# @aphrody/ai-os: one image, two services (relay = default CMD, gateway = `bun src/cli.ts gateway`).
FROM bun-runtime AS ai-os
COPY --from=bun-deps --chown=bun:bun /src/node_modules /app/node_modules
COPY --chown=bun:bun packages/ai-os/ /app/
ENV RELAY_HOST=0.0.0.0 RELAY_PORT=8790 RELAY_TCP_PORT=8791 AGENT_HOST=0.0.0.0 AGENT_PORT=4000 \
    AGENT_HOME=/home/bun/.ai-os PORT=8790 HEALTH_PATH=/health
EXPOSE 8790 8791 4000
CMD ["bun", "src/relay/cli.ts", "serve"]

FROM bun-runtime AS aphrody
COPY --from=bun-build --chown=bun:bun /out/aphrody/ /app/
# var/ = SQLite search history (writable volume; the rest of the image stays read-only).
VOLUME /app/var
ENV PORT=3000 HEALTH_PATH=/ok APHRODY_DIST=/app/dist
EXPOSE 3000
CMD ["bun", "server.js"]

# yolo: build context = packages/ (design tokens, fonts and Material Symbols come from packages/design).
FROM bun-deps AS yolo-build
COPY packages/ packages/
COPY apps/yolo/ apps/yolo/
RUN cd apps/yolo && bun run build.ts && mkdir -p /out/yolo && bun build server.ts --target=bun --minify --outfile /out/yolo/server.js && cp -r dist /out/yolo/dist

FROM bun-runtime AS yolo
COPY --from=yolo-build --chown=bun:bun /out/yolo/ /app/
ENV PORT=3092 HEALTH_PATH=/ok
EXPOSE 3092
CMD ["bun", "server.js"]

# Portable large-file site (downloads/cdn): STORAGE=s3 + S3_BUCKET (deploy.toml [hosting.downloads|cdn].vps).
FROM bun-runtime AS r2-site
COPY --from=bun-build --chown=bun:bun /out/r2-site/ /app/
ENV PORT=8797 HEALTH_PATH=/health STORAGE=s3
EXPOSE 8797
CMD ["bun", "server.js"]

# api.aphrody.com worker self-hosted (infra/cloudflare/workers/api-gateway/selfhost.ts): R2 binding over S3.
FROM bun-runtime AS api-gateway
COPY --from=bun-build --chown=bun:bun /out/api-gateway/ /app/
ENV PORT=8080 HEALTH_PATH=/__health
EXPOSE 8080
CMD ["bun", "selfhost.js", "/app/api.aphrody.com.toml"]

# =============================================================================================
# CLI runtime (ay + bun + git) for CI jobs and ops; repo bind-mounted at /src.
FROM alpine:${ALPINE_VERSION} AS runtime
# hadolint ignore=DL3018
RUN apk add --no-cache ca-certificates git libgcc libstdc++ && adduser -D -u 1000 dev
COPY --from=bun-alpine /usr/local/bin/bun /usr/local/bin/bun
COPY --from=rust-build /out/ay /usr/local/bin/ay
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx
ENV SRC_ROOT=/src AGENT_GUARD=off
WORKDIR /src
USER 1000:1000
HEALTHCHECK NONE
CMD ["sh"]

# Heavy Arch Linux workstation image (Rust, Go, Bun, clang/lld, cmake, ninja, .NET, uv); amd64 only upstream.
FROM archlinux:${ARCH_TAG} AS dev
ARG RUST_TOOLCHAIN
ARG GO_VERSION
ARG BUN_VERSION
SHELL ["/bin/bash", "-o", "pipefail", "-c"]
RUN pacman -Syu --noconfirm --needed \
      base-devel clang lld llvm cmake ninja git git-lfs openssl pkgconf protobuf python uv rustup unzip which zsh ffmpeg just sccache \
 && pacman -Scc --noconfirm
ENV PATH=/root/.cargo/bin:/root/.bun/bin:/usr/local/go/bin:/root/.local/bin:${PATH}
RUN rustup default "${RUST_TOOLCHAIN}" && rustup component add rustfmt clippy rust-analyzer rust-src
COPY --from=go-alpine /usr/local/go /usr/local/go
# glibc bun from the official release, verified against SHASUMS256.txt (no Debian-based oven/bun stage).
RUN base="https://github.com/oven-sh/bun/releases/download/bun-v${BUN_VERSION}" \
 && curl -fsSLo /tmp/bun-linux-x64.zip "${base}/bun-linux-x64.zip" \
 && curl -fsSL "${base}/SHASUMS256.txt" | grep " bun-linux-x64.zip$" | (cd /tmp && sha256sum -c -) \
 && unzip -q /tmp/bun-linux-x64.zip -d /tmp \
 && install -Dm755 /tmp/bun-linux-x64/bun /root/.bun/bin/bun \
 && rm -rf /tmp/bun-linux-x64 /tmp/bun-linux-x64.zip
ENV SRC_ROOT=/src AGENT_GUARD=off
WORKDIR /src
CMD ["zsh"]
