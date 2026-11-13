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
