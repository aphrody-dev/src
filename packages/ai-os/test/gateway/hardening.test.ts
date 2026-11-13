import { expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveModel } from "../../src/core/model";
import { createGateway, trimHistory } from "../../src/gateway/index";
import { stringify } from "../../src/llm/generate";
import type { Message } from "../../src/llm/types";
import { dispatch } from "../../src/relay/protocols";

test("trimHistory keeps tool results with their tool call", () => {
  const h = [
    { role: "user", content: "a" },
    {
      role: "assistant",
      content: "",
      toolCalls: [{ id: "1", name: "t", args: {} }],
    },
    { role: "tool", content: "r", toolCallId: "1" },
    { role: "assistant", content: "done" },
    { role: "user", content: "b" },
    { role: "assistant", content: "ok" },
  ] as unknown as Message[];
  trimHistory(h, 4);
  expect(h.map((m) => m.role)).toEqual(["user", "assistant"]);
});

test("stringify never throws on BigInt or cycles", () => {
  const c: any = {};
  c.c = c;
  expect(stringify(10n)).toBe("10");
  expect(typeof stringify(c)).toBe("string");
  expect(stringify(undefined)).toBe("null");
});

test("JSON-RPC: notifications get no response, invalid id/params are -32600", async () => {
  const h = async (r: any) => ({
    jsonrpc: "2.0" as const,
    id: r.id ?? null,
    result: 1,
  });
  expect(await dispatch({ jsonrpc: "2.0", method: "x" }, h)).toBeNull();
  const bad: any = await dispatch({ jsonrpc: "2.0", method: "x", id: {} }, h);
  expect(bad.error.code).toBe(-32600);
  expect(bad.id).toBeNull();
  const badParams: any = await dispatch(
    { jsonrpc: "2.0", method: "x", id: 1, params: 3 },
    h,
  );
  expect(badParams.error.code).toBe(-32600);
});

test("gateway: bad OpenAI requests are 400, anonymous turns are not kept", async () => {
  const home = join(
    mkdtempSync(join(tmpdir(), "agent-gw-h-")),
    "fresh",
    "home",
  ); // not created yet
  const g = createGateway({ home, model: await resolveModel("echo/gw") });
  const post = (body: string) =>
    fetch(new URL("/v1/chat/completions", g.url).href, {
      method: "POST",
      body,
    });
  expect((await post("{nope")).status).toBe(400);
  expect((await post(JSON.stringify({ messages: "x" }))).status).toBe(400);
  expect(
    (await post(JSON.stringify({ messages: [], stream: true }))).status,
  ).toBe(400);
  expect(
    (
      await post(
        JSON.stringify({ messages: [{ role: "system", content: "s" }] }),
      )
    ).status,
  ).toBe(400);
  const ok = await post(
    JSON.stringify({ messages: [{ role: "user", content: "hi" }] }),
  );
  expect(ok.status).toBe(200);
  expect(g.sessions.size).toBe(0);
  g.stop();
});

test("agent workspace: a symlink inside AGENT_HOME cannot escape it", async () => {
  const home = mkdtempSync(join(tmpdir(), "agent-ws-"));
  const outside = mkdtempSync(join(tmpdir(), "agent-out-"));
  mkdirSync(join(home, "ok"));
  let linked = true;
  try {
    symlinkSync(outside, join(home, "link"), "junction");
  } catch {
    linked = false;
  }
  const prev = Bun.env.AGENT_HOME;
  Bun.env.AGENT_HOME = home;
  try {
    const { workspace } = await import("../../src/relay/agent-tools");
    expect(workspace("ok/sub")).toContain("sub");
    expect(() => workspace("../x")).toThrow();
    if (linked) expect(() => workspace("link/deeper")).toThrow();
  } finally {
    Bun.env.AGENT_HOME = prev;
  }
});
