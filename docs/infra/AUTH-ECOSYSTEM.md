# Écosystème d'authentification « AI first » : comparaison et choix pour src

Relevé du 2026-11-13. Chaque ligne cite sa source, consultée ce jour-là : API datatracker IETF (`dt`), `rfc-editor.org/rfc/rfcN.json` (`rfced`), `gh api` (releases, `pushed_at`), registres npm et crates.io, Microsoft Learn, `--help` des CLI installées, forks `third_party/modelcontextprotocol` (06e9234, 2026-11-12) et `third_party/A2A` (2ae117a6, 2026-11-13). « non vérifié » signale ce qui n'a pas pu être confirmé. L'état courant du parc est dans [AUTH.md](AUTH.md).

Critère « AI first » : un agent obtient seul un jeton à portée minimale et à durée courte, et le renouvelle sans humain. L'humain n'intervient qu'une fois, pour consentir, d'un clic.

## 1. Protocoles et flux

| Élément | Statut vérifié | Usage AI first | Source |
|---|---|---|---|
| OAuth 2.1 | draft-ietf-oauth-v2-1-17 (2026-10-31) ; MCP 2026-07-28 cite encore -13/-14 | socle : PKCE obligatoire, ni implicit ni password | dt |
| PKCE | RFC 7636 (2015-09) | clients publics : CLI, agents | rfced 7636 |
| Device Authorization Grant | RFC 8628 (2019-08) | connexion headless, SSH ou conteneur | rfced 8628 |
| Client credentials | RFC 6749 §4.4 ; extension MCP « OAuth Client Credentials » Stable | agent autonome, de machine à machine | rfced 6749 ; gh modelcontextprotocol/ext-auth |
| Token Exchange | RFC 8693 (2020-01) | délégation et on-behalf-of ; base d'ID-JAG | rfced 8693 |
| DPoP | RFC 9449 (2023-09) | jeton lié à la clé de l'agent | rfced 9449 |
| PAR | RFC 9126 (2021-09) | requête d'autorisation poussée | rfced 9126 |
| RAR | RFC 9396 (2023-05) ; draft-chen-oauth-rar-agent-extensions-01 | permissions structurées par action | rfced 9396 ; dt |
| CIBA | OpenID CIBA Core 1.0 Final (2021-09-01) | consentement asynchrone hors bande | openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html |
| JWT bearer | RFC 7523 (2015-05) | assertion signée au lieu d'un secret | rfced 7523 |
| mTLS | RFC 8705 (2020-02) | jetons liés au certificat (SPIFFE X.509) | rfced 8705 |
| Protected Resource Metadata | RFC 9728 (2025-04) | découverte depuis `WWW-Authenticate` | rfced 9728 |
| AS Metadata | RFC 8414 (2018-06) | découverte de l'AS | rfced 8414 |
| DCR | RFC 7591 (2015-07) ; dépréciée par MCP 2026-07-28 au profit de CIMD | enregistrement automatique (héritage) | rfced 7591 ; `2026-07-28/changelog.mdx` |
| Resource Indicators | RFC 8707 (2020-02) ; exigés par MCP | une audience par serveur | rfced 8707 |
| `iss` | RFC 9207 (2022-03) ; MCP 2026-07-28 : l'AS SHOULD l'émettre, le client MUST le valider | protection contre le mix-up entre AS | rfced 9207 ; `2026-07-28/basic/authorization/index.mdx` |
| OpenID Connect | Core 1.0 Final ; Discovery accepté par MCP depuis 2025-11-25 | identité de l'humain derrière l'agent | `2025-11-25/changelog.mdx` |
| Client ID Metadata Document | draft-ietf-oauth-client-id-metadata-document-03 (2026-11-02) | `client_id` = URL HTTPS, sans enregistrement | dt |
| ID-JAG | draft-ietf-oauth-identity-assertion-authz-grant-06 (2026-10-31) | SSO d'entreprise vers MCP sans consentement interactif | dt |
| Identity Chaining | draft-ietf-oauth-identity-chaining-17 (2026-11-12), file de l'éditeur RFC | chaînage entre domaines | dt |
| Transaction Tokens | draft-ietf-oauth-transaction-tokens-11 (2026-08-21) | contexte propagé entre microservices | dt |
| WIMSE / AIMS | wimse-arch-08, workload-creds-03 ; draft-ietf-wimse-aims-01 (2026-11-02), seul draft « agent » adopté par un WG | identité de charge et d'agent | dt |
| SPIFFE/SPIRE | SPIRE v1.16.0 (2026-11-05) | identité de charge attestée | gh spiffe/spire |
| WebAuthn L3 / passkeys | Recommandation W3C (2026-08-25) | step-up humain | w3.org/TR/webauthn-3 |
| FedCM | FPWD du 2024-08-20 | navigateur uniquement | w3.org/TR/fedcm-1 |
| Storage Access API, CHIPS | rapports du Privacy CG ; rfc6265bis -22 (2026-10-19), pas encore RFC | navigateur uniquement | privacycg.github.io ; dt |

## 2. Auth des agents IA

| Élément | Statut vérifié | Usage AI first | Source |
|---|---|---|---|
| MCP 2025-11-25 | CIMD recommandé, PRM RFC 9728, step-up par `WWW-Authenticate`, OIDC Discovery | découverte et enregistrement sans configuration | `2025-11-25/changelog.mdx` |
| MCP 2026-07-28 | `iss`, `application_type` en DCR, état client par issuer, DCR dépréciée au profit de CIMD, jetons jamais dans l'URL, audience vérifiée, 401/403 + `resource_metadata` | idem, sans état | `2026-07-28/basic/authorization/*.mdx` |
| MCP ext-auth | Enterprise-Managed Authorization (ID-JAG) et Client Credentials, Stables | agent d'entreprise sans clic | gh modelcontextprotocol/ext-auth |
| A2A 1.0 | v1.0.1 (2026-05-28) ; `SecurityScheme` : APIKey, HTTPAuth, OAuth2 (flux authorizationCode avec `pkceRequired`, clientCredentials, deviceCode), OIDC, mTLS ; `OAuthFlows` est un oneof | Agent Card déclarative, device code pour le headless | `third_party/A2A/specification/a2a.proto` l. 495-650 |
| ACP | schema-v1.31.0 (2026-11-10) ; `authMethods` dans `initialize`, types `agent` et `terminal`, `logout` | le client délègue la connexion à l'agent | gh agentclientprotocol/agent-client-protocol `docs/protocol/v1/authentication.mdx` |
| OpenID AuthZEN | Authorization API 1.0 Final (2026-01-11) | PDP interrogé à chaque appel d'outil | openid.net/specs/authorization-api-1_0.html |
| OpenID AIIM | Community Group, sans spec | veille | openid.net/news |
| Microsoft Entra Agent ID | blueprint, identité d'agent, `client_credentials` + `jwt-bearer`, FIC ou identité managée recommandés | agent autonome sans secret | learn.microsoft.com/entra/agent-id/autonomous-agent-authentication-authorization-flow |
| Google Agent Identity | identité SPIFFE par agent, certificat X.509 de 24 h renouvelé automatiquement | agent sans clé | docs.cloud.google.com/iam/docs/agent-identity-overview |
| Auth0 / Okta | Token Vault GA ; Cross App Access (ID-JAG) en Early Access ; « AI agent token exchange » chez Okta | coffre de jetons tiers | auth0.com/blog/auth0-for-ai-agents-generally-available ; developer.okta.com/docs/guides/ai-agent-token-exchange |
| Cloudflare | `@cloudflare/workers-oauth-provider` 1.2.4 (2026-10-22, 0 dépendance : 7009, 7591, 7636, 8414, 8693, 8707, 9207, 9728, CIMD) ; Access « MCP server portals » | AS MCP prêt à l'emploi sur Workers | npm ; developers.cloudflare.com/cloudflare-one/access-controls/ai-controls/mcp-portals |
| 1Password | service accounts ; SDK JS 0.5.0 ; Agentic Autofill (early access) | secrets injectés sans passer par le LLM | developer.1password.com/docs/service-accounts |
| Infisical | v0.167.8 (2026-11-10) ; machine identities OIDC, JWT, SPIFFE, GCP, AWS | CI et agents par OIDC | gh ; infisical.com/docs |
| Doppler | CLI 3.77.1 (2026-10-22) ; service account identities par OIDC | CI par OIDC | gh ; docs.doppler.com/docs/service-account-identities |
| HashiCorp Vault | v2.2.2 (2026-11-12) ; méthode d'auth JWT/OIDC | jeton OIDC échangé contre un jeton Vault | gh ; developer.hashicorp.com/vault/docs/auth/jwt |
| Bitwarden Secrets Manager | machine accounts ; sdk-sm python-v2.1.0 | jeton d'accès machine | gh ; bitwarden.com/help/machine-accounts |

## 3. Bibliothèques Rust

| Crate | Version (date), activité | Rôle | Source |
|---|---|---|---|
| rmcp | 3.10.0 (2026-11-12) ; features `auth`, `auth-client-credentials-jwt`, `auth-enterprise-managed` | client et serveur MCP avec ext-auth | crates.io ; fork `third_party/modelcontextprotocol-rust-sdk` |
| oauth2 | 5.0.0 (2025-01-21), dépôt actif le 2026-02-22 | client OAuth (PKCE, device) | crates.io ; gh ramosbugs/oauth2-rs |
| openidconnect | 4.1.0 (2026-10-31) | client OIDC | crates.io |
| jsonwebtoken | 11.1.0 (2026-09-16) | JWT | crates.io |
| josekit | 0.10.3 (2025-05-20), dormant | JOSE complet (JWE) | crates.io |
| biscuit (lawliet89) | 0.8.0 (2026-04-05) | JOSE | crates.io |
| webauthn-rs | 0.6.2 (2026-10-31) | passkeys côté RP | crates.io ; gh kanidm |
| passkey (1Password) | 0.6.0 (2026-10-01) | authentificateur logiciel | crates.io |
| axum-login / tower-sessions | 0.18.0 (2025-07-20) / 0.15.0 (2026-02-01) | sessions axum | crates.io |
| keyring | 4.2.0 (2026-08-29) | coffre OS (Credential Manager, Secret Service, Keychain) | crates.io |
| secrecy | 0.10.3 (2024-10-09) | zéroïsation | crates.io |
| oxide-auth | 0.6.1 (2024-06-02), peu actif | AS embarqué | crates.io |
| rauthy | v0.37.2 (2026-10-19), absent de crates.io | serveur OIDC (fork `third_party/rauthy`) | gh sebadob/rauthy |
| better-auth (Rust) | 0.10.0 (2026-04-12, mis à jour le 2026-10-21) ; projet jeune | portage de better-auth (fork `third_party/better-auth-rs`) | crates.io |

## 4. Bibliothèques TypeScript et Bun

`packages/*` n'accepte aucune dépendance npm externe : une bibliothèque ne peut entrer que réécrite en Bun natif ou aplatie dans `third_party/`.

| Paquet | Version, date, dépendances runtime | Bun / intégration dans src | Source |
|---|---|---|---|
| jose | 6.2.17 (2026-11-09), 0 | Bun et WebCrypto ; aplatissable tel quel | npm ; README |
| oauth4webapi | 3.8.8 (2026-09-05), 0 | Bun ; client OAuth/OIDC complet, aplatissable | npm ; README |
| openid-client | 6.8.9 (2026-11-02), 2 (jose, oauth4webapi) | Bun | npm |
| @cloudflare/workers-oauth-provider | 1.2.4 (2026-10-22), 0 | conçu pour Workers, adaptable à Bun (non testé) | npm |
| better-auth | 1.7.22 (2026-11-12), 17 (kysely, zod, jose, @noble) | trop lourd pour `packages/*` ; seulement en fork aplati (un binaire est installé chez l'utilisateur, hors src) | npm |
| @auth/core (Auth.js) | 0.41.3 (2026-07-20), 5 | dépôt ralenti | npm |
| arctic | 3.7.0 (2025-05-21), 3 (@oslojs) | clients par fournisseur | npm |
| @oslojs/* | figés depuis 2024, 0 à 5 dépendances | triviaux à réécrire avec `crypto.subtle` | npm |
| @simplewebauthn/server | 14.1.0 (2026-11-06), 10 | lourd ; `/browser` 14.0.0 : 0 dépendance | npm |
| @modelcontextprotocol/sdk | 1.32.2, 17 dépendances ; v2 éclatée (`server` 2.4.0, 2 dépendances) | le relais implémente le protocole lui-même | npm ; fork `third_party/modelcontextprotocol-typescript-sdk` |
| @openauthjs/openauth | 0.4.3 (2025-03-04), dormant | écarté | npm |
| Bun natif | `crypto.subtle`, `node:crypto` HMAC, `Bun.password`, `Bun.CSRF`, `Bun.CookieMap`, `Bun.secrets` | suffit pour un AS OAuth 2.1 complet (fait : `relay/oauth.ts`) | mesure `bun -e` |

## 5. Plates-formes

| Plate-forme | Mécanisme vérifié | Usage AI first | Source |
|---|---|---|---|
| Windows | DPAPI `CryptProtectData` (même utilisateur et même machine ; DPAPI-NG pour plusieurs machines) | coffre local de src (`ay secret`) | Learn dpapi/nf-dpapi-cryptprotectdata |
| Windows | Credential Manager `CREDENTIALW`, `CRED_PERSIST_ENTERPRISE` | trousseau de `gh`, keyring-rs, Bun.secrets | Learn wincred/ns-wincred-credentialw |
| Windows | WAM (broker MSAL) : refresh token lié à l'appareil, jetons PoP | SSO silencieux Entra | Learn msal/dotnet/acquiring-tokens/desktop-mobile/wam |
| Windows | PRT Entra via CloudAP, protégé par le TPM | SSO silencieux sur un poste joint | Learn entra/identity/devices/concept-primary-refresh-token |
| Windows | Windows Hello, API WebAuthn Win32, plugins de passkeys (24H2) | step-up humain | Learn hello-for-business/webauthn-apis |
| Linux | `systemd-creds` (`--user` depuis v256, TPM2 depuis v250 ; v262.2 courant) | secrets de service de src (`ay secret`, `ay auth tunnels`) | man systemd-creds ; gh systemd |
| Linux | Secret Service / libsecret 0.21.8.2 | coffre de session de bureau | GitLab GNOME |
| Linux | tpm2-tss 4.2.2 | scellement de clés | gh tpm2-software |
| macOS, iOS | Keychain, AuthenticationServices : versions non vérifiées (pages rendues en JS) | coffre, passkeys | developer.apple.com |
| Android | androidx.credentials 1.6.0 stable (2026-04-08) | passkeys | developer.android.com/jetpack/androidx/releases/credentials |
| Navigateur | FedCM (FPWD), Storage Access, cookies `SameSite=Strict` + `HttpOnly` | session du propriétaire seulement | w3.org ; privacycg |
| Desktop | redirection loopback RFC 8252 (BCP) | consentement local sans clic (relais) | rfced 8252 |
| CLI, TUI | device flow RFC 8628 | un clic du propriétaire, depuis n'importe quel navigateur | rfced 8628 |
| CI | GitHub Actions OIDC : GCP (google-github-actions/auth v3, WIF direct), AWS (configure-aws-credentials v6.3.0) ; Cloudflare : pas de fédération native (workers-sdk discussion 11434) | CI sans clé | gh ; README |
| Registres | npm trusted publishing GA (2025-07-31) ; crates.io trusted publishing (RFC 3691, 2025-07-11) ; PyPI (gh-action-pypi-publish v1.14.3) | publication sans jeton | github.blog/changelog ; blog.rust-lang.org |

## 6. CLI des fournisseurs (installées sur le PC)

| CLI | Connexion sans navigateur local | Durée, renouvellement | Source |
|---|---|---|---|
| gh 2.103.3 | `gh auth login --web` affiche un code d'appareil (`--clipboard` le copie) ; `GH_TOKEN` | non vérifié | `gh auth login --help` |
| gcloud 593.0.0 | `--no-browser`, `--cred-file` (WIF) ; `print-access-token --impersonate-service-account --lifetime` | impersonation : 1 h, 12 h au plus avec la contrainte d'organisation | `--help` ; docs.cloud.google.com/iam/docs/create-short-lived-credentials-direct |
| claude 2.1.322 | `claude auth login` (`--console`, `--sso`) ; `claude setup-token` : jeton OAuth d'un an, à mettre dans `CLAUDE_CODE_OAUTH_TOKEN` | `/login` se renouvelle seul | `--help` ; code.claude.com/docs/en/authentication.md |
| codex 0.162.0-alpha | `codex login --device-auth` ; `--with-api-key` et `--with-access-token` lisent stdin | sessions ChatGPT renouvelées automatiquement | `--help` ; developers.openai.com/codex/auth.md |
| wrangler 4.161.0 | `wrangler login --device` (RFC 8628) | non vérifié | `wrangler login --help` |
| cf 1.0.0-beta.31 | `cf auth login`, profils | non vérifié | `cf auth login --help` |
| vercel 65.15.0 | `vercel login` (le code contient `device_code` et `refresh_token`) | non vérifié | gh vercel/vercel `packages/cli/src/util/oauth.ts` |
| npm 11.20.0 | `npm login --auth-type=web` | session de 2 h depuis le 2025-12-09 | `--help` ; github.blog/changelog/2025-12-09 |
| gemini CLI | `GEMINI_API_KEY`, ou Vertex AI (ADC / compte de service) | non vérifié | gh google-gemini/gemini-cli |
| agy | aucune sous-commande de connexion (`agy --help`) | non vérifié | `agy --help` |
| claude mcp add | `--client-id`, `--client-secret`, `--callback-port` : OAuth des serveurs MCP HTTP | jetons gérés par Claude Code | `claude mcp add --help` (2.1.322) |

## 7. Jetons à portée réduite

| Jeton | Vérifié | Choix | Source |
|---|---|---|---|
| GitHub fine-grained PAT | de 1 à 366 jours, ou sans expiration si la politique le permet | à remplacer par un jeton d'App | docs.github.com, managing-your-personal-access-tokens |
| GitHub App installation token | 1 h ; jeton utilisateur 8 h, refresh 6 mois | fait : App `aphrody-labs` (docs/infra/GITHUB-APP.md) | docs.github.com, generating-an-installation-access-token |
| Cloudflare API token | `expires_on`, `not_before`, `condition.request.ip` ; création par `POST /accounts/{id}/tokens` ; aucune expiration par défaut | jetons éphémères mintés à la demande (fait) | developers.cloudflare.com/fundamentals/api/how-to/create-via-api |
| GCP sans clé | impersonation 1 h ; création de clés désactivée par défaut dans les organisations créées après le 2024-05-03 | WIF + impersonation (fait) | docs.cloud.google.com/iam/docs/create-short-lived-credentials-direct |
| npm granular token | écriture : 90 j au plus, 7 j par défaut ; jetons classiques révoqués le 2025-12-09 | trusted publishing | github.blog/changelog/2025-09-29, 2025-12-09 |

## 8. Choix retenus pour src

1. **Serveur MCP / A2A (relais ai-os)** : un AS OAuth 2.1 embarqué, en Bun natif et sans dépendance, conforme à MCP 2026-07-28. Il couvre PRM, AS Metadata, CIMD (prioritaire) et DCR (repli), PKCE S256 obligatoire, `iss`, audience RFC 8707, rafraîchissement tournant avec révocation de la famille, `client_credentials` pour les agents enregistrés et device code pour le headless. Le jeton fixe reste accepté en en-tête pour l'usage local. Il n'est plus accepté dans l'URL de `/mcp` et `/a2a`. Écartés : `workers-oauth-provider` (fait pour Workers), better-auth (17 dépendances).
2. **CLI des fournisseurs** : device flow dès qu'il existe et qu'il n'y a pas de navigateur local (gh, wrangler `--device`, codex `--device-auth`, claude `setup-token`). Sinon loopback sur le PC (gcloud, npm web, vercel). Une connexion ne se lance que si son contrôle échoue.
3. **CI** : fédération OIDC GitHub Actions vers GCP (WIF), sans clé JSON. Pour crates.io et npm, trusted publishing en remplacement des secrets longue durée. Cloudflare n'ayant pas de fédération native, les agents passent par des jetons mintés.
4. **Agents vers les clouds** : jetons à durée courte et à permissions nommées, créés pour une commande puis révoqués. Cloudflare : `expires_on` et suppression en sortie. GCP : impersonation sans clé.
5. **Stockage** : inchangé, DPAPI sur Windows et systemd-creds (TPM2 si présent) sur Linux. Aucune valeur en argv ni sur stdout.
6. **À venir, non fait ici** : DPoP sur le relais ; ID-JAG / Enterprise-Managed quand un IdP d'entreprise sera en place. ACP reste sur stdio (`authMethods: []`), ce qui est conforme : MCP et ACP n'exigent pas d'OAuth sur stdio.

## 9. Migration effectuée (2026-11-13)

| Changement | Code | Vérification |
|---|---|---|
| Relais : AS OAuth 2.1 (`/.well-known/oauth-protected-resource[/mcp\|/a2a\|/rpc]`, `/.well-known/oauth-authorization-server`, `/oauth/{register,authorize,token,device_authorization,device,approve,revoke}`) ; 401 et 403 avec `WWW-Authenticate: Bearer resource_metadata=…, scope=…` | `packages/ai-os/src/relay/oauth.ts`, `server.ts` | `bun test packages/ai-os/test/relay` : 27 tests réussis, dont `oauth.test.ts` (DCR, PKCE, `iss`, audience, rotation, `client_credentials`, device) |
| Agent Card A2A : schémas `oauth2` (authorizationCode, `pkceRequired`), `device` (deviceCode), `agent` (clientCredentials), `bearer` | `relay/a2a.ts` via `a2aSecurity()` | test de la carte |
| Consentement : automatique si le relais n'écoute que la boucle locale et que l'hôte comme la redirection sont locaux. Sinon un clic (cookie du relais) ou `relay approve <code>`, consentement asynchrone sans mot de passe | `oauth.ts` | test device |
| `relay mcp-add` enregistre le relais dans Claude Code en OAuth (zéro clic en local) ; `--bearer` garde l'ancien en-tête ; `relay client add <nom>` crée un client `client_credentials` dont le secret va dans un fichier 0600 | `relay/cli.ts` | `bun check` |
| `ay auth login [cli…]` : connexion device-first des seules CLI en échec ; codex ajouté aux contrôles | `packages/env-kit/src/auth.ts` | `ay auth status --only cli` |
| `ay auth oidc` : pool WIF `github`, fournisseur `aphrody-dev` (condition `assertion.repository_owner=='aphrody-labs'` depuis le transfert du dépôt), `roles/iam.workloadIdentityUser` du dépôt `aphrody-labs/src` sur `yolo-automation@aphrody.iam.gserviceaccount.com` ; inventaire `[auth.oidc]` de `infra/deploy.toml` | `auth.ts`, `infra/deploy.toml` | créé puis relancé : 3/3 ok (idempotent) |
| `ay auth status --only oidc` signale les secrets longue durée qu'OIDC rend inutiles (`[auth.oidc.replaces]`) | `auth.ts` | `CARGO_REGISTRY_TOKEN` signalé (org aphrody-labs) |
| `ay auth mint cloudflare --perm "<groupes>" [--ttl s] -- cmd` : jeton de compte expirant, supprimé à la sortie ; `ay auth mint gcp [--sa] -- cmd` : impersonation sans clé | `auth.ts` | mint Cloudflare : `tokens/verify` actif, 0 jeton `ay-mint-*` restant ; mint GCP : `gcloud projects describe aphrody` répond 468000409790 |

Utilisation en CI (étape à ajouter dans un workflow, avec `permissions: id-token: write`) :

```yaml
- uses: google-github-actions/auth@v3
  with:
    workload_identity_provider: projects/468000409790/locations/global/workloadIdentityPools/github/providers/aphrody-dev
    service_account: yolo-automation@aphrody.iam.gserviceaccount.com
```

## 10. Gain en clics du propriétaire

| Connexion | Avant | Après |
|---|---|---|
| Agent vers le relais (MCP, A2A) en local | jeton copié dans la configuration de chaque client | 0 clic : DCR ou CIMD, puis approbation automatique en boucle locale |
| Agent distant vers le relais | jeton fixe partagé, sans expiration | `client_credentials` (jeton de 1 h) ou device code (1 clic) |
| CI vers GCP | clé JSON à créer puis à faire tourner | 0 clic, sans clé (WIF) |
| Agent vers GCP sans compte humain connecté | `gcloud auth login` : clic du propriétaire par compte | 0 clic (impersonation de `yolo-automation`) |
| Agent vers Cloudflare | jeton de compte complet et permanent | 0 clic : jeton aux permissions nommées, expirant, révoqué en sortie |
| CLI sur un hôte sans navigateur (prd, fr2) | copier-coller de code ou de jeton | 1 clic d'approbation du code d'appareil (gh, wrangler, codex) |
| Reste propre à l'humain | gcloud `ai-agent` et `org-contact`, npm | npm et crates.io ne demandent plus rien une fois en trusted publishing ; `SUBMODULES_TOKEN` remplacé par l App `aphrody-labs` le 2026-11-13 |
