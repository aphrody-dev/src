// Serveur d'autorisation OAuth 2.1 embarqué du relais et vérification des jetons côté ressource.
// Conforme à l'autorisation MCP 2026-07-28 (third_party/modelcontextprotocol, docs/specification/2026-07-28/
// basic/authorization) et aux securitySchemes A2A 1.0 (third_party/A2A/specification/a2a.proto) :
//   RFC 9728 /.well-known/oauth-protected-resource[/mcp|/a2a|/rpc]   RFC 8414 /.well-known/oauth-authorization-server
//   RFC 7591 /oauth/register (DCR)   draft-ietf-oauth-client-id-metadata-document (client_id = URL https)
//   /oauth/authorize (code + PKCE S256 obligatoire, iss RFC 9207)   /oauth/token (authorization_code, refresh_token
//   tournant, client_credentials, device_code RFC 8628)   /oauth/device_authorization   /oauth/revoke (RFC 7009)
//   resource RFC 8707 -> aud du jeton ; jeton d'accès = JWT HS256 (clé locale), durée RELAY_OAUTH_TTL (3600 s).
// Consentement : approbation automatique quand le relais n'écoute que la boucle locale et que la redirection est
// locale (RFC 8252), ou quand le navigateur porte le cookie du relais ; sinon la demande attend `relay approve <code>`
// (consentement asynchrone, aucun mot de passe). Le jeton fixe du relais reste accepté en en-tête (usage local).
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { relayHome } from "./cdp.ts";

export const SCOPES: Record<string, string> = {
  mcp: "outils MCP du relais (POST /mcp)",
  a2a: "agent A2A du relais (POST /a2a)",
  rpc: "JSON-RPC natif du relais (/rpc, /ws)",
};
export const RESOURCES = ["mcp", "a2a", "rpc"] as const;
const TTL = () => Number(Bun.env.RELAY_OAUTH_TTL ?? 3600);
const REFRESH_TTL = 30 * 86400;
const CODE_TTL = 120;
const DEVICE_TTL = 900;

interface Client {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  grant_types: string[];
  token_endpoint_auth_method:
    "none" | "client_secret_basic" | "client_secret_post";
  /** sha256 du secret (clients confidentiels, créés avec le jeton du relais comme jeton d'accès initial). */
  secret_sha256?: string;
  scope?: string;
  created: number;
}
interface Pending {
  kind: "code" | "device";
  client_id: string;
  scope: string;
  resource: string[];
  redirect_uri?: string;
  state?: string;
  challenge?: string;
  user_code?: string;
  approved: boolean;
  denied?: boolean;
  exp: number;
  poll?: number;
}
interface Refresh {
  client_id: string;
  scope: string;
  resource: string[];
  family: string;
  exp: number;
  used?: boolean;
}
interface State {
  key: string;
  clients: Record<string, Client>;
  refresh: Record<string, Refresh>;
}

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const rand = (n = 32) => randomBytes(n).toString("base64url");
const b64 = (o: unknown) =>
  Buffer.from(JSON.stringify(o)).toString("base64url");
const now = () => Math.floor(Date.now() / 1000);
const eq = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export const isLoopbackHost = (h: string) =>
  h === "127.0.0.1" || h === "localhost" || h === "::1" || h === "[::1]";

export interface Principal {
  sub: string;
  client_id: string;
  scope: string[];
  aud: string[];
  static?: boolean;
}

export interface OAuthOptions {
  /** Jeton fixe du relais (accepté en en-tête, jeton d'accès initial de DCR confidentiel, approbation). */
  token: string;
  /** Hôte d'écoute : l'approbation automatique n'existe que sur la boucle locale. */
  host: string;
  /** Fichier d'état (clé HMAC, clients, jetons de rafraîchissement) ; défaut : <relayHome>/oauth.json. */
  file?: string;
  /** Récupération des Client ID Metadata Documents (injectable pour les tests). */
  fetchDoc?: (url: string) => Promise<Response>;
}

export function createOAuth(o: OAuthOptions) {
  const file = o.file ?? join(relayHome(), "oauth.json");
  let st: State;
  const load = (): State => {
    if (st) return st;
    try {
      st = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      st = { key: rand(32), clients: {}, refresh: {} };
      save();
    }
    return st;
  };
  const save = () => {
    const dir = join(file, "..");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(st));
    if (process.platform !== "win32") Bun.spawnSync(["chmod", "600", file]);
  };
  const pending = new Map<string, Pending>();
  const autoApprove =
    Bun.env.RELAY_OAUTH_AUTO !== "0" && isLoopbackHost(o.host);
  const cimdCache = new Map<string, { c: Client; exp: number }>();

  /** Origine publique : RELAY_PUBLIC_URL derrière un mandataire, sinon celle de la requête. */
  const origin = (req: Request) =>
    (Bun.env.RELAY_PUBLIC_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const resourceUri = (base: string, r: string) => `${base}/${r}`;

  const sign = (claims: Record<string, unknown>) => {
    const h = b64({ alg: "HS256", typ: "at+jwt" });
    const p = b64(claims);
    const s = createHmac("sha256", load().key)
      .update(`${h}.${p}`)
      .digest("base64url");
    return `${h}.${p}.${s}`;
  };
  const verifyJwt = (t: string): Record<string, any> | null => {
    const [h, p, s] = t.split(".");
    if (!h || !p || !s) return null;
    const want = createHmac("sha256", load().key)
      .update(`${h}.${p}`)
      .digest("base64url");
    if (!eq(s, want)) return null;
    try {
      const c = JSON.parse(Buffer.from(p, "base64url").toString());
      return typeof c.exp === "number" && c.exp > now() ? c : null;
    } catch {
      return null;
    }
  };

  async function client(id: string): Promise<Client | null> {
    const c = load().clients[id];
    if (c) return c;
    if (!/^https:\/\/[^/]+\/.+/.test(id)) return null;
    // Client ID Metadata Document : le document doit nommer exactement la même URL.
    const hit = cimdCache.get(id);
    if (hit && hit.exp > Date.now()) return hit.c;
    try {
      const r = await (
        o.fetchDoc ??
        ((u: string) =>
          fetch(u, { signal: AbortSignal.timeout(5000), redirect: "error" }))
      )(id);
      if (!r.ok) return null;
      const d = (await r.json()) as Partial<Client> & { client_id?: string };
      if (
        d.client_id !== id ||
        !Array.isArray(d.redirect_uris) ||
        !d.redirect_uris.length
      )
        return null;
      const c: Client = {
        client_id: id,
        client_name: d.client_name,
        redirect_uris: d.redirect_uris,
        grant_types: d.grant_types ?? ["authorization_code", "refresh_token"],
        token_endpoint_auth_method: "none",
        created: now(),
      };
      const age = Number(
        /max-age=(\d+)/.exec(r.headers.get("cache-control") ?? "")?.[1] ?? 300,
      );
      cimdCache.set(id, { c, exp: Date.now() + Math.min(age, 86400) * 1000 });
      return c;
    } catch {
      return null;
    }
  }

  const err = (error: string, description: string, status = 400) =>
    Response.json(
      { error, error_description: description },
      { status, headers: { "cache-control": "no-store" } },
    );

  const pickScope = (asked: string | null | undefined, c: Client) => {
    const allowed = (c.scope ?? Object.keys(SCOPES).join(" ")).split(" ");
    const want = (asked ?? "").split(" ").filter(Boolean);
    const out = (
      want.length ? want : allowed.filter((s) => s !== "rpc")
    ).filter((s) => allowed.includes(s) && s in SCOPES);
    return out.length ? out.join(" ") : null;
  };
  const pickResources = (base: string, asked: string[]) => {
    const all = RESOURCES.map((r) => resourceUri(base, r));
    if (!asked.length) return all;
    const norm = asked.map((r) => r.replace(/\/$/, ""));
    return norm.every((r) => all.includes(r) || r === base)
      ? norm.flatMap((r) => (r === base ? all : [r]))
      : null;
  };

  function issue(
    base: string,
    client_id: string,
    scope: string,
    resource: string[],
    family?: string,
  ) {
    const exp = now() + TTL();
    const access_token = sign({
      iss: base,
      sub: "owner",
      client_id,
      aud: resource,
      scope,
      iat: now(),
      exp,
      jti: rand(12),
    });
    const body: Record<string, unknown> = {
      access_token,
      token_type: "Bearer",
      expires_in: TTL(),
      scope,
    };
    {
      const rt = rand(32);
      load().refresh[sha(rt)] = {
        client_id,
        scope,
        resource,
        family: family ?? rand(8),
        exp: now() + REFRESH_TTL,
      };
      // Purge des jetons expirés.
      for (const [k, v] of Object.entries(st.refresh))
        if (v.exp < now()) delete st.refresh[k];
      save();
      body.refresh_token = rt;
    }
    return Response.json(body, {
      headers: { "cache-control": "no-store", pragma: "no-cache" },
    });
  }

  /** Authentification du client au point de jeton (none, client_secret_basic, client_secret_post). */
  async function tokenClient(
    req: Request,
    f: URLSearchParams,
  ): Promise<Client | Response> {
    let id = f.get("client_id") ?? "";
    let secret = f.get("client_secret") ?? "";
    const a = req.headers.get("authorization") ?? "";
    if (a.startsWith("Basic ")) {
      const [u, p] = Buffer.from(a.slice(6), "base64").toString().split(":");
      id = decodeURIComponent(u ?? "");
      secret = decodeURIComponent(p ?? "");
    }
    const c = await client(id);
    if (!c) return err("invalid_client", "client inconnu", 401);
    if (c.secret_sha256 && !eq(sha(secret), c.secret_sha256))
      return err("invalid_client", "secret invalide", 401);
    return c;
  }

  const metadata = (req: Request) => {
    const base = origin(req);
    return Response.json({
      issuer: base,
      authorization_endpoint: `${base}/oauth/authorize`,
      token_endpoint: `${base}/oauth/token`,
      registration_endpoint: `${base}/oauth/register`,
      device_authorization_endpoint: `${base}/oauth/device_authorization`,
      revocation_endpoint: `${base}/oauth/revoke`,
      response_types_supported: ["code"],
      response_modes_supported: ["query"],
      grant_types_supported: [
        "authorization_code",
        "refresh_token",
        "client_credentials",
        "urn:ietf:params:oauth:grant-type:device_code",
      ],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: [
        "none",
        "client_secret_basic",
        "client_secret_post",
      ],
      scopes_supported: Object.keys(SCOPES),
      client_id_metadata_document_supported: true,
      authorization_response_iss_parameter_supported: true,
    });
  };

  const prm = (r: (typeof RESOURCES)[number] | null) => (req: Request) => {
    const base = origin(req);
    return Response.json({
      resource: r ? resourceUri(base, r) : base,
      authorization_servers: [base],
      scopes_supported: r ? [r] : Object.keys(SCOPES),
      bearer_methods_supported: ["header"],
      resource_name: "aphrody-relay",
    });
  };

  async function register(req: Request) {
    if (!(req.headers.get("content-type") ?? "").includes("application/json"))
      return err("invalid_client_metadata", "corps JSON attendu");
    let m: Record<string, any>;
    try {
      m = (await req.json()) as Record<string, any>;
    } catch {
      return err("invalid_client_metadata", "JSON invalide");
    }
    // Le jeton du relais sert de jeton d'accès initial (RFC 7591 §3) : lui seul ouvre client_credentials.
    const trusted = eq(
      req.headers.get("authorization") ?? "",
      `Bearer ${o.token}`,
    );
    const grants: string[] = Array.isArray(m.grant_types)
      ? m.grant_types
      : ["authorization_code", "refresh_token"];
    if (grants.includes("client_credentials") && !trusted)
      return err(
        "invalid_client_metadata",
        "client_credentials exige le jeton du relais comme jeton d'accès initial",
        401,
      );
    const redirects: string[] = Array.isArray(m.redirect_uris)
      ? m.redirect_uris
      : [];
    if (grants.includes("authorization_code") && !redirects.length)
      return err("invalid_redirect_uri", "redirect_uris requis");
    for (const u of redirects) {
      try {
        const x = new URL(u);
        if (
          x.protocol !== "https:" &&
          !(x.protocol === "http:" && isLoopbackHost(x.hostname)) &&
          !/^[a-z][a-z0-9+.-]*\.[a-z0-9+.-]+:$/.test(x.protocol)
        )
          return err(
            "invalid_redirect_uri",
            `${u} : https, boucle locale ou schéma privé attendu`,
          );
      } catch {
        return err("invalid_redirect_uri", `${u} invalide`);
      }
    }
    const confidential =
      grants.includes("client_credentials") ||
      (m.token_endpoint_auth_method && m.token_endpoint_auth_method !== "none");
    const secret = confidential ? rand(32) : undefined;
    const c: Client = {
      client_id: `relay-${rand(12)}`,
      client_name:
        typeof m.client_name === "string"
          ? m.client_name.slice(0, 120)
          : undefined,
      redirect_uris: redirects,
      grant_types: grants,
      token_endpoint_auth_method: confidential
        ? m.token_endpoint_auth_method === "client_secret_post"
          ? "client_secret_post"
          : "client_secret_basic"
        : "none",
      secret_sha256: secret ? sha(secret) : undefined,
      scope: typeof m.scope === "string" ? m.scope : undefined,
      created: now(),
    };
    load().clients[c.client_id] = c;
    save();
    const { secret_sha256: _, ...pub } = c;
    return Response.json(
      {
        ...pub,
        client_id_issued_at: c.created,
        ...(secret
          ? { client_secret: secret, client_secret_expires_at: 0 }
          : {}),
      },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  }

  const cookieAuthed = (req: Request) =>
    (req.headers.get("cookie") ?? "")
      .split(/;\s*/)
      .includes(`relay=${o.token}`);

  function redirectWith(
    base: string,
    p: Pending,
    code: string | null,
    error?: string,
  ) {
    const u = new URL(p.redirect_uri!);
    if (code) u.searchParams.set("code", code);
    if (error) u.searchParams.set("error", error);
    if (p.state) u.searchParams.set("state", p.state);
    u.searchParams.set("iss", base);
    return new Response(null, {
      status: 302,
      headers: { location: u.toString(), "cache-control": "no-store" },
    });
  }

  const page = (title: string, body: string) =>
    new Response(
      `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><title>${title}</title><body style="font:16px system-ui;max-width:36rem;margin:3rem auto">${body}</body>`,
      {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
          "x-frame-options": "DENY",
        },
      },
    );
  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  async function authorize(req: Request) {
    const base = origin(req);
    const q =
      req.method === "POST"
        ? new URLSearchParams(await req.text())
        : new URL(req.url).searchParams;
    // Formulaire de consentement (cookie du relais requis) : approuve ou refuse une demande en attente.
    const decision = q.get("decision");
    if (decision && req.method === "POST") {
      const id = q.get("request") ?? "";
      const p = pending.get(id);
      if (!p || p.kind !== "code" || !cookieAuthed(req))
        return err("access_denied", "demande inconnue ou non autorisée", 403);
      pending.delete(id);
      if (decision !== "allow")
        return redirectWith(base, p, null, "access_denied");
      const code = rand(24);
      pending.set(code, { ...p, approved: true, exp: now() + CODE_TTL });
      return redirectWith(base, p, code);
    }
    const c = await client(q.get("client_id") ?? "");
    const redirect =
      q.get("redirect_uri") ??
      (c?.redirect_uris.length === 1 ? c.redirect_uris[0] : "");
    // Sans client ni redirection valides, aucune redirection (RFC 6749 §4.1.2.1).
    if (!c || !redirect || !c.redirect_uris.includes(redirect))
      return err("invalid_request", "client_id ou redirect_uri invalide");
    const p: Pending = {
      kind: "code",
      client_id: c.client_id,
      scope: "",
      resource: [],
      redirect_uri: redirect,
      state: q.get("state") ?? undefined,
      approved: false,
      exp: now() + CODE_TTL,
    };
    if (q.get("response_type") !== "code")
      return redirectWith(base, p, null, "unsupported_response_type");
    if (
      q.get("code_challenge_method") !== "S256" ||
      !/^[A-Za-z0-9_-]{43,128}$/.test(q.get("code_challenge") ?? "")
    )
      return redirectWith(base, p, null, "invalid_request");
    const scope = pickScope(q.get("scope"), c);
    const resource = pickResources(base, q.getAll("resource"));
    if (!scope) return redirectWith(base, p, null, "invalid_scope");
    if (!resource) return redirectWith(base, p, null, "invalid_target");
    Object.assign(p, { scope, resource, challenge: q.get("code_challenge")! });
    const local = (() => {
      try {
        const u = new URL(redirect);
        return u.protocol === "http:" && isLoopbackHost(u.hostname);
      } catch {
        return false;
      }
    })();
    // Host de la requête en boucle locale aussi : un nom DNS qui se rebinde sur 127.0.0.1 n'obtient rien d'office.
    if (autoApprove && local && isLoopbackHost(new URL(req.url).hostname)) {
      const code = rand(24);
      pending.set(code, { ...p, approved: true });
      return redirectWith(base, p, code);
    }
    const id = rand(12);
    pending.set(id, { ...p, exp: now() + DEVICE_TTL });
    if (cookieAuthed(req))
      return page(
        "Autoriser",
        `<h1>Autoriser ${esc(c.client_name ?? c.client_id)}</h1><p>Portée : <b>${esc(scope)}</b><br>Redirection : ${esc(redirect)}</p><form method=post action="/oauth/authorize"><input type=hidden name=request value="${id}"><button name=decision value=allow>Autoriser</button> <button name=decision value=deny>Refuser</button></form>`,
      );
    return new Response(null, {
      status: 303,
      headers: {
        location: `/oauth/wait?request=${id}`,
        "cache-control": "no-store",
      },
    });
  }

  async function deviceAuthorization(req: Request) {
    const base = origin(req);
    const f = new URLSearchParams(await req.text());
    const c = await tokenClient(req, f);
    if (c instanceof Response) return c;
    const scope = pickScope(f.get("scope"), c);
    const resource = pickResources(base, f.getAll("resource"));
    if (!scope) return err("invalid_scope", "portée inconnue");
    if (!resource) return err("invalid_target", "ressource inconnue");
    const device_code = rand(32);
    const alphabet = "BCDFGHJKLMNPQRSTVWXZ";
    const bytes = randomBytes(8);
    const user_code = [...bytes]
      .map((b) => alphabet[b % alphabet.length])
      .join("")
      .replace(/^(.{4})/, "$1-");
    pending.set(device_code, {
      kind: "device",
      client_id: c.client_id,
      scope,
      resource,
      user_code,
      approved: false,
      exp: now() + DEVICE_TTL,
    });
    return Response.json(
      {
        device_code,
        user_code,
        verification_uri: `${base}/oauth/device`,
        verification_uri_complete: `${base}/oauth/device?user_code=${user_code}`,
        expires_in: DEVICE_TTL,
        interval: 5,
      },
      { headers: { "cache-control": "no-store" } },
    );
  }

  /** Approbation (jeton du relais en en-tête ou cookie) d'un code utilisateur ou d'une demande en attente. */
  function approve(id: string, allow = true): boolean {
    for (const [k, p] of pending)
      if (k === id || p.user_code === id.toUpperCase()) {
        if (p.exp < now() || p.approved) return false;
        if (allow) p.approved = true;
        else if (p.kind === "device") p.denied = true;
        else pending.delete(k);
        return true;
      }
    return false;
  }

  async function approveHttp(req: Request) {
    const ok =
      eq(req.headers.get("authorization") ?? "", `Bearer ${o.token}`) ||
      cookieAuthed(req);
    if (!ok) return err("access_denied", "jeton du relais requis", 401);
    const f =
      req.method === "POST"
        ? new URLSearchParams(await req.text())
        : new URL(req.url).searchParams;
    const id = f.get("user_code") ?? f.get("request") ?? "";
    return approve(id, f.get("decision") !== "deny")
      ? Response.json({ approved: true })
      : err("invalid_request", "code inconnu ou expiré", 404);
  }

  async function devicePage(req: Request) {
    const u = new URL(req.url);
    const code = (u.searchParams.get("user_code") ?? "").toUpperCase();
    if (!code)
      return page(
        "Appareil",
        `<form><label>Code <input name=user_code autofocus></label> <button>Continuer</button></form>`,
      );
    if (!cookieAuthed(req))
      return page(
        "Appareil",
        `<p>Approuver depuis un terminal du propriétaire : <code>relay approve ${esc(code)}</code>.</p>`,
      );
    if (req.method === "POST") {
      const f = new URLSearchParams(await req.text());
      return page(
        "Appareil",
        approve(code, f.get("decision") === "allow")
          ? "<p>Fait. Cette page peut être fermée.</p>"
          : "<p>Code inconnu ou expiré.</p>",
      );
    }
    return page(
      "Appareil",
      `<form method=post><p>Autoriser l'appareil <b>${esc(code)}</b> ?</p><button name=decision value=allow>Autoriser</button> <button name=decision value=deny>Refuser</button></form>`,
    );
  }

  async function token(req: Request) {
    const base = origin(req);
    const f = new URLSearchParams(await req.text());
    const c = await tokenClient(req, f);
    if (c instanceof Response) return c;
    const grant = f.get("grant_type") ?? "";
    const DEVICE = "urn:ietf:params:oauth:grant-type:device_code";
    const g = c.grant_types;
    const allowed =
      g.includes(grant) ||
      (grant === "refresh_token" && g.includes("authorization_code")) ||
      (grant === DEVICE && g.includes("device_code"));
    if (!allowed)
      return err(
        "unauthorized_client",
        `grant ${grant} non enregistré pour ce client`,
      );
    if (grant === "authorization_code") {
      const code = f.get("code") ?? "";
      const p = pending.get(code);
      pending.delete(code);
      if (
        !p ||
        p.kind !== "code" ||
        !p.approved ||
        p.exp < now() ||
        p.client_id !== c.client_id
      )
        return err("invalid_grant", "code invalide ou expiré");
      if (f.get("redirect_uri") && f.get("redirect_uri") !== p.redirect_uri)
        return err("invalid_grant", "redirect_uri différente");
      const v = f.get("code_verifier") ?? "";
      if (createHash("sha256").update(v).digest("base64url") !== p.challenge)
        return err("invalid_grant", "PKCE : code_verifier invalide");
      const asked = f.getAll("resource");
      const resource = asked.length ? pickResources(base, asked) : p.resource;
      if (!resource || !resource.every((r) => p.resource.includes(r)))
        return err("invalid_target", "ressource hors autorisation");
      return issue(base, c.client_id, p.scope, resource);
    }
    if (grant === "refresh_token") {
      const h = sha(f.get("refresh_token") ?? "");
      const r = load().refresh[h];
      if (!r || r.client_id !== c.client_id || r.exp < now())
        return err("invalid_grant", "jeton de rafraîchissement invalide");
      if (r.used) {
        // Réutilisation d'un jeton déjà tourné : toute la famille est révoquée (OAuth 2.1 §4.3.1).
        for (const [k, v] of Object.entries(st.refresh))
          if (v.family === r.family) delete st.refresh[k];
        save();
        return err(
          "invalid_grant",
          "jeton de rafraîchissement réutilisé : famille révoquée",
        );
      }
      r.used = true;
      const scope = f.get("scope")
        ? f
            .get("scope")!
            .split(" ")
            .filter((s) => r.scope.split(" ").includes(s))
            .join(" ")
        : r.scope;
      return issue(base, c.client_id, scope || r.scope, r.resource, r.family);
    }
    if (grant === "client_credentials") {
      if (!c.secret_sha256) return err("unauthorized_client", "client public");
      const scope = pickScope(f.get("scope"), c);
      const resource = pickResources(base, f.getAll("resource"));
      if (!scope) return err("invalid_scope", "portée inconnue");
      if (!resource) return err("invalid_target", "ressource inconnue");
      const exp = now() + TTL();
      return Response.json(
        {
          access_token: sign({
            iss: base,
            sub: c.client_id,
            client_id: c.client_id,
            aud: resource,
            scope,
            iat: now(),
            exp,
            jti: rand(12),
          }),
          token_type: "Bearer",
          expires_in: TTL(),
          scope,
        },
        { headers: { "cache-control": "no-store" } },
      );
    }
    if (grant === DEVICE) {
      const dc = f.get("device_code") ?? "";
      const p = pending.get(dc);
      if (!p || p.kind !== "device" || p.client_id !== c.client_id)
        return err("invalid_grant", "device_code inconnu");
      if (p.exp < now()) {
        pending.delete(dc);
        return err("expired_token", "code expiré");
      }
      if (p.denied) {
        pending.delete(dc);
        return err("access_denied", "refusé");
      }
      if (!p.approved) {
        const slow = p.poll && Date.now() - p.poll < 5000;
        p.poll = Date.now();
        return err(
          slow ? "slow_down" : "authorization_pending",
          "en attente d'approbation",
        );
      }
      pending.delete(dc);
      return issue(base, c.client_id, p.scope, p.resource);
    }
    return err("unsupported_grant_type", grant);
  }

  async function revoke(req: Request) {
    const f = new URLSearchParams(await req.text());
    const c = await tokenClient(req, f);
    if (c instanceof Response) return c;
    const h = sha(f.get("token") ?? "");
    const r = load().refresh[h];
    if (r && r.client_id === c.client_id) {
      for (const [k, v] of Object.entries(st.refresh))
        if (v.family === r.family) delete st.refresh[k];
      save();
    }
    return new Response(null, { status: 200 });
  }

  /** Page d'attente : rechargée après `relay approve`, elle reçoit la redirection avec le code. */
  function waiting(req: Request) {
    const id = new URL(req.url).searchParams.get("request") ?? "";
    const p = pending.get(id);
    if (!p || p.kind !== "code")
      return err("invalid_request", "demande inconnue", 404);
    if (!p.approved)
      return page(
        "Approbation requise",
        `<p>En attente : <code>relay approve ${esc(id)}</code>.</p><script>setTimeout(()=>location.reload(),3000)</script>`,
      );
    pending.delete(id);
    const code = rand(24);
    pending.set(code, { ...p, exp: now() + CODE_TTL });
    return redirectWith(origin(req), p, code);
  }

  /**
   * Vérifie le porteur d'une requête protégée. `resource` = mcp | a2a | rpc. Jeton fixe du relais : accepté
   * en en-tête Authorization (usage local) ; jamais dans l'URL pour mcp et a2a (MCP : « MUST NOT » query string).
   */
  function verify(
    req: Request,
    resource: (typeof RESOURCES)[number],
  ): Principal | "insufficient" | null {
    const a = req.headers.get("authorization") ?? "";
    const t = a.startsWith("Bearer ") ? a.slice(7).trim() : "";
    if (t && eq(t, o.token))
      return {
        sub: "relay-token",
        client_id: "relay-token",
        scope: Object.keys(SCOPES),
        aud: [],
        static: true,
      };
    if (!t) return null;
    const c = verifyJwt(t);
    if (!c) return null;
    const want = resourceUri(origin(req), resource);
    const aud: string[] = Array.isArray(c.aud) ? c.aud : [c.aud];
    if (c.iss !== origin(req) || !aud.includes(want)) return null;
    const scope = String(c.scope ?? "").split(" ");
    if (!scope.includes(resource)) return "insufficient";
    return { sub: c.sub, client_id: c.client_id, scope, aud };
  }

  /** 401 / 403 avec WWW-Authenticate (RFC 6750 §3, RFC 9728 §5.1). */
  function challenge(
    req: Request,
    resource: (typeof RESOURCES)[number],
    insufficient = false,
  ) {
    const base = origin(req);
    const h = `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource/${resource}", scope="${resource}"${insufficient ? `, error="insufficient_scope"` : ""}`;
    return new Response(
      insufficient
        ? "portée insuffisante"
        : "autorisation requise (OAuth 2.1 ou Authorization: Bearer <jeton du relais>)",
      {
        status: insufficient ? 403 : 401,
        headers: { "www-authenticate": h },
      },
    );
  }

  const routes = {
    "/.well-known/oauth-authorization-server": metadata,
    "/.well-known/openid-configuration": metadata,
    "/.well-known/oauth-protected-resource": prm(null),
    "/.well-known/oauth-protected-resource/mcp": prm("mcp"),
    "/.well-known/oauth-protected-resource/a2a": prm("a2a"),
    "/.well-known/oauth-protected-resource/rpc": prm("rpc"),
    "/oauth/register": { POST: register },
    "/oauth/authorize": { GET: authorize, POST: authorize },
    "/oauth/wait": waiting,
    "/oauth/token": { POST: token },
    "/oauth/device_authorization": { POST: deviceAuthorization },
    "/oauth/device": { GET: devicePage, POST: devicePage },
    "/oauth/approve": { POST: approveHttp },
    "/oauth/revoke": { POST: revoke },
  };

  return { routes, verify, challenge, approve, origin };
}

/** securitySchemes A2A 1.0 (a2a.proto : SecurityScheme, OAuthFlows est un oneof : un schéma par flux). */
export const a2aSecurity = (base: string) => {
  const scopes = { a2a: SCOPES.a2a! };
  const meta = `${base}/.well-known/oauth-authorization-server`;
  return {
    securitySchemes: {
      oauth2: {
        oauth2SecurityScheme: {
          description:
            "OAuth 2.1, code d'autorisation + PKCE S256 (approbation automatique en boucle locale)",
          flows: {
            authorizationCode: {
              authorizationUrl: `${base}/oauth/authorize`,
              tokenUrl: `${base}/oauth/token`,
              refreshUrl: `${base}/oauth/token`,
              scopes,
              pkceRequired: true,
            },
          },
          oauth2MetadataUrl: meta,
        },
      },
      device: {
        oauth2SecurityScheme: {
          description: "RFC 8628 pour agents sans navigateur",
          flows: {
            deviceCode: {
              deviceAuthorizationUrl: `${base}/oauth/device_authorization`,
              tokenUrl: `${base}/oauth/token`,
              refreshUrl: `${base}/oauth/token`,
              scopes,
            },
          },
          oauth2MetadataUrl: meta,
        },
      },
      agent: {
        oauth2SecurityScheme: {
          description:
            "client_credentials pour agents enregistrés (relay client add)",
          flows: {
            clientCredentials: { tokenUrl: `${base}/oauth/token`, scopes },
          },
          oauth2MetadataUrl: meta,
        },
      },
      bearer: {
        httpAuthSecurityScheme: {
          scheme: "Bearer",
          description: "jeton fixe du relais (usage local)",
        },
      },
    },
    securityRequirements: ["oauth2", "device", "agent", "bearer"].map((k) => ({
      schemes: { [k]: { list: k === "bearer" ? [] : ["a2a"] } },
    })),
  };
};
