#!/bin/bash
# N GitHub Actions self-hosted runner instances of aphrody-labs/src on fr1, one systemd unit each (Restart=always),
# labels self-hosted,Linux,X64,fr1,build. Instance 1 is the historical ~/actions-runner (name fr1); 2..N are
# ~/actions-runner-K (name fr1-K) cloned from its binaries. Idempotent: configured instances are left as is.
#   gh runner registration token on stdin (only needed when an instance is missing), never printed:
#   gh api -X POST repos/aphrody-labs/src/actions/runners/registration-token --jq .token | ssh vps gh-runners.sh 4
set -euo pipefail
N=${1:-4}; REPO_URL=${REPO_URL:-https://github.com/aphrody-labs/src}; U=${RUNNER_USER:-ubuntu}; H=/home/$U
TOKEN=""; [ -t 0 ] || read -r TOKEN || true
for k in $(seq 2 "$N"); do
  d=$H/actions-runner-$k; name=fr1-$k
  if [ ! -f "$d/.runner" ]; then
    [ -n "$TOKEN" ] || { echo "gh-runners: instance $k missing and no token on stdin" >&2; exit 1; }
    mkdir -p "$d"
    for f in bin externals config.sh env.sh run.sh runsvc.sh svc.sh run-helper.cmd.template run-helper.sh.template safe_sleep.sh; do
      [ -e "$H/actions-runner/$f" ] && cp -a "$H/actions-runner/$f" "$d/"
    done
    for f in .path .env; do [ -e "$H/actions-runner/$f" ] && cp -a "$H/actions-runner/$f" "$d/"; done # PATH of the jobs (cargo, bun, ~/.local/bin)
    chown -R "$U:$U" "$d"
    sudo -u "$U" bash -c "cd '$d' && ./config.sh --unattended --url '$REPO_URL' --token '$TOKEN' --name '$name' --labels fr1,build --work _work --replace" >/dev/null
  fi
  unit=actions.runner.aphrody-labs-src.$name.service
  cat > /etc/systemd/system/$unit <<UNIT
[Unit]
Description=GitHub Actions Runner (aphrody-labs-src.$name)
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=600
StartLimitBurst=20
[Service]
ExecStart=$d/runsvc.sh
User=$U
WorkingDirectory=$d
KillMode=process
KillSignal=SIGTERM
TimeoutStopSec=5min
Restart=always
RestartSec=5s
[Install]
WantedBy=multi-user.target
UNIT
done
systemctl daemon-reload
for k in $(seq 2 "$N"); do for f in .path .env; do cp -a "$H/actions-runner/$f" "$H/actions-runner-$k/$f" 2>/dev/null || true; done; chown -R "$U:$U" "$H/actions-runner-$k"; done
for k in $(seq 2 "$N"); do systemctl enable --now "actions.runner.aphrody-labs-src.fr1-$k.service" >/dev/null; done
systemctl list-units "actions.runner.*" --no-legend | awk '{print $1, $3, $4}'
