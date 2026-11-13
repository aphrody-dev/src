// Surfaces protocolaires du relais, toutes en JSON-RPC 2.0 sur les mêmes outils (tools.ts) :
//   - relais natif : méthodes `<outil>` (ex. gemini_ask) et `tools/list` ;
//   - MCP Streamable HTTP, double époque : 2025-11-25 (initialize) et 2026-07-28 (server/discover, sans état,
//     _meta par requête, resultType, ttlMs/cacheScope) — spec modelcontextprotocol@2026-07-28 ;
//   - A2A 1.0 : a2a.ts (mêmes outils, via call).
import { validate } from "../llm/schema.ts";
import type { JsonSchema } from "../llm/types.ts";
import { hubCall, hubTools } from "./mcp-hub.ts";
import { TOOLS, toolByName } from "./tools.ts";

export const VERSION = "0.1.0";
export const MCP_VERSIONS = ["2026-07-28", "2025-11-25", "2025-06-18"];
export type Req = {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
};
export type Res = {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
};

export const ok = (id: Req["id"], result: unknown): Res => ({
  jsonrpc: "2.0",
  id: id ?? null,
  result,
});
export const fail = (
  id: Req["id"],
  code: number,
  message: string,
  data?: unknown,
): Res => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message, ...(data ? { data } : {}) },
});
/** Code JSON-RPC d'une exception : entier seulement (une erreur réseau porte e.code = "ECONNREFUSED", interdit par
 * JSON-RPC 2.0 §5.1), sinon le code par défaut. */
export const rpcCode = (e: any, d: number) =>
  Number.isInteger(e?.code) ? (e.code as number) : d;
export const text = (v: unknown): string =>
  typeof v === "string"
    ? v
    : v !== null &&
        typeof v === "object" &&
        typeof (v as any).text === "string" &&
        Object.keys(v).length <= 4
      ? (v as any).text
      : (JSON.stringify(v ?? null, null, 1) ?? String(v));

export async function call(name: string, args: unknown) {
  if (typeof name !== "string")
    throw Object.assign(new Error("méthode absente"), { code: -32600 });
  if (
    args !== undefined &&
    (args === null || typeof args !== "object" || Array.isArray(args))
  )
    throw Object.assign(new Error("arguments must be an object"), {
      code: -32602,
    });
  const t = toolByName.get(name);
  if (!t && name.includes("__")) return hubCall(name, args ?? {});
  if (!t)
    throw Object.assign(new Error(`outil inconnu : ${name}`), {
      code: -32601,
      unknownTool: true,
    });
  const input = args ?? {};
  const bad = validate(t.inputSchema as JsonSchema, input);
  if (bad.length)
    throw Object.assign(new Error(`arguments invalides : ${bad.join("; ")}`), {
      code: -32602,
    });
  return t.run(input);
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
    return r.id === undefined
      ? null
      : fail(r.id, rpcCode(e, -32000), e.message);
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
    modern
      ? {
          resultType: "complete",
          ...x,
          _meta: {
            ...meta,
            ...(x._meta as Record<string, unknown> | undefined),
          },
        }
      : x;
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
        const name = r.params?.name;
        // Outil inconnu ou nom absent : erreur de protocole -32602 (spec MCP 2025-11-25, server/tools, Error Handling).
        if (typeof name !== "string" || !name)
          return r.id === undefined
            ? null
            : fail(
                r.id,
                -32602,
                "Invalid params: name must be a non-empty string",
              );
        const args = r.params?.arguments;
        if (
          args !== undefined &&
          (args === null || typeof args !== "object" || Array.isArray(args))
        )
          return fail(
            r.id,
            -32602,
            "Invalid params: arguments must be an object",
          );
        try {
          const v = await call(name, args);
          // Outil d'un serveur agrégé : son résultat MCP est renvoyé tel quel.
          if (!toolByName.has(name))
            return ok(r.id, complete(v as Record<string, unknown>));
          return ok(
            r.id,
            complete({
              content: [{ type: "text", text: text(v) }],
              // structuredContent doit être un objet JSON (spécification MCP).
              ...(v !== null && typeof v === "object" && !Array.isArray(v)
                ? { structuredContent: v }
                : {}),
              isError: false,
            }),
          );
        } catch (e: any) {
          // Erreurs de protocole : outil local ou serveur agrégé inconnu (-32602), ou erreur JSON-RPC relayée d'un
          // serveur agrégé (son code). Les échecs d'exécution restent des résultats isError.
          const proto = e?.unknownTool
            ? fail(r.id, -32602, `Unknown tool: ${name}`)
            : e?.code === -32602 && !e?.rpc
              ? fail(r.id, -32602, e.message) // arguments rejected by the tool's inputSchema
              : e?.rpc && Number.isInteger(e.code)
                ? // Serveur agrégé antérieur à 2025-11-25 : -32601 pour un outil inconnu, normalisé en -32602.
                  fail(
                    r.id,
                    e.code === -32601 ? -32602 : e.code,
                    e.message,
                    e.data,
                  )
                : null;
          if (proto) return r.id === undefined ? null : proto;
          return ok(
            r.id,
            complete({
              content: [{ type: "text", text: String(e?.message ?? e) }],
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
    return r.id === undefined
      ? null
      : fail(r.id, rpcCode(e, -32603), e.message);
  }
}

/** Corps JSON-RPC (objet ou lot) -> réponse(s) ; `null` si uniquement des notifications. */
export async function dispatch(
  body: unknown,
  h: (r: Req) => Promise<Res | null>,
) {
  const validId = (id: unknown) =>
    id === undefined ||
    id === null ||
    typeof id === "string" ||
    (typeof id === "number" && Number.isFinite(id));
  const invalid = (b: unknown) =>
    !b ||
    typeof b !== "object" ||
    Array.isArray(b) ||
    (b as Req).jsonrpc !== "2.0" ||
    typeof (b as Req).method !== "string" ||
    !validId((b as Req).id) ||
    ((b as Req).params !== undefined &&
      ((b as Req).params === null || typeof (b as Req).params !== "object"));
  // A notification (no id) never gets a response, whatever the handler returns (JSON-RPC 2.0 §4.1).
  const one = async (b: unknown): Promise<Res | null> => {
    if (invalid(b)) {
      const id = (b as any)?.id;
      return fail(
        validId(id) ? (id ?? null) : null,
        -32600,
        "requête JSON-RPC 2.0 invalide",
      );
    }
    const r = b as Req;
    const res = await h(r);
    return r.id === undefined ? null : res;
  };
  if (Array.isArray(body)) {
    if (!body.length) return fail(null, -32600, "lot JSON-RPC vide");
    const out = (await Promise.all(body.map(one))).filter(Boolean);
    return out.length ? out : null;
  }
  return one(body);
}
