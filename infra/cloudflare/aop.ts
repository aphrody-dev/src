#!/usr/bin/env bun
// Custom (per-hostname) Authenticated Origin Pulls for fr2 origins that Cloudflare proxies to fr2 (dbfr.aphrody.com):
// a private CA signs a client certificate that only this zone's edge presents; nginx on fr2 requires it (fleet exempt),
// so another Cloudflare account pointing a zone at 51.255.162.6 is refused. The client key goes only to Cloudflare
// (upload over the API), never to disk outside a private temp dir removed at exit; fr2 receives the CA certificate only.
//   bun packages/env-kit/src/cli.ts secret exec CLOUDFLARE_API_TOKEN -- bun infra/cloudflare/aop.ts [dbfr.aphrody.com ...]
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { api } from "./lib";

const hosts = Bun.argv.slice(2).length ? Bun.argv.slice(2) : ["dbfr.aphrody.com"];
const zoneOf = async (h: string) => {
  const parts = h.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    const z = await api<any[]>("GET", `/zones?name=${parts.slice(i).join(".")}`);
    if (z[0]) return z[0].id as string;
  }
  throw new Error(`no zone for ${h}`);
};
// openssl: PATH, else the one shipped with Git for Windows.
const OPENSSL = Bun.which("openssl") ?? (process.platform === "win32" ? "C:/Program Files/Git/usr/bin/openssl.exe" : "openssl");
const dir = mkdtempSync(join(tmpdir(), "aop-"));
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
  // fr2 gets the CA first (nginx verifies with it); requirement switched on only after the edge presents the cert.
  const put = Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=60", "fr2",
    "sudo install -d -m 755 /etc/nginx/aop && sudo tee /etc/nginx/aop/ca.pem >/dev/null && sudo chmod 644 /etc/nginx/aop/ca.pem && echo ok"], { stdin: Buffer.from(ca) });
  if (!put.stdout.toString().includes("ok")) throw new Error("CA not installed on fr2");
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
} finally {
  rmSync(dir, { recursive: true, force: true });
}
