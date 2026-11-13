import { afterAll, expect, test } from "bun:test";
import { resolveModel } from "../../src/core/model";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createGateway } from "../../src/gateway/index";

const home = mkdtempSync(join(tmpdir(), "agent-gw-"));
const gw = createGateway({ home, model: await resolveModel("echo/gw") });
afterAll(() => gw.stop());
const url = (p: string) => new URL(p, gw.url).href;

test("gateway: openai-compatible, webhook channel, websocket (A2A lives in the relay)", async () => {
  const oa: any = await (
    await fetch(url("/v1/chat/completions"), {
      method: "POST",
      body: JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
    })
  ).json();
  expect(oa.choices[0].message.content).toBe("gw: hi");

  expect(
    (await fetch(url("/a2a"), { method: "POST", body: "{}" })).status,
  ).toBe(404);

  const ch: any = await (
    await fetch(url("/channels/webhook"), {
      method: "POST",
      body: JSON.stringify({ session: "s1", text: "yo" }),
    })
  ).json();
  expect(ch.text).toBe("gw: yo");
  expect(gw.sessions.get("webhook:s1")?.length).toBe(2);

  const ws = new WebSocket(url("/ws").replace("http", "ws"));
  const reply = await new Promise<any>((res, rej) => {
    ws.onopen = () =>
      ws.send(
        JSON.stringify({ type: "message", session: "w", text: "over ws" }),
      );
    ws.onmessage = (e) => {
      const f = JSON.parse(String(e.data));
      if (f.type === "reply") res(f);
    };
    ws.onerror = rej;
  });
  expect(reply.text).toBe("gw: over ws");
  ws.close();
});
