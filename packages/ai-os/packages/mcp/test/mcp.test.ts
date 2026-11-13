import { expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "../src/server";

test("mcp: tools listed and memory roundtrip", async () => {
  const { server, close } = createServer(mkdtempSync(join(tmpdir(), "agent-mcp-")));
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a);
  const client = new Client({ name: "t", version: "0" });
  await client.connect(b);
  const names = (await client.listTools()).tools.map((t) => t.name).sort();
  expect(names).toEqual(["council", "memory_add", "memory_search", "skills_list"]);
  await client.callTool({ name: "memory_add", arguments: { content: "the sky is teal" } });
  const r: any = await client.callTool({ name: "memory_search", arguments: { query: "sky" } });
  expect(r.content[0].text).toContain("teal");
  await client.close();
  close();
});
