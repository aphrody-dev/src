// Agent Client Protocol (schéma v1, agentclientprotocol schema-v1.31.0) sur stdio : un éditeur compatible ACP utilise
// Gemini (ou Claude Code headless) comme agent. initialize, session/new, session/prompt (réponse en
// session/update agent_message_chunk puis stopReason end_turn), session/cancel.
import { claude, gemini } from "./backends.ts";

type Msg = {
  jsonrpc: "2.0";
  id?: number | string;
  method?: string;
  params?: any;
};
const sessions = new Map<
  string,
  { chat?: string; engine: "gemini" | "claude" }
>();
const write = (m: unknown) => process.stdout.write(`${JSON.stringify(m)}\n`);

async function handle(m: Msg) {
  const reply = (result: unknown) =>
    write({ jsonrpc: "2.0", id: m.id, result });
  const error = (code: number, message: string) =>
    write({ jsonrpc: "2.0", id: m.id, error: { code, message } });
  switch (m.method) {
    case "initialize":
      return reply({
        protocolVersion: 1,
        agentCapabilities: {
          loadSession: false,
          promptCapabilities: {
            image: false,
            audio: false,
            embeddedContext: true,
          },
        },
        authMethods: [],
        agentInfo: { name: "aphrody-relay", version: "0.1.0" },
      });
    case "session/new": {
      const id = crypto.randomUUID();
      sessions.set(id, {
        engine: m.params?._meta?.engine === "claude" ? "claude" : "gemini",
      });
      return reply({ sessionId: id });
    }
    case "session/prompt": {
      const s = sessions.get(m.params?.sessionId);
      if (!s) return error(-32602, "session inconnue");
      const prompt = (m.params.prompt as any[])
        .map((b) =>
          b.type === "text"
            ? b.text
            : b.type === "resource"
              ? `\n[${b.resource?.uri}]\n${b.resource?.text ?? ""}`
              : b.type === "resource_link"
                ? `[${b.uri}]`
                : "",
        )
        .join("\n");
      try {
        const a =
          s.engine === "claude"
            ? await claude(prompt)
            : await gemini(prompt, { chat: s.chat });
        if (a.chat) s.chat = a.chat;
        write({
          jsonrpc: "2.0",
          method: "session/update",
          params: {
            sessionId: m.params.sessionId,
            update: {
              sessionUpdate: "agent_message_chunk",
              content: { type: "text", text: a.text },
            },
          },
        });
        return reply({ stopReason: "end_turn" });
      } catch (e: any) {
        return error(-32000, e.message);
      }
    }
    case "session/cancel":
      return;
    default:
      if (m.id !== undefined)
        return error(-32601, `méthode ACP non prise en charge : ${m.method}`);
  }
}

export async function acp() {
  let buf = "";
  for await (const chunk of Bun.stdin.stream()) {
    buf += Buffer.from(chunk).toString("utf8");
    let i: number;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line)
        handle(JSON.parse(line)).catch((e) => process.stderr.write(`${e}\n`));
    }
  }
}
