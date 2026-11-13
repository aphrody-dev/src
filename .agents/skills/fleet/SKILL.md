---
name: fleet
description: Run a command, deploy or check on the 3 VPS (ssh vps = fr1 Chromium/LLVM builds, ssh cdn = fr2 proxy/CDN, ssh prd = usa production). Use for any remote ssh/scp/systemctl/build; never a heavy build on the PC.
---

1. Always bound it: `timeout 60 ssh <vps|cdn|prd> '<cmd>'` (120 for scp/installs). Builds: only on `vps`.
2. Exit 255 / slow host: `timeout 30 ssh vps 'pkill -f gitleaks; pkill -u ubuntu -f user-data-dir=/tmp/lighthouse; uptime'` then retry.
3. Deploy a file: `timeout 120 ssh vps 'sudo mkdir -p /srv/X && sudo chown -R ubuntu:ubuntu /srv/X' && scp -q <src> vps:/srv/X/`.
4. Service: `timeout 60 ssh prd 'sudo systemctl restart <svc> && systemctl is-active <svc>'`.
5. Check over HTTP from the PC: `curl -sS -o /dev/null -w '%{http_code}\n' https://<domain>/`; never declare "deployed" without that code.
6. Never break prod: test on vps or a secondary port before `prd`. Detailed roles: memory fleet-roles.md.
