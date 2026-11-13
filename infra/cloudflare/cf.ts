#!/usr/bin/env bun
// Declarative Cloudflare edge: plan (default, read-only diff) or apply one section of cloudflare.toml.
//   bun infra/cloudflare/cf.ts plan [dns|tunnels|rules|access]
//   bun infra/cloudflare/cf.ts apply <dns|tunnels|rules|access> [--only <name>]
// --only restricts dns/tunnels to one record or tunnel (service-by-service migration).
import { api, cfg, expand, tunnelId, type Rec } from "./lib.ts";

const [cmd = "plan", section, ...rest] = Bun.argv.slice(2);
const oi = rest.indexOf("--only");
const only = oi >= 0 ? (rest[oi + 1] ?? "") : "";
const apply = cmd === "apply";
if (!["plan", "apply"].includes(cmd) || (apply && !section)) {
  console.error("usage: cf.ts plan [section] | apply <dns|tunnels|rules|access> [--only name]");
  process.exit(2);
}
let changes = 0;
const say = (op: string, what: string) => (changes++, console.log(`${apply ? "APPLY" : "PLAN "} ${op.padEnd(7)} ${what}`));
const want = (s: string) => !section || section === s;

// ---------------------------------------------------------------- tunnels
if (want("tunnels")) {
  for (const [name, t] of Object.entries(cfg.tunnels)) {
    if (only && only !== name) continue;
    let id = await tunnelId(name);
    if (!id) {
      say("create", `tunnel ${name} (remote-managed, connector on ${t.host})`);
      if (!apply) continue;
      id = (await api<any>("POST", `/accounts/${cfg.account}/cfd_tunnel`, { name, config_src: "cloudflare" })).id;
      console.log(`  tunnel ${name} = ${id} (write it into cloudflare.toml)`);
    }
    const cur = await api<any>("GET", `/accounts/${cfg.account}/cfd_tunnel/${id}/configurations`).catch(() => ({ config: {} }));
    const curIng = JSON.stringify((cur.config?.ingress ?? []).map(({ hostname, service, path }: any) => ({ hostname, service, path })));
    const newIng = JSON.stringify(t.ingress.map(({ hostname, service, path }) => ({ hostname, service, path })));
    if (curIng === newIng) continue;
    const curH = new Set((cur.config?.ingress ?? []).map((i: any) => `${i.hostname ?? "*"} -> ${i.service}`));
    for (const i of t.ingress) if (!curH.has(`${i.hostname ?? "*"} -> ${i.service}`)) say("ingress", `${name}: + ${i.hostname ?? "(default)"} -> ${i.service}`);
    const newH = new Set(t.ingress.map((i) => `${i.hostname ?? "*"} -> ${i.service}`));
    for (const h of curH) if (!newH.has(h as string)) say("ingress", `${name}: - ${h}`);
    if (apply) await api("PUT", `/accounts/${cfg.account}/cfd_tunnel/${id}/configurations`, { config: { ...cur.config, ingress: t.ingress } });
  }
}

// ---------------------------------------------------------------- dns
if (want("dns")) {
  for (const [zone, recs] of Object.entries(cfg.dns)) {
    const zid = cfg.zones[zone];
    const live = await api<any[]>("GET", `/zones/${zid}/dns_records?per_page=5000`);
    for (const [name, r] of Object.entries(recs) as [string, Rec][]) {
      if (only && only !== name) continue;
      const content = await expand(r.content, apply);
      const proxied = r.proxied ?? true;
      const same = live.filter((x) => x.name === name && ["A", "AAAA", "CNAME"].includes(x.type));
      const body = { type: r.type, name, content, proxied, ttl: 1, comment: "managed: infra/cloudflare/cloudflare.toml" };
      const match = same.find((x) => x.type === r.type && x.content === content);
      if (match && match.proxied === proxied) {
        // A/AAAA pairs: keep sibling records of the other family, but a CNAME must stand alone.
        if (r.type !== "CNAME") {
          for (const x of same.filter((x) => x.id !== match.id && x.proxied !== proxied)) {
            say("update", `${name} ${x.type} ${x.content} proxied ${x.proxied} -> ${proxied}`);
            if (apply) await api("PATCH", `/zones/${zid}/dns_records/${x.id}`, { proxied });
          }
        }
        continue;
      }
      if (same.length === 0) {
        say("create", `${name} ${r.type} ${content} proxied=${proxied}`);
        if (apply) await api("POST", `/zones/${zid}/dns_records`, body);
        continue;
      }
      // In-place overwrite of the first record (atomic, no gap), then remove siblings a CNAME cannot coexist with.
      const [first, ...others] = same;
      say("update", `${name} ${first.type} ${first.content} (proxied ${first.proxied}) -> ${r.type} ${content} proxied=${proxied}`);
      if (r.type === "CNAME") for (const x of others) say("delete", `${name} ${x.type} ${x.content}`);
      else for (const x of others.filter((x) => x.proxied !== proxied)) say("update", `${name} ${x.type} ${x.content} proxied -> ${proxied}`);
      if (!apply) continue;
      if (r.type === "CNAME") {
        for (const x of others) await api("DELETE", `/zones/${zid}/dns_records/${x.id}`);
        await api("PUT", `/zones/${zid}/dns_records/${first.id}`, body);
      } else {
        await api("PATCH", `/zones/${zid}/dns_records/${first.id}`, { proxied });
        for (const x of others.filter((x) => x.proxied !== proxied)) await api("PATCH", `/zones/${zid}/dns_records/${x.id}`, { proxied });
      }
    }
  }
}

// ---------------------------------------------------------------- rules (by ref, other rules untouched)
if (want("rules")) {
  for (const r of cfg.rules) {
    const zid = cfg.zones[r.zone];
    const ep = await api<any>("GET", `/zones/${zid}/rulesets/phases/${r.phase}/entrypoint`).catch(() => null);
    const rule: any = { ref: r.ref, description: r.description, expression: r.expression, action: r.action, enabled: true };
    if (r.ratelimit) rule.ratelimit = r.ratelimit;
    const cur = ep?.rules?.find((x: any) => x.ref === r.ref);
    // The API adds defaults to ratelimit (requests_to_origin...): compare only the keys declared here.
    const rlSame = !r.ratelimit || Object.entries(r.ratelimit).every(([k, v]) => JSON.stringify(cur?.ratelimit?.[k]) === JSON.stringify(v));
    if (cur && cur.expression === r.expression && cur.action === r.action && rlSame) continue;
    say(cur ? "update" : "create", `${r.zone} ${r.phase} ${r.ref}`);
    if (!apply) continue;
    if (!ep) await api("PUT", `/zones/${zid}/rulesets/phases/${r.phase}/entrypoint`, { rules: [rule] });
    else if (cur) await api("PATCH", `/zones/${zid}/rulesets/${ep.id}/rules/${cur.id}`, rule);
    else await api("POST", `/zones/${zid}/rulesets/${ep.id}/rules`, rule);
  }
}

// ---------------------------------------------------------------- access
// One service token per host (fleet-agents-<host>), its secret stored only on that host; an app accepts a token only if
// it lists it in `tokens` (ssh-prd <- fr2's token, ssh-fr2 <- prd's token): no shared, bidirectional credential, and
// admin UIs accept no token at all. App policies are reconciled (owner policy first, then the listed token policies).
// Atomic, locked rewrite of /etc/aphrody/secrets.env (root 600): the secret only travels on ssh stdin.
function storeAccess(host: string, t: { client_id: string; client_secret: string }): boolean {
  const env = `CF_ACCESS_CLIENT_ID=${t.client_id}\nCF_ACCESS_CLIENT_SECRET=${t.client_secret}\n`;
  const script = "set -eu; umask 077; f=/etc/aphrody/secrets.env; exec 9>/run/lock/aphrody-secrets.lock; flock -w 30 9; " +
    "t=$(mktemp /etc/aphrody/.secrets.XXXXXX); trap 'rm -f $t' EXIT; { [ -f $f ] && grep -v '^CF_ACCESS_CLIENT_' $f || true; cat; } > $t; " +
    "install -m 600 -o root -g root $t $f; rm -f $t; grep -c '^CF_ACCESS_CLIENT_' $f";
  const p = Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=60", host, `sudo bash -c ${JSON.stringify(script)}`],
    { stdin: Buffer.from(env), timeout: 180_000 });
  return p.exitCode === 0 && p.stdout.toString().trim() === "2";
}

// client_id stored on the host (ids are not secret): detects a token whose secret never reached the host.
function storedClientId(host: string): string {
  const p = Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=60", host,
    "sudo sed -n 's/^CF_ACCESS_CLIENT_ID=//p' /etc/aphrody/secrets.env"], { timeout: 120_000 });
  return p.exitCode === 0 ? p.stdout.toString().trim() : "?";
}

if (want("access")) {
  const A = cfg.account;
  const tokens = await api<any[]>("GET", `/accounts/${A}/access/service_tokens`);
  const pols = await api<any[]>("GET", `/accounts/${A}/access/policies`);
  const polByToken = new Map<string, string>();
  for (const st of cfg.access.service_tokens) {
    let tok = tokens.find((t) => t.name === st.name);
    // The secret is shown once. Store it; on failure rotate (new secret) and store again, at most 3 stores, then stop.
    const deliver = async (first: any) => {
      let cred = first;
      for (let n = 1; ; n++) {
        if (storeAccess(st.host, cred)) return console.log(`  service token stored on ${st.host}: ok`);
        if (n === 3) throw new Error(`service token ${st.name}: secret could not be stored on ${st.host} (3 attempts)`);
        console.error(`  store on ${st.host} failed, rotating ${st.name} (attempt ${n})`);
        cred = await api<any>("POST", `/accounts/${A}/access/service_tokens/${tok.id}/rotate`);
      }
    };
    if (!tok) {
      say("create", `service token ${st.name} (secret piped to ${st.host} /etc/aphrody/secrets.env only)`);
      if (apply) {
        tok = await api<any>("POST", `/accounts/${A}/access/service_tokens`, { name: st.name, duration: "8760h" });
        await deliver(tok);
      }
    } else {
      const have = storedClientId(st.host);
      if (have !== tok.client_id) {
        say("rotate", `service token ${st.name}: ${st.host} holds ${have === "" ? "no" : "another"} client id, new secret delivered`);
        if (apply) await deliver(await api<any>("POST", `/accounts/${A}/access/service_tokens/${tok.id}/rotate`));
      }
    }
    let pol = pols.find((p) => p.name === `${st.name}-token`);
    if (!pol) {
      say("create", `policy ${st.name}-token (non_identity, service token)`);
      if (apply && tok) pol = await api("POST", `/accounts/${A}/access/policies`, {
        name: `${st.name}-token`, decision: "non_identity", include: [{ service_token: { token_id: tok.id } }], session_duration: "24h",
      });
    }
    // The policy must point at the current token (a recreated token would otherwise leave access broken).
    const bound = pol?.include?.[0]?.service_token?.token_id;
    if (pol && tok && bound !== tok.id) {
      say("update", `policy ${st.name}-token bound to ${bound ?? "nothing"} -> ${tok.id}`);
      if (apply) pol = await api("PUT", `/accounts/${A}/access/policies/${pol.id}`, {
        name: pol.name, decision: "non_identity", include: [{ service_token: { token_id: tok.id } }], session_duration: pol.session_duration ?? "24h",
      });
    }
    if (pol) polByToken.set(st.name, pol.id);
  }
  const apps = await api<any[]>("GET", `/accounts/${A}/access/apps?per_page=100`);
  for (const a of cfg.access.apps) {
    const desired = [cfg.access.owner_policy, ...(a.tokens ?? []).map((t) => polByToken.get(t)).filter((x): x is string => !!x)];
    // PUT body: the managed fields plus the editable settings already set on the app (read-only fields such as id,
    // uid, aud, created_at are never sent back).
    const KEEP = ["allowed_idps", "auto_redirect_to_identity", "cors_headers", "enable_binding_cookie", "http_only_cookie_attribute",
      "same_site_cookie_attribute", "logo_url", "skip_interstitial", "options_preflight_bypass", "service_auth_401_redirect", "tags"];
    const body = (cur?: any) => ({
      ...Object.fromEntries(KEEP.filter((k) => cur?.[k] !== undefined).map((k) => [k, cur[k]])), name: a.name, type: a.type, domain: a.domain, session_duration: cur?.session_duration ?? "24h",
      app_launcher_visible: cur?.app_launcher_visible ?? true, policies: desired.map((id, i) => ({ id, precedence: i + 1 })),
    });
    const cur = apps.find((x) => x.name === a.name);
    if (!cur) {
      say("create", `access app ${a.name} (${a.type}) ${a.domain} policies=${desired.length}`);
      if (apply) await api("POST", `/accounts/${A}/access/apps`, body());
      continue;
    }
    const have = (cur.policies ?? []).slice().sort((x: any, y: any) => x.precedence - y.precedence).map((p: any) => p.id);
    if (have.join() === desired.join()) continue;
    say("update", `access app ${a.name} policies ${have.length} -> ${desired.length} (${(a.tokens ?? []).join(",") || "owner only"})`);
    if (apply) await api("PUT", `/accounts/${A}/access/apps/${cur.id}`, body(cur));
  }
  // Retired tokens (declared in retire_tokens): deleted only when no app references their policy any more
  // (apps re-read after the reconciliation above); a failed policy delete stops before the token is touched.
  const after = apply ? await api<any[]>("GET", `/accounts/${A}/access/apps?per_page=100`) : apps;
  const polsNow = apply ? await api<any[]>("GET", `/accounts/${A}/access/policies`) : pols;
  for (const name of cfg.access.retire_tokens ?? []) {
    const t = tokens.find((x) => x.name === name);
    if (!t) continue;
    const p = polsNow.find((x) => x.name === `${name}-token`);
    const users = p ? after.filter((a) => (a.policies ?? []).some((x: any) => x.id === p.id)).map((a) => a.name) : [];
    if (users.length) {
      console.error(`  keep ${name}: policy still used by ${users.join(", ")}`);
      continue;
    }
    say("delete", `service token ${name} + policy ${name}-token (replaced by per-host tokens)`);
    if (apply) {
      if (p) await api("DELETE", `/accounts/${A}/access/policies/${p.id}`);
      await api("DELETE", `/accounts/${A}/access/service_tokens/${t.id}`);
    }
  }
}

console.log(changes ? `${changes} change(s) ${apply ? "applied" : "pending"}` : "no changes");
