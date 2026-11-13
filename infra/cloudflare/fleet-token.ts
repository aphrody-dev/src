#!/usr/bin/env bun
// Jeton Cloudflare de la flotte (fleet-health, automatisation VPS) : un jeton de compte par hôte, à privilèges
// minimaux (Zone Read + DNS Write sur les seules zones déclarées), 1 an, rotation idempotente (l'ancien jeton du même
// nom est supprimé après la pose du nouveau). La valeur ne passe que par stdin de ssh, jamais par argv ni stdout.
//   bun packages/env-kit/src/cli.ts secret exec CLOUDFLARE_API_TOKEN -- bun infra/cloudflare/fleet-token.ts [fr2 prd]
// Pose dans /etc/aphrody/secrets.env (600) : CLOUDFLARE_API_TOKEN et CF_API_TOKEN (fleet-health.sh).
import { cfg } from "./lib";

const ZONES = ["aphrody.com", "aphrody.app"];
const WANT = ["Zone Read", "DNS Write"];
const hosts = Bun.argv.slice(2).length ? Bun.argv.slice(2) : ["fr2", "prd"];
const admin = Bun.env.CLOUDFLARE_API_TOKEN ?? "";
if (!admin) throw new Error("CLOUDFLARE_API_TOKEN absent (lancer via env-kit secret exec)");

async function cf<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    method,
    headers: { authorization: `Bearer ${admin}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const j = (await r.json()) as { success: boolean; result: T; errors?: { code: number; message: string }[] };
  if (!j.success) throw new Error(`${method} ${path} -> HTTP ${r.status} ${j.errors?.map((e) => `${e.code} ${e.message}`).join("; ")}`);
  return j.result;
}

const A = cfg.account;
const groups = await cf<{ id: string; name: string }[]>("GET", `/accounts/${A}/tokens/permission_groups`);
const perms = WANT.map((w) => groups.find((g) => g.name === w) ?? (() => { throw new Error(`groupe inconnu : ${w}`); })());
const zones = await Promise.all(ZONES.map(async (n) => (await cf<{ id: string }[]>("GET", `/zones?name=${n}`))[0]?.id ?? ""));
if (zones.some((z) => !z)) throw new Error("zone introuvable");
const resources = Object.fromEntries(zones.map((z) => [`com.cloudflare.api.account.zone.${z}`, "*"]));
const expires = new Date(Date.now() + 365 * 86400_000).toISOString().replace(/\.\d+Z$/, "Z");
const existing = await cf<{ id: string; name: string }[]>("GET", `/accounts/${A}/tokens?per_page=100`);

// Atomic, locked rewrite (root 600, temp file removed by trap); the value comes on stdin, is checked against the token
// alphabet and is never sourced or put in argv (curl reads the header on stdin, -H @-). Other writers of secrets.env
// (cf.ts storeAccess) take the same flock.
const SET = String.raw`sudo bash -c 'set -eu; umask 077; f=/etc/aphrody/secrets.env; exec 9>/run/lock/aphrody-secrets.lock; flock -w 30 9; v=$(cat); case "$v" in *[!A-Za-z0-9_-]*|"") echo "zones badtoken"; exit 1;; esac; t=$(mktemp /etc/aphrody/.secrets.XXXXXX); trap "rm -f $t" EXIT; { [ -f $f ] && grep -v -E "^(CLOUDFLARE_API_TOKEN|CF_API_TOKEN)=" $f || true; printf "CLOUDFLARE_API_TOKEN=%s\nCF_API_TOKEN=%s\n" "$v" "$v"; } > $t; install -m 600 -o root -g root $t $f; printf "Authorization: Bearer %s\n" "$v" | curl -H @- -s -o /dev/null -w "zones %{http_code}" https://api.cloudflare.com/client/v4/zones?per_page=1'`;

for (const h of hosts) {
  const name = `fleet-${h}-dns`;
  const t = await cf<{ id: string; value: string }>("POST", `/accounts/${A}/tokens`, {
    name, expires_on: expires, policies: [{ effect: "allow", resources, permission_groups: perms.map(({ id }) => ({ id })) }],
  });
  const r = Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=30", h, SET], { stdin: Buffer.from(t.value), timeout: 120_000 });
  const out = r.stdout.toString().trim();
  if (r.exitCode !== 0 || !out.endsWith("200")) {
    await cf("DELETE", `/accounts/${A}/tokens/${t.id}`);
    console.log(`${h}: échec (${out || r.stderr.toString().trim().slice(0, 120)}), nouveau jeton supprimé`);
    continue;
  }
  for (const o of existing.filter((x) => x.name === name)) await cf("DELETE", `/accounts/${A}/tokens/${o.id}`);
  console.log(`${h}: ${name} ${t.id} posé (${WANT.join(", ")} sur ${ZONES.join(", ")}, expire ${expires}), ${out}`);
}
