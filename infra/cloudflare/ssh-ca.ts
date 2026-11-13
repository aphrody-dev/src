#!/usr/bin/env bun
// Short-lived SSH certificates for the browser-rendered terminals (Access apps of type ssh, cloudflare.toml [access]):
// one Access CA per app (created once, idempotent), its public key trusted by sshd on the app's host
// (TrustedUserCAKeys, drop-in /etc/ssh/sshd_config.d/40-access-ca.conf), and a Unix user named like the owner's email
// prefix (Access always sets the certificate principal to it; the browser terminal needs principal == Unix user).
// Additive only: existing keys and logins are untouched. The new config is validated on a copy of /etc/ssh
// (sshd -t -f) before it is installed, then again live (drop-in removed on failure) before the reload.
//   just cf-ssh-ca   (bun packages/env-kit/src/cli.ts secret exec CLOUDFLARE_API_TOKEN -- bun infra/cloudflare/ssh-ca.ts)
import { api, cfg } from "./lib";

const OWNER = "contact"; // contact@aphrody.com (policy mig-owner-only)
const HOST: Record<string, string> = { "fr2-ssh": "fr2", "prd-ssh": "prd" };
const A = cfg.account;
const apps = await api<any[]>("GET", `/accounts/${A}/access/apps?per_page=100`);
let bad = 0;
for (const [name, host] of Object.entries(HOST)) {
  const app = apps.find((x) => x.name === name);
  if (!app) { console.log(`${name}: no Access app`); bad++; continue; }
  const ca = await api<any>("GET", `/accounts/${A}/access/apps/${app.id}/ca`).catch(() => null)
    ?? await api<any>("POST", `/accounts/${A}/access/apps/${app.id}/ca`);
  const key = String(ca.public_key ?? "").trim();
  if (!/^(ssh|ecdsa)-[\w-]+ [A-Za-z0-9+/=]+/.test(key)) { console.log(`${name}: unexpected CA key`); bad++; continue; }
  // The whole script travels on stdin to `sudo bash -s` (nothing expanded by the login shell); the CA key is a heredoc.
  const script = [
    "set -eu",
    `id ${OWNER} >/dev/null 2>&1 || useradd -m -s /bin/bash ${OWNER}`,
    `g=$(getent group sudo >/dev/null && echo sudo || echo wheel); usermod -aG $g ${OWNER}`,
    // Fleet rule: agents and the owner run as full root (NOPASSWD), same as ubuntu/root today.
    `printf '%s ALL=(ALL) NOPASSWD:ALL\\n' ${OWNER} > /etc/sudoers.d/90-${OWNER}-access; chmod 440 /etc/sudoers.d/90-${OWNER}-access; visudo -cq`,
    // Principals: a certificate from this CA logs in only as the Unix user listed in /etc/ssh/access-principals/<user>,
    // and only the owner user has such a file (no root, no ubuntu through a certificate).
    `install -d -m 755 -o root -g root /etc/ssh/access-principals; printf '%s\\n' ${OWNER} > /etc/ssh/access-principals/${OWNER}; chmod 644 /etc/ssh/access-principals/${OWNER}`,
    "install -d -m 755 /etc/ssh/sshd_config.d",
    "grep -qE '^Include /etc/ssh/sshd_config.d/' /etc/ssh/sshd_config || { echo 'sshd_config has no Include of sshd_config.d: refusing'; exit 1; }",
    // Validate before installing: copy the live config tree to a temp dir, add the new files there, sshd -t -f on it.
    "w=$(mktemp -d); trap 'rm -rf $w' EXIT; cp -a /etc/ssh/. $w/",
    `cat > $w/ca-access.pub <<'CAKEY'\n${key}\nCAKEY`,
    "printf '# Cloudflare Access short-lived certificates (infra/cloudflare/ssh-ca.ts)\\nTrustedUserCAKeys /etc/ssh/ca-access.pub\\nAuthorizedPrincipalsFile /etc/ssh/access-principals/%%u\\n' > $w/sshd_config.d/40-access-ca.conf",
    "sed -i \"s#/etc/ssh/sshd_config.d/#$w/sshd_config.d/#\" $w/sshd_config",
    "sshd -t -f $w/sshd_config",
    "install -m 644 -o root -g root $w/ca-access.pub /etc/ssh/ca-access.pub",
    "install -m 644 -o root -g root $w/sshd_config.d/40-access-ca.conf /etc/ssh/sshd_config.d/40-access-ca.conf",
    "sshd -t || { rm -f /etc/ssh/sshd_config.d/40-access-ca.conf; echo 'live sshd -t failed: drop-in removed'; exit 1; }",
    "systemctl reload ssh 2>/dev/null || systemctl reload sshd",
    "sshd -T 2>/dev/null | grep -i -E '^(trustedusercakeys|authorizedprincipalsfile)'",
  ].join("\n") + "\n";
  const p = Bun.spawnSync(["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=60", host, "sudo bash -s"], { stdin: Buffer.from(script), timeout: 180_000 });
  const out = p.stdout.toString().trim();
  if (p.exitCode !== 0) { console.log(`${name} -> ${host}: FAILED ${p.stderr.toString().trim().slice(0, 200)}`); bad++; continue; }
  console.log(`${name} -> ${host}: CA ${key.split(" ")[0]} trusted (${out}), user ${OWNER}`);
}
process.exit(bad ? 1 : 0);
