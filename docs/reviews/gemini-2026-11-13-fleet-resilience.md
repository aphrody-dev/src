# Revue Gemini : couche de résilience de la flotte (2026-11-13)

Relais `gemini_ask` (moteur agy). Fichiers soumis : `infra/fleet/bin/{fleet-resilience,fleet-backup,fleet-health,src-checkout-update,fleet-rebuild}.sh`, `infra/fleet/prd/resilience.conf`.

**Note : 12/20.** Points forts relevés : l'idempotence et la reprise après panne.

| # | Défaut relevé | Suite donnée |
|---|---|---|
| 1 | `fleet-rebuild.sh` : la restauration écrase `/usr`, `passwd`, `shadow`, la gestion de paquets | corrigé : `usr`, comptes (`passwd`, `shadow`, `group`, `gshadow`, `subuid`, `subgid`), `apt`, `dpkg`, `pacman`, `ld.so` et `alternatives` sont retirés de l'arbre restauré avant la copie |
| 2 | `fleet-backup.sh` : un backup tronqué pourrait passer pour OK | sans objet : `set -o pipefail` est actif, donc tout échec de tar, zstd, age ou rcat rend le pipeline non nul. Seuil de taille maintenu, et chaque hôte passe par un test de restauration réel (`just fleet-restore-test`) |
| 3 | La purge tourne même après un échec, sans filtre | corrigé : la purge n'a lieu qu'après un backup valide, ne touche que `*.tar.zst*`, et les 8 archives les plus récentes sont toujours conservées |
| 4 | `src-checkout-update.sh` : pas de signature, pas de rollback | rollback corrigé : si l'unité n'est pas active 20 s après le restart, `reset --hard` sur l'ancien commit et nouveau restart. Signature non retenue : main est la branche unique, sur laquelle le propriétaire et les agents poussent |
| 5 | Échec du heal non alerté | partiel : chaque heal est journalisé (`fleet-resilience`, `fleet-health`), et les échecs des pairs sont reportés. Le canal d'alerte (`FLEET_ALERT_URL`) n'est toujours pas choisi |
| 6 | Pas de dead-man's-switch | ouvert : dépend du même canal d'alerte |
| 7 | Restarts trop larges, pas de mode maintenance | corrigé : le fichier `/var/lib/fleet-resilience/pause` suspend tout heal. `docker update` ne s'applique qu'aux conteneurs compose dont la politique est `no` |
| 8 | Réécriture d'`ExecStart` des BATCH par regex, `flock -w 7200` face à `TimeoutStartSec` | maintenu : la réécriture est bornée à une unité mono-`ExecStart` (sinon priorité seule, avec WARN). Les unités oneshot n'ont pas de timeout de démarrage par défaut |
