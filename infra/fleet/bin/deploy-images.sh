#!/bin/bash
# Deploy images built by build-all to a runtime host (prd or fr2) from fr1: ghcr.io/aphrody-labs packages are private, so
# the pull happens on fr1 (job-local docker login with the gh token, never written to the target) and the image is
# streamed to the target (docker save | ssh docker load); the target needs no registry credential and no compiler.
# Then `compose up -d --wait --pull never` of the named services from the synced /srv/src checkout of the target.
#   deploy-images.sh <prd|fr2> <sha> <profile> <service...>      run on fr1:  ssh vps bash /srv/src/infra/fleet/bin/deploy-images.sh prd <sha> core ai-os-relay ai-os-gateway
# Rollback: the same command with the previous sha (its image stays on the target until pruned).
set -euo pipefail
HOST=${1:?host prd|fr2}; SHA=${2:?sha}; PROFILE=${3:?profile}; shift 3; SVCS=("$@"); [ ${#SVCS[@]} -gt 0 ] || { echo "no service" >&2; exit 2; }
case $HOST in prd) T=root@72.60.186.43 ;; fr2) T=root@51.255.162.6 ;; *) echo "host prd|fr2" >&2; exit 2 ;; esac
SSH=(ssh -o BatchMode=yes -o ConnectTimeout=15 "$T")
COMPOSE=/srv/src/infra/docker/compose.yaml
export DOCKER_CONFIG; DOCKER_CONFIG=$(mktemp -d); trap 'rm -rf "$DOCKER_CONFIG"' EXIT
gh auth token | docker login ghcr.io -u "$(gh api user --jq .login)" --password-stdin >/dev/null 2>&1
imgs=$(SRC_TAG=$SHA SRC_SECRETS_ENV=/dev/null docker compose -f $COMPOSE --profile "$PROFILE" config --images "${SVCS[@]}" | sort -u)
for img in $imgs; do
  echo "ship $img -> $HOST"
  docker pull -q "$img" >/dev/null
  docker save "$img" | "${SSH[@]}" docker load | tail -1
done
"${SSH[@]}" "cd /srv/src && SRC_TAG=$SHA docker compose -f $COMPOSE --profile $PROFILE up -d --wait --pull never --no-deps ${SVCS[*]}"
"${SSH[@]}" "docker ps --format '{{.Names}} {{.Image}} {{.Status}}' | grep -E '$(IFS='|'; echo "${SVCS[*]}")' || true"
