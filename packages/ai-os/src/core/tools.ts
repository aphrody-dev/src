import type { Mask } from "./context";
// Tool set exposed to the model (JSON Schema tools, ../llm); names mirror OpenClaw/Hermes core tools.
import { isAbsolute, relative, resolve } from "node:path";
import { tool } from "../llm/generate";
import { s } from "../llm/schema";
import type { Memory } from "./memory";
import { redactText } from "./secrets";
import { resolveBash } from "./shell";
import type { Skills } from "./skills";

export type ToolCtx = {
  cwd: string;
  memory: Memory;
  skills: Skills;
  allowShell: boolean;
  /** The run's permission mask: memory_search and skill_view never read outside it. */
  mask?: Mask;
};

function inside(cwd: string, p: string) {
  const abs = resolve(cwd, p);
  const rel = relative(cwd, abs);
  if (rel.startsWith("..") || isAbsolute(rel))
    throw new Error(`path escapes workspace: ${p}`);
  return abs;
}

export function makeTools(ctx: ToolCtx) {
  return {
    read_file: tool({
      description: "Read a UTF-8 file inside the workspace.",
      inputSchema: s.object({ path: s.string() }),
      execute: async ({ path }) => Bun.file(inside(ctx.cwd, path)).text(),
    }),
    write_file: tool({
      description: "Write a UTF-8 file inside the workspace.",
      inputSchema: s.object({ path: s.string(), content: s.string() }),
      execute: async ({ path, content }) =>
        `wrote ${await Bun.write(inside(ctx.cwd, path), content)} bytes`,
    }),
    shell: tool({
      description:
        "Run a command in the workspace: `argv` (no shell) or `script` (bash script, native bash on Windows). Returns exit code and output.",
      inputSchema: s.object(
        { argv: s.array(s.string(), { minItems: 1 }), script: s.string() },
        ["argv", "script"],
      ),
      execute: async ({ argv, script }) => {
        if (!ctx.allowShell) return "shell disabled (pass --allow-shell)";
        let cmd = argv;
        if (script) {
          const bash = resolveBash();
          if (!bash) return "no native bash found (set AGENT_BASH)";
          cmd = [bash, "-c", script];
        }
        if (!cmd) return "give argv or script";
        const p = Bun.spawnSync(cmd, {
          cwd: ctx.cwd,
          stdout: "pipe",
          stderr: "pipe",
        });
        return redactText(
          `exit=${p.exitCode}\n${p.stdout.toString()}${p.stderr.toString()}`,
          Bun.env,
        ).slice(0, 16_000);
      },
    }),
    memory_add: tool({
      description: "Persist a durable fact or preference to long-term memory.",
      inputSchema: s.object({ content: s.string(), scope: s.string() }, [
        "scope",
      ]),
      execute: async ({ content, scope }) =>
        `memory #${await ctx.memory.add(content, scope)}`,
    }),
    memory_search: tool({
      description: "Full-text search of long-term memory.",
      inputSchema: s.object({ query: s.string() }),
      execute: async ({ query }) => {
        if (ctx.mask?.sources && !ctx.mask.sources.includes("memory"))
          return [];
        const r = await ctx.memory.ctx.select(query, {
          ...ctx.mask,
          sources: ["memory"],
          k: 8,
          budgetTokens: 1e9,
          weights: { recency: 0.05 },
          redact: Bun.env,
        });
        return r.map((x) => x.text);
      },
    }),
    skill_create: tool({
      description:
        "Save a reusable procedure as an Agent Skill (SKILL.md) after completing a task.",
      inputSchema: s.object({
        name: s.string(),
        description: s.string(),
        body: s.string(),
      }),
      execute: async ({ name, description, body }) => {
        const r = await ctx.skills.create(name, description, body);
        return [
          r.path,
          ...r.warnings.map((w) => `warning ${w.rule}: ${w.message}`),
        ].join("\n");
      },
    }),
    skill_view: tool({
      description:
        "Load the full body of an agent skill by name before following it.",
      inputSchema: s.object({ name: s.string() }),
      execute: async ({ name }) => {
        // Skills are indexed as `skill:<name>` entries; the run's mask decides whether this one is visible.
        const m = ctx.mask;
        if (m) {
          const e = ctx.memory.ctx.get(`skill:${name}`);
          if (
            !e ||
            !ctx.memory.ctx.visible(e, {
              ...m,
              sources: m.sources ?? ["skill"],
            })
          )
            return `no skill ${name}`;
        }
        return (await ctx.skills.view(name))?.body ?? `no skill ${name}`;
      },
    }),
  };
}
