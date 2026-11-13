import { expect, test } from "bun:test";
import { MockLanguageModelV4 } from "ai/test";
import { council, parseDotEnv, redactText, route } from "../src";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const say = (text: string) =>
  new MockLanguageModelV4({
    doGenerate: { content: [{ type: "text", text }], finishReason: { unified: "stop", raw: undefined }, usage, warnings: [] },
  });

test("redactText: tokens, bearer, env literals", () => {
  const out = redactText("k=ghp_abcdefghij1234 Bearer abcdefghijklmnop pw=hunter2hunter2", { DB_PASSWORD: "hunter2hunter2" });
  expect(out).not.toContain("ghp_abcdefghij1234");
  expect(out).not.toContain("abcdefghijklmnop");
  expect(out).toContain("[REDACTED:DB_PASSWORD:len=14]");
});

test("parseDotEnv", () => {
  expect(parseDotEnv("# c\nexport A=1\nB=\"x y\"\nC=z # note\n1BAD=no")).toEqual({ A: "1", B: "x y", C: "z" });
});

test("council and route", async () => {
  const r = await council(
    [
      { id: "a", kind: "model", model: say("yes") },
      { id: "b", kind: "cli", argv: () => ["bun", "-e", "process.exit(3)"] },
    ],
    "q",
  );
  expect(r.succeeded).toBe(1);
  expect(r.summary).toContain("## a (ok");
  const rt = await route(
    [
      { id: "bad", kind: "cli", argv: () => ["bun", "-e", "process.exit(1)"] },
      { id: "good", kind: "model", model: say("ok") },
    ],
    "q",
  );
  expect(rt.output).toBe("ok");
  expect(rt.trail).toEqual(["bad:err", "good:ok"]);
});
