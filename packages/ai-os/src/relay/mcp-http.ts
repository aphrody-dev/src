// Client MCP « Streamable HTTP » (spec 2025-11-25) partagé : relais (mcp-hub, serveurs http agrégés) et client Stitch
// (src/google/stitch). Remplace @modelcontextprotocol/sdk (Client + StreamableHTTPClientTransport) : POST JSON-RPC,
// réponse JSON ou flux SSE, en-tête Mcp-Session-Id conservé après initialize, DELETE de session à la fermeture.
// Les en-têtes ne sont jamais journalisés.

export const MCP_PROTOCOL = "2025-11-25";

/** Réponse HTTP non OK (même rôle que StreamableHTTPError du SDK MCP : `code` = statut HTTP). */
export class McpHttpError extends Error {
  constructor(
    readonly code: number,
    message: string,
    readonly headers: Headers,
  ) {
    super(message);
    this.name = "McpHttpError";
  }
}

/** Erreur JSON-RPC renvoyée par le serveur (code et données conservés). */
export class McpRpcError extends Error {
  readonly rpc = true;
  constructor(
    readonly code: number | undefined,
    message: string,
    readonly data?: unknown,
  ) {
    super(message);
    this.name = "McpRpcError";
  }
}

export type McpFetch = (
  url: string,
  init: RequestInit & Record<string, unknown>,
) => Promise<Response>;

export type McpHttpOptions = {
  url: string;
  /** En-têtes fixes (auth comprise). */
  headers?: Record<string, string>;
  /** En-têtes calculés à chaque requête (jeton OAuth à courte durée). */
  dynamicHeaders?: () => Promise<Record<string, string>>;
  clientInfo?: { name: string; version: string };
  /** fetch utilisé (le relais passe outboundFetch : cache, singleflight). */
  fetch?: McpFetch;
};

/** Premier message JSON-RPC d'une réponse JSON ou SSE (`data:` lignes, plusieurs lignes concaténées). */
export function parseMcpBody(body: string, id?: number): any {
  const t = body.trimStart();
  if (!t) return {};
  if (t.startsWith("{") || t.startsWith("[")) return JSON.parse(t);
  for (const ev of body.split(/\r?\n\r?\n/)) {
    const data = ev
      .split(/\r?\n/)
      .filter((l) => l.startsWith("data:"))
      .map((l) => l.slice(5).replace(/^ /, ""))
      .join("\n");
    if (!data) continue;
    const m = JSON.parse(data);
    if (id === undefined || m.id === id) return m;
  }
  return {};
}

/** Message JSON-RPC portant `id`, sinon erreur (flux coupé ou réponse absente ne passent pas pour un succès). */
function reply(body: string, id: number): any {
  const m = parseMcpBody(body, id);
  if (m.error)
    throw new McpRpcError(m.error.code, m.error.message, m.error.data);
  if (m.id !== id)
    throw new McpRpcError(-32603, `réponse JSON-RPC ${id} absente`);
  return m.result;
}

export class McpHttpClient {
  private seq = 0;
  private session: string | undefined;
  private initialized: Promise<unknown> | null = null;
  constructor(private o: McpHttpOptions) {}

  private async headers(): Promise<Record<string, string>> {
    // En-têtes protocolaires après ceux de l'appelant : ils ne peuvent pas être écrasés.
    return {
      ...(this.o.headers ?? {}),
      ...((await this.o.dynamicHeaders?.()) ?? {}),
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": MCP_PROTOCOL,
      ...(this.session ? { "mcp-session-id": this.session } : {}),
    };
  }

  private async post(
    body: unknown,
    opts: { timeout?: number; init?: Record<string, unknown> },
  ) {
    const f = this.o.fetch ?? ((u: string, i: RequestInit) => fetch(u, i));
    const r = await f(this.o.url, {
      ...(opts.init ?? {}),
      method: "POST",
      headers: await this.headers(),
      body: JSON.stringify(body),
      ...(opts.timeout ? { signal: AbortSignal.timeout(opts.timeout) } : {}),
    });
    const sid = r.headers.get("mcp-session-id");
    if (sid) this.session = sid;
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      throw new McpHttpError(
        r.status,
        `Error POSTing to endpoint (HTTP ${r.status}): ${text || r.statusText}`,
        r.headers,
      );
    }
    return r;
  }

  /** initialize + notifications/initialized, une seule fois (appels concurrents partagés) ; résultat d'initialize. */
  connect(): Promise<unknown> {
    this.initialized ??= (async () => {
      const id = ++this.seq;
      const r = await this.post(
        {
          jsonrpc: "2.0",
          id,
          method: "initialize",
          params: {
            protocolVersion: MCP_PROTOCOL,
            capabilities: {},
            clientInfo: this.o.clientInfo ?? {
              name: "aphrody-relay",
              version: "0.1.0",
            },
          },
        },
        {},
      );
      const result = reply(await r.text(), id);
      await this.post(
        { jsonrpc: "2.0", method: "notifications/initialized" },
        {},
      );
      return result;
    })().catch((e) => {
      this.initialized = null;
      throw e;
    });
    return this.initialized;
  }

  /** Requête JSON-RPC ; `init` est passé tel quel au fetch (ex. { deterministic: true } pour outboundFetch). */
  async request<T = any>(
    method: string,
    params: unknown,
    opts: { timeout?: number; init?: Record<string, unknown> } = {},
  ): Promise<T> {
    const send = async () => {
      const id = ++this.seq;
      const r = await this.post({ jsonrpc: "2.0", id, method, params }, opts);
      return reply(await r.text(), id) as T;
    };
    try {
      return await send();
    } catch (e) {
      // Session expirée (spec : HTTP 404 avec Mcp-Session-Id) : nouvelle session, un seul nouvel essai.
      if (!(e instanceof McpHttpError) || e.code !== 404 || !this.session)
        throw e;
      this.session = undefined;
      this.initialized = null;
      await this.connect();
      return send();
    }
  }

  callTool<T = any>(
    name: string,
    args: Record<string, unknown>,
    opts?: { timeout?: number; init?: Record<string, unknown> },
  ) {
    return this.request<T>("tools/call", { name, arguments: args }, opts);
  }

  /** Termine la session côté serveur (DELETE, best effort). */
  async close(): Promise<void> {
    const sid = this.session;
    this.session = undefined;
    this.initialized = null;
    if (!sid) return;
    const f = this.o.fetch ?? ((u: string, i: RequestInit) => fetch(u, i));
    await f(this.o.url, {
      method: "DELETE",
      headers: {
        ...(this.o.headers ?? {}),
        ...((await this.o.dynamicHeaders?.()) ?? {}),
        "mcp-session-id": sid,
      },
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {});
  }
}
