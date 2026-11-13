// Gateway (OpenClaw gateway concept, bun-native): one Bun.serve process exposing the agent to
// - WebSocket sessions (/ws, JSON frames {type:"message", session, text})
// - OpenAI-compatible chat (/v1/chat/completions, non-streaming)
// A2A is served once, by the relay (A2A 1.0.1 SendMessage, skill agent_run; src/relay/protocols.ts).
// - channels (/channels/<id>): pluggable adapters; Chat SDK adapters (Slack, Telegram, Discord, Teams...) plug in here.
// Sessions keep per-id history (multi-turn) and every turn goes through core run() (Context-selected memory/skills).
import { timingSafeEqual } from "node:crypto";
import { run } from "../core/agent";
import { layout } from "../core/home";
import { Memory } from "../core/memory";
import type { LanguageModel, Message } from "../llm/types";

export type Inbound = {
  channel: string;
  session: string;
  text: string;
  user?: string;
};
export interface Channel {
  id: string;
  /** Own authentication of a public webhook (provider signature). Without it the gateway token is required. */
  verify?(req: Request): Promise<boolean>;
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
    return {
      channel: id,
      session: String(j.session ?? "default"),
      text: String(j.text ?? ""),
      user: j.user,
    };
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
  /** Idle sessions are dropped after this many ms (default 1 h). */
  sessionTtlMs?: number;
  /** At most this many sessions are kept; the least recently used goes first (default 1000). */
  maxSessions?: number;
  /** Messages kept per session history (default 200). */
  maxHistory?: number;
};

export function createGateway(o: GatewayOptions) {
  const sessions = new Map<string, Message[]>();
  const seen = new Map<string, number>(); // session -> last use (insertion order = LRU order)
  const ttl = o.sessionTtlMs ?? 3_600_000;
  const maxSessions = o.maxSessions ?? 1000;
  const maxHistory = o.maxHistory ?? 200;
  const evict = (now = Date.now()) => {
    for (const [id, at] of seen) {
      if (now - at <= ttl && seen.size <= maxSessions) break;
      if (queue.has(id)) continue; // never drop a session with a turn in flight
      seen.delete(id);
      sessions.delete(id);
    }
  };
  // Keep one memory store open for the gateway's lifetime (shared with every turn).
  const memory = Memory.acquire(layout(o.home).memoryDb);
  const sweep = setInterval(evict, Math.min(ttl, 60_000));
  sweep.unref?.();
  const channels = new Map(
    (o.channels ?? [webhookChannel()]).map((c) => [c.id, c]),
  );
  const queue = new Map<string, Promise<unknown>>(); // serialize turns per session
  const turn = (session: string, text: string) => {
    const prev = queue.get(session) ?? Promise.resolve();
    const next = prev.then(async () => {
      seen.delete(session);
      seen.set(session, Date.now());
      evict();
      const history = sessions.get(session) ?? [];
      sessions.set(session, history);
      const r = await run({
        task: text,
        model: o.model,
        home: o.home,
        cwd: o.cwd ?? o.home,
        history,
        allowShell: o.allowShell,
      });
      if (history.length > maxHistory)
        history.splice(0, history.length - maxHistory);
      return r.text;
    });
    const settled = next
      .catch(() => {})
      .finally(() => {
        if (queue.get(session) === settled) queue.delete(session);
      });
    queue.set(session, settled);
    return next;
  };
  const same = (a: string | null, b: string) => {
    const x = Buffer.from(a ?? "");
    const y = Buffer.from(b);
    return x.length === y.length && timingSafeEqual(x, y);
  };
  const authed = (req: Request) =>
    !o.token || same(req.headers.get("authorization"), `Bearer ${o.token}`);

  const server = Bun.serve<{ session: string }>({
    // Agent turns outlast the default 10 s idle timeout.
    idleTimeout: 255,
    port: o.port ?? 0,
    hostname: o.hostname ?? "127.0.0.1",
    routes: {
      "/health": () => Response.json({ ok: true, sessions: sessions.size }),
      "/v1/chat/completions": {
        POST: async (req: Bun.BunRequest<"/v1/chat/completions">) => {
          if (!authed(req))
            return new Response("unauthorized", { status: 401 });
          const j: any = await req.json();
          const msgs: any[] = j.messages ?? [];
          const last = [...msgs].reverse().find((m) => m.role === "user");
          const session = String(
            j.user ?? req.headers.get("x-session") ?? "openai",
          );
          const text = await turn(
            session,
            typeof last?.content === "string"
              ? last.content
              : JSON.stringify(last?.content ?? ""),
          );
          return Response.json({
            id: `chatcmpl-${crypto.randomUUID()}`,
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: j.model ?? "agent",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: text },
                finish_reason: "stop",
              },
            ],
          });
        },
      },
      "/channels/:id": {
        POST: async (req: Bun.BunRequest<"/channels/:id">) => {
          const ch = channels.get(req.params.id);
          if (!ch) return new Response("unknown channel", { status: 404 });
          if (!(ch.verify ? await ch.verify(req.clone()) : authed(req)))
            return new Response("unauthorized", { status: 401 });
          const msg = await ch.parse(req);
          if (msg instanceof Response) return msg;
          const text = await turn(`${ch.id}:${msg.session}`, msg.text);
          return (
            (await ch.reply(msg, text)) ?? new Response(null, { status: 204 })
          );
        },
      },
    },
    fetch(req, srv) {
      if (new URL(req.url).pathname === "/ws") {
        if (
          !authed(req) &&
          !same(new URL(req.url).searchParams.get("token"), o.token ?? "")
        )
          return new Response("unauthorized", { status: 401 });
        if (srv.upgrade(req, { data: { session: crypto.randomUUID() } }))
          return undefined;
      }
      return new Response("not found", { status: 404 });
    },
    websocket: {
      async message(ws, raw) {
        let f: any;
        try {
          f = JSON.parse(String(raw));
        } catch {
          return void ws.send(
            JSON.stringify({ type: "error", error: "bad json" }),
          );
        }
        if (f.type !== "message")
          return void ws.send(
            JSON.stringify({ type: "error", error: "unknown frame" }),
          );
        const session = String(f.session ?? ws.data.session);
        ws.send(JSON.stringify({ type: "ack", session }));
        try {
          ws.send(
            JSON.stringify({
              type: "reply",
              session,
              text: await turn(`ws:${session}`, String(f.text ?? "")),
            }),
          );
        } catch (e) {
          ws.send(
            JSON.stringify({
              type: "error",
              session,
              error: e instanceof Error ? e.message : String(e),
            }),
          );
        }
      },
    },
  });
  return {
    server,
    url: server.url,
    sessions,
    evict,
    stop: () => {
      clearInterval(sweep);
      Memory.release(memory);
      return server.stop(true);
    },
  };
}
