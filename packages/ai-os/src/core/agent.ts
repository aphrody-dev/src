// Agent loop = decoder. Native tool loop (../llm generateText); the prompt cross-attends to the Context index
// (memories, skills, research, docs) through Context.select (masked, softmax-merged, budgeted).
// System = static persona prefix (prompt-cache reuse) + per-task selected context.
import { mkdirSync } from "node:fs";
import { generateText } from "../llm/generate";
import type { LanguageModel, Message } from "../llm/types";
import { type Mask, renderContext } from "./context";
import { indexHomeDocs, layout, loadConfig, persona } from "./home";
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
  history?: Message[];
  /** Permission mask: which scopes/sources this run may attend to. */
  mask?: Mask;
  /** Force a tool call on the first step (weak local models that otherwise claim success without acting). */
  requireTool?: boolean;
};

export const INSTRUCTIONS =
  "You are agent, an autonomous assistant running natively on the user's machine. Act through tools. " +
  "When a task succeeds and the procedure is reusable, call skill_create; load a listed skill with skill_view before following it. " +
  "Persist durable facts with memory_add.";

export async function run(o: RunOptions) {
  const L = layout(o.home);
  mkdirSync(o.home, { recursive: true });
  const cfg = await loadConfig(o.home);
  const memory = Memory.acquire(L.memoryDb);
  const skills = new Skills(L.skills, memory.ctx);
  try {
    await skills.sync();
    await indexHomeDocs(o.home, memory.ctx);
    const selected = await memory.ctx.select(o.task, {
      sources: ["memory", "skill", "research", "doc"],
      ...cfg.context,
      ...o.mask,
      redact: Bun.env,
    });
    const prefix = [INSTRUCTIONS, await persona(o.home)]
      .filter(Boolean)
      .join("\n\n");
    const ctxBlock = renderContext(selected);
    const system = ctxBlock ? `${prefix}\n\n# Context\n\n${ctxBlock}` : prefix;
    const r = await generateText({
      model: o.model,
      system,
      messages: [...(o.history ?? []), { role: "user", content: o.task }],
      tools: makeTools({
        cwd: o.cwd,
        memory,
        skills,
        allowShell: o.allowShell ?? false,
      }),
      maxSteps: o.maxSteps ?? 16,
      requireToolFirst: o.requireTool,
      onStep: Bun.env.AGENT_DEBUG
        ? (st) => {
            for (const t of st.toolResults)
              console.error(
                `[tool] ${t.call.name} ${String(JSON.stringify(t.error ?? t.output ?? null)).slice(0, 300)}`,
              );
          }
        : undefined,
    });
    memory.logRun(o.task, r.text, r.steps.length);
    o.history?.push({ role: "user", content: o.task }, ...r.response);
    return {
      text: r.text,
      steps: r.steps.length,
      toolCalls: r.toolCalls.map((c) => c.name),
      context: selected.map((s) => ({ id: s.id, score: s.score })),
    };
  } finally {
    Memory.release(memory);
  }
}
