# App GitHub `aphrody-labs`

Une seule App GitHub pour l'automatisation de tout aphrody : CI, releases, sous-modules, agents, webhooks. Elle
remplace l'App `aphrody-labs-submodules` (id 5738448, `contents: read`) et les PAT. Code :
`packages/env-kit/src/github-app.ts` (`ay auth github-app …`). État vérifié le 2026-11-13.

| Champ          | Valeur                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nom, slug      | `aphrody-labs` (« aphrody » est réservé par le compte GitHub tiers `@aphrody`)                                                                                         |
| Id, client id  | 5738700, `Iv23lijoWSPaWmQVMB8e`                                                                                                                                        |
| Propriétaire   | org `aphrody-labs`                                                                                                                                                     |
| Visibilité     | publique : une App privée ne s'installe que sur son compte propriétaire (docs « Making a GitHub App public or private »). Installer n'accorde rien aux autres comptes. |
| Installations  | `aphrody-labs` 181463765, `yolo-rs` 181463844, compte `aphrody-dev` 181463864 ; toutes « All repositories »                                                            |
| Webhook        | `https://aphrody-github.aphrody-labs.workers.dev/github`, JSON, SSL vérifié, secret = coffre `APHRODY_APP_WEBHOOK_SECRET`                                              |
| User-to-server | web flow (callback `http://127.0.0.1:47800/oauth/callback`) et device flow activés ; jetons qui expirent (8 h) avec refresh (6 mois, tournant)                         |

## Permissions

Source : schéma `app-permissions` de `github/rest-api-description` (commit `bd6df26`, 2026-11-12), chaque clé validée
contre le validateur de manifeste de GitHub le 2026-11-13, et recoupée avec `gh api /apps/<slug>` d'Apps réelles
(`github-actions`, `dependabot`, `renovate`, `claude`). Test : `packages/env-kit/src/github-app.test.ts`.

- Dépôt (write sauf mention) : actions, administration, artifact_metadata, attestations, checks, code_quality,
  contents, dependabot_secrets, deployments, discussions, environments, issues, merge_queues, metadata (read),
  packages, pages, pull_requests, repository_advisories, repository_creation, repository_custom_properties,
  repository_hooks, repository_projects (admin), secret_scanning_alerts, secrets, security_events, statuses,
  vulnerability_alerts, workflows.
- Organisation (write sauf mention) : members, organization_administration, organization_announcement_banners,
  organization_custom_org_roles, organization_custom_properties (admin), organization_custom_roles,
  organization_events (read), organization_hooks, organization_packages, organization_personal_access_token_requests,
  organization_personal_access_tokens, organization_plan (read), organization_projects (admin),
  organization_secrets, organization_self_hosted_runners, organization_user_blocking.
- Compte, jetons utilisateur seulement : emails (read), followers, gpg_keys, interaction_limits, keys, profile,
  starring.
- Écarts à l'OpenAPI constatés au validateur : `email_addresses` et `git_ssh_keys` sont refusés (« resource is not
  included in the list ») ; les noms acceptés sont `emails` et `keys`. `models` est refusé. Exclus volontairement :
  `codespaces` et `organization_copilot_seat_management` (facturés à l'usage), `single_file` (couvert par contents).

Événements : check_run, check_suite, code_scanning_alert, create, delete, dependabot_alert, deployment,
deployment_status, issue_comment, issues, member, membership, merge_group, organization, pull_request,
pull_request_review, push, registry_package, release, repository, repository_advisory, repository_ruleset,
secret_scanning_alert, status, workflow_job, workflow_run. Refusés par le validateur : `package`,
`repository_import`, `repository_vulnerability_alert`. `installation*` est toujours livré.

## Commandes

| Commande                                                                   | Effet                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ay auth github-app create [--no-open]`                                    | manifest flow (POST du manifeste vers `/organizations/aphrody-labs/settings/apps/new`, conversion `POST /app-manifests/{code}/conversions`) ; clé PEM, client secret, id → coffre ; secret d'org `APHRODY_APP_KEY` (visibilité `selected` : src seul) et variable d'org `APHRODY_APP_CLIENT_ID` sur aphrody-labs (stdin) ; secret du webhook généré au coffre avant la création ; webhook posé par `PATCH /app/hook/config` |
| `ay auth github-app install`                                               | une page d'installation par compte (`target_id`)                                                                                                                                                                                                                                                                                                                                                                            |
| `ay auth github-app status [--json]`                                       | écarts permissions/événements au manifeste, installations, permissions en attente d'acceptation ; exit 1 si écart                                                                                                                                                                                                                                                                                                           |
| `ay auth github-app token [--owner o] [--repos a,b] [--perm k=v,…] -- cmd` | jeton d'installation de 1 h (JWT RS256, `iss` = client id) injecté en `GH_TOKEN`/`GITHUB_TOKEN` ; sans `-- cmd`, écrit seulement dans un tube                                                                                                                                                                                                                                                                               |
| `ay auth github-app user [--device]` / `user-token -- cmd`                 | jeton utilisateur ; refresh token tournant dans le coffre (`APHRODY_APP_USER_REFRESH`)                                                                                                                                                                                                                                                                                                                                      |
| `ay auth github-app hook`                                                  | réaligne URL et secret du webhook                                                                                                                                                                                                                                                                                                                                                                                           |
| `ay auth github-app retire [--slug …]`                                     | désinstalle l'ancienne App avec sa propre clé, supprime ses secrets/variables d'org et du coffre, ouvre sa page « Delete » (aucune API ne supprime un enregistrement d'App)                                                                                                                                                                                                                                                 |
| `ay auth github-app crates-trust --crates a,b`                             | configuration trusted publishing crates.io vers `crates-publish.yml`                                                                                                                                                                                                                                                                                                                                                        |

Coffre (`env-kit secret`, jamais affiché) : `APHRODY_APP_KEY`, `APHRODY_APP_CLIENT_SECRET`,
`APHRODY_APP_WEBHOOK_SECRET`, `APHRODY_APP_USER_REFRESH`, `APHRODY_APP_ID`, `APHRODY_APP_CLIENT_ID`,
`CF_QUEUES_TOKEN`. Les permissions ne se modifient pas par API (seul `PATCH /app/hook/config` existe) : un ajout
passe par la page « Permissions & events », puis chaque installation l'accepte.

## Où l'App remplace un PAT ou `GITHUB_TOKEN`

| Usage                                                                       | Avant                                                       | Après                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Checkout des sous-modules privés (`release.yml` ×5, `claude.yml`, `ci.yml`) | App `aphrody-labs-submodules`, repli PAT `SUBMODULES_TOKEN` | `actions/create-github-app-token@64ab729…` (v3.3.0), `contents: read`, repli `github.token` pour les PR de fork seulement                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Release (`release.yml`, job host)                                           | `GITHUB_TOKEN` : l'événement `release` ne déclenchait rien  | jeton de l'App `contents: write` : `release` part au webhook et aux workflows en aval                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `claude.yml`                                                                | `GITHUB_TOKEN` (commits sans CI)                            | `github_token` de l'App : contents, pull_requests, issues write ; ses commits déclenchent judge/ci                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `ci-revert.yml`                                                             | push du revert par `GITHUB_TOKEN` (main jamais revérifié)   | push par l'App : judge/ci tournent sur le revert                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Agents (`infra/agents/runner.ts`)                                           | `GH_TOKEN` = PAT `gh auth token` dans le credstore prd      | `infra/agents/gh-token.ts` : jeton d'installation borné à contents/pull_requests/issues/actions/security_events/secret_scanning_alerts (write) et checks/statuses/vulnerability_alerts (read), en cache `var/agents/state/gh-token.json` (0600), re-minté 10 min avant expiration ; les tâches le reçoivent en `GH_TOKEN`, par un wrapper `gh` en tête de PATH (`var/agents/bin/gh`, relit le cache à chaque appel) et par un credential helper git (`GIT_CONFIG_*`) : aucune coupure, quelle que soit la durée ; la clé n'atteint jamais les agents ; le PAT reste repli tant que `APHRODY_APP_KEY`/`APHRODY_APP_CLIENT_ID` manquent |
| Miroir steam-depot                                                          | push par PAT                                                | sans objet : `aphrody-labs/steam-depot` tire src lui-même avec son `GITHUB_TOKEN` (`mirror.yml`, run 43356990212 vert)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| GHCR (`images.yml`)                                                         | `GITHUB_TOKEN`                                              | inchangé : le Container registry n'accepte que `GITHUB_TOKEN` en Actions ou un PAT classic (docs « Working with the Container registry ») ; la permission `packages` de l'App sert l'API                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Runners auto-hébergés                                                       | aucun actif (fr1 hors ligne)                                | jeton d'enregistrement : `ay auth github-app token -- gh api -X POST orgs/aphrody-labs/actions/runners/registration-token`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Webhooks vers la file d'agents

GitHub → Worker `aphrody-github` (`infra/cloudflare/workers/github-app`, `cf deploy`, file de production
`github-events`) → consommateur HTTP pull (`infra/agents/github-events.ts`, appelé par `runner.ts health` sur
l'hôte ship toutes les 2 min, jeton `CF_QUEUES_TOKEN` Queues Read+Write) → `var/agents/queue/new/`.

- Le Worker vérifie `X-Hub-Signature-256` (HMAC SHA-256, 64 hex, comparaison en temps constant), ignore les
  dépôts hors aphrody-labs, yolo-rs, aphrody-dev (l'App est publique) et ne met en file qu'un résumé : CI rouge sur la branche par défaut (`workflow_run` failure/timed_out/startup_failure/action_required, événement
  push/schedule/workflow_dispatch/merge_group du dépôt lui-même, jamais une PR de fork),
  push sur la branche par défaut, release publiée, alertes code scanning / Dependabot / secret scanning / advisory,
  installations. Le reste reçoit 202 sans effet. Côté consommateur, dépôt, SHA, ref et URL sont validés par
  expression régulière (sinon aucune tâche) et les titres sont cités comme texte non fiable.
- Tâches : CI rouge → `sre` (id `ci-fix-<sha>` pour src, partagé avec `ciWatch`, une seule ouverte par dépôt) ;
  push → `reviewer`, regroupés à une revue par dépôt et par heure sur la plage depuis la précédente, sans commit ;
  release → `deployer` en lecture seule ; sécurité → `sre`. Les dépôts hors checkout (ni src ni ses sous-modules)
  donnent un rapport, jamais un commit.
- Revue Gemini : docs/reviews/gemini-2026-11-13-github-app.md (8/20, corrections dans le commit suivant).
- prd : `APHRODY_APP_KEY`, `APHRODY_APP_CLIENT_ID`, `CF_QUEUES_TOKEN` chiffrés par `systemd-creds --user` (agent) ;
  premier `health` : 65 messages tirés, 4 tâches (1 CI rouge rubash, 3 revues).
- Vérifié le 2026-11-13 : livraisons `workflow_run`/`check_run`/`workflow_job` en 202 ; `pull --dry-run` : 24
  messages, 9 tâches (5 CI rouges src ramenées à 1 par la règle « une ouverte par dépôt »).

## npm, crates.io, déploiements

Une App GitHub n'authentifie aucun de ces services. Pont retenu pour chacun :

| Service          | Pont                                                                                                                                                                                  | État 2026-11-13                                                                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| npm              | trusted publishing OIDC (`npm-publish.yml`, npm 12.2.2, `id-token: write`, provenance)                                                                                                | trusted publisher posé sur les 33 paquets (commit 4d19523) ; `NPM_TOKEN` d'org reste le repli du premier publish                                                                                                                          |
| crates.io        | trusted publishing OIDC : `crates-publish.yml` + `rust-lang/crates-io-auth-action@3268eb4` (v1.0.6), jeton temporaire révoqué en fin de job                                           | aucune crate du workspace src n'est publiée sous `aphrody-dev` (les 370 crates du compte viennent d'autres dépôts) : `crates-trust` s'applique à la première crate publiée depuis src ; le premier publish reste manuel (règle crates.io) |
| Déploiements web | aphrody.app tient le rôle de Vercel sur notre stack (docs/ALPHABET.md) : `cf deploy` et la CI, jetons Cloudflare courts (`ay auth mint cloudflare`) ; ni App Vercel ni Workers Builds | projets Vercel `rg-*` sans dépôt lié, laissés tels quels                                                                                                                                                                                  |

## Ancienne App

`aphrody-labs-submodules` (5738448) : désinstallée par sa propre clé (`retire`), secret `SUBMODULES_APP_KEY` et variable
`SUBMODULES_APP_CLIENT_ID` supprimés de l'org et du coffre, enregistrement supprimé (page « Advanced ») le 2026-11-13 ;
`gh api /apps/aphrody-labs-submodules` répond 404. Aucun secret `SUBMODULES_TOKEN` ni PAT ne reste dans les secrets
Actions des dépôts aphrody-labs, aphrody-dev et yolo-rs (inventaire `gh secret list` du 2026-11-13).
