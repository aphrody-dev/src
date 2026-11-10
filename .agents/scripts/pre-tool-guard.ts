#!/usr/bin/env bun
/**
 * Antigravity CLI (`agy`) PreToolUse Safety Gate Hook (`hooks.json` camelCase contract)
 * Blocks two classes of mistakes deterministically in < 2ms:
 * 1. Any write/edit/command targeting `C:\Windows\System32` (Torvalds userspace integrity).
 * 2. Any command attempting to echo or stage raw `C:\src\.env` secret values into git.
 */

const rawInput = await new Response(Bun.stdin.stream()).text();
let payload: {
  toolCall?: {
    name?: string;
    args?: Record<string, unknown>;
  };
} = {};

try {
  payload = JSON.parse(rawInput || "{}");
} catch {
  process.stdout.write(JSON.stringify({ decision: "allow" }));
  process.exit(0);
}

const toolName = (payload.toolCall?.name ?? "").toLowerCase();
const args = payload.toolCall?.args ?? {};

const pathArg = String(args.Path ?? args.path ?? "").toLowerCase();
if (
  (toolName.includes("write") || toolName.includes("edit")) &&
  (pathArg.startsWith("c:\\windows\\system32") || pathArg.startsWith("c:/windows/system32"))
) {
  process.stdout.write(
    JSON.stringify({
      decision: "deny",
      reason: "Blocked write/edit inside sacred C:\\Windows\\System32 directory.",
    }),
  );
  process.exit(0);
}

if (toolName === "run_command") {
  const cmd = String(args.CommandLine ?? "");
  const stagesRawDotEnv = /\bgit\s+add\s+(?:-f\s+)?["']?(?:c:[/\\]src[/\\])?\.env(?:\s|["']|$)/i.test(
    cmd,
  );
  if (stagesRawDotEnv) {
    process.stdout.write(
      JSON.stringify({
        decision: "deny",
        reason: "Blocked git staging of raw .env secrets file (only .env.example may be committed).",
      }),
    );
    process.exit(0);
  }
}

process.stdout.write(JSON.stringify({ decision: "allow" }));
