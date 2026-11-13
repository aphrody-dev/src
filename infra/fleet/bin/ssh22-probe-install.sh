#!/bin/bash
# Installs the ssh 22 closing-criteria probe on one fleet host (run from C:\src, Git Bash):
#   sh infra/fleet/bin/ssh22-probe-install.sh fr2 root@ssh-prd.aphrody.com root@10.200.77.5 prd
#   sh infra/fleet/bin/ssh22-probe-install.sh prd ubuntu@ssh-fr2.aphrody.com ubuntu@10.200.77.3 fr2
#   sh infra/fleet/bin/ssh22-probe-install.sh vps "" ubuntu@10.200.77.3 fr2     (fr1: mesh only, no Access token)
# Host key of the mesh peer: read from the peer itself (its ed25519 public host key) over the PC's already
# authenticated ssh session, then written for the mesh IP into /root/.ssh/known_hosts of the probing host. No
# ssh-keyscan, so no trust on first use over the network.
set -eu
host=$1; access=$2; mesh=$3; peer=$4
ip=${mesh#*@}
pin="$ip $(ssh -o ConnectTimeout=40 "$peer" cat /etc/ssh/ssh_host_ed25519_key.pub | cut -d' ' -f1,2)"
case "$pin" in *" ssh-ed25519 AAAA"*) ;; *) echo "no ed25519 host key from $peer" >&2; exit 1;; esac
cd "$(dirname "$0")/.."
tar -cf - bin/ssh22-probe.sh systemd/fleet-ssh22-probe.service systemd/fleet-ssh22-probe.timer | ssh -o ConnectTimeout=40 "$host" "
set -e
d=\$(mktemp -d); tar -xf - -C \$d
sudo install -m 755 \$d/bin/ssh22-probe.sh /usr/local/bin/ssh22-probe.sh
sudo install -m 644 \$d/systemd/fleet-ssh22-probe.service \$d/systemd/fleet-ssh22-probe.timer /etc/systemd/system/
rm -rf \$d
sudo install -d /etc/fleet
printf 'ACCESS_TARGET=%s\nMESH_TARGET=%s\n' '$access' '$mesh' | sudo tee /etc/fleet/ssh22-probe.conf >/dev/null
sudo ssh-keygen -R '$ip' -f /root/.ssh/known_hosts >/dev/null 2>&1 || true
echo '$pin' | sudo tee -a /root/.ssh/known_hosts >/dev/null
sudo systemctl daemon-reload
sudo systemctl enable --now fleet-ssh22-probe.timer >/dev/null 2>&1
sudo systemctl start fleet-ssh22-probe.service
echo $host \$(sudo tail -1 /var/lib/fleet-ssh22/probes.jsonl)
"
