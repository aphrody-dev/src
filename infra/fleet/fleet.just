# Fleet (fr1, prd, fr2): caches, bootstrap, setup, resilience, build-all, CI on fr1 (imported by the root justfile).

# Build caches of the PC and fr1/fr2/prd (docs/infra/CACHE.md, infra/fleet/cache.toml): sizes, free disk, sccache hits
[group('fleet')]
cache-status *args:
    bun "{{root}}/infra/fleet/cache.ts" status {{args}}

# Enforce cache caps: PC per cache.toml, VPS through fleet-tune.sh clean (tune.conf); --dry-run to preview
[group('fleet')]
cache-gc *args:
    bun "{{root}}/infra/fleet/cache.ts" gc {{args}}

# fr1 download caches as reproducible tar.zst (BLAKE3-named) to fr2 over WireGuard, or --r2; --dry-run to preview
[group('fleet')]
cache-sync *args:
    bun "{{root}}/infra/fleet/cache.ts" sync {{args}}

# The jobs of ci.yml and judge.yml in parallel in this checkout (cargo jobs only on fr1: usage: just ci-local [--only gates,suites,rust,deny,arch,tokens])
[group('fleet')]
ci-local *args:
    bun "{{root}}/infra/fleet/ci-local.ts" {{args}}

# Full ci-local on fr1 in /srv/src (the synced main; push first)
[group('fleet')]
ci-local-fr1 *args:
    timeout 7200 ssh vps 'cd /srv/src && sudo systemctl start src-checkout-update.service; bun install --frozen-lockfile >/dev/null && bun infra/fleet/ci-local.ts {{args}}'

# actionlint over every workflow (runs on fr1: no Windows build of the binary is installed)
[group('fleet')]
ci-lint:
    tar -cf - -C "{{root}}" .github | timeout 120 ssh vps 'rm -rf /tmp/al-lint && mkdir /tmp/al-lint && tar -xf - -C /tmp/al-lint && cd /tmp/al-lint && actionlint -ignore SC2016 -ignore SC2034 -ignore SC2086 -ignore SC2129'

# Everything on fr1 from the synced /srv/src: images pushed to ghcr.io/aphrody-labs, ay, game wasm, site, artifacts in
# /srv/artifacts/builds/<sha> (+ R2). Prints BUILD_SHA; then: SRC_TAG=<sha> just deploy core prd; SRC_TAG=<sha> just deploy edge fr2
[group('fleet')]
build-all targets="default" *args:
    timeout 14400 ssh vps 'sudo systemd-run --unit=build-all --uid=ubuntu --collect --wait --pipe --property=Nice=10 --setenv=HOME=/home/ubuntu --setenv=TARGETS="{{targets}}" bash /srv/src/infra/fleet/bin/build-all.sh {{args}}'

# Ship build-all images to prd or fr2 from fr1 (ghcr packages are private: pulled on fr1, streamed to the target) and
# compose up the named services with --wait (usage: just deploy-images prd <sha> core ai-os-relay ai-os-gateway)
[group('fleet')]
deploy-images host sha profile *services:
    timeout 1800 ssh vps 'bash /srv/src/infra/fleet/bin/deploy-images.sh {{host}} {{sha}} {{profile}} {{services}}'

# Toolchain bootstrap of a fleet host from tools.toml (usage: just fleet-bootstrap prd|fr1|fr2)
[group('fleet')]
fleet-bootstrap role:
    tar -cf - -C "{{root}}" infra/fleet/bootstrap/common.sh infra/fleet/bootstrap/{{role}}.sh infra/fleet/bin/heavy.sh infra/fleet/sysctl infra/agents/install.sh tools.toml | timeout 120 ssh {{ if role == "fr1" { "vps" } else if role == "fr2" { "cdn" } else { "prd" } }} 'rm -rf /tmp/aphrody-bootstrap && mkdir -p /tmp/aphrody-bootstrap && tar -xf - -C /tmp/aphrody-bootstrap'
    timeout 1800 ssh {{ if role == "fr1" { "vps" } else if role == "fr2" { "cdn" } else { "prd" } }} 'cd /tmp/aphrody-bootstrap && LOCK=$PWD/tools.toml sh infra/fleet/bootstrap/{{role}}.sh'

# One src checkout (/srv/src, full, main) + 5-min sync timer + role extras on a fleet host, idempotent
# (usage: just fleet-setup fr1|fr2|prd [runners=6]); dependencies first through just fleet-bootstrap <role>.
[group('fleet')]
fleet-setup role runners="6":
    tar -cf - -C "{{root}}" infra/fleet/bin infra/fleet/systemd infra/fleet/{{role}}/resilience.conf | timeout 120 ssh {{ if role == "fr1" { "vps" } else if role == "fr2" { "cdn" } else { "prd" } }} 'rm -rf /tmp/aphrody-setup && mkdir -p /tmp/aphrody-setup/infra/fleet && tar -xf - -C /tmp/aphrody-setup'
    timeout 900 ssh {{ if role == "fr1" { "vps" } else if role == "fr2" { "cdn" } else { "prd" } }} 'sudo bash /tmp/aphrody-setup/infra/fleet/bin/fleet-setup.sh {{role}} {{runners}}'

# Real reboot proof of one fleet host, the others keep serving (docs/infra/RESILIENCE.md; usage: just fleet-resilience-proof fr2)
[group('fleet')]
fleet-resilience-proof host:
    sh "{{root}}/infra/fleet/bin/fleet-resilience-proof.sh" {{host}}

# Fleet hosts + public endpoints health, exit 1 if anything is down (docs/VERSIONING.md)
[group('fleet')]
ping:
    sh "{{root}}/infra/fleet/bin/fleet-ping.sh"

# Survive reboot/crash/kill on every host (infra/fleet/<host>/resilience.conf; usage: just fleet-resilience apply|check [pc fr2 prd fr1])
[group('fleet')]
fleet-resilience mode="check" *hosts:
    bash "{{root}}/infra/fleet/bin/fleet-resilience-remote.sh" {{ if mode =~ '^(apply|check)$' { mode } else { error("mode: apply|check") } }} {{hosts}}

# Decrypt the latest R2 backup of a host on that host and check it (files, SQLite integrity; usage: just fleet-restore-test prd)
[group('fleet')]
fleet-restore-test host:
    bash "{{root}}/infra/fleet/bin/fleet-resilience-remote.sh" restore-test {{host}}

# Rebuild a reinstalled host from zero: sshd, bootstrap, R2 state, fleet layer, cluster, runner (usage: just fleet-rebuild fr2 [--dry-run])
[group('fleet')]
fleet-rebuild host *flags:
    bash "{{root}}/infra/fleet/bin/fleet-rebuild.sh" {{host}} {{flags}}

# Install units captured from live hosts (infra/fleet/<role>/orphans; docs/infra/PROD-MAP.md); usage: just fleet-orphans prd|fr1
[group('fleet')]
fleet-orphans role:
    sh "{{root}}/infra/fleet/bin/orphans-install.sh" {{role}}
