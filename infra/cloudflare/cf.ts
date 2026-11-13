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
if (want("access")) {
  const A = cfg.account;
  const tokens = await api<any[]>("GET", `/accounts/${A}/access/service_tokens`);
  let tok = tokens.find((t) => t.name === cfg.access.service_token);
  if (!tok) {
    say("create", `service token ${cfg.access.service_token} (secret piped to fr2/prd /etc/aphrody/secrets.env)`);
    if (apply) {
      const t = await api<any>("POST", `/accounts/${A}/access/service_tokens`, { name: cfg.access.service_token, duration: "8760h" });
      const env = `CF_ACCESS_CLIENT_ID=${t.client_id}\nCF_ACCESS_CLIENT_SECRET=${t.client_secret}\n`;
      for (const h of ["fr2", "prd"]) {
        const p = Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", h,
          "sudo sh -c 'umask 077; f=/etc/aphrody/secrets.env; grep -v ^CF_ACCESS_CLIENT_ $f > $f.new 2>/dev/null; cat >> $f.new; mv $f.new $f; chmod 600 $f'"], { stdin: Buffer.from(env) });
        console.log(`  service token stored on ${h}: ${p.exitCode === 0 ? "ok" : "FAILED"}`);
      }
      tok = t;
    }
  }
  const pols = await api<any[]>("GET", `/accounts/${A}/access/policies`);
  let pol = pols.find((p) => p.name === `${cfg.access.service_token}-token`);
  if (!pol) {
    say("create", `policy ${cfg.access.service_token}-token (non_identity, service token)`);
    if (apply && tok) pol = await api("POST", `/accounts/${A}/access/policies`, {
      name: `${cfg.access.service_token}-token`, decision: "non_identity", include: [{ service_token: { token_id: tok.id } }], session_duration: "24h",
    });
  }
  const apps = await api<any[]>("GET", `/accounts/${A}/access/apps?per_page=100`);
  for (const a of cfg.access.apps) {
    const cur = apps.find((x) => x.name === a.name);
    if (cur) continue;
    say("create", `access app ${a.name} (${a.type}) ${a.domain}`);
    if (apply) await api("POST", `/accounts/${A}/access/apps`, {
      name: a.name, type: a.type, domain: a.domain, session_duration: "24h", app_launcher_visible: true,
      policies: [{ id: cfg.access.owner_policy, precedence: 1 }, ...(pol ? [{ id: pol.id, precedence: 2 }] : [])],
    });
  }
}

console.log(changes ? `${changes} change(s) ${apply ? "applied" : "pending"}` : "no changes");
