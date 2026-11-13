// Read-only inventory of the Cloudflare account (docs/replica/recon/cloudflare.md). GET requests only, no secret printed.
//   CF_AUTH=oauth bun infra/cloudflare/recon.ts <out-dir>     writes one JSON file per resource into <out-dir>
// EU-jurisdiction R2 buckets need the cf-r2-jurisdiction header: cf r2 buckets list --cf-r2-jurisdiction eu.
// Output dir defaults to $TEMP/cf-recon (raw API dumps stay out of the repo).
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { api, cfg } from "./lib";

const out = Bun.argv[2] ?? join(Bun.env.TEMP ?? Bun.env.TMPDIR ?? "/tmp", "cf-recon");
mkdirSync(out, { recursive: true });
const A = `/accounts/${cfg.account}`;
const save = async (name: string, path: string) => {
  try {
    const r = await api("GET", path);
    await Bun.write(join(out, `${name}.json`), JSON.stringify(r, null, 2));
    return r as any;
  } catch (e) {
    await Bun.write(join(out, `${name}.err.txt`), String(e));
    return null;
  }
};

const zones: any[] = (await save("zones", "/zones?per_page=50")) ?? [];
const scripts: any[] = (await save("workers-scripts", `${A}/workers/scripts`)) ?? [];
await save("workers-domains", `${A}/workers/domains`);
await save("workers-subdomain", `${A}/workers/subdomain`);
for (const s of scripts) {
  await save(`worker-${s.id}-schedules`, `${A}/workers/scripts/${s.id}/schedules`);
  await save(`worker-${s.id}-settings`, `${A}/workers/scripts/${s.id}/settings`);
}
const tunnels: any[] = (await save("tunnels", `${A}/cfd_tunnel?is_deleted=false`)) ?? [];
for (const t of tunnels) await save(`tunnel-${t.name}-config`, `${A}/cfd_tunnel/${t.id}/configurations`);
const buckets: any = (await save("r2-buckets", `${A}/r2/buckets?per_page=100`)) ?? { buckets: [] };
for (const b of buckets.buckets ?? []) {
  await save(`r2-${b.name}-custom`, `${A}/r2/buckets/${b.name}/domains/custom`);
  await save(`r2-${b.name}-managed`, `${A}/r2/buckets/${b.name}/domains/managed`);
  await save(`r2-${b.name}-cors`, `${A}/r2/buckets/${b.name}/cors`);
}
await save("kv", `${A}/storage/kv/namespaces?per_page=100`);
await save("d1", `${A}/d1/database`);
await save("do", `${A}/workers/durable_objects/namespaces`);
await save("queues", `${A}/queues`);
await save("hyperdrive", `${A}/hyperdrive/configs`);
await save("vectorize", `${A}/vectorize/v2/indexes`);
await save("workflows", `${A}/workflows`);
await save("ai-gateway", `${A}/ai-gateway/gateways`);
await save("pages", `${A}/pages/projects`);
await save("access-apps", `${A}/access/apps`);
await save("access-service-tokens", `${A}/access/service_tokens`);
await save("email-routing-addresses", `${A}/email/routing/addresses`);
await save("turnstile", `${A}/challenges/widgets`);
await save("secrets-stores", `${A}/secrets_store/stores`);
await save("images-stats", `${A}/images/v1/stats`);
await save("stream", `${A}/stream`);

const phases = [
  "http_request_firewall_custom", "http_ratelimit", "http_request_firewall_managed", "http_request_cache_settings",
  "http_request_dynamic_redirect", "http_request_redirect", "http_request_transform", "http_request_late_transform",
  "http_response_headers_transform", "http_request_origin", "http_config_settings", "http_response_compression",
];
for (const z of zones) {
  const Z = `/zones/${z.id}`;
  await save(`zone-${z.name}-routes`, `${Z}/workers/routes`);
  await save(`zone-${z.name}-settings`, `${Z}/settings`);
  await save(`zone-${z.name}-pagerules`, `${Z}/pagerules`);
  await save(`zone-${z.name}-rulesets`, `${Z}/rulesets`);
  await save(`zone-${z.name}-email-routing`, `${Z}/email/routing`);
  await save(`zone-${z.name}-email-rules`, `${Z}/email/routing/rules`);
  await save(`zone-${z.name}-certpacks`, `${Z}/ssl/certificate_packs`);
  await save(`zone-${z.name}-dnssec`, `${Z}/dnssec`);
  for (const p of phases) await save(`zone-${z.name}-phase-${p}`, `${Z}/rulesets/phases/${p}/entrypoint`);
}
console.log(`recon written to ${out}`);
