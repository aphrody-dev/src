#!/usr/bin/env bun
// agent run "<task>" [--allow-shell] [--home DIR] [--model provider:id] [--max-steps N]
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { run } from "./agent";
import { resolveModel } from "./model";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    "allow-shell": { type: "boolean" },
    home: { type: "string" },
    model: { type: "string" },
    "max-steps": { type: "string" },
  },
});
const [cmd, ...rest] = positionals;
if (cmd !== "run" || rest.length === 0) {
  console.error("usage: agent run <task> [--allow-shell] [--home DIR] [--model provider:id]");
  process.exit(2);
}
const r = await run({
  task: rest.join(" "),
  model: resolveModel(values.model),
  home: values.home ?? Bun.env.AGENT_HOME ?? join(homedir(), ".agent"),
  cwd: process.cwd(),
  allowShell: values["allow-shell"],
  maxSteps: values["max-steps"] ? Number(values["max-steps"]) : undefined,
});
console.log(r.text);
console.error(`[agent] steps=${r.steps} tools=${r.toolCalls.join(",") || "none"}`);
