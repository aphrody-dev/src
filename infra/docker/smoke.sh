#!/bin/sh
# Smoke test of every src image: start it, wait for its HEALTHCHECK to report healthy, print the probe, remove it.
#   SRC_TAG=<tag> sh infra/docker/smoke.sh [image ...]       (DOCKER=docker.exe from Windows; context = prd)
set -eu
D=${DOCKER:-docker}
REG=${SRC_REGISTRY:-ghcr.io/aphrody-labs}
TAG=${SRC_TAG:-latest}
[ $# -gt 0 ] || set -- ai-os ai-os-gateway api-gateway loreserver r3d rust-stack
fail=0
for img in "$@"; do
  name=smoke-$img-$$; extra=""; ref=$REG/$img:$TAG
  case $img in
    ai-os-gateway) ref=$REG/ai-os:$TAG; extra="-e PORT=4000 -e AGENT_MODEL=echo/echo"; cmd="bun src/cli.ts gateway" ;;
    api-gateway) extra="-e S3_ENDPOINT=http://127.0.0.1:9 -e S3_ACCESS_KEY_ID=x -e S3_SECRET_ACCESS_KEY=x"; cmd="" ;;
    *) cmd="" ;;
  esac
  # shellcheck disable=SC2086
  $D run -d --name "$name" --read-only --tmpfs /tmp --tmpfs /home/bun:uid=1000,gid=1000 --tmpfs /app/var:uid=1000,gid=1000 --cap-drop ALL --security-opt no-new-privileges:true \
    --health-interval 2s --health-start-period 5s $extra "$ref" $cmd >/dev/null
  st=starting; i=0
  while [ "$st" = starting ] && [ $i -lt 60 ]; do sleep 2; i=$((i + 1)); st=$($D inspect -f '{{.State.Health.Status}}' "$name" 2>/dev/null || echo gone); done
  user=$($D inspect -f '{{.Config.User}}' "$name"); size=$($D image inspect -f '{{.Size}}' "$ref")
  printf '%-14s %-9s user=%-12s size=%sMB\n' "$img" "$st" "${user:-root}" "$((size / 1048576))"
  [ "$st" = healthy ] || { fail=1; $D logs --tail 20 "$name" 2>&1 | sed 's/^/    /'; }
  $D rm -f "$name" >/dev/null
done
exit $fail
