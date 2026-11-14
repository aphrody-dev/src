---
name: r2
description: Send/fetch artifacts on Cloudflare R2 via rclone (buckets aphrody-chromium for Chromium builds and toolchains, aphrody-lore for Lore backups). Use for artifact uploads, backups, release downloads.
---

1. List the remotes of the host you run on: `rclone listremotes` (PC) or `timeout 60 ssh prd 'rclone listremotes'`. prd has `r2` and `r2-lore`; `r2-chromium` (used by `src/chromium/factory`) must exist on the host that builds. Buckets of the account: `cf r2 buckets list`. Never write a key in clear text in a command or a versioned file: configure with interactive `rclone config` on the host or `RCLONE_CONFIG_<REMOTE>_*` variables.
2. Upload: `rclone copyto <file> r2-chromium:aphrody-chromium/<product>/<version>/<os-arch>.tar.zst`.
3. Sync/backup: `rclone sync <dir> r2-lore:aphrody-lore/<host> --fast-list --transfers 16` (systemd `lore-r2-backup` on prd).
4. Check: `rclone size <remote>:<bucket>/<path>` or `rclone lsl <remote>:<bucket>/<path>` (add `--max-depth 1`).
