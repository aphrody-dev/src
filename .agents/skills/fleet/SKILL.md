---
name: fleet
description: Exécuter une commande, déployer ou vérifier sur les 3 VPS (ssh vps = fr1 builds Chromium/LLVM, ssh cdn = fr2 proxy/CDN, ssh prd = usa production). Utiliser pour tout ssh/scp/systemctl/build distant ; jamais de build lourd sur le PC.
---
1. Toujours borner : `timeout 60 ssh <vps|cdn|prd> '<cmd>'` (120 pour scp/installs). Builds : seulement sur `vps`.
2. Exit 255 / hôte lent : `timeout 30 ssh vps 'pkill -f gitleaks; pkill -u ubuntu -f user-data-dir=/tmp/lighthouse; uptime'` puis réessayer.
3. Déployer un fichier : `timeout 120 ssh vps 'sudo mkdir -p /srv/X && sudo chown -R ubuntu:ubuntu /srv/X' && scp -q <src> vps:/srv/X/`.
4. Service : `timeout 60 ssh prd 'sudo systemctl restart <svc> && systemctl is-active <svc>'`.
5. Vérifier en HTTP depuis le PC : `curl -sS -o /dev/null -w '%{http_code}\n' https://<domaine>/` ; jamais déclarer « déployé » sans ce code.
6. Ne jamais casser la prod : tester sur vps ou un port secondaire avant `prd`. Rôles détaillés : memory fleet-roles.md.
