# Containers (upstream only: docker buildx bake + compose; docs/infra/DEPLOY.md).
# Builds run in CI (images.yml, GitHub-hosted); fr1 is Chromium/LLVM only; prd and fr2 only pull and run. The PC has no local engine:
# docker contexts fr1 (ssh://vps), prd (ssh://prd), fr2 (ssh://cdn).

# Deploy = compose pull + up --wait on a host (`ay deploy <sub>` runs `just docker-<sub>`; docs/infra/DEPLOY.md)
[group('docker')]
deploy profile="core" ctx="prd":
    just docker-up {{profile}} {{ctx}}

# --- Containers (upstream only: docker buildx bake + compose; docs/infra/DEPLOY.md) ---
# Builds run in CI (images.yml, GitHub-hosted); fr1 is Chromium/LLVM only; prd and fr2 only pull and run. The PC has no local engine:
# docker contexts fr1 (ssh://vps), prd (ssh://prd), fr2 (ssh://cdn).
docker := if os() == "windows" { "docker.exe" } else { "docker" }
docker_tag := env("SRC_TAG", `git rev-parse --short=12 HEAD`)
docker_compose := docker + " compose -f " + root + "/infra/docker/compose.yaml"

# Build + push src images (amd64+arm64) to ghcr.io/aphrody-labs in CI with GITHUB_TOKEN (usage: just docker-build, just docker-build bun)
[group('docker')]
docker-build targets="default" ref="main":
    gh workflow run images.yml --repo aphrody-labs/src --ref "{{ if ref =~ '^[A-Za-z0-9._/-]+$' { ref } else { error("invalid ref") } }}" -f "targets={{ if targets =~ '^[A-Za-z0-9._ -]+$' { targets } else { error("invalid targets") } }}"
    sleep 5; gh run watch --repo aphrody-labs/src --exit-status "$(gh run list --repo aphrody-labs/src --workflow images.yml --event workflow_dispatch --limit 1 --json databaseId --jq '.[0].databaseId')"

# amd64 build of a pushed commit ON fr1 (factory, git context: nothing uploaded from the PC), loaded there, then
# health-checked; aphrody-heavy refreshed first (sudo install reads a mktemp file: install cannot read /dev/stdin on fr1).
# Full multi-arch build + push stays in images.yml (usage: just docker-smoke, just docker-smoke bun main iteration)
[group('docker')]
docker-smoke targets="smoke" ref="main" profile="release":
    timeout 900 ssh vps 't=$(mktemp) && cat >"$t" && sudo install -m 0755 "$t" /usr/local/bin/aphrody-heavy; rc=$?; rm -f "$t"; exit $rc' < "{{root}}/infra/fleet/bin/heavy.sh"
    timeout 7200 ssh vps 'TAG=smoke CARGO_PROFILE={{ if profile =~ '^[a-z-]+$' { profile } else { error("invalid profile") } }} CARGO_BUILD_JOBS=4 aphrody-heavy docker buildx bake --builder aphrody "https://github.com/aphrody-labs/src.git#{{ if ref =~ '^[A-Za-z0-9._/-]+$' { ref } else { error("invalid ref") } }}" -f infra/docker/docker-bake.hcl --set "*.platform=linux/amd64" --set "*.attest=" --set "*.cache-from=" --load --progress quiet {{ if targets =~ '^[A-Za-z0-9._ -]+$' { targets } else { error("invalid targets") } }}'
    timeout 900 ssh vps 'SRC_TAG=smoke sh -s' < "{{root}}/infra/docker/smoke.sh"

# Deploy the compose stack: profile core on prd, edge on fr2 (usage: just docker-up, just docker-up edge fr2, SRC_TAG=<sha> to roll back)
[group('docker')]
docker-up profile="core" ctx="prd":
    SRC_TAG={{docker_tag}} {{docker}} --context {{ctx}} compose -f "{{root}}/infra/docker/compose.yaml" --profile {{profile}} pull
    SRC_TAG={{docker_tag}} {{docker}} --context {{ctx}} compose -f "{{root}}/infra/docker/compose.yaml" --profile {{profile}} up -d --wait --remove-orphans

# Stack status on a host
[group('docker')]
docker-ps profile="core" ctx="prd":
    {{docker}} --context {{ctx}} compose -f "{{root}}/infra/docker/compose.yaml" --profile {{profile}} ps

# Products with their own container flows (sources untouched): shenron lanes + runtime, rosegriffon compose build
[group('docker')]
docker-products:
    cd "{{root}}/apps/shenron" && {{docker}} --context fr1 buildx bake -f docker-bake.hcl lanes
    cd "{{root}}" && TAG={{docker_tag}} {{docker}} --context fr1 buildx bake -f infra/docker/docker-bake.hcl --push products
    RG_REGISTRY=ghcr.io/aphrody-labs/rosegriffon RG_TAG={{docker_tag}} {{docker}} --context fr1 compose -f "{{root}}/apps/rosegriffon/compose.yaml" build

# Arch Linux workstation shell with the monorepo mounted at /src
[group('docker')]
docker-shell:
    {{docker_compose}} --profile dev run --rm dev

# Alpine runtime shell (ay + Bun only)
[group('docker')]
docker-runtime:
    {{docker_compose}} --profile dev run --rm runtime

# Run any recipe inside the Arch dev container (usage: just docker-run verify-all)
[group('docker')]
docker-run recipe="verify-all":
    {{docker_compose}} --profile dev run --rm dev just {{recipe}}
