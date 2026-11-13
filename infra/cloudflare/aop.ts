#!/usr/bin/env bun
// Custom (per-hostname) Authenticated Origin Pulls for fr2 origins that Cloudflare proxies to fr2 (dbfr.aphrody.com):
// a private CA signs a client certificate that only this zone's edge presents; nginx on fr2 requires it (fleet exempt),
// so another Cloudflare account pointing a zone at 51.255.162.6 is refused. The client key goes only to Cloudflare
// (upload over the API), never to disk outside a private temp dir removed at exit; the CA key goes to the vault
// (AOP_CA_KEY); fr2 receives the CA certificate only.
//   just cf-aop [host]   (rotate: new CA + client certificate, bundle on fr2)   then   just cf-aop-prune
// Auth: CF_AOP_TOKEN from the vault (token aop-rotate), no human login.
import { chmodSync, mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// Dedicated token aop-rotate (SSL and Certificates Write + Zone Read on aphrody.com only, vault CF_AOP_TOKEN): no OAuth.
// Set before lib.ts is loaded (dynamic import), so its token resolution can only ever see this token.
if (Bun.env.CF_AOP_TOKEN) process.env.CLOUDFLARE_API_TOKEN = Bun.env.CF_AOP_TOKEN;
const { api } = await import("./lib");
const prune = Bun.argv.includes("--prune");
const hosts = Bun.argv.slice(2).filter((x) => !x.startsWith("--")).length ? Bun.argv.slice(2).filter((x) => !x.startsWith("--")) : ["dbfr.aphrody.com"];
const zoneOf = async (h: string) => {
  const parts = h.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const z = await api<any[]>("GET", `/zones?name=${parts.slice(i).join(".")}`);
    if (z[0]) return z[0].id as string;
  }
  throw new Error(`no zone for ${h}`);
};
if (prune) {
  // Keep only the newest CA of the bundle if 25 consecutive public pulls succeed with it alone, else restore the bundle.
  const sh = (c: string) => Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=60", "fr2", c], { timeout: 120_000 });
  // Not before 15 min after the switch (edge convergence measured at about 3 min, PoP by PoP).
  const age = Number(sh("echo $(( $(date +%s) - $(sudo cat /etc/nginx/aop/rotated_at 2>/dev/null || echo 0) ))").stdout.toString().trim());
  if (!(age >= 900)) { console.log(`prune refused: rotation ${age}s ago (< 900 s)`); process.exit(1); }
  const r = sh("f=/etc/nginx/aop/ca.pem; n=$(sudo grep -c 'BEGIN CERT' $f); [ $n -gt 1 ] || { echo single; exit 0; }; sudo cp -a $f $f.bundle; sudo awk -v n=$n '/BEGIN CERT/{i++} i==n' $f.bundle | sudo tee $f >/dev/null; sudo nginx -t -q && sudo systemctl reload nginx && echo pruned");
  const out = r.stdout.toString().trim();
  if (out !== "pruned") { console.log(out || r.stderr.toString().slice(0, 200)); process.exit(out === "single" ? 0 : 1); }
  let ok = 0;
  for (let i = 0; i < 60 && ok < 25; i++) {
    const st = await fetch(`https://${hosts[0]}/`, { redirect: "manual" }).then((x) => x.status).catch(() => 0);
    ok = st === 200 ? ok + 1 : 0;
    await Bun.sleep(2000);
  }
  if (ok < 25) {
    const back = sh("f=/etc/nginx/aop/ca.pem; sudo mv $f.bundle $f && sudo nginx -t -q && sudo systemctl reload nginx");
    console.log(back.exitCode === 0 ? "edge not converged: bundle restored" : "edge not converged and bundle restore FAILED: check /etc/nginx/aop on fr2");
    process.exit(1);
  }
  sh("sudo rm -f /etc/nginx/aop/ca.pem.bundle");
  // Certificates still bound to any of the hosts are kept; only unbound ones are deleted.
  const byZone = new Map<string, Set<string>>();
  for (const h of hosts) {
    const z = await zoneOf(h);
    const cur = (await api<any>("GET", `/zones/${z}/origin_tls_client_auth/hostnames/${h}`)).cert_id;
    byZone.set(z, (byZone.get(z) ?? new Set()).add(cur));
  }
  for (const [z, keep] of byZone)
    for (const old of await api<any[]>("GET", `/zones/${z}/origin_tls_client_auth/hostnames/certificates`))
      if (!keep.has(old.id)) await api("DELETE", `/zones/${z}/origin_tls_client_auth/hostnames/certificates/${old.id}`);
  console.log("pruned: newest CA only, 25 consecutive verified pulls, old edge certificates deleted");
  process.exit(0);
}
// openssl: PATH, else the one shipped with Git for Windows.
const OPENSSL = Bun.which("openssl") ?? (process.platform === "win32" ? "C:/Program Files/Git/usr/bin/openssl.exe" : "openssl");
const dir = mkdtempSync(join(tmpdir(), "aop-"));
chmodSync(dir, 0o700);
const ssl = (...a: string[]) => {
  const p = Bun.spawnSync([OPENSSL, ...a], { cwd: dir, stdout: "ignore", stderr: "pipe" });
  if (p.exitCode !== 0) throw new Error(`openssl ${a[0]}: ${p.stderr.toString().slice(0, 200)}`);
};
try {
  ssl("req", "-x509", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:P-256", "-nodes", "-days", "3650", "-subj", "/CN=aphrody fr2 AOP CA", "-keyout", "ca.key", "-out", "ca.pem");
  ssl("req", "-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:P-256", "-nodes", "-subj", "/CN=cloudflare-edge.aphrody", "-keyout", "client.key", "-out", "client.csr");
  Bun.write(join(dir, "ext.cnf"), "extendedKeyUsage=clientAuth\n");
  ssl("x509", "-req", "-in", "client.csr", "-CA", "ca.pem", "-CAkey", "ca.key", "-CAcreateserial", "-days", "825", "-extfile", "ext.cnf", "-out", "client.pem");
  const cert = readFileSync(join(dir, "client.pem"), "utf8"), key = readFileSync(join(dir, "client.key"), "utf8");
  const ca = readFileSync(join(dir, "ca.pem"), "utf8");
  // Order: CA on fr2, certificate active at the edge, then AOP enabled for the hostname; the nginx requirement
// (conf.d/aop.conf) is wired separately and checked by just cf-proof (public 200 = edge presents the certificate).
  // The CA key is kept in the vault (AOP_CA_KEY, DPAPI) for audit and emergency re-signing by hand; each rotation
  // creates a new CA, so the stored key is the one of the CA currently trusted by fr2.
  const vault = Bun.spawnSync(["bun", "run", join(import.meta.dir, "../../packages/env-kit/src/cli.ts"), "secret", "set", "AOP_CA_KEY"], { stdin: Buffer.from(readFileSync(join(dir, "ca.key"))) });
  if (vault.exitCode !== 0) throw new Error("AOP CA key not stored in the vault");
  const put = Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=60", "fr2",
    "sudo install -d -m 755 -o root -g root /etc/nginx/aop && t=$(sudo mktemp /etc/nginx/aop/.ca.XXXXXX) && { sudo cat /etc/nginx/aop/ca.pem 2>/dev/null; cat; } | sudo tee $t >/dev/null && sudo install -m 644 -o root -g root $t /etc/nginx/aop/ca.pem && sudo rm -f $t && date +%s | sudo tee /etc/nginx/aop/rotated_at >/dev/null && sudo nginx -t -q && sudo systemctl reload nginx"], { stdin: Buffer.from(ca) });
  if (put.exitCode !== 0) throw new Error("CA not installed on fr2");
  // During the switch nginx trusts the old and the new CA (bundle); once the edge uses the new certificate, the bundle
  // is replaced by the new CA alone and the previous edge certificates are deleted.
  for (const h of hosts) {
    const z = await zoneOf(h);
    const up = await api<any>("POST", `/zones/${z}/origin_tls_client_auth/hostnames/certificates`, { certificate: cert, private_key: key });
    for (let i = 0; i < 30; i++) {
      const s = await api<any>("GET", `/zones/${z}/origin_tls_client_auth/hostnames/certificates/${up.id}`);
      if (s.status === "active") break;
      await Bun.sleep(5000);
    }
    await api("PUT", `/zones/${z}/origin_tls_client_auth/hostnames`, { config: [{ hostname: h, cert_id: up.id, enabled: true }] });
    console.log(`${h}: per-hostname AOP certificate ${up.id} enabled (expires ${up.expires_on ?? "825 d"})`);
  }
  // Not pruned here: the edge needs minutes to present the new certificate everywhere (measured 2026-11-13: about 3 min,
  // PoPs flapping 400/200 meanwhile). nginx trusts the old and the new CA (bundle) until just cf-aop-prune
  // (bun infra/cloudflare/aop.ts --prune) sees 25 consecutive verified pulls with the new CA alone.
  console.log("bundle kept (old + new CA): run just cf-aop-prune once the edge has converged");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
