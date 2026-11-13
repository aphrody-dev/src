// Cadrage des protocoles (sans moteur : seuls les outils en lecture et les erreurs sont appelés).
// Sans agrégation : aucun serveur MCP externe lancé pendant les tests.
process.env.RELAY_HUB = "0";
process.env.RELAY_BUILTIN_MCP = "0";
import { expect, test } from "bun:test";
import {
  a2aRpc,
  agentCard,
  dispatch,
  MCP_VERSIONS,
  mcpRpc,
} from "../../src/relay/protocols.ts";

test("MCP 2025-11-25 : initialize puis tools/list", async () => {
  const init: any = await mcpRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-11-25", capabilities: {} },
  });
  expect(init.result.protocolVersion).toBe("2025-11-25");
  const list: any = await mcpRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
  });
  expect(list.result.tools.map((t: any) => t.name)).toContain("gemini_ask");
  expect(list.result.resultType).toBeUndefined();
});

test("MCP 2026-07-28 : server/discover, _meta par requête, version refusée", async () => {
  const meta = { "io.modelcontextprotocol/protocolVersion": "2026-07-28" };
  const d: any = await mcpRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "server/discover",
    params: { _meta: meta },
  });
  expect(d.result.supportedVersions).toEqual(MCP_VERSIONS);
  const l: any = await mcpRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: { _meta: meta },
  });
  expect(l.result.resultType).toBe("complete");
  expect(l.result.cacheScope).toBe("private");
  const bad: any = await mcpRpc({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/list",
    params: {
      _meta: { "io.modelcontextprotocol/protocolVersion": "1999-01-01" },
    },
  });
  expect(bad.error.message).toBe("UnsupportedProtocolVersionError");
});

test("MCP : outil inconnu et notification sans réponse", async () => {
  const r: any = await mcpRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "nope" },
  });
  expect(r.error.code).toBe(-32601);
  expect(
    await mcpRpc({ jsonrpc: "2.0", method: "notifications/initialized" }),
  ).toBeNull();
  expect(
    await dispatch(
      [{ jsonrpc: "2.0", method: "notifications/initialized" }],
      mcpRpc,
    ),
  ).toBeNull();
});

test("A2A 1.0 : carte d'agent et validation de SendMessage", async () => {
  const c = agentCard("http://127.0.0.1:8790");
  expect(c.supportedInterfaces[0]).toEqual({
    url: "http://127.0.0.1:8790/a2a",
    protocolBinding: "JSONRPC",
    protocolVersion: "1.0",
  });
  const r: any = await a2aRpc({
    jsonrpc: "2.0",
    id: 1,
    method: "SendMessage",
    params: { message: { role: "ROLE_USER" } },
  });
  expect(r.error.code).toBe(-32602);
  const m: any = await a2aRpc({
    jsonrpc: "2.0",
    id: 2,
    method: "message/send",
    params: {},
  });
  expect(m.error.code).toBe(-32601);
});
