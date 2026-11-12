// Tool set exposed to the model (AI SDK `tool()`); names mirror OpenClaw/Hermes core tools.
import { tool } from "ai";
import { isAbsolute, relative, resolve } from "node:path";
import { z } from "zod";
import type { Memory } from "./memory";
import { redactText } from "./secrets";
import type { Skills } from "./skills";

export type ToolCtx = { cwd: string; memory: Memory; skills: Skills; allowShell: boolean };

function inside(cwd: string, p: string) {
  const abs = resolve(cwd, p);
  const rel = relative(cwd, abs);
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error(`path escapes workspace: ${p}`);
  return abs;
}

export function makeTools(ctx: ToolCtx) {
  return {
    read_file: tool({
      description: "Read a UTF-8 file inside the workspace.",
      inputSchema: z.object({ path: z.string() }),
      execute: async ({ path }) => Bun.file(inside(ctx.cwd, path)).text(),
    }),
    write_file: tool({
      description: "Write a UTF-8 file inside the workspace.",
      inputSchema: z.object({ path: z.string(), content: z.string() }),
      execute: async ({ path, content }) => `wrote ${await Bun.write(inside(ctx.cwd, path), content)} bytes`,
    }),
    shell: tool({
      description: "Run a command (argv form, no shell) in the workspace; returns exit code and output.",
      inputSchema: z.object({ argv: z.array(z.string()).min(1) }),
      execute: async ({ argv }) => {
        if (!ctx.allowShell) return "shell disabled (pass --allow-shell)";
        const p = Bun.spawnSync(argv, { cwd: ctx.cwd, stdout: "pipe", stderr: "pipe" });
        return redactText(`exit=${p.exitCode}\n${p.stdout.toString()}${p.stderr.toString()}`, Bun.env).slice(0, 16_000);
      },
    }),
    memory_add: tool({
      description: "Persist a durable fact or preference to long-term memory.",
      inputSchema: z.object({ content: z.string(), scope: z.string().optional() }),
      execute: async ({ content, scope }) => `memory #${ctx.memory.add(content, scope)}`,
    }),
    memory_search: tool({
      description: "Full-text search of long-term memory.",
      inputSchema: z.object({ query: z.string() }),
      execute: async ({ query }) => ctx.memory.search(query),
    }),
    skill_create: tool({
      description: "Save a reusable procedure as an Agent Skill (SKILL.md) after completing a task.",
      inputSchema: z.object({ name: z.string(), description: z.string(), body: z.string() }),
      execute: async ({ name, description, body }) => (await ctx.skills.create(name, description, body)).path,
    }),
  };
}
