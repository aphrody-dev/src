---
name: r2
description: Envoyer/récupérer des artefacts sur Cloudflare R2 via rclone (remotes r2-lore sur prd, r2-chromium pour les builds Chromium). Utiliser pour upload d'artefacts, backups, téléchargements de releases.
---
1. Lister les remotes : `rclone listremotes` (local) ou `timeout 60 ssh prd 'rclone listremotes'`. Ne jamais écrire de clé en clair dans une commande ou un fichier versionné : config via `rclone config` interactif côté hôte ou variables `RCLONE_CONFIG_<REMOTE>_*`.
2. Upload : `rclone copyto <fichier> r2-chromium:aphrody-chromium/<produit>/<version>/<os-arch>.tar.zst`.
3. Sync/backup : `rclone sync <dir> r2-lore:aphrody-lore/<hôte> --fast-list --transfers 16` (systemd lore-r2-backup sur prd).
4. Vérifier : `rclone size <remote>:<bucket>/<chemin>` ou `rclone lsl ... | head`.
