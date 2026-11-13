#!/bin/bash
# Installs the ssh 22 closing-criteria probe on one fleet host (run from C:\src, Git Bash):
#   sh infra/fleet/bin/ssh22-probe-install.sh fr2 root@ssh-prd.aphrody.com root@10.200.77.5
#   sh infra/fleet/bin/ssh22-probe-install.sh prd ubuntu@ssh-fr2.aphrody.com ubuntu@10.200.77.3
#   sh infra/fleet/bin/ssh22-probe-install.sh vps "" ubuntu@10.200.77.3     (fr1: mesh only, no Access token)
# Pins the mesh peer host key into /root/.ssh/known_hosts (Access keys are already in known_hosts_access).
set -eu
host=$1; access=$2; mesh=$3
cd "$(dirname "$0")/.."
tar -cf - bin/ssh22-probe.sh systemd/fleet-ssh22-probe.service systemd/fleet-ssh22-probe.timer | ssh -o ConnectTimeout=40 "$host" "
set -e
d=\$(mktemp -d); tar -xf - -C \$d
sudo install -m 755 \$d/bin/ssh22-probe.sh /usr/local/bin/ssh22-probe.sh
sudo install -m 644 \$d/systemd/fleet-ssh22-probe.service \$d/systemd/fleet-ssh22-probe.timer /etc/systemd/system/
rm -rf \$d
sudo install -d /etc/fleet
printf 'ACCESS_TARGET=%s\nMESH_TARGET=%s\n' '$access' '$mesh' | sudo tee /etc/fleet/ssh22-probe.conf >/dev/null
peer=${mesh#*@}
sudo ssh-keygen -F \$peer -f /root/.ssh/known_hosts >/dev/null || sudo sh -c \"ssh-keyscan -T 10 \$peer 2>/dev/null >> /root/.ssh/known_hosts\"
sudo systemctl daemon-reload
sudo systemctl enable --now fleet-ssh22-probe.timer >/dev/null 2>&1
sudo systemctl start fleet-ssh22-probe.service
echo $host \$(sudo tail -1 /var/lib/fleet-ssh22/probes.jsonl)
"
