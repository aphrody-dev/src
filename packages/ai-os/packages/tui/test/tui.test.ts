import { expect, test } from "bun:test";
import type { ModelMessage } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { handle } from "../src";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

test("tui: multi-turn history, slash commands", async () => {
  const home = mkdtempSync(join(tmpdir(), "agent-tui-"));
  const model = new MockLanguageModelV4({
    doGenerate: ["one", "two"].map((text) => ({
      content: [{ type: "text" as const, text }],
      finishReason: { unified: "stop" as const, raw: undefined },
      usage,
      warnings: [],
    })),
  });
  const out: string[] = [];
  const s = { history: [] as ModelMessage[], print: (m: string) => void out.push(m), busy: () => {} };
  const o = { home, model, cwd: home };
  expect(await handle("hello", s, o)).toBe(true);
  expect(await handle("again", s, o)).toBe(true);
  expect(s.history.map((m) => m.role)).toEqual(["user", "assistant", "user", "assistant"]);
  expect(JSON.stringify(model.doGenerateCalls[1]?.prompt)).toContain("hello");
  expect(out).toContain("two");
  await handle("/clear", s, o);
  expect(s.history.length).toBe(0);
  expect(await handle("/exit", s, o)).toBe(false);
});
