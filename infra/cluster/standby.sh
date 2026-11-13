#!/bin/sh
# aphrody standby on fr1/fr2 (deploy.toml [cluster.services.aphrody] standby = HAProxy backup servers, used only when
# prd is down). Same image as prd's aphrody-src-aphrody-1 (docker save on prd -> docker load over the mesh ssh, no
# registry pull: the smoke tag is local to prd), started with no secrets env (the site does not need any to render).
# Usage (from the PC): sh infra/cluster/standby.sh fr1|fr2      re-run after each aphrody deploy on prd.
# Rollback (one line): ssh <m> 'cd /srv/aphrody-src && sudo docker compose --profile core rm -sf aphrody'
set -eu
m=${1:?usage: standby.sh fr1|fr2}
case $m in fr1) a=vps; f="-f compose.yaml -f compose.capped.yaml";; fr2) a=cdn; f="-f compose.yaml";; *) exit 2;; esac
here=$(cd "$(dirname "$0")" && pwd)
img=ghcr.io/aphrody-dev/aphrody:smoke
want=$(timeout 30 ssh -o BatchMode=yes prd "docker inspect aphrody-src-aphrody-1 --format '{{.Image}}'")
have=$(timeout 30 ssh -o BatchMode=yes "$a" "sudo docker image inspect $img --format '{{.Id}}' 2>/dev/null" || true)
if [ "$want" != "$have" ]; then
  echo "copy $img ($want) prd -> $m"
  timeout 900 ssh -o BatchMode=yes prd "docker save $img | zstd -3 -T0 -q | ssh -o BatchMode=yes ubuntu@$m-mesh 'zstd -dq | sudo docker load'"
fi
timeout 60 ssh -o BatchMode=yes "$a" "sudo tee /srv/aphrody-src/compose.capped.yaml >/dev/null" < "$here/compose.capped.yaml"
timeout 300 ssh -o BatchMode=yes "$a" "cd /srv/aphrody-src && sudo env SRC_REGISTRY=ghcr.io/aphrody-dev SRC_TAG=smoke SRC_SECRETS_ENV=/etc/aphrody/none.env docker compose $f --profile core up -d --no-deps aphrody >/dev/null 2>&1; sleep 5; curl -s -o /dev/null -w '$m standby %{http_code}\n' -H 'Host: aphrody.com' http://127.0.0.1:23000/"
