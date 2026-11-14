// Agrégation des serveurs MCP utilisateur de Claude Code (~/.claude.json, clé mcpServers) dans le relais : chaque outil
// d'un serveur est exposé sous le nom `<serveur>__<outil>`. stdio : processus lancé à la demande (protocole 2025-11-25,
// une ligne JSON par message) ; http : POST JSON-RPC avec les en-têtes configurés. Les valeurs d'env/en-têtes ne sont
// jamais journalisées. Les connecteurs claude.ai (Gmail, Drive, Docs, Slides, Sheets, Calendar) ne sont joignables que
// par une session Claude Code : outil `workspace_ask` (tools.ts).
import { homedir } from "node:os";
import { join } from "node:path";
import { outboundFetch } from "./outbound.ts";
import { McpHttpClient } from "./mcp-http.ts";
import { gcloudHeaders } from "../google/auth.ts";
import { DEFAULT_STITCH_API_URL } from "../google/stitch/src/constants.ts";

type Conf = {
  type?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
  /** En-têtes calculés à chaque appel (jeton OAuth à courte durée). */
  dynamicHeaders?: () => Promise<Record<string, string>>;
};

// Serveurs MCP distants de Google intégrés au relais, authentifiés par le jeton OAuth du compte gcloud actif
// (aucune clé d'API, src/google/auth.ts) : Stitch (stitch.googleapis.com/mcp, même URL que le client absorbé
// src/google/stitch). Les outils sont exposés sous stitch__<outil>.
const BUILTIN: Record<string, Conf> = {
  stitch: {
    type: "http",
    url: Bun.env.STITCH_BASE_URL ?? DEFAULT_STITCH_API_URL,
    dynamicHeaders: gcloudHeaders,
  },
};
type Remote = {
  name: string;
  description?: string;
  inputSchema?: unknown;
  annotations?: Record<string, unknown>;
};

export async function userServers(): Promise<Record<string, Conf>> {
  const f = Bun.file(join(homedir(), ".claude.json"));
  if (!(await f.exists()))
    return Bun.env.RELAY_BUILTIN_MCP === "0" ? {} : BUILTIN;
  const all = ((await f.json()).mcpServers ?? {}) as Record<string, Conf>;
  // Le relais lui-même est enregistré comme serveur « relay » : pas de boucle.
  return {
    ...(Bun.env.RELAY_BUILTIN_MCP === "0" ? {} : BUILTIN),
    ...Object.fromEntries(
      Object.entries(all).filter(([n]) => n !== "relay" && /^[\w.-]+$/.test(n)),
    ),
  };
}

class StdioServer {
  private p: ReturnType<typeof Bun.spawn> | null = null;
  private seq = 0;
  private buf = "";
  private pending = new Map<number, (m: any) => void>();
  constructor(private conf: Conf) {}

  private async start() {
    if (this.p) return;
    const p = Bun.spawn([this.conf.command!, ...(this.conf.args ?? [])], {
      stdin: "pipe",
      stdout: "pipe",
      stderr: "ignore",
      env: { ...process.env, ...(this.conf.env ?? {}) },
    });
    this.p = p;
    (async () => {
      for await (const c of p.stdout as ReadableStream<Uint8Array>) {
        this.buf += Buffer.from(c).toString("utf8");
        let i: number;
        while ((i = this.buf.indexOf("\n")) >= 0) {
          const line = this.buf.slice(0, i).trim();
          this.buf = this.buf.slice(i + 1);
          if (!line) continue;
          const m = JSON.parse(line);
          const r = typeof m.id === "number" && this.pending.get(m.id);
          if (r) (this.pending.delete(m.id), r(m));
        }
      }
      this.p = null;
    })();
    await this.request("initialize", {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "aphrody-relay", version: "0.1.0" },
    });
    (p.stdin as any).write(
      `${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
    );
  }

  request(method: string, params: unknown, timeout = 120_000): Promise<any> {
    return new Promise((ok, ko) => {
      const id = ++this.seq;
      const t = setTimeout(
        () => (
          this.pending.delete(id),
          ko(new Error(`${method} : délai dépassé`))
        ),
        timeout,
      );
      this.pending.set(
        id,
        (m) => (
          clearTimeout(t),
          m.error ? ko(rpcError(m.error)) : ok(m.result)
        ),
      );
      (this.p!.stdin as any).write(
        `${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`,
      );
    });
  }

  async call(method: string, params: unknown) {
    await this.start();
    return this.request(method, params);
  }
}

// Serveur http agrégé : transport partagé avec le client Stitch (mcp-http.ts) sur outboundFetch. tools/list et
// tools/call d'un outil readOnlyHint sont des lectures, cachées ; le reste passe par le singleflight.
class HttpServer {
  private c: McpHttpClient;
  constructor(conf: Conf) {
    this.c = new McpHttpClient({
      url: conf.url!,
      headers: conf.headers,
      dynamicHeaders: conf.dynamicHeaders,
      fetch: (u, i) => outboundFetch(u, i),
    });
  }
  async call(method: string, params: unknown, readOnly = false) {
    if (method === "initialize") return this.c.connect();
    return this.c.request(method, params, {
      init: { deterministic: method === "tools/list" || readOnly },
    });
  }
}

const servers = new Map<string, StdioServer | HttpServer>();
const toolCache = new Map<string, Remote[]>();

async function server(name: string) {
  let s = servers.get(name);
  if (!s) {
    const c = (await userServers())[name];
    if (!c)
      throw Object.assign(new Error(`serveur MCP inconnu : ${name}`), {
        code: -32601,
        unknownTool: true,
      });
    s = c.type === "http" || c.url ? new HttpServer(c) : new StdioServer(c);
    if (c.type === "http" || c.url)
      await s
        .call("initialize", {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "aphrody-relay", version: "0.1.0" },
        })
        .catch(() => {});
    servers.set(name, s);
  }
  return s;
}

/** Délai de listage par serveur agrégé : `tools/list` du relais doit tenir sous le délai des clients MCP. */
const LIST_TIMEOUT = Number(Bun.env.RELAY_HUB_LIST_TIMEOUT ?? 3000);
/** Serveur lent ou injoignable : pas de nouvel essai synchrone avant cette date (le listage tardif remplit le cache). */
const retryAt = new Map<string, number>();

/**
 * Outils de tous les serveurs utilisateur (préfixés), listés en parallèle avec un délai par serveur. Un serveur qui
 * dépasse le délai est omis cette fois-ci ; son listage continue en arrière-plan et alimente le cache ; en cas
 * d'échec il n'est retenté qu'après 10 min. Avant ce correctif, un serveur lent était retenté en série à chaque
 * appel et `tools/list` prenait 22 s (« tools fetch failed — Request timed out » dans `claude mcp list`).
 */
/** Serveur intégré au relais (jamais issu de ~/.claude.json). */
export const isBuiltin = (server: string) => Object.hasOwn(BUILTIN, server);

export async function hubTools(
  builtinOnly = false,
): Promise<(Remote & { server: string })[]> {
  // builtinOnly : client qui déclare déjà lui-même les serveurs de ~/.claude.json (Claude Code, route /mcp/core).
  const names = Object.keys(await userServers())
    .filter((n) => !builtinOnly || Object.hasOwn(BUILTIN, n))
    .sort();
  const lists = await Promise.all(
    names.map(async (name): Promise<Remote[]> => {
      const cached = toolCache.get(name);
      if (cached) return cached;
      if ((retryAt.get(name) ?? 0) > Date.now()) return [];
      retryAt.set(name, Date.now() + 600_000);
      const p = (async () =>
        ((await (await server(name)).call("tools/list", {})).tools ??
          []) as Remote[])();
      p.then(
        (t) => {
          toolCache.set(name, t);
          retryAt.delete(name);
        },
        () => {},
      );
      return Promise.race([
        p.catch(() => [] as Remote[]),
        Bun.sleep(LIST_TIMEOUT).then(() => [] as Remote[]),
      ]);
    }),
  );
  return names.flatMap((name, i) =>
    lists[i]!.map((t) => ({ ...t, server: name, name: `${name}__${t.name}` })),
  );
}

/** Préchargement au démarrage du relais : le premier `tools/list` d'un client trouve le cache chaud. */
export const warmHub = () => void hubTools().catch(() => {});

/** Erreur JSON-RPC d'un serveur agrégé : code et données conservés (erreur de protocole relayée telle quelle). */
const rpcError = (e: { code?: number; message: string; data?: unknown }) =>
  Object.assign(new Error(e.message), {
    code: e.code,
    data: e.data,
    rpc: true,
  });

export async function hubCall(prefixed: string, args: unknown) {
  const i = prefixed.indexOf("__");
  if (i < 0)
    throw Object.assign(new Error(`outil inconnu : ${prefixed}`), {
      code: -32601,
    });
  const [srv, tool] = [prefixed.slice(0, i), prefixed.slice(i + 2)];
  const readOnly =
    toolCache.get(srv)?.find((t) => t.name === tool)?.annotations
      ?.readOnlyHint === true;
  return (await server(srv)).call(
    "tools/call",
    { name: tool, arguments: args ?? {} },
    readOnly,
  );
}
