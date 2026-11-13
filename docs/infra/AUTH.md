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
| `ay auth login [cli…]` | connecte les seules CLI en échec, device flow (RFC 8628) sans navigateur local : gh (code d'appareil), wrangler `--device`, codex `--device-auth`, claude `setup-token` |
| `ay auth oidc [--dry-run]` | fédération GitHub Actions OIDC → GCP (WIF) de `[auth.oidc.gcp]`, idempotente ; `status --only oidc` signale les secrets que `[auth.oidc.replaces]` rend inutiles |
| `ay auth mint cloudflare --perm "<groupes>" [--ttl s] -- cmd` | jeton de compte limité à ces groupes, `expires_on`, injecté dans l'enfant puis supprimé |
| `ay auth mint gcp [--sa <email>] [--ttl s] -- cmd` | jeton d'accès par impersonation, sans clé (`CLOUDSDK_AUTH_ACCESS_TOKEN`) |
| `ay secret info/list/set/exec/pipe/has/rm/import` | stockage chiffré par l'OS (ci-dessous) |

Comparaison de l'écosystème et choix « AI first » : [AUTH-ECOSYSTEM.md](AUTH-ECOSYSTEM.md). Le relais ai-os sert OAuth 2.1 (MCP 2026-07-28, A2A 1.0) : `relay mcp-add`, `relay approve`, `relay client add`.

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
| CLI Google | `gcloud` | `%APPDATA%\gcloud` (7 configurations) | `ay auth repair --browser` | 5/7 ok ; `ai-agent` (<ai-google>) et `org-contact` (contact@aphrody.com) sans identifiants : clic propriétaire |
| CLI Cloudflare | `cf`, `wrangler` | `CLOUDFLARE_API_TOKEN` (jeton de compte `cfat_`) | `ay auth rotate cloudflare` | ok ; roulé le 2026-11-13 (valeur exposée dans une session d'agent), GitHub resynchronisé |
| CLI Vercel | `vercel` | `VERCEL_TOKEN` | navigateur | ok, `aphrody-dev` |
| CLI npm | `npm` | `~/.npmrc`, `NPM_TOKEN` | `ay auth repair --browser` (connexion web) | **E401** : jeton révoqué ou expiré, clic propriétaire |
| CLI Claude, Antigravity | `claude`, `agy` | gérés par leurs CLI | – | ok (clé d'API prioritaire sur claude.ai : périmètre fournisseurs IA) |
| Navigateur | Chrome 3 profils, claude-in-chrome, agent-browser | sessions Chrome | clics propriétaire | ok : <owner-google>, contact@aphrody.com, <ai-google> ; hôte natif claude-in-chrome enregistré |
| Jetons d'API | `env-kit whoami` | stockage puis `.env` | fournisseur | ok : Cloudflare, OVH, Hostinger, Vercel, Neon, crates.io, Supabase ; invalide : npm |
| CI GitHub Actions | `ay auth gh-secrets` | secrets dépôt `aphrody-labs/src`, org `aphrody-labs` | à chaque rotation | plus de PAT : `APHRODY_APP_KEY` (secret d org aphrody-labs et yolo-rs) alimente l App GitHub `aphrody-labs` (docs/infra/GITHUB-APP.md) ; `SUBMODULES_TOKEN` supprimé |
| ssh | OpenSSH, `~/.ssh/config` → `fleet/ssh_config` | clés ed25519 (`id_ed25519_vn`, `hostinger_us_ed25519`, `github_aphrody_dev`) | `ay auth repair` (authorized_keys) | ok vers fr1, fr2, prd et `git@github.com` |
| WireGuard | `wg`, service Windows `WireGuardTunnel$wg-win` | clés privées sur chaque hôte (`/etc/wireguard`), rotation `infra/fleet/wg/rotate-wg-win.sh` | `infra/fleet/wg/rotate-wg-win.sh` (UAC sur le PC) | PC RUNNING ; fr2 `wg1` 2/2 ; prd `prod` 1/1, `vps` 2/2 ; fr1 `wg1` 4/6 (2 pairs inconnus sans handshake, cf. CLOUDFLARE-ONE.md). **Clé révoquée encore active** : le service `wg-win` du PC tourne toujours avec `up+fbCDK…` (fuitée, `[auth.wireguard].revoked`), pair présent sur fr1 `wg1` et prd `prod` ; la nouvelle paire `08E2m1El…` (`~/.ssh/fleet/wg/`) n’est installée nulle part. L’ancienne conf en clair `~/.ssh/wireguard-prod.conf` est passée dans le stockage DPAPI (`WG_WIN_OLD_CONF`, repli) et supprimée |
| Tunnels Cloudflare | `cloudflared` 2026.10.7 sur prd | `systemd-creds` `cloudflared-mig-prd`, `cloudflared-prod` (plus de fichier en clair) | `ay auth tunnels` (API Cloudflare) | 4 tunnels healthy (API) : prod, mig-prd, auto-usa, shenron-dbfr |
| Certificats | certbot sur fr2 (DNS-01, `/etc/letsencrypt/cloudflare.ini`) | jeton Cloudflare utilisateur, actif | `certbot.timer` | réparé : 3 lignées (aphrody.com, dragonballfr.com, rosegriffon.fr) refaites en liens symboliques, `certbot renew --dry-run` ok |
| R2 S3 temporaire | `shenron-cloudflare-s3-renew` (prd, 10 min) | `/srv/shenron/config/cloudflare/api-token` (`LoadCredential=`) | timer | réparé : verrou et fichier `.next` d'une exécution interrompue (2026-11-12 17:31) bloquaient tout ; drop-in `10-stale-lock.conf` les purge |
| Steam | `rg-steam-depot` (prd) | refresh token `/srv/rosegriffon/steam/steam-tokens.json` (0600, montage hôte persistant) ; copie coffre `STEAM_REFRESH_TOKEN` | `bun-steam-depot login-qr` (`bun scripts/steam-login.ts --qr`, QR renouvelé jusqu'à approbation) | actif : QR approuvé le 2026-11-13, expire 2027-06-12 ; `list` authentifié voit le manifeste du dépôt 2799861 |

## Règle : pas de relance de connexion (`ay auth daemon`)

Ordre du propriétaire du 2026-11-13 : plus de rafales de connexions ni d'états périmés.

- Un seul service par hôte, `ay auth daemon` (`packages/env-kit/src/auth-daemon.ts`) : unité utilisateur `infra/fleet/systemd/aphrody-auth-daemon.service` sur prd et fr2, tâche planifiée `aphrody-auth-daemon` (à l'ouverture de session) sur le PC ; installation `just auth-daemon-install`.
- Sonde réelle toutes les 5 min, valeurs relues dans le coffre à chaque passe ; `<état>/auth-state.json` n'est jamais plus vieux que 5 min et tout rapport s'appuie sur une sonde, jamais sur un état en cache.
- Rafraîchissement sans humain toutes les 30 min (`repair` sans navigateur), et dans les CLI : refresh tokens (gcloud, codex), impersonation de compte de service, jetons d'installation de l'App GitHub, OIDC en CI.
- Identifiants préférés : sans interaction et longue durée. Impersonation d'un compte de service plutôt qu'un login utilisateur gcloud ; `claude setup-token` (1 an) ; refresh token codex ; OIDC CI.
- Dernier recours : un identifiant qui exige un clic est signalé au plus une fois par 24 h, tous regroupés dans une seule notification (`<état>/auth-pending.md`, notification Windows). Aucune page n'est ouverte et aucune connexion n'est relancée ; le propriétaire répond par `ay auth daemon --ack <cible>`, qui lance une seule connexion.
- Tout agent qui relance une connexion hors de ce service viole NHITL (catégorie `login_spam` de l'index).
- gcloud `org-contact` : plus de login utilisateur. La configuration utilise `<owner-google>` avec `auth/impersonate_service_account = yolo-automation@aphrody` (rôle owner sur aphrody, alors que contact@aphrody.com n'a aucun rôle sur le projet) ; `gcloud projects describe aphrody --configuration org-contact` répond ACTIVE.

## Incidents et rotations du 2026-11-13 (UTC)

- `GCP_ADMIN_SA_KEY` (compte `admin-sa@rgfr-8927d`) : clé `31555a22…` affichée dans la sortie d'outil d'une session d'agent, considérée compromise. Nouvelle clé `5de55ed8…` créée (configuration gcloud `owner`) et propagée : coffre DPAPI, `.env` (JSON brut entre apostrophes, lisible par bun et dotenv), `apps/rosegriffon/apps/rg-website/.env.local`, configuration gcloud `rosegriffon`. Aucun secret GitHub Actions ni copie sur prd ou fr2. Ancienne clé supprimée ; un échange JWT signé avec elle renvoie `invalid_grant` (« Invalid JWT Signature »).
- `CLOUDFLARE_API_TOKEN` : la variable utilisateur Windows est égale au coffre (vérifié) ; seuls les processus lancés avant la rotation gardent l'ancienne valeur (401) jusqu'à leur redémarrage. Sur prd, la valeur est en `systemd-creds` (`/etc/credstore.encrypted/CLOUDFLARE_API_TOKEN`) et les copies de `/etc/aphrody/secrets.env` et `~/.config/yolo/secrets.env` (root, aphrody) sont à jour.
- LiteLLM de prd (`ay-ai-litellm`) : démarré par `infra/ai/litellm-serve.ts` (drop-in `infra/ai/systemd/ay-ai-litellm.service.d/10-creds.conf`, installation `sh infra/ai/systemd/install-prd.sh`). Identifiants `LoadCredentialEncrypted=` : `CLOUDFLARE_API_TOKEN`, `LITELLM_MASTER_KEY`, `ANTHROPIC_API_KEY`, `ANTHROPIC_WORKSPACE_ID`, `VERTEX_APHRODY_SA_KEY` (compte `litellm-prd@aphrody`, rôle `roles/aiplatform.user` seul ; fédération sans clé impossible, prd n'a pas d'émetteur OIDC). `infra/ai/litellm-overlay.toml` retire `vllm/*` et `mistralrs/*`, ajoute `anthropic-workspace-id` et plafonne la dépense (Anthropic 2 USD/j, proxy 5 USD/j). Appels réels : `anthropic/claude-haiku-4-5` et `google-vertex-aphrody/gemini-2.5-flash` OK ; Workers AI 429 (quota gratuit quotidien épuisé, code 4006).
- Proxy `anthropic-proxy` (tmux, 127.0.0.1:8793) supprimé ; le relais de prd passe par LiteLLM (`RELAY_OPENAI_ENDPOINTS=litellm=http://127.0.0.1:4000/v1`, clé maîtresse en `systemd-creds --user`, drop-in `infra/fleet/prd/systemd/aphrody-relay.service.d/10-litellm.conf`).
- Runners : `CLAUDE_CODE_OAUTH_TOKEN` (jeton `claude setup-token`, coffre DPAPI) chiffré par `systemd-creds --user` chez `agent` (prd) et `ubuntu` (fr2), `claude -p` vérifié ; Codex connecté pour `agent` sur prd (code d'appareil).

Points encore ouverts : index NHITL, `just nhitl list --status open` (`var/agents/nhitl.sqlite`, registre versionné `packages/ai-os/src/nhitl/ledger.json`).

## Ce qui reste au propriétaire

1. Rotation WireGuard du PC : `bash infra/fleet/wg/rotate-wg-win.sh` (une invite UAC), puis `ay auth status --only fleet` doit ne plus signaler `wireguard-key`.
2. gcloud : plus de consentement à cliquer (`org-contact` par impersonation) ; npm : trusted publishing (autre chantier).
3. `SUBMODULES_TOKEN` : remplacé le 2026-11-13 par l App GitHub `aphrody-labs` (`ay auth github-app`, docs/infra/GITHUB-APP.md) ; plus aucun PAT à recréer.
4. Steam : image `rosegriffon/steam-depot` reconstruite sur prd avec steam-depot d098b41 (`login-qr` présent) ; `bun scripts/steam-login.ts --qr` (apps/rosegriffon) affiche le QR dans Chrome, à approuver dans l'app Steam (fait le 2026-11-13 : approuvé, jeton rangé sur prd et dans le coffre).
