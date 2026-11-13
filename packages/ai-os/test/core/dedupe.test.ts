import { expect, test } from "bun:test";
import { scriptedModel } from "../../src/llm/testing";
import { council, parseDotEnv, redactText, route } from "../../src/core/index";

const say = (text: string) => scriptedModel(text);

test("redactText: tokens, bearer, env literals", () => {
  const out = redactText(
    "k=ghp_abcdefghij1234 Bearer abcdefghijklmnop pw=hunter2hunter2",
    { DB_PASSWORD: "hunter2hunter2" },
  );
  expect(out).not.toContain("ghp_abcdefghij1234");
  expect(out).not.toContain("abcdefghijklmnop");
  expect(out).toContain("[REDACTED:DB_PASSWORD:len=14]");
});

test("parseDotEnv", () => {
  expect(parseDotEnv('# c\nexport A=1\nB="x y"\nC=z # note\n1BAD=no')).toEqual({
    A: "1",
    B: "x y",
    C: "z",
  });
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
