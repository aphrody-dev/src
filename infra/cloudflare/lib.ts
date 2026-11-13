// Shared helpers for infra/cloudflare: config, auth, API client. No secret is ever printed.
import { join } from "node:path";

export type Ingress = { hostname?: string; service: string; path?: string };
export type Tunnel = { id: string; host: string; ingress: Ingress[] };
export type Rec = { type: string; content: string; proxied?: boolean; rollback?: string };
export type Rule = {
  zone: string; phase: string; ref: string; description: string; expression: string; action: string;
  ratelimit?: { characteristics: string[]; period: number; requests_per_period: number; mitigation_timeout: number };
  action_parameters?: Record<string, unknown>; // e.g. set_cache_settings (phase http_request_cache_settings)
};
export type Cfg = {
  account: string;
  zones: Record<string, string>;
  tunnels: Record<string, Tunnel>;
  dns: Record<string, Record<string, Rec>>;
  rules: Rule[];
  email_routing?: Record<string, { enabled: boolean; destination_env: string; addresses: string[] }>;
  mail?: Record<string, { type: string; name: string; content: string }[]>;
  access: {
    owner_policy: string;
    service_tokens: { name: string; host: string }[];
    retire_tokens?: string[];
    apps: { name: string; type: string; domain: string; tokens?: string[] }[];
  };
};

export const cfgPath = join(import.meta.dir, "cloudflare.toml");
export const cfg = Bun.TOML.parse(await Bun.file(cfgPath).text()) as unknown as Cfg;

// Token: CLOUDFLARE_API_TOKEN (from the vault: env-kit secret exec CLOUDFLARE_API_TOKEN -- ...). An invalid token fails
// hard: no silent fallback that would hide a dead CI/VPS secret behind the owner super-admin login. The `cf auth login`
// OAuth token is used only when no token is set, or explicitly with CF_AUTH=oauth.
async function oauthToken(): Promise<string> {
  Bun.spawnSync(["cf", "auth", "whoami"], { env: { ...Bun.env, CLOUDFLARE_API_TOKEN: "" }, stdout: "ignore", stderr: "ignore" });
  const base = Bun.env.APPDATA ? join(Bun.env.APPDATA, "xdg.config") : (Bun.env.XDG_CONFIG_HOME ?? join(Bun.env.HOME ?? "", ".config"));
  const f = Bun.file(join(base, "cloudflare", "config", "default.json"));
  return (await f.exists()) ? ((await f.json()).oauth_token ?? "") : "";
}
let token = "";
async function auth(): Promise<string> {
  if (token) return token;
  const env = Bun.env.CF_AUTH === "oauth" ? "" : (Bun.env.CLOUDFLARE_API_TOKEN ?? "");
  if (env) {
    // tokens/verify works for every account token, even one scoped to a single zone (aop-rotate, proof-ssl-read).
    const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfg.account}/tokens/verify`, { headers: { authorization: `Bearer ${env}` } });
    if (r.ok) return (token = env);
    throw new Error(`CLOUDFLARE_API_TOKEN rejected (HTTP ${r.status}): fix the secret (env-kit secret set) or run with CF_AUTH=oauth`);
  }
  token = await oauthToken();
  if (!token) throw new Error("no usable Cloudflare credential (set CLOUDFLARE_API_TOKEN or run `cf auth login`)");
  return token;
}

export async function api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { authorization: `Bearer ${await auth()}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = (await r.json().catch(() => ({}))) as any;
  if (!r.ok || j.success === false) throw new Error(`${method} ${path}: HTTP ${r.status} ${JSON.stringify(j.errors ?? j)}`);
  return j.result as T;
}

export async function tunnelId(name: string): Promise<string> {
  const t = cfg.tunnels[name];
  if (t?.id) return t.id;
  const list = await api<any[]>("GET", `/accounts/${cfg.account}/cfd_tunnel?is_deleted=false&name=${encodeURIComponent(name)}`);
  return list[0]?.id ?? "";
}

export async function expand(content: string, strict = true): Promise<string> {
  if (!content.startsWith("tunnel:")) return content;
  const id = await tunnelId(content.slice(7));
  if (!id && !strict) return `<${content} pending>`;
  if (!id) throw new Error(`tunnel ${content.slice(7)} does not exist yet (cf.ts apply tunnels)`);
  return `${id}.cfargotunnel.com`;
}
