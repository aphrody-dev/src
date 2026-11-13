# Sovereign `contact@aphrody.com` Mailing Infrastructure (`C:\src\infra\mail`)

Production-ready sovereign mail infrastructure for `aphrody.com` powered by **Stalwart Mail Server** (`stalwartlabs/mail-server:latest`) — a 100% pure-Rust all-in-one JMAP, IMAP4rev2, SMTP, ManageSieve, and built-in SPF/DKIM/DMARC/ARC/MTA-STS/TLS-RPT/ACME engine with zero Java, PHP, or Python runtime bloat.

## 1. Canonical Domain Identities & Routing (`aphrody.com`)

| Address | Role | Delivery / Alias Target |
| :--- | :--- | :--- |
| `contact@aphrody.com` | Master organization identity across Google Workspace, Cloudflare, GitHub (`aphrody-dev`), GitLab (`aphrody-dev` & `git.aphrody.com`), OVH (`fr1`, `fr2`), Hostinger (`usa`), Vercel, and Supabase. | Primary mailbox + Google Workspace split-delivery (`workspace-copy@aphrody.com` -> `aspmx.l.google.com`). |
| `noreply@aphrody.com` | Outbound transactional sender (Supabase Auth, GitLab CI notifications, `aphrody.com` transactional JMAP/SMTP). | Outbound DKIM-signed (`s1-ed25519` + `s2-rsa`); inbound auto-rejected or routed to postmaster sink. |
| `security@aphrody.com` | Security disclosure (`/.well-known/security.txt`), Let's Encrypt ACME expiry notices, GitHub/Cloudflare security alerts. | Rewritten cleanly to `contact@aphrody.com`. |
| `ai@aphrody.com` | Autonomous NHITL notifications (`ai-os`, `triad`, `pi-opencode`) and bridge to `<ai-google>`. | Rewritten cleanly to `contact@aphrody.com` (with Sieve forward option to `<ai-google>`). |
| `dmarc@aphrody.com` | DMARC aggregate/forensic (`rua`/`ruf`) + RFC 8460 SMTP TLS-RPT (`_smtp._tls`) report sink. | Dedicated report mailbox in Stalwart RocksDB store. |

## 2. OVH `fr1` / `fr2` Reverse PTR & Network Prerequisites

Outbound deliverability to Gmail, Outlook, and corporate MX relays requires matching forward (`A`) and reverse (`PTR`) DNS records on OVHcloud:

1. **OVH `fr1` (`51.77.147.152`)**:
   - Forward DNS (Cloudflare, unproxied DNS-only): `mail.aphrody.com. IN A 51.77.147.152`
   - OVH Manager / API Reverse PTR: Set reverse DNS of `51.77.147.152` (and its IPv6 `/128` host address) to `mail.aphrody.com.`
   - Verify outbound TCP port `25` is unblocked in OVHcloud Anti-Spam / Edge Firewall.
2. **OVH `fr2` (`51.255.162.6`)**:
   - Forward DNS (Cloudflare, unproxied DNS-only): `mx2.aphrody.com. IN A 51.255.162.6`
   - OVH Manager / API Reverse PTR: Set reverse DNS of `51.255.162.6` to `mx2.aphrody.com.`

## 3. Dual DKIM Key Generation & Stalwart Deployment

On `fr1` (`51.77.147.152`):

```bash
# 1. Generate Ed25519 primary key + RSA-2048 compatibility key inside restricted volume:
mkdir -p /opt/aphrody-mail/dkim
chmod 700 /opt/aphrody-mail/dkim

openssl genpkey -algorithm ed25519 -out /opt/aphrody-mail/dkim/aphrody.ed25519.key
openssl pkey -in /opt/aphrody-mail/dkim/aphrody.ed25519.key -pubout -outform DER | tail -c 32 | base64

openssl genrsa -out /opt/aphrody-mail/dkim/aphrody.rsa2048.key 2048
openssl rsa -in /opt/aphrody-mail/dkim/aphrody.rsa2048.key -pubout -outform PEM | grep -v '^--' | tr -d '\n'

# 2. Launch Stalwart Mail Server:
docker compose -f /opt/aphrody-mail/docker-compose.mail.yml up -d
```

## 4. Cloudflare DNS & MTA-STS Provisioning

Generate deterministic BIND `.zone` and JSON records (or push live via Cloudflare REST API v4 when `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` are set):

```powershell
# Dry-run export (writes cloudflare-mail-records.json and cloudflare-mail-records.zone):
bun run C:\src\infra\mesh-vn\src\cloudflare-mail-dns.ts

# Live Cloudflare DNS upsert via env-kit:
env-kit exec -- bun run C:\src\infra\mesh-vn\src\cloudflare-mail-dns.ts --apply
```

Serve `C:\src\infra\mail\mta-sts.txt` at `https://mta-sts.aphrody.com/.well-known/mta-sts.txt` with `Content-Type: text/plain; charset=utf-8` (enforces TLS 1.2/1.3 MX transport across `mail.aphrody.com` and `*.google.com`).

BIMI (`default._bimi.aphrody.com`) references `https://aphrody.com/assets/brand/aphrody-monogram-bimi.svg`.

## 5. Google Workspace Split-Delivery Compatibility (`contact@aphrody.com`)

To allow `contact@aphrody.com` to operate seamlessly across both Google Workspace (Calendar, Meet, Docs, Google Cloud Org Identity) and Sovereign Stalwart JMAP/IMAP:

1. **Google Workspace Admin Console (`admin.google.com` -> Apps -> Google Workspace -> Gmail -> Routing)**:
   - Add `mail.aphrody.com` (`51.77.147.152`) to **Inbound Gateway** IPs so forwarded messages preserve original SPF alignment.
   - Configure **Split Delivery** rule routing non-Workspace mailboxes (`noreply@`, `dmarc@`, `ai@`, programmatic JMAP mailboxes) to `mail.aphrody.com:25` over mandatory TLS, or keep `mail.aphrody.com` as priority `10` MX forwarding a copy of `contact@aphrody.com` (`workspace-copy@aphrody.com`) via the `google-workspace-split` route in `config/stalwart.toml`.
2. **Unified SPF**:
   - `v=spf1 mx a:mail.aphrody.com ip4:51.77.147.152 ip4:51.255.162.6 include:_spf.google.com ~all` authorizes both OVH Stalwart nodes and Google Workspace outbound relays.

## 6. Transactional & Org Provider SMTP / JMAP Wiring (`contact@aphrody.com`)

Use these exact coordinates across external org platforms:

| Parameter | Value |
| :--- | :--- |
| **SMTP Host** | `mail.aphrody.com` |
| **SMTP Port (Implicit TLS)** | `465` (recommended) or `587` (STARTTLS) |
| **SMTP Username** | `contact@aphrody.com` (or dedicated app credential `noreply@aphrody.com`) |
| **SMTP Password** | Stored exclusively in `C:\src\.env` (`SMTP_PASSWORD`) |
| **JMAP Endpoint** | `https://mail.aphrody.com/jmap` (`Authorization: Bearer $JMAP_API_TOKEN`) |

- **Supabase (`Authentication -> Emails -> SMTP Settings`)**: Enable Custom SMTP -> Sender email `noreply@aphrody.com`, Sender name `Aphrody`, Host `mail.aphrody.com`, Port `465`, Username `noreply@aphrody.com`, Password `$SMTP_PASSWORD`.
- **GitLab (`git.aphrody.com` `gitlab.rb`)**: `gitlab_rails['smtp_address'] = "mail.aphrody.com"`, `gitlab_rails['smtp_port'] = 465`, `gitlab_rails['smtp_tls'] = true`, `gitlab_rails['gitlab_email_from'] = 'noreply@aphrody.com'`, `gitlab_rails['gitlab_email_reply_to'] = 'contact@aphrody.com'`.
- **Vercel / GitHub / Cloudflare / OVH / Hostinger**: Primary organization owner email set to `contact@aphrody.com` with hardware Passkey / TOTP 2FA enabled.
