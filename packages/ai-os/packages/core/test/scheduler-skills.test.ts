import { expect, test } from "bun:test";
import { MockLanguageModelV4 } from "ai/test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { HEARTBEAT_OK, lintContent, parseEvery, Scheduler, SkillLintError, Skills, tick } from "../src";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};
const say = (...texts: string[]) =>
  new MockLanguageModelV4({
    doGenerate: texts.map((text) => ({ content: [{ type: "text" as const, text }], finishReason: { unified: "stop" as const, raw: undefined }, usage, warnings: [] })),
  });

test("lint: Hermes rule ids", () => {
  const ids = lintContent("---\nname: Bad Name\ndescription: a powerful tool\n---\nuse `cat` here").map((f) => f.rule);
  expect(ids).toEqual(expect.arrayContaining(["name-format", "description-marketing", "shell-utility-reference", "missing-section"]));
  expect(lintContent("no front matter")[0]?.rule).toBe("frontmatter-missing");
});

test("skills: create adds When to Use, usage, curate stale/archive", async () => {
  const dir = mkdtempSync(join(tmpdir(), "agent-skills-"));
  const skills = new Skills(dir);
  const s = await skills.create("Deploy Site", "Deploy the site to prd", "1. build\n2. push");
  expect(s.body).toContain("## When to Use");
  expect(s.warnings.filter((w) => w.rule === "missing-section")).toEqual([]);
  await skills.view("deploy-site");
  expect((await skills.usage())["deploy-site"]?.uses).toBe(1);
  const day = 86_400_000;
  expect(await skills.curate(30, 90, Date.now() + 31 * day)).toEqual({ "deploy-site": "stale" });
  expect(await skills.curate(30, 90, Date.now() + 91 * day)).toEqual({ "deploy-site": "archived" });
  expect((await skills.list()).length).toBe(0);
  expect((await skills.list(true)).length).toBe(1);
  await expect(skills.create("x", "", "body")).rejects.toBeInstanceOf(SkillLintError);
});

test("scheduler: interval and one-shot jobs, heartbeat OK is silent", async () => {
  const home = mkdtempSync(join(tmpdir(), "agent-sched-"));
  expect(parseEvery("15m")).toBe(900_000);
  const s = new Scheduler(join(home, "scheduler.sqlite"));
  const t0 = 1_000_000;
  s.add("rep", "repeat", { everyMs: 1000 }, t0);
  s.add("one", "once", { at: t0 }, t0);
  s.close();
  await Bun.write(join(home, "HEARTBEAT.md"), "- check inbox");
  const events: string[] = [];
  await tick({ home, cwd: home, model: say("r1", "o1", HEARTBEAT_OK), onEvent: (e) => events.push(`${e.kind}:${e.name}:${e.text}`) }, t0 + 1000);
  expect(events.map((e) => e.split(":").slice(0, 2).join(":")).sort()).toEqual(["job:one", "job:rep"]);
  const s2 = new Scheduler(join(home, "scheduler.sqlite"));
  expect(s2.due(t0 + 1500)).toEqual([]);
  expect(s2.due(t0 + 2000).map((j) => j.name)).toEqual(["rep"]);
  s2.close();
});
