// Agent core tools on the relay MCP surface (replaces the former packages/mcp stdio server test).
process.env.RELAY_HUB = "0";
process.env.RELAY_BUILTIN_MCP = "0";
import { expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.AGENT_HOME = mkdtempSync(join(tmpdir(), "ai-os-relay-"));
const { mcpRpc } = await import("../../src/relay/protocols.ts");

test("MCP : outils de l'agent listés, aller-retour mémoire", async () => {
  const l: any = await mcpRpc({ jsonrpc: "2.0", id: 1, method: "tools/list" });
  const names = l.result.tools.map((t: any) => t.name);
  for (const n of [
    "memory_search",
    "memory_add",
    "skills_list",
    "council",
    "agent_run",
    "llm_models",
    "llm_ask",
  ])
    expect(names).toContain(n);
  await mcpRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: { name: "memory_add", arguments: { content: "the sky is teal" } },
  });
  const r: any = await mcpRpc({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "memory_search", arguments: { query: "sky" } },
  });
  expect(r.result.isError).toBe(false);
  expect(r.result.content[0].text).toContain("teal");
});

test("MCP : agent_run sur le modèle echo", async () => {
  const r: any = await mcpRpc({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "agent_run",
      arguments: { task: "ping", model: "echo/bot" },
    },
  });
  expect(r.result.structuredContent.text).toBe("bot: ping");
});
