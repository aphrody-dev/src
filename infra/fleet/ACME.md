# ACME partagé sur fr2 (cdn, 51.255.162.6, 10.200.77.3)

Un seul client ACME pour la flotte : **certbot** sur fr2 (`/usr/bin/certbot`, timer `certbot.timer` actif).

- Compte Let's Encrypt épinglé : `account = 5d88992863b82d549899a769e692edbb` dans `/etc/letsencrypt/cli.ini`.
- Zones Cloudflare (aphrody.com, aphrody.app, dragonballfr.com, rosegriffon.fr…) : DNS-01, credentials `/etc/letsencrypt/cloudflare.ini` (0600).
- Zones hors Cloudflare (ex. rpbey.fr, DNS OVH) : HTTP-01 webroot `/var/www/letsencrypt` une fois le DNS pointé sur fr2.
- Hook de déploiement : `/etc/letsencrypt/renewal-hooks/deploy/50-nginx-reload` (`nginx -t && systemctl reload nginx`).

## Émettre un certificat

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

- vhost : `/etc/nginx/sites/<domaine>.conf` (inclus par `nginx.conf`, ligne `include /etc/nginx/sites/*.conf;`).
- certificat : `/etc/nginx/certs/<domaine>/{fullchain,privkey}.pem`, symlink vers `/etc/letsencrypt/live/<domaine>` quand certbot le gère, sinon copie statique (0600) à remplacer par un symlink au premier renouvellement.
- `--cert-name` = domaine apex ; wildcard `*.<domaine>` systématique sur les zones Cloudflare.
- Sources versionnées : `infra/fleet/fr2/nginx/` (sites + snippets).

Contrôle : `ay auth status --only fleet` (unité `certbot` de fr2, `[auth.hosts.fr2]` de deploy.toml). Le 2026-11-13, les lignées aphrody.com, dragonballfr.com et rosegriffon.fr avaient des fichiers copiés dans `live/` au lieu de liens (certbot : « expected cert.pem to be a symlink », unité en échec) ; les fichiers ont été versés dans `archive/` comme nouvelle version et `live/` refait en liens, `certbot renew --dry-run` ok. Ne jamais copier dans `live/` : `certbot certonly --cert-name` ou un lien.

État au 2026-11-12 : aphrody.com et aphrody.app (wildcards, expirent le 2027-02-05) gérés par certbot ; rpbey.fr = copie statique depuis fr1 (expire le 2027-02-05), à passer en webroot après bascule DNS OVH.
