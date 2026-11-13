import { afterAll, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Run the real hook entry with an isolated home (state, logs) and a JSON event on stdin.
const HOOK = join(import.meta.dir, "../src/hook.ts");
const home = mkdtempSync(join(tmpdir(), "nhitl-home-"));
afterAll(() => rmSync(home, { recursive: true, force: true }));

function run(event: Record<string, unknown>): any {
  const r = Bun.spawnSync(["bun", HOOK], {
    stdin: Buffer.from(
      JSON.stringify({ session_id: "t1", cwd: "C:/src", ...event }),
    ),
    env: { ...process.env, USERPROFILE: home, HOME: home },
    stdout: "pipe",
    stderr: "pipe",
  });
  expect(r.exitCode).toBe(0);
  const s = r.stdout.toString();
  return s ? JSON.parse(s) : null;
}

test("PreToolUse: deny with a reason, allow otherwise, plan mode untouched", () => {
  const d = run({
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: { command: "git push --force" },
    permission_mode: "bypassPermissions",
  });
  expect(d.hookSpecificOutput.permissionDecision).toBe("deny");
  expect(d.hookSpecificOutput.permissionDecisionReason).toStartWith("NHITL");
  const a = run({
    hook_event_name: "PreToolUse",
    tool_name: "Bash",
    tool_input: { command: "ls" },
    permission_mode: "default",
  });
  expect(a.hookSpecificOutput.permissionDecision).toBe("allow");
  expect(
    run({
      hook_event_name: "PreToolUse",
      tool_name: "Bash",
      tool_input: { command: "ls" },
      permission_mode: "plan",
    }),
  ).toBeNull();
});

test("PreToolUse: Grep content search over a directory gets the secret exclusion glob", () => {
  const input = { pattern: "KEY", path: "C:/src", output_mode: "content" };
  const r = run({
    hook_event_name: "PreToolUse",
    tool_name: "Grep",
    tool_input: input,
    permission_mode: "plan",
  });
  expect(r.hookSpecificOutput.permissionDecision).toBe("allow");
  expect(r.hookSpecificOutput.updatedInput).toMatchObject({
    ...input,
    glob: expect.stringMatching(/^!\{\.env,/),
  });
});

test("PermissionRequest: deny, allow, and no decision in plan mode", () => {
  const d = run({
    hook_event_name: "PermissionRequest",
    tool_name: "Bash",
    tool_input: { command: "cat .env" },
    permission_mode: "default",
  });
  expect(d.hookSpecificOutput.decision.behavior).toBe("deny");
  const a = run({
    hook_event_name: "PermissionRequest",
    tool_name: "Bash",
    tool_input: { command: "ls" },
    permission_mode: "default",
  });
  expect(a.hookSpecificOutput.decision).toEqual({
    behavior: "allow",
    updatedInput: { command: "ls" },
  });
  expect(
    run({
      hook_event_name: "PermissionRequest",
      tool_name: "Bash",
      tool_input: { command: "ls" },
      permission_mode: "plan",
    }),
  ).toBeNull();
});

test("Stop: continues an open goal up to the cap, the cap resets on a fresh stop", () => {
  mkdirSync(join(home, ".claude/state/nhitl"), { recursive: true });
  writeFileSync(
    join(home, ".claude/state/nhitl/goal-t1.txt"),
    "finir la revue",
  );
  const stop = (active: boolean, last = "étape faite") =>
    run({
      hook_event_name: "Stop",
      stop_hook_active: active,
      last_assistant_message: last,
    });
  expect(stop(false)?.decision).toBe("block");
  expect(stop(true)?.decision).toBe("block");
  expect(stop(true)?.decision).toBe("block");
  expect(stop(true)).toBeNull(); // NHITL_MAX_CONTINUE = 3 consecutive continuations
  expect(stop(false)?.decision).toBe("block"); // new user turn: counter starts over
  expect(stop(true, "Bloqué : il faut un captcha.")).toBeNull();
  expect(stop(false, "Tout est fait. NHITL_DONE")).toBeNull();
  expect(stop(false)).toBeNull(); // goal closed
});
