---
name: agy-continuous-reviewer
description: "Audit historical and live Antigravity CLI (agy) sessions via ske review-sessions, ske watch, and .agents/hooks.json (PreToolUse, PostToolUse, Stop) for broken file:/// links, failed commands, emoji violations, secret leaks, and System32 safety."
---

# Continuous AGY Session Reviewer & Lifecycle Hooks

Activate this skill when auditing `agy` transcripts (`transcript.jsonl`), configuring `.agents/hooks.json`, or running real-time workspace quality gates.

## Commands (`ske`)

1. **Incremental Full-Brain Session Audit (`< 30ms` cached)**:
   Scans `C:\Users\aphro\.gemini\antigravity-cli\brain\*\.system_generated\logs\transcript.jsonl` and writes `docs/AGY_SESSIONS_CONTINUOUS_REVIEW.md` + `var/reports/agy-sessions-audit.json`:
   ```powershell
   ske review-sessions
   ```
2. **Continuous Watcher Loop**:
   Incrementally audits active transcripts, fact-checks modified `docs/*.md` and `SKILL.md` files, and refreshes `MONOREPO_ATLAS.md`:
   ```powershell
   ske watch --interval 30
   ske watch --once
   ```

## Antigravity `hooks.json` Contract Invariants

- `PreToolUse` (`pre-tool-guard.ts`): Returns `{"decision":"allow"}` or `{"decision":"deny","reason":"..."}`. Blocks `C:\Windows\System32` mutations, raw `.env` git staging, and raw token commits.
- `PostToolUse` (`post-tool-tracker.ts`): Logs turn events to `var/knowledge.sqlite` (`live_turn_events`) in `< 15ms` and returns `{}`.
- `Stop` (`stop-session-reviewer.ts`): Audits the active turn in `< 40ms`, appends to `continuous-review-stream.jsonl`, and returns `{"decision":"stop"}` (or `{"decision":"continue","reason":"..."}` strictly when `terminationReason === "NO_TOOL_CALL"`, `executionNum <= 1`, and a critical safety violation occurred).

## Progressive Disclosure Reference

- Transcript JSONL schema and SQLite incremental indexing columns: see [`references/transcript-schema-and-hooks.md`](./references/transcript-schema-and-hooks.md).
