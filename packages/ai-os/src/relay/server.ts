// Serveur du relais : un processus bun, toutes les liaisons sur 127.0.0.1 (ou RELAY_HOST), autorisation obligatoire
// (sauf carte d'agent A2A et métadonnées OAuth) : jeton d'accès OAuth 2.1 du serveur embarqué (oauth.ts, MCP 2026-07-28)
// ou jeton fixe du relais en en-tête Authorization ; jamais de jeton dans l'URL hors amorçage de /webmcp.
//   HTTP   GET /metrics (compteurs hit/miss/coalescés des appels sortants, outbound.ts, sans authentification)
//          POST /rpc (relais natif)  POST /mcp (MCP Streamable HTTP)  POST /a2a (A2A 1.0, SSE : a2a.ts)  GET /.well-known/agent-card.json
//   WS     /ws : JSON-RPC du relais natif, un message par trame
//   WebMCP GET /webmcp?token=… : outils exposés à l agent du navigateur (document.modelContext)
//   TCP    RELAY_TCP_PORT : JSON-RPC délimité par lignes (NDJSON) ; TLS sur RELAY_TLS_PORT si RELAY_TLS_CERT/KEY sont définis
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { relayHome } from "./cdp.ts";
import { webmcpPage } from "./webmcp.ts";
import { a2aHttp, agentCard } from "./a2a.ts";
import { createOAuth, relayCookie } from "./oauth.ts";
import { warmHub } from "./mcp-hub.ts";
import { outbound } from "./outbound.ts";
import { dispatch, mcpRpc, nativeRpc, VERSION } from "./protocols.ts";

/** Jeton du relais (32 octets aléatoires, créé au premier lancement dans le dossier privé de l'utilisateur). */
export async function relayToken(): Promise<string> {
  if (Bun.env.RELAY_TOKEN) return Bun.env.RELAY_TOKEN;
  const f = join(relayHome(), "token");
  if (existsSync(f)) return (await Bun.file(f).text()).trim();
  mkdirSync(relayHome(), { recursive: true });
  const t = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    "hex",
  );
  await Bun.write(f, t);
  if (process.platform !== "win32") Bun.spawnSync(["chmod", "600", f]);
  return t;
}

export async function serve() {
  const token = await relayToken();
  const host = Bun.env.RELAY_HOST ?? "127.0.0.1";
  const port = Number(Bun.env.RELAY_PORT ?? 8790);
  const oauth = createOAuth({ token, host });
  // Cookie de session dérivé du jeton (HMAC), jamais le jeton lui-même.
  const session = relayCookie(token);
  const cookie = (req: Request) =>
    (req.headers.get("cookie") ?? "")
      .split(/;\s*/)
      .includes(`relay=${session}`);
  // Cookie HttpOnly SameSite=Strict : posé par l'amorçage de /webmcp, accepté pour la page et ses appels /mcp.
  const authed = (req: Request, resource: "mcp" | "a2a" | "rpc" = "rpc") =>
    cookie(req) || typeof oauth.verify(req, resource) === "object";
  const guard =
    (
      resource: "mcp" | "a2a" | "rpc",
      h: (req: Request) => Response | Promise<Response>,
    ) =>
    (req: Request) => {
      if (cookie(req)) return h(req);
      const v = oauth.verify(req, resource);
      if (v === "insufficient") return oauth.challenge(req, resource, true);
      return v ? h(req) : oauth.challenge(req, resource);
    };
  // Page WebMCP : ouverte une fois avec ?token=…, le jeton passe en cookie HttpOnly et quitte l'URL.
  const webmcp = async (req: Request) => {
    const u = new URL(req.url);
    if (u.searchParams.get("token") === token)
      return new Response(null, {
        status: 303,
        headers: {
          location: "/webmcp",
          "set-cookie": `relay=${session}; HttpOnly; SameSite=Strict; Path=/`,
        },
      });
    if (!cookie(req)) return deny();
    return new Response(await webmcpPage(), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  };
  const deny = () =>
    new Response("jeton requis (Authorization: Bearer)", { status: 401 });
  const rpc = (h: Parameters<typeof dispatch>[1]) => async (req: Request) => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({
        jsonrpc: "2.0",
        id: null,
        error: { code: -32700, message: "Parse error" },
      });
    }
    const out = await dispatch(body, h);
    return out === null
      ? new Response(null, { status: 202 })
      : Response.json(out);
  };
  const http = Bun.serve<{ open: number }>({
    hostname: host,
    port,
    idleTimeout: 255,
    routes: {
      "/.well-known/agent-card.json": (req: Request) =>
        Response.json(agentCard(oauth.origin(req))),
      ...oauth.routes,
      "/health": () =>
        Response.json({ name: "aphrody-relay", version: VERSION }),
      // Compteurs du dédoublonnage sortant (outbound.ts), format Prometheus ; aucune donnée de requête.
      "/metrics": () =>
        new Response(outbound().metrics(), {
          headers: { "content-type": "text/plain; version=0.0.4" },
        }),
      "/rpc": { POST: guard("rpc", rpc(nativeRpc)) },
      "/webmcp": webmcp,
      "/mcp": {
        POST: guard("mcp", rpc(mcpRpc)),
        GET: () => new Response(null, { status: 405 }),
      },
      "/a2a": {
        POST: guard("a2a", a2aHttp),
      },
      "/ws": (req: Request, srv: Bun.Server<{ open: number }>) =>
        !authed(req, "rpc")
          ? oauth.challenge(req, "rpc")
          : srv.upgrade(req, { data: { open: Date.now() } })
            ? undefined
            : new Response("WebSocket attendu", { status: 426 }),
    },
    websocket: {
      async message(ws, msg) {
        const out = await dispatch(JSON.parse(String(msg)), nativeRpc).catch(
          (e) => ({
            jsonrpc: "2.0",
            id: null,
            error: { code: -32700, message: String(e) },
          }),
        );
        if (out) ws.send(JSON.stringify(out));
      },
    },
  });

  // TCP / TLS : NDJSON ; la première ligne doit être le jeton.
  type Sock = { buf: string; ok: boolean };
  const socketHandlers = {
    open(s: any) {
      s.data = { buf: "", ok: false } satisfies Sock;
    },
    async data(s: any, chunk: Buffer) {
      const st = s.data as Sock;
      st.buf += Buffer.from(chunk).toString("utf8");
      let i: number;
      while ((i = st.buf.indexOf("\n")) >= 0) {
        const line = st.buf.slice(0, i).trim();
        st.buf = st.buf.slice(i + 1);
        if (!line) continue;
        if (!st.ok) {
          st.ok = line === token;
          s.write(st.ok ? '{"ok":true}\n' : '{"ok":false}\n');
          if (!st.ok) s.end();
          continue;
        }
        const out = await dispatch(JSON.parse(line), nativeRpc).catch((e) => ({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32700, message: String(e) },
        }));
        if (out) s.write(`${JSON.stringify(out)}\n`);
      }
    },
  };
  const tcpPort = Number(Bun.env.RELAY_TCP_PORT ?? 8791);
  const tcp = Bun.listen({
    hostname: host,
    port: tcpPort,
    socket: socketHandlers,
  });
  let tls: { port: number } | null = null;
  if (Bun.env.RELAY_TLS_CERT && Bun.env.RELAY_TLS_KEY) {
    tls = Bun.listen({
      hostname: host,
      port: Number(Bun.env.RELAY_TLS_PORT ?? 8792),
      tls: {
        cert: Bun.file(Bun.env.RELAY_TLS_CERT),
        key: Bun.file(Bun.env.RELAY_TLS_KEY),
      },
      socket: socketHandlers,
    });
  }
  if (Bun.env.RELAY_HUB !== "0") warmHub();
  console.error(
    `relay ${VERSION} http://${host}:${http.port} (rpc, mcp, a2a, ws) tcp ${tcp.port}${tls ? ` tls ${tls.port}` : ""}`,
  );
  return { http, tcp, tls, token, oauth };
}
