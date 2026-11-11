# AGY `transcript.jsonl` Schema & Incremental SQLite Index

## JSONL Step Record Fields
Each line in `brain/<conversation-id>/.system_generated/logs/transcript.jsonl` contains:
- `step_index`: Monotonic 0-based integer step index.
- `source`: `"USER"` | `"MODEL"` | `"SYSTEM"`.
- `type`: `"USER_INPUT"` | `"PLANNER_RESPONSE"` | `"SYSTEM_MESSAGE"` | `"GENERIC"`.
- `status`: `"DONE"` | `"ERROR"` | `"CANCELLED"`.
- `tool_calls`: Optional array of `{ name: string, args: Record<string, unknown> }` (including `invoke_subagent`, `run_command`, `write_file`, `edit_file`, `call_mcp_tool`).
- `input_tokens`, `output_tokens`, `cache_read_tokens`.

## Incremental Indexing (`agy_session_reviews`)
Keyed by `session_id` storing `transcript_mtime_ms`, `transcript_size`, and `artifacts_sig`. Unchanged sessions bypass disk reads completely, keeping full 47+ session re-audits under `30 ms`.
