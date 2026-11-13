// Gateway (OpenClaw gateway concept, bun-native): one Bun.serve process exposing the agent to
// - WebSocket sessions (/ws, JSON frames {type:"message", session, text})
// - OpenAI-compatible chat (/v1/chat/completions, non-streaming)
// - A2A (agent card at /.well-known/agent-card.json, JSON-RPC message/send at /a2a)
// - channels (/channels/<id>): pluggable adapters; Chat SDK adapters (Slack, Telegram, Discord, Teams...) plug in here.
// Sessions keep per-id history (multi-turn) and every turn goes through core run() (Context-selected memory/skills).
import { run } from "@aphrody/agent-core";
import type { LanguageModel, ModelMessage } from "ai";

export type Inbound = { channel: string; session: string; text: string; user?: string };
export interface Channel {
  id: string;
  /** Parse a webhook request into an inbound message (or a direct Response, e.g. a verification challenge). */
  parse(req: Request): Promise<Inbound | Response>;
  /** Deliver the reply (for push channels); return value becomes the HTTP response body when defined. */
  reply(msg: Inbound, text: string): Promise<Response | undefined>;
}

/** Generic JSON webhook channel: POST {session, text} -> {text}. Also the mock channel for tests (crabline role). */
export const webhookChannel = (id = "webhook"): Channel => ({
  id,
  async parse(req) {
    const j: any = await req.json();
    return { channel: id, session: String(j.session ?? "default"), text: String(j.text ?? ""), user: j.user };
  },
  async reply(_m, text) {
    return Response.json({ text });
  },
});

export type GatewayOptions = {
  home: string;
  model: LanguageModel;
  cwd?: string;
  port?: number;
  hostname?: string;
  token?: string;
  channels?: Channel[];
  name?: string;
  allowShell?: boolean;
};

export function createGateway(o: GatewayOptions) {
  const sessions = new Map<string, ModelMessage[]>();
  const channels = new Map((o.channels ?? [webhookChannel()]).map((c) => [c.id, c]));
  const queue = new Map<string, Promise<unknown>>(); // serialize turns per session
  const turn = (session: string, text: string) => {
    const prev = queue.get(session) ?? Promise.resolve();
    const next = prev.then(async () => {
      const history = sessions.get(session) ?? [];
      sessions.set(session, history);
      const r = await run({ task: text, model: o.model, home: o.home, cwd: o.cwd ?? o.home, history, allowShell: o.allowShell });
      return r.text;
    });
    queue.set(session, next.catch(() => {}));
    return next;
  };
  const authed = (req: Request) => !o.token || req.headers.get("authorization") === `Bearer ${o.token}`;
  const card = (origin: string) => ({
    protocolVersion: "0.3.0",
    name: o.name ?? "agent",
    description: "Autonomous agent (memory, skills, tools).",
    url: `${origin}/a2a`,
    version: "0.1.0",
    capabilities: { streaming: false, pushNotifications: false },
    defaultInputModes: ["text/plain"],
    defaultOutputModes: ["text/plain"],
    skills: [{ id: "chat", name: "chat", description: "General task execution", tags: ["general"] }],
  });

  const server = Bun.serve<{ session: string }>({
    port: o.port ?? 0,
    hostname: o.hostname ?? "127.0.0.1",
    routes: {
      "/health": () => Response.json({ ok: true, sessions: sessions.size }),
      "/.well-known/agent-card.json": (req) => Response.json(card(new URL(req.url).origin)),
      "/v1/chat/completions": {
        POST: async (req) => {
          if (!authed(req)) return new Response("unauthorized", { status: 401 });
          const j: any = await req.json();
          const msgs: any[] = j.messages ?? [];
          const last = [...msgs].reverse().find((m) => m.role === "user");
          const session = String(j.user ?? req.headers.get("x-session") ?? "openai");
          const text = await turn(session, typeof last?.content === "string" ? last.content : JSON.stringify(last?.content ?? ""));
          return Response.json({
            id: `chatcmpl-${crypto.randomUUID()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: j.model ?? "agent",
            choices: [{ index: 0, message: { role: "assistant", content: text }, finish_reason: "stop" }],
          });
        },
      },
      "/a2a": {
        POST: async (req) => {
          if (!authed(req)) return new Response("unauthorized", { status: 401 });
          const j: any = await req.json();
          const err = (code: number, message: string) => Response.json({ jsonrpc: "2.0", id: j.id ?? null, error: { code, message } });
          if (j.method !== "message/send") return err(-32601, "method not found");
          const m = j.params?.message;
          const text = (m?.parts ?? []).filter((p: any) => p.kind === "text").map((p: any) => p.text).join("\n");
          if (!text) return err(-32602, "message needs a text part");
          const contextId = m.contextId ?? crypto.randomUUID();
          const out = await turn(`a2a:${contextId}`, text);
          return Response.json({
            jsonrpc: "2.0",
            id: j.id,
            result: { kind: "message", role: "agent", messageId: crypto.randomUUID(), contextId, parts: [{ kind: "text", text: out }] },
          });
        },
      },
      "/channels/:id": {
        POST: async (req) => {
          const ch = channels.get(req.params.id);
          if (!ch) return new Response("unknown channel", { status: 404 });
          const msg = await ch.parse(req);
          if (msg instanceof Response) return msg;
          const text = await turn(`${ch.id}:${msg.session}`, msg.text);
          return (await ch.reply(msg, text)) ?? new Response(null, { status: 204 });
        },
      },
    },
    fetch(req, srv) {
      if (new URL(req.url).pathname === "/ws") {
        if (!authed(req) && new URL(req.url).searchParams.get("token") !== o.token) return new Response("unauthorized", { status: 401 });
        if (srv.upgrade(req, { data: { session: crypto.randomUUID() } })) return undefined;
      }
      return new Response("not found", { status: 404 });
    },
    websocket: {
      async message(ws, raw) {
        let f: any;
        try {
          f = JSON.parse(String(raw));
        } catch {
          return ws.send(JSON.stringify({ type: "error", error: "bad json" }));
        }
        if (f.type !== "message") return ws.send(JSON.stringify({ type: "error", error: "unknown frame" }));
        const session = String(f.session ?? ws.data.session);
        ws.send(JSON.stringify({ type: "ack", session }));
        try {
          ws.send(JSON.stringify({ type: "reply", session, text: await turn(`ws:${session}`, String(f.text ?? "")) }));
        } catch (e) {
          ws.send(JSON.stringify({ type: "error", session, error: e instanceof Error ? e.message : String(e) }));
        }
      },
    },
  });
  return { server, url: server.url, sessions, stop: () => server.stop(true) };
}
