// Agrégation des serveurs MCP utilisateur de Claude Code (~/.claude.json, clé mcpServers) dans le relais : chaque outil
// d'un serveur est exposé sous le nom `<serveur>__<outil>`. stdio : processus lancé à la demande (protocole 2025-11-25,
// une ligne JSON par message) ; http : POST JSON-RPC avec les en-têtes configurés. Les valeurs d'env/en-têtes ne sont
// jamais journalisées. Les connecteurs claude.ai (Gmail, Drive, Docs, Slides, Sheets, Calendar) ne sont joignables que
// par une session Claude Code : outil `workspace_ask` (tools.ts).
import { homedir } from "node:os";
import { join } from "node:path";

type Conf = {
  type?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
};
type Remote = {
  name: string;
  description?: string;
  inputSchema?: unknown;
  annotations?: Record<string, unknown>;
};

export async function userServers(): Promise<Record<string, Conf>> {
  const f = Bun.file(join(homedir(), ".claude.json"));
  if (!(await f.exists())) return {};
  const all = ((await f.json()).mcpServers ?? {}) as Record<string, Conf>;
  // Le relais lui-même est enregistré comme serveur « relay » : pas de boucle.
  return Object.fromEntries(
    Object.entries(all).filter(([n]) => n !== "relay" && /^[\w.-]+$/.test(n)),
  );
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
          m.error ? ko(new Error(m.error.message)) : ok(m.result)
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

class HttpServer {
  private seq = 0;
  constructor(private conf: Conf) {}
  async call(method: string, params: unknown) {
    const r = await fetch(this.conf.url!, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-11-25",
        ...(this.conf.headers ?? {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++this.seq, method, params }),
    });
    const body = await r.text();
    // Réponse JSON ou flux SSE à un seul message.
    const json = body.trimStart().startsWith("{")
      ? body
      : (body.match(/^data: (.+)$/m)?.[1] ?? "{}");
    const m = JSON.parse(json);
    if (m.error) throw new Error(m.error.message);
    return m.result;
  }
}

const servers = new Map<string, StdioServer | HttpServer>();
const toolCache = new Map<string, Remote[]>();

async function server(name: string) {
  let s = servers.get(name);
  if (!s) {
    const c = (await userServers())[name];
    if (!c) throw new Error(`serveur MCP inconnu : ${name}`);
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

/** Outils de tous les serveurs utilisateur (préfixés), en ignorant les serveurs injoignables. */
export async function hubTools(): Promise<(Remote & { server: string })[]> {
  const out: (Remote & { server: string })[] = [];
  for (const name of Object.keys(await userServers()).sort()) {
    try {
      let tools = toolCache.get(name);
      if (!tools)
        toolCache.set(
          name,
          (tools = ((await (await server(name)).call("tools/list", {})).tools ??
            []) as Remote[]),
        );
      for (const t of tools)
        out.push({ ...t, server: name, name: `${name}__${t.name}` });
    } catch {}
  }
  return out;
}

export async function hubCall(prefixed: string, args: unknown) {
  const i = prefixed.indexOf("__");
  if (i < 0)
    throw Object.assign(new Error(`outil inconnu : ${prefixed}`), {
      code: -32601,
    });
  return (await server(prefixed.slice(0, i))).call("tools/call", {
    name: prefixed.slice(i + 2),
    arguments: args ?? {},
  });
}
