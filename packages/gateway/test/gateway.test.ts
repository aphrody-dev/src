import { afterAll, expect, test } from "bun:test";
import { resolveModel } from "@aphrody/agent-core";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "../src";

const home = mkdtempSync(join(tmpdir(), "agent-gw-"));
const gw = createGateway({ home, model: resolveModel("echo:gw") });
afterAll(() => gw.stop());
const url = (p: string) => new URL(p, gw.url).href;

test("gateway: openai-compatible, a2a, webhook channel, websocket", async () => {
  const oa: any = await (await fetch(url("/v1/chat/completions"), { method: "POST", body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }) })).json();
  expect(oa.choices[0].message.content).toBe("gw: hi");

  const cardRes: any = await (await fetch(url("/.well-known/agent-card.json"))).json();
  expect(cardRes.url).toEndWith("/a2a");
  const a2a: any = await (
    await fetch(url("/a2a"), {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "message/send", params: { message: { role: "user", messageId: "m1", parts: [{ kind: "text", text: "ping" }] } } }),
    })
  ).json();
  expect(a2a.result.parts[0].text).toBe("gw: ping");

  const ch: any = await (await fetch(url("/channels/webhook"), { method: "POST", body: JSON.stringify({ session: "s1", text: "yo" }) })).json();
  expect(ch.text).toBe("gw: yo");
  expect(gw.sessions.get("webhook:s1")?.length).toBe(2);

  const ws = new WebSocket(url("/ws").replace("http", "ws"));
  const reply = await new Promise<any>((res, rej) => {
    ws.onopen = () => ws.send(JSON.stringify({ type: "message", session: "w", text: "over ws" }));
    ws.onmessage = (e) => {
      const f = JSON.parse(String(e.data));
      if (f.type === "reply") res(f);
    };
    ws.onerror = rej;
  });
  expect(reply.text).toBe("gw: over ws");
  ws.close();
});
