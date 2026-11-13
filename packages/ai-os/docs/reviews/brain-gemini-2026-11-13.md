# Gemini review: ai-os brain (2026-11-13)

Engine antigravity (relay gemini_review), score 8/20 before fixes.

Fixed: --days validated (NaN would pack and delete everything), blob committed in a transaction and decompressed and hash-compared before rmSync, WAL + busy_timeout, restore by exact path or directory prefix with escaped LIKE, bounded to home, no overwrite, mtime reapplied, GEMINI.md block replaced by indexOf (no $-pattern expansion), VACUUM only when something was packed.

Kept by owner policy: sync sets the no-human-in-the-loop posture (bypassPermissions, always-proceed) without a flag; no .bak files.

Open: zstd level 19 on whole files in RAM, MEMORY.md path hard-coded to C--src, no unit tests, module-level side effects.

## Second pass

Score 13/20. Then fixed: --days must match a decimal number (empty string rejected), byte comparison instead of a 64-bit hash, re-stat before delete (file changed while packing is kept), rmSync failure per file no longer aborts the loop, restore bounded by path.relative and written with flag wx (no overwrite race). Open: RAM-bound zstd 19, MEMORY.md path hard-coded, non-atomic config writes, import-time side effects.
