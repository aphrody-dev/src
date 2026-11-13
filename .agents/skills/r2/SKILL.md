---
name: r2
description: Send/fetch artifacts on Cloudflare R2 via rclone (remotes r2-lore on prd, r2-chromium for Chromium builds). Use for artifact uploads, backups, release downloads.
---
1. List the remotes: `rclone listremotes` (local) or `timeout 60 ssh prd 'rclone listremotes'`. Never write a key in clear text in a command or a versioned file: config via interactive `rclone config` on the host or `RCLONE_CONFIG_<REMOTE>_*` variables.
2. Upload: `rclone copyto <file> r2-chromium:aphrody-chromium/<product>/<version>/<os-arch>.tar.zst`.
3. Sync/backup: `rclone sync <dir> r2-lore:aphrody-lore/<host> --fast-list --transfers 16` (systemd lore-r2-backup on prd).
4. Check: `rclone size <remote>:<bucket>/<path>` or `rclone lsl ... | head`.
