---
description: Usine Chromium fr1 (status | sync | build | publish | all) [canal]
argument-hint: status|sync|build|publish|all [stable|beta|dev|canary]
allowed-tools: Bash(just:*), Bash(ssh:*)
---
Dans C:\labs. Étape `$1` (défaut status), canal `$2` (défaut stable).
- `status` : `just factory-status` ; résumer units, dernières lignes de log, disque.
- sinon : `just factory $1 <canal>`, puis `just factory-status`. En cas d'échec : `ssh vps 'journalctl -u chromium-factory-$1 -n 80 --no-pager'` et déléguer à l'agent chromium-builder.
