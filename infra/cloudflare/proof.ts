#!/usr/bin/env bun
// Re-runs every Cloudflare edge check of docs/infra/FR2-CLOUDFLARE.md; exit 1 on any regression.
//   bun infra/cloudflare/proof.ts [--md] [--record]   (just cf-proof)
// Expected HTTP status per hostname is frozen in expected-status.json (--record rewrites it from a reviewed run):
// any drift (a 200 becoming 502, a 302 Access becoming 200) is a failure.
// Vantage points: this machine = "internet" (not in the fr2 allow-list), ssh fr2/prd for fleet-side checks.
import { connect } from "node:tls";
import { join } from "node:path";
import { api, cfg } from "./lib.ts";

const FR2 = ["51.255.162.6", "2001:41d0:305:2100::a461"];
const md = Bun.argv.includes("--md");
const record = Bun.argv.includes("--record");
const expFile = Bun.file(join(import.meta.dir, "expected-status.json"));
// expected-status.json: host -> status, or { status, why } when the status is a known non-service (502 parity, Worker 404).
const prior: Record<string, number | { status: number; why: string }> = (await expFile.exists()) ? await expFile.json() : {};
const expected: Record<string, number> = Object.fromEntries(Object.entries(prior).map(([k, v]) => [k, typeof v === "number" ? v : v.status]));
const accept = new Set(Bun.argv.flatMap((a, i) => (Bun.argv[i - 1] === "--accept" ? a.split(",") : [])));
const seen: Record<string, number> = {};
type Row = { check: string; target: string; ok: boolean; evidence: string };
const rows: Row[] = [];
const add = (check: string, target: string, ok: boolean, evidence: string) => rows.push({ check, target, ok, evidence });

async function doh(name: string, type = "A"): Promise<string[]> {
  const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, { headers: { accept: "application/dns-json" } });
  return (((await r.json()) as any).Answer ?? []).filter((a: any) => a.type === (type === "A" ? 1 : 28)).map((a: any) => a.data);
}
function issuer(host: string): Promise<string> {
  return new Promise((res) => {
    const s = connect({ host, port: 443, servername: host, timeout: 8000 }, () => {
      const c = s.getPeerCertificate();
      res(`${c.issuer?.O ?? "?"} ${c.issuer?.CN ?? ""}`.trim());
      s.end();
    });
    s.on("error", (e) => res(`error ${e.message}`));
    s.on("timeout", () => (s.destroy(), res("timeout")));
  });
}
async function head(url: string, init: RequestInit = {}) {
  const r = await fetch(url, { redirect: "manual", ...init, signal: AbortSignal.timeout(15000) }).catch((e) => ({ status: 0, headers: new Headers(), err: String(e) }) as any);
  return { status: r.status as number, h: r.headers as Headers };
}
function tcpOpen(ip: string, port: number): Promise<boolean> {
  return new Promise((res) => {
    Bun.connect({ hostname: ip, port, socket: { open: (s) => (s.end(), res(true)), data() {}, error: () => res(false), connectError: () => res(false) } }).catch(() => res(false));
    setTimeout(() => res(false), 5000);
  });
}
const sh = (host: string, cmd: string) => {
  const p = Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=15", host, cmd], { timeout: 60000 });
  return p.stdout.toString().trim();
};

// 1. every managed hostname: DNS at Cloudflare (never fr2), HTTP through the edge, cf-ray, expected status.
//    502 is accepted only where the prd backend is known absent (aphrody-app :3010) or a Worker reports it (webos).
const expect502 = (h: string) => h.endsWith(".aphrody.app") || /^(fig|play|docs|photos|sound|design|art|calendar|sheets|slides|maps|pdf|cad|os)\.aphrody\.com$/.test(h);
const hosts = Object.values(cfg.dns).flatMap((z) => Object.keys(z));
const extra = ["mig-depot.aphrody.com", "mig-commons.aphrody.com", "www.aphrody.com", "aphrody.app", "www.aphrody.app", "api.aphrody.com", "cdn.aphrody.com", "downloads.aphrody.com", "creator.aphrody.com", "mig-test.aphrody.com"];
await Promise.all([...hosts, ...extra].map(async (h) => {
  const a = await doh(h);
  const onFr2 = a.some((ip) => FR2.includes(ip));
  const { status, h: hd } = await head(`https://${h}/`);
  const ray = hd.get("cf-ray") ?? "";
  const access = (hd.get("location") ?? "").includes("cloudflareaccess.com");
  seen[h] = status;
  const frozen = expected[h];
  const okStatus = frozen !== undefined ? status === frozen : h.startsWith("ssh-") ? access : status > 0 && (status < 500 || (status === 502 && expect502(h)));
  add("edge", h, !onFr2 && !!ray && okStatus, `A ${a.slice(0, 2).join(",")} | ${status} | server ${hd.get("server")} | cf-ray ${ray.slice(-3)} | cache ${hd.get("cf-cache-status") ?? "-"}${access ? " | Access 302" : ""}${frozen !== undefined ? ` | expected ${frozen}` : " | not frozen"}`);
}));

// 2. TLS issuer at the edge (Cloudflare-managed universal certificate).
for (const h of ["aphrody.com", "admin.aphrody.com", "api.aphrody.app", "ssh-prd.aphrody.com", "dbfr.aphrody.com"]) {
  const i = await issuer(h);
  add("tls", h, !i.startsWith("error") && i !== "timeout", i);
}

// 3. tunnels: healthy, connectors on the expected host.
for (const [name, t] of Object.entries(cfg.tunnels)) {
  const tun = await api<any>("GET", `/accounts/${cfg.account}/cfd_tunnel/${t.id}`);
  const conns = await api<any[]>("GET", `/accounts/${cfg.account}/cfd_tunnel/${t.id}/connections`);
  const n = conns.reduce((s, c) => s + (c.conns?.length ?? 0), 0);
  const colos = [...new Set(conns.flatMap((c) => c.conns.map((x: any) => x.colo_name)))].join(",");
  add("tunnel", `${name} (${t.host})`, tun.status === "healthy" && n >= 2, `${tun.status}, ${n} conns, ${colos}, cloudflared ${conns[0]?.version ?? "?"}`);
}

// 4. Access: protected apps redirect to the Access login.
for (const h of [...new Set([...cfg.access.apps.map((a) => a.domain), "mig-depot.aphrody.com", "mig-commons.aphrody.com"])]) {
  const { status, h: hd } = await head(`https://${h}/`);
  add("access", h, status === 302 && (hd.get("location") ?? "").includes("cloudflareaccess.com"), `${status} -> ${(hd.get("location") ?? "").split("?")[0]}`);
}

// 4b. /api on the apex: the Worker owns aphrody.com/*; /api must be answered at the edge with its frozen status.
{
  const u = "https://aphrody.com/api/health";
  const { status, h: hd } = await head(u);
  seen[u] = status;
  const frozen = expected[u];
  add("api-route", u, hd.get("server") === "cloudflare" && (frozen === undefined ? status > 0 : status === frozen), `${status} server ${hd.get("server")} cf-ray ${(hd.get("cf-ray") ?? "").slice(-3)}${frozen !== undefined ? ` | expected ${frozen}` : " | not frozen"}`);
}

// 5. origin lock-down: from here (internet) 80/443 of fr2 filtered, 22 open (break-glass); from prd (fleet) 443 open.
for (const p of [80, 443]) {
  const open = await tcpOpen(FR2[0], p);
  add("origin-closed", `fr2 ${FR2[0]}:${p} from internet`, !open, open ? "OPEN" : "filtered (timeout)");
}
add("origin-ssh", `fr2 ${FR2[0]}:22 from internet`, await tcpOpen(FR2[0], 22), "open (break-glass, keys only)");
// IPv6: no non-fleet v6 vantage here; check the live ruleset instead (family inet, tcp+udp 80/443, final drop).
const rs = sh("fr2", "sudo nft list table inet fr2_edge");
add("origin-v6", "fr2 nft inet fr2_edge (v4+v6, tcp+udp)", /l4proto \{ tcp, udp \} th dport \{ 80, 443 \} jump web/.test(rs) && /ip6 saddr @cf6 accept/.test(rs) && /counter packets \d+ bytes \d+ drop/.test(rs), (rs.match(/counter packets \d+/)?.[0] ?? "ruleset missing") + " dropped");
const fleet = sh("prd", "curl -s -o /dev/null -w '%{http_code}' --resolve api.aphrody.com:443:51.255.162.6 https://api.aphrody.com/v1/health");
add("origin-fleet", "prd -> fr2:443 (fleet-health)", fleet === "200", `HTTP ${fleet}`);
// Custom AOP on dbfr: Cloudflare edge IPs are not fleet, so a public 200 means the edge presented the zone certificate;
// the nginx wiring (CA + optional verify + deny) and the fleet-only snippet of the Worker-served vhosts are checked live.
{
  const pub = await head("https://dbfr.aphrody.com/");
  const conf = sh("fr2", "sudo grep -c -e aop_deny -e ssl_client_certificate /etc/nginx/conf.d/fleet-api.conf; sudo grep -l fleet-only.inc /etc/nginx/sites/*.conf | wc -l");
  const [wired, fleetOnly] = conf.split(/\s+/).map(Number);
  add("origin-aop", "dbfr.aphrody.com (per-hostname AOP)", pub.status === 200 && wired >= 2, `public ${pub.status} via edge cert, nginx directives ${wired}`);
  add("origin-aop", "api/cdn/creator/downloads (fleet-only vhosts)", fleetOnly === 4, `${fleetOnly}/4 vhosts include fleet-only.inc`);
}
const wg = sh("fr2", "sudo wg show wg1 latest-handshakes | awk '{print $2}' | sort -n | tail -1");
const age = Math.round(Date.now() / 1000 - Number(wg));
add("wireguard", "fr2 wg1 (hub forwarding kept)", age < 300, `latest handshake ${age}s ago, ip_forward ${sh("fr2", "sysctl -n net.ipv4.ip_forward")}`);

// 6. WAF: probe paths blocked at the edge.
for (const u of ["https://aphrody.com/.env", "https://aphrody.app/wp-login.php"]) {
  const { status, h: hd } = await head(u);
  add("waf", u, status === 403 && hd.get("server") === "cloudflare", `${status} cf-ray ${(hd.get("cf-ray") ?? "").slice(-3)}`);
}

// 7. cache: second request is a HIT.
await head("https://aphrody.com/");
const c2 = await head("https://aphrody.com/");
add("cache", "https://aphrody.com/ (2nd request)", c2.h.get("cf-cache-status") === "HIT", `cf-cache-status ${c2.h.get("cf-cache-status")}`);

// 8. agents: ssh through Access with the service token (no WARP), both directions.
const viaAccess = (from: string, to: string, user: string) => sh(from,
  `sudo bash -c 'set -a; . /etc/aphrody/secrets.env; set +a; export TUNNEL_SERVICE_TOKEN_ID=$CF_ACCESS_CLIENT_ID TUNNEL_SERVICE_TOKEN_SECRET=$CF_ACCESS_CLIENT_SECRET; timeout 40 ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/root/.ssh/known_hosts_access -o ProxyCommand="cloudflared access ssh --hostname %h" ${user}@${to} hostname 2>/dev/null'`);
// One token per host and per direction: the reverse use of each token must be refused.
for (const [from, to, user] of [["fr2", "ssh-prd.aphrody.com", "root"], ["prd", "ssh-fr2.aphrody.com", "ubuntu"]]) {
  const out = viaAccess(from, to, user);
  add("access-ssh", `${from} -> ${to} (service token)`, out.length > 0, out ? `hostname=${out}` : "FAILED");
}
// A 403 alone could be a dead token: each refusal is paired with the same host's successful access-ssh above.
const viaOk = new Map(rows.filter((r) => r.check === "access-ssh").map((r) => [r.target.split(" ")[0], r.ok]));
for (const [from, to] of [["fr2", "ssh-fr2.aphrody.com"], ["prd", "ssh-prd.aphrody.com"]]) {
  const code = sh(from, `sudo bash -c 'set -a; . /etc/aphrody/secrets.env; set +a; printf "CF-Access-Client-Id: %s\nCF-Access-Client-Secret: %s\n" "$CF_ACCESS_CLIENT_ID" "$CF_ACCESS_CLIENT_SECRET" | curl -H @- -s -o /dev/null -w "%{http_code}" https://${to}/'`);
  add("access-scope", `${from} token -> ${to} (must be refused)`, code === "403" && viaOk.get(from) === true, `HTTP ${code} (token presented, refused; same token accepted on its own app: ${viaOk.get(from) ? "yes" : "NO"})`);
}
for (const from of ["fr2", "prd"]) {
  const code = sh(from, `sudo bash -c 'set -a; . /etc/aphrody/secrets.env; set +a; printf "CF-Access-Client-Id: %s\nCF-Access-Client-Secret: %s\n" "$CF_ACCESS_CLIENT_ID" "$CF_ACCESS_CLIENT_SECRET" | curl -H @- -s -o /dev/null -w "%{http_code}" https://admin.aphrody.com/'`);
  add("access-scope", `${from} token -> admin.aphrody.com (owner only)`, code === "403" && viaOk.get(from) === true, `HTTP ${code} (token presented, refused; same token accepted on its own app: ${viaOk.get(from) ? "yes" : "NO"})`);
}

// 9. credentials: the shared token is gone, every fleet token has more than 30 days left (alert before expiry).
{
  const st = await api<any[]>("GET", `/accounts/${cfg.account}/access/service_tokens`);
  for (const name of cfg.access.retire_tokens ?? []) add("credential", `Access token ${name} retired`, !st.some((t) => t.name === name), st.some((t) => t.name === name) ? "STILL PRESENT" : "absent");
  const soon = (d?: string) => !!d && Date.parse(d) - Date.now() < 30 * 86400_000;
  for (const s2 of cfg.access.service_tokens) {
    const t = st.find((x) => x.name === s2.name);
    add("credential", `Access token ${s2.name}`, !!t && !soon(t.expires_at), t ? `expires ${t.expires_at}` : "MISSING");
  }
  const zid = (await api<any[]>("GET", "/zones?name=aphrody.com"))[0]?.id;
  // Read with CF_PROOF_TOKEN (proof-ssl-read: SSL and Certificates Read on aphrody.com only): the account token has no SSL scope.
  const aop = zid && Bun.env.CF_PROOF_TOKEN ? await fetch(`https://api.cloudflare.com/client/v4/zones/${zid}/origin_tls_client_auth/hostnames/certificates`, { headers: { authorization: `Bearer ${Bun.env.CF_PROOF_TOKEN}` } }).then(async (r) => ((await r.json()) as any).result ?? null).catch(() => null) : null;
  const bound = zid && Bun.env.CF_PROOF_TOKEN ? await fetch(`https://api.cloudflare.com/client/v4/zones/${zid}/origin_tls_client_auth/hostnames/dbfr.aphrody.com`, { headers: { authorization: `Bearer ${Bun.env.CF_PROOF_TOKEN}` } }).then(async (r) => ((await r.json()) as any).result?.cert_id).catch(() => undefined) : undefined;
  const cert = (aop ?? []).find((x: any) => x.id === bound);
  add("credential", "AOP client certificate bound to dbfr", !!cert && cert.status === "active" && !soon(cert.expires_on), !Bun.env.CF_PROOF_TOKEN ? "CF_PROOF_TOKEN absent" : aop === null ? "not readable" : cert ? `${cert.status}, expires ${cert.expires_on}` : "NONE bound");
  const at = await api<any[]>("GET", `/accounts/${cfg.account}/tokens?per_page=100`);
  for (const h of ["fr2", "prd"]) {
    const t = at.find((x) => x.name === `fleet-${h}-dns`);
    add("credential", `API token fleet-${h}-dns`, !!t && t.status === "active" && !soon(t.expires_on), t ? `${t.status}, expires ${t.expires_on}` : "MISSING");
  }
}

if (record) {
  const other = rows.filter((r) => !r.ok && r.check !== "edge" && r.check !== "api-route");
  if (other.length) {
    console.error(`--record refused: ${other.length} non-status check(s) failing (${other.map((r) => r.check + " " + r.target).join("; ")})`);
    process.exit(1);
  }
  const drift = Object.entries(seen).filter(([h, st]) => expected[h] !== undefined && expected[h] !== st && !accept.has(h));
  if (drift.length) {
    console.error(`--record refused: frozen status changed for ${drift.map(([h, st]) => `${h} ${expected[h]} -> ${st}`).join(", ")} (re-run with --accept <host,...> after review)`);
    process.exit(1);
  }
  await Bun.write(expFile, JSON.stringify(Object.fromEntries(Object.entries(seen).sort().map(([h, st]) => {
    const old = prior[h];
    return [h, typeof old === "object" && old.status === st ? old : st];
  })), null, 2) + "\n");
  console.error(`recorded ${Object.keys(seen).length} expected statuses: review \`git diff infra/cloudflare/expected-status.json\` before committing`);
}
rows.sort((a, b) => a.check.localeCompare(b.check) || a.target.localeCompare(b.target));
const bad = rows.filter((r) => !r.ok);
if (md) {
  console.log(`Run ${new Date().toISOString()} from ${(await (await fetch("https://1.1.1.1/cdn-cgi/trace")).text()).match(/ip=(.*)/)?.[1]?.replace(/\d+$/, "x")}\n`);
  console.log("| Check | Target | OK | Evidence |\n|---|---|---|---|");
  for (const r of rows) console.log(`| ${r.check} | ${r.target} | ${r.ok ? "yes" : "**NO**"} | ${r.evidence.replaceAll("|", "/")} |`);
} else for (const r of rows) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.check.padEnd(13)} ${r.target.padEnd(44)} ${r.evidence}`);
console.log(`\n${rows.length - bad.length}/${rows.length} checks ok`);
process.exit(bad.length ? 1 : 0);
