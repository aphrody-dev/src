#!/bin/bash
# build-all on fr1 (the factory): from /srv/src at one commit, builds every deployable of src with the pinned toolchains and
# publishes it: container images (docker buildx bake, builder `aphrody`) pushed to ghcr.io/aphrody-labs, the ay binary,
# the game wasm bundle and the aphrody site into /srv/artifacts/builds/<sha>/ (+ rclone to R2 bucket aphrody-dist when
# the remote exists). Heavy steps go through aphrody-heavy (slot + load gate). Deploy afterwards:
#   SRC_TAG=<sha> just deploy core prd ; SRC_TAG=<sha> just deploy edge fr2     (docs/infra/DEPLOY.md)
#   build-all.sh [--no-sync] [--steps images,ay,wasm,site]    env: TARGETS=default, PLATFORMS=linux/amd64, ARTIFACTS=/srv/artifacts
# yolo is not in the default set: its build needs assets/brand/gen (generated, outside the Docker context).
# Windows-only products (apps/nt, unixwin, l2l) and the Craft Apps captures are out of scope here (nt.yml, game.yml, assets.yml).
set -euo pipefail
SRC=${SRC_CHECKOUT:-/srv/src}; ART=${ARTIFACTS:-/srv/artifacts}; STEPS=images,ay,wasm,site; SYNC=1
while [ $# -gt 0 ]; do case $1 in --no-sync) SYNC=0 ;; --steps) STEPS=$2; shift ;; *) echo "usage: $0 [--no-sync] [--steps list]" >&2; exit 2 ;; esac; shift; done
step() { case ",$STEPS," in *",$1,"*) return 0 ;; *) return 1 ;; esac; }
log() { printf '[build-all %s] %s\n' "$(date -u +%H:%M:%S)" "$*"; }
export PATH="$HOME/.cargo/bin:$HOME/.bun/bin:/usr/local/bin:$PATH" HEAVY_WAIT_MAX=${HEAVY_WAIT_MAX:-7200}
[ "$SYNC" = 0 ] || sudo systemctl start src-checkout-update.service 2>/dev/null || /usr/local/bin/src-checkout-update.sh || true
cd "$SRC"
sha=$(git rev-parse --short=12 HEAD); full=$(git rev-parse HEAD); OUT=$ART/builds/$sha; mkdir -p "$OUT"
log "commit $sha -> $OUT"
echo "$sha" > "$OUT/COMMIT"
bun scripts/toolchain.ts install >/dev/null

if step images; then
  log "images: ${TARGETS:-default} (${PLATFORMS:-linux/amd64})"
  export DOCKER_CONFIG=$(mktemp -d); trap 'rm -rf "$DOCKER_CONFIG"' EXIT
  cp -a "$HOME/.docker/buildx" "$DOCKER_CONFIG/" 2>/dev/null || true
  gh auth token | docker login ghcr.io -u "$(gh api user --jq .login)" --password-stdin >/dev/null
  TAG=$sha REGISTRY=ghcr.io/aphrody-labs PLATFORMS=${PLATFORMS:-linux/amd64} PUSH_CACHE=true \
    aphrody-heavy docker buildx bake --builder aphrody -f infra/docker/docker-bake.hcl --push --progress plain ${TARGETS:-default} \
    2>&1 | tail -40
  docker buildx imagetools inspect "ghcr.io/aphrody-labs/aphrody:$sha" >/dev/null && log "ghcr.io/aphrody-labs/*:$sha pushed"
fi

if step ay; then
  log "ay (release)"
  aphrody-heavy cargo build --release -p aphrody
  install -m 0755 "${CARGO_TARGET_DIR:-$HOME/build/target}/release/ay" "$OUT/ay-linux-x86_64"
fi

if step wasm; then
  log "game wasm32 bundle"
  export RUSTUP_TOOLCHAIN=nightly-2026-11-12 RUSTC_WRAPPER=
  rustup target add wasm32-unknown-unknown --toolchain "$RUSTUP_TOOLCHAIN" >/dev/null
  W=${CARGO_TARGET_DIR:-$HOME/build/target}-wasm
  CARGO_TARGET_DIR=$W CARGO_PROFILE_RELEASE_STRIP=none aphrody-heavy cargo build -p game --bin game --target wasm32-unknown-unknown --release
  v=$(cargo metadata --format-version 1 | jaq -r '[.packages[] | select(.name == "wasm-bindgen") | .version][0]')
  [ "$(wasm-bindgen --version 2>/dev/null)" = "wasm-bindgen $v" ] || aphrody-heavy cargo install --locked --root "$HOME/.cache/wb-$v" wasm-bindgen-cli --version "$v"
  export PATH="$HOME/.cache/wb-$v/bin:$PATH"
  mkdir -p "$OUT/game-web"
  wasm-bindgen --target web --no-typescript --out-dir "$OUT/game-web" --out-name game "$W/wasm32-unknown-unknown/release/game.wasm"
  unset RUSTUP_TOOLCHAIN
fi

if step site; then
  log "aphrody site"
  bun install --frozen-lockfile >/dev/null
  [ -d "$OUT/game-web" ] && { mkdir -p target/game-web; cp -a "$OUT/game-web/." target/game-web/; }
  GAME_WEB_DIR=$PWD/target/game-web bun run --cwd apps/aphrody build.ts
  tar -C apps/aphrody -cf - dist | zstd -q -T4 -o "$OUT/aphrody-dist.tar.zst"
fi

( cd "$OUT" && find . -type f ! -name MANIFEST.b3 -print0 | sort -z | xargs -0 b3sum > MANIFEST.b3 2>/dev/null || find . -type f ! -name MANIFEST.b3 -print0 | xargs -0 sha256sum > MANIFEST.sha256 )
if rclone listremotes 2>/dev/null | grep -qx 'r2:'; then
  rclone copy "$OUT" "r2:aphrody-dist/builds/$sha" --s3-no-check-bucket --quiet && log "artifacts -> r2:aphrody-dist/builds/$sha" || log "R2 upload failed, artifacts stay in $OUT"
fi
log "done $sha ($full)"; du -sh "$OUT"; ls "$OUT"
echo "BUILD_SHA=$sha"
