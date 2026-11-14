import { expect, test } from "bun:test";
import { cleanHelp, parseTools, render, skillName, subcommands, summary } from "./cli-skills.ts";
import { parseSkill } from "../packages/ai-os/src/core/skill-lint.ts";

const HELP = "\x1b[1mtool 1.0\x1b[0m\r\nA fast finder.\n\n\n\nUsage: tool [OPTIONS] <CMD>\n\nCommands:\n  run     Run it\n  help    Print help\n  scan, s  Scan\n\nOptions:\n  -h, --help  Help\n";

test("parseTools keeps only tables with a bin", () => {
  const t = parseTools('[[tool]]\nname = "a"\nbin = ["a"]\n[[tool]]\nname = "b"\n[toolchain.c]\nversion = "1"\n');
  expect(t.map((x) => x.name)).toEqual(["a"]);
});

test("skillName is a slug", () => {
  expect(skillName("mistral.rs")).toBe("cli-mistral-rs");
  expect(skillName("llama.cpp")).toBe("cli-llama-cpp");
});

test("cleanHelp strips ANSI, CR and double blanks", () => {
  const l = cleanHelp(HELP);
  expect(l[0]).toBe("tool 1.0");
  expect(l.join("\n")).not.toContain("\r");
  expect(l.join("\n")).not.toContain("\n\n\n");
});

test("cleanHelp drops emoji, non-ASCII and author emails", () => {
  const l = cleanHelp("just \u{1F916} runner for tasks\nAuthor Name <a@b.dev>\nstar \u2604\u{1F30C} prompt");
  expect(l.join("\n")).toBe("just  runner for tasks\nstar  prompt");
});

test("summary skips junk and falls back to why", () => {
  const t = { name: "x", bin: ["x"], why: "does things" };
  expect(summary(t, ["(env: A_B)", "values: text, json]", "Usage: x"])).toBe("does things");
  expect(summary(t, ["x 1.0.0", "A tiny file finder.", "", "Usage: x"])).toBe("A tiny file finder.");
});

test("subcommands reads the Commands section", () => {
  expect(subcommands(cleanHelp(HELP))).toEqual(["run", "scan"]);
});

test("render is deterministic, short and lint-parsable", () => {
  const tool = { name: "tool", bin: ["tool"], version: "1.0.0" };
  const m = { version: "1.0.0", help: cleanHelp(HELP) };
  const a = render(tool, m);
  expect(render(tool, m)).toBe(a);
  expect(a.split("\n").length).toBeLessThan(120);
  const p = parseSkill(a)!;
  expect(p.front.name).toBe("cli-tool");
  expect(p.front.description).toContain("tool 1.0.0");
  expect(a).toContain("just cli-skills");
});
