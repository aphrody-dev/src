# ai-os brain

One brain for Claude Code and agy (Antigravity CLI), owned by `@aphrody/ai-os`.

## Commands

- `ai-os brain absorb [--days N] [--dry-run]`: indexes into `~/.agent/memory.sqlite` (Context store, FTS5 + embeddings)
  every Claude memory file, prompt history per project, one digest per Claude session transcript, and agy conversation
  summaries plus user turns (`~/.gemini/antigravity*/conversation_summaries.db`). Files older than N days in
  `~/.claude/{projects,file-history,paste-cache,backups,shell-snapshots}` and `~/.gemini/antigravity-cli/{brain,conversations}`
  are zstd level 19 compressed (`Bun.zstdCompressSync`) into `~/.agent/brain.sqlite` and removed from disk.
- `ai-os brain sync`: writes the global `~/.claude/CLAUDE.md` and the memory index into a managed block of
  `~/.gemini/GEMINI.md`, sets Claude `permissions.defaultMode = bypassPermissions` and agy
  `toolPermission = artifactReviewPolicy = always-proceed`, prunes agy `trustedWorkspaces` to existing paths.
- `ai-os brain restore <path>`: writes compressed files back to their original location.

## State on 2026-11-13

- Indexed: 91 memories, 5 project histories, 305 Claude sessions, 496 agy conversations.
- Packed: 28,764 files, 1.59 GB to 529 MB. Files touched in the last 24 h stay on disk so live sessions can resume.
- Verified headless without approval: `agy -p ... --output-format json` and `claude -p ... --output-format json` both
  ran a shell write and returned success.
- agy config facts and sources: `docs/cli-reference/agy.md`; Claude Code: `docs/cli-reference/claude-code.md`.
