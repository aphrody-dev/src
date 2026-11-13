# Consolidation des identités sur aphrody-labs

Relevé et opérations du 2026-11-13 (UTC), par `gh api` (compte `aphrody-dev`, admin de `yolo-rs` et `aphrody-labs`), API crates.io, registre npm, XML-RPC PyPI, API Cloudflare, `gcloud` (configuration `owner-yohan`), API Vercel et Hostinger. Ordre du propriétaire : migrer yolo-rs sur aphrody-labs, dédupliquer yolo-rs, labs et aphrody-dev, tout fusionner, puis faire de même sur les registres et les clouds.

Règles appliquées : aucun dépôt supprimé (archivage seulement), aucun yank, aucune dépublication ; un doublon n'est archivé qu'après une preuve que la copie gardée contient toute sa branche par défaut (`compare` GitHub ou `rev-list` local).

## Tableau avant / après

| Plate-forme | Avant | Après |
|---|---|---|
| GitHub `yolo-rs` | 77 dépôts (65 publics, 12 privés) | **0 dépôt** ; org gardée vide (nom réservé, redirections) |
| GitHub `aphrody-dev` | 79 dépôts, dont `src` | 29 dépôts, **tous archivés** (doublons de copies aphrody-labs) |
| GitHub `aphrody-labs` | 556 dépôts, 10 doublons internes `-N` | 687 dépôts (595 actifs, 92 archivés) ; seule org active |
| npm | `@yolo-rs/posix-bun` 0.1.2 (seul paquet du scope) ; `@aphrody/*` 681 paquets | inchangé : publication `@aphrody/posix-bun` et `npm deprecate` différés (auth npm E401) |
| crates.io | 370 crates, propriétaire unique `aphrody-dev` ; 95 citent des dépôts disparus | sources des 95 reprises dans deux dépôts ; équipe propriétaire différée (accès OAuth) |
| PyPI | 5 projets, propriétaire `aphrody-dev`, pas d'organisation | inchangé (aucun doublon) |
| Cloudflare | 1 compte, 5 zones, 15 Workers, 11 buckets R2, 5 tunnels | inchangé (plan ci-dessous, aucune ressource prouvée morte) |
| gcloud | 10 projets, 9 comptes de service dans `aphrody`, 524 API activées | inchangé (plan ci-dessous) |
| Vercel, Hostinger | 1 équipe Vercel (3 projets rg-*) ; Hostinger 1 VPS KVM 8, 1 domaine .tech | inchangé (aucun doublon) |

## GitHub

### Preuves de doublon

Comparaison de la branche par défaut (`repos/<garde>/compare/<b>...<autre>:<b>`) ; `identical` ou `behind` = la copie gardée contient tout.

- Internes à aphrody-labs, tous `identical` : `skills-3`=`skills`, `skills-2`=`anthropic-skills`, `coreutils-3`=`coreutils`, `vcpkg-1`=`vcpkg`, `coreutils-2`=`uutils-coreutils`, `findutils-1`=`findutils`, `sed-1`=`sed`, `ai-1`=`ai`, `fx-1`=`fx`, `wterm-1`=`wterm`. **Archivés.**
- aphrody-dev contre aphrody-labs (même amont) : `identical` pour boringtun, claude-code, coreutils, edit, gemini-cli, gitoxide, gpui-kit, jj, litebox, lore, openvmm, russh, russh-sftp, sudo, taffy, tui-test, UnrealEngine (81 branches identiques), wasmtime, windows-drivers-rs, Windows-rust-driver-samples ; labs en avance pour agent-browser (8), agent-desktop (3), bun (8), codex (5), hyperlight (2), llvm-project (81), opentunnel (7), wild (2). Les autres branches des forks aphrody-dev sont celles de l'amont (copiées au fork) ; seule branche propre trouvée : `russh` `aphrody/sntrup761` (a9f6442, épinglée dans `src.lock.json`).
- Fusions faites avant archivage : `aphrody-labs/blitz` avancé en avance rapide sur `aphrody-dev/blitz` (2 commits, ec0cd28) ; `aphrody-labs/russh` main avancé sur `aphrody/sntrup761` (a9f6442, 2 commits). 27 copies aphrody-dev **archivées** avec la description « Archived duplicate: canonical copy is aphrody-labs/<nom> ».
- yolo-rs contre aphrody-labs : `agent-skills` identique ; `skills` (27), `wgpu` (13), `zed` (64), `mcp-rust-sdk`/`rust-sdk` (1), `mcp-typescript-sdk`/`typescript-sdk` (1) en retard sur labs ; `google-bun` 1 commit de retard (clone local).
- Dépôts non forks comparés par clone `--filter=blob:none` : `yolo-backend` (yolo-rs a 11 commits de plus, labs 0) : labs avancé en avance rapide sur b298397 ; `yolo-vps` (yolo-rs +9, privé ; labs public, 0 commit propre) ; `yolo-ui` (yolo-rs +14 sur la main du fork dioxus archivé de labs, 0 commit propre côté labs) ; `yolo` : historiques **sans ancêtre commun** (235 contre 221 commits) : deux projets distincts, aucun n'est archivé.
- `nsh` : forks d'amonts différents (`nuta/nsh` dans labs, `longbridge/nsh` dans aphrody-dev) ; `antigravity-sdk-python` : labs = SDK patché autonome (2 commits), aphrody-dev = fork amont (767 commits) : pas des doublons.

### Opérations

| Opération | Détail |
|---|---|
| Renommés puis archivés dans labs | `yolo-vps` -> `yolo-vps-dup-labs`, `yolo-ui` -> `yolo-ui-dup-labs` (libèrent le nom pour la copie la plus complète) |
| Transferts yolo-rs -> labs (77) | 68 sous le même nom ; `yolo` -> `yolo-rs` (projet distinct de `aphrody-labs/yolo`, resté privé) ; doublons archivés suffixés : `agent-skills`, `skills`, `wgpu`, `zed`, `google-bun`, `yolo-backend`, `mcp-rust-sdk`, `mcp-typescript-sdk` -> `<nom>-dup-yolo-rs` |
| Transferts aphrody-dev -> labs (50) | 47 sous le même nom (dont `dioxus`, `ring3-agent`, `rust-stack`, `bench`, `mesh-vn` privé, les anciens dépôts de paquets archivés) ; `nsh` -> `longbridge-nsh` ; `antigravity-sdk-python` -> `antigravity-sdk-python-upstream` ; `src` -> `aphrody-labs/src` |
| Redirections | vérifiées après transfert : 301 vers aphrody-labs pour les 65 publics (`curl -I`), API authentifiée pour les 12 privés, `git ls-remote` par l'ancienne URL |
| `aphrody-labs/src` | transfert fait après le feu vert de la coordination (labs-1b) ; secrets Actions conservés (6), runner `fr1` de niveau dépôt conservé (hors ligne avant comme après) ; premier push 7448e98..2841d30 accepté, workflows déclenchés sur aphrody-labs/src (`ci-revert` success ; `ci` attend le runner fr1 hors ligne, `images` échoue sur `/third_party/patches` absent, échec déjà présent à 02:21 avant le transfert) |
| Remotes | PC `C:\src` : `origin`, `all` -> aphrody-labs/src (gitlab et Google Source inchangés) ; 26 remotes de `third_party/*` et `crates/{bench,ring3-agent,rust-stack}` repointés ; prd `/home/agent/agents/src` : délégué à labs-1b ; `/root/src`, fr1, fr2 : rien à faire (labs-1b) |
| Dépôt | commits 9a6ad3d (pins `src.lock.json`, `DEPS`, miroir steam-depot) et 7448e98 (URLs `aphrody-dev/src` dans Cargo.toml, package.json, deploy.toml `[auth.github]`, bake, justfile, tools.toml, MAINTAINERS) |
| Org yolo-rs | vide ; **gardée**, non supprimée : la supprimer libérerait le nom et casserait les redirections si quelqu'un le reprenait |

Différé : `aphrody-dev` garde 29 dépôts archivés (doublons prouvés) : rien à transférer, les noms existent déjà dans labs.

## npm

- `@yolo-rs` contient un seul paquet, `@yolo-rs/posix-bun` 0.1.2 (mainteneur `yohan971`, dépôt `yolo-rs/yolo-zig`). `@aphrody/posix-bun` n'existe pas (E404).
- Préparé : `var/identity/aphrody-posix-bun-0.1.2.tgz`, archive publiée réempaquetée avec `name` `@aphrody/posix-bun` et `repository` `aphrody-labs/yolo-zig`.
- **Différé, clic du propriétaire** : `npm login --auth-type=web` a ouvert la page de connexion npm puis a échoué sans terminal (jeton E401). Après connexion : `npm publish var/identity/aphrody-posix-bun-0.1.2.tgz --access public`, puis `npm deprecate @yolo-rs/posix-bun "Renamed to @aphrody/posix-bun"`.

## crates.io

- 370 crates, toutes au seul utilisateur `aphrody-dev` (id 440521) ; aucune équipe. Équipe GitHub disponible : `aphrody-labs/aphrody`.
- `PUT /api/v1/crates/<crate>/owners` `github:aphrody-labs:aphrody` refusé : « could not find the github team ». Cause : l'application OAuth crates.io n'a pas accès à l'org. **Différé, clic du propriétaire** : approuver crates.io dans https://github.com/organizations/aphrody-labs/settings/oauth_application_policy (page ouverte dans Chrome), puis `bun run packages/env-kit/src/cli.ts secret exec CARGO_REGISTRY_TOKEN -- sh var/identity/owner.sh $(cat var/identity/crates.txt)` (370 crates ; journal des opérations : `var/identity/ops.log`). `aphrody-dev` reste propriétaire utilisateur : une équipe ne peut pas gérer les propriétaires.
- Les 95 crates qui citent des dépôts disparus : 63 `aphrody-labs/bun-distribution`, 16 `aphrody-labs/bun-os` (404 avant reprise), 16 `aphrody-labs/bun` (fork d'oven-sh/bun sans ces sources). 4 421 téléchargements cumulés, **58 ont des dépendants inverses**, aucune version yankée.
- Décision : **reprise des sources** pour les 95 (aucun yank : 58 sont des dépendances d'autres crates, aucune preuve de mort). Les archives `.crate` de la dernière version (static.crates.io) contiennent les sources complètes ; extraites et poussées dans `aphrody-labs/bun-distribution` (4f0dc89 : 63 crates + `crates-cited-aphrody-labs-bun/` pour les 16 qui citent le fork bun) et `aphrody-labs/bun-os` (8522911 : 16 crates). Les champs `repository` des 79 premières redeviennent valides sans republication ; les 16 qui citent `aphrody-labs/bun` attendent une version corrective dont `repository` vise `aphrody-labs/bun-distribution` (différé : publication).

## PyPI

XML-RPC `user_packages aphrody-dev` : `aphrody-cli`, `aphrody-embedding-fixtures`, `aphrody-meetings`, `aphrody-train` (0.1.0, 2026-10-09), `niepy` (0.2.1, 2026-10-03), rôle Owner `aphrody-dev` seul. Aucun projet sous un autre compte, pas d'organisation PyPI (`/org/aphrody`, `/org/aphrody-labs` : 404). Rien à fusionner ; une organisation PyPI demanderait une connexion et une demande d'org (différé, non indispensable).

## Cloudflare

Un seul compte visible (`ca22c1a5…`, contact@aphrody.com), donc pas de fusion de comptes.

- Zones : aphrody.app, aphrody.com, dragonballfr.com, rosegriffon.fr (actives), 3dland.tech (pending).
- Workers sans domaine ni route : `aphrody-com` (workers.dev, modifié le 2026-11-12), `downloads-portable` (workers.dev, 2026-11-12), `aphrody-email-worker` (Email Routing probable), `rosegriffon-maintenance` (page de maintenance de secours). Doublons apparents : `aphrody` (aphrody.com/*, www) contre `aphrody-com` ; `aphrody-app` (bun.aphrody.*) contre `aphrody-app-site` (aphrody.app, www).
- R2 : 11 buckets, tous en WEUR ; tunnels : 5, tous healthy.
- Décision : **aucune suppression ni bascule** : chaque candidat a été modifié dans les 7 derniers jours ou sert de secours. Plan : 1) relever 7 jours d'analytics Workers (`workersInvocationsAdaptive`) pour `aphrody-com` et `downloads-portable` ; 2) à zéro requête, retirer d'abord la route workers.dev, attendre 7 jours, puis supprimer ; 3) `3dland.tech` : finir l'activation ou retirer la zone (décision produit).

## gcloud

- Projets : aphrody (468000409790), rgfr-8927d (Rose Griffon, produit distinct : **non fusionné**), rpbey-483614, rpb-482d5, propane-tranquility-hmhkk, inagle, deux `studio-*` Firebase, gen-lang-client-0567398758, fc-ayoub.
- Comptes de service d'automatisation qui se recouvrent dans `aphrody` : `aphrody-bot` (1 clé), `bun-google-automation` (0 clé), `yolo-automation` (1 clé, configuration `sa-automation`). Dernières authentifications relevées entre le 2026-09-01 et le 2026-11-05 : aucun n'est prouvé mort.
- 524 API activées dans `aphrody`, 141 dans `rgfr-8927d`.
- Décision : nettoyage différé ; plan : désactiver (`gcloud iam service-accounts disable`, réversible) `bun-google-automation` après 30 jours sans authentification, puis fusionner les rôles de `yolo-automation` dans `aphrody-bot` ; API : désactiver seulement celles sans requête sur 30 jours (`serviceruntime.googleapis.com/api/request_count`).

## Autres

- Vercel : utilisateur et équipe `aphrody-dev`, projets `rg-api`, `rg-website`, `rg-discord` (2026-10-17), sans doublon ; migration déjà suivie dans `MIGRATION-VERCEL-CF.md`.
- Hostinger : VPS `srv2116886.hstgr.cloud` KVM 8 (prd), abonnement domaine .TECH ; sans doublon.
- GHCR : `images.yml` pousse vers `ghcr.io/${{ github.repository_owner }}`, donc désormais `ghcr.io/aphrody-labs/*` ; le cache partagé `ghcr.io/aphrody-labs/cache:rust` n'existe pas encore (premier build). Les hôtes qui tirent `ghcr.io/aphrody-dev/*` gardent les anciennes images ; bascule à faire avec la prochaine publication réussie. Inventaire des paquets impossible : le jeton `gh` n'a pas `read:packages` (`gh auth refresh -s read:packages`, clic du propriétaire).
- OVH, Docker Hub : aucun dépôt Docker Hub référencé dans src ; OVH hors du périmètre des doublons (hôtes décrits dans `FLEET.md`).

## Reste au propriétaire

1. npm : connexion web, puis publication de `@aphrody/posix-bun` et dépréciation de `@yolo-rs/posix-bun` (commandes ci-dessus).
2. GitHub : approuver l'application OAuth crates.io pour aphrody-labs, puis ajout de l'équipe `github:aphrody-labs:aphrody` aux 370 crates.
3. `gh auth refresh -s read:packages` pour l'inventaire GHCR.
