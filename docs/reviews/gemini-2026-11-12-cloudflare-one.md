Gemini said
Review: docs/infra/CLOUDFLARE-ONE.md

Score: 7 / 20 — Thorough live socket/WireGuard inventory, but the target architecture builds an unnecessary double-Cloudflare hairpin through fr2, hardcodes the legacy WireGuard IP (10.200.77.5) into its own replacement, ships a silently broken rollback command, and falsely marks SSH Infrastructure Access as target-ready.

Criterion	Score	Verdict
Factual & protocol accuracy	2 / 6	Port overflow (129030), missing sshd CA + WARP Split Tunnel rules, false client-IP claim, broken sed
Network & architectural design	1 / 5	Double-Cloudflare hairpin via fr2, replacement coupled to WG IP 10.200.77.5, duplicate cloudflared
Security & repo hygiene	2 / 5	Active unknown WG peer left connected, mig-test left public, missing Service Auth, live IPs/UUIDs in Git
Completeness & operational safety	2 / 4	Good service accounting table, but manual /etc drift (no IaC), untested QUIC load, broken rollback
1. Factual Errors

Silent no-op rollback command caused by U+00A0 (NBSP) (Rollback):

The one-liner 's|^    server 127.0.0.1:18797;.*|    server 10.200.77.5:8797;|' contains alternating non-breaking spaces (U+00A0) after ^ and |. Because sed exits 0 when 0 lines match, && sudo nginx -t && sudo systemctl reload nginx succeeds while modifying nothing in /etc/nginx/sites/downloads.aphrody.com.conf, leaving production broken during an outage.

16-bit TCP port overflow in 127.0.0.1:1<port> scheme (Pilot plan & Assumptions):

prd backends include port 29030 (api.aphrody.com) and 41337/41339 (loreserver). Prefixing 1 produces port 129030 (and 141337), exceeding the TCP uint16 maximum of 65535 (nginx: [emerg] invalid port in upstream). Even arithmetic +10000 (39030) collides with Linux net.ipv4.ip_local_port_range (32768–60999).

mig-prd-ssh is NOT ready on prd or WARP (Mapping summary & Tableau):

Claiming "la cible est prête... Inutilisable tant que WARP n'est pas sur le PC" is false on two counts:

Target sshd: Cloudflare Access for Infrastructure authenticates using short-lived SSH certificates. /etc/ssh/sshd_config on prd was never configured with Cloudflare's Gateway SSH CA (TrustedUserCAKeys /etc/ssh/ca.pub). SSH connections via mig-prd-ssh will fail auth even with WARP installed.

WARP Split Tunnels: Cloudflare Zero Trust defaults Split Tunnels (Exclude mode) to exclude 10.0.0.0/8. Traffic to 10.200.77.5/32 will never enter the WARP tunnel on the PC unless 10.0.0.0/8 is carved out in the Device Profile AND Gateway TCP + SSH Proxy are enabled.

False client IP and header propagation claim (Risks):

"l'IP client vue par prd devient celle de Cloudflare. X-Forwarded-For est propagé depuis fr2."

On prd, the socket peer IP is 127.0.0.1 (local cloudflared), not a Cloudflare IP. Furthermore, on the fr2 → mig-downloads.aphrody.com hop, Cloudflare overwrites CF-Connecting-IP with fr2's public IP and appends fr2 to X-Forwarded-For.

Untested same-zone Cloudflare-to-Cloudflare hairpin (Validation & Assumptions):

downloads.aphrody.com is already proxied by Cloudflare (Server: cloudflare). Testing only curl --resolve directly against fr2 bypassed the outer Cloudflare hop. In real traffic (Client → Cloudflare [aphrody.com] → fr2 nginx → Cloudflare [mig-downloads.aphrody.com]), forwarding CDN-Loop: cloudflare and CF-* headers back into the same Cloudflare zone triggers loop detection (HTTP 520 / Error 1000) unless explicitly stripped.

Unverified Free plan seat limit (Assumptions):

Cloudflare Zero Trust Free plan enforces a 50-seat limit, publicly documented on the Zero Trust Plans matrix and queryable directly via the authenticated cf / Zero Trust Billing API used in the session.

Wrong monorepo root & hardcoded path (Header):

References C:\src-merge\docs\infra\FLEET.md and C:\src-merge\infra\fleet\RUNBOOK.md instead of repo-relative docs/infra/FLEET.md and infra/fleet/RUNBOOK.md inside C:\src.

2. Design Flaws

Rube Goldberg fr2 hairpin instead of direct Cloudflare Tunnel ingress:

Since prd now runs cloudflared directly, keeping fr2 nginx in the path (Client → CF → fr2 → loopback → CF → Tunnel → prd) pays double TLS/CDN latency, preserves fr2 as a single point of failure, and requires per-service loopback relays + custom WAF IP-allowlist rules. Pointing aphrody.com, api.aphrody.com, cdn.aphrody.com, and downloads.aphrody.com directly to mig-prd eliminates fr2 from the prd data path entirely.

Replacement architecture depends on the legacy WireGuard interface (10.200.77.5):

The CIDR route (10.200.77.5/32), infra target (mig-prd), mig-depot (:8182), and mig-commons (:8766) all target 10.200.77.5—an IP bound to prd's WireGuard interface. Shutting down WireGuard at the end of the migration deletes 10.200.77.5 and breaks its own replacement, while keeping both active on the PC creates a Windows route conflict (10.200.77.5/32 WARP vs WireGuard).

Active security incident deferred to backlog (fr1 peer .10):

Peer .10 (92.170.252.46) has an active WireGuard handshake with an unknown owner on a flat /24 where prd exposes DB (:15433), Docker (:18080), loreserver (:41337), and admin services (:8182, :8766). Leaving an unidentified active VPN peer connected while postponing 127.0.0.1 rebinding for 7 days is unacceptable.

Interactive Access 302 placed in front of daemon/relay endpoints:

gpu-depot (:8182) and commons-relay (:8766) also have socket-proxyd forwarders on fr1, indicating non-browser/CLI/daemon consumers. mig-owner-only (contact@aphrody.com interactive login) returns 302 HTML redirects that break automated RPC/CLI clients without Access Service Tokens (CF-Access-Client-Id / Secret).

Test artifact mig-test.aphrody.com left publicly exposed:

Exposes wii-os (0.0.0.0:8780) on aphrody.com with neither an Access policy nor a WAF rule, while leaving port 8780 open on prd's public interface.

Duplicate cloudflared daemon on prd + remote-managed blast radius:

prd already runs tunnel prod. Adding cloudflared-mig-prd.service duplicates QUIC pools/daemons without a consolidation step. Using remote-managed tunnels (--token) also means any compromised Cloudflare API token with Tunnel:Edit can silently add [http://127.0.0.1:15433](http://127.0.0.1:15433) ingress rules without touching prd.

QUIC vs Hostinger UDP anti-DDoS assumption untested under load:

--protocol auto defaults to outbound UDP 7844 (QUIC). If Hostinger's anti-DDoS throttles sustained high-pps UDP return flows, cloudflared suffers multi-second packet-loss stalls before falling back to http2. A single idle curl returning 502 does not validate UDP stability.

3. Missing Items

Nginx DNS resolver configuration on fr2: Static proxy_pass [https://mig-downloads.aphrody.com](https://mig-downloads.aphrody.com); caches Cloudflare's VIP only at nginx reload and fails nginx -t on transient DNS hiccups unless paired with resolver + runtime variable.

Infrastructure-as-Code (IaC) in infra/fleet/: All Cloudflare DNS, Access, WAF, Tunnel, systemd, and Nginx configs were created imperatively via CLI/SSH with zero Terraform/OpenTofu state or versioned templates in C:\src\infra\fleet.

Cloudflare CDN Terms / payload limits for downloads.aphrody.com: Proxying large binary artifacts through standard orange-cloud CNAMEs risks Cloudflare CDN Terms of Service enforcement and 500 MB Free-plan upload/cache ceilings (use R2 custom domains if serving large binaries).

Secret / topology redaction: Raw public endpoint IPs, internal ports, admin email, and resource UUIDs are committed directly into repo documentation.

IdP & MFA pinning on mig-owner-only: Email-only rules allow one-time PIN fallback unless restricted to a specific IdP + hardware-key/MFA authentication method (amr).

4. Concrete Fixes
Fix 1 — Eliminate fr2 hairpin & decouple from 10.200.77.5

Use a dedicated loopback/dummy subnet (10.200.79.5/32 on lo) for WARP/SSH infrastructure routing so it neither collides with live WireGuard (10.200.77.0/24) on the PC nor disappears when WireGuard is removed. Point public aphrody.com hostnames directly to the tunnel at cutover (or use Unix sockets + stripped CDN-Loop if fr2 must stay temporarily):

Bash
# Sur prd : IP stable hors interface WireGuard (à persister via systemd-networkd / netplan)
sudo ip addr add 10.200.79.5/32 dev lo


If fr2 must temporarily relay an upstream before DNS cutover, replace TCP 1<port> with Unix sockets, dynamic DNS resolution, and CDN-Loop stripping in /etc/nginx/conf.d/mig-tunnel.conf:

Nginx
resolver 1.1.1.1 1.0.0.1 valid=60s ipv6=off;

server {
    listen unix:/run/nginx-mig-downloads.sock;
    location / {
        set $cf_target "mig-downloads.aphrody.com";
        proxy_pass https://$cf_target;
        proxy_ssl_server_name on;
        proxy_ssl_name $cf_target;
        proxy_ssl_verify on;
        proxy_ssl_trusted_certificate /etc/ssl/certs/ca-certificates.crt;

        # Évite la détection de boucle Cloudflare même-zone (HTTP 520 / Error 1000)
        proxy_set_header Host $cf_target;
        proxy_set_header CDN-Loop "";
        proxy_set_header CF-Connecting-IP "";
        proxy_set_header CF-Ray "";
        proxy_set_header X-Original-Client-IP $http_cf_connecting_ip;
    }
}

Fix 2 — Complete mig-prd-ssh setup on prd and Cloudflare Zero Trust

Fetch the Gateway SSH CA via cf / API (GET /accounts/<ACCOUNT_ID>/access/gateway_ca) and configure sshd on prd:

Bash
sudo install -m 0644 ca.pub /etc/ssh/cloudflare-ca.pub
sudo tee /etc/ssh/sshd_config.d/10-cloudflare-access.conf >/dev/null <<'EOF'
TrustedUserCAKeys /etc/ssh/cloudflare-ca.pub
CASignatureAlgorithms ecdsa-sha2-nistp256,ssh-ed25519,rsa-sha2-512
EOF
sudo sshd -t && sudo systemctl reload ssh


Update Tunnel CIDR route & Infra Target mig-prd from 10.200.77.5/32 to 10.200.79.5/32.

In Zero Trust Settings → WARP Client → Device settings → Split Tunnels (Exclude): replace 10.0.0.0/8 excluding 10.200.79.0/24 (or switch to Include mode adding 10.200.79.5/32), and enable Settings → Network → Proxy (TCP).

Fix 3 — Immediate security cleanup (fr1 WireGuard & mig-test)
Bash
# 1. Sur fr1 : révoquer immédiatement le pair actif inconnu (.10), .4 et le pair sans AllowedIPs
sudo wg set wg1 peer <PUBKEY_PEER_10> remove
sudo wg set wg1 peer <PUBKEY_PEER_4> remove
sudo wg set wg1 peer <PUBKEY_PEER_NONE> remove

# 2. Supprimer l'exposition publique de test mig-test.aphrody.com et fermer 0.0.0.0:8780 sur prd
sudo ufw deny in on eth0 to any port 8780 proto tcp


Add a Service Auth policy (using a Cloudflare Access Service Token) to mig-prd-admin before cutting over any CLI/daemon consumers of gpu-depot (:8182) or commons-relay (:8766).

Fix 4 — Exact replacement for broken paths, Pilot plan, and Rollback in docs/infra/CLOUDFLARE-ONE.md

Strip all U+00A0 characters from the file, replace C:\src-merge\ with repo-relative paths (docs/infra/FLEET.md, 
