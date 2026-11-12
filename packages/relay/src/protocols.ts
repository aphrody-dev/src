// Surfaces protocolaires du relais, toutes en JSON-RPC 2.0 sur les mêmes outils (tools.ts) :
//   - relais natif : méthodes `<outil>` (ex. gemini_ask) et `tools/list` ;
//   - MCP Streamable HTTP, double époque : 2025-11-25 (initialize) et 2026-07-28 (server/discover, sans état,
//     _meta par requête, resultType, ttlMs/cacheScope) — spec modelcontextprotocol@2026-07-28 ;
//   - A2A 1.0.1 (JSON-RPC, SendMessage, carte d'agent /.well-known/agent-card.json, supportedInterfaces).
import { hubCall, hubTools } from "./mcp-hub.ts";
import { TOOLS, toolByName } from "./tools.ts";

export const VERSION = "0.1.0";
export const MCP_VERSIONS = ["2026-07-28", "2025-11-25", "2025-06-18"];
type Req = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
};
type Res = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

const ok = (id: Req["id"], result: unknown): Res => ({
  jsonrpc: "2.0",
  id: id ?? null,
  result,
});
const fail = (
  id: Req["id"],
  code: number,
  message: string,
  data?: unknown,
): Res => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message, ...(data ? { data } : {}) },
});
const text = (v: unknown) =>
  typeof v === "string"
    ? v
    : (v as any)?.text && Object.keys(v as any).length <= 4
      ? String((v as any).text)
      : JSON.stringify(v, null, 1);

async function call(name: string, args: unknown) {
  const t = toolByName.get(name);
  if (!t && name.includes("__")) return hubCall(name, args);
  if (!t)
    throw Object.assign(new Error(`outil inconnu : ${name}`), { code: -32601 });
  return t.run(args ?? {});
}

/** Relais natif : { method: "gemini_ask", params: { prompt } } ; « tools/list » pour l'inventaire. */
export async function nativeRpc(r: Req): Promise<Res | null> {
  try {
    if (r.method === "tools/list")
      return ok(r.id, [
        ...TOOLS.map(({ run, ...t }) => t),
        ...(r.params?.hub === false ? [] : await hubTools()),
      ]);
    const v = await call(r.method, r.params);
    return r.id === undefined ? null : ok(r.id, v);
  } catch (e: any) {
    return fail(r.id, e.code ?? -32000, e.message);
  }
}

const serverInfo = { name: "aphrody-relay", version: VERSION };
// Outils propres puis outils des serveurs MCP utilisateur agrégés (<serveur>__<outil>), ordre déterministe.
const mcpTools = async () => [
  ...TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
    annotations: { readOnlyHint: t.readOnly, openWorldHint: !t.readOnly },
  })),
  ...(Bun.env.RELAY_HUB === "0"
    ? []
    : (await hubTools()).map(({ server, ...t }) => ({
        ...t,
        description: `[${server}] ${t.description ?? ""}`,
      }))),
];

export async function mcpRpc(r: Req): Promise<Res | null> {
  const modern = r.params?._meta?.["io.modelcontextprotocol/protocolVersion"];
  if (modern && !MCP_VERSIONS.includes(modern))
    return fail(r.id, -32602, "UnsupportedProtocolVersionError", {
      supported: MCP_VERSIONS,
      requested: modern,
    });
  const meta = { "io.modelcontextprotocol/serverInfo": serverInfo };
  const complete = (x: Record<string, unknown>) =>
    modern ? { resultType: "complete", _meta: meta, ...x } : x;
  try {
    switch (r.method) {
      case "server/discover":
        return ok(r.id, {
          resultType: "complete",
          supportedVersions: MCP_VERSIONS,
          capabilities: { tools: {} },
          _meta: meta,
          instructions:
            "Relais aphrody : Gemini (web/CLI), Claude Code headless, flotte VPS, gcloud.",
          ttlMs: 3_600_000,
          cacheScope: "private",
        });
      case "initialize": {
        const asked = r.params?.protocolVersion;
        return ok(r.id, {
          protocolVersion: MCP_VERSIONS.includes(asked) ? asked : "2025-11-25",
          capabilities: { tools: { listChanged: false } },
          serverInfo,
        });
      }
      case "notifications/initialized":
      case "notifications/cancelled":
        return null;
      case "ping":
        return ok(r.id, {});
      case "tools/list":
        return ok(
          r.id,
          complete({
            tools: await mcpTools(),
            ...(modern ? { ttlMs: 3_600_000, cacheScope: "private" } : {}),
          }),
        );
      case "tools/call": {
        try {
          const name = String(r.params?.name);
          const v = await call(name, r.params?.arguments);
          // Outil d'un serveur agrégé : son résultat MCP est renvoyé tel quel.
          if (!toolByName.has(name))
            return ok(r.id, complete(v as Record<string, unknown>));
          return ok(
            r.id,
            complete({
              content: [{ type: "text", text: text(v) }],
              structuredContent: v,
              isError: false,
            }),
          );
        } catch (e: any) {
          if (e.code === -32601) throw e;
          return ok(
            r.id,
            complete({
              content: [{ type: "text", text: e.message }],
              isError: true,
            }),
          );
        }
      }
      default:
        return r.id === undefined
          ? null
          : fail(r.id, -32601, `méthode MCP inconnue : ${r.method}`);
    }
  } catch (e: any) {
    return fail(r.id, e.code ?? -32603, e.message);
  }
}

export const agentCard = (url: string) => ({
  name: "aphrody-relay",
  description:
    "Relais entre Claude Code et Gemini (gemini.google.com ou Gemini CLI), avec flotte VPS et gcloud en lecture.",
  supportedInterfaces: [
    { url: `${url}/a2a`, protocolBinding: "JSONRPC", protocolVersion: "1.0" },
  ],
  provider: { organization: "Aphrody", url: "https://aphrody.com" },
  version: VERSION,
  capabilities: {
    streaming: false,
    pushNotifications: false,
    extendedAgentCard: false,
  },
  securitySchemes: { bearer: { httpAuthSecurityScheme: { scheme: "Bearer" } } },
  securityRequirements: [{ schemes: { bearer: { list: [] } } }],
  defaultInputModes: ["text/plain"],
  defaultOutputModes: ["text/plain"],
  skills: TOOLS.filter((t) => /ask|review/.test(t.name)).map((t) => ({
    id: t.name,
    name: t.name,
    description: t.description,
    tags: ["llm"],
    inputModes: ["text/plain"],
    outputModes: ["text/plain"],
  })),
});

/** A2A 1.0 : SendMessage -> message agent (réponse directe). metadata.skill choisit l'outil (gemini_ask par défaut). */
export async function a2aRpc(r: Req): Promise<Res | null> {
  if (r.method !== "SendMessage")
    return fail(r.id, -32601, `méthode A2A non prise en charge : ${r.method}`);
  const m = r.params?.message;
  if (!m?.messageId || !Array.isArray(m.parts))
    return fail(r.id, -32602, "SendMessageRequest.message invalide");
  const prompt = m.parts
    .map((p: any) => p.text ?? (p.data ? JSON.stringify(p.data) : ""))
    .join("\n");
  const skill = String(
    m.metadata?.skill ?? r.params?.metadata?.skill ?? "gemini_ask",
  );
  if (!/^(gemini_ask|claude_ask|agy_ask|gemini_review)$/.test(skill))
    return fail(r.id, -32602, `skill inconnu : ${skill}`);
  try {
    const v: any = await call(
      skill,
      skill === "gemini_review"
        ? { title: m.metadata?.title ?? "A2A", content: prompt }
        : { prompt, chat: m.metadata?.chat },
    );
    return ok(r.id, {
      message: {
        messageId: crypto.randomUUID(),
        contextId: m.contextId ?? crypto.randomUUID(),
        role: "ROLE_AGENT",
        parts: [{ text: text(v) }],
        metadata: { engine: v?.engine, chat: v?.chat, ms: v?.ms },
      },
    });
  } catch (e: any) {
    return fail(r.id, -32000, e.message);
  }
}

/** Corps JSON-RPC (objet ou lot) -> réponse(s) ; `null` si uniquement des notifications. */
export async function dispatch(
  body: unknown,
  h: (r: Req) => Promise<Res | null>,
) {
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((b) => h(b as Req)))).filter(
      Boolean,
    );
    return out.length ? out : null;
  }
  if (!body || typeof body !== "object" || (body as Req).jsonrpc !== "2.0")
    return fail(null, -32600, "requête JSON-RPC 2.0 invalide");
  return h(body as Req);
}
