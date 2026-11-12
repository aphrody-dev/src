// End-to-end: one tool-using task, memory persisted across runs, skill created. Deterministic model (AI SDK mock).
import { expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MockLanguageModelV4 } from "ai/test";
import { Memory, run, Skills } from "../src";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const call = (id: string, toolName: string, input: unknown) => ({
  type: "tool-call" as const,
  toolCallId: id,
  toolName,
  input: JSON.stringify(input),
});
const step = (content: any[], unified: "tool-calls" | "stop") => ({
  content,
  finishReason: { unified, raw: undefined },
  usage,
  warnings: [],
});

test("agent run: tools, memory, skill", async () => {
  const home = mkdtempSync(join(tmpdir(), "agent-home-"));
  const cwd = mkdtempSync(join(tmpdir(), "agent-ws-"));
  const model = new MockLanguageModelV4({
    doGenerate: [
      step([call("1", "write_file", { path: "hello.txt", content: "hi from agent" })], "tool-calls"),
      step(
        [
          call("2", "memory_add", { content: "user prefers greetings in hello.txt" }),
          call("3", "skill_create", { name: "Write greeting", description: "Write a greeting file", body: "1. write_file hello.txt" }),
        ],
        "tool-calls",
      ),
      step([{ type: "text", text: "done" }], "stop"),
    ],
  });
  const r = await run({ task: "write a greeting", model, home, cwd });
  expect(r.text).toBe("done");
  expect(r.toolCalls).toEqual(["write_file", "memory_add", "skill_create"]);
  expect(await Bun.file(join(cwd, "hello.txt")).text()).toBe("hi from agent");

  const mem = new Memory(join(home, "memory.sqlite"));
  expect(await mem.search("greetings")).toContain("user prefers greetings in hello.txt");
  mem.close();
  const skills = await new Skills(join(home, "skills")).list();
  expect(skills.map((s) => s.name)).toEqual(["write-greeting"]);

  // second run: memory and skill are recalled into the system prompt
  const model2 = new MockLanguageModelV4({ doGenerate: step([{ type: "text", text: "ok" }], "stop") });
  await run({ task: "greeting again", model: model2, home, cwd });
  const sys = JSON.stringify(model2.doGenerateCalls[0]?.prompt);
  expect(sys).toContain("write-greeting");
  expect(sys).toContain("user prefers greetings");
});
