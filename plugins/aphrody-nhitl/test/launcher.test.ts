import { afterAll, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { envWithoutDotenv } from "../src/lib.ts";

const dir = mkdtempSync(join(tmpdir(), "nhitl-env-"));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("launcher: .env entries loaded by bun never reach claude", () => {
  writeFileSync(
    join(dir, ".env"),
    'export ANTHROPIC_API_KEY="fake-test-value"\nURL=${HOST}/x\n# c\nPLAIN=a # note\n',
  );
  writeFileSync(join(dir, ".env.local"), "LOCAL_ONLY='l'\n");
  const env = {
    ANTHROPIC_API_KEY: "fake-test-value",
    URL: "h/x",
    PLAIN: "a",
    LOCAL_ONLY: "l",
    PATH: "/bin",
    HOME: "/home/x",
  };
  expect(envWithoutDotenv(env, dir, true)).toEqual({
    PATH: "/bin",
    HOME: "/home/x",
  });
  // a real environment value that differs from the file is the caller's own: kept
  expect(
    envWithoutDotenv({ ...env, PLAIN: "from-shell" }, dir, true).PLAIN,
  ).toBe("from-shell");
  // under --no-env-file nothing was injected: nothing is dropped
  expect(envWithoutDotenv(env, dir, false)).toEqual(env);
});

test("launcher: shebang disables .env loading, root never forces IS_SANDBOX", async () => {
  const src = await Bun.file(
    join(import.meta.dir, "../bin/claude-nhitl.ts"),
  ).text();
  expect(src.split("\n")[0]).toBe("#!/usr/bin/env -S bun --no-env-file");
  expect(src).not.toMatch(/IS_SANDBOX\s*=\s*["']1/);
  expect(src).toContain('"runuser", "-u"');
});
