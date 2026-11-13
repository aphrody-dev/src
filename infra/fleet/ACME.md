# Shared ACME on fr2 (cdn, 51.255.162.6, 10.200.77.3)

A single ACME client for the fleet: **certbot** on fr2 (`/usr/bin/certbot`, timer `certbot.timer` active).

- Pinned Let's Encrypt account: `account = 5d88992863b82d549899a769e692edbb` in `/etc/letsencrypt/cli.ini`.
- Cloudflare zones (aphrody.com, aphrody.app, dragonballfr.com, rosegriffon.fr…): DNS-01, credentials `/etc/letsencrypt/cloudflare.ini` (0600).
- Zones outside Cloudflare (e.g. rpbey.fr, OVH DNS): HTTP-01 webroot `/var/www/letsencrypt` once the DNS points to fr2.
- Deploy hook: `/etc/letsencrypt/renewal-hooks/deploy/50-nginx-reload` (`nginx -t && systemctl reload nginx`).

## Issuing a certificate

```sh
# zone Cloudflare (wildcard)
certbot certonly -n --dns-cloudflare --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 30 --cert-name <domaine> -d <domaine> -d '*.<domaine>'
ln -sfn /etc/letsencrypt/live/<domaine> /etc/nginx/certs/<domaine>

# zone hors Cloudflare (après bascule DNS vers fr2)
certbot certonly -n --webroot -w /var/www/letsencrypt --cert-name <domaine> -d <domaine> -d www.<domaine>
ln -sfn /etc/letsencrypt/live/<domaine> /etc/nginx/certs/<domaine>
```

## Convention

- vhost: `/etc/nginx/sites/<domain>.conf` (included by `nginx.conf`, line `include /etc/nginx/sites/*.conf;`).
- certificate: `/etc/nginx/certs/<domain>/{fullchain,privkey}.pem`, symlink to `/etc/letsencrypt/live/<domain>` when certbot manages it, otherwise a static copy (0600) to be replaced by a symlink at the first renewal.
- `--cert-name` = apex domain; wildcard `*.<domain>` always on Cloudflare zones.
- Versioned sources: `infra/fleet/fr2/nginx/` (sites + snippets).

Check: `ay auth status --only fleet` (fr2's `certbot` unit, `[auth.hosts.fr2]` of infra/deploy.toml). On 2026-11-13, the aphrody.com, dragonballfr.com and rosegriffon.fr lineages had files copied into `live/` instead of links (certbot: "expected cert.pem to be a symlink", unit failing); the files were moved into `archive/` as a new version and `live/` redone as links, `certbot renew --dry-run` ok. Never copy into `live/`: `certbot certonly --cert-name` or a link.

State as of 2026-11-12: aphrody.com and aphrody.app (wildcards, expire on 2027-02-05) managed by certbot; rpbey.fr = static copy from fr1 (expires on 2027-02-05), to be moved to webroot after the OVH DNS switch.
