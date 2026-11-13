---
name: learn
description: Local learning loop (Hermes style). Distills ~/.claude/learning/journal.jsonl into memories (one fact per file), merges/deletes duplicates and stale entries, and creates skills from repeated successful procedures. Use on a "learn" request, at the end of a big task, or when the start-of-session digest reports pending entries.
---

Everything stays local. No archive: delete or merge.

1. `bun ${CLAUDE_PLUGIN_ROOT}/skills/learn/scripts/digest.ts`: aggregates the unprocessed journal (recurring errors, owner corrections, failure->success recoveries, per project) and lists the existing memories with their descriptions.
2. Memories (`~/.claude/projects/<project>/memory/`, or the project of the entry's `cwd`):
   - one durable fact per `<slug>.md` file, frontmatter `name`, `description` (one line, concrete), `metadata.type` (`user` | `feedback` | `project` | `reference`); body: the fact, then `**Why:**` and `**How to apply:**`.
   - Owner corrections -> `feedback`. Repeated error with a found workaround -> `reference`.
   - Before writing: if a file already covers the topic, update it; merge duplicates (keep one file, delete the others); delete what is contradicted or obsolete (vanished path, removed tool).
   - `MEMORY.md` = index, one line per file: `- [Title](file.md) — hook`. No other content.
   - Ignore one-off noise (typo, single error with no lesson).
3. Experience skills: a successful procedure seen ≥2 times (same commands/steps) and not covered -> `C:\src\.agents\skills\<name>\SKILL.md` (single source, exposed to all agents by the aphrody-skills plugin; commit right away) (frontmatter `name`, triggering `description`; body: minimal steps, exact verified commands). Improve an existing skill rather than creating a neighbouring one.
4. `bun ${CLAUDE_PLUGIN_ROOT}/skills/learn/scripts/digest.ts --done`: marks the journal processed (truncates the processed entries).
   Report: 3 lines (memories created/merged/deleted, skills created).
