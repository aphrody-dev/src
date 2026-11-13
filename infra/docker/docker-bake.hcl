# Image matrix for src (docker buildx bake). Context = repo root, Dockerfile = infra/docker/Dockerfile.
#   docker buildx bake -f infra/docker/docker-bake.hcl                  amd64+arm64 to GHCR (needs `docker login ghcr.io`)
#   docker buildx bake -f infra/docker/docker-bake.hcl --set '*.platform=linux/amd64' --load smoke
#   docker buildx bake -f infra/docker/docker-bake.hcl products          shenron runtime (its own Dockerfile)
# Pins mirror packages/machine/toolchains.lock.toml. Cache: registry (ghcr.io/aphrody-dev/cache:<target>), mode=max,
# so CI runners and prd share the cargo-chef dependency layer.

variable "REGISTRY" { default = "ghcr.io/aphrody-dev" }
variable "TAG" { default = "dev" }
variable "PLATFORMS" { default = "linux/amd64,linux/arm64" }
variable "CARGO_PROFILE" { default = "release" }
variable "PUSH_CACHE" { default = "false" }

group "default" { targets = ["services", "runtime"] }
# yolo is not in the groups: it needs packages/google-design/upstream (local clones, not in git). Build it from a full workstation checkout.
group "services" { targets = ["ai-os", "aphrody", "r2-site", "api-gateway", "loreserver", "r3d", "rust-stack"] }
group "bun" { targets = ["ai-os", "aphrody", "r2-site", "api-gateway"] }
group "rust" { targets = ["loreserver", "r3d", "rust-stack", "runtime"] }
group "smoke" { targets = ["services"] }
group "products" { targets = ["shenron"] }

target "_common" {
  context = "."
  dockerfile = "infra/docker/Dockerfile"
  platforms = split(",", PLATFORMS)
  args = {
    ALPINE_VERSION = "3.23"
    BUN_VERSION = "1.4.4"
    GO_VERSION = "1.27.4"
    JUST_VERSION = "1.59.0"
    RUST_TOOLCHAIN = "nightly-2026-11-12"
    ZIG_VERSION = "0.17.1"
    CARGO_CHEF_VERSION = "0.1.77"
    CARGO_ZIGBUILD_VERSION = "0.24.1"
    CARGO_PROFILE = CARGO_PROFILE
  }
  labels = {
    "org.opencontainers.image.source" = "https://github.com/aphrody-dev/src"
    "org.opencontainers.image.revision" = TAG
    "org.opencontainers.image.licenses" = "MIT OR Apache-2.0"
  }
  attest = ["type=provenance,mode=min", "type=sbom"]
}

# One function-free target per image keeps `--set <name>.x=y` overrides obvious.
target "ai-os" {
  inherits = ["_common"]
  target = "ai-os"
  tags = ["${REGISTRY}/ai-os:${TAG}", "${REGISTRY}/ai-os:latest"]
  cache-from = ["type=registry,ref=${REGISTRY}/cache:bun"]
  cache-to = PUSH_CACHE == "true" ? ["type=registry,ref=${REGISTRY}/cache:bun,mode=max"] : []
}
target "aphrody" {
  inherits = ["ai-os"]
  target = "aphrody"
  tags = ["${REGISTRY}/aphrody:${TAG}", "${REGISTRY}/aphrody:latest"]
}
target "yolo" {
  inherits = ["ai-os"]
  target = "yolo"
  tags = ["${REGISTRY}/yolo:${TAG}", "${REGISTRY}/yolo:latest"]
}
target "r2-site" {
  inherits = ["ai-os"]
  target = "r2-site"
  tags = ["${REGISTRY}/r2-site:${TAG}", "${REGISTRY}/r2-site:latest"]
}
target "api-gateway" {
  inherits = ["ai-os"]
  target = "api-gateway"
  tags = ["${REGISTRY}/api-gateway:${TAG}", "${REGISTRY}/api-gateway:latest"]
}

target "loreserver" {
  inherits = ["_common"]
  target = "loreserver"
  tags = ["${REGISTRY}/loreserver:${TAG}", "${REGISTRY}/loreserver:latest"]
  cache-from = ["type=registry,ref=${REGISTRY}/cache:rust"]
  cache-to = PUSH_CACHE == "true" ? ["type=registry,ref=${REGISTRY}/cache:rust,mode=max"] : []
}
target "r3d" {
  inherits = ["loreserver"]
  target = "r3d"
  tags = ["${REGISTRY}/r3d:${TAG}", "${REGISTRY}/r3d:latest"]
}
target "rust-stack" {
  inherits = ["loreserver"]
  target = "rust-stack"
  tags = ["${REGISTRY}/rust-stack:${TAG}", "${REGISTRY}/rust-stack:latest"]
}
target "runtime" {
  inherits = ["loreserver"]
  target = "runtime"
  tags = ["${REGISTRY}/src-runtime:${TAG}", "${REGISTRY}/src-runtime:latest"]
}
target "dev" {
  inherits = ["_common"]
  target = "dev"
  platforms = ["linux/amd64"] # archlinux images are amd64-only upstream
  tags = ["${REGISTRY}/src-dev:${TAG}", "${REGISTRY}/src-dev:latest"]
}

# Products: built from their own Dockerfiles, sources untouched. amd64 (their native deps are x64-only).
# rosegriffon builds through its compose (build secret rg_env): `just docker-products`.
# Packages the sealed dist/server + dist/bot produced by apps/shenron/docker-bake.hcl (lanes) first.
target "shenron" {
  context = "apps/shenron"
  dockerfile = "deploy/docker/Dockerfile"
  platforms = ["linux/amd64"]
  args = { SHENRON_REVISION = TAG }
  tags = ["${REGISTRY}/shenron:${TAG}"]
}
