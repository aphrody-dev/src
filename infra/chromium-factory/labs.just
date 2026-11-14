# Labs (merged from C:\labs): conformance (ay conformance), Lore, Chromium factory.

# ay + conformance harness build.
[group('labs')]
lab-build:
    cargo build -p aphrody -p aphrody-conformance

# Distribution build of ay: fat LTO, 1 CGU, stripped.
[group('labs')]
lab-dist:
    cargo build --release -p aphrody

# Fast local optimized build with debug assertions.
[group('labs')]
lab-iter:
    cargo build --profile iteration -p aphrody

# Run ay from source.
[group('labs')]
lab-dev *args:
    cargo run -p aphrody -- {{args}}

# Conformance suites (writes conformance/results/).
[group('labs')]
lab-conformance *suites:
    cargo run -p aphrody -- conformance --fetch {{suites}}

# Refresh Chrome Stable/Beta/Dev/Canary pins (ay conformance channels).
[group('labs')]
lab-channels:
    cargo run -q -p aphrody -- conformance channels

# Re-absorb Lore from aphrody-labs/lore.
[group('labs')]
lab-lore-sync:
    sh tools/labs-scripts/absorb-lore.sh

# Deploy the Lore server binary to prd (systemd unit loreserver).
[group('labs')]
lab-deploy-loreserver:
    cargo build --release -p lore-server --target x86_64-unknown-linux-gnu
    scp target/x86_64-unknown-linux-gnu/release/loreserver prd:/opt/lore/bin/loreserver.new
    ssh prd 'mv /opt/lore/bin/loreserver.new /opt/lore/bin/loreserver && systemctl restart loreserver && sleep 3 && curl -fsS -o /dev/null -w "health %{http_code}\n" http://10.200.77.5:41339/health_check'

# Deploy Chromium factory scripts, args and units to fr1.
[group('labs')]
lab-factory-deploy:
    ssh vps 'mkdir -p /srv/chromium/factory/scripts /srv/chromium/factory/third_party /srv/chromium/factory/args'
    scp -q infra/chromium-factory/chromium-factory.sh infra/chromium-factory/cros-factory.sh vps:/srv/chromium/factory/
    scp -q infra/chromium-factory/args/*.gn vps:/srv/chromium/factory/args/
    scp -q tools/labs-scripts/chrome-channels.sh vps:/srv/chromium/factory/scripts/
    scp -q third_party/chrome-channels.toml vps:/srv/chromium/factory/third_party/
    scp -q infra/chromium-factory/systemd/chromium-factory.* vps:/tmp/
    ssh vps 'sudo mv /tmp/chromium-factory.service /tmp/chromium-factory.timer /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable chromium-factory.timer'

# Run a factory step on fr1 as a managed unit: sync | build | publish | all.
[group('labs')]
lab-factory step="all" channel="stable":
    ssh vps 'sudo systemd-run --unit=chromium-factory-{{step}} --uid=ubuntu --gid=ubuntu -p Nice=10 -p WorkingDirectory=/srv/chromium -E HOME=/home/ubuntu /srv/chromium/factory/chromium-factory.sh {{step}} {{channel}}'

# Factory status and last log lines.
[group('labs')]
lab-factory-status:
    ssh vps 'systemctl list-units "chromium-factory*" --all --no-pager; journalctl -u "chromium-factory*" -n 15 --no-pager; df -h /srv | tail -1'

# Download the latest published labs_agent build from R2.
[group('labs')]
lab-factory-fetch version:
    rclone copyto r2-chromium:aphrody-chromium/labs_agent/{{version}}/linux-x64.tar.zst target/labs_agent-{{version}}-linux-x64.tar.zst

# Smallest ay binary: profile min + rebuilt std with immediate-abort.
[group('labs')]
lab-min:
    cargo build --profile min -p aphrody -Zbuild-std=std,panic_abort --target x86_64-pc-windows-msvc
