#!/usr/bin/env bun
// Single MCP server (official SDK, stdio). Replaces the four legacy servers:
// ai-os/src/protocols/mcp.ts, ai-os/src/nexus/unified-mcp.ts, knowledge-engine/src/mcp/stdio.ts, ai-triad/src/server/gateway.ts.
// Exposes the agent core tools, memory, skills and the council.
import { CLI, council, Memory, Skills } from "@aphrody/agent-core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

export function createServer(home = Bun.env.AGENT_HOME ?? join(homedir(), ".agent")) {
  const memory = new Memory(join(home, "memory.sqlite"));
  const skills = new Skills(join(home, "skills"));
  const server = new McpServer({ name: "agent", version: "0.1.0" });
  const text = (t: string) => ({ content: [{ type: "text" as const, text: t }] });

  server.registerTool(
    "memory_search",
    { description: "Full-text search of agent long-term memory.", inputSchema: { query: z.string() } },
    async ({ query }) => text(memory.search(query).join("\n")),
  );
  server.registerTool(
    "memory_add",
    { description: "Persist a fact to agent memory.", inputSchema: { content: z.string() } },
    async ({ content }) => text(`memory #${memory.add(content)}`),
  );
  server.registerTool("skills_list", { description: "List agent skills (SKILL.md)." }, async () =>
    text((await skills.list()).map((s) => `${s.name}: ${s.description}`).join("\n")),
  );
  server.registerTool(
    "council",
    {
      description: "Ask several agent CLIs (claude, codex, gemini, agy) in parallel and return a consensus report.",
      inputSchema: { prompt: z.string(), members: z.array(z.enum(["claude", "codex", "gemini", "agy"])).optional() },
    },
    async ({ prompt, members }) => {
      const ids = members ?? ["claude", "codex", "gemini"];
      const r = await council(
        ids.map((id) => ({ id, kind: "cli" as const, argv: CLI[id]! })),
        prompt,
      );
      return text(r.summary);
    },
  );
  return { server, close: () => memory.close() };
}

if (import.meta.main) {
  const { server } = createServer();
  await server.connect(new StdioServerTransport());
}
