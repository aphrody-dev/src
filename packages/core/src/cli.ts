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
    validate: { type: "boolean" },
    batch: { type: "string" },
    "no-web": { type: "boolean" },
  },
});
const home = values.home ?? Bun.env.AGENT_HOME ?? join(homedir(), ".agent");
const [cmd, sub, ...rest] = positionals;
const usage = () => {
  console.error(
    "usage: agent init | run <task> | context <query> | schedule add <name> <task> --every 1h | schedule list | heartbeat [--once] | skills lint|curate | research <outline.yaml> [--validate] | tui",
  );
  process.exit(2);
};

switch (cmd) {
  case "init": {
    const { init } = await import("./home");
    for (const p of await init(home)) console.log(`created ${p}`);
    console.log(`home: ${home}`);
    break;
  }
  case "context": {
    const q = [sub, ...rest].filter(Boolean).join(" ");
    if (!q) usage();
    const { Memory } = await import("./memory");
    const m = new Memory(join(home, "memory.sqlite"));
    for (const s of await m.ctx.select(q, { redact: Bun.env }))
      console.log(`${s.score.toFixed(3)} ${s.id} [${Object.entries(s.heads).map(([h, v]) => `${h}=${v.toFixed(2)}`).join(" ")}] ${(s.title ?? s.text).slice(0, 80)}`);
    m.close();
    break;
  }
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
  case "research": {
    if (!sub) usage();
    const r = await import("@aphrody/agent-research");
    if (values.validate) {
      const v = await r.validateDir(sub!);
      for (const x of v) console.log(`${x.ok ? "PASS" : "FAIL"} ${x.file} ${x.errors.join("; ")}`);
      process.exit(v.every((x) => x.ok) ? 0 : 1);
    }
    const out = await r.research({
      outlinePath: sub!,
      model: resolveModel(values.model),
      home,
      batchSize: values.batch ? Number(values.batch) : undefined,
      web: !values["no-web"],
      onItem: (e) => console.log(`${e.ok ? "PASS" : "FAIL"} ${e.item} -> ${e.path} ${e.errors.join("; ")}`),
    });
    console.error(`[research] ${out.topic}: ${out.passed}/${out.results.length} passed, results in ${out.outDir}`);
    process.exit(out.passed === out.results.length ? 0 : 1);
  }
  case "tui": {
    const { startTui } = await import("@aphrody/agent-tui");
    await startTui({ home, model: resolveModel(values.model), allowShell: values["allow-shell"] });
    break;
  }
  default:
    usage();
}
