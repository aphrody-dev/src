#!/usr/bin/env bun
// agent run <task> | agent schedule add <name> <task> --every 1h | agent schedule list | agent heartbeat [--once]
// agent skills lint|curate | agent tui     (common flags: --home DIR --model provider:id --allow-shell)
import { homedir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { run } from "./agent";
import { resolveModel } from "./model";
import { heartbeat, parseEvery, Scheduler } from "./scheduler";
import { lintContent } from "./skill-lint";
import { Skills } from "./skills";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    "allow-shell": { type: "boolean" },
    home: { type: "string" },
    model: { type: "string" },
    "max-steps": { type: "string" },
    every: { type: "string" },
    interval: { type: "string" },
    once: { type: "boolean" },
  },
});
const home = values.home ?? Bun.env.AGENT_HOME ?? join(homedir(), ".agent");
const [cmd, sub, ...rest] = positionals;
const usage = () => {
  console.error(
    "usage: agent run <task> | schedule add <name> <task> --every 1h | schedule list | heartbeat [--once] | skills lint|curate | tui",
  );
  process.exit(2);
};

switch (cmd) {
  case "run": {
    const task = [sub, ...rest].filter(Boolean).join(" ");
    if (!task) usage();
    const r = await run({
      task,
      model: resolveModel(values.model),
      home,
      cwd: process.cwd(),
      allowShell: values["allow-shell"],
      maxSteps: values["max-steps"] ? Number(values["max-steps"]) : undefined,
    });
    console.log(r.text);
    console.error(`[agent] steps=${r.steps} tools=${r.toolCalls.join(",") || "none"}`);
    break;
  }
  case "schedule": {
    const s = new Scheduler(join(home, "scheduler.sqlite"));
    if (sub === "add" && rest.length >= 2) {
      const [name, ...task] = rest;
      console.log(`job #${s.add(name!, task.join(" "), { everyMs: values.every ? parseEvery(values.every) : undefined })}`);
    } else if (sub === "list") {
      for (const j of s.list())
        console.log(`#${j.id} ${j.name} next=${new Date(j.next_at).toISOString()} every=${j.every_ms ?? "-"} ${j.enabled ? "" : "(done)"}`);
    } else if (sub === "rm" && rest[0]) s.remove(Number(rest[0]));
    else usage();
    s.close();
    break;
  }
  case "heartbeat":
    await heartbeat({
      home,
      cwd: process.cwd(),
      model: resolveModel(values.model),
      once: values.once,
      intervalMs: values.interval ? parseEvery(values.interval) : undefined,
      onEvent: (e) => console.log(`[${e.kind}] ${e.name} ${e.ok ? "ok" : "failed"}: ${e.text}`),
    });
    break;
  case "skills": {
    const skills = new Skills(join(home, "skills"));
    if (sub === "lint") {
      let errors = 0;
      for (const s of await skills.list()) {
        for (const f of lintContent(await Bun.file(s.path).text(), join(home, "skills", s.name))) {
          if (f.severity === "error") errors++;
          console.log(`${s.name}: ${f.severity} ${f.rule}: ${f.message}`);
        }
      }
      process.exit(errors ? 1 : 0);
    } else if (sub === "curate") console.log(JSON.stringify(await skills.curate()));
    else usage();
    break;
  }
  case "tui": {
    const { startTui } = await import("@aphrody/agent-tui");
    await startTui({ home, model: resolveModel(values.model), allowShell: values["allow-shell"] });
    break;
  }
  default:
    usage();
}
