import { expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Context, clawhub, hubInstall, hubSearch, Skills } from "../src";

const SKILL = "---\nname: demo\ndescription: Demo skill for tests\n---\n\n## When to Use\n\nIn tests.\n";
const fake = (async (u: URL | string) => {
  const s = String(u);
  if (s.includes("/api/v1/search")) return Response.json({ results: [{ slug: "demo", displayName: "Demo", summary: "Demo skill", score: 1 }] });
  if (s.includes("/api/v1/skills/demo/file")) return new Response(SKILL);
  return new Response("nope", { status: 404 });
}) as unknown as typeof fetch;

test("hub: fan-out search tolerates failing sources; install lints, pins, indexes", async () => {
  const bad = { id: "bad", search: async () => Promise.reject(new Error("down")), fetchSkill: async () => "" };
  const r = await hubSearch("demo", [clawhub("https://hub.test", fake), bad]);
  expect(r.results.map((x) => x.ref)).toEqual(["demo"]);
  expect(r.errors[0]).toContain("bad");
  const home = mkdtempSync(join(tmpdir(), "agent-hub-"));
  const ctx = new Context(join(home, "c.sqlite"));
  const skills = new Skills(join(home, "skills"), ctx);
  const inst = await hubInstall(skills, clawhub("https://hub.test", fake), "demo");
  expect(inst.name).toBe("demo");
  expect((await skills.usage()).demo?.pinned).toBe(true);
  expect((await ctx.select("demo skill", { sources: ["skill"] }))[0]?.id).toBe("skill:demo");
  ctx.close();
});
