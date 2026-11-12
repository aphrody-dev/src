// SPDX-License-Identifier: Apache-2.0
/**
 * `env-kit whoami`: asks every provider who the configured credentials belong to, in parallel.
 * Prints identities only (login, e-mail, account name); secrets are read from the process env and
 * never printed. A provider whose credential is missing reports `unset`, a rejected one `invalid`.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

export interface Identity {
  provider: string;
  status: "ok" | "unset" | "invalid";
  identity?: string;
  detail?: string;
}

type Env = Readonly<Record<string, string | undefined>>;

function run(cmd: string, args: string[]): string | null {
  const r = spawnSync(cmd, args, { encoding: "utf8", timeout: 20_000 });
  return r.status === 0 ? r.stdout.trim() : null;
}

async function json(
  url: string,
  init: RequestInit,
): Promise<{ ok: boolean; body: any }> {
  try {
    const r = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(15_000),
    });
    return { ok: r.ok, body: await r.json().catch(() => null) };
  } catch {
    return { ok: false, body: null };
  }
}

const cli = (provider: string, out: string | null): Identity =>
  out
    ? { provider, status: "ok", identity: out.split("\n")[0] }
    : { provider, status: "invalid" };

/** OVH signed request: X-Ovh-Signature = "$1$" + sha1(secret+consumer+method+url+body+timestamp). */
async function ovhMe(env: Env): Promise<Identity> {
  const ak = env.OVH_APPLICATION_KEY,
    as = env.OVH_APPLICATION_SECRET,
    ck = env.OVH_CONSUMER_KEY;
  if (!ak || !as || !ck) return { provider: "ovh", status: "unset" };
  const base = env.OVH_ENDPOINT?.startsWith("http")
    ? env.OVH_ENDPOINT
    : "https://eu.api.ovh.com/1.0";
  const time = await fetch(`${base}/auth/time`)
    .then((r) => r.text())
    .catch(() => `${Math.floor(Date.now() / 1000)}`);
  const url = `${base}/me`;
  const sig =
    "$1$" +
    createHash("sha1")
      .update(`${as}+${ck}+GET+${url}++${time.trim()}`)
      .digest("hex");
  const r = await json(url, {
    headers: {
      "X-Ovh-Application": ak,
      "X-Ovh-Consumer": ck,
      "X-Ovh-Timestamp": time.trim(),
      "X-Ovh-Signature": sig,
    },
  });
  return r.ok
    ? {
        provider: "ovh",
        status: "ok",
        identity: `${r.body?.nichandle} <${r.body?.email}>`,
      }
    : { provider: "ovh", status: "invalid" };
}

async function cloudflare(env: Env): Promise<Identity> {
  const t = env.CLOUDFLARE_API_TOKEN;
  if (!t) return { provider: "cloudflare", status: "unset" };
  const h = { headers: { Authorization: `Bearer ${t}` } };
  const v = await json(
    "https://api.cloudflare.com/client/v4/user/tokens/verify",
    h,
  );
  if (!v.ok) return { provider: "cloudflare", status: "invalid" };
  const acc = await json(
    "https://api.cloudflare.com/client/v4/accounts?per_page=5",
    h,
  );
  const names = (acc.body?.result ?? [])
    .map((a: { name: string }) => a.name)
    .join(", ");
  return {
    provider: "cloudflare",
    status: "ok",
    identity: names || "token active",
    detail: `token ${v.body?.result?.status}`,
  };
}

async function hostinger(env: Env): Promise<Identity> {
  const t = env.HOSTINGER_API_TOKEN;
  if (!t) return { provider: "hostinger", status: "unset" };
  const r = await json(
    "https://developers.hostinger.com/api/vps/v1/virtual-machines",
    {
      headers: { Authorization: `Bearer ${t}` },
    },
  );
  const vms = Array.isArray(r.body) ? r.body : (r.body?.data ?? []);
  return r.ok
    ? {
        provider: "hostinger",
        status: "ok",
        identity:
          vms.map((v: { hostname: string }) => v.hostname).join(", ") ||
          "token active",
      }
    : { provider: "hostinger", status: "invalid" };
}

function claude(): Identity {
  const out = run("claude", ["auth", "status"]);
  if (!out) return { provider: "claude", status: "invalid" };
  try {
    const s = JSON.parse(out) as {
      loggedIn?: boolean;
      authMethod?: string;
      email?: string;
      orgName?: string;
    };
    return s.loggedIn
      ? {
          provider: "claude",
          status: "ok",
          identity: s.email ?? s.orgName ?? "logged in",
          detail: s.authMethod,
        }
      : { provider: "claude", status: "invalid" };
  } catch {
    return { provider: "claude", status: "invalid" };
  }
}

/** Every identity probe, run concurrently. */
export async function whoami(env: Env = process.env): Promise<Identity[]> {
  const win = run("whoami", ["/upn"]) ?? run("whoami", []);
  return Promise.all([
    Promise.resolve(cli("windows", win)),
    Promise.resolve(
      cli("git", run("git", ["config", "--global", "user.email"])),
    ),
    Promise.resolve(cli("github", run("gh", ["api", "user", "-q", ".login"]))),
    Promise.resolve(
      cli(
        "gcloud",
        run("gcloud", [
          "auth",
          "list",
          "--filter=status:ACTIVE",
          "--format=value(account)",
        ]),
      ),
    ),
    cloudflare(env),
    ovhMe(env),
    hostinger(env),
    Promise.resolve(claude()),
  ]);
}

export function formatIdentities(ids: readonly Identity[]): string {
  return ids
    .map(
      (i) =>
        `  ${i.provider.padEnd(11)} ${i.status.padEnd(8)} ${i.identity ?? ""}${i.detail ? `  (${i.detail})` : ""}`,
    )
    .join("\n");
}
