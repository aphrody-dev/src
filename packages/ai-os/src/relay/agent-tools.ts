// Agent core tools served by the relay, the single MCP server and A2A surface of @aphrody/ai-os (it replaces the
// former stdio server of packages/mcp): long-term memory, skills, council of agent CLIs, and a full agent run on a
// model discovered at run time. Home: AGENT_HOME, default ~/.agent (same store as the agent CLI).
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { run } from "../core/agent";
import { CLI, council } from "../core/council";
import { layout } from "../core/home";
import { Memory } from "../core/memory";
import { Skills } from "../core/skills";
import { resolveModel } from "../llm/model";
import { s } from "../llm/schema";
import type { Tool } from "./tools.ts";

const home = () => Bun.env.AGENT_HOME ?? join(homedir(), ".agent");
const str = s.string;
const withMemory = async <T>(f: (m: Memory) => Promise<T>) => {
  mkdirSync(home(), { recursive: true });
  const m = new Memory(layout(home()).memoryDb);
  try {
    return await f(m);
  } finally {
    m.close();
  }
};
const MEMBERS = Object.keys(CLI);
/** Remote callers may only pick a workspace inside AGENT_HOME. */
const workspace = (cwd?: string) => {
  const abs = resolve(home(), cwd ?? ".");
  const rel = relative(home(), abs);
  if (rel.startsWith("..") || isAbsolute(rel))
    throw new Error(`cwd hors de AGENT_HOME : ${cwd}`);
  mkdirSync(abs, { recursive: true });
  return abs;
};

export const AGENT_TOOLS: Tool[] = [
  {
    name: "memory_search",
    description: "Full-text search of the agent long-term memory.",
    inputSchema: s.object({ query: str("Query") }),
    readOnly: true,
    run: (a) =>
      withMemory(async (m) => (await m.search(String(a.query))).join("\n")),
  },
  {
    name: "memory_add",
    description: "Persist a fact to the agent long-term memory.",
    inputSchema: s.object(
      { content: str("Fact"), scope: str("Scope (optional)") },
      ["scope"],
    ),
    readOnly: false,
    run: (a) =>
      withMemory(
        async (m) => `memory #${await m.add(String(a.content), a.scope)}`,
      ),
  },
  {
    name: "skills_list",
    description: "List the agent skills (SKILL.md).",
    inputSchema: s.object({}),
    readOnly: true,
    run: async () =>
      (await new Skills(layout(home()).skills).list())
        .map((s) => `${s.name}: ${s.description}`)
        .join("\n"),
  },
  {
    name: "council",
    description: `Ask several agent CLIs (${MEMBERS.join(", ")}) in parallel and return a consensus report.`,
    inputSchema: s.object(
      {
        prompt: str("Prompt"),
        members: s.array(s.enum(MEMBERS), {
          description: "Members (default: all found on PATH)",
        }),
      },
      ["members"],
    ),
    readOnly: false,
    run: async (a) => {
      const ids: string[] =
        Array.isArray(a.members) && a.members.length
          ? a.members
          : MEMBERS.filter((id) => Bun.which(id));
      const members = ids.filter((id) => Object.hasOwn(CLI, id));
      if (!members.length) throw new Error("aucune CLI d'agent disponible");
      const r = await council(
        members.map((id) => ({ id, kind: "cli" as const, argv: CLI[id]! })),
        String(a.prompt),
      );
      return r.summary;
    },
  },
  {
    name: "agent_run",
    description:
      "Run one agent task (tool loop over memory, skills and workspace files) on a model discovered at run time (provider/model from llm_models; default AGENT_MODEL or the first discovered model).",
    inputSchema: s.object(
      {
        task: str("Task"),
        model: str("provider/model (optional)"),
        cwd: str("Workspace directory inside AGENT_HOME (optional)"),
      },
      ["model", "cwd"],
    ),
    readOnly: false,
    run: async (a) => {
      const r = await run({
        task: String(a.task),
        model: await resolveModel(a.model),
        home: home(),
        cwd: workspace(a.cwd),
      });
      return { text: r.text, steps: r.steps, toolCalls: r.toolCalls };
    },
  },
];
