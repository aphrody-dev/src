// Agent core tools served by the relay, the single MCP server and A2A surface of @aphrody/ai-os (it replaces the
// former stdio server of packages/mcp): long-term memory, skills, council of agent CLIs, and a full agent run on a
// model discovered at run time. Home: AGENT_HOME, default ~/.agent (same store as the agent CLI).
import { homedir } from "node:os";
import { join } from "node:path";
import { run } from "../core/agent";
import { CLI, council } from "../core/council";
import { Memory } from "../core/memory";
import { Skills } from "../core/skills";
import { resolveModel } from "../llm/model";
import type { Tool } from "./tools.ts";

const home = () => Bun.env.AGENT_HOME ?? join(homedir(), ".agent");
const str = (description: string) => ({ type: "string", description });
const obj = (props: Record<string, unknown>, required: string[] = []) => ({
  type: "object",
  properties: props,
  required,
  additionalProperties: false,
});
const withMemory = async <T>(f: (m: Memory) => Promise<T>) => {
  const m = new Memory(join(home(), "memory.sqlite"));
  try {
    return await f(m);
  } finally {
    m.close();
  }
};
const MEMBERS = Object.keys(CLI);

export const AGENT_TOOLS: Tool[] = [
  {
    name: "memory_search",
    description: "Full-text search of the agent long-term memory.",
    inputSchema: obj({ query: str("Query") }, ["query"]),
    readOnly: true,
    run: (a) =>
      withMemory(async (m) => (await m.search(String(a.query))).join("\n")),
  },
  {
    name: "memory_add",
    description: "Persist a fact to the agent long-term memory.",
    inputSchema: obj({ content: str("Fact"), scope: str("Scope (optional)") }, [
      "content",
    ]),
    readOnly: false,
    run: (a) =>
      withMemory(
        async (m) => `memory #${await m.add(String(a.content), a.scope)}`,
      ),
  },
  {
    name: "skills_list",
    description: "List the agent skills (SKILL.md).",
    inputSchema: obj({}),
    readOnly: true,
    run: async () =>
      (await new Skills(join(home(), "skills")).list())
        .map((s) => `${s.name}: ${s.description}`)
        .join("\n"),
  },
  {
    name: "council",
    description: `Ask several agent CLIs (${MEMBERS.join(", ")}) in parallel and return a consensus report.`,
    inputSchema: obj(
      {
        prompt: str("Prompt"),
        members: {
          type: "array",
          items: { type: "string", enum: MEMBERS },
          description: "Members (default: all found on PATH)",
        },
      },
      ["prompt"],
    ),
    readOnly: false,
    run: async (a) => {
      const ids: string[] =
        Array.isArray(a.members) && a.members.length
          ? a.members
          : MEMBERS.filter((id) => Bun.which(id));
      const r = await council(
        ids
          .filter((id) => CLI[id])
          .map((id) => ({ id, kind: "cli" as const, argv: CLI[id]! })),
        String(a.prompt),
      );
      return r.summary;
    },
  },
  {
    name: "agent_run",
    description:
      "Run one agent task (tool loop over memory, skills and workspace files) on a model discovered at run time (provider/model from llm_models; default AGENT_MODEL or the first discovered model).",
    inputSchema: obj(
      {
        task: str("Task"),
        model: str("provider/model (optional)"),
        cwd: str("Workspace directory (optional, default AGENT_HOME)"),
      },
      ["task"],
    ),
    readOnly: false,
    run: async (a) => {
      const r = await run({
        task: String(a.task),
        model: await resolveModel(a.model),
        home: home(),
        cwd: a.cwd ?? home(),
      });
      return { text: r.text, steps: r.steps, toolCalls: r.toolCalls };
    },
  },
];
