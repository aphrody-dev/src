#!/usr/bin/env bun
// SPDX-License-Identifier: Apache-2.0
/**
 * Shared PreToolUse safety gate for every agent CLI wired into C:\src.
 *
 * Mode comes from $AGENT_GUARD (default "off", agents run unrestricted, see AGENTS.md section 5):
 * - off:     allow everything (the payload is only parsed to pick the reply format).
 * - warn:    report what would be blocked on stderr, still allow.
 * - enforce: block the cases below.
 *
 * Accepts both payload shapes:
 * - Antigravity (`agy`, `.agents/hooks.json`): { toolCall: { name, args: { Path, CommandLine } } }
 *   Answers on stdout with { decision: "allow" | "deny", reason }.
 * - Claude Code (`.claude/settings.json`): { tool_name, tool_input: { file_path, command } }
 *   Denies with exit code 2 and the reason on stderr.
 *
 * Cases checked in warn/enforce:
 * 1. Writes, edits, or commands targeting C:\Windows\System32 (host userspace integrity).
 * 2. Staging the raw C:\src\.env vault into git.
 * 3. Printing the raw C:\src\.env vault (cat/type/Get-Content/Read), which would leak secrets into transcripts.
 */

type Shape = "agy" | "claude";

interface ToolCall {
  shape: Shape;
  name: string;
  path: string;
  command: string;
}

const SYSTEM32 = /c:[/\\]+windows[/\\]+system32/i;
// `.env` exactly: not `.env.example`, `.env.template`, `.envrc`.
const DOT_ENV = String.raw`["']?(?:c:[/\\]+src[/\\]+)?\.env(?=$|[\s"';|&)])`;
const STAGES_DOT_ENV = new RegExp(
  String.raw`\bgit\s+add\s+(?:-\S+\s+)*` + DOT_ENV,
  "i",
);
const PRINTS_DOT_ENV = new RegExp(
  String.raw`\b(?:cat|type|more|less|head|tail|bat|Get-Content|gc)\s+(?:-\S+\s+)*` +
    DOT_ENV,
  "i",
);

function parse(raw: string): ToolCall | null {
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(raw || "{}");
  } catch {
    return null;
  }
  if (payload.toolCall) {
    const args = payload.toolCall.args ?? {};
    return {
      shape: "agy",
      name: String(payload.toolCall.name ?? "").toLowerCase(),
      path: String(args.Path ?? args.path ?? ""),
      command: String(args.CommandLine ?? args.command ?? ""),
    };
  }
  if (payload.tool_name) {
    const input = payload.tool_input ?? {};
    return {
      shape: "claude",
      name: String(payload.tool_name).toLowerCase(),
      path: String(input.file_path ?? input.notebook_path ?? input.path ?? ""),
      command: String(input.command ?? ""),
    };
  }
  return null;
}

function isDotEnvPath(path: string): boolean {
  return /(?:^|[/\\])\.env$/i.test(path.trim());
}

export function evaluate(call: ToolCall): string | null {
  const mutates = /write|edit|notebook/.test(call.name);
  if (mutates && SYSTEM32.test(call.path)) {
    return "Blocked write/edit inside C:\\Windows\\System32. Install userland binaries in C:\\Users\\aphro\\.local\\bin.";
  }
  if (call.name === "read" && isDotEnvPath(call.path)) {
    return "Blocked reading the raw C:\\src\\.env vault. Use `env-kit doctor` (masked) or .env.example.";
  }
  if (call.command) {
    if (
      SYSTEM32.test(call.command) &&
      /\b(?:copy|cp|mv|move|del|rm|Remove-Item|Copy-Item|Move-Item|Set-Content|Out-File|New-Item)\b|>/i.test(
        call.command,
      )
    ) {
      return "Blocked command that mutates C:\\Windows\\System32.";
    }
    if (STAGES_DOT_ENV.test(call.command)) {
      return "Blocked git staging of the raw .env vault (only .env.example may be committed).";
    }
    if (PRINTS_DOT_ENV.test(call.command)) {
      return "Blocked printing the raw C:\\src\\.env vault. Use `env-kit doctor` (masked) or .env.example.";
    }
  }
  return null;
}

type Mode = "off" | "warn" | "enforce";

export function guardMode(value = process.env.AGENT_GUARD): Mode {
  const mode = (value ?? "").trim().toLowerCase();
  return mode === "warn" || mode === "enforce" ? mode : "off";
}

if (import.meta.main) {
  const mode = guardMode();
  const raw = await new Response(Bun.stdin.stream()).text();
  // Always parse: the reply format depends on which CLI is calling.
  const call = parse(raw);
  let reason = call && mode !== "off" ? evaluate(call) : null;
  if (reason && mode === "warn") {
    process.stderr.write(`[AGENT_GUARD=warn] ${reason}\n`);
    reason = null;
  }
  if (call?.shape === "claude") {
    if (reason) {
      process.stderr.write(reason);
      process.exit(2);
    }
    process.exit(0);
  }
  process.stdout.write(
    JSON.stringify(
      reason ? { decision: "deny", reason } : { decision: "allow" },
    ),
  );
}
