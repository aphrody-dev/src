// SPDX-License-Identifier: Apache-2.0
/**
 * GitHub App « aphrody » (docs/infra/GITHUB-APP.md) : une App unique pour aphrody-labs, yolo-rs et le compte
 * aphrody-dev, à la place des PAT et de l'ancienne App aphrody-labs-submodules.
 *
 *   ay auth github-app create [--org aphrody-labs] [--name aphrody]   manifest flow (clic « Create GitHub App »)
 *   ay auth github-app install                                          pages d'installation (un clic par compte)
 *   ay auth github-app status [--json]                                  App, installations, écarts au manifeste
 *   ay auth github-app token [--owner o] [--repos a,b] [--perm k=v,..] [-- cmd]
 *                                                                       jeton d'installation de 1 h ; avec `-- cmd`,
 *                                                                       injecté en GH_TOKEN/GITHUB_TOKEN, sinon écrit
 *                                                                       sur stdout seulement si stdout n'est pas un TTY
 *   ay auth github-app user [--device] | user-token -- cmd             jeton utilisateur (8 h, refresh 6 mois)
 *   ay auth github-app hook                                             URL + secret du webhook (PATCH /app/hook/config)
 *   ay auth github-app retire [--slug aphrody-labs-submodules]          désinstalle l'ancienne App, purge ses secrets
 *   ay auth github-app crates-trust --crates a,b                        trusted publishing crates.io -> crates-publish.yml
 *
 * Coffre (`env-kit secret`, jamais affiché) : APHRODY_APP_KEY (PEM), APHRODY_APP_CLIENT_SECRET,
 * APHRODY_APP_WEBHOOK_SECRET, APHRODY_APP_USER_REFRESH ; APHRODY_APP_ID et APHRODY_APP_CLIENT_ID ne sont pas secrets.
 * CI : secret d'org APHRODY_APP_KEY et variable d'org APHRODY_APP_CLIENT_ID sur aphrody-labs et yolo-rs.
 */

import { spawnSync } from "node:child_process";
import { createPrivateKey, randomBytes, sign } from "node:crypto";
import { secretDelete, secretGet, secretHas, secretSet } from "./secret-store";

export const APP = {
  /** Nom et slug : « aphrody » est réservé par le compte GitHub @aphrody (tiers), l App s appelle aphrody-labs. */
  name: "aphrody-labs",
  owner: "aphrody-labs",
  /** Comptes où l'App est installée (toutes les orgs + le compte utilisateur). */
  targets: ["aphrody-labs", "yolo-rs", "aphrody-dev"],
  /**
   * Secret d'org APHRODY_APP_KEY : visibilité « selected », limitée aux dépôts dont les workflows mintent un jeton
   * (une clé visible de tous les dépôts donnerait un jeton complet à n'importe quel workflow). yolo-rs n'a aucun dépôt.
   */
  ciOrgs: ["aphrody-labs"],
  ciRepos: ["src"],
  hook: "https://aphrody-github.aphrody-labs.workers.dev/github",
  port: 47800,
} as const;

/**
 * Permissions : clés du schéma `app-permissions` de github/rest-api-description (commit bd6df26, 2026-11-12),
 * validées une par une contre le validateur de manifeste de GitHub le 2026-11-13. Deux clés de l'OpenAPI y sont
 * refusées (« resource is not included in the list ») et portent un autre nom interne, celui que renvoie
 * `gh api /apps/<slug>` : email_addresses -> emails (App renovate), git_ssh_keys -> keys. Ajoutées hors OpenAPI
 * mais acceptées et présentes sur des Apps réelles : repository_advisories (événement repository_advisory),
 * repository_creation (App claude). Refusée : models. Exclues
 * volontairement : codespaces et organization_copilot_seat_management (facturés à l'usage), single_file (couvert par
 * contents), enterprise_* (pas d'entreprise).
 */
export const PERMISSIONS: Record<string, "read" | "write" | "admin"> = {
  // Dépôt
  actions: "write",
  administration: "write",
  artifact_metadata: "write",
  attestations: "write",
  checks: "write",
  code_quality: "write",
  contents: "write",
  dependabot_secrets: "write",
  deployments: "write",
  discussions: "write",
  environments: "write",
  issues: "write",
  merge_queues: "write",
  metadata: "read",
  packages: "write",
  pages: "write",
  pull_requests: "write",
  repository_advisories: "write",
  repository_creation: "write",
  repository_custom_properties: "write",
  repository_hooks: "write",
  repository_projects: "admin",
  secret_scanning_alerts: "write",
  secrets: "write",
  security_events: "write",
  statuses: "write",
  vulnerability_alerts: "write",
  workflows: "write",
  // Organisation
  members: "write",
  organization_administration: "write",
  organization_announcement_banners: "write",
  organization_custom_org_roles: "write",
  organization_custom_properties: "admin",
  organization_custom_roles: "write",
  organization_events: "read",
  organization_hooks: "write",
  organization_packages: "write",
  organization_personal_access_token_requests: "write",
  organization_personal_access_tokens: "write",
  organization_plan: "read",
  organization_projects: "admin",
  organization_secrets: "write",
  organization_self_hosted_runners: "write",
  organization_user_blocking: "write",
  // Compte (jetons utilisateur seulement)
  emails: "read",
  followers: "write",
  gpg_keys: "write",
  interaction_limits: "write",
  keys: "write",
  profile: "write",
  starring: "write",
};

/** Permissions de compte : portées par les jetons utilisateur, jamais par une installation. */
export const USER_PERMISSIONS = new Set([
  "emails",
  "followers",
  "gpg_keys",
  "interaction_limits",
  "keys",
  "profile",
  "starring",
]);

/**
 * Événements webhook (x-webhooks de l'OpenAPI), chacun couvert par une permission ci-dessus (EVENT_PERMISSION,
 * vérifié par github-app.test.ts). Refusés par le validateur : package (registry_package le remplace),
 * repository_import, repository_vulnerability_alert.
 */
export const EVENTS = [
  "check_run",
  "check_suite",
  "code_scanning_alert",
  "create",
  "delete",
  "dependabot_alert",
  "deployment",
  "deployment_status",
  "issue_comment",
  "issues",
  "member",
  "membership",
  "merge_group",
  "organization",
  "pull_request",
  "pull_request_review",
  "push",
  "registry_package",
  "release",
  "repository",
  "repository_advisory",
  "repository_ruleset",
  "secret_scanning_alert",
  "status",
  "workflow_job",
  "workflow_run",
];

/** Permission qui autorise chaque événement (docs « Webhook events and payloads », section Availability). */
export const EVENT_PERMISSION: Record<string, string> = {
  check_run: "checks",
  check_suite: "checks",
  code_scanning_alert: "security_events",
  create: "contents",
  delete: "contents",
  dependabot_alert: "vulnerability_alerts",
  deployment: "deployments",
  deployment_status: "deployments",
  issue_comment: "issues",
  issues: "issues",
  member: "members",
  membership: "members",
  merge_group: "merge_queues",
  organization: "members",
  pull_request: "pull_requests",
  pull_request_review: "pull_requests",
  push: "contents",
  registry_package: "packages",
  release: "contents",
  repository: "metadata",
  repository_advisory: "repository_advisories",
  repository_ruleset: "administration",
  secret_scanning_alert: "secret_scanning_alerts",
  status: "statuses",
  workflow_job: "actions",
  workflow_run: "actions",
};

export function manifest(name: string = APP.name) {
  return {
    name,
    url: "https://aphrody.com",
    description:
      "Automatisation aphrody : CI, releases, sous-modules, agents (jetons d'installation de 1 h), webhooks vers la file d'agents.",
    hook_attributes: { url: APP.hook, active: true },
    redirect_url: `http://127.0.0.1:${APP.port}/callback`,
    callback_urls: [`http://127.0.0.1:${APP.port}/oauth/callback`],
    setup_url: `http://127.0.0.1:${APP.port}/setup`,
    setup_on_update: false,
    request_oauth_on_install: false,
    // Publique : une App privée ne s'installe que sur le compte propriétaire (docs « making a GitHub App public
    // or private ») ; il faut yolo-rs et le compte aphrody-dev. Installer n'accorde rien aux autres comptes.
    public: true,
    default_permissions: PERMISSIONS,
    default_events: EVENTS,
  };
}

const API = "https://api.github.com";
const H = {
  accept: "application/vnd.github+json",
  "x-github-api-version": "2022-11-28",
  "user-agent": "aphrody-env-kit",
};

function cred(name: string): string | undefined {
  return process.env[name] || secretGet(name) || undefined;
}

function clientId(): string {
  const v = cred("APHRODY_APP_CLIENT_ID") ?? ghVar("APHRODY_APP_CLIENT_ID");
  if (!v)
    throw new Error("APHRODY_APP_CLIENT_ID absent (ay auth github-app create)");
  return v;
}

function ghVar(name: string): string | undefined {
  const r = spawnSync("gh", ["variable", "get", name, "--org", APP.owner], {
    encoding: "utf8",
    windowsHide: true,
  });
  return r.status === 0 ? r.stdout.trim() || undefined : undefined;
}

const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");

/** JWT RS256 de l'App (iss = client id, recommandé ; iat -60 s ; exp +9 min, max 10). */
export function appJwt(
  pem = cred("APHRODY_APP_KEY"),
  iss = clientId(),
): string {
  if (!pem)
    throw new Error("APHRODY_APP_KEY absent (ay auth github-app create)");
  const now = Math.floor(Date.now() / 1000);
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64u(JSON.stringify({ iat: now - 60, exp: now + 540, iss }));
  const sig = sign(
    "RSA-SHA256",
    Buffer.from(`${head}.${body}`),
    createPrivateKey(pem),
  );
  return `${head}.${body}.${b64u(sig)}`;
}

async function gh(
  path: string,
  auth: string,
  init: RequestInit = {},
): Promise<any> {
  const r = await fetch(path.startsWith("http") ? path : `${API}${path}`, {
    ...init,
    headers: { ...H, authorization: `Bearer ${auth}`, ...(init.headers ?? {}) },
  });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok)
    throw new Error(
      `GitHub ${init.method ?? "GET"} ${path} : HTTP ${r.status} ${(j as any).message ?? ""}`.trim(),
    );
  return j;
}

export type Installation = {
  id: number;
  account: { login: string; type: string };
  repository_selection: string;
  permissions: Record<string, string>;
  events: string[];
};

export async function installations(jwt = appJwt()): Promise<Installation[]> {
  return gh("/app/installations?per_page=100", jwt);
}

/** Jeton d'installation (1 h), restreignable à des dépôts et des permissions. */
export async function installationToken(
  o: {
    owner?: string;
    repos?: string[];
    permissions?: Record<string, string>;
    jwt?: string;
  } = {},
): Promise<{ token: string; expires_at: string; installation: number }> {
  const jwt = o.jwt ?? appJwt();
  const owner = o.owner ?? APP.owner;
  const inst = (await installations(jwt)).find(
    (i) => i.account.login.toLowerCase() === owner.toLowerCase(),
  );
  if (!inst)
    throw new Error(
      `App non installée sur ${owner} (ay auth github-app install)`,
    );
  const body: Record<string, unknown> = {};
  if (o.repos?.length)
    body.repositories = o.repos.map((r) => r.replace(/^.*\//, ""));
  if (o.permissions && Object.keys(o.permissions).length)
    body.permissions = o.permissions;
  const t = await gh(`/app/installations/${inst.id}/access_tokens`, jwt, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { token: t.token, expires_at: t.expires_at, installation: inst.id };
}

const opt = (a: string[], k: string) =>
  a.includes(k) ? a[a.indexOf(k) + 1] : undefined;

function run(cmd: string[], env: NodeJS.ProcessEnv): number {
  const r = spawnSync(cmd[0]!, cmd.slice(1), {
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
  return r.status ?? 1;
}

function open(url: string) {
  if (process.platform === "win32")
    spawnSync("cmd", ["/c", "start", "", url], { windowsHide: true });
  else spawnSync("xdg-open", [url]);
}

function ghSecret(name: string, value: string, org: string): boolean {
  return (
    spawnSync(
      "gh",
      [
        "secret",
        "set",
        name,
        "--org",
        org,
        "--visibility",
        "selected",
        "--repos",
        APP.ciRepos.join(","),
      ],
      { input: value, encoding: "utf8", windowsHide: true },
    ).status === 0
  );
}

function ghVariable(name: string, value: string, org: string): boolean {
  return (
    spawnSync(
      "gh",
      [
        "variable",
        "set",
        name,
        "--org",
        org,
        "--visibility",
        "all",
        "--body",
        value,
      ],
      { encoding: "utf8", windowsHide: true },
    ).status === 0
  );
}

// --- create ---------------------------------------------------------------------------------------------------

async function create(a: string[]): Promise<number> {
  const org = opt(a, "--org") ?? APP.owner;
  const name = opt(a, "--name") ?? APP.name;
  const state = randomBytes(16).toString("hex");
  // Secret du webhook choisi ici (pas celui de la conversion) : il doit être au coffre et dans le Worker avant que
  // GitHub n'envoie le premier événement. Pousser ensuite le Worker : cf deploy --secrets-file (docs/infra/GITHUB-APP.md).
  if (!cred("APHRODY_APP_WEBHOOK_SECRET"))
    secretSet("APHRODY_APP_WEBHOOK_SECRET", randomBytes(32).toString("hex"));
  const esc = (x: string) =>
    x.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const page = `<!doctype html><meta charset=utf-8><title>GitHub App ${esc(name)}</title><form id=f method=post action="https://github.com/organizations/${encodeURIComponent(org)}/settings/apps/new?state=${state}"><input type=hidden name=manifest value="${esc(JSON.stringify(manifest(name)))}"><button>Créer l'App GitHub ${esc(name)}</button></form><script>document.getElementById("f").submit()</script>`;
  let finish: (code: number) => void = () => {};
  const done = new Promise<number>((r) => (finish = r));
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: APP.port,
    async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname === "/")
        return new Response(page, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      if (u.pathname === "/setup")
        return new Response(
          "Installation enregistrée. Cet onglet peut être fermé.",
          { headers: { "content-type": "text/plain; charset=utf-8" } },
        );
      if (u.pathname !== "/callback")
        return new Response(null, { status: 404 });
      if (u.searchParams.get("state") !== state)
        return new Response("state invalide", { status: 400 });
      const r = await fetch(
        `${API}/app-manifests/${encodeURIComponent(u.searchParams.get("code") ?? "")}/conversions`,
        { method: "POST", headers: H },
      );
      if (!r.ok) {
        finish(1);
        return new Response(`conversion refusée : HTTP ${r.status}`, {
          status: 502,
        });
      }
      const app = (await r.json()) as {
        id: number;
        slug: string;
        client_id: string;
        client_secret: string;
        webhook_secret: string | null;
        pem: string;
      };
      secretSet("APHRODY_APP_KEY", app.pem);
      secretSet("APHRODY_APP_CLIENT_SECRET", app.client_secret);
      secretSet("APHRODY_APP_ID", String(app.id));
      secretSet("APHRODY_APP_CLIENT_ID", app.client_id);
      const ci = APP.ciOrgs.map(
        (o) =>
          `${o} ${ghSecret("APHRODY_APP_KEY", app.pem, o) && ghVariable("APHRODY_APP_CLIENT_ID", app.client_id, o) ? "ok" : "échec"}`,
      );
      // Secret du webhook : celui du Worker (coffre APHRODY_APP_WEBHOOK_SECRET), posé par l'API de l'App.
      const hook = await setHook(appJwt(app.pem, app.client_id)).then(
        () => "ok",
        (e) => String(e.message),
      );
      console.error(
        `ay auth github-app : App ${app.slug} (id ${app.id}, client ${app.client_id}) ; clé, client secret -> coffre ; CI ${ci.join(", ")} ; webhook ${hook}`,
      );
      setTimeout(() => finish(0), 500);
      return Response.redirect(
        `https://github.com/apps/${app.slug}/installations/new`,
        302,
      );
    },
  });
  if (!a.includes("--no-open")) open(`http://127.0.0.1:${APP.port}/`);
  console.error(
    `ay auth github-app : page ouverte ; clic propriétaire « Create GitHub App for ${org} » puis « Install » (attente 24 h)`,
  );
  const code = await Promise.race([done, Bun.sleep(86_400_000).then(() => 1)]);
  server.stop(true);
  return code;
}

async function setHook(jwt = appJwt()): Promise<void> {
  const secret = cred("APHRODY_APP_WEBHOOK_SECRET");
  if (!secret) throw new Error("APHRODY_APP_WEBHOOK_SECRET absent");
  await gh("/app/hook/config", jwt, {
    method: "PATCH",
    body: JSON.stringify({
      url: APP.hook,
      content_type: "json",
      insecure_ssl: "0",
      secret,
    }),
  });
}

// --- status ---------------------------------------------------------------------------------------------------

export async function status(json = false): Promise<number> {
  const jwt = appJwt();
  const app = await gh("/app", jwt);
  const inst = await installations(jwt);
  const missingPerm = Object.entries(PERMISSIONS)
    .filter(([k, v]) => app.permissions?.[k] !== v)
    .map(([k, v]) => `${k}:${v}`);
  const missingEv = EVENTS.filter((e) => !app.events?.includes(e));
  const hook = await gh("/app/hook/config", jwt);
  const rows = APP.targets.map((t) => {
    const i = inst.find((x) => x.account.login.toLowerCase() === t);
    const lag = i
      ? Object.entries(app.permissions ?? {})
          .filter(
            ([k, v]) =>
              !USER_PERMISSIONS.has(k) &&
              !(
                i.account.type === "User" &&
                (k === "members" || k.startsWith("organization_"))
              ) &&
              i.permissions?.[k] !== v,
          )
          .map(([k]) => k)
      : [];
    return {
      account: t,
      installation: i?.id ?? null,
      selection: i?.repository_selection ?? null,
      pending_permissions: lag,
    };
  });
  const out = {
    app: {
      id: app.id,
      slug: app.slug,
      client_id: app.client_id,
      owner: app.owner?.login,
    },
    hook: {
      url: hook.url,
      content_type: hook.content_type,
      secret: hook.secret ? "set" : "absent",
    },
    permissions_missing: missingPerm,
    events_missing: missingEv,
    installations: rows,
  };
  if (json) console.log(JSON.stringify(out, null, 2));
  else {
    console.log(
      `App ${app.slug} (id ${app.id}, client ${app.client_id}, propriétaire ${app.owner?.login}) ; webhook ${hook.url} (secret ${out.hook.secret})`,
    );
    console.log(
      `permissions manquantes : ${missingPerm.join(", ") || "aucune"} ; événements manquants : ${missingEv.join(", ") || "aucun"}`,
    );
    for (const r of rows)
      console.log(
        `  ${r.account.padEnd(14)} ${r.installation ? `installée ${r.installation} (${r.selection})${r.pending_permissions.length ? `, permissions à accepter : ${r.pending_permissions.join(",")}` : ""}` : "NON installée"}`,
      );
  }
  return missingPerm.length ||
    missingEv.length ||
    rows.some((r) => !r.installation)
    ? 1
    : 0;
}

// --- user-to-server -------------------------------------------------------------------------------------------

async function tokenExchange(body: Record<string, string>): Promise<any> {
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: clientId(), ...body }),
  });
  return r.json();
}

function storeUser(t: any): void {
  if (t.refresh_token) secretSet("APHRODY_APP_USER_REFRESH", t.refresh_token);
}

/** Connexion utilisateur : web flow sur 127.0.0.1 (un clic « Authorize »), ou device flow avec --device. */
async function userLogin(a: string[]): Promise<number> {
  if (a.includes("--device")) {
    const r = await fetch("https://github.com/login/device/code", {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ client_id: clientId() }),
    });
    const d = (await r.json()) as {
      device_code: string;
      user_code: string;
      verification_uri: string;
      interval: number;
      expires_in: number;
      error?: string;
    };
    if (!d.device_code)
      throw new Error(
        `device flow refusé : ${d.error ?? r.status} (activer « Enable Device Flow » dans les réglages de l'App)`,
      );
    spawnSync(process.platform === "win32" ? "clip" : "wl-copy", [], {
      input: d.user_code,
      windowsHide: true,
    });
    open(d.verification_uri);
    console.error(
      `ay auth github-app user : ${d.verification_uri} ouvert, code ${d.user_code} (copié)`,
    );
    let wait = d.interval * 1000;
    const end = Date.now() + d.expires_in * 1000;
    while (Date.now() < end) {
      await Bun.sleep(wait);
      const t = await tokenExchange({
        device_code: d.device_code,
        grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      });
      if (t.access_token) {
        storeUser(t);
        console.error(
          `ay auth github-app user : jeton utilisateur obtenu (expire dans ${t.expires_in ?? "?"} s, refresh ${t.refresh_token ? "rangé" : "absent : activer l'expiration des jetons"})`,
        );
        return 0;
      }
      if (t.error === "slow_down") wait += 5000;
      else if (t.error !== "authorization_pending")
        throw new Error(`device flow : ${t.error}`);
    }
    return 1;
  }
  const secret = cred("APHRODY_APP_CLIENT_SECRET");
  if (!secret) throw new Error("APHRODY_APP_CLIENT_SECRET absent");
  const state = randomBytes(16).toString("hex");
  let finish: (c: number) => void = () => {};
  const done = new Promise<number>((r) => (finish = r));
  const redirect = `http://127.0.0.1:${APP.port}/oauth/callback`;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: APP.port,
    async fetch(req) {
      const u = new URL(req.url);
      if (u.pathname !== "/oauth/callback")
        return new Response(null, { status: 404 });
      if (u.searchParams.get("state") !== state)
        return new Response("state invalide", { status: 400 });
      const t = await tokenExchange({
        client_secret: secret,
        code: u.searchParams.get("code") ?? "",
        redirect_uri: redirect,
      });
      if (!t.access_token) {
        finish(1);
        return new Response(`échange refusé : ${t.error ?? "?"}`, {
          status: 502,
        });
      }
      storeUser(t);
      console.error(
        `ay auth github-app user : jeton utilisateur obtenu (refresh ${t.refresh_token ? "rangé" : "absent"})`,
      );
      setTimeout(() => finish(0), 300);
      return new Response("Autorisé. Cet onglet peut être fermé.", {
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    },
  });
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId())}&redirect_uri=${encodeURIComponent(redirect)}&state=${state}`;
  if (a.includes("--no-open")) console.error(authUrl);
  else open(authUrl);
  console.error(
    "ay auth github-app user : page d'autorisation ouverte ; clic propriétaire « Authorize »",
  );
  const code = await Promise.race([done, Bun.sleep(600_000).then(() => 1)]);
  server.stop(true);
  return code;
}

/** Jeton utilisateur frais (refresh token tournant, rangé à chaque usage). */
export async function userToken(): Promise<string> {
  const refresh = cred("APHRODY_APP_USER_REFRESH");
  const secret = cred("APHRODY_APP_CLIENT_SECRET");
  if (!refresh || !secret)
    throw new Error("jeton utilisateur absent (ay auth github-app user)");
  const t = await tokenExchange({
    client_secret: secret,
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  if (!t.access_token)
    throw new Error(
      `refresh refusé : ${t.error ?? "?"} (ay auth github-app user)`,
    );
  storeUser(t);
  return t.access_token;
}

// --- retire ---------------------------------------------------------------------------------------------------

/** Désinstalle l'ancienne App (sa clé est au coffre), purge ses secrets/variables d'org, ouvre sa page de suppression. */
async function retire(a: string[]): Promise<number> {
  const slug = opt(a, "--slug") ?? "aphrody-labs-submodules";
  const key = opt(a, "--key") ?? "SUBMODULES_APP_KEY";
  const idVar = opt(a, "--client-id-var") ?? "SUBMODULES_APP_CLIENT_ID";
  const pem = cred(key);
  const cid = cred(idVar) ?? ghVar(idVar);
  const log: string[] = [];
  if (pem && cid) {
    const jwt = appJwt(pem, cid);
    for (const i of await installations(jwt)) {
      await gh(`/app/installations/${i.id}`, jwt, { method: "DELETE" });
      log.push(`désinstallée de ${i.account.login}`);
    }
  } else
    log.push(
      `clé ${key} ou client id absent : désinstallation par la page de l'App`,
    );
  for (const o of APP.ciOrgs) {
    if (
      spawnSync("gh", ["secret", "delete", key, "--org", o], {
        windowsHide: true,
      }).status === 0
    )
      log.push(`secret ${key} supprimé (${o})`);
    if (
      spawnSync("gh", ["variable", "delete", idVar, "--org", o], {
        windowsHide: true,
      }).status === 0
    )
      log.push(`variable ${idVar} supprimée (${o})`);
  }
  if (secretHas(key) && secretDelete(key)) log.push(`coffre ${key} supprimé`);
  // Aucune API ne supprime l'enregistrement d'une App : page « Advanced » ouverte pour le propriétaire.
  const adv = `https://github.com/organizations/${APP.owner}/settings/apps/${slug}/advanced`;
  if (a.includes("--no-open")) console.error(adv);
  else open(adv);
  console.error(
    `ay auth github-app retire ${slug} : ${log.join(" ; ")} ; page « Delete GitHub App » ouverte`,
  );
  return 0;
}

// --- crates.io trusted publishing --------------------------------------------------------------------------

/**
 * Enregistre sur crates.io la configuration GitHub (POST /api/v1/trusted_publishing/github_configs, schéma
 * NewGitHubConfig de rust-lang/crates.io) qui autorise .github/workflows/crates-publish.yml à publier chaque crate.
 * Jeton : CARGO_REGISTRY_TOKEN du coffre (portée trusted-publishing requise par l API). Idempotent.
 */
async function cratesTrust(a: string[]): Promise<number> {
  const crates = (opt(a, "--crates") ?? "").split(",").filter(Boolean);
  const [owner, repo] = (opt(a, "--repo") ?? "aphrody-labs/src").split("/");
  const workflow = opt(a, "--workflow") ?? "crates-publish.yml";
  const token = cred("CARGO_REGISTRY_TOKEN");
  if (!crates.length || !token)
    throw new Error("--crates a,b et CARGO_REGISTRY_TOKEN requis");
  const h = {
    authorization: token,
    "content-type": "application/json",
    "user-agent": "aphrody-env-kit (contact@aphrody.com)",
  };
  let bad = 0;
  for (const krate of crates) {
    const cur = (await (
      await fetch(
        `https://crates.io/api/v1/trusted_publishing/github_configs?crate=${encodeURIComponent(krate)}`,
        { headers: h },
      )
    ).json()) as {
      github_configs?: {
        repository_owner: string;
        repository_name: string;
        workflow_filename: string;
      }[];
    };
    if (
      cur.github_configs?.some(
        (c) =>
          c.repository_owner === owner &&
          c.repository_name === repo &&
          c.workflow_filename === workflow,
      )
    ) {
      console.error(`${krate} : déjà configurée`);
      continue;
    }
    const r = await fetch(
      "https://crates.io/api/v1/trusted_publishing/github_configs",
      {
        method: "POST",
        headers: h,
        body: JSON.stringify({
          github_config: {
            crate: krate,
            repository_owner: owner,
            repository_name: repo,
            workflow_filename: workflow,
            environment: null,
          },
        }),
      },
    );
    if (!r.ok) bad++;
    console.error(
      `${krate} : ${r.ok ? "configurée" : `HTTP ${r.status} ${(await r.text()).slice(0, 160)}`}`,
    );
  }
  return bad ? 1 : 0;
}

// --- entrée ---------------------------------------------------------------------------------------------------

export async function githubAppCommand(a: string[]): Promise<number> {
  return dispatch(a).catch((e: Error) => {
    console.error(`ay auth github-app : ${e.message}`);
    return 1;
  });
}

async function dispatch(a: string[]): Promise<number> {
  const [sub = "create", ...rest] = a[0]?.startsWith("-")
    ? ["create", ...a]
    : a;
  const sep = rest.indexOf("--");
  const head = sep >= 0 ? rest.slice(0, sep) : rest;
  const cmd = sep >= 0 ? rest.slice(sep + 1) : [];
  switch (sub) {
    case "create":
      return create(head);
    case "install":
      for (const t of APP.targets)
        open(
          `https://github.com/apps/${APP.name}/installations/new/permissions?target_id=${await accountId(t)}`,
        );
      console.error(
        `ay auth github-app install : ${APP.targets.length} pages ouvertes ; clic propriétaire « Install » sur chacune (All repositories)`,
      );
      return 0;
    case "status":
      return status(head.includes("--json"));
    case "hook":
      await setHook();
      console.error(`ay auth github-app hook : ${APP.hook} (secret du coffre)`);
      return 0;
    case "token": {
      const perms = Object.fromEntries(
        (opt(head, "--perm") ?? "")
          .split(",")
          .filter(Boolean)
          .map((kv) => kv.split("=") as [string, string]),
      );
      const t = await installationToken({
        owner: opt(head, "--owner"),
        repos: opt(head, "--repos")?.split(","),
        permissions: perms,
      });
      if (cmd.length)
        return run(cmd, {
          ...process.env,
          GH_TOKEN: t.token,
          GITHUB_TOKEN: t.token,
        });
      if (process.stdout.isTTY) {
        console.error(
          `ay auth github-app token : jeton de l'installation ${t.installation} (expire ${t.expires_at}) non affiché ; utiliser -- <cmd> ou un tube`,
        );
        return 2;
      }
      process.stdout.write(t.token);
      return 0;
    }
    case "user":
      return userLogin(head);
    case "user-token": {
      const t = await userToken();
      if (cmd.length)
        return run(cmd, { ...process.env, GH_TOKEN: t, GITHUB_TOKEN: t });
      if (process.stdout.isTTY) return 2;
      process.stdout.write(t);
      return 0;
    }
    case "retire":
      return retire(head);
    case "crates-trust":
      return cratesTrust(head);
    default:
      console.error(
        "usage : ay auth github-app [create|install|status|hook|token|user|user-token|retire|crates-trust]",
      );
      return 2;
  }
}

async function accountId(login: string): Promise<number> {
  const r = await fetch(`${API}/users/${login}`, { headers: H });
  return ((await r.json()) as { id: number }).id;
}

if (import.meta.main)
  process.exit(await githubAppCommand(process.argv.slice(2)));
