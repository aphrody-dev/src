# Authentifications et accès réseau du parc

État relevé le 2026-11-13 (UTC) sur le PC, fr2 (`ssh cdn`) et prd (`ssh prd`) avec `ay auth status`. fr1 n'est que lu (`repair = false`). Inventaire : `infra/deploy.toml` (`[nodes.*]`, `[auth.*]`). Code : `packages/env-kit/src/{auth,secret-store}.ts`, routé par `ay auth` et `ay secret` (`crates/ay/src/exec.rs`).

## Mécanisme

| Commande | Effet |
|---|---|
| `ay auth status [--json] [--only cli,browser,token,store,ci,fleet,tunnel-api]` | lecture seule ; code 1 si un contrôle est `invalid` |
| `ay auth repair` | répare sans mot de passe : jeton `gh` du trousseau réexporté, `gh auth setup-git`, clés ssh publiques ajoutées à `authorized_keys`, unités cloudflared relancées, secrets GitHub resynchronisés |
| `ay auth repair --browser` | lance en plus `gcloud auth login <compte>`, `npm login --auth-type=web`, `vercel login`, `wrangler login` : le Chrome connecté s'ouvre, le propriétaire clique ; le nouveau jeton part dans le stockage |
| `ay auth gh-secrets [--dry-run]` | `gh secret set <NOM> --repo/--org … --body -` (valeur sur stdin) pour `[auth.github.*]` ; refuse un jeton que son fournisseur rejette (`whoami`) ; empreinte HMAC locale pour l'idempotence |
| `ay auth tunnels [--dry-run]` | jeton connecteur lu par l'API Cloudflare → `systemd-creds encrypt` sur l'hôte (`/etc/credstore.encrypted/cloudflared-<tunnel>`), drop-in `LoadCredentialEncrypted=` + `--token-file %d/…`, fichier en clair supprimé ; ne redémarre que s'il y a dérive |
| `ay auth rotate cloudflare` | `PUT /accounts/<id>/tokens/<id>/value` : nouveau `CLOUDFLARE_API_TOKEN`, ancien révoqué, propagé (stockage, `.env`, env utilisateur, éditeurs, GitHub) |
| `ay secret info/list/set/exec/pipe/has/rm/import` | stockage chiffré par l'OS (ci-dessous) |

Règles : aucune valeur en argv ni sur stdout (pas de `secret get` : une sortie capturée par un agent ou un journal CI n'est pas un terminal). Une valeur entre par stdin (`… | ay secret set NOM`) et sort vers l'env (`ay secret exec NOM -- cmd`) ou le stdin (`ay secret pipe NOM -- cmd`) d'un processus enfant.

## Stockage des secrets

| Hôte | Backend | Emplacement |
|---|---|---|
| Windows | DPAPI utilisateur (`CryptProtectData`, crypt32 via bun:ffi, entropie applicative) | `%LOCALAPPDATA%\aphrody\secrets\<NOM>.dpapi` |
| Linux, root | `systemd-creds` (clé hôte, TPM2 si présent) | `/etc/credstore.encrypted/<NOM>`, lu nativement par `LoadCredentialEncrypted=<NOM>` |
| Linux, utilisateur | `systemd-creds --user` (systemd ≥ 256 ; fr2 261, prd 262) | `~/.config/credstore.encrypted/<NOM>` |

Ordre de résolution : stockage, puis `.env` (ACL NTFS, `env-kit doctor`). `env-kit set` et `env-kit sync-gh` écrivent aussi dans le stockage. API TypeScript : `secretSet/secretGet/resolveSecret` (`packages/env-kit/src/secret-store.ts`), à réutiliser telle quelle par l'outillage des fournisseurs d'IA.

## État par type d'authentification (2026-11-13)

| Type | Outil | Secret | Renouvellement | État |
|---|---|---|---|---|
| CLI GitHub | `gh` 2.x | trousseau Windows + `GH_TOKEN` (.env, stockage) | `ay auth repair` réexporte le jeton du trousseau | ok, `aphrody-dev`, scopes repo, workflow, admin:org |
| CLI Google | `gcloud` | `%APPDATA%\gcloud` (7 configurations) | `ay auth repair --browser` | 5/7 ok ; `ai-yoyo` (yoyo.aphrody@gmail.com) et `org-contact` (contact@aphrody.com) sans identifiants : clic propriétaire |
| CLI Cloudflare | `cf`, `wrangler` | `CLOUDFLARE_API_TOKEN` (jeton de compte `cfat_`) | `ay auth rotate cloudflare` | ok ; roulé le 2026-11-13 (valeur exposée dans une session d'agent), GitHub resynchronisé |
| CLI Vercel | `vercel` | `VERCEL_TOKEN` | navigateur | ok, `aphrody-dev` |
| CLI npm | `npm` | `~/.npmrc`, `NPM_TOKEN` | `ay auth repair --browser` (connexion web) | **E401** : jeton révoqué ou expiré, clic propriétaire |
| CLI Claude, Antigravity | `claude`, `agy` | gérés par leurs CLI | – | ok (clé d'API prioritaire sur claude.ai : périmètre fournisseurs IA) |
| Navigateur | Chrome 3 profils, claude-in-chrome, agent-browser | sessions Chrome | clics propriétaire | ok : yohanpierre15@gmail.com, contact@aphrody.com, yoyo.aphrody@gmail.com ; hôte natif claude-in-chrome enregistré |
| Jetons d'API | `env-kit whoami` | stockage puis `.env` | fournisseur | ok : Cloudflare, OVH, Hostinger, Vercel, Neon, crates.io, Supabase ; invalide : npm |
| CI GitHub Actions | `ay auth gh-secrets` | secrets dépôt `aphrody-dev/src`, org `aphrody-labs` | à chaque rotation | 7/8 synchronisés ; `SUBMODULES_TOKEN` présent sur GitHub mais sans source locale (PAT à recréer puis `ay secret set`) |
| ssh | OpenSSH, `~/.ssh/config` → `fleet/ssh_config` | clés ed25519 (`id_ed25519_vn`, `hostinger_us_ed25519`, `github_aphrody_dev`) | `ay auth repair` (authorized_keys) | ok vers fr1, fr2, prd et `git@github.com` |
| WireGuard | `wg`, service Windows `WireGuardTunnel$wg-win` | clés privées sur chaque hôte (`/etc/wireguard`), rotation `infra/fleet/wg/rotate-wg-win.sh` | `infra/fleet/wg/rotate-wg-win.sh` (UAC sur le PC) | PC RUNNING ; fr2 `wg1` 2/2 ; prd `prod` 1/1, `vps` 2/2 ; fr1 `wg1` 4/6 (2 pairs inconnus sans handshake, cf. CLOUDFLARE-ONE.md). **Clé révoquée encore active** : le service `wg-win` du PC tourne toujours avec `up+fbCDK…` (fuitée, `[auth.wireguard].revoked`), pair présent sur fr1 `wg1` et prd `prod` ; la nouvelle paire `08E2m1El…` (`~/.ssh/fleet/wg/`) n’est installée nulle part. L’ancienne conf en clair `~/.ssh/wireguard-prod.conf` est passée dans le stockage DPAPI (`WG_WIN_OLD_CONF`, repli) et supprimée |
| Tunnels Cloudflare | `cloudflared` 2026.10.7 sur prd | `systemd-creds` `cloudflared-mig-prd`, `cloudflared-prod` (plus de fichier en clair) | `ay auth tunnels` (API Cloudflare) | 4 tunnels healthy (API) : prod, mig-prd, auto-usa, shenron-dbfr |
| Certificats | certbot sur fr2 (DNS-01, `/etc/letsencrypt/cloudflare.ini`) | jeton Cloudflare utilisateur, actif | `certbot.timer` | réparé : 3 lignées (aphrody.com, dragonballfr.com, rosegriffon.fr) refaites en liens symboliques, `certbot renew --dry-run` ok |
| R2 S3 temporaire | `shenron-cloudflare-s3-renew` (prd, 10 min) | `/srv/shenron/config/cloudflare/api-token` (`LoadCredential=`) | timer | réparé : verrou et fichier `.next` d'une exécution interrompue (2026-11-12 17:31) bloquaient tout ; drop-in `10-stale-lock.conf` les purge |
| Steam | `rg-steam-depot` (prd) | aucun jeton : connexion anonyme | `bun-steam-depot login-qr` | **en échec** : les dépôts de l'app 2799860 refusent l'anonyme ; approbation QR une fois dans l'app Steam du propriétaire (hors navigateur) |

## Ce qui reste au propriétaire

1. Rotation WireGuard du PC : `bash infra/fleet/wg/rotate-wg-win.sh` (une invite UAC), puis `ay auth status --only fleet` doit ne plus signaler `wireguard-key`.
2. `ay auth repair --browser` : cliquer les consentements gcloud (2 comptes) et npm.
3. Recréer le PAT `SUBMODULES_TOKEN` (lecture des sous-modules), puis `… | ay secret set SUBMODULES_TOKEN` et `ay auth gh-secrets`.
4. Steam : `docker compose --profile tools run --rm steam-depot login-qr` sur prd et approuver le QR dans l'app Steam ; l'image doit être reconstruite avec `STEAM_DEPOT_REV` ≥ d098b41 (la révision déployée a79da1a n'a pas `login-qr`).
