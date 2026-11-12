// Agent loop: Vercel AI SDK generateText + tools + stop condition; recalled memory and skills go into the system prompt.
import { generateText, isStepCount, type LanguageModel, type ModelMessage } from "ai";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { Memory } from "./memory";
import { Skills } from "./skills";
import { makeTools } from "./tools";

export type RunOptions = {
  task: string;
  model: LanguageModel;
  home: string;
  cwd: string;
  maxSteps?: number;
  allowShell?: boolean;
  /** Prior turns for multi-turn sessions (TUI); the new turn is appended to it in place. */
  history?: ModelMessage[];
};

export async function run(o: RunOptions) {
  mkdirSync(o.home, { recursive: true });
  const memory = new Memory(join(o.home, "memory.sqlite"));
  const skills = new Skills(join(o.home, "skills"));
  try {
    const known = await skills.list();
    const recalled = [...new Set([...memory.search(o.task), ...memory.recent(4)])];
    const system = [
      "You are agent, an autonomous assistant running natively on the user's machine.",
      "Act through tools. When a task succeeds and the procedure is reusable, call skill_create. Persist durable facts with memory_add.",
      known.length ? `Skills:\n${known.map((s) => `- ${s.name}: ${s.description}`).join("\n")}` : "",
      recalled.length ? `Memory:\n${recalled.map((m) => `- ${m}`).join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const r = await generateText({
      model: o.model,
      system,
      ...(o.history ? { messages: [...o.history, { role: "user" as const, content: o.task }] } : { prompt: o.task }),
      tools: makeTools({ cwd: o.cwd, memory, skills, allowShell: o.allowShell ?? false }),
      stopWhen: isStepCount(o.maxSteps ?? 16),
    });
    memory.logRun(o.task, r.text, r.steps.length);
    o.history?.push({ role: "user", content: o.task }, ...r.response.messages);
    return {
      text: r.text,
      steps: r.steps.length,
      toolCalls: r.steps.flatMap((s) => s.toolCalls.map((c) => c.toolName)),
    };
  } finally {
    memory.close();
  }
}
