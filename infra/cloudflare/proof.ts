#!/usr/bin/env bun
// Re-runs every Cloudflare edge check of docs/infra/FR2-CLOUDFLARE.md; exit 1 on any regression.
//   bun infra/cloudflare/proof.ts [--md]      (just cf-proof)
// Vantage points: this machine = "internet" (not in the fr2 allow-list), ssh fr2/prd for fleet-side checks.
import { connect } from "node:tls";
import { api, cfg } from "./lib.ts";

const FR2 = ["51.255.162.6", "2001:41d0:305:2100::a461"];
const md = Bun.argv.includes("--md");
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
const extra = ["www.aphrody.com", "aphrody.app", "www.aphrody.app", "api.aphrody.com", "cdn.aphrody.com", "downloads.aphrody.com", "creator.aphrody.com", "mig-test.aphrody.com"];
await Promise.all([...hosts, ...extra].map(async (h) => {
  const a = await doh(h);
  const onFr2 = a.some((ip) => FR2.includes(ip));
  const { status, h: hd } = await head(`https://${h}/`);
  const ray = hd.get("cf-ray") ?? "";
  const access = (hd.get("location") ?? "").includes("cloudflareaccess.com");
  const okStatus = h.startsWith("ssh-") ? access : status > 0 && (status < 500 || (status === 502 && expect502(h)));
  add("edge", h, !onFr2 && !!ray && okStatus, `A ${a.slice(0, 2).join(",")} | ${status} | server ${hd.get("server")} | cf-ray ${ray.slice(-3)} | cache ${hd.get("cf-cache-status") ?? "-"}${access ? " | Access 302" : ""}`);
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
for (const h of ["ssh-fr2.aphrody.com", "ssh-prd.aphrody.com", "mig-depot.aphrody.com", "mig-commons.aphrody.com"]) {
  const { status, h: hd } = await head(`https://${h}/`);
  add("access", h, status === 302 && (hd.get("location") ?? "").includes("cloudflareaccess.com"), `${status} -> ${(hd.get("location") ?? "").split("?")[0]}`);
}

// 5. origin lock-down: from here (internet) 80/443 of fr2 filtered, 22 open (break-glass); from prd (fleet) 443 open.
for (const p of [80, 443]) {
  const open = await tcpOpen(FR2[0], p);
  add("origin-closed", `fr2 ${FR2[0]}:${p} from internet`, !open, open ? "OPEN" : "filtered (timeout)");
}
add("origin-ssh", `fr2 ${FR2[0]}:22 from internet`, await tcpOpen(FR2[0], 22), "open (break-glass, keys only)");
const fleet = sh("prd", "curl -s -o /dev/null -w '%{http_code}' --resolve api.aphrody.com:443:51.255.162.6 https://api.aphrody.com/v1/health");
add("origin-fleet", "prd -> fr2:443 (fleet-health)", fleet === "200", `HTTP ${fleet}`);
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
  `sudo bash -c 'set -a; . /etc/aphrody/secrets.env; set +a; timeout 40 ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/root/.ssh/known_hosts_access -o ProxyCommand="cloudflared access ssh --hostname %h --service-token-id $CF_ACCESS_CLIENT_ID --service-token-secret $CF_ACCESS_CLIENT_SECRET" ${user}@${to} hostname 2>/dev/null'`);
for (const [from, to, user] of [["fr2", "ssh-prd.aphrody.com", "root"], ["prd", "ssh-fr2.aphrody.com", "ubuntu"]]) {
  const out = viaAccess(from, to, user);
  add("access-ssh", `${from} -> ${to} (service token)`, out.length > 0, out ? `hostname=${out}` : "FAILED");
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
