# npm sans humain

État au 2026-11-13. Compte npm : `yohan971`, owner des orgs `@aphrody` et `@rosegriffon`. Commande unique :
`just npm <status|sync|inventory|align|login|trust|harden>` (`scripts/npm.ts`).

## État de npm (sources lues le 2026-11-13)

| Point | Fait | Source |
| --- | --- | --- |
| Publier | 2FA du compte, ou granular token avec « bypass 2FA » | [configuring-two-factor-authentication](https://docs.npmjs.com/configuring-two-factor-authentication) (édité le 2026-09-10) |
| 2FA | security key WebAuthn (Windows Hello, Yubikey) configurable sur le web seulement ; `npm profile enable-2fa auth-and-writes` ; codes de récupération à usage unique, gel de 72 h après usage | idem |
| Jetons | seuls les granular tokens existent (legacy supprimés en novembre 2025) ; création impossible en CLI ; expiration ≥ 1 jour ; permission « stage only » possible | [about-access-tokens](https://docs.npmjs.com/about-access-tokens), [creating-and-viewing-access-tokens](https://docs.npmjs.com/creating-and-viewing-access-tokens) |
| Bypass 2FA | depuis août 2026 : plus de gestion de jetons, mainteneurs, trusted publishers ni org ; publication directe retirée en janvier 2027 (cible) | [changelog 2026-07-31](https://github.blog/changelog/2026-07-31-restricting-npm-bypass-2fa-granular-access-tokens/) |
| Trusted publishing | npm ≥ 11.5.1, Node ≥ 22.14, `id-token: write`, `repository.url` identique au dépôt, nom du fichier workflow (celui de l'appelant en cas de workflow réutilisable), runners hébergés uniquement ; premier publish exigé sous 2 jours après création ; configs créées après le 2026-09-03 : `npm stage publish` par défaut, `npm publish` en option | [trusted-publishers](https://docs.npmjs.com/trusted-publishers) |
| Provenance | automatique en OIDC si dépôt et paquet publics ; avec un jeton, il faut `--provenance` | idem |
| `npm trust` | npm ≥ 11.15.0, paquet déjà existant, 2FA activée sur le compte, jetons bypass refusés ; OTP au premier appel, le site propose « skip 2FA pendant 5 min » pour la configuration en masse ; une config par paquet | [npm-trust](https://docs.npmjs.com/cli/v11/commands/npm-trust) |
| Staged publishing | `npm stage publish` sans 2FA, approbation 2FA par un mainteneur | [npm-stage](https://docs.npmjs.com/cli/v11/commands/npm-stage/) |
| Durcissement | « Require two-factor authentication and disallow tokens » : jetons refusés, trusted publishers acceptés ; CLI `npm access set mfa=publish` | [requiring-2fa…](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification), [npm-access](https://docs.npmjs.com/cli/v11/commands/npm-access) |
| bun | `bun publish` ne gère ni OIDC ni `--provenance` ([oven-sh/bun#22423](https://github.com/oven-sh/bun/issues/22423), [#15601](https://github.com/oven-sh/bun/issues/15601) ouverts) ; le `release.yml` de bun publie avec `npm publish` | `gh api` 2026-11-13 |
| Précédence | un échange OIDC réussi remplace le jeton configuré ; en cas d'échec, le jeton reste utilisé | npm/cli v12.2.2 `lib/utils/oidc.js` |
| Versions | npm 12.2.2 (latest, Node `^22.22.2 \|\| ^24.15.0 \|\| >=26`), bun 1.4.4 | registre npm, `gh api` |

## Modèle retenu

1. **Trusted publishing OIDC** depuis `.github/workflows/npm-publish.yml` (aphrody-labs/src, `ubuntu-latest`) : `bun pm pack`
   (résout `workspace:` et `catalog:`), puis `npm publish <tgz> --provenance` avec npm 12.2.2 installé par `bun add -g`.
   Les dépôts rosegriffon et shenron ont un `npm-publish.yml` qui appelle ce workflow : le trusted publisher pointe sur
   `<dépôt>` + `npm-publish.yml`.
2. **Repli jeton** : secret d'org `NPM_TOKEN` (visibilité all) tant qu'un paquet n'a pas de trusted publisher, donc pour
   tout premier publish (`npm trust` exige un paquet existant). Fin de ce repli pour la publication directe : janvier 2027 ;
   le remplaçant est `npm stage publish` + approbation 2FA.
3. **Durcissement** : `just npm harden` passe en `mfa=publish` les paquets dont la dernière version porte
   `_npmUser.trustedPublisher`.

## Jeton unique (fusion du 2026-11-13)

Recensement (empreintes sha256, aucune valeur lue à l'écran) : un seul jeton valide (`whoami` = `yohan971`, granular
lecture-écriture créé le 2026-11-04, sans expiration), présent dans `/root/.npmrc` de prd et `.env` `NPM_TOKEN__USA`.
Morts (401) : `.env` `NPM_TOKEN`/coffre/env utilisateur (même jeton), `.env` `NPM_TOKEN__FR1`, `~/.npmrc` de fr2 et fr1.

Après `just npm sync` : coffre env-kit `NPM_TOKEN` (DPAPI) -> env utilisateur Windows (lu par `~/.npmrc` via
`${NPM_TOKEN}`), secret d'org GitHub `NPM_TOKEN` (aussi dans `infra/deploy.toml [auth.github.org_secrets]`, repris par
`env-kit auth gh-secrets`), `~/.npmrc` (0600) de prd root, prd agent, fr2, fr1. Clés `NPM_TOKEN__USA`/`__FR1` supprimées
de `.env`. npm n'est installé sur aucun VPS : bun y lit `~/.npmrc` (`bun pm whoami` = `yohan971` partout).
`.npmrc` des projets : aucun jeton en clair hors `third_party` (fixtures de tests deno sur localhost, fontawesome).

## Inventaire (`just npm inventory`)

45 paquets publiables (scopes possédés, non `private`), 33 déjà sur npm :
`@aphrody/{bun-parity,bun-plugins,env-kit,forge,upstream,wck}` (src), 22 `@rosegriffon/*` (rosegriffon), 17 `@aphrody/*`
de shenron. `just npm align --write` a fixé `repository` (`git+https://github.com/<org>/<dépôt>.git` + `directory`) et
`publishConfig` (`access: public`) ; passés en `private` : `@auto/*` et `@ucs/urc-proto` (scopes non possédés), les copies
rosegriffon de `@aphrody/{remotion,hyperframes,filmcraft}` (canoniques dans shenron). Le compte possède 696 paquets au
total ; ceux qui ne vivent pas dans ce monorepo restent hors de ce flux.

## Publier

```sh
just npm-publish-ci "packages/wck" true         # dry-run en CI (src)
gh workflow run npm-publish.yml -R aphrody-labs/shenron -f packages="packages/engine" -f dry_run=false
```

Une version déjà publiée est ignorée ; le résumé du job liste ce qui part.

## Part du propriétaire (2FA uniquement)

La 2FA est par construction le facteur du propriétaire : `npm trust`, `npm access set`, la création de jetons et
l'approbation d'un `npm stage` exigent un défi 2FA interactif que ni un agent ni un jeton bypass ne peuvent fournir
(changelog du 2026-07-31). Point inscrit au registre NHITL (`packages/ai-os/src/nhitl/ledger.json`, catégorie `npm_2fa`).

1. https://www.npmjs.com/settings/yohan971/tfa : activer la 2FA par security key (Windows Hello), conserver les codes.
2. `just npm login` : page npm ouverte, un clic (session dans `%LOCALAPPDATA%\aphrody\npm-session.npmrc`, distincte du jeton).
3. `just npm trust` : premier défi 2FA validé sur la page ouverte, cocher « skip 2FA 5 min », les 33 paquets existants
   reçoivent leur trusted publisher (`--allow-publish --allow-stage-publish`). Les 12 nouveaux : premier publish par le
   workflow (repli jeton), puis `just npm trust` à nouveau.
