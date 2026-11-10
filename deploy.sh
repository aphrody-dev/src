#!/usr/bin/env sh
# Sovereign One-Click POSIX Deployment Entrypoint (`git clone` -> Live Production)
# Powered by Go 1.27 (`src-deploy`) + Daemonless OCI v1.1 + Caddy HTTP/3 Blue/Green
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
TARGET="${1:---all}"
PROVIDER="${PROVIDER:-self-hosted}"
SLOT="${SLOT:-blue}"
MODE="${MODE:---dry-run}"

BIN="${HOME}/.local/bin/src-deploy"
if [ -f "${HOME}/.local/bin/src-deploy.exe" ]; then
  BIN="${HOME}/.local/bin/src-deploy.exe"
elif [ ! -x "$BIN" ]; then
  mkdir -p "${HOME}/.local/bin"
  (cd "${ROOT_DIR}/infra" && CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o "$BIN" ./cmd/src-deploy)
fi

"$BIN" caddyfile --out "${ROOT_DIR}/infra/generated/Caddyfile"

if [ "$TARGET" = "--all" ] || [ "$TARGET" = "all" ]; then
  exec "$BIN" up --all "$MODE" --provider "$PROVIDER" --slot "$SLOT"
else
  exec "$BIN" up "$TARGET" "$MODE" --provider "$PROVIDER" --slot "$SLOT"
fi
