import { expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handle } from "../../src/tui/index";
import { scriptedModel } from "../../src/llm/testing";
import type { Message } from "../../src/llm/types";

test("tui: multi-turn history, slash commands", async () => {
  const home = mkdtempSync(join(tmpdir(), "agent-tui-"));
  const model = scriptedModel("one", "two");
  const out: string[] = [];
  const s = {
    history: [] as Message[],
    print: (m: string) => void out.push(m),
    busy: () => {},
  };
  const o = { home, model, cwd: home };
  expect(await handle("hello", s, o)).toBe(true);
  expect(await handle("again", s, o)).toBe(true);
  expect(s.history.map((m) => m.role)).toEqual([
    "user",
    "assistant",
    "user",
    "assistant",
  ]);
  expect(JSON.stringify(model.calls[1]?.messages)).toContain("hello");
  expect(out).toContain("two");
  await handle("/clear", s, o);
  expect(s.history.length).toBe(0);
  expect(await handle("/exit", s, o)).toBe(false);
});
